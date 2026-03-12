---
summary: "NanoSolana security model — encryption, authentication, and trust boundaries"
title: "Security"
---

# Security

NanoSolana is designed security-first for financial operations. Every secret is
encrypted, every connection is authenticated, and every trust boundary is explicit.

## Threat model

NanoSolana assumes:

- **The host machine is trusted** (filesystem access = full access).
- **The network is hostile** (all connections are authenticated + signed).
- **API keys are high-value targets** (all stored encrypted at rest).
- **The wallet private key is the crown jewel** (never leaves the vault).

## Encryption at rest

### Vault (`~/.nanosolana/vault.enc`)

All secrets are stored using **AES-256-GCM** encryption:

```
┌─────────────────────────────────────┐
│  vault.enc                          │
│  ┌──────────────────────────────┐   │
│  │ Salt (32 bytes)              │   │
│  │ IV (16 bytes)                │   │
│  │ Auth Tag (16 bytes)          │   │
│  │ Encrypted payload            │   │
│  │  ├─ OPENROUTER_API_KEY       │   │
│  │  ├─ HELIUS_API_KEY           │   │
│  │  ├─ BIRDEYE_API_KEY          │   │
│  │  ├─ JUPITER_API_KEY          │   │
│  │  ├─ WALLET_PRIVATE_KEY       │   │
│  │  └─ NANO_GATEWAY_SECRET      │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

- Key derivation: `PBKDF2(password, salt, 100000, 32, 'sha512')`
- Cipher: `AES-256-GCM`
- File permissions: `0600` (owner read/write only)
- Directory permissions: `0700` (owner only)

### Wallet private key

- Generated at agent "birth" using `Ed25519`.
- Stored ONLY in the encrypted vault.
- Never logged, never transmitted, never in memory tiers.
- Exported only via `nanosolana wallet export` (requires vault password).

## Authentication

### Gateway WebSocket

All WS connections require HMAC-SHA256 authentication:

```
1. Client connects
2. Client sends: { type: "auth", from: agentId, signature: HMAC(secret, payload) }
3. Gateway verifies signature using timing-safe comparison
4. Gateway responds: { type: "auth:ok", ... }
```

- Signature covers: `type + from + timestamp`.
- Verification uses `crypto.timingSafeEqual` (no timing attacks).
- Auth timeout: 5 seconds (connection closed if exceeded).

### Gateway HTTP API

Protected endpoints require the `X-NanoSolana-Secret` header:

```bash
curl -H "X-NanoSolana-Secret: $NANO_GATEWAY_SECRET" \
     http://localhost:18789/api/status
```

Or Bearer token:

```bash
curl -H "Authorization: Bearer $NANO_GATEWAY_SECRET" \
     http://localhost:18789/api/status
```

### Rate limiting

| Scope | Limit | Window |
|-------|-------|--------|
| WS connections per IP | 10 | 60s |
| WS messages per agent | 100 | 60s |

## Network security

### Tailscale mesh

- All agent-to-agent communication flows through Tailscale VPN.
- No public ports exposed.
- Node discovery uses Tailscale API.
- Each node is identified by its Tailscale hostname + agent wallet public key.

### Tmux sessions

- Bot sessions managed via tmux (isolated process namespaces).
- Each bot runs in its own tmux session with separate environment.
- No shared state between tmux sessions.

## Configuration security

### Redaction

The `redactConfig()` function ensures sensitive values are never displayed:

```typescript
// These keys are always redacted in output:
const REDACTED_KEYS = [
  'apiKey', 'secret', 'token', 'password', 'privateKey',
  'botToken', 'rpcUrl', 'wssUrl'
];
// Output: "sk-or-v1-35...533c" → "sk-o...33c"
```

### Secure defaults

- Vault password: prompted interactively (never stored in plaintext).
- Gateway secret: auto-generated if not provided.
- File permissions: enforced on every write.
- Config validation: Zod schema validation on load.

## Audit

Run security audit:

```bash
nanosolana security audit          # Basic checks
nanosolana security audit --deep   # Full probe
nanosolana security audit --fix    # Auto-fix safe issues
```

Checks include:

- [ ] Vault file permissions are `0600`
- [ ] Config directory is `0700`
- [ ] No plaintext API keys in `.env`
- [ ] Gateway secret is set
- [ ] Wallet private key is vault-only
- [ ] HMAC is enabled on gateway
- [ ] Rate limiting is active
- [ ] Tailscale is configured for mesh
- [ ] No leaked keys in git history

## Best practices

1. **Never commit `.env` files** — use `vault.enc` instead.
2. **Rotate secrets regularly** — `nanosolana vault rotate`.
3. **Use Tailscale** — never expose gateway ports publicly.
4. **Monitor audit logs** — check for auth failures.
5. **Keep SOUL.md clean** — no secrets in the AI system prompt.
6. **Enable rate limiting** — prevent resource exhaustion.
7. **Use separate vault passwords** — per-environment (dev/prod).
