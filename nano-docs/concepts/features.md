---
summary: "NanoSolana features overview and capabilities"
title: "Features"
---

# Features

NanoSolana is an autonomous Solana trading agent with a virtual pet soul.

## Core capabilities

### 🤖 Autonomous trading (OODA loop)
- **Observe**: Real-time Solana data via Helius RPC/WSS and Birdeye API.
- **Orient**: AI-powered market analysis using OpenRouter (healer-alpha model).
- **Decide**: Structured trade decisions with confidence scoring.
- **Act**: Jupiter Ultra Swap execution with slippage protection.
- **Learn**: ClawVault memory records every outcome for future improvement.

### 🧠 Epistemological memory (ClawVault)
- **KNOWN**: Fresh API data (<60s TTL) — what the agent just saw.
- **LEARNED**: Patterns from trade outcomes (7-day TTL) — what worked.
- **INFERRED**: Tentative correlations (3-day TTL) — hypotheses to test.
- Temporal decay, experience replay, and contradiction detection.

### 🐾 TamaGOchi pet engine
- Virtual pet that evolves based on trading performance.
- Stages: Egg → Larva → Juvenile → Adult → Alpha → Ghost.
- Mood affects risk tolerance (happy = more aggressive, sick = conservative).
- Feed to keep alive; neglect leads to Ghost state (trading disabled).

### 💰 Solana wallet
- Ed25519 keypair generated at agent "birth."
- Private key stored in AES-256-GCM encrypted vault.
- SOL and SPL token balance tracking.
- Transaction history and P&L tracking.

### 🌐 Mesh networking
- Tailscale VPN for agent-to-agent communication.
- Tmux session management for bot persistence.
- Memory and signal sharing across the mesh.

### 📱 Multi-channel
- **Telegram**: Persistent conversations with full memory.
- **Discord**: Trading signals and alerts.
- **Nostr**: Decentralized signal relay.
- **iMessage**: Apple Messages integration.
- **Google Chat**: Team notifications.
- 14+ extension plugins available.

### 🔐 Security-first
- AES-256-GCM encrypted secrets vault.
- HMAC-SHA256 authenticated gateway connections.
- Timing-safe token comparison.
- Rate limiting on all endpoints.
- Wallet private key never leaves the vault.

### 📊 Strategy engine
- RSI + EMA + ATR indicator system.
- Auto-optimizer adjusts parameters after every 20 trades.
- Kelly Criterion position sizing.
- Configurable stop-loss and take-profit.

### 🤝 AI integration
- OpenRouter API with healer-alpha multimodal model.
- SOUL.md system prompt defines agent identity and philosophy.
- Multimodal input support (text, image, audio, video).
- OODA-structured reasoning (orient, decide, research, chat).
