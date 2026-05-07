# Reslot — Claude Code Instructions

> **🔑 Start här:** Läs `RESLOT-VAULT.md` i repo-roten först. Den innehåller full kontext, deploy-flöde, gotchas, stream-timeout-regel och pågående arbete. Denna fil (`CLAUDE.md`) är en kondenserad version.

## ⚙️ Refero MCP & Skill — ALLTID TILLGÄNGLIGT
Detta projekt har **Refero** permanent installerat. Du behöver inte fråga vad det är, inte installera om det, inte autentisera. Det funkar.

- **MCP-server:** konfigurerad i `.mcp.json` (project root) med literal bearer-token. Verktyg blir tillgängliga som `refero_search_screens`, `refero_search_flows`, `refero_get_screen_content`, `refero_get_similar_screens`, `refero_get_flow`.
- **Skill:** `refero-design` ligger i `.claude/skills/refero-design/` (committad). Aktiveras via `/refero-design` eller automatiskt när användaren ber om UI/design-jobb.
- **Användning:** vid varje design-/UI-uppgift, börja med `refero_search_screens` (platform `web` eller `ios`) för att hitta riktiga referenser innan du designar något.
- **Fungerar inte direkt?** Token är giltig (verifierad mot `https://api.refero.design/mcp`). Om verktygen saknas vid sessionstart: be användaren bekräfta MCP-trust för project-scoped servers, sedan starta om Claude Code en gång. Återinstallera ALDRIG och kör ALDRIG OAuth-flödet — bearer-tokenen i `.mcp.json` är auktoritativ.

## Project
Reslot är en Expo React Native-app (web-build) + Vercel serverless API för ett andrahandsmarknadsplats av restaurangbokningar — användare kan lägga upp och ta över bokningar med credits.

## Repo & Workflow
- **Repo:** https://github.com/WS-maker-tech/RESLOT.git (detta är origin — single source of truth)
- **Före varje session:** `git pull origin main` — flera agenter jobbar mot samma repo
- **Branch-strategi:** jobba alltid på en feature branch (`feat/<slug>` eller `claude/<slug>`), aldrig direkt på `main`
- **Flöde:**
  1. `git checkout -b feat/<slug>` — skapa feature branch
  2. Commita ändringar på feature branchen
  3. `git checkout main && git pull origin main && git merge feat/<slug> && git push origin main` — merga in i main
  4. Deploya: automatiskt via Vercel git-integration ELLER manuellt med `cd mobile && npx vercel --prod --force`
- **PR-review skippas** — William reviewar direkt i Claude Code innan merge
- **Pakethanterare:** `bun` — **aldrig npm**, ta bort `package-lock.json` om den dyker upp
- **Konflikthantering:** jobba aldrig i samma fil samtidigt som annan agent — koordinera via William

## Quick Start
```bash
cd mobile
bun install
bun run web          # dev-server på localhost:8081
npx vercel --prod --force   # production deploy
```

## Deploy
- **Production URL:** https://mobile-three-sable.vercel.app
- **Vercel project:** `clawmax12-langs-projects/mobile`
- **Trigger:** push till `main` deployar (auto via Vercel git-integration), eller kör manuellt
- **Manuellt deploy-kommando:** `cd mobile && npx vercel --prod --force` (alltid `--force` — Vercel cachar aggressivt)
- **Om produktionen inte uppdateras:** kör `npx vercel --prod --force` igen
- **API routing:** `/api/:path*` → `/api?path=:path*` (catch-all i `mobile/api/index.ts`)

## Tech Stack
| Del | Teknologi | Version |
|-----|-----------|---------|
| Framework | Expo | ~53.0.27 |
| React | React / React Native | 19.0.0 / 0.79.6 |
| Språk | TypeScript | ~5.8.3 |
| Styling | NativeWind (Tailwind) + inline StyleSheet | — |
| Ikoner | lucide-react-native | ^0.468.0 |
| Animationer | react-native-reanimated | — |
| Databas | Supabase (PostgreSQL) | ^2.101.1 |
| Auth | Supabase Auth + expo-secure-store | — |
| Kartor | Mapbox GL JS (web, WebView) | — |
| Betalning | Stripe (UI mock, ej live än) | — |
| Deploy | Vercel (Hobby plan, max 12 functions) | — |

## Key Files
| Fil/Mapp | Beskrivning |
|----------|-------------|
| `mobile/src/app/(tabs)/` | Tab-sidor: index (hem), reservations, submit, alerts, profile |
| `mobile/src/app/restaurant/[id].tsx` | Restaurangdetaljsida med claim-flow |
| `mobile/src/app/credits.tsx` | Reslot credits-sida |
| `mobile/src/app/settings.tsx` | Kontoinställningar |
| `mobile/src/app/invite.tsx` | Bjud in en vän |
| `mobile/src/app/payment.tsx` | Betalning/kortuppgifter (UI mock) |
| `mobile/src/app/faq.tsx` | FAQ + SupportBubble (ElevenLabs chat) |
| `mobile/src/app/help.tsx` | Hjälp & support |
| `mobile/api/index.ts` | **Enda** Vercel serverless-funktionen — all API-logik här med `?path=`-routing |
| `mobile/src/lib/api/hooks.ts` | React Query hooks — alla crash-safe med try/catch |
| `mobile/src/lib/api/api.ts` | API-klient mot backend |
| `mobile/src/lib/theme.ts` | Design tokens: C (färger), FONTS, RADIUS, SPACING, SHADOW, ICON |
| `mobile/src/lib/auth-store.ts` | Zustand auth-state |
| `mobile/src/components/` | Delade komponenter (AuthModal, SupportBubble, WebMap, etc.) |
| `mobile/metro.config.js` | Vibecode SDK inaktiverad, react-native-maps mockad för web |
| `mobile/vercel.json` | `installCommand: bun install`, rewrites för API + SPA fallback |

