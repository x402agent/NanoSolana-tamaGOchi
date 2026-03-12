---
summary: "nanosolana memory — ClawVault memory management"
title: "memory"
---

# `nanosolana memory`

Manage the ClawVault 3-tier epistemological memory system.

## Subcommands

### `nanosolana memory status`

Show memory tier statistics.

```bash
nanosolana memory status
nanosolana memory status --json
```

Output:

```
ClawVault Memory Status
━━━━━━━━━━━━━━━━━━━━━━
  KNOWN:    42 entries   (TTL: 60s)
  LEARNED:  156 entries  (TTL: 7 days)
  INFERRED: 23 entries   (TTL: 3 days)
  Agenda:   5 questions
  Disk:     1.2 MB
```

### `nanosolana memory search`

Search across all memory tiers.

```bash
nanosolana memory search "RSI oversold pattern"
nanosolana memory search "SOL correlation" --tier learned
nanosolana memory search "volume spike" --limit 10 --json
```

Options:

- `--tier <known|learned|inferred|all>`: Filter by tier (default: `all`).
- `--limit <n>`: Max results (default: `10`).
- `--json`: Machine-readable output.

### `nanosolana memory store`

Manually store a memory entry.

```bash
nanosolana memory store "SOL tends to bounce at $135 support" --tier learned
nanosolana memory store "High volume mornings correlate with afternoon rallies" --tier inferred
```

Options:

- `--tier <learned|inferred>`: Target tier (default: `learned`).
- `--tags <tag1,tag2>`: Comma-separated tags.
- `--importance <1-10>`: Importance score.

### `nanosolana memory flush`

Persist all in-memory data to disk.

```bash
nanosolana memory flush
```

### `nanosolana memory lessons`

List LEARNED entries (trading lessons).

```bash
nanosolana memory lessons
nanosolana memory lessons --limit 20
nanosolana memory lessons --json
```

## Memory tiers

| Tier | TTL | What goes here |
|------|-----|----------------|
| KNOWN | 60s | Fresh API data (prices, balances) |
| LEARNED | 7 days | Trade outcome patterns |
| INFERRED | 3 days | Tentative correlations |

## File layout

```
~/.nanosolana/clawvault/
├── known.json         # Usually empty (ephemeral)
├── learned.json       # Persistent patterns
├── inferred.json      # Tentative correlations
├── agenda.json        # Research questions
└── replay/            # Experience replay logs
```
