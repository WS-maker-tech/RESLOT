# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

# Reslot — Claude Code Instructions

> **📄 Levande dokument:** Detta är en ögonblicksbild av projektets *nuvarande* tillstånd, inte en evig sanning. När stack, flöden, design-identitet eller konventioner ändras — uppdatera den här filen i samma PR. Behandla allt nedan (särskilt design-identiteten) som "senast godkänt", inte "låst för alltid". Föredrar du att börja jobba mot en ny riktning, gör det och uppdatera dokumentet därefter.

> **🔑 Start här:** Läs `RESLOT-VAULT.md` (full kontext, deploy-flöde, gotchas) och `SESSION_HANDOFF.md` (senaste sessionens status, motion-tokens) i repo-roten först. `VISUAL_FOUNDATION_V1.md` är *historiskt* underlag för en tidigare design-identitet (v3) — referens, inte nuvarande regel. Denna fil (`CLAUDE.md`) är den auktoritativa, kondenserade versionen.
>
> **OBS — stale nested CLAUDE.md:** `mobile/CLAUDE.md` och `backend/CLAUDE.md` är gamla Vibecode-templates. De auto-laddas som nästlad kontext men är delvis felaktiga (säger "du är i Vibecode", "rör inte git", fel RN-version). **Denna root-fil gäller** vid konflikt. De nästlade filerna innehåller dock fortfarande nyttiga RN/Expo-konventioner (routing, safe-area, vanliga misstag) som är värda att läsa.

## ⚙️ Refero MCP & Skill — ALLTID TILLGÄNGLIGT
Detta projekt har **Refero** permanent installerat. Du behöver inte fråga vad det är, inte installera om det, inte autentisera. Det funkar.

- **MCP-server:** konfigurerad i `.mcp.json` (project root) med literal bearer-token. Verktyg blir tillgängliga som `refero_search_screens`, `refero_search_flows`, `refero_get_screen`, `refero_get_screen_image`, `refero_get_similar_screens`, `refero_get_flow`, `refero_get_style`.
- **Skill:** `refero-design` aktiveras via `/refero-design` eller automatiskt vid UI/design-jobb. Skillen `emil-design-eng` är PRIMARY för animations- och polish-beslut.
- **Användning:** vid varje design-/UI-uppgift, börja med `refero_search_screens` (platform `web` eller `ios`) för att hitta riktiga referenser innan du designar något.
- **Fungerar inte direkt?** Token är giltig (verifierad mot `https://api.refero.design/mcp`). Om verktygen saknas vid sessionstart: be användaren bekräfta MCP-trust för project-scoped servers, sedan starta om Claude Code en gång. Återinstallera ALDRIG och kör ALDRIG OAuth-flödet — bearer-tokenen i `.mcp.json` är auktoritativ.

## Project
Reslot är en Expo React Native-app (web-build) + Vercel serverless API för en andrahandsmarknadsplats av restaurangbokningar — användare kan lägga upp och ta över bokningar med credits. Just nu är web-builden (`mobile-three-sable.vercel.app`) den deployade ytan.

## Repo & Workflow
- **Repo:** https://github.com/WS-maker-tech/RESLOT.git (origin — single source of truth). GitHub MCP-verktyg är scopade till `ws-maker-tech/reslot`.
- **Före varje session:** `git pull origin main` — flera agenter jobbar mot samma repo.
- **Branch-strategi:** jobba ALLTID på en feature branch (`feat/<slug>` eller `claude/<slug>`), **aldrig direkt på `main`**.
- **PR-flöde (nuvarande standard):**
  1. `git checkout -b feat/<slug>`
  2. Commita ändringar på feature branchen (Conventional Commits: `feat(...)`, `fix(...)`, `polish(...)`, `revert(...)`)
  3. Öppna PR via GitHub MCP (`mcp__github__create_pull_request`). Du har INTE `gh` CLI — använd MCP-verktygen för alla GitHub-operationer.
  4. **Squash-merge** med titel `fix(...): X — ... (#NN)`. William reviewar direkt i Claude Code innan merge.
  5. Merge till `main` triggar auto-deploy (se Deploy).
