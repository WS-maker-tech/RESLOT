# DJUPANALYS DEL 3: STRIPE, BACKEND & MASTER ACTION PLAN

> Genererad: 2026-04-01
> Analyserade filer: Samtliga i backend/src/, prisma/schema.prisma, alla routes, middleware, stripe.ts

---

## A. STRIPE & BETALFLODE — FULLSTANDIG GRANSKNING

### A1. Pre-authorization — Implementation

| Aspekt | Status | Detalj |
|--------|--------|--------|
| `capture_method: "manual"` | **KORREKT** | stripe.ts:34 — korrekt pre-auth pattern |
| Belopp | **KORREKT** | 29 SEK * 100 = 2900 ore |
| Capture efter grace period | **KORREKT** | reservations.ts:508-513 + cron i index.ts:69-74 |
| Cancel vid angrat claim | **KORREKT** | reservations.ts:438-441 |
| Race condition-skydd | **KORREKT** | Optimistic locking via `version`-falt, reservations.ts:312-337 |
| Cleanup vid lock-fail | **KORREKT** | cancelPreAuth anropas vid OPTIMISTIC_LOCK_FAILED, reservations.ts:398-399 |

**Bedomning: Pre-auth-grundflodet ar valimplementerat.** Capture_method: manual + grace period + optimistic locking ar korrekt arkitektur.

### A2. KRITISKA BRISTER I STRIPE-IMPLEMENTATIONEN

#### BRIST 1: Ingen betalningsbekraftelse fran klienten (KRITISK)
**Fil:** `reservations.ts:294-306`
**Problem:** Backend skapar pre-auth och returnerar `clientSecret`, men det finns **inget steg dar mobilappen bekraftar att kortbetalningen godkands av Stripe**. Flodet ar:
1. Backend skapar PaymentIntent (pre-auth) ✅
2. Backend returnerar clientSecret till mobilen ✅
3. **SAKNAS: Mobilen ska bekrafta betalningen via Stripe SDK (confirmPayment)**
4. **SAKNAS: Backend ska validera att PI-status ar "requires_capture" innan claim genomfors**

**Konsekvens:** Claim genomfors (credits dras, status andras) INNAN Stripe har bekraftat att kortet ar giltigt. Anvandaren kan ha ett ogiltigt kort och anda ta over bokningen.

**Fix:**
```
1. Mobilen anropar Stripe.confirmPayment(clientSecret) efter claim-endpointen
2. Ny endpoint POST /api/reservations/:id/confirm-payment
3. Backend veriferar PaymentIntent-status = "requires_capture"
4. FORST DA andras status till grace_period och credits dras
```

#### BRIST 2: PSD2/SCA-hantering saknas (KRITISK for EU)
**Fil:** `stripe.ts:31-40`
**Problem:** PaymentIntent skapas utan `payment_method`/`customer`. I EU kraver PSD2 Strong Customer Authentication (SCA) for de flesta korttransaktioner. Nuvarande implementation:
- Skapar "naked" PaymentIntent utan kopplad kund
- Ingen `setup_future_usage` for att spara kort
- Ingen hantering av 3D Secure / authentication_required

**Konsekvens:** Manga europeiska kort kommer **avvisas** vid pre-auth. Stripe returnerar `requires_action` men backend hanterar inte detta.

**Fix:**
```
1. Skapa Stripe Customer per anvandare (vid registrering/forsta betalning)
2. Anvand SetupIntent for att registrera kort med SCA
3. Referera customer + payment_method i PaymentIntent
4. Hantera requires_action-status pa klientsidan
```

#### BRIST 3: Webhook saknas for claim-flodets betalningar (HOG)
**Fil:** `credits.ts:62-107` (webhook finns HÄR) vs `reservations.ts` (webhook SAKNAS)
**Problem:** Credits-kop har webhook-hantering for `payment_intent.succeeded`, men claim-flodet har **ingen webhook**. Om Stripe-capturen misslyckas asynkront (t.ex. insufficient_funds vid capture) finns ingen mekanism att hantera detta.

**Konsekvens:** Cron-jobbet (index.ts:70-74) loggar felet men **fortsatter finalisera bokningen anda** — submitter far credits, status blir "completed", men ingen betalning har faktiskt skett.

```typescript
// index.ts:72-74 — PROBLEM: fortsatter trots betalningsfel
if (!captured) {
  console.error(`[CRON] Failed to capture payment for reservation ${reservation.id}`);
  // ... men gor INGET at det — fortsatter till finalize
}
```

