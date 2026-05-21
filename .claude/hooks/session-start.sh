#!/usr/bin/env bash
# /home/user/RESLOT/.claude/hooks/session-start.sh — Reslot project SessionStart hook (v2)
#
# Behavior:
#   - Phase A (local, fast): lockfile-drift bun install, git context, env diff
#   - Phase B (network, capped): Refero MCP, Vercel prod, branch push state
#   - Phase C: emits 5-line banner to stdout + writes SESSION_BRIEF.md (gitignored)
#
# Critical:
#   - ALWAYS exits 0 — failures go to log + brief, never block session
#   - All network calls capped at ≤3s each, total Phase B budget ≤8s
#   - Never logs secret values, only key names
#   - Falls back gracefully when CLAUDE_PROJECT_DIR unset

set -uo pipefail

# Load shared utils. Tolerate missing lib (defensive).
if [ -r "$HOME/.claude/lib/hook-utils.sh" ]; then
  . "$HOME/.claude/lib/hook-utils.sh"
else
  # Minimal fallback so we still run if global lib went missing.
  log() { printf '%s [%s] %s: %s\n' "$(date -u +%FT%TZ)" "${1:-?}" "${2:-info}" "${*:3}" >&2; }
  parse_stdin_field() { :; }
  with_timeout() { local s="$1"; shift; timeout --preserve-status --kill-after=2s "${s}s" "$@"; }
  safe_curl() { curl -sS --connect-timeout 2 --max-time 2 "$@" 2>/dev/null; }
  is_remote() { [ "${CLAUDE_CODE_REMOTE:-}" = "true" ]; }
fi

[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0

INPUT="$(cat 2>/dev/null || echo '{}')"
SOURCE="$(parse_stdin_field source "$INPUT" 2>/dev/null)"
SOURCE="${SOURCE:-startup}"
SESSION_ID="$(parse_stdin_field session_id "$INPUT" 2>/dev/null)"

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$PWD}"
MOBILE="${PROJECT_DIR}/mobile"
BRIEF="${PROJECT_DIR}/SESSION_BRIEF.md"

log reslot info "source=$SOURCE session=${SESSION_ID:-unknown} project=$PROJECT_DIR"
T_START=$(date +%s)

# ─────────────────────────────────────────────────────────────────────────────
# Phase A — local-only checks (no network)
# ─────────────────────────────────────────────────────────────────────────────

# Lockfile drift detection — only run bun install when necessary
DRIFT_REASON=""
DRIFT=0
if [ ! -d "$MOBILE" ]; then
  DRIFT_REASON="mobile/ missing"
  DRIFT=2  # critical
elif [ ! -d "$MOBILE/node_modules" ]; then
  DRIFT_REASON="node_modules missing"
  DRIFT=1
elif [ ! -f "$MOBILE/bun.lock" ]; then
  DRIFT_REASON="bun.lock missing"
  DRIFT=1
elif [ "$MOBILE/package.json" -nt "$MOBILE/bun.lock" ]; then
  DRIFT_REASON="package.json > bun.lock"
  DRIFT=1
elif [ "$MOBILE/bun.lock" -nt "$MOBILE/node_modules" ]; then
  DRIFT_REASON="bun.lock > node_modules"
  DRIFT=1
fi

BUN_STATUS="fresh"
BUN_DURATION=0
if [ "$DRIFT" = "2" ]; then
  BUN_STATUS="mobile-missing"
  log reslot warn "$DRIFT_REASON — skipping install"
elif [ "$DRIFT" = "1" ]; then
  log reslot info "lockfile drift: $DRIFT_REASON — running bun install"
  T_BUN=$(date +%s)
  if cd "$MOBILE" 2>/dev/null && with_timeout 120 bun install >/dev/null 2>&1; then
    BUN_STATUS="installed"
    # Sync node_modules mtime so warm resumes don't re-trigger drift.
    # bun touches bun.lock on every install (even no-op) which would otherwise
    # cause "bun.lock > node_modules" on the very next session.
    touch "$MOBILE/node_modules" 2>/dev/null || true
    log reslot info "bun install OK"
  else
    BUN_STATUS="install-failed"
    log reslot warn "bun install failed"
  fi
  BUN_DURATION=$(( $(date +%s) - T_BUN ))
  cd "$PROJECT_DIR" 2>/dev/null || true
