<div align="center">

```
    ███╗   ██╗ █████╗ ███╗   ██╗ ██████╗ ███████╗ ██████╗ ██╗      █████╗ ███╗   ██╗ █████╗
    ████╗  ██║██╔══██╗████╗  ██║██╔═══██╗██╔════╝██╔═══██╗██║     ██╔══██╗████╗  ██║██╔══██╗
    ██╔██╗ ██║███████║██╔██╗ ██║██║   ██║███████╗██║   ██║██║     ███████║██╔██╗ ██║███████║
    ██║╚██╗██║██╔══██║██║╚██╗██║██║   ██║╚════██║██║   ██║██║     ██╔══██║██║╚██╗██║██╔══██║
    ██║ ╚████║██║  ██║██║ ╚████║╚██████╔╝███████║╚██████╔╝███████╗██║  ██║██║ ╚████║██║  ██║
    ╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝
```

**Autonomous Solana Trading Intelligence with a Virtual Pet Soul**

[![License: MIT](https://img.shields.io/badge/License-MIT-14F195.svg)](LICENSE)
[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF.svg)](https://solana.com)

</div>

## One-Shot Install

```bash
curl -fsSL https://nanosolana.ai/install.sh | bash
```

Or via npm:

```bash
npx nanosolana init
```

## Quick Start

```bash
# Initialize (configure API keys — encrypted at rest)
nanosolana init

# Birth your agent (creates Solana wallet + mints Birth Certificate NFT)
nanosolana birth

# Run the full agent stack (OODA trading loop)
nanosolana run
```

## Architecture

```
nano-core/
├── src/
│   ├── ai/          → OpenRouter AI provider (healer-alpha)
│   ├── cli/         → `nanosolana` CLI commands
│   ├── config/      → AES-256-GCM encrypted vault & config
│   ├── gateway/     → WebSocket + HTTP gateway (HMAC-SHA256)
│   ├── hub/         → NanoHub bridge
│   ├── memory/      → ClawVault 3-tier epistemological memory
│   ├── network/     → Tailscale + tmux mesh
│   ├── nft/         → Metaplex birth certificate NFT (devnet gasless)
│   ├── pet/         → TamaGOchi virtual pet engine
│   ├── strategy/    → RSI + EMA + ATR auto-optimizer
│   ├── telegram/    → Persistent conversation store
│   ├── trading/     → OODA trading engine + Jupiter execution
│   └── wallet/      → Solana Ed25519 wallet manager
├── SOUL.md          → Agent identity system prompt
└── extensions/      → 14+ plugins (Telegram, Discord, Nostr, etc.)
```

## Commands

| Command | Description |
|---------|-------------|
| `nanosolana init` | Configure API keys (Helius, Birdeye, Jupiter) |
| `nanosolana birth` | Create agent wallet + mint Birth Certificate NFT |
| `nanosolana run` | Start OODA trading loop |
| `nanosolana status` | Show agent + wallet + pet status |
| `nanosolana trade status` | Trading P&L and strategy state |
| `nanosolana trade signals` | Recent trading signals with confidence |
| `nanosolana wallet balance` | SOL + SPL token balances |
| `nanosolana pet status` | TamaGOchi pet mood and evolution |
| `nanosolana memory search` | Search ClawVault memory |
| `nanosolana gateway run` | Start WebSocket gateway |
| `nanosolana channels status` | Check channel connections |
| `nanosolana vault set <key> <val>` | Store encrypted secret |
| `nanosolana send <msg>` | One-shot message to nano bots |
| `nanosolana nodes` | List Tailscale mesh peers |
| `nanosolana doctor` | Run diagnostics |

## Required API Keys

| Key | Source | Required |
|-----|--------|----------|
| `OPENROUTER_API_KEY` | [openrouter.ai](https://openrouter.ai) | ✅ |
| `HELIUS_RPC_URL` | [helius.dev](https://helius.dev) | ✅ |
| `HELIUS_API_KEY` | [helius.dev](https://helius.dev) | ✅ |
| `HELIUS_WSS_URL` | [helius.dev](https://helius.dev) | Recommended |
| `BIRDEYE_API_KEY` | [birdeye.so](https://birdeye.so) | Recommended |
| `JUPITER_API_KEY` | [jup.ag](https://jup.ag) | For trading |

## Security

- ✅ AES-256-GCM encrypted secrets vault
- ✅ HMAC-SHA256 gateway authentication
- ✅ Ed25519 wallet signatures
- ✅ Timing-safe token comparison
- ✅ Rate limiting (10 conn/min, 100 msg/min)
- ✅ File permissions enforced (0600/0700)
- ✅ Wallet private key never leaves the vault

## Trading Engine (OODA)

1. **Observe** — Real-time data from Helius RPC + Birdeye API
2. **Orient** — AI analysis via OpenRouter (healer-alpha multimodal)
3. **Decide** — Structured signals with confidence scoring
4. **Act** — Jupiter swap execution with slippage protection
5. **Learn** — ClawVault experience replay + contradiction detection

## TamaGOchi Pet

Your agent has a virtual pet that evolves with trading performance:

🥚 Egg → 🐛 Larva → 🐣 Juvenile → 🦞 Adult → 👑 Alpha → 👻 Ghost

Pet mood affects risk tolerance. Feed to keep alive!

## Mesh Networking

TamaGObots find each other via Tailscale:

```bash
nanosolana nodes                    # List mesh peers
nanosolana send "check SOL RSI"     # Broadcast to all bots
nanosolana bots list                # List running sessions
```

## License

MIT — NanoSolana Labs
