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

Common commands (compatibility name retained):

- Auth: `clawhub login`, `clawhub whoami`
- Discover: `clawhub search ...`, `clawhub explore`
- Local installs: `clawhub install <slug>`, `clawhub uninstall <slug>`, `clawhub list`, `clawhub update --all`
- Inspect: `clawhub inspect <slug>`
- Publish/sync: `clawhub publish <path>`, `clawhub sync`

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

## Repo layout

- `src/` — TanStack Start app (routes/components/styles)
- `convex/` — schema + queries/mutations/actions + HTTP routes
- `packages/schema/` — shared API contract/types
- `docs/` — architecture, CLI, auth, deployment docs

## Telemetry

Install telemetry can be disabled with:

```bash
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