else
  log reslot info "lockfile fresh — skipping bun install"
fi

# Git context
GIT_BRANCH="" GIT_AHEAD="?" GIT_BEHIND="?" GIT_BRANCH_SLUG="" GIT_RECENT=""
GIT_REMOTE_HAS_BRANCH="?" GIT_DIRTY=0
if git -C "$PROJECT_DIR" rev-parse --git-dir >/dev/null 2>&1; then
  GIT_BRANCH="$(git -C "$PROJECT_DIR" branch --show-current 2>/dev/null)"
  GIT_AHEAD="$(git -C "$PROJECT_DIR" rev-list --count origin/main..HEAD 2>/dev/null || echo '?')"
  GIT_BEHIND="$(git -C "$PROJECT_DIR" rev-list --count HEAD..origin/main 2>/dev/null || echo '?')"
  GIT_RECENT="$(git -C "$PROJECT_DIR" log --oneline -5 origin/main..HEAD 2>/dev/null || echo '')"
  # Branch intent: claude/<slug> or feat/<slug>
  GIT_BRANCH_SLUG="$(printf '%s' "$GIT_BRANCH" | sed -nE 's#^(claude|feat|fix|chore|refactor)/(.+)$#\2#p')"
  # Dirty working tree?
  if ! git -C "$PROJECT_DIR" diff --quiet 2>/dev/null || ! git -C "$PROJECT_DIR" diff --cached --quiet 2>/dev/null; then
    GIT_DIRTY=1
  fi
fi

# Env diff — key names only, never values
ENV_PRESENT="no"
ENV_KEYS_COUNT=0
ENV_MISSING=""
if [ -f "$MOBILE/.env" ]; then
  ENV_PRESENT="yes"
  ENV_KEYS_COUNT="$(grep -E '^[A-Z_][A-Z0-9_]*=' "$MOBILE/.env" 2>/dev/null | wc -l | tr -d ' ')"
fi
if [ -f "$MOBILE/.env.example" ]; then
  EXAMPLE_KEYS=$(grep -oE '^[A-Z_][A-Z0-9_]*' "$MOBILE/.env.example" 2>/dev/null | sort -u)
  if [ -f "$MOBILE/.env" ]; then
    LIVE_KEYS=$(grep -oE '^[A-Z_][A-Z0-9_]*' "$MOBILE/.env" 2>/dev/null | sort -u)
    ENV_MISSING=$(comm -23 <(echo "$EXAMPLE_KEYS") <(echo "$LIVE_KEYS") | tr '\n' ',' | sed 's/,$//')
  else
    ENV_MISSING=$(echo "$EXAMPLE_KEYS" | tr '\n' ',' | sed 's/,$//')
  fi
fi
[ -z "$ENV_MISSING" ] && ENV_MISSING="none"

# Read global hook outcomes — first try env vars (only set when CLAUDE_ENV_FILE is
# sourced between hooks), then fall back to direct checks. Env doesn't propagate
# between SessionStart hook invocations in the standard runner, so the fallback
# is the common path.
G_FC="${RESLOT_HOOK_FIRECRAWL:-}"
G_SP="${RESLOT_HOOK_SUPERPOWERS:-}"
G_SOURCE="${RESLOT_HOOK_SOURCE:-${HOOK_SOURCE:-?}}"
G_DURATION="${RESLOT_HOOK_GLOBAL_DURATION:-?}"

if [ -z "$G_FC" ]; then
  if FC_VER=$(with_timeout 2 firecrawl --version 2>/dev/null | head -1 | awk '{print $NF}'); then
    [ -n "$FC_VER" ] && G_FC="present:$FC_VER" || G_FC="present"
  else
    G_FC="missing"
  fi
