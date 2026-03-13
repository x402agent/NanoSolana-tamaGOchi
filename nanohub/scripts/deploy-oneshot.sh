#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKAGE_DIR="$ROOT_DIR/packages/clawdhub"

if [[ -z "${NPM_TOKEN:-}" ]]; then
  echo "Error: NPM_TOKEN is required (export NPM_TOKEN=...)" >&2
  exit 1
fi

NPMRC_PATH="$ROOT_DIR/.npmrc.deploy"
cleanup() {
  rm -f "$NPMRC_PATH"
}
trap cleanup EXIT

printf '//registry.npmjs.org/:_authToken=%s\n' "$NPM_TOKEN" > "$NPMRC_PATH"
chmod 600 "$NPMRC_PATH"

echo "==> verifying npm auth"
npm whoami --userconfig "$NPMRC_PATH" >/dev/null

echo "==> building clawhub CLI package"
bunx tsc -p "$PACKAGE_DIR/tsconfig.json"

echo "==> dry-run package verification"
npm pack --dry-run --json --prefix "$PACKAGE_DIR" >/dev/null

echo "==> publishing clawhub package"
npm publish --access public --registry https://registry.npmjs.org --userconfig "$NPMRC_PATH" --prefix "$PACKAGE_DIR"

if [[ "${SKIP_CONVEX_DEPLOY:-0}" != "1" ]]; then
  echo "==> deploying Convex backend"
  bun run --cwd "$ROOT_DIR" convex:deploy
else
  echo "==> skipping Convex deploy (SKIP_CONVEX_DEPLOY=1)"
fi

echo "Done: one-shot deploy completed for clawhub + hub backend"