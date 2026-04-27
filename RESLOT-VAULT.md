# RESLOT — Vault

> Permanent kontext-doc. Läses först av varje ny session som ska jobba med Reslot. Innehåller projektöversikt, edit-workflow, deploy-verifiering, lessons learned och var vi är just nu.

## Snabbstart för ny session
1. `git -C /home/user/RESLOT pull origin main`
2. Läs `CLAUDE.md` (auto-laddad) + denna fil
3. Läs senaste plan-fil i `/root/.claude/plans/` om den finns
4. `git log --oneline -10` för att se senaste arbete

---

## 1. Vad Reslot är
**Marketplace för andrahandsbokningar på restauranger.** Användare som inte kan gå på sin bokning lägger upp den; andra användare claim:ar med credits. Real-time-knapphet: bokningarna är ikväll, någon hinner före.

- **Plattform:** Expo React Native-app, byggd som **web** (deployas till Vercel som SPA)
- **Backend:** En enda Vercel serverless-funktion (`mobile/api/index.ts`) med `?path=`-routing — Hobby plan = max 12 functions
- **Auth:** Supabase Auth (OTP) + `expo-secure-store` för token
- **Payment:** Stripe-mock (UI bara — live-integration ej igång)
- **Språk i UI:** **All svenska** utom varumärket "Reslot" och låneordet "credits"
- **Production URL:** https://mobile-three-sable.vercel.app

## 2. Repo & GitHub
- **Repo:** https://github.com/WS-maker-tech/RESLOT.git (origin, single source of truth)
- **GitHub MCP-tools är begränsade till `ws-maker-tech/reslot`** — alla andra repo-anrop avvisas
- **Default branch:** `main`
- **Auto-deploy:** GitHub Action `.github/workflows/deploy.yml` triggas på push till `main` och kör `cd mobile && npx vercel --prod --force` med `VERCEL_TOKEN`/`VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` (secrets satta i GitHub)
- **PR-review skippas** — William reviewar direkt i Claude Code innan merge
- **Pakethanterare:** `bun` ALDRIG `npm` — ta bort `package-lock.json` om den dyker upp
- **GitHub CLI (`gh`) finns INTE** i sandboxen — använd `mcp__github__*`-verktygen för all GitHub-interaktion (öppna PR, läsa kommentarer, status)

## 3. Edit-workflow (utan att bryta något)

### Standard-flödet (varje feature)
1. `git checkout main && git pull origin main` — alltid börja synkat
2. `git checkout -b feat/<slug>` — namn på engelska eller svenska, kebab-case
3. Editera + commita ofta (små commits, hellre 5 små än 1 stor — håller också strömmen levande)
4. `git push -u origin feat/<slug>`
5. Öppna **draft PR** med `mcp__github__create_pull_request` — alltid draft
6. När William sagt OK → `git checkout main && git pull && git merge --no-ff feat/<slug> && git push origin main`
7. **Action triggas automatiskt** — verifiera deploy efter ~3 min (se sektion 4)

### Direkt-push-undantag
För **trivial cleanup** (ta bort test-markörer, fixa typos, justera CLAUDE.md/VAULT) får man pusha direkt till `main` om William explicit sagt det. Annars: alltid feature branch.

### Commit-meddelanden (svenska, samma stil som befintlig log)
- `chore: <vad>` — städning, dependencies, deploy-fixar
- `docs: <vad>` — markdown, kommentarer
- `feat: <vad>` — ny funktion
- `fix: <vad>` — buggfix
- `ci: <vad>` — workflow-ändringar
- `style: <vad>` — endast visuell, ingen logik (Sprint 2-5 i designrevolutionen)

Slipp `Co-Authored-By: Claude` i commit-msg om inte William ber om det.

## 4. Deploy & verifiering

### Hur deploys sker
Push till `main` → Action `Deploy to Vercel` triggas → kör `bun install` + `npx vercel --prod --force` → produktion live på https://mobile-three-sable.vercel.app efter ~2-4 min.

