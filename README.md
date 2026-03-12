<div align="center">

```
    ███╗   ██╗ █████╗ ███╗   ██╗ ██████╗ ███████╗ ██████╗ ██╗      █████╗ ███╗   ██╗ █████╗
    ████╗  ██║██╔══██╗████╗  ██║██╔═══██╗██╔════╝██╔═══██╗██║     ██╔══██╗████╗  ██║██╔══██╗
    ██╔██╗ ██║███████║██╔██╗ ██║██║   ██║███████╗██║   ██║██║     ███████║██╔██╗ ██║███████║
    ██║╚██╗██║██╔══██║██║╚██╗██║██║   ██║╚════██║██║   ██║██║     ██╔══██║██║╚██╗██║██╔══██║
    ██║ ╚████║██║  ██║██║ ╚████║╚██████╔╝███████║╚██████╔╝███████╗██║  ██║██║ ╚████║██║  ██║
    ╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝
```

# 🐹 NanoSolana TamaGOchi

### A GoBot on Solana · Powered by NanoSolana OS · x402 Protocol

**9.6MB Binary · <10MB RAM · 1s Boot · Pure Go**

**Autonomous Solana Trading Intelligence with a Virtual Pet Soul**

<p>
  <img src="https://img.shields.io/badge/Go-1.25+-00ADD8?style=flat&logo=go&logoColor=white" alt="Go">
  <img src="https://img.shields.io/badge/Binary-9.6MB-14F195?style=flat" alt="Size">
  <img src="https://img.shields.io/badge/x402-Payment%20Protocol-FF6B35?style=flat" alt="x402">
  <img src="https://img.shields.io/badge/Solana-Mainnet-9945FF?style=flat&logo=solana&logoColor=white" alt="Solana">
  <img src="https://img.shields.io/badge/NVIDIA-Orin%20Nano%20%C2%B7%20Spark-76B900?style=flat&logo=nvidia&logoColor=white" alt="NVIDIA">
  <img src="https://img.shields.io/badge/Brev.dev-GPU%20Cloud-4A90D9?style=flat" alt="Brev">
  <img src="https://img.shields.io/badge/Arduino-Modulino%C2%AE%20I2C-00979D?style=flat&logo=arduino&logoColor=white" alt="Arduino">
  <img src="https://img.shields.io/badge/Arch-x86__64%20ARM64%20RISC--V-blue?style=flat" alt="Arch">
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat" alt="License">
</p>

</div>

---

## Overview

