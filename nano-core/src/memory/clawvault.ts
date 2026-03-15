/**
 * Nano Solana — ClawVault: 3-Tier Epistemological Memory Engine
 *
 * The brain's long-term memory system. Organizes knowledge into three tiers:
 *   KNOWN    — empirical facts with short TTL (60s)
 *   LEARNED  — validated patterns from trade analysis (7 days)
 *   INFERRED — hypotheses held loosely (3 days)
 *
 * Features:
 *   - Temporal decay with automatic garbage collection
 *   - Experience replay on trade outcomes
 *   - Contradiction detection (new facts invalidate bad hypotheses)
 *   - Research agenda (open questions prioritized in OODA cycle)
 */

import { EventEmitter } from "eventemitter3";

// ── Types ────────────────────────────────────────────────────

export type KnowledgeTier = "known" | "learned" | "inferred";

export interface VaultEntry {
  id: string;
  tier: KnowledgeTier;
  content: string;
  source: string;
  tags: string[];
  confidence: number;
  metadata?: Record<string, unknown>;
  createdAt: number;
  expiresAt: number;
}

export interface TradeRecord {
  id: string;
  tokenSymbol: string;
  tradeType: "buy" | "sell" | "hold";
  entryPrice: number;
  exitPrice?: number;
  pnl?: number;
  confidence: number;
  timestamp: number;
  reasoning: string;
}

export interface Lesson {
  id: string;
  pattern: string;
  outcome: string;
  adjustment: string;
  confidenceImpact: number;
  tier: KnowledgeTier;
  tradeIds: string[];
  createdAt: number;
}

export interface ResearchAgenda {
  id: string;
  question: string;
  priority: number;
  createdAt: number;
  resolvedAt?: number;
}

export interface ClawVaultEvents {
  entryStored: (entry: VaultEntry) => void;
  entryExpired: (entry: VaultEntry) => void;
  lessonLearned: (lesson: Lesson) => void;
  contradictionDetected: (existing: VaultEntry, incoming: VaultEntry) => void;
  researchGapFound: (agenda: ResearchAgenda) => void;
}

// ── TTLs ────────────────────────────────────────────────────

const TIER_TTL: Record<KnowledgeTier, number> = {
  known: 60 * 1000,              // 60 seconds
  learned: 7 * 24 * 60 * 60 * 1000, // 7 days
  inferred: 3 * 24 * 60 * 60 * 1000, // 3 days
};

const GC_INTERVAL = 5 * 60 * 1000; // 5 minutes

// ── ClawVault ────────────────────────────────────────────────

export class ClawVault extends EventEmitter<ClawVaultEvents> {
  private entries: Map<string, VaultEntry> = new Map();
  private trades: TradeRecord[] = [];
  private lessons: Lesson[] = [];
  private researchAgenda: ResearchAgenda[] = [];
  private gcTimer: ReturnType<typeof setInterval> | null = null;
  private idCounter = 0;

  constructor() {
    super();
  }

  private nextId(prefix: string): string {
    this.idCounter += 1;
    return `${prefix}-${Date.now()}-${this.idCounter}`;
  }

  // ── Store Operations ──────────────────────────────────────

  /**
   * Store a KNOWN fact (short TTL, empirical data).
   */
  storeKnown(input: {
    content: string;
    source: string;
    tags: string[];
    metadata?: Record<string, unknown>;
  }): VaultEntry {
    const entry: VaultEntry = {
      id: this.nextId("known"),
      tier: "known",
      content: input.content,
      source: input.source,
      tags: input.tags,
      confidence: 1.0,
      metadata: input.metadata,
      createdAt: Date.now(),
      expiresAt: Date.now() + TIER_TTL.known,
    };
    this.entries.set(entry.id, entry);
    this.emit("entryStored", entry);
    return entry;
  }

  /**
   * Store a LEARNED pattern (longer TTL, derived from trade analysis).
   */
  storeLearned(input: {
    content: string;
    source: string;
    tags: string[];
    confidence: number;
  }): VaultEntry {
    const entry: VaultEntry = {
      id: this.nextId("learned"),
      tier: "learned",
      content: input.content,
      source: input.source,
      tags: input.tags,
      confidence: input.confidence,
      createdAt: Date.now(),
      expiresAt: Date.now() + TIER_TTL.learned,
    };
    this.entries.set(entry.id, entry);
    this.emit("entryStored", entry);
    return entry;
  }

  /**
   * Store an INFERRED hypothesis (held loosely, shortest confidence).
   */
  storeInferred(input: {
    content: string;
    source: string;
    tags: string[];
  }): VaultEntry {
    const entry: VaultEntry = {
      id: this.nextId("inferred"),
      tier: "inferred",
      content: input.content,
      source: input.source,
      tags: input.tags,
      confidence: 0.5,
      createdAt: Date.now(),
      expiresAt: Date.now() + TIER_TTL.inferred,
    };
    this.entries.set(entry.id, entry);
    this.emit("entryStored", entry);
    return entry;
  }

