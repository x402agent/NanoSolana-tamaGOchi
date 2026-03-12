/**
 * Nano Solana — Trading Engine
 *
 * OODA-loop trading pipeline:
 *   Observe → Orient → Decide → Act
 *
 * Integrates:
 *   - Helius RPC for chain data
 *   - Birdeye for token analytics and price feeds
 *   - Jupiter for swap execution
 *
 * All trades are logged to memory for learning.
 */

import { Connection, Keypair, PublicKey, VersionedTransaction, TransactionMessage } from "@solana/web3.js";
import { EventEmitter } from "eventemitter3";
import type { NanoConfig } from "../config/vault.js";
import type { NanoWallet } from "../wallet/manager.js";

// ── Types ────────────────────────────────────────────────────

export interface TokenPrice {
  mint: string;
  symbol: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  timestamp: number;
}

export interface TradeSignal {
  id: string;
  type: "buy" | "sell" | "hold";
  confidence: number; // 0-1
  mint: string;
  symbol: string;
  reasoning: string;
  timestamp: number;
  source: "birdeye" | "helius" | "ai" | "memory";
}

export interface TradeExecution {
  id: string;
  signalId: string;
  type: "buy" | "sell";
  inputMint: string;
  outputMint: string;
  inputAmount: number;
  outputAmount: number;
  slippageBps: number;
  txSignature: string;
  timestamp: number;
  status: "pending" | "confirmed" | "failed";
  error?: string;
}

export interface TradeOutcome {
  executionId: string;
  pnl: number;
  pnlPercent: number;
  holdDurationMs: number;
  exitReason: string;
}

export interface TradingEngineEvents {
  signal: (signal: TradeSignal) => void;
  execution: (execution: TradeExecution) => void;
  outcome: (outcome: TradeOutcome) => void;
  priceUpdate: (price: TokenPrice) => void;
  error: (err: Error) => void;
}

export interface ManualTradeInput {
  type: "buy" | "sell" | "hold";
  mint: string;
  symbol?: string;
  confidence?: number;
  reasoning?: string;
}

// ── Constants ────────────────────────────────────────────────

const SOL_MINT = "So11111111111111111111111111111111111111112";
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

const JUPITER_QUOTE_API = "https://api.jup.ag/ultra/v1/order";
const JUPITER_SWAP_API = "https://api.jup.ag/ultra/v1/execute";
const BIRDEYE_API_BASE = "https://public-api.birdeye.so";

// ── Birdeye Client ────────────────────────────────────────────

export class BirdeyeClient {
  constructor(
    private apiKey: string,
    private wssUrl: string,
  ) {}

  async getTokenPrice(mint: string): Promise<TokenPrice | null> {
    try {
      const res = await fetch(`${BIRDEYE_API_BASE}/defi/price?address=${mint}`, {
        headers: {
          "X-API-KEY": this.apiKey,
          Accept: "application/json",
        },
      });
      if (!res.ok) return null;
      const data = (await res.json()) as any;
      return {
        mint,
        symbol: data.data?.symbol ?? "UNKNOWN",
        price: data.data?.value ?? 0,
        priceChange24h: data.data?.priceChange24h ?? 0,
        volume24h: data.data?.volume24h ?? 0,
        liquidity: data.data?.liquidity ?? 0,
        timestamp: Date.now(),
      };
    } catch {
      return null;
    }
  }

  async getTokenSecurity(mint: string): Promise<Record<string, unknown> | null> {
    try {
      const res = await fetch(
        `${BIRDEYE_API_BASE}/defi/token_security?address=${mint}`,
        {
          headers: {
            "X-API-KEY": this.apiKey,
            Accept: "application/json",
          },
        },
      );
      if (!res.ok) return null;
      const data = (await res.json()) as any;
      return data.data ?? null;
    } catch {
      return null;
    }
  }

  async getTrendingTokens(limit = 20): Promise<TokenPrice[]> {
    try {
      const res = await fetch(
        `${BIRDEYE_API_BASE}/defi/token_trending?sort_by=volume24hUSD&sort_type=desc&limit=${limit}`,
        {
          headers: {
            "X-API-KEY": this.apiKey,
            Accept: "application/json",
          },
        },
      );
      if (!res.ok) return [];
      const data = (await res.json()) as any;
      return (data.data?.tokens ?? []).map((t: any) => ({
        mint: t.address,
        symbol: t.symbol ?? "UNKNOWN",
        price: t.price ?? 0,
        priceChange24h: t.priceChange24h ?? 0,
        volume24h: t.volume24hUSD ?? 0,
        liquidity: t.liquidity ?? 0,
        timestamp: Date.now(),
      }));
    } catch {
      return [];
    }
  }
}

