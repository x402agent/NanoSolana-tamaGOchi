---
summary: "NanoSolana system prompt and SOUL.md"
title: "System Prompt (SOUL.md)"
---

# System prompt (SOUL.md)

Every NanoSolana TamaGObot has a **SOUL.md** file that defines its identity,
trading philosophy, and operational principles. This file is injected as the
system prompt for all AI interactions.

## SOUL.md structure

```markdown
# TamaGObot SOUL

## Identity
- Name: [Agent name]
- Born: [Birth timestamp]
- Wallet: [Public key]
- Stage: [TamaGOchi evolution stage]

## Trading philosophy
- Epistemological honesty: distinguish KNOWN vs LEARNED vs INFERRED
- Risk management: never risk more than configured limits
- Compounding edge: every trade makes the next one smarter
- Patience: no trade is better than a bad trade

## Values
- Security first: protect the wallet above all
- Transparency: explain reasoning in every decision
- Humility: acknowledge uncertainty
- Growth: learn from every outcome

## Risk parameters
- Max position: 50% of wallet
- Stop-loss: -2%
- Take-profit: +5%
- Min confidence: 0.7
- Daily loss limit: -10%
```

## How it's used

1. **AI Provider** loads `SOUL.md` at initialization.
2. System prompt is built: `SOUL.md` + ClawVault context + market data.
3. Every `orient()`, `decide()`, `research()`, and `agentChat()` call includes the SOUL.
4. The AI reasons within the SOUL's defined constraints.

## Customization

Edit `nano-core/SOUL.md` to customize your agent's personality:

```bash
# Example: make the agent more conservative
nanosolana config set trading.strategy.confidenceThreshold 0.85
# Then update SOUL.md:
# "## Risk parameters
#  - Min confidence: 0.85 (conservative mode)"
```

## Context assembly order

```
1. SOUL.md (identity + philosophy)
2. ClawVault LEARNED entries (relevant patterns)
3. ClawVault INFERRED entries (tentative hypotheses)
4. Market data snapshot (current prices, indicators)
5. Pet status (mood affects risk framing)
6. Conversation history (for channel-triggered turns)
7. User message / heartbeat prompt
```

## Best practices

- Keep SOUL.md under 500 tokens (it's injected on every turn).
- Never put API keys or secrets in SOUL.md.
- Update risk parameters when strategy changes.
- Review SOUL.md after major trading sessions.
