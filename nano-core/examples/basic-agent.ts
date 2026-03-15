/**
 * NanoSolana — Basic Agent Example
 *
 * The simplest possible agent: create a wallet, start trading, listen for signals.
 *
 * Usage:
 *   npx tsx examples/basic-agent.ts
 */

import { NanoWallet, TradingEngine, ClawVault, TamaGOchi, loadConfig } from "nanosolana";

async function main() {
  console.log("🦞 Starting basic NanoSolana agent...\n");

  // 1. Load config (reads from ~/.nanosolana/vault.enc)
  const config = loadConfig();

  // 2. Create wallet
  const wallet = new NanoWallet("basic-agent");
  const info = await wallet.birth();
  console.log(`💳 Wallet: ${info.publicKey}`);
  console.log(`💰 Balance: ${info.balance} SOL\n`);

  // 3. Start memory
  const memory = new ClawVault();
  memory.startAutonomous();
  console.log("🧠 ClawVault memory online");

  // 4. Hatch pet
  const pet = new TamaGOchi("BasicBot");
  pet.startLifecycle();
  console.log(`🐾 TamaGOchi: ${pet.getStatusDisplay()}\n`);

  // 5. Start trading engine
  const engine = new TradingEngine(config, wallet);
  await engine.start();
  console.log("🔁 OODA trading loop active\n");

  // 6. Listen for events
  engine.on("signal", (signal) => {
    const icon = signal.type === "buy" ? "🟢" : signal.type === "sell" ? "🔴" : "⚪";
    console.log(`${icon} Signal: ${signal.type.toUpperCase()} ${signal.symbol} (${(signal.confidence * 100).toFixed(0)}%)`);

    // Store in memory
    memory.storeKnown({
      content: `Signal: ${signal.type} ${signal.symbol}`,
      source: "birdeye",
      tags: [signal.type, signal.symbol],
    });
  });

  engine.on("priceUpdate", (price) => {
    console.log(`📊 ${price.symbol}: $${price.price.toFixed(4)} (${price.priceChange24h > 0 ? "+" : ""}${price.priceChange24h.toFixed(1)}%)`);
  });

  memory.on("lessonLearned", (lesson) => {
    console.log(`📖 Lesson: ${lesson.pattern} → ${lesson.outcome}`);
  });

  // Keep alive
  console.log("Press Ctrl+C to stop.\n");
  process.on("SIGINT", () => {
    engine.stop();
    memory.stopAutonomous();
    pet.stopLifecycle();
    console.log("\n✅ Agent stopped cleanly.");
    process.exit(0);
  });

  await new Promise(() => {});
}

main().catch(console.error);
