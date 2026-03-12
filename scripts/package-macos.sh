#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# NanoSolana — macOS DMG Packaging Script
#
# Creates a self-contained NanoSolana.app bundle + .dmg installer
# for macOS. Wraps the Go binary + menu bar Swift UI.
#
# Usage:
#   ./scripts/package-macos.sh
#   ./scripts/package-macos.sh --sign        # code-sign for distribution
#   ./scripts/package-macos.sh --notarize    # notarize for Gatekeeper
#
# Output:
#   dist/NanoSolana.app
#   dist/NanoSolana-v2.0.0.dmg
# ═══════════════════════════════════════════════════════════════════

set -euo pipefail

GREEN='\033[38;2;20;241;149m'
DIM='\033[38;2;85;102;128m'
AMBER='\033[38;2;255;179;71m'
RESET='\033[0m'

VERSION="2.0.0"
APP_NAME="NanoSolana"
BUNDLE_ID="com.nanosolana.app"
DIST_DIR="dist"
APP_DIR="$DIST_DIR/$APP_NAME.app"
CONTENTS="$APP_DIR/Contents"
MACOS_DIR="$CONTENTS/MacOS"
RESOURCES="$CONTENTS/Resources"
DMG_NAME="$APP_NAME-v$VERSION.dmg"

SIGN_APP=false
NOTARIZE=false
for arg in "$@"; do
  case "$arg" in
    --sign) SIGN_APP=true ;;
    --notarize) NOTARIZE=true; SIGN_APP=true ;;
  esac
done

echo -e "\n${GREEN}🦞 NanoSolana macOS Packager${RESET}"
echo -e "${DIM}  Version: $VERSION${RESET}"
echo -e "${DIM}  Bundle:  $BUNDLE_ID${RESET}\n"

# ── 1. Build Go binary for macOS ─────────────────────────────────
echo -e "${DIM}  [1/5] Building Go binary...${RESET}"
CGO_ENABLED=0 GOOS=darwin GOARCH=arm64 \
  go build -ldflags="-s -w" -o "$DIST_DIR/nanosolana-darwin-arm64" .

# Also build amd64 for Intel Macs
CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 \
  go build -ldflags="-s -w" -o "$DIST_DIR/nanosolana-darwin-amd64" .

# Create universal binary
lipo -create \
  "$DIST_DIR/nanosolana-darwin-arm64" \
  "$DIST_DIR/nanosolana-darwin-amd64" \
  -output "$DIST_DIR/nanosolana-universal"
echo -e "${GREEN}  ✅ Universal binary built${RESET}"

# ── 2. Create .app bundle ────────────────────────────────────────
echo -e "${DIM}  [2/5] Creating app bundle...${RESET}"
rm -rf "$APP_DIR"
mkdir -p "$MACOS_DIR" "$RESOURCES"

# Copy universal binary
cp "$DIST_DIR/nanosolana-universal" "$MACOS_DIR/nanosolana"
chmod 755 "$MACOS_DIR/nanosolana"

# Create launcher script
cat > "$MACOS_DIR/$APP_NAME" << 'LAUNCHER_EOF'
#!/bin/bash
# NanoSolana Launcher — opens NanoBot UI on Finder launch
DIR="$(cd "$(dirname "$0")" && pwd)"
BINARY="$DIR/nanosolana"

# Detect Finder launch: no TERM_PROGRAM and stdin is NOT a tty
if [ -z "$TERM_PROGRAM" ] && ! [ -t 0 ] 2>/dev/null; then
  # Launched from Finder — start NanoBot UI (opens in browser)
  "$BINARY" nanobot &
  exit 0
fi

