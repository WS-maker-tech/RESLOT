# Reslot Build Progress

## DONE_1 — Grund & Säkerhet (2026-04-01)

### 1. Fraunces font installerad och laddad
- `@expo-google-fonts/fraunces` redan i package.json
- `Fraunces_700Bold` laddas i `_layout.tsx` via `useFonts`
- `FONTS.displayBold` i `theme.ts` pekar på `Fraunces_700Bold`

### 2. Global typografi-sweep: alla rubriker → Fraunces_700Bold
Ändrade från `PlusJakartaSans_700Bold` till `Fraunces_700Bold` på:
- `alerts.tsx` — "Aviseringar" skärmtitel + "Lägg till avisering" modal-titel
- `add-watch.tsx` — "Lägg till bevakning" sidtitel
- `support.tsx` — "Hjälp och support" sidtitel
- `account-settings.tsx` — "Kontoinställningar" sidtitel
- `payment.tsx` — "Betalningar" sidtitel
- `invite.tsx` — "Bjud in en vän" sidtitel + "Dela och få credits" display-rubrik
- `faq.tsx` — "Frågor och svar" sidtitel
- `LoginGate.tsx` — dynamisk title-text

### 3. Auth middleware på alla user-routes

---

## DONE_PDF_FINAL — Business Plan Compliance Sweep (2026-04-03)

Fullständig audit mot Reslot v1 Business Plan. Varje punkt i planen verifierad mot koden.

### Åtgärdade avvikelser:

#### 1. FAQ Q6 — Svar matchar nu business plan exakt
- **Fil:** `mobile/src/app/faq.tsx`
- **Före:** Detaljerat svar om 5 min ångerfrist med specifik info om serviceavgift
- **Efter:** "Ja, så länge du avbokar inom avbokningsfönstret. Efter det gäller restaurangens villkor."

#### 2. Credits: +2 credits vid upplagd bokning (inte +1)
- **Fil:** `mobile/src/app/credits.tsx`
- Business plan: "+2 vid upplagd bokning som tas över"
- Ändrat alla "+1 credit" → "+2 credits" för bokningsuppladdning
- Badge "+1 credit" → "+2 credits"
- Accessibility label uppdaterad
- Backend redan korrekt (awards 2 credits)

#### 3. Support-sidan — Alla svenska tecken fixade (ä, ö, å)
- **Fil:** `mobile/src/app/support.tsx`
- "Hjalp" → "Hjälp", "fragor" → "frågor", "arende" → "ärende"
- "aterommer" → "återkommer", "Ga" → "Gå"
- FAQ-frågor i support-sidan uppdaterade med korrekt svenska
- Common problems-texterna fixade
- Alla accessibility-labels fixade

#### 4. Profilmenyn — Omstrukturerad enligt business plan
- **Fil:** `mobile/src/app/(tabs)/profile.tsx`
- Business plan: "Konto: Bjud in vän, Betalningar, Hjälp, Logga ut"
- **Före:** Två sektioner (Konto + Support & Övrigt) med Kontoinställningar blandat in
- **Efter:** En sektion "Konto" med exakt: Bjud in vän, Betalningar, Hjälp, Logga ut
- Kontoinställningar nås via kugghjulsikonen i headern (redan befintlig)

#### 5. Terminologi — Konsekvent genom hela appen
- ✅ "credits" / "Reslot credits" (INTE tokens/rewards) — verifierat
- ✅ "bokningar" (INTE reservations i UI) — verifierat
- ✅ "bevakningar" (INTE aviseringar) — tab heter "Bevakningar" ✅
- ✅ "ta över bokning" (INTE claima i UI) — verifierat, ingen "claima" hittad
- ✅ "Bord tillgängliga" → "Bokningar tillgängliga" i onboarding

#### 6. Onboarding — "Bord tillgängliga nu" → "Bokningar tillgängliga nu"
- **Fil:** `mobile/src/app/onboarding.tsx`
- Ändrat för att undvika "bord tillgängliga"-formulering

### Verifierat korrekt (ingen ändring behövdes):

