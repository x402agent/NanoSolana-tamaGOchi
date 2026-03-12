---
summary: "NanoSolana session management, persistence, and pruning"
title: "Sessions"
---

# Sessions

NanoSolana manages conversation sessions per channel and per user. Sessions
maintain context across messages and OODA cycles.

## Session types

| Type | Key format | Description |
|------|-----------|-------------|
| Main | `agent:main:main` | Default agent session |
| Telegram DM | `agent:main:telegram:<chatId>` | Per-user Telegram chat |
| Telegram group | `agent:main:telegram:group:<chatId>` | Group conversation |
| Discord | `agent:main:discord:<channelId>` | Discord channel |
| Nostr | `agent:main:nostr:<pubkey>` | Nostr DM session |
| Trading | `agent:main:trading` | OODA loop session |

## Persistence

Sessions are persisted to `~/.nanosolana/sessions/`:

```
~/.nanosolana/sessions/
├── agent-main-main.jsonl           # Main session transcript
├── agent-main-telegram-123.jsonl   # Telegram chat
├── agent-main-trading.jsonl        # Trading OODA sessions
└── sessions.json                   # Session metadata index
```

## Telegram persistence

The Telegram plugin has its own dedicated persistence layer:

```
~/.nanosolana/telegram/
├── messages.json    # Full message history per chat
└── contexts.json    # Chat contexts, preferences, summaries
```

Features:
- Up to 200 messages per chat (configurable).
- Auto-summarization when history exceeds threshold.
- LLM context window: `buildContext()` returns summary + recent messages.
- Cross-chat search via `TelegramConversationStore.search()`.

## Session pruning

- Idle sessions expire after 7 days (configurable).
- Trading sessions are compacted after 1000 turns.
- Memory flush runs before compaction (saves durable notes to ClawVault).

## CLI

```bash
nanosolana sessions            # List active sessions
nanosolana sessions --json     # Machine-readable output
nanosolana sessions --active 60 # Sessions active in last 60 minutes
```
