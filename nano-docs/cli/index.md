---
summary: "NanoSolana CLI reference for `nanosolana` commands, subcommands, and options"
title: "CLI Reference"
---

# CLI reference

NanoSolana ships a unified `nanosolana` CLI for managing the TamaGObot agent lifecycle,
trading operations, wallet management, and mesh networking.

## Command pages

- [`init`](/cli/init)
- [`birth`](/cli/birth)
- [`run`](/cli/run)
- [`status`](/cli/status)
- [`pet`](/cli/pet)
- [`vault`](/cli/vault)
- [`config`](/cli/config)
- [`send`](/cli/send)
- [`bots`](/cli/bots)
- [`nodes`](/cli/nodes)
- [`gateway`](/cli/gateway)
- [`wallet`](/cli/wallet)
- [`trade`](/cli/trade)
- [`memory`](/cli/memory)
- [`channels`](/cli/channels)
- [`plugins`](/cli/plugins)
- [`doctor`](/cli/doctor)
- [`logs`](/cli/logs)
- [`health`](/cli/health)
- [`sessions`](/cli/sessions)
- [`security`](/cli/security)
- [`secrets`](/cli/secrets)
- [`backup`](/cli/backup)
- [`reset`](/cli/reset)

## Global flags

- `--dev`: isolate state under `~/.nanosolana-dev` and shift default ports.
- `--profile <name>`: isolate state under `~/.nanosolana-<name>`.
- `--no-color`: disable ANSI colors.
- `-V`, `--version`: print version and exit.

## Output styling

- ANSI colors and progress indicators only render in TTY sessions.
- `--json` disables styling for clean machine-readable output.
- `--no-color` disables ANSI styling; `NO_COLOR=1` is also respected.

## Color palette

NanoSolana uses a Solana-native cypherpunk palette for CLI output.

- `accent` (#14F195): headings, labels, primary highlights (Solana green).
- `accentBright` (#5CFCB6): command names, emphasis.
- `secondary` (#9945FF): secondary highlights (Solana purple).
- `lobster` (#FF6B35): lobster mascot accents.
- `success` (#14F195): success states.
- `warn` (#FFB020): warnings, fallbacks, attention.
- `error` (#FF4444): errors, failures.
- `muted` (#505880): de-emphasis, metadata.

## Command tree

```
nanosolana [--dev] [--profile <name>] <command>
  init                          # Initialize ~/.nanosolana config + workspace
  birth                         # Generate agent wallet + TamaGOchi egg
  run                           # Start the agent loop (OODA cycle)
  status                        # Show agent health, wallet, and pet status
  pet                           # TamaGOchi pet management
    status
    feed
    evolve
    history
  vault                         # Encrypted secrets management
    set <key> <value>
    get <key>
    list
    rotate
  config                        # Configuration management
    get <path>
    set <path> <value>
    unset <path>
    validate
  wallet                        # Solana wallet operations
    balance
    send <to> <amount>
    receive
    history
    export
  trade                         # Trading engine commands
    status
    signals
    execute <signal-id>
    history
    backtest
    optimize
  memory                        # ClawVault memory management
    status
    search <query>
    store <content>
    flush
    lessons
  send                          # Send messages to channels
  bots                          # List connected nanosolana bots
  nodes                         # List mesh network peers
  gateway                       # Gateway server management
    run
    status
    health
    start
    stop
    restart
  channels                      # Channel management
    list
    status
    add
    remove
    login
    logout
  plugins                       # Extension management
    list
    info <id>
    install <path>
    enable <id>
    disable <id>
  doctor                        # Health checks + diagnostics
  health                        # Gateway health probe
  sessions                      # Conversation session management
  logs                          # Tail gateway logs
  security                      # Security audit
    audit
    audit --deep
    audit --fix
  secrets                       # Secrets management
    reload
    audit
    configure
  backup                        # Backup agent state
    create
    verify
    restore
  reset                         # Reset local state
```

## Security

- `nanosolana security audit` — audit config + local state for security issues.
- `nanosolana security audit --deep` — probe gateway + wallet security.
- `nanosolana security audit --fix` — tighten defaults, fix permissions.

## Secrets (Vault)

- `nanosolana vault set <key> <value>` — store encrypted secret.
- `nanosolana vault get <key>` — retrieve secret (requires vault password).
- `nanosolana vault list` — list stored keys (values redacted).
- `nanosolana vault rotate` — rotate vault encryption key.
- `nanosolana secrets reload` — re-resolve refs and swap runtime snapshot.

## Wallet

- `nanosolana wallet balance` — show SOL + SPL token balances.
- `nanosolana wallet send <to> <amount>` — send SOL or tokens.
- `nanosolana wallet receive` — show deposit address + QR.
- `nanosolana wallet history` — recent transactions.
- `nanosolana wallet export` — export wallet (requires vault password).

## Trading

- `nanosolana trade status` — current strategy state + P&L.
- `nanosolana trade signals` — recent trading signals.
- `nanosolana trade execute <id>` — manually execute a signal.
- `nanosolana trade history` — trade execution history.
- `nanosolana trade backtest` — run strategy backtest.
- `nanosolana trade optimize` — auto-optimize strategy parameters.

## Memory (ClawVault)

- `nanosolana memory status` — show 3-tier memory stats (KNOWN/LEARNED/INFERRED).
- `nanosolana memory search <query>` — search across all memory tiers.
- `nanosolana memory store <content>` — store a new memory entry.
- `nanosolana memory flush` — persist all in-memory data to disk.
- `nanosolana memory lessons` — list learned trading lessons.

## TamaGOchi Pet

- `nanosolana pet status` — show pet stage, mood, and evolution progress.
- `nanosolana pet feed` — feed the pet (costs SOL micro-amount).
- `nanosolana pet evolve` — check evolution eligibility.
- `nanosolana pet history` — pet evolution history.

## Channel management

Manage chat channels (Telegram, Discord, Nostr, iMessage, etc.):

```bash
nanosolana channels add --channel telegram --token $TELEGRAM_BOT_TOKEN
nanosolana channels add --channel discord --token $DISCORD_BOT_TOKEN
nanosolana channels status --probe
```

## Mesh networking

- `nanosolana nodes` — list Tailscale mesh peers.
- `nanosolana bots` — list connected nanosolana bots in tmux sessions.
- `nanosolana gateway run` — start the WebSocket gateway.

## Environment variables

Key environment variables:

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | OpenRouter API key for AI |
| `OPENROUTER_MODEL` | AI model (default: `openrouter/healer-alpha`) |
| `HELIUS_RPC_URL` | Helius Solana RPC endpoint |
| `HELIUS_API_KEY` | Helius API key |
| `HELIUS_WSS_URL` | Helius WebSocket endpoint |
| `BIRDEYE_API_KEY` | Birdeye market data API key |
| `BIRDEYE_WSS_URL` | Birdeye WebSocket endpoint |
| `JUPITER_API_KEY` | Jupiter swap API key |
| `NANO_GATEWAY_PORT` | Gateway port (default: `18789`) |
| `NANO_GATEWAY_SECRET` | Gateway HMAC secret |
| `TAILSCALE_AUTH_KEY` | Tailscale auth key for mesh |
| `NANO_VAULT_PASSWORD` | Custom vault encryption password |
