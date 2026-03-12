# NanoSolana Android App

Status: **adapting from OpenClaw** — integrating the NanoSolana Go binary as the agent runtime.

## Architecture Change

**Before** (OpenClaw): Kotlin → Node.js gateway → AI agent (JS)  
**After** (NanoSolana): Kotlin → NanoSolana Go binary (~10MB, ARM64) → OODA loop + Helius + Jupiter

The Go binary replaces the entire Node.js runtime. It's faster, smaller, and purpose-built for Solana trading.

### What stays from OpenClaw:
- Android UI (Jetpack Compose, Material 3)
- Gateway connection/pairing protocol
- Chat UI + streaming
- Permission handling
- Bridge endpoints (battery, GPS, clipboard, TTS, SMS, camera)
- Settings/onboarding flow

### What NanoSolana replaces:
- Node.js runtime → Go ARM64 binary
- OpenClaw JS agent → OODA trading engine
- Generic tool system → Solana-focused tools (Helius, Jupiter, Birdeye)
- OpenClaw gateway → NanoSolana gateway (TCP + Tailscale)

## Build

```bash
# Cross-compile Go binary for Android
./scripts/build-seeker.sh

# Build Android APK
cd apps/android
./gradlew :app:assembleDebug

# Install on device
./gradlew :app:installDebug

# Or push Go binary directly via ADB
./scripts/build-seeker.sh --push
```

## Run on Solana Seeker

```bash
# Push NanoSolana binary to device
adb push build/nanosolana-android-arm64 /data/local/tmp/nanosolana/nanosolana
adb shell "chmod 755 /data/local/tmp/nanosolana/nanosolana"

# Run the Seeker agent
adb shell "/data/local/tmp/nanosolana/nanosolana seeker"

# Or just the version check
adb shell "/data/local/tmp/nanosolana/nanosolana version"
```

## NanoSolana CLI on device

Once installed, the full NanoSolana CLI is available:

| Command | Description |
|---------|-------------|
| `nanosolana seeker` | Start Seeker agent (with Android Bridge) |
| `nanosolana solana health` | Check Helius RPC health |
| `nanosolana solana balance` | Check wallet balance |
| `nanosolana solana register` | Mint devnet NFT identity |
| `nanosolana ooda --sim` | Paper trading OODA loop |
| `nanosolana daemon` | Full autonomous daemon |
| `nanosolana pet` | TamaGOchi status |

## Style Guide

See [style.md](style.md) for the Jetpack Compose UI style system (adapted from OpenClaw).

## Contributions

Maintainer: @x402agent
