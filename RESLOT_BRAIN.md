# RESLOT_BRAIN.md — Komplett kunskapsbank

> Senast uppdaterad: 2026-04-01
> Denna fil är hjärnan för alla Claude Code-sessioner. Läs den innan du börjar arbeta.

---

## 1. VISION & PRODUKT

### Vad är Reslot?
Reslot är en svensk marknadsplats för restaurangbokningar. Användare som inte kan gå på sin bokning delar den via Reslot, och andra användare kan ta över den med credits. Det minskar no-shows för restauranger och ger matälskare tillgång till fullbokade restauranger.

**Tagline:** "Din genväg till fullbokade restauranger"

**Pitch (30 sek):** "Reslot låter dig dela din restaurangbokning när du inte kan gå — och hitta lediga bord på restauranger som annars är fullbokade. Credits-systemet gör det rättvist: dela en bokning, tjäna credits, använd dem för att ta över någon annans."

### Konkurrentanalys — ResX

| | **Reslot** | **ResX** |
|---|---|---|
| **Bas** | Stockholm, Sverige | New York City, USA |
| **Tagline** | "Din genväg till fullbokade restauranger" | "Good things happen last minute" |
| **Affärsmodell** | Credits-baserad (köp/tjäna credits) | Prenumerationsbaserad (månatlig avgift) |
| **Prissättning** | 39 SEK/credit + 29 SEK serviceavgift per claim | Månadsabonnemang för tillgång |
| **Incitament att dela** | Tjäna 2 credits per delad bokning → cirkulär ekonomi | Begränsat — ingen tydlig belöning för delning |
| **Marknad** | Sverige (Stockholm-first, sen Gbg/Malmö) | USA (NYC-fokus) |

**Reslots konkurrensfördel vs ResX:**
1. **Credits-loopen** skapar en cirkulär ekonomi — användare som delar bokningar tjänar credits, vilket driver tillgång. ResX prenumerationsmodell skapar ingen feedback-loop.
2. **Lägre tröskel** — ingen månatlig bindning, användare betalar bara vid användning (pay-per-use).
3. **Restaurangvänligt** — minskar no-shows direkt, inget restaurangavtal krävs initialt.
4. **Skandinavisk trust** — hög digital tillit i Sverige, verifiering via BankID (framtida), Reslots trust-profiler bygger förtroende.
5. **ResX "Good things happen last minute"** riktar sig mot impulsiva last-minute-användare. Reslot riktar sig mot *planerade* bokningar som faller bort — bredare användningsfall.

### Affärsmodell & intäktsströmmar

| Intäktsström | Beskrivning | Pris |
|---|---|---|
| **Credit-försäljning** | Användare köper credits för att ta över bokningar | 39 SEK/credit |
| **Serviceavgift** | Avgift vid claim av bokning | 29 SEK per claim |
| **No-show-avgift** | Administrationsavgift (10-20%) ovanpå restaurangens avgift | Varierar |

### Credits-ekonomi

| Händelse | Credits |
|---|---|
| Lägg upp en bokning (som tas över) | +2 credits (efter 5 min ångerfrist) |
| Ta över en bokning | -2 credits |
| Bjud in en vän (referral) | +1 credit (båda parter) |
| Köp credits | 39 SEK/credit |
| Startbonus (ny användare via referral) | +1 credit |

### Terminologi — ALLTID konsekvent

| Rätt term | FEL — använd aldrig |
|---|---|
| **credits** / **Reslot credits** | tokens, rewards, poäng |
| **bevakningar** | aviseringar, notifications, alerts (i UI) |
| **bokningar** | reservations (i svenskt UI) |
| **ta över bokning** | claima, hämta, köpa |
| **lägg upp bokning** | dela, posta, submita |

### Ansvarsmodell (juridiskt kritisk)

```
┌────────────────────────────────────────────────────┐
│  BOKNING AKTIV          → Original-bokare ansvarig │
│  BOKNING CLAIMED        → 5 min ångerfrist startar │
│  ÅNGERFRIST PASSERAD    → Claimer ansvarig         │
│  ÅNGERFRIST ÅNGRAD      → Tillbaka till aktiv      │
│  NO-SHOW               → Claimer debiteras         │
└────────────────────────────────────────────────────┘
```

