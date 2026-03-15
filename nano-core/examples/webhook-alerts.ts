/**
 * NanoSolana — Webhook Alerts Example
 *
 * Set up a simple webhook server that receives NanoSolana trading signals
 * and forwards them to Discord, Slack, or any HTTP endpoint.
 *
 * Usage:
 *   npx tsx examples/webhook-alerts.ts
 */

import { NanoWallet, TradingEngine, loadConfig, type TradeSignal } from "nanosolana";

// Webhook configuration
const WEBHOOK_URLS = {
  discord: process.env.DISCORD_WEBHOOK_URL,
  slack: process.env.SLACK_WEBHOOK_URL,
  custom: process.env.CUSTOM_WEBHOOK_URL,
};

async function sendWebhook(url: string, signal: TradeSignal) {
  const icon = signal.type === "buy" ? "🟢" : signal.type === "sell" ? "🔴" : "⚪";
  const confidence = (signal.confidence * 100).toFixed(0);

  // Discord format
  const discordPayload = {
    embeds: [{
      title: `${icon} ${signal.type.toUpperCase()} Signal — ${signal.symbol}`,
      description: signal.reasoning,
      color: signal.type === "buy" ? 0x14F195 : signal.type === "sell" ? 0xFF4444 : 0x888888,
      fields: [
        { name: "Confidence", value: `${confidence}%`, inline: true },
        { name: "Source", value: signal.source, inline: true },
        { name: "Mint", value: `\`${signal.mint.slice(0, 8)}...${signal.mint.slice(-8)}\``, inline: true },
      ],
      footer: { text: "NanoSolana OODA Trading Engine" },
      timestamp: new Date(signal.timestamp).toISOString(),
    }],
  };

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discordPayload),
    });
    console.log(`  📤 Webhook sent to ${new URL(url).hostname}`);
  } catch (err) {
    console.error(`  ❌ Webhook failed: ${(err as Error).message}`);
  }
}

async function main() {
  console.log("🦞 NanoSolana — Webhook Alerts\n");

  const config = loadConfig();
  const wallet = new NanoWallet("alert-agent");
  await wallet.birth();

  const engine = new TradingEngine(config, wallet);
  await engine.start();

  console.log("🔁 OODA loop active — listening for signals...\n");

  engine.on("signal", async (signal) => {
    const icon = signal.type === "buy" ? "🟢" : signal.type === "sell" ? "🔴" : "⚪";
    console.log(`${icon} ${signal.type.toUpperCase()} ${signal.symbol} (${(signal.confidence * 100).toFixed(0)}%)`);
    console.log(`  ${signal.reasoning}`);

    // Forward to all configured webhooks
    for (const [name, url] of Object.entries(WEBHOOK_URLS)) {
      if (url) {
        await sendWebhook(url, signal);
      }
    }
    console.log();
  });

  // Graceful shutdown
  process.on("SIGINT", () => {
    engine.stop();
    console.log("\n✅ Stopped.");
    process.exit(0);
  });

  await new Promise(() => {});
}

main().catch(console.error);
