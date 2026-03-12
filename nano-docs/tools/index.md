---
summary: "NanoSolana tools reference — agent-facing tools and capabilities"
title: "Tools"
---

# Tools

NanoSolana exposes tools to the AI agent for autonomous operation. Tools are
invoked by the AI during OODA cycles and can be extended via plugins.

## Built-in tools

### Trading tools

| Tool | Description |
|------|-------------|
| `trade_analyze` | Run RSI/EMA/ATR analysis on a token |
| `trade_signal` | Generate a trading signal with confidence score |
| `trade_execute` | Execute a swap via Jupiter (requires approval) |
| `trade_status` | Get current positions and P&L |
| `trade_history` | Retrieve past trade outcomes |

### Wallet tools

| Tool | Description |
|------|-------------|
| `wallet_balance` | Check SOL and SPL token balances |
| `wallet_send` | Send SOL or tokens (requires approval) |
| `wallet_transactions` | Recent transaction history |

### Memory tools

| Tool | Description |
|------|-------------|
| `memory_search` | Semantic search across ClawVault tiers |
| `memory_get` | Read a specific memory entry |
| `memory_store` | Store a new entry in a specific tier |

### Market data tools

| Tool | Description |
|------|-------------|
| `market_price` | Get current token price (Birdeye) |
| `market_ohlcv` | Get OHLCV candlestick data |
| `market_volume` | Token volume analytics |
| `market_trending` | Trending tokens on Solana |

### Communication tools

| Tool | Description |
|------|-------------|
| `send_message` | Send message to a channel |
| `send_alert` | Send trading alert to configured targets |

### Browser tools (optional)

| Tool | Description |
|------|-------------|
| `browser_navigate` | Navigate to URL |
| `browser_screenshot` | Capture page screenshot |
| `browser_click` | Click element |

## Tool approvals

Sensitive tools require explicit approval:

```json5
{
  tools: {
    approvals: {
      "trade_execute": "always",   // Always ask before trading
      "wallet_send": "always",     // Always ask before sending
      "send_message": "first",     // Ask first time only
      "memory_store": "never",     // Auto-approve
    }
  }
}
```

## Lobster workflows

The Lobster extension enables typed, multi-step workflows with resumable approvals:

```typescript
// Example: automated DCA workflow
const dcaWorkflow = lobster.pipeline("daily-dca", {
  steps: [
    { name: "check-balance", tool: "wallet_balance" },
    { name: "analyze", tool: "trade_analyze", params: { token: "SOL" } },
    { name: "execute", tool: "trade_execute", approval: "required" },
  ],
  schedule: "0 9 * * *",  // Daily at 9 AM
});
```

## LLM Task (multi-step research)

The LLM Task extension enables autonomous multi-step research:

```bash
nanosolana agent --message "Research the top 5 memecoins by volume and analyze their RSI"
```

The agent will:
1. Query Birdeye for trending tokens.
2. Fetch OHLCV data for each.
3. Calculate RSI indicators.
4. Store findings in ClawVault LEARNED tier.
5. Deliver summary to target channel.

## Plugin tools

Extensions can register custom tools:

```typescript
api.registerTool({
  name: "custom_indicator",
  description: "Calculate my custom indicator",
  parameters: {
    token: { type: "string", description: "Token mint address" },
    period: { type: "number", default: 14 },
  },
  execute: async ({ token, period }) => {
    const data = await fetchOHLCV(token, period);
    return { value: calculateIndicator(data) };
  },
});
```

## Slash commands (chat)

In Telegram/Discord chat, users can use slash commands:

| Command | Description |
|---------|-------------|
| `/status` | Agent + wallet + pet status |
| `/trade` | Current trading status |
| `/balance` | Wallet balance |
| `/signals` | Recent trading signals |
| `/pet` | TamaGOchi pet status |
| `/memory` | Memory stats |
| `/help` | Available commands |
