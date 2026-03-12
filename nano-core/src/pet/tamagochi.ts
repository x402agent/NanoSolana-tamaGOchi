/**
 * NanoSolana TamaGObot — TamaGOchi Pet Engine
 *
 * Virtual pet whose life is driven by REAL on-chain trading performance.
 *
 * Evolution Stages:
 *   🥚 Egg      → First boot (no wallet yet)
 *   🦐 Larva    → Wallet created, no trades
 *   🐹 Juvenile → 10+ trades completed
 *   🐹 Adult    → 50+ trades, >40% win rate
 *   👑 Alpha    → 200+ trades, >55% WR, profitable
 *   💀 Ghost    → Wallet drained or offline >24h
 *
 * Mood System (driven by streak, PnL, balance):
 *   🤩 Ecstatic · 😊 Happy · 😐 Neutral · 😰 Anxious · 😢 Sad · 😴 Sleeping · 🤤 Hungry
 */

import { EventEmitter } from "eventemitter3";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

// ── Types ────────────────────────────────────────────────────

export type EvolutionStage = "egg" | "larva" | "juvenile" | "adult" | "alpha" | "ghost";
export type Mood = "ecstatic" | "happy" | "neutral" | "anxious" | "sad" | "sleeping" | "hungry";

export const STAGE_EMOJI: Record<EvolutionStage, string> = {
  egg: "🥚",
  larva: "🦐",
  juvenile: "🐹",
  adult: "🐹",
  alpha: "👑",
  ghost: "💀",
};

export const MOOD_EMOJI: Record<Mood, string> = {
  ecstatic: "🤩",
  happy: "😊",
  neutral: "😐",
  anxious: "😰",
  sad: "😢",
  sleeping: "😴",
  hungry: "🤤",
};

export interface TamaGOchiState {
  name: string;
  stage: EvolutionStage;
  mood: Mood;
  level: number;
  xp: number;
  energy: number;      // 0-10
  hunger: number;      // 0-10
  totalTrades: number;
  wins: number;
  losses: number;
  streak: number;      // Positive = wins, negative = losses
  totalPnlSol: number;
  balanceSol: number;
  birthTimestamp: number;
  lastFedTimestamp: number;
  lastActiveTimestamp: number;
  uptimeHours: number;
}

export interface TamaGOchiEvents {
  evolved: (from: EvolutionStage, to: EvolutionStage) => void;
  moodChanged: (from: Mood, to: Mood) => void;
  levelUp: (level: number) => void;
  died: () => void;
  fed: () => void;
}

// ── TamaGOchi Engine ────────────────────────────────────────

export class TamaGOchi extends EventEmitter<TamaGOchiEvents> {
  private state: TamaGOchiState;
  private decayTimer: ReturnType<typeof setInterval> | null = null;
  private persistPath: string;

  constructor(name = "NanoSolana") {
    super();

    this.persistPath = join(homedir(), ".nanosolana", "tamagochi.json");

    // Try to load existing state
    const loaded = this.loadState();
    if (loaded) {
      this.state = loaded;
      this.state.lastActiveTimestamp = Date.now();
    } else {
      this.state = {
        name,
        stage: "egg",
        mood: "neutral",
        level: 1,
        xp: 0,
        energy: 10,
        hunger: 10,
        totalTrades: 0,
        wins: 0,
        losses: 0,
        streak: 0,
        totalPnlSol: 0,
        balanceSol: 0,
        birthTimestamp: Date.now(),
        lastFedTimestamp: Date.now(),
        lastActiveTimestamp: Date.now(),
        uptimeHours: 0,
      };
    }
  }

  /**
   * Start the pet's lifecycle timers.
   */
  startLifecycle(): void {
    // Energy and hunger decay every 5 minutes
    this.decayTimer = setInterval(() => {
      this.tick();
    }, 5 * 60 * 1000);
  }

  /**
   * Stop lifecycle.
   */
  stopLifecycle(): void {
    if (this.decayTimer) {
      clearInterval(this.decayTimer);
      this.decayTimer = null;
    }
    this.persistState();
  }

  /**
   * Periodic tick — decay energy/hunger, update mood, check evolution.
   */
  private tick(): void {
    const now = Date.now();
    const hoursSinceActive = (now - this.state.lastActiveTimestamp) / (1000 * 60 * 60);

    // Energy decays slowly
    if (this.state.energy > 0) {
      this.state.energy = Math.max(0, this.state.energy - 0.5);
    }

    // Hunger decays
    if (this.state.hunger > 0) {
      this.state.hunger = Math.max(0, this.state.hunger - 0.3);
    }

    // Ghost check — offline > 24h or wallet drained
    if (hoursSinceActive > 24 || (this.state.balanceSol <= 0 && this.state.totalTrades > 0)) {
      if (this.state.stage !== "ghost") {
        const old = this.state.stage;
        this.state.stage = "ghost";
        this.emit("evolved", old, "ghost");
        this.emit("died");
      }
    }

    // Update mood
    this.updateMood();

    // Update uptime
    this.state.uptimeHours = (now - this.state.birthTimestamp) / (1000 * 60 * 60);

    this.persistState();
  }

  /**
   * Record a trade outcome — this drives the pet's evolution.
   */
  recordTrade(params: {
    won: boolean;
    pnlSol: number;
    newBalance: number;
  }): void {
    this.state.totalTrades++;
    this.state.totalPnlSol += params.pnlSol;
    this.state.balanceSol = params.newBalance;
    this.state.lastActiveTimestamp = Date.now();

    if (params.won) {
      this.state.wins++;
      this.state.streak = Math.max(0, this.state.streak) + 1;
      this.state.xp += 10 + Math.floor(params.pnlSol * 100); // Bonus XP for bigger wins
      this.state.energy = Math.min(10, this.state.energy + 1);
    } else {
      this.state.losses++;
      this.state.streak = Math.min(0, this.state.streak) - 1;
      this.state.xp += 3; // Small XP for trying
      this.state.energy = Math.max(0, this.state.energy - 0.5);
    }

    // Level up every 100 XP
    const newLevel = Math.floor(this.state.xp / 100) + 1;
    if (newLevel > this.state.level) {
      this.state.level = newLevel;
      this.emit("levelUp", newLevel);
    }

    // Check evolution
    this.checkEvolution();
    this.updateMood();
    this.persistState();
  }

