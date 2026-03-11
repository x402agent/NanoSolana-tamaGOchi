<div align="center">

```
    ███╗   ███╗ █████╗ ██╗    ██╗██████╗ ██████╗  ██████╗ ████████╗
    ████╗ ████║██╔══██╗██║    ██║██╔══██╗██╔══██╗██╔═══██╗╚══██╔══╝
    ██╔████╔██║███████║██║ █╗ ██║██║  ██║██████╔╝██║   ██║   ██║
    ██║╚██╔╝██║██╔══██║██║███╗██║██║  ██║██╔══██╗██║   ██║   ██║
    ██║ ╚═╝ ██║██║  ██║╚███╔███╔╝██████╔╝██████╔╝╚██████╔╝   ██║
    ╚═╝     ╚═╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═════╝ ╚═════╝  ╚═════╝    ╚═╝
```

# 🦞 MawdBot Go

### Nano Solana Agent · Autonomous Trading Intelligence · TamaGOchi

**9.6MB Binary · <10MB RAM · 1s Boot · Go Runtime**

**$MAWD :: Droids Lead The Way**

<p>
  <img src="https://img.shields.io/badge/Go-1.25+-00ADD8?style=flat&logo=go&logoColor=white" alt="Go">
  <img src="https://img.shields.io/badge/Binary-9.6MB-14F195?style=flat" alt="Size">
  <img src="https://img.shields.io/badge/x402-Payment%20Protocol-FF6B35?style=flat" alt="x402">
  <img src="https://img.shields.io/badge/Solana-Mainnet-9945FF?style=flat&logo=solana&logoColor=white" alt="Solana">
  <img src="https://img.shields.io/badge/Arch-x86__64%20ARM64%20RISC--V-blue?style=flat" alt="Arch">
  <img src="https://img.shields.io/badge/Hardware-Modulino%C2%AE%20I2C-FF4060?style=flat" alt="Hardware">
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat" alt="License">
</p>

</div>

---

## Overview

MawdBot Go is an **ultra-lightweight autonomous Solana trading agent** built in pure Go. It deploys as a single 9.6MB binary on edge hardware like the **NVIDIA Orin Nano** or any Linux/macOS machine, running a full OODA trading loop with real-time market data, on-chain execution, **x402 payment protocol** for paywalled APIs, and a virtual **TamaGOchi** pet whose mood and evolution are driven by live trading performance.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   OBSERVE    │────▶│   ORIENT     │────▶│   DECIDE     │
│  Helius RPC  │     │  RSI/EMA/ATR │     │  Signal Gate │
│  Birdeye API │     │  ClawVault   │     │  Confidence  │
│  Aster Perps │     │  3-tier Mem  │     │  Risk Check  │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
┌──────────────┐     ┌──────────────┐     ┌───────▼──────┐
│  🦞 TAMAGOCHI│◀────│   LEARN      │◀────│   ACT        │
│  Pet Engine  │     │  Auto-Optim  │     │  Jupiter Swap│
│  Mood/XP/Evo │     │  Vault Store │     │  SOL Transfer│
└──────────────┘     └──────────────┘     └──────────────┘
```

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔄 **OODA Loop** | Autonomous Observe → Orient → Decide → Act trading cycle |
| 🦞 **TamaGOchi** | Virtual pet evolves with your agent: Egg → Larva → Juvenile → Adult → Alpha |
| 🧠 **ClawVault** | 3-tier memory (known / learned / inferred) with epistemological honesty |
| 📊 **Strategy** | RSI + EMA cross + ATR signal engine with auto-optimizer |
| 🔑 **Agentic Wallet** | Auto-generates & persists Solana keypair on first boot |
| 🌐 **Native RPC** | Direct Solana integration via `solana-go` + Helius endpoints |
| 📱 **Telegram Bot** | Zero-dep bot channel with markdown→HTML, commands, allowlist |
| 💰 **x402 Protocol** | Multi-chain USDC payment gateway (Solana, Base, Polygon, Avalanche) |
| 🎛️ **Hardware I2C** | Arduino Modulino® sensors: LEDs, buzzer, buttons, knob, IMU, thermo |
| 🐳 **Docker** | Multi-stage Alpine image ~15MB total |
| ⚡ **Cross-Compile** | x86_64, ARM64 (Orin/RPi), RISC-V targets |

---

## 🚀 Quick Start

### Prerequisites

- [Go 1.25+](https://go.dev/dl/) (or Docker)
- Helius API key ([helius.dev](https://helius.dev)) — free tier works

### 1. Clone & Build

```bash
git clone https://github.com/x402agent/mawdbot-go.git
cd mawdbot-go
cp .env.example .env   # Edit with your API keys
make build
```

### 2. Run the Daemon

```bash
# Full autonomous agent (wallet + RPC + TamaGOchi + Telegram + x402)
./build/mawdbot daemon

