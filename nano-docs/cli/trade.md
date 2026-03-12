---
summary: "nanosolana trade — trading engine commands"
title: "trade"
---

# `nanosolana trade`

Interact with the NanoSolana trading engine.

## Subcommands

### `nanosolana trade status`

Show current strategy state and P&L.

```bash
nanosolana trade status
nanosolana trade status --json
```

Output includes:
- Current positions
- Today's P&L
- Win rate (rolling 50 trades)
- Strategy parameters (RSI/EMA/ATR)
- Next heartbeat cycle

### `nanosolana trade signals`

List recent trading signals.

```bash
nanosolana trade signals
nanosolana trade signals --limit 20
nanosolana trade signals --json
```

Each signal shows:
- Action (BUY/SELL/HOLD)
- Token
- Confidence score
- Reasoning summary
- Timestamp

### `nanosolana trade execute`

Manually execute a trading signal.

```bash
nanosolana trade execute <signal-id>
nanosolana trade execute <signal-id> --yes  # Skip confirmation
```

Requires confirmation unless `--yes` is passed.

### `nanosolana trade history`

Show past trade executions.

```bash
nanosolana trade history
nanosolana trade history --limit 50
nanosolana trade history --json
```

### `nanosolana trade backtest`

Run strategy backtest on historical data.

```bash
nanosolana trade backtest --days 30
nanosolana trade backtest --token SOL --days 90
```

### `nanosolana trade optimize`

Force re-optimization of strategy parameters.

```bash
nanosolana trade optimize
nanosolana trade optimize --dry-run  # Preview changes without applying
```

## Safety

- Trading execution is disabled by default.
- Enable with: `nanosolana config set trading.execution.enabled true`.
- Auto-execution requires: `nanosolana config set trading.execution.autoExecute true`.
- All trades are logged in ClawVault for audit.
