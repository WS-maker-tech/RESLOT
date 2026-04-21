# App Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all dead links, broken interactions, and missing infrastructure so the Reslot app is practically complete with dev simulation for payments.

**Architecture:** Six targeted fixes across mobile and backend. Each task is self-contained. Tasks 1–5 are independent and can run in parallel. Task 6 (seed script) is backend-only.

**Tech Stack:** Expo SDK 53, React Native 0.76, NativeWind, React Query, Hono, Prisma, Supabase Auth, Stripe (dev simulation).

---

## Confirmed bugs

| # | File | Problem |
|---|------|---------|
| 1 | `mobile/src/app/account-settings.tsx:74-79, 96-100` | PUT and DELETE calls missing `Authorization: Bearer` header — backend `authMiddleware` rejects them |
| 2 | `mobile/src/app/invite.tsx:19-24` | Copy-to-clipboard uses `navigator.clipboard` (web-only) — silent failure on iOS/Android |
| 3 | `mobile/src/app/(tabs)/profile.tsx:646-659` | "Sparade" stat card has haptics but no navigation — dead link |
| 4 | `mobile/src/app/_layout.tsx` | No `saved` route registered |
| 5 | No `backend/scripts/seed.ts` | Cannot populate dev database |
| 6 | No `.env.example` files | Onboarding friction for new devs/agents |

---

## Task 1: Fix account-settings.tsx auth headers

**Files:**
- Modify: `mobile/src/app/account-settings.tsx:44-111`

- [ ] **Step 1: Read the current file**

Open `mobile/src/app/account-settings.tsx`. Confirm lines 74-79 and 96-100 do not include an `Authorization` header.

- [ ] **Step 2: Add sessionToken to the component**

At line 46, after `const logout = useAuthStore((s) => s.logout);`, add:

```typescript
const sessionToken = useAuthStore((s) => s.sessionToken);
```

- [ ] **Step 3: Fix the handleSave fetch (lines 74-79)**

Replace:
```typescript
      await fetch(`${baseUrl}/api/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, firstName, lastName, email, dateOfBirth, selectedCity: city }),
      });
