<div align="center">

```
    ███╗   ██╗ █████╗ ███╗   ██╗ ██████╗ ███████╗ ██████╗ ██╗      █████╗ ███╗   ██╗ █████╗
    ████╗  ██║██╔══██╗████╗  ██║██╔═══██╗██╔════╝██╔═══██╗██║     ██╔══██╗████╗  ██║██╔══██╗
    ██╔██╗ ██║███████║██╔██╗ ██║██║   ██║███████╗██║   ██║██║     ███████║██╔██╗ ██║███████║
    ██║╚██╗██║██╔══██║██║╚██╗██║██║   ██║╚════██║██║   ██║██║     ██╔══██║██║╚██╗██║██╔══██║
    ██║ ╚████║██║  ██║██║ ╚████║╚██████╔╝███████║╚██████╔╝███████╗██║  ██║██║ ╚████║██║  ██║
    ╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝
```

# 🐹 NanoSolana TamaGObot

### A GoBot on Solana · Physical Companion: TamaGOchi · By NanoSolana Labs

**10MB Binary · <10MB RAM · 1s Boot · Pure Go**

**Autonomous Solana Trading Intelligence with a Virtual Pet Soul**

<p>
  <img src="https://img.shields.io/badge/Go-1.25+-00ADD8?style=flat&logo=go&logoColor=white" alt="Go">
  <img src="https://img.shields.io/badge/Binary-10MB-14F195?style=flat" alt="Size">
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

