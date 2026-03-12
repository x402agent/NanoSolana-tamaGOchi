---
summary: "NanoSolana Gateway runbook — startup, operations, and trading relay"
title: "Gateway Runbook"
---

# Gateway runbook

Use this page for day-1 startup and day-2 operations of the NanoSolana Gateway.

## 5-minute local startup

### Step 1: Initialize

```bash
nanosolana init
nanosolana birth    # Generates wallet + TamaGOchi egg
```

### Step 2: Start the Gateway

```bash
nanosolana gateway run --port 18789
# verbose mode
nanosolana gateway run --port 18789 --verbose
# force-kill existing listener
nanosolana gateway run --force
```

### Step 3: Verify health

```bash
nanosolana gateway status
nanosolana status
nanosolana logs --follow
```

Healthy baseline: `Runtime: running`, `Wallet: active`, `Trading: standby`.

### Step 4: Validate channels

```bash
nanosolana channels status --probe
```

## Runtime model

- One always-on process for routing, trading signals, and channel connections.
- Single multiplexed port for:
  - WebSocket control/RPC (agent mesh)
  - HTTP APIs (`/health`, `/api/status`, `/api/framework`, `/api/memory`)
  - Trading signal relay
  - Memory synchronization
- Default bind: `loopback` (127.0.0.1).
- Auth required: HMAC-SHA256 via `NANO_GATEWAY_SECRET`.

### Port and bind

| Setting | Resolution order |
|---------|-----------------|
| Port | `--port` → `NANO_GATEWAY_PORT` → `gateway.port` → `18789` |
| Bind | CLI → `gateway.host` → `127.0.0.1` |
| Secret | `--secret` → `NANO_GATEWAY_SECRET` → `gateway.secret` → auto-generated |

## Operator command set

```bash
nanosolana gateway status           # Gateway health
nanosolana gateway status --deep    # Full probe
nanosolana gateway status --json    # Machine-readable
nanosolana status                   # Full agent status
nanosolana status --all             # Everything (pasteable)
nanosolana health                   # Quick health check
nanosolana logs --follow            # Tail logs
nanosolana doctor                   # Diagnostics
```

## Remote access (Tailscale mesh)

Preferred: Tailscale VPN for agent-to-agent mesh.

```bash
# SSH tunnel fallback
ssh -N -L 18789:127.0.0.1:18789 user@gateway-host
```

> **Warning**: Gateway auth (HMAC-SHA256) still required over tunnels.

## Trading relay

The gateway automatically relays trading events:

| Event | Source | Broadcast |
|-------|--------|-----------|
| `trade:signal` | Strategy engine | All mesh nodes |
| `market:price` | Helius/Birdeye WSS | All mesh nodes |
| `memory:lesson` | ClawVault | All mesh nodes |
| `agent:heartbeat` | Wallet | All mesh nodes |

## Common failure signatures

| Signature | Likely issue |
|-----------|-------------|
| `Invalid signature` | HMAC secret mismatch |
| `Rate limited` | >100 msgs/min from one agent |
| `Auth timeout` | Client didn't send auth within 5s |
| `EADDRINUSE` | Port conflict (another gateway) |
| `Unauthorized` (HTTP) | Missing `X-NanoSolana-Secret` header |

## Safety guarantees

- Gateway rejects unsigned first frames (hard close).
- Rate limiter prevents flood attacks (10 connections/min per IP).
- Trading signals are atomic — no partial execution broadcasts.
- Graceful shutdown closes all WebSocket connections cleanly.
- Memory sync is eventually consistent across mesh.
