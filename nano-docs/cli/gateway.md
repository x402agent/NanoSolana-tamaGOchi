---
summary: "nanosolana gateway — run and manage the NanoSolana gateway"
title: "gateway"
---

# `nanosolana gateway`

Run and manage the NanoSolana WebSocket + HTTP gateway.

## Subcommands

### `nanosolana gateway run`

Start the gateway in the foreground.

```bash
nanosolana gateway run
nanosolana gateway run --port 18789
nanosolana gateway run --port 18789 --verbose
nanosolana gateway run --force  # Kill existing listener first
```

Options:

- `--port <port>`: Gateway port (default: `18789`).
- `--host <host>`: Bind address (default: `127.0.0.1`).
- `--verbose`: Enable debug logging.
- `--force`: Kill existing process on the port.

### `nanosolana gateway status`

Show gateway health and connected agents.

```bash
nanosolana gateway status
nanosolana gateway status --deep
nanosolana gateway status --json
```

### `nanosolana gateway health`

Quick health probe.

```bash
nanosolana gateway health
```

### `nanosolana gateway start`

Start as background service.

```bash
nanosolana gateway start
```

### `nanosolana gateway stop`

Stop the background service.

```bash
nanosolana gateway stop
```

### `nanosolana gateway restart`

Restart the background service.

```bash
nanosolana gateway restart
```

## Protocol

See [Gateway Protocol](/gateway/protocol) for the WebSocket wire format.

## Security

See [Gateway Security](/gateway/security) for authentication details.