### Verifiera att deploy faktiskt hänt — KRITISK LESSON
**Använd `last-modified`-headern**, INTE bundle hashen. Bundle hashen kan vara identisk även efter en lyckad deploy om ändringen var en kommentar (minifiering strippar kommentarer → byte-identisk JS → samma hash).

```bash
curl -sSI https://mobile-three-sable.vercel.app/ | grep -iE 'last-modified|age|etag|x-vercel'
```

**Tolkning:**
- `last-modified: <tid efter din push>` → deploy lyckades, bundle live
- `last-modified: <tid före din push>` → ingen ny build (Action failed eller inte triggat — kolla Actions-fliken)
- `x-vercel-cache: HIT` → edge cachar (förvänta dig det), titta på `last-modified` ändå
- `age: <stort tal>` → cachen är gammal, men `last-modified` visar när builden faktiskt skedde

### Manuell deploy (utanför sandboxen)
Sandboxen har **ingen Vercel-token** — `npx vercel --prod --force` kommer faila med `Error: The specified token is not valid`. Kör manuellt på din egen maskin om Action är trasig:
```bash
cd mobile && npx vercel --prod --force
```

### Action-status check
Tools tillgängliga i sandboxen (`mcp__github__pull_request_read get_check_runs`) ser endast PR-checks. Action på `main` syns inte direkt — be William kolla https://github.com/WS-maker-tech/RESLOT/actions om något verkar fel.

## 5. Tech stack & databas

### Tech
| Del | Teknologi | Version / not |
|-----|-----------|---------------|
| Framework | Expo | ~53.0.27 |
| React | React / React Native | 19.0.0 / 0.79.6 |
| TypeScript | strict-mode | ~5.8.3 |
| Styling | NativeWind (Tailwind) + inline StyleSheet | NativeWind className stöds INTE av CameraView/LinearGradient/Animated — använd inline `style` |
| Ikoner | `lucide-react-native` | ^0.468.0 |
| Animationer | `react-native-reanimated` | föredra över `Animated` |
| Databas | Supabase (PostgreSQL) | ^2.101.1 |
| Auth | Supabase OTP + `expo-secure-store` | dev-bypass: token `dev:+PHONE` (endast lokalt) |
| Kartor | Mapbox GL JS via WebView | `react-native-maps` är mockad för web i `metro.config.js` |
| Betalning | Stripe (UI mock) | live-integration ej igång |
| Deploy | Vercel Hobby | max 12 functions — hela API i en fil |

### Database (Supabase)
- **Provider:** PostgreSQL, EU-west-2
- **Project ID:** `empexffxfbbxrlzdxlic`
- **Tabeller (PascalCase):** `Reservation`, `Restaurant`, `UserProfile`, `Watch`, `ReservationFeedback`
- **Kolumner:** camelCase
- **Normalisering:** Supabase joins returnerar `Restaurant` (PascalCase) → API normaliserar till `restaurant` (lowercase) innan svar

### Environment variables
Sätts i Vercel dashboard, inte i koden.

