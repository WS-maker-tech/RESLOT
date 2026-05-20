#!/bin/bash
# Reslot project SessionStart hook for Claude Code on the web.
# Reinstalls mobile/ node_modules — the dir vanishes when the ephemeral
# container is reclaimed. Cross-project tooling (Firecrawl CLI, superpowers
# plugin) is handled by ~/.claude/hooks/session-start.sh.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

log() { printf '[session-start] %s\n' "$*" >&2; }

cd "$CLAUDE_PROJECT_DIR/mobile"
log "Installing mobile dependencies with bun..."
bun install

log "done"
