# NanoSolana macOS App

Native macOS companion for your TamaGObot trading agent. Install as a menu bar app or DMG.

## Features

- 🦞 Menu bar icon with live trading status
- 📊 Trading dashboard (P&L, signals, portfolio)
- 🐾 TamaGOchi pet widget
- 💬 Chat with your agent
- 🔐 Keychain-secured gateway tokens
- 🔔 Native notifications for trade signals

## Quick Dev Run

```bash
cd apps/macos
swift build
swift run NanoSolana
```

## Package as DMG

```bash
# Build the app bundle
scripts/package-mac-app.sh

# Creates dist/NanoSolana.app
# Optionally create DMG:
hdiutil create -volname "NanoSolana" -srcfolder dist/NanoSolana.app \
  -ov -format UDZO dist/NanoSolana.dmg
```

## Signing

Auto-selects identity (first match):
1. Developer ID Application
2. Apple Distribution
3. Apple Development
4. First available identity

If none found:
- Set `ALLOW_ADHOC_SIGNING=1` for ad-hoc signing (dev only)

## Useful Env Flags

| Variable | Purpose |
|----------|---------|
| `SIGN_IDENTITY="Apple Development: ..."` | Explicit signing identity |
| `ALLOW_ADHOC_SIGNING=1` | Ad-hoc sign (TCC permissions don't persist) |
| `CODESIGN_TIMESTAMP=off` | Offline debug signing |
| `DISABLE_LIBRARY_VALIDATION=1` | Dev-only workaround |
| `SKIP_TEAM_ID_CHECK=1` | Bypass team ID audit |

## Connect to Gateway

```bash
nanosolana gateway run
```

The macOS app auto-discovers the local gateway. For remote gateways:

```bash
nanosolana dashboard --no-open
# Copy the tokenized URL into the app
```

---

**NanoSolana Labs** · MIT License
