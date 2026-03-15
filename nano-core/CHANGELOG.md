# Changelog

All notable changes to NanoSolana will be documented in this file.

## [1.0.0] — 2025-03-15

### 🎉 First Stable Release

NanoSolana hits 1.0! Production-ready autonomous trading agents on Solana.

### ✨ New Features

- **`nanosolana demo`** — Zero-config simulation mode. Try the full OODA loop without any API keys.
- **SDK Examples** — 5 runnable examples: basic agent, custom strategy, webhook alerts, multi-agent mesh, and programmatic SDK usage.
- **Enhanced npm presence** — 30 discovery keywords, 12+ badges, comparison table, SDK usage docs.
- **GitHub Actions CI/CD** — Automated testing on Node 22/23, auto-publish on release with npm provenance.
- **PR & Issue Templates** — Standardized contribution workflow.
- **GitHub Sponsors** — `FUNDING.yml` for community support.

### 🛡️ Security

- AES-256-GCM vault for all secrets
- HMAC-SHA256 gateway authentication
- Ed25519 wallet signatures with timing-safe comparison
- Rate limiting: 10 conn/min, 100 msg/min

### 📦 Package

- Proper TypeScript `types` field and conditional exports
- `publishConfig` for public npm access
- `prepublishOnly` build step
- Expanded `files` to include CHANGELOG

### 🏗️ Architecture

- OODA Trading Loop (Observe → Orient → Decide → Act → Learn)
- ClawVault 3-tier epistemological memory (Known/Learned/Inferred)
- TamaGOchi virtual pet risk modifier
- Mesh networking via Tailscale VPN
- On-chain NFT identity via Metaplex (devnet)
- 40+ channel plugins (Telegram, Discord, Slack, WhatsApp, Nostr...)
- 50+ composable agent skills

## [0.2.0] — 2025-03-12

### Added

- OODA trading engine with Jupiter Ultra Swap
- ClawVault 3-tier memory with experience replay
- TamaGOchi pet engine with mood-based risk modification
- Helius blockchain scanner (DAS API, Enhanced Transactions)
- On-chain agent registry (Metaplex NFT)
- Interactive NanoBot web UI
- Gateway server (WebSocket + HTTP)
- Tailscale mesh networking
- 25+ CLI commands

## [0.1.0] — 2025-03-10

### Added

- Initial release
- Solana wallet management
- Birdeye price feeds
- Basic trading signals
- Terminal animations