- **Pakethanterare:** `bun` — **aldrig npm**. Lockfilen är `mobile/bun.lock`. Ta bort `package-lock.json` om den dyker upp.
- **Konflikthantering:** jobba aldrig i samma fil samtidigt som annan agent — koordinera via William.

## Quick Start
```bash
cd mobile
bun install
bun run web          # dev-server på localhost:8081 (DARK_MODE=class expo start --web)
bun run typecheck    # tsc --noEmit
bun run lint         # expo lint
npx vercel --prod --force   # manuell production deploy
```

## Deploy
- **Production URL:** https://mobile-three-sable.vercel.app
- **Vercel project:** `clawmax12-langs-projects/mobile`
- **Auto-deploy:** push/merge till `main` → GitHub Actions (`.github/workflows/deploy.yml`) kör `cd mobile && bun install && npx vercel --prod --force`. Hemligheter: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
- **Manuellt deploy-kommando:** `cd mobile && npx vercel --prod --force` (alltid `--force` — Vercel cachar aggressivt).
- **Om produktionen inte uppdateras:** kör `npx vercel --prod --force` igen.
- **Verifiera live-build utan Vercel-dashboard** (Vercel MCP = 403 scope): grep bundle-hashen ur prod-HTML:
  ```bash
  curl -sL https://mobile-three-sable.vercel.app/ | grep -oE "index-[a-f0-9]+\.js"
  ```
- **API routing:** `/api/:path*` → `/api?path=:path*` (catch-all i `mobile/api/index.ts`, se `mobile/vercel.json`). SPA-fallback: allt annat → `/index.html`.

