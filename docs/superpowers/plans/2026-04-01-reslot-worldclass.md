# Reslot World-Class App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Reslot app into a world-class restaurant reservation marketplace with Fraunces typography, polished animations, critical bug fixes, and missing features.

**Architecture:** Two parallel tracks — backend (auth middleware, cron, rate limiting) and mobile (design system foundation, then screen-by-screen overhaul). Mobile changes start with a centralized theme file and font installation, then propagate through all screens.

**Tech Stack:** Expo/React Native, Hono/Bun backend, Prisma/SQLite, React Query, Reanimated v3, Fraunces + Plus Jakarta Sans fonts

---

## Track A: Backend (Independent — can run fully in parallel with Track B)

### Task A1: Auth Middleware

**Files:**
- Create: `backend/src/middleware/auth.ts`
- Modify: `backend/src/index.ts`
- Modify: `backend/src/routes/reservations.ts`
- Modify: `backend/src/routes/profile.ts`
- Modify: `backend/src/routes/alerts.ts`
- Modify: `backend/src/routes/watches.ts`
- Modify: `backend/src/routes/credits.ts`
- Modify: `backend/src/routes/referral.ts`

- [ ] **Step 1: Create auth middleware**

Create `backend/src/middleware/auth.ts`:

```typescript
import { Context, Next } from "hono";
import { db } from "../db";

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const token = authHeader.replace("Bearer ", "");

  const session = await db.session.findUnique({
    where: { token },
  });

  if (!session || session.expiresAt < new Date()) {
    return c.json({ error: { message: "Session expired", code: "SESSION_EXPIRED" } }, 401);
  }

  c.set("userPhone", session.phone);
  await next();
}
```

- [ ] **Step 2: Apply auth middleware to protected routes**

In `backend/src/index.ts`, add middleware to all user routes:

```typescript
import { authMiddleware } from "./middleware/auth";

// After CORS and logger, before routes:
// Public routes (no auth needed):
app.route("/api/auth", authRouter);
app.route("/api/restaurants", restaurantsRouter);
app.route("/api/reservations", reservationsRouter); // GET list is public

// Protected routes:
app.use("/api/profile/*", authMiddleware);
app.use("/api/alerts/*", authMiddleware);
app.use("/api/watches/*", authMiddleware);
app.use("/api/credits/*", authMiddleware);
app.use("/api/referral/*", authMiddleware);
app.use("/api/reservations/mine", authMiddleware);
```

- [ ] **Step 3: Update routes to use `c.get("userPhone")` instead of query params**

In `backend/src/routes/profile.ts`, replace `phone` query param with `c.get("userPhone")`.
In `backend/src/routes/reservations.ts` `/mine` endpoint, replace `phone` query param with `c.get("userPhone")`.
In `backend/src/routes/alerts.ts`, replace `phone` query/body param with `c.get("userPhone")`.
In `backend/src/routes/watches.ts`, replace `phone` query/body param with `c.get("userPhone")`.

For claim/cancel-claim/finalize endpoints, add auth check and use `c.get("userPhone")`.

- [ ] **Step 4: Verify with cURL**

```bash
# Should fail with 401:
curl -s $BACKEND_URL/api/profile | jq .

# Should succeed with valid token:
curl -s -H "Authorization: Bearer <token>" $BACKEND_URL/api/profile | jq .
```

---

### Task A2: Grace Period Auto-Finalize Cron

**Files:**
- Modify: `backend/src/index.ts`

- [ ] **Step 1: Add cron job to index.ts**

Add a setInterval that runs every 60 seconds to finalize expired grace periods:

```typescript
// Grace period auto-finalize (runs every 60s)
setInterval(async () => {
  try {
    const now = new Date();
    const expiredClaims = await db.reservation.findMany({
      where: {
        status: "grace_period",
        claimedAt: { lte: new Date(now.getTime() - 5 * 60 * 1000) },
      },
    });

    for (const reservation of expiredClaims) {
      await db.$transaction(async (tx) => {
        await tx.reservation.update({
          where: { id: reservation.id },
          data: { status: "completed", creditStatus: "awarded" },
        });

        // Award 2 credits to submitter
        await tx.userProfile.update({
          where: { phone: reservation.submitterPhone },
          data: { credits: { increment: 2 } },
        });

        // Create activity alert for submitter
        await tx.activityAlert.create({
          data: {
            userPhone: reservation.submitterPhone,
            type: "credit",
            title: "Credits intjänade!",
            message: "Du fick 2 credits för din delade bokning.",
            restaurantId: reservation.restaurantId,
          },
        });
      });
    }

    if (expiredClaims.length > 0) {
      console.log(`[cron] Finalized ${expiredClaims.length} grace period(s)`);
    }
  } catch (err) {
    console.error("[cron] Grace period finalize error:", err);
  }
}, 60_000);
```

- [ ] **Step 2: Verify cron runs on startup**

Check backend logs for cron execution after server start.

---

### Task A3: Rate Limiting on Claim

**Files:**
- Modify: `backend/src/routes/reservations.ts`

- [ ] **Step 1: Add in-memory rate limiter to claim endpoint**

```typescript
// At top of reservations.ts
const claimRateLimit = new Map<string, { count: number; resetAt: number }>();

function checkClaimRateLimit(phone: string): boolean {
  const now = Date.now();
  const entry = claimRateLimit.get(phone);
  if (!entry || now > entry.resetAt) {
    claimRateLimit.set(phone, { count: 1, resetAt: now + 3600_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}
```

- [ ] **Step 2: Apply rate limit check in claim handler**

Before processing claim, call `checkClaimRateLimit(phone)`. Return 429 if exceeded:

```typescript
if (!checkClaimRateLimit(phone)) {
  return c.json({ error: { message: "Max 10 claims per timme", code: "RATE_LIMITED" } }, 429);
}
```

---

### Task A4: Social Proof Endpoint

**Files:**
- Modify: `backend/src/routes/reservations.ts`

- [ ] **Step 1: Add weekly stats endpoint**

```typescript
// GET /api/reservations/stats
reservationsRouter.get("/stats", async (c) => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const weeklyCount = await db.reservation.count({
    where: {
      createdAt: { gte: oneWeekAgo },
      status: { in: ["active", "claimed", "grace_period", "completed"] },
    },
  });

  return c.json({ data: { weeklyReservations: weeklyCount } });
});
```

---

## Track B: Mobile — Design System Foundation

### Task B1: Install Fraunces Font + Create Theme Constants

**Files:**
- Modify: `mobile/src/app/_layout.tsx` (add Fraunces font loading)
- Create: `mobile/src/lib/theme.ts` (centralized colors, fonts, spacing)

- [ ] **Step 1: Install Fraunces font**

```bash
cd /Users/williamsvanqvist/Downloads/Reslot\ App/mobile
bun add @expo-google-fonts/fraunces
```

- [ ] **Step 2: Create centralized theme file**

Create `mobile/src/lib/theme.ts`:

```typescript
export const C = {
  // Primary
  coral: "#E06A4E",
  gold: "#C9A96E",
  dark: "#111827",
  bg: "#FAFAF8",

  // Surfaces
  bgCard: "#FFFFFF",
  bgInput: "#F0F0EE",

  // Text
  textPrimary: "#111827",
  textSecondary: "#6B7280",
  textTertiary: "#9CA3AF",

  // Borders
  divider: "rgba(0,0,0,0.07)",
  borderLight: "rgba(0,0,0,0.06)",

  // Status
  success: "#8B9E7E",
  successBright: "#22C55E",
  error: "#EF4444",
  danger: "#DC2626",
  warning: "#F59E0B",
  info: "#3B82F6",
} as const;

export const FONTS = {
  // Display / Headers — Fraunces (serif)
  displayBold: "Fraunces_700Bold",
  // Body / UI — Plus Jakarta Sans
  bold: "PlusJakartaSans_700Bold",
  semiBold: "PlusJakartaSans_600SemiBold",
  medium: "PlusJakartaSans_500Medium",
  regular: "PlusJakartaSans_400Regular",
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 48,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 28,
} as const;

export const SHADOW = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  elevated: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;
```

