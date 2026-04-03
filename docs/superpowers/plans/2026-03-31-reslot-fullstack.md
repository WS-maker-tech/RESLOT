# Reslot Full Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementera hela Reslot-specifikationen: FAQ, Hem, Restaurangdetaljer, Bokningar, Lägg upp, Profil, Bevakningar, Credits, Betalning, Bjud in, Support, Kontoinställningar — med matchande backend-endpoints.

**Architecture:** Mobile app (Expo/React Native) + Hono backend (SQLite/Prisma). Ny funktionalitet läggs till via nya routes i backend och nya screens i mobile/src/app/. Terminologi: "credits" (ej tokens i UI), "bevakningar" (ej notifikationer), "ta över bokning".

**Tech Stack:** Expo SDK 53, React Native Reanimated v3, NativeWind/Tailwind v3, React Query, Zustand, Hono, Prisma/SQLite, Bun.

---

## Task 1: Backend — Schema-uppdatering

**Files:**
- Modify: `backend/prisma/schema.prisma`

- [ ] **Step 1: Lägg till nya fält och modell**

Ersätt hela `schema.prisma` med:

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

generator client {
  provider = "prisma-client-js"
}

model Restaurant {
  id                 String   @id @default(cuid())
  name               String
  address            String
  cuisine            String
  neighborhood       String
  rating             Float
  reviewCount        Int
  priceLevel         Int
  image              String
  description        String
  tags               String
  timesBookedOnReslot Int     @default(0)
  seatType           String
  instagram          String?
  website            String?
  vibeTags           String
  goodForTags        String
  foodTags           String
  latitude           Float?
  longitude          Float?
  isExclusive        Boolean  @default(false)
  city               String   @default("Stockholm")
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  reservations     Reservation[]
  restaurantAlerts RestaurantAlert[]
  watches          Watch[]
}

model Reservation {
  id                       String   @id @default(cuid())
  restaurantId             String
  restaurant               Restaurant @relation(fields: [restaurantId], references: [id])
  submitterPhone           String
  submitterFirstName       String
  submitterLastName        String
  reservationDate          DateTime
  reservationTime          String
  partySize                Int
  seatType                 String
  nameOnReservation        String
  status                   String   @default("active")
  claimerPhone             String?
  cancelFee                Float?
  prepaidAmount            Float?
  verificationLink         String?
  extraInfo                String?
  cancellationWindowHours  Int?
  createdAt                DateTime @default(now())
  updatedAt                DateTime @updatedAt
}

