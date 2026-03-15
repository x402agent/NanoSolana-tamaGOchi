<div align="center">

# 🦞 NanoSolana

**Deploy autonomous Solana trading agents in 30 seconds.**

[![npm version](https://img.shields.io/npm/v/nanosolana?color=14F195&style=flat-square)](https://npmjs.com/package/nanosolana)
[![npm downloads](https://img.shields.io/npm/dm/nanosolana?color=9945FF&style=flat-square)](https://npmjs.com/package/nanosolana)
[![GitHub stars](https://img.shields.io/github/stars/x402agent/NanoSolana?color=14F195&style=flat-square)](https://github.com/x402agent/NanoSolana)
[![License: MIT](https://img.shields.io/badge/License-MIT-14F195.svg?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Solana](https://img.shields.io/badge/Solana-Native-9945FF?style=flat-square&logo=solana&logoColor=white)](https://solana.com)
[![Node](https://img.shields.io/badge/Node-%E2%89%A522-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![GitHub last commit](https://img.shields.io/github/last-commit/x402agent/NanoSolana?color=14F195&style=flat-square)](https://github.com/x402agent/NanoSolana)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-14F195?style=flat-square)](https://github.com/x402agent/NanoSolana/blob/main/CONTRIBUTING.md)
[![Discord](https://img.shields.io/badge/Discord-Join-5865F2?style=flat-square&logo=discord&logoColor=white)](https://discord.gg/nanosolana)

The open-source **agentic framework** for autonomous financial intelligence on Solana.
OODA trading loops · epistemological memory · mesh coordination · virtual pet soul.

[Website](https://nanosolana.com) · [Hub](https://hub.nanosolana.com) · [Docs](https://docs.nanosolana.com) · [GitHub](https://github.com/x402agent/NanoSolana) · [Discord](https://discord.gg/nanosolana)

</div>

---

## ⚡ One Command. Full Agent.

```bash
npx nanosolana go
```

That's it. One command handles: **API key setup → wallet creation → blockchain scan → on-chain NFT identity → OODA trading loop → WebSocket gateway.** All secrets encrypted with AES-256-GCM.

```
  ✓ Secrets encrypted → ~/.nanosolana/vault.enc
  ✓ Wallet created: 7xKp...3nYd
  ✓ TamaGOchi hatched: 🥚 NanoAlpha 😊
  ✓ ClawVault online: 0K/0L/0I
  ✓ OODA trading loop active
  ✓ On-chain identity: 5mNt...
  ✓ Gateway: ws://0.0.0.0:18790

  ══════════════════════════════════════════════════════
  🦞 NanoAlpha is LIVE. All systems operational.
  ══════════════════════════════════════════════════════
```

---

## 🎯 Why NanoSolana?

Other agent frameworks are **built for chat and retrofitted for finance.** NanoSolana is built from the ground up for autonomous financial agents.

| Feature | NanoSolana | Eliza | AutoGPT | LangChain |
|---------|:---------:|:-----:|:-------:|:---------:|
| Built for finance | ✅ Native | ❌ Chat | ❌ General | ❌ General |
| Epistemological memory | ✅ 3-tier | ❌ | ❌ | Partial |
| OODA trading loop | ✅ Military-grade | ❌ | ❌ | ❌ |
| Encrypted secrets vault | ✅ AES-256-GCM | ❌ .env | ❌ .env | ❌ .env |
| On-chain identity (NFT) | ✅ Metaplex | ❌ | ❌ | ❌ |
| Mesh networking | ✅ P2P | ❌ | ❌ | ❌ |
| Virtual pet risk modifier | ✅ TamaGOchi | ❌ | ❌ | ❌ |
| One-command deploy | ✅ `npx nanosolana go` | ❌ | ❌ | ❌ |
| TypeScript-first SDK | ✅ Full types | Partial | Python | Python |
| Solana-native execution | ✅ Jupiter/Helius | ❌ | ❌ | Plugin |

---

## 📦 Install

```bash
# Global install
npm install -g nanosolana

# Or run directly
npx nanosolana go

# Or from source
git clone https://github.com/x402agent/NanoSolana.git
cd NanoSolana/nano-core && npm install
npm run nanosolana -- go
```

### Try Without API Keys

```bash
npx nanosolana demo
```

Runs a full simulation with synthetic market data — see the OODA loop in action without any API keys.

---

## 🧠 Architecture

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

```
nano-core/src/
├── ai/          → OpenRouter AI provider (multimodal)
├── cli/         → nanosolana CLI (25+ commands)
├── config/      → AES-256-GCM encrypted vault & Zod-validated config
├── gateway/     → HMAC-SHA256 authenticated WebSocket + HTTP server
├── memory/      → ClawVault 3-tier epistemological memory engine
├── network/     → Tailscale + tmux mesh networking
├── nft/         → Metaplex gasless devnet birth certificate NFT
├── onchain/     → Helius blockchain reader (DAS, Enhanced Tx)
├── pet/         → TamaGOchi virtual pet engine (mood × risk)
├── strategy/    → RSI + EMA + ATR auto-optimizer
├── trading/     → OODA trading engine + Jupiter swap execution
└── wallet/      → Solana Ed25519 wallet manager
```

---

## 🔁 The OODA Trading Loop

Military-grade decision cycle adapted for autonomous trading:

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

1. **Observe** — Real-time data from Helius RPC + Birdeye API
2. **Orient** — AI analysis via OpenRouter (multimodal)
3. **Decide** — Structured signals with confidence scoring (≥70% to act)
4. **Act** — Jupiter swap execution with slippage protection
5. **Learn** — ClawVault experience replay + contradiction detection

---

## 💻 SDK Usage (Programmatic)

Use NanoSolana as a library in your own projects:

```typescript
import {
  NanoWallet,
  TradingEngine,
  ClawVault,
  StrategyEngine,
  TamaGOchi,
  loadConfig,
} from "nanosolana";

// Load encrypted config
const config = loadConfig();

// Create wallet + trading engine
const wallet = new NanoWallet("my-agent");
await wallet.birth();

const engine = new TradingEngine(config, wallet);
await engine.start();

// Listen for signals
engine.on("signal", (signal) => {
  console.log(`${signal.type} ${signal.symbol} @ ${signal.confidence * 100}%`);
});

// 3-tier memory
const vault = new ClawVault();
vault.storeKnown({
  content: "SOL is at $142.50",
  source: "birdeye",
  tags: ["SOL", "price"],
});

// Virtual pet
const pet = new TamaGOchi("MyPet");
console.log(pet.getStatusDisplay());
```

---

## 🎮 CLI Commands

| Command | Description |
|---------|-------------|
| `nanosolana go` | **One-shot: init + birth + scan + register + trade** |
| `nanosolana demo` | **Simulation mode — no API keys needed** |
| `nanosolana init` | Configure + encrypt API keys |
| `nanosolana birth` | Create wallet + mint Birth Certificate NFT |
| `nanosolana run` | Start OODA trading loop |
| `nanosolana scan [addr]` | Blockchain scan (SOL, tokens, NFTs, tx history) |
| `nanosolana register` | Mint on-chain identity NFT (devnet) |
| `nanosolana nanobot` | Launch interactive web UI |
| `nanosolana status` | Agent + wallet + pet status |
| `nanosolana pet status` | TamaGOchi pet mood & evolution |
| `nanosolana dvd` | 🦞 DVD screensaver in your terminal |
| `nanosolana lobster` | Animated Unicode lobster mascot |

---

## 🐾 TamaGOchi: The Pet That Trades

Your agent has a virtual pet whose mood affects risk tolerance:

```
🥚 Egg → 🐛 Larva → 🐣 Juvenile → 🦞 Adult → 👑 Alpha → 👻 Ghost
```

| Mood | Trigger | Risk Effect |
|------|---------|-------------|
| 😊 Happy | Recent wins | +10% position |
| 😐 Content | Normal | No change |
| 🤤 Hungry | Not fed in 24h | -10% position |
| 😢 Sad | Recent losses | -15% position |
| 👻 Ghost | Health = 0 | **Trading disabled** |

Neglect your agent → trading de-risks → eventually halts. A dead man's switch by design.

---

## 🔐 Security

| Layer | Protection |
|-------|------------|
| **Secrets** | AES-256-GCM vault with PBKDF2 |
| **Gateway** | HMAC-SHA256 on every connection |
| **Comparison** | `crypto.timingSafeEqual` always |
| **Rate Limit** | 10 conn/min, 100 msg/min |
| **Wallet** | Ed25519 key never leaves vault |
| **Audit** | `nanosolana security audit --deep` |

---

## 🔑 Required API Keys

| Key | Source | Required |
|-----|--------|----------|
| `OPENROUTER_API_KEY` | [openrouter.ai](https://openrouter.ai) | ✅ |
| `HELIUS_RPC_URL` | [helius.dev](https://helius.dev) | ✅ |
| `HELIUS_API_KEY` | [helius.dev](https://helius.dev) | ✅ |
| `HELIUS_WSS_URL` | [helius.dev](https://helius.dev) | Recommended |
| `BIRDEYE_API_KEY` | [birdeye.so](https://birdeye.so) | Recommended |
| `JUPITER_API_KEY` | [jup.ag](https://jup.ag) | For trading |

All keys are **AES-256-GCM encrypted** in the local vault. Never stored in plaintext.

---

## 🌐 Ecosystem

| Component | Description |
|-----------|-------------|
| **nano-core** | TypeScript runtime + CLI (this package) |
| **NanoHub** | Agent registry & skills marketplace |
| **Extensions** | 40+ channel plugins (Telegram, Discord, Slack, WhatsApp, Nostr...) |
| **Chrome Extension** | Manifest V3 browser relay |
| **TamaGObot** | Ultra-lightweight Go binary (<10MB) |
| **Skills** | 50+ composable agent skills |

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](https://github.com/x402agent/NanoSolana/blob/main/CONTRIBUTING.md).

**Areas where we need help:**

- 🧪 New trading strategies and indicators
- 🧠 Memory engine improvements (vector search, LanceDB)
- 📡 New channel plugins (Matrix, Zulip)
- 🔒 Security audits and hardening
- 📊 Backtesting framework
- 📝 Documentation and tutorials
- 🌐 Internationalization

---

## 📄 License

MIT — [NanoSolana Labs](https://nanosolana.com)

---

<div align="center">

**Built for the financial agents of tomorrow. Open source forever.**

[Website](https://nanosolana.com) · [Hub](https://hub.nanosolana.com) · [Docs](https://docs.nanosolana.com) · [GitHub](https://github.com/x402agent/NanoSolana) · [Discord](https://discord.gg/nanosolana)

🦞 *Built with lobster energy by NanoSolana Labs* 🦞

</div>