- ✅ **FAQ:** Exakt 8 frågor med korrekta svar (Q1-Q5, Q7-Q8 var redan korrekta)
- ✅ **Hem-flöde:** Vänster ?-symbol → FAQ, mitten "Bokningar i Stockholm" med stadsväljare, höger sök + credits-ikon → credits-sidan
- ✅ **Navigation:** Hem | Bokningar | + | Bevakningar | Profil
- ✅ **INTE:** VIP-symbol, "8 bord tillgängliga", "Belöningar tillgängliga"
- ✅ **Credits-ikon** → credits-sidan, **CreditsBanner** → credits-sidan
- ✅ **Restaurangkort (detalj):** Om-sektion med taggar, hemsida, Instagram, karta
- ✅ **Bokning-sektion:** datum, tid, antal, extra info
- ✅ **Villkorscheckbox** + 'Ta över bokning'-knapp (disabled tills godkänt)
- ✅ **Kredittransaktion synlig INNAN claim** (ClaimSection visar kostnad: 2 credits + 29 kr)
- ✅ **5 min ångerfrist** med nedräkning, ångra-knapp
- ✅ **Bokningar-tab:** Aktiv/Övertagen status-badges, separerade sektioner
- ✅ **Lägg upp bokning:** Avbokningsfönster (timmar), kr-symbol, pris/person × antal = totalt auto-beräknas
- ✅ **Profil:** Credits som SIFFRA (animated count-up), bokningshistorik
- ✅ **Kontoinställningar:** Förnamn, efternamn, email, telefon, födelsedag, stad, verifieringsindikator (grön bock), radera konto längst ner
- ✅ **Bevakningar:** Lista bevakningar, lägg till bevakning-knapp
- ✅ **Betalning:** Kortuppgifter-info, "Inga pengar dras enbart av kortuppgifter", info om betalningsansvar
- ✅ **Reslot credits:** 1 credit = 39 kr, förklaring, köp (1/3/5), gratis: bjud in vän (+1), lägg upp bokning (+2)
- ✅ **Bjud in vän:** "Du och din vän får vardera 1 credit", unik kod att kopiera
- ✅ **Hjälp och support:** E-post + feedback-formulär, push-notis när svar
- ✅ **Serviceavgift:** 29 kr vid claim (visas i ClaimSection)
- ✅ **Pengasymbol:** kr genomgående (INTE $)

### Backend compliance:
- ✅ Credits: köps för 39 kr/st
- ✅ +2 credits vid upplagd bokning som tas över
- ✅ -2 credits att ta över
- ✅ Serviceavgift: 29 kr vid claim (Stripe pre-auth)
- ✅ 5 min ångerfrist med auto-finalize cron
- ✅ Referral: +1 credit vardera
- ✅ No-show: 100 kr eller 15% av förbetalt

DONE_PDF_FINAL

---

## DONE_DESIGN_EXCELLENCE — Design Excellence Pass (2026-04-03)

Fullständig designsystem-audit och refaktor av hela appen. Alla skärmar och komponenter uppdaterade för konsekvent typografi, färg, spacing, kort-design och ikonografi.

### 1. Färgpalett — Korrigerad till RESLOT_BRAIN spec

| Token | Före (fel) | Efter (korrekt) |
|---|---|---|
| `coral` | `#7EC87A` (pistachio-grön) | `#E06A4E` (varm korall) |
| `dark` | `#2D2D2D` | `#111827` |
| `bg` | `#FAF8F5` | `#FAFAF8` |
| `textPrimary` | `#2D2D2D` | `#111827` |
| `success` | `#4A8C6B` | `#8B9E7E` |
| `coralLight` | `rgba(126,200,122,0.15)` | `rgba(224,106,78,0.12)` |
| `coralPressed` | `rgba(126,200,122,0.25)` | `rgba(224,106,78,0.22)` |

- Alla CTA-knappar: coral bakgrund + vit text (inte mörk text som med pistachio)
- Badge-färger, tab-bar, splash, error boundary — alla uppdaterade
- DARK_COLORS uppdaterade för nya coral-värden
- Android notification lightColor fixad

### 2. Typografi-hierarki — Fraunces dual-font system implementerat

**Nytt FONTS-objekt:**
- `FONTS.displayBold` = `Fraunces_700Bold` (serif — display/headings)
- `FONTS.displaySemiBold` = `Fraunces_600SemiBold` (serif — sub-headings)
- `FONTS.bold/semiBold/medium/regular` = Plus Jakarta Sans (body/UI)

**Nytt TYPO-system:**
- `display` (30px Fraunces) — hero-text, splash
- `h1` (24px Fraunces) — skärmtitlar
- `h2` (18px Fraunces) — sektionsrubriker
- `h3` (16px Fraunces SemiBold) — underrubriker, restaurangnamn
- `body` (15px PJS) — brödtext
- `bodyMedium` (14px PJS) — sekundärtext
- `label` (13px PJS SemiBold) — labels, metadata
- `caption` (12px uppercase PJS) — sektionstitlar
- `cta` (16px PJS Bold, vit) — CTA-knappar

