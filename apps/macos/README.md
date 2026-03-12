# NanoSolana macOS App

A native macOS menu bar app that wraps the NanoSolana Go binary.

## Install Options

### 1. DMG Installer (recommended)

```bash
# Build the DMG
./scripts/package-macos.sh

# With code signing
./scripts/package-macos.sh --sign

# With notarization (for distribution)
./scripts/package-macos.sh --notarize
```

Then open `dist/NanoSolana-v2.0.0.dmg` and drag to Applications.

### 2. CLI One-Shot

```bash
curl -fsSL https://raw.githubusercontent.com/x402agent/nano-solana-go/main/install.sh | bash
```

### 3. npm

```bash
npx @nanosolana/cli
```

## What the DMG includes

- **NanoSolana.app** — Universal binary (arm64 + x86_64)
- **nanosolana CLI** — Full trading agent CLI
- **Info.plist** — macOS 14+ with Retina support

## After Install

```bash
# Add CLI to PATH
ln -s /Applications/NanoSolana.app/Contents/MacOS/nanosolana /usr/local/bin/nanosolana

# Run commands
nanosolana version
nanosolana solana health
nanosolana ooda --sim
nanosolana daemon
```

## Signing & Notarization

For distribution outside the App Store:

```bash
# Set signing identity
export SIGN_IDENTITY="Developer ID Application: Your Name (TEAMID)"

# Set notarization credentials
export APPLE_ID="your@email.com"
export APPLE_TEAM_ID="TEAMID"
export APPLE_APP_PASSWORD="app-specific-password"

# Build, sign, and notarize
./scripts/package-macos.sh --notarize
```

## Development

The macOS app is adapted from the OpenClaw macOS companion app. Source files
in `Sources/` are being adapted to use NanoSolana's Go binary as the
agent runtime instead of Node.js.

### Key files
- `Sources/OpenClaw/AppState.swift` — Main app state
- `Sources/OpenClaw/MenuBar.swift` — Menu bar UI
- `Sources/OpenClaw/NanoSolanaGatewaySettings.swift` — Gateway settings
- `Package.swift` — Swift package manifest

## Env flags

| Flag | Purpose |
|------|---------|
| `SIGN_IDENTITY` | Code signing identity |
| `ALLOW_ADHOC_SIGNING=1` | Ad-hoc sign (dev only) |
| `CODESIGN_TIMESTAMP=off` | Offline debug |
| `DISABLE_LIBRARY_VALIDATION=1` | Dev-only Sparkle workaround |
| `SKIP_TEAM_ID_CHECK=1` | Bypass Team ID audit |