model UserProfile {
  id             String   @id @default(cuid())
  phone          String   @unique
  firstName      String
  lastName       String
  email          String
  avatar         String?
  tokens         Int      @default(0)
  selectedCity   String   @default("Stockholm")
  dateOfBirth    String?
  emailVerified  Boolean  @default(false)
  phoneVerified  Boolean  @default(true)
  referralCode   String?  @unique
  referralUsed   String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model Watch {
  id           String     @id @default(cuid())
  userPhone    String
  restaurantId String?
  restaurant   Restaurant? @relation(fields: [restaurantId], references: [id])
  date         String?
  partySize    Int?
  notes        String?
  createdAt    DateTime   @default(now())
}

model RestaurantAlert {
  id           String     @id @default(cuid())
  userPhone    String
  restaurantId String
  restaurant   Restaurant @relation(fields: [restaurantId], references: [id])
  enabled      Boolean    @default(true)
  createdAt    DateTime   @default(now())
}

model ActivityAlert {
  id           String   @id @default(cuid())
  userPhone    String
  type         String
  title        String
  message      String
  read         Boolean  @default(false)
  restaurantId String?
  createdAt    DateTime @default(now())
}

model OtpCode {
  id        String   @id @default(cuid())
  phone     String
  code      String
  used      Boolean  @default(false)
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model Session {
  id        String   @id @default(cuid())
  phone     String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

- [ ] **Step 2: Push schema till DB**

```bash
cd /Users/williamsvanqvist/Downloads/Reslot\ App/backend && bunx prisma db push
```

Expected: `Your database is now in sync with your Prisma schema.`

---

## Task 2: Backend — Watches-route (bevakningar CRUD)

**Files:**
- Create: `backend/src/routes/watches.ts`
- Modify: `backend/src/index.ts`

- [ ] **Step 1: Skapa watches.ts**

```typescript
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod/v4";
import { db } from "../db";

const watchesRouter = new Hono();

// GET /api/watches?phone=...
watchesRouter.get("/", async (c) => {
  const phone = c.req.query("phone");
  if (!phone) return c.json({ error: { message: "phone required", code: "MISSING_PHONE" } }, 400);

  const watches = await db.watch.findMany({
    where: { userPhone: phone },
    include: { restaurant: true },
    orderBy: { createdAt: "desc" },
  });

  return c.json({ data: watches });
});

// POST /api/watches
watchesRouter.post(
  "/",
  zValidator("json", z.object({
    userPhone: z.string(),
    restaurantId: z.string().optional(),
    date: z.string().optional(),
    partySize: z.number().optional(),
    notes: z.string().optional(),
  })),
  async (c) => {
    const body = c.req.valid("json");
    const watch = await db.watch.create({ data: body });
    return c.json({ data: watch }, 201);
  }
);

// DELETE /api/watches/:id
watchesRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  await db.watch.delete({ where: { id } });
  return c.json({ data: { success: true } });
});

export { watchesRouter };
```

- [ ] **Step 2: Montera i index.ts**

Öppna `backend/src/index.ts` och lägg till:

```typescript
import { watchesRouter } from "./routes/watches";
// ...
app.route("/api/watches", watchesRouter);
```

---

## Task 3: Backend — Credits-route (köp credits)

**Files:**
- Create: `backend/src/routes/credits.ts`
- Modify: `backend/src/index.ts`

- [ ] **Step 1: Skapa credits.ts (mock Stripe-integration)**

```typescript
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod/v4";
import { db } from "../db";

const creditsRouter = new Hono();

// POST /api/credits/purchase
creditsRouter.post(
  "/purchase",
  zValidator("json", z.object({
    phone: z.string(),
    quantity: z.number().min(1).max(100),
  })),
  async (c) => {
    const { phone, quantity } = c.req.valid("json");

    const profile = await db.userProfile.findUnique({ where: { phone } });
    if (!profile) {
      return c.json({ error: { message: "Användare ej hittad", code: "NOT_FOUND" } }, 404);
    }

    // Mock payment success — in production: integrate Stripe here
    const updated = await db.userProfile.update({
      where: { phone },
      data: { tokens: { increment: quantity } },
    });

    await db.activityAlert.create({
      data: {
        userPhone: phone,
        type: "token",
        title: `${quantity} credits köpta`,
        message: `Du har köpt ${quantity} Reslot credit${quantity > 1 ? "s" : ""} för ${quantity * 39} kr.`,
      },
    });

    return c.json({ data: { success: true, newBalance: updated.tokens } });
  }
);

export { creditsRouter };
```

- [ ] **Step 2: Montera i index.ts**

```typescript
import { creditsRouter } from "./routes/credits";
// ...
app.route("/api/credits", creditsRouter);
```

---

## Task 4: Backend — Referral-route

**Files:**
- Create: `backend/src/routes/referral.ts`
- Modify: `backend/src/index.ts`

- [ ] **Step 1: Skapa referral.ts**

```typescript
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod/v4";
import { db } from "../db";

const referralRouter = new Hono();

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// GET /api/referral/code?phone=...  — hämta eller generera referralkod
referralRouter.get("/code", async (c) => {
  const phone = c.req.query("phone");
  if (!phone) return c.json({ error: { message: "phone required", code: "MISSING_PHONE" } }, 400);

  let profile = await db.userProfile.findUnique({ where: { phone } });
  if (!profile) return c.json({ error: { message: "Användare ej hittad", code: "NOT_FOUND" } }, 404);

  if (!profile.referralCode) {
    let code = generateCode();
    let tries = 0;
    while (tries < 10) {
      const existing = await db.userProfile.findFirst({ where: { referralCode: code } });
      if (!existing) break;
      code = generateCode();
      tries++;
    }
    profile = await db.userProfile.update({
      where: { phone },
      data: { referralCode: code },
    });
  }

  return c.json({ data: { referralCode: profile.referralCode } });
});

// POST /api/referral/use  — använd referralkod vid registrering
referralRouter.post(
  "/use",
  zValidator("json", z.object({
    phone: z.string(),
    referralCode: z.string(),
  })),
  async (c) => {
    const { phone, referralCode } = c.req.valid("json");

    const newUser = await db.userProfile.findUnique({ where: { phone } });
    if (!newUser) return c.json({ error: { message: "Användare ej hittad", code: "NOT_FOUND" } }, 404);

    // Skydda mot missbruk: kolla om användaren redan använt en kod
    if (newUser.referralUsed) {
      return c.json({ error: { message: "Referralkod redan använd", code: "ALREADY_USED" } }, 400);
    }

    const referrer = await db.userProfile.findFirst({ where: { referralCode } });
    if (!referrer) return c.json({ error: { message: "Ogiltig referralkod", code: "INVALID_CODE" } }, 404);

    // Kan inte referera sig själv
    if (referrer.phone === phone) {
      return c.json({ error: { message: "Kan inte använda din egen kod", code: "SELF_REFERRAL" } }, 400);
    }

    // Ge 1 credit till båda
    await db.userProfile.update({ where: { phone: referrer.phone }, data: { tokens: { increment: 1 } } });
    await db.userProfile.update({ where: { phone }, data: { tokens: { increment: 1 }, referralUsed: referralCode } });

    // Activity alerts
    await db.activityAlert.create({
      data: {
        userPhone: referrer.phone,
        type: "token",
        title: "Din vän registrerade sig!",
        message: "Du fick 1 Reslot credit för att din vän registrerade sig med din kod.",
      },
    });
    await db.activityAlert.create({
      data: {
        userPhone: phone,
        type: "token",
        title: "Välkommen bonus!",
        message: "Du fick 1 Reslot credit som välkomstbonus.",
      },
    });

    return c.json({ data: { success: true } });
  }
);

export { referralRouter };
```

- [ ] **Step 2: Montera i index.ts**

```typescript
import { referralRouter } from "./routes/referral";
// ...
app.route("/api/referral", referralRouter);
```

---

## Task 5: Backend — Uppdatera reservations-route (claim + cancellationWindowHours)

**Files:**
- Modify: `backend/src/routes/reservations.ts`

- [ ] **Step 1: Lägg till extraInfo och cancellationWindowHours i POST /api/reservations**

I `reservations.ts`, hitta POST-schemat och lägg till fälten:

```typescript
// I zValidator schema för POST /api/reservations, lägg till:
extraInfo: z.string().optional(),
cancellationWindowHours: z.number().optional(),
```

Och i create-data:

```typescript
extraInfo: body.extraInfo,
cancellationWindowHours: body.cancellationWindowHours,
```

- [ ] **Step 2: Uppdatera claim-logiken för att skicka bekräftelse**

I POST `/:id/claim`-handleren, efter statusuppdateringen, lägg till:

```typescript
// Skapa bekräftelse-aktivitetsavisering till den som tog över
await db.activityAlert.create({
  data: {
    userPhone: claimerPhone,
    type: "claim",
    title: `Bokning bekräftad — ${reservation.restaurant.name}`,
    message: `Du har tagit över bokningen för ${reservation.partySize} pers den ${new Date(reservation.reservationDate).toLocaleDateString("sv-SE")} kl ${reservation.reservationTime}. Namn på bokning: ${reservation.nameOnReservation}.`,
    restaurantId: reservation.restaurantId,
  },
});

// Notifiera originalbokaren
await db.activityAlert.create({
  data: {
    userPhone: reservation.submitterPhone,
    type: "claim",
    title: `Din bokning togs över`,
    message: `Din bokning på ${reservation.restaurant.name} den ${new Date(reservation.reservationDate).toLocaleDateString("sv-SE")} har tagits över.`,
    restaurantId: reservation.restaurantId,
  },
});
```

---

## Task 6: Backend — Uppdatera profile-route (full update + radera konto)

**Files:**
- Modify: `backend/src/routes/profile.ts`

- [ ] **Step 1: Utöka PUT /api/profile med nya fält**

Uppdatera Zod-schemat i PUT-handleren:

```typescript
zValidator("json", z.object({
  phone: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  avatar: z.string().optional(),
  selectedCity: z.string().optional(),
  dateOfBirth: z.string().optional(),
  emailVerified: z.boolean().optional(),
  phoneVerified: z.boolean().optional(),
})),
```

Och i update-data lägg till de nya fälten.

- [ ] **Step 2: Lägg till DELETE /api/profile (soft delete)**

```typescript
profileRouter.delete(
  "/",
  zValidator("json", z.object({ phone: z.string() })),
  async (c) => {
    const { phone } = c.req.valid("json");
    // Anonymisera istället för att radera (GDPR soft delete)
    await db.userProfile.update({
      where: { phone },
      data: {
        firstName: "Raderad",
        lastName: "Användare",
        email: `deleted_${Date.now()}@reslot.se`,
        avatar: null,
      },
    });
    // Radera aktiva sessioner
    await db.session.deleteMany({ where: { phone } });
    return c.json({ data: { success: true } });
  }
);
```

---

## Task 7: Mobile — Uppdatera lib/api/types.ts

**Files:**
- Modify: `mobile/src/lib/api/types.ts`

- [ ] **Step 1: Ersätt innehållet med uppdaterade typer**

```typescript
// Backend response types matching Prisma schema

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  cuisine: string;
  neighborhood: string;
  rating: number;
  reviewCount: number;
  priceLevel: number;
  image: string;
  description: string;
  tags: string;
  timesBookedOnReslot: number;
  seatType: string;
  instagram: string | null;
  website: string | null;
  vibeTags: string;
  goodForTags: string;
  foodTags: string;
  latitude: number | null;
  longitude: number | null;
  isExclusive: boolean;
  city: string;
  createdAt: string;
  updatedAt: string;
}

export interface Reservation {
  id: string;
  restaurantId: string;
  submitterPhone: string;
  submitterFirstName: string;
  submitterLastName: string;
  reservationDate: string;
  reservationTime: string;
  partySize: number;
  seatType: string;
  nameOnReservation: string;
  status: "active" | "claimed" | "expired" | "cancelled";
  claimerPhone: string | null;
  cancelFee: number | null;
  prepaidAmount: number | null;
  verificationLink: string | null;
  extraInfo: string | null;
  cancellationWindowHours: number | null;
  createdAt: string;
  updatedAt: string;
  restaurant: Restaurant;
}

export interface UserProfile {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string | null;
  tokens: number;
  selectedCity: string;
  dateOfBirth: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  referralCode: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityAlert {
  id: string;
  userPhone: string;
  type: "drop" | "claim" | "token" | "premium";
  title: string;
  message: string;
  read: boolean;
  restaurantId: string | null;
  createdAt: string;
}

export interface RestaurantAlertWithRestaurant {
  id: string;
  userPhone: string;
  restaurantId: string;
  enabled: boolean;
  createdAt: string;
  restaurant: Restaurant;
}

export interface Watch {
  id: string;
  userPhone: string;
  restaurantId: string | null;
  date: string | null;
  partySize: number | null;
  notes: string | null;
  createdAt: string;
  restaurant: Restaurant | null;
}

export interface TagWithCount {
  label: string;
  count: number;
}

export function parseTags(jsonStr: string): string[] {
  try { return JSON.parse(jsonStr); } catch { return []; }
}

export function parseTagsWithCount(jsonStr: string): TagWithCount[] {
  try { return JSON.parse(jsonStr); } catch { return []; }
}
```

---

## Task 8: Mobile — Uppdatera lib/api/hooks.ts

**Files:**
- Modify: `mobile/src/lib/api/hooks.ts`

- [ ] **Step 1: Läs befintlig hooks.ts och lägg till nya hooks**

Lägg till i slutet av filen (efter befintliga hooks):

```typescript
// ---- Watches (bevakningar) ----
export function useWatches(phone: string | null | undefined) {
  return useQuery({
    queryKey: ["watches", phone],
    queryFn: () => api.get<Watch[]>(`/api/watches?phone=${phone}`),
    enabled: !!phone,
  });
}

export function useAddWatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      userPhone: string;
      restaurantId?: string;
      date?: string;
      partySize?: number;
      notes?: string;
    }) => api.post<Watch>("/api/watches", data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["watches", variables.userPhone] });
    },
  });
}

export function useDeleteWatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; userPhone: string }) =>
      api.delete<{ success: boolean }>(`/api/watches/${id}`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["watches", variables.userPhone] });
    },
  });
}

// ---- Credits purchase ----
export function usePurchaseCredits() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { phone: string; quantity: number }) =>
      api.post<{ success: boolean; newBalance: number }>("/api/credits/purchase", data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["profile", variables.phone] });
    },
  });
}

// ---- Referral ----
export function useReferralCode(phone: string | null | undefined) {
  return useQuery({
    queryKey: ["referralCode", phone],
    queryFn: () => api.get<{ referralCode: string }>(`/api/referral/code?phone=${phone}`),
    enabled: !!phone,
  });
}

export function useUseReferralCode() {
  return useMutation({
    mutationFn: (data: { phone: string; referralCode: string }) =>
      api.post<{ success: boolean }>("/api/referral/use", data),
  });
}

// ---- Delete account ----
export function useDeleteAccount() {
  return useMutation({
    mutationFn: (data: { phone: string }) =>
      api.delete<{ success: boolean }>("/api/profile", data),
  });
}
```

(Se till att `Watch` importeras från types.ts och att `useQueryClient` importeras från react-query)

---

## Task 9: Mobile — Uppdatera faq.tsx (exakt innehåll från spec)

**Files:**
- Modify: `mobile/src/app/faq.tsx`

- [ ] **Step 1: Ersätt FAQ_ITEMS-arrayen med exakt innehåll från spec**

Ersätt `FAQ_ITEMS`-arrayen (rad 21–50) med:

```typescript
const FAQ_ITEMS = [
  {
    q: "Hur fungerar Reslot?",
    a: "Reslot är en marknadsplats där användare delar restaurangbokningar de själva inte kan använda. Du kan ta över en bokning med Reslot credits. Vi samarbetar inte med restauranger och hanterar inte bokningar själva, allt delas mellan användare i appen.",
  },
  {
    q: "Vad är Reslot credits?",
    a: "Credits är det du använder för att ta över en bokning. Du kan få credits genom att lägga upp bokningar, bjuda in vänner eller köpa dem i appen.",
  },
  {
    q: "När betalar jag något?",
    a: "Du betalar inget när du lägger in kortuppgifter. Betalning sker bara om du bryter mot bokningens villkor, till exempel om du inte dyker upp i tid.",
  },
  {
    q: "Varför behöver jag lägga in kortuppgifter?",
    a: "Kortuppgifter används som en säkerhet. Det gör att bokningar tas på allvar och minskar risken för att bord står tomma.",
  },
  {
    q: "Vad händer om jag inte kan gå på bokningen?",
    a: "Du kan avboka enligt restaurangens regler. Om du avbokar för sent eller inte dyker upp kan du bli debiterad.",
  },
  {
    q: "Kan jag ångra en bokning jag tagit över?",
    a: "Ja, så länge du avbokar inom avbokningsfönstret. Efter det gäller restaurangens villkor.",
  },
  {
    q: "Hur fungerar bevakningar?",
    a: "Du kan spara bevakningar för restauranger eller tider du är intresserad av. När en matchande bokning dyker upp får du en notis.",
  },
  {
    q: "Hur får jag fler credits?",
    a: "Du kan få credits genom att lägga upp en bokning, bjuda in en vän eller köpa fler i appen.",
  },
];
```

- [ ] **Step 2: Uppdatera "Kontakta support"-knappen för att navigera till support-skärmen**

I `onPress` för "Kontakta support"-knappen:

```typescript
onPress={() => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  router.push("/support");
}}
```

Lägg till `useRouter` import om ej finns: `import { useRouter } from "expo-router";` och `const router = useRouter();` i komponenten.

---

## Task 10: Mobile — Uppdatera (tabs)/index.tsx (header + terminologi)

**Files:**
- Modify: `mobile/src/app/(tabs)/index.tsx`

- [ ] **Step 1: Läs hela filen (offset 0, limit 200)**

- [ ] **Step 2: Uppdatera header-sektionen**

Hitta header-sektionen och ersätt med denna struktur:

```tsx
{/* Header */}
<SafeAreaView edges={["top"]} style={{ backgroundColor: "#FAFAF8" }}>
  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
    {/* Vänster: FAQ-knapp */}
    <Pressable
      testID="faq-button"
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/faq"); }}
      style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.04)", alignItems: "center", justifyContent: "center" }}
    >
      <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 16, color: "#6B7280" }}>?</Text>
    </Pressable>

    {/* Mitten: Stad-dropdown */}
    <Pressable
      testID="city-selector"
      onPress={() => setShowCityPicker(true)}
      style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
    >
      <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 16, color: "#111827", letterSpacing: -0.3 }}>
        Bokningar i {selectedCity}
      </Text>
      <ChevronDown size={16} color="#6B7280" strokeWidth={2} />
    </Pressable>

    {/* Höger: Sök + Credits */}
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Pressable
        testID="search-button"
        onPress={() => setShowSearch((v) => !v)}
        style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.04)", alignItems: "center", justifyContent: "center" }}
      >
        <Search size={18} color="#6B7280" strokeWidth={2} />
      </Pressable>
      <Pressable
        testID="credits-button"
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/credits"); }}
        style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(201,169,110,0.12)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 }}
      >
        <Coins size={14} color="#C9A96E" strokeWidth={2} />
        <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 13, color: "#C9A96E" }}>
          {credits}
        </Text>
      </Pressable>
    </View>
  </View>
</SafeAreaView>
```

- [ ] **Step 3: Lägg till stad-state och city-picker modal**

```tsx
const CITIES = ["Stockholm", "Göteborg", "Malmö", "Uppsala", "Linköping"];
const [selectedCity, setSelectedCity] = useState(profile?.selectedCity ?? "Stockholm");
const [showCityPicker, setShowCityPicker] = useState(false);
const [showSearch, setShowSearch] = useState(false);
const [searchQuery, setSearchQuery] = useState("");
```

City picker modal (lägg till i JSX, efter huvud-ScrollView):

```tsx
<Modal visible={showCityPicker} transparent animationType="fade" onRequestClose={() => setShowCityPicker(false)}>
  <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }} onPress={() => setShowCityPicker(false)}>
    <Pressable onPress={() => {}} style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 }}>
      <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: "#111827", marginBottom: 16, letterSpacing: -0.3 }}>Välj stad</Text>
      {CITIES.map((city) => (
        <Pressable
          key={city}
          onPress={() => { setSelectedCity(city); setShowCityPicker(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          style={{ paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: "rgba(0,0,0,0.06)", flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
        >
          <Text style={{ fontFamily: city === selectedCity ? "PlusJakartaSans_600SemiBold" : "PlusJakartaSans_400Regular", fontSize: 16, color: city === selectedCity ? "#E06A4E" : "#111827" }}>
            {city}
          </Text>
          {city === selectedCity ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#E06A4E" }} /> : null}
        </Pressable>
      ))}
    </Pressable>
  </Pressable>
</Modal>
```

- [ ] **Step 4: Ta bort VIP-symbol och "8 bord tillgängliga"-text, byt "tokens"/"rewards" → "credits"**

Sök och ta bort: VIP-märkning (exklusiva), "bord tillgängliga"-text.
Ersätt alla "tokens" och "rewards" i UI-text med "credits" eller "Reslot credits".

- [ ] **Step 5: Implementera sökfilter på restaurangnamn**

```tsx
// Filtrera reservations med searchQuery
const filteredReservations = reservations?.filter((r) => {
  if (!searchQuery) return true;
  return r.restaurant?.name?.toLowerCase().includes(searchQuery.toLowerCase());
});
```

Visa sökfält under header när `showSearch` är true:

```tsx
{showSearch ? (
  <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
    <TextInput
      value={searchQuery}
      onChangeText={setSearchQuery}
      placeholder="Sök restaurang..."
      placeholderTextColor="#9CA3AF"
      style={{ backgroundColor: "#FFFFFF", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: "#111827", borderWidth: 0.5, borderColor: "rgba(0,0,0,0.08)" }}
    />
  </View>
) : null}
```

Lägg till `TextInput` i imports. Lägg till `Coins` och `ChevronDown` i lucide-imports. Lägg till `credits` från profil:
```tsx
const credits = profile?.tokens ?? 0;
```

---

## Task 11: Mobile — Uppdatera restaurant/[id].tsx (Om + Bokning + villkor)

**Files:**
- Modify: `mobile/src/app/restaurant/[id].tsx`

- [ ] **Step 1: Läs filen**

Läs `/mobile/src/app/restaurant/[id].tsx` (hela filen).

- [ ] **Step 2: Strukturera om till Om + Bokning-sektioner på samma sida**

Ta bort tab-switching om det finns. Implementera en layout med två tydliga sektioner:

```tsx
{/* OM-sektion */}
<View style={{ marginTop: 20 }}>
  <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 16, color: "#111827", paddingHorizontal: 20, marginBottom: 12, letterSpacing: -0.3 }}>Om</Text>

  {/* Taggar: kök + stämning */}
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
    {parseTags(restaurant.tags).map((tag) => (
      <View key={tag} style={{ backgroundColor: "rgba(139,158,126,0.12)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}>
        <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: "#8B9E7E" }}>{tag}</Text>
      </View>
    ))}
    {parseTagsWithCount(restaurant.vibeTags).map((vt) => (
      <View key={vt.label} style={{ backgroundColor: "rgba(201,169,110,0.12)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}>
        <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: "#C9A96E" }}>{vt.label}</Text>
      </View>
    ))}
  </ScrollView>

  {/* Hemsida + Instagram + Karta */}
  <View style={{ marginTop: 16, paddingHorizontal: 20, gap: 10 }}>
    {restaurant.website ? (
      <Pressable onPress={() => Linking.openURL(restaurant.website!)} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Globe size={16} color="#6B7280" strokeWidth={2} />
        <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: "#6B7280", textDecorationLine: "underline" }}>{restaurant.website}</Text>
      </Pressable>
    ) : null}
    {restaurant.instagram ? (
      <Pressable onPress={() => Linking.openURL(`https://instagram.com/${restaurant.instagram}`)} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Instagram size={16} color="#6B7280" strokeWidth={2} />
        <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: "#6B7280" }}>@{restaurant.instagram}</Text>
      </Pressable>
    ) : null}
    {restaurant.latitude && restaurant.longitude ? (
      <Pressable onPress={() => Linking.openURL(`https://maps.apple.com/?q=${restaurant.latitude},${restaurant.longitude}`)} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <MapPin size={16} color="#6B7280" strokeWidth={2} />
        <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: "#6B7280" }}>{restaurant.address}</Text>
      </Pressable>
    ) : null}
  </View>
