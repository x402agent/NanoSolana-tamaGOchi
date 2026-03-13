<div align="center">

```
    ███╗   ██╗ █████╗ ███╗   ██╗ ██████╗ ███████╗ ██████╗ ██╗      █████╗ ███╗   ██╗ █████╗
    ████╗  ██║██╔══██╗████╗  ██║██╔═══██╗██╔════╝██╔═══██╗██║     ██╔══██╗████╗  ██║██╔══██╗
    ██╔██╗ ██║███████║██╔██╗ ██║██║   ██║███████╗██║   ██║██║     ███████║██╔██╗ ██║███████║
    ██║╚██╗██║██╔══██║██║╚██╗██║██║   ██║╚════██║██║   ██║██║     ██╔══██║██║╚██╗██║██╔══██║
    ██║ ╚████║██║  ██║██║ ╚████║╚██████╔╝███████║╚██████╔╝███████╗██║  ██║██║ ╚████║██║  ██║
    ╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝
```

**The Open-Source Agentic Framework for Financial Intelligence on Solana**

[![License: MIT](https://img.shields.io/badge/License-MIT-14F195.svg)](LICENSE)
[![Solana](https://img.shields.io/badge/Solana-Native-9945FF.svg)](https://solana.com)
[![npm](https://img.shields.io/npm/v/nanosolana?color=14F195)](https://npmjs.com/package/nanosolana)

[Website](https://nanosolana.com) · [Hub](https://hub.nanosolana.com) · [Docs](https://docs.nanosolana.com) · [GitHub](https://github.com/x402agent/NanoSolana)

</div>

## One-Shot Deploy

```bash
npx nanosolana go
```

That's it — one command handles API key setup, wallet creation, blockchain scan, on-chain NFT identity, OODA trading loop, and gateway.

## Install

```bash
npm install -g nanosolana
```

Or step-by-step:

```bash
nanosolana init      # Configure API keys (encrypted at rest)
nanosolana birth     # Create Solana wallet + mint Birth Certificate NFT + blockchain scan
nanosolana run       # Start the OODA trading loop
```

## Architecture

```
nano-core/
├── src/
│   ├── ai/          → OpenRouter AI provider (multimodal: text, image, audio, video)
│   ├── cli/         → `nanosolana` CLI (25+ commands)
│   ├── config/      → AES-256-GCM encrypted vault & Zod-validated config
│   ├── gateway/     → HMAC-SHA256 authenticated WebSocket + HTTP server
│   ├── hub/         → NanoHub bridge for UI communication
│   ├── memory/      → ClawVault 3-tier epistemological memory engine
│   ├── network/     → Tailscale + tmux mesh networking
│   ├── nft/         → Metaplex gasless devnet birth certificate NFT
│   ├── onchain/     → Helius blockchain reader (DAS, Enhanced Tx, wallet scan)
│   ├── registry/    → On-chain agent identity (Metaplex NFT registration)
│   ├── nanobot/     → Interactive local web UI companion
│   ├── pet/         → TamaGOchi virtual pet engine (mood × risk)
│   ├── strategy/    → RSI + EMA + ATR auto-optimizer
│   ├── telegram/    → Persistent conversation store (200 msg/chat)
│   ├── trading/     → OODA trading engine + Jupiter swap execution
│   └── wallet/      → Solana Ed25519 wallet manager
├── SOUL.md          → Agent identity system prompt
└── extensions/      → 14+ plugins (Telegram, Discord, Nostr, etc.)
```

## Commands

| Command | Description |
|---------|-------------|
| `nanosolana go` | **One-shot: init + birth + scan + register + trade** |
| `nanosolana init` | Configure + encrypt API keys |
| `nanosolana birth` | Create wallet + mint Birth Certificate NFT + blockchain scan |
| `nanosolana run` | Start OODA trading loop |
| `nanosolana scan [address]` | **Blockchain data scan — SOL, tokens, NFTs, tx history** |
| `nanosolana register` | **Mint on-chain agent identity NFT (devnet)** |
| `nanosolana registry` | **Show on-chain agent identity** |
| `nanosolana nanobot` | **Launch interactive NanoBot web UI** |
| `nanosolana dvd` | Floating DVD screensaver 🦞 |
| `nanosolana lobster` | Animated Unicode lobster mascot |
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
| `nanosolana security audit` | Full security scan |

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
2. **Orient** — AI analysis via OpenRouter (multimodal)
3. **Decide** — Structured signals with confidence scoring
4. **Act** — Jupiter swap execution with slippage protection
5. **Learn** — ClawVault experience replay + contradiction detection

## Blockchain Intelligence (Helius)

At agent birth, NanoSolana instantly reads the blockchain:

- **DAS API** — tokens, NFTs, compressed assets
- **Enhanced Transactions** — parsed tx history with descriptions
- **Priority Fees** — real-time fee estimation
- **Wallet Snapshot** — SOL balance, token prices, NFT inventory

## On-Chain Identity

Every agent mints a **Metaplex NFT** on devnet as its on-chain identity:

- Agent public key
- NanoSolana version
- Registered skills
- SHA-256 fingerprint

## TamaGOchi Pet

🥚 Egg → 🐛 Larva → 🐣 Juvenile → 🦞 Adult → 👑 Alpha → 👻 Ghost

Pet mood affects risk tolerance. Feed to keep alive!

## Chrome Extension

Manifest V3 browser extension for tab relay, wallet management, chat, and manual trades via the gateway.

## Links

- **Website:** [nanosolana.com](https://nanosolana.com)
- **Hub:** [hub.nanosolana.com](https://hub.nanosolana.com)
- **Docs:** [docs.nanosolana.com](https://docs.nanosolana.com)
- **GitHub:** [github.com/x402agent/NanoSolana](https://github.com/x402agent/NanoSolana)

## License

MIT — [NanoSolana Labs](https://nanosolana.com)
