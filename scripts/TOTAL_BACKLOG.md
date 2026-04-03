# TOTAL BACKLOG — KOMPLETT ÅTGÄRDSLISTA
*Genererad: 2026-04-01*
*Baserad på: DJUPANALYS del 1 (Spec/UX), del 2 (Tech), del 2B (Färg/Design), del 3 (Backend/Stripe)*

> **Inget utelämnat.** Varje brist, bugg och förbättringsförslag från samtliga analyser finns här, grupperat per kategori och sorterat i sekventiell fix-ordning (tekniskt blockerande först).

---

## KATEGORI 1: BACKEND / STRIPE (Säkerhet, logik, API)

### Blockerande (måste fixas först — andra fixes beror på dessa)

| # | Åtgärd | Fil(er) | Impact | Effort | Källa |
|---|--------|---------|--------|--------|-------|
| 1 | **Direct-login i produktion** — `/api/auth/direct-login` låter vem som helst logga in utan OTP. Disable via NODE_ENV eller ta bort helt. | `auth.ts:78-107` | 5/5 | S | Del 3 B2 |
| 2 | **CORS ekar alla origins** — `origin: (origin) => origin || "*"` med `credentials: true`. Byt till explicit origin-lista per CLAUDE.md auth_cors. | `index.ts:20-26` | 5/5 | S | Del 3 B3 |
| 3 | **Token-generering med Math.random** — Varken OTP eller session-tokens är kryptografiskt säkra. Byt till `crypto.getRandomValues()`. | `auth.ts:11, 15-22` | 4/5 | S | Del 3 B1 |
| 4 | **OTP-bypass "000000" i prod** — Bypass-koden måste disablas i production. Lägg till `NODE_ENV !== "production"` check. | `auth.ts:137` | 3/5 | S | Del 3 B2 |
| 5 | **Webhook bakom auth-middleware** — Stripe webhooks får 401. Flytta webhook-route till `/api/webhooks/stripe` eller exkludera från auth-middleware. | `index.ts:35`, `credits.ts:62` | 5/5 | S | Del 3 A2 |
| 6 | **Claim utan betalningsbekräftelse** — Credits dras och status ändras INNAN Stripe bekräftar kortet. Lägg till confirm-steg: mobilen bekräftar med Stripe SDK, ny endpoint validerar PI-status. | `reservations.ts:294-306`, `stripe.ts` | 5/5 | L | Del 3 A2 |
| 7 | **Capture-failure fortsätter finalize** — Cron-jobbet finaliserar bokning trots misslyckad betalning. Om capture misslyckas: sätt "payment_failed", stoppa credit-utdelning. | `index.ts:72-74` | 5/5 | M | Del 3 A2 |
| 8 | **PSD2/SCA-hantering saknas** — EU-kort avvisas utan SCA. Stripe Customer per användare, SetupIntent för kortregistrering, hantera `requires_action`. | `stripe.ts`, ny customer-logik | 5/5 | XL | Del 3 A2 |
| 9 | **Rate limit på OTP-endpoints** — Ingen rate limit på /send-otp eller /verify-otp = brute force-risk. Max 3 send per nummer/15 min, max 5 verify-försök. | `auth.ts:34-76, 110-173` | 4/5 | M | Del 3 B2 |
| 10 | **Watch delete utan ägarskaps-check** — Vem som helst med auth kan radera andras watches. Lägg till `where: { id, userPhone: phone }`. | `watches.ts:36-39` | 4/5 | S | Del 3 B4 |
| 11 | **Cancel reservation utan ägarskaps-check** — Verifiera att `submitterPhone === userPhone` innan cancel tillåts. | `reservations.ts:552-575` | 4/5 | S | Del 3 B4 |
| 12 | **Cancel-claim utan ägarskaps-check** — Verifiera att `reservation.claimerPhone === userPhone`. | `reservations.ts:411` | 4/5 | S | Del 3 B4 |
| 13 | **Profile PUT accepterar verifieringsfält** — Klienten kan sätta `emailVerified: true` / `phoneVerified: true`. Ta bort från Zod-schema. | `profile.ts:42-43` | 3/5 | S | Del 3 B4 |
| 14 | **Webhook-idempotens saknas** — Ingen kontroll av processade events. Spara event.id i DB, kontrollera innan processing. | `credits.ts:82-103` | 4/5 | M | Del 3 A2 |
| 15 | **Webhook saknas för claim-flödets betalningar** — Om Stripe-capturen misslyckas asynkront finns ingen mekanism att hantera det. | `reservations.ts`, ny webhook | 4/5 | M | Del 3 A2 |
| 16 | **Dev-mode läcker credits utan betalning** — Om `STRIPE_SECRET_KEY` missas i produktion → gratis credits. Lägg till `NODE_ENV` check. | `credits.ts:30-47` | 3/5 | S | Del 3 A2 |
| 17 | **Input-sanitering på extraInfo** — Validera maxlängd, strippa HTML. | `reservations.ts:150` | 3/5 | S | Del 3 B4 |
| 18 | **Cron-jobb: Stripe capture utanför transaktionen** — Flytta capture inuti transaktionen eller separera i två steg. | `index.ts:57-115` | 4/5 | M | Del 3 C1 |
| 19 | **Cron-jobb: ingen mutex** — Kan köra parallellt vid lång execution. Lägg till distributed lock. | `index.ts:57-115` | 3/5 | M | Del 3 C1 |
| 20 | **No-show debitering saknas** — Spec kräver 10-20% avgift vid no-show med ersättning till originalbokare. | Ny backend-logik + UI | 4/5 | L | Del 1 A1, Del 3 E |
| 21 | **Databasindex saknas** — Lägg till index på: `status`, `submitterPhone`, `claimerPhone`, `reservationDate`, `restaurantId`. | `schema.prisma` | 3/5 | S | Del 3 D2 |
| 22 | **Saknade fält i schema** — `stripeCustomerId`, `paymentMethodId`, `captureStatus`, `noShowCount`, `processedEventIds` (ny tabell). | `schema.prisma` | 3/5 | M | Del 3 D3 |
| 23 | **Session token-rotation** — 90 dagars token utan rotation. Implementera rotation var 7:e dag eller vid varje /me-anrop. | `auth.ts`, `middleware/auth.ts` | 2/5 | M | Del 3 B1 |
| 24 | **Max sessions per användare** — Obegränsat antal concurrent sessions. Begränsa till max 5. | `auth.ts` | 1/5 | S | Del 3 B1 |
| 25 | **Anti-abuse referrals** — Raderade konton kan farma credits. Validera `isDeleted: false`. | `referral.ts` | 2/5 | S | Del 3 E |
| 26 | **Telefonnummer från query-string till headers/body** — `?phone=${phone}` synligt i loggar/analytics. | `hooks.ts` + backend routes | 2/5 | M | Del 2 §6 |

---

## KATEGORI 2: FRONTEND-TECH (TS-fel, lint, prestanda, buggar)

### Kritiska buggar

| # | Åtgärd | Fil(er) | Impact | Effort | Källa |
|---|--------|---------|--------|--------|-------|
| 27 | **test@reslot.se fallback** — 8 ställen defaultar till "test@reslot.se". Ersätt med `enabled: !!phone` i useQuery + LoginGate. | `alerts.tsx`, `profile.tsx`, `index.tsx`, `reservations.tsx`, `_layout.tsx` | 4/5 | S | Del 2 §2 |
| 28 | **Tysta error catches** — `catch (err) { /* silently ignore */ }`. Lägg till felmeddelande via Alert.alert() eller toast. | `alerts.tsx:357`, `account-settings.tsx` | 3/5 | S | Del 2 §2 |
| 29 | **useDeleteWatch/useDeleteAccount → api helper** — Direkt `fetch()` utan auth-token. Migrera till `api.delete()`. | `hooks.ts` | 2/5 | S | Del 2 §3a |
| 30 | **Stripe SDK på mobilen** — Manuell kortinput måste ersättas med `@stripe/stripe-react-native`. PaymentSheet för credits-köp, confirmPayment för pre-auth. | `payment.tsx`, `credits.tsx`, `restaurant/[id].tsx` | 4/5 | L | Del 1 A3, Del 3 E |

