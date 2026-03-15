/**
 * NanoSolana — Sniper Agent
 *
 * Monitors new token launches on pump.fun and evaluates them
 * for early entry opportunities. Uses the bonding curve math
 * to calculate optimal entry size and slippage.
 *
 * Strategy:
 *   1. Watch for new CreateEvent on pump program
 *   2. Filter by creator reputation, metadata quality
 *   3. Calculate bonding curve position (early = better)
 *   4. Enter with small position if criteria met
 *   5. Set auto-exit at target market cap or loss threshold
 */

import { BaseAgent } from "./base-agent.js";
import type { AgentRole, SwarmEvent } from "../swarm/orchestrator.js";
import { calculateBuyTokens, calculateGraduationProgress } from "../pump/client.js";
import BN from "bn.js";

// ── Config ────────────────────────────────────────────────────

interface SniperParams {
  /** Maximum SOL per snipe (lamports) */
  maxSnipeSol: number;
  /** Minimum market cap for entry (lamports) */
  minMarketCap: number;
  /** Maximum market cap for entry (lamports) */
  maxMarketCap: number;
  /** Maximum graduation progress for entry (bps, 0-10000) */
  maxProgressBps: number;
  /** Minimum price impact threshold (bps) to skip */
  maxPriceImpactBps: number;
  /** Target profit in basis points */
  takeProfitBps: number;
  /** Stop loss in basis points */
  stopLossBps: number;
  /** Cooldown between snipes (ms) */
  cooldownMs: number;
}

const DEFAULT_SNIPER_PARAMS: SniperParams = {
  maxSnipeSol: 50_000_000,     // 0.05 SOL
  minMarketCap: 1_000_000_000, // 1 SOL
  maxMarketCap: 50_000_000_000, // 50 SOL
  maxProgressBps: 2000,         // 20% graduated
  maxPriceImpactBps: 500,       // 5%
  takeProfitBps: 5000,          // 50%
  stopLossBps: 2000,            // 20%
  cooldownMs: 30_000,           // 30s cooldown
};

// ── Agent ────────────────────────────────────────────────────

export class SniperAgent extends BaseAgent {
  readonly role: AgentRole = "sniper";
  readonly name = "Sniper";
  readonly description = "Monitors new pump.fun token launches for early entry opportunities";

  private params: SniperParams;
  private lastSnipeAt = 0;
  private snipeCount = 0;
  private watchedMints = new Set<string>();

  constructor(id = "sniper-01", params: Partial<SniperParams> = {}) {
    super(id, { intervalMs: 5_000 });
    this.params = { ...DEFAULT_SNIPER_PARAMS, ...params };
  }

  protected async onInit(): Promise<void> {
    this.log("info", `Sniper initialized: max ${(this.params.maxSnipeSol / 1e9).toFixed(3)} SOL per snipe`);
  }

  protected async onTick(): Promise<void> {
    if (!this.ctx) return;

    // Cooldown check
    if (Date.now() - this.lastSnipeAt < this.params.cooldownMs) return;

    // Scan for recent launches
    const launches = await this.ctx.pump.scanRecentLaunches(5);

    for (const launch of launches) {
      if (!launch.mint || this.watchedMints.has(launch.mint)) continue;
      this.watchedMints.add(launch.mint);

      // Evaluate the token
      const score = await this.evaluate(launch.mint);
      if (score.shouldSnipe) {
        this.emit("trade:signal", {
          agent: this.id,
          type: "buy",
          mint: launch.mint,
          confidence: score.confidence,
          reasoning: score.reasoning,
          maxSol: this.params.maxSnipeSol,
        }, 8);

        this.lastSnipeAt = Date.now();
        this.snipeCount++;

        // Record in memory
        this.ctx.memory.storeKnown(
          `Sniper signal: ${launch.mint} (confidence: ${(score.confidence * 100).toFixed(0)}%)`,
          ["sniper", "signal", launch.mint],
          this.id,
          7,
        );

        this.log("info", `Snipe signal: ${launch.mint.slice(0, 8)}... (${(score.confidence * 100).toFixed(0)}%)`);
      }
    }

    // Cap the watched set to prevent memory growth
    if (this.watchedMints.size > 500) {
      const arr = [...this.watchedMints];
      this.watchedMints = new Set(arr.slice(-200));
    }
  }

