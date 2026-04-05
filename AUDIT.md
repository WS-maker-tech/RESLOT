# Reslot Codebase & Database Audit

**Date:** 2026-04-04
**Scope:** mobile/src/, backend/src/, backend/prisma/schema.prisma

---

## 🔴 Critical (Must Fix Before Production)

### 1. DEV Auth Bypass Active in All Environments
**backend/src/middleware/auth.ts:22-41**
The `dev:` token prefix bypass (`if (token.startsWith("dev:"))`) runs in **all environments**, including production. Any attacker can impersonate any user by sending `Authorization: Bearer dev:+46XXXXXXXXX`.

**Also duplicated in:** backend/src/routes/auth.ts:26-38

**Fix:** Wrap in `if (env.NODE_ENV === "development")` check.

### 2. Missing Authorization on Alert Deletion
**backend/src/routes/alerts.ts:103-114**
`DELETE /api/alerts/restaurant-alerts/:id` does not verify the alert belongs to the authenticated user. Any authenticated user can delete any alert by ID.

**Fix:** Add ownership check: `if (alert.userPhone !== c.get("userPhone")) return 403`.

### 3. OTP Codes Logged to Console
**backend/src/routes/auth.ts:143**
`console.log(\`[EMAIL VERIFY] Code for ${email}...: ${code}\`)` — OTP codes appear in server logs. In production, this exposes verification codes.

**Fix:** Remove logging or implement actual email delivery.

### 4. PII Exposed on Public Reservation Endpoint
**backend/src/routes/reservations.ts:34-85**
`GET /api/reservations/` is unauthenticated and returns `submitterFirstName`, `submitterLastName`, and other personal data.

**Fix:** Create a public DTO that excludes PII, or require authentication.

### 5. Race Condition in Claim Flow (Double-Spend Risk)
**backend/src/routes/reservations.ts:419-454**
Optimistic locking uses a `version` field, but not all reservation update paths increment the version. Multiple simultaneous claims could succeed if the version check is bypassed.

**Fix:** Ensure ALL reservation updates go through version-checked transactions.

---

## 🟠 High Priority

### 6. CORS Origin Matching is Substring-Based
**backend/src/index.ts:40-44**
`origin.endsWith(".dev.vibecode.run")` allows any subdomain. A subdomain takeover (e.g., `attacker.dev.vibecode.run`) would pass CORS checks.

**Fix:** Strict whitelist of allowed subdomains or env-based configuration.

### 7. Race Condition in Referral Code Generation
**backend/src/routes/referral.ts:22-28**
Non-atomic uniqueness check + insert. Two concurrent requests could generate the same referral code.

**Fix:** Use database unique constraint with retry, or generate within a transaction.

### 8. Grace Period CRON Not Idempotent
**backend/src/index.ts:155-211**
If the cron fires twice for the same reservation, credits could be double-awarded and push notifications double-sent.

**Fix:** Check reservation status before finalizing; add idempotency guard.

### 9. Token Storage in Plain AsyncStorage (Mobile)
**mobile/src/lib/auth-store.ts:52, 56**
Access tokens stored in unencrypted AsyncStorage. On rooted/jailbroken devices, tokens are trivially accessible.

**Fix:** Use `expo-secure-store` for token persistence.

### 10. Silent Error Swallowing Throughout Mobile
Multiple locations catch errors and discard them:
- `mobile/src/app/_layout.tsx:110-133` — push token and auth errors `.catch(() => {})`
- `mobile/src/app/(tabs)/submit.tsx:400-402` — feedback submission fails silently
- `mobile/src/app/onboarding.tsx:164` — clipboard fails silently
- `mobile/src/app/invite.tsx:22-33` — share/clipboard fails silently

**Fix:** At minimum, log errors. For user-facing operations, show feedback.

### 11. No Rate Limiting on Auth Endpoints
**backend/src/routes/auth.ts** — `/api/auth/me`, OTP endpoints have no rate limiting. Vulnerable to brute-force enumeration.

**Fix:** Add rate limiting middleware (e.g., `hono-rate-limiter`).

### 12. Missing Validation on Input Fields
- **backend/src/routes/reservations.ts:176** — `partySize: z.number().int().min(1)` has no upper bound (allows 1,000,000)
- **backend/src/routes/reservations.ts:175** — `reservationTime` not validated against `HH:MM` format
- **backend/src/routes/reservations.ts:183** — `cancellationWindowHours` could be negative
- **backend/src/routes/restaurants.ts:72-76** — `restaurantId` param not UUID-validated

