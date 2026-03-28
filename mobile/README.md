# Reslot

A peer-to-peer marketplace for claiming and submitting last-minute restaurant reservations in Stockholm, Sweden. Inspired by ResX with a Nordic Minimalist design.

## Tech Stack

- **Frontend**: Expo SDK 53, React Native, NativeWind/Tailwind CSS, React Native Reanimated
- **Backend**: Hono, Bun, Prisma (SQLite), Better Auth
- **Design**: Nordic Minimalist light theme with Plus Jakarta Sans typography

## Design System

- **Background**: Off-white `#FAFAF8`
- **Text**: Deep charcoal `#111827`
- **Accent**: Terracotta `#E06A4E` (primary actions)
- **Gold**: `#C9A96E` (premium/tokens)
- **Sage**: `#8B9E7E` (success/secondary)
- **Typography**: Plus Jakarta Sans (400, 500, 600, 700)

## App Structure

### Onboarding Flow (9 screens)
First-time users see a complete login/onboarding flow stored via AsyncStorage:
1. **Splash/Welcome** - Dark bg, Reslot logo, restaurant grid, "Kom igång" CTA
2. **Phone Login** - Swedish flag +46 prefix, SMS terms checkbox
3. **OTP Verification** - 6-digit code with dash separator (3-3 format)
4. **Registration** - First/Last/Email form with terms checkbox
5. **Onboarding 1: Hitta bord** - Feature walkthrough with mock feed
6. **Onboarding 2: Dela bokning** - Submission feature walkthrough
7. **Onboarding 3: Tjäna poäng** - Rewards/tokens walkthrough
8. **Welcome** - Elegant gold welcome screen with Reslot branding
9. **Choose City** - Select home city (Stockholm/Göteborg/Malmö/Uppsala)

Auth state persisted in `src/lib/auth-store.ts` using Zustand + AsyncStorage.

### Screens (Tab Navigation)
1. **Home ("The Drop")** - Feed of available restaurant reservations with exclusive VIP drops, cuisine filters, and claim buttons
2. **Search** - Search by restaurant name, cuisine, or neighborhood with area filter chips
3. **Submit** - Multi-step form to submit a reservation (Restaurant > Details > Verify with BankID)
4. **Alerts** - Notification feed for new drops, claims, token earnings, and premium offers
5. **Profile** - User profile with token balance, stats, premium upgrade CTA, and settings

### Features
- Token system for claiming/submitting reservations
- VIP/Premium tier with exclusive drops (champagne/gold styling)
- BankID verification mock toggle
- Animated splash screen with tagline
- Haptic feedback on interactions
- Spring animations on cards and buttons

## Mock Data

Located in `mobile/src/lib/mock-data.ts` — includes 8 Stockholm restaurants (Frantzén, Babette, Punk Royale, Ekstedt, etc.), user profile, alerts, and filter options.