**Fix:**
```
1. Om capture misslyckas: satt status till "payment_failed" istf "completed"
2. Lagg till webhook for payment_intent.capture_failed
3. Skapa retry-logik for misslyckade captures
4. Notifiera admin + anvandare vid betalningsfel
```

#### BRIST 4: Stripe-webhook pa fel path (MEDEL)
**Fil:** `index.ts:35` + `credits.ts:62`
**Problem:** Webhook-routen (`/api/credits/webhook`) ligger bakom auth-middleware:
```typescript
app.use("/api/credits/*", authMiddleware); // index.ts:35
```
Stripe webhooks har **ingen auth-token** — de autentiseras via signatur-verifiering. Auth-middleware returnerar 401 innan webhooken ens kors.

**Konsekvens:** Credits-webhooks **fungerar inte i produktion**. Stripe far 401 pa alla webhook-leveranser.

**Fix:** Antingen:
1. Flytta webhook-routen utanfor `/api/credits/` (t.ex. `/api/webhooks/stripe`)
2. Eller exkludera `/api/credits/webhook` fran auth-middleware

#### BRIST 5: Webhook-replay och idempotens saknas (MEDEL)
**Fil:** `credits.ts:82-103`
**Problem:** Ingen kontroll av om samma event redan har processats. Stripe kan skicka samma webhook flera ganger (retry vid timeout).

**Konsekvens:** Anvandaren kan fa dubbla credits vid webhook-replay.

**Fix:**
```
1. Spara processade event-IDs i databasen
2. Kontrollera event.id innan processing
3. Wrappa hela webhook-hanteringen i en transaktion
```

#### BRIST 6: Dev-mode lacker credits utan betalning (LAG, men risk)
**Fil:** `credits.ts:30-47`
**Problem:** Nar `STRIPE_SECRET_KEY` saknas ger dev-mode credits direkt. Om env-variabeln missas i produktion -> gratis credits.

**Fix:** Lagg till explicit `NODE_ENV` check: dev-mode BARA om `NODE_ENV !== "production"`.

### A3. Betalflodets fullstandiga granskning

```
CLAIM-FLODE (nuvarande):
[Anvandare trycker "Ta over"]
  → POST /reservations/:id/claim
  → Backend skapar PaymentIntent (pre-auth 29 SEK)
  → Backend drar 2 credits + andrar status till grace_period  ← PROBLEM: fore betalningsbekraftelse
  → Returnerar clientSecret till mobilen
  → [SAKNAS: Mobilen bekraftar med Stripe SDK]
  → [5 min grace period]
  → Cron capture:ar PI
  → [PROBLEM: Fortsatter aven vid capture-failure]
  → Status → completed, submitter far 2 credits

CREDITS-KOP-FLODE (nuvarande):
[Anvandare trycker "Kop credits"]
  → POST /credits/purchase
  → Backend skapar PI (immediate capture)
  → Returnerar clientSecret
  → [SAKNAS: Mobilen bekraftar med Stripe SDK]
  → [PROBLEM: Webhook blockeras av auth-middleware]
  → Credits ges via webhook
```

---

## B. AUTH & SAKERHET — GRANSKNING

### B1. Sessionhantering

| Aspekt | Status | Detalj |
|--------|--------|--------|
| Token-generering | **SVAG** | `Math.random()` ar INTE kryptografiskt sakert (auth.ts:16-22) |
| Token-langd | OK | 64 tecken |
| Session-livstid | **FOR LANG** | 90 dagar utan token-rotation |
| Session-revokering | OK | Logout raderar session |
| Concurrent sessions | **INGEN GRANS** | Oandligt antal sessions per anvandare |

**Fix prioritet:**
1. Byt `Math.random()` till `crypto.getRandomValues()` eller `crypto.randomUUID()`
2. Implementera token-rotation (ny token vid varje anrop, eller max 30 dagars livstid)
3. Begranra antal aktiva sessions per anvandare (t.ex. max 5)

### B2. OTP-sakerhet

| Aspekt | Status | Detalj |
|--------|--------|--------|
| OTP-generering | **SVAG** | `Math.random()` ar inte kryptografiskt sakert (auth.ts:11) |
| OTP-langd | OK | 6 siffror |
| OTP-livstid | OK | 10 minuter |
| Brute force-skydd | **SAKNAS** | Ingen rate limit pa /send-otp eller /verify-otp |
| Dev bypass | **RISK** | "000000" fungerar utan Twilio — MASTE tas bort i prod |
| Direct-login | **KRITISK** | `/api/auth/direct-login` lat vem som helst logga in utan OTP |

