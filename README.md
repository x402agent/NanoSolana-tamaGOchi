# NanoSolana — The Complete Guide

> The Open-Source Agentic Framework for Financial Intelligence on Solana

```
    ███╗   ██╗ █████╗ ███╗   ██╗ ██████╗ ███████╗ ██████╗ ██╗      █████╗ ███╗   ██╗ █████╗
    ████╗  ██║██╔══██╗████╗  ██║██╔═══██╗██╔════╝██╔═══██╗██║     ██╔══██╗████╗  ██║██╔══██╗
    ██╔██╗ ██║███████║██╔██╗ ██║██║   ██║███████╗██║   ██║██║     ███████║██╔██╗ ██║███████║
    ██║╚██╗██║██╔══██║██║╚██╗██║██║   ██║╚════██║██║   ██║██║     ██╔══██║██║╚██╗██║██╔══██║
    ██║ ╚████║██║  ██║██║ ╚████║╚██████╔╝███████║╚██████╔╝███████╗██║  ██║██║ ╚████║██║  ██║
    ╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝
```

**NanoSolana** is a modular, security-first framework for building autonomous financial agents on Solana. Deploy AI-powered trading agents that observe markets in real-time, learn from every trade, and coordinate across a decentralized mesh network — all with one command.

**Website:** [nanosolana.com](https://nanosolana.com) · **Hub:** [hub.nanosolana.com](https://hub.nanosolana.com) · **Docs:** [docs.nanosolana.com](https://docs.nanosolana.com) · **GitHub:** [github.com/x402agent/NanoSolana](https://github.com/x402agent/NanoSolana)

---

## Table of Contents

1. [Why NanoSolana?](#1-why-nanosolana)
2. [Quick Start](#2-quick-start)
3. [Architecture & Core Concepts](#3-architecture--core-concepts)
4. [The OODA Trading Loop](#4-the-ooda-trading-loop)
5. [ClawVault: Epistemological Memory](#5-clawvault-epistemological-memory)
6. [Trading Engine & Strategy](#6-trading-engine--strategy)
7. [TamaGOchi: The Pet That Trades](#7-tamagochi-the-pet-that-trades)
8. [Security Architecture](#8-security-architecture)
9. [On-Chain Identity](#9-on-chain-identity)
10. [Mesh Networking](#10-mesh-networking)
11. [Gateway Architecture](#11-gateway-architecture)
12. [Sessions & Persistence](#12-sessions--persistence)
13. [Multi-Channel Communication](#13-multi-channel-communication)
14. [NanoBot Interactive UI](#14-nanobot-interactive-ui)
15. [Chrome Extension](#15-chrome-extension)
16. [TamaGObot: The Go Implementation](#16-tamagobot-the-go-implementation)
17. [Hardware Integration (Arduino Modulino®)](#17-hardware-integration-arduino-modulino)
18. [x402 Payment Protocol](#18-x402-payment-protocol)
19. [Platform Apps (macOS, Android)](#19-platform-apps-macos-android)
20. [NanoHub: Agent Registry & Skills](#20-nanohub-agent-registry--skills)
21. [Deployment & Infrastructure](#21-deployment--infrastructure)
22. [Configuration Reference](#22-configuration-reference)
23. [CLI Reference](#23-cli-reference)
24. [Monorepo Structure](#24-monorepo-structure)
25. [Contributing](#25-contributing)

---

## 1. Why NanoSolana?

The financial world is being rebuilt by autonomous agents. But today's agent frameworks are fundamentally flawed for finance:

- **Built for chat, not finance** — retrofitting chatbots for trading is dangerous
- **Stateless** — they forget every trade, every lesson, every pattern
- **Siloed** — each agent is an island with no coordination
- **Insecure** — API keys in `.env` files, no encryption, no audit trail

NanoSolana is built from the ground up for financial agents:

- **OODA Trading Loop** — military-grade decision cycle (Observe → Orient → Decide → Act → Learn)
- **Epistemological Memory** — 3-tier ClawVault that distinguishes facts from patterns from hypotheses
- **Mesh Coordination** — agents share signals and lessons across a Tailscale VPN mesh
- **Vault-Encrypted Secrets** — AES-256-GCM for every API key and private key, always
- **On-Chain Identity** — every agent mints a Metaplex NFT birth certificate at creation

NanoSolana ships in two implementations: a full-featured **TypeScript runtime** (`nano-core`) for rapid development and extensibility, and an ultra-lightweight **Go binary** (`TamaGObot`) that runs on anything from an NVIDIA Orin Nano to a Raspberry Pi in under 10MB.

---

## 2. Quick Start

### One-Command Deploy

```bash
npx nanosolana go
```

That's it. `nanosolana go` handles init → wallet → birth certificate NFT → blockchain scan → on-chain identity → OODA trading loop → gateway — all in one shot.

### Alternative Install Methods

```bash
# Global npm install
npm install -g nanosolana
nanosolana go

# Shell install script
curl -fsSL https://nanosolana.com/install.sh | bash

# From source
git clone https://github.com/x402agent/NanoSolana.git
cd NanoSolana/nano-core
npm install
npm run nanosolana -- go
```

If `nanosolana` is not found right after install, load your PATH:

```bash
export PATH="$HOME/.nanosolana/bin:$PATH"
nanosolana --version
```

### Step-by-Step (if you prefer control)

```bash
nanosolana init      # Configure API keys (encrypted at rest)
nanosolana birth     # Create Solana wallet + mint Birth Certificate NFT
nanosolana run       # Start the OODA trading loop
```

### Fun Stuff

```bash
nanosolana scan        # Instant blockchain data scan (SOL, tokens, NFTs, tx history)
nanosolana dvd         # Floating DVD screensaver in your terminal
nanosolana lobster     # Animated Unicode lobster mascot
nanosolana nanobot     # Launch interactive web UI companion
nanosolana register    # Mint on-chain identity NFT (devnet)
nanosolana registry    # View your on-chain agent identity
```

### Required API Keys

| Key | Source | Required |
|-----|--------|----------|
| `OPENROUTER_API_KEY` | [openrouter.ai](https://openrouter.ai) | Yes |
| `HELIUS_RPC_URL` | [helius.dev](https://helius.dev) | Yes |
| `HELIUS_API_KEY` | [helius.dev](https://helius.dev) | Yes |
| `HELIUS_WSS_URL` | [helius.dev](https://helius.dev) | Recommended |
| `BIRDEYE_API_KEY` | [birdeye.so](https://birdeye.so) | Recommended |
| `JUPITER_API_KEY` | [jup.ag](https://jup.ag) | For trading |

All keys are encrypted with AES-256-GCM in the local vault. Never stored in plaintext.

---

## 3. Architecture & Core Concepts

### System Overview

NanoSolana is a modular runtime for deploying autonomous financial agents on Solana. Every agent is a self-contained process that observes markets, reasons about data, executes trades, and learns from outcomes — all running inside a security-hardened loop.

The system is organized into three layers:

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

**Agent Runtime** — the brain. Houses the OODA trading loop, epistemological memory, AI reasoning, and strategy execution.

**Infrastructure** — the skeleton. Encrypted secret storage, authenticated gateways, peer-to-peer mesh networking, and Solana wallet/NFT identity.

**Interfaces** — the skin. Every surface a human (or another agent) can use to interact with a running NanoSolana instance.

### Full Daemon Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                    NanoSolana Daemon                                  │
│                                                                      │
│  1. Agentic Wallet   ─  auto-gen/load Solana keypair                │
│  2. Solana RPC       ─  Helius mainnet + DAS API                    │
│  3. TamaGOchi        ─  virtual pet engine (on-chain driven)        │
│  4. Telegram         ─  bot channel (if configured)                  │
│  5. x402 Gateway     ─  SVM signer + paywall server                │
│  6. Channels         ─  multi-channel message routing                │
│  7. NanoBot UI       ─  interactive widget (wallet, chat, tools)    │
│  8. Heartbeat        ─  periodic health + balance checks             │
│                                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────┐│
│  │ NanoBot  │  │  OODA    │  │ TamaGOchi│  │  x402    │  │Chrome ││
│  │ UI+API   │  │  Agent   │  │  Pet     │  │  Paywall │  │ Ext   ││
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──┬────┘│
│       │              │              │              │           │     │
│  ┌────▼──────────────▼──────────────▼──────────────▼───────────▼──┐ │
│  │          Message Bus + DAS API + Hardware Adapter              │ │
│  └──────────────────────────┬────────────────────────────────────┘ │
│                             │                                      │
│  ┌──────────────────────────▼────────────────────────────────────┐ │
│  │           pkg/solana + pkg/onchain + pkg/x402                 │ │
│  │  wallet · rpc · DAS · programs · tx · signer · middleware     │ │
│  └──────────────────────────┬────────────────────────────────────┘ │
│                             │                                      │
│  ┌──────────────────────────▼────────────────────────────────────┐ │
│  │  Solana Mainnet (Helius RPC/WSS + DAS + Jupiter + Birdeye)   │ │
│  └───────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

### Core Module Map (TypeScript — nano-core)

```
nano-core/src/
├── ai/          → OpenRouter AI provider (multimodal: text, image, audio, video)
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

---

## 4. The OODA Trading Loop

NanoSolana's core execution model is the **OODA loop** — a military decision-making framework adapted for autonomous trading.

```
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ OBSERVE  │──▶│  ORIENT  │──▶│  DECIDE  │──▶│   ACT    │
│          │   │          │   │          │   │          │
│ Helius   │   │ OpenRouter│   │ Signal   │   │ Jupiter  │
│ Birdeye  │   │ AI Model │   │ Scoring  │   │ Swaps    │
└──────────┘   └──────────┘   └──────────┘   └────┬─────┘
     ▲                                             │
     │              ┌──────────┐                   │
     └──────────────│  LEARN   │◀──────────────────┘
                    │ClawVault │
                    └──────────┘
```

### Phase 1 — Observe
Pull real-time data: Helius RPC (on-chain state, DAS), Birdeye (prices, volume), WebSocket feeds, wallet state. All enters ClawVault KNOWN tier (60s TTL).

### Phase 2 — Orient
Feed observations + memory + strategy params + TamaGOchi mood + SOUL.md to AI model via OpenRouter. Returns market regime classification and directional bias.

### Phase 3 — Decide
Strategy engine combines AI orientation with RSI + EMA + ATR signals. Confidence scoring: RSI strength (30%) + EMA crossover (30%) + Volume (20%) + Memory patterns (20%). Only confidence ≥ 0.7 advances.

### Phase 4 — Act
Execute via Jupiter Ultra Swap: dynamic slippage (1-3%), Kelly Criterion sizing, max 50% wallet per position, -10% daily loss circuit breaker, TamaGOchi mood modifier.

### Phase 5 — Learn
Experience replay on last 20 trades. Promote patterns to LEARNED tier. Generate hypotheses in INFERRED tier. Run contradiction detection. Update research agenda. Broadcast lessons to mesh.

---

## 5. ClawVault: Epistemological Memory

| Tier | TTL | Status | Example |
|------|-----|--------|---------|
| **KNOWN** | 60s | Empirical fact | "SOL is at $142.50 right now" |
| **LEARNED** | 7 days | Validated pattern | "RSI < 30 + volume spike → 72% bounce rate" |
| **INFERRED** | 3 days | Hypothesis | "This token might correlate with BTC moves" |

**Temporal Decay** — auto GC every 5 min. **Experience Replay** — post-trade pattern analysis. **Contradiction Detection** — new facts drop invalid hypotheses. **Research Agenda** — open questions prioritized in next OODA cycle.

---

## 6. Trading Engine & Strategy

### RSI + EMA + ATR Auto-Optimizer

| Parameter | Default | Description |
|-----------|---------|-------------|
| RSI Period | 14 | Wilder's RSI |
| RSI Overbought | 70 | Short signal zone |
| RSI Oversold | 30 | Long signal zone |
| EMA Fast | 12/20 | Fast moving average |
| EMA Slow | 26/50 | Slow moving average |
| ATR Period | 14 | Average True Range |

Auto-optimizes every 20 trades based on rolling Sharpe ratio. Execution via Jupiter Ultra Swap with slippage protection.

### Risk Management

| Control | Value |
|---------|-------|
| Max position | 50% of wallet |
| Daily loss limit | -10% → paused 24h |
| Max slippage | 3% hard cap |
| Minimum reserve | 0.01 SOL for gas |
| Position sizing | Kelly Criterion |
| TamaGOchi mood | ±30% modifier |

---

## 7. TamaGOchi: The Pet That Trades

```
🥚 Egg → 🐛 Larva → 🐣 Juvenile → 🦞 Adult → 👑 Alpha → 👻 Ghost
```

| Mood | Trigger | Risk Effect |
|------|---------|-------------|
| 😊 Happy | Recent wins | +10% position |
| 😐 Content | Normal | No change |
| 🤤 Hungry | Not fed in 24h | -10% position |
| 😢 Sad | Recent losses | -15% position |
| 🤒 Sick | Losses + hunger | -30% position |
| 👻 Ghost | Health = 0 | **Trading disabled** |

Neglect your agent → trading de-risks → eventually halts. A dead man's switch built into the design.

---

## 8. Security Architecture

| Layer | Protection |
|-------|------------|
| **Secrets** | AES-256-GCM vault with PBKDF2 |
| **Gateway** | HMAC-SHA256 on every connection |
| **Comparison** | `crypto.timingSafeEqual` always |
| **Rate Limit** | 10 conn/min, 100 msg/min |
| **Permissions** | `0600` files, `0700` dirs |
| **Wallet** | Ed25519 key never leaves vault |
| **Audit** | `nanosolana security audit --deep` |

---

## 9. On-Chain Identity

Every agent mints **Metaplex NFTs** on devnet:

- **Birth Certificate** — creation timestamp, config hash, version
- **Identity NFT** — public key, version, skills, SHA-256 fingerprint

Blockchain scan at birth via Helius: DAS API, Enhanced Transactions, Priority Fees, Wallet Snapshot.

---

## 10. Mesh Networking

Agents form P2P mesh over Tailscale VPN:

| Shared | Never Shared |
|--------|-------------|
| Trading signals | Wallet keys |
| Learned patterns | Private keys |
| Price feeds | |
| Pet status | |

```bash
nanosolana nodes                    # Discover peers
nanosolana send "check SOL RSI"     # Broadcast
```

---

## 11. Gateway Architecture

HMAC-SHA256 authenticated WebSocket + HTTP gateway. Wire protocol: JSON text frames.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Liveness (no auth) |
| `/api/status` | GET | Full agent status |
| `/api/framework` | GET | Framework metadata |
| `/api/memory` | GET | Memory stats |

---

## 12. Sessions & Persistence

| Type | Key Format |
|------|-----------|
| Main | `agent:main:main` |
| Telegram DM | `agent:main:telegram:<chatId>` |
| Discord | `agent:main:discord:<channelId>` |
| Trading | `agent:main:trading` |

---

## 13. Multi-Channel Communication

| Channel | Persistence | Plugin |
|---------|-------------|--------|
| **Telegram** | ✅ Full (200 msg/chat) | Built-in |
| **Discord** | Session | Built-in |
| **Nostr** | Session | Extension |
| **iMessage** | Session | Extension |
| **Google Chat** | Session | Extension |
| **Web UI** | Session | Built-in |

14+ extension plugins. Build your own with the plugin SDK.

---

## 14. NanoBot Interactive UI

```bash
nanosolana nanobot    # Opens http://127.0.0.1:7777
```

| Tab | Features |
|-----|----------|
| 🏠 Home | Quick actions, command output |
| 💰 Wallet | SOL balance, token portfolio, send, tx history |
| 💬 Chat | Talk to NanoBot, typing indicators |
| 🔧 Tools | On-chain registration, status, terminal |

---

## 15. Chrome Extension

Manifest V3 browser extension:

| Feature | Description |
|---------|-------------|
| 🔗 Tab Relay | Attach any tab via CDP |
| 💰 Wallet Panel | View status, generate wallets |
| 💬 Chat Relay | Messages + Telegram forwarding |
| 📈 Manual Trades | Buy/sell/hold with confidence |
| ⚙️ Gateway Sync | Auto-load config |

```
Chrome Tab ◄──CDP──► Relay :18792 ◄──HTTP──► Gateway :18790 ◄──► OODA Engine
```

---

## 16. TamaGObot: The Go Implementation

**10MB binary** · **<10MB RAM** · **1s boot** · Cross-compile: x86_64, ARM64, RISC-V

```bash
./build/nanosolana daemon              # Full autonomous daemon
./build/nanosolana ooda --sim          # Simulated mode
./build/nanosolana ooda --hw-bus 1     # With hardware
```

---

## 17. Hardware Integration (Arduino Modulino®)

| Sensor | Function |
|--------|----------|
| **Pixels** (8× RGB LED) | Status visualization |
| **Buzzer** | Audio alerts |
| **Buttons** (3×) | OODA trigger, sim/live toggle, emergency stop |
| **Knob** | Real-time RSI threshold tuning |
| **Thermo** | Temperature logging |
| **Distance** (ToF) | Proximity wake-up |
| **Movement** (IMU) | Tilt → auto-pause |

All hardware gracefully degrades — no sensors? Runs in stub mode.

---

## 18. x402 Payment Protocol

Crypto-gated HTTP APIs via [x402.org](https://x402.org):

- Solana USDC payments via agent wallet
- Multi-chain: Solana, Base, Polygon, Avalanche
- HTTP middleware for paywalling endpoints
- Facilitator proxy to `facilitator.x402.rs`

---

## 19. Platform Apps (macOS, Android)

### macOS

```bash
bash scripts/package-macos.sh    # → dist/NanoSolana-v2.0.0.dmg
nanosolana menubar               # Launch menu bar agent
```

### Android (SeekerClaw)

Android 14+ app: background AI agent, Telegram interface, native Solana wallet, secure on-device key management.

---

## 20. NanoHub: Agent Registry & Skills

**URL:** [hub.nanosolana.com](https://hub.nanosolana.com) · React + TanStack Router + Convex + Vercel

- Agent profiles and public pages
- Skills marketplace
- Real-time updates
- Deployment tracking

```bash
npx nanosolana@latest install my-skill
```

---

## 21. Deployment & Infrastructure

| Target | Command |
|--------|---------|
| Current platform | `make build` |
| NVIDIA Orin | `make orin` |
| Raspberry Pi | `make rpi` |
| Docker (~15MB) | `make docker` |
| macOS | `make macos` |
| All | `make cross` |

---

## 22. Configuration Reference

### Core Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | Yes | AI provider |
| `HELIUS_API_KEY` | Yes | Helius API |
| `HELIUS_RPC_URL` | Yes | Solana RPC |
| `HELIUS_WSS_URL` | Recommended | Real-time data |
| `BIRDEYE_API_KEY` | Recommended | Market analytics |
| `JUPITER_API_KEY` | For trading | Swap execution |
| `TELEGRAM_BOT_TOKEN` | Optional | Telegram bot |
| `NANO_GATEWAY_SECRET` | Recommended | Gateway HMAC |
| `TAILSCALE_AUTH_KEY` | For mesh | Mesh networking |

---

## 23. CLI Reference

### TypeScript CLI

| Command | Description |
|---------|-------------|
| `nanosolana go` | **One-shot: init + birth + scan + register + trade** |
| `nanosolana init` | Configure + encrypt API keys |
| `nanosolana birth` | Create wallet + NFT + scan |
| `nanosolana run` | Start OODA trading loop |
| `nanosolana scan [address]` | Blockchain scan |
| `nanosolana register` | Mint identity NFT |
| `nanosolana registry` | Show identity |
| `nanosolana nanobot` | Launch web UI |
| `nanosolana status` | Agent status |
| `nanosolana trade status` | P&L |
| `nanosolana wallet balance` | Balances |
| `nanosolana pet status` | TamaGOchi |
| `nanosolana memory search` | Search memory |
| `nanosolana gateway run` | Start gateway |
| `nanosolana nodes` | Mesh peers |
| `nanosolana doctor` | Diagnostics |
| `nanosolana security audit` | Security scan |
| `nanosolana dvd` | DVD screensaver 🦞 |
| `nanosolana lobster` | Animated lobster |

### Go CLI

| Command | Description |
|---------|-------------|
| `nanosolana daemon` | Full GoBot |
| `nanosolana ooda` | Trading loop |
| `nanosolana agent` | Chat REPL |
| `nanosolana pet` | Pet status |
| `nanosolana nanobot` | NanoBot UI |
| `nanosolana menubar` | macOS menu bar |
| `nanosolana hardware scan` | I2C scan |

---

## 24. Monorepo Structure

```
NanoSolana/
├── apps/
│   ├── android/            # Android companion (Kotlin)
│   ├── macos/              # Swift macOS app
│   └── shared/             # Cross-platform primitives
├── assets/
│   └── chrome-extension/   # Manifest V3 browser relay
├── extensions/             # 14+ channel plugins
├── nano-core/              # TypeScript runtime/CLI
├── nano-docs/              # Documentation
├── nanohub/                # Agent Registry (React + Convex)
├── site/                   # Landing site (nanosolana.com)
├── skills/                 # Skill library
├── ui/                     # Standalone web UI
├── CONTRIBUTING.md
├── LICENSE                 # MIT
├── README.md               # This file
└── SECURITY.md
```

---

## 25. Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md).

### Areas Where We Need Help

- New trading strategies and indicators
- Memory engine improvements (vector search, LanceDB)
- New channel plugins (WhatsApp, Slack, Matrix)
- Security audits and hardening
- Backtesting framework
- Documentation and tutorials

---

## License

MIT — [NanoSolana Labs](https://nanosolana.com)

Built for the financial agents of tomorrow. Open source forever.

---

**Website:** [nanosolana.com](https://nanosolana.com) · **Hub:** [hub.nanosolana.com](https://hub.nanosolana.com) · **Docs:** [docs.nanosolana.com](https://docs.nanosolana.com) · **GitHub:** [github.com/x402agent/NanoSolana](https://github.com/x402agent/NanoSolana)

🦞 *Built with lobster energy by NanoSolana Labs* 🦞