</View>

{/* BOKNING-sektion */}
<View style={{ marginTop: 28 }}>
  <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 16, color: "#111827", paddingHorizontal: 20, marginBottom: 12, letterSpacing: -0.3 }}>Bokning</Text>

  {/* Datum, tid, antal */}
  <View style={{ paddingHorizontal: 20, gap: 8 }}>
    <InfoRow icon={<Calendar size={16} color="#9CA3AF" />} label="Datum" value={new Date(reservation.reservationDate).toLocaleDateString("sv-SE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} />
    <InfoRow icon={<Clock size={16} color="#9CA3AF" />} label="Tid" value={reservation.reservationTime} />
    <InfoRow icon={<Users size={16} color="#9CA3AF" />} label="Antal personer" value={`${reservation.partySize} pers`} />
    {reservation.seatType ? <InfoRow icon={<Sofa size={16} color="#9CA3AF" />} label="Plats" value={reservation.seatType} /> : null}
    {reservation.cancellationWindowHours ? <InfoRow icon={<Clock size={16} color="#9CA3AF" />} label="Avbokningsfönster" value={`${reservation.cancellationWindowHours} timmar`} /> : null}
    {reservation.extraInfo ? (
      <View style={{ backgroundColor: "rgba(0,0,0,0.03)", borderRadius: 12, padding: 14, marginTop: 4 }}>
        <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: "#6B7280", lineHeight: 18 }}>{reservation.extraInfo}</Text>
      </View>
    ) : null}
  </View>
