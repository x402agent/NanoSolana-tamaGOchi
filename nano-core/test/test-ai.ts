#!/usr/bin/env tsx
/**
 * Quick test: verify OpenRouter + healer-alpha is working
 */
import { AIProvider } from "../src/ai/provider.js";
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(import.meta.dirname ?? ".", "../.env") });

const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
  console.error("OPENROUTER_API_KEY not set");
  process.exit(1);
}

const ai = new AIProvider({
  apiKey,
  model: process.env.OPENROUTER_MODEL ?? "openrouter/healer-alpha",
});

console.log("🧪 Testing OpenRouter / healer-alpha...\n");
console.log(`Model: ${ai.getModel()}`);
console.log("─".repeat(50));

// Test 1: Simple agent chat
console.log("\n📝 Test 1: Agent identity");
const resp = await ai.agentChat(
  "Who are you? Respond in 2 sentences max.",
  { walletBalance: 0.5, petMood: "neutral" },
);
console.log(`Response: ${resp}\n`);

// Test 2: Orient with mock data
console.log("📊 Test 2: OODA Orient");
const orientResult = await ai.orient({
  known: {
    prices: [
      { symbol: "SOL", price: 142.50, change24h: 3.2, volume24h: 1_200_000_000 },
      { symbol: "BONK", price: 0.0000245, change24h: -5.1, volume24h: 85_000_000 },
    ],
    walletBalance: 0.5,
    trendingTokens: ["SOL", "JUP", "BONK"],
    timestamp: Date.now(),
  },
  learned: {
    lessons: [
      { pattern: "long on SOL", winRate: 0.62, occurrences: 8, adjustment: "Continue — momentum reliable" },
    ],
    totalTrades: 12,
    overallWinRate: 0.58,
  },
  inferred: {
    correlations: ["SOL tends to follow BTC with 2h lag"],
    researchGaps: [],
  },
  strategy: {
    rsi: 42,
    emaFast: 140.2,
    emaSlow: 138.8,
    atr: 3.5,
    signalType: "long",
    confidence: 0.65,
  },
  pet: {
    stage: "juvenile",
    mood: "happy",
    streak: 2,
    level: 3,
  },
});
console.log(`Orient:\n${orientResult}\n`);

// Test 3: Decide
console.log("🎯 Test 3: OODA Decide");
const decision = await ai.decide(
  {
    known: {
      prices: [{ symbol: "SOL", price: 142.50, change24h: 3.2, volume24h: 1_200_000_000 }],
      walletBalance: 0.5,
      trendingTokens: ["SOL"],
      timestamp: Date.now(),
    },
    learned: {
      lessons: [{ pattern: "long on SOL", winRate: 0.62, occurrences: 8, adjustment: "Continue" }],
      totalTrades: 12,
      overallWinRate: 0.58,
    },
    inferred: { correlations: [], researchGaps: [] },
    strategy: { rsi: 42, emaFast: 140.2, emaSlow: 138.8, atr: 3.5, signalType: "long", confidence: 0.65 },
    pet: { stage: "juvenile", mood: "happy", streak: 2, level: 3 },
  },
  orientResult,
);
console.log("Decision:", JSON.stringify(decision, null, 2));

console.log("\n✅ All tests passed!");
