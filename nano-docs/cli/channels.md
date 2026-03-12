---
summary: "nanosolana channels — manage chat channels"
title: "channels"
---

# `nanosolana channels`

Manage chat channel connections (Telegram, Discord, Nostr, iMessage, etc.).

## Subcommands

### `nanosolana channels list`

Show configured channels.

```bash
nanosolana channels list
nanosolana channels list --json
```

### `nanosolana channels status`

Check channel health.

```bash
nanosolana channels status
nanosolana channels status --probe   # Deep health check
```

### `nanosolana channels add`

Add a new channel.

```bash
# Telegram with persistence
nanosolana channels add --channel telegram --token $TELEGRAM_BOT_TOKEN

# Discord
nanosolana channels add --channel discord --token $DISCORD_BOT_TOKEN

# Nostr
nanosolana channels add --channel nostr --relay wss://relay.damus.io
```

Options:

- `--channel <name>`: Channel type.
- `--token <token>`: Bot/API token.
- `--account <id>`: Account identifier (default: `default`).
- `--name <label>`: Display name.

### `nanosolana channels remove`

Remove a channel configuration.

```bash
nanosolana channels remove --channel telegram
nanosolana channels remove --channel discord --delete
```

### `nanosolana channels login`

Interactive login (channel-specific).

```bash
nanosolana channels login --channel telegram
```

### `nanosolana channels logout`

Log out of a channel session.

```bash
nanosolana channels logout --channel telegram
```

## Supported channels

| Channel | Plugin | Persistence | Features |
|---------|--------|-------------|----------|
| **Telegram** | Built-in | ✅ Full | Conversations, commands, media |
| **Discord** | Built-in | Session | Trading signals, alerts |
| **Nostr** | Extension | Session | Decentralized relay |
| **iMessage** | Extension | Session | Apple Messages |
| **Google Chat** | Extension | Session | Team notifications |
| **BlueBubbles** | Extension | Session | iMessage bridge |

## Telegram persistence

The Telegram plugin stores full conversation history:

```json5
{
  channels: {
    telegram: {
      enabled: true,
      persistence: {
        enabled: true,
        maxHistoryPerChat: 200,
        summaryThreshold: 50,
        persistInterval: 30000   // 30s flush
      }
    }
  }
}
```

Features:
- 200 messages per chat (auto-summarizes overflow).
- Cross-chat search.
- LLM context: summary + recent messages.
- Stored at `~/.nanosolana/telegram/`.