**NanoSolana TamaGOchi** is an ultra-lightweight autonomous Solana trading **GoBot** built in pure Go. It ships as a single **9.6MB binary** that runs on anything from an **NVIDIA Orin Nano** (via [Brev.dev](https://brev.dev) GPU cloud or bare-metal [NVIDIA Spark](https://developer.nvidia.com)) to a **Raspberry Pi** to any laptop — executing a full OODA trading loop with real-time market data, on-chain execution, **x402 payment protocol** for monetized APIs, and a virtual **TamaGOchi** pet whose mood and evolution are driven by live trading performance.

The GoBot bridges **software intelligence** (LLM-powered OODA agent, RSI/EMA/ATR strategy, ClawVault memory) with **physical hardware** (Arduino Modulino® I2C sensor cluster) — LEDs pulse with trade signals, buzzers chirp on wins, a rotary knob tunes RSI thresholds in real-time, and a 6-axis IMU auto-pauses trading if you tilt the device.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   OBSERVE    │────▶│   ORIENT     │────▶│   DECIDE     │
│  Helius RPC  │     │  RSI/EMA/ATR │     │  Signal Gate │
│  Birdeye API │     │  ClawVault   │     │  Confidence  │
│  Aster Perps │     │  3-tier Mem  │     │  Risk Check  │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
┌──────────────┐     ┌──────────────┐     ┌───────▼──────┐
│ 🐹 TAMAGOCHI │◀────│   LEARN      │◀────│   ACT        │
│  Pet Engine  │     │  Auto-Optim  │     │  Jupiter Swap│
│  Mood/XP/Evo │     │  Vault Store │     │  SOL Transfer│
└──────────────┘     └──────────────┘     └──────────────┘
        │                                         │
┌───────▼─────────────────────────────────────────▼──────┐
│            🎛️ Arduino Modulino® Hardware Layer          │
│  Pixels · Buzzer · Buttons · Knob · IMU · Thermo · ToF │
└────────────────────────────────────────────────────────┘
```

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔄 **OODA Loop** | Autonomous Observe → Orient → Decide → Act trading cycle |
| 🐹 **TamaGOchi** | Virtual pet evolves with your GoBot: Egg → Larva → Juvenile → Adult → Alpha |
| 🧠 **ClawVault** | 3-tier memory (known / learned / inferred) with epistemological honesty |
| 📊 **Strategy** | RSI + EMA cross + ATR signal engine with auto-optimizer |
| 🔑 **Agentic Wallet** | Auto-generates & persists Solana keypair on first boot |
| 🌐 **Native RPC** | Direct Solana integration via `solana-go` + Helius endpoints |
| 📱 **Telegram Bot** | Zero-dep bot channel with markdown→HTML, commands, allowlist |
| 💰 **x402 Protocol** | Multi-chain USDC payment gateway (Solana, Base, Polygon, Avalanche) |
| 🎛️ **Arduino I2C** | Modulino® sensors: 8× RGB LEDs, buzzer, 3× buttons, rotary knob, IMU, thermo, ToF |
| 🟢 **NVIDIA Orin Nano** | Native ARM64 binary for Jetson edge AI hardware |
| ☁️ **Brev.dev** | One-click GPU cloud deployment for NVIDIA Spark instances |
| 🐳 **Docker** | Multi-stage Alpine image ~15MB total |
| ⚡ **Cross-Compile** | x86_64, ARM64 (Orin/RPi), RISC-V targets |

---

## 🚀 Quick Start

### Prerequisites

- [Go 1.25+](https://go.dev/dl/) (or Docker)
- Helius API key ([helius.dev](https://helius.dev)) — free tier works

### 1. Clone & Build

```bash
git clone https://github.com/x402agent/NanoSolana-tamaGOchi.git
cd NanoSolana-tamaGOchi
cp .env.example .env   # Edit with your API keys
make build
```

### 2. Run the GoBot

```bash
# Full autonomous GoBot (wallet + RPC + TamaGOchi + Telegram + x402)
./build/mawdbot daemon

# Start the OODA trading loop directly
./build/mawdbot ooda --interval 60

# Simulated mode (no real money)
./build/mawdbot ooda --sim --interval 30

# Check your pet's status
./build/mawdbot pet

# x402 paywall mode (monetize your agent's API)
X402_PAYWALL_ENABLED=true ./build/mawdbot daemon
```

### 3. Docker

```bash
docker build -t nanosolana .
docker run --env-file .env nanosolana
```

### 4. Deploy to NVIDIA Orin Nano

```bash
# Cross-compile for ARM64
make orin

# Deploy to your Orin Nano (bare-metal or via Brev.dev)
scp build/mawdbot-orin user@orin-nano:~/nanosolana
ssh user@orin-nano './nanosolana daemon'
```

### 5. Deploy to Brev.dev (NVIDIA Spark GPU Cloud)

```bash
# Create a Brev instance with NVIDIA GPU
brev create nanosolana --gpu

# SSH in and run
brev shell nanosolana
./nanosolana daemon
```

---

## 📁 Project Structure

```
NanoSolana-tamaGOchi/
├── main.go                    # CLI entry point (cobra commands)
├── hardware.go                # Hardware CLI subcommands
├── go.mod / go.sum            # Go module + dependencies
├── Makefile                   # Build targets (all platforms)
├── Dockerfile                 # Multi-stage Alpine build
├── .env.example               # Environment variable template
├── SECURITY.md                # Security policy & secret handling
├── CONTRIBUTING.md            # Contributor guide
├── schema.sql                 # Supabase database schema
├── SOUL.md                    # GoBot personality & trading philosophy
│
├── cmd/
│   ├── mawdbot/               # Primary CLI entry point (make build)
│   │   ├── main.go            #   All commands: daemon, ooda, pet, solana, hardware
│   │   └── hardware.go        #   Arduino Modulino® I2C commands (scan/test/monitor/demo)
│   └── mawdbot-tui/           # TUI launcher
│
├── pkg/                       # Core packages
│   ├── daemon/                # 🌐 NanoSolana daemon (orchestrator)
│   │   └── daemon.go          #   Wallet + RPC + TamaGOchi + Telegram + x402
│   │
│   ├── agent/                 # 🧠 OODA agent core
│   │   ├── ooda.go            #   Trading loop logic
│   │   └── hooks.go           #   AgentHooks interface (→ hardware adapter)
│   │
│   ├── solana/                # ⛓️ Solana integration
│   │   ├── wallet.go          #   Agentic wallet (auto-gen + persist)
│   │   ├── rpc.go             #   Native RPC client (solana-go)
│   │   ├── clients.go         #   Helius, Birdeye, Jupiter, Aster clients
│   │   ├── programs.go        #   Program IDs, mints, PDA helpers
│   │   └── tx.go              #   Transaction builders (swap, transfer)
│   │
│   ├── tamagochi/             # 🐹 TamaGOchi pet engine
│   │   └── tamagochi.go       #   Mood, XP, evolution, on-chain performance
│   │
│   ├── strategy/              # 📈 Trading strategy
│   │   └── strategy.go        #   RSI + EMA + ATR + auto-optimizer
│   │
│   ├── hardware/              # 🎛️ Arduino Modulino® I2C drivers
│   │   ├── modulino.go        #   7 sensor drivers (Pixels, Buzzer, Buttons, Knob, IMU, Thermo, ToF)
│   │   └── adapter.go         #   OODA → hardware event mapping (signal→LED, trade→buzzer)
│   │
│   ├── channels/              # 📡 Multi-channel gateway
│   │   ├── channels.go        #   Channel/Manager interface
│   │   └── telegram/          #   Telegram bot (zero-dep HTTP)
│   │
│   ├── x402/                  # 💰 x402 payment protocol
│   │   └── x402.go            #   SVM signer, USDC middleware, paywall server
│   │
│   ├── bus/                   # 🔀 Message bus (inbound/outbound)
│   ├── config/                # ⚙️ Configuration + env overrides
│   ├── memory/                # 💾 ClawVault persistent memory
│   ├── aster/                 # 📊 Aster DEX perp futures client
│   └── ...                    # (20+ more packages)
│
├── internal/
│   └── hal/                   # Hardware Abstraction Layer
│       ├── hal.go             #   HAL interface
│       ├── hal_linux.go       #   Linux I2C implementation (Orin Nano / RPi)
│       └── hal_stub.go        #   Stub for non-Linux (macOS, Windows)
│
├── docs/
│   └── HARDWARE.md            # Modulino® wiring & setup guide
│
└── web/                       # Dashboard (optional)
    ├── frontend/              # React frontend
    └── backend/               # API backend
```

---

## 🐹 The TamaGOchi

Your GoBot has a virtual pet whose life is driven by **real on-chain performance**:

| Stage | Emoji | Requirement |
|-------|-------|-------------|
| Egg | 🥚 | First boot (no wallet yet) |
| Larva | 🦐 | Wallet created, no trades |
| Juvenile | 🐹 | 10+ trades completed |
| Adult | 🐹 | 50+ trades, >40% win rate |
| Alpha | 👑 | 200+ trades, >55% WR, profitable |
| Ghost | 💀 | Wallet drained or offline >24h |

**Mood system** — driven by streak, PnL, and balance:
🤩 Ecstatic · 😊 Happy · 😐 Neutral · 😰 Anxious · 😢 Sad · 😴 Sleeping · 🤤 Hungry

```bash
$ mawdbot pet

🥚 NanoSolana  😐

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

On first boot, NanoSolana automatically generates a Solana keypair:

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

## 🎛️ Hardware Integration — Arduino Modulino® + NVIDIA Orin Nano

NanoSolana TamaGOchi bridges **software intelligence** with **physical hardware** via the Arduino Modulino® I2C sensor cluster. The GoBot talks to 7 sensors over a single Qwiic/I2C cable connected to the NVIDIA Orin Nano (JetPack 6.x), NVIDIA Spark, Raspberry Pi, or any Linux SBC.

### Supported Hardware Platforms

| Platform | Arch | Deploy Method |
|----------|------|--------------|
| **NVIDIA Orin Nano** | ARM64 | `make orin` → bare-metal or [JetPack 6.x](https://developer.nvidia.com/embedded/jetpack) |
| **NVIDIA Spark** | ARM64 | Via [Brev.dev](https://brev.dev) GPU cloud instances |
| **Raspberry Pi 4/5** | ARM64 | `make rpi` → direct I2C on GPIO |
| **Any Linux SBC** | ARM64/x86 | Standard `/dev/i2c-*` interface |
| **macOS / Windows** | x86/ARM | Runs in **stub mode** (no I2C, software-only) |

### Arduino Modulino® Sensor Cluster

| Sensor | I2C Addr | Chip | GoBot Function |
|--------|----------|------|---------------|
| **Pixels** (8× RGB LED) | `0x6C` | LC8822 | Status display: idle 🔵 · signal 🟣 · trade 🟡 · win 🟢 · loss 🔴 |
| **Buzzer** | `0x3C` | PKLCS1212E | Audio alerts for signals, trades, wins, losses, errors |
| **Buttons** (3× push) | `0x7C` | — | A = trigger OODA cycle · B = toggle sim/live · C = emergency stop |
| **Knob** (rotary encoder) | `0x76` | PEC11J | Real-time RSI threshold tuning (turn = adjust, press = reset) |
| **Thermo** | `0x44` | HS3003 | Temperature + humidity → logged to ClawVault |
| **Distance** (ToF) | `0x29` | VL53L4CD | Proximity wake-up (<5cm triggers cycle) |
| **Movement** (6-axis IMU) | `0x6A` | LSM6DSOX | Tilt detection → auto-pause trading |

### Hardware CLI

```bash
# Scan I2C bus for connected Modulino® sensors
mawdbot hardware scan --bus 1

# Run full hardware self-test (LED sweep + buzzer + sensor reads)
mawdbot hardware test --bus 1

# Live sensor monitor (real-time readings, Ctrl+C to stop)
mawdbot hardware monitor --bus 1 --interval 200

# Play trading event demo animations
# (startup → signal → trade open → win → loss → learning → error → idle)
mawdbot hardware demo --bus 1

# OODA loop with hardware integration
mawdbot ooda --hw-bus 1 --interval 30

# OODA loop without hardware (software-only)
mawdbot ooda --no-hw --interval 60
```

### How Hardware Integrates with the OODA Loop

```
OODA Event              │  Pixels (8× LED)    │  Buzzer           │  Knob
─────────────────────────┼──────────────────────┼────────────────────┼──────────────────
Agent idle               │  Slow blue pulse     │  —                │  —
Signal detected          │  Purple flash        │  Double chirp     │  —
Trade opened             │  Yellow sweep        │  Rising tone      │  —
Win (+PnL)               │  Green cascade       │  Victory fanfare  │  —
Loss (-PnL)              │  Red blink ×2        │  Low buzz         │  —
Learning cycle           │  Purple pulse ×3     │  —                │  —
Error                    │  Solid red           │  Error tone       │  —
Knob turned              │  —                   │  —                │  RSI ± adjust
Knob pressed             │  —                   │  —                │  RSI reset
Button A                 │  —                   │  —                │  Trigger cycle
Button B                 │  —                   │  —                │  Toggle sim/live
Button C                 │  —                   │  —                │  Emergency stop
```

All hardware **gracefully degrades** — no sensors connected? Runs in stub mode with zero errors.

See [docs/HARDWARE.md](docs/HARDWARE.md) for wiring diagrams and physical setup.

---

## 📱 Telegram Bot

Set `TELEGRAM_BOT_TOKEN` in `.env` and the daemon auto-starts the bot:

| Command | Description |
|---------|-------------|
| `/start` | Welcome & command list |
| `/status` | GoBot status, wallet balance, TamaGOchi |
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

## ⚙️ Configuration

NanoSolana uses a layered configuration system:

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
| `OPENROUTER_API_KEY` | Optional | LLM agent responses |
| `ANTHROPIC_API_KEY` | Optional | LLM agent responses (Anthropic) |
| `X402_FACILITATOR_URL` | Optional | x402 facilitator (default: facilitator.x402.rs) |
| `X402_RECIPIENT_ADDRESS` | Optional | Payment recipient (default: agent wallet) |
| `X402_PAYMENT_AMOUNT` | Optional | USDC per API call (default: 0.001) |
| `X402_NETWORK` | Optional | Network: solana, solana-devnet |
| `X402_PAYWALL_ENABLED` | Optional | Start local paywall server |

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

## 💰 x402 Payment Protocol

NanoSolana integrates the [x402 payment standard](https://x402.org) for crypto-gated HTTP APIs:

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  Client  │────▶│ X-PAYMENT    │────▶│ NanoSolana   │
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
- **HTTP middleware** for paywalling GoBot API endpoints
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

## 🐳 Docker & Deployment

### Docker

```bash
# Build (~15MB image)
make docker

# Run with env file
docker run -d --name nanosolana \
  --env-file .env \
  --restart unless-stopped \
  mawdbot:latest

# View logs
docker logs -f nanosolana
```

### Cross-Compilation

```bash
make orin       # NVIDIA Orin Nano / Spark (linux/arm64)
make rpi        # Raspberry Pi (linux/arm64)
make riscv      # RISC-V (linux/riscv64)
make macos      # macOS Apple Silicon
make cross      # All platforms
```

### systemd (Linux / Orin Nano)

```ini
[Unit]
Description=NanoSolana TamaGOchi GoBot
After=network.target

[Service]
Type=simple
User=nanosolana
EnvironmentFile=/home/nanosolana/.env
ExecStart=/usr/local/bin/mawdbot daemon
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

---

## 🗄️ Database Schema

NanoSolana uses Supabase (PostgreSQL + pgvector) for persistent memory:

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
| NVIDIA Orin Nano / Spark | `make orin` | `build/mawdbot-orin` |
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
mawdbot daemon                  Start full GoBot (wallet+RPC+TamaGOchi+Telegram+x402)
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
mawdbot hardware scan           Scan I2C bus for Modulino® sensors
mawdbot hardware test           Run hardware self-test
mawdbot hardware monitor        Live sensor readings
mawdbot hardware demo           Play trading event animations
mawdbot status                  System status + config overview
mawdbot onboard                 Initialize config & workspace
mawdbot version                 Version + build info
```

---

## 🧠 Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                  NanoSolana TamaGOchi Daemon                    │
│                                                                  │
│  1. Agentic Wallet  ─  auto-gen/load Solana keypair             │
│  2. Solana RPC      ─  Helius mainnet connection                │
│  3. TamaGOchi       ─  virtual pet engine (on-chain driven)    │
│  4. Telegram        ─  bot channel (if configured)              │
│  5. x402 Gateway    ─  SVM signer + paywall server             │
│  6. Channels        ─  multi-channel message routing            │
│  7. Heartbeat       ─  periodic health + balance checks         │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │ Telegram │  │  OODA    │  │ TamaGOchi│  │  x402    │      │
│  │ Channel  │  │  Agent   │  │  Pet     │  │  Paywall │      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
│       │              │              │              │            │
│  ┌────▼──────────────▼──────────────▼──────────────▼────────┐  │
│  │         Message Bus + Arduino Hardware Adapter            │  │
│  │     (Pixels · Buzzer · Buttons · Knob · IMU · Thermo)    │  │
│  └─────────────────────────┬────────────────────────────────┘  │
│                            │                                     │
│  ┌─────────────────────────▼────────────────────────────────┐  │
│  │                pkg/solana + pkg/x402                       │  │
│  │  wallet · rpc · programs · tx · signer · middleware       │  │
│  └─────────────────────────┬────────────────────────────────┘  │
│                            │                                     │
│  ┌─────────────────────────▼────────────────────────────────┐  │
│  │    Solana Mainnet (via Helius + Jupiter + Birdeye)         │  │
│  └──────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

---

## 🔒 Security

NanoSolana uses **zero hardcoded secrets**. All API keys and credentials come from environment variables (`.env` file), which is gitignored.

- See [SECURITY.md](SECURITY.md) for the full security policy and vulnerability reporting
- See [.env.example](.env.example) for the complete environment variable reference
- Private keys are never logged — only public addresses appear in output

---

## 🤝 Contributing

We'd love your contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide.

**Quick version:**

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Build and test (`make build && make test`)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

> ⚠️ **Security rule:** Never commit API keys or `.env` files. See [SECURITY.md](SECURITY.md).

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with Go on Solana · Powered by x402 Protocol**

**[NanoSolana OS](https://github.com/x402agent) · Arduino Modulino® · NVIDIA Orin Nano**

🐹 *A GoBot with a soul.* 🐹

</div>