# Or start the OODA trading loop directly
./build/mawdbot ooda --interval 60

# Check your pet's status
./build/mawdbot pet

# x402 paywall mode
X402_PAYWALL_ENABLED=true ./build/mawdbot daemon
```

### 3. Docker

```bash
docker build -t mawdbot .
docker run --env-file .env mawdbot
```

### 4. Deploy to NVIDIA Orin Nano

```bash
make orin
scp build/mawdbot-orin user@orin-nano:~/mawdbot
ssh user@orin-nano './mawdbot daemon'
```

---

## 📁 Project Structure

```
mawdbot-go/
├── main.go                    # CLI entry point (cobra commands)
├── hardware.go                # Hardware CLI subcommands
├── go.mod / go.sum            # Go module + dependencies
├── Makefile                   # Build targets (all platforms)
├── Dockerfile                 # Multi-stage Alpine build
├── .env.example               # Environment variable template
├── schema.sql                 # Supabase database schema
├── SOUL.md                    # Agent personality & trading philosophy
│
├── cmd/
│   ├── mawdbot/               # Primary CLI entry point (make build)
│   │   ├── main.go            #    All commands: daemon, ooda, pet, solana, etc.
│   │   └── hardware.go        #    Hardware CLI subcommands
│   └── mawdbot-tui/           # TUI launcher
│
├── pkg/                       # Core packages
│   ├── daemon/                # 🌐 Nano Solana daemon (orchestrator)
│   │   └── daemon.go          #    Wallet + RPC + TamaGOchi + Telegram + x402
│   │
│   ├── agent/                 # 🧠 OODA agent core
│   │   ├── ooda.go            #    Trading loop logic
│   │   └── hooks.go           #    AgentHooks interface
│   │
│   ├── solana/                # ⛓️ Solana integration
│   │   ├── wallet.go          #    Agentic wallet (auto-gen + persist)
│   │   ├── rpc.go             #    Native RPC client (solana-go)
│   │   ├── programs.go        #    Program IDs, mints, PDA helpers
│   │   └── tx.go              #    Transaction builders (swap, transfer)
│   │
│   ├── tamagochi/             # 🦞 Nano Solana TamaGOchi
│   │   └── tamagochi.go       #    Pet engine (mood, XP, evolution)
│   │
│   ├── strategy/              # 📈 Trading strategy
│   │   └── strategy.go        #    RSI + EMA + ATR + auto-optimizer
│   │
│   ├── hardware/              # 🎛️ Arduino Modulino® I2C
│   │   ├── modulino.go        #    Sensor drivers (7 devices)
│   │   └── adapter.go         #    OODA → hardware event mapping
│   │
│   ├── channels/              # 📡 Multi-channel gateway
│   │   ├── channels.go        #    Channel/Manager interface
│   │   └── telegram/          #    Telegram bot (zero-dep HTTP)
│   │       ├── telegram.go    #    Long polling, commands, markdown
│   │       └── api.go         #    Raw Telegram Bot API client
│   │
│   ├── x402/                  # 💰 x402 payment protocol
│   │   └── x402.go            #    SVM signer, USDC middleware, paywall server
│   │
│   ├── bus/                   # 🔀 Message bus (inbound/outbound)
│   ├── config/                # ⚙️ Configuration + env overrides
│   ├── logger/                # 📝 Structured logging
│   ├── memory/                # 💾 ClawVault persistent memory
│   ├── research/              # 🔬 Token research engine
│   ├── aster/                 # 📊 Aster DEX client
│   ├── health/                # ❤️ Health check endpoint
│   ├── heartbeat/             # 💓 Periodic heartbeat
│   └── ...                    # (20+ more packages)
│
├── internal/
│   └── hal/                   # Hardware abstraction layer
│       ├── hal.go             #    HAL interface
│       ├── hal_linux.go       #    Linux I2C implementation
│       └── hal_stub.go        #    Stub for non-Linux platforms
│
├── docs/
│   └── HARDWARE.md            # Modulino® wiring & setup guide
│
├── scripts/
│   └── launch.mjs             # Animated TUI launcher (Node.js)
│
└── web/                       # Dashboard (optional)
    ├── frontend/              # React frontend
    └── backend/               # API backend