  protected async onEvent(event: SwarmEvent): Promise<void> {
    if (event.type === "token:new-launch") {
      const data = event.data as { mint: string };
      if (data.mint && !this.watchedMints.has(data.mint)) {
        this.watchedMints.add(data.mint);
        const score = await this.evaluate(data.mint);
        if (score.shouldSnipe) {
          this.emit("trade:signal", {
            agent: this.id,
            type: "buy",
            mint: data.mint,
            confidence: score.confidence,
            reasoning: score.reasoning,
          }, 9); // High priority for event-driven snipes
        }
      }
    }
  }

  protected async onDestroy(): Promise<void> {
    this.watchedMints.clear();
  }

  // ── Evaluation ────────────────────────────────────────────

  private async evaluate(mint: string): Promise<{
    shouldSnipe: boolean;
    confidence: number;
    reasoning: string;
  }> {
    if (!this.ctx) return { shouldSnipe: false, confidence: 0, reasoning: "No context" };

    const info = await this.ctx.pump.getTokenInfo(mint);
    if (!info) return { shouldSnipe: false, confidence: 0, reasoning: "Token info unavailable" };

    const reasons: string[] = [];
    let score = 0;

    // Check if graduated (can't snipe AMM tokens)
    if (info.isGraduated) {
      return { shouldSnipe: false, confidence: 0, reasoning: "Already graduated to AMM" };
    }

    // Market cap check
    if (info.marketCapLamports < this.params.minMarketCap) {
      return { shouldSnipe: false, confidence: 0, reasoning: "Market cap too low" };
    }
    if (info.marketCapLamports > this.params.maxMarketCap) {
      return { shouldSnipe: false, confidence: 0, reasoning: "Market cap too high" };
    }
    score += 0.2;
    reasons.push(`Market cap: ${(info.marketCapSol).toFixed(2)} SOL`);

    // Graduation progress check
    if (info.progressBps > this.params.maxProgressBps) {
      return { shouldSnipe: false, confidence: 0, reasoning: `Too far graduated: ${info.progressBps / 100}%` };
    }
    if (info.progressBps < 500) {
      score += 0.3; // Very early = bonus
      reasons.push("Very early position (<5% graduated)");
    } else {
      score += 0.1;
      reasons.push(`${(info.progressBps / 100).toFixed(1)}% graduated`);
    }

    // Price impact check
    const buyQuote = await this.ctx.pump.getBuyQuote(mint, this.params.maxSnipeSol);
    if (buyQuote) {
      if (buyQuote.priceImpact.impactBps > this.params.maxPriceImpactBps) {
        return { shouldSnipe: false, confidence: 0, reasoning: `Price impact too high: ${buyQuote.priceImpact.impactBps / 100}%` };
      }
      score += 0.2;
      reasons.push(`Impact: ${(buyQuote.priceImpact.impactBps / 100).toFixed(1)}%`);
    }

    // Check memory for previous patterns on this creator
    const creatorLessons = this.ctx.memory.search(info.creator, 5, "learned");
    if (creatorLessons.length > 0) {
      const avgConfidence = creatorLessons.reduce((s, l) => s + l.confidence, 0) / creatorLessons.length;
      if (avgConfidence > 0.5) {
        score += 0.2;
        reasons.push(`Known creator with ${(avgConfidence * 100).toFixed(0)}% confidence`);
      }
    }

    const confidence = Math.min(1, score);
    return {
      shouldSnipe: confidence >= 0.5,
      confidence,
      reasoning: reasons.join("; "),
    };
  }
}
