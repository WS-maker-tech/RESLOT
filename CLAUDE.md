# Reslot — Claude Code Instructions

> **🔑 Börja här:** `RESLOT-VAULT.md` (repo-roten) är den fullständiga session-kontexten — deploy-flöde, stream-timeout-regel, designrevolutionens sprint-status, lessons learned. Denna fil (`CLAUDE.md`) är en kondenserad version som auto-laddas. `SESSION_HANDOFF.md` har snabb-recon-kommandon för nästa session. `VISUAL_FOUNDATION_V1.md` dokumenterar paper-texture-identiteten.
>
> **⚠️ Viktigt:** `mobile/CLAUDE.md` är en **gammal Vibecode-template** — ignorera den. Denna rot-fil är auktoritativ.

## Projektöversikt
Reslot är en **marknadsplats för andrahandsbokningar på restauranger**. Användare som inte kan gå lägger upp sin bokning; andra användare claim:ar med credits. Real-time-knapphet — bokningarna är ofta ikväll.

- **Plattform:** Expo React Native-app, byggd som **web** (deployas som SPA till Vercel)
- **Backend:** En enda Vercel serverless-funktion (`mobile/api/index.ts`) med `?path=`-routing (Hobby plan = max 12 functions)
- **Auth:** Supabase OTP + `expo-secure-store`
- **Payment:** Stripe-mock (UI bara — live-integration ej igång)
- **Språk i UI:** All svenska utom "Reslot" (varumärke) och "credits" (etablerat låneord)
- **Production:** https://mobile-three-sable.vercel.app

## ⚙️ Refero MCP & Skill — alltid tillgängligt
Refero är permanent installerat. Du behöver inte autentisera om eller installera om.

- **MCP-server:** konfigurerad i `.mcp.json` (project root) med literal bearer-token. Verktyg: `refero_search_screens`, `refero_search_flows`, `refero_get_screen`, `refero_get_similar_screens`, `refero_get_flow`, `refero_get_style`, `refero_get_screen_image`.
- **Skill:** `refero-design` committad i `.claude/skills/`. Aktiveras via `/refero-design` eller automatiskt vid UI/design-jobb.
- **Användning:** vid varje design-/UI-uppgift, börja med `refero_search_screens` (platform `web` eller `ios`) för riktiga referenser.
- **Funkar inte direkt?** Bekräfta MCP-trust för project-scoped servers och starta om Claude Code en gång. Återinstallera ALDRIG och kör ALDRIG OAuth-flödet — bearer-tokenen i `.mcp.json` är auktoritativ.

## Repo & GitHub
- **Repo:** https://github.com/WS-maker-tech/RESLOT.git (origin, single source of truth)
- **Default branch:** `main`
- **Före varje session:** `git pull origin main` — flera agenter mot samma repo
- **GitHub MCP-tools är scopad till `ws-maker-tech/reslot`** — andra repo-anrop avvisas
- **`gh` CLI finns INTE** i sandboxen — använd `mcp__github__*`-verktygen för all GitHub-interaktion
- **Pakethanterare:** `bun` ALDRIG `npm` — ta bort `package-lock.json` om den dyker upp

## Workflow

### Standard-flödet
1. `git checkout main && git pull origin main`
2. `git checkout -b feat/<slug>` (kebab-case, svenska eller engelska)
3. Editera + commita ofta (små commits — håller också strömmen levande)
4. `git push -u origin feat/<slug>`
5. Öppna **draft PR** via `mcp__github__create_pull_request` — alltid draft
6. När William sagt OK → merga in i `main` (`--no-ff`) och pusha
7. **Action triggas automatiskt** — verifiera deploy efter ~2-4 min

### Direkt-push-undantag
Endast för **trivial cleanup** som William explicit signerat på (typos, CLAUDE.md/VAULT-justeringar). Annars: alltid feature branch + PR.

### Commit-meddelanden (svenska, samma stil som befintlig log)
- `chore:` städning, dependencies, deploy-fixar
- `docs:` markdown, kommentarer
- `feat:` ny funktion
- `fix:` buggfix
- `ci:` workflow-ändringar
- `style:` endast visuell, ingen logik

Slipp `Co-Authored-By: Claude` om inte William ber om det.

## Deploy & verifiering

### Auto-deploy
Push till `main` → `.github/workflows/deploy.yml` triggas → kör `cd mobile && bun install && npx vercel --prod --force` med `VERCEL_TOKEN`/`VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` (secrets satta i GitHub) → live efter ~2-4 min.

