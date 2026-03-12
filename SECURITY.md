# 🔒 Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it responsibly:

- **Email:** security@8bitlabs.xyz
- **Do NOT** open a public GitHub issue for security vulnerabilities

We'll acknowledge your report within 48 hours and provide a timeline for a fix.

## Secrets & API Keys

MawdBot is designed so that **zero secrets are required in the source code**.

### How It Works

1. **All secrets come from environment variables** (via `.env` file or system env)
2. **`.env` is gitignored** — it will never be committed to git
3. **`.env.example`** contains the template with empty values — safe to commit
4. **Config defaults** in `pkg/config/config.go` contain no secrets (all empty strings)
5. **MawdBot degrades gracefully** — missing API keys disable features, not crash

### Before Contributing

Before pushing any code, always verify:

```bash
# Check that .env is not tracked by git
git ls-files --error-unmatch .env 2>&1 | grep -q "error" && echo "✅ .env is safely gitignored" || echo "❌ WARNING: .env is tracked!"

# Search for potential hardcoded secrets in your changes
git diff --cached | grep -iE "(sk-|api[_-]?key\s*[:=]\s*['\"][A-Za-z0-9]|private[_-]?key\s*[:=]\s*['\"][A-Za-z0-9])" && echo "⚠️ Potential secret found!" || echo "✅ No secrets detected"
```

### Secrets Checklist

| Secret | Source | Never Hardcode |
|--------|--------|---------------|
| `HELIUS_API_KEY` | `.env` / env var | ✅ |
| `BIRDEYE_API_KEY` | `.env` / env var | ✅ |
| `JUPITER_API_KEY` | `.env` / env var | ✅ |
| `ASTER_API_KEY` / `ASTER_API_SECRET` | `.env` / env var | ✅ |
| `SOLANA_PRIVATE_KEY` | `.env` / env var | ✅ |
| `OPENROUTER_API_KEY` | `.env` / env var | ✅ |
| `OPENROUTER_MODEL` | `.env` / env var | ✅ |
| `ANTHROPIC_API_KEY` | `.env` / env var | ✅ |
| `SUPABASE_SERVICE_KEY` | `.env` / env var | ✅ |
| `TELEGRAM_BOT_TOKEN` | `.env` / env var | ✅ |
| `X402_FACILITATOR_AUTHORIZATION` | `.env` / env var | ✅ |

### Wallet Security

- Agent wallets are stored at `~/.mawdbot/wallet/` with `0600` permissions (owner-only)
- Private keys are never logged — only the public key (address) appears in logs
- Use `SOLANA_PRIVATE_KEY` env var for existing wallets, or let MawdBot auto-generate

## Supported Versions

| Version | Supported |
|---------|-----------|
| Latest (main) | ✅ |
| Pre-release | ⚠️ Best effort |

## Best Practices for Users

1. **Never commit `.env` files** to any repository
2. **Rotate API keys** regularly, especially if you suspect exposure
3. **Use separate API keys** for development and production
4. **Run in simulated mode** (`--sim`) before funding your agent wallet
5. **Start with small balances** when going live
