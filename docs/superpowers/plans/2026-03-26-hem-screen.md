# Hem-skärmen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementera alla spec-ändringar för Hem-skärmen, tab-layouten och skapa de två nya skärmarna FAQ och Reslot credits.

**Architecture:** Rena textbyten och navigationskopplingar i befintliga filer, plus två nya skärmar registrerade i root `_layout.tsx`. Inga nya paket.

**Tech Stack:** Expo Router, React Native, NativeWind, lucide-react-native, react-native-reanimated, Zustand auth store.

---

## Filer som berörs

| Åtgärd | Fil |
|--------|-----|
| Modify | `mobile/src/app/(tabs)/_layout.tsx` |
| Modify | `mobile/src/app/(tabs)/index.tsx` |
| Modify | `mobile/src/app/_layout.tsx` |
| Create | `mobile/src/app/faq.tsx` |
| Create | `mobile/src/app/credits.tsx` |

---

## Task 1: Tab-layout — byt "Aviseringar" → "Notiser"

**Filer:**
- Modify: `mobile/src/app/(tabs)/_layout.tsx:253`

- [ ] **Steg 1: Byt tab-etiketten**

I `_layout.tsx`, hitta Tabs.Screen för `alerts` och ändra `title`:

```tsx
<Tabs.Screen
  name="alerts"
  options={{
    title: "Notiser",   // var: "Aviseringar"
    tabBarIcon: ...
```

- [ ] **Steg 2: Verifiera att appen startar utan fel**

Kontrollera expo.log att inga TypeScript-fel dyker upp.

---

## Task 2: Header — koppla credits-pill till `/credits`

**Filer:**
- Modify: `mobile/src/app/(tabs)/index.tsx:134-154`

- [ ] **Steg 1: Lägg till router i Header-komponenten**

Header-komponenten saknar `onCreditsPress` prop. Lägg till den:

```tsx
function Header({
  selectedCity,
  onCityPress,
  onFAQPress,
  onCreditsPress,   // NY
  tokens,
  isLoading,
}: {
  selectedCity: string;
  onCityPress: () => void;
  onFAQPress: () => void;
  onCreditsPress: () => void;  // NY
  tokens: number;
  isLoading?: boolean;
}) {
```

- [ ] **Steg 2: Koppla credits-pill onPress till onCreditsPress**

```tsx
<Pressable
  testID="token-pill"
  className="flex-row items-center rounded-full px-3 py-1.5"
  style={{ backgroundColor: "rgba(201, 169, 110, 0.1)" }}
  onPress={() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCreditsPress();   // NY — var bara haptics
  }}
>
```

- [ ] **Steg 3: Skicka med onCreditsPress i HomeScreen där Header renderas**

Sök upp `<Header` i `export default function HomeScreen` och lägg till:

```tsx
<Header
  selectedCity={selectedCity}
  onCityPress={() => setShowCityPicker(true)}
  onFAQPress={() => router.push("/faq")}
  onCreditsPress={() => router.push("/credits")}   // NY
  tokens={profile?.tokens ?? 0}
  isLoading={profileLoading}
/>
```

---

## Task 3: RewardsBanner — byt namn och text, koppla till `/credits`

**Filer:**
- Modify: `mobile/src/app/(tabs)/index.tsx:572-645`

- [ ] **Steg 1: Uppdatera RewardsBanner text och navigation**

Ersätt hela `RewardsBanner`-funktionen:

```tsx
function RewardsBanner() {
  const router = useRouter();
  return (
    <Animated.View entering={FadeInDown.delay(200).duration(400).springify()}>
      <Pressable
        testID="credits-banner"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push("/credits");
        }}
        style={{
          marginHorizontal: 20,
          marginVertical: 12,
          backgroundColor: "rgba(201, 169, 110, 0.06)",
          borderRadius: 14,
          borderWidth: 1,
          borderColor: "rgba(201, 169, 110, 0.12)",
          padding: 16,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center" style={{ flex: 1, gap: 10 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: "rgba(201, 169, 110, 0.12)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Coins size={18} color="#C9A96E" strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_600SemiBold",
                  fontSize: 14,
                  color: "#111827",
                  letterSpacing: -0.1,
                }}
              >
                Reslot credits
              </Text>
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_400Regular",
                  fontSize: 12,
                  color: "#9CA3AF",
                  marginTop: 2,
                  lineHeight: 16,
                }}
                numberOfLines={2}
              >
                Lägg upp bokningar och tjäna credits. Utforska nu
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color="#C9A96E" strokeWidth={2} style={{ marginLeft: 8 }} />
        </View>
      </Pressable>
    </Animated.View>
  );
}
```