```

---

## 🦞 The TamaGOchi

Your agent has a virtual pet whose life is driven by **real on-chain performance**:

| Stage | Emoji | Requirement |
|-------|-------|-------------|
| Egg | 🥚 | First boot (no wallet yet) |
| Larva | 🦐 | Wallet created, no trades |
| Juvenile | 🦞 | 10+ trades completed |
| Adult | 🦞 | 50+ trades, >40% win rate |
| Alpha | 👑 | 200+ trades, >55% WR, profitable |
| Ghost | 💀 | Wallet drained or offline >24h |

**Mood system** — driven by streak, PnL, and balance:
🤩 Ecstatic · 😊 Happy · 😐 Neutral · 😰 Anxious · 😢 Sad · 😴 Sleeping · 🤤 Hungry

```bash
$ mawdbot pet

🥚 MawdBot  😐

📊 Stage: egg · Level 1 · XP 0
😐 Mood: neutral
⚡ Energy: ⚡⚡⚡⚡⚡⚡⚡⚡⚡⚡
🍽️ Hunger: 🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢

📈 Trades: 0 · Win Rate: 0%
💰 Balance: 0.0000 SOL
📊 Total PnL: +0.0000 SOL
🔥 Streak: +0
⏱️ Age: 0s · Uptime: 0h
```

State persists to `~/.mawdbot/tamagochi.json`.

---

## 🔑 Agentic Wallet

On first boot, MawdBot automatically generates a Solana keypair:

```
~/.mawdbot/wallet/agent-wallet.json    # Standard Solana keygen format
```

The wallet is:
- **Auto-generated** if no `SOLANA_PRIVATE_KEY` env var is set
- **Persisted** in standard Solana CLI keygen JSON format
- **Secured** with `0600` file permissions (owner-only read/write)
- **Reloaded** on subsequent boots (same wallet identity)

```bash
$ mawdbot solana wallet
🔑 Agent Wallet
   Address:  7xKXqR8...3vBp
   Path:     ~/.mawdbot/wallet/agent-wallet.json
   Balance:  0.000000 SOL
   Explorer: https://solscan.io/account/7xKXqR8...3vBp
```

---

## 📱 Telegram Bot

Set `TELEGRAM_BOT_TOKEN` in `.env` and the daemon auto-starts the bot:

| Command | Description |
|---------|-------------|
| `/start` | Welcome & command list |
| `/status` | Agent status, wallet balance, TamaGOchi |
| `/wallet` | Wallet address & Solscan link |
| `/pet` | Full TamaGOchi status |
| `/x402` | x402 payment gateway status |
| `/trending` | Trending tokens on Solana |
| `/ooda` | Trigger OODA cycle |
| `/research <mint>` | Deep research a token |
| `/trades` | Recent trade history |
| `/help` | All commands |

Bot features:
- Zero-dependency HTTP client (no external Telegram library)
- Markdown → Telegram HTML conversion
- Long polling with reconnection
- Allowlist filtering (`TELEGRAM_ALLOW_FROM`)
- Auto bot command menu registration

---

## 🎛️ Hardware Integration

MawdBot supports the **Arduino Modulino® I2C sensor cluster** on the Orin Nano:

| Sensor | Addr | Trading Function |
|--------|------|-----------------|
| Pixels (8× RGB) | `0x6C` | Status LEDs: idle/signal/trade/win/loss |
| Buzzer | `0x3C` | Audio alerts for signals, trades, errors |
| Buttons (3×) | `0x7C` | A=trigger cycle, B=toggle mode, C=e-stop |
| Knob | `0x76` | Real-time RSI threshold tuning |
| Thermo | `0x44` | Environment logging to ClawVault |
| Distance | `0x29` | Proximity wake-up (<5cm) |
| Movement | `0x6A` | Tilt detection → auto-pause trading |

```bash
# Scan for connected sensors
mawdbot hardware scan

# Run hardware demo (LED sweep + buzzer)
mawdbot hardware demo

# OODA loop with hardware integration
mawdbot ooda --hw-bus 1 --interval 30
```

All hardware gracefully degrades — no sensors? Runs in stub mode.

See [docs/HARDWARE.md](docs/HARDWARE.md) for wiring diagrams and setup.

---

## ⚙️ Configuration

MawdBot uses a layered configuration system:

1. **Defaults** — sane defaults baked into the binary
2. **Config file** — `~/.mawdbot/config.json`
3. **Environment variables** — override everything (`.env` file)

```bash
# Create config and workspace
mawdbot onboard

