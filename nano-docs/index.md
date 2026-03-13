---
summary: "NanoSolana documentation index — autonomous financial agents on Solana"
title: "NanoSolana Docs"
---

# NanoSolana Documentation

> The Open-Source Agentic Framework for Financial Intelligence on Solana

**Website:** [nanosolana.com](https://nanosolana.com) · **Hub:** [hub.nanosolana.com](https://hub.nanosolana.com) · **Docs:** [docs.nanosolana.com](https://docs.nanosolana.com) · **GitHub:** [github.com/x402agent/NanoSolana](https://github.com/x402agent/NanoSolana)

## One-Shot Deploy

```bash
npx nanosolana go
```

That's it — one command handles API key setup, wallet creation, blockchain scan, on-chain NFT identity, OODA trading loop, and gateway.

## Step-by-Step

```bash
nanosolana init      # Configure API keys (encrypted at rest)
nanosolana birth     # Create Solana wallet + mint Birth Certificate NFT + blockchain scan
nanosolana run       # Start the OODA trading loop
```

## NanoHub + npx (Convex-backed)

NanoHub registration, API tokens, and skill/soul publishing are backed by Convex.

```bash
# 1) Open the hub and sign in with GitHub
open https://hub.nanosolana.com

# 2) Connect CLI to hub (opens /cli/auth in browser)
npx clawhub@latest login

# 3) Publish local agent skill folder
npx clawhub@latest publish ./skills/my-agent \
  --slug my-agent \
  --name "My Agent" \
  --version 1.0.0

# 4) Or sync all local updates
npx clawhub@latest sync --all
```

For the full flow, see [CLI: Hub + Convex (web + npx)](/cli/hub-convex).

## Fun Stuff

```bash
nanosolana scan        # Blockchain data scan (SOL, tokens, NFTs, tx history)
nanosolana dvd         # Floating DVD screensaver in your terminal
nanosolana lobster     # Animated Unicode lobster mascot
nanosolana nanobot     # Launch interactive web UI companion
nanosolana register    # Mint on-chain identity NFT (devnet)
```

## Documentation

### Concepts

- [**Features**](/concepts/features) — Full capabilities overview
- [**Architecture**](/concepts/architecture) — Gateway, mesh, and component design
- [**Agent Loop (OODA)**](/concepts/agent-loop) — Observe → Orient → Decide → Act → Learn
- [**Memory (ClawVault)**](/concepts/memory) — 3-tier epistemological memory system
- [**System Prompt (SOUL.md)**](/concepts/system-prompt) — Agent identity and philosophy
- [**Model Providers**](/concepts/model-providers) — OpenRouter, AI integration
- [**Sessions**](/concepts/sessions) — Conversation persistence and management

### Trading

- [**Trading Engine**](/trading) — Strategy, execution, and risk management
- **OODA Loop** — Military-grade decision cycle adapted for autonomous trading
- **Strategy** — RSI + EMA + ATR auto-optimizer with Kelly Criterion sizing
- **Risk** — Max 50% position, -10% daily loss circuit breaker, TamaGOchi mood modifier

### Gateway

- [**Gateway Runbook**](/gateway) — Startup, operations, and monitoring
- [**Configuration**](/gateway/configuration) — Full config reference
- [**Protocol**](/gateway/protocol) — WebSocket wire format and message types
- [**Security**](/gateway/security) — Authentication and encryption
- [**Heartbeat**](/gateway/heartbeat) — Periodic OODA cycles and pet pulse

### Security

- [**Security**](/security) — Encryption, authentication, and trust model

### Tools

- [**Tools**](/tools) — Agent-facing tools and capabilities

### Extensions

- [**Extensions**](/extensions) — Plugin system and development guide

### CLI

- [**CLI Reference**](/cli) — Complete command reference (25+ commands)

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    AGENT RUNTIME                        │
│         OODA Loop · ClawVault · Strategy Engine         │
├─────────────────────────────────────────────────────────┤
│                  INFRASTRUCTURE                         │
│     Vault · Gateway · Mesh Network · On-Chain ID        │
├─────────────────────────────────────────────────────────┤
│                    INTERFACES                           │
│   CLI · Telegram · Discord · NanoBot UI · Chrome Ext    │
└─────────────────────────────────────────────────────────┘
```

### Core Module Map

```
nano-core/src/
├── ai/          → OpenRouter AI provider (multimodal)
├── cli/         → nanosolana CLI (25+ commands)
├── config/      → AES-256-GCM encrypted vault & Zod-validated config
├── gateway/     → HMAC-SHA256 authenticated WebSocket + HTTP server
├── hub/         → NanoHub bridge for UI communication
├── memory/      → ClawVault 3-tier epistemological memory engine
├── network/     → Tailscale + tmux mesh networking
├── nft/         → Metaplex gasless devnet birth certificate NFT
├── onchain/     → Helius blockchain reader (DAS, Enhanced Tx, wallet scan)
├── registry/    → On-chain agent identity (Metaplex NFT registration)
├── nanobot/     → Interactive local web UI companion
├── pet/         → TamaGOchi virtual pet engine (mood × risk)
├── strategy/    → RSI + EMA + ATR auto-optimizer
├── telegram/    → Persistent conversation store (200 msg/chat)
├── trading/     → OODA trading engine + Jupiter swap execution
└── wallet/      → Solana Ed25519 wallet manager
```

## Required API Keys

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | ✅ | AI provider API key |
| `HELIUS_RPC_URL` | ✅ | Solana RPC endpoint |
| `HELIUS_API_KEY` | ✅ | Helius API key |
| `HELIUS_WSS_URL` | Recommended | Real-time Solana data |
| `BIRDEYE_API_KEY` | Recommended | Market analytics |
| `JUPITER_API_KEY` | For trading | Swap execution |
| `NANO_GATEWAY_SECRET` | Recommended | Gateway HMAC secret |
| `TAILSCALE_AUTH_KEY` | For mesh | Agent mesh networking |

## Security First

- ✅ AES-256-GCM encrypted secrets vault
- ✅ HMAC-SHA256 gateway authentication
- ✅ Ed25519 wallet signatures
- ✅ Timing-safe token comparison
- ✅ Rate limiting (10 conn/min, 100 msg/min)
- ✅ File permissions enforced (0600/0700)
- ✅ Wallet private key never leaves the vault

## On-Chain Identity

Every agent mints **Metaplex NFTs** on devnet:

- **Birth Certificate** — creation timestamp, config hash, version
- **Identity NFT** — public key, version, skills, SHA-256 fingerprint
- **Blockchain Scan** — instant Helius DAS API scan at birth

## TamaGOchi Pet

```
🥚 Egg → 🐛 Larva → 🐣 Juvenile → 🦞 Adult → 👑 Alpha → 👻 Ghost
```

Pet mood affects risk tolerance. Neglect → de-risk → halt. A dead man's switch.

## Platform Support

| Platform | Implementation |
|----------|--------------|
| **TypeScript** | nano-core (full-featured runtime) |
| **Go** | TamaGObot (10MB binary, edge devices) |
| **macOS** | Native Swift menu bar app (.dmg) |
| **Android** | Kotlin companion app (Android 14+) |
| **Chrome** | Manifest V3 extension (tab relay, wallet, chat) |
| **Hardware** | Arduino Modulino® I2C sensors |

## Links

- **npm:** [npmjs.com/package/nanosolana](https://npmjs.com/package/nanosolana)
- **Website:** [nanosolana.com](https://nanosolana.com)
- **Hub:** [hub.nanosolana.com](https://hub.nanosolana.com)
- **GitHub:** [github.com/x402agent/NanoSolana](https://github.com/x402agent/NanoSolana)

---

MIT — [NanoSolana Labs](https://nanosolana.com) · 🦞 Built with lobster energy