## Tech Stack
| Del | Teknologi | Version |
|-----|-----------|---------|
| Framework | Expo | ~53.0.27 |
| React / React Native | React / RN | 19.0.0 / 0.79.6 |
| Routing | expo-router | ~5.1.11 (file-based) |
| Språk | TypeScript | ~5.8.3 (strict) |
| Styling | NativeWind 4 + Tailwind 3 + inline StyleSheet | ~4.1.23 / ^3.4.17 |
| Server-state | @tanstack/react-query | 5.90.2 |
| Klient-state | Zustand | ^5.0.9 |
| Validering | Zod | 4.1.11 |
| Animationer | react-native-reanimated | 3.17.4 |
| Ikoner | lucide-react-native | ^0.468.0 |
| Fonts | @expo-google-fonts/* | se `FONTS` i `theme.ts` (nuvarande typsnitt) |
| Databas | Supabase (PostgreSQL) | ^2.101.1 |
| Auth | Supabase Auth (OTP) + expo-secure-store | — |
| Kartor | Leaflet / react-leaflet (web, via WebMap) + react-native-maps (mockad) | — |
| Betalning | Stripe (UI mock, ej live än) | — |
| Deploy | Vercel (Hobby plan, max 12 functions) | — |

> RN är **0.79.6** (inte 0.76.x — den siffran i äldre handoff-anteckningar är fel). Patchar finns i `mobile/patches/` för `react-native@0.79.6` och `expo-asset`.

## Arkitektur — var bor backend?
- **Deployad API:** `mobile/api/index.ts` — den **enda** Vercel serverless-funktionen. All produktions-API-logik här, pratar direkt med Supabase via service-role-nyckel, routas med `?path=`. Hobby-plan tillåter max 12 functions → allt i en fil.
- **`backend/`** — separat Hono + Prisma-server (ursprunglig Vibecode-backend). **Ej den deployade prod-API:n.** `prisma/schema.prisma` är dock fortfarande en referens för datamodellen (`mobile/src/lib/api/types.ts` speglar denna). Rör den inte om du inte uttryckligen jobbar med den.

## Key Files
| Fil/Mapp | Beskrivning |
|----------|-------------|
| `mobile/src/app/(tabs)/` | Synliga tabs: `index` (Hem), `reservations` (Bokningar), `submit` (Lägg upp), `alerts` (Bevakningar), `profile` (Profil). `map` finns men är dold (`href: null`). |
| `mobile/src/app/restaurant/[id].tsx` | Restaurangdetaljsida med claim-flow |
| `mobile/src/app/_layout.tsx` | Root-layout (RootLayoutNav — refaktorera/radera ALDRIG), React Query-provider, font-load |
| `mobile/src/app/*.tsx` | Stack-rutter utanför tabs: `credits`, `credit-history`, `rewards`, `payment`, `invite`, `settings`, `account-settings`, `change-password`, `notification-settings`, `add-watch`, `saved`, `booking-confirmation`, `feedback`, `faq`, `help`, `support`, `onboarding`, `dev-components`, `map` |
| `mobile/api/index.ts` | **Enda** Vercel serverless-funktionen — all API-logik med `?path=`-routing |
| `mobile/src/lib/api/api.ts` | API-klient mot backend |
| `mobile/src/lib/api/hooks.ts` | React Query hooks (alla crash-safe med try/catch) — `useRestaurants`, `useReservations`, `useMyReservations`, `useClaimReservation`, `useSubmitReservation`, `useProfile`, `useWatches`, `useSavedRestaurants`, `usePurchaseCredits`, m.fl. |
| `mobile/src/lib/api/types.ts` | TS-typer för API-svar (Restaurant, Reservation, UserProfile, Watch, SavedRestaurant, ActivityAlert …) + parse-helpers |
| `mobile/src/lib/theme.ts` | Design tokens: `C` (färger), `DARK_COLORS`/`getTheme`, `FONTS`, `TYPO`, `SPACING`, `RADIUS`, `SHADOW`, `ICON`, `MOTION`, `SELECT`, `SEMANTIC`, `IMG` |
| `mobile/src/lib/auth-store.ts` | Zustand auth-state (Supabase session) |
| `mobile/src/lib/supabase.ts` | Supabase-klient (anon) |
| `mobile/src/lib/use-reduced-motion.ts` | Reduced-motion hook (respektera ALLTID i loopar) |
| `mobile/src/lib/use-require-auth.ts` / `use-pending-feedback.ts` | Auth-gate + feedback-prompt hooks |
| `mobile/src/lib/legal-content.ts` / `notifications.ts` / `sample-data.ts` | Legal-text, notis-helpers, mockdata |
| `mobile/src/components/` | Delade komponenter (AuthModal, LoginGate, SupportBubble[.web], WebMap, RestaurantCard, ClaimSection, HeroSection, DayPicker, FilterChips, Skeleton, TrustBadge, RestaurantMonogram, …) |
| `mobile/src/components/ui/` | Primitiv-bibliotek: `Button`, `Card`, `Chip`, `Input`, `FormField`, `ListItem`, `Tabs`, `Tag`, `Toast`, `Rating`, `Stepper`, `Divider`, `EmptyState`, `ErrorState`, `Avatar`, `CountdownPill` (barrel-export i `index.ts`) |
| `mobile/src/reslot-art/` | Personlighets-kit: handritade `Scribble`/`Doodle`-PNG (svart bläck + alpha, omfärgas via `tintColor`). Använd sparsamt för editorial känsla. |
| `mobile/metro.config.js` | Vibecode SDK inaktiverad (no-op), react-native-maps mockad för web |
| `mobile/vercel.json` | `installCommand: bun install`, rewrites för API + SPA fallback |

## API Endpoints (`mobile/api/index.ts`, via `?path=`)
| Metod | Path | Syfte |
|-------|------|-------|
| GET | `reservations` | Lista aktiva bokningar |
| POST | `reservations` | Lägg upp bokning |
| GET | `reservations/mine` | Mina bokningar |
| GET | `reservations/missed` | Missade (time-to-claim) |
| GET | `reservations/:id` | Hämta en bokning |
| POST | `reservations/:id/claim` | Ta över bokning |
| PATCH/POST | `reservations/:id/cancel` | Avboka upplägg |
| POST | `reservations/:id/cancel-claim` | Avboka övertag |
| POST | `reservations/:id/feedback` | Lämna feedback |
| GET | `restaurants` / `restaurants/new-on-reslot` | Lista / nya restauranger |
| GET | `restaurants/:id` | Restaurangdetalj |
| GET | `profile` · PUT/PATCH `profile` | Hämta/uppdatera profil |
| POST | `profile/push-token` | Spara push-token |
| GET | `auth/me` | Inloggad användare |
| GET/POST | `watches` · DELETE `watches/:id` | Bevakningar |
| GET/POST | `admin/seed-reservations`, `admin/seed-future-reservations` | Seed (dev) |

> Stripe/credits-purchase och vissa rutter är **stubbade** (mock) — se stub-listan i slutet av `index.ts`.

## Environment Variables
### Frontend (Expo, `EXPO_PUBLIC_*` prefix, satt i Vercel dashboard — se `mobile/.env.example`)
| Variabel | Beskrivning |
|----------|-------------|
| `EXPO_PUBLIC_BACKEND_URL` | `https://mobile-three-sable.vercel.app` — **sätt via `printf` inte `echo`** (echo lägger till `\n`) |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public) |
| `EXPO_PUBLIC_MAPBOX_TOKEN` | Map-token |

### Backend (serverless `mobile/api/index.ts`, satt i Vercel dashboard)
| Variabel | Beskrivning |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL (utan EXPO_PUBLIC-prefix) |
| `SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-only — exponera ALDRIG i frontend) |

## Database
- **Provider:** Supabase PostgreSQL, EU-west-2 · **Project ID:** `empexffxfbbxrlzdxlic`
- **Datamodellens sanning för frontend:** `mobile/src/lib/api/types.ts`. Tabeller är PascalCase, kolumner camelCase.

### Kärntabeller (urval av nyckelkolumner)
| Tabell | Nyckelkolumner |
|--------|----------------|
| `Reservation` | `id`, `restaurantId`, `submitterPhone`, `submitterFirstName/LastName`, `reservationDate`, `reservationTime`, `partySize`, `seatType`, `nameOnReservation`, `status` (`active`/`claimed`/`grace_period`/`completed`/`expired`/`cancelled`), `claimerPhone`, `cancelFee`, `prepaidAmount`, `verificationLink`, `extraInfo`, `cancellationWindowHours`, `claimedAt`, `gracePeriodEndsAt`, `creditStatus` (`none`/`pending`/`awarded`/`reverted`), `serviceFee` |
| `Restaurant` | `id`, `name`, `address`, `cuisine`, `neighborhood`, `city`, `rating`, `reviewCount`, `priceLevel`, `image`, `tags`, `vibeTags`, `goodForTags`, `foodTags`, `latitude`, `longitude`, `isExclusive`, `timesBookedOnReslot` |
| `UserProfile` | `id`, `phone`, `firstName`, `lastName`, `email`, `avatar`, `credits`, `selectedCity`, `dateOfBirth`, `emailVerified`, `phoneVerified`, `referralCode`, `trustScore`, `totalFeedbacks` |
| `Watch` | `id`, `userPhone`, `restaurantId`, `date`, `partySize`, `notes`, `filterOptions` (JSON) |
| `SavedRestaurant` | `id`, `userPhone`, `restaurantId` |
| `ReservationFeedback` | `id`, `reservationId`, `worked`, `comment` |

**Normalisering:** Supabase returnerar join som `Restaurant` (PascalCase) → API normaliserar till `restaurant` (lowercase) innan svar till frontend. JSON-fält (tags/filterOptions) kan komma som sträng → använd `parseTags`/`parseWatchFiltersSafe` i `types.ts`.

## Design System — tokens + nuvarande riktning (adaptiv)

> **Design rör sig framåt — anta inget från minnet.** `mobile/src/lib/theme.ts` är enda sanningen för design. Läs de faktiska tokens där; reproducera inte specifika färger, fonter eller roller i detta dokument, och reverta inte till en tidigare identitet bara för att den en gång var godkänd. Inför William (eller den utsedda designern) en ny identitet — t.ex. _Kloes_ — jobba mot den och uppdatera `theme.ts`.

Principer (identitets-neutrala, gäller oavsett riktning):
- **Använd alltid tokens, aldrig hårdkodade värden.** Token-grupper i `theme.ts`: `C` (färg) · `FONTS`/`TYPO` (typografi) · `SPACING` · `RADIUS` · `SHADOW` · `ICON` · `IMG` · `MOTION` · `SELECT` (selected/aktiva states) · `SEMANTIC` (meningsbärande wrappers).
- **Följ den nuvarande riktningen, inte en gammal.** Vad som är primärfärg, typsnitt eller accent avgörs av vad som ligger i `theme.ts` *just nu* — slå upp det, gissa inte.
- **Ändra inte design unilateralt utan en uttalad riktning.** Det är ett ägarskaps-/koordinations-guardrail (vem som styr designbesluten), inte en låsning av någon specifik palett.
- **Motion-konventioner** bor som kommentarer i `MOTION` (theme.ts) + skillen `emil-design-eng` (PRIMARY för anim/polish). Använd dem som levande konventioner, inte som en låst regelbok.
- **Dark mode:** token-infrastruktur finns (`DARK_COLORS` + `getTheme('dark')`), ej aktiverad i komponenter.

> Behöver du historik kring tidigare identiteter (v3 / Visual Foundation v1): se `VISUAL_FOUNDATION_V1.md` och `SESSION_HANDOFF.md`. De är referens, inte regler för vad designen *ska* vara nu.

## Gotchas
- **`vercel --prod --force` alltid** — utan `--force` cachas gamla builds.
- **`bun` inte `npm`** — ta bort `package-lock.json` om den uppstår; lockfilen är `mobile/bun.lock`.
- **`printf` inte `echo`** för `EXPO_PUBLIC_BACKEND_URL` — `echo` lägger till `\n` som förstör URL:en.
- **Hobby plan: max 12 Vercel functions** — all API-logik i `mobile/api/index.ts` med `?path=`-routing.
- **Vibecode SDK inaktiverad** i `metro.config.js` (orsakade CORS-fel, ersatt med no-op).
- **react-native-maps mockad** för web i `metro.config.js`; web-kartan renderas via `WebMap.tsx` (Leaflet).
- **Kartan (`map`)** finns som tab men är dold (`href: null`).
- **SupportBubble** visas bara på `/faq`, inte globalt (`SupportBubble.web.tsx` för web).
- **Supabase join** returnerar `Restaurant` (PascalCase) — normalisera alltid i API-lagret.
- **`app.json` splash.backgroundColor** måste matcha bakgrundsfärgen (`C.bg`) i `theme.ts` — mismatch är vanlig rot-orsak till att bakgrunden "känns fel". Uppdatera båda när bg-färgen ändras.
- **Subtila färgskift är osynliga** — behöver ≥7 hex-points shift för synlig diff.
- **Stale nested CLAUDE.md** (`mobile/`, `backend/`) — denna root-fil gäller vid konflikt.

## Current State
### Fungerar ✅
- Hem-flöde (restaurangkort, carousel, sök) — **rör inte hem-skärmen utan att fråga**
- Lägg upp bokning (full form inkl. avbokningsfönster), editorial submit-identitet
- Ta över bokning med credits + checkbox-villkor
- Auth (OTP via Supabase), login-gate on-demand, intent-preservation
- Profil, credits-sida + historik, rewards, bevakningar (alerts), kontoinställningar, byt lösenord, notis-inställningar
- Bjud in en vän (unik kod + dela), feedback-flöde, sparade restauranger
- Betalning UI (mock — Stripe ej live), booking-confirmation
- FAQ (ElevenLabs text-chat), Hjälp & support
- Onboarding-flöde (finns som `onboarding.tsx`; en v3-redesign har varit under test)
- Terms & Privacy (GDPR via LegalModal), kartvy (dold i navbar)

### Saknas / Pågår 🔄
- Stripe live-integration (betalflöde är UI-mock)
- Google Places-bilder (väntar på API-nyckel)
- Push-notiser (pushToken lagras, sändning ej implementerad)
- Profilbild-upload till Supabase Storage (lokal state nu)
- Marknadsföringssida (reslot.se landing page)
- Dark mode (token-infrastruktur finns, ej aktiverad)

## Språk
**All UI-text på svenska** utom varumärket "Reslot" och låneordet "credits". Använd naturlig, idiomatisk svenska — inte direktöversättningar från engelska. Kommentarer/commits i koden är blandat svenska/engelska; följ filens befintliga stil.
