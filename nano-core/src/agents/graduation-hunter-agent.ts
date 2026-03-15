/**
 * NanoSolana — Graduation Hunter Agent
 *
 * Hunts for tokens approaching graduation from bonding curve to AMM.
 * Graduation happens when the bonding curve sells all real tokens.
 *
 * Strategy:
 *   1. Scan tokens with high graduation progress (>70%)
 *   2. Evaluate momentum toward graduation
 *   3. Enter before graduation for potential AMM listing pump
 *   4. Track graduated tokens for AMM liquidity depth
 *   5. Report graduating tokens to the swarm
 */

import { BaseAgent } from "./base-agent.js";
import type { AgentRole, SwarmEvent } from "../swarm/orchestrator.js";

// ── Config ────────────────────────────────────────────────────

interface GradHunterParams {
  /** Minimum graduation progress to start tracking (bps) */
  minProgressBps: number;
  /** Progress threshold that triggers a buy signal (bps) */
  buySignalProgressBps: number;
  /** Maximum SOL per graduation play */
  maxPositionSol: number;
  /** Tracked token limit */
  maxTracked: number;
}

const DEFAULT_PARAMS: GradHunterParams = {
  minProgressBps: 5000,      // 50%
  buySignalProgressBps: 7500, // 75%
  maxPositionSol: 100_000_000, // 0.1 SOL
  maxTracked: 100,
};

interface GradCandidate {
  mint: string;
  progressBps: number;
  marketCapSol: number;
  firstSeenProgress: number;
  lastProgress: number;
  checkCount: number;
  firstSeenAt: number;
  lastCheckedAt: number;
  signalSent: boolean;
}

// ── Agent ────────────────────────────────────────────────────

export class GraduationHunterAgent extends BaseAgent {
  readonly role: AgentRole = "graduation-hunter";
  readonly name = "Graduation Hunter";
  readonly description = "Hunts tokens approaching bonding curve graduation to AMM";

  private params: GradHunterParams;
  private candidates = new Map<string, GradCandidate>();

  constructor(id = "grad-hunter-01", params: Partial<GradHunterParams> = {}) {
    super(id, { intervalMs: 20_000 });
    this.params = { ...DEFAULT_PARAMS, ...params };
  }

  protected async onInit(): Promise<void> {
    this.log("info", `Graduation hunter active: signal at ${this.params.buySignalProgressBps / 100}% progress`);
  }

  protected async onTick(): Promise<void> {
    if (!this.ctx) return;

    // Check all candidates for progress updates
    for (const [mint, candidate] of this.candidates) {
      if (Date.now() - candidate.lastCheckedAt < 15_000) continue;

      const info = await this.ctx.pump.getTokenInfo(mint);
      if (!info) continue;

      candidate.lastCheckedAt = Date.now();
      candidate.checkCount++;

      // Update progress
      const prevProgress = candidate.progressBps;
      candidate.progressBps = info.progressBps;
      candidate.lastProgress = info.progressBps;
      candidate.marketCapSol = info.marketCapSol;

      // Graduated!
      if (info.isGraduated) {
        this.emit("token:graduation", {
          agent: this.id,
          mint,
          marketCapSol: info.marketCapSol,
          progressFromFirstSeen: candidate.progressBps - candidate.firstSeenProgress,
          trackingDuration: Date.now() - candidate.firstSeenAt,
        }, 9);

        this.ctx.memory.storeLearned(
          `Graduation: ${mint.slice(0, 8)}... at ${info.marketCapSol.toFixed(2)} SOL mcap. Tracked ${candidate.checkCount} checks over ${((Date.now() - candidate.firstSeenAt) / 60000).toFixed(1)}min`,
          ["graduation", "completed", mint],
          this.id,
          0.8,
          8,
        );

        this.candidates.delete(mint);
        continue;
      }

      // Momentum check: is progress accelerating?
      const progressDelta = candidate.progressBps - prevProgress;
      if (progressDelta > 100) {
        this.log("info", `${mint.slice(0, 8)}... surging: +${progressDelta / 100}% progress in one check`);
      }

      // Signal if approaching graduation and not yet signaled
      if (candidate.progressBps >= this.params.buySignalProgressBps && !candidate.signalSent) {
        candidate.signalSent = true;

        this.emit("trade:signal", {
          agent: this.id,
          type: "buy",
          mint,
          confidence: Math.min(1, candidate.progressBps / 10000 + 0.2),
          reasoning: `Graduation imminent: ${(candidate.progressBps / 100).toFixed(1)}% complete, ${info.marketCapSol.toFixed(2)} SOL mcap`,
          maxSol: this.params.maxPositionSol,
          strategy: "graduation-play",
        }, 8);

        this.ctx.memory.storeKnown(
          `Graduation signal: ${mint.slice(0, 8)}... at ${(candidate.progressBps / 100).toFixed(1)}%`,
          ["graduation", "signal", mint],
          this.id,
          8,
        );
      }
    }

    // Prune old candidates
    if (this.candidates.size > this.params.maxTracked) {
      const sorted = [...this.candidates.entries()]
        .sort((a, b) => a[1].progressBps - b[1].progressBps);
      const toRemove = sorted.slice(0, sorted.length - this.params.maxTracked);
      for (const [mint] of toRemove) {
        this.candidates.delete(mint);
      }
    }
  }

  protected async onEvent(event: SwarmEvent): Promise<void> {
    // Pick up tokens from other agents to check for graduation
    if (event.type === "trade:signal" || event.type === "token:new-launch") {
      const data = event.data as { mint?: string };
      if (data.mint && !this.candidates.has(data.mint)) {
        // Quick check if worth tracking
        const info = await this.ctx?.pump.getTokenInfo(data.mint);
        if (info && !info.isGraduated && info.progressBps >= this.params.minProgressBps) {
          this.candidates.set(data.mint, {
            mint: data.mint,
            progressBps: info.progressBps,
            marketCapSol: info.marketCapSol,
            firstSeenProgress: info.progressBps,
            lastProgress: info.progressBps,
            checkCount: 0,
            firstSeenAt: Date.now(),
            lastCheckedAt: Date.now(),
            signalSent: false,
          });
        }
      }
    }
  }

  protected async onDestroy(): Promise<void> {
    this.candidates.clear();
  }
}
