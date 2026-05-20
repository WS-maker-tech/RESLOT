#!/bin/bash
# SessionStart hook for Claude Code on the web.
# Installs project dependencies, the Firecrawl CLI, and the superpowers
# plugin — all vanish when the ephemeral container is reclaimed, so they
# need re-installing each fresh session.
#
# Set FIRECRAWL_API_KEY in the environment config (Settings -> Environments)
# the first time. After init the key is persisted in ~/.config/firecrawl-cli
# and the variable is no longer required.
#
# Plugins installed by this hook only become active in subsequent sessions —
# Claude Code loads plugins before SessionStart hooks finish.
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

if command -v claude >/dev/null 2>&1; then
  if ! claude plugin marketplace list 2>/dev/null | grep -q "superpowers-dev"; then
    log "Adding superpowers marketplace..."
    claude plugin marketplace add obra/superpowers >/dev/null 2>&1 \
      || log "  marketplace add failed (continuing)"
  fi
  if ! claude plugin list 2>/dev/null | grep -q "superpowers@superpowers-dev"; then
    log "Installing superpowers plugin..."
    claude plugin install superpowers@superpowers-dev >/dev/null 2>&1 \
      || log "  plugin install failed (continuing)"
  else
    log "superpowers plugin already installed"
  fi
fi

log "done"