### ESLint & Dependencies

| # | Åtgärd | Fil(er) | Impact | Effort | Källa |
|---|--------|---------|--------|--------|-------|
| 31 | **useEffect dependency arrays** — Animerade värden saknas i dependency arrays i 6 filer. Animationer kan fastna vid re-renders. | `alerts.tsx`, `index.tsx`, `profile.tsx`, `reservations.tsx`, `submit.tsx`, `onboarding.tsx` | 3/5 | M | Del 2 §1 |
| 32 | **Oanvända variabler** — `err` (3x i alerts, 1x reservations), `FAQ_ITEMS`/`FAQItem` (index.tsx). | Flera filer | 1/5 | S | Del 2 §1 |

### Arkitektur

| # | Åtgärd | Fil(er) | Impact | Effort | Källa |
|---|--------|---------|--------|--------|-------|
| 33 | **Bryt ut stora skärm-komponenter** — onboarding (1821r), submit (1791r), restaurant/[id] (1482r), index (1412r). Max ~400r/skärm. | 4 skärmar | 2/5 | L | Del 2 §3b |
| 34 | **Extrahera delad Skeleton-komponent** — Identisk SkeletonLine/SkeletonBlock i 4 filer. Flytta till `src/components/Skeleton.tsx`. | `alerts.tsx`, `reservations.tsx`, `profile.tsx`, `index.tsx` | 1/5 | S | Del 2 §3c |
| 35 | **Error Boundary** — Ingen React Error Boundary. Ett fel kraschar hela appen. | `_layout.tsx` | 2/5 | S | Del 2 §3d |
| 36 | **Välj ETT styling-system** — Blandar inline styles (~983), NativeWind className (~80), theme-konstanter. | Alla filer | 2/5 | L | Del 2 §4 |

### Performance

| # | Åtgärd | Fil(er) | Impact | Effort | Källa |
|---|--------|---------|--------|--------|-------|
| 37 | **Memoizera restaurang-filtrering + debounce** — `filter()` körs varje render utan useMemo. | `alerts.tsx:816` | 2/5 | S | Del 2 §5a |
| 38 | **Överdriven useState i home** — 14+ useState-variabler → varje state-ändring triggar re-render av 1400 rader. | `index.tsx` | 2/5 | M | Del 2 §5b |
| 39 | **Saknad memoizering** — Inga `React.memo()` på kort-komponenter, inga `useMemo` på filtrerade listor, `useRestaurants()` saknar `staleTime`. | Flera filer | 2/5 | M | Del 2 §5c |
| 40 | **ScrollView → FlatList** — Listor renderas i ScrollView istället för FlatList. Alla items renderas direkt, inte lazy. | `index.tsx`, `alerts.tsx` | 2/5 | M | Del 2 §5d |
| 41 | **Bildcaching** — Restaurangbilder från Unsplash utan cache. Implementera expo-image eller react-native-fast-image. | `index.tsx`, `restaurant/[id].tsx` | 2/5 | M | Del 2 §5e |

### Styling-inkonsistenser

| # | Åtgärd | Fil(er) | Impact | Effort | Källa |
|---|--------|---------|--------|--------|-------|
| 42 | **Ersätt hardcoded färger med theme-konstanter** — `"rgba(224,106,78,0.1)"` → `C.coralLight`. Magiska tal → `RADIUS.lg`, `SPACING.lg`. | Alla skärmar | 2/5 | M | Del 2 §4 |
| 43 | **StyleSheet.create() används inte** — Ingen stil-optimering. | Alla skärmar | 1/5 | M | Del 2 §4 |
| 44 | **Stilvarningar i SVG-paths** — 18x saknad space efter komma (index.tsx), 28x (submit.tsx). Minifierade/kopierade paths. | `index.tsx:826-827`, `submit.tsx:53-54, 121, 124, 132` | 1/5 | S | Del 2 §1 |

### Cleanup / Dead code

| # | Åtgärd | Fil(er) | Impact | Effort | Källa |
|---|--------|---------|--------|--------|-------|
| 45 | **Ta bort mock-data.ts** — 467 rader, ingen import. Ren dead code. | `mock-data.ts` | 1/5 | S | Del 2 §7 |
| 46 | **Oanvända hooks** — `useReferralCode()` och `useUseReferralCode()` — definierade men aldrig anropade. | `hooks.ts` | 1/5 | S | Del 2 §7 |
| 47 | **Oanvända typer** — `FAQ_ITEMS` och `FAQItem` i index.tsx. | `index.tsx` | 1/5 | S | Del 2 §7 |

### Säkerhet (klientsidan)

| # | Åtgärd | Fil(er) | Impact | Effort | Källa |
|---|--------|---------|--------|--------|-------|
| 48 | **`any`-typer på catch-block** — `catch (err: any)` borde vara `unknown`. | Flera filer | 1/5 | S | Del 2 §6 |
| 49 | **Ingen input-validering i sökfält** — Sökfält skickas direkt utan sanitering. | `index.tsx`, `alerts.tsx` | 1/5 | S | Del 2 §6 |

---

## KATEGORI 3: UX/UI (Design, animationer, text, spec-compliance)

### Spec-avvikelser (affärsmodellen)

| # | Åtgärd | Fil(er) | Impact | Effort | Källa |
|---|--------|---------|--------|--------|-------|
| 50 | **Ansvarsmodell-kommunikation** — Vem ansvarar i olika stadier kommuniceras aldrig. Kritiskt juridiskt. Lägg till tydlig ansvarstext i claim-flödet och FAQ. | `restaurant/[id].tsx`, `faq.tsx` | 3/5 | M | Del 1 A2, D1 |
| 51 | **No-show avgift belopp i UI** — "Kan debiteras vid no-show" — säger inte hur mycket (10-20%). Specificera belopp. | `restaurant/[id].tsx`, `faq.tsx` | 2/5 | S | Del 1 C6, D5 |
| 52 | **Credits-text: +2 → +1 vid uppladdning** — Spec säger +1. Dessutom ges credits NÄR bokningen tas över, inte vid uppladdning. | `credits.tsx:292, 374` | 2/5 | S | Del 1 C1 |
| 53 | **Escrow-princip** — Varken implementerat eller kommunicerat i UI. | UI + backend | 3/5 | M | Del 1 A2 |
| 54 | **Vidareförsäljning av bokningar** — Konceptet finns inte i appen. Spec nämner det. | Ny feature | 2/5 | L | Del 1 A2, B |

### Spec-avvikelser (UI/features)