</View>
```

- [ ] **Step 3: Lägg till terms checkbox + "Ta över bokning"-knapp**

```tsx
{/* Villkor + Ta över bokning */}
<View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40, gap: 16 }}>
  <Pressable
    testID="terms-checkbox"
    onPress={() => { setTermsAccepted((v) => !v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
    style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}
  >
    <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: termsAccepted ? "#E06A4E" : "rgba(0,0,0,0.2)", backgroundColor: termsAccepted ? "#E06A4E" : "transparent", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
      {termsAccepted ? <Check size={13} color="#FFFFFF" strokeWidth={3} /> : null}
    </View>
    <Text style={{ flex: 1, fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: "#6B7280", lineHeight: 18 }}>
      Jag godkänner villkoren. Jag förstår att om jag inte dyker upp i tid eller avbokar för sent kan jag bli debiterad.
    </Text>
  </Pressable>

  <Pressable
    testID="claim-button"
    disabled={!termsAccepted || isClaiming}
    onPress={handleClaim}
    style={{ backgroundColor: termsAccepted ? "#E06A4E" : "rgba(0,0,0,0.1)", borderRadius: 16, paddingVertical: 16, alignItems: "center", opacity: termsAccepted ? 1 : 0.5 }}
  >
    {isClaiming ? (
      <ActivityIndicator color="#FFFFFF" />
    ) : (
      <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 16, color: termsAccepted ? "#FFFFFF" : "#9CA3AF", letterSpacing: -0.2 }}>
        Ta över bokning
      </Text>
    )}
  </Pressable>
</View>
```

State: `const [termsAccepted, setTermsAccepted] = useState(false);`
State: `const [isClaiming, setIsClaiming] = useState(false);`

Claim handler:
```tsx
const handleClaim = async () => {
  if (!phone || !termsAccepted) return;
  setIsClaiming(true);
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  try {
    await claimReservation({ id: reservation.id, claimerPhone: phone });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  } catch (e) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } finally {
    setIsClaiming(false);
  }
};
```

---

## Task 12: Mobile — Uppdatera (tabs)/reservations.tsx

**Files:**
- Modify: `mobile/src/app/(tabs)/reservations.tsx`

- [ ] **Step 1: Läs filen**

- [ ] **Step 2: Lägg till status-badges och separata sektioner**

Hitta reservation-kortet och lägg till status-badge:

```tsx
// Status badge
<View style={{
  backgroundColor: reservation.status === "active" ? "rgba(139,158,126,0.15)" : "rgba(107,114,128,0.1)",
  borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
}}>
  <Text style={{
    fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 11,
    color: reservation.status === "active" ? "#8B9E7E" : "#9CA3AF",
  }}>
    {reservation.status === "active" ? "Aktiv" : reservation.status === "claimed" ? "Övertagen" : reservation.status === "expired" ? "Utgången" : "Avbokad"}
  </Text>
</View>
```

Separera upplagda vs övertagna:

```tsx
const submittedReservations = myReservations.filter((r) => r.submitterPhone === phone);
const claimedReservations = myReservations.filter((r) => r.claimerPhone === phone);
```

Rendera med tydliga sektionsrubriker:
```tsx
{/* Upplagda av mig */}
<Text style={sectionHeaderStyle}>Upplagda bokningar</Text>
{submittedReservations.length === 0 ? <EmptyState text="Inga upplagda bokningar" /> : submittedReservations.map(r => <ReservationCard key={r.id} reservation={r} />)}

{/* Övertagna av mig */}
<Text style={sectionHeaderStyle}>Övertagna bokningar</Text>
{claimedReservations.length === 0 ? <EmptyState text="Inga övertagna bokningar" /> : claimedReservations.map(r => <ReservationCard key={r.id} reservation={r} />)}
```

---

## Task 13: Mobile — Uppdatera (tabs)/submit.tsx

**Files:**
- Modify: `mobile/src/app/(tabs)/submit.tsx`

- [ ] **Step 1: Läs filen (offset 0, limit 200)**

- [ ] **Step 2: Läs filen (offset 200, limit 200)**

- [ ] **Step 3: Byt $ → kr och lägg till avbokningsfönster-steg + pris per person**

Hitta alla förekomster av `$` i prisfält och byt till `kr`.
Lägg till fält för `extraInfo` (frivillig extra information) och `cancellationWindowHours` i formulärsteget för fees/villkor:

```tsx
// Avbokningsfönster (timmar)
<View style={{ marginBottom: 16 }}>
  <Text style={labelStyle}>Avbokningsfönster (timmar)</Text>
  <Text style={hintStyle}>Antal timmar innan bokningstillfället som avbokning måste ske. Om sen avbokning sker övergår betalningsansvaret till den som tagit över bokningen.</Text>
  <TextInput
    value={cancellationWindowHours}
    onChangeText={setCancellationWindowHours}
    keyboardType="numeric"
    placeholder="t.ex. 24"
    style={inputStyle}
  />
</View>

// Extra information
<View style={{ marginBottom: 16 }}>
  <Text style={labelStyle}>Extra information (valfritt)</Text>
  <TextInput
    value={extraInfo}
    onChangeText={setExtraInfo}
    placeholder="Allergier, klädkod, etc."
    multiline
    style={[inputStyle, { minHeight: 80 }]}
  />
</View>
```

Lägg till state: `const [cancellationWindowHours, setCancellationWindowHours] = useState("");`
Lägg till state: `const [extraInfo, setExtraInfo] = useState("");`

Inkludera i submit-payload:
```typescript
cancellationWindowHours: cancellationWindowHours ? parseInt(cancellationWindowHours) : undefined,
extraInfo: extraInfo || undefined,
```

Visa totalpris per person:
```tsx
{cancelFee && partySize ? (
  <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: "#9CA3AF", marginTop: 4 }}>
    Totalt: {parseInt(cancelFee) * parseInt(partySize)} kr ({cancelFee} kr/person × {partySize} pers)
  </Text>
) : null}
```

---

## Task 14: Mobile — Uppdatera (tabs)/profile.tsx

**Files:**
- Modify: `mobile/src/app/(tabs)/profile.tsx`

- [ ] **Step 1: Ta bort RewardsProgressBar och "Belöningar tillgängliga" sektion**

Ta bort hela `RewardsProgressBar`-komponenten (rader 107–207) och `REWARD_MILESTONES`-konstanten.

- [ ] **Step 2: Ersätt credits-kortet med en enklare credits-visning**

Ersätt rewards-kortet med:

```tsx
{/* Credits-kort */}
<Animated.View entering={FadeInDown.delay(100).duration(500)} className="mx-5 mb-5" testID="credits-card">
  <Pressable
    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/credits"); }}
    style={{ backgroundColor: "#FFFFFF", borderRadius: 20, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 }}
  >
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(201,169,110,0.12)", alignItems: "center", justifyContent: "center" }}>
          <Coins size={20} color="#C9A96E" strokeWidth={2} />
        </View>
        <View>
          <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: "#9CA3AF" }}>Reslot credits</Text>
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 28, color: "#111827", letterSpacing: -1, lineHeight: 32 }}>
            {tokens}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/credits"); }}
          style={{ backgroundColor: "rgba(224,106,78,0.1)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 }}
        >
          <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13, color: "#E06A4E" }}>Köp fler</Text>
        </Pressable>
        <Pressable
          testID="credits-info"
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/credits"); }}
          style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.04)", alignItems: "center", justifyContent: "center" }}
        >
          <Info size={16} color="#9CA3AF" strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  </Pressable>