## Environment Variables
### Frontend (Expo, `EXPO_PUBLIC_*` prefix, satt i Vercel dashboard)
| Variabel | Beskrivning |
|----------|-------------|
| `EXPO_PUBLIC_BACKEND_URL` | `https://mobile-three-sable.vercel.app` — **sätt via `printf` inte `echo` för att undvika `\n`** |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public) |
| `EXPO_PUBLIC_MAPBOX_TOKEN` | Mapbox GL JS token |

### Backend (serverless `mobile/api/index.ts`, satt i Vercel dashboard)
| Variabel | Beskrivning |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL (utan EXPO_PUBLIC prefix) |
| `SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only, ej exponera i frontend) |

## Database
- **Provider:** Supabase PostgreSQL, EU-west-2
- **Project ID:** `empexffxfbbxrlzdxlic`

### Tabeller (PascalCase)
| Tabell | Nyckelkolumner (camelCase) |
|--------|---------------------------|
| `Reservation` | `id`, `restaurantId`, `reservationDate`, `reservationTime`, `partySize`, `seatType`, `nameOnReservation`, `submitterPhone`, `claimerPhone`, `status`, `creditCost`, `cancelFee`, `updatedAt` |
| `Restaurant` | `id`, `name`, `address`, `city`, `cuisine`, `rating` |
| `UserProfile` | `id`, `phone`, `firstName`, `lastName`, `email`, `credits`, `city`, `pushToken` |
| `Watch` | `id`, `userPhone`, `restaurantId`, `date` |
| `ReservationFeedback` | `id`, `reservationId`, `rating`, `comment` |

**Normalisering:** Supabase returnerar join som `Restaurant` (PascalCase) → API normaliserar till `restaurant` (lowercase) innan svar till frontend.

## Design Tokens
Definierade i `mobile/src/lib/theme.ts` — använd alltid dessa, inte hårdkodade värden.

| Token | Värde | Användning |
|-------|-------|------------|
| `C.pistachio` / `#7EC87A` | Pistachio grön | Primary brand, knappar, accenter |
| `C.dark` / `#111827` | Nästan svart | Bakgrund mörka kort, text |
| `C.error` / `#EF4444` | Röd | Varningar, fel-state |
| `C.gold` / `#F59E0B` | Guld | Credits, ratings |
| `C.cream` / `#FAFAF8` | Krämvit | App-bakgrund |
| `FONTS.displayBold` | Rubrikfont | Stora rubriker |
| `FONTS.semiBold` | Semi-bold | Knappar, etiketter |
| `RADIUS.full` | 999 | Pill-knappar |

## Gotchas
- **`vercel --prod --force` alltid** — utan `--force` cachas gamla builds
- **`bun` inte `npm`** — ta bort `package-lock.json` om den uppstår
- **`printf` inte `echo`** för `EXPO_PUBLIC_BACKEND_URL` — `echo` lägger till `\n` som förstör URL:en
- **Hobby plan: max 12 Vercel functions** — all API-logik i `mobile/api/index.ts` med `?path=`-routing
- **Vibecode SDK inaktiverad** i `metro.config.js` — orsakade CORS-fel, ersatt med no-op
- **react-native-maps mockad** för web i `metro.config.js`
- **Kartor (map.tsx)** finns som tab men är dold (`href: null`) i navbaren
- **SupportBubble** visas bara på `/faq`, inte globalt
- **Dev bypass:** `dev:+PHONE` tokenformat för testinloggning — bara dev, aldrig production
- **Supabase join** returnerar `Restaurant` (PascalCase) — normalisera alltid i API-lagret

## Current State
### Fungerar ✅
- Hem-flöde med restaurangkort, carousel, sök
- Lägg upp bokning (full form inkl. avbokningsfönster)
- Ta över bokning med credits + checkbox-villkor
- Auth (OTP via Supabase), login-modal on-demand, intent preservation
- Profil: saldo, statistik, SENASTE AKTIVITET, Konto-sektion
- Credits-sida: köp paket, Tjäna credits, Visa historik
- Bevakningar (alerts-tab) med lägg till/ta bort
- Kontoinställningar: stad-dropdown, date picker, dirty-state Spara
- Bjud in en vän med unik kod + dela
- Betalning UI (mock — Stripe ej live)
- FAQ med ElevenLabs text-chat support
- Hjälp & support-sida
- Kartkarta (Mapbox, dold i navbar)
- Terms & Privacy (GDPR, integrerade via LegalModal)

### Saknas / Pågår 🔄
- Stripe live-integration (betalflöde är UI-mock)
- Google Places bilder (väntar på API-nyckel från William)
- Onboarding (markerad WIP i spec)
- Push-notiser (pushToken lagras, men notis-sändning ej implementerad)
- Profil-bild upload till Supabase Storage (lokal state just nu)
- Marknadsföringssida (reslot.se landing page)

## Språk
**All UI-text på svenska** utom:
- "Reslot" (varumärke)
- "credits" (etablerat låneord i appen)
Använd naturlig, idiomatisk svenska — inte direktöversättningar från engelska.
