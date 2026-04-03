# Reslot — Din genväg till fullbokade restauranger

Reslot är en svensk marknadsplats för restaurangbokningar. Dela din bokning när du inte kan gå — hitta lediga bord på restauranger som annars är fullbokade.

## Arkitektur

### Mobile (Expo React Native)
- **Port:** 8081
- **Plats:** `/mobile`
- **Stack:** Expo SDK 53, React Native 0.76.7, React Query, Zustand, NativeWind, Reanimated v3
- **Fonter:** Fraunces (serif, rubriker) + Plus Jakarta Sans (body/UI)
- **Ikoner:** lucide-react-native

### Backend (Hono + Bun)
- **Port:** 3000
- **Plats:** `/backend`
- **Stack:** Hono, Bun, Prisma ORM, SQLite (Supabase PostgreSQL i fas 2)
- **Auth:** OTP-baserad (telefonnummer + verifieringskod)

---

## Features

### Credits-system
- Ta över en bokning: **2 credits**
- Dela en bokning (som tas över): **+2 credits**
- Bjud in en vän (referral): **+1 credit** (båda parter)
- Köp credits: **39 SEK/credit**
- Serviceavgift: **29 SEK** per claim

### Onboarding
- Animerad splash med restaurang-strip (18 Stockholmsrestauranger)
- Telefon-inmatning (+46 prefix)
- OTP 6-siffrig verifiering
- Registrering (namn)
- Stadsval (Stockholm, Göteborg, Malmö, Uppsala)
- Welcome med credits-intro
- Gäst-läge ("Utforska utan konto")

### Hem-skärm
- Restaurang-lista med aktiva bokningar
- Dag-picker (14 dagar framåt)
- Stadsväljare + stadsdelfilter
- Sök-funktion
- Credits-pill i header
- Pull-to-refresh

### Restaurang/Claim-flöde
- Hero-bild (fullbredd, 280px)
- Bokningsdetaljer (datum, tid, antal, platstyp)
- Credits-kostnad + saldo
- Serviceavgift synlig
- Ångerfrist-info (5 minuter)
- Bekräftelseanimation (konfetti)
- Villkor-checkbox
- Dela-knapp, Instagram/website-länkar, kartlänk

### Lägg upp bokning
- Restaurang-sökning
- Datum + tid-picker
- Antal gäster + platstyp
- Namn på bokning
- Avbokningsavgift + förbetalat belopp
- Verifieringslänk
- Avbokningsfönster (timmar)

### Mina bokningar
- Segmented control (Upplagda/Övertagna)
- Status-badges: Aktiv, Under ångerfrist, Övertagen, Avbokad
- Avbryt bokning (bara aktiva)

### Bevakningar
- Aktivitetsflöde (drop, claim, credit, premium)
- Restaurang-bevakningar (lista + ta bort + lägg till)
- Markera som läst

### Profil
- Namn + avatar
- Credits-kort med "Köp fler"
- Bokningshistorik
- Bjud in vän (referral med unik kod)
- Kontoinställningar (redigera namn, email, telefon)
- Logga ut

### Övriga skärmar
- FAQ
- Credits-skärm (saldo, förklaring, köp, historik)
- Betalningar (stub)
- Support (stub)
- Rewards
- Lägg till bevakning

---

## API-endpoints

| Route | Metod | Beskrivning |
|-------|-------|-------------|
| `/api/reservations` | GET | Lista aktiva bokningar (filter: city, neighborhood, date) |
| `/api/reservations/mine` | GET | Användarens bokningar |
| `/api/reservations/:id` | GET | Enskild bokning |
| `/api/reservations` | POST | Lägg upp ny bokning |
| `/api/reservations/:id/claim` | POST | Ta över bokning (2 credits) |
| `/api/reservations/:id/cancel-claim` | POST | Ångra inom grace period |
| `/api/reservations/:id/finalize` | POST | Slutför efter grace period |
| `/api/reservations/:id/cancel` | PATCH | Avbryt aktiv bokning |
| `/api/profile` | GET/PUT/DELETE | CRUD profil |
| `/api/alerts` | GET | Aktivitetsflöde |
| `/api/alerts/read` | POST | Markera som läst |
| `/api/alerts/restaurant-alerts` | GET/POST/DELETE | Restaurang-alerts |
| `/api/watches` | GET/POST/DELETE | Bevakningar |
| `/api/credits/purchase` | POST | Köp credits |
| `/api/referral/code` | GET | Generera/hämta referral-kod |
| `/api/referral/use` | POST | Använd referral-kod |
| `/api/auth/send-otp` | POST | Skicka OTP via SMS |
| `/api/auth/verify-otp` | POST | Verifiera OTP |
| `/api/restaurants` | GET | Lista restauranger |

Alla API-svar följer envelope-mönstret: `{ data: ... }`

---

## Databasmodeller (Prisma)

- **Restaurant** — namn, adress, betyg, tags, stad, lat/lng
- **Reservation** — fullständig claim-flow med grace period, optimistic locking
- **UserProfile** — credits, referral, soft delete
- **Watch** — bevakningar med restaurang-koppling
- **RestaurantAlert** — per-restaurang notis-preferens
- **ActivityAlert** — in-app alerts
- **OtpCode** — SMS-verifiering
- **Session** — tokenbaserad auth
- **NoShowReport** — no-show-rapportering med bevis

---

## Designsystem

- **Primär:** Coral `#E06A4E` (CTA, actions)
- **Gold:** `#C9A96E` (credits, premium)
- **Bakgrund:** `#FAFAF8` (varm off-white)
- **Text:** `#111827` (primär), `#6B7280` (sekundär)
- **Success:** `#8B9E7E`
- **Animationer:** Spring-baserade (react-native-reanimated), haptics på alla interaktioner
- **Fonter:** Fraunces 700 (rubriker) + Plus Jakarta Sans (body)

---

## Setup

### Krav
- Bun (runtime)
- Node.js 18+

### Backend
```bash
cd backend
bun install
bunx prisma generate
bunx prisma db push
bun run dev
```

### Mobile
```bash
cd mobile
bun install
bun run start
```

### Miljövariabler

**Backend** (`backend/.env`):
```
PORT=3000
NODE_ENV=development
BACKEND_URL=http://localhost:3000
```

**Mobile** (`mobile/.env`):
```
EXPO_PUBLIC_BACKEND_URL=http://localhost:3000
```

---

## Roadmap (Fas 2)

- [ ] Supabase PostgreSQL-migrering (se `backend/src/lib/supabase-migration-plan.md`)
- [ ] Google Places API-integration (se `backend/src/lib/google-places-plan.md`)
- [ ] Stripe Connect (pre-auth vid claim, credits-köp)
- [ ] Push-notiser (Expo Notifications)
- [ ] Grace period auto-finalize (cron job)
- [ ] Rate limiting
- [ ] Kart-vy för bokningar
