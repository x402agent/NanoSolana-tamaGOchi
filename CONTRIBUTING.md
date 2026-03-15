# Contributing to NanoSolana

Thank you for your interest in NanoSolana. We're building the future of autonomous financial agents, and we want your help.

## Quick Start for Contributors

```bash
git clone https://github.com/x402agent/NanoSolana.git
cd NanoSolana/nano-core
npm install
npm run dev
```

## What We Need

### 🔥 High Priority
- **Trading strategies** — new indicators, signal generators, and risk models
- **Security audits** — penetration testing, threat modeling, code review
- **Backtesting** — historical data replay and strategy evaluation framework
- **Memory engine** — vector similarity search, LanceDB optimization

### 🟢 Good First Issues
- Documentation improvements and tutorials
- CLI UX improvements
- New channel plugins (WhatsApp, Slack, Matrix)
- i18n translations
- Test coverage expansion

### 🔬 Research
- Multi-agent coordination protocols
- On-chain reputation systems
- MEV protection strategies
- Cross-chain agent communication

## Development Flow

1. **Fork** the repository
2. **Create a branch** from `main` — `feat/my-feature` or `fix/my-fix`
3. **Write code** following the style guide below
4. **Test** — `npm test` (all tests must pass)
5. **Lint** — `npm run lint` (zero warnings)
6. **Submit a PR** with a clear description of what and why

## Code Style

- **Language**: TypeScript (ESM, strict mode)
- **Formatting**: 
  - `nano-core`: Prettier — `npm run format`
  - `nanohub`: Oxfmt — `bun run format`  
- **Linting**: Oxlint in nanohub — `bun run lint`
- **Types**: Strict. No `any`. No `@ts-ignore`.
- **Comments**: Brief comments for non-obvious logic
- **File size**: Aim for < 500 LOC per file
- **Naming**: `camelCase` for functions/variables, `PascalCase` for types/classes

## Financial Code Standards

Since NanoSolana handles real money, financial code has extra requirements:

- **All trading logic** must have unit tests with edge cases (zero balance, max slippage, API failure)
- **All wallet operations** must be tested with mock keypairs — never real keys in tests
- **All API key handling** must go through the encrypted vault — never read from environment directly in production paths
- **All numeric calculations** must handle floating-point precision (use integer lamports, not SOL floats)
- **All external API calls** must have timeout, retry, and error handling

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add Bollinger Bands indicator to strategy engine
fix: prevent double-execution on duplicate signals
docs: add backtesting tutorial
security: upgrade HMAC to use SHA-512
```

## Security Vulnerabilities

**Do NOT open a public issue for security vulnerabilities.**

Email security@nanosolana.com with details. We will respond within 48 hours.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Welcome aboard.** 🦞