### Verifiera deploy — KRITISK LESSON
Använd `last-modified`-headern, INTE bundle-hashen. Minifiering strippar kommentarer → byte-identisk JS kan ge samma hash trots lyckad deploy.

```bash
curl -sSI https://mobile-three-sable.vercel.app/ | grep -iE 'last-modified|age|etag|x-vercel'
```

- `last-modified` efter din push → deploy lyckades
- `last-modified` före din push → ingen ny build (kolla Actions-fliken)
- `x-vercel-cache: HIT` → normal edge-cache, läs `last-modified` ändå

### Bundle-grep (för att verifiera specifik kod är live)
```bash
H=$(curl -sL https://mobile-three-sable.vercel.app/ | grep -oE "index-[a-f0-9]+\.js" | head -1)
curl -s "https://mobile-three-sable.vercel.app/_expo/static/js/web/$H" | grep -oE "EAD9B8|paper\.jpg" | sort | uniq -c
```

### Manuell deploy
Sandboxen har **ingen Vercel-token** — `npx vercel --prod --force` faller med `Error: The specified token is not valid`. Kör manuellt på din maskin (`cd mobile && npx vercel --prod --force`) om Action är trasig. Action-status på `main` kan inte ses via PR-MCP-tools — be William kolla https://github.com/WS-maker-tech/RESLOT/actions.

## Tech stack

| Del | Teknologi | Not |
|-----|-----------|-----|
| Framework | Expo | ~53.0.27 |
| React Native | 0.79.6 + React 19.0.0 | |
| TypeScript | ~5.8.3 | strict-mode |
| Styling | NativeWind (Tailwind) + inline StyleSheet | `className` stöds INTE av CameraView/LinearGradient/Animated — använd inline `style` |
| Ikoner | `lucide-react-native` ^0.468.0 | |
| Animationer | `react-native-reanimated` 3.17.4 | föredra över `Animated` |
| State (server) | `@tanstack/react-query` 5.x | alla hooks crash-safe med try/catch |
| State (klient) | `zustand` ^5.0.9 | använd selector som returnerar primitiv |
| Databas | Supabase (PostgreSQL) ^2.101.1 | EU-west-2, project `empexffxfbbxrlzdxlic` |
| Auth | Supabase OTP + `expo-secure-store` | dev-bypass: token `dev:+PHONE` (lokalt) |
| Kartor | Mapbox GL JS via WebView | `react-native-maps` mockad för web i `metro.config.js` |
| Betalning | Stripe (UI-mock) | live-integration ej igång |
| Deploy | Vercel Hobby | max 12 functions — hela API i en fil |
| Tester | Playwright (dev-dep) | screenshot-skript för Visual Foundation-baseline |

## Snabbstart
```bash
cd mobile
bun install
bun run web                  # dev på localhost:8081
bunx tsc --noEmit            # type-check (6 baseline-errors finns sedan tidigare)
```

## Repo-struktur

### Rot
| Fil/Mapp | Roll |
|----------|------|
| `CLAUDE.md` | Auto-laddad projekt-instruktion (denna fil) |
| `RESLOT-VAULT.md` | Full session-kontext, designrevolution, sprint-status |
| `SESSION_HANDOFF.md` | Snabb-recon för nästa session |
| `VISUAL_FOUNDATION_V1.md` | Paper-texture-identiteten + Unisketch-pivot |
| `.github/workflows/deploy.yml` | Auto-deploy vid push till `main` |
| `.mcp.json` | Refero MCP-token (committad) |
| `mobile/` | Hela appen + serverless API |
| `backend/` | Legacy Bun/Prisma backend — **används ej**, all backend-logik ligger i `mobile/api/` |
| `docs/` | Djupanalys-rapporter + design-research |

