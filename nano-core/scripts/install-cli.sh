#!/usr/bin/env bash

set -euo pipefail

PREFIX="${HOME}/.nanosolana"
INSTALL_METHOD="git"
PACKAGE_NAME="nanosolana"
VERSION="latest"
REPO_URL="https://github.com/nanosolana/nanosolana.git"
REPO_REF="main"
NO_PROFILE=0
DRY_RUN=0

print_usage() {
  cat <<'USAGE'
NanoSolana one-shot installer

Usage:
  install-cli.sh [options]

Options:
  --prefix <path>          Install prefix (default: ~/.nanosolana)
  --install-method <mode>  Install mode: git | npm (default: git)
  --package <name>         npm package name (default: nanosolana)
  --version <tag>          npm version/dist-tag (default: latest)
  --repo-url <url>         Git repository URL (default: nanosolana/nanosolana)
  --repo-ref <ref>         Git branch/tag/ref (default: main)
  --no-profile             Do not modify shell profile
  --dry-run                Print steps without executing them
  -h, --help               Show this help message

Examples:
  curl -fsSL https://nanosolana.ai/install.sh | bash
  curl -fsSL https://nanosolana.ai/install.sh | \
    bash -s -- --install-method npm --version latest
USAGE
}

log() {
  printf '==> %s\n' "$*"
}

die() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    die "required command not found: $1"
  fi
}

run_cmd() {
  if [[ "$DRY_RUN" -eq 1 ]]; then
    printf '[dry-run] '
    printf '%q ' "$@"
    printf '\n'
    return
  fi

  "$@"
}

ensure_node_runtime() {
  require_command node
  require_command npm

  local node_major
  node_major="$(node -p 'process.versions.node.split(".")[0]')"
  if [[ -z "$node_major" || "$node_major" -lt 22 ]]; then
    die "Node.js 22+ is required (found: $(node -v 2>/dev/null || echo unknown))"
  fi
}

detect_profile_file() {
  if [[ -n "${ZDOTDIR:-}" && -f "${ZDOTDIR}/.zshrc" ]]; then
    printf '%s\n' "${ZDOTDIR}/.zshrc"
    return
  fi

  for file in "${HOME}/.zshrc" "${HOME}/.bashrc" "${HOME}/.bash_profile" "${HOME}/.profile"; do
    if [[ -f "$file" ]]; then
      printf '%s\n' "$file"
      return
    fi
  done

  printf '%s\n' "${HOME}/.profile"
}

ensure_path_export() {
  local profile_file="$1"
  local export_line="export PATH=\"${PREFIX}/bin:\$PATH\""

  if [[ "$NO_PROFILE" -eq 1 ]]; then
    log "skipping profile edits (--no-profile set)"
    return
  fi

  if [[ -f "$profile_file" ]] && grep -Fq "${PREFIX}/bin" "$profile_file"; then
    log "PATH already configured in ${profile_file}"
    return
  fi

  log "adding NanoSolana PATH entry to ${profile_file}"
  run_cmd mkdir -p "$(dirname "$profile_file")"

  if [[ "$DRY_RUN" -eq 1 ]]; then
    printf '[dry-run] append to %s: %s\n' "$profile_file" "$export_line"
    return
  fi

  {
    printf '\n# NanoSolana CLI\n'
    printf '%s\n' "$export_line"
  } >>"$profile_file"
}

install_from_npm() {
  log "installing ${PACKAGE_NAME}@${VERSION} into ${PREFIX}"
  run_cmd mkdir -p "$PREFIX"
  run_cmd npm install --global --prefix "$PREFIX" "${PACKAGE_NAME}@${VERSION}"
}

install_from_git() {
  require_command git
  log "installing NanoSolana from ${REPO_URL}#${REPO_REF}"
  run_cmd mkdir -p "$PREFIX"

  if [[ "$DRY_RUN" -eq 1 ]]; then
    run_cmd git clone --depth 1 --branch "$REPO_REF" "$REPO_URL" /tmp/nanosolana-install-repo
    run_cmd npm install --prefix /tmp/nanosolana-install-repo/nano-core
    run_cmd npm run build --prefix /tmp/nanosolana-install-repo/nano-core
    run_cmd npm install --global --prefix "$PREFIX" /tmp/nanosolana-install-repo/nano-core
    return
  fi

  local temp_dir
  temp_dir="$(mktemp -d)"
  trap 'rm -rf "$temp_dir"' EXIT

  git clone --depth 1 --branch "$REPO_REF" "$REPO_URL" "$temp_dir/repo"
  npm install --prefix "$temp_dir/repo/nano-core"
  npm run build --prefix "$temp_dir/repo/nano-core"
  npm install --global --prefix "$PREFIX" "$temp_dir/repo/nano-core"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --prefix)
      [[ $# -ge 2 ]] || die "--prefix requires a value"
      PREFIX="$2"
      shift 2
      ;;
    --install-method)
      [[ $# -ge 2 ]] || die "--install-method requires a value"
      INSTALL_METHOD="$2"
      shift 2
      ;;
    --package)
      [[ $# -ge 2 ]] || die "--package requires a value"
      PACKAGE_NAME="$2"
      shift 2
      ;;
    --version)
      [[ $# -ge 2 ]] || die "--version requires a value"
      VERSION="$2"
      shift 2
      ;;
    --repo-url)
      [[ $# -ge 2 ]] || die "--repo-url requires a value"
      REPO_URL="$2"
      shift 2
      ;;
    --repo-ref)
      [[ $# -ge 2 ]] || die "--repo-ref requires a value"
      REPO_REF="$2"
      shift 2
      ;;
    --no-profile)
      NO_PROFILE=1
      shift
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    -h|--help)
      print_usage
      exit 0
      ;;
    *)
      die "unknown argument: $1"
      ;;
  esac
done

if [[ "$INSTALL_METHOD" != "git" && "$INSTALL_METHOD" != "npm" ]]; then
  die "invalid --install-method '${INSTALL_METHOD}' (expected git|npm)"
fi

ensure_node_runtime

if [[ "$INSTALL_METHOD" == "git" ]]; then
  install_from_git
else
  install_from_npm
fi

profile_file="$(detect_profile_file)"
ensure_path_export "$profile_file"

if [[ "$DRY_RUN" -eq 0 && ! -x "${PREFIX}/bin/nanosolana" ]]; then
  die "install completed but nanosolana binary was not found at ${PREFIX}/bin/nanosolana"
fi

log "NanoSolana installed successfully"
printf '\nNext steps:\n'
printf '  1) Add to PATH now: export PATH="%s/bin:$PATH"\n' "$PREFIX"
printf '  2) Verify install: nanosolana --version\n'
printf '  3) Initialize vault: nanosolana init\n'
printf '  4) Start agent: nanosolana run\n'