| # | Åtgärd | Fil(er) | Impact | Effort | Källa |
|---|--------|---------|--------|--------|-------|
| 55 | **Settings-knapp → account-settings** — Kugghjulet visar "Coming Soon"-modal. Account-settings finns redan. | `profile.tsx:188-201` | 2/5 | S | Del 1 C8 |
| 56 | **VIP/Exklusiv-badge bort** — Spec säger explicit att denna ska bort. | `restaurant/[id].tsx:926-947` | 2/5 | S | Del 1 C4 |
| 57 | **Köp credits CTA i profil** — Spec kräver "Köp fler credits"-knapp under credits-card. | `profile.tsx` | 2/5 | S | Del 1 A9 |
| 58 | **Bokningsbekräftelse-skärm** — Ingen feedback efter lyckad claim. Skapa bekräftelse med detaljer, QR/referensnr. | Ny skärm | 3/5 | M | Del 3 E |
| 59 | **Villkorstext vid claim** — "Jag godkänner villkoren" — men villkoren visas inte. Visa faktiska villkor. | `restaurant/[id].tsx:1410-1412` | 2/5 | S | Del 1 C5, C6 |
| 60 | **FAQ ångerfrist 5 min specifikt** — Nämner inte 5-minutersregeln specifikt. | `faq.tsx:44-46` | 1/5 | S | Del 1 A6 |
| 61 | **Bokningshistorik i profil** — Spec kräver upplagda + övertagna direkt i profilen, inte bara via Bokningar-tab. | `profile.tsx` | 2/5 | M | Del 1 A9, C7 |
| 62 | **Sparade restauranger** — Favoritmarkering av restauranger. Spec nämner det. | Ny feature | 2/5 | M | Del 1 B |
| 63 | **Sittningstyp lunch/middag/brunch** — Visar bara inomhus/utomhus. | `submit.tsx`, `restaurant/[id].tsx`, types | 1/5 | M | Del 1 A4 |
| 64 | **Push-notiser (Expo Notifications)** — Bevakningar finns men notifierar inte. | Ny setup + backend | 4/5 | L | Del 1 A5 |
| 65 | **Chatt-support** — Placeholder utan funktion. Implementera riktig chatt eller ta bort. | `support.tsx` | 1/5 | L | Del 1 A14 |
| 66 | **Payment-sida: Stripe istället för manuell input** — Spar-knappen gör ingenting med kortet. Falsk trygghet. | `payment.tsx` | 4/5 | L | Del 1 C2 |
| 67 | **Credits-köp: knappen gör ingenting** — Ger bara haptic feedback, inget köp sker. | `credits.tsx:376-399` | 4/5 | M | Del 1 C3 |

### Kommunikationsproblem

| # | Åtgärd | Fil(er) | Impact | Effort | Källa |
|---|--------|---------|--------|--------|-------|
| 68 | **Ångerfristens konsekvenser otydliga** — Framgår inte vad som händer EFTER att ångerfristen löper ut (ansvar övergår, kort debiteras, credits returneras inte). | `restaurant/[id].tsx` | 2/5 | S | Del 1 D4 |
| 69 | **Credits ges "vid uppladdning" vs "vid övertagande"** — Felaktigt kommunicerat. | `credits.tsx` | 2/5 | S | Del 1 D2 |

---

## KATEGORI 4: DESIGN / FÄRG / TYPOGRAFI (Identitet)

### Färgbyte (Nordic Ember-paletten)

| # | Åtgärd | Fil(er) | Impact | Effort | Källa |
|---|--------|---------|--------|--------|-------|
| 70 | **Primärfärg coral → terracotta** — Byt `#E06A4E` → `#C4542A` genomgående. | `theme.ts` + alla filer med coral | 3/5 | M | Del 2B E |
| 71 | **Textfärg mjukare** — Byt `#111827` → `#2D2D2D` (Airbnb-stil). | `theme.ts` | 1/5 | S | Del 2B E |
| 72 | **Bakgrundsfärg varmare** — Byt `#FAFAF8` → `#FAF8F5`. | `theme.ts` | 1/5 | S | Del 2B E |
| 73 | **Success-färg jordigare** — Byt `#8B9E7E` → `#4A8C6B`. | `theme.ts` | 1/5 | S | Del 2B E |
| 74 | **Restaurangkort pressed-color** — `rgba(224,106,78,0.08)` → `rgba(196,84,42,0.08)`. | Alla relevanta filer | 1/5 | S | Del 2B E |

### Typografi

| # | Åtgärd | Fil(er) | Impact | Effort | Källa |
|---|--------|---------|--------|--------|-------|
| 75 | **Fraunces på restaurangnamn i lista** — Byt från PlusJakartaSans till Fraunces_700Bold 16px. | `index.tsx` RestaurantRow | 2/5 | S | Del 2B F |
| 76 | **Fraunces på sektionsrubriker** — 17-22px Fraunces_700Bold på alla sektionsrubriker. | Alla skärmar | 2/5 | M | Del 2B F |

---

## KATEGORI 5: KONVERTERING / PSYKOLOGI (CRO, flöden)