- [ ] **Step 3: Add Fraunces to _layout.tsx font loading**

In `mobile/src/app/_layout.tsx`, add Fraunces import:

```typescript
import { Fraunces_700Bold } from "@expo-google-fonts/fraunces";
```

Add to the `useFonts` call:

```typescript
const [fontsLoaded] = useFonts({
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  Fraunces_700Bold,
});
```

- [ ] **Step 4: Verify fonts load**

Check that the app starts without font loading errors.

---

### Task B2: Fix Reservation Type

**Files:**
- Modify: `mobile/src/lib/api/types.ts`

- [ ] **Step 1: Update Reservation interface status union**

Change line 41 in `mobile/src/lib/api/types.ts`:

```typescript
// Before:
status: "active" | "claimed" | "expired" | "cancelled";

// After:
status: "active" | "claimed" | "grace_period" | "completed" | "expired" | "cancelled";
```

- [ ] **Step 2: Add grace period fields**

Add to Reservation interface:

```typescript
claimedAt: string | null;
gracePeriodEndsAt: string | null;
creditStatus: "none" | "pending" | "awarded" | "reverted";
serviceFee: number;
```

---

### Task B3: Home Screen Polish

**Files:**
- Modify: `mobile/src/app/(tabs)/index.tsx`

- [ ] **Step 1: Import theme and Fraunces**

Replace inline color constants with imports from `../../lib/theme`:

```typescript
import { C, FONTS, SPACING, SHADOW, RADIUS } from "../../lib/theme";
```

- [ ] **Step 2: Add social proof banner**

After the day picker and before the reservation list, add a social proof section:

```typescript
// Add useQuery for stats
const { data: stats } = useQuery({
  queryKey: ["reservation-stats"],
  queryFn: () => api.get<{ weeklyReservations: number }>("/api/reservations/stats"),
});

// In JSX, after day picker:
{stats?.weeklyReservations ? (
  <Animated.View entering={FadeInDown.delay(200).springify()} style={{ paddingHorizontal: 20, paddingVertical: 8 }}>
    <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: C.textSecondary, textAlign: "center" }}>
      {stats.weeklyReservations} bokningar delade denna vecka i {selectedCity}
    </Text>
  </Animated.View>
) : null}
```

- [ ] **Step 3: Use Fraunces for main header**

Change the "Bokningar i [stad]" header text to use Fraunces:

```typescript
<Text style={{ fontFamily: FONTS.displayBold, fontSize: 22, color: C.dark, letterSpacing: -0.5 }}>
  Bokningar i {selectedCity}
</Text>
```

- [ ] **Step 4: Add urgency countdown on reservation cards**

For reservations with `cancellationWindowHours`, show a countdown timer if within 2 hours:

```typescript
function CountdownBadge({ reservation }: { reservation: Reservation }) {
  const deadline = new Date(reservation.reservationDate);
  deadline.setHours(deadline.getHours() - (reservation.cancellationWindowHours ?? 0));
  const now = new Date();
  const msLeft = deadline.getTime() - now.getTime();

  if (msLeft <= 0 || msLeft > 2 * 60 * 60 * 1000) return null;

  const hours = Math.floor(msLeft / 3600000);
  const mins = Math.floor((msLeft % 3600000) / 60000);

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(224,106,78,0.1)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
      <Clock size={12} color={C.coral} strokeWidth={2} />
      <Text style={{ fontFamily: FONTS.semiBold, fontSize: 11, color: C.coral }}>
        {hours}h {mins}m kvar
      </Text>
    </View>
  );
}
```

- [ ] **Step 5: Add pull-to-refresh**

Add `refreshControl` to the FlatList/ScrollView:

```typescript
refreshControl={
  <RefreshControl
    refreshing={isRefetching}
    onRefresh={refetch}
    tintColor={C.coral}
  />
}
```

- [ ] **Step 6: Add skeleton loader for reservation cards**

Create a `SkeletonCard` component using Animated opacity pulsing:

```typescript
function SkeletonCard() {
  const opacity = useSharedValue(0.3);
  React.useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
  }, []);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[animStyle, { backgroundColor: C.bgInput, borderRadius: RADIUS.lg, height: 120, marginHorizontal: 20, marginBottom: 12 }]} />
  );
}
```

Show 3 skeleton cards when `isLoading` is true instead of ActivityIndicator.

---

### Task B4: Restaurant Detail / Claim Flow — World-Class

**Files:**
- Modify: `mobile/src/app/restaurant/[id].tsx`

- [ ] **Step 1: Import theme constants**

```typescript
import { C, FONTS, SPACING, SHADOW, RADIUS } from "../../lib/theme";
```

- [ ] **Step 2: Use Fraunces for restaurant name**

Replace the restaurant name text style:

```typescript
<Text style={{ fontFamily: FONTS.displayBold, fontSize: 26, color: C.dark, letterSpacing: -0.5 }}>
  {reservation.restaurant.name}
</Text>
```

- [ ] **Step 3: Add credits cost section before claim button**

Before the "Ta över bokning" button, add a cost breakdown:

```typescript
{/* Cost Breakdown */}
<Animated.View entering={FadeInDown.delay(300).springify()} style={{
  backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: 16,
  borderWidth: 0.5, borderColor: C.divider, ...SHADOW.card, marginBottom: 16,
}}>
  <Text style={{ fontFamily: FONTS.semiBold, fontSize: 14, color: C.dark, marginBottom: 12 }}>
    Kostnad
  </Text>
  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
    <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textSecondary }}>
      Bokning
    </Text>
    <Text style={{ fontFamily: FONTS.semiBold, fontSize: 14, color: C.gold }}>
      2 credits
    </Text>
  </View>
  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
    <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textSecondary }}>
      Serviceavgift
    </Text>
    <Text style={{ fontFamily: FONTS.semiBold, fontSize: 14, color: C.dark }}>
      29 kr
    </Text>
  </View>
  <View style={{ height: 0.5, backgroundColor: C.divider, marginBottom: 12 }} />
  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
    <Text style={{ fontFamily: FONTS.semiBold, fontSize: 14, color: C.dark }}>
      Ditt saldo
    </Text>
    <Text style={{ fontFamily: FONTS.semiBold, fontSize: 14, color: profile?.credits && profile.credits >= 2 ? C.success : C.danger }}>
      {profile?.credits ?? 0} credits
    </Text>
  </View>
</Animated.View>
```

- [ ] **Step 4: Add grace period info text**

Below the cost breakdown, add an info box:

```typescript
<Animated.View entering={FadeInDown.delay(350).springify()} style={{
  flexDirection: "row", alignItems: "center", gap: 10,
  backgroundColor: "rgba(59,130,246,0.08)", borderRadius: RADIUS.md,
  padding: 12, marginBottom: 16,
}}>
  <Info size={18} color={C.info} />
  <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textSecondary, flex: 1 }}>
    Du har 5 minuters ångerfrist efter att du tar över bokningen. Inga avgifter under ångerfristen.
  </Text>
</Animated.View>
```

- [ ] **Step 5: Disable claim button if insufficient credits**

```typescript
const hasEnoughCredits = (profile?.credits ?? 0) >= 2;

// On the button:
<Pressable
  disabled={!termsChecked || !hasEnoughCredits || claimMutation.isPending}
  style={({ pressed }) => ({
    backgroundColor: (!termsChecked || !hasEnoughCredits) ? C.textTertiary : C.coral,
    transform: [{ scale: pressed ? 0.97 : 1 }],
    // ... rest of styles
  })}
>
  <Text>{hasEnoughCredits ? "Ta över bokning" : "Köp credits för att ta över"}</Text>
</Pressable>
```

- [ ] **Step 6: Add post-claim grace period countdown**

After successful claim, show a countdown screen overlay:

```typescript
function GracePeriodCountdown({ endsAt, onCancel }: { endsAt: Date; onCancel: () => void }) {
  const [secondsLeft, setSecondsLeft] = React.useState(300);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const left = Math.max(0, Math.floor((endsAt.getTime() - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  return (
    <Animated.View entering={FadeIn.springify()} style={{
      backgroundColor: C.bgCard, borderRadius: RADIUS.xl, padding: 24,
      alignItems: "center", ...SHADOW.elevated,
    }}>
      <Text style={{ fontFamily: FONTS.displayBold, fontSize: 22, color: C.dark, marginBottom: 8 }}>
        Bokning övertagen!
      </Text>
      <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textSecondary, marginBottom: 20, textAlign: "center" }}>
        Du har {mins}:{secs.toString().padStart(2, "0")} kvar att ångra
      </Text>
      {/* Circular progress indicator */}
      <View style={{ width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: C.coral, justifyContent: "center", alignItems: "center", marginBottom: 20 }}>
        <Text style={{ fontFamily: FONTS.displayBold, fontSize: 32, color: C.dark }}>
          {mins}:{secs.toString().padStart(2, "0")}
        </Text>
      </View>
      <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onCancel(); }}
        style={({ pressed }) => ({
          backgroundColor: "rgba(220,38,38,0.1)", paddingHorizontal: 24, paddingVertical: 12,
          borderRadius: RADIUS.full, transform: [{ scale: pressed ? 0.97 : 1 }],
        })}>
        <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: C.danger }}>
          Ångra övertagande
        </Text>
      </Pressable>
    </Animated.View>
  );
}
```

- [ ] **Step 7: Add confirmation animation on successful claim**

Use Lottie or a custom confetti-like animation:

```typescript
// Simple success animation with staggered circles
function SuccessAnimation() {
  return (
    <Animated.View entering={FadeIn.duration(200)} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.3)" }}>
      <Animated.View entering={FadeIn.delay(100).springify()} style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: C.success, justifyContent: "center", alignItems: "center" }}>
        <Check size={40} color="#fff" strokeWidth={3} />
      </Animated.View>
    </Animated.View>
  );
}
```

---

### Task B5: Credits Screen Rebuild

**Files:**
- Modify: `mobile/src/app/credits.tsx`

- [ ] **Step 1: Import theme + Fraunces**

```typescript
import { C, FONTS, SPACING, SHADOW, RADIUS } from "../lib/theme";
```

- [ ] **Step 2: Rebuild header with Fraunces and count-up animation**

```typescript
// Count-up animation for credits
function AnimatedCredits({ value }: { value: number }) {
  const displayValue = useSharedValue(0);
  React.useEffect(() => {
    displayValue.value = withTiming(value, { duration: 1200, easing: Easing.out(Easing.cubic) });
  }, [value]);

  const animatedText = useDerivedValue(() => Math.round(displayValue.value).toString());

  return (
    <ReText text={animatedText} style={{
      fontFamily: FONTS.displayBold, fontSize: 56, color: "#fff",
    }} />
  );
}
```

Note: ReText from react-native-reanimated may not be available. Fallback to a regular counter with useState + useEffect interval.

- [ ] **Step 3: Rebuild balance card**

Large Fraunces number, gold accent, remove the old visual scale:

```typescript
<Animated.View entering={FadeInDown.springify()} style={{
  backgroundColor: C.dark, borderRadius: RADIUS.xl, padding: 28,
  ...SHADOW.elevated, marginBottom: 28,
}}>
  <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 4, letterSpacing: 0.5, textTransform: "uppercase" }}>
    Ditt saldo
  </Text>
  <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
    <Text style={{ fontFamily: FONTS.displayBold, fontSize: 52, color: "#fff" }}>
      {profile?.credits ?? 0}
    </Text>
    <Text style={{ fontFamily: FONTS.semiBold, fontSize: 18, color: C.gold }}>
      credits
    </Text>
  </View>
</Animated.View>
```

- [ ] **Step 4: Add credits history section**

```typescript
// Placeholder until backend provides transaction log
<View style={{ marginTop: 24 }}>
  <Text style={{ fontFamily: FONTS.displayBold, fontSize: 18, color: C.dark, marginBottom: 12 }}>
    Historik
  </Text>
  <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textSecondary }}>
    Transaktionshistorik kommer snart
  </Text>
</View>
```

- [ ] **Step 5: Buy credits section with Stripe placeholder**