Note: `Gift`-ikonen kan tas bort ur imports om den inte används mer. `Coins` används redan.

---

## Task 4: Ta bort VIP-symbol ur RestaurantRow

**Filer:**
- Modify: `mobile/src/app/(tabs)/index.tsx:427-448`

- [ ] **Steg 1: Ta bort VIP-badge och isExclusive-styling**

I `RestaurantRow`, ta bort VIP-badgen (raderna 427–448):

```tsx
// TA BORT DETTA BLOCK:
{restaurant.isExclusive ? (
  <View
    style={{
      backgroundColor: "rgba(201, 169, 110, 0.15)",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    }}
  >
    <Text
      style={{
        fontFamily: "PlusJakartaSans_700Bold",
        fontSize: 9,
        color: "#C9A96E",
        letterSpacing: 0.5,
        textTransform: "uppercase",
      }}
    >
      VIP
    </Text>
  </View>
) : null}
```

- [ ] **Steg 2: Ta även bort isExclusive-styling från Animated.View (rad ~404–409)**

```tsx
// TA BORT backgroundColor och borderLeftWidth/-Color baserat på isExclusive:
<Animated.View
  style={[
    animStyle,
    {
      paddingHorizontal: 20,
      paddingVertical: 14,
      // Ta bort dessa rader:
      // backgroundColor: restaurant.isExclusive ? "rgba(201,169,110,0.04)" : "transparent",
      // borderLeftWidth: restaurant.isExclusive ? 3 : 0,
      // borderLeftColor: "rgba(201,169,110,0.7)",
    },
  ]}
>
```

Resultat (Animated.View):
```tsx
<Animated.View
  style={[
    animStyle,
    {
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
  ]}
>
```

---

## Task 5: Skapa FAQ-skärmen (`/faq`)

**Filer:**
- Create: `mobile/src/app/faq.tsx`
- Modify: `mobile/src/app/_layout.tsx` (registrera som modal)

- [ ] **Steg 1: Registrera `/faq` i root _layout.tsx**

I `mobile/src/app/_layout.tsx`, lägg till Stack.Screen för faq inuti `<Stack>`:

```tsx
<Stack.Screen
  name="faq"
  options={{
    presentation: "modal",
    title: "Frågor och svar",
  }}
/>
```

- [ ] **Steg 2: Skapa `mobile/src/app/faq.tsx`**

```tsx
import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronRight, MessageCircle } from "lucide-react-native";
import * as Haptics from "expo-haptics";

const FAQ_ITEMS = [
  {
    q: "Hur fungerar Reslot?",
    a: "Reslot är en marknadsplats för restaurangbokningar. Du kan lägga upp bokningar du inte längre kan använda, och andra kan ta över dem mot credits.",
  },
  {
    q: "Vad är Reslot credits?",
    a: "Credits är Reslots valuta. Du tjänar credits när du lägger upp bokningar. Du använder credits för att ta över andras bokningar. Credits kan även köpas i appen.",
  },
  {
    q: "Hur tar jag över en bokning?",
    a: "Hitta en bokning som passar dig på Hem-flödet, tryck på den och välj 'Ta över bokning'. Du behöver credits och godkänna villkoren.",
  },
  {
    q: "Vad händer om jag inte kan gå?",
    a: "Du kan lägga upp bokningen i flödet igen. Tänk på att du ansvarar för bokningen tills någon annan tar över den.",
  },
  {
    q: "Hur tjänar jag credits?",
    a: "Du tjänar credits när du lägger upp en bokning och den tas över av någon annan. Du kan också köpa credits eller bjuda in vänner.",
  },
  {
    q: "Är mina betalningsuppgifter säkra?",
    a: "Ja. Vi använder Stripe för säker betalningshantering. Vi drar aldrig pengar utan din vetskap.",
  },
  {
    q: "Kan jag lägga upp vilken restaurang som helst?",
    a: "Ja, du kan lägga upp bokningar från restauranger som finns i Reslots databas. Kontakta support om din restaurang saknas.",
  },
];

export default function FaqScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FAFAF8" }} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 }}>
          <Text
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              fontSize: 26,
              color: "#111827",
              letterSpacing: -0.5,
            }}
          >
            Frågor och svar
          </Text>
        </View>

        {/* FAQ items */}
        <View style={{ marginTop: 16, paddingHorizontal: 20, gap: 10 }}>
          {FAQ_ITEMS.map((item, i) => (
            <FaqItem key={i} question={item.q} answer={item.a} />
          ))}
        </View>

        {/* Footer */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 32,
            borderTopWidth: 0.5,
            borderTopColor: "rgba(0,0,0,0.08)",
            paddingTop: 24,
          }}
        >
          <Text
            style={{
              fontFamily: "PlusJakartaSans_500Medium",
              fontSize: 14,
              color: "#6B7280",
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            Hittar du inte din fråga här?
          </Text>
          <Pressable
            testID="contact-support-button"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/support");
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              backgroundColor: "#111827",
              paddingVertical: 14,
              borderRadius: 14,
            }}
          >
            <MessageCircle size={16} color="#FFFFFF" strokeWidth={2} />
            <Text
              style={{
                fontFamily: "PlusJakartaSans_600SemiBold",
                fontSize: 15,
                color: "#FFFFFF",
              }}
            >
              Kontakta support
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Pressable
      testID={`faq-item-${question.slice(0, 10)}`}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setOpen((v) => !v);
      }}
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        borderWidth: 0.5,
        borderColor: "rgba(0,0,0,0.08)",
        overflow: "hidden",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 16,
        }}
      >
        <Text
          style={{
            fontFamily: "PlusJakartaSans_600SemiBold",
            fontSize: 14,
            color: "#111827",
            flex: 1,
            marginRight: 12,
          }}
        >
          {question}
        </Text>
        <ChevronRight
          size={16}
          color="#9CA3AF"
          strokeWidth={2}
          style={{ transform: [{ rotate: open ? "90deg" : "0deg" }] }}
        />
      </View>
      {open ? (
        <View
          style={{
            paddingHorizontal: 16,
            paddingBottom: 16,
            borderTopWidth: 0.5,
            borderTopColor: "rgba(0,0,0,0.06)",
          }}
        >
          <Text
            style={{
              fontFamily: "PlusJakartaSans_400Regular",
              fontSize: 13,
              color: "#6B7280",
              lineHeight: 20,
              marginTop: 12,
            }}
          >
            {answer}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
```

