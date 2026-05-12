# Reslot — Session Handoff (2026-05-10)

> **Drop the entire contents of this file in a new Claude Code session and say "fortsätt".** Detta dokument fångar allt vi gjort, varje beslut, varje workflow-convention, och var arbetet står. Det är optimerat för att kunna ladda mitt minne från noll.

---

## 1. Vem du är, vem William är, vilket projekt

- **Du** = Claude Code, Anthropic's CLI. Du jobbar i `/home/user/RESLOT/` (clone av `WS-maker-tech/RESLOT`).
- **William** = grundare av Reslot. Svensk. Direkt, pragmatic, "kör så det ryker"-stil. Co-founder finns och har preferences (notabelt: tycker varm cream är för varm).
- **Reslot** = Swedish P2P-restaurant-reservation marketplace. Användare kan posta bokningar de inte kan använda och credits-claim:a bokningar från andra. Expo React Native app + Vercel serverless backend.
- **Live URL:** https://mobile-three-sable.vercel.app
- **Repo:** https://github.com/WS-maker-tech/RESLOT

---

## 2. Production state JUST NU (2026-05-10)

| | |
|---|---|
| **main HEAD** | `e511955` (efter PR #53) |
| **Live bundle** | `index-2814c9f1d29c220b516c0287a8b21868.js` |
| **bg** | `#FAFAF8` (off-white "typ vit", pre-warm — co-founder approved) |
| **forest** | `#1F4D2A` (primary brand accent) |
| **coral** | `#D97757` (reserverad delight, ej i bruk) |
| **pistachio** | `#7EC87A` (slot-grön — i logo + Stockholm i h1) |
| **Typografi** | Plus Jakarta Sans only (Fraunces serif **borttagen** — co-founder beslut) |
| **Navbar** | Forest FAB 54px, icon-only (inga labels), active-dot under |
| **Home hero** | "Hitta ditt nästa bord" liten + "Bord i **Stockholm** ⌄" stor (city pistachio, klickbar) |
| **Animations** | Google-tier: 0× springify, MOTION.press 240/16, ReduceMotion 131 refs, loops linear |
| **TS-errors** | 6 baseline (pre-existing, ej blockerande) |

---

## 3. Hela PR-historiken denna session (chronological)

| # | Titel | Status |
|---|---|---|
| #37 | Identity-tokens + nytt home-header layout | merged |
| #38 | Navbar 100x upgrade — forest FAB + active dot + creamSoft bg | merged |
| #39 | Navbar icon-only — clean look + dot under varje icon | merged |
| #40 | bg cooldown #FAF3EB → #F8F5EE | merged (sedan reverted) |
| #41 | bg cooldown v2 — paper neutral #F7F6F2 | merged (sedan reverted) |
| #42 | Home header swap — city som primary nav (Stockholm pistachio) | merged |
| #43 | Anim tier-1: splash, TabIcon, dot, skeleton | merged |
| #44+#45 | emil-design-eng skill install + symlink | merged |
| #46 | Anim tier-2: booking-confirmation, reservations, onboarding, RestaurantCard | merged |
| #47 | Revert bg-cooldown till #FAF3EB | merged |
| #48 | bg #FAF3EB → #FAFAF8 (pre-warm original) | merged |
| #49 | Splash backgroundColor till #FAFAF8 (100% bg-consistency) | merged |
| #50 | Motion design-system foundation (Batch 0) | merged |
| #51 | 140× entrance.springify() → ease-out (Batch 1) | merged |
| #52 | Press stiffness 300 → 240 (Batch 2) | merged |
| #53 | Loops linear + ReduceMotion a11y (Batch 3+4) | merged |

---

## 4. Pending work — INTE mergat

### Branch: `feat/onboarding-redesign-v3` (Surge preview live)

Komplett rewrite av onboarding från **2068 lines → 596 lines** (-71%). 3-screen flow:

1. **Welcome** — amo-stil restraint. "Reslot" wordmark + "Bord du *trodde* var fullbokade." (italic via Plus Jakarta italic-style). Forest "Skapa konto" pill + "Utforska som gäst" ghost + "Logga in" top-right peer.
2. **Phone** — Mozi/PayPal question-form. +46 prefix-pill + format-on-type input. "Vi skickar en kod via SMS." reassurance. Forest pill (disabled tills valid).
3. **OTP** — Coinbase-stil. 6-cell tap-to-focus, `textContentType="oneTimeCode"` (paste-from-clipboard auto-detect), auto-submit at 6 digits. Resend cooldown 30s.

**Backend-kontrakt intakt:** Supabase OTP (signInWithOtp + verifyOtp), useAuthStore mutations (setPhoneNumber, setSessionToken, setSupabaseSession, setSelectedCity, setOnboardingComplete), pendingIntent → claim/drop/watch redirects.

**Drops:**
- Login (email/pass) → phone-OTP är enda auth
- Register (firstName/lastName/email/pass) → samlas just-in-time
- City → defaults Stockholm (hen byter via header-pickern)
- Credits-intro 3 cards → flyttas till `/credits` + first-claim-modal
- Welcome celebration → mascot reserveras för booking-confirmation

**Preview-URL:** https://reslot-onboarding-v3.surge.sh/onboarding (dev-bypass: any 6-digit code passerar)

**Co-founder + William har testat preview** — beslut om merge väntar.

---

## 5. Anchors för revert (samtliga)

```
anchor/pre-overnight-2026-05-08            @ bb797b6
anchor/pre-navbar-upgrade-2026-05-09       @ eb6d2cc
anchor/pre-header-swap-2026-05-09          @ 6f5c9bf
anchor/pre-anim-cleanup-2026-05-09         @ 788f12c
anchor/pre-bg-cooldown-2026-05-09          @ 15f7374
anchor/pre-onboarding-redesign-2026-05-09  @ 3312399
anchor/pre-bg-fafaf8-2026-05-10            @ 1767fc8
anchor/pre-anim-batch-0-2026-05-10
anchor/pre-anim-batch-1-2026-05-10
anchor/pre-anim-batch-2-2026-05-10
anchor/pre-anim-batch-3-2026-05-10
```

Plus `night/identity-overhaul-2026-05-08` branch (parked, hela natten experimentet).

---

## 6. Surge preview-URLs (live)

- `reslot-onboarding-v3.surge.sh` — onboarding-redesign v3
- `reslot-preview-final.surge.sh` — natt-experimentet (full Fraunces-version)
- `reslot-cleanup.surge.sh` — cleanup-version (token-only)

Throwaway-konton per deploy.

---

## 7. Identity-decisions (LOCKED)

| Decision | Värde | Källa |
|---|---|---|
| Primary brand color | `forest #1F4D2A` | William val |
| BG | `#FAFAF8` off-white | Co-founder beslut (post-cooldown-experiment) |
| BG sunken/inputs | `#F0F0EE` | Matchar pre-FAF3EB original |
| Coral delight | `#D97757` | Reserverad, max 3 screens |
| Pistachio slot-grön | `#7EC87A` | Slot i logo + Stockholm i h1 |
| Typografi | Plus Jakarta Sans (alla weights + italic) | Co-founder: Fraunces serif BORT |
| Mascot | Bord-med-vingar SVG | Kvar i kod, ej använt aktivt (placeholder för image-gen) |
| Italic | Endast naturligt, ej tvingat | William beslut 4 |
| Hem-skärmen | Rörs ej (för onboarding-fasen) | William beslut |

---

## 8. MOTION-tokens i `theme.ts` (Batch 0)

```ts
MOTION = {
  duration: { instant:100, fast:180, entrance:220, ease:250, exit:160, stagger:50, slow:400, hero:500 },
  easing: {
    standard / decelerate / accelerate (M3 base curves),
    outCubic: [0.23, 1, 0.32, 1]            // Emil — DEFAULT for entrance
    inOutCubic: [0.77, 0, 0.175, 1]         // Emil — for movement
    materialStandard: [0.2, 0, 0, 1]        // M3
    materialEmphasizedEnter: [0.05, 0.7, 0.1, 1]  // hero-moments only
    materialEmphasizedExit: [0.3, 0, 0.8, 0.15]
    spring: { damping:18, stiffness:220 }   // default
    springSoft / springBouncy
  },
  press: { damping:16, stiffness:240 }      // single press-token, NEVER override
}
```

**Usage-rules** (kommentar i theme.ts):
- Entrance → `MOTION.duration.entrance` + `outCubic`
- Press → `MOTION.press` (aldrig stiffness 300 override)
- Continuous loops → `withRepeat(withTiming(.., { easing: Easing.linear, reduceMotion: ReduceMotion.System }))`
- Exit = ~70% av entrance
- List stagger → `delay(i * MOTION.duration.stagger)`

Plus NY `mobile/src/lib/use-reduced-motion.ts` hook för custom withTiming/withSpring (Reanimated 3.17 entering-animations respekterar by default sedan v3.6).

---

## 9. Skills installerade

- `emil-design-eng` (Emil Kowalski's animation philosophy) — `/home/user/RESLOT/.claude/skills/emil-design-eng/SKILL.md`
- `refero-design` (Refero MCP research methodology) — i `.claude/skills/`
- `frontend-app-design`, `expo-docs`, `ai-apis-like-chatgpt` — pre-existing

**Använd:** invoke via `Skill`-tool. Emil-design-eng är min PRIMARY-referens för anim-decisions.

---

## 10. MCP-servers tillgängliga

- **refero** (`.mcp.json` repo root, bearer-token literal) — `refero_search_screens`, `refero_search_flows`, `refero_get_screen_content`, `refero_get_similar_screens`, `refero_get_flow`. Användt för world-class onboarding-research.
- **GitHub MCP** — scoped till `ws-maker-tech/reslot` only. Används för PR ops (create, merge, comments, check-runs, reviews).
- **Vercel MCP** — finns men 403 på `clawmax12-langs-projects` scope. Inte usable för deploy-monitoring direkt. Använder bundle-hash polling istället via `curl mobile-three-sable.vercel.app`.

---

## 11. Tech-stack & filer-att-veta-om

- Expo SDK 53, RN 0.76.7, **bun** (NEVER npm)
- Reanimated 3.17 (entering-animations respekterar reduceMotion by default)
- NativeWind + Tailwind v3 för styling
- Expo Router (file-based)
- Supabase auth (phone-OTP) + service-role för backend
- Vercel auto-deploy on main-push via `.github/workflows/deploy.yml`

**Key files:**
- `mobile/src/lib/theme.ts` — alla design-tokens (C, FONTS, TYPO, MOTION, RADIUS, SPACING, SHADOW, IMG, SEMANTIC)
- `mobile/src/lib/use-reduced-motion.ts` — a11y hook (NY denna session)
- `mobile/src/app/_layout.tsx` — root stack, ReslotTheme, fonts useFonts
- `mobile/src/app/(tabs)/_layout.tsx` — navbar (icon-only, forest FAB, active-dot)
- `mobile/src/app/(tabs)/index.tsx` — hem (NEVER rör per William)
- `mobile/src/app/onboarding.tsx` — onboarding (på main = gamla 2068-line, på `feat/onboarding-redesign-v3` = nya 596-line)
- `mobile/api/index.ts` — ENDA Vercel serverless-funktionen (catch-all `?path=`-routing)
- `app.json` splash.backgroundColor → `#FAFAF8` (förlorade root-cause för "varm bg-känsla")

**Forbidden filer (per mobile/CLAUDE.md template, men root CLAUDE.md är auktoritativ):**
- `patches/`, `babel.config.js`, `metro.config.js`, `tsconfig.json`, `nativewind-env.d.ts`
- `app.json` flagad som forbidden men edited när co-founder critical (#49)

---

## 12. Workflow-conventions (William's flow)

1. **"kör så det ryker"** = merge direkt utan ask, fortsätt nästa steg
2. **"säkert och kontrollerat"** = anchor-tag + branch + verify per batch
3. **Per PR:** squash-merge med descriptive title (`fix(animations): Batch X — ...(#NN)`)
4. **Vercel auto-deploy** på main-push (1-3 min build), monitor bundle-hash byte
5. **Subscribe till PR-activity** för CI events (William gör detta proaktivt; vi kollar check_runs + review_comments innan merge)
6. **Branch-strategy:** ALDRIG push till main, alltid feature-branch + PR
7. **Tags:** anchor-tags som lokal panic-knapp (push 403 i denna sandbox men finns lokalt)
8. **Stop-hook:** klagar om uncommitted/untracked — commit allt eller städa
9. **Decisions från co-founder** övertrumfar mina design-rec:s (förlorat: cooldown reverterades 2 gånger)
10. **"Skapa konto" tonen** — Nordic minimalism, no exclamations, lowercase verb, "Du" capitalized BORT

---

## 13. Vad jag lärt mig — för att bli bättre nästa session

1. **Co-founder approval = absolute.** Mina design-rec:s godkänns av William men kan reverteras av co-founder. När hen säger något (warm bg, ingen Fraunces), skip iteration och bara fix:a direkt. Inte argumentera.

2. **Subtle changes är invisible.** F8F5EE vs FAF3EB är 2-3 hex-points kallare = "ingen skillnad" för användaren. När någon säger "för varm", gå minst 1 hela value-shift (FAFAF8 är 7+ points kallare = synlig).

3. **app.json `splash.backgroundColor` är ROT-cause för "bg känns varm".** Native splash visas INNAN react-koden laddar. Glöm aldrig kolla app.json + alla 4 hardcoded literals i `_layout.tsx` + 1 rgba i `submit.tsx:1772` när bg ändras.

4. **Reanimated `.springify()` är AI-tell.** Springs reserved för celebration/gesture only. UI-entrance ska vara ease-out duration. Sed-replace över hela src/ tar 5 minuter och eliminerar 100% av "AI-bouncy"-känslan.

5. **Bundle-verification efter deploy.** Curl `https://mobile-three-sable.vercel.app/_expo/static/js/web/$hash` + grep efter hex/keywords är 100% säker verifiering. Cache-busting i URL via `?bust=Date.now()`. **3 "springify" word-träffar är Reanimated lib-internals, ej callsites** — bara `.springify()` med dot är callsites.

6. **Per-batch granular revert > monolithic.** En PR per pattern-type ger granular `git revert` möjlighet om co-founder ändrar sig. Bättre än EN stor anim-cleanup-PR.

7. **Push-403 ej blockerande.** Sandbox kan ha push-403 på git-tags. Anchor-tags finns lokalt + `bb797b6`-state finns ändå på `origin/claude/bg-faf3eb` så revert-säkerhet kvar. Branches pushas OK.

8. **mobile/CLAUDE.md är gammal Vibecode-template.** Säger "DO NOT manage git". Root CLAUDE.md är auktoritativ.

9. **Refero MCP är gold för design-research.** Konkret screen-citations från Pi/amo/222/Mozi/Coinbase/Airbnb beats vague memory. Använd för all design-decisions med >5 min impact.

10. **Emil Kowalski's principles >> vague "feels right".** Pattern-by-pattern fix-list med Before/After/Why-table är max-impact. emil-design-eng skill ger framework.

11. **Surge.sh deploys = preview utan production-risk.** Workflow: `bunx expo export --platform web --output-dir preview-dist` → rename `node_modules` → `_npm` → sed paths → `script -qc "npx surge ..."` med generated email/password. 5 minuter till URL.

12. **Onboarding research-pass workflow:** 3 parallel agents (Refero MCP, codebase audit, expertis-research) → synthesize till design-pitch med wireframes + microcopy + tradeoffs → user approval → implement. ~2-3h från noll till world-class.

13. **William testar i sin browser, jag testar via Playwright headless.** Mina screenshots kan visa splash-overlay som täcker app — det betyder INTE att appen är trasig. Hen ser annorlunda. Skicka URLer + säg "force-refresh (Cmd+Shift+R)".

14. **Stop-hook nag.** När jag glömt commit:a, hookskär klagar. Snabb commit + push löser. Aldrig ignorera.

15. **Mobile/CLAUDE.md template-content kommer ibland in i context.** Det är Vibecode-template som inte är relevant — ignorera, fortsätt med root CLAUDE.md som auktoritativ.

---

## 14. Pending decisions för nästa session

1. **Merge `feat/onboarding-redesign-v3` till main?** Preview live på reslot-onboarding-v3.surge.sh. William + co-founder har testat (eller borde testa). Om OK → 5 min till merge + Vercel deploy.

2. **City defaults Stockholm.** Onboarding-redesign defaults Stockholm. Header-pickern finns för byte. OK för MVP men kanske IP-geolocate i framtiden.

3. **Mascot table-with-wings.** SVG finns i `mobile/src/assets/mascot/table-wings.svg` + `mobile/src/components/mascot/TableWingsMascot.tsx`. William bedömde "ser ut som fjäril, inte bord". Bör ersättas med custom illustration via image-gen post-natten. Inte i aktivt bruk.

4. **Onboarding firstName-fallback.** Profile.tsx visar `displayName` med fallback "Din profil" om firstName saknas. OK fallback. Men collect-step efter onboarding skulle vara nice-to-have (banner i /profile).

5. **Long-tail anim-cleanup.** Batch 5 (stagger centralization) skippad — bara 8 inline `delay(i * 50)`. Inte värt nu. Framtida pass kan göras.

6. **Tier-3 anim review.** Allt mergat. Verifiera live att animationer känns Google-tier. Slow-motion test (browser DevTools 0.25× speed) på live URL för QA.

---

## 15. Hur du startar nästa session

```
Hej! Drop SESSION_HANDOFF.md i prompten — det är all context från förra
sessionen. Fortsätt där vi slutade. Status: alla 4 anim-batches live i 
production (#50-#53), bg #FAFAF8 stabilt. Onboarding-redesign på 
feat/onboarding-redesign-v3 branch, preview-URL reslot-onboarding-v3.surge.sh.
Vad gör vi?
```

Eller bara säg: **"fortsätt"**.

---

> **End of handoff.** Vid behov av djupare detaljer, läs `/root/.claude/plans/vad-r-den-b-sta-ethereal-bengio.md` (1500+ rader full plan-history) eller `git log --oneline main | head -30` för commit-historik.