- **Unclaimed:** original-bokare bär fullt ansvar
- **Grace period (5 min):** claimer kan ångra utan kostnad, credits refunderas
- **Efter grace period:** ansvar överförs helt till claimer
- **Stripe pre-authorization:** kort ska valideras vid claim, debiteras bara vid no-show

---

## 2. DESIGNSYSTEM

### 2.1 Färgpalett

#### Primärfärger
| Token | Hex | Användning |
|---|---|---|
| `coral` / `orange` | `#E06A4E` | CTA-knappar, aktiva element, accent |
| `gold` | `#C9A96E` | Credits, premium, VIP |
| `dark` | `#111827` | Primär text, mörka ytor |
| `bg` | `#FAFAF8` | App-bakgrund (varm off-white) |

#### Stödfärger
| Token | Hex | Användning |
|---|---|---|
| `bgCard` | `#FFFFFF` | Kort, ytor |
| `bgInput` | `#F0F0EE` | Input-fält |
| `textSecondary` | `#6B7280` | Sekundär text |
| `grayLight` | `#9CA3AF` | Placeholder, tertiary text |
| `divider` | `rgba(0,0,0,0.07)` | Linjer, separatorer |
| `success` / `green` | `#8B9E7E` | Aktiv status, bekräftelser |
| `successBright` | `#22C55E` | Starkare success (badges) |
| `error` | `#EF4444` | Fel, varningar |
| `warning` | `#F59E0B` | Varningar |
| `info` | `#3B82F6` | Informativa element |

#### Bakgrundsmönster
- **Primär bakgrund:** `#FAFAF8` (varm, skandinavisk)
- **Kort:** `#FFFFFF` med `shadowOpacity: 0.04-0.06`
- **Subtila borders:** `rgba(0,0,0,0.07)` med `0.5px`
- **Accent-bakgrunder:** `rgba(color, 0.10-0.12)` för ikoner och chips

### 2.2 Typografi

**Dual-font system:** Fraunces (serif, display) + Plus Jakarta Sans (sans-serif, body/UI)

> Fraunces ger Reslot unik karaktär — ingen annan matapp har serif-rubriker.
> Installeras via `@expo-google-fonts/fraunces`.

| Stil | Font | Storlek | Vikt | Användning |
|---|---|---|---|---|
| Display | **Fraunces** | 28-32px | 700 Bold | Skärmtitlar, hero-text |
| Title Large | **Fraunces** | 22-26px | 700 Bold | Sektionsrubriker |
| Title Medium | **Fraunces** | 16-18px | 600-700 | Underrubriker, restaurangnamn |
| Body Large | Plus Jakarta Sans | 15-16px | 400 Regular | Brödtext |
| Body Medium | Plus Jakarta Sans | 14px | 400-500 | Sekundärtext |
| Label | Plus Jakarta Sans | 12-13px | 500-600 | Labels, chips, metadata |
| Caption | Plus Jakarta Sans | 10-11px | 500-600 | Sektionstitlar (uppercase) |
| CTA/Buttons | Plus Jakarta Sans | 15-16px | 700 Bold | Knappar, actions |

**Font-familjer:**
- `Fraunces_700Bold` — ALLA rubriker och display-text
- `Fraunces_600SemiBold` — mellannivå serif emphasis
- `PlusJakartaSans_700Bold` — CTA-knappar, bold body
- `PlusJakartaSans_600SemiBold` — mellannivå emphasis
- `PlusJakartaSans_500Medium` — labels, chips
- `PlusJakartaSans_400Regular` — brödtext, input

**Letter-spacing:** -0.8 till -0.2 på Fraunces-rubriker (tightar ihop), 0.4-1.2 på UPPERCASE labels

### 2.3 Spacing-system

| Token | Värde | Användning |
|---|---|---|
| `xs` | 4px | Minimal gap |
| `sm` | 8px | Chip-gap, tight spacing |
| `md` | 16px | Standard padding |
| `lg` | 20-24px | Section padding |
| `xl` | 28-32px | Top padding, stora gaps |
| `xxl` | 48px | Bottom padding, stora sektioner |

**Standarder:**
- Skärm-padding: `paddingHorizontal: 20`
- Kort-padding: `16-20px`
- Kort border-radius: `16-20px`
- Knapp border-radius: `16-28px`
- Ikon-containers: `38-42px` med `borderRadius: 11-12`