```

With:
```typescript
      await fetch(`${baseUrl}/api/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ phone, firstName, lastName, email, dateOfBirth, selectedCity: city }),
      });
```

- [ ] **Step 4: Fix the handleDeleteAccount fetch (lines 96-100)**

Replace:
```typescript
      await fetch(`${baseUrl}/api/profile`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
```

With:
```typescript
      await fetch(`${baseUrl}/api/profile`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ phone }),
      });
```

- [ ] **Step 5: Read the file again to verify both changes are correct**

- [ ] **Step 6: Commit**

```bash
git add mobile/src/app/account-settings.tsx
git commit -m "fix: add auth headers to account-settings save and delete"
```

---

## Task 2: Fix invite.tsx native clipboard

**Files:**
- Modify: `mobile/src/app/invite.tsx`

- [ ] **Step 1: Read the current file**

Open `mobile/src/app/invite.tsx`. Confirm line 21-24 uses `navigator.clipboard`.

- [ ] **Step 2: Add expo-clipboard import**

At the top of the file, after the existing imports, add:

```typescript
import * as Clipboard from "expo-clipboard";
```

Remove the `Platform` import from `react-native` since it won't be needed after this fix (check if `Platform` is used elsewhere in the file first — if not, remove it from the destructure on line 2).

- [ ] **Step 3: Replace the handleCopy function**

Replace the entire `handleCopy` function (lines 19-25):
```typescript
  const handleCopy = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === "web") {
      navigator.clipboard?.writeText(referralCode).catch((err) => console.error("[Invite] Clipboard write failed:", err));
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
```

With:
```typescript
  const handleCopy = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Clipboard.setStringAsync(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
```

- [ ] **Step 4: Read the file again to verify the change is correct and Platform is cleaned up if unused**

- [ ] **Step 5: Commit**

```bash
git add mobile/src/app/invite.tsx
git commit -m "fix: use expo-clipboard for native copy in invite screen"
```

---

## Task 3: Fix "Sparade" dead link in profile — create saved.tsx screen

**Files:**
- Create: `mobile/src/app/saved.tsx`
- Modify: `mobile/src/app/_layout.tsx`
- Modify: `mobile/src/app/(tabs)/profile.tsx`

### Step 3a — Create the saved restaurants screen

- [ ] **Step 1: Create `mobile/src/app/saved.tsx`**

```typescript
import React from "react";
import { View, Text, ScrollView, Pressable, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Heart, MapPin, Trash2 } from "lucide-react-native";
import { Image } from "expo-image";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useSavedRestaurants, useUnsaveRestaurant } from "@/lib/api/hooks";
import { useAuthStore } from "@/lib/auth-store";
import { C, FONTS, SPACING, RADIUS, SHADOW } from "@/lib/theme";
import { Skeleton } from "@/components/Skeleton";
import type { SavedRestaurant } from "@/lib/api/types";

export default function SavedScreen() {
  const router = useRouter();
  const phone = useAuthStore((s) => s.phoneNumber);
  const { data: saved = [], isLoading } = useSavedRestaurants(phone ?? "");
  const unsaveMutation = useUnsaveRestaurant();

  const handleUnsave = (restaurantId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    unsaveMutation.mutate({ phone: phone ?? "", restaurantId });
  };

  const handleRestaurantPress = (restaurantId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/restaurant/${restaurantId}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: C.bg }}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
          <Pressable
            testID="back-button"
            accessibilityLabel="Gå tillbaka"
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.overlayLight, alignItems: "center", justifyContent: "center", marginRight: 12 }}
          >
            <ChevronLeft size={20} color={C.textSecondary} strokeWidth={2} />
          </Pressable>
          <Text style={{ fontFamily: FONTS.displayBold, fontSize: 20, color: C.textPrimary, letterSpacing: -0.4, flex: 1 }}>
            Sparade restauranger
          </Text>
          <Heart size={20} color={C.coral} fill={saved.length > 0 ? C.coral : "transparent"} strokeWidth={2} />
        </View>
      </SafeAreaView>

      {isLoading ? (
        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} width="100%" height={80} style={{ borderRadius: RADIUS.lg }} />
          ))}
        </View>
      ) : saved.length === 0 ? (
        <Animated.View entering={FadeInDown.springify()} style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 }}>
          <View style={{ width: 64, height: 64, borderRadius: 24, backgroundColor: C.coralLight, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <Heart size={28} color={C.coral} strokeWidth={2} />
          </View>
          <Text style={{ fontFamily: FONTS.displayBold, fontSize: 18, color: C.textPrimary, textAlign: "center", letterSpacing: -0.3 }}>
            Inga sparade restauranger
          </Text>
          <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textTertiary, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
            Tryck på hjärtat på en restaurangsida för att spara den här.
          </Text>
        </Animated.View>
      ) : (
        <FlatList
          data={saved}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item, index }: { item: SavedRestaurant; index: number }) => (
            <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
              <Pressable
                testID={`saved-restaurant-${item.restaurantId}`}
                accessibilityLabel={`Öppna ${item.restaurant.name}`}
                onPress={() => handleRestaurantPress(item.restaurantId)}
                style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, borderWidth: 0.5, borderColor: C.borderLight, flexDirection: "row", alignItems: "center", overflow: "hidden", ...SHADOW.card }}
              >
                <Image
                  source={{ uri: item.restaurant.image }}
                  style={{ width: 80, height: 80 }}
                  contentFit="cover"
                />
                <View style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 12 }}>
                  <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: C.textPrimary, letterSpacing: -0.2 }} numberOfLines={1}>
                    {item.restaurant.name}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 }}>
                    <MapPin size={12} color={C.textTertiary} strokeWidth={2} />
                    <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textTertiary }} numberOfLines={1}>
                      {item.restaurant.neighborhood}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textSecondary, marginTop: 2 }} numberOfLines={1}>
                    {item.restaurant.cuisine}
                  </Text>
                </View>
                <Pressable
                  testID={`unsave-${item.restaurantId}`}
                  accessibilityLabel={`Ta bort ${item.restaurant.name} från sparade`}
                  onPress={() => handleUnsave(item.restaurantId)}
                  style={{ padding: 16 }}
                >
                  <Trash2 size={18} color={C.coral} strokeWidth={2} />
                </Pressable>
              </Pressable>
            </Animated.View>
          )}
        />
      )}
    </View>
  );
}
```

### Step 3b — Register route in _layout.tsx

- [ ] **Step 2: Read `mobile/src/app/_layout.tsx` lines 150-180**

- [ ] **Step 3: Add `saved` route after line 176 (after the `map` screen registration)**

Add inside the `<Stack>` block, after `<Stack.Screen name="map" ...>`:

```typescript
        <Stack.Screen name="saved" options={{ presentation: "modal", headerShown: false }} />
```

### Step 3c — Wire up navigation in profile.tsx

- [ ] **Step 4: Read `mobile/src/app/(tabs)/profile.tsx` lines 640-665**

- [ ] **Step 5: Add router import for saved navigation handler**

After `handleClaimedPress` (around line 234), add:

```typescript
  const handleSavedPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/saved");
  }, [router]);
```

- [ ] **Step 6: Wire the onPress in the "Sparade" card (line ~649)**

Replace:
```typescript
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
```

With:
```typescript
                  onPress={handleSavedPress}
```

- [ ] **Step 7: Read all three modified files to verify correctness**

- [ ] **Step 8: Commit**

```bash
git add mobile/src/app/saved.tsx mobile/src/app/_layout.tsx mobile/src/app/(tabs)/profile.tsx
git commit -m "feat: add saved restaurants screen and wire Sparade button in profile"
```

---

## Task 4: Backend seed script

**Files:**
- Create: `backend/scripts/seed.ts`
- Modify: `backend/package.json` (add seed script)

- [ ] **Step 1: Read `backend/package.json` to find the scripts section**

- [ ] **Step 2: Create `backend/scripts/seed.ts`**

```typescript
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const RESTAURANTS = [
  {
    name: "Ekstedt",
    address: "Humlegårdsgatan 17, 114 46 Stockholm",
    cuisine: "Nordisk",
    neighborhood: "Östermalm",
    city: "Stockholm",
    rating: 4.8,
    priceLevel: 4,
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop",
    description: "Prisbelönt krog med eldkokad nordisk mat i hjärtat av Stockholm.",
    tags: ["Romantisk", "Specialtillfälle", "Prisbelönt"],
    vibeTags: ["Mysig", "Exklusiv"],
    website: "https://ekstedt.nu",
    instagram: "@ekstedtrestaurant",
    cancelFeePercentage: 15,
  },
  {
    name: "Oaxen Krog",
    address: "Beckholmsvägen 26, 115 21 Stockholm",
    cuisine: "Skandinavisk",
    neighborhood: "Djurgården",
    city: "Stockholm",
    rating: 4.7,
    priceLevel: 4,
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop",
    description: "Tvåstjärnig Michelin-restaurang med fokus på hållbarhet och säsongsbetonade råvaror.",
    tags: ["Michelin", "Hållbart", "Utsikt"],
    vibeTags: ["Avslappnad lyx", "Romantisk"],
    website: "https://oaxen.com",
    instagram: "@oaxenkrog",
    cancelFeePercentage: 20,
  },
  {
    name: "Restaurang Jonas",
    address: "Österlånggatan 9, 111 31 Stockholm",
    cuisine: "Klassisk svensk",
    neighborhood: "Gamla Stan",
    city: "Stockholm",
    rating: 4.6,
    priceLevel: 3,
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=600&fit=crop",
    description: "Husmanskost och klassisk svensk matlagning i Gamla Stans hjärta.",
    tags: ["Husmanskost", "Trivsam", "Historisk miljö"],
    vibeTags: ["Traditionell", "Varm"],
    website: null,
    instagram: "@restaurangjonas",
    cancelFeePercentage: 10,
  },
  {
    name: "Sturehof",
    address: "Stureplan 2, 114 35 Stockholm",
    cuisine: "Fisk och skaldjur",
    neighborhood: "Östermalm",
    city: "Stockholm",
    rating: 4.5,
    priceLevel: 3,
    image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&h=600&fit=crop",
    description: "Stockholms klassiska hak för fisk och skaldjur sedan 1897.",
    tags: ["Klassiker", "Skaldjur", "Stureplan"],
    vibeTags: ["Livlig", "Business"],
    website: "https://sturehof.com",
    instagram: "@sturehof",
    cancelFeePercentage: 15,
  },
  {
    name: "Lux Dag för Dag",
    address: "Primusgatan 116, 112 67 Stockholm",
    cuisine: "Modern svensk",
    neighborhood: "Lilla Essingen",
    city: "Stockholm",
    rating: 4.7,
    priceLevel: 3,
    image: "https://images.unsplash.com/photo-1550966871-3ed3cfd6d0d7?w=800&h=600&fit=crop",
    description: "Säsongsbetonad matlagning med råvaror från hela Sverige.",
    tags: ["Säsongsbetonat", "Lokalt", "Romantisk"],
    vibeTags: ["Lugn", "Exklusiv"],
    website: "https://luxdagfordag.se",
    instagram: "@luxdagfordag",
    cancelFeePercentage: 15,
  },
  {
    name: "Brasserie Astoria",
    address: "Birger Jarlsgatan 35, 111 45 Stockholm",
    cuisine: "Fransk",
    neighborhood: "Östermalm",
    city: "Stockholm",
    rating: 4.4,
    priceLevel: 3,
    image: "https://images.unsplash.com/photo-1428515613728-6b4607e44363?w=800&h=600&fit=crop",
    description: "Parisisk bistromiljö mitt i Stockholm med klassisk fransk meny.",
    tags: ["Franskt", "Brasserie", "Centralt"],
    vibeTags: ["Elegant", "Livlig"],
    website: null,
    instagram: "@brasserieastoria",
    cancelFeePercentage: 0,
  },
  {
    name: "Omakase by Ryoki",
    address: "Rådmansgatan 16, 113 25 Stockholm",
    cuisine: "Japanskt",
    neighborhood: "Vasastan",
    city: "Stockholm",
    rating: 4.9,
    priceLevel: 4,
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800&h=600&fit=crop",
    description: "Exklusiv omakase-upplevelse med säsongsbetonad japansk meny för max 8 gäster.",
    tags: ["Omakase", "Japanskt", "Exklusivt"],
    vibeTags: ["Intim", "Specialtillfälle"],
    website: null,
    instagram: "@omakasebyryoki",
    cancelFeePercentage: 20,
  },
  {
    name: "Fotografiska Matsalen",
    address: "Stadsgårdshamnen 22, 116 45 Stockholm",
    cuisine: "Vegetarisk",
    neighborhood: "Södermalm",
    city: "Stockholm",
    rating: 4.6,
    priceLevel: 3,
    image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=600&fit=crop",
    description: "Vegetarisk restaurang med utsikt över Stockholms inlopp. Öppen för alla.",
    tags: ["Vegetariskt", "Utsikt", "Konstupplevelse"],
    vibeTags: ["Kreativ", "Modern"],
    website: "https://fotografiska.com",
    instagram: "@fotografiska",
    cancelFeePercentage: 0,
  },
  {
    name: "Pontus!",
    address: "Brunnsgränd 1, 111 30 Stockholm",
    cuisine: "Modern europeisk",
    neighborhood: "Gamla Stan",
    city: "Stockholm",
    rating: 4.5,
    priceLevel: 3,
    image: "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&h=600&fit=crop",
    description: "Pontus Frithiofs klassiker med modern europeisk mat i Gamla Stan.",
    tags: ["Klassiker", "Gamla Stan", "Europeiskt"],
    vibeTags: ["Elegant", "Romantisk"],
    website: "https://pontusfrithiof.com",
    instagram: "@pontusfrithiof",
    cancelFeePercentage: 10,
  },
  {
    name: "Esperanto",
    address: "Kungstensgatan 2, 113 57 Stockholm",
    cuisine: "Asiatisk fusion",
    neighborhood: "Vasastan",
    city: "Stockholm",
    rating: 4.6,
    priceLevel: 3,
    image: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&h=600&fit=crop",
    description: "Asiatisk fusion i modern tappning — en av Stockholms mest hyllade krogar.",
    tags: ["Asiatiskt", "Fusion", "Prisbelönt"],
    vibeTags: ["Modern", "Livlig"],
    website: null,
    instagram: "@esperantorestaurant",
    cancelFeePercentage: 15,
  },
];

const TEST_USERS = [
  { phone: "+46701234567", firstName: "Anna", lastName: "Svensson", email: "anna@test.se", credits: 5, selectedCity: "Stockholm" },
  { phone: "+46709876543", firstName: "Erik", lastName: "Lindberg", email: "erik@test.se", credits: 2, selectedCity: "Stockholm" },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await db.reservation.deleteMany({});
  await db.savedRestaurant.deleteMany({});
  await db.activityAlert.deleteMany({});
  await db.watch.deleteMany({});
  await db.userProfile.deleteMany({ where: { phone: { in: TEST_USERS.map((u) => u.phone) } } });
  await db.restaurant.deleteMany({});

  console.log("🗑  Cleared existing seed data");

  // Create restaurants
  const restaurants = await Promise.all(
    RESTAURANTS.map((r) =>
      db.restaurant.create({
        data: {
          name: r.name,
          address: r.address,
          cuisine: r.cuisine,
          neighborhood: r.neighborhood,
          city: r.city,
          rating: r.rating,
          priceLevel: r.priceLevel,
          image: r.image,
          description: r.description,
          tags: r.tags,
          vibeTags: r.vibeTags,
          website: r.website ?? null,
          instagram: r.instagram ?? null,
          cancelFeePercentage: r.cancelFeePercentage,
        },
      })
    )
  );

  console.log(`✅ Created ${restaurants.length} restaurants`);

  // Create test users
  const users = await Promise.all(
    TEST_USERS.map((u) =>
      db.userProfile.create({
        data: {
          phone: u.phone,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          credits: u.credits,
          selectedCity: u.selectedCity,
          phoneVerified: true,
          emailVerified: false,
          trustScore: 80,
        },
      })
    )
  );

  console.log(`✅ Created ${users.length} test users`);

  // Create active reservations (spread across next 14 days)
  const today = new Date();
  const reservations = [
    { restaurantIdx: 0, dayOffset: 1, time: "19:00", party: 2, submitterIdx: 0, prepaid: false, cancelFee: 0 },
    { restaurantIdx: 1, dayOffset: 2, time: "20:00", party: 4, submitterIdx: 1, prepaid: true, cancelFee: 450 },
    { restaurantIdx: 2, dayOffset: 2, time: "18:30", party: 2, submitterIdx: 0, prepaid: false, cancelFee: 0 },
    { restaurantIdx: 3, dayOffset: 3, time: "19:30", party: 3, submitterIdx: 1, prepaid: false, cancelFee: 150 },
    { restaurantIdx: 4, dayOffset: 3, time: "20:30", party: 2, submitterIdx: 0, prepaid: true, cancelFee: 600 },
    { restaurantIdx: 5, dayOffset: 4, time: "19:00", party: 5, submitterIdx: 1, prepaid: false, cancelFee: 0 },
    { restaurantIdx: 6, dayOffset: 5, time: "20:00", party: 2, submitterIdx: 0, prepaid: true, cancelFee: 1200 },
    { restaurantIdx: 7, dayOffset: 6, time: "18:00", party: 4, submitterIdx: 1, prepaid: false, cancelFee: 0 },
    { restaurantIdx: 8, dayOffset: 7, time: "19:30", party: 2, submitterIdx: 0, prepaid: false, cancelFee: 200 },
    { restaurantIdx: 9, dayOffset: 8, time: "20:00", party: 3, submitterIdx: 1, prepaid: true, cancelFee: 750 },
    { restaurantIdx: 0, dayOffset: 10, time: "19:00", party: 2, submitterIdx: 0, prepaid: false, cancelFee: 0 },
    { restaurantIdx: 2, dayOffset: 12, time: "18:30", party: 6, submitterIdx: 1, prepaid: false, cancelFee: 0 },
  ];

  for (const r of reservations) {
    const date = new Date(today);
    date.setDate(today.getDate() + r.dayOffset);
    const dateStr = date.toISOString().split("T")[0];
    const submitter = TEST_USERS[r.submitterIdx];
    const restaurant = restaurants[r.restaurantIdx];

    await db.reservation.create({
      data: {
        restaurantId: restaurant.id,
        submitterPhone: submitter.phone,
        submitterFirstName: submitter.firstName,
        submitterLastName: submitter.lastName,
        reservationDate: dateStr,
        reservationTime: r.time,
        partySize: r.party,
        isPrepaid: r.prepaid,
        cancelFee: r.cancelFee,
        status: "active",
        nameOnReservation: `${submitter.firstName} ${submitter.lastName}`,
        city: "Stockholm",
      },
    });
  }

  console.log(`✅ Created ${reservations.length} active reservations`);
  console.log("\n🎉 Seed complete!");
  console.log("\nTest users:");
  TEST_USERS.forEach((u) => console.log(`  ${u.phone} — ${u.firstName} ${u.lastName} (${u.credits} credits)`));
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
```

- [ ] **Step 3: Read `backend/package.json` and add seed script**

Find the `"scripts"` section and add:
```json
"seed": "bun run scripts/seed.ts"
```

- [ ] **Step 4: Run the seed script to verify it works**

```bash
cd "/Users/williamsvanqvist/Downloads/Reslot App/backend" && bun run seed
```

Expected output:
```
🌱 Seeding database...
🗑  Cleared existing seed data
✅ Created 10 restaurants
✅ Created 2 test users
✅ Created 12 active reservations

🎉 Seed complete!

Test users:
  +46701234567 — Anna Svensson (5 credits)
  +46709876543 — Erik Lindberg (2 credits)
```

- [ ] **Step 5: Commit**

```bash
git add backend/scripts/seed.ts backend/package.json
git commit -m "feat: add database seed script with 10 Stockholm restaurants and test data"
```

---

## Task 5: Create .env.example files

**Files:**
- Create: `mobile/.env.example`
- Create: `backend/.env.example`

- [ ] **Step 1: Create `mobile/.env.example`**

```bash
# Mobile environment variables
# Copy this file to .env.local and fill in the values

# Backend API URL (no trailing slash)
EXPO_PUBLIC_BACKEND_URL=http://localhost:3000

# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Mapbox (for map view)
EXPO_PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_token_here

# OpenRouter (optional — for AI support chat on mobile)
# EXPO_PUBLIC_OPENROUTER_KEY=sk-or-your-key-here
```

- [ ] **Step 2: Create `backend/.env.example`**

```bash
# Backend environment variables
# Copy this file to .env and fill in the values

# Server
PORT=3000
NODE_ENV=development

# Database (Supabase Postgres via connection pooler)
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-eu-north-1.pooler.supabase.com:5432/postgres

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Backend URL (used for Stripe webhooks and deep links)
BACKEND_URL=http://localhost:3000

# Stripe (optional — leave empty to use dev simulation)
# STRIPE_SECRET_KEY=sk_test_your_key_here
# STRIPE_WEBHOOK_SECRET=whsec_your_secret_here

# Twilio SMS (optional — leave empty to use dev bypass OTP)
# TWILIO_ACCOUNT_SID=your_account_sid
# TWILIO_AUTH_TOKEN=your_auth_token
# TWILIO_PHONE_NUMBER=+1234567890

# OpenRouter AI (optional — for support chat)
# OPENROUTER_API_KEY=sk-or-your-key-here
```

- [ ] **Step 3: Commit**

```bash
git add mobile/.env.example backend/.env.example
git commit -m "docs: add .env.example files for mobile and backend"
```

---

## Execution order

Tasks 1–5 are fully independent. Run them in parallel for speed.

After all tasks complete, run the seed script and verify the app loads with data:
```bash
cd "/Users/williamsvanqvist/Downloads/Reslot App/backend" && bun run seed
```

Then check the Expo logs to confirm:
- Profile save/delete no longer returns 401
- Invite copy works on device
- Sparade button navigates to saved screen