</Animated.View>
```

- [ ] **Step 3: Ta bort "Belöningar tillgängliga" raden i bokningshistorik-kortet**

Ta bort hela `<View style={{ height: 0.5 ... }}/>` divider och `<View>` med Gift-ikon och "Belöningar Tillgängliga".

- [ ] **Step 4: Uppdatera Konto-menyn**

Ersätt "Bjud in en vän — få 5 tokens" med:
- Label: "Bjud in en vän och få en credit"
- onPress: `router.push("/invite")`

Ersätt "Betalningar" onPress med:
- `router.push("/payment")`

Ersätt "Kontoinställningar" onPress med:
- `router.push("/account-settings")`

Ta bort "Integritet & Säkerhet"-menyn och ersätt "Hjälp & Support" med:
- onPress: `router.push("/support")`

- [ ] **Step 5: Lägg till profilbild-knapp**

I profilbild-sektionen, lägg till kamerasymbols-overlay:

```tsx
<Pressable
  testID="profile-image-button"
  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/account-settings"); }}
  style={{ position: "relative" }}
>
  <Image source={{ uri: avatar }} style={{ width: 84, height: 84, borderRadius: 42, borderWidth: 3, borderColor: "rgba(224,106,78,0.15)" }} />
  <View style={{ position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: "#E06A4E", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#FAFAF8" }}>
    <Camera size={12} color="#FFFFFF" strokeWidth={2.5} />
  </View>
</Pressable>
```

Lägg till `Camera`, `Coins`, `Info` i lucide-imports.

---

## Task 15: Mobile — Uppdatera (tabs)/alerts.tsx (Mina bevakningar)

**Files:**
- Modify: `mobile/src/app/(tabs)/alerts.tsx`

- [ ] **Step 1: Läs filen**

- [ ] **Step 2: Byt rubrik och lägg till bevaknings-tab**

Lägg till tab-navigation mellan "Aktivitet" och "Bevakningar":

```tsx
const [activeTab, setActiveTab] = useState<"activity" | "watches">("activity");
```

Header med tabs:
```tsx
<View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 0 }}>
  <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 26, color: "#111827", letterSpacing: -0.8, marginBottom: 16 }}>
    Notiser
  </Text>
  <View style={{ flexDirection: "row", backgroundColor: "rgba(0,0,0,0.05)", borderRadius: 12, padding: 3 }}>
    {(["activity", "watches"] as const).map((tab) => (
      <Pressable
        key={tab}
        onPress={() => { setActiveTab(tab); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
        style={{ flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: activeTab === tab ? "#FFFFFF" : "transparent", alignItems: "center", shadowColor: activeTab === tab ? "#000" : "transparent", shadowOffset: { width: 0, height: 1 }, shadowOpacity: activeTab === tab ? 0.06 : 0, shadowRadius: 4, elevation: activeTab === tab ? 1 : 0 }}
      >
        <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13, color: activeTab === tab ? "#111827" : "#9CA3AF" }}>
          {tab === "activity" ? "Aktivitet" : "Mina bevakningar"}
        </Text>
      </Pressable>
    ))}
  </View>
</View>
```

- [ ] **Step 3: Implementera bevakningstab**

```tsx
{activeTab === "watches" ? (
  <View style={{ flex: 1 }}>
    {/* Lägg till bevakning-knapp */}
    <Pressable
      testID="add-watch-button"
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/add-watch"); }}
      style={{ marginHorizontal: 20, marginTop: 16, marginBottom: 12, backgroundColor: "#E06A4E", borderRadius: 14, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}
    >
      <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
      <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: "#FFFFFF" }}>Lägg till bevakning</Text>
    </Pressable>

    {/* Lista bevakningar */}
    {watchesLoading ? (
      <ActivityIndicator color="#E06A4E" style={{ marginTop: 40 }} />
    ) : watches.length === 0 ? (
      <View style={{ alignItems: "center", paddingTop: 60 }}>
        <Eye size={40} color="#D1D5DB" strokeWidth={1.5} />
        <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 15, color: "#9CA3AF", marginTop: 12 }}>Inga bevakningar än</Text>
        <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: "#D1D5DB", marginTop: 4, textAlign: "center", paddingHorizontal: 40 }}>
          Lägg till bevakningar för att få notis när en matchande bokning dyker upp.
        </Text>
      </View>
    ) : (
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, gap: 10, marginTop: 4 }}>
        {watches.map((watch) => (
          <Animated.View key={watch.id} entering={FadeInDown.duration(300).springify()}>
            <View style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: "#111827" }}>
                  {watch.restaurant?.name ?? "Valfri restaurang"}
                </Text>
                <View style={{ flexDirection: "row", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
                  {watch.date ? <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: "#9CA3AF" }}>{watch.date}</Text> : null}
                  {watch.partySize ? <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: "#9CA3AF" }}>{watch.partySize} pers</Text> : null}
                  {watch.notes ? <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 12, color: "#9CA3AF" }}>{watch.notes}</Text> : null}
                </View>
              </View>
              <Pressable
                onPress={() => { deleteWatch({ id: watch.id, userPhone: phone! }); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(224,106,78,0.08)", alignItems: "center", justifyContent: "center" }}
              >
                <Trash2 size={15} color="#E06A4E" strokeWidth={2} />
              </Pressable>
            </View>
          </Animated.View>
        ))}
      </ScrollView>
    )}
  </View>
) : (
  // befintlig aktivitets-lista här
  <ExistingActivityList />
)}
```

Lägg till hooks:
```tsx
const { data: watches = [], isLoading: watchesLoading } = useWatches(phone);
const { mutate: deleteWatch } = useDeleteWatch();
```

Imports att lägga till: `Plus`, `Eye`, `Trash2` från lucide-react-native, `useWatches`, `useDeleteWatch` från hooks.

---

## Task 16: Mobile — Uppdatera credits.tsx

**Files:**
- Modify: `mobile/src/app/credits.tsx`

- [ ] **Step 1: Navigera från "Bjud in en vän" till /invite**

Hitta `ActionRow` med `testID="invite-friend-button"` och uppdatera onPress:
```tsx
onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/invite"); }}
```

- [ ] **Step 2: Lägg till info-sektioner om credits**

Efter balance-kortet, lägg till en kort förklaringstext:

```tsx
<Animated.View entering={FadeInDown.delay(140).duration(400).springify()} style={{ marginHorizontal: 20, marginTop: 20, backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: "rgba(0,0,0,0.07)" }}>
  <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: "#111827", marginBottom: 8 }}>Vad är credits?</Text>
  <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: "#6B7280", lineHeight: 20 }}>
    Credits är det du använder för att ta över en bokning på Reslot. Du använder credits istället för att betala pengar direkt till den som lägger upp bokningen.
  </Text>
</Animated.View>
```

---

## Task 17: Mobile — Skapa account-settings.tsx

**Files:**
- Create: `mobile/src/app/account-settings.tsx`
- Modify: `mobile/src/app/_layout.tsx`

- [ ] **Step 1: Skapa account-settings.tsx**

```tsx
import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Check, AlertTriangle } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useProfile } from "@/lib/api/hooks";
import { useAuthStore } from "@/lib/auth-store";

const DARK = "#111827";
const BG = "#FAFAF8";
const CORAL = "#E06A4E";

function InputField({
  label, value, onChangeText, placeholder, keyboardType = "default", verified,
}: {
  label: string; value: string; onChangeText: (v: string) => void; placeholder?: string;
  keyboardType?: "default" | "email-address" | "phone-pad"; verified?: boolean;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6, gap: 6 }}>
        <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: "#6B7280" }}>{label}</Text>
        {verified !== undefined ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: verified ? "rgba(139,158,126,0.15)" : "rgba(201,169,110,0.15)", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
            <Check size={10} color={verified ? "#8B9E7E" : "#C9A96E"} strokeWidth={3} />
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 10, color: verified ? "#8B9E7E" : "#C9A96E" }}>
              {verified ? "Verifierad" : "Ej verifierad"}
            </Text>
          </View>
        ) : null}
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#D1D5DB"
        keyboardType={keyboardType}
        style={{ backgroundColor: "#FFFFFF", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontFamily: "PlusJakartaSans_400Regular", fontSize: 15, color: DARK, borderWidth: 0.5, borderColor: "rgba(0,0,0,0.08)" }}
      />
    </View>
  );
}

