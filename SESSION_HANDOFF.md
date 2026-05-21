# Reslot — Snabb Recon för nästa session

Kör dessa commands FÖRST för att se exakt status:

```bash
# Git state
git checkout main && git pull && git log --oneline -10

# Production live
curl -sL https://mobile-three-sable.vercel.app/ | grep -oE "index-[a-f0-9]+\.js"
# → spara hash som $H, sedan:
curl -s https://mobile-three-sable.vercel.app/_expo/static/js/web/$H \
  | grep -oE "FAFAF8|FAF3EB|stiffness:240|stiffness:300|\.springify\(\)|ReduceMotion" \
  | sort | uniq -c

# Pending branches
git branch -r | grep -v "main\|HEAD\|backup\|chore"

# Open PRs
# (via GitHub MCP) mcp__github__list_pull_requests owner=ws-maker-tech repo=reslot state=open

# Anchors för revert
git tag | grep "^anchor/"
```

## Vad du ska veta

- **Repo:** `WS-maker-tech/RESLOT` på `/home/user/RESLOT`
- **Stack:** Expo SDK 53, RN 0.76.7, **bun** (NEVER npm), Reanimated 3.17, NativeWind, Supabase OTP
- **Live:** https://mobile-three-sable.vercel.app (auto-deploy on main push via `.github/workflows/deploy.yml`)
- **Aldrig push till main** — alltid feature-branch + PR (GitHub MCP scoped till repot)
- **Vercel MCP** = 403 scope, använd bundle-hash curl istället

## Identity locked
- bg `#FAFAF8` (off-white, co-founder val — INTE varm cream FAF3EB)
- forest `#1F4D2A` (primary brand, FAB + map-pill + active-states)
- coral `#D97757` (reserverad delight, max 3 screens)
- pistachio `#7EC87A` ("slot"-grön: logo + Stockholm i h1)
- Plus Jakarta Sans only (Fraunces serif BORT, co-founder)
- Hem-skärmen rörs INTE
- Italic endast naturligt, ej tvingat

## MOTION-tokens (`mobile/src/lib/theme.ts`)
- entrance 220ms, exit 160ms, stagger 50ms
- `outCubic` default + M3 curves
- `MOTION.press = { damping:16, stiffness:240 }` — NEVER override
- Loops: `Easing.linear` + `ReduceMotion.System`
- `mobile/src/lib/use-reduced-motion.ts` hook finns

## Pending
- **`feat/onboarding-redesign-v3`** — 2068→596 line rewrite, 3-screen flow (welcome → phone → OTP), Surge-preview: `reslot-onboarding-v3.surge.sh`. INTE mergat. William testar.

## Self-learning (lessons från förra sessionen)

1. **Co-founder approval > mina rec:s.** Bg cooldown reverterades 2 gånger. Lyssna, fix:a direkt.
2. **Subtle färgändringar invisible.** Behöver ≥7 hex-points shift för synlig diff.
3. **`app.json:35 splash.backgroundColor`** = ROT-cause för "bg känns varm" — kolla ALLTID samtidigt med theme.ts.
4. **`.springify()` är AI-tell.** UI-entrance ska vara ease-out duration. Sed-replace tar 5 min.
5. **Bundle-grep `grep -oc '\.springify()'`** — 3 word-träffar är Reanimated lib-internals, bara `.springify()` med dot är callsites.
6. **Per-batch granular revert** > monolithic. PR-per-pattern-type.
7. **Push-403 på tags ok** — anchor-tags lokala räcker, origin har state via branches.
8. **`mobile/CLAUDE.md` är gammal Vibecode-template** — ignorera, root CLAUDE.md är auktoritativ.
9. **Emil Kowalski skill** (`emil-design-eng`) = PRIMARY för anim-decisions. Refero MCP = guld för design-research.
10. **Surge.sh preview-flow:** `bunx expo export --output-dir preview-dist` → `mv assets/node_modules assets/_npm` + sed paths → `script -qc "npx surge ..."` med generated email/pass. 5 min till URL.
11. **William testar i sin browser, jag i Playwright headless.** Splash-overlay täcker app i mina screenshots — appen är inte trasig. Säg "Cmd+Shift+R".
12. **"kör så det ryker"** = merge direkt utan ask, fortsätt nästa steg. **"säkert och kontrollerat"** = anchor + branch + verify per batch.

## Workflow-conventions

- Squash-merge PR med `fix(...): X — ... (#NN)` titel
- Stop-hook klagar om uncommitted → snabb commit
- Per design-change: anchor-tag på main, branch, PR, merge, monitor Vercel deploy via bundle-hash byte

> Behöver du djupare detalj: läs `/root/.claude/plans/vad-r-den-b-sta-ethereal-bengio.md` (1500+ rader) eller `git log --oneline main | head -30`.