### 2.4 Skuggor

```typescript
// Standard kort
shadowColor: "#000"
shadowOffset: { width: 0, height: 1-2 }
shadowOpacity: 0.03-0.06
shadowRadius: 6-12
elevation: 1-3

// Elevated (CTA, modals)
shadowColor: "#000"  // eller accent-färg
shadowOffset: { width: 0, height: 6-8 }
shadowOpacity: 0.15-0.28
shadowRadius: 14-24
elevation: 4-10
```

### 2.5 Animationer (Emil Kowalski-filosofi)

#### Spring-konfiguration
```typescript
// Standard tryck-feedback
onPressIn:  withSpring(0.95-0.97, { damping: 15, stiffness: 300 })
onPressOut: withSpring(1, { damping: 12, stiffness: 200 })

// Entrance animations
FadeInDown.delay(index * 50-80).duration(300-500).springify()
```

#### Principer
1. **Animera funktion, inte dekoration** — varje animation ska kommunicera status eller ge feedback
2. **Spring > timing** — naturliga spring-animationer framför linjära
3. **Staggered entrances** — kaskaderande inträde med delay per element (50-80ms steg)
4. **Haptics = animation** — koppla alltid Haptics.impactAsync till tryck-interaktioner
5. **Micro-interactions på knappar** — scale-down 0.95-0.97 vid press
6. **Smooth scroll-linked** — CTA-opacity/scale kopplad till scroll via useAnimatedScrollHandler
7. **Shake = error** — shakeX-animation med withSequence för felmeddelanden
8. **Progress = delight** — animerade progress-bars med withTiming + easing

#### Haptics-guide
| Interaktion | Feedback |
|---|---|
| Knapp-tryck | `impactAsync(ImpactFeedbackStyle.Light)` |
| CTA/primary action | `impactAsync(ImpactFeedbackStyle.Medium)` |
| Success | `notificationAsync(NotificationFeedbackType.Success)` |
| Error | `notificationAsync(NotificationFeedbackType.Error)` |

---

## 3. ANVÄNDARPSYKOLOGI & KONVERTERING

### 3.1 Trust-byggande element

| Element | Implementation | Status |
|---|---|---|
| **Social proof counter** | "X bokningar delade denna vecka i Stockholm" | Saknas |
| **Restaurang-badges** | Visa kända restauranger | Saknas |
| **Verifieringsmärken** | Grön bock på verifierad email/telefon | I schema (emailVerified, phoneVerified) |
| **Beteendebaserad trust** | Baserat på historik, ej stjärnbetyg | Design beslut |
| **Tydlig ansvarskedja** | Visuellt vem som bär ansvar i varje steg | Delvis (claim-flöde) |
| **"Inga dolda avgifter"** | Tydlig copy: du betalar bara vid no-show | Saknas i UI |

### 3.2 Konverteringspsykologi

| Teknik | Implementation |
|---|---|
| **Scarcity** | "2 bord tillgängliga just nu" + countdown-timer |
| **Urgency** | Timer till avbokningsfönster, pulsande dot |
| **Social proof** | "X personer bevakar denna restaurang" |
| **Prisankring** | "1 credit = 39 kr. Spara genom att dela (gratis credits!)" |
| **Exclusivity** | "Din genväg till fullbokade restauranger" |
| **Loss aversion** | "Du missade" (framtida feature) |
| **Reciprocity** | Referral: "Ni får båda 1 credit" |

### 3.3 Onboarding-recept

Nuvarande implementering (6 steg):

```
1. SPLASH — Animerad restaurang-strip + "Kom igång" / "Utforska"
2. PHONE — Telefonnummer med +46 prefix
3. OTP — 6-siffrig verifieringskod
4. REGISTER — Förnamn + efternamn
5. CITY — Välj stad (Stockholm default)
6. WELCOME — "Välkommen!" + credits-intro
```

**Rekommenderat (MASTERRAPPORT):** Max 3 skärmar innan innehåll. "Skippa"-knapp på varje steg.

### 3.4 Beteendebaserad trust-profil

**Istället för stjärnbetyg** — bygg trust baserat på:
- Antal genomförda bokningar (delat + tagit över)
- No-show-historik
- Tid som medlem
- Verifierad email + telefon

---

## 4. NULÄGE — VAD FINNS / VAD SAKNAS