```typescript
<Animated.View entering={FadeInDown.delay(150).springify()} style={{
  backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: 16,
  borderWidth: 0.5, borderColor: C.divider, ...SHADOW.card,
}}>
  <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: C.dark, marginBottom: 12 }}>
    Köp credits
  </Text>
  <Pressable
    testID="buy-credits-btn"
    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); /* Stripe integration */ }}
    style={({ pressed }) => ({
      backgroundColor: C.coral, borderRadius: RADIUS.full, paddingVertical: 14,
      alignItems: "center", transform: [{ scale: pressed ? 0.97 : 1 }],
      ...SHADOW.elevated, shadowColor: C.coral,
    })}>
    <Text style={{ fontFamily: FONTS.bold, fontSize: 15, color: "#fff" }}>
      1 credit · 39 kr
    </Text>
  </Pressable>
</Animated.View>
```

---

### Task B6: Onboarding Enhancement — Credits Intro Step

**Files:**
- Modify: `mobile/src/app/onboarding.tsx`

- [ ] **Step 1: Import Fraunces + theme**

```typescript
import { C, FONTS, SPACING, RADIUS } from "../lib/theme";
```

- [ ] **Step 2: Use Fraunces for splash headline**

Change the splash step headline to use Fraunces:

```typescript
<Text style={{ fontFamily: FONTS.displayBold, fontSize: 30, color: C.dark, textAlign: "center", letterSpacing: -0.8 }}>
  Din genväg till{"\n"}fullbokade restauranger
</Text>
```

- [ ] **Step 3: Add Credits Intro step (between city and welcome)**

Insert a new step that shows the credits loop with staggered animations:

```typescript
// CREDITS_INTRO step
<View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }}>
  <Animated.View entering={FadeInDown.delay(0).springify()}>
    <Text style={{ fontFamily: FONTS.displayBold, fontSize: 26, color: C.dark, textAlign: "center", marginBottom: 32 }}>
      Så fungerar credits
    </Text>
  </Animated.View>

  {/* Step 1: Share */}
  <Animated.View entering={FadeInDown.delay(100).springify()} style={{
    flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 24,
  }}>
    <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: "rgba(224,106,78,0.12)", justifyContent: "center", alignItems: "center" }}>
      <Upload size={22} color={C.coral} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: C.dark }}>
        Dela din bokning
      </Text>
      <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textSecondary }}>
        Kan du inte gå? Lägg upp den på Reslot
      </Text>
    </View>
    <Text style={{ fontFamily: FONTS.bold, fontSize: 15, color: C.success }}>+2</Text>
  </Animated.View>

  {/* Step 2: Earn */}
  <Animated.View entering={FadeInDown.delay(200).springify()} style={{
    flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 24,
  }}>
    <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: "rgba(201,169,110,0.12)", justifyContent: "center", alignItems: "center" }}>
      <Coins size={22} color={C.gold} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: C.dark }}>
        Tjäna credits
      </Text>
      <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textSecondary }}>
        Få 2 credits när någon tar över
      </Text>
    </View>
    <Coins size={20} color={C.gold} />
  </Animated.View>

  {/* Step 3: Claim */}
  <Animated.View entering={FadeInDown.delay(300).springify()} style={{
    flexDirection: "row", alignItems: "center", gap: 16,
  }}>
    <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: "rgba(139,158,126,0.12)", justifyContent: "center", alignItems: "center" }}>
      <ArrowDownLeft size={22} color={C.success} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: C.dark }}>
        Ta över en bokning
      </Text>
      <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textSecondary }}>
        Använd 2 credits för att boka
      </Text>
    </View>
    <Text style={{ fontFamily: FONTS.bold, fontSize: 15, color: C.coral }}>-2</Text>
  </Animated.View>
</View>
```

- [ ] **Step 4: Update step count and navigation**

Update the step enum/array to include CREDITS_INTRO. Update progress dots and next/back navigation.

---

### Task B7: Reservations Screen — Status Badges + Grace Period

**Files:**
- Modify: `mobile/src/app/(tabs)/reservations.tsx`

- [ ] **Step 1: Import theme**