### Mobile (Expo web)
| Fil/Mapp | Roll |
|----------|------|
| `mobile/src/app/(tabs)/` | 5 tab-skärmar: `index` (hem), `reservations`, `submit`, `alerts`, `profile`. `map.tsx` finns men är dold (`href: null`). |
| `mobile/src/app/restaurant/[id].tsx` | Restaurangdetalj + Claim-flow |
| `mobile/src/app/` (övriga routes) | `credits`, `credit-history`, `settings`, `account-settings`, `notification-settings`, `change-password`, `invite`, `payment`, `faq`, `help`, `support`, `feedback`, `rewards`, `saved`, `add-watch`, `booking-confirmation`, `onboarding`, `dev-components` |
| `mobile/src/app/_layout.tsx` | Root layout — **rör inte `RootLayoutNav`** |
| `mobile/src/app/+html.tsx` | Web SSR — hardkodad `#EAD9B8` + paper-texture-CSS |
| `mobile/src/components/` | Skärm-specifika block (AuthModal, BookingDetails, ClaimSection, CreditsBanner, DayPicker, FilterChips, HeroSection, LegalModal, LoginGate, RestaurantCard, RestaurantInfo, Skeleton, SupportBubble, SupportWidget, Themed, TrustBadge, WebMap) |
| `mobile/src/components/ui/` | **16 primitives** (se nedan) |
| `mobile/src/reslot-art/` | Handritat kit: 16 scribbles + 9 doodles som transparenta PNG, color-tintade i runtime. Disciplin: krydda, en markering per skärm |
| `mobile/src/lib/theme.ts` | **Token-källan** — C (färger), DARK_COLORS, FONTS, SPACING, RADIUS, SHADOW, TYPO, MOTION, getTheme() |
| `mobile/src/lib/api/api.ts` + `hooks.ts` | API-klient + React Query-hooks (alla crash-safe) |
| `mobile/src/lib/auth-store.ts` | Zustand auth-state |
| `mobile/src/lib/supabase.ts` | Supabase-klient (frontend) |
| `mobile/src/lib/use-reduced-motion.ts` | A11y-hook för Reanimated loops |
| `mobile/api/index.ts` | **Enda** serverless-funktionen — all backend-logik med `?path=`-routing |
| `mobile/assets/fonts/` | Plus Jakarta Sans + Unisketch-Bold (298 KB) |
| `mobile/assets/textures/paper.jpg` | Paper-texture (245 KB, 1254×1254 seamless tile) |
| `mobile/public/textures/paper.jpg` | Web-kopia, servas på `/textures/paper.jpg` |
| `mobile/metro.config.js` | Vibecode SDK no-op'ad, react-native-maps mockad — **rör inte** |
| `mobile/vercel.json` | `installCommand: bun install`, rewrites för API + SPA fallback |
| `mobile/app.json` | Expo-config — splash.backgroundColor `#EAD9B8` matchar paper |

## Designsystem — current state

### Identity v3 — Paper-textured floor (Visual Foundation v1)
Golvet är en warm sand paper-textur (`#EAD9B8`) — INTE flat off-white. Renderas via:
1. `<ImageBackground source={paper.jpg} resizeMode="repeat">` i root layout
2. CSS `background-image` i `+html.tsx` body för web
3. `Stack.contentStyle.backgroundColor: 'transparent'` så screens som inte målar egen bg avslöjar texturen
4. `C.bg = 'transparent'` — 42 callsites som hardcodar `backgroundColor: C.bg` ärver paper automatiskt

