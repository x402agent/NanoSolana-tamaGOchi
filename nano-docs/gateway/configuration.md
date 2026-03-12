---
summary: "NanoSolana gateway configuration reference"
title: "Gateway Configuration"
---

# Gateway configuration

NanoSolana Gateway configuration lives in `~/.nanosolana/config.json`
(or `NANOSOLANA_CONFIG_PATH`).

## Configuration file

```json5
{
  // Gateway server
  gateway: {
    host: "127.0.0.1",        // Bind address
    port: 18789,               // WebSocket + HTTP port
    secret: "env:NANO_GATEWAY_SECRET",  // HMAC secret (encrypted in vault)
    rateLimit: {
      connections: 10,         // Max connections per IP per minute
      messages: 100,           // Max messages per agent per minute
    }
  },

  // AI provider
  ai: {
    provider: "openrouter",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "openrouter/healer-alpha",
    apiKey: "env:OPENROUTER_API_KEY",
  },

  // Solana infrastructure
  solana: {
    helius: {
      rpcUrl: "env:HELIUS_RPC_URL",
      apiKey: "env:HELIUS_API_KEY",
      wssUrl: "env:HELIUS_WSS_URL",
    },
    birdeye: {
      apiKey: "env:BIRDEYE_API_KEY",
      wssUrl: "env:BIRDEYE_WSS_URL",
    },
    jupiter: {
      apiKey: "env:JUPITER_API_KEY",
    },
  },

  // Trading engine
  trading: {
    strategy: {
      rsiPeriod: 14,
      rsiBuyThreshold: 30,
      rsiSellThreshold: 70,
      emaFastPeriod: 12,
      emaSlowPeriod: 26,
      atrPeriod: 14,
      confidenceThreshold: 0.7,
      slippageBps: 100,
      maxPositionPct: 50,
      stopLossPct: 2,
      takeProfitPct: 5,
    },
    execution: {
      enabled: false,          // Manual approval by default
      autoExecute: false,      // Autonomous trading (opt-in)
    }
  },

  // Memory
  memory: {
    clawvault: {
      path: "~/.nanosolana/clawvault",
      knownTTL: 60000,
      learnedTTL: 604800000,
      inferredTTL: 259200000,
    },
    telegram: {
      path: "~/.nanosolana/telegram",
      maxHistoryPerChat: 200,
      persistInterval: 30000,
    }
  },

  // Agent
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "none",
        lightContext: false,
      },
      timeoutSeconds: 600,
    }
  },

  // Channels
  channels: {
    telegram: {
      enabled: true,
      botToken: "env:TELEGRAM_BOT_TOKEN",
    },
    discord: {
      enabled: false,
      botToken: "env:DISCORD_BOT_TOKEN",
    },
  },

  // Plugins
  plugins: {
    entries: {
      "memory-core": { enabled: true },
      "lobster": { enabled: true },
    },
    load: {
      paths: ["./extensions"]
    }
  },

  // Mesh networking
  mesh: {
    tailscale: {
      authKey: "env:TAILSCALE_AUTH_KEY",
      domain: "env:TAILSCALE_DOMAIN",
    }
  }
}
```

## Environment variables

All `env:*` values resolve from environment variables. They can also be stored
in the encrypted vault (`nanosolana vault set KEY VALUE`).

## Config validation

```bash
nanosolana config validate          # Check schema validity
nanosolana config validate --json   # Machine-readable output
```

## Hot reload

The gateway watches the config file for changes:

| Change type | Behavior |
|-------------|----------|
| Channel enable/disable | Hot-applied |
| Trading parameters | Hot-applied |
| Gateway port/bind | Requires restart |
| AI provider change | Hot-applied |
| Memory settings | Hot-applied |

## Per-agent overrides

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        heartbeat: { every: "30m", target: "telegram" }
      },
      {
        id: "research",
        heartbeat: { every: "1h", target: "none" },
        trading: { execution: { enabled: false } }
      }
    ]
  }
}
```