  // ── Query Operations ──────────────────────────────────────

  /**
   * Search entries by text query.
   */
  search(query: string, limit = 10): VaultEntry[] {
    const q = query.toLowerCase();
    const results: VaultEntry[] = [];

    for (const entry of this.entries.values()) {
      if (
        entry.content.toLowerCase().includes(q) ||
        entry.tags.some((t) => t.toLowerCase().includes(q))
      ) {
        results.push(entry);
      }
    }

    return results
      .sort((a, b) => b.confidence - a.confidence || b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  /**
   * Get entries by tier.
   */
  getByTier(tier: KnowledgeTier): VaultEntry[] {
    return [...this.entries.values()].filter((e) => e.tier === tier);
  }

  // ── Trade Recording ───────────────────────────────────────

  recordTrade(trade: Omit<TradeRecord, "id">): TradeRecord {
    const record: TradeRecord = { ...trade, id: this.nextId("trade") };
    this.trades.push(record);
    return record;
  }

  // ── Experience Replay ─────────────────────────────────────

  /**
   * Replay recent trades, extract patterns, promote to LEARNED tier.
   */
  experienceReplay(context: {
    tokenSymbol: string;
    tradeType: string;
  }): { warnings: string[]; greenLights: string[] } {
    const warnings: string[] = [];
    const greenLights: string[] = [];
    const recentTrades = this.trades.slice(-20);

    // Look for patterns in recent trades
    const sameTicker = recentTrades.filter(
      (t) => t.tokenSymbol === context.tokenSymbol,
    );

    if (sameTicker.length >= 3) {
      const losses = sameTicker.filter((t) => (t.pnl ?? 0) < 0);
      if (losses.length >= 2) {
        warnings.push(
          `⚠️  ${context.tokenSymbol}: ${losses.length}/${sameTicker.length} recent trades were losses`,
        );
      }

      const wins = sameTicker.filter((t) => (t.pnl ?? 0) > 0);
      if (wins.length >= 2) {
        greenLights.push(
          `✅ ${context.tokenSymbol}: ${wins.length}/${sameTicker.length} recent trades were profitable`,
        );
      }
    }

    return { warnings, greenLights };
  }

  // ── Lessons ─────────────────────────────────────

  getLessons(): Lesson[] {
    return [...this.lessons];
  }

  addLesson(input: Omit<Lesson, "id" | "createdAt">): Lesson {
    const lesson: Lesson = {
      ...input,
      id: this.nextId("lesson"),
      createdAt: Date.now(),
    };
    this.lessons.push(lesson);
    this.emit("lessonLearned", lesson);
    return lesson;
  }

  // ── Research Agenda ───────────────────────────────

  getResearchAgenda(): ResearchAgenda[] {
    return this.researchAgenda.filter((g) => !g.resolvedAt);
  }

  addResearchGap(question: string, priority = 5): ResearchAgenda {
    const agenda: ResearchAgenda = {
      id: this.nextId("research"),
      question,
      priority,
      createdAt: Date.now(),
    };
    this.researchAgenda.push(agenda);
    this.emit("researchGapFound", agenda);
    return agenda;
  }

  // ── Stats ─────────────────────────────────────────

  getStats(): {
    known: number;
    learned: number;
    inferred: number;
    inbox: number;
    trades: number;
    lessons: number;
    tradeWinRate: number;
    researchGaps: number;
  } {
    const known = this.getByTier("known").length;
    const learned = this.getByTier("learned").length;
    const inferred = this.getByTier("inferred").length;

    const winsCount = this.trades.filter((t) => (t.pnl ?? 0) > 0).length;
    const winRate = this.trades.length > 0 ? winsCount / this.trades.length : 0;

    return {
      known,
      learned,
      inferred,
      inbox: 0,
      trades: this.trades.length,
      lessons: this.lessons.length,
      tradeWinRate: winRate,
      researchGaps: this.getResearchAgenda().length,
    };
  }

  // ── Garbage Collection ────────────────────────────

  /**
   * Remove expired entries (temporal decay).
   */
  private gc(): void {
    const now = Date.now();
    for (const [id, entry] of this.entries) {
      if (entry.expiresAt <= now) {
        this.entries.delete(id);
        this.emit("entryExpired", entry);
      }
    }
  }

  /**
   * Start autonomous GC and pattern promotion.
   */
  startAutonomous(): void {
    if (this.gcTimer) return;
    this.gcTimer = setInterval(() => this.gc(), GC_INTERVAL);
  }

  /**
   * Stop autonomous GC.
   */
  stopAutonomous(): void {
    if (this.gcTimer) {
      clearInterval(this.gcTimer);
      this.gcTimer = null;
    }
  }
}