### 4.1 Skärm-för-skärm status

#### Hem (index.tsx) — ✅ Fungerande
| Feature | Status | Anteckning |
|---|---|---|
| Restaurang-lista med reservationer | ✅ Live | Hämtar från API |
| Dag-picker (14 dagar) | ✅ Live | |
| Stadsväljare | ✅ Live | Stockholm, Göteborg, Malmö, Uppsala |
| Stadsdelfilter | ✅ Live | Per stad |
| Sök-funktion | ✅ Live | TextInput med filter |
| Credits-pill i header | ✅ Live | Visar antal credits |
| FAQ-knapp | ✅ Live | Navigerar till /faq |
| Credits-banner | ✅ Live | "Tjäna gratis credits" |
| Empty state | ✅ Live | |
| Kalenderknapp | ✅ UI | Ingen kalender-modal ännu |
| Countdown-timer (urgency) | ❌ Saknas | Rekommenderat i MASTERRAPPORT |
| Social proof ("X bokningar denna vecka") | ❌ Saknas | |

#### Restaurang-detalj / Claim-flöde ([id].tsx) — ✅ Fungerande
| Feature | Status | Anteckning |
|---|---|---|
| Restauranginfo (namn, betyg, adress) | ✅ Live | |
| Om-sektion med tags | ✅ Live | cuisine, vibe, goodFor, food |
| Bokningsdetaljer | ✅ Live | datum, tid, antal, platstyp |
| Villkor-checkbox | ✅ Live | |
| "Ta över bokning"-knapp | ✅ Live | Anropar claim API |
| Loading/error states | ✅ Live | |
| Dela-knapp | ✅ Live | Share API |
| Instagram/website-länkar | ✅ Live | Öppnar extern länk |
| Kartlänk | ✅ Live | Apple Maps |
| **Credits-kostnad visas EJ** | 🔴 Bugg | Användaren ser ej att det kostar 2 credits |
| **Ångerfrist-info saknas** | 🔴 Bugg | Grace period (5 min) visas ej i UI |
| **Serviceavgift (29 kr) visas ej** | 🟡 Saknas | Borde visas före claim |

#### Lägg upp bokning (submit.tsx) — ✅ Fungerande
| Feature | Status | Anteckning |
|---|---|---|
| Restaurang-sökning | ✅ Live | |
| Datum + tid-picker | ✅ Live | DateTimePicker |
| Antal gäster | ✅ Live | |
| Platstyp (inne/ute/bar) | ✅ Live | |
| Namn på bokning | ✅ Live | |
| Avbokningsavgift | ✅ Live | cancelFee field |
| Förbetalat belopp | ✅ Live | prepaidAmount field |
| Verifieringslänk | ✅ Live | |
| **Avbokningsfönster** | ✅ Live | cancellationWindowHours |
| **Pris per person** | ❌ Saknas | Auto-beräkning baserat på partySize |
| **Bekräftelse-steg** | ❌ Saknas | Direkt submit utan preview |

#### Mina Bokningar (reservations.tsx) — ✅ Fungerande
| Feature | Status | Anteckning |
|---|---|---|
| Segmented control (Upplagda/Övertagna) | ✅ Live | |
| Bokningskort med status | ✅ Live | active, claimed, expired, cancelled |
| Avbryt bokning | ✅ Live | Bara aktiva |
| LoginGate för gäster | ✅ Live | |
| **"grace_period" status visas ej** | 🔴 Bugg | Frontend-type saknar grace_period/completed |

#### Bevakningar (alerts.tsx) — ✅ Fungerande
| Feature | Status | Anteckning |
|---|---|---|
| Aktivitetsflöde | ✅ Live | drop, claim, credit, premium |
| Restaurang-bevakningar | ✅ Live | Lista + ta bort |
| Watches (bevakningar) | ✅ Live | Lista + ta bort |
| Lägg till bevakning | ✅ Live | Modal med restaurangsök |
| Markera som läst | ✅ Live | |
| Push-notiser | ❌ Saknas | Bara in-app alerts |