fi
if [ -z "$G_SP" ]; then
  # Superpowers ships as a plugin in this environment, cached under .claude/plugins/cache.
  if compgen -G "$HOME/.claude/plugins/cache/superpowers*" >/dev/null 2>&1 \
     || [ -d "$HOME/.claude/skills/superpowers" ]; then
    G_SP="present"
  else
    G_SP="missing"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# Phase B — network probes (sequential, 2-3s each, total ≤8s)
# ─────────────────────────────────────────────────────────────────────────────

# Refero MCP probe
REFERO_STATUS="?"
REFERO_TIME="?"
if [ -f "$PROJECT_DIR/.mcp.json" ]; then
  REFERO_TOKEN="$(jq -r '.mcpServers.refero.headers.Authorization // empty' "$PROJECT_DIR/.mcp.json" 2>/dev/null | sed 's/^Bearer //')"
  if [ -n "$REFERO_TOKEN" ]; then
    REFERO_PROBE=$(safe_curl -o /dev/null -w '%{http_code} %{time_total}' \
      -X POST -H "Content-Type: application/json" \
      -H "Accept: application/json, text/event-stream" \
      -H "Authorization: Bearer $REFERO_TOKEN" \
      -d '{"jsonrpc":"2.0","method":"initialize","id":1,"params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"reslot-hook","version":"1"}}}' \
      https://api.refero.design/mcp 2>/dev/null)
    REFERO_HTTP="$(echo "$REFERO_PROBE" | awk '{print $1}')"
    REFERO_TIME="$(echo "$REFERO_PROBE" | awk '{print $2}')"
    if [ "$REFERO_HTTP" = "200" ]; then
      REFERO_STATUS="reachable"
    elif [ "$REFERO_HTTP" = "401" ] || [ "$REFERO_HTTP" = "403" ]; then
      REFERO_STATUS="auth-fail"
    elif [ -z "$REFERO_HTTP" ] || [ "$REFERO_HTTP" = "000" ]; then
      REFERO_STATUS="unreachable"
    else
      REFERO_STATUS="http-$REFERO_HTTP"
    fi
  else
    REFERO_STATUS="no-token"
  fi
else
  REFERO_STATUS="no-mcp-config"
fi

# Vercel prod probe — 3s timeout (observed 2.2s cold)
VERCEL_STATUS="?"
VERCEL_TIME="?"
VERCEL_PROBE=$(curl -sS -o /dev/null -w '%{http_code} %{time_total}' \
  --connect-timeout 3 --max-time 8 \
  https://mobile-three-sable.vercel.app/api/restaurants 2>/dev/null)
VERCEL_HTTP="$(echo "$VERCEL_PROBE" | awk '{print $1}')"
VERCEL_TIME="$(echo "$VERCEL_PROBE" | awk '{print $2}')"
if [ "$VERCEL_HTTP" = "200" ]; then
  VERCEL_STATUS="healthy"
elif [ -z "$VERCEL_HTTP" ] || [ "$VERCEL_HTTP" = "000" ]; then
  VERCEL_STATUS="unreachable"
else
  VERCEL_STATUS="http-$VERCEL_HTTP"
fi

# Branch push state via git ls-remote (uses local proxy, no GH API needed)
BRANCH_PUSHED="?"
if [ -n "$GIT_BRANCH" ]; then
  if with_timeout 3 git -C "$PROJECT_DIR" ls-remote --heads origin "refs/heads/$GIT_BRANCH" 2>/dev/null | grep -q "$GIT_BRANCH"; then
    BRANCH_PUSHED="yes"
  else
    BRANCH_PUSHED="no"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# Phase C — render banner + write SESSION_BRIEF.md
# ─────────────────────────────────────────────────────────────────────────────

T_END=$(date +%s)
DURATION=$((T_END - T_START))

# 5-line banner (deterministic shape, replaces values with ? on failure)
{
  echo "═══ Reslot session ready (${DURATION}s) ═══"
  printf 'branch: %s · %s ahead / %s behind main · pushed: %s · dirty: %s\n' \
    "${GIT_BRANCH:-?}" "$GIT_AHEAD" "$GIT_BEHIND" "$BRANCH_PUSHED" \
    "$([ "$GIT_DIRTY" = "1" ] && echo yes || echo no)"
  printf 'prod: mobile-three-sable.vercel.app · /api/restaurants %s (%ss)\n' \
    "${VERCEL_STATUS}" "${VERCEL_TIME}"
  printf 'refero: %s (%ss) · superpowers: %s · firecrawl: %s\n' \
    "$REFERO_STATUS" "$REFERO_TIME" "$G_SP" "$G_FC"
  printf 'env: .env=%s (%s keys, missing: %s) · bun.lock=%s · brief: SESSION_BRIEF.md\n' \
    "$ENV_PRESENT" "$ENV_KEYS_COUNT" "$ENV_MISSING" "$BUN_STATUS"
} 2>/dev/null

# Full SESSION_BRIEF.md
write_brief() {
  cat <<EOF
# Session brief — Reslot

_Auto-generated by \`.claude/hooks/session-start.sh\` on $(date -u +%FT%TZ) (source: ${SOURCE}, duration: ${DURATION}s)._
_This file is gitignored. Delete to force regeneration on next session._

## 1 · TL;DR

- **Branch:** \`${GIT_BRANCH:-?}\` (intent: ${GIT_BRANCH_SLUG:-no-slug})
- **Ahead / behind main:** ${GIT_AHEAD} / ${GIT_BEHIND}
- **Pushed to origin:** ${BRANCH_PUSHED}
- **Working tree:** $([ "$GIT_DIRTY" = "1" ] && echo "**DIRTY** (uncommitted changes)" || echo "clean")
- **Prod /api/restaurants:** ${VERCEL_STATUS} in ${VERCEL_TIME}s
- **Refero MCP:** ${REFERO_STATUS}
- **Hook source:** ${SOURCE} (global hook: ${G_SOURCE}, ${G_DURATION}s)

## 2 · Branch & PR

\`\`\`
Branch:        ${GIT_BRANCH:-(none)}
Slug:          ${GIT_BRANCH_SLUG:-(no slug parsed)}
Ahead origin/main:  ${GIT_AHEAD}
Behind origin/main: ${GIT_BEHIND}
Pushed:        ${BRANCH_PUSHED}
\`\`\`

Recent local commits (ahead of main):
\`\`\`
${GIT_RECENT:-(none)}
\`\`\`

> GitHub PR lookup is unavailable in this remote-execution environment (proxy
> only forwards git transport, not the REST API). Use \`mcp__github__list_pull_requests\`
> if you need PR data.

## 3 · Production Health

| Field | Value |
|---|---|
| URL | https://mobile-three-sable.vercel.app |
| Endpoint probed | \`/api/restaurants\` |
| HTTP | ${VERCEL_HTTP:-?} (${VERCEL_STATUS}) |
| Latency | ${VERCEL_TIME}s |

Deploy command (manual): \`cd mobile && npx vercel --prod --force\`

## 4 · Environment

- \`mobile/.env\` present: **${ENV_PRESENT}** (${ENV_KEYS_COUNT} keys)
- Missing keys (vs \`.env.example\`): \`${ENV_MISSING}\`
- \`bun.lock\`: ${BUN_STATUS}$([ -n "$DRIFT_REASON" ] && echo " — $DRIFT_REASON")
- \`bun install\` ran this session: $([ "$BUN_STATUS" = "installed" ] && echo "yes (${BUN_DURATION}s)" || echo "no")

> Never paste env _values_ into chat. Brief shows _key names only_.

## 5 · MCP & Tooling

| Tool | Status |
|---|---|
| Refero MCP (\`api.refero.design\`) | ${REFERO_STATUS} (${REFERO_TIME}s) |
| Refero skill (\`refero-design\`) | $([ -d "$PROJECT_DIR/.claude/skills/refero-design" ] && echo "present" || echo "missing") |
| Firecrawl CLI | ${G_FC} |
| superpowers plugin | ${G_SP} |
| Global hook source | ${G_SOURCE} (${G_DURATION}s) |

## 6 · Design Pointers

EOF

  for f in "$PROJECT_DIR/CLAUDE.md" "$PROJECT_DIR/RESLOT-VAULT.md" "$PROJECT_DIR/mobile/CLAUDE.md" "$PROJECT_DIR/SESSION_HANDOFF.md" "$PROJECT_DIR/TODO.md" "$PROJECT_DIR/AGENTS.md"; do
    if [ -f "$f" ]; then
      sz=$(stat -c '%s' "$f" 2>/dev/null || echo 0)
      mt=$(stat -c '%y' "$f" 2>/dev/null | cut -d. -f1)
      printf -- '- `%s` — %s bytes, updated %s\n' "${f#$PROJECT_DIR/}" "$sz" "$mt"
    fi
  done
  echo ""
  if [ -d "$PROJECT_DIR/.claude/skills" ]; then
    echo "Available project skills:"
    for d in "$PROJECT_DIR/.claude/skills"/*/; do
      [ -d "$d" ] && printf -- '- `%s`\n' "$(basename "$d")"
    done
    echo ""
  fi
  echo "Design tokens live in \`mobile/src/lib/theme.ts\` (C, FONTS, RADIUS, SPACING, SHADOW, ICON)."

  cat <<EOF

## 7 · Recent Activity

\`\`\`
$(git -C "$PROJECT_DIR" log -5 --format='%h %ar  %s' 2>/dev/null || echo '(no git history)')
\`\`\`

## 8 · Pending Work Signals

EOF

  if [ -f "$PROJECT_DIR/TODO.md" ]; then
    mt=$(stat -c '%y' "$PROJECT_DIR/TODO.md" 2>/dev/null | cut -d. -f1)
    printf -- '- TODO.md last touched: %s\n' "$mt"
  fi
  if [ "$GIT_DIRTY" = "1" ]; then
    cnt=$(git -C "$PROJECT_DIR" diff --name-only 2>/dev/null | wc -l)
    cntc=$(git -C "$PROJECT_DIR" diff --cached --name-only 2>/dev/null | wc -l)
    printf -- '- Uncommitted: %s unstaged, %s staged files\n' "$cnt" "$cntc"
  fi
  untracked=$(git -C "$PROJECT_DIR" ls-files --others --exclude-standard 2>/dev/null | wc -l)
  printf -- '- Untracked files: %s\n' "$untracked"

  cat <<EOF

## 9 · Refero Quick Start

EOF
  if [ -n "$GIT_BRANCH_SLUG" ]; then
    printf 'Suggested research call based on branch intent \`%s\`:\n\n```\nmcp__refero__refero_search_screens platform="web" query="%s"\n```\n' \
      "$GIT_BRANCH_SLUG" "$(echo "$GIT_BRANCH_SLUG" | tr '-' ' ')"
  else
    echo "No branch slug parsed — once you're on \`feat/<slug>\` or \`claude/<slug>\`, this section suggests a starting Refero query."
  fi

  cat <<EOF

## 10 · Hook Diagnostics

\`\`\`
project hook:
  source        = ${SOURCE}
  session_id    = ${SESSION_ID:-(none)}
  duration      = ${DURATION}s
  bun install   = ${BUN_STATUS} (${BUN_DURATION}s)
  drift reason  = ${DRIFT_REASON:-none}

global hook:
  source        = ${G_SOURCE}
  duration      = ${G_DURATION}s
  firecrawl     = ${G_FC}
  superpowers   = ${G_SP}

logs: ~/.claude/logs/session-start-$(date +%Y%m%d).log
\`\`\`

EOF
}

# Write atomically — render to tmp then rename
TMP_BRIEF="${BRIEF}.tmp.$$"
if write_brief >"$TMP_BRIEF" 2>/dev/null; then
  mv -f "$TMP_BRIEF" "$BRIEF" 2>/dev/null || log reslot warn "could not move brief to $BRIEF"
else
  rm -f "$TMP_BRIEF" 2>/dev/null
  log reslot warn "brief generation failed"
fi

log reslot info "done (duration=${DURATION}s bun=${BUN_STATUS} vercel=${VERCEL_STATUS} refero=${REFERO_STATUS})"
exit 0