// ── Helius Client ────────────────────────────────────────────

export class HeliusClient {
  private connection: Connection;

  constructor(
    private rpcUrl: string,
    private apiKey: string,
    private wssUrl: string,
  ) {
    this.connection = new Connection(rpcUrl, {
      commitment: "confirmed",
      wsEndpoint: wssUrl || undefined,
    });
  }

  async getAssetsByOwner(owner: string): Promise<any[]> {
    try {
      const res = await fetch(this.rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "nano-assets",
          method: "getAssetsByOwner",
          params: {
            ownerAddress: owner,
            page: 1,
            limit: 100,
          },
        }),
      });
      const data = (await res.json()) as any;
      return data.result?.items ?? [];
    } catch {
      return [];
    }
  }

  async getTokenBalances(owner: string): Promise<Array<{ mint: string; amount: number }>> {
    try {
      const accounts = await this.connection.getTokenAccountsByOwner(
        new PublicKey(owner),
        { programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") },
      );

      return accounts.value.map((acc) => {
        const data = acc.account.data;
        // Parse SPL token account data
        const mint = new PublicKey(data.slice(0, 32)).toBase58();
        const amount = Number(data.readBigUInt64LE(64)) / 1e9; // Rough decimals
        return { mint, amount };
      });
    } catch {
      return [];
    }
  }

  getConnection(): Connection {
    return this.connection;
  }
}

// ── Jupiter Swap Client ────────────────────────────────────────

export class JupiterClient {
  constructor(private apiKey: string) {}