#### Profil (profile.tsx) — ✅ Fungerande
| Feature | Status | Anteckning |
|---|---|---|
| Namn + avatar | ✅ Live | Klickbar → account-settings |
| Credits-kort med "Köp fler" | ✅ Live | |
| Bokningshistorik (upplagda/övertagna) | ✅ Live | |
| Menyrad: Bjud in vän | ✅ Live | → /invite |
| Menyrad: Betalningar | ✅ Live (stub) | → /payment |
| Menyrad: Kontoinställningar | ✅ Live | → /account-settings |
| Menyrad: Hjälp & Support | ✅ Live (stub) | → /support |
| Menyrad: Logga ut | ✅ Live | |
| LoginGate | ✅ Live | |
| **Credits progress bar (milestones)** | ⚠️ Design-fråga | Bör tas bort — visuell skala 5/10/15/20 är förvirrande |

#### Reslot Credits (credits.tsx) — ✅ Fungerande
| Feature | Status | Anteckning |
|---|---|---|
| Credits-saldo | ✅ Live | Från API |
| "Vad är credits?" förklaring | ✅ Live | |
| Hur det fungerar (tjäna/spendera) | ✅ Live | |
| Köp credits-knapp | ✅ Live (stub) | Haptics men ingen betalning |
| Bjud in en vän | ✅ Live | → /invite |
| Lägg upp en bokning | ✅ Live | → /submit |
| **Faktisk betalningsintegration** | ❌ Saknas | Stripe ej implementerat |

#### Onboarding (onboarding.tsx) — ✅ Fungerande
| Feature | Status | Anteckning |
|---|---|---|
| Splash med animerad restaurang-strip | ✅ Live | 3-kolumners scroll |
| Telefon-inmatning (+46) | ✅ Live | |
| OTP-verifiering (6-siffrig) | ✅ Live | |
| Registrering (för-/efternamn) | ✅ Live | |
| Stadsval | ✅ Live | |
| Welcome-steg | ✅ Live | |
| "Utforska restauranger" (gästläge) | ✅ Live | |
| **Credits-intro saknas** | 🟡 Saknas | Borde visa loop: dela→tjäna→claima |

#### Övriga skärmar
| Skärm | Status | Anteckning |
|---|---|---|
| FAQ (/faq) | ✅ Live | |
| Invite (/invite) | ✅ Live | Referral med unik kod |
| Payment (/payment) | ✅ UI stub | Ingen Stripe-integration |
| Account Settings (/account-settings) | ✅ Live | Edit namn, email, telefon, radera konto |
| Support (/support) | ✅ UI stub | |
| Rewards (/rewards) | ✅ Live | |
| Add Watch (/add-watch) | ✅ Live | |

### 4.2 Backend-status

#### Prisma-schema (SQLite)
| Modell | Status | Anteckning |
|---|---|---|
| Restaurant | ✅ Komplett | Alla fält inkl. lat/lng, tags, city |
| Reservation | ✅ Komplett | Full claim-flow med grace period |
| UserProfile | ✅ Komplett | Credits, referral, soft delete |
| Watch | ✅ Komplett | Bevakningar med restaurang-koppling |
| RestaurantAlert | ✅ Komplett | Per-restaurang notis-preferens |
| ActivityAlert | ✅ Komplett | In-app alerts |
| OtpCode | ✅ Komplett | SMS-verifiering |
| Session | ✅ Komplett | Tokenbaserad auth |

#### API-routes
| Route | Metod | Status | Anteckning |
|---|---|---|---|
| `/api/reservations` | GET | ✅ Live | Filter: city, neighborhood, date |
| `/api/reservations/mine` | GET | ✅ Live | Per telefonnummer |
| `/api/reservations/:id` | GET | ✅ Live | |
| `/api/reservations` | POST | ✅ Live | Submit ny bokning |
| `/api/reservations/:id/claim` | POST | ✅ Live | Claim med credit-deduction |
| `/api/reservations/:id/cancel-claim` | POST | ✅ Live | Ångra inom grace period |
| `/api/reservations/:id/finalize` | POST | ✅ Live | Slutför efter grace period |
| `/api/reservations/:id/cancel` | PATCH | ✅ Live | Avbryt aktiv bokning |
| `/api/profile` | GET/PUT/DELETE | ✅ Live | CRUD profil |
| `/api/alerts` | GET | ✅ Live | Aktivitetsflöde |
| `/api/alerts/read` | POST | ✅ Live | Markera som läst |
| `/api/alerts/restaurant-alerts` | GET/POST/DELETE | ✅ Live | Restaurang-alerts |
| `/api/watches` | GET/POST/DELETE | ✅ Live | Bevakningar |
| `/api/credits/purchase` | POST | ⚠️ Stub | Inkrementerar credits utan betalning |
| `/api/referral/code` | GET | ✅ Live | Generera/hämta referral-kod |
| `/api/referral/use` | POST | ✅ Live | Använd referral-kod |
| `/api/auth/send-otp` | POST | ✅ Live | SMS (Twilio eller dev-log) |
| `/api/auth/verify-otp` | POST | ✅ Live | |
| `/api/restaurants` | GET | ✅ Live | |