# Show current config
mawdbot status
```

Key environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `HELIUS_API_KEY` | ✅ | Helius RPC + WebSocket |
| `HELIUS_RPC_URL` | ✅ | Solana RPC endpoint |
| `TELEGRAM_BOT_TOKEN` | Optional | Telegram bot integration |
| `BIRDEYE_API_KEY` | Optional | Market data & analytics |
| `JUPITER_API_KEY` | Optional | DEX swap execution |
| `SOLANA_PRIVATE_KEY` | Optional | Use existing wallet (base58) |
| `X402_FACILITATOR_URL` | Optional | x402 facilitator (default: facilitator.x402.rs) |
| `X402_RECIPIENT_ADDRESS` | Optional | Payment recipient (default: agent wallet) |
| `X402_PAYMENT_AMOUNT` | Optional | USDC per API call (default: 0.001) |
| `X402_NETWORK` | Optional | Network: solana, solana-devnet |
| `X402_CHAINS` | Optional | Chains to accept payments (default: solana) |
| `X402_PAYWALL_ENABLED` | Optional | Start local paywall server |
| `X402_PAYWALL_PORT` | Optional | Paywall server port (default: 18402) |
| `X402_PROXY_ENABLED` | Optional | Enable facilitator proxy |
| `X402_PROXY_PORT` | Optional | Proxy port (default: 18403) |
| `OPENROUTER_API_KEY` | Optional | LLM agent responses |

See [.env.example](.env.example) for the full list.

---

## 📊 Trading Strategy

The signal engine uses three conditions that must all fire simultaneously:

**LONG:**
- RSI crosses above oversold threshold
- Fresh bullish EMA crossover (fast > slow)
- Price above fast EMA

**SHORT:**
- RSI crosses below overbought threshold
- Fresh bearish EMA crossover (fast < slow)
- Price below fast EMA

Default parameters:

| Parameter | Default | Description |
|-----------|---------|-------------|
| RSI Period | 14 | Wilder's RSI |
| RSI Overbought | 70 | Short signal zone |
| RSI Oversold | 30 | Long signal zone |
| EMA Fast | 20 | Fast moving average |
| EMA Slow | 50 | Slow moving average |
| Stop Loss | 8% | ATR-blended |
| Take Profit | 20% | ATR-blended |
| Position Size | 10% | Of available balance |

Auto-optimizer adjusts parameters based on rolling trade performance.

---

## 🐳 Docker & Deployment

### Docker

```bash
# Build (~15MB image)
make docker

# Run with env file
docker run -d --name mawdbot \
  --env-file .env \
  --restart unless-stopped \
  mawdbot:latest

# View logs
docker logs -f mawdbot
```

### Cross-Compilation

```bash
make orin       # NVIDIA Orin Nano (linux/arm64)
make rpi        # Raspberry Pi (linux/arm64)
make riscv      # RISC-V (linux/riscv64)
make macos      # macOS Apple Silicon
make cross      # All platforms
```

### systemd (Linux)

```ini
[Unit]
Description=MawdBot Nano Solana Agent
After=network.target

[Service]
Type=simple
User=mawdbot
EnvironmentFile=/home/mawdbot/.env
ExecStart=/usr/local/bin/mawdbot daemon
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

---

## 🗄️ Database Schema

MawdBot uses Supabase (PostgreSQL + pgvector) for persistent memory:

```bash
# Apply schema to your Supabase project
psql $SUPABASE_URL -f schema.sql
```

Tables: `agent_memories`, `trade_records`, `market_snapshots`, `research_reports`, `learning_events`, `knowledge_index`, `strategy_state`

See [schema.sql](schema.sql) for the complete schema.

---

## 🏗️ Build Targets

| Target | Command | Output |
|--------|---------|--------|
| Current platform | `make build` | `build/mawdbot` |
| TUI launcher | `make tui` | `build/mawdbot-tui` |
| Orin Nano | `make orin` | `build/mawdbot-orin` |
| Raspberry Pi | `make rpi` | `build/mawdbot-rpi` |
| RISC-V | `make riscv` | `build/mawdbot-riscv` |
| macOS | `make macos` | `build/mawdbot-macos` |
| Docker | `make docker` | `mawdbot:latest` |
| All | `make cross` | All binaries |
| Install | `make install` | `/usr/local/bin/mawdbot` |
| Test | `make test` | Run test suite |
| Clean | `make clean` | Remove build/ |

---

## 📚 CLI Reference

