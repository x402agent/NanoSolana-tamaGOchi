#!/bin/bash
# NanoBot macOS Menu Bar Agent
# Creates a persistent menu bar icon (like Docker/Tailscale) that:
#   - Shows NanoSolana status in the menu bar
#   - Provides quick access to NanoBot UI, wallet, and tools
#   - Runs the NanoBot server in the background
#   - Updates the icon based on daemon/wallet status
#
# Usage: nanosolana menubar
# Dependencies: osascript (built into macOS)

set -euo pipefail

BINARY="${0%/*}/nanosolana"
if [ ! -f "$BINARY" ]; then
  BINARY="$(which nanosolana 2>/dev/null || echo './build/nanosolana')"
fi

PORT="${NANOBOT_PORT:-7777}"
PIDFILE="/tmp/nanobot-server.pid"

# ── Start NanoBot server in background ──────────────────────────
start_server() {
  if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
    echo "NanoBot server already running (PID: $(cat "$PIDFILE"))"
  else
    "$BINARY" nanobot --port "$PORT" &
    echo $! > "$PIDFILE"
    sleep 1
    echo "NanoBot server started on http://127.0.0.1:$PORT"
  fi
}

# ── Stop server ─────────────────────────────────────────────────
stop_server() {
  if [ -f "$PIDFILE" ]; then
    kill "$(cat "$PIDFILE")" 2>/dev/null || true
    rm -f "$PIDFILE"
    echo "NanoBot server stopped"
  fi
}

# ── Get wallet address ──────────────────────────────────────────
get_wallet() {
  curl -s "http://127.0.0.1:$PORT/api/wallet" 2>/dev/null | \
    python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('short','??'))" 2>/dev/null || echo "??"
}

# ── Get status ──────────────────────────────────────────────────
get_status() {
  curl -s "http://127.0.0.1:$PORT/api/status" 2>/dev/null | \
    python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('daemon','stopped'))" 2>/dev/null || echo "offline"
}

# ── Menu Bar via osascript ──────────────────────────────────────
start_server

# Create the menu bar application
osascript << 'APPLESCRIPT'
use framework "Foundation"
use framework "AppKit"
use scripting additions

-- Create menu bar status item
set statusBar to current application's NSStatusBar's systemStatusBar()
set statusItem to statusBar's statusItemWithLength:(current application's NSVariableStatusItemLength)
set statusButton to statusItem's button()
statusButton's setTitle:"🤖"

-- Create menu
set mainMenu to current application's NSMenu's alloc()'s initWithTitle:""

-- NanoBot header
set headerItem to current application's NSMenuItem's alloc()'s initWithTitle:"NanoBot — Solana Companion" action:(missing value) keyEquivalent:""
headerItem's setEnabled:false
mainMenu's addItem:headerItem

mainMenu's addItem:(current application's NSMenuItem's separatorItem())

-- Open NanoBot UI
set openItem to current application's NSMenuItem's alloc()'s initWithTitle:"Open NanoBot UI ↗" action:"openUI:" keyEquivalent:"o"
openItem's setTarget:me
mainMenu's addItem:openItem

-- Wallet
set walletItem to current application's NSMenuItem's alloc()'s initWithTitle:"💰 Wallet" action:"openWallet:" keyEquivalent:"w"
walletItem's setTarget:me
mainMenu's addItem:walletItem

-- Status
set statusMenuItem to current application's NSMenuItem's alloc()'s initWithTitle:"📊 Status: checking..." action:(missing value) keyEquivalent:""
mainMenu's addItem:statusMenuItem

mainMenu's addItem:(current application's NSMenuItem's separatorItem())

-- Quick Actions submenu
set actionsMenu to current application's NSMenu's alloc()'s initWithTitle:""
set actionsItem to current application's NSMenuItem's alloc()'s initWithTitle:"⚡ Quick Actions" action:(missing value) keyEquivalent:""
actionsItem's setSubmenu:actionsMenu

set healthItem to current application's NSMenuItem's alloc()'s initWithTitle:"Health Check" action:"runHealth:" keyEquivalent:""
healthItem's setTarget:me
actionsMenu's addItem:healthItem

set trendingItem to current application's NSMenuItem's alloc()'s initWithTitle:"Trending Tokens" action:"runTrending:" keyEquivalent:""
trendingItem's setTarget:me
actionsMenu's addItem:trendingItem

set petItem to current application's NSMenuItem's alloc()'s initWithTitle:"🐹 Pet Status" action:"runPet:" keyEquivalent:""
petItem's setTarget:me
actionsMenu's addItem:petItem

mainMenu's addItem:actionsItem

mainMenu's addItem:(current application's NSMenuItem's separatorItem())

-- Start/Stop Daemon
set daemonItem to current application's NSMenuItem's alloc()'s initWithTitle:"Start Daemon" action:"toggleDaemon:" keyEquivalent:"d"
daemonItem's setTarget:me
mainMenu's addItem:daemonItem

-- Open Terminal
set termItem to current application's NSMenuItem's alloc()'s initWithTitle:"Open Terminal" action:"openTerminal:" keyEquivalent:"t"
termItem's setTarget:me
mainMenu's addItem:termItem

mainMenu's addItem:(current application's NSMenuItem's separatorItem())

-- Quit
set quitItem to current application's NSMenuItem's alloc()'s initWithTitle:"Quit NanoBot" action:"quitApp:" keyEquivalent:"q"
quitItem's setTarget:me
mainMenu's addItem:quitItem

statusItem's setMenu:mainMenu

-- Handler: Open UI
on openUI:sender
  do shell script "open http://127.0.0.1:7777"
end openUI:

-- Handler: Open Wallet tab
on openWallet:sender
  do shell script "open 'http://127.0.0.1:7777/#wallet'"
end openWallet:

-- Handler: Health
on runHealth:sender
  do shell script "open 'http://127.0.0.1:7777'"
end runHealth:

-- Handler: Trending
on runTrending:sender
  do shell script "open 'http://127.0.0.1:7777'"
end runTrending:

-- Handler: Pet
on runPet:sender
  do shell script "open 'http://127.0.0.1:7777'"
end runPet:

-- Handler: Toggle Daemon
on toggleDaemon:sender
  tell application "Terminal"
    activate
    do script "nanosolana daemon"
  end tell
end toggleDaemon:

-- Handler: Open Terminal
on openTerminal:sender
  tell application "Terminal"
    activate
    do script "nanosolana"
  end tell
end openTerminal:

-- Handler: Quit
on quitApp:sender
  do shell script "kill $(cat /tmp/nanobot-server.pid 2>/dev/null) 2>/dev/null; rm -f /tmp/nanobot-server.pid" 
  current application's NSApp's terminate:me
end quitApp:

-- Run the app
current application's NSApp's run()
APPLESCRIPT