| # | Åtgärd | Fil(er) | Impact | Effort | Källa |
|---|--------|---------|--------|--------|-------|
| 77 | **Bokningsbekräftelse efter claim** — Ingen positiv feedback-loop efter lyckad claim. Celebrations-skärm med confetti/check. | Ny skärm | 3/5 | M | Del 1, Del 3 |
| 78 | **Onboarding: ingen riktig SMS-verifiering** — Mock OTP. Behöver Twilio-integration. | `onboarding.tsx`, backend | 3/5 | M | Del 1 A15 |
| 79 | **E-post-verifiering saknas** — E-post samlas in men ingen verifieringsmail skickas. | Backend + onboarding | 2/5 | M | Del 1 A15 |

---

## SEKVENTIELL FIX-ORDNING

### Fas 1: Säkerhetskritiskt (blockerar allt annat)
**Åtgärder: #1-5, #10-13, #16-17, #27-28**
Snabba fixes som tar bort de mest akuta säkerhetshålen. Ingen ny feature-logik, bara patchar.

### Fas 2: Stripe-grund (betalningar måste fungera)
**Åtgärder: #5-8, #14-15, #18, #22, #30, #66-67**
Webhook-fix, betalningsbekräftelse, PSD2/SCA, Stripe SDK på mobilen, capture-failure-hantering.

### Fas 3: Auth & Rate Limiting
**Åtgärder: #9, #23-24, #25**
Rate limits på OTP, token-rotation, session-begränsning, anti-abuse.

### Fas 4: Spec-compliance (affärsmodell)
**Åtgärder: #20, #50-54, #58-59, #68-69**
No-show, ansvarsmodell, escrow-kommunikation, bekräftelseskärm, villkorstext.

### Fas 5: Frontend-buggar & ESLint
**Åtgärder: #29, #31-32, #48-49**
Dependency arrays, api-helper-migrering, tysta catches, oanvända variabler.

### Fas 6: UI spec-avvikelser
**Åtgärder: #52, #55-57, #60-61, #63**
Settings-knapp, VIP-badge, credits CTA, FAQ-text, bokningshistorik, sittningstyp.

### Fas 7: Design & Identitet
**Åtgärder: #70-76, #42**
Färgbyte (Nordic Ember), Fraunces-typografi, theme-konstanter.

### Fas 8: Performance & Arkitektur
**Åtgärder: #33-41, #43**
Bryt ut komponenter, FlatList, memoizering, bildcaching, Error Boundary.

### Fas 9: Cleanup & Polish
**Åtgärder: #44-47, #26**
Dead code, oanvända hooks, SVG-stilvarningar, query-string → body.

### Fas 10: Nya features (fas 2)
**Åtgärder: #54, #62, #64-65, #78-79**
Push-notiser, sparade restauranger, vidareförsäljning, chatt-support, SMS/e-post-verifiering.

### Framtida (ej sekventiellt beroende)
- Supabase-migrering (SQLite → PostgreSQL)
- Google Places API (riktiga restaurangdata)
- Kartvy med bokningar
- Dark mode
- Dynamisk prissättning

---

## SAMMANFATTNING

| Kategori | Antal åtgärder |
|----------|---------------|
| Backend/Stripe (säkerhet, logik, API) | 26 |
| Frontend-tech (buggar, lint, prestanda) | 23 |
| UX/UI (design, text, spec-compliance) | 20 |
| Design/Färg/Typografi | 7 |
| Konvertering/Psykologi | 3 |
| **TOTALT** | **79** |

| Prioritet | Antal | Beskrivning |
|-----------|-------|-------------|
| Blockerande (Fas 1-2) | ~25 | Säkerhet + Stripe = kan inte lansera utan |
| Pre-launch (Fas 3-6) | ~25 | Auth, spec-compliance, UI-fixes |
| Design & Polish (Fas 7-9) | ~20 | Färg, typografi, performance, cleanup |
| Framtida features (Fas 10+) | ~10 | Push-notiser, nya features, infrastruktur |
