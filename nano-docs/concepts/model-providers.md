---
summary: "NanoSolana model providers and AI integration"
title: "Model Providers"
---

# Model providers

NanoSolana uses **OpenRouter** as its primary AI gateway, with the `healer-alpha`
model as the default. The architecture supports multiple providers.

## Default: OpenRouter + healer-alpha

```json5
{
  ai: {
    provider: "openrouter",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "openrouter/healer-alpha",
    apiKey: "env:OPENROUTER_API_KEY",
  }
}
```

### Multimodal capabilities

The `healer-alpha` model supports:
- **Text**: Trading analysis, reasoning, chat.
- **Image**: Chart analysis, screenshot review.
- **Audio**: Voice command processing.
- **Video**: Market broadcast analysis.

### OODA methods

The AI provider exposes structured methods for the OODA loop:

```typescript
const ai = new AIProvider(config);

// Orient — market analysis
const analysis = await ai.orient(marketData);

// Decide — structured trade decision
const decision = await ai.decide(analysis, walletState);

// Research — deep-dive investigation
const findings = await ai.research("Is SOL correlated with BTC?");

// Chat — conversational interaction
const reply = await ai.agentChat("What's my portfolio looking like?");
```

## Supported providers

| Provider | Status | Notes |
|----------|--------|-------|
| **OpenRouter** | ✅ Default | healer-alpha, Claude, GPT-5, Gemini |
| **OpenAI** | ✅ Supported | GPT-5.2, Codex |
| **Anthropic** | ✅ Supported | Claude Opus 4, Sonnet |
| **Google** | ✅ Supported | Gemini 2.5 Pro |
| **Local (Ollama)** | ⚡ Experimental | For offline operation |

## Configuration

```bash
nanosolana config set ai.provider openrouter
nanosolana config set ai.model "openrouter/healer-alpha"
nanosolana vault set OPENROUTER_API_KEY "sk-or-v1-..."
```

## Model failover

If the primary model fails, NanoSolana can fall back:

```json5
{
  ai: {
    provider: "openrouter",
    model: "openrouter/healer-alpha",
    fallbacks: [
      "anthropic/claude-sonnet-4-20250514",
      "openai/gpt-4o"
    ]
  }
}
```

## Cost management

- Heartbeat model can be different from main model (cheaper).
- `heartbeat.lightContext: true` reduces prompt size.
- Trading analysis uses full context; chat uses lighter context.
