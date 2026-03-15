/**
 * NanoSolana — Multi-Agent Mesh Example
 *
 * Spawn multiple agents that coordinate via Tailscale mesh networking.
 * Agents share signals and learned patterns but never share private keys.
 *
 * Usage:
 *   npx tsx examples/multi-agent-mesh.ts
 */

import {
  NanoWallet,
  TradingEngine,
  ClawVault,
  TamaGOchi,
  NanoNetworkClient,
  TailscaleDiscovery,
  loadConfig,
} from "nanosolana";

interface AgentInstance {
  name: string;
  wallet: NanoWallet;
  engine: TradingEngine;
  memory: ClawVault;
  pet: TamaGOchi;
}

async function spawnAgent(name: string, config: any): Promise<AgentInstance> {
  const wallet = new NanoWallet(name);
  await wallet.birth();

  const memory = new ClawVault();
  memory.startAutonomous();

  const pet = new TamaGOchi(name);
  pet.startLifecycle();

  const engine = new TradingEngine(config, wallet);

  // Wire memory to trading
  engine.on("signal", (signal) => {
    memory.storeKnown({
      content: `[${name}] Signal: ${signal.type} ${signal.symbol} (${(signal.confidence * 100).toFixed(0)}%)`,
      source: signal.source,
      tags: [signal.type, signal.symbol, name],
    });
  });

  engine.on("priceUpdate", (price) => {
    memory.storeKnown({
      content: `${price.symbol}: $${price.price.toFixed(6)}`,
      source: "birdeye",
      tags: [price.symbol, "price"],
    });
  });

  return { name, wallet, engine, memory, pet };
}

async function main() {
  console.log("🦞 NanoSolana — Multi-Agent Mesh\n");

  const config = loadConfig();

  // Spawn 3 agents with different strategies
  const agents: AgentInstance[] = [];
  const names = ["Alpha", "Beta", "Gamma"];

  for (const name of names) {
    console.log(`  Spawning ${name}...`);
    const agent = await spawnAgent(name, config);
    agents.push(agent);
    console.log(`  ✅ ${name}: ${agent.wallet.getPublicKey().slice(0, 8)}...`);
  }

  console.log(`\n🌐 ${agents.length} agents spawned.\n`);

  // Check mesh status
  if (TailscaleDiscovery.isAvailable()) {
    const nodes = TailscaleDiscovery.discoverNodes();
    const online = nodes.filter(n => n.online);
    console.log(`📡 Mesh: ${online.length}/${nodes.length} nodes online`);

    // Connect agents to mesh
    const client = new NanoNetworkClient(config.gateway.secret ?? "");
    for (const node of online) {
      await client.connectToNode(node, "mesh-coordinator");
    }
  } else {
    console.log("📡 Mesh: Local mode (no Tailscale)");
  }

  // Start all agents
  console.log("\n🔁 Starting OODA loops...\n");
  for (const agent of agents) {
    await agent.engine.start();
    console.log(`  ✅ ${agent.name} OODA loop active`);
  }

  // Cross-agent learning: share signals between agents
  for (const agent of agents) {
    agent.engine.on("signal", (signal) => {
      // Share with other agents' memories
      for (const other of agents) {
        if (other.name !== agent.name) {
          other.memory.storeKnown({
            content: `[Mesh: ${agent.name}] ${signal.type} ${signal.symbol} (${(signal.confidence * 100).toFixed(0)}%)`,
            source: "mesh",
            tags: ["mesh", agent.name, signal.type],
          });
        }
      }
    });
  }

  console.log("\n  Agents are sharing signals across the mesh.");
  console.log("  Press Ctrl+C to stop all agents.\n");

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n⏹  Shutting down all agents...");
    for (const agent of agents) {
      agent.engine.stop();
      agent.memory.stopAutonomous();
      agent.pet.stopLifecycle();
    }
    console.log("✅ All agents stopped.\n");
    process.exit(0);
  });

  await new Promise(() => {});
}

main().catch(console.error);
