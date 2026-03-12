---
summary: "NanoSolana extension system — plugin development and integration"
title: "Extensions"
---

# Extensions

NanoSolana uses a plugin architecture to extend channel support, AI tools, and
trading capabilities. Each extension is a self-contained package with a
`nanosolana-plugin.json` manifest.

## Plugin manifest

Every extension requires a `nanosolana-plugin.json`:

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "description": "What this plugin does",
  "channels": ["telegram"],
  "configSchema": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": { "type": "string", "description": "API key for service" }
    }
  }
}
```

## Built-in extensions

### Channel plugins

| Extension | ID | Description |
|-----------|----|-------------|
| **Telegram** | `telegram` | Persistent conversations with ClawVault memory |
| **Discord** | `discord` | Trading signals, alerts, and TamaGOchi status |
| **Nostr** | `nostr` | Decentralized trading signal relay |
| **iMessage** | `imessage` | Apple Messages trading alerts |
| **Google Chat** | `googlechat` | Team trading notifications |
| **BlueBubbles** | `bluebubbles` | iMessage via BlueBubbles server |

### AI & workflow plugins

| Extension | ID | Description |
|-----------|----|-------------|
| **Lobster** | `lobster` | Typed workflow pipelines with resumable approvals |
| **LLM Task** | `llm-task` | Autonomous multi-step research and trading |
| **Google Gemini CLI Auth** | `google-gemini-cli-auth` | Gemini CLI authentication bridge |
| **MiniMax Portal Auth** | `minimax-portal-auth` | MiniMax portal authentication |

### Memory plugins

| Extension | ID | Description |
|-----------|----|-------------|
| **Memory Core** | `memory-core` | ClawVault 3-tier epistemological memory |
| **Memory LanceDB** | `memory-lancedb` | Vector semantic search with LanceDB |

### Device plugins

| Extension | ID | Description |
|-----------|----|-------------|
| **Device Pair** | `device-pair` | TamaGOchi hardware bridge (I2C/serial) |
| **Phone Control** | `phone-control` | Remote agent management via phone |

## Plugin lifecycle

```
1. Discovery:  nanosolana scans extensions/ for nanosolana-plugin.json
2. Validation: Schema validated against NanoSolanaPluginSchema
3. Loading:    Plugin module loaded via dynamic import
4. Registration: Plugin calls api.registerChannel() or api.registerTool()
5. Runtime:    Plugin receives events via registered hooks
```

## Creating a plugin

### Directory structure

```
extensions/my-plugin/
├── nanosolana-plugin.json    # Plugin manifest
├── package.json              # NPM package config
├── index.ts                  # Entry point
└── src/
    └── handler.ts            # Plugin logic
```

### Entry point

```typescript
import type { NanoSolanaPluginApi } from "nanosolana/plugin-sdk";

const plugin = {
  id: "my-plugin",
  name: "My Plugin",
  description: "Custom trading indicator plugin",
  register(api: NanoSolanaPluginApi) {
    // Register a custom tool
    api.registerTool({
      name: "my_indicator",
      description: "Calculate custom trading indicator",
      parameters: { token: { type: "string" } },
      execute: async ({ token }) => {
        // Your logic here
        return { indicator: 42.5, signal: "BUY" };
      },
    });
  },
};

export default plugin;
```

### Plugin hooks

Plugins can hook into the agent lifecycle:

| Hook | Phase | Description |
|------|-------|-------------|
| `before_model_resolve` | Pre-session | Override AI model |
| `before_prompt_build` | Pre-inference | Inject context |
| `agent_end` | Post-inference | Inspect results |
| `before_tool_call` | Pre-tool | Intercept params |
| `after_tool_call` | Post-tool | Transform results |
| `message_received` | Inbound | Process incoming messages |
| `message_sending` | Outbound | Modify outgoing messages |
| `trade_signal` | Trading | React to trading signals |
| `trade_execute` | Trading | Pre/post trade execution |

## CLI commands

```bash
nanosolana plugins list              # List available plugins
nanosolana plugins info <id>         # Show plugin details
nanosolana plugins install <path>    # Install a plugin
nanosolana plugins enable <id>       # Enable a plugin
nanosolana plugins disable <id>      # Disable a plugin
```

## Configuration

Per-plugin config lives in the main NanoSolana config:

```json5
{
  plugins: {
    entries: {
      "telegram": { enabled: true },
      "discord": { enabled: true },
      "lobster": { enabled: true },
      "memory-core": { enabled: true },
    },
    load: {
      paths: ["./extensions"]    // Plugin search paths
    }
  }
}
```

## Telegram plugin (with persistence)

The Telegram plugin includes built-in conversation persistence:

```json
{
  "id": "telegram",
  "persistence": {
    "enabled": true,
    "dbPath": "~/.nanosolana/telegram",
    "conversationHistory": true,
    "maxHistoryPerChat": 200,
    "summaryThreshold": 50
  }
}
```

Features:
- Full message history per chat (up to 200 messages).
- Auto-summarization when history exceeds threshold.
- LLM context builder: `buildContext()` returns summary + recent messages.
- Cross-chat search for finding information across conversations.
- 30s periodic flush to disk with `0600` permissions.

## Security

- Plugin code runs in the same process as the agent (no sandbox).
- Plugins should NOT access `vault.enc` directly.
- API keys should be passed via config, not hardcoded.
- Plugin dependencies are isolated in their own `package.json`.
