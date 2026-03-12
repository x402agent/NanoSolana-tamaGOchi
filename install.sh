#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════
# NanoSolana — One-Shot Installer
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/x402agent/mawdbot-go/main/install.sh | bash
#   curl -fsSL https://raw.githubusercontent.com/x402agent/mawdbot-go/main/install.sh | bash -s -- --with-web
#
# What it does:
#   1. Clones the repo (or updates if already present)
#   2. Builds the `nanosolana` binary
#   3. Creates ~/.nanosolana/ workspace
#   4. Optionally starts the web console
#   5. Generates an agentic wallet
#   6. Prints next steps
# ═══════════════════════════════════════════════════════════════════

set -euo pipefail

# ── Colors ────────────────────────────────────────────────────────
GREEN='\033[38;2;20;241;149m'
PURPLE='\033[38;2;153;69;255m'
AMBER='\033[38;2;255;170;0m'
DIM='\033[38;2;85;102;128m'
RESET='\033[0m'

info()  { echo -e "${GREEN}▸${RESET} $1"; }
warn()  { echo -e "${AMBER}▸${RESET} $1"; }
dim()   { echo -e "${DIM}  $1${RESET}"; }
fail()  { echo -e "\033[31m✖ $1${RESET}" >&2; exit 1; }

# ── Banner ────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}  🦞 NanoSolana Installer${RESET}"
echo -e "${DIM}  On-Chain Trading Intelligence · Pure Go · One Binary${RESET}"
echo ""

# ── Args ──────────────────────────────────────────────────────────
WITH_WEB=false
INSTALL_DIR="${NANOSOLANA_DIR:-$HOME/nanosolana}"
for arg in "$@"; do
  case "$arg" in
    --with-web) WITH_WEB=true ;;
    --dir=*)    INSTALL_DIR="${arg#--dir=}" ;;
  esac
done

# ── Prerequisites ─────────────────────────────────────────────────
check_cmd() { command -v "$1" &>/dev/null || fail "$1 is required but not found. Install it first."; }

check_cmd git
check_cmd go

info "Go: $(go version | awk '{print $3}')"

# ── Clone or update ──────────────────────────────────────────────
REPO_URL="https://github.com/x402agent/mawdbot-go.git"

if [ -d "$INSTALL_DIR/.git" ]; then
  info "Updating existing installation at $INSTALL_DIR"
  cd "$INSTALL_DIR"
  git pull --ff-only 2>/dev/null || warn "Git pull failed — using existing code"
else
  info "Cloning NanoSolana to $INSTALL_DIR"
  git clone --depth 1 "$REPO_URL" "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi

# ── Build ─────────────────────────────────────────────────────────
info "Building nanosolana binary..."
mkdir -p build
go build -ldflags="-s -w" -o build/nanosolana . 2>&1

BINARY="$INSTALL_DIR/build/nanosolana"
SIZE=$(du -h "$BINARY" | awk '{print $1}')
info "Built: $BINARY ($SIZE)"

# ── Workspace setup ──────────────────────────────────────────────
WORKSPACE="$HOME/.nanosolana"
mkdir -p "$WORKSPACE/workspace/vault" "$WORKSPACE/wallet"

if [ ! -f "$INSTALL_DIR/.env" ] && [ -f "$INSTALL_DIR/.env.example" ]; then
  cp "$INSTALL_DIR/.env.example" "$INSTALL_DIR/.env"
  dim "Created .env from .env.example — add your API keys"
fi

# ── Generate agentic wallet ──────────────────────────────────────
info "Checking agentic wallet..."
"$BINARY" solana wallet 2>/dev/null || warn "Wallet check skipped (add HELIUS_RPC_URL to .env)"

# ── Optional: web console ────────────────────────────────────────
if $WITH_WEB; then
  if command -v npm &>/dev/null; then
    info "Building web console..."
    cd "$INSTALL_DIR/web/frontend"
    npm install --silent 2>/dev/null
    npm run build 2>/dev/null
    info "Web console built at web/frontend/dist/"
    dim "Preview: cd web/frontend && npm run dev"
  else
    warn "npm not found — skipping web console build"
  fi
fi

# ── Summary ──────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}  ✅ NanoSolana installed successfully!${RESET}"
echo ""
echo -e "  ${DIM}Binary:${RESET}     $BINARY"
echo -e "  ${DIM}Workspace:${RESET}  $WORKSPACE"
echo -e "  ${DIM}Config:${RESET}     $INSTALL_DIR/.env"
echo ""
echo -e "  ${PURPLE}Quick Start:${RESET}"
echo -e "    ${GREEN}cd $INSTALL_DIR${RESET}"
echo -e "    ${GREEN}./build/nanosolana solana health${RESET}       ${DIM}# Check mainnet${RESET}"
echo -e "    ${GREEN}./build/nanosolana ooda --sim${RESET}         ${DIM}# Simulated trading${RESET}"
echo -e "    ${GREEN}./build/nanosolana daemon${RESET}             ${DIM}# Full autonomous agent${RESET}"
echo ""
echo -e "  ${DIM}Add API keys to .env for full features:${RESET}"
echo -e "    ${AMBER}HELIUS_API_KEY${RESET}=your-helius-key"
echo -e "    ${AMBER}HELIUS_RPC_URL${RESET}=https://mainnet.helius-rpc.com/?api-key=KEY"
echo -e "    ${AMBER}BIRDEYE_API_KEY${RESET}=your-birdeye-key"
echo ""
echo -e "  ${DIM}Docs:${RESET} https://frontend-rho-six-56.vercel.app"
echo ""
