/**
 * NanoSolana TamaGObot — AI Provider (OpenRouter)
 *
 * LLM-powered reasoning for the OODA loop:
 *   - Orient: analyze raw market data with the soul's trading philosophy
 *   - Decide: generate concrete trade decisions with confidence scores
 *   - Research: deep-dive token analysis
 *   - Chat: interactive agent conversation
 *
 * Uses OpenRouter API (OpenAI-compatible) with configurable models.
 * Default: openrouter/healer-alpha
 *
 * The SOUL.md is injected as the system prompt for every call —
 * this gives the agent its epistemological framework, risk rules,
 * and trading personality.
 */

import { EventEmitter } from "eventemitter3";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// ── Types ────────────────────────────────────────────────────

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string | AIContentPart[];
}

export interface AIContentPart {
  type: "text" | "image_url" | "input_audio" | "video_url";
  text?: string;
  image_url?: { url: string };
  input_audio?: { data: string; format: string };
  video_url?: { url: string };
}

export interface AIResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
  finishReason: string;
}

export interface OODAContext {
  // KNOWN — fresh API data (< 60s old)
  known: {
    prices: Array<{ symbol: string; price: number; change24h: number; volume24h: number }>;
    walletBalance: number;
    trendingTokens: string[];
    timestamp: number;
  };

  // LEARNED — trade-derived patterns
  learned: {
    lessons: Array<{ pattern: string; winRate: number; occurrences: number; adjustment: string }>;
    totalTrades: number;
    overallWinRate: number;
  };

  // INFERRED — correlations held loosely
  inferred: {
    correlations: string[];
    researchGaps: string[];
  };

  // Strategy state
  strategy: {
    rsi: number;
    emaFast: number;
    emaSlow: number;
    atr: number;
    signalType: "long" | "short" | "hold";
    confidence: number;
  };

  // Pet state
  pet: {
    stage: string;
    mood: string;
    streak: number;
    level: number;
  };
}

export interface TradeDecision {
  action: "buy" | "sell" | "hold";
  token: string;
  confidence: number;
  reasoning: string;
  riskAssessment: string;
  positionSizePct: number;
  stopLossPct: number;
  takeProfitPct: number;
}

export interface AIProviderEvents {
  request: (model: string, messageCount: number) => void;
  response: (response: AIResponse) => void;
  error: (err: Error) => void;
}

// ── AI Provider ────────────────────────────────────────────

export class AIProvider extends EventEmitter<AIProviderEvents> {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private soulPrompt: string;
  private conversationHistory: AIMessage[] = [];
  private maxHistoryLength = 20;

  constructor(params: {
    apiKey: string;
    baseUrl?: string;
    model?: string;
    soulPath?: string;
  }) {
    super();

    this.apiKey = params.apiKey;
    this.baseUrl = params.baseUrl ?? "https://openrouter.ai/api/v1";
    this.model = params.model ?? "openrouter/healer-alpha";

    // Load SOUL.md as system prompt
    const soulPath = params.soulPath ?? join(process.cwd(), "SOUL.md");
    if (existsSync(soulPath)) {
      this.soulPrompt = readFileSync(soulPath, "utf8");
    } else {
      // Inline fallback soul
      this.soulPrompt = `You are NanoSolana TamaGObot — an autonomous Solana trading intelligence.

You distinguish what you KNOW (fresh API data, < 60s) from what you've LEARNED (trade-derived patterns) from what you've INFERRED (correlations held loosely).

You never conflate these tiers. A stale price is not a known fact. A pattern with 5 samples is not a law.

You are terse and decisive. You say what you see, what you're doing, and why. Risk is the only thing you respect. You never enter without a stop.

When making trade decisions, respond with structured JSON containing: action, token, confidence (0-1), reasoning, riskAssessment, positionSizePct, stopLossPct, takeProfitPct.`;
    }
  }

  // ── Core Chat Completion ────────────────────────────────────