  async getQuote(params: {
    inputMint: string;
    outputMint: string;
    amount: number;
    slippageBps?: number;
  }): Promise<any | null> {
    try {
      const res = await fetch(JUPITER_QUOTE_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify({
          inputMint: params.inputMint,
          outputMint: params.outputMint,
          amount: params.amount,
          slippageBps: params.slippageBps ?? 50,
        }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  async executeSwap(params: {
    signedTransaction: string;
    requestId: string;
  }): Promise<string | null> {
    try {
      const res = await fetch(JUPITER_SWAP_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify({
          signedTransaction: params.signedTransaction,
          requestId: params.requestId,
        }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as any;
      return data.signature ?? null;
    } catch {
      return null;
    }
  }
}

// ── Trading Engine ────────────────────────────────────────────

export class TradingEngine extends EventEmitter<TradingEngineEvents> {
  private birdeye: BirdeyeClient;
  private helius: HeliusClient;
  private jupiter: JupiterClient;
  private signals: TradeSignal[] = [];
  private executions: TradeExecution[] = [];
  private isRunning = false;
  private loopTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private config: NanoConfig,
    private wallet: NanoWallet,
  ) {
    super();
    this.birdeye = new BirdeyeClient(config.birdeye.apiKey, config.birdeye.wssUrl);
    this.helius = new HeliusClient(config.helius.rpcUrl, config.helius.apiKey, config.helius.wssUrl);
    this.jupiter = new JupiterClient(config.jupiter.apiKey);
  }

  /**
   * Start the OODA trading loop.
   */
  async start(intervalMs = 30000): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    // Initial observation
    await this.observe();

    // Periodic loop
    this.loopTimer = setInterval(async () => {
      try {
        await this.oodaLoop();
      } catch (err) {
        this.emit("error", err as Error);
      }
    }, intervalMs);
  }

  /**
   * Stop the trading loop.
   */
  stop(): void {
    this.isRunning = false;
    if (this.loopTimer) {
      clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
  }

  /**
   * Full OODA loop iteration.
   */
  private async oodaLoop(): Promise<void> {
    // OBSERVE — gather market data
    const marketData = await this.observe();

    // ORIENT — analyze and contextualize
    const analysis = await this.orient(marketData);

    // DECIDE — generate trade signals
    const signals = this.decide(analysis);

    // ACT — execute on high-confidence signals
    for (const signal of signals) {
      if (signal.confidence >= 0.7 && signal.type !== "hold") {
        await this.act(signal);
      }
    }
  }

  /**
   * OBSERVE phase — gather raw market data.
   */
  private async observe(): Promise<{
    trending: TokenPrice[];
    portfolio: Array<{ mint: string; amount: number }>;
    solBalance: number;
  }> {
    const [trending, portfolio] = await Promise.all([
      this.birdeye.getTrendingTokens(10),
      this.helius.getTokenBalances(this.wallet.getPublicKey()),
    ]);

    const walletInfo = this.wallet.getInfo();

    // Emit price updates
    for (const token of trending) {
      this.emit("priceUpdate", token);
    }

    return {
      trending,
      portfolio,
      solBalance: walletInfo.balance,
    };
  }

  /**
   * ORIENT phase — analyze market context.
   */
  private async orient(data: {
    trending: TokenPrice[];
    portfolio: Array<{ mint: string; amount: number }>;
    solBalance: number;
  }): Promise<{
    highVolume: TokenPrice[];
    risingTokens: TokenPrice[];
    fallingTokens: TokenPrice[];
    portfolioValue: number;
  }> {
    const highVolume = data.trending.filter((t) => t.volume24h > 100000);
    const risingTokens = data.trending.filter((t) => t.priceChange24h > 5);
    const fallingTokens = data.trending.filter((t) => t.priceChange24h < -5);

    return {
      highVolume,
      risingTokens,
      fallingTokens,
      portfolioValue: data.solBalance,
    };
  }

  /**
   * DECIDE phase — generate trade signals based on analysis.
   */
  private decide(analysis: {
    highVolume: TokenPrice[];
    risingTokens: TokenPrice[];
    fallingTokens: TokenPrice[];
    portfolioValue: number;
  }): TradeSignal[] {
    const signals: TradeSignal[] = [];

    // Simple momentum strategy (to be enhanced with AI reasoning)
    for (const token of analysis.risingTokens) {
      if (token.priceChange24h > 10 && token.volume24h > 500000) {
        signals.push({
          id: `sig-${Date.now()}-${token.mint.slice(0, 8)}`,
          type: "buy",
          confidence: Math.min(0.9, token.priceChange24h / 100 + 0.3),
          mint: token.mint,
          symbol: token.symbol,
          reasoning: `High momentum: +${token.priceChange24h.toFixed(1)}% with $${(token.volume24h / 1000).toFixed(0)}K volume`,
          timestamp: Date.now(),
          source: "birdeye",
        });
      }
    }

    for (const signal of signals) {
      this.signals.push(signal);
      this.emit("signal", signal);
    }

    return signals;
  }

  /**
   * ACT phase — execute a trade based on a signal.
   */
  private async act(signal: TradeSignal): Promise<TradeExecution | null> {
    try {
      const inputMint = signal.type === "buy" ? SOL_MINT : signal.mint;
      const outputMint = signal.type === "buy" ? signal.mint : SOL_MINT;

      // Get quote from Jupiter
      const quote = await this.jupiter.getQuote({
        inputMint,
        outputMint,
        amount: signal.type === "buy"
          ? Math.floor(0.01 * 1e9) // 0.01 SOL per trade (conservative)
          : Math.floor(0.5 * 1e9), // Sell half position
        slippageBps: 100,
      });

      if (!quote) {
        return null;
      }

      const execution: TradeExecution = {
        id: `exec-${Date.now()}`,
        signalId: signal.id,
        type: signal.type as "buy" | "sell",
        inputMint,
        outputMint,
        inputAmount: 0.01,
        outputAmount: 0,
        slippageBps: 100,
        txSignature: "",
        timestamp: Date.now(),
        status: "pending",
      };

      this.executions.push(execution);
      this.emit("execution", execution);

      return execution;
    } catch (err) {
      this.emit("error", err as Error);
      return null;
    }
  }

  /**
   * Get all signals.
   */
  getSignals(): TradeSignal[] {
    return [...this.signals];
  }

  /**
   * Get all executions.
   */
  getExecutions(): TradeExecution[] {
    return [...this.executions];
  }

  /**
   * Execute a manual trade request (for gateway/UI-driven actions).
   */
  async executeManualTrade(input: ManualTradeInput): Promise<{
    signal: TradeSignal;
    execution: TradeExecution | null;
  }> {
    const mint = String(input.mint || "").trim() || SOL_MINT;
    const symbol = String(input.symbol || "").trim() || `${mint.slice(0, 4)}...${mint.slice(-4)}`;
    const confidence = Number.isFinite(input.confidence)
      ? Math.min(1, Math.max(0, Number(input.confidence)))
      : 0.8;

    const signal: TradeSignal = {
      id: `manual-${Date.now()}-${mint.slice(0, 6)}`,
      type: input.type,
      confidence,
      mint,
      symbol,
      reasoning: String(input.reasoning || "Manual trade submitted from NanoSolana UI"),
      timestamp: Date.now(),
      source: "ai",
    };

    this.signals.push(signal);
    this.emit("signal", signal);

    if (signal.type === "hold") {
      return { signal, execution: null };
    }

    const execution = await this.act(signal);
    return { signal, execution };
  }

  /**
   * Get the birdeye client for direct access.
   */
  getBirdeye(): BirdeyeClient {
    return this.birdeye;
  }

  /**
   * Get the helius client for direct access.
   */
  getHelius(): HeliusClient {
    return this.helius;
  }
}