#### Kritiska backend-TODOs
- **Stripe integration** — `stripePaymentIntentId` finns i schema men TODO i koden
- **Grace period auto-finalize** — Ingen cron/timer som kallar `/finalize` efter 5 min
- **Push notifications** — Bara in-app alerts, ingen push-service
- **Rate limiting** — Ingen rate limiting på API:er
- **Auth middleware** — Sessions finns men routes saknar auth-guards

### 4.3 Kritiska buggar

| # | Bugg | Allvarlighet | Plats |
|---|---|---|---|
| 1 | **Credits-kostnad visas ej i claim-flödet** — Användaren ser inte att det kostar 2 credits att ta över | 🔴 Kritisk | `restaurant/[id].tsx` |
| 2 | **Ångerfrist (5 min) kommuniceras ej** — Grace period finns i backend men visas aldrig i UI | 🔴 Kritisk | `restaurant/[id].tsx` |
| 3 | **Reservation type saknar grace_period/completed** — Frontend-typen har bara active/claimed/expired/cancelled | 🔴 Bugg | `types.ts:41` |
| 4 | **Serviceavgift (29 kr) visas ej** — Backend räknar ut den men UI visar den inte | 🟡 Viktigt | `restaurant/[id].tsx` |
| 5 | **Credits purchase är en stub** — Ingen Stripe, inkrementerar bara i DB | 🟡 Viktigt | `credits.ts` |
| 6 | **Grace period finaliseras aldrig automatiskt** — Inget cron-jobb eller timer | 🟡 Viktigt | Backend |
| 7 | **Splash visar "16 bord tillgängliga ikväll"** — Hårdkodat, inte live data | 🟡 UX | `onboarding.tsx:377` |

---

## 5. PRIORITERAD BYGGPLAN

### 🔴 Kritiskt — Måste fixas innan lansering

1. **Credits-info i claim-flödet**
   - Visa "Denna bokning kostar 2 credits" tydligt i claim-vyn
   - Visa användarens saldo: "Du har X credits"
   - Om otillräckliga credits → "Köp credits"-knapp istället för "Ta över"

2. **Ångerfrist-kommunikation**
   - Visa "5 minuters ångerfrist" i claim-steget
   - Efter claim: timer som räknar ner ångerfristen
   - Tydlig "Ångra"-knapp under grace period

3. **Fixa Reservation-typen**
   - Lägg till `grace_period` och `completed` i frontend Reservation type
   - Uppdatera reservations.tsx att hantera dessa statusar

4. **Stripe-betalning**
   - Implementera Stripe PaymentIntent vid claim (pre-authorization)
   - Credits-köp via Stripe checkout
   - Webhook för att hantera lyckade/misslyckade betalningar

5. **Grace period auto-finalize**
   - Backend cron/timer som finaliserar claims efter 5 min
   - Eller: client-side timer som anropar `/finalize` endpoint

6. **Auth middleware**
   - Skydda alla user-specifika routes med session-token
   - Validera att user bara kan agera på egna resurser

### 🟡 Viktigt — Snart efter lansering

7. **Push-notiser**
   - Expo Notifications setup
   - Push vid: ny bokning på bevakad restaurang, claim av din bokning, credits utdelade

8. **Serviceavgift i UI**
   - Visa 29 kr serviceavgift i claim-vyn
   - Totalkostnad: "2 credits + 29 kr serviceavgift"

9. **Onboarding credits-intro**
   - Steg efter stadsval: kort animation som visar credits-loopen
   - "Här är din första credit" (om referral)

10. **Social proof**
    - "X bokningar delade denna vecka" på hem-skärmen
    - "X personer bevakar denna restaurang" på restaurang-kort