**Frontend (Expo, `EXPO_PUBLIC_*`-prefix):**
- `EXPO_PUBLIC_BACKEND_URL` — `https://mobile-three-sable.vercel.app` — sätt med `printf` INTE `echo` (echo lägger till `\n` som förstör URL:en)
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_MAPBOX_TOKEN`

**Backend (`mobile/api/index.ts`):**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only — exponera ALDRIG i frontend)

## 6. Design system (nuläge)

### Tokens i `mobile/src/lib/theme.ts`
- **Färger (`C`):** `pistachio` (#7EC87A), `gold` (#C9A96E), `dark` (#111827), `bg` (#FAFAF8), `bgCard`, `bgInput`, text-hierarki, semantic (success/error/warning/info), interaction-variants (Light/Pressed/Bg), overlays
- **OBS namn-bug:** `coral` är ALIAS för `pistachio` (samma värde `#7EC87A`). `coral` ska tas bort i Sprint 1, allt ska heta `pistachio`. CLAUDE.md säger fortfarande att coral är `#E06A4E` — det är fel mot kod.
- **Fonts (`FONTS`):** Plus Jakarta Sans-familjen (regular/medium/semiBold/bold). Inga andra typsnittspaket. **Inga font-byten är godkända** för designrevolutionen.
- **Spacing (`SPACING`):** xs/sm/md/lg/xl/xxl (4/8/16/20/28/48). Underdimensionerad — Sprint 1 utvidgar med xxs/xss/lg2/xl2/xxxl + RADIUS.full → 999 (idag 28).
- **Radius (`RADIUS`):** sm/md/lg/xl/full
- **Shadow (`SHADOW`):** card, elevated. Sprint 1 lägger till subtle/raised/floating/pressed.
- **Typo-presets (`TYPO`):** display/h1-3/body/bodyMedium/label/caption/cta. Sprint 1 lägger till displayXL/eyebrow/numeric.
- **Motion: SAKNAS HELT.** Sprint 1 introducerar `MOTION` + `EASING`-tokens.
- **Dark mode:** `DARK_COLORS` + `getTheme('dark')` finns men aktiveras aldrig — infrastruktur ready.

### Komponentbibliotek (`mobile/src/components/`)
**Återanvändbara (3):** `RestaurantCard`, `Skeleton`, `FilterChips`
**Engångsblock (12):** ClaimSection, BookingDetails, HeroSection, CreditsBanner, DayPicker, RestaurantInfo, LegalModal, SupportWidget, SupportBubble, TrustBadge, LoginGate, WebMap, AuthModal, Themed

**SAKNAS:** Button, Card, Input/FormField, Tag/Badge, ListItem, EmptyState, ErrorState, Toast, BottomSheet, Avatar/AvatarGroup, Rating, Stepper, Divider, Tabs, Chip — bygg i Sprint 1+2 i ny mapp `mobile/src/components/ui/`.

### Hård regel efter Sprint 1
- `grep -rn "padding: [0-9]" mobile/src/` ska ge **0 träffar** utanför `theme.ts`
- `grep -rEn "#[0-9a-fA-F]{6}" mobile/src/` ska ge **0 träffar** utanför `theme.ts`
- Action failar PR om dessa ger träffar

## 7. Kritiska filer

### Repo-rot
| Fil | Roll |
|-----|------|
| `CLAUDE.md` | Auto-laddad projekt-instruktion |
| `RESLOT-VAULT.md` | Denna fil — full session-kontext |
| `.github/workflows/deploy.yml` | Auto-deploy vid push till main |

### Mobile (Expo web)
| Fil/Mapp | Roll |
|----------|------|
| `mobile/src/lib/theme.ts` | **Token-källan** — utvidgas i Sprint 1 |
| `mobile/src/components/ui/` | **Ny mapp** för primitives (skapas i Sprint 1) |
| `mobile/src/components/RestaurantCard.tsx` | Bevaras, refactoras till Card-bas |
| `mobile/src/components/Skeleton.tsx` | Generaliseras |
| `mobile/src/components/FilterChips.tsx` | Bryts till `<Chip>` |
| `mobile/src/lib/api/api.ts` | API-klient |
| `mobile/src/lib/api/hooks.ts` | React Query hooks (alla crash-safe med try/catch) |
| `mobile/src/lib/auth-store.ts` | Zustand auth-state |
| `mobile/src/app/(tabs)/_layout.tsx` | Tab-nav |
| `mobile/src/app/(tabs)/index.tsx` | Hem (Sprint 2) |
| `mobile/src/app/(tabs)/reservations.tsx` | Mina bokningar (Sprint 4) |
| `mobile/src/app/(tabs)/submit.tsx` | Lägg upp (Sprint 3) |
| `mobile/src/app/(tabs)/alerts.tsx` | Bevakningar (Sprint 4) |
| `mobile/src/app/(tabs)/profile.tsx` | Profil (Sprint 3) |
| `mobile/src/app/restaurant/[id].tsx` | Detalj + Claim (Sprint 2) |
| `mobile/src/app/credits.tsx` | Credits (Sprint 4) |
| `mobile/src/app/settings.tsx` + `account-settings.tsx` | Inställningar (Sprint 5) |
| `mobile/src/app/payment.tsx` | Betalning UI mock (Sprint 5) |
| `mobile/src/app/{help,faq,support}.tsx` | Support-trio (Sprint 5) |
| `mobile/src/app/invite.tsx` | Bjud in (Sprint 5, minimal) |
| `mobile/src/app/_layout.tsx` | Root layout — **rör inte RootLayoutNav** |
| `mobile/api/index.ts` | **Enda** serverless-funktionen — all backend-logik med `?path=`-routing |
| `mobile/metro.config.js` | Vibecode SDK no-op'ad, react-native-maps mockad — **rör inte** |
| `mobile/app.json` | Expo-config — **rör inte** |
| `mobile/babel.config.js` | **Rör inte** |
| `mobile/tsconfig.json` | **Rör inte** |
| `mobile/vercel.json` | `installCommand: bun install`, rewrites för API + SPA fallback |

