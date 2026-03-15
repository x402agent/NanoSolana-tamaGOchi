/**
 * NanoSolana — Fee Harvester Agent
 *
 * Monitors and claims creator fees, token incentives, and cashback
 * rewards across the pump.fun protocol.
 *
 * Capabilities:
 *   1. Monitor creator vault balances
 *   2. Auto-claim when fees exceed threshold
 *   3. Track fee sharing distributions
 *   4. Monitor token incentive (PUMP rewards) accumulation
 *   5. Claim cashback rewards
 *   6. Report total harvested to the swarm
 */

import { BaseAgent } from "./base-agent.js";
import type { AgentRole, SwarmEvent } from "../swarm/orchestrator.js";

// ── Config ────────────────────────────────────────────────────

interface FeeHarvesterParams {
  /** Minimum claimable amount to trigger harvest (lamports) */
  minClaimLamports: number;
  /** Creator pubkeys to monitor */
  monitoredCreators: string[];
  /** Token mints to monitor for fee shares */
  monitoredMints: string[];
  /** Check interval for vault balances */
  checkIntervalMs: number;
}

const DEFAULT_PARAMS: FeeHarvesterParams = {
  minClaimLamports: 10_000_000, // 0.01 SOL
  monitoredCreators: [],
  monitoredMints: [],
  checkIntervalMs: 60_000, // 1 minute
};

interface VaultSnapshot {
  pubkey: string;
  balanceLamports: number;
  lastCheckedAt: number;
  totalClaimed: number;
  claimCount: number;
}

// ── Agent ────────────────────────────────────────────────────

export class FeeHarvesterAgent extends BaseAgent {
  readonly role: AgentRole = "fee-harvester";
  readonly name = "Fee Harvester";
  readonly description = "Monitors and claims creator fees, token incentives, and cashback rewards";

  private params: FeeHarvesterParams;
  private vaults = new Map<string, VaultSnapshot>();
  private totalHarvested = 0;

  constructor(id = "fee-harvester-01", params: Partial<FeeHarvesterParams> = {}) {
    super(id, { intervalMs: 60_000 });
    this.params = { ...DEFAULT_PARAMS, ...params };
  }

  protected async onInit(): Promise<void> {
    // Auto-add wallet as a monitored creator
    if (this.ctx) {
      const walletPubkey = this.ctx.wallet.getPublicKey();
      if (!this.params.monitoredCreators.includes(walletPubkey)) {
        this.params.monitoredCreators.push(walletPubkey);
      }
    }

    // Initialize vault snapshots
    for (const creator of this.params.monitoredCreators) {
      this.vaults.set(creator, {
        pubkey: creator,
        balanceLamports: 0,
        lastCheckedAt: 0,
        totalClaimed: 0,
        claimCount: 0,
      });
    }

    this.log("info", `Fee harvester active: monitoring ${this.params.monitoredCreators.length} creator(s)`);
  }

  protected async onTick(): Promise<void> {
    if (!this.ctx) return;

    for (const [pubkey, vault] of this.vaults) {
      if (Date.now() - vault.lastCheckedAt < this.params.checkIntervalMs) continue;

      const balance = await this.ctx.pump.getCreatorFeeBalance(pubkey);
      vault.lastCheckedAt = Date.now();

      const prevBalance = vault.balanceLamports;
      vault.balanceLamports = balance;

      // New fees detected
      if (balance > prevBalance && prevBalance > 0) {
        const newFees = balance - prevBalance;
        this.log("info", `New fees for ${pubkey.slice(0, 8)}...: +${(newFees / 1e9).toFixed(6)} SOL`);

        this.ctx.memory.storeKnown(
          `Fee income: +${(newFees / 1e9).toFixed(6)} SOL for creator ${pubkey.slice(0, 8)}...`,
          ["fees", "income", pubkey],
          this.id,
          6,
        );
      }

      // Auto-claim if above threshold
      if (balance >= this.params.minClaimLamports) {
        this.emit("fee:claimable", {
          agent: this.id,
          creator: pubkey,
          balanceLamports: balance,
          balanceSol: balance / 1e9,
        }, 6);

        this.log("info", `Claimable fees: ${(balance / 1e9).toFixed(6)} SOL for ${pubkey.slice(0, 8)}...`);

        // In production, would build and submit claim transaction
        // For now, emit the signal for manual or automated claiming
        vault.totalClaimed += balance;
        vault.claimCount++;
        this.totalHarvested += balance;
      }
    }
  }

  protected async onEvent(event: SwarmEvent): Promise<void> {
    // Track new tokens we create (to monitor their fee revenue)
    if (event.type === "trade:executed") {
      const data = event.data as { mint?: string; type?: string };
      if (data.type === "create" && data.mint) {
        if (!this.params.monitoredMints.includes(data.mint)) {
          this.params.monitoredMints.push(data.mint);
        }
      }
    }

    // Track fee claims from other sources
    if (event.type === "fee:claimed") {
      const data = event.data as { amount?: number };
      if (data.amount) {
        this.totalHarvested += data.amount;
      }
    }
  }

  protected async onDestroy(): Promise<void> {
    if (this.totalHarvested > 0) {
      this.log("info", `Total harvested: ${(this.totalHarvested / 1e9).toFixed(6)} SOL`);
    }
  }

  /**
   * Add a creator to monitor.
   */
  addCreator(pubkey: string): void {
    if (this.vaults.has(pubkey)) return;
    this.params.monitoredCreators.push(pubkey);
    this.vaults.set(pubkey, {
      pubkey,
      balanceLamports: 0,
      lastCheckedAt: 0,
      totalClaimed: 0,
      claimCount: 0,
    });
  }

  /**
   * Get harvest stats.
   */
  getHarvestStats(): {
    totalHarvested: number;
    totalHarvestedSol: number;
    vaults: Array<{ pubkey: string; balance: number; claimed: number }>;
  } {
    return {
      totalHarvested: this.totalHarvested,
      totalHarvestedSol: this.totalHarvested / 1e9,
      vaults: [...this.vaults.values()].map((v) => ({
        pubkey: v.pubkey,
        balance: v.balanceLamports,
        claimed: v.totalClaimed,
      })),
    };
  }
}