**Fix prioritet:**
1. Rate limit pa /send-otp (max 3 per nummer per 15 min) och /verify-otp (max 5 forsok)
2. Byt Math.random() till crypto i OTP och token-generering
3. Disable direct-login i production (eller ta bort helt)
4. Disable "000000" bypass baserat pa NODE_ENV

### B3. CORS-konfiguration

```typescript
// index.ts:20-26
app.use("*", cors({
  origin: (origin) => origin || "*",  // PROBLEM: ekar ALLA origins
  credentials: true,
}));
```

**Problem:** Returnerar requestens origin som `Access-Control-Allow-Origin`. Med `credentials: true` innebar detta att **vilken webbsida som helst** kan gora autentiserade requests till APIn.

**Fix:** Byt till explicit origin-lista (se CLAUDE.md auth_cors-pattern).

### B4. Ovriga sakerhetsproblem

| Problem | Allvarlighet | Fil | Fix |
|---------|-------------|-----|-----|
| Ingen input-sanitering pa `extraInfo` | MEDEL | reservations.ts:150 | Validera maxlangd, strippa HTML |
| Watch delete utan agarskaps-check | HOG | watches.ts:36-39 | Verifiera `userPhone` matchar |
| Cancel reservation utan agarskaps-check | HOG | reservations.ts:552-575 | Verifiera submitterPhone |
| Cancel-claim utan agarskaps-check | HOG | reservations.ts:411 | Verifiera claimerPhone |
| Profile PUT accepterar emailVerified/phoneVerified | MEDEL | profile.ts:42-43 | Ta bort fran klient-uppdaterbar data |
| Ingen HTTPS-enforcement | MEDEL | index.ts | Lagg till i produktion |

---

## C. CRON-JOBB & BACKGROUND TASKS

### C1. Grace Period Auto-Finalize

**Fil:** `index.ts:57-115`

| Aspekt | Status | Problem |
|--------|--------|---------|
| Intervall | OK | 60 sekunder — rimligt |
| Atomicitet | **DELVIS** | Stripe capture utanfor transaktionen |
| Capture-failure | **KRITISK** | Fortsatter finalisera trots betalningsfel |
| Error handling | OK | try/catch runt hela cron |
| Concurrent runs | **RISK** | Ingen mutex — kan kora parallellt vid lang execution |
| Skalbarhet | **RISK** | `setInterval` i app-processen — funkar inte med flera instanser |

**Fix:**
1. Flytta Stripe capture INUTI transaktionen (eller separera i tva steg)
2. STOPPA finalisering om capture misslyckas
3. Lagg till distributed lock (eller anvand Stripe webhooks istallet)
4. Overvakning: logga varje cron-korning + metrics

---

## D. DATABAS & SCHEMA

### D1. SQLite-begransningar

**Problem:** `prisma/schema.prisma` anvander SQLite (`provider = "sqlite"`). Detta ar **acceptabelt for utveckling** men har produktionsbegransningar:
- Ingen concurrent writes (WAL-mode hjalper men ar inte perfekt)
- Ingen native JSON-typ
- Begransad skalbarhet

**Rekommendation:** Migrera till PostgreSQL (Supabase-plan finns redan i `backend/src/lib/supabase-migration-plan.md`)

### D2. Saknade index

```prisma
// Reservation: Inga index pa frekventa queries
model Reservation {
  // Behover index pa:
  status           // Filteras i ALLA list-queries + cron
  submitterPhone   // Mine-query
  claimerPhone     // Mine-query
  restaurantId     // Filter + join
  reservationDate  // Datum-filter
}
```

**Fix:** Lagg till `@@index([status])`, `@@index([submitterPhone])`, `@@index([claimerPhone])`, `@@index([reservationDate])`.

### D3. Saknade falt i schema

| Falt | Modell | Anledning |
|------|--------|-----------|
| `stripeCustomerId` | UserProfile | For PSD2/SCA — koppla anvandare till Stripe Customer |
| `paymentMethodId` | UserProfile | Spara registrerat kort |
| `captureStatus` | Reservation | Separera payment-status fran booking-status |
| `noShowCount` | UserProfile | Track no-shows for trust score |
| `processedEventIds` | Ny tabell | Idempotens for webhooks |

---

## E. IMPACT x EFFORT MATRIS — ALLA ANALYSER SAMMANSLAGNA