export default function AccountSettingsScreen() {
  const router = useRouter();
  const phone = useAuthStore((s) => s.phoneNumber);
  const logout = useAuthStore((s) => s.logout);
  const { data: profile, isLoading } = useProfile(phone || "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [firstName, setFirstName] = useState(profile?.firstName ?? "");
  const [lastName, setLastName] = useState(profile?.lastName ?? "");
  const [email, setEmail] = useState(profile?.email ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(profile?.dateOfBirth ?? "");
  const [city, setCity] = useState(profile?.selectedCity ?? "Stockholm");
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
      setEmail(profile.email);
      setDateOfBirth(profile.dateOfBirth ?? "");
      setCity(profile.selectedCity);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!phone) return;
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL!;
      await fetch(`${baseUrl}/api/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, firstName, lastName, email, dateOfBirth, selectedCity: city }),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!phone) return;
    const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL!;
    await fetch(`${baseUrl}/api/profile`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    logout();
    router.replace("/onboarding");
  };

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: BG }}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
          <Pressable testID="back-button" onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.04)", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
            <ChevronLeft size={20} color="#6B7280" strokeWidth={2} />
          </Pressable>
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 20, color: DARK, letterSpacing: -0.4, flex: 1 }}>Kontoinställningar</Text>
          <Pressable testID="save-button" onPress={handleSave} disabled={saving} style={{ backgroundColor: CORAL, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8 }}>
            {saving ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: "#FFFFFF" }}>Spara</Text>}
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80 }}>
        {isLoading ? <ActivityIndicator color={CORAL} style={{ marginTop: 40 }} /> : (
          <Animated.View entering={FadeInDown.duration(400)}>
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 11, color: "#9CA3AF", letterSpacing: 1, textTransform: "uppercase", marginBottom: 14, marginTop: 8 }}>Personuppgifter</Text>
            <InputField label="Förnamn" value={firstName} onChangeText={setFirstName} placeholder="Anna" />
            <InputField label="Efternamn" value={lastName} onChangeText={setLastName} placeholder="Svensson" />
            <InputField label="Födelsedag" value={dateOfBirth} onChangeText={setDateOfBirth} placeholder="ÅÅÅÅ-MM-DD" />
            <InputField label="Stad" value={city} onChangeText={setCity} placeholder="Stockholm" />

            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 11, color: "#9CA3AF", letterSpacing: 1, textTransform: "uppercase", marginBottom: 14, marginTop: 24 }}>Kontaktuppgifter</Text>
            <InputField label="E-post" value={email} onChangeText={setEmail} placeholder="anna@example.com" keyboardType="email-address" verified={profile?.emailVerified} />
            <InputField label="Telefon" value={phone ?? ""} onChangeText={() => {}} placeholder={phone ?? ""} keyboardType="phone-pad" verified={profile?.phoneVerified} />

            {/* Radera konto */}
            <Pressable
              testID="delete-account-button"
              onPress={() => { setShowDeleteConfirm(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); }}
              style={{ marginTop: 40, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: "rgba(224,106,78,0.3)", alignItems: "center" }}
            >
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: CORAL }}>Radera konto</Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>

      {/* Delete confirmation modal */}
      <Modal visible={showDeleteConfirm} transparent animationType="fade" onRequestClose={() => setShowDeleteConfirm(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" }} onPress={() => setShowDeleteConfirm(false)}>
          <Pressable onPress={() => {}} style={{ backgroundColor: "#FFFFFF", borderRadius: 24, padding: 28, marginHorizontal: 32, alignItems: "center" }}>
            <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: "rgba(224,106,78,0.1)", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <AlertTriangle size={24} color={CORAL} strokeWidth={2} />
            </View>
            <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 18, color: DARK, letterSpacing: -0.3, textAlign: "center" }}>Radera konto?</Text>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: "#6B7280", marginTop: 8, textAlign: "center", lineHeight: 20 }}>
              Det här går inte att ångra. All din data raderas permanent i enlighet med GDPR.
            </Text>
            <View style={{ flexDirection: "row", gap: 12, marginTop: 24, width: "100%" }}>
              <Pressable onPress={() => setShowDeleteConfirm(false)} style={{ flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.06)", alignItems: "center" }}>
                <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: DARK }}>Avbryt</Text>
              </Pressable>
              <Pressable testID="confirm-delete-button" onPress={handleDeleteAccount} style={{ flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: CORAL, alignItems: "center" }}>
                <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: "#FFFFFF" }}>Radera</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
```

- [ ] **Step 2: Registrera i _layout.tsx**

```typescript
<Stack.Screen name="account-settings" options={{ presentation: "modal", headerShown: false }} />
```

---

## Task 18: Mobile — Skapa payment.tsx

**Files:**
- Create: `mobile/src/app/payment.tsx`
- Modify: `mobile/src/app/_layout.tsx`

- [ ] **Step 1: Skapa payment.tsx**

```tsx
import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Shield, CreditCard, AlertCircle, CheckCircle } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

const DARK = "#111827";
const BG = "#FAFAF8";
const CORAL = "#E06A4E";

export default function PaymentScreen() {
  const router = useRouter();
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [saved, setSaved] = useState(false);

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 16);
    const groups = cleaned.match(/.{1,4}/g) ?? [];
    return groups.join(" ");
  };

  const formatExpiry = (text: string) => {
    const cleaned = text.replace(/\D/g, "").slice(0, 4);
    if (cleaned.length >= 3) return `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    return cleaned;
  };

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaved(true);
    setTimeout(() => router.back(), 1200);
  };

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: BG }}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
          <Pressable testID="back-button" onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.04)", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
            <ChevronLeft size={20} color="#6B7280" strokeWidth={2} />
          </Pressable>
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 20, color: DARK, letterSpacing: -0.4 }}>Betalningar</Text>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80 }}>
        {/* Informationsruta */}
        <Animated.View entering={FadeInDown.delay(0).duration(400).springify()} style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, borderWidth: 0.5, borderColor: "rgba(0,0,0,0.07)", marginBottom: 24, gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Shield size={18} color="#8B9E7E" strokeWidth={2} />
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: DARK }}>Säker betalning</Text>
          </View>
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: "#6B7280", lineHeight: 20 }}>
            Inga pengar dras enbart av att du lägger in kortuppgifter.
          </Text>
          <View style={{ height: 0.5, backgroundColor: "rgba(0,0,0,0.06)" }} />
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
            <AlertCircle size={14} color="#C9A96E" strokeWidth={2} style={{ marginTop: 2 }} />
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: "#6B7280", lineHeight: 18, flex: 1 }}>
              Betalning sker bara om du bryter mot bokningens villkor — till exempel om du inte dyker upp i tid eller avbokar för sent.
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
            <AlertCircle size={14} color="#C9A96E" strokeWidth={2} style={{ marginTop: 2 }} />
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: "#6B7280", lineHeight: 18, flex: 1 }}>
              Betalningsansvar uppstår när avbokningsfönstret passerat och du inte avbokat bokningen.
            </Text>
          </View>
        </Animated.View>

        {/* Kortuppgifter */}
        <Animated.View entering={FadeInDown.delay(80).duration(400).springify()}>
          <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 11, color: "#9CA3AF", letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>Kortuppgifter</Text>

          <View style={{ gap: 12 }}>
            <View>
              <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: "#6B7280", marginBottom: 6 }}>Kortinnehavare</Text>
              <TextInput value={cardName} onChangeText={setCardName} placeholder="Anna Svensson" placeholderTextColor="#D1D5DB" style={{ backgroundColor: "#FFFFFF", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontFamily: "PlusJakartaSans_400Regular", fontSize: 15, color: DARK, borderWidth: 0.5, borderColor: "rgba(0,0,0,0.08)" }} />
            </View>
            <View>
              <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: "#6B7280", marginBottom: 6 }}>Kortnummer</Text>
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 14, paddingHorizontal: 16, borderWidth: 0.5, borderColor: "rgba(0,0,0,0.08)" }}>
                <CreditCard size={16} color="#D1D5DB" strokeWidth={2} style={{ marginRight: 10 }} />
                <TextInput value={cardNumber} onChangeText={(t) => setCardNumber(formatCardNumber(t))} placeholder="0000 0000 0000 0000" placeholderTextColor="#D1D5DB" keyboardType="numeric" style={{ flex: 1, paddingVertical: 13, fontFamily: "PlusJakartaSans_400Regular", fontSize: 15, color: DARK }} />
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: "#6B7280", marginBottom: 6 }}>Utgångsdatum</Text>
                <TextInput value={expiry} onChangeText={(t) => setExpiry(formatExpiry(t))} placeholder="MM/ÅÅ" placeholderTextColor="#D1D5DB" keyboardType="numeric" style={{ backgroundColor: "#FFFFFF", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontFamily: "PlusJakartaSans_400Regular", fontSize: 15, color: DARK, borderWidth: 0.5, borderColor: "rgba(0,0,0,0.08)" }} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: "#6B7280", marginBottom: 6 }}>CVC</Text>
                <TextInput value={cvc} onChangeText={(t) => setCvc(t.replace(/\D/g, "").slice(0, 4))} placeholder="123" placeholderTextColor="#D1D5DB" keyboardType="numeric" secureTextEntry style={{ backgroundColor: "#FFFFFF", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontFamily: "PlusJakartaSans_400Regular", fontSize: 15, color: DARK, borderWidth: 0.5, borderColor: "rgba(0,0,0,0.08)" }} />
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).duration(400).springify()} style={{ marginTop: 32 }}>
          {saved ? (
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16 }}>
              <CheckCircle size={20} color="#8B9E7E" strokeWidth={2} />
              <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: "#8B9E7E" }}>Kortuppgifter sparade!</Text>
            </View>
          ) : (
            <Pressable testID="save-card-button" onPress={handleSave} style={{ backgroundColor: DARK, borderRadius: 16, paddingVertical: 16, alignItems: "center" }}>
              <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 16, color: "#FFFFFF", letterSpacing: -0.2 }}>Spara kortuppgifter</Text>
            </Pressable>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 2: Registrera i _layout.tsx**