### Färger (`C` i `mobile/src/lib/theme.ts`)
- **Identity v3:** `paper` (#EAD9B8 warm sand), `cream` (#FAFAF8), `creamSoft`, `creamDeep`, `forest` (#1F4D2A primary accent), `forestDeep`, `forestSoft`, `ringForest`, `ink` (#1A1A1A warmer body), `inkSoft`, `inkFaint`, `coral` (#D97757 reserverad delight, max 3 screens), `coralSoft`, pastels (`pastelYellow`/`pastelBlue`/`pastelGreen`/`pastelPeach`)
- **Legacy (oförändrade):** `pistachio` (#7EC87A — logo + "slot"-grön), `gold` (#C9A96E), `dark` (#111827), `bgCard` (#FFFFFF), `bgInput` (#F0F0EE), `textPrimary`/`textSecondary`/`textTertiary`, `divider`, `success`/`error`/`warning`/`info` + variants
- **Dark mode:** `DARK_COLORS` + `getTheme('dark')` finns men aktiveras aldrig — infrastruktur ready
- **❌ `coral` är inte `#E06A4E` längre** — det var fel i tidigare CLAUDE.md. Coral är `#D97757` (delight-token, reserverad).

### Fonts (`FONTS`)
**Plus Jakarta Sans-familjen** (regular/medium/semiBold/bold). Unisketch reverterades — `displayBold`/`displaySemiBold` är tillbaka till Plus Jakarta Bold/SemiBold. TTF:n finns kvar i `assets/fonts/` men ej registrerad i `_layout.tsx`.

**Inga andra typsnittspaket. Inga font-byten utan William's OK.**

### Spacing / Radius / Shadow / Motion
- `SPACING`: xxs/xss/xs/sm/md/lg/lg2/xl/xl2/xxl/xxxl (2/3/4/8/16/20/24/28/32/48/...)
- `RADIUS`: sm/md/lg/xl/full (full = 999 för pills)
- `SHADOW`: subtle/card/raised/elevated/floating/pressed (Sprint 1-utvidgning gjord)
- `TYPO`: display/displayXL/h1-3/body/bodyMedium/label/caption/cta/eyebrow/numeric
- `MOTION`: entrance 220ms, exit 160ms, stagger 50ms, `press = { damping:16, stiffness:240 }` — **override aldrig**
- `EASING`: outCubic default + M3 curves. Loops: `Easing.linear` + `ReduceMotion.System`

### UI primitives (`mobile/src/components/ui/`) — 16 klara
`Avatar`, `Button`, `Card`, `Chip`, `CountdownPill`, `Divider`, `EmptyState`, `ErrorState`, `FormField`, `Input`, `ListItem`, `Rating`, `Stepper`, `Tabs`, `Tag`, `Toast`.

Plus `AvatarGroup` exporterad från `Avatar`. Alla visualiserade på `/dev-components`-route. **De flesta skärmar har inte migrerats än** — primitives finns, behöver rullas ut. Konkreta nästa steg: hem-`RestaurantCard` → `<Card interactive>`, settings-rader → `<ListItem>`, formulär-knappar → `<Button>`, alerts-tabs → `<Tabs>`.

### Hård regel
- `grep -rEn "#[0-9a-fA-F]{6}" mobile/src/` ska ge **0 träffar** utanför `theme.ts` och `+html.tsx`
- `grep -rn "padding: [0-9]" mobile/src/` ska ge **0 träffar** utanför `theme.ts`

## Database (Supabase)
- **Project ID:** `empexffxfbbxrlzdxlic`
- **Tabeller (PascalCase):** `Reservation`, `Restaurant`, `UserProfile`, `Watch`, `ReservationFeedback`
- **Kolumner:** camelCase
- **Normalisering:** Supabase joins returnerar `Restaurant` (PascalCase) → API normaliserar till `restaurant` (lowercase) i `mobile/api/index.ts` `normalize()` innan svar till frontend

### Reservation key columns
`id`, `restaurantId`, `reservationDate`, `reservationTime`, `partySize`, `seatType`, `nameOnReservation`, `submitterPhone`, `claimerPhone`, `status`, `creditCost`, `cancelFee`, `updatedAt`

## Environment variables
Satta i Vercel dashboard, inte i koden.

### Frontend (Expo, `EXPO_PUBLIC_*` prefix)
- `EXPO_PUBLIC_BACKEND_URL` — `https://mobile-three-sable.vercel.app` (sätt med **`printf` inte `echo`** — echo lägger till `\n` som förstör URL:en)
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_MAPBOX_TOKEN`

### Backend (`mobile/api/index.ts`)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — server-only, exponera ALDRIG i frontend

## Stream-timeout — hård regel

> *Håll strömmen aktiv. Tänk inte i tysthet i 60+ sekunder utan att emittera ett verktygsanrop eller text — då stänger klienten anslutningen med "Stream idle timeout - partial response received".*

Det är **tystnad mellan events** som triggar timeout, inte total volym. Du kan emittera 5000 ord utan problem om något streamas var 20:e sekund.

**Fix:** skriv stub tidigt med platshållare → editera i smårationer (en sektion åt gången) → kort statustext mellan verktygsanrop. Inga monolit-Writes för långa dokument.

Se RESLOT-VAULT.md sektion 9 för full diagnos.

## Gotchas — vad du ALDRIG ska göra

### Repo & deploy
- ❌ `npm` — använd `bun`. Ta bort `package-lock.json` om den uppstår.
- ❌ Kör `npx vercel --prod --force` från sandboxen — saknar token, faller. Action på main deployar automatiskt.
- ❌ Push direkt till `main` utan William's godkännande (förutom trivial cleanup han signerat på)
- ❌ `gh` CLI — använd `mcp__github__*`-verktyg
- ❌ Förlita dig på bundle-hash för deploy-verifiering — använd `last-modified`-headern
- ❌ `echo` för `EXPO_PUBLIC_BACKEND_URL` — använd `printf`
- ❌ Skapa nya Vercel serverless-funktioner — Hobby plan = max 12, all logik i `mobile/api/index.ts` med `?path=`-routing

### Designrevolutionen (visuellt-bara)
- ❌ Lägg till nya sektioner, sidor eller funktioner
- ❌ Konsolidera sidor
- ❌ Importera nya font-paket
- ❌ Byt palett — pistachio + forest + gold + paper stannar
- ❌ Ta bort befintlig copy
- ❌ Hårdkoda `#hex` eller `padding: 16` — använd `theme.ts`-tokens

### Kodfiler — rör inte
- `mobile/metro.config.js` (Vibecode SDK no-op + react-native-maps mock — kritiskt för web-build)
- `mobile/babel.config.js`
- `mobile/app.json`
- `mobile/tsconfig.json`
- `mobile/nativewind-env.d.ts`
- `mobile/patches/`
- `RootLayoutNav` i `mobile/src/app/_layout.tsx`

### React Native-fällor
- Tomma strängar (`""`) i ternaries → "Unexpected text node"-fel. Använd `null`: `{condition ? "text" : null}`
- `CameraView`/`LinearGradient`/`Animated` stöder INTE `className` — använd inline `style`
- Horisontella ScrollViews behöver `style={{ flexGrow: 0 }}` för att inte expandera vertikalt
- Använd `Pressable`, inte `TouchableOpacity`
- Använd custom modals, inte `Alert.alert()`
- Importera `SafeAreaView` från `react-native-safe-area-context`, inte `react-native`

### Auth & säkerhet
- Dev-bypass `dev:+PHONE` — bara lokalt, ALDRIG i production
- Exponera ALDRIG `SUPABASE_SERVICE_ROLE_KEY` i frontend
- Supabase-joins returnerar PascalCase (`Restaurant`) — normalisera till camelCase i API-lagret

### Identitet — locked decisions
- Bg `#EAD9B8` (warm sand paper) + `paper.jpg`-texture. INTE flat off-white.
- Forest `#1F4D2A` är primary brand-accent (FAB, map-pill, active-states)
- Coral `#D97757` är reserverad delight, max 3 screens
- Pistachio `#7EC87A` är "slot"-grön (logo + Stockholm i h1)
- Hem-skärmen rörs minimalt
- Italic endast naturligt, ej tvingat

## Current state

### Fungerar ✅
- Hem-flöde med restaurangkort, carousel, sök, filter
- Lägg upp bokning (full form inkl. avbokningsfönster)
- Ta över bokning med credits + checkbox-villkor
- Auth (Supabase OTP), login-modal on-demand, intent preservation
- Profil: saldo, statistik, senaste aktivitet, Konto-sektion
- Credits: köp paket, Tjäna credits, Visa historik
- Bevakningar (alerts-tab) med lägg till/ta bort
- Kontoinställningar, notifikationsinställningar, byt lösenord
- Bjud in en vän med unik kod + dela
- Betalning UI (Stripe-mock)
- FAQ med ElevenLabs text-chat (SupportBubble)
- Hjälp & support-sida + feedback
- Karta (Mapbox via WebView, dold i navbar)
- Terms & Privacy (LegalModal)
- Onboarding-flöde (3 screens: welcome → phone → OTP)
- Visual Foundation v1: paper-texture, Unisketch-pivot (reverterad), reslot-art-kit installerat med 5 strategic placements
- 16 UI primitives i `components/ui/`, visualiserade på `/dev-components`

### Saknas / pågår 🔄
- Stripe live-integration
- Google Places bilder (väntar på API-nyckel)
- Push-notiser (pushToken lagras, men sändning ej implementerad)
- Profil-bild upload till Supabase Storage (lokal state just nu)
- Marknadsföringssida (reslot.se landing)
- Migrering av befintliga skärmar till UI-primitives (där "Airbnb-WOW" levereras)

### Pending branch (per SESSION_HANDOFF)
- `feat/onboarding-redesign-v3` — 2068→596 line rewrite, ej merged, William testar

## Språk
**All UI-text på svenska** utom:
- "Reslot" (varumärke)
- "credits" (etablerat låneord)

Använd naturlig, idiomatisk svenska — inte direktöversättningar från engelska.