### Forklaring
- **Impact:** Hur kritiskt for lansering (1-5)
- **Effort:** Arbetsinsats (S=<1h, M=1-4h, L=4-8h, XL=8h+)

### KRITISK (Lansering blockerad)

| # | Atgard | Fil(er) | Impact | Effort | Detalj |
|---|--------|---------|--------|--------|--------|
| 1 | **Webhook bakom auth-middleware** | index.ts:35, credits.ts:62 | 5 | S | Stripe webhooks far 401. Flytta till /api/webhooks/stripe |
| 2 | **Claim utan betalningsbekraftelse** | reservations.ts:294-306 | 5 | L | Credits dras fore Stripe bekraftar kortet. Lagg till confirm-steg |
| 3 | **Capture-failure fortsatter finalize** | index.ts:72-74 | 5 | M | Cron finaliserar bokning trots misslyckad betalning |
| 4 | **PSD2/SCA-hantering saknas** | stripe.ts, ny customer-logik | 5 | XL | EU-kort avvisas. Behover Stripe Customer + SetupIntent |
| 5 | **Direct-login i produktion** | auth.ts:78-107 | 5 | S | Vem som helst kan logga in utan verifiering |
| 6 | **CORS ekar alla origins** | index.ts:20-26 | 5 | S | Alla webbsidor kan gora auth-requests |
| 7 | **Token-generering med Math.random** | auth.ts:11, 15-22 | 4 | S | Ej kryptografiskt sakert — forutsagbara tokens |
| 8 | **test@reslot.se fallback** | 5 mobilfiler | 4 | S | Oinloggade anvandare fororenar API-data |

### HOG (Pre-launch fixes)

| # | Atgard | Fil(er) | Impact | Effort | Detalj |
|---|--------|---------|--------|--------|--------|
| 9 | **Agarskaps-check pa delete/cancel** | watches.ts:36, reservations.ts:552 | 4 | S | Vem som helst kan radera andras watches/cancel bokningar |
| 10 | **Rate limit pa OTP** | auth.ts:34-76 | 4 | M | Brute force-risk pa send-otp och verify-otp |
| 11 | **Webhook-idempotens** | credits.ts:82-103 | 4 | M | Dubbla credits vid webhook-replay |
| 12 | **No-show debitering** | Ny logik | 4 | L | Spec kraver 10-20% avgift — saknas helt |
| 13 | **Stripe pa mobilen** | payment.tsx, credits.tsx | 4 | L | Manuell kortinput maste ersattas med Stripe SDK |
| 14 | **Cancel-claim agarskaps-check** | reservations.ts:411 | 4 | S | Verifiera att userPhone === claimerPhone |
| 15 | **Profile PUT: emailVerified/phoneVerified** | profile.ts:42-43 | 3 | S | Klient kan satta sig sjalv som verifierad |
| 16 | **Dev bypass OTP "000000"** | auth.ts:137 | 3 | S | Maste disablas via NODE_ENV check |
| 17 | **Tysta error catches i frontend** | alerts.tsx, account-settings.tsx | 3 | S | Ingen felaterrapportering till anvandare |
| 18 | **useEffect dependency arrays** | 6 mobilfiler | 3 | M | Animationer kan fastna vid re-renders |

### MEDEL (Vecka 1-2)

| # | Atgard | Fil(er) | Impact | Effort | Detalj |
|---|--------|---------|--------|--------|--------|
| 19 | **Databasindex** | schema.prisma | 3 | S | Saknade index pa status, phone, date |
| 20 | **Push-notiser (Expo)** | Ny setup + backend | 4 | L | Bevakningar notifierar inte |
| 21 | **Ansvarsmodell-kommunikation** | restaurant/[id].tsx, faq.tsx | 3 | M | Vem ansvarar nar? Kritiskt juridiskt |
| 22 | **Bokningsbekraftelse-skarm** | Ny skarm | 3 | M | Ingen feedback efter lyckad claim |
| 23 | **Settings-knapp fixa** | profile.tsx:188-201 | 2 | S | "Coming Soon" -> /account-settings |
| 24 | **VIP/Exklusiv-badge bort** | restaurant/[id].tsx:926-947 | 2 | S | Spec sager explicit bort |
| 25 | **Kop credits CTA i profil** | profile.tsx | 2 | S | Saknas — spec kraver det |
| 26 | **Fargbyte coral -> terracotta** | theme.ts + alla filer | 3 | M | #E06A4E -> #C4542A |
| 27 | **Fraunces pa restaurangnamn i lista** | index.tsx | 2 | S | Designidentitet |
| 28 | **deleteWatch/deleteAccount -> api-helper** | hooks.ts | 2 | S | Saknar auth-token |
| 29 | **Credits-text: +2 -> korrekt spec** | credits.tsx | 2 | S | Spec-avvikelse |
| 30 | **FAQ angerfrist 5 min specifikt** | faq.tsx | 1 | S | Spec-avvikelse |