```typescript
<Stack.Screen name="payment" options={{ presentation: "modal", headerShown: false }} />
```

---

## Task 19: Mobile — Skapa invite.tsx

**Files:**
- Create: `mobile/src/app/invite.tsx`
- Modify: `mobile/src/app/_layout.tsx`

- [ ] **Step 1: Skapa invite.tsx**

```tsx
import React from "react";
import { View, Text, ScrollView, Pressable, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Copy, Share2, UserPlus, CheckCircle } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useReferralCode } from "@/lib/api/hooks";
import { useAuthStore } from "@/lib/auth-store";

const DARK = "#111827";
const BG = "#FAFAF8";
const CORAL = "#E06A4E";

export default function InviteScreen() {
  const router = useRouter();
  const phone = useAuthStore((s) => s.phoneNumber);
  const { data: referralData } = useReferralCode(phone);
  const referralCode = referralData?.referralCode ?? "LADDAR...";
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === "web") {
      navigator.clipboard.writeText(referralCode).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { Share } = require("react-native");
    Share.share({
      message: `Prova Reslot — ta över restaurangbokningar i sista minuten! Använd min kod ${referralCode} när du registrerar dig så får vi båda 1 credit.`,
      title: "Prova Reslot",
    }).catch(() => {});
  };

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: BG }}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
          <Pressable testID="back-button" onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.04)", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
            <ChevronLeft size={20} color="#6B7280" strokeWidth={2} />
          </Pressable>
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 20, color: DARK, letterSpacing: -0.4 }}>Bjud in en vän</Text>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80 }}>
        {/* Hero */}
        <Animated.View entering={FadeInDown.delay(0).duration(400).springify()} style={{ alignItems: "center", paddingTop: 24, paddingBottom: 32 }}>
          <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: "rgba(224,106,78,0.1)", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <UserPlus size={32} color={CORAL} strokeWidth={1.8} />
          </View>
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 26, color: DARK, letterSpacing: -0.8, textAlign: "center" }}>
            Dela och få credits
          </Text>
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 15, color: "#6B7280", marginTop: 10, textAlign: "center", lineHeight: 22, maxWidth: 300 }}>
            Du och din vän får vardera 1 credit när din vän registrerar sig med din kod.
          </Text>
        </Animated.View>

        {/* Referralkod */}
        <Animated.View entering={FadeInDown.delay(80).duration(400).springify()}>
          <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 11, color: "#9CA3AF", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Din referralkod</Text>
          <View style={{ backgroundColor: "#FFFFFF", borderRadius: 20, padding: 20, borderWidth: 0.5, borderColor: "rgba(0,0,0,0.08)", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 32, color: DARK, letterSpacing: 4, textAlign: "center", marginBottom: 16 }}>
              {referralCode}
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable testID="copy-code-button" onPress={handleCopy} style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: copied ? "rgba(139,158,126,0.15)" : "rgba(0,0,0,0.05)", borderRadius: 14, paddingVertical: 12 }}>
                {copied ? <CheckCircle size={16} color="#8B9E7E" strokeWidth={2} /> : <Copy size={16} color="#6B7280" strokeWidth={2} />}
                <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: copied ? "#8B9E7E" : "#6B7280" }}>
                  {copied ? "Kopierad!" : "Kopiera"}
                </Text>
              </Pressable>
              <Pressable testID="share-button" onPress={handleShare} style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: CORAL, borderRadius: 14, paddingVertical: 12 }}>
                <Share2 size={16} color="#FFFFFF" strokeWidth={2} />
                <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: "#FFFFFF" }}>Dela</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* Skydd mot missbruk */}
        <Animated.View entering={FadeInDown.delay(160).duration(400).springify()} style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginTop: 20, borderWidth: 0.5, borderColor: "rgba(0,0,0,0.07)", gap: 10 }}>
          <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 13, color: DARK }}>Hur det fungerar</Text>
          {[
            "Din vän registrerar sig på Reslot",
            "Din vän anger din referralkod",
            "Ni får båda 1 Reslot credit",
          ].map((step, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "rgba(224,106,78,0.1)", alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 11, color: CORAL }}>{i + 1}</Text>
              </View>
              <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: "#6B7280", flex: 1 }}>{step}</Text>
            </View>
          ))}
        </Animated.View>
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 2: Registrera i _layout.tsx**

```typescript
<Stack.Screen name="invite" options={{ presentation: "modal", headerShown: false }} />
```

---

## Task 20: Mobile — Skapa support.tsx

**Files:**
- Create: `mobile/src/app/support.tsx`
- Modify: `mobile/src/app/_layout.tsx`

- [ ] **Step 1: Skapa support.tsx**

```tsx
import React from "react";
import { View, Text, ScrollView, Pressable, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, MessageCircle, Mail, Bell } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

const DARK = "#111827";
const BG = "#FAFAF8";
const CORAL = "#E06A4E";

function SupportOption({ icon, title, subtitle, onPress, testID }: { icon: React.ReactNode; title: string; subtitle: string; onPress: () => void; testID?: string }) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={{ backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 0.5, borderColor: "rgba(0,0,0,0.07)", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}
    >
      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(224,106,78,0.1)", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: DARK, letterSpacing: -0.1 }}>{title}</Text>
        <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: "#9CA3AF", marginTop: 2, lineHeight: 18 }}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

export default function SupportScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: BG }}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
          <Pressable testID="back-button" onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.04)", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
            <ChevronLeft size={20} color="#6B7280" strokeWidth={2} />
          </Pressable>
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 20, color: DARK, letterSpacing: -0.4 }}>Hjälp och support</Text>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80 }}>
        <Animated.View entering={FadeInDown.delay(0).duration(400).springify()} style={{ paddingTop: 16, paddingBottom: 28 }}>
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 15, color: "#6B7280", lineHeight: 22 }}>
            Vi hjälper dig gärna. Välj hur du vill komma i kontakt med oss.
          </Text>
        </Animated.View>

        <View style={{ gap: 12 }}>
          <Animated.View entering={FadeInDown.delay(40).duration(400).springify()}>
            <SupportOption
              testID="chat-support"
              icon={<MessageCircle size={20} color={CORAL} strokeWidth={2} />}
              title="Chatta med support"
              subtitle="Vi svarar vanligtvis inom ett par timmar. Du får en notis när vi svarar."
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(80).duration(400).springify()}>
            <SupportOption
              testID="email-support"
              icon={<Mail size={20} color={CORAL} strokeWidth={2} />}
              title="Skicka e-post"
              subtitle="support@reslot.se — vi svarar inom 24 timmar."
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Linking.openURL("mailto:support@reslot.se"); }}
            />
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.delay(160).duration(400).springify()} style={{ backgroundColor: "rgba(224,106,78,0.06)", borderRadius: 16, padding: 16, marginTop: 28, flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
          <Bell size={16} color={CORAL} strokeWidth={2} style={{ marginTop: 2 }} />
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: "#6B7280", lineHeight: 20, flex: 1 }}>
            Vid chatt-support får du en push-notis när en supportmedarbetare svarar på ditt ärende.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 2: Registrera i _layout.tsx**

```typescript
<Stack.Screen name="support" options={{ presentation: "modal", headerShown: false }} />
```

---

## Task 21: Mobile — Skapa add-watch.tsx

**Files:**
- Create: `mobile/src/app/add-watch.tsx`
- Modify: `mobile/src/app/_layout.tsx`

- [ ] **Step 1: Skapa add-watch.tsx**

