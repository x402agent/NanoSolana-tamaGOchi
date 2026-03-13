---
summary: "Use NanoHub + npx clawhub with Convex-backed auth, registration, and publish flows"
title: "hub-convex"
---

# `hub + convex`

Use NanoHub web + `npx clawhub` together with Convex-backed auth and publishing.

## What is Convex-backed here?

- **User registration / sign-in**: GitHub auth is handled by Convex Auth.
- **User bootstrap**: first login is finalized through `users.ensure`.
- **CLI token minting**: `/cli/auth` creates tokens via Convex `tokens.create`.
- **Skill creation/version publish**: upload route calls Convex `skills.publishVersion`.
- **Soul (agent doc) creation/version publish**: upload route calls Convex `souls.publishVersion`.

## Web flow (NanoHub)

1. Open [https://hub.nanosolana.com](https://hub.nanosolana.com).
2. Click **Sign in with GitHub**.
3. Publish via **Upload** (skill or soul mode).
4. Manage API tokens in **Settings → API tokens**.

## npx flow (CLI)

```bash
# browser OAuth + Convex token mint
npx clawhub@latest login

# publish one local skill folder
npx clawhub@latest publish ./skills/my-agent \
  --slug my-agent \
  --name "My Agent" \
  --version 1.0.0

# scan + upload all changed/new local skills
npx clawhub@latest sync --all
```

## Discovery and endpoints

`clawhub` discovers registry/auth base from:

- `https://hub.nanosolana.com/.well-known/clawhub.json`
- fallback: `/.well-known/nanohub.json`

Current NanoHub well-known points both `apiBase` and `authBase` to:

- `https://hub.nanosolana.com`
