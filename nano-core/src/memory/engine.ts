/**
 * Nano Solana — Legacy Memory Engine
 *
 * Generic memory engine kept for backward compatibility.
 * New code should use ClawVault (3-tier epistemological memory).
 */

import { EventEmitter } from "eventemitter3";

// ── Types ────────────────────────────────────────────────────

export interface MemoryEntry {
  id: string;
  content: string;
  source: string;
  tags: string[];
  confidence: number;
  createdAt: number;
  expiresAt: number;
}

export interface Lesson {
  id: string;
  pattern: string;
  outcome: string;
  adjustment: string;
  confidenceImpact: number;
  createdAt: number;
}

export interface MemoryEngineEvents {
  entryStored: (entry: MemoryEntry) => void;
  entryExpired: (entry: MemoryEntry) => void;
  lessonLearned: (lesson: Lesson) => void;
  memoryReinforced: (id: string, confidence: number) => void;
}

// ── Memory Engine ────────────────────────────────────────────

export class MemoryEngine extends EventEmitter<MemoryEngineEvents> {
  private entries: Map<string, MemoryEntry> = new Map();
  private lessons: Lesson[] = [];
  private gcTimer: ReturnType<typeof setInterval> | null = null;
  private decayMs: number;
  private idCounter = 0;

  constructor(temporalDecayHours = 24) {
    super();
    this.decayMs = temporalDecayHours * 60 * 60 * 1000;
  }

  private nextId(): string {
    this.idCounter += 1;
    return `mem-${Date.now()}-${this.idCounter}`;
  }

  /**
   * Store a new memory entry.
   */
  store(input: {
    content: string;
    source: string;
    tags?: string[];
    confidence?: number;
    metadata?: Record<string, unknown>;
  }): MemoryEntry {
    const entry: MemoryEntry = {
      id: this.nextId(),
      content: input.content,
      source: input.source,
      tags: input.tags ?? [],
      confidence: input.confidence ?? 1.0,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.decayMs,
    };
    this.entries.set(entry.id, entry);
    this.emit("entryStored", entry);
    return entry;
  }

  /**
   * Search entries.
   */
  search(query: string, limit = 10): MemoryEntry[] {
    const q = query.toLowerCase();
    const results: MemoryEntry[] = [];

    for (const entry of this.entries.values()) {
      if (
        entry.content.toLowerCase().includes(q) ||
        entry.tags.some((t) => t.toLowerCase().includes(q))
      ) {
        results.push(entry);
      }
    }

    return results
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }

  /**
   * Reinforce a memory (increase its confidence and extend TTL).
   */
  reinforce(id: string, boost = 0.1): void {
    const entry = this.entries.get(id);
    if (!entry) return;

    entry.confidence = Math.min(1.0, entry.confidence + boost);
    entry.expiresAt = Date.now() + this.decayMs;
    this.emit("memoryReinforced", id, entry.confidence);
  }

  /**
   * Get learned lessons.
   */
  getLessons(): Lesson[] {
    return [...this.lessons];
  }

  /**
   * Add a lesson.
   */
  addLesson(input: Omit<Lesson, "id" | "createdAt">): Lesson {
    const lesson: Lesson = {
      ...input,
      id: `lesson-${Date.now()}-${this.lessons.length}`,
      createdAt: Date.now(),
    };
    this.lessons.push(lesson);
    this.emit("lessonLearned", lesson);
    return lesson;
  }

  /**
   * Get memory stats.
   */
  getStats(): {
    total: number;
    bySource: Record<string, number>;
    lessons: number;
    avgConfidence: number;
  } {
    const bySource: Record<string, number> = {};
    let totalConfidence = 0;

    for (const entry of this.entries.values()) {
      bySource[entry.source] = (bySource[entry.source] ?? 0) + 1;
      totalConfidence += entry.confidence;
    }

    return {
      total: this.entries.size,
      bySource,
      lessons: this.lessons.length,
      avgConfidence: this.entries.size > 0 ? totalConfidence / this.entries.size : 0,
    };
  }

  /**
   * Garbage collection — remove expired entries.
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
   * Start autonomous GC.
   */
  startAutonomous(): void {
    if (this.gcTimer) return;
    this.gcTimer = setInterval(() => this.gc(), 5 * 60 * 1000);
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