---

## Task 6: Skapa credits-skärmen (`/credits`)

**Filer:**
- Create: `mobile/src/app/credits.tsx`
- Modify: `mobile/src/app/_layout.tsx` (registrera)

- [ ] **Steg 1: Registrera `/credits` i root _layout.tsx**

```tsx
<Stack.Screen
  name="credits"
  options={{
    presentation: "modal",
    title: "Reslot credits",
  }}
/>
```

- [ ] **Steg 2: Skapa `mobile/src/app/credits.tsx`**

```tsx
import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Coins, UserPlus, PlusCircle, ChevronRight } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useProfile } from "@/lib/api/hooks";
import { useAuthStore } from "@/lib/auth-store";

export default function CreditsScreen() {
  const router = useRouter();
  const phone = useAuthStore((s) => s.phoneNumber);
  const { data: profile } = useProfile(phone);
  const credits = profile?.tokens ?? 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FAFAF8" }} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 8 }}>
          <Text
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              fontSize: 26,
              color: "#111827",
              letterSpacing: -0.5,
            }}
          >
            Reslot credits
          </Text>
          <Text
            style={{
              fontFamily: "PlusJakartaSans_400Regular",
              fontSize: 14,
              color: "#6B7280",
              marginTop: 6,
            }}
          >
            Tjäna och använd credits för att ta över bokningar.
          </Text>
        </View>

        {/* Credit balance */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 20,
            backgroundColor: "#111827",
            borderRadius: 18,
            padding: 24,
            alignItems: "center",
          }}
        >
          <Coins size={32} color="#C9A96E" strokeWidth={1.8} />
          <Text
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              fontSize: 52,
              color: "#FFFFFF",
              letterSpacing: -2,
              marginTop: 8,
            }}
          >
            {credits}
          </Text>
          <Text
            style={{
              fontFamily: "PlusJakartaSans_500Medium",
              fontSize: 14,
              color: "rgba(255,255,255,0.5)",
              marginTop: 2,
            }}
          >
            tillgängliga credits
          </Text>
        </View>

        {/* How it works */}
        <View style={{ paddingHorizontal: 20, marginTop: 28 }}>
          <Text
            style={{
              fontFamily: "PlusJakartaSans_600SemiBold",
              fontSize: 13,
              color: "#9CA3AF",
              letterSpacing: 0.5,
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Hur det fungerar
          </Text>
          <View style={{ gap: 10 }}>
            <InfoRow
              icon={<PlusCircle size={18} color="#E06A4E" strokeWidth={2} />}
              title="Lägg upp en bokning"
              subtitle="Du tjänar 1 credit när någon tar över din bokning"
            />
            <InfoRow
              icon={<Coins size={18} color="#C9A96E" strokeWidth={2} />}
              title="Ta över en bokning"
              subtitle="Kostar 2 credits per bokning du tar över"
            />
          </View>
        </View>

        {/* Köp credits */}
        <View style={{ paddingHorizontal: 20, marginTop: 28 }}>
          <Text
            style={{
              fontFamily: "PlusJakartaSans_600SemiBold",
              fontSize: 13,
              color: "#9CA3AF",
              letterSpacing: 0.5,
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Köp credits
          </Text>
          <Pressable
            testID="buy-credits-button"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/payment");
            }}
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 14,
              borderWidth: 0.5,
              borderColor: "rgba(0,0,0,0.08)",
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View>
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_600SemiBold",
                  fontSize: 15,
                  color: "#111827",
                }}
              >
                1 credit
              </Text>
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_400Regular",
                  fontSize: 13,
                  color: "#9CA3AF",
                  marginTop: 2,
                }}
              >
                39 kr
              </Text>
            </View>
            <View
              style={{
                backgroundColor: "#E06A4E",
                paddingHorizontal: 18,
                paddingVertical: 10,
                borderRadius: 10,
              }}
            >
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_600SemiBold",
                  fontSize: 14,
                  color: "#FFFFFF",
                }}
              >
                Köp
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Få gratis credits */}
        <View style={{ paddingHorizontal: 20, marginTop: 28 }}>
          <Text
            style={{
              fontFamily: "PlusJakartaSans_600SemiBold",
              fontSize: 13,
              color: "#9CA3AF",
              letterSpacing: 0.5,
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Få gratis credits
          </Text>
          <View style={{ gap: 10 }}>
            <Pressable
              testID="invite-friend-button"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/invite");
              }}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 14,
                borderWidth: 0.5,
                borderColor: "rgba(0,0,0,0.08)",
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: "rgba(224,106,78,0.08)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <UserPlus size={18} color="#E06A4E" strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_600SemiBold",
                      fontSize: 14,
                      color: "#111827",
                    }}
                  >
                    Bjud in en vän
                  </Text>
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_400Regular",
                      fontSize: 12,
                      color: "#9CA3AF",
                      marginTop: 2,
                    }}
                  >
                    Du och din vän får 1 credit var
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color="#D1D5DB" strokeWidth={2} />
            </Pressable>

            <Pressable
              testID="post-booking-button"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(tabs)/submit");
              }}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 14,
                borderWidth: 0.5,
                borderColor: "rgba(0,0,0,0.08)",
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: "rgba(224,106,78,0.08)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <PlusCircle size={18} color="#E06A4E" strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_600SemiBold",
                      fontSize: 14,
                      color: "#111827",
                    }}
                  >
                    Lägg upp en bokning
                  </Text>
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_400Regular",
                      fontSize: 12,
                      color: "#9CA3AF",
                      marginTop: 2,
                    }}
                  >
                    Tjäna 1 credit när någon tar över
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color="#D1D5DB" strokeWidth={2} />
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 14,
        borderWidth: 0.5,
        borderColor: "rgba(0,0,0,0.08)",
        padding: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: "rgba(0,0,0,0.03)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: "PlusJakartaSans_600SemiBold",
            fontSize: 14,
            color: "#111827",
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontFamily: "PlusJakartaSans_400Regular",
            fontSize: 12,
            color: "#9CA3AF",
            marginTop: 2,
          }}
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
}
```

---

## Task 7: Ta bort `Gift`-import om den inte används mer

**Filer:**
- Modify: `mobile/src/app/(tabs)/index.tsx:1-27`

- [ ] **Steg 1: Kontrollera och rensa oanvända imports**

Efter Task 3 används inte `Gift` längre. Ta bort den ur import:

```tsx
import {
  Star,
  Clock,
  Users,
  Coins,
  Search,
  // Gift,   <-- ta bort
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Check,
  Calendar,
  AlertCircle,
  HelpCircle,
} from "lucide-react-native";
```

Kolla även om `AlertCircle` och `Check` används — ta bort dem om inte.

---

## Verifiering

- [ ] Appen startar utan TypeScript-fel i expo.log
- [ ] Tab "Aviseringar" visar nu "Notiser"
- [ ] Credits-pill i header navigerar till `/credits`-skärmen
- [ ] Credits-bannern visar "Reslot credits" (inte "Rewards")
- [ ] Bannern navigerar till `/credits`-skärmen
- [ ] VIP-badge syns inte längre på restaurangkorten
- [ ] "?" → öppnar FAQ-skärmen
- [ ] FAQ-skärmen visar alla frågor och kan expanderas
- [ ] Credits-skärmen visar rätt antal credits och tre sektioner
