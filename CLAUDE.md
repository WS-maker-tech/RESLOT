# Reslot — Claude Code Instructions

> **📄 Levande dokument:** Detta är en ögonblicksbild av projektets *nuvarande* tillstånd, inte en evig sanning. När stack, flöden, design-identitet eller konventioner ändras — uppdatera den här filen i samma PR. Behandla allt nedan (särskilt design-identiteten) som "senast godkänt", inte "låst för alltid". Föredrar du att börja jobba mot en ny riktning, gör det och uppdatera dokumentet därefter.

> **🔑 Start här:** Läs `RESLOT-VAULT.md` (full kontext, deploy-flöde, gotchas) och `SESSION_HANDOFF.md` (senaste sessionens status, identity-lock, motion-tokens) i repo-roten först. `VISUAL_FOUNDATION_V1.md` beskriver design-identiteten v3. Denna fil (`CLAUDE.md`) är den auktoritativa, kondenserade versionen.
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
| Fonts | @expo-google-fonts/plus-jakarta-sans | Plus Jakarta Sans (only) |
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

## Design System — aktiv identitet (living, versionerad)
Allt i `mobile/src/lib/theme.ts`. **Använd alltid tokens, aldrig hårdkodade värden.**

> **Identiteten är versionerad, inte fryst.** Avsnittet nedan beskriver den *nuvarande aktiva* identiteten (v3 / Visual Foundation v1) — det William senast godkänt, inte en permanent låsning. **När en ny design-identitet införs (t.ex. _Kloes identitet_), gäller den nya riktningen:** uppdatera `theme.ts`-tokens **och detta avsnitt** så att de speglar den, och följ den senaste godkända identiteten istället för att reverta till den gamla. Lägg gärna upp den nya identiteten som ett nytt versionsnamn (t.ex. "Identity v4 — Kloe") så historiken är spårbar.
>
> **Guardrail (varför "locked" stod här):** ändra inte färger/fonter *unilateralt utan en uttalad riktning* — tidigare ad-hoc-ändringar reverterades. Poängen är vem som styr designbesluten (William / den utsedda designern), inte att v3 är hugget i sten. Har du en ny identitet att jobba mot — kör på den.

### Färg-roller (`C`) — nuvarande (v3)
| Token | Hex | Roll |
|-------|-----|------|
| `C.paper` / `C.bg` | `#FAFAF8` | Floor — benvit off-white (locked, INTE varm cream). Alla bakgrunder. |
| `C.forest` | `#1F4D2A` | **Primary brand-accent** — ikoner, länkar, CTA, FAB, aktiva states |
| `C.forestDeep` | `#143620` | Pressed |
| `C.pistachio` | `#7EC87A` | "slot"-grön — logo + ortnamn i h1. Success/celebration. |
| `C.coral` | `#D97757` | Reserverad delight (max ~3 skärmar — sparsamt) |
| `C.gold` | `#C9A96E` | Credits, ratings |
| `C.ink` | `#1A1A1A` | Varm body-text · `inkSoft`/`inkFaint` för sekundär |
| `C.error` | `#EF4444` | Fel/varning |

Dark mode finns som infrastruktur (`DARK_COLORS` + `getTheme('dark')`) men är **inte aktiverad** i komponenter.

### Typografi
- **Plus Jakarta Sans only.** Fraunces/Playfair-serif är **reverterad** (co-founder). Paketen finns kvar i `package.json` men `FONTS` pekar enbart på Plus Jakarta Sans (`displayBold`, `displaySemiBold`, `bold`, `semiBold`, `medium`, `regular`).
- Använd `TYPO`-presets (`display`, `displayXL`, `h1`–`h3`, `body`, `label`, `eyebrow`, `caption`, `cta`, `numeric`, `stepHero`) för konsekvent hierarki.
- Italic endast naturligt, aldrig tvingat.

### Övriga tokens
- `SELECT` — **EN källa** för alla "selected"/aktiva states (tiles, chips, day-circle, time-slot, CTA) i submit-flödet. Forest-grön. Pistachio = success, gold = credits/ratings.
- `SEMANTIC` — meningsbärande wrappers (`brand`, `surface`, `onSurface`, …).
- `SPACING`, `RADIUS` (`full: 28`, `pill: 999`), `SHADOW` (`subtle`→`floating`), `ICON` (strokeWidth 2), `IMG` (aspect ratios).

### Motion (`MOTION`) — viktigt, AI-tell-känsligt
- **Entrance:** `FadeIn/Down/Up.duration(MOTION.duration.entrance /*220*/).easing(MOTION.easing.outCubic)`. **ALDRIG `.springify()`** på UI-entrance (det är ett AI-tell — ease-out duration istället).
- **Exit:** ~70% av entrance (`MOTION.duration.exit` = 160ms).
- **List stagger:** `delay(i * MOTION.duration.stagger /*50*/)`.
- **Press feedback:** `MOTION.press` (`damping:16, stiffness:240`) — **single source, override aldrig** med hårdkodad `stiffness: 300`.
- **Loopar (pulse/breathing):** `withRepeat(withTiming(..., { easing: Easing.linear }), -1, true)` + respektera `ReduceMotion.System` / `use-reduced-motion.ts`. Aldrig spring i loopar.
- **Celebration:** `springBouncy` OK för enstaka success-moment.

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
- **`app.json` splash.backgroundColor** måste matcha `C.bg`/`paper` (`#FAFAF8`) — vanlig rot-orsak till "bg känns varm". Kolla samtidigt med `theme.ts`.
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
