#!/bin/bash
# ─────────────────────────────────────────────────────────────────────
# MawdBot Go :: Quick Start Script
# Builds and runs the MawdBot nano Solana daemon
# ─────────────────────────────────────────────────────────────────────
set -e

GREEN='\033[1;38;2;20;241;149m'
PURPLE='\033[1;38;2;153;69;255m'
TEAL='\033[1;38;2;0;212;255m'
RED='\033[1;38;2;255;64;96m'
DIM='\033[38;2;85;102;128m'
RESET='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

cd "$SCRIPT_DIR"

echo ""
echo -e "${GREEN}    🦞 MawdBot Go — Quick Start${RESET}"
echo -e "${DIM}    ────────────────────────────────${RESET}"
echo ""

# ── Check Go ──────────────────────────────────────────────────────
if ! command -v go &>/dev/null; then
  echo -e "${RED}  ✗ Go not found. Install it: https://go.dev/dl/${RESET}"
  exit 1
fi

# ── Load .env into environment ───────────────────────────────────
if [ -f ".env" ]; then
  set -a
  source .env 2>/dev/null || true
  set +a
  echo -e "  ${GREEN}✔${RESET} Loaded .env"
else
  echo -e "  ${DIM}⚠  No .env found — copy .env.example and configure${RESET}"
  echo -e "  ${DIM}   cp .env.example .env${RESET}"
fi

# ── Build ─────────────────────────────────────────────────────────
echo -e "  ${TEAL}⏳${RESET} Building..."
mkdir -p build
go build -ldflags="-s -w" -o build/mawdbot . 2>&1
SIZE=$(ls -lh build/mawdbot | awk '{print $5}')
echo -e "  ${GREEN}✔${RESET} Built: build/mawdbot (${SIZE})"
echo ""

# ── Run ───────────────────────────────────────────────────────────
MODE="${1:-daemon}"
echo -e "${GREEN}    🚀 Starting: mawdbot ${MODE}${RESET}"
echo ""

exec ./build/mawdbot "$MODE"