### 13. XSS Risk in extraInfo Sanitization
**backend/src/routes/reservations.ts:212**
`extraInfo.replace(/<[^>]*>/g, "").trim()` — Regex-based HTML stripping is not XSS-safe.

**Fix:** Use `sanitize-html` or `xss` library.

---

## 🟡 Medium Priority

### 14. TypeScript `any` Types
| File | Line | Issue |
|------|------|-------|
| backend/src/routes/auth.ts | 106 | `getPhoneFromToken(c: any)` |
| backend/src/stripe.ts | 231 | `(err as any).payment_intent?.id` |
| backend/src/env.ts | 37 | `error.issues.forEach((err: any) =>` |
| mobile/src/components/HeroSection.tsx | 15 | `heroStyle: any` |
| mobile/src/components/ClaimSection.tsx | 17-18 | `btnStyle: any`, `errorShakeStyle: any` |
| mobile/src/components/Skeleton.tsx | 64 | `width: width as any` |
| mobile/src/lib/api/hooks.ts | 193 | `value: any` in FormAction |
| mobile/src/app/(tabs)/profile.tsx | 95 | `icon: any` in MenuItemProps |

### 15. Stripe Webhook Signature Verified Twice
**backend/src/index.ts:59-89** and **backend/src/routes/credits.ts:218**
Duplicate verification creates maintenance risk — if one is removed, the other may be assumed to exist.

**Fix:** Verify once in middleware, pass validated event to route.

### 16. Stripe Metadata Accessed Without Type Guards
**backend/src/routes/credits.ts:235, 270, 317-318**
`session.metadata` accessed without null checks. If metadata is missing, silent failures occur.

**Fix:** Type-guard metadata: `const { type, phone } = (session.metadata ?? {}) as Record<string, string>`.

### 17. Hardcoded Credit Values Scattered
Credit costs (2 for claim, 1 for referral, 29 service fee) are hardcoded across multiple files.

**Fix:** Create `constants.ts` with all pricing/credit values.

### 18. Sensitive Data in Dev Logs
- **backend/src/routes/reservations.ts:302** — SMS content logged
- **backend/src/routes/auth.ts:143** — OTP codes logged

**Fix:** Gate behind `NODE_ENV === "development"` check.

### 19. Large Components Need Decomposition (Mobile)
- `mobile/src/app/restaurant/[id].tsx` — Hero, booking, claim, grace period all in one file
- `mobile/src/app/(tabs)/submit.tsx` — Form logic, validation, and UI mixed
- `mobile/src/app/(tabs)/(tabs)/index.tsx` — 1000+ line component

### 20. Missing Retry/Error Recovery in Mobile
- `mobile/src/app/credits.tsx:142-146` — No retry button for failed purchases
- `mobile/src/app/payment.tsx:26-31` — refetchCard may fail silently after WebBrowser close
- `mobile/src/lib/api/api.ts:51-53` — JSON parse errors not caught

### 21. No Pagination on List Endpoints
**backend/src/routes/reservations.ts:75-81**
`GET /api/reservations/` returns all active reservations. Will degrade with scale.

**Fix:** Add `skip`/`take` query params with defaults.

### 22. ClaimSection Prop Drilling
**mobile/src/components/ClaimSection.tsx:26-43** — 12 props passed. Consider context or reducer pattern.

### 23. No CSRF Protection
No evidence of CSRF tokens or SameSite cookie configuration across backend routes.

---

## 🟢 Low / Nice to Have

### 24. Dead Code / Unused Exports
| File | Issue |
|------|-------|
| backend/src/stripe.ts:386-415 | `createEscrowPayment()`, `releaseEscrow()`, `refundEscrow()` — throw "not implemented" |
| backend/src/stripe.ts:335-361 | `createCreditsPurchase()` — never called, replaced by checkout session flow |
| mobile/src/lib/useColorScheme.web.ts | Web-only file never imported |
| mobile/src/lib/useClientOnlyValue.web.ts | Web-only file never imported |
| mobile/src/lib/state/example-state.ts | Example file left in codebase |

### 25. Inconsistent API Response Shapes
- `DELETE /api/alerts/restaurant-alerts/:id` returns `{ data: { success: true } }` vs other endpoints returning full objects
- Notifications endpoint mixes `boolean | number` in success field