```tsx
import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useAddWatch } from "@/lib/api/hooks";
import { useAuthStore } from "@/lib/auth-store";
import { useRestaurants } from "@/lib/api/hooks";

const DARK = "#111827";
const BG = "#FAFAF8";
const CORAL = "#E06A4E";

export default function AddWatchScreen() {
  const router = useRouter();
  const phone = useAuthStore((s) => s.phoneNumber);
  const { data: restaurants = [] } = useRestaurants();
  const { mutate: addWatch, isPending } = useAddWatch();

  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [partySize, setPartySize] = useState("");
  const [notes, setNotes] = useState("");

  const handleAdd = () => {
    if (!phone) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addWatch({
      userPhone: phone,
      restaurantId: selectedRestaurantId ?? undefined,
      date: date || undefined,
      partySize: partySize ? parseInt(partySize) : undefined,
      notes: notes || undefined,
    }, {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: BG }}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
          <Pressable testID="back-button" onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.04)", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
            <ChevronLeft size={20} color="#6B7280" strokeWidth={2} />
          </Pressable>
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 20, color: DARK, letterSpacing: -0.4, flex: 1 }}>Lägg till bevakning</Text>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80 }}>
        <Animated.View entering={FadeInDown.delay(0).duration(400).springify()}>
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: "#6B7280", lineHeight: 20, marginBottom: 24 }}>
            Välj vad du vill bevaka. Du får en notis när en matchande bokning dyker upp.
          </Text>

          {/* Restaurangval */}
          <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 11, color: "#9CA3AF", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Restaurang (valfritt)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, marginBottom: 20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, flexGrow: 0 }}>
            <Pressable
              onPress={() => { setSelectedRestaurantId(null); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: !selectedRestaurantId ? CORAL : "#FFFFFF", borderWidth: 0.5, borderColor: !selectedRestaurantId ? CORAL : "rgba(0,0,0,0.1)" }}
            >
              <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: !selectedRestaurantId ? "#FFFFFF" : "#6B7280" }}>Valfri</Text>
            </Pressable>
            {restaurants.map((r) => (
              <Pressable
                key={r.id}
                onPress={() => { setSelectedRestaurantId(r.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: selectedRestaurantId === r.id ? CORAL : "#FFFFFF", borderWidth: 0.5, borderColor: selectedRestaurantId === r.id ? CORAL : "rgba(0,0,0,0.1)" }}
              >
                <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: selectedRestaurantId === r.id ? "#FFFFFF" : "#6B7280" }}>{r.name}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Datum */}
          <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 11, color: "#9CA3AF", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Datum (valfritt)</Text>
          <TextInput value={date} onChangeText={setDate} placeholder="t.ex. 2026-04-15" placeholderTextColor="#D1D5DB" style={{ backgroundColor: "#FFFFFF", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontFamily: "PlusJakartaSans_400Regular", fontSize: 15, color: DARK, borderWidth: 0.5, borderColor: "rgba(0,0,0,0.08)", marginBottom: 16 }} />

          {/* Antal */}
          <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 11, color: "#9CA3AF", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Antal personer (valfritt)</Text>
          <TextInput value={partySize} onChangeText={setPartySize} keyboardType="numeric" placeholder="t.ex. 2" placeholderTextColor="#D1D5DB" style={{ backgroundColor: "#FFFFFF", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontFamily: "PlusJakartaSans_400Regular", fontSize: 15, color: DARK, borderWidth: 0.5, borderColor: "rgba(0,0,0,0.08)", marginBottom: 16 }} />

          {/* Anteckningar */}
          <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 11, color: "#9CA3AF", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Anteckningar (valfritt)</Text>
          <TextInput value={notes} onChangeText={setNotes} placeholder="t.ex. Kvällsbokning föredras" placeholderTextColor="#D1D5DB" multiline style={{ backgroundColor: "#FFFFFF", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontFamily: "PlusJakartaSans_400Regular", fontSize: 15, color: DARK, borderWidth: 0.5, borderColor: "rgba(0,0,0,0.08)", minHeight: 80, marginBottom: 32 }} />

          <Pressable
            testID="add-watch-submit"
            onPress={handleAdd}
            disabled={isPending}
            style={{ backgroundColor: DARK, borderRadius: 16, paddingVertical: 16, alignItems: "center" }}
          >
            {isPending ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 16, color: "#FFFFFF", letterSpacing: -0.2 }}>Lägg till bevakning</Text>}
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
```

- [ ] **Step 2: Registrera i _layout.tsx**

```typescript
<Stack.Screen name="add-watch" options={{ presentation: "modal", headerShown: false }} />
```

---

## Task 22: Mobile — Uppdatera _layout.tsx (registrera alla nya screens)

**Files:**
- Modify: `mobile/src/app/_layout.tsx`

- [ ] **Step 1: Lägg till alla nya skärmar i Stack**

I `_layout.tsx`, i `<Stack>`-blocket, lägg till:

```tsx
<Stack.Screen name="account-settings" options={{ presentation: "modal", headerShown: false }} />
<Stack.Screen name="payment" options={{ presentation: "modal", headerShown: false }} />
<Stack.Screen name="invite" options={{ presentation: "modal", headerShown: false }} />
<Stack.Screen name="support" options={{ presentation: "modal", headerShown: false }} />
<Stack.Screen name="add-watch" options={{ presentation: "modal", headerShown: false }} />
```

---

## Task 23: Backend — Montera alla routes i index.ts

**Files:**
- Modify: `backend/src/index.ts`

- [ ] **Step 1: Läs befintlig index.ts**

- [ ] **Step 2: Lägg till alla nya routes**

```typescript
import { watchesRouter } from "./routes/watches";
import { creditsRouter } from "./routes/credits";
import { referralRouter } from "./routes/referral";

// I app.route-sektionen:
app.route("/api/watches", watchesRouter);
app.route("/api/credits", creditsRouter);
app.route("/api/referral", referralRouter);
```

---

## Verification Checklist

Gå igenom specifikationen punkt för punkt:

- [ ] FAQ: 8 exakta frågor och svar implementerade ordagrant
- [ ] FAQ: Rubrik "Frågor och svar"
- [ ] FAQ: "Hittar du inte din fråga här?" + "Kontakta support"-knapp → navigerar till support.tsx
- [ ] Hem: "?"-knapp → FAQ
- [ ] Hem: "Bokningar i [Stad]" dropdown
- [ ] Hem: Credits-ikon → credits-sidan
- [ ] Hem: Sök filtrerar på restaurangnamn
- [ ] Hem: "Reslot credits" (ej rewards/tokens)
- [ ] Hem: Ingen VIP-symbol
- [ ] Hem: Ingen "X bord tillgängliga"-text
- [ ] Restaurang: Om-sektion (taggar, hemsida, Instagram, karta)
- [ ] Restaurang: Bokning-sektion (datum, tid, antal, avbokningsfönster, extraInfo)
- [ ] Restaurang: Checkbox "Jag godkänner villkoren"
- [ ] Restaurang: "Ta över bokning"-knapp (disabled tills checkbox)
- [ ] Restaurang: Claim skapar ActivityAlert-bekräftelse
- [ ] Bokningar: Status-badge "Aktiv" (grön) / "Övertagen" (grå)
- [ ] Bokningar: Upplagda och övertagna separerade
- [ ] Lägg upp: Avbokningsfönster-fält med förklaring
- [ ] Lägg upp: kr istället för $
- [ ] Lägg upp: Pris per person, totalpris räknas ut
- [ ] Profil: Credits visas som siffra (inte progress bar)
- [ ] Profil: Möjlighet att köpa fler credits + info-symbol → credits
- [ ] Profil: Bokningshistorik (upplagda + övertagna)
- [ ] Profil: Ingen "Belöningar tillgängliga"-sektion
- [ ] Profil: "Bjud in en vän och få en credit" → invite.tsx
- [ ] Profil: "Betalningar" → payment.tsx
- [ ] Profil: "Hjälp och support" → support.tsx
- [ ] Profil: Profilbild-ikon/knapp för att ändra bild
- [ ] Bevakningar: Rubrik "Mina bevakningar"
- [ ] Bevakningar: Lista med sparade bevakningar
- [ ] Bevakningar: Knapp "Lägg till bevakning" → add-watch.tsx
- [ ] Credits: Tydlig siffra (stort, prominent) — redan bra
- [ ] Credits: "Bjud in en vän" → invite.tsx
- [ ] Kontoinställningar: Förnamn, efternamn, e-post, telefon, födelsedag, stad
- [ ] Kontoinställningar: Verifieringsindikator e-post + telefon
- [ ] Kontoinställningar: "Radera konto" med bekräftelsedialog
- [ ] Betalning: Kortformulär
- [ ] Betalning: "Inga pengar dras enbart av att du lägger in kortuppgifter"
- [ ] Betalning: Förklaring när betalning sker
- [ ] Betalning: Förklaring när betalningsansvar uppstår
- [ ] Bjud in: Info "Du och din vän får vardera 1 credit"
- [ ] Bjud in: Unik referralkod som kan kopieras
- [ ] Support: Kontakta via chatt eller e-post
- [ ] Support: Info om att push-notis ges när svar kommit
- [ ] Backend: Watch CRUD
- [ ] Backend: Credits purchase (39 kr/credit)
- [ ] Backend: Referral generate + validate + anti-abuse
- [ ] Backend: Claim skapar ActivityAlert
- [ ] Backend: Profile update (alla fält)
- [ ] Backend: Account delete (soft/GDPR)
