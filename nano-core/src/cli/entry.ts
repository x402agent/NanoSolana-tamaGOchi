#!/usr/bin/env node

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║              NANOSOLANA TAMAGOBOT — CLI Entry                     ║
 * ║  A GoBot on Solana · Physical Companion: TamaGOchi               ║
 * ║  By NanoSolana Labs                                               ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 *
 * The `nanosolana` command — one-shot interface for:
 *   - Birthing agents with Solana wallets + TamaGOchi pets
 *   - Starting the OODA trading engine (RSI + EMA + ATR)
 *   - Communicating with nano bots across Tailscale mesh
 *   - ClawVault 3-tier memory (known → learned → inferred)
 *   - TamaGOchi pet whose mood/evolution is driven by trades
 */

import { Command } from "commander";
import chalk from "chalk";
import { loadConfig, saveSecrets, loadSecrets, redactConfig, ensureNanoHome } from "../config/vault.js";
import { NanoWallet } from "../wallet/manager.js";
import { TradingEngine } from "../trading/engine.js";
import { ClawVault } from "../memory/clawvault.js";
import { NanoGateway } from "../gateway/server.js";
import { TamaGOchi, STAGE_EMOJI, MOOD_EMOJI } from "../pet/tamagochi.js";
import { TailscaleDiscovery, TmuxManager, NanoNetworkClient } from "../network/mesh.js";
import { getNanoKnowledgeSnapshot, getNanoKnowledgeSummary, searchNanoKnowledge } from "../docs/integration.js";
import { playStartupAnimation, lobsterWalk, animateLobster, printLobster, startDvdScreensaver, createSpinner, runWithSpinner } from "./animations.js";
import { HeliusClient, printWalletSnapshot } from "../onchain/helius-client.js";
import { AgentRegistry, registerOnHeartbeat } from "../registry/agent-registry.js";
import { NanoBotServer } from "../nanobot/server.js";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { createInterface } from "node:readline";

// ── Banner ────────────────────────────────────────────────────

function printBanner(): void {
  console.log(chalk.cyan(`
  ███╗   ██╗ █████╗ ███╗   ██╗ ██████╗ ███████╗ ██████╗ ██╗      █████╗ ███╗   ██╗ █████╗
  ████╗  ██║██╔══██╗████╗  ██║██╔═══██╗██╔════╝██╔═══██╗██║     ██╔══██╗████╗  ██║██╔══██╗
  ██╔██╗ ██║███████║██╔██╗ ██║██║   ██║███████╗██║   ██║██║     ███████║██╔██╗ ██║███████║
  ██║╚██╗██║██╔══██║██║╚██╗██║██║   ██║╚════██║██║   ██║██║     ██╔══██║██║╚██╗██║██╔══██║
  ██║ ╚████║██║  ██║██║ ╚████║╚██████╔╝███████║╚██████╔╝███████╗██║  ██║██║ ╚████║██║  ██║
  ╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝
  `));
  console.log(chalk.white("  🐹 NanoSolana TamaGObot"));
  console.log(chalk.gray("  A GoBot on Solana · Physical Companion: TamaGOchi · By NanoSolana Labs\n"));
}

// ── Helpers ────────────────────────────────────────────────────