**NanoSolana TamaGObot** is an ultra-lightweight autonomous Solana trading **GoBot** built in pure Go by **NanoSolana Labs**. It ships as a single **10MB binary** (`nano`) that runs on anything from an **NVIDIA Orin Nano** (via [Brev.dev](https://brev.dev) GPU cloud or bare-metal [NVIDIA Spark](https://developer.nvidia.com)) to a **Raspberry Pi** to any laptop — executing a full OODA trading loop with real-time market data, on-chain execution via Helius RPC/WSS, Jupiter swaps, **x402 payment protocol** for monetized APIs, and a virtual **TamaGObot** pet engine whose mood and evolution are driven by live trading performance. Its physical companion, **TamaGOchi**, bridges the digital agent with Arduino Modulino® I2C hardware.

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
| 🐹 **TamaGObot** | Virtual pet engine: Egg → Larva → Juvenile → Adult → Alpha (on-chain driven) |
| 🎮 **TamaGOchi** | Physical hardware pet companion (Arduino Modulino® I2C sensors) |
| 🧠 **ClawVault** | 3-tier memory (known / learned / inferred) with epistemological honesty |
| 📊 **Strategy** | RSI + EMA cross + ATR signal engine with auto-optimizer |
| 🔑 **Agentic Wallet** | Auto-generates & persists Solana keypair on first boot |
| 🌐 **Native RPC** | Direct Solana integration via `solana-go` + Helius endpoints |
| 📱 **Telegram Bot** | Zero-dep bot channel with markdown→HTML, commands, allowlist |
| 💰 **x402 Protocol** | Multi-chain USDC payment gateway (Solana, Base, Polygon, Avalanche) |
| 🎛️ **Arduino I2C** | Modulino® sensors: 8× RGB LEDs, buzzer, 3× buttons, rotary knob, IMU, thermo, ToF |
| ⛓️ **On-Chain Engine** | Native Solana SDK (gagliardetto/solana-go) + Helius RPC/WSS + Jupiter swaps |
| 🔄 **Jupiter Swaps** | DEX swap quotes + execution via Jupiter Ultra API with auto priority fees |
| 🌐 **Native Gateway** | Pure Go TCP bridge with token auth, Tailscale mesh, tmux management |
| 🟢 **NVIDIA Orin Nano** | Native ARM64 binary for Jetson edge AI hardware |
| ☁️ **Brev.dev** | One-click GPU cloud deployment for NVIDIA Spark instances |
| 🐳 **Docker** | Multi-stage Alpine image ~15MB total |
| ⚡ **Cross-Compile** | x86_64, ARM64 (Orin/RPi), RISC-V targets |

---

## 🚀 How to Use Right Now

### One-Shot Install

```bash
# Curl one-shot:
curl -fsSL https://raw.githubusercontent.com/x402agent/nano-solana-go/main/install.sh | bash

# Include web console:
curl -fsSL https://raw.githubusercontent.com/x402agent/nano-solana-go/main/install.sh | bash -s -- --with-web

# npm wrapper (local/dev form):
npx -y ./npm/mawdbot-installer --with-web
```

This installs:
- `nanosolana` — the 10MB trading agent binary
- `~/.nanosolana/wallet/` — auto-generated agentic Solana wallet
- `~/.nanosolana/workspace/vault/` — persistent ClawVault memory
- `web/frontend/dist/` — interactive docs console (when `--with-web`)

### Prerequisites

- [Go 1.25+](https://go.dev/dl/) (or Docker)
- Helius API key ([helius.dev](https://helius.dev)) — free tier works

### 1. Clone & Build

```bash
git clone https://github.com/x402agent/nano-solana-go.git
cd nano-solana-go
cp .env.example .env   # Edit with your API keys
make build
```

### 2. Run the GoBot

```bash
# Full autonomous GoBot (wallet + RPC + TamaGOchi + Telegram + x402)
./build/nanosolana daemon

# Seeker profile (branding + SeekerClaw pet identity)
./build/nanosolana daemon --seeker --pet-name SeekerClaw

# Daemon safe mode (no Telegram + no OODA autostart)
./build/nanosolana daemon --seeker --no-telegram --no-ooda

# Start the OODA trading loop directly
./build/nanosolana ooda --interval 60

# Simulated mode (no real money)
./build/nanosolana ooda --sim --interval 30

# Check your pet's status
./build/nanosolana pet

# On-chain tools (live Solana data via Helius)
./build/nanosolana solana health
./build/nanosolana solana balance [pubkey]

# Native gateway (no OpenClaw, pure Go)
./build/nanosolana gateway start
./build/nanosolana gateway stop

# x402 paywall mode (monetize your agent's API)
X402_PAYWALL_ENABLED=true ./build/nanosolana daemon
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
scp build/nanosolana-orin user@orin-nano:~/nanosolana
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
nano-solana-go/
├── main.go                    # CLI entry point (`nano` binary, cobra commands)
├── hardware.go                # Hardware CLI subcommands
├── go.mod / go.sum            # Go module + dependencies
├── Makefile                   # Build targets (all platforms)
├── Dockerfile                 # Multi-stage Alpine build
├── .env.example               # Environment variable template
├── SECURITY.md                # Security policy & secret handling
├── CONTRIBUTING.md            # Contributor guide
├── schema.sql                 # Supabase database schema
├── SOUL.md                    # GoBot personality & trading philosophy
├── skills/                    # Agent skills (SKILL.md format)
│
├── cmd/
│   ├── mawdbot/               # Primary CLI entry point (builds `nano`)
│   │   ├── main.go            #   All commands: daemon, ooda, pet, solana, gateway, hardware
│   │   └── hardware.go        #   Arduino Modulino® I2C commands
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
│   │   ├── wallet.go          #   Agentic wallet (auto-gen at ~/.nanosolana/wallet/)
│   │   ├── rpc.go             #   Native RPC client (solana-go)
│   │   ├── clients.go         #   Helius, Birdeye, Jupiter, Aster clients
│   │   ├── programs.go        #   Program IDs, mints, PDA helpers
│   │   └── tx.go              #   Transaction builders (swap, transfer)
│   │
│   ├── onchain/               # ⛓️ On-chain financial engine (NEW)
│   │   ├── engine.go          #   Helius RPC/WSS: balance, txns, transfers, fees, WSS
│   │   └── jupiter.go         #   Jupiter Ultra API: quotes, swaps, well-known mints
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
│   ├── gateway/               # 🌐 Native TCP bridge gateway
│   │   ├── bridge.go          #   Pure Go TCP server, token auth, Tailscale
│   │   └── spawn.go           #   tmux-based gateway lifecycle
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
$ nanosolana pet

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

State persists to `~/.nanosolana/tamagochi.json`.

---

## 🔑 Agentic Wallet

On first boot, NanoSolana automatically generates a Solana keypair:

```
~/.nanosolana/wallet/agent-wallet.json    # Standard Solana keygen format
```

The wallet is:
- **Auto-generated** if no `SOLANA_PRIVATE_KEY` env var is set
- **Persisted** in standard Solana CLI keygen JSON format
- **Secured** with `0600` file permissions (owner-only read/write)
- **Reloaded** on subsequent boots (same wallet identity)

```bash
$ nanosolana solana wallet
🔑 Agent Wallet
   Address:  7xKXqR8...3vBp
   Path:     ~/.nanosolana/wallet/agent-wallet.json
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
nanosolana hardware scan --bus 1

# Run full hardware self-test (LED sweep + buzzer + sensor reads)
nanosolana hardware test --bus 1

# Live sensor monitor (real-time readings, Ctrl+C to stop)
nanosolana hardware monitor --bus 1 --interval 200

# Play trading event demo animations
# (startup → signal → trade open → win → loss → learning → error → idle)
nanosolana hardware demo --bus 1

# OODA loop with hardware integration
nanosolana ooda --hw-bus 1 --interval 30

# OODA loop without hardware (software-only)
nanosolana ooda --no-hw --interval 60
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
| `/sim` | Switch OODA runtime to simulated mode |
| `/live` | Switch OODA runtime to live mode |
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
2. **Config file** — `~/.nanosolana/config.json`
3. **Environment variables** — override everything (`.env` file)

```bash
# Create config and workspace
nanosolana onboard

# Show current config
nanosolana status
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
| `OPENROUTER_MODEL` | Optional | OpenRouter model override (default: `openrouter/healer-alpha`) |
| `ANTHROPIC_API_KEY` | Optional | LLM agent responses (Anthropic) |
| `X402_FACILITATOR_URL` | Optional | x402 facilitator (default: facilitator.x402.rs) |
| `X402_RECIPIENT_ADDRESS` | Optional | Payment recipient (default: agent wallet) |
| `X402_PAYMENT_AMOUNT` | Optional | USDC per API call (default: 0.001) |
| `X402_NETWORK` | Optional | Network: solana, solana-devnet |
| `X402_PAYWALL_ENABLED` | Optional | Start local paywall server |

See [.env.example](.env.example) for the full list.

### OpenRouter Multimodal Example (`openrouter/healer-alpha`)

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
export OPENROUTER_MODEL="openrouter/healer-alpha"
```

#### JavaScript `fetch`

```js
fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "HTTP-Referer": "https://your-site.example", // Optional
    "X-OpenRouter-Title": "NanoSolana", // Optional
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    model: process.env.OPENROUTER_MODEL || "openrouter/healer-alpha",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "What is in this image, audio and video?" },
          {
            type: "image_url",
            image_url: { url: "https://live.staticflickr.com/3851/14825276609_098cac593d_b.jpg" }
          },
          {
            type: "input_audio",
            input_audio: {
              data: "UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB",
              format: "wav"
            }
          },
          {
            type: "video_url",
            video_url: { url: "https://storage.googleapis.com/cloud-samples-data/video/JaneGoodall.mp4" }
          }
        ]
      }
    ]
  })
});
```

#### OpenAI SDK (OpenRouter base URL)

```js
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "https://your-site.example", // Optional
    "X-OpenRouter-Title": "NanoSolana" // Optional
  }
});

const completion = await openai.chat.completions.create({
  model: process.env.OPENROUTER_MODEL || "openrouter/healer-alpha",
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "What is in this image, audio and video?" },
        {
          type: "image_url",
          image_url: { url: "https://live.staticflickr.com/3851/14825276609_098cac593d_b.jpg" }
        },
        {
          type: "input_audio",
          input_audio: {
            data: "UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB",
            format: "wav"
          }
        },
        {
          type: "video_url",
          video_url: { url: "https://storage.googleapis.com/cloud-samples-data/video/JaneGoodall.mp4" }
        }
      ]
    }
  ]
});

console.log(completion.choices[0].message);
```

#### cURL

```bash
curl https://openrouter.ai/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENROUTER_API_KEY" \
  -d '{
    "model": "openrouter/healer-alpha",
    "messages": [
      {
        "role": "user",
        "content": [
          { "type": "text", "text": "What is in this image, audio and video?" },
          {
            "type": "image_url",
            "image_url": { "url": "https://live.staticflickr.com/3851/14825276609_098cac593d_b.jpg" }
          },
          {
            "type": "input_audio",
            "input_audio": { "data": "UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB", "format": "wav" }
          },
          {
            "type": "video_url",
            "video_url": { "url": "https://storage.googleapis.com/cloud-samples-data/video/JaneGoodall.mp4" }
          }
        ]
      }
    ]
  }'
```

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
X402_PAYWALL_ENABLED=true ./build/nanosolana daemon

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
  nanosolana:latest

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
ExecStart=/usr/local/bin/nanosolana daemon
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
| Current platform | `make build` | `build/nanosolana` |
| Slim profile | `make slim` | `build/nanosolana-slim` |
| Size comparison | `make size-report` | Standard vs slim delta |
| TUI launcher | `make tui` | `build/nanosolana-tui` |
| NVIDIA Orin Nano / Spark | `make orin` | `build/nanosolana-orin` |
| Raspberry Pi | `make rpi` | `build/nanosolana-rpi` |
| RISC-V | `make riscv` | `build/nanosolana-riscv` |
| macOS | `make macos` | `build/nanosolana-macos` |
| Docker | `make docker` | `nanosolana:latest` |
| All | `make cross` | All binaries |
| Install | `make install` | `/usr/local/bin/nanosolana` |
| Test | `make test` | Run test suite |
| Clean | `make clean` | Remove build/ |

---

## 📚 CLI Reference

```
nanosolana                             Show help
nanosolana daemon                      Start full GoBot (wallet+RPC+TamaGOchi+Telegram+x402)
nanosolana daemon --seeker              Start Seeker-branded daemon mode
nanosolana daemon --pet-name X          Override TamaGOchi pet identity
nanosolana daemon --no-telegram         Disable Telegram channel startup
nanosolana daemon --no-ooda             Keep daemon online without OODA autostart
nanosolana ooda                         Start OODA trading loop
nanosolana ooda --interval 30           Custom cycle interval (seconds)
nanosolana ooda --sim                   Simulated mode (no real trades)
nanosolana ooda --hw-bus 1              With Modulino® hardware on I2C bus 1
nanosolana ooda --no-hw                 Disable hardware integration
nanosolana agent                        Interactive chat REPL
nanosolana agent -m "message"           Single message mode
nanosolana pet                          Show TamaGOchi status
nanosolana gateway start                Start native TCP bridge gateway
nanosolana gateway start --port 19001   Custom gateway port
nanosolana gateway stop                 Stop gateway tmux session
nanosolana channels                     Start multi-channel gateway (Telegram, Discord)
nanosolana solana health                Check Helius RPC health + network status
nanosolana solana balance [pubkey]      Check SOL + SPL token balances
nanosolana solana wallet                Show wallet info + balance
nanosolana solana trending              Trending tokens (Birdeye)
nanosolana solana research <mint>       Deep research a token
nanosolana node pair                    Pair this node with a gateway
nanosolana node run                     Run headless node client
nanosolana hardware scan                Scan I2C bus for Modulino® sensors
nanosolana hardware test                Run hardware self-test
nanosolana hardware monitor             Live sensor readings
nanosolana hardware demo                Play trading event animations
nanosolana status                       System status + config overview
nanosolana onboard                      Initialize config & workspace
nanosolana version                      Version + build info
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
