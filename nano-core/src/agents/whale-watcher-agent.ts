/**
 * NanoSolana — Whale Watcher Agent
 *
 * Monitors bonding curves for large buy/sell transactions.
 * Detects whale accumulation and distribution patterns.
 *
 * Strategy:
 *   1. Track tokens with high recent volume
 *   2. Flag large single buys (> threshold SOL)
 *   3. Detect accumulation (multiple buys from same wallet)
 *   4. Alert on large sells (potential dump)
 *   5. Cross-reference with graduation progress
 */

import { BaseAgent } from "./base-agent.js";
import type { AgentRole, SwarmEvent } from "../swarm/orchestrator.js";

// ── Config ────────────────────────────────────────────────────

interface WhaleWatcherParams {
  /** SOL threshold for whale classification (lamports) */
  whaleThresholdLamports: number;
  /** Number of recent tokens to track */
  trackingSlots: number;
  /** Alert on sells above this SOL value */
  sellAlertLamports: number;
}

const DEFAULT_PARAMS: WhaleWatcherParams = {
  whaleThresholdLamports: 5_000_000_000, // 5 SOL
  trackingSlots: 50,
  sellAlertLamports: 10_000_000_000, // 10 SOL
};

interface TrackedToken {
  mint: string;
  firstSeenAt: number;
  lastCheckedAt: number;
  whaleEvents: Array<{
    type: "buy" | "sell";
    solAmount: number;
    timestamp: number;
  }>;
}

// ── Agent ────────────────────────────────────────────────────

export class WhaleWatcherAgent extends BaseAgent {
  readonly role: AgentRole = "whale-watcher";
  readonly name = "Whale Watcher";
  readonly description = "Monitors pump.fun for large buy/sell transactions and accumulation patterns";

  private params: WhaleWatcherParams;
  private tracked = new Map<string, TrackedToken>();

  constructor(id = "whale-watcher-01", params: Partial<WhaleWatcherParams> = {}) {
    super(id, { intervalMs: 15_000 });
    this.params = { ...DEFAULT_PARAMS, ...params };
  }

  protected async onInit(): Promise<void> {
    this.log("info", `Whale watcher active: threshold ${(this.params.whaleThresholdLamports / 1e9).toFixed(1)} SOL`);
  }

  protected async onTick(): Promise<void> {
    if (!this.ctx) return;

    // Check tracked tokens for state changes
    for (const [mint, token] of this.tracked) {
      if (Date.now() - token.lastCheckedAt < 30_000) continue; // Rate limit

      const info = await this.ctx.pump.getTokenInfo(mint);
      if (!info) continue;

      token.lastCheckedAt = Date.now();

      // Check for graduation
      if (info.isGraduated) {
        this.emit("token:graduation", {
          agent: this.id,
          mint,
          marketCapSol: info.marketCapSol,
          whaleEvents: token.whaleEvents.length,
        }, 7);

        this.ctx.memory.storeKnown(
          `Token graduated: ${mint.slice(0, 8)}... (${info.marketCapSol.toFixed(2)} SOL mcap, ${token.whaleEvents.length} whale events)`,
          ["graduation", mint, "whale-data"],
          this.id,
          8,
        );

        this.tracked.delete(mint);
        continue;
      }

      // Check sol reserves change as proxy for large trades
      const solReserves = Number(info.realSolReserves);
      // Store observation for trend analysis
      this.ctx.memory.storeKnown(
        `Reserves: ${mint.slice(0, 8)}... sol=${(solReserves / 1e9).toFixed(4)}, progress=${(info.progressBps / 100).toFixed(1)}%`,
        ["reserves", mint],
        this.id,
        3,
      );
    }

    // Prune old tracked tokens
    if (this.tracked.size > this.params.trackingSlots) {
      const sorted = [...this.tracked.entries()]
        .sort((a, b) => a[1].firstSeenAt - b[1].firstSeenAt);
      const toRemove = sorted.slice(0, sorted.length - this.params.trackingSlots);
      for (const [mint] of toRemove) {
        this.tracked.delete(mint);
      }
    }
  }

  protected async onEvent(event: SwarmEvent): Promise<void> {
    // Track tokens that other agents find interesting
    if (event.type === "trade:signal" || event.type === "token:new-launch") {
      const data = event.data as { mint?: string };
      if (data.mint && !this.tracked.has(data.mint)) {
        this.tracked.set(data.mint, {
          mint: data.mint,
          firstSeenAt: Date.now(),
          lastCheckedAt: 0,
          whaleEvents: [],
        });
      }
    }

    // React to whale alerts from other sources
    if (event.type === "token:whale-buy" || event.type === "token:whale-sell") {
      const data = event.data as { mint: string; solAmount: number };
      const token = this.tracked.get(data.mint);
      if (token) {
        token.whaleEvents.push({
          type: event.type === "token:whale-buy" ? "buy" : "sell",
          solAmount: data.solAmount,
          timestamp: Date.now(),
        });

        // Check for accumulation pattern (3+ buys in short window)
        const recentBuys = token.whaleEvents
          .filter((e) => e.type === "buy" && Date.now() - e.timestamp < 300_000);
        if (recentBuys.length >= 3) {
          this.emit("alert:opportunity", {
            agent: this.id,
            type: "whale-accumulation",
            mint: data.mint,
            buyCount: recentBuys.length,
            totalSol: recentBuys.reduce((s, e) => s + e.solAmount, 0),
          }, 8);
        }
      }
    }
  }

  protected async onDestroy(): Promise<void> {
    this.tracked.clear();
  }
}