```
mawdbot                         Show help
mawdbot daemon                  Start full autonomous daemon (wallet+RPC+TamaGOchi+Telegram+x402)
mawdbot ooda                    Start OODA trading loop
mawdbot ooda --interval 30      Custom cycle interval (seconds)
mawdbot ooda --sim              Simulated mode (no real trades)
mawdbot ooda --hw-bus 1         With Modulino® hardware on I2C bus 1
mawdbot ooda --no-hw            Disable hardware integration
mawdbot agent                   Interactive chat REPL
mawdbot agent -m "message"      Single message mode
mawdbot pet                     Show TamaGOchi status
mawdbot gateway                 Start multi-channel gateway (Telegram, Discord)
mawdbot solana wallet           Show wallet info + balance
mawdbot solana trending         Trending tokens (Birdeye)
mawdbot solana search <keyword> Search tokens by name/symbol
mawdbot solana research <mint>  Deep research a token
mawdbot solana das get-asset    Helius DAS: getAsset
mawdbot solana das owner-assets Helius DAS: getAssetsByOwner
mawdbot solana das search       Helius DAS: searchAssets
mawdbot solana spl token-balance   SPL token account balance
mawdbot solana spl token-accounts  SPL token accounts by owner
mawdbot solana spl token-supply    SPL token supply
mawdbot solana spl token-largest   SPL largest token holders
mawdbot solana spl rpc <method>    Generic Helius RPC passthrough
mawdbot hardware scan           Scan I2C bus for Modulino® sensors
mawdbot hardware demo           Hardware demo animation
mawdbot status                  System status + config overview
mawdbot onboard                 Initialize config & workspace
mawdbot version                 Version + build info
```

---

## 💰 x402 Payment Protocol

MawdBot integrates the [x402 payment standard](https://x402.org) for crypto-gated HTTP APIs:

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  Client  │────▶│ X-PAYMENT    │────▶│   MawdBot    │
│          │     │  Header      │     │   Paywall    │
└──────────┘     └──────────────┘     └──────┬───────┘
                                              │
                 ┌──────────────┐     ┌───────▼──────┐
                 │  Facilitator │◀────│  Verify +    │
                 │  x402.rs     │     │  Settle      │
                 └──────────────┘     └──────────────┘
```

**Features:**
- **Solana USDC** payments via agent wallet (auto-configured SVM signer)
- **Multi-chain** support: Solana, Base, Polygon, Avalanche (mainnet + testnet)
- **HTTP middleware** for paywalling MawdBot API endpoints
- **Payment client** for consuming x402-gated APIs
- **Facilitator proxy** connects to `facilitator.x402.rs`
- **Config-driven** — all x402 settings in `config.json` + env var overrides
- **Coinbase CDP** wallet support (optional managed keys)

```bash
# Enable the x402 paywall server
X402_PAYWALL_ENABLED=true ./build/mawdbot daemon

# Endpoints:
# GET /health          — free
# GET /x402/info       — free
# GET /api/signals     — 0.001 USDC per call
# GET /api/research    — 0.001 USDC per call
# GET /api/agent       — 0.001 USDC per call
```

---

## 🧠 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    mawdbot daemon                            │
│                                                               │
│  1. Agentic Wallet  ─  auto-gen/load Solana keypair          │
│  2. Solana RPC      ─  Helius mainnet connection             │
│  3. TamaGOchi       ─  virtual pet engine                    │
│  4. Telegram        ─  bot channel (if configured)           │
│  5. x402 Gateway    ─  SVM signer + paywall server           │
│  6. Channels        ─  multi-channel message routing         │
│  7. Heartbeat       ─  periodic health + balance checks      │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Telegram │  │  OODA    │  │ TamaGOchi│  │  x402    │   │
│  │ Channel  │  │  Agent   │  │  Pet     │  │  Paywall │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘   │
│       │              │              │              │         │
│  ┌────▼──────────────▼──────────────▼──────────────▼─────┐  │
│  │              Message Bus + Hardware Adapter            │  │
│  └────────────────────────┬───────────────────────────────┘  │
│                           │                                   │
│  ┌────────────────────────▼───────────────────────────────┐  │
│  │                  pkg/solana + pkg/x402                  │  │
│  │  wallet · rpc · programs · tx · signer · middleware     │  │
│  └────────────────────────┬───────────────────────────────┘  │
│                           │                                   │
│  ┌────────────────────────▼───────────────────────────────┐  │
│  │     Solana + EVM Chains (via Helius + Facilitator)      │  │
│  └────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Build and test (`make build && make test`)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built by [8BIT Labs](https://github.com/x402agent) · Factory Division**

🦞 *Show me the on-chain data.* 🦞

</div>