**Font-laddning:**
- `Fraunces_700Bold` + `Fraunces_600SemiBold` laddas i `(tabs)/_layout.tsx` via `useFonts`
- Splash-skärm: "Reslot" i Fraunces 32px serif

### 3. Ikonografi — Standardiserad strokeWidth

- Nytt `ICON`-objekt i theme.ts: `strokeWidth: 2`, `size: { sm: 16, md: 20, lg: 24 }`
- Alla ikoner normaliserade från blandade 1.5/1.8/2.2/2.5 → konsekvent `2`

### 4. Kort-design & spacing

- Alla kort: `SHADOW.card` + `borderWidth: 0.5` + `borderColor: C.borderLight`
- Restaurangnamn: `FONTS.displaySemiBold` (serif karaktär)
- Kontextuella borders: status-färgade (info/success/error) med `borderWidth: 1`
- Spacing standardiserat till `SPACING.*` tokens

### 5. Färgkonsekvens — 0 hårdkodade hex-värden kvar

**Borttaget (grep-verifierat):**
- `#7EC87A` (pistachio) — 0 träffar
- `#2D2D2D` (old dark) — 0 träffar
- `#FAF8F5` (old bg) — 0 träffar
- `rgba(126,200,122,...)` (old coral) — 0 träffar

### 6. Filer ändrade (25+ filer)

**Foundation:** `theme.ts`
**Layouts:** `_layout.tsx` (root), `(tabs)/_layout.tsx`
**Tab-skärmar:** `index`, `alerts`, `submit`, `profile`, `reservations`
**Komponenter:** `RestaurantCard`, `HeroSection`, `FilterChips`, `DayPicker`, `LoginGate`, `BookingDetails`, `ClaimSection`, `CreditsBanner`, `RestaurantInfo`
**Modal-skärmar:** `credits`, `faq`, `invite`, `payment`, `support`, `account-settings`, `onboarding`, `restaurant/[id]`, `booking-confirmation`, `add-watch`, `map`
**Övrigt:** `notifications.ts`

### Verifiering
- ✅ TypeScript: `npx tsc --noEmit` — 0 fel
- ✅ Grep: alla gamla hex-värden borta
- ✅ Fraunces laddas korrekt i useFonts

DONE_DESIGN_EXCELLENCE

---

## DONE_FINAL_QUALITY — Final Quality Pass (2026-04-03)

Systematisk genomgång av hela kodbasen med TypeScript-verifiering, skärm-för-skärm audit mot RESLOT_BRAIN.md, och buggfixar.

### TypeScript
- ✅ `npx tsc --noEmit` — 0 fel i backend
- ✅ `npx tsc --noEmit` — 0 fel i mobile

### Buggar fixade

#### 1. submit.tsx — Fel antal credits vid uppladdning
- **Rad 486:** "+1 credit" → "+2 credits" (matchar business plan: +2 vid upplagd bokning)

#### 2. onboarding.tsx — Hårdkodade bokningsräknare borttagna
- **Rad 1092-1095:** Städer visade hårdkodade siffror ("142 bokningar", "38 bokningar" etc.) — borttagna
- **Rad 1634:** "47 bokningar delade denna vecka" → "Bokningar delas varje dag" (ej hårdkodat)

#### 3. restaurant/[id].tsx — Ångerfrist-info använde hårdkodade färger
- Grace period-sektionen använde `#1E40AF` och `#3B82F6` istället för designsystemet
- Ändrat till `C.info` från theme.ts för konsekvent färganvändning

#### 4. alerts.ts (backend) — Sample-data borttaget
- GET /api/alerts returnerade fejkade alerts ("Bord frigörs!", "+50 credits!") när användaren hade 0 alerts
- GET /api/alerts/restaurant-alerts returnerade fejkade restaurant-alerts
- Båda returnerar nu korrekt tom array `[]` för nya användare

### Skärm-för-skärm audit (verifierat korrekt)

