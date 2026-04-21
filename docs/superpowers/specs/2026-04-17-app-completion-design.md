# App Completion Design — 2026-04-17

## Goal
Make the Reslot app practically complete: no dead links, all screens functional, phone OTP working, payment escrow flow working end-to-end in dev simulation, backend seeded with realistic data.

## Out of scope
- Email/password auth (leave TODO in onboarding, don't implement)
- Email verification OTP
- Live Stripe keys / Stripe Connect
- App Store submission

---

## Spår 1 — Critical Path (Auth → Hem → Claim → Betala)

### 1.1 Telefon-OTP (Onboarding)
- Remove dev-only phone number shortcut from onboarding UI if visible to users
- Ensure phone OTP flow completes: enter number → receive SMS → enter code → land on home
- Backend `dev:+46XXXXXXXXX` bypass stays for testing
- Supabase phone auth must be configured (anon key must have phone provider enabled)
- After OTP success: profile auto-created via `/api/auth/me`, user lands on `/(tabs)/index`

### 1.2 Hem-flöde
- All reservation cards load from `/api/reservations`
- City selector works (Stockholm default)
- Search + filter chips functional
- Tapping a card → `restaurant/[id]` with full detail

### 1.3 Claim-flöde
- "Ta över bokning" button in `restaurant/[id]` triggers claim
- Terms checkbox must be checked before button is active
- POST `/api/reservations/:id/claim` → pre-auth PaymentIntent (29 SEK, dev simulation)
- 5-min grace period shown in UI with countdown
- After grace: finalize called automatically → credits awarded to submitter
- Cancel within grace: cancel-claim endpoint called

### 1.4 Betala (dev simulation)
- `/payment` screen shows card setup UI
- In dev mode: card setup returns fake `dev_seti_*` ID, saves to profile
- Credits purchase: `/credits` screen → "Köp credits" → POST `/api/credits/purchase` → dev mode auto-grants credits
- Card status (`/api/credits/card-status`) checked before allowing claim

---

## Spår 2 — Secondary Screens (all buttons connected)

### Screens to audit and fix:
| Screen | Issues to fix |
|--------|--------------|
| `profile.tsx` | Verify all menu items navigate correctly: Kontoinställningar, Bevakningar, Bjud in vän, Betalningar, Hjälp, Logga ut |
| `account-settings.tsx` | Form submits to PUT /api/profile, success feedback shown |
| `credits.tsx` | Shows real credit count, purchase flow works in dev |
| `invite.tsx` | Shows real referral code from GET /api/referral/code, copy/share works |
| `faq.tsx` | All FAQ items expand/collapse, "Kontakta support" → support screen |
| `support.tsx` | Chat sends to POST /api/support/chat, graceful fallback if OpenRouter not configured |
| `alerts.tsx` | Lists bevakningar and alerts from API, "Lägg till bevakning" → add-watch.tsx |
| `add-watch.tsx` | Form submits to POST /api/watches, success navigates back |
| `reservations.tsx` | Upplagda + Övertagna tabs load real data, feedback button → feedback.tsx |
| `feedback.tsx` | Submits to POST /api/reservations/:id/feedback |
| `booking-confirmation.tsx` | Shown after successful claim with correct reservation data |
| `submit.tsx` | Full form submission to POST /api/reservations works |
| `map.tsx` (tab) | Map loads with Mapbox token, restaurant pins work |
| `+not-found.tsx` | 404 page has working "Tillbaka till hem" button |

### Navigation completeness rules:
- Every "Stäng" / "Tillbaka" button must pop the stack
- No screen should be a dead end (always a way back)
- Loading states shown while data fetches
- Error states shown when API fails (not blank screens)

---

## Spår 3 — Backend + Supabase

### 3.1 Seed script
File: `backend/scripts/seed.ts`
- 10 Stockholm restaurants with realistic data (namn, adress, kök, prisklass, tags)
- 20 active reservations spread across restaurants (mix of dates, party sizes, prepaid/free)
- 2 test users with profiles, credits, watches
- Run with: `bun run seed`

### 3.2 Endpoint health check
- All 24 endpoints verified to return correct shapes in dev mode
- No unhandled exceptions on missing optional env vars
- Dev simulation responses match production shapes exactly

### 3.3 Env var documentation
- `.env.example` files for both mobile and backend with all required vars documented
- Mobile: EXPO_PUBLIC_BACKEND_URL, EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_MAPBOX_TOKEN
- Backend: all vars in `backend/src/env.ts` documented with examples

---

## Execution order

1. **Parallel batch 1** (independent):
   - Agent A: Spår 1 (critical path screens + backend endpoints)
   - Agent B: Spår 2 secondary screens audit + fixes
   - Agent C: Spår 3 seed script + env docs

2. **Sequential final pass**: integration test critical path end-to-end

---

## Done criteria
- No screen has a button that does nothing or crashes
- Phone OTP flow completes from start to home
- Claim flow pre-auths in dev simulation and shows confirmation
- Credits purchase grants credits in dev mode
- Seed script populates realistic data with `bun run seed`
- All navigation has a back path
