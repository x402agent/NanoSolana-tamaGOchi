---
summary: "NanoSolana multi-agent mesh networking via Tailscale and tmux"
title: "Mesh Networking"
---

# Mesh networking

NanoSolana agents can form a peer-to-peer mesh network using **Tailscale** as the
secure transport and **tmux** for process management.

## Architecture

```
┌──────────────────┐    Tailscale VPN    ┌──────────────────┐
│  Host A           │◄──────────────────►│  Host B           │
│  ┌──────────────┐ │                    │  ┌──────────────┐ │
│  │ Agent Alpha  │ │  ◄─ signals ─►    │  │ Agent Beta   │ │
│  │ Gateway:18789│ │  ◄─ lessons ─►    │  │ Gateway:18789│ │
│  │ Wallet: 7xKX │ │  ◄─ heartbeat─►   │  │ Wallet: 9aBC │ │
│  └──────────────┘ │                    │  └──────────────┘ │
│                    │                    │                    │
│  tmux: nano-alpha  │                    │  tmux: nano-beta   │
└──────────────────┘                    └──────────────────┘
```

## Setup

### 1. Install Tailscale on each host

```bash
# macOS
brew install tailscale

# Linux
curl -fsSL https://tailscale.com/install.sh | sh
```

### 2. Authenticate

```bash
tailscale up --authkey=$TAILSCALE_AUTH_KEY
```

### 3. Configure mesh in NanoSolana

```json5
{
  mesh: {
    tailscale: {
      authKey: "env:TAILSCALE_AUTH_KEY",
      domain: "your-tailnet.ts.net",
    },
    peers: [
      { host: "host-b.your-tailnet.ts.net", port: 18789 }
    ]
  }
}
```

### 4. Start the gateway with mesh enabled

```bash
nanosolana gateway run --bind tailnet
```

## Tmux session management

Each NanoSolana agent runs in a named tmux session:

```bash
# Start agent in tmux
tmux new-session -d -s nano-agent "nanosolana run"

# Attach to see logs
tmux attach -t nano-agent

# List running nanosolana sessions
tmux ls | grep nano

# Send command to running agent
tmux send-keys -t nano-agent "nanosolana trade status" Enter
```

## One-shot `nanosolana` command

The `nanosolana` CLI can communicate with bots across the mesh:

```bash
# Send message to all bots
nanosolana send --mesh "Check SOL RSI status"

# Query a specific bot
nanosolana send --to agent-beta "What's your P&L today?"

# List all mesh peers
nanosolana nodes

# List all connected bots
nanosolana bots
```

## Shared data

| Data type | Sharing model |
|-----------|---------------|
| Trading signals | Broadcast to all peers |
| Memory lessons | Broadcast (LEARNED tier) |
| Price data | Shared WebSocket feeds |
| Wallet state | Private (never shared) |
| Private keys | Private (never shared) |
| Pet status | Shared for fun |

## Security

- All mesh traffic flows through Tailscale WireGuard tunnels.
- HMAC-SHA256 authentication on every gateway connection.
- Wallet private keys NEVER leave the local host.
- Each agent authenticates with its own HMAC secret.
- Rate limiting applies per-agent, even on mesh connections.