### LAG (Vecka 2-4)

| # | Atgard | Fil(er) | Impact | Effort | Detalj |
|---|--------|---------|--------|--------|--------|
| 31 | **Bryt ut stora skarmkomponenter** | 4 skarmar | 2 | L | onboarding 1821 rader, submit 1791 |
| 32 | **Valj ETT styling-system** | Alla filer | 2 | L | 3 parallella system nu |
| 33 | **ScrollView -> FlatList** | index, alerts | 2 | M | Lazy rendering |
| 34 | **Error Boundary** | _layout.tsx | 2 | S | Ett fel kraschar hela appen |
| 35 | **Memoizera restaurang-filtrering** | alerts.tsx | 2 | S | useMemo + debounce |
| 36 | **Extrahera Skeleton-komponent** | 4 filer | 1 | S | Duplicerad kod |
| 37 | **Ta bort dead code** | mock-data.ts, FAQ_ITEMS | 1 | S | 467 rader oanvand |
| 38 | **Telefonnummer fran query-string** | hooks.ts + backend | 2 | M | Synligt i loggar |
| 39 | **Session token-rotation** | auth.ts, middleware | 2 | M | 90 dagars token utan rotation |
| 40 | **Max sessions per anvandare** | auth.ts | 1 | S | Oandliga concurrent sessions |
| 41 | **Anti-abuse referrals** | referral.ts | 2 | M | Raderade konton kan farma credits |
| 42 | **Chatt-support implementation** | support.tsx | 1 | L | Placeholder utan funktion |
| 43 | **Sparade restauranger** | Ny feature | 2 | M | Spec nammer det |
| 44 | **Bokningshistorik i profil** | profile.tsx | 2 | M | Spec kraver det |
| 45 | **Sittningstyp lunch/middag** | submit.tsx, types | 1 | M | Visar bara inomhus/utomhus |
| 46 | **No-show avgift belopp i UI** | restaurant/[id].tsx, faq.tsx | 1 | S | Vagt "kan debiteras" |
| 47 | **Bildcaching** | index.tsx, [id].tsx | 2 | M | Unsplash-bilder utan cache |
| 48 | **Supabase-migrering** | Hela backend | 3 | XL | SQLite -> PostgreSQL |
| 49 | **Google Places API** | Backend + frontend | 3 | XL | Riktiga restaurangdata |

---

## F. SAMMANFATTNING

### Backend-betyg

| Dimension | Betyg (1-5) | Kommentar |
|-----------|-------------|-----------|
| Stripe-integration | 2/5 | Grundflodet korrekt, men kritiska luckor (SCA, webhook, capture-failure) |
| Auth-sakerhet | 2/5 | Math.random tokens, ingen rate limit, direct-login |
| API-design | 4/5 | Konsistent envelope, bra Zod-validering, tydliga felkoder |
| Databas-schema | 3/5 | Komplett men saknar index och nagra falt |
| Error handling | 2/5 | Capture-failures ignoreras, tysta catches |
| CORS/Sakerhet | 1/5 | Eka alla origins med credentials |
| Cron-jobb | 3/5 | Funkar men inte atomart, ingen distributed locking |
| GDPR-compliance | 4/5 | Bra anonymisering vid radera konto |
| **Totalt** | **2.6/5** | **Fungerande MVP men ej redo for produktion** |

### Slutsats

Backenden har en **solid arkitektonisk grund** — Hono + Prisma + Zod validering + ratt API-patterns. Pre-auth-flodet ar konceptuellt korrekt.

**De kritiska luckorna ar:**
1. Stripe webhook blockeras av auth-middleware (trivial fix)
2. Claim genomfors utan betalningsbekraftelse (designfel)
3. PSD2/SCA-compliance saknas (EU-krav)
4. Auth anvander Math.random och saknar rate limiting
5. CORS ar helt oppet

Dessa maste atgardas fore produktion. Resten ar standard teknisk skuld som kan hanteras iterativt.
