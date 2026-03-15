/**
 * NanoSolana — Momentum Rider Agent
 *
 * Rides momentum shifts on bonding curves by tracking
 * price velocity and volume bursts.
 *
 * Strategy:
 *   1. Track bonding curve price changes over time windows
 *   2. Detect volume spikes (multiple buys in rapid succession)
 *   3. Enter on confirmed upward momentum
 *   4. Exit on momentum reversal or target reached
 *   5. Cross-reference with whale watcher data
 */

import { BaseAgent } from "./base-agent.js";
import type { AgentRole, SwarmEvent } from "../swarm/orchestrator.js";
import { calculateTokenPrice } from "../pump/client.js";
import BN from "bn.js";

// ── Config ────────────────────────────────────────────────────

interface MomentumRiderParams {
  /** Minimum price change to trigger (percent, e.g. 5 = 5%) */
  minPriceChangePct: number;
  /** Time window for momentum detection (ms) */
  momentumWindowMs: number;
  /** Maximum SOL per momentum play */
  maxPositionSol: number;
  /** Take profit target (percent) */
  takeProfitPct: number;
  /** Stop loss (percent) */
  stopLossPct: number;
  /** Max concurrent momentum plays */
  maxConcurrentPlays: number;
}

const DEFAULT_PARAMS: MomentumRiderParams = {
  minPriceChangePct: 10,
  momentumWindowMs: 120_000, // 2 minutes
  maxPositionSol: 75_000_000, // 0.075 SOL
  takeProfitPct: 25,
  stopLossPct: 10,
  maxConcurrentPlays: 3,
};

interface PricePoint {
  price: number;
  timestamp: number;
}

interface MomentumTracker {
  mint: string;
  priceHistory: PricePoint[];
  currentVelocity: number;       // price change per second
  peakVelocity: number;
  entryPrice: number | null;
  entryAt: number | null;
  signalSent: boolean;
  lastCheckedAt: number;
}

// ── Agent ────────────────────────────────────────────────────

export class MomentumRiderAgent extends BaseAgent {
  readonly role: AgentRole = "momentum-rider";
  readonly name = "Momentum Rider";
  readonly description = "Rides price momentum on pump.fun bonding curves";

  private params: MomentumRiderParams;
  private trackers = new Map<string, MomentumTracker>();
  private activePlays = 0;

  constructor(id = "momentum-rider-01", params: Partial<MomentumRiderParams> = {}) {
    super(id, { intervalMs: 8_000 });
    this.params = { ...DEFAULT_PARAMS, ...params };
  }

  protected async onInit(): Promise<void> {
    this.log("info", `Momentum rider active: trigger at ${this.params.minPriceChangePct}% change`);
  }

