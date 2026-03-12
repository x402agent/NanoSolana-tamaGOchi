---
summary: "NanoSolana gateway security — authentication, encryption, and access control"
title: "Gateway Security"
---

# Gateway security

## Authentication methods

### HMAC-SHA256 (WebSocket)

All WebSocket connections are authenticated using HMAC-SHA256:

1. Agent computes signature: `HMAC(secret, JSON.stringify({ type, from, timestamp }))`.
2. Gateway verifies using `crypto.timingSafeEqual` (constant-time comparison).
3. Invalid signatures result in immediate connection close (`4003`).

### Secret header (HTTP API)

HTTP API endpoints accept authentication via:

- `X-NanoSolana-Secret: <secret>` header.
- `Authorization: Bearer <secret>` header.

Both are checked using timing-safe comparison.

### Rate limiting

| Scope | Limit | Window | Action |
|-------|-------|--------|--------|
| Connections per IP | 10 | 60s | Connection refused |
| Messages per agent | 100 | 60s | Messages dropped |

## Encryption

### At rest

- **Vault** (`~/.nanosolana/vault.enc`): AES-256-GCM with PBKDF2 key derivation.
- **Memory files**: `0600` permissions (owner read/write only).
- **Config directory**: `0700` permissions.

### In transit

- WebSocket: plaintext on loopback; TLS recommended for remote via Tailscale.
- HTTP: same as WebSocket (shares the same port).

## Trust boundaries

```
┌─────────────────────────────────────────────┐
│  Host machine (trusted)                      │
│  ┌───────────────────┐  ┌────────────────┐  │
│  │  NanoSolana Agent  │  │  Vault (enc)   │  │
│  │  ┌─────────────┐  │  │  ├─ API keys   │  │
│  │  │ Trading Eng. │  │  │  ├─ Wallet key │  │
│  │  │ Memory Eng.  │  │  │  └─ Gateway sec│  │
│  │  │ AI Provider  │  │  └────────────────┘  │
│  │  │ Gateway      │  │                      │
│  │  └─────────────┘  │                      │
│  └───────────────────┘                      │
└─────────────────────────────────────────────┘
         │ HMAC-SHA256      │ Tailscale VPN
         ▼                  ▼
┌──────────────┐    ┌──────────────┐
│  Mesh Node   │    │  Mesh Node   │
│  (trusted)   │    │  (trusted)   │
└──────────────┘    └──────────────┘
         │
         ▼ (untrusted)
┌──────────────────────────────────┐
│  External APIs (Helius, Birdeye) │
│  Channel APIs (Telegram, Discord)│
└──────────────────────────────────┘
```

## Security checklist

```bash
nanosolana security audit          # Run all checks
nanosolana security audit --deep   # Include live probes
nanosolana security audit --fix    # Auto-fix safe issues
```

| Check | Description |
|-------|-------------|
| `vault-permissions` | vault.enc is `0600` |
| `config-permissions` | ~/.nanosolana is `0700` |
| `gateway-auth` | HMAC secret is configured |
| `rate-limiting` | Rate limits are active |
| `no-plaintext-keys` | No API keys in .env |
| `wallet-vault-only` | Private key only in vault |
| `tailscale-mesh` | Tailscale configured for remote |
| `git-no-secrets` | No secrets in git history |
