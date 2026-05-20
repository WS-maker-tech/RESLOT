#!/bin/bash
# SessionStart hook for Claude Code on the web.
# Installs project dependencies and the Firecrawl CLI — both vanish when
# the ephemeral container is reclaimed, so they need re-installing each
# fresh session.
#
# Set FIRECRAWL_API_KEY in the environment config (Settings -> Environments)
# the first time. After init the key is persisted in ~/.config/firecrawl-cli
# and the variable is no longer required.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

log() { printf '[session-start] %s\n' "$*" >&2; }

cd "$CLAUDE_PROJECT_DIR/mobile"
log "Installing mobile dependencies with bun..."
bun install

if ! command -v firecrawl >/dev/null 2>&1; then
  log "Installing Firecrawl CLI globally..."
  if [ -n "${FIRECRAWL_API_KEY:-}" ]; then
    npx -y firecrawl-cli@latest init --all -y -k "$FIRECRAWL_API_KEY" >/dev/null
  else
    log "FIRECRAWL_API_KEY not set — installing CLI without auth"
    npx -y firecrawl-cli@latest init --skip-auth -y >/dev/null
  fi
else
  log "Firecrawl CLI already present ($(firecrawl --version 2>/dev/null || echo unknown))"
fi

log "done"