```typescript
import { C, FONTS, SPACING, RADIUS } from "../../lib/theme";
```

- [ ] **Step 2: Update status badge colors**

```typescript
function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return { label: "Aktiv", bg: "rgba(139,158,126,0.12)", color: C.success };
    case "grace_period":
      return { label: "Under ångerfrist", bg: "rgba(245,158,11,0.12)", color: C.warning };
    case "claimed":
    case "completed":
      return { label: "Övertagen", bg: "rgba(156,163,175,0.12)", color: C.textSecondary };
    case "cancelled":
      return { label: "Avbokad", bg: "rgba(220,38,38,0.1)", color: C.danger };
    default:
      return { label: status, bg: C.bgInput, color: C.textSecondary };
  }
}
```

- [ ] **Step 3: Use Fraunces for section headers**

```typescript
<Text style={{ fontFamily: FONTS.displayBold, fontSize: 24, color: C.dark }}>
  Mina bokningar
</Text>
```

---

### Task B8: Profile Screen Polish

**Files:**
- Modify: `mobile/src/app/(tabs)/profile.tsx`

- [ ] **Step 1: Import theme + Fraunces**

```typescript
import { C, FONTS, SPACING, SHADOW, RADIUS } from "../../lib/theme";
```

- [ ] **Step 2: Use Fraunces for header and credits display**

```typescript
<Text style={{ fontFamily: FONTS.displayBold, fontSize: 26, color: C.dark }}>
  {profile?.firstName} {profile?.lastName}
</Text>
```

- [ ] **Step 3: Remove milestone progress bar**

Delete the visual scale/progress bar showing 5/10/15/20 credits. Replace with a simple credits card:

```typescript
<View style={{
  backgroundColor: C.dark, borderRadius: RADIUS.lg, padding: 20,
  ...SHADOW.card, marginBottom: 20,
}}>
  <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
    Ditt saldo
  </Text>
  <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
    <Text style={{ fontFamily: FONTS.displayBold, fontSize: 36, color: "#fff" }}>
      {profile?.credits ?? 0}
    </Text>
    <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: C.gold }}>credits</Text>
  </View>
</View>
```

- [ ] **Step 4: Add verification badges**

Next to email and phone in account settings, show green checkmark if verified:

```typescript
{profile?.emailVerified ? (
  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
    <CheckCircle size={14} color={C.successBright} />
    <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: C.successBright }}>Verifierad</Text>
  </View>
) : null}
```

---

### Task B9: Submit Screen — Confirmation Step + Price Calc

**Files:**
- Modify: `mobile/src/app/(tabs)/submit.tsx`

- [ ] **Step 1: Import theme**

```typescript
import { C, FONTS, SPACING, RADIUS, SHADOW } from "../../lib/theme";
```

- [ ] **Step 2: Use Fraunces for header**

```typescript
<Text style={{ fontFamily: FONTS.displayBold, fontSize: 24, color: C.dark }}>
  Lägg upp bokning
</Text>
```

- [ ] **Step 3: Add price per person auto-calculation**

After the prepaidAmount field, show total calculation:

```typescript
{prepaidAmount && partySize > 0 ? (
  <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4, marginTop: 8 }}>
    <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textSecondary }}>
      Totalt ({partySize} pers × {prepaidAmount} kr)
    </Text>
    <Text style={{ fontFamily: FONTS.semiBold, fontSize: 13, color: C.dark }}>
      {partySize * prepaidAmount} kr
    </Text>
  </View>
) : null}
```

- [ ] **Step 4: Add confirmation step before submit**

Instead of direct submit, show a bottom sheet with a summary:

