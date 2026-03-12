<p align="center">
  <img src="public/clawd-logo.png" alt="NanoHub" width="120">
</p>

<h1 align="center">NanoHub</h1>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/Bun-required-14F195?style=for-the-badge" alt="Bun Required">
  <img src="https://img.shields.io/badge/Convex-Backend-7c3aed?style=for-the-badge" alt="Convex Backend">
  <img src="https://img.shields.io/badge/TanStack-Start-4b5563?style=for-the-badge" alt="TanStack Start">
</p>

NanoHub is the **registry and web hub for the NanoSolana ecosystem** (skills + soul packs). It is the UI/API layer used to publish, version, search, and install `SKILL.md` and `SOUL.md` bundles, with moderation controls and embedding-powered discovery.

> This package was previously ClawHub-branded. Tooling and some package names still use `clawhub` for compatibility.

<p align="center">
  <a href="VISION.md">Vision</a> ·
  <a href="docs/README.md">Docs</a> ·
  <a href="CONTRIBUTING.md">Contributing</a>
</p>

## What NanoHub does

- Browse and render published `SKILL.md` bundles.
- Browse and render published `SOUL.md` bundles.
- Publish versioned updates with tags/changelogs.
- Search using vector embeddings (not just keyword match).
- Support moderation workflows (approve/curate/remove/restore).
- Power CLI workflows for discovery, install, publish, and sync.

## NanoSolana integration (headless node + gateway)

NanoHub docs and content are aligned with the native Go node/gateway workflow in this monorepo:

```bash
# spawn native gateway in tmux (Tailscale-aware)
./build/mawdbot node gateway-spawn

# pair a hardware node to the gateway
./build/mawdbot node pair --bridge <TAILSCALE_IP>:18790 --display-name "Orin Nano"

# run headless node client
./build/mawdbot node run --bridge <TAILSCALE_IP>:18790

# optional daemon launch-time gateway autospawn
GATEWAY_AUTO_SPAWN=true ./build/mawdbot daemon
```

Useful environment flags:

- `GATEWAY_AUTO_SPAWN=true`
- `GATEWAY_SPAWN_PORT=18790`
- `GATEWAY_USE_TAILSCALE=true`
- `NODE_BRIDGE_ADDR=127.0.0.1:18790`

## Stack (high-level)

- **Web app:** TanStack Start (React + Vite/Nitro)
- **Backend:** Convex + Convex Auth (GitHub OAuth)
- **Search:** OpenAI embeddings (`text-embedding-3-small`) + Convex vector search
- **Shared schema:** `packages/schema` (`clawhub-schema`)

## CLI workflows

Primary npm package:

- `@nanosolana/nanohub`

Quick start:

```bash
# one-off run
npx @nanosolana/nanohub --help

# login
npx @nanosolana/nanohub login

# publish a local skill folder
npx @nanosolana/nanohub publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --tags latest,solana
```

Global command aliases (primary + compatibility):

- `nanohub` (primary)
- `nanosolana-skill`
- `clawhub` (legacy)
- `clawdhub` (legacy)

Common commands:

- Auth: `nanohub login`, `nanohub whoami`
- Discover: `nanohub search ...`, `nanohub explore`
- Local installs: `nanohub install <slug>`, `nanohub uninstall <slug>`, `nanohub list`, `nanohub update --all`
- Inspect: `nanohub inspect <slug>`
- Publish/sync: `nanohub publish <path>`, `nanohub sync`

Docs: [`docs/quickstart.md`](docs/quickstart.md), [`docs/cli.md`](docs/cli.md).

## Local development

Prereqs: [Bun](https://bun.sh/)

```bash
bun install
cp .env.local.example .env.local

# terminal A: Convex backend
bunx convex dev

# terminal B: app (http://localhost:3000)
bun run dev

# optional seed
bunx convex run --no-push devSeed:seedNixSkills
```

For complete setup (OAuth, JWT/JWKS, env configuration), see [CONTRIBUTING.md](CONTRIBUTING.md).

## Environment

- `VITE_CONVEX_URL`
- `VITE_CONVEX_SITE_URL`
- `VITE_SOULHUB_SITE_URL`
- `VITE_SOULHUB_HOST`
- `VITE_SITE_MODE` (`skills` or `souls`)
- `CONVEX_SITE_URL`
- `SITE_URL`
- `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`
- `JWT_PRIVATE_KEY` / `JWKS`
- `OPENAI_API_KEY`
- `VITE_SUPABASE_URL` (optional)
- `VITE_SUPABASE_ANON_KEY` (optional)
- `SUPABASE_URL` (optional)
- `SUPABASE_ANON_KEY` (optional)
- `SUPABASE_SERVICE_ROLE_KEY` (optional, server only)

Supabase is optional and can be used as an external persistence layer alongside Convex.

## Repo layout

- `src/` — TanStack Start app (routes/components/styles)
- `convex/` — schema + queries/mutations/actions + HTTP routes
- `packages/schema/` — shared API contract/types
- `docs/` — architecture, CLI, auth, deployment docs

## Telemetry

Install telemetry can be disabled with:

```bash
export NANOHUB_DISABLE_TELEMETRY=1
# legacy env vars also supported:
export CLAWHUB_DISABLE_TELEMETRY=1
```

See [`docs/telemetry.md`](docs/telemetry.md).

## Scripts

```bash
bun run dev
bun run build
bun run test
bun run coverage
bun run lint
```

## Production deploy (server + frontend)

NanoHub deploys in two parts: Convex backend and Vercel frontend. This repo now includes a one-command deploy helper that handles both in order.

### 1) Prepare deploy env

```bash
cp .env.deploy.example .env.deploy
# edit .env.deploy with your production values
```

Required values:

- `CONVEX_DEPLOY_KEY`
- `CONVEX_SITE_URL`
- `VITE_CONVEX_URL`
- `VITE_CONVEX_SITE_URL`
- `SITE_URL`

Optional:

- `VITE_APP_BUILD_SHA` (auto-inferred from git if omitted)
- `VERCEL_TOKEN` (needed for non-interactive Vercel deploy)

### 2) Deploy

```bash
bun run deploy:prod
```

What this does:

1. Updates `vercel.json` API rewrite to your `CONVEX_SITE_URL`.
2. Stamps Convex deploy metadata (`APP_BUILD_SHA`, `APP_DEPLOYED_AT`).
3. Deploys Convex functions.
4. Verifies Convex contract compatibility.
5. Builds and deploys the frontend to Vercel production.

If you only need to update the rewrite destination:

```bash
bun run deploy:prep -- https://<your-convex-deployment>.convex.site
```
