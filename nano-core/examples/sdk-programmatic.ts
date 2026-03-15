/**
 * NanoSolana — SDK Programmatic Usage
 *
 * Use NanoSolana modules individually in your own applications.
 * No CLI required — pure library usage.
 *
 * Usage:
 *   npx tsx examples/sdk-programmatic.ts
 */

import {
  // Config & Security
  loadConfig,
  encrypt,
  decrypt,
  type NanoConfig,

  // Wallet
  NanoWallet,
  type WalletInfo,

  // Trading
  TradingEngine,
  BirdeyeClient,
  HeliusClient,
  JupiterClient,
  type TradeSignal,
  type TokenPrice,

  // Memory
  ClawVault,
  type VaultEntry,

  // Strategy
  StrategyEngine,
  calculateRSI,
  calculateEMA,

  // Pet
  TamaGOchi,
  STAGE_EMOJI,
  MOOD_EMOJI,

  // Gateway
  NanoGateway,

  // Knowledge
  getNanoKnowledgeSummary,
} from "nanosolana";

// ── Example 1: Direct Birdeye API Access ────────────────────

async function getBirdeyePrices() {
  const config = loadConfig();
  const birdeye = new BirdeyeClient(config.birdeye.apiKey, config.birdeye.wssUrl);

  // Get SOL price
  const solPrice = await birdeye.getTokenPrice("So11111111111111111111111111111111111111112");
  if (solPrice) {
    console.log(`SOL: $${solPrice.price.toFixed(2)} (${solPrice.priceChange24h > 0 ? "+" : ""}${solPrice.priceChange24h.toFixed(1)}%)`);
  }

  // Get trending tokens
  const trending = await birdeye.getTrendingTokens(5);
  console.log("\nTop 5 Trending:");
  for (const token of trending) {
    console.log(`  ${token.symbol}: $${token.price.toFixed(6)} | Vol: $${(token.volume24h / 1e6).toFixed(1)}M`);
  }
}

// ── Example 2: Memory Without Trading ───────────────────────

function useMemoryStandalone() {
  const vault = new ClawVault();

  // Store different knowledge tiers
  vault.storeKnown({
    content: "SOL is at $142.50",
    source: "birdeye",
    tags: ["SOL", "price"],
  });

  vault.storeKnown({
    content: "Volume spike on BONK: 3x normal",
    source: "birdeye",
    tags: ["BONK", "volume"],
  });

  // Search memory
  const results = vault.search("SOL", 5);
  console.log(`\nMemory search for "SOL": ${results.length} results`);

  // Get stats
  const stats = vault.getStats();
  console.log(`ClawVault: ${stats.known}K/${stats.learned}L/${stats.inferred}I`);
}

// ── Example 3: Pet Without Trading ──────────────────────────

function usePetStandalone() {
  const pet = new TamaGOchi("Lobsty");

  console.log(`\nPet: ${STAGE_EMOJI[pet.getState().stage]} ${pet.getState().name}`);
  console.log(`Mood: ${MOOD_EMOJI[pet.getState().mood]} ${pet.getState().mood}`);
  console.log(`Level: ${pet.getState().level}`);

  // Feed the pet
  pet.feed(0.5);
  console.log(`Fed! Mood: ${MOOD_EMOJI[pet.getState().mood]}`);
}

// ── Example 4: Encrypt/Decrypt Secrets ──────────────────────

function securityExample() {
  const secret = "my-super-secret-api-key";
  const password = "vault-password";

  const encrypted = encrypt(secret, password);
  console.log(`\nEncrypted: ${encrypted.slice(0, 20)}...`);

  const decrypted = decrypt(encrypted, password);
  console.log(`Decrypted: ${decrypted}`);
  console.log(`Match: ${secret === decrypted ? "✅" : "❌"}`);
}

// ── Run All ─────────────────────────────────────────────────

async function main() {
  console.log("🦞 NanoSolana SDK — Programmatic Usage Examples\n");
  console.log("=" .repeat(50));

  console.log("\n📊 Example 1: Birdeye Prices");
  try {
    await getBirdeyePrices();
  } catch {
    console.log("  (skipped — no API keys configured)");
  }

  console.log("\n🧠 Example 2: Memory (Standalone)");
  useMemoryStandalone();

  console.log("\n🐾 Example 3: Pet (Standalone)");
  usePetStandalone();

  console.log("\n🔐 Example 4: Encryption");
  securityExample();

  console.log("\n" + "=".repeat(50));
  console.log("✅ All examples complete!\n");
}

main().catch(console.error);