```typescript
const [showConfirmation, setShowConfirmation] = React.useState(false);

// Replace direct submit with:
onPress={() => setShowConfirmation(true)}

// Confirmation overlay:
{showConfirmation ? (
  <Animated.View entering={FadeIn} style={{
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end",
  }}>
    <Animated.View entering={FadeInDown.springify()} style={{
      backgroundColor: C.bgCard, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
      padding: 24, paddingBottom: 40,
    }}>
      <Text style={{ fontFamily: FONTS.displayBold, fontSize: 20, color: C.dark, marginBottom: 16 }}>
        Bekräfta bokning
      </Text>
      {/* Summary rows */}
      <View style={{ gap: 8, marginBottom: 20 }}>
        <SummaryRow label="Restaurang" value={selectedRestaurant?.name ?? ""} />
        <SummaryRow label="Datum" value={formatDate(date)} />
        <SummaryRow label="Tid" value={time} />
        <SummaryRow label="Antal" value={`${partySize} personer`} />
      </View>
      <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textSecondary, marginBottom: 20, textAlign: "center" }}>
        Du får 2 credits när någon tar över din bokning
      </Text>
      <Pressable testID="confirm-submit-btn" onPress={handleSubmit}
        style={({ pressed }) => ({
          backgroundColor: C.coral, borderRadius: RADIUS.full, paddingVertical: 16,
          alignItems: "center", transform: [{ scale: pressed ? 0.97 : 1 }],
        })}>
        <Text style={{ fontFamily: FONTS.bold, fontSize: 16, color: "#fff" }}>
          Lägg upp bokning
        </Text>
      </Pressable>
      <Pressable testID="cancel-confirm-btn" onPress={() => setShowConfirmation(false)}
        style={{ paddingVertical: 12, alignItems: "center", marginTop: 8 }}>
        <Text style={{ fontFamily: FONTS.medium, fontSize: 14, color: C.textSecondary }}>Avbryt</Text>
      </Pressable>
    </Animated.View>
  </Animated.View>
) : null}
```

---

### Task B10: Alerts Screen — Typography Update

**Files:**
- Modify: `mobile/src/app/(tabs)/alerts.tsx`

- [ ] **Step 1: Import theme + use Fraunces**

```typescript
import { C, FONTS, SPACING, RADIUS } from "../../lib/theme";
```

Update header:
```typescript
<Text style={{ fontFamily: FONTS.displayBold, fontSize: 24, color: C.dark }}>
  Bevakningar
</Text>
```

---

### Task B11: Global Animation & Haptics Sweep

**Files:**
- All screens in `mobile/src/app/`

- [ ] **Step 1: Ensure all Pressable components have spring press feedback**

Pattern to apply everywhere:

```typescript
<Pressable
  onPress={() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // action
  }}
  style={({ pressed }) => ({
    transform: [{ scale: withSpring(pressed ? 0.97 : 1, { damping: 15, stiffness: 300 }) }],
  })}
>
```

Note: `withSpring` can't be used inline in style directly — use `useAnimatedStyle` + `useSharedValue` for press state, or use the simpler `transform: [{ scale: pressed ? 0.97 : 1 }]` pattern which works with Pressable's built-in animation.

- [ ] **Step 2: Ensure staggered FadeInDown on all list items**

All lists should use index-based delay:

```typescript
<Animated.View entering={FadeInDown.delay(index * 60).springify()}>
```

- [ ] **Step 3: Haptics on all CTA buttons**

Ensure `Haptics.impactAsync(ImpactFeedbackStyle.Medium)` fires on all primary CTA buttons.
Ensure `Haptics.notificationAsync(NotificationFeedbackType.Success)` fires on successful actions.
Ensure `Haptics.notificationAsync(NotificationFeedbackType.Error)` fires on errors.

---

## Execution Order

**Phase 1 — Foundation (parallel):**
- Task A1 (auth middleware) + Task B1 (fonts + theme) + Task B2 (fix types)

**Phase 2 — Critical Fixes (parallel):**
- Task A2 (cron) + Task A3 (rate limit) + Task A4 (stats endpoint)
- Task B4 (claim flow rebuild) — depends on B1, B2

**Phase 3 — Screen Overhaul (parallel):**
- Task B3 (home) + Task B5 (credits) + Task B6 (onboarding) + Task B7 (reservations) + Task B8 (profile) + Task B9 (submit) + Task B10 (alerts)

**Phase 4 — Polish:**
- Task B11 (global animation sweep)

**Phase 5 — Verification:**
- Full app walkthrough checking every screen
- All testIDs present
- TypeScript compiles without errors
