# Reslot - Restaurant Reservation Marketplace

A beautiful React Native app for sharing and claiming restaurant reservations in Stockholm.

##  Architecture

### Frontend (Expo React Native)
- **Port**: 8081
- **Location**: `/mobile`
- **Framework**: Expo SDK 53, React Native 0.76.7
- **State Management**: React Query + Zustand
- **Styling**: Nativewind (Tailwind CSS for React Native)
- **Animations**: React Native Reanimated v3

### Backend (Hono)
- **Port**: 3000
- **Location**: `/backend`
- **Framework**: Hono with Bun
- **Database**: Prisma ORM with SQLite
- **Authentication**: Better Auth (configured for user profiles)

---

##  Features Implemented

### ✅ Complete Backend
- **Database Schema** (Prisma):
  - Restaurant (8 seed restaurants from Stockholm)
  - Reservation (listings that users submit and claim)
  - UserProfile (user info and tokens)
  - RestaurantAlert (user subscriptions to restaurants)
  - ActivityAlert (notifications)

- **API Routes**:
  - `GET /api/restaurants` - List all restaurants
  - `GET /api/reservations` - List active reservations (with filters)
  - `POST /api/reservations` - Submit a new reservation
  - `POST /api/reservations/:id/claim` - Claim a reservation (awards 2 tokens)
  - `GET /api/profile` - Get/create user profile
  - `PUT /api/profile` - Update profile
  - `GET /api/alerts` - Get activity alerts
  - `GET /api/alerts/restaurant-alerts` - Get restaurant subscriptions
  - All responses wrapped in `{ data: ... }` envelope

### ✅ Frontend Screens Connected to Real Backend

1. **Home Screen** (`/(tabs)/index.tsx`)
   - Fetches real reservations from `/api/reservations`
   - Displays restaurant info + booking details
   - Filtering by city/neighborhood
   - Loading/error states

2. **My Reservations** (`/(tabs)/reservations.tsx`)
   - Fetches user's submitted and claimed reservations
   - Ability to cancel own submissions
   - Shows status and tokens earned

3. **Alerts & Notifications** (`/(tabs)/alerts.tsx`)
   - Activity alerts (new drops, claimed, tokens earned)
   - Restaurant subscription management
   - Add/remove restaurant alerts

4. **Profile** (`/(tabs)/profile.tsx`)
   - Displays user data (tokens, reservations count, rewards)
   - Animated progress bar for rewards
   - Account menu items
   - Logout functionality

5. **Submit Reservation** (`/(tabs)/submit.tsx`)
   - Beautiful 7-step form flow
   - Collects: restaurant, seat type, date/time, name, fees, verification
   - Connected to `/api/reservations` POST endpoint
   - Success screen after submission

6. **Rewards** (`/rewards.tsx`)
   - Token balance with animated progress bar and milestone diamonds
   - Ways to earn tokens: submit a reservation, refer a friend
   - Buy tokens section (1 token = 39 SEK service fee)
   - Accessible from home screen banner and profile card

### ✅ UI/Design
- Light theme with cream background (#FAFAF8)
- Orange accent color (#E06A4E), green (#8B9E7E), gold (#C9A96E)
- Nativewind styling + Reanimated animations
- Beautiful cards with shadows and rounded corners
- Smooth FadeInDown/FadeInUp animations
- PlusJakartaSans font family

---

## Running the App

### Development
The app runs automatically in development mode:
- **Frontend**: http://localhost:8081
- **Backend**: http://localhost:3000

Just refresh the Vibecode app to see changes.

### Viewing
Open the **Vibecode App** to view the mobile app live.

---

##  API Usage

All API responses follow the envelope pattern:
```json
{ "data": {...} }
```

The frontend API client (`mobile/src/lib/api/api.ts`) auto-unwraps this, so just type the inner value:
```typescript
const reservations = await api.get<Reservation[]>('/api/reservations');
// Returns Reservation[], not { data: Reservation[] }
```

---

## Database

SQLite database is at `/backend/prisma/dev.db`

Seed data includes:
- 8 Stockholm restaurants (Frantzén, Babette, Ekstedt, Oaxen Krog, etc.)
- Sample active reservations for each restaurant
- User profiles auto-created on first use

---

## Key Files

### Frontend
- `mobile/src/app/(tabs)/` - Tab screens
- `mobile/src/lib/api/` - API client, hooks, types
- `mobile/src/lib/auth-store.ts` - Zustand state for auth/user
- `mobile/src/components/` - Reusable UI components

### Backend
- `backend/src/routes/` - API endpoints
- `backend/prisma/schema.prisma` - Database schema
- `backend/src/db.ts` - Prisma client instance
- `backend/src/index.ts` - Main server file

---

## ✅ All Features Now Fully Functional

### What Was Fixed (v3 - Full Functionality Pass)

1. **Submit Reservation** — `submit.tsx` now calls `POST /api/reservations` with all form data. Loading spinner on button, error shown above nav bar.
2. **Restaurant Detail** — `restaurant/[id].tsx` replaced mock data with real `useReservation(id)` API call. Claim button calls `POST /api/reservations/:id/claim` with real phone number. Loading + error states. Shows real reservation date, time, party size.
3. **Tab Badge** — `_layout.tsx` shows dynamic unread count from `useActivityAlerts` instead of hardcoded `2`.
4. **Mark All As Read** — `alerts.tsx` wires "Markera alla som lästa" button to `useMarkAlertsRead()` mutation.
5. **Restaurant Alert Tap** — tapping a restaurant alert card navigates home.
6. **Profile Booking Stats** — Profile shows real submitted/claimed counts and available rewards calculated from tokens.
7. **Profile Menu Items** — Payments, Account Settings, Privacy, Help all show a "Coming Soon" modal.
8. **Settings Button** — Profile header settings button shows same modal.
9. **Rewards Banner** — Home screen rewards banner navigates to Rewards screen.
10. **Profile Rewards Card** — Tapping rewards card on Profile navigates to Rewards screen.
10. **Reservation Card Tap** — Active reservations in the My Reservations tab navigate to the claim detail screen.
11. **Backend GET /api/reservations/:id** — New endpoint returns a single reservation with restaurant info.

---

## Notes

- Backend automatically generates Prisma client on startup
- All API calls use phone number for user identification (currently mock: "test@reslot.se")
- React Query caching automatically invalidates on mutations
- App uses Expo Router for file-based routing
- No native dependencies beyond Expo prebuilt ones

---

**Built with Vibecode 🚀**
