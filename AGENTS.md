# NanoSolana — Repository Guidelines

## Project Identity

NanoSolana is a modular, security-first framework for building autonomous financial agents on Solana. It ships as a monorepo with a TypeScript runtime (`nano-core`), Go binary (`TamaGObot`), web UI (`nanohub`), and 40+ channel extensions.

## Repository Structure

```
NanoSolana/
├── nano-core/nanoclaw-main/  # Core TypeScript runtime and CLI
├── nanohub/                  # Agent Registry (React + Convex + Vercel)
├── nano-docs/                # Documentation
├── extensions/               # 40+ channel plugins
├── skills/                   # 52+ skills
├── apps/                     # Platform apps (macOS, Android)
├── site/                     # Landing site
├── ui/                       # Standalone web UI
├── assets/                   # Chrome extension + assets
├── .env.example              # Environment template (root)
├── README.md                 # This file (625 lines)
├── SECURITY.md               # Security policy
└── CONTRIBUTING.md            # Contribution guide
```

## Development

### Core (nano-core/nanoclaw-main)
```bash
cd nano-core/nanoclaw-main
npm install
npm run dev          # Run with hot reload (tsx)
npm run build        # Compile TypeScript
npm test             # Run vitest suite
npm run typecheck    # TypeScript strict mode check
npm run format       # Prettier formatting
```

### NanoHub (nanohub/)
```bash
cd nanohub
bun install
bun run dev          # Launch dev server
```

## Code Style

- **Language**: TypeScript (ESM, strict mode)
- **Formatting**: Prettier — run `npm run format` before committing
- **Types**: Strict. No `any`. No `@ts-ignore`.
- **File size**: Aim for < 500 LOC per file
- **Naming**: `camelCase` for functions/variables, `PascalCase` for types/classes
- **Commits**: Follow [Conventional Commits](https://www.conventionalcommits.org/)

## Security Rules

1. **Never commit `.env` files** — all secrets stay local, encrypted in the NanoSolana vault
2. **Never log secrets** — no API keys, private keys, or tokens in console output
3. **All wallet operations** must be tested with mock keypairs, never real keys
4. **All API key handling** goes through the encrypted vault in production
5. **All numeric calculations** use integer lamports, not SOL floats

## Key Environment Variables

All keys go in `.env` (gitignored). See `.env.example` for templates.

| Variable | Required | Purpose |
|----------|----------|---------|
| `OPENROUTER_API_KEY` | Yes | AI provider |
| `HELIUS_API_KEY` | Yes | Solana RPC |
| `HELIUS_RPC_URL` | Yes | Mainnet endpoint |
| `BIRDEYE_API_KEY` | Recommended | Market data |
| `JUPITER_API_KEY` | For trading | DEX execution |
| `NANO_GATEWAY_TOKEN` | For gateway | HMAC auth |

## Testing

```bash
# In nano-core/nanoclaw-main/
npm test             # Run all tests
npm run test:watch   # Watch mode
```

Tests use Vitest. Financial code must have edge-case tests (zero balance, max slippage, API failures).

## Skills

Skills are located in `/skills/`. Each skill is a directory with a SKILL.md file. To use a skill, read its SKILL.md first.

## Extensions

Channel extensions are in `/extensions/`. Each is a standalone package (Telegram, Discord, WhatsApp, Slack, Signal, etc.).