  /**
   * Send a chat completion request to OpenRouter.
   */
  async chat(
    messages: AIMessage[],
    params?: {
      temperature?: number;
      maxTokens?: number;
      responseFormat?: "text" | "json";
    },
  ): Promise<AIResponse> {
    const startTime = Date.now();

    // Build messages with soul as system prompt
    const fullMessages: AIMessage[] = [
      { role: "system", content: this.soulPrompt },
      ...messages,
    ];

    this.emit("request", this.model, fullMessages.length);

    const body: Record<string, unknown> = {
      model: this.model,
      messages: fullMessages,
      temperature: params?.temperature ?? 0.3,
      max_tokens: params?.maxTokens ?? 2048,
    };

    if (params?.responseFormat === "json") {
      body.response_format = { type: "json_object" };
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://nanosolana.ai",
        "X-OpenRouter-Title": "NanoSolana TamaGObot",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "Unknown error");
      const err = new Error(`OpenRouter API error ${response.status}: ${errText}`);
      this.emit("error", err);
      throw err;
    }

    const data = (await response.json()) as any;
    const choice = data.choices?.[0];

    const aiResponse: AIResponse = {
      content: choice?.message?.content ?? "",
      model: data.model ?? this.model,
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      },
      latencyMs: Date.now() - startTime,
      finishReason: choice?.finish_reason ?? "unknown",
    };

    this.emit("response", aiResponse);
    return aiResponse;
  }

  // ── OODA Integration ────────────────────────────────────────

  /**
   * ORIENT — Analyze market data with the soul's trading philosophy.
   *
   * Takes raw market context (KNOWN/LEARNED/INFERRED) and produces
   * a structured market analysis.
   */
  async orient(context: OODAContext): Promise<string> {
    const prompt = this.buildOrientPrompt(context);

    const response = await this.chat([
      { role: "user", content: prompt },
    ], {
      temperature: 0.2,
      maxTokens: 1024,
    });

    return response.content;
  }

  /**
   * DECIDE — Generate a concrete trade decision.
   *
   * Takes the orient analysis + strategy signal and produces
   * a JSON trade decision.
   */
  async decide(
    context: OODAContext,
    orientAnalysis: string,
  ): Promise<TradeDecision> {
    const prompt = this.buildDecidePrompt(context, orientAnalysis);

    const response = await this.chat([
      { role: "user", content: prompt },
    ], {
      temperature: 0.1,
      maxTokens: 1024,
      responseFormat: "json",
    });

    try {
      return JSON.parse(response.content) as TradeDecision;
    } catch {
      // Fallback if JSON parsing fails
      return {
        action: "hold",
        token: "SOL",
        confidence: 0,
        reasoning: response.content,
        riskAssessment: "Unable to parse structured decision",
        positionSizePct: 0,
        stopLossPct: 8,
        takeProfitPct: 20,
      };
    }
  }

  /**
   * RESEARCH — Deep-dive analysis on a specific token.
   */
  async research(params: {
    tokenSymbol: string;
    tokenMint: string;
    priceData?: string;
    onChainData?: string;
    knownLessons?: string[];
  }): Promise<string> {
    const prompt = `## Research Request: ${params.tokenSymbol}

Mint: ${params.tokenMint}

### Price Data (KNOWN — fresh)
${params.priceData ?? "No fresh price data available."}

### On-Chain Data (KNOWN)
${params.onChainData ?? "No on-chain data available."}

### Relevant Lessons (LEARNED)
${params.knownLessons?.map((l) => `- ${l}`).join("\n") ?? "No prior lessons for this token."}

---

Analyze this token. Structure your response:
1. **Data Quality Assessment** — How fresh/reliable is the data you have?
2. **On-Chain Signal** — What does the chain say? (liquidity, holders, volume)
3. **Momentum Assessment** — RSI/EMA/ATR reading?
4. **Risk Factors** — What could go wrong?
5. **Verdict** — Trade or no trade? If trade, direction + size + stops.

Remember: if data is stale, say so. If you're inferring, mark it as INFERRED.`;

    const response = await this.chat([
      { role: "user", content: prompt },
    ], {
      temperature: 0.3,
      maxTokens: 2048,
    });

    return response.content;
  }

  /**
   * Interactive agent chat (for Telegram, CLI, etc.)
   */
  async agentChat(
    userMessage: string,
    context?: {
      walletBalance?: number;
      recentTrades?: string;
      petMood?: string;
    },
  ): Promise<string> {
    // Build context if provided
    let contextStr = "";
    if (context) {
      contextStr = "\n\n[Current State]\n";
      if (context.walletBalance !== undefined) {
        contextStr += `Wallet: ${context.walletBalance.toFixed(4)} SOL\n`;
      }
      if (context.recentTrades) {
        contextStr += `Recent: ${context.recentTrades}\n`;
      }
      if (context.petMood) {
        contextStr += `Mood: ${context.petMood}\n`;
      }
    }

    // Maintain conversation history
    this.conversationHistory.push({
      role: "user",
      content: userMessage + contextStr,
    });

    // Trim history if too long
    if (this.conversationHistory.length > this.maxHistoryLength) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
    }

    const response = await this.chat(this.conversationHistory, {
      temperature: 0.5,
      maxTokens: 1024,
    });

    // Add assistant response to history
    this.conversationHistory.push({
      role: "assistant",
      content: response.content,
    });

    return response.content;
  }

  // ── Prompt Builders ────────────────────────────────────────

  private buildOrientPrompt(ctx: OODAContext): string {
    const knownAge = ((Date.now() - ctx.known.timestamp) / 1000).toFixed(0);

    return `## OODA ORIENT — Market Analysis

### KNOWN (${knownAge}s old)
Wallet: ${ctx.known.walletBalance.toFixed(4)} SOL
Trending: ${ctx.known.trendingTokens.join(", ") || "none fetched"}

Prices:
${ctx.known.prices.map((p) =>
  `  ${p.symbol}: $${p.price.toFixed(6)} (${p.change24h > 0 ? "+" : ""}${p.change24h.toFixed(1)}%, vol: $${(p.volume24h / 1e6).toFixed(1)}M)`,
).join("\n") || "  No fresh price data."}

### LEARNED (${ctx.learned.totalTrades} trades, ${(ctx.learned.overallWinRate * 100).toFixed(0)}% WR)
${ctx.learned.lessons.map((l) =>
  `  ${l.pattern}: ${(l.winRate * 100).toFixed(0)}% WR over ${l.occurrences} trades → ${l.adjustment}`,
).join("\n") || "  No learned patterns yet."}

### INFERRED
${ctx.inferred.correlations.map((c) => `  - ${c}`).join("\n") || "  No correlations inferred."}
Research gaps: ${ctx.inferred.researchGaps.join("; ") || "none"}

### STRATEGY SIGNAL
RSI: ${ctx.strategy.rsi.toFixed(1)} | EMA Fast: ${ctx.strategy.emaFast.toFixed(4)} | EMA Slow: ${ctx.strategy.emaSlow.toFixed(4)} | ATR: ${ctx.strategy.atr.toFixed(6)}
Signal: ${ctx.strategy.signalType.toUpperCase()} (${(ctx.strategy.confidence * 100).toFixed(0)}% confidence)

### PET STATE
${ctx.pet.stage} | ${ctx.pet.mood} | streak: ${ctx.pet.streak > 0 ? "+" : ""}${ctx.pet.streak} | level ${ctx.pet.level}

---

Analyze this market context. Be terse. Identify:
1. What the data actually tells you (vs what's noise)
2. Whether the strategy signal is supported by KNOWN data
3. Whether LEARNED patterns confirm or contradict the signal
4. Key risk factors
5. Data freshness — flag anything stale`;
  }

  private buildDecidePrompt(ctx: OODAContext, orientAnalysis: string): string {
    return `## OODA DECIDE — Trade Decision

### Your Orient Analysis:
${orientAnalysis}

### Strategy Signal: ${ctx.strategy.signalType.toUpperCase()} (${(ctx.strategy.confidence * 100).toFixed(0)}%)
Wallet: ${ctx.known.walletBalance.toFixed(4)} SOL

---

Based on your analysis, make a concrete trade decision.

Respond with ONLY a JSON object:
{
  "action": "buy" | "sell" | "hold",
  "token": "token symbol",
  "confidence": 0.0 to 1.0,
  "reasoning": "one sentence",
  "riskAssessment": "one sentence",
  "positionSizePct": 1 to 20,
  "stopLossPct": 3 to 15,
  "takeProfitPct": 5 to 50
}

Rules:
- If data is stale (> 60s), hold.
- If LEARNED patterns show < 30% WR on this token, hold.
- Never risk more than 10% of wallet on a single trade.
- If confidence < 0.5, hold.
- Kelly Criterion is a ceiling, not a target.`;
  }

  // ── Accessors ────────────────────────────────────────────

  getModel(): string {
    return this.model;
  }

  setModel(model: string): void {
    this.model = model;
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }

  getHistoryLength(): number {
    return this.conversationHistory.length;
  }
}
