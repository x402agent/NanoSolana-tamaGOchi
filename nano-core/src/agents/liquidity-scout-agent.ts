/**
 * NanoSolana — Liquidity Scout Agent
 *
 * Monitors bonding curve and AMM pool liquidity depth.
 * Identifies tokens with healthy vs thin liquidity.
 *
 * Strategy:
 *   1. Track real SOL reserves across bonding curves
 *   2. Flag low-liquidity tokens (high slippage risk)
 *   3. Track post-graduation AMM pool depth
 *   4. Score tokens by liquidity quality
 *   5. Warn the swarm about liquidity risks
 */

import { BaseAgent } from "./base-agent.js";
import type { AgentRole, SwarmEvent } from "../swarm/orchestrator.js";

// ── Config ────────────────────────────────────────────────────

interface LiquidityScoutParams {
  /** Minimum SOL reserves for "healthy" liquidity (lamports) */
  healthyLiquidityLamports: number;
  /** Warning threshold (lamports) */
  warningLiquidityLamports: number;
  /** Max tokens to track */
  maxTracked: number;
}

const DEFAULT_PARAMS: LiquidityScoutParams = {
  healthyLiquidityLamports: 5_000_000_000,  // 5 SOL
  warningLiquidityLamports: 1_000_000_000,   // 1 SOL
  maxTracked: 200,
};

interface LiquiditySnapshot {
  mint: string;
  realSolReserves: number;
  virtualSolReserves: number;
  progressBps: number;
  isGraduated: boolean;
  score: number; // 0-100
  lastCheckedAt: number;
  history: Array<{ reserves: number; timestamp: number }>;
}

// ── Agent ────────────────────────────────────────────────────

export class LiquidityScoutAgent extends BaseAgent {
  readonly role: AgentRole = "liquidity-scout";
  readonly name = "Liquidity Scout";
  readonly description = "Monitors bonding curve and AMM liquidity depth, flags thin markets";

  private params: LiquidityScoutParams;
  private snapshots = new Map<string, LiquiditySnapshot>();

  constructor(id = "liquidity-scout-01", params: Partial<LiquidityScoutParams> = {}) {
    super(id, { intervalMs: 30_000 });
    this.params = { ...DEFAULT_PARAMS, ...params };
  }

  protected async onInit(): Promise<void> {
    this.log("info", `Liquidity scout active: healthy=${(this.params.healthyLiquidityLamports / 1e9).toFixed(1)} SOL`);
  }

  protected async onTick(): Promise<void> {
    if (!this.ctx) return;

    for (const [mint, snapshot] of this.snapshots) {
      if (Date.now() - snapshot.lastCheckedAt < 20_000) continue;

      const info = await this.ctx.pump.getTokenInfo(mint);
      if (!info) continue;

      const realSol = Number(info.realSolReserves);
      const virtualSol = Number(info.virtualSolReserves);

      // Update snapshot
      snapshot.realSolReserves = realSol;
      snapshot.virtualSolReserves = virtualSol;
      snapshot.progressBps = info.progressBps;
      snapshot.isGraduated = info.isGraduated;
      snapshot.lastCheckedAt = Date.now();

      // Track history for trend
      snapshot.history.push({ reserves: realSol, timestamp: Date.now() });
      if (snapshot.history.length > 20) {
        snapshot.history = snapshot.history.slice(-20);
      }

      // Score liquidity
      snapshot.score = this.scoreLiquidity(realSol, virtualSol, info.progressBps);

      // Alert on low liquidity
      if (realSol < this.params.warningLiquidityLamports && !info.isGraduated) {
        this.emit("alert:risk", {
          agent: this.id,
          type: "low-liquidity",
          mint,
          realSolReserves: realSol,
          score: snapshot.score,
          message: `Low liquidity: ${(realSol / 1e9).toFixed(4)} SOL reserves`,
        }, 7);
      }

      // Detect liquidity drain (reserves dropping fast)
      if (snapshot.history.length >= 3) {
        const recent = snapshot.history.slice(-3);
        const drain = recent[0]!.reserves - recent[recent.length - 1]!.reserves;
        if (drain > this.params.warningLiquidityLamports * 0.5) {
          this.emit("alert:risk", {
            agent: this.id,
            type: "liquidity-drain",
            mint,
            drainAmount: drain,
            message: `Liquidity draining: -${(drain / 1e9).toFixed(4)} SOL in recent checks`,
          }, 8);
        }
      }
    }

    // Prune old entries
    if (this.snapshots.size > this.params.maxTracked) {
      const sorted = [...this.snapshots.entries()]
        .sort((a, b) => a[1].lastCheckedAt - b[1].lastCheckedAt);
      for (const [mint] of sorted.slice(0, sorted.length - this.params.maxTracked)) {
        this.snapshots.delete(mint);
      }
    }
  }

  protected async onEvent(event: SwarmEvent): Promise<void> {
    // Track any token that enters the swarm's radar
    if (event.type === "trade:signal" || event.type === "token:new-launch" || event.type === "token:graduation") {
      const data = event.data as { mint?: string };
      if (data.mint && !this.snapshots.has(data.mint)) {
        this.snapshots.set(data.mint, {
          mint: data.mint,
          realSolReserves: 0,
          virtualSolReserves: 0,
          progressBps: 0,
          isGraduated: false,
          score: 0,
          lastCheckedAt: 0,
          history: [],
        });
      }
    }
  }

  protected async onDestroy(): Promise<void> {
    this.snapshots.clear();
  }

  /**
   * Get liquidity report for a token.
   */
  getLiquidityReport(mint: string): LiquiditySnapshot | null {
    return this.snapshots.get(mint) ?? null;
  }

  /**
   * Get all monitored tokens sorted by liquidity score.
   */
  getRankedTokens(): Array<{ mint: string; score: number; reserves: number }> {
    return [...this.snapshots.values()]
      .filter((s) => s.lastCheckedAt > 0)
      .map((s) => ({ mint: s.mint, score: s.score, reserves: s.realSolReserves }))
      .sort((a, b) => b.score - a.score);
  }

  // ── Private ────────────────────────────────────────────────

  private scoreLiquidity(realSol: number, virtualSol: number, progressBps: number): number {
    let score = 0;

    // Real SOL reserves scoring
    if (realSol >= this.params.healthyLiquidityLamports) {
      score += 40;
    } else if (realSol >= this.params.warningLiquidityLamports) {
      score += 20;
    }

    // Virtual reserves add to depth
    if (virtualSol > 0) {
      score += Math.min(30, (virtualSol / (10 * 1e9)) * 30);
    }

    // Earlier progress = more upside potential
    if (progressBps < 3000) score += 20;
    else if (progressBps < 6000) score += 10;

    // Graduated tokens get a slight bonus (AMM liquidity)
    if (progressBps >= 10000) score += 10;

    return Math.min(100, score);
  }
}
