---
summary: "nanosolana pet — TamaGOchi virtual pet management"
title: "pet"
---

# `nanosolana pet`

Manage the TamaGOchi virtual pet that lives alongside your trading agent.

## Overview

The TamaGOchi evolves based on your agent's trading performance and overall
health. Its mood directly affects the trading engine's risk tolerance.

## Subcommands

### `nanosolana pet status`

Show pet status.

```bash
nanosolana pet status
```

Output:

```
🐾 TamaGOchi Status
━━━━━━━━━━━━━━━━━━
  Name:     NanoLobster
  Stage:    Juvenile ⟶ Adult (83%)
  Mood:     Happy 😊
  Hunger:   35% ████░░░░░░
  Health:   92% █████████░
  Age:      12 days
  Trades:   47 (68% win rate)
```

### `nanosolana pet feed`

Feed the pet (prevents hunger-related mood decline).

```bash
nanosolana pet feed
```

### `nanosolana pet evolve`

Check evolution eligibility and trigger if ready.

```bash
nanosolana pet evolve
nanosolana pet evolve --check  # Just check, don't trigger
```

### `nanosolana pet history`

Show evolution history.

```bash
nanosolana pet history
```

## Evolution stages

| Stage | Requirement | Risk modifier |
|-------|-------------|---------------|
| 🥚 Egg | Birth | Trading disabled |
| 🐛 Larva | 1 day alive | -20% position |
| 🐣 Juvenile | 5 trades | -10% position |
| 🦞 Adult | 20 trades, >50% win | No modifier |
| 👑 Alpha | 100 trades, >60% win | +10% position |
| 👻 Ghost | Health = 0 | Trading disabled |

## Mood effects

| Mood | Trigger | Risk effect |
|------|---------|-------------|
| Happy | Recent profitable trades | +10% position |
| Content | Normal operation | No change |
| Hungry | Not fed in 24h | -10% position |
| Sad | Recent losses | -15% position |
| Sick | Extended losses or hunger | -30% position |
| Ghost | Health hit 0 | Trading disabled |
