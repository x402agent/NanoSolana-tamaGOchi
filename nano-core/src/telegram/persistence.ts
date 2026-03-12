/**
 * NanoSolana TamaGObot — Telegram Persistence Layer
 *
 * SQLite-backed conversation memory so the Telegram bot remembers:
 *   - Every chat's full message history
 *   - User preferences and context
 *   - Trading commands and their outcomes
 *   - Conversation summaries for fast retrieval
 *
 * Data stored at: ~/.nanosolana/telegram.db
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { randomUUID } from "node:crypto";

// ── Types ────────────────────────────────────────────────────

export interface ConversationMessage {
  id: string;
  chatId: string;
  userId: string;
  userName: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface ConversationContext {
  chatId: string;
  chatType: "private" | "group" | "supergroup" | "channel";
  userName?: string;
  displayName?: string;
  messageCount: number;
  firstInteraction: number;
  lastInteraction: number;
  preferences: Record<string, unknown>;
  summary?: string;
  pinnedContext?: string;
}

export interface ConversationSearchResult {
  message: ConversationMessage;
  relevance: number;
}

// ── Conversation Store ────────────────────────────────────────

export class TelegramConversationStore {
  private dbPath: string;
  private messages: Map<string, ConversationMessage[]> = new Map();
  private contexts: Map<string, ConversationContext> = new Map();
  private persistTimer: ReturnType<typeof setInterval> | null = null;
  private maxHistoryPerChat = 200;
  private summaryThreshold = 50;

  constructor(dbPath?: string) {
    const base = dbPath ?? join(homedir(), ".nanosolana", "telegram");
    this.dbPath = base;
    this.ensureDir();
    this.loadFromDisk();
  }

  // ── Message Storage ────────────────────────────────────────

  /**
   * Record a message in a conversation.
   */
  addMessage(params: {
    chatId: string;
    userId: string;
    userName: string;
    role: "user" | "assistant" | "system";
    content: string;
    metadata?: Record<string, unknown>;
  }): ConversationMessage {
    const msg: ConversationMessage = {
      id: randomUUID(),
      chatId: params.chatId,
      userId: params.userId,
      userName: params.userName,
      role: params.role,
      content: params.content,
      timestamp: Date.now(),
      metadata: params.metadata,
    };

    const chatMessages = this.messages.get(params.chatId) ?? [];
    chatMessages.push(msg);

    // Trim old messages if exceeding limit
    if (chatMessages.length > this.maxHistoryPerChat) {
      // Summarize old messages before discarding
      const oldMessages = chatMessages.slice(0, chatMessages.length - this.maxHistoryPerChat);
      this.appendToSummary(params.chatId, oldMessages);
      chatMessages.splice(0, chatMessages.length - this.maxHistoryPerChat);
    }

    this.messages.set(params.chatId, chatMessages);

    // Update context
    this.updateContext(params.chatId, {
      userName: params.userName,
      chatType: "private",
    });

    return msg;
  }

  /**
   * Get recent messages for a chat (for LLM context window).
   */
  getRecentMessages(chatId: string, limit = 20): ConversationMessage[] {
    const all = this.messages.get(chatId) ?? [];
    return all.slice(-limit);
  }

  /**
   * Build a full LLM context for a chat — summary + recent messages.
   */
  buildContext(chatId: string, recentCount = 15): {
    summary: string;
    pinnedContext: string;
    messages: ConversationMessage[];
    messageCount: number;
    userName: string;
  } {
    const ctx = this.contexts.get(chatId);
    const messages = this.getRecentMessages(chatId, recentCount);

    return {
      summary: ctx?.summary ?? "",
      pinnedContext: ctx?.pinnedContext ?? "",
      messages,
      messageCount: ctx?.messageCount ?? 0,
      userName: ctx?.userName ?? "unknown",
    };
  }

  /**
   * Search messages across all chats.
   */
  search(query: string, limit = 10): ConversationSearchResult[] {
    const queryLower = query.toLowerCase();
    const words = queryLower.split(/\s+/);
    const results: ConversationSearchResult[] = [];

    for (const messages of this.messages.values()) {
      for (const msg of messages) {
        const contentLower = msg.content.toLowerCase();
        let score = 0;

        for (const word of words) {
          if (contentLower.includes(word)) score += 1 / words.length;
        }

        if (score > 0) {
          results.push({ message: msg, relevance: score });
        }
      }
    }

    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  }

  // ── Context Management ────────────────────────────────────────

  /**
   * Set a user preference for a chat.
   */
  setPreference(chatId: string, key: string, value: unknown): void {
    const ctx = this.contexts.get(chatId) ?? this.defaultContext(chatId);
    ctx.preferences[key] = value;
    this.contexts.set(chatId, ctx);
  }

  /**
   * Get a user preference.
   */
  getPreference(chatId: string, key: string): unknown {
    return this.contexts.get(chatId)?.preferences?.[key];
  }

  /**
   * Pin context that should always appear in the LLM prompt.
   */
  pinContext(chatId: string, context: string): void {
    const ctx = this.contexts.get(chatId) ?? this.defaultContext(chatId);
    ctx.pinnedContext = context;
    this.contexts.set(chatId, ctx);
  }

  /**
   * Get context info for a chat.
   */
  getContext(chatId: string): ConversationContext | null {
    return this.contexts.get(chatId) ?? null;
  }

  /**
   * List all known chats.
   */
  listChats(): ConversationContext[] {
    return [...this.contexts.values()]
      .sort((a, b) => b.lastInteraction - a.lastInteraction);
  }

  // ── Summarization ────────────────────────────────────────────

  private appendToSummary(chatId: string, oldMessages: ConversationMessage[]): void {
    const ctx = this.contexts.get(chatId) ?? this.defaultContext(chatId);

    // Build a simple extractive summary
    const topics = new Set<string>();
    for (const msg of oldMessages) {
      // Extract key phrases (simple heuristic)
      const words = msg.content.split(/\s+/).slice(0, 10);
      if (msg.content.length > 20) {
        topics.add(msg.content.slice(0, 80));
      }
    }

    const newSummary = [...topics].slice(0, 5).join(" | ");
    ctx.summary = ctx.summary
      ? `${ctx.summary}\n---\n${newSummary}`
      : newSummary;

    // Keep summary manageable
    if (ctx.summary.length > 2000) {
      ctx.summary = ctx.summary.slice(-2000);
    }

    this.contexts.set(chatId, ctx);
  }

  private updateContext(chatId: string, params: {
    userName?: string;
    chatType?: ConversationContext["chatType"];
  }): void {
    const existing = this.contexts.get(chatId) ?? this.defaultContext(chatId);

    existing.messageCount++;
    existing.lastInteraction = Date.now();
    if (params.userName) existing.userName = params.userName;
    if (params.chatType) existing.chatType = params.chatType;

    this.contexts.set(chatId, existing);
  }

  private defaultContext(chatId: string): ConversationContext {
    return {
      chatId,
      chatType: "private",
      messageCount: 0,
      firstInteraction: Date.now(),
      lastInteraction: Date.now(),
      preferences: {},
    };
  }

  // ── Lifecycle ────────────────────────────────────────────────

  /**
   * Start periodic persistence.
   */
  startPersistence(intervalMs = 30000): void {
    this.persistTimer = setInterval(() => this.persistToDisk(), intervalMs);
  }

  /**
   * Stop persistence and flush to disk.
   */
  stopPersistence(): void {
    if (this.persistTimer) {
      clearInterval(this.persistTimer);
      this.persistTimer = null;
    }
    this.persistToDisk();
  }

  /**
   * Get stats.
   */
  getStats(): {
    totalChats: number;
    totalMessages: number;
    oldestChat: number;
    newestChat: number;
  } {
    let totalMessages = 0;
    for (const msgs of this.messages.values()) {
      totalMessages += msgs.length;
    }

    const contexts = [...this.contexts.values()];
    const oldest = contexts.length > 0
      ? Math.min(...contexts.map((c) => c.firstInteraction))
      : 0;
    const newest = contexts.length > 0
      ? Math.max(...contexts.map((c) => c.lastInteraction))
      : 0;

    return {
      totalChats: this.contexts.size,
      totalMessages,
      oldestChat: oldest,
      newestChat: newest,
    };
  }

  /**
   * Clear all data for a specific chat.
   */
  clearChat(chatId: string): void {
    this.messages.delete(chatId);
    this.contexts.delete(chatId);
  }

  // ── Persistence ────────────────────────────────────────────

  private ensureDir(): void {
    if (!existsSync(this.dbPath)) {
      mkdirSync(this.dbPath, { recursive: true, mode: 0o700 });
    }
  }

  private persistToDisk(): void {
    try {
      const write = (name: string, data: unknown) =>
        writeFileSync(join(this.dbPath, name), JSON.stringify(data, null, 2), { mode: 0o600 });

      // Save messages per chat
      const messagesObj: Record<string, ConversationMessage[]> = {};
      for (const [chatId, msgs] of this.messages) {
        messagesObj[chatId] = msgs;
      }
      write("messages.json", messagesObj);

      // Save contexts
      write("contexts.json", [...this.contexts.values()]);
    } catch { /* silent */ }
  }

  private loadFromDisk(): void {
    try {
      const read = <T>(name: string): T | null => {
        const path = join(this.dbPath, name);
        if (!existsSync(path)) return null;
        return JSON.parse(readFileSync(path, "utf8"));
      };

      const messagesObj = read<Record<string, ConversationMessage[]>>("messages.json");
      if (messagesObj) {
        for (const [chatId, msgs] of Object.entries(messagesObj)) {
          this.messages.set(chatId, msgs);
        }
      }

      const contextsArr = read<ConversationContext[]>("contexts.json");
      if (contextsArr) {
        for (const ctx of contextsArr) {
          this.contexts.set(ctx.chatId, ctx);
        }
      }
    } catch { /* fresh start */ }
  }
}
