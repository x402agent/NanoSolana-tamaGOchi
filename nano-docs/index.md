---
summary: "NanoSolana documentation index"
title: "NanoSolana"
---

# NanoSolana Documentation

> Autonomous Solana trading intelligence with a virtual pet soul.

## Getting started

```bash
nanosolana init                    # Initialize config + workspace
nanosolana birth                   # Generate wallet + TamaGOchi egg
nanosolana gateway run             # Start the gateway
nanosolana run                     # Start the OODA trading loop
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

- [**CLI Reference**](/cli) — Complete command reference

## Architecture

```
nano-core/                   # Core TypeScript modules
├── src/
│   ├── ai/provider.ts       # OpenRouter AI integration
│   ├── cli/entry.ts         # Unified CLI
│   ├── config/vault.ts      # AES-256-GCM encrypted config
│   ├── gateway/server.ts    # WebSocket + HTTP gateway
│   ├── hub/bridge.ts        # NanoHub bridge
│   ├── memory/
│   │   ├── clawvault.ts     # 3-tier memory engine
│   │   └── engine.ts        # Memory engine interface
│   ├── network/mesh.ts      # Tailscale + tmux mesh
│   ├── pet/tamagochi.ts     # TamaGOchi pet engine
│   ├── strategy/engine.ts   # RSI + EMA + ATR strategy
│   ├── telegram/
│   │   └── persistence.ts   # Telegram conversation DB
│   ├── trading/engine.ts    # Trading execution engine
│   └── wallet/manager.ts    # Solana wallet (Ed25519)
├── SOUL.md                  # Agent identity system prompt
├── .env                     # Environment variables
└── .env.example             # Template

extensions/                  # Plugin extensions (14+)
├── telegram/                # Persistent Telegram channel
├── discord/                 # Discord trading signals
├── lobster/                 # Typed workflow pipelines
├── memory-core/             # ClawVault integration
├── memory-lancedb/          # Vector semantic search
├── nostr/                   # Decentralized relay
└── ...

ui/                          # Web UI (Lit + Vite)
├── src/styles/base.css      # Cypherpunk design system
└── public/lobster-logo.png  # NanoSolana mascot

nano-docs/                   # Documentation (you are here)
```

## Environment variables

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

## Security first

NanoSolana is designed for financial operations:

- ✅ AES-256-GCM encrypted secrets vault
- ✅ HMAC-SHA256 gateway authentication
- ✅ Ed25519 wallet signatures
- ✅ Timing-safe token comparison
- ✅ Rate limiting on all endpoints
- ✅ File permissions enforced (0600/0700)
- ✅ Wallet private key never leaves the vault
