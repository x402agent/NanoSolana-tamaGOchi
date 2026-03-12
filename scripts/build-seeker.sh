#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# NanoSolana Seeker — ARM64 Build for Android
#
# Cross-compiles the NanoSolana binary for Android ARM64 (Seeker phone).
# Output: build/nanosolana-android-arm64
#
# Usage:
#   ./scripts/build-seeker.sh
#   ./scripts/build-seeker.sh --push     # also adb push to device
# ═══════════════════════════════════════════════════════════════════

set -euo pipefail

GREEN='\033[38;2;20;241;149m'
DIM='\033[38;2;85;102;128m'
RESET='\033[0m'
OUTPUT="build/nanosolana-android-arm64"

echo -e "\n${GREEN}🦞 NanoSolana Seeker — ARM64 Build${RESET}\n"

# Cross-compile for Android ARM64
echo -e "${DIM}  Compiling for android/arm64...${RESET}"
CGO_ENABLED=0 GOOS=android GOARCH=arm64 \
  go build -ldflags="-s -w" -o "$OUTPUT" .

SIZE=$(du -sh "$OUTPUT" 2>/dev/null | awk '{print $1}')
echo -e "${GREEN}  ✅ Built: $OUTPUT ($SIZE)${RESET}"
echo ""

# Optionally push to connected device
if [[ "${1:-}" == "--push" ]]; then
  echo -e "${DIM}  Pushing to device via adb...${RESET}"

  # Create directory on device
  adb shell "mkdir -p /data/local/tmp/nanosolana"

  # Push binary
  adb push "$OUTPUT" /data/local/tmp/nanosolana/nanosolana
  adb shell "chmod 755 /data/local/tmp/nanosolana/nanosolana"

  echo -e "${GREEN}  ✅ Pushed to /data/local/tmp/nanosolana/nanosolana${RESET}"
  echo ""

  # Verify
  echo -e "${DIM}  Verifying...${RESET}"
  adb shell "/data/local/tmp/nanosolana/nanosolana version"
  echo ""
fi

echo -e "${DIM}  To push manually:${RESET}"
echo -e "${DIM}    adb push $OUTPUT /data/local/tmp/nanosolana/nanosolana${RESET}"
echo -e "${DIM}    adb shell 'chmod 755 /data/local/tmp/nanosolana/nanosolana'${RESET}"
echo ""
echo -e "${DIM}  To run on device:${RESET}"
echo -e "${DIM}    adb shell '/data/local/tmp/nanosolana/nanosolana seeker'${RESET}"
echo ""