## 8. Pågående arbete

### Status (uppdateras varje session)
**Aktiv plan:** `/root/.claude/plans/bra-du-ska-g-ra-stateless-hennessy.md` — *5-sprint designrevolution, godkänd av William.*

**Hårda regler för designrevolutionen:**
1. INGA funktionalitetsändringar — samma flöden, fält, steg, copy, data
2. INGA innehållsändringar — inga sektioner tas bort/läggs till, inga sidor konsolideras
3. INGA font-ändringar — Plus Jakarta Sans-familjen stannar
4. INGA palett-byten — pistachio + guld + cream stannar
5. Bar: Airbnb-WOW. Ska se ut som månader av seniordesign-arbete.

### Sprint-status
| Sprint | Innehåll | Status |
|--------|----------|--------|
| 1 — Foundation | Token-utvidgning + 5 primitives + codemod hårdkodade värden | Pågår — bryts i 6 små PRs (1.1 tokens, 1.2 Button+Card, 1.3 Input+FormField, 1.4 Tag+ListItem, 1.5 codemod, 1.6 coral→pistachio + dev/components-route) |
| 2 — Hem + Restaurang/Claim | Visuell upgrade av tunga hjältarna | Ej startad |
| 3 — Submit + Profil | Visuell upgrade av största delta | Ej startad |
| 4 — Alerts + Reservations + Credits | Visuell upgrade av listsidor | Ej startad |
| 5 — Settings + Payment + Support + state-coverage | Visuell polish | Ej startad |

### Branch-konvention för sprintar
`feat/sprint-1-1-tokens`, `feat/sprint-1-2-button-card`, etc.

### Senaste commits på `main`
Kör `git log --oneline -10` för att se. Vid tidpunkten för denna vault:
- `d3ec96a chore: ta bort deploy-flow test-markör`
- `6e57153 Merge feat/test-deploy-flow: deploy-flow test marker`
- `637a1bf ci: auto-deploy till Vercel vid push till main`

## 9. Stream-timeout — hård regel

**Permanent regel från William (gäller för alla sessioner):**

> *Håll strömmen aktiv. Tänk inte i tysthet i 60+ sekunder utan att emittera ett verktygsanrop eller text — då stänger klienten anslutningen med "Stream idle timeout - partial response received".*

### Vad orsakar felet
- HTTP/SSE mellan modellservern och klienten har en idle-tröskel (~30-60s)
- Extended-thinking emitterar inte synliga tokens — räknas som idle av klienten
- Modellen sitter och planerar ett stort dokument → klienten ger upp innan första `Write`-anrop hinner skickas
- Resultatet: "partial response received" (de tidiga tokens kom, sen tystnad)

### Det är INTE storleken som är problemet
Du kan emittera 5000 ord utan timeout om du bara streamar något var 20:e sekund. Felet kommer från **tystnad mellan events**, inte från total volym.