  protected async onTick(): Promise<void> {
    if (!this.ctx) return;

    for (const [mint, tracker] of this.trackers) {
      if (Date.now() - tracker.lastCheckedAt < 5_000) continue;

      const info = await this.ctx.pump.getTokenInfo(mint);
      if (!info || info.isGraduated) {
        this.trackers.delete(mint);
        continue;
      }

      const currentPrice = info.buyPricePerToken;
      const now = Date.now();

      // Record price point
      tracker.priceHistory.push({ price: currentPrice, timestamp: now });
      tracker.lastCheckedAt = now;

      // Keep history within window
      const windowStart = now - this.params.momentumWindowMs;
      tracker.priceHistory = tracker.priceHistory.filter((p) => p.timestamp > windowStart);

      if (tracker.priceHistory.length < 2) continue;

      // Calculate velocity
      const oldest = tracker.priceHistory[0]!;
      const newest = tracker.priceHistory[tracker.priceHistory.length - 1]!;
      const timeDelta = (newest.timestamp - oldest.timestamp) / 1000;
      const priceChangePct = oldest.price > 0
        ? ((newest.price - oldest.price) / oldest.price) * 100
        : 0;

      tracker.currentVelocity = timeDelta > 0 ? priceChangePct / timeDelta : 0;
      tracker.peakVelocity = Math.max(tracker.peakVelocity, tracker.currentVelocity);

      // Momentum detection
      if (
        priceChangePct >= this.params.minPriceChangePct &&
        !tracker.signalSent &&
        this.activePlays < this.params.maxConcurrentPlays
      ) {
        tracker.signalSent = true;
        tracker.entryPrice = currentPrice;
        tracker.entryAt = now;
        this.activePlays++;

        const confidence = Math.min(1, priceChangePct / 50 + 0.3);

        this.emit("trade:signal", {
          agent: this.id,
          type: "buy",
          mint,
          confidence,
          reasoning: `Momentum: +${priceChangePct.toFixed(1)}% in ${(timeDelta / 60).toFixed(1)}min, velocity: ${tracker.currentVelocity.toFixed(3)}%/s`,
          maxSol: this.params.maxPositionSol,
          strategy: "momentum",
          takeProfit: this.params.takeProfitPct,
          stopLoss: this.params.stopLossPct,
        }, 7);

        this.ctx.memory.storeKnown(
          `Momentum signal: ${mint.slice(0, 8)}... +${priceChangePct.toFixed(1)}%`,
          ["momentum", "signal", mint],
          this.id,
          7,
        );
      }

      // Exit check for active plays
      if (tracker.entryPrice && tracker.entryAt) {
        const pnlPct = ((currentPrice - tracker.entryPrice) / tracker.entryPrice) * 100;

        if (pnlPct >= this.params.takeProfitPct) {
          this.emit("trade:signal", {
            agent: this.id,
            type: "sell",
            mint,
            confidence: 0.9,
            reasoning: `Take profit: +${pnlPct.toFixed(1)}% (target: ${this.params.takeProfitPct}%)`,
            strategy: "momentum-exit",
          }, 8);

          this.activePlays = Math.max(0, this.activePlays - 1);
          tracker.entryPrice = null;
          tracker.entryAt = null;
          tracker.signalSent = false;
        } else if (pnlPct <= -this.params.stopLossPct) {
          this.emit("trade:signal", {
            agent: this.id,
            type: "sell",
            mint,
            confidence: 0.95,
            reasoning: `Stop loss: ${pnlPct.toFixed(1)}% (limit: -${this.params.stopLossPct}%)`,
            strategy: "momentum-exit",
          }, 9);

          this.activePlays = Math.max(0, this.activePlays - 1);
          tracker.entryPrice = null;
          tracker.entryAt = null;
          tracker.signalSent = false;
        }
      }
    }

    // Prune stale trackers
    if (this.trackers.size > 200) {
      const sorted = [...this.trackers.entries()]
        .sort((a, b) => a[1].lastCheckedAt - b[1].lastCheckedAt);
      for (const [mint] of sorted.slice(0, sorted.length - 100)) {
        this.trackers.delete(mint);
      }
    }
  }

  protected async onEvent(event: SwarmEvent): Promise<void> {
    // Track tokens other agents are watching
    if (event.type === "trade:signal" || event.type === "token:new-launch") {
      const data = event.data as { mint?: string };
      if (data.mint && !this.trackers.has(data.mint)) {
        this.trackers.set(data.mint, {
          mint: data.mint,
          priceHistory: [],
          currentVelocity: 0,
          peakVelocity: 0,
          entryPrice: null,
          entryAt: null,
          signalSent: false,
          lastCheckedAt: 0,
        });
      }
    }

    // React to whale buys as momentum indicator
    if (event.type === "token:whale-buy") {
      const data = event.data as { mint: string };
      if (!this.trackers.has(data.mint)) {
        this.trackers.set(data.mint, {
          mint: data.mint,
          priceHistory: [],
          currentVelocity: 0,
          peakVelocity: 0,
          entryPrice: null,
          entryAt: null,
          signalSent: false,
          lastCheckedAt: 0,
        });
      }
    }
  }

  protected async onDestroy(): Promise<void> {
    this.trackers.clear();
    this.activePlays = 0;
  }
}