# Launched from terminal — pass through args
if [ $# -eq 0 ]; then
  exec "$BINARY" nanobot
else
  exec "$BINARY" "$@"
fi
LAUNCHER_EOF
chmod 755 "$MACOS_DIR/$APP_NAME"

# Info.plist
cat > "$CONTENTS/Info.plist" << PLIST_EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleName</key>
    <string>$APP_NAME</string>
    <key>CFBundleDisplayName</key>
    <string>NanoSolana</string>
    <key>CFBundleIdentifier</key>
    <string>$BUNDLE_ID</string>
    <key>CFBundleVersion</key>
    <string>$VERSION</string>
    <key>CFBundleShortVersionString</key>
    <string>$VERSION</string>
    <key>CFBundleExecutable</key>
    <string>$APP_NAME</string>
    <key>CFBundleIconFile</key>
    <string>NanoSolana</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>LSMinimumSystemVersion</key>
    <string>14.0</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>LSArchitecturePriority</key>
    <array>
        <string>arm64</string>
        <string>x86_64</string>
    </array>
    <key>NSHumanReadableCopyright</key>
    <string>© 2026 NanoSolana Labs. MIT License.</string>
</dict>
</plist>
PLIST_EOF

# Copy icon if exists
if [ -f "apps/macos/Icon.icon" ]; then
  cp "apps/macos/Icon.icon" "$RESOURCES/NanoSolana.icns"
fi

echo -e "${GREEN}  ✅ $APP_NAME.app created${RESET}"

# ── 3. Sign ──────────────────────────────────────────────────────
if [ "$SIGN_APP" = true ]; then
  echo -e "${DIM}  [3/5] Code signing...${RESET}"

  IDENTITY="${SIGN_IDENTITY:-}"
  if [ -z "$IDENTITY" ]; then
    IDENTITY=$(security find-identity -v -p codesigning | head -1 | sed 's/.*"\(.*\)"/\1/' || true)
  fi

  if [ -n "$IDENTITY" ]; then
    codesign --force --deep --sign "$IDENTITY" \
      --options runtime \
      --timestamp \
      "$APP_DIR"
    echo -e "${GREEN}  ✅ Signed with: $IDENTITY${RESET}"
  else
    echo -e "${AMBER}  ⚠️  No signing identity found, ad-hoc signing${RESET}"
    codesign --force --deep --sign - "$APP_DIR"
  fi
else
  echo -e "${DIM}  [3/5] Skipping signing (use --sign)${RESET}"
fi

# ── 4. Create DMG ────────────────────────────────────────────────
echo -e "${DIM}  [4/5] Creating DMG...${RESET}"
rm -f "$DIST_DIR/$DMG_NAME"

# Create DMG with drag-to-Applications layout
hdiutil create -volname "$APP_NAME" \
  -srcfolder "$APP_DIR" \
  -ov -format UDBZ \
  "$DIST_DIR/$DMG_NAME" 2>/dev/null

DMG_SIZE=$(du -sh "$DIST_DIR/$DMG_NAME" 2>/dev/null | awk '{print $1}')
echo -e "${GREEN}  ✅ DMG: $DMG_NAME ($DMG_SIZE)${RESET}"

# ── 5. Notarize ──────────────────────────────────────────────────
if [ "$NOTARIZE" = true ]; then
  echo -e "${DIM}  [5/5] Notarizing...${RESET}"
  if [ -n "${APPLE_ID:-}" ] && [ -n "${APPLE_TEAM_ID:-}" ]; then
    xcrun notarytool submit "$DIST_DIR/$DMG_NAME" \
      --apple-id "$APPLE_ID" \
      --team-id "$APPLE_TEAM_ID" \
      --password "$APPLE_APP_PASSWORD" \
      --wait
    xcrun stapler staple "$DIST_DIR/$DMG_NAME"
    echo -e "${GREEN}  ✅ Notarized and stapled${RESET}"
  else
    echo -e "${AMBER}  ⚠️  Set APPLE_ID + APPLE_TEAM_ID + APPLE_APP_PASSWORD to notarize${RESET}"
  fi
else
  echo -e "${DIM}  [5/5] Skipping notarization (use --notarize)${RESET}"
fi

# ── Summary ──────────────────────────────────────────────────────
BINARY_SIZE=$(du -sh "$MACOS_DIR/nanosolana" 2>/dev/null | awk '{print $1}')
echo ""
echo -e "${GREEN}  ┌──────────────────────────────────────────┐${RESET}"
echo -e "${GREEN}  │  ✅ NanoSolana macOS package complete     │${RESET}"
echo -e "${GREEN}  └──────────────────────────────────────────┘${RESET}"
echo ""
echo -e "  ${DIM}App:${RESET}    $APP_DIR"
echo -e "  ${DIM}DMG:${RESET}    $DIST_DIR/$DMG_NAME"
echo -e "  ${DIM}Binary:${RESET} $BINARY_SIZE (universal arm64+x86_64)"
echo ""
echo -e "  ${DIM}Install:${RESET} Open DMG → drag NanoSolana to Applications"
echo -e "  ${DIM}CLI:${RESET}    ln -s /Applications/$APP_NAME.app/Contents/MacOS/nanosolana /usr/local/bin/nanosolana"
echo ""