11. **Urgency-element**
    - Countdown-timer på bokningar nära avbokningsfönstret
    - Pulsande indikator på nya bokningar

12. **Kontoinställningar polish**
    - Verifieringsmärken (grön bock) på verifierad email/telefon
    - Profilbild-upload (kamera-knapp finns redan)

### 🟢 Nice-to-have — Framtid

13. **Kart-vy** — bokningar på karta (TGTG-inspiration, lat/lng finns i schema)
14. **Achievement-badges** — "Delat 10 bokningar!", "Första claim!"
15. **Dynamisk prissättning** — populära restauranger = fler credits
16. **Impact-dashboard** — "Du har hjälpt X restauranger undvika no-shows"
17. **Restaurang-karuseller** — per kategori/stad (Storytel-inspiration)
18. **Spring-animations upgrade** — mer sofistikerade Airbnb-liknande transitions
19. **"Du missade" feature** — notis om missade bokningar
20. **Kalender-modal** — för mer avancerad datumfiltrering

---

## 6. CLAUDE CODE INSTRUKTIONER

### 6.1 Arbetsflöde

1. **Läs RESLOT_BRAIN.md** innan du börjar — den har all kontext
2. **Backend först, frontend sen** — designa API-kontrakt, implementera, testa med cURL, sen frontend
3. **Använd subagents** — `mobile-developer` för React Native, `backend-developer` för Hono API
4. **Test med $BACKEND_URL** — aldrig localhost

### 6.2 Vilka skills att använda

| Situation | Skill |
|---|---|
| Ny skärm / UI-komponent | `frontend-app-design` |
| Expo SDK-modul | `expo-docs` |
| Databas / auth | `database-auth` |
| AI-funktionalitet | `ai-apis-like-chatgpt` |
| Bilder / assets | `upload-assets` |

### 6.3 Designprinciper att ALLTID följa

1. **Färgpalett:** Använd coral (#E06A4E) som primär accent, gold (#C9A96E) för credits, bakgrund #FAFAF8
2. **Font:** PlusJakartaSans — aldrig byt font
3. **Animationer:** Spring-baserade med react-native-reanimated. Staggered FadeInDown med delay. Haptics på alla interaktioner
4. **Komponenter:** Pressable (aldrig TouchableOpacity), SafeAreaView från react-native-safe-area-context
5. **Svensk copy:** Allt UI-text på svenska. Använd korrekt terminologi (se sektion 1)
6. **Cards:** Vita kort med subtila skuggor och 0.5px border. Border-radius 16-20px
7. **Ikoner:** lucide-react-native, strokeWidth 1.5-2.5
8. **Empty states:** Alltid designa empty states med ikon + text + action
9. **Loading states:** ActivityIndicator med coral (#E06A4E)
10. **Error states:** AlertCircle-ikon + tydligt felmeddelande + retry-action

### 6.4 API-mönster

```typescript
// Backend: Alla routes returnerar { data: ... }
return c.json({ data: result });

// Frontend: api.get<T> unwrappar automatiskt
const posts = api.get<Post[]>('/api/posts'); // Returns Post[], not { data: Post[] }

// Errors
return c.json({ error: { message: "...", code: "..." } }, 4xx);
```

### 6.5 Koddisciplin

- **TypeScript strict mode** — alla typer, optional chaining, nullish coalescing
- **NativeWind + inline styles** — NativeWind för layout, inline styles för precision
- **React Query** för all server state — `useQuery`, `useMutation` med queryKey invalidation
- **testID** på alla interaktiva element — kebab-case naming
- **Inga nya paket** utan explicit behov — allt som behövs är redan installerat
- **Env vars:** Backend: `env` från "./env". Mobile: `process.env.EXPO_PUBLIC_BACKEND_URL`

### 6.6 Vanliga fallgropar

| Fallgrop | Lösning |
|---|---|
| CameraView/LinearGradient/Animated + className | Använd `style={}` istället |
| Horisontell ScrollView expanderar | Lägg till `style={{ flexGrow: 0 }}` |
| Tom sträng i JSX-ternary | Använd `null` inte `''` |
| Buffer/Node.js i React Native | Finns inte — använd alternativ |
| Dubbla headers med tabs | Ta bort header från tabs, använd Stack inuti |

---

*Genererad 2026-04-01 för Reslot-projektet. Uppdatera vid betydande förändringar.*