### Fix (följ alltid)
1. **Skriv stub tidigt** — `Write` med strukturen + `*(fylls i)*`-platshållare. Det räknas som event och nollställer idle-klockan.
2. **Edits i smårationer** — en sektion åt gången. Varje `Edit` är en event.
3. **Korta texter mellan verktygsanrop** — "Sektion 4 klar. Skriver sektion 5." En mening räcker.
4. **Inga monolit-Writes** för långa dokument. Aldrig.
5. **Förundersök inte i thinking** — börja skriva så fort du har strukturen klar.

### Symptom att känna igen
- "API Error: Stream idle timeout - partial response received"
- "Turn failed - Try sending it again"
- William frustrerad

### När du ser felet i din egen historik
Be **inte** William om ursäkt med "jag skrev för mycket". Det är fel diagnos. Ge den verkliga: idle-timeout, fix är att hålla strömmen varm.

## 10. Gotchas — vad du ALDRIG ska göra

### Repo & deploy
- ❌ Använd `npm` — alltid `bun`
- ❌ Lämna kvar `package-lock.json` — ta bort den om den uppstår
- ❌ Försök `npx vercel --prod --force` från sandboxen — saknar token, kommer faila
- ❌ Pusha direkt till `main` utan William's explicit godkännande (förutom triviala docs/cleanup som han redan signerat på)
- ❌ Använd `gh` CLI — den finns inte här, använd `mcp__github__*`-verktyg
- ❌ Förlita dig på bundle hash för deploy-verifiering — använd `last-modified` header
- ❌ Använd `echo` för `EXPO_PUBLIC_BACKEND_URL` — `echo` lägger till `\n` som förstör URL:en. Använd `printf`.
- ❌ Skapa nya Vercel serverless-funktioner — Hobby plan = max 12, all logik i `mobile/api/index.ts` med `?path=`-routing

### Designrevolutionen
- ❌ Lägg till nya sektioner, sidor eller funktioner — visuellt-bara
- ❌ Konsolidera sidor — alla stannar separata
- ❌ Importera nya font-paket
- ❌ Byt palett — pistachio + guld + cream stannar
- ❌ Ta bort befintlig copy
- ❌ Lägg till hårdkodade `#hex` eller `padding: 16` — använd `theme.ts`-tokens

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

### Auth & säkerhet
- Dev-bypass `dev:+PHONE` — bara dev, ALDRIG i production
- Exponera ALDRIG `SUPABASE_SERVICE_ROLE_KEY` i frontend
- Supabase-joins returnerar PascalCase (`Restaurant`) — normalisera till camelCase i API-lagret

## 11. Sessions-logg (kronologisk)

Varje session lägger till en kort post nederst med datum, vad som hände och status. Senast överst i listan.

### 2026-04-27 — kontext-vault skapad + designrevolution-plan godkänd
- Verifierade deploy-flöde end-to-end (Action triggas på push till main, ~3 min build)
- Lärde hård lektion: bundle hash är inte tillförlitlig för deploy-verifiering (minifiering strippar kommentarer) — använd `last-modified`-headern
- Etablerade idle-timeout-regel (sektion 9) — håll strömmen aktiv
- Auditerade hela frontend (3 parallella Explore-agenter) — designsystem-mognad **3/10**, primitives-lager saknas, 250+ hårdkodade designvärden
- Skrev 5-sprint-plan: visuell revolution utan funktion/innehåll/font/palett-ändringar (godkänd av William)
- William svarade på två klargörings-frågor: full scope (5 sprintar), behåll palett höj allt annat
- Skapade denna vault så framtida sessioner får full kontext direkt
- **Nästa:** William har en grej innan autonoma natt-körningen av Sprint 1 startar

---

## Mall för ny session-post (kopiera in)
```
### YYYY-MM-DD — <kort rubrik>
- <vad gjordes>
- <commits eller PRs>
- <eventuella deploy-resultat>
- <state efter sessionen>
- **Nästa:** <vad ska hända i nästa session>
```