| Skärm | Status | Notering |
|---|---|---|
| Hem (index.tsx) | ✅ | Korrekta färger, svensk copy, alla states |
| Restaurang/Claim ([id].tsx) | ✅ | Credits-kostnad, ångerfrist, serviceavgift — allt visas |
| Lägg upp (submit.tsx) | ✅ | Fixad credit-info |
| Bokningar (reservations.tsx) | ✅ | Hanterar grace_period + completed status |
| Bevakningar (alerts.tsx) | ✅ | Korrekt terminologi |
| Profil (profile.tsx) | ✅ | Trust-profil, menystruktur |
| Credits (credits.tsx) | ✅ | 39 kr/credit, korrekt ekonomi |
| Onboarding (onboarding.tsx) | ✅ | Fixade hårdkodade siffror |
| FAQ (faq.tsx) | ✅ | Korrekt svenska |
| Invite (invite.tsx) | ✅ | +1 credit vardera |
| Kontoinställningar | ✅ | Korrekt |

### Terminologi — 100% konsekvent
- ✅ "credits" (inte tokens/rewards)
- ✅ "bevakningar" (inte aviseringar/notifications)
- ✅ "ta över bokning" (inte claima)
- ✅ "lägg upp bokning" (inte dela/posta)
- ✅ Alla belopp i kr (inte $)

### Reservation-typer — Komplett
- ✅ types.ts inkluderar: active | claimed | grace_period | completed | expired | cancelled
- ✅ reservations.tsx hanterar alla statusar med korrekt svenska

DONE_FINAL_QUALITY

---

## DONE_HOME_FINAL — Home Screen & RestaurantRow Premium Polish (2026-04-03)

Visuell uppgradering av hemskärmen med fokus på restaurangkort, Du missade-sektionen, social proof och urgency badges.

