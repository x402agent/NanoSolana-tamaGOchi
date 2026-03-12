/**
 * Nano Solana — Hub Bridge
 *
 * Connects the Nano Hub (web dashboard) to the core agent.
 * Provides real-time WebSocket feeds from:
 *   - Trading engine (signals, prices, executions)
 *   - Memory engine (lessons, stats)
 *   - Wallet (heartbeat, balance)
 *   - Network (connected nodes)
 *
 * Also exposes a REST API for the hub to query agent state.
 */

import { WebSocket } from "ws";
import { EventEmitter } from "eventemitter3";
import type { NanoConfig } from "../config/vault.js";
import type { NanoWallet, WalletInfo } from "../wallet/manager.js";
import type { TradingEngine, TokenPrice, TradeSignal } from "../trading/engine.js";
import type { MemoryEngine, Lesson } from "../memory/engine.js";

// ── Types ────────────────────────────────────────────────────

export interface HubUpdate {
  type: "wallet" | "trading" | "memory" | "network" | "system";
  event: string;
  data: unknown;
  timestamp: number;
}

export interface HubBridgeEvents {
  connected: () => void;
  disconnected: () => void;
  error: (err: Error) => void;
  updateSent: (update: HubUpdate) => void;
}

// ── Hub Bridge ────────────────────────────────────────────────

export class NanoHubBridge extends EventEmitter<HubBridgeEvents> {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setInterval> | null = null;
  private isConnected = false;

  constructor(
    private hubUrl: string,
    private hubApiKey: string | undefined,
    private wallet: NanoWallet,
    private trading: TradingEngine,
    private memory: MemoryEngine,
  ) {
    super();
  }

  /**
   * Connect to the Nano Hub WebSocket.
   */
  async connect(): Promise<void> {
    const wsUrl = this.hubUrl
      .replace("http://", "ws://")
      .replace("https://", "wss://") + "/ws/agent";

    try {
      this.ws = new WebSocket(wsUrl, {
        headers: {
          Authorization: this.hubApiKey ? `Bearer ${this.hubApiKey}` : "",
          "X-Agent-Id": this.wallet.getAgentId(),
          "X-Agent-PublicKey": this.wallet.getPublicKey(),
        },
      });

      this.ws.on("open", () => {
        this.isConnected = true;
        this.emit("connected");
        this.wireUpEvents();
      });

      this.ws.on("close", () => {
        this.isConnected = false;
        this.emit("disconnected");
        this.scheduleReconnect();
      });

      this.ws.on("error", (err) => {
        this.emit("error", err);
      });
    } catch (err) {
      this.emit("error", err as Error);
      this.scheduleReconnect();
    }
  }

  /**
   * Wire up event listeners from core engines to the hub.
   */
  private wireUpEvents(): void {
    // Wallet events
    this.wallet.on("heartbeat", (info: WalletInfo) => {
      this.sendUpdate({
        type: "wallet",
        event: "heartbeat",
        data: info,
        timestamp: Date.now(),
      });
    });

    this.wallet.on("balanceChange", (data) => {
      this.sendUpdate({
        type: "wallet",
        event: "balanceChange",
        data,
        timestamp: Date.now(),
      });
    });

    // Trading events
    this.trading.on("signal", (signal: TradeSignal) => {
      this.sendUpdate({
        type: "trading",
        event: "signal",
        data: signal,
        timestamp: Date.now(),
      });
    });

    this.trading.on("priceUpdate", (price: TokenPrice) => {
      this.sendUpdate({
        type: "trading",
        event: "priceUpdate",
        data: price,
        timestamp: Date.now(),
      });
    });

    this.trading.on("execution", (exec) => {
      this.sendUpdate({
        type: "trading",
        event: "execution",
        data: exec,
        timestamp: Date.now(),
      });
    });

    // Memory events
    this.memory.on("lessonLearned", (lesson: Lesson) => {
      this.sendUpdate({
        type: "memory",
        event: "lesson",
        data: lesson,
        timestamp: Date.now(),
      });
    });

    this.memory.on("memoryReinforced", (id: string, confidence: number) => {
      this.sendUpdate({
        type: "memory",
        event: "reinforced",
        data: { id, confidence },
        timestamp: Date.now(),
      });
    });
  }

  /**
   * Send an update to the hub.
   */
  private sendUpdate(update: HubUpdate): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    try {
      this.ws.send(JSON.stringify(update));
      this.emit("updateSent", update);
    } catch {
      // Silent fail
    }
  }

  /**
   * Schedule a reconnection attempt.
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      await this.connect();
    }, 5000);
  }

  /**
   * Disconnect from the hub.
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close(1000, "Agent disconnecting");
      this.ws = null;
    }
    this.isConnected = false;
  }

  /**
   * Check if connected to the hub.
   */
  getIsConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Get a full status snapshot for the hub.
   */
  getStatusSnapshot(): Record<string, unknown> {
    return {
      agent: {
        id: this.wallet.getAgentId(),
        name: this.wallet.getInfo().agentName,
        publicKey: this.wallet.getPublicKey(),
      },
      wallet: this.wallet.getInfo(),
      memory: this.memory.getStats(),
      trading: {
        recentSignals: this.trading.getSignals().slice(-10),
        recentExecutions: this.trading.getExecutions().slice(-10),
      },
      lessons: this.memory.getLessons().slice(-10),
      timestamp: Date.now(),
    };
  }
}