### 26. Date/Time Parsing Edge Cases
- `mobile/src/app/restaurant/[id].tsx:106` — `reservationTime.split(":").map(Number)` without length check
- `mobile/src/app/(tabs)/reservations.tsx:129-135` — `substring(0, 5)` without length validation
- `mobile/src/app/(tabs)/submit.tsx:341` — `bookingDate.toISOString()` without try/catch

### 27. No Internationalization Infrastructure
All UI strings are hardcoded Swedish. No i18n framework in place for future localization.

### 28. Push Token Partially Logged
**backend/src/push.ts:57, 139** — First 30 chars of push token logged, could correlate users.

### 29. Performance: Zustand Hydration
**mobile/src/app/_layout.tsx:94-102** — Hydration check runs every mount without memoization.

### 30. Performance: AnimatedCreditsCount Timers
**mobile/src/app/(tabs)/profile.tsx:47-75** — Sets up 20+ timers; memory leak risk if component unmounts mid-animation.

---

## 🗄️ Database Schema Review

**File:** backend/prisma/schema.prisma

### Missing Indexes (High Impact)
| Model | Field(s) | Why |
|-------|----------|-----|
| RestaurantAlert | `restaurantId` | FK lookup, no index |
| Watch | `restaurantId` | FK lookup, no index |
| RestaurantAlert | `userPhone` | User's alerts query |
| Watch | `userPhone` | User's watches query |
| Restaurant | `city`, `cuisine`, `neighborhood` | Filter/search queries |
| Session | `phone` | Auth lookups |
| Reservation | `(restaurantId, reservationDate, status)` | "Show unclaimed slots" query pattern |

### Missing Cascade Deletes
**ALL foreign key relations** lack explicit `onDelete` behavior:
- Reservation → Restaurant: orphaned reservations on restaurant delete
- RestaurantAlert → Restaurant: orphaned alerts
- Watch → Restaurant: orphaned watches
- SavedRestaurant → Restaurant: orphaned saves
- NoShowReport → Reservation: orphaned reports
- ReservationReport → Reservation: orphaned reports
- ReservationFeedback → Reservation: orphaned feedback

### Missing Constraints
| Field | Issue |
|-------|-------|
| Reservation.partySize | No min constraint (should be >= 1) |
| Restaurant.rating | No range constraint (0-5) |
| Restaurant.priceLevel | No range constraint (1-4) |
| UserProfile.trustScore | Comment says 1-5 but not enforced |
| UserProfile.credits | Should be >= 0 |
| Reservation.creditCost | Should be > 0 |
| Restaurant.reviewCount | Should be >= 0 |

### Wrong Field Types
| Field | Current | Should Be |
|-------|---------|-----------|
| Reservation.reservationTime | String | DateTime or Time |
| Watch.date | String? | DateTime? |
| Restaurant.tags, vibeTags, goodForTags, foodTags | String (JSON) | Json type or junction tables |
| Watch.filterOptions | String (JSON) | Json type |
| Reservation.status | String | Enum |

### Denormalization Risks
- `Restaurant.timesBookedOnReslot` and `demandMultiplier` — cached counters not updated transactionally with reservations
- `Reservation.creditStatus` and `captureStatus` — parallel state tracking that can desync from Stripe

### Missing Infrastructure
- No audit log table for critical operations (refunds, credits, deletions)
- Soft delete only on `UserProfile` — consider for reservations/reports too
- No `SeatType` enum/table (string used everywhere)
- No `ReservationStatus` enum (comment-documented string values)

---

## ✅ What's Already Good

- **Zod validation** on env vars (backend/src/env.ts) and most route inputs
- **Optimistic locking** on reservation claims (version field)
- **Structured auth middleware** with token extraction pattern
- **TanStack Query** for data fetching with proper query keys
- **Zustand** for auth state with AsyncStorage persistence
- **Expo push notification** infrastructure with batch sending
- **Stripe integration** with proper webhook signature verification
- **Twilio SMS** with dev/prod mode distinction
- **Grace period system** for reservation claims
- **Credit system** with proper Stripe checkout sessions
- **Proper CORS handling** (echoes specific origin, not `*`)
- **Response envelope pattern** (`{ data: ... }`) consistently used
- **Prisma** with good relation modeling and composite indexes on key queries
- **Clean route organization** — separate files per domain (auth, reservations, credits, etc.)
- **Notification system** with push tokens and activity alerts
- **Restaurant caching** layer for Google Places data