### 1. RestaurantCard — Premium redesign
- **Bildstorlek:** 84×84 → 100×100px med RADIUS.lg
- **Layout:** Bild först (vänster), content höger — bättre visuell impact
- **Social proof:** "X bevakar" badge som overlay på bilden (Eye-ikon, vit text, semi-transparent svart bakgrund)
- **Save-knapp:** Halvtransparent svart bakgrund istället för vit
- **Info-hierarki:** Namn → Betyg/Cuisine → Adress → Tid/Gäster chips (pill-formade med bakgrund)
- **Urgency badges:**
  - "Idag kl HH:MM" — grön med pulsande dot, bold text, starkare grön (#16A34A)
  - "Xh Ym kvar" — röd med pulsande urgency dot + Flame-ikon, FOMO
- **PulsingUrgencyDot** — snabbare puls (600ms) för brådskande känsla

### 2. Du missade-sektionen — Helt omgjord
- **Sektionsheader:** Flame-ikon i röd bakgrundscirkel + count
- **"Bevaka fler"-knapp:** Solid grön med Eye-ikon
- **MissedBookingCard:** 220px bredd, 130px bildhöjd
- **"Tagen" badge:** Röd med Flame-ikon och vit text
- **CTA-knapp:** "Bevaka liknande" med solid grön bakgrund
- **Djupare skuggor** för mer dimension

### 3. Social proof-räknare — Prominent redesign
- Card-container med TrendingUp-ikon i blå bakgrundscirkel
- Bold siffra + subtitel, ljusblå bakgrund

### 4. "Nya bokningar idag" — Polished
- Subtil grön border, undertitel "Uppdateras löpande"
- Starkare grön räknarbadge (#16A34A)

DONE_HOME_FINAL

---

## DONE_CLAIM_FINAL — Restaurant Page & Claim Flow Premium Polish (2026-04-03)

Fullständig visuell uppgradering av restaurangsidan och hela claim-flödet.

### 1. Hero-bild — Fullbredd & imponerande
- **Höjd:** 280px → 380px — mer dramatisk, immersiv
- **Gradient top:** Starkare (0.45 opacity), djupare fade för header-läsbarhet
- **Gradient bottom:** Cinematic fade (0.55 opacity) med bredare reach
- **Restaurangnamn** visas nu direkt på hero-bilden med text-shadow
- **Hero chips:** Party size + tid + datum — alla med elevation shadow
- **Parallax:** Behållen, anpassad till ny höjd

### 2. Kostnad — Omöjlig att missa
- **Credits-rad:** Highlighted bakgrund med Sparkles-ikon, 18px bold guld text
- **Serviceavgift-rad:** Highlighted bakgrund med CreditCard-ikon, 18px bold text
- **Total-rad:** Svart bakgrund med vit text (20px bold) — sticker ut kraftigt
- **Saldo-rad:** Border + större text (16px), pistachio-färg
- **Kort-border:** Tjockare (1.5px) med guld-accent
- **Shadow:** Uppgraderad till `SHADOW.elevated`

### 3. "Ta över bokning"-knappen — Premium pistachio + svart text
- **Bakgrund:** `C.coral` (pistachio #7EC87A) när aktiv
- **Text:** `C.dark` (#111827) svart — hög kontrast, premium känsla
- **Padding:** 18px vertikal — större tryckyta
- **Shadow:** Pistachio glow (opacity 0.4, radius 24, offset 10)
- **Press-animation:** Scale 0.97 med mjuk spring (damping 14, stiffness 280)
- **Claimed state:** Pistachio bakgrund + svart check + svart text

### 4. Grace period-överlägget — Tydligare
- **Badge:** Pistachio (inte success-grön), starkare glow
- **Countdown ring:** 160×160px (från 144), tjockare border (4px)
- **Progress bar:** 6px tjock (från 4px), pistachio-färg
- **Info-ruta:** Dedikerad card med Shield-ikon, "Gratis ångerrätt" rubrik
- **Knappar omordnade:** "Klar — gå till bokning" (pistachio, primary) FÖRST, "Ångra" UNDER
- **Card:** Bredare (20px margin vs 24), rundare (24px radius), starkare skugga

### 5. Konfetti-animation — Festligare
- **Partiklar:** 30 → 55 — massivare burst
- **Spread:** 70% → 90% bredd — fyller hela skärmen
- **Färger:** 7 → 9 (lade till teal, orange, indigo)
- **Fysik:** 2200ms livstid (vs 1600ms), 720° rotation (vs 360°)
- **Drift:** ±130px X-drift (vs ±90px)
- **Storlek:** Mer variation med mixed former

### 6. Success overlay — Mer celebration
- **Check-cirkel:** 120×120px (från 100), pistachio bakgrund med 30px glow
- **Titel:** 30px (från 26)
- **Ny ångerfrist-badge:** Pistachio pill med Shield-ikon
- **Restaurangnamn:** 22px (från 20)

### Verifiering
- ✅ TypeScript: `npx tsc --noEmit` — 0 fel i restaurant/[id].tsx
- ✅ Alla imports verifierade (Calendar, Shield redan importerade)
- ✅ Pistachio (#7EC87A) + svart text (#111827) på CTA-knappen

DONE_CLAIM_FINAL

---

## DONE_ONBOARD_FINAL — Onboarding Final Polish v2 (2026-04-03)

Steps 2-7 polish (SplashStep untouched). Emil Kowalski design engineering principles.

### 1. Entrance animation system — Differentiated springs
- `enterHeading(delay)`: damping 14, stiffness 130 (punchy for headings)
- `enterContent(delay)`: damping 18, stiffness 140 (smooth for content)
- `enterFromBottom(delay)`: damping 16, stiffness 130 (CTA buttons)
- Replaced all generic `.springify().damping(18)` across steps 2-7

### 2. Stagger timing — Tightened ~25%
- All steps: base delays reduced (80→60, 160→120, 240→180, 300→240)
- CityStep card stagger: 70ms→55ms between cards
- CreditsIntroStep row stagger: 80ms→60ms between rows
- WelcomeStep delays: shortened uniformly (300→200, 420→320, 500→420)

### 3. Critical animation fixes
- **WelcomeStep confetti ring:** scale(0)→scale(0.85) start + separate opacity fade (220ms ease-out)
- **OTP error colors:** Green tints for errors → proper red tints (rgba(239,68,68,...))
- **Checkbox spring:** damping 12→14, stiffness 200→300 (snappier toggle)

### 4. UX polish
- CityStep selection delay: 500ms→350ms
- WelcomeStep button icon: #FFFFFF→#111827 (matches PrimaryButton dark text)
- WelcomeStep social proof: Dynamic city name from user selection
- WelcomeStep accepts `cityName` prop

### Verifiering
- ✅ TypeScript: `npx tsc --noEmit` — 0 errors
- ✅ No scale(0) entrances
- ✅ Error states use red, not green tints
- ✅ SplashStep completely untouched

DONE_ONBOARD_FINAL

---

## DONE_PUSH_NOTIFICATIONS — Push Notifications Full Implementation (2026-04-03)

Push-notiser implementerade från grunden med Expo Push API och backend-integration.

### 1. Schema — pushToken i UserProfile
- `pushToken String?` tillagt i `UserProfile` modellen
- Databas synkad via `prisma db push`

### 2. Backend Push Service (`backend/src/push.ts`)
- `sendPushNotification(token, title, body, data)` — skickar via Expo Push API
- `sendPushToUser(phone, title, body, data)` — slår upp token från DB
- `sendPushToUsers(phones, title, body, data)` — batch-sändning till flera
- Auto-rensning av ogiltiga tokens (DeviceNotRegistered)

### 3. Endpoints
- `POST /api/profile/push-token` — sparar Expo push token (auth required)
- `POST /api/notifications/send` — manuell push-sändning (auth required)

### 4. Push-triggers (automatiska)
| Event | Mottagare | Titel |
|---|---|---|
| Ny bokning på bevakad restaurang | Bevakare | "Ny bokning tillgänglig!" |
| Bevakningsmatch (Watch) | Bevakare | "Bevakningsträff!" |
| Bokning tagen (claim) | Claimer | "Bokning bekräftad — {restaurant}" |
| Bokning tagen (claim) | Submitter | "Din bokning togs över! +2 credits" |
| Grace period påminnelse (1 min kvar) | Claimer | "⏰ 1 minut kvar av ångerfristen" |
| Grace period slutförd | Claimer | "Bokning slutförd" |
| Credits intjänade | Submitter | "Credits intjänade!" |
| Credits köpta (dev) | Köpare | "{N} credits köpta!" |
| Credits köpta (Stripe webhook) | Köpare | "{N} credits köpta!" |
| Betalning misslyckades | Claimer | "Betalning misslyckades" |

### 5. Mobile-integration
- Push token registreras vid app-start OCH vid lyckad auth-verifiering
- Token skickas till `POST /api/profile/push-token` automatiskt
- Notification tap-handler installerad med data-routing
- Foreground notifications visas som alert/banner/sound

### Verifiering
- ✅ TypeScript: 0 fel i backend (`bunx tsc --noEmit`)
- ✅ TypeScript: 0 fel i mobile (`bunx tsc --noEmit`)
- ✅ Prisma schema synkad
- ✅ expo-notifications redan installerat (v0.31.5)

DONE_PUSH_NOTIFICATIONS

---

## DONE_RESX_WINS — ResX Competitive Advantage Features (2026-04-03)

Implementerade alla 6 ResX-konkurrentanalysens vinstmöjligheter.

### 1. Smarta notisfilter på bevakningar
- **Schema:** `filterOptions String?` (JSON) i Watch-modellen
- **Backend:** `watches.ts` accepterar `filterOptions` med Zod-validering
- **Backend:** `matchesWatchFilters()` — kontrollerar tid, veckodag, sällskapsstorlek
- **Backend:** `reservations.ts` — filtrerar watches med `matchesWatchFilters()` innan push
- **Mobile:** `add-watch.tsx` — ny UI med:
  - Tidfilter: Lunch (11–14), Kväll (18–22), Sen kväll (21–00)
  - Veckodagar: 7 runda knappar (Sön–Lör)
  - Sällskapsstorlek: 1–8 chips
- **Mobile:** `alerts.tsx` — filtertaggar visas på varje bevakning (Clock/Calendar/Users ikoner)

### 2. Push-notis deeplink
- **Mobile:** `_layout.tsx` — `onTapped` handler navigerar till `/restaurant/{restaurantId}`
- **Backend:** Alla push-notiser inkluderar `restaurantId` i data-objektet
- Klick på notis → direkt till restaurangsidan, inte startskärmen

### 3. Persistent alerts
- **Verifierat:** Watch-modellen har ingen expiry/TTL — bevakningar lever för alltid
- **Mobile:** "Alltid aktiv"-badge (grön) på varje bevakning i alerts.tsx
- **Mobile:** Info-text i add-watch.tsx: "Bevakningen är aktiv tills du tar bort den"

### 4. Realtidsvalidering av notiser
- **Backend:** CRON-jobbet gör `db.reservation.findUnique()` direkt innan push
- **Backend:** Om status !== "completed" → hoppar över push, loggar warning
- Garanterar att aldrig skicka notis för claimed/expired/cancelled reservationer

### 5. Fördröjd "tagen"-notis
- **Backend:** `reservations.ts` claim-flöde — submitter-push BORTTAGEN från claim-endpointen
- **Backend:** `index.ts` CRON — submitter-notisen "Din bokning togs över" skickas EFTER 5 min grace period
- In-app ActivityAlert skapas fortfarande direkt (för record-keeping)
- Förhindrar prematura notiser innan ångerfrist gått ut

### 6. Discovery-flöde — "Nya på Reslot"
- **Backend:** `GET /api/restaurants/new-on-reslot` — restauranger med 1–3 bokningar & recent activity
- **Mobile:** `useNewOnReslot()` hook
- **Mobile:** `NewOnReslotSection` komponent i hemskärmen
  - Horisontell scroll med 180px kort
  - "Ny"-badge (grön med Sparkles-ikon)
  - Restaurangnamn, betyg, cuisine
  - Tap → navigerar till `/restaurant/{id}`
  - Placerad efter social proof, före "Du missade"

### Verifiering
- ✅ TypeScript: 0 fel backend (`bunx tsc --noEmit`)
- ✅ TypeScript: 0 fel mobile (`bunx tsc --noEmit`)
- ✅ Prisma schema synkat med `db push`
- ✅ Alla push-notiser innehåller `restaurantId` för deeplinks
- ✅ Watch filterOptions JSON-format: `{ timeRange?, weekdays?, partySize? }`

DONE_RESX_WINS

---

## DONE_LIABILITY_UX — Liability Model & Cancellation Flow Clarity (2026-04-03)

Kristallklar ansvarsmodell och avbokningsflöde genom hela appen. Baserat på ResX-research — deras svagaste punkt.

### 1. Restaurangsida — Ansvarsövergång-ruta (INNAN checkbox)
- **Ny komponent:** `liability-transfer-card` — visuell trust-builder
- **Visuell övergång:** Originalbokare → Du (med pil i warning-färg)
- **Ikoner:** Users + Shield, tydlig cirkulär design med färgkodning
- **Text:** "När du tar över bokningen övergår ansvaret för eventuella avbokningsavgifter till dig efter 5 minuters ångerfrist"
- **Placering:** Efter guarantee badge, före error/checkbox — sista info innan beslut
- **Villkorlig:** Visas bara för ej-claimade bokningar

### 2. Grace Period Overlay — Förbättrad klarhet
- **Timer-text:** "Ångra utan avgift" (dynamisk, "Tid ute" vid 0)
- **Subtitle:** "{restaurangnamn} — du har 5 min att ångra"
- **Info-rubrik:** "Ångra inom ångerfristen — inga avgifter"
- **Body:** Utökad med "När ångerfristen löper ut ansvarar du fullt för bokningen"
- **Stor ångra-knapp:** Redan på plats, förtydligad kontext

### 3. Mina Bokningar — Ansvarsstatus på varje bokning
- **`getStatusBadge`:** Nu tar `isSubmitter` parameter
- **Nya statusar:**
  - Aktiv + "Du ansvarar" (för claims)
  - Tillgänglig (för egna upplagda)
  - Under ångerfrist + "5 min att ångra"
  - Bekräftad + "Ansvar överfört"
- **Subtext:** Visas bredvid badge med lägre opacity

### 4. Profil — Ansvarspolicy
- **Ny menyitem:** "Ansvarspolicy" med Shield-ikon i warning-färg
- **Full modal:** 3-stegs förklaring (Ångerfrist → Bekräftad → No-show)
- **Färgkodade steg:** Grön (ångerfrist), orange (bekräftad), röd (no-show)
- **Nyckeltext:** "Vi debiterar dig bara om du inte dyker upp efter att ångerfrist löpt ut"
- **CTA:** "Jag förstår" — dark button

DONE_LIABILITY_UX

---

## DONE_STRIPE_PROD — Stripe Integration Production-Ready (2026-04-03)

Stripe-integrationen uppgraderad till produktionskvalitet med SCA/PSD2-kompatibilitet, Checkout Sessions, och komplett felhantering på svenska.

### 1. Backend: stripe.ts — Produktionsredo betalningslogik

#### Pre-auth vid claim (off_session + sparad betalmetod)
- `createClaimPreAuth` använder nu sparad betalmetod via `getDefaultPaymentMethod()`
- Om kund har sparat kort: `off_session: true` + `confirm: true` — sömlös pre-auth
- Om SCA krävs (authentication_required): returnerar `requiresAction: true` + `clientSecret`
- Fallback: `automatic_payment_methods` om inget kort sparat

#### No-show-avgift (off_session)
- `createNoShowFeeCharge` kräver nu sparad betalmetod (inte `automatic_payment_methods`)
- `off_session: true` + explicit `payment_method` — korrekt för off-session-avgifter
- Returnerar `null` om ingen betalmetod finns

#### Nya funktioner
- `getDefaultPaymentMethod(customerId)` — hämtar kundens sparade kort
- `createSetupIntent(customerId)` — skapar SetupIntent för kortsparande
- `createCardSetupCheckoutSession()` — Stripe Checkout setup-mode (SCA/3DS automatiskt)
- `createCreditsCheckoutSession()` — Stripe Checkout för creditköp (SCA/3DS automatiskt)

### 2. Backend: credits.ts — Checkout Sessions + svenska felmeddelanden

#### Nya endpoints
- `POST /api/credits/purchase` — returnerar `checkoutUrl` (Stripe Checkout)
- `POST /api/credits/setup-card` — Checkout Session setup-mode för kortregistrering
- `GET /api/credits/card-status` — `{ hasCard, cardLast4, cardBrand }`

#### Webhook utökad
- Hanterar `checkout.session.completed` + `payment_intent.succeeded` + `payment_intent.payment_failed`
- Alla felmeddelanden på svenska med `last_payment_error.message`
- Try/catch runt hela event-hanteringen, markerar som processed även vid fel

### 3. Backend: index.ts — Webhook-forwarding fixad
- Verifierar signatur FÖRST, läser raw body EN gång, vidarebefordrar korrekt

### 4. Backend: reservations.ts — Bättre felhantering vid claim
- Try/catch runt `createClaimPreAuth` med svenska felmeddelanden
- Returnerar `stripeRequiresAction` i response

### 5. Mobile: payment.tsx — Kortregistrering via Stripe Checkout
- "Ditt betalkort"-sektion: visar kortstatus eller "Lägg till kort"-knapp
- Öppnar Stripe Checkout i in-app browser (expo-web-browser)
- SCA/3DS hanteras automatiskt

### 6. Mobile: credits.tsx — Credits-köp via Checkout Sessions
- Öppnar Stripe Checkout URL i in-app browser
- Felmeddelanden i röd ruta under köpknapparna

### 7. Mobile: hooks.ts + types.ts
- `useCardStatus(phone)`, `useSetupCard()` — nya hooks
- `CardStatus`, `CheckoutSessionResult`, `CreditsPurchaseResult` — nya typer

### 8. SCA/PSD2-kompatibilitet (EU/Sverige)
- Credits-köp: Stripe Checkout hanterar 3DS automatiskt
- Kortregistrering: Checkout setup-mode sparar kort med SCA-mandat
- Pre-auth vid claim: Off-session med sparad betalmetod
- No-show-avgift: Off-session med sparad betalmetod

### Verifiering
- Backend: `npx tsc --noEmit` — 0 fel
- Mobile: `npx tsc --noEmit` — 0 nya fel (pre-existing i restaurant/[id].tsx)
- Alla Stripe-anrop via Zod-validerad `env.STRIPE_SECRET_KEY`
- Webhook: idempotency via processedEvent, signaturverifiering

DONE_STRIPE_PROD

---

## DONE_FINAL_PASS — Sista polishen (2026-04-03)

### 1. Vita texter på pistachio-knappar → svart #111827
Fixade alla knappar med vit text på pistachio (#7EC87A) bakgrund:
- `reservations.tsx` — "Försök igen"
- `_layout.tsx` — Bevakningar badge-text
- `profile.tsx` — "Försök igen", "Köp credits", kamera-ikon
- `alerts.tsx` — "Försök igen", "Lägg till bevakning" (2 instanser, inklusive Plus-ikon)
- `restaurant/[id].tsx` — "Gå tillbaka"
- `onboarding.tsx` — Huvud-CTA-knapp

### 2. Hårdkodade orangea färger
- Inga hårdkodade orange hex-värden (#E06A4E etc.) hittades
- `C.orange` i onboarding.tsx är alias för `ThemeC.coral` (#7EC87A) — korrekt

### 3. Text-klippning & spacing
- Alla `numberOfLines` har korrekt lineHeight och flex-layout
- Inga klippningsproblem identifierade
- Spacing konsekvent via SPACING-tokens

### 4. "Du missade"-sektionen
- Backend-endpoint `/api/reservations/missed` finns och returnerar data
- MissedBookingsSection renderas korrekt när data finns (conditionell rendering)
- Korrekt placering i hemskärmen efter NewOnReslotSection

### 5. Navigation
- Alla MenuItem-tryck har korrekt onPress med registrerade routes
- Alla routes registrerade i `_layout.tsx`: invite, payment, support, account-settings, credits, faq, add-watch, etc.

### Verifiering
- `npx tsc --noEmit` — 0 fel
- Dev server (localhost:8081) — 200 OK

DONE_FINAL_PASS