async function promptSecret(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(chalk.yellow(`  ${question}: `), (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

// ── CLI Program ────────────────────────────────────────────────

const program = new Command();

program
  .name("nanosolana")
  .description("🦞 NanoSolana — Autonomous Solana trading intelligence with a virtual pet soul")
  .version("1.0.0");

// ── nano init ────────────────────────────────────────────────

program
  .command("init")
  .description("Initialize Nano Solana and configure API keys")
  .action(async () => {
    printBanner();
    console.log(chalk.white.bold("  🔧 Initializing Nano Solana...\n"));

    ensureNanoHome();
    const secrets = loadSecrets();

    // Prompt for API keys
    console.log(chalk.cyan("  ── Helius (Solana RPC) ──────────────────────\n"));
    secrets.HELIUS_RPC_URL = await promptSecret("Helius RPC URL");
    secrets.HELIUS_API_KEY = await promptSecret("Helius API Key");
    secrets.HELIUS_WSS_URL = await promptSecret("Helius WSS URL");

    console.log(chalk.cyan("\n  ── Birdeye (Token Analytics) ────────────────\n"));
    secrets.BIRDEYE_API_KEY = await promptSecret("Birdeye API Key");
    secrets.BIRDEYE_WSS_URL = await promptSecret("Birdeye WSS URL (or press Enter for default)");
    if (!secrets.BIRDEYE_WSS_URL) {
      secrets.BIRDEYE_WSS_URL = "wss://public-api.birdeye.so/socket";
    }

    console.log(chalk.cyan("\n  ── Jupiter (DEX Aggregator) ─────────────────\n"));
    secrets.JUPITER_API_KEY = await promptSecret("Jupiter API Key");

    console.log(chalk.cyan("\n  ── AI Provider ──────────────────────────────\n"));
    secrets.AI_API_KEY = await promptSecret("AI API Key (Gemini/OpenAI)");

    // Save encrypted
    saveSecrets(secrets);

    console.log(chalk.green("\n  ✅ Secrets encrypted and saved to ~/.nanosolana/vault.enc"));
    console.log(chalk.gray("  Keys are AES-256-GCM encrypted at rest.\n"));

    // Create .env template
    const envPath = join(process.cwd(), ".env");
    if (!existsSync(envPath)) {
      const envContent = `# Nano Solana Configuration
NANO_AGENT_NAME=nano-alpha
NANO_GATEWAY_PORT=18790
AI_PROVIDER=gemini
AI_MODEL=gemini-2.5-pro
NANO_LOG_LEVEL=info
`;
      writeFileSync(envPath, envContent);
      console.log(chalk.gray("  Created .env with non-sensitive defaults.\n"));
    }

    console.log(chalk.white("  Run ") + chalk.cyan("nanosolana birth") + chalk.white(" to create your agent."));
    console.log(chalk.white("  Or run ") + chalk.cyan("nanosolana go") + chalk.white(" to do everything at once.\n"));
  });

// ── nano birth ────────────────────────────────────────────────

program
  .command("birth")
  .description("Birth a new nano agent with a Solana wallet")
  .option("-n, --name <name>", "Agent name", "NanoSolana")
  .option("--pet-name <petName>", "TamaGOchi pet name")
  .action(async (opts) => {
    printBanner();
    console.log(chalk.white.bold(`  🌱 Birthing agent "${opts.name}"...\n`));

    try {
      const config = loadConfig();
      const wallet = new NanoWallet(opts.name);
      const info = await wallet.birth();

      // Birth the TamaGOchi pet
      const petName = opts.petName ?? opts.name;
      const pet = new TamaGOchi(petName);
      pet.recordWalletCreated(info.balance);

      console.log(chalk.green("  ✅ Agent birthed successfully!\n"));
      console.log(chalk.white("  Agent Name:    ") + chalk.cyan(opts.name));
      console.log(chalk.white("  Agent ID:      ") + chalk.cyan(wallet.getAgentId()));
      console.log(chalk.white("  Public Key:    ") + chalk.cyan(info.publicKey));
      console.log(chalk.white("  SOL Balance:   ") + chalk.yellow(`${info.balance} SOL`));
      console.log(chalk.white("  Birth Time:    ") + chalk.gray(new Date(info.birthTimestamp).toISOString()));
      console.log(chalk.white("  TamaGOchi:     ") + chalk.cyan(`${STAGE_EMOJI[pet.getState().stage]} ${petName} ${MOOD_EMOJI[pet.getState().mood]}`));

      // Blockchain scan at birth (if Helius configured)
      const birthConfig = loadConfig();
      if (birthConfig.helius?.rpcUrl && birthConfig.helius?.apiKey) {
        try {
          console.log(chalk.cyan("\n  ⛓️  Scanning blockchain..."));
          const helius = new HeliusClient({ rpcUrl: birthConfig.helius.rpcUrl, apiKey: birthConfig.helius.apiKey, wssUrl: birthConfig.helius.wssUrl });
          const snap = await helius.snapshotWallet(info.publicKey);
          printWalletSnapshot(snap, chalk);
        } catch (err) {
          console.log(chalk.gray(`  ⚠️  Blockchain scan skipped: ${(err as Error).message}`));
        }
      }

      console.log(chalk.gray("  Wallet saved to ~/.nanosolana/vault.enc (encrypted)"));
      console.log(chalk.gray("  Pet state saved to ~/.nanosolana/tamagochi.json\n"));
      console.log(chalk.white("  Run ") + chalk.cyan("nanosolana run") + chalk.white(" to start the agent.\n"));
    } catch (err) {
      console.error(chalk.red(`  ❌ Birth failed: ${(err as Error).message}\n`));
      process.exit(1);
    }
  });

// ── nano run ────────────────────────────────────────────────────

program
  .command("run")
  .description("Run the nano agent (gateway + trading + memory)")
  .option("-n, --name <name>", "Agent name", "NanoSolana")
  .option("--pet-name <petName>", "TamaGOchi pet name")
  .option("--no-trade", "Disable trading engine (--no-ooda)")
  .option("--no-gateway", "Disable gateway server")
  .action(async (opts) => {
    printBanner();
    console.log(chalk.white.bold(`  🚀 Starting NanoSolana TamaGObot "${opts.name}"...\n`));

    try {
      const config = loadConfig();

      // 1. Birth wallet
      const wallet = new NanoWallet(opts.name);
      const walletInfo = await wallet.birth();
      wallet.startHeartbeat(config.agent.heartbeatMs);
      console.log(chalk.green(`  ✅ Wallet: ${walletInfo.publicKey.slice(0, 8)}...${walletInfo.publicKey.slice(-8)}`));

      // 2. Birth TamaGOchi pet
      const petName = opts.petName ?? opts.name;
      const pet = new TamaGOchi(petName);
      pet.recordWalletCreated(walletInfo.balance);
      pet.startLifecycle();
      const petState = pet.getState();
      console.log(chalk.green(`  ✅ TamaGOchi: ${STAGE_EMOJI[petState.stage]} ${petName} ${MOOD_EMOJI[petState.mood]} (level ${petState.level})`));

      // 3. Start ClawVault memory
      const vault = new ClawVault();
      vault.startAutonomous();
      const vaultStats = vault.getStats();
      console.log(chalk.green(`  ✅ ClawVault: ${vaultStats.known}K/${vaultStats.learned}L/${vaultStats.inferred}I entries, ${vaultStats.lessons} lessons`));

      // 4. Start trading engine
      const trading = new TradingEngine(config, wallet);
      if (opts.trade !== false) {
        await trading.start();
        console.log(chalk.green("  ✅ Trading engine: ACTIVE (OODA loop)"));
      }

      // Wire trading → ClawVault + TamaGOchi
      trading.on("signal", (signal) => {
        // Store as KNOWN (fresh market data)
        vault.storeKnown({
          content: `Signal: ${signal.type} ${signal.symbol} (${(signal.confidence * 100).toFixed(0)}% confidence)`,
          source: "birdeye",
          tags: [signal.type, signal.symbol],
        });

        // Experience replay before acting
        const replay = vault.experienceReplay({
          tokenSymbol: signal.symbol,
          tradeType: signal.type,
        });

        if (replay.warnings.length > 0) {
          for (const w of replay.warnings) console.log(chalk.red(`  ${w}`));
        }
        if (replay.greenLights.length > 0) {
          for (const g of replay.greenLights) console.log(chalk.green(`  ${g}`));
        }
      });

      trading.on("priceUpdate", (price) => {
        vault.storeKnown({
          content: `${price.symbol}: $${price.price.toFixed(6)} (${price.priceChange24h > 0 ? "+" : ""}${price.priceChange24h.toFixed(1)}%)`,
          source: "birdeye",
          tags: [price.symbol, "price"],
          metadata: { mint: price.mint, volume: price.volume24h },
        });
      });

      // 5. Start gateway
      if (opts.gateway !== false) {
        // Gateway still uses the legacy MemoryEngine interface for now
        const { MemoryEngine } = await import("../memory/engine.js");
        const legacyMemory = new MemoryEngine(config.memory.temporalDecayHours);
        const gateway = new NanoGateway(config, wallet, trading, legacyMemory);
        await gateway.start();
        console.log(chalk.green(`  ✅ Gateway: ws://${config.gateway.host}:${config.gateway.port}`));
      }

      console.log(chalk.cyan("\n  ══════════════════════════════════════════════"));
      console.log(chalk.cyan(`  🐹 ${petName} is alive. Press Ctrl+C to stop.`));
      console.log(chalk.cyan("  ══════════════════════════════════════════════\n"));

      // Heartbeat logs — with pet mood
      wallet.on("heartbeat", (info) => {
        const time = new Date().toLocaleTimeString();
        const mood = MOOD_EMOJI[pet.getState().mood];
        process.stdout.write(chalk.gray(`  [${time}] 💓 ${info.balance.toFixed(4)} SOL ${mood}\r`));
      });

      wallet.on("balanceChange", ({ oldBalance, newBalance }) => {
        const delta = newBalance - oldBalance;
        const color = delta > 0 ? chalk.green : chalk.red;
        console.log(color(`\n  💰 Balance change: ${delta > 0 ? "+" : ""}${delta.toFixed(6)} SOL`));
        if (delta > 0) pet.feed(delta);
      });

      trading.on("signal", (signal) => {
        const icon = signal.type === "buy" ? "🟢" : signal.type === "sell" ? "🔴" : "⚪";
        console.log(`  ${icon} Signal: ${signal.type.toUpperCase()} ${signal.symbol} (${(signal.confidence * 100).toFixed(0)}% confidence)`);
      });

      vault.on("lessonLearned", (lesson) => {
        console.log(chalk.magenta(`  📖 Lesson: ${lesson.pattern} → ${lesson.outcome}`));
      });

      pet.on("evolved", (from, to) => {
        console.log(chalk.yellow(`\n  🐹 EVOLUTION! ${STAGE_EMOJI[from]} ${from} → ${STAGE_EMOJI[to]} ${to}`));
      });

      pet.on("moodChanged", (from, to) => {
        console.log(chalk.gray(`  ${MOOD_EMOJI[to]} Mood: ${from} → ${to}`));
      });

      pet.on("levelUp", (level) => {
        console.log(chalk.yellow(`  ⬆️  Level up! Now level ${level}`));
      });

      // Graceful shutdown
      const shutdown = async () => {
        console.log(chalk.yellow("\n\n  ⏹  Shutting down..."));
        wallet.stopHeartbeat();
        trading.stop();
        vault.stopAutonomous();
        pet.stopLifecycle();
        console.log(chalk.green("  ✅ Agent stopped cleanly.\n"));
        process.exit(0);
      };

      process.on("SIGINT", shutdown);
      process.on("SIGTERM", shutdown);

      // Keep alive
      await new Promise(() => {});
    } catch (err) {
      console.error(chalk.red(`  ❌ Failed to start: ${(err as Error).message}\n`));
      process.exit(1);
    }
  });

// ── nano status ────────────────────────────────────────────────

program
  .command("status")
  .description("Show agent status, wallet, TamaGOchi, and ClawVault stats")
  .action(async () => {
    try {
      const config = loadConfig();
      const wallet = new NanoWallet(config.agent.name);
      await wallet.birth();

      const vault = new ClawVault();
      const vaultStats = vault.getStats();
      const pet = new TamaGOchi(config.agent.name);

      console.log(chalk.cyan("\n  ── NanoSolana TamaGObot Status ───────────────\n"));
      console.log(chalk.white("  Agent:      ") + chalk.cyan(config.agent.name));
      console.log(chalk.white("  Wallet:     ") + chalk.cyan(wallet.getPublicKey()));
      console.log(chalk.white("  Balance:    ") + chalk.yellow(`${wallet.getInfo().balance} SOL`));
      console.log(chalk.white("  TamaGOchi:  ") + chalk.cyan(`${STAGE_EMOJI[pet.getState().stage]} ${pet.getState().name} ${MOOD_EMOJI[pet.getState().mood]}`));
      console.log(chalk.white("  ClawVault:  ") + chalk.gray(`${vaultStats.known}K ${vaultStats.learned}L ${vaultStats.inferred}I | ${vaultStats.lessons} lessons`));
      console.log(chalk.white("  Win Rate:   ") + chalk.green(`${(vaultStats.tradeWinRate * 100).toFixed(1)}%`));
      console.log(chalk.white("  Gateway:    ") + chalk.gray(`${config.gateway.host}:${config.gateway.port}`));

      // Tailscale status
      if (TailscaleDiscovery.isAvailable()) {
        const nodes = TailscaleDiscovery.discoverNodes();
        const online = nodes.filter((n) => n.online);
        console.log(chalk.white("  Tailscale:  ") + chalk.green(`${online.length}/${nodes.length} nodes online`));
      } else {
        console.log(chalk.white("  Tailscale:  ") + chalk.gray("not available"));
      }

      // tmux sessions
      const sessions = TmuxManager.listNanoSessions();
      console.log(chalk.white("  tmux bots:  ") + chalk.gray(`${sessions.length} sessions`));

      console.log();
    } catch (err) {
      console.error(chalk.red(`  ❌ ${(err as Error).message}\n`));
    }
  });

// ── nano pet ────────────────────────────────────────────────

program
  .command("pet")
  .description("Show TamaGOchi pet status")
  .action(() => {
    try {
      const config = loadConfig();
      const pet = new TamaGOchi(config.agent.name);
      console.log();
      console.log(pet.getStatusDisplay().split("\n").map((l) => `  ${l}`).join("\n"));
      console.log();
    } catch (err) {
      console.error(chalk.red(`  ❌ ${(err as Error).message}\n`));
    }
  });

// ── nano send ────────────────────────────────────────────────

program
  .command("send")
  .description("One-shot: send a message to nano bots across the mesh")
  .argument("<message>", "Message to send")
  .option("-t, --target <hostname>", "Target specific node (default: broadcast)")
  .action(async (message, opts) => {
    try {
      const config = loadConfig();
      const gatewaySecret = config.gateway.secret ?? "";

      if (!TailscaleDiscovery.isAvailable()) {
        console.log(chalk.yellow("  ⚠️  Tailscale not available. Sending to local gateway only.\n"));

        // Connect to local gateway
        const client = new NanoNetworkClient(gatewaySecret);
        const localNode = { hostname: "localhost", ip: "127.0.0.1", online: true, os: process.platform, tailscaleId: "local", lastSeen: Date.now(), gatewayPort: config.gateway.port };
        await client.connectToNode(localNode, config.agent.name);
        client.sendToNode("localhost", message, config.agent.name);
        console.log(chalk.green(`  ✅ Sent to local gateway\n`));
        client.disconnectAll();
        return;
      }

      const nodes = TailscaleDiscovery.discoverNodes().filter((n) => n.online);
      const client = new NanoNetworkClient(gatewaySecret);

      if (opts.target) {
        const target = nodes.find((n) => n.hostname === opts.target);
        if (!target) {
          console.log(chalk.red(`  ❌ Node "${opts.target}" not found.\n`));
          process.exit(1);
        }

        const connected = await client.connectToNode(target, config.agent.name);
        if (connected) {
          client.sendToNode(target.hostname, message, config.agent.name);
          console.log(chalk.green(`  ✅ Sent to ${target.hostname}\n`));
        } else {
          console.log(chalk.red(`  ❌ Could not connect to ${target.hostname}\n`));
        }
      } else {
        // Broadcast to all online nodes
        let connected = 0;
        for (const node of nodes) {
          const ok = await client.connectToNode(node, config.agent.name);
          if (ok) connected++;
        }

        const sent = client.broadcastToAll(message, config.agent.name);
        console.log(chalk.green(`  ✅ Broadcasted to ${sent}/${connected} nodes\n`));
      }

      client.disconnectAll();
    } catch (err) {
      console.error(chalk.red(`  ❌ ${(err as Error).message}\n`));
    }
  });

// ── nano bots ────────────────────────────────────────────────

program
  .command("bots")
  .description("Manage nano bots (tmux sessions)")
  .addCommand(
    new Command("list")
      .description("List running nano bot sessions")
      .action(() => {
        const sessions = TmuxManager.listNanoSessions();
        if (sessions.length === 0) {
          console.log(chalk.gray("\n  No nano bot sessions running.\n"));
          return;
        }

        console.log(chalk.cyan("\n  ── Nano Bots ────────────────────────────────\n"));
        for (const s of sessions) {
          const status = s.attached ? chalk.green("attached") : chalk.gray("detached");
          console.log(`  ${chalk.white(s.name)}  ${status}  (${s.windows} windows)`);
        }
        console.log();
      }),
  )
  .addCommand(
    new Command("spawn")
      .description("Spawn a new nano bot in a tmux session")
      .argument("<name>", "Bot name")
      .action((name) => {
        const ok = TmuxManager.createSession(name, `nanosolana run --name ${name}`);
        if (ok) {
          console.log(chalk.green(`\n  ✅ Spawned nano bot "${name}" in tmux session "nano-${name}"\n`));
        } else {
          console.log(chalk.red(`\n  ❌ Failed to spawn bot "${name}"\n`));
        }
      }),
  )
  .addCommand(
    new Command("attach")
      .description("Attach to a nano bot session")
      .argument("<name>", "Bot name")
      .action((name) => {
        const sessionName = name.startsWith("nano-") ? name : `nano-${name}`;
        TmuxManager.attachSession(sessionName);
      }),
  )
  .addCommand(
    new Command("kill")
      .description("Kill a nano bot session")
      .argument("<name>", "Bot name")
      .action((name) => {
        const sessionName = name.startsWith("nano-") ? name : `nano-${name}`;
        const ok = TmuxManager.killSession(sessionName);
        if (ok) {
          console.log(chalk.green(`\n  ✅ Killed bot "${sessionName}"\n`));
        } else {
          console.log(chalk.red(`\n  ❌ Failed to kill bot "${sessionName}"\n`));
        }
      }),
  );

// ── nano nodes ────────────────────────────────────────────────

program
  .command("nodes")
  .description("List Tailscale nodes in the nano network")
  .action(() => {
    if (!TailscaleDiscovery.isAvailable()) {
      console.log(chalk.yellow("\n  ⚠️  Tailscale is not installed or not connected.\n"));
      return;
    }

    const nodes = TailscaleDiscovery.discoverNodes();
    console.log(chalk.cyan("\n  ── Nano Network Nodes ───────────────────────\n"));

    for (const node of nodes) {
      const status = node.online ? chalk.green("● online") : chalk.red("○ offline");
      console.log(`  ${status}  ${chalk.white(node.hostname)}  ${chalk.gray(node.ip)}  ${chalk.gray(node.os)}`);
    }
    console.log();
  });

// ── nano config ────────────────────────────────────────────────

program
  .command("config")
  .description("Show current configuration (redacted)")
  .action(() => {
    try {
      const config = loadConfig();
      const redacted = redactConfig(config);
      console.log(chalk.cyan("\n  ── Nano Solana Config ────────────────────────\n"));
      console.log(JSON.stringify(redacted, null, 2).split("\n").map((l) => `  ${l}`).join("\n"));
      console.log();
    } catch (err) {
      console.error(chalk.red(`  ❌ ${(err as Error).message}\n`));
    }
  });

// ── nano vault (ClawVault memory) ────────────────────────────

program
  .command("vault")
  .description("Query the ClawVault memory (known → learned → inferred)")
  .argument("[query]", "Search query")
  .action(async (query) => {
    const vault = new ClawVault();
    const stats = vault.getStats();

    console.log(chalk.cyan("\n  ── ClawVault (3-tier epistemological memory) ──\n"));
    console.log(chalk.white("  KNOWN:     ") + chalk.green(`${stats.known}`) + chalk.gray(" (fresh API data, expires in ~60s)"));
    console.log(chalk.white("  LEARNED:   ") + chalk.blue(`${stats.learned}`) + chalk.gray(" (trade-derived patterns)"));
    console.log(chalk.white("  INFERRED:  ") + chalk.magenta(`${stats.inferred}`) + chalk.gray(" (correlations, held loosely)"));
    console.log(chalk.white("  Inbox:     ") + chalk.gray(`${stats.inbox} (pending reflection)`));
    console.log(chalk.white("  Trades:    ") + chalk.gray(`${stats.trades}`));
    console.log(chalk.white("  Lessons:   ") + chalk.gray(`${stats.lessons}`));
    console.log(chalk.white("  Win Rate:  ") + chalk.green(`${(stats.tradeWinRate * 100).toFixed(1)}%`));
    console.log(chalk.white("  Research:  ") + chalk.gray(`${stats.researchGaps} open gaps`));

    if (query) {
      const results = vault.search(query, 5);
      console.log(chalk.cyan(`\n  ── Search: "${query}" ────────────────────────\n`));

      if (results.length === 0) {
        console.log(chalk.gray("  No matching entries.\n"));
      } else {
        for (const entry of results) {
          const tierColor = entry.tier === "known" ? chalk.green : entry.tier === "learned" ? chalk.blue : chalk.magenta;
          console.log(`  ${tierColor(`[${entry.tier.toUpperCase()}]`)} ${chalk.gray(entry.content.slice(0, 80))}`);
        }
      }
    }

    const lessons = vault.getLessons();
    if (lessons.length > 0) {
      console.log(chalk.cyan("\n  ── Lessons Learned ──────────────────────────\n"));
      for (const lesson of lessons.slice(-5)) {
        const icon = lesson.confidenceImpact > 0 ? "✅" : "⚠️";
        const tierTag = lesson.tier === "learned" ? chalk.blue("[L]") : chalk.magenta("[I]");
        console.log(`  ${icon} ${tierTag} ${chalk.white(lesson.pattern)} → ${chalk.gray(lesson.adjustment)}`);
      }
    }

    const gaps = vault.getResearchAgenda();
    if (gaps.length > 0) {
      console.log(chalk.cyan("\n  ── Research Agenda ──────────────────────────\n"));
      for (const gap of gaps.slice(-3)) {
        console.log(`  🔬 ${chalk.gray(gap.question)}`);
      }
    }

    console.log();
  });

// ── nano docs ───────────────────────────────────────────────

program
  .command("docs")
  .description("Inspect integrated docs + extension knowledge corpus")
  .argument("[query]", "Optional query to search docs/extensions")
  .option("-l, --limit <n>", "Maximum search results", "10")
  .option("--refresh", "Refresh the snapshot cache before reading")
  .option("--json", "Emit machine-readable JSON")
  .action((query, opts) => {
    try {
      const refresh = Boolean(opts.refresh);
      const limit = parsePositiveInteger(opts.limit as string | undefined, 10);

      const snapshot = getNanoKnowledgeSnapshot({ refresh });
      const summary = getNanoKnowledgeSummary(snapshot);
      const matches = query
        ? searchNanoKnowledge(snapshot, String(query), limit)
        : [];

      if (opts.json) {
        const payload = {
          summary,
          docs: snapshot.docs.areas.map((area) => ({
            area: area.area,
            path: area.path,
            files: area.files,
            markdownFiles: area.markdownFiles,
            bytes: area.bytes,
            indexedEntries: area.entries.length,
            updatedAt: area.updatedAt,
          })),
          extensions: {
            directories: snapshot.extensions.directories,
            files: snapshot.extensions.files,
            manifests: snapshot.extensions.manifests,
            indexedEntries: snapshot.extensions.entries.length,
          },
          search: query
            ? {
                query,
                limit,
                matches,
              }
            : undefined,
        };

        console.log(JSON.stringify(payload, null, 2));
        return;
      }

      console.log(chalk.cyan("\n  ── NanoSolana Knowledge Integration ──────────\n"));
      console.log(chalk.white("  Generated:  ") + chalk.gray(new Date(summary.generatedAt).toISOString()));
      console.log(chalk.white("  Docs:       ") + chalk.green(`${summary.docs.files} files`) + chalk.gray(` (${summary.docs.markdownFiles} markdown, ${formatBytes(summary.docs.bytes)})`));
      console.log(chalk.white("  Extensions: ") + chalk.green(`${summary.extensions.directories} directories`) + chalk.gray(` (${summary.extensions.files} files, ${summary.extensions.manifests} manifests)`));

      console.log(chalk.cyan("\n  ── Docs Areas ───────────────────────────────\n"));
      for (const area of snapshot.docs.areas) {
        const updated = area.updatedAt
          ? new Date(area.updatedAt).toISOString()
          : "n/a";
        console.log(
          `  ${chalk.white(area.path.padEnd(18))} ${chalk.green(String(area.files).padStart(4))} files  ${chalk.gray(`(${area.markdownFiles} md, ${formatBytes(area.bytes)}, updated ${updated})`)}`,
        );
      }

      if (query) {
        console.log(chalk.cyan(`\n  ── Search: "${query}" ───────────────────────\n`));

        if (matches.length === 0) {
          console.log(chalk.gray("  No matches found."));
        } else {
          for (const match of matches) {
            const typeTag = match.type === "doc"
              ? chalk.blue("[DOC]")
              : chalk.magenta("[EXT]");

            console.log(`  ${typeTag} ${chalk.white(match.title)}`);
            console.log(`       ${chalk.gray(match.path)}${match.subtitle ? chalk.gray(` — ${match.subtitle}`) : ""}`);
          }
        }
      }

      console.log();
    } catch (err) {
      console.error(chalk.red(`  ❌ ${(err as Error).message}\n`));
      process.exit(1);
    }
  });

// ── nanosolana go (one-shot everything) ──────────────────────

program
  .command("go")
  .description("One-shot: init + birth + wallet + run — everything in one command")
  .option("-n, --name <name>", "Agent name", "NanoSolana")
  .option("--pet-name <petName>", "TamaGOchi pet name")
  .option("--skip-init", "Skip API key prompts if already configured")
  .action(async (opts) => {
    printBanner();
    await animateLobster(1800);
    console.log();

    try {
      // Phase 1: Init (ensure home + check config)
      await lobsterWalk("Phase 1 — Initialization");
      ensureNanoHome();
      const secrets = loadSecrets();
      const needsInit = !opts.skipInit && (!secrets.HELIUS_RPC_URL || !secrets.AI_API_KEY);

      if (needsInit) {
        console.log(chalk.yellow("\n  First run detected — let's configure your API keys.\n"));
        console.log(chalk.cyan("  ── Required Keys ────────────────────────────\n"));

        if (!secrets.AI_API_KEY) {
          secrets.AI_API_KEY = await promptSecret("OpenRouter API Key (sk-or-v1-...)");
        }
        if (!secrets.HELIUS_RPC_URL) {
          secrets.HELIUS_RPC_URL = await promptSecret("Helius RPC URL");
        }
        if (!secrets.HELIUS_API_KEY) {
          secrets.HELIUS_API_KEY = await promptSecret("Helius API Key");
        }

        console.log(chalk.cyan("\n  ── Optional Keys (press Enter to skip) ──────\n"));
        if (!secrets.HELIUS_WSS_URL) {
          const wss = await promptSecret("Helius WSS URL");
          if (wss) secrets.HELIUS_WSS_URL = wss;
        }
        if (!secrets.BIRDEYE_API_KEY) {
          const bk = await promptSecret("Birdeye API Key");
          if (bk) secrets.BIRDEYE_API_KEY = bk;
        }
        if (!secrets.JUPITER_API_KEY) {
          const jk = await promptSecret("Jupiter API Key");
          if (jk) secrets.JUPITER_API_KEY = jk;
        }

        saveSecrets(secrets);
        console.log(chalk.green("\n  ✓ Secrets encrypted → ~/.nanosolana/vault.enc\n"));
      } else {
        console.log(chalk.green("  ✓ Configuration found — skipping init\n"));
      }

      // Phase 2: Birth agent + wallet
      await lobsterWalk("Phase 2 — Birthing Agent");
      console.log();
      await playStartupAnimation();

      const config = loadConfig();
      const wallet = new NanoWallet(opts.name);
      const walletInfo = await wallet.birth();
      wallet.startHeartbeat(config.agent.heartbeatMs);

      console.log();
      console.log(chalk.green("  ✓ Wallet created"));
      console.log(chalk.white("    Public Key: ") + chalk.cyan(walletInfo.publicKey));
      console.log(chalk.white("    Balance:    ") + chalk.yellow(`${walletInfo.balance} SOL`));

      // Phase 3: TamaGOchi pet
      const petName = opts.petName ?? opts.name;
      const pet = new TamaGOchi(petName);
      pet.recordWalletCreated(walletInfo.balance);
      pet.startLifecycle();
      const petState = pet.getState();
      console.log(
        chalk.green("  ✓ TamaGOchi hatched: ") +
          chalk.cyan(`${STAGE_EMOJI[petState.stage]} ${petName} ${MOOD_EMOJI[petState.mood]}`),
      );

      // Phase 4: Memory
      const vault = new ClawVault();
      vault.startAutonomous();
      const stats = vault.getStats();
      console.log(chalk.green("  ✓ ClawVault online: ") + chalk.gray(`${stats.known}K/${stats.learned}L/${stats.inferred}I`));

      // Phase 5: Trading
      const trading = new TradingEngine(config, wallet);
      await trading.start();
      console.log(chalk.green("  ✓ OODA trading loop active"));

      // Wire events
      trading.on("signal", (signal) => {
        vault.storeKnown({
          content: `Signal: ${signal.type} ${signal.symbol} (${(signal.confidence * 100).toFixed(0)}%)`,
          source: "birdeye",
          tags: [signal.type, signal.symbol],
        });
      });

      // Phase 5.5: Blockchain Scan (if Helius configured)
      if (config.helius?.rpcUrl && config.helius?.apiKey) {
        try {
          const helius = new HeliusClient({ rpcUrl: config.helius.rpcUrl, apiKey: config.helius.apiKey, wssUrl: config.helius.wssUrl });
          const snap = await helius.snapshotWallet(walletInfo.publicKey);
          printWalletSnapshot(snap, chalk);
        } catch (err) {
          console.log(chalk.gray(`  ⚠️  Blockchain scan skipped: ${(err as Error).message}`));
        }
      }

      // Phase 5.6: Auto-register on-chain (devnet NFT)
      try {
        const skills = ["ooda-trading", "solana-rpc", "jupiter-swaps", "helius-das"];
        const regResult = await registerOnHeartbeat(wallet.getKeypair(), "0.1.0", skills, (msg) => console.log(msg));
        if (regResult) {
          console.log(chalk.green(`  ✓ On-chain identity: ${regResult.mintAddress.slice(0, 8)}...`));
        }
      } catch (err) {
        console.log(chalk.gray(`  ⚠️  Auto-registration skipped: ${(err as Error).message}`));
      }

      // Phase 6: Gateway
      const { MemoryEngine } = await import("../memory/engine.js");
      const legacyMemory = new MemoryEngine(config.memory.temporalDecayHours);
      const gateway = new NanoGateway(config, wallet, trading, legacyMemory);
      await gateway.start();
      console.log(chalk.green(`  ✓ Gateway: ws://${config.gateway.host}:${config.gateway.port}`));

      // Success banner
      console.log();
      console.log(chalk.hex("#14F195").bold("  ══════════════════════════════════════════════════════"));
      console.log(chalk.hex("#14F195").bold(`  🦞 ${petName} is LIVE. All systems operational.`));
      console.log(chalk.hex("#14F195").bold("  ══════════════════════════════════════════════════════"));
      console.log();
      console.log(chalk.gray("  Commands while running:"));
      console.log(chalk.gray("    Ctrl+C          — graceful shutdown"));
      console.log(chalk.gray("    nanosolana status  — check agent in another terminal"));
      console.log(chalk.gray("    nanosolana pet     — see your TamaGOchi"));
      console.log();

      // Live events
      wallet.on("heartbeat", (info) => {
        const time = new Date().toLocaleTimeString();
        const mood = MOOD_EMOJI[pet.getState().mood];
        process.stdout.write(chalk.gray(`  [${time}] 💓 ${info.balance.toFixed(4)} SOL ${mood}\r`));
      });

      wallet.on("balanceChange", ({ oldBalance, newBalance }) => {
        const delta = newBalance - oldBalance;
        const color = delta > 0 ? chalk.green : chalk.red;
        console.log(color(`\n  💰 ${delta > 0 ? "+" : ""}${delta.toFixed(6)} SOL`));
        if (delta > 0) pet.feed(delta);
      });

      trading.on("signal", (signal) => {
        const icon = signal.type === "buy" ? "🟢" : signal.type === "sell" ? "🔴" : "⚪";
        console.log(`  ${icon} ${signal.type.toUpperCase()} ${signal.symbol} (${(signal.confidence * 100).toFixed(0)}%)`);
      });

      vault.on("lessonLearned", (lesson) => {
        console.log(chalk.magenta(`  📖 ${lesson.pattern} → ${lesson.outcome}`));
      });

      pet.on("evolved", (from, to) => {
        console.log(chalk.yellow(`\n  🦞 EVOLUTION! ${STAGE_EMOJI[from]} → ${STAGE_EMOJI[to]} ${to}`));
      });

      // Graceful shutdown
      const shutdown = async () => {
        console.log(chalk.yellow("\n\n  ⏹  Shutting down..."));
        wallet.stopHeartbeat();
        trading.stop();
        vault.stopAutonomous();
        pet.stopLifecycle();
        console.log(chalk.green("  ✓ Agent stopped cleanly.\n"));
        process.exit(0);
      };

      process.on("SIGINT", shutdown);
      process.on("SIGTERM", shutdown);

      await new Promise(() => {});
    } catch (err) {
      console.error(chalk.red(`\n  ✗ Failed: ${(err as Error).message}\n`));
      process.exit(1);
    }
  });

// ── nanosolana demo (simulation mode) ───────────────────────

program
  .command("demo")
  .description("🎮 Run a full simulation — no API keys needed. See the OODA loop in action.")
  .option("-d, --duration <seconds>", "Duration in seconds", "60")
  .action(async (opts) => {
    printBanner();
    console.log(chalk.hex("#14F195").bold("  🎮 DEMO MODE — Simulated Trading Intelligence\n"));
    console.log(chalk.gray("  No API keys required. Synthetic market data.\n"));

    const duration = parseInt(opts.duration, 10) || 60;

    // Simulated tokens
    const tokens = [
      { symbol: "SOL", price: 142.50, mint: "So11111111111111111111111111111111111111112" },
      { symbol: "BONK", price: 0.00001823, mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" },
      { symbol: "JTO", price: 3.42, mint: "jtojtomepa8beP8AuQc6eXt5FriJwfFMkLR8wCHQfRH" },
      { symbol: "WIF", price: 1.87, mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm" },
      { symbol: "PYTH", price: 0.38, mint: "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3" },
      { symbol: "RAY", price: 5.12, mint: "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R" },
    ];

    // Create pet
    const pet = new TamaGOchi("DemoBot");
    const petState = pet.getState();
    console.log(chalk.green("  ✓ TamaGOchi:") + chalk.cyan(` ${STAGE_EMOJI[petState.stage]} DemoBot ${MOOD_EMOJI[petState.mood]}`));

    // Create memory
    const vault = new ClawVault();
    vault.startAutonomous();
    console.log(chalk.green("  ✓ ClawVault:") + chalk.gray(" 3-tier memory online"));

    // Simulated wallet
    console.log(chalk.green("  ✓ Wallet:") + chalk.cyan(" 7xKpR3...demo3nYd") + chalk.yellow(" (1.500 SOL)"));

    console.log(chalk.green("  ✓ OODA loop:") + chalk.gray(" simulated (5s interval)"));
    console.log();
    console.log(chalk.hex("#14F195").bold("  ══════════════════════════════════════════════════"));
    console.log(chalk.hex("#14F195").bold("  🦞 DemoBot is LIVE (simulation mode)"));
    console.log(chalk.hex("#14F195").bold("  ══════════════════════════════════════════════════"));
    console.log();

    let cycles = 0;
    const maxCycles = Math.ceil(duration / 5);

    const loop = setInterval(() => {
      cycles++;

      // Simulate price movement
      const token = tokens[Math.floor(Math.random() * tokens.length)];
      const change = (Math.random() - 0.45) * 15; // Slight upward bias
      token.price *= (1 + change / 100);

      const time = new Date().toLocaleTimeString();
      const changeStr = change > 0 ? chalk.green(`+${change.toFixed(1)}%`) : chalk.red(`${change.toFixed(1)}%`);
      console.log(chalk.gray(`  [${time}]`) + ` 📊 ${chalk.white(token.symbol)}: $${token.price < 0.01 ? token.price.toFixed(8) : token.price.toFixed(2)} ${changeStr}`);

      // Store in memory
      vault.storeKnown({
        content: `${token.symbol}: $${token.price.toFixed(6)} (${change > 0 ? "+" : ""}${change.toFixed(1)}%)`,
        source: "birdeye",
        tags: [token.symbol, "price"],
      });

      // Simulate signals on strong moves
      if (Math.abs(change) > 5) {
        const type = change > 0 ? "buy" : "sell";
        const confidence = Math.min(0.95, Math.abs(change) / 20 + 0.4);
        const icon = type === "buy" ? "🟢" : "🔴";

        console.log(`  ${icon} ${chalk.bold(type.toUpperCase())} ${token.symbol} — confidence: ${chalk.cyan(`${(confidence * 100).toFixed(0)}%`)}`);
        console.log(chalk.gray(`     ${type === "buy" ? "Momentum breakout" : "Reversal signal"}: ${change > 0 ? "+" : ""}${change.toFixed(1)}% with simulated volume spike`));

        vault.storeKnown({
          content: `Signal: ${type} ${token.symbol} (${(confidence * 100).toFixed(0)}%)`,
          source: "birdeye",
          tags: [type, token.symbol],
        });

        // Feed pet on buy signals
        if (type === "buy") pet.feed(0.01);
      }

      // Periodic memory stats
      if (cycles % 4 === 0) {
        const stats = vault.getStats();
        const mood = MOOD_EMOJI[pet.getState().mood];
        console.log(chalk.magenta(`  🧠 Memory: ${stats.known}K/${stats.learned}L/${stats.inferred}I | ${mood} ${pet.getState().name}`));
      }

      // End demo
      if (cycles >= maxCycles) {
        clearInterval(loop);
        vault.stopAutonomous();

        const finalStats = vault.getStats();
        console.log();
        console.log(chalk.hex("#14F195").bold("  ══════════════════════════════════════════════════"));
        console.log(chalk.hex("#14F195").bold("  ✅ Demo complete!"));
        console.log(chalk.hex("#14F195").bold("  ══════════════════════════════════════════════════"));
        console.log();
        console.log(chalk.white("  Stats:"));
        console.log(chalk.gray(`    OODA cycles:  ${cycles}`));
        console.log(chalk.gray(`    Memory entries: ${finalStats.known + finalStats.learned + finalStats.inferred}`));
        console.log(chalk.gray(`    Pet mood: ${MOOD_EMOJI[pet.getState().mood]} ${pet.getState().mood}`));
        console.log();
        console.log(chalk.white("  Ready to go live?"));
        console.log(chalk.cyan("    npx nanosolana go"));
        console.log();
        console.log(chalk.gray("  Full docs: https://docs.nanosolana.com"));
        console.log(chalk.gray("  GitHub: https://github.com/x402agent/NanoSolana"));
        console.log();
        process.exit(0);
      }
    }, 5000);

    // Initial cycle immediately
    const firstToken = tokens[0];
    console.log(chalk.gray(`  [${new Date().toLocaleTimeString()}]`) + ` 📊 ${chalk.white(firstToken.symbol)}: $${firstToken.price.toFixed(2)} ${chalk.green("+0.0%")}`);
    console.log(chalk.gray("  Watching 6 tokens across Solana...\n"));

    // Graceful shutdown
    process.on("SIGINT", () => {
      clearInterval(loop);
      vault.stopAutonomous();
      console.log(chalk.yellow("\n\n  ⏹  Demo stopped."));
      console.log(chalk.cyan("  Try the real thing: npx nanosolana go\n"));
      process.exit(0);
    });

    await new Promise(() => {});
  });

// ── nanosolana dvd (screensaver) ────────────────────────────

program
  .command("dvd")
  .description("Floating DVD-style NanoSolana screensaver in the terminal")
  .action(() => {
    const dvd = startDvdScreensaver();

    process.on("SIGINT", () => {
      dvd.stop();
      process.exit(0);
    });
    process.on("SIGTERM", () => {
      dvd.stop();
      process.exit(0);
    });
  });

// ── nanosolana lobster (show mascot) ────────────────────────

program
  .command("lobster")
  .description("Show the animated NanoSolana lobster mascot")
  .option("--static", "Show static version")
  .action(async (opts) => {
    if (opts.static) {
      printLobster();
    } else {
      await animateLobster(5000);
    }
  });

// ── nanosolana scan (blockchain data reader) ────────────────────

program
  .command("scan")
  .description("Scan the Solana blockchain — show wallet, tokens, NFTs, and recent transactions")
  .argument("[address]", "Wallet address to scan (default: agent wallet)")
  .action(async (address?: string) => {
    try {
      const config = loadConfig();
      if (!config.helius?.rpcUrl || !config.helius?.apiKey) {
        console.log(chalk.red("\n  ❌ Helius RPC URL and API key required."));
        console.log(chalk.gray("  Run: nanosolana init\n"));
        process.exit(1);
      }

      const pubkey = address ?? (() => {
        try {
          const wallet = new NanoWallet("NanoSolana");
          // Try loading existing wallet pubkey from file
          const pubPath = join(homedir(), ".nanosolana", "wallet.pub");
          if (existsSync(pubPath)) return readFileSync(pubPath, "utf-8").trim();
          return "";
        } catch { return ""; }
      })();

      if (!pubkey) {
        console.log(chalk.red("\n  ❌ No wallet found. Run: nanosolana birth\n"));
        process.exit(1);
      }

      console.log(chalk.cyan(`\n  🔍 Scanning ${pubkey.slice(0, 8)}...${pubkey.slice(-8)}\n`));

      const helius = new HeliusClient({
        rpcUrl: config.helius.rpcUrl,
        apiKey: config.helius.apiKey,
        wssUrl: config.helius.wssUrl,
      });

      const snap = await helius.snapshotWallet(pubkey);
      printWalletSnapshot(snap, chalk);
    } catch (err) {
      console.error(chalk.red(`  ❌ Scan failed: ${(err as Error).message}\n`));
    }
  });

// ── nanosolana register (on-chain NFT identity) ─────────────────

program
  .command("register")
  .description("Register this agent on-chain with a devnet Metaplex NFT")
  .action(async () => {
    try {
      const config = loadConfig();
      const wallet = new NanoWallet("NanoSolana");
      await wallet.birth();

      const registry = new AgentRegistry();

      // Check if already registered
      if (registry.isRegistered()) {
        const reg = registry.loadRegistration();
        if (reg) {
          console.log(chalk.green("\n  ✅ Already registered on-chain!\n"));
          console.log(chalk.white("  Agent:   ") + chalk.cyan(reg.result.agentPubkey));
          console.log(chalk.white("  Mint:    ") + chalk.cyan(reg.result.mintAddress));
          console.log(chalk.white("  Tx:      ") + chalk.gray(reg.result.txSignature.slice(0, 20) + "..."));
          console.log(chalk.white("  Network: ") + chalk.gray(reg.result.network));
          console.log(chalk.white("  Saved:   ") + chalk.gray(reg.savedAt));
          console.log();
          console.log(chalk.gray(`  Explorer: https://explorer.solana.com/address/${reg.result.mintAddress}?cluster=devnet\n`));
          return;
        }
      }

      console.log(chalk.cyan("\n  ⛓️  Registering agent on-chain (devnet)...\n"));
      const skills = ["ooda-trading", "solana-rpc", "jupiter-swaps", "helius-das", "clawvault-memory"];
      const result = await registry.registerAgent(
        wallet.getKeypair(),
        "0.1.0",
        skills,
        (msg) => console.log(msg),
      );

      console.log(chalk.green("\n  ✅ Agent registered on-chain!\n"));
      console.log(chalk.white("  Mint:         ") + chalk.cyan(result.mintAddress));
      console.log(chalk.white("  Tx:           ") + chalk.gray(result.txSignature.slice(0, 20) + "..."));
      console.log(chalk.white("  Token Acct:   ") + chalk.gray(result.tokenAccount));
      console.log(chalk.white("  Network:      ") + chalk.gray(result.network));
      console.log(chalk.white("  Saved:        ") + chalk.gray("~/.nanosolana/registry/registration.json"));
      console.log();
      console.log(chalk.hex("#FFAA00")(`  Explorer: https://explorer.solana.com/tx/${result.txSignature}?cluster=devnet\n`));
    } catch (err) {
      console.error(chalk.red(`  ❌ Registration failed: ${(err as Error).message}\n`));
    }
  });

// ── nanosolana registry (show registration status) ──────────────

program
  .command("registry")
  .description("Show on-chain agent registration status")
  .action(() => {
    const registry = new AgentRegistry();
    const reg = registry.loadRegistration();

    if (!reg) {
      console.log(chalk.hex("#FFAA00")("\n  ⚠️  No registration found. Run: nanosolana register\n"));
      return;
    }

    console.log(chalk.hex("#14F195")("\n  ⛓️  Agent On-Chain Identity\n"));
    console.log(chalk.white("  Agent:      ") + chalk.cyan(reg.result.agentPubkey));
    console.log(chalk.white("  Mint:       ") + chalk.cyan(reg.result.mintAddress));
    console.log(chalk.white("  Tx:         ") + chalk.gray(reg.result.txSignature.slice(0, 20) + "..."));
    console.log(chalk.white("  Network:    ") + chalk.gray(reg.result.network));
    console.log(chalk.white("  Token Acct: ") + chalk.gray(reg.result.tokenAccount));
    console.log(chalk.white("  Registered: ") + chalk.gray(reg.savedAt));
    console.log(chalk.white("  Name:       ") + chalk.gray(reg.metadata.name));
    console.log(chalk.white("  Skills:     ") + chalk.gray(reg.metadata.skills.join(", ")));
    console.log(chalk.white("  Fingerprint:") + chalk.gray(reg.metadata.fingerprint.slice(0, 16) + "..."));
    console.log();
    console.log(chalk.gray(`  Explorer: https://explorer.solana.com/address/${reg.result.mintAddress}?cluster=devnet\n`));
  });

// ── nanosolana nanobot (interactive UI) ──────────────────────────

program
  .command("nanobot")
  .description("Launch the interactive NanoBot web UI (localhost companion)")
  .option("-p, --port <port>", "Port number", "7777")
  .action(async (opts) => {
    const port = parseInt(opts.port, 10) || 7777;
    console.log(chalk.hex("#14F195")(`\n  🤖 Starting NanoBot on http://127.0.0.1:${port}\n`));

    const server = new NanoBotServer({ port });
    await server.start();

    // Keep alive
    await new Promise(() => {});
  });

// ── Parse & Run ────────────────────────────────────────────────

program.parse();