  /**
   * Record wallet creation (egg → larva transition).
   */
  recordWalletCreated(balance: number): void {
    this.state.balanceSol = balance;
    this.state.lastActiveTimestamp = Date.now();

    if (this.state.stage === "egg") {
      this.state.stage = "larva";
      this.emit("evolved", "egg", "larva");
    }

    this.persistState();
  }

  /**
   * Feed the pet (resets hunger, boosts energy).
   * In practice: funding the wallet = feeding.
   */
  feed(solAmount: number): void {
    this.state.hunger = 10;
    this.state.energy = Math.min(10, this.state.energy + 3);
    this.state.balanceSol += solAmount;
    this.state.lastFedTimestamp = Date.now();
    this.state.lastActiveTimestamp = Date.now();

    // Revive from ghost
    if (this.state.stage === "ghost" && this.state.balanceSol > 0) {
      this.checkEvolution();
    }

    this.updateMood();
    this.emit("fed");
    this.persistState();
  }

  /**
   * Check and apply evolution transitions.
   */
  private checkEvolution(): void {
    const { totalTrades, wins, stage } = this.state;
    const winRate = totalTrades > 0 ? wins / totalTrades : 0;
    const profitable = this.state.totalPnlSol > 0;

    let newStage = stage;

    if (stage === "ghost") return; // Must be fed to revive

    if (totalTrades >= 200 && winRate > 0.55 && profitable) {
      newStage = "alpha";
    } else if (totalTrades >= 50 && winRate > 0.4) {
      newStage = "adult";
    } else if (totalTrades >= 10) {
      newStage = "juvenile";
    } else if (totalTrades === 0 && this.state.balanceSol > 0) {
      newStage = "larva";
    }

    if (newStage !== stage) {
      this.state.stage = newStage;
      this.emit("evolved", stage, newStage);
    }
  }

  /**
   * Update mood based on current state.
   */
  private updateMood(): void {
    const old = this.state.mood;
    let newMood: Mood;

    if (this.state.energy <= 1) {
      newMood = "sleeping";
    } else if (this.state.hunger <= 2) {
      newMood = "hungry";
    } else if (this.state.streak >= 5) {
      newMood = "ecstatic";
    } else if (this.state.streak >= 2) {
      newMood = "happy";
    } else if (this.state.streak <= -5) {
      newMood = "sad";
    } else if (this.state.streak <= -2) {
      newMood = "anxious";
    } else {
      newMood = "neutral";
    }

    if (newMood !== old) {
      this.state.mood = newMood;
      this.emit("moodChanged", old, newMood);
    }
  }

  /**
   * Get the full state snapshot.
   */
  getState(): TamaGOchiState {
    return { ...this.state };
  }

  /**
   * Get a pretty-printed status string (terminal display).
   */
  getStatusDisplay(): string {
    const s = this.state;
    const stageEmoji = STAGE_EMOJI[s.stage];
    const moodEmoji = MOOD_EMOJI[s.mood];
    const winRate = s.totalTrades > 0 ? ((s.wins / s.totalTrades) * 100).toFixed(0) : "0";
    const energyBar = "⚡".repeat(Math.round(s.energy)) + "  ".repeat(10 - Math.round(s.energy));
    const hungerBar = (s.hunger >= 7 ? "🟢" : s.hunger >= 4 ? "🟡" : "🔴").repeat(Math.round(s.hunger));
    const age = this.formatDuration(Date.now() - s.birthTimestamp);
    const streakStr = s.streak >= 0 ? `+${s.streak}` : `${s.streak}`;
    const pnlStr = s.totalPnlSol >= 0 ? `+${s.totalPnlSol.toFixed(4)}` : s.totalPnlSol.toFixed(4);

    return [
      `${stageEmoji} ${s.name}  ${moodEmoji}`,
      "",
      `📊 Stage: ${s.stage} · Level ${s.level} · XP ${s.xp}`,
      `${moodEmoji} Mood: ${s.mood}`,
      `⚡ Energy: ${energyBar}`,
      `🍽️  Hunger: ${hungerBar}`,
      "",
      `📈 Trades: ${s.totalTrades} · Win Rate: ${winRate}%`,
      `💰 Balance: ${s.balanceSol.toFixed(4)} SOL`,
      `📊 Total PnL: ${pnlStr} SOL`,
      `🔥 Streak: ${streakStr}`,
      `⏱️  Age: ${age} · Uptime: ${s.uptimeHours.toFixed(0)}h`,
    ].join("\n");
  }

  private formatDuration(ms: number): string {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h`;
    const minutes = Math.floor(ms / (1000 * 60));
    return `${minutes}m`;
  }

  // ── Persistence ────────────────────────────────────────────

  private persistState(): void {
    try {
      const dir = join(homedir(), ".nanosolana");
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true, mode: 0o700 });
      writeFileSync(this.persistPath, JSON.stringify(this.state, null, 2), { mode: 0o600 });
    } catch {
      // Silent fail
    }
  }

  private loadState(): TamaGOchiState | null {
    try {
      if (!existsSync(this.persistPath)) return null;
      return JSON.parse(readFileSync(this.persistPath, "utf8"));
    } catch {
      return null;
    }
  }
}
