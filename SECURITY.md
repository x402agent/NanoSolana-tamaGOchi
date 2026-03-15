# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.x.x (current) | ✅ |

## Reporting a Vulnerability

**Do NOT open a public issue for security vulnerabilities.**

### Contact

Email **security@nanosolana.com** with:

1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact assessment
4. Suggested fix (if any)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Assessment**: Within 5 business days
- **Fix**: Depending on severity, typically within 7-14 days
- **Disclosure**: Coordinated public disclosure after fix is deployed

### Scope

The following are in scope for security reports:

- **Vault encryption** — any weakness in AES-256-GCM key derivation or storage
- **Wallet security** — any path where private keys could be exposed
- **Gateway authentication** — HMAC-SHA256 bypass or token leakage
- **Rate limiting** — bypass or denial-of-service vectors
- **Memory system** — data leakage between agents or unauthorized access
- **Plugin system** — privilege escalation through extensions
- **Trading engine** — any manipulation that could cause unintended trades

### Out of Scope

- Social engineering attacks
- Denial of service against external APIs (Helius, Birdeye, Jupiter)
- Issues in third-party dependencies (report upstream)
- Attacks requiring physical access to the machine

## Security Design Principles

NanoSolana follows these principles:

1. **Defense in depth** — multiple layers of protection
2. **Least privilege** — components only access what they need
3. **Fail closed** — errors disable functionality, never bypass security
4. **Encrypt everything** — all secrets encrypted at rest, all connections authenticated
5. **Audit trail** — all security-relevant events are logged

## Bug Bounty

We don't currently have a formal bug bounty program, but we deeply appreciate security research. Significant findings will be credited in our changelog and security advisories.

## Operational Security

### Runtime Requirements
- **Node.js 20+** — required for native crypto APIs used in vault encryption
- **File permissions** — vault files should be `0600`, vault directory `0700`
- **Docker** — run containers with `--read-only` and `--no-new-privileges` where possible

### Environment Variables
- **Never commit `.env` files** — they are gitignored at all levels (`**/.env`)
- **Use `.env.example`** templates — copy and fill with your own credentials
- **Rotate keys if exposed** — if a `.env` file was ever committed or shared, rotate ALL credentials immediately
- **Use the encrypted vault in production** — `nanosolana init` encrypts all API keys with AES-256-GCM

### Container Security
- Agent containers run with filesystem isolation
- Only explicitly mounted directories are accessible
- Network access is controlled per-container
- No root access inside containers

### Automated Security Scanning
```bash
nanosolana security audit --deep    # Full security scan
nanosolana doctor                   # Diagnostics including security checks
```
