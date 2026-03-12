# NanoSolana Android App

**Status: Alpha** — Android companion for your TamaGObot trading agent.

## Features

- 📊 Real-time trading dashboard with P&L tracking
- 🐾 TamaGOchi pet status and feeding
- 💬 Chat with your agent (Telegram bridge)
- 🔔 Push notifications for trade signals
- 🔐 Biometric lock + encrypted token storage
- 📡 QR code pairing with NanoSolana gateway

## Build & Run

```bash
cd apps/android
./gradlew :app:assembleDebug
./gradlew :app:installDebug
```

## Connect to Gateway

```bash
# Terminal 1: Start gateway
nanosolana gateway run --port 18789

# Terminal 2: USB tunnel
adb reverse tcp:18789 tcp:18789
```

In app **Connect → Manual**: Host `127.0.0.1`, Port `18789`, TLS off.

## Approve Pairing

```bash
nanosolana devices list
nanosolana devices approve <requestId>
```

## Kotlin Lint + Format

```bash
cd apps/android
./gradlew :app:ktlintCheck :benchmark:ktlintCheck
./gradlew :app:ktlintFormat :benchmark:ktlintFormat
```

## Tech Stack

- Kotlin + Jetpack Compose
- Material 3 (NanoSolana dark theme)
- Encrypted SharedPreferences
- WebSocket gateway client

## Contributions

Contributions welcome. Open an issue or reach out on Discord.

---

**NanoSolana Labs** · MIT License
