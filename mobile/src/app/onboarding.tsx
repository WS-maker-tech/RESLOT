import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  Pencil,
  Check,
  Search,
  Bell,
  MessageCircle,
  Award,
  Utensils,
  Users,
  Clock,
  CalendarCheck,
  Coins,
  Gift,
} from "lucide-react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useFonts } from "expo-font";
import { useAuthStore } from "@/lib/auth-store";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

// --- Colors (Light theme matching main app) ---
const C = {
  bg: "#FAFAF8",
  bgCard: "#FFFFFF",
  bgInput: "#F0F0EE",
  orange: "#E06A4E",
  gold: "#C9A96E",
  text: "#111827",
  gray: "#6B7280",
  grayLight: "#9CA3AF",
  divider: "rgba(0,0,0,0.07)",
};

// ── Animated Strip ──────────────────────────────────────────────
const CARD_H = 157;
const CARD_GAP = 9;
const CARD_STEP = CARD_H + CARD_GAP; // 166px
const STRIP_HALF = 6 * CARD_STEP; // 996px — seamless half-point
const STRIP_H = SCREEN_H * 0.60;
const COL_W = (SCREEN_W - CARD_GAP * 2) / 3;

type StripCard = { name: string; meta: string; image: string };

const STRIP_COL_A: StripCard[] = [
  { name: "Frantzén", meta: "New Nordic · 20:00", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300&h=500&fit=crop" },
  { name: "Oaxen Krog", meta: "Scandinavian · 20:30", image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=300&h=500&fit=crop" },
  { name: "Gastrologik", meta: "Nordic · 19:00", image: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=300&h=500&fit=crop" },
  { name: "Adam/Albin", meta: "Fine Dining · 19:30", image: "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=300&h=500&fit=crop" },
  { name: "Ekstedt", meta: "Fire Nordic · 18:30", image: "https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=300&h=500&fit=crop" },
  { name: "Nello", meta: "Italian · 21:00", image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300&h=500&fit=crop" },
];

const STRIP_COL_B: StripCard[] = [
  { name: "Babette", meta: "French-Nordic · 19:30", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=500&fit=crop" },
  { name: "Punk Royale", meta: "Avant-garde · 21:00", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&h=500&fit=crop" },
  { name: "Mathias D.", meta: "Nordic · 20:00", image: "https://images.unsplash.com/photo-1476224203421-9ac39bcb3df1?w=300&h=500&fit=crop" },
  { name: "Operakällaren", meta: "Classic · 19:00", image: "https://images.unsplash.com/photo-1578474846132-e79dc14c7a85?w=300&h=500&fit=crop" },
  { name: "Speceriet", meta: "Swedish · 18:00", image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=300&h=500&fit=crop" },
  { name: "Agrikultur", meta: "Neo-bistro · 20:00", image: "https://images.unsplash.com/photo-1544025162-d76538239271?w=300&h=500&fit=crop" },
];

const STRIP_COL_C: StripCard[] = [
  { name: "Sushi Sho", meta: "Japanese · 19:00", image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=300&h=500&fit=crop" },
  { name: "Lilla Ego", meta: "French · 20:30", image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&h=500&fit=crop" },
  { name: "Basement", meta: "Bar & Grill · 21:00", image: "https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=300&h=500&fit=crop" },
  { name: "Gro", meta: "Vegetarian · 19:30", image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=300&h=500&fit=crop" },
  { name: "Prinsen", meta: "Brasserie · 18:30", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=500&fit=crop" },
  { name: "Djuret", meta: "Meat · 20:00", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&h=500&fit=crop&crop=entropy" },
];

function RestaurantStripCard({ card }: { card: StripCard }) {
  return (
    <View
      style={{
        width: COL_W,
        height: CARD_H,
        borderRadius: 13,
        overflow: "hidden",
        marginBottom: CARD_GAP,
        backgroundColor: "#1c1c1c",
      }}
    >
      <Image
        source={{ uri: card.image }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        resizeMode="cover"
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.72)"]}
        style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 74 }}
      />
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 8 }}>
        <Text
          style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 11, color: "#FFFFFF", lineHeight: 14 }}
          numberOfLines={1}
        >
          {card.name}
        </Text>
        <Text
          style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 9, color: "rgba(255,255,255,0.70)", lineHeight: 12, marginTop: 2 }}
          numberOfLines={1}
        >
          {card.meta}
        </Text>
      </View>
    </View>
  );
}

function AnimatedColumn({
  cards,
  direction,
  durationSec,
  startOffsetSec,
}: {
  cards: StripCard[];
  direction: "up" | "down";
  durationSec: number;
  startOffsetSec: number;
}) {
  const isDown = direction === "down";
  const startVal = isDown ? -STRIP_HALF : 0;
  const endVal = isDown ? 0 : -STRIP_HALF;
  const progress = startOffsetSec / durationSec;
  const initialVal = startVal + (endVal - startVal) * progress;
  const remainingMs = durationSec * (1 - progress) * 1000;
  const fullMs = durationSec * 1000;

  const translateY = useSharedValue(initialVal);

  useEffect(() => {
    translateY.value = withTiming(
      endVal,
      { duration: remainingMs, easing: Easing.linear },
      (finished) => {
        "worklet";
        if (finished) {
          translateY.value = startVal;
          translateY.value = withRepeat(
            withTiming(endVal, { duration: fullMs, easing: Easing.linear }),
            -1,
            false
          );
        }
      }
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const allCards = [...cards, ...cards];
  return (
    <Animated.View style={animStyle}>
      {allCards.map((card, i) => (
        <RestaurantStripCard key={i} card={card} />
      ))}
    </Animated.View>
  );
}

function PulsingDot() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.85);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.9, { duration: 900, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 0 })
      ),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 900, easing: Easing.out(Easing.quad) }),
        withTiming(0.85, { duration: 0 })
      ),
      -1,
      false
    );
  }, []);

  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={{ width: 12, height: 12, alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={[
          rippleStyle,
          { position: "absolute", width: 8, height: 8, borderRadius: 4, backgroundColor: "#4CAF50" },
        ]}
      />
      <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#4CAF50" }} />
    </View>
  );
}

// --- Step Enum ---
type Step =
  | "splash"
  | "phone"
  | "otp"
  | "register"
  | "onboard"
  | "welcome"
  | "city";

// --- Shared Button ---
function PrimaryButton({
  label,
  onPress,
  disabled,
  testID,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}) {
  const scale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Animated.View style={btnStyle}>
      <Pressable
        testID={testID}
        onPress={() => {
          if (disabled) return;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 15 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 12 });
        }}
        style={{
          backgroundColor: disabled ? "rgba(232,114,74,0.4)" : C.orange,
          borderRadius: 28,
          paddingVertical: 17,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontFamily: "PlusJakartaSans_700Bold",
            fontSize: 16,
            color: "#FFFFFF",
            letterSpacing: -0.2,
          }}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// --- Back Arrow ---
function BackArrow({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      testID="back-button"
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ChevronLeft size={24} color={C.text} strokeWidth={2} />
    </Pressable>
  );
}

// --- Progress Dots ---
function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "center", gap: 8 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === current ? 24 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i === current ? C.orange : "rgba(0,0,0,0.10)",
          }}
        />
      ))}
    </View>
  );
}

// ==================== STEP 1: SPLASH ====================
function SplashStep({ onGetStarted, onExplore }: { onGetStarted: () => void; onExplore: () => void }) {
  return (
    <View style={{ flex: 1 }}>
      {/* ── Animated Restaurant Strip ── */}
      <View style={{ height: STRIP_H, flexDirection: "row", gap: CARD_GAP, overflow: "hidden" }}>
        <AnimatedColumn cards={STRIP_COL_A} direction="down" durationSec={30} startOffsetSec={9} />
        <AnimatedColumn cards={STRIP_COL_B} direction="up" durationSec={23} startOffsetSec={4} />
        <AnimatedColumn cards={STRIP_COL_C} direction="down" durationSec={37} startOffsetSec={22} />

        {/* Top fade: cream → transparent */}
        <LinearGradient
          colors={[C.bg, "transparent"]}
          style={{ position: "absolute", top: 0, left: 0, right: 0, height: 90 }}
          pointerEvents="none"
        />
        {/* Bottom fade: transparent → cream (fully solid at 40%) */}
        <LinearGradient
          colors={["transparent", C.bg, C.bg]}
          locations={[0, 0.4, 1]}
          style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 320 }}
          pointerEvents="none"
        />
      </View>

      {/* ── Copy Section ── */}
      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        {/* Availability indicator */}
        <Animated.View
          entering={FadeInUp.delay(0).springify().damping(18)}
          style={{ flexDirection: "row", alignItems: "center", gap: 7, marginTop: 4 }}
        >
          <PulsingDot />
          <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: "#4CAF50" }}>
            16 bord tillgängliga ikväll
          </Text>
        </Animated.View>

        {/* Logo */}
        <Animated.View entering={FadeInUp.delay(150).springify().damping(18)} style={{ marginTop: 14 }}>
          <Text
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              fontSize: 32,
              color: C.text,
              letterSpacing: -1,
            }}
          >
            Reslot
          </Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View entering={FadeInUp.delay(300).springify().damping(18)} style={{ marginTop: 10 }}>
          <Text
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              fontSize: 27,
              color: C.text,
              letterSpacing: -0.5,
              lineHeight: 34,
            }}
          >
            Bra bord går fort.
          </Text>
          <Text
            style={{
              fontFamily: "PlusJakartaSans_400Regular",
              fontSize: 15,
              color: C.gray,
              marginTop: 8,
              lineHeight: 22,
            }}
          >
            Hitta och dela restaurangbokningar i din stad.
          </Text>
        </Animated.View>
      </View>

      {/* ── Bottom Actions ── */}
      <Animated.View
        entering={FadeInUp.delay(450).springify().damping(18)}
        style={{ paddingHorizontal: 24, paddingBottom: 16 }}
      >
        <PrimaryButton testID="get-started-btn" label="Kom igång" onPress={onGetStarted} />
        <Pressable
          testID="explore-btn"
          onPress={onExplore}
          style={{ alignItems: "center", marginTop: 16 }}
        >
          <Text
            style={{
              fontFamily: "PlusJakartaSans_500Medium",
              fontSize: 15,
              color: C.orange,
            }}
          >
            Utforska restauranger
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ==================== STEP 2: PHONE ====================
function PhoneStep({
  onNext,
  onBack,
  isLoading,
  error,
}: {
  onNext: (phone: string) => void;
  onBack: () => void;
  isLoading?: boolean;
  error?: string | null;
}) {
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        <BackArrow onPress={onBack} />

        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={{ marginTop: 24 }}>
          <Text
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              fontSize: 24,
              color: C.text,
              textAlign: "center",
              letterSpacing: -0.5,
              lineHeight: 32,
            }}
          >
            Logga in eller{"\n"}skapa konto
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={{ marginTop: 40 }}>
          <Text
            style={{
              fontFamily: "PlusJakartaSans_500Medium",
              fontSize: 15,
              color: C.gray,
              marginBottom: 12,
            }}
          >
            Ange ditt telefonnummer
          </Text>
          <View
            style={{
              backgroundColor: C.bgInput,
              borderRadius: 14,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              height: 56,
            }}
          >
            <Text style={{ fontSize: 20, marginRight: 8 }}>🇸🇪</Text>
            <Text
              style={{
                fontFamily: "PlusJakartaSans_600SemiBold",
                fontSize: 16,
                color: C.text,
                marginRight: 8,
              }}
            >
              +46
            </Text>
            <View style={{ width: 1, height: 28, backgroundColor: C.divider, marginRight: 10 }} />
            <TextInput
              testID="phone-input"
              value={phone}
              onChangeText={setPhone}
              placeholder="070-123 45 67"
              placeholderTextColor="#9CA3AF"
              style={{
                flex: 1,
                fontFamily: "PlusJakartaSans_400Regular",
                fontSize: 16,
                color: C.text,
              }}
              keyboardType="phone-pad"
              autoFocus
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={{ marginTop: 24 }}>
          <Pressable
            testID="sms-checkbox"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setAgreed(!agreed);
            }}
            style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                borderWidth: 1.5,
                borderColor: agreed ? C.orange : "rgba(0,0,0,0.20)",
                backgroundColor: agreed ? C.orange : "transparent",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 1,
              }}
            >
              {agreed ? <Check size={13} color="#FFF" strokeWidth={3} /> : null}
            </View>
            <Text
              style={{
                fontFamily: "PlusJakartaSans_400Regular",
                fontSize: 13,
                color: C.gray,
                flex: 1,
                lineHeight: 20,
              }}
            >
              Jag godkänner att ta emot SMS-aviseringar om mina bokningar och viktiga
              uppdateringar.{" "}
              <Text style={{ color: C.orange }}>Villkor</Text> och{" "}
              <Text style={{ color: C.orange }}>Integritetspolicy</Text>.
            </Text>
          </Pressable>
        </Animated.View>

        <View style={{ flex: 1 }} />

        {error ? (
          <Animated.View entering={FadeIn.duration(200)} style={{ paddingBottom: 12 }}>
            <Text
              style={{
                fontFamily: "PlusJakartaSans_500Medium",
                fontSize: 13,
                color: error.startsWith("DEV:") ? C.gold : C.orange,
                textAlign: "center",
                lineHeight: 18,
              }}
            >
              {error}
            </Text>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInUp.delay(400).duration(400)} style={{ paddingBottom: 16 }}>
          <PrimaryButton
            testID="phone-next-btn"
            label={isLoading ? "Skickar..." : "Nästa"}
            onPress={() => onNext(phone)}
            disabled={phone.length < 6 || !!isLoading}
          />
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ==================== STEP 3: OTP ====================
function OTPStep({
  phone,
  onNext,
  onBack,
  onEditPhone,
  isLoading,
  error,
}: {
  phone: string;
  onNext: (code: string) => void;
  onBack: () => void;
  onEditPhone: () => void;
  isLoading?: boolean;
  error?: string | null;
}) {
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [hasError, setHasError] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const shakeX = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const triggerShake = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(10, { duration: 55 }),
      withTiming(-10, { duration: 55 }),
      withTiming(6, { duration: 55 }),
      withTiming(-6, { duration: 55 }),
      withTiming(0, { duration: 55 })
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setHasError(true);
    setTimeout(() => setHasError(false), 2000);
  }, [shakeX]);

  const handleChange = useCallback(
    (text: string, index: number) => {
      const newCode = [...code];
      newCode[index] = text;
      setCode(newCode);
      setHasError(false);

      if (text && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    },
    [code]
  );

  const handleKeyPress = useCallback(
    (key: string, index: number) => {
      if (key === "Backspace" && !code[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    },
    [code]
  );

  const isFull = code.every((c) => c.length === 1);

  const handleNext = useCallback(() => {
    onNext(code.join(""));
  }, [code, onNext]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        <BackArrow onPress={onBack} />

        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={{ marginTop: 24, alignItems: "center" }}>
          <Text
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              fontSize: 22,
              color: C.text,
              textAlign: "center",
            }}
          >
            Vi skickade en kod till
          </Text>
          <Pressable
            testID="edit-phone"
            onPress={onEditPhone}
            style={{ flexDirection: "row", alignItems: "center", marginTop: 6, gap: 6 }}
          >
            <Text
              style={{
                fontFamily: "PlusJakartaSans_600SemiBold",
                fontSize: 17,
                color: C.orange,
              }}
            >
              +46 {phone}
            </Text>
            <Pencil size={14} color={C.orange} strokeWidth={2} />
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={{ marginTop: 40 }}>
          <Text
            style={{
              fontFamily: "PlusJakartaSans_500Medium",
              fontSize: 15,
              color: C.text,
              marginBottom: 16,
            }}
          >
            Ange koden du fick
          </Text>
          <Animated.View style={[shakeStyle, { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }]}>
            {code.map((digit, i) => (
              <React.Fragment key={i}>
                {i === 3 ? (
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_400Regular",
                      fontSize: 18,
                      color: C.grayLight,
                      marginHorizontal: 2,
                    }}
                  >
                    -
                  </Text>
                ) : null}
                <TextInput
                  ref={(ref) => {
                    inputRefs.current[i] = ref;
                  }}
                  testID={`otp-${i}`}
                  value={digit}
                  onChangeText={(text) => handleChange(text.replace(/[^0-9]/g, "").slice(-1), i)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  style={{
                    width: 44,
                    height: 52,
                    borderRadius: 12,
                    backgroundColor: hasError ? "rgba(224,106,78,0.12)" : C.bgInput,
                    textAlign: "center",
                    fontFamily: "PlusJakartaSans_700Bold",
                    fontSize: 20,
                    color: hasError ? C.orange : C.text,
                    borderWidth: hasError ? 1 : 0,
                    borderColor: hasError ? "rgba(224,106,78,0.4)" : "transparent",
                  }}
                />
              </React.Fragment>
            ))}
          </Animated.View>
          {hasError || error ? (
            <Text
              style={{
                fontFamily: "PlusJakartaSans_500Medium",
                fontSize: 13,
                color: C.orange,
                textAlign: "center",
                marginTop: 12,
              }}
            >
              {error ?? "Fel kod. Försök igen."}
            </Text>
          ) : null}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={{ marginTop: 20 }}>
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: C.gray }}>
            Fick du ingen kod?{" "}
            <Text
              style={{ color: C.orange, fontFamily: "PlusJakartaSans_600SemiBold" }}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              Skicka igen
            </Text>
          </Text>
        </Animated.View>

        <View style={{ flex: 1 }} />

        <Animated.View entering={FadeInUp.delay(400).duration(400)} style={{ paddingBottom: 16 }}>
          <PrimaryButton testID="otp-next-btn" label={isLoading ? "Verifierar..." : "Nästa"} onPress={handleNext} disabled={!isFull || !!isLoading} />
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ==================== STEP 4: REGISTER ====================
function RegisterStep({
  onNext,
  onBack,
}: {
  onNext: (first: string, last: string, email: string) => void;
  onBack: () => void;
}) {
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);

  const canContinue = first.trim() && last.trim() && email.trim() && agreed;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        <BackArrow onPress={onBack} />

        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={{ marginTop: 24 }}>
          <Text
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              fontSize: 22,
              color: C.text,
              textAlign: "center",
              lineHeight: 30,
            }}
          >
            Välkommen till Reslot!{"\n"}Låt oss registrera dig.
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={{
            marginTop: 32,
            backgroundColor: C.bgInput,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          {/* First name */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 12, color: C.grayLight, marginBottom: 4 }}>
              Förnamn
            </Text>
            <TextInput
              testID="first-name-input"
              value={first}
              onChangeText={setFirst}
              placeholder="Ditt förnamn"
              placeholderTextColor="#9CA3AF"
              style={{
                fontFamily: "PlusJakartaSans_400Regular",
                fontSize: 16,
                color: C.text,
              }}
              autoCapitalize="words"
            />
          </View>
          <View style={{ height: 0.5, backgroundColor: C.divider, marginLeft: 16 }} />
          {/* Last name */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 12, color: C.grayLight, marginBottom: 4 }}>
              Efternamn
            </Text>
            <TextInput
              testID="last-name-input"
              value={last}
              onChangeText={setLast}
              placeholder="Ditt efternamn"
              placeholderTextColor="#9CA3AF"
              style={{
                fontFamily: "PlusJakartaSans_400Regular",
                fontSize: 16,
                color: C.text,
              }}
              autoCapitalize="words"
            />
          </View>
          <View style={{ height: 0.5, backgroundColor: C.divider, marginLeft: 16 }} />
          {/* Email */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 12, color: C.grayLight, marginBottom: 4 }}>
              E-post
            </Text>
            <TextInput
              testID="email-input"
              value={email}
              onChangeText={setEmail}
              placeholder="hej@reslot.se"
              placeholderTextColor="#9CA3AF"
              style={{
                fontFamily: "PlusJakartaSans_400Regular",
                fontSize: 16,
                color: C.text,
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={{ marginTop: 24 }}>
          <Pressable
            testID="terms-checkbox"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setAgreed(!agreed);
            }}
            style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                borderWidth: 1.5,
                borderColor: agreed ? C.orange : "rgba(0,0,0,0.20)",
                backgroundColor: agreed ? C.orange : "transparent",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 1,
              }}
            >
              {agreed ? <Check size={13} color="#FFF" strokeWidth={3} /> : null}
            </View>
            <Text
              style={{
                fontFamily: "PlusJakartaSans_400Regular",
                fontSize: 13,
                color: C.gray,
                flex: 1,
                lineHeight: 20,
              }}
            >
              Genom att registrera dig godkänner du våra{" "}
              <Text style={{ color: C.orange }}>Villkor</Text> och{" "}
              <Text style={{ color: C.orange }}>Integritetspolicy</Text>.
            </Text>
          </Pressable>
        </Animated.View>

        <View style={{ flex: 1 }} />

        <Animated.View entering={FadeInUp.delay(400).duration(400)} style={{ paddingBottom: 16 }}>
          <PrimaryButton
            testID="register-next-btn"
            label="Nästa"
            onPress={() => onNext(first.trim(), last.trim(), email.trim())}
            disabled={!canContinue}
          />
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ==================== STEP 5-7: ONBOARDING CAROUSEL ====================
interface OnboardSlide {
  title: string;
  icon: typeof Utensils;
  iconBg: string;
  mockItems: { label: string; sub: string; icon: typeof Clock }[];
  body: string;
  nextLabel: string;
}

const ONBOARD_SLIDES: OnboardSlide[] = [
  {
    title: "Hitta bord",
    icon: Search,
    iconBg: "rgba(212,169,110,0.15)",
    mockItems: [
      { label: "Frantzén", sub: "Ikväll · 20:00 · 2 gäster", icon: Clock },
      { label: "Ekstedt", sub: "Imorgon · 18:30 · 3 gäster", icon: Users },
      { label: "Sushi Sho", sub: "Ikväll · 18:00 · 2 gäster", icon: CalendarCheck },
    ],
    body: "Bläddra bland lediga bord delade av Reslot-communityn. Ser du något du gillar — tryck för att ta över det direkt.",
    nextLabel: "Nästa: Dela bokning",
  },
  {
    title: "Dela bokning",
    icon: Utensils,
    iconBg: "rgba(232,114,74,0.15)",
    mockItems: [
      { label: "Restaurang", sub: "Frantzén", icon: Utensils },
      { label: "Antal gäster", sub: "2 personer", icon: Users },
      { label: "Tid", sub: "Lördag 20:00", icon: Clock },
    ],
    body: "Kan du inte gå? Dela din bokning — undvik avbokningsavgifter och hjälp någon annan få ett toppbord.",
    nextLabel: "Nästa: Tjäna poäng",
  },
  {
    title: "Tjäna poäng",
    icon: Coins,
    iconBg: "rgba(212,169,110,0.15)",
    mockItems: [
      { label: "Dela bokning", sub: "+2 tokens", icon: Gift },
      { label: "Ta över bord", sub: "+1 token", icon: Award },
      { label: "Bjud in en vän", sub: "+5 tokens", icon: Users },
    ],
    body: "Dela och ta bord för att samla poäng. Lös in dem mot förmåner som extra notiser och Premium-access.",
    nextLabel: "Kom igång",
  },
];

// --- Animated Dots for carousel ---
function AnimatedDots({ currentPage }: { currentPage: number }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "center", gap: 8 }}>
      {ONBOARD_SLIDES.map((_, i) => {
        const isActive = i === currentPage;
        return (
          <Animated.View
            key={i}
            style={{
              width: isActive ? 24 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: isActive ? C.orange : "rgba(0,0,0,0.10)",
            }}
          />
        );
      })}
    </View>
  );
}

// --- Single slide item rendered inside FlatList ---
function CarouselSlideItem({
  slide,
  pageKey,
}: {
  slide: OnboardSlide;
  pageKey: string;
}) {
  return (
    <View
      style={{
        width: SCREEN_W,
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: "center",
        paddingTop: 16,
        paddingBottom: 8,
      }}
    >
      {/* Title */}
      <Animated.View key={`title-${pageKey}`} entering={FadeInDown.delay(0).duration(420)}>
        <Text
          style={{
            fontFamily: "PlusJakartaSans_700Bold",
            fontSize: 36,
            color: C.text,
            textAlign: "center",
            lineHeight: 44,
            letterSpacing: -0.8,
          }}
        >
          {slide.title}
        </Text>
      </Animated.View>

      {/* Mock card */}
      <Animated.View
        key={`card-${pageKey}`}
        entering={FadeInDown.delay(100).duration(440)}
        style={{
          backgroundColor: C.bgCard,
          borderRadius: 20,
          padding: 20,
          marginTop: 28,
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.06)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
        }}
      >
        {slide.mockItems.map((item, i) => {
          const ItemIcon = item.icon;
          return (
            <View key={i}>
              <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: 14 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: "rgba(0,0,0,0.04)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ItemIcon size={17} color={C.gold} strokeWidth={1.8} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_600SemiBold",
                      fontSize: 14,
                      color: C.text,
                    }}
                  >
                    {item.label}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_400Regular",
                      fontSize: 12,
                      color: C.gray,
                      marginTop: 2,
                    }}
                  >
                    {item.sub}
                  </Text>
                </View>
              </View>
              {i < slide.mockItems.length - 1 ? (
                <View style={{ height: 0.5, backgroundColor: C.divider }} />
              ) : null}
            </View>
          );
        })}
      </Animated.View>

      {/* Body */}
      <Animated.View
        key={`body-${pageKey}`}
        entering={FadeInDown.delay(200).duration(460)}
        style={{ marginTop: 28 }}
      >
        <Text
          style={{
            fontFamily: "PlusJakartaSans_400Regular",
            fontSize: 16,
            color: C.gray,
            textAlign: "center",
            lineHeight: 24,
          }}
        >
          {slide.body}
        </Text>
      </Animated.View>
    </View>
  );
}

// --- OnboardingCarousel: single "onboard" step with horizontal pager ---
function OnboardingCarousel({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  const [currentPage, setCurrentPage] = useState(0);
  const flatListRef = useRef<FlatList<OnboardSlide>>(null);

  const handleScroll = useCallback(
    (event: { nativeEvent: { contentOffset: { x: number } } }) => {
      const page = Math.round(event.nativeEvent.contentOffset.x / SCREEN_W);
      if (page !== currentPage && page >= 0 && page < ONBOARD_SLIDES.length) {
        setCurrentPage(page);
      }
    },
    [currentPage]
  );

  const goToNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (currentPage < ONBOARD_SLIDES.length - 1) {
      const nextPage = currentPage + 1;
      flatListRef.current?.scrollToIndex({ index: nextPage, animated: true });
      setCurrentPage(nextPage);
    } else {
      onDone();
    }
  }, [currentPage, onDone]);

  const isLast = currentPage === ONBOARD_SLIDES.length - 1;
  const currentSlide = ONBOARD_SLIDES[currentPage];
  const pageKey = String(currentPage);

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={flatListRef}
        data={ONBOARD_SLIDES}
        keyExtractor={(_, i) => String(i)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
        renderItem={({ item, index }) => (
          <CarouselSlideItem
            slide={item}
            pageKey={index === currentPage ? pageKey : `static-${index}`}
          />
        )}
        getItemLayout={(_, index) => ({
          length: SCREEN_W,
          offset: SCREEN_W * index,
          index,
        })}
      />

      {/* Fixed bottom: dots + button + skip */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 16, backgroundColor: C.bg, zIndex: 10, borderTopColor: C.divider, borderTopWidth: 0.5 }}>
        <View style={{ height: 12 }} />
        <AnimatedDots currentPage={currentPage} />
        <View style={{ height: 20 }} />
        <PrimaryButton
          testID={`onboard-next-${currentPage}`}
          label={currentSlide.nextLabel}
          onPress={goToNext}
        />
        {!isLast ? (
          <Pressable
            testID="skip-onboarding"
            onPress={onSkip}
            style={{ alignItems: "center", marginTop: 16 }}
          >
            <Text
              style={{
                fontFamily: "PlusJakartaSans_500Medium",
                fontSize: 14,
                color: C.gray,
              }}
            >
              Hoppa över intro
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

// ==================== STEP 8: WELCOME ====================
function WelcomeStep({ onContinue, firstName }: { onContinue: () => void; firstName: string }) {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }}>
      {/* Logo */}
      <Animated.View entering={FadeInDown.delay(200).duration(600)}>
        <Text
          style={{
            fontFamily: "PlusJakartaSans_700Bold",
            fontSize: 32,
            color: C.text,
            textAlign: "center",
            letterSpacing: -1,
          }}
        >
          Reslot
        </Text>
      </Animated.View>

      {/* Gold illustration: fork + spoon handoff */}
      <Animated.View
        entering={FadeInDown.delay(400).duration(600)}
        style={{
          marginTop: 40,
          marginBottom: 20,
          alignItems: "center",
        }}
      >
        <View
          style={{
            width: 160,
            height: 160,
            borderRadius: 80,
            borderWidth: 1.5,
            borderColor: "rgba(17,24,39,0.15)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <View
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              borderWidth: 1,
              borderColor: "rgba(17,24,39,0.10)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Utensils size={48} color={C.text} strokeWidth={1.2} />
          </View>
        </View>
      </Animated.View>

      {/* Heading */}
      <Animated.View entering={FadeInDown.delay(600).duration(600)}>
        <Text
          style={{
            fontFamily: "PlusJakartaSans_700Bold",
            fontSize: 42,
            color: C.text,
            textAlign: "center",
            letterSpacing: -1,
          }}
        >
          Välkommen!
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(750).duration(500)}>
        <Text
          style={{
            fontFamily: "PlusJakartaSans_400Regular",
            fontSize: 16,
            color: C.gray,
            textAlign: "center",
            marginTop: 16,
            lineHeight: 24,
          }}
        >
          Ditt konto är klart — låt oss{"\n"}hitta ditt nästa favoritbord.
        </Text>
      </Animated.View>

      <View style={{ flex: 1 }} />

      <Animated.View entering={FadeInUp.delay(900).duration(500)} style={{ width: "100%", paddingBottom: 16 }}>
        <PrimaryButton testID="welcome-continue-btn" label="Utforska appen" onPress={onContinue} />
      </Animated.View>
    </View>
  );
}

// ==================== STEP 9: CITY ====================
function CityStep({
  onSelect,
}: {
  onSelect: (city: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const cities = ["Stockholm", "Göteborg", "Malmö", "Uppsala"];

  const handleSelect = useCallback(
    (city: string) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSelected(city);
      setTimeout(() => onSelect(city), 400);
    },
    [onSelect]
  );

  return (
    <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24 }}>
      <Animated.View entering={FadeInDown.delay(100).duration(500)} style={{ alignItems: "center", marginBottom: 8 }}>
        <Text
          style={{
            fontFamily: "PlusJakartaSans_700Bold",
            fontSize: 26,
            color: C.text,
            textAlign: "center",
            letterSpacing: -0.5,
          }}
        >
          Välj din stad
        </Text>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(200).duration(500)} style={{ alignItems: "center", marginBottom: 36 }}>
        <Text
          style={{
            fontFamily: "PlusJakartaSans_400Regular",
            fontSize: 14,
            color: C.gray,
            textAlign: "center",
            lineHeight: 20,
          }}
        >
          Välj din hemstad för att alltid se{"\n"}bokningar nära dig.
        </Text>
      </Animated.View>

      {cities.map((city, i) => {
        const isSelected = selected === city;
        return (
          <Animated.View key={city} entering={FadeInDown.delay(300 + i * 80).duration(400)}>
            <Pressable
              testID={`city-${city}`}
              onPress={() => handleSelect(city)}
              style={{
                paddingVertical: 20,
                borderBottomWidth: i < cities.length - 1 ? 0.5 : 0,
                borderBottomColor: C.divider,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_600SemiBold",
                  fontSize: 20,
                  color: isSelected ? C.orange : C.text,
                  letterSpacing: -0.3,
                }}
              >
                {city}
              </Text>
              {isSelected ? (
                <Animated.View entering={FadeIn.duration(200)}>
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: C.orange,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Check size={16} color="#FFF" strokeWidth={3} />
                  </View>
                </Animated.View>
              ) : null}
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
}

// ==================== MAIN FLOW CONTROLLER ====================
export default function OnboardingScreen() {
  const [step, setStep] = useState<Step>("splash");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const router = useRouter();
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete);
  const setGuestMode = useAuthStore((s) => s.setGuestMode);
  const setPhoneNumber = useAuthStore((s) => s.setPhoneNumber);
  const setUserInfo = useAuthStore((s) => s.setUserInfo);
  const setSelectedCity = useAuthStore((s) => s.setSelectedCity);

  const [otpError, setOtpError] = useState<string | null>(null);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [storedPhone, setStoredPhone] = useState("");
  const [storedFirstName, setStoredFirstName] = useState("");
  const [storedLastName, setStoredLastName] = useState("");
  const [storedEmail, setStoredEmail] = useState("");

  const [fontsLoaded] = useFonts({});

  const handleSendOtp = useCallback(async (phoneInput: string) => {
    setSendingOtp(true);
    setOtpError(null);
    try {
      const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL!;
      const res = await fetch(`${baseUrl}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneInput }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      setPhone(phoneInput);
      setPhoneNumber(phoneInput);
      setStoredPhone(phoneInput);
      if (json.data?.dev) {
        setOtpError("DEV: Använd kod 000000 för att logga in");
      }
      setStep("otp");
    } catch (err: any) {
      setOtpError(err.message ?? "Kunde inte skicka SMS. Försök igen.");
    } finally {
      setSendingOtp(false);
    }
  }, [setPhoneNumber]);

  const handleVerifyOtp = useCallback(async (code: string): Promise<boolean> => {
    setVerifyingOtp(true);
    setOtpError(null);
    try {
      const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL!;
      const res = await fetch(`${baseUrl}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: storedPhone,
          code,
          firstName: storedFirstName || undefined,
          lastName: storedLastName || undefined,
          email: storedEmail || undefined,
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error.message);
      const { token, user } = json.data;
      useAuthStore.getState().setSessionToken(token);
      useAuthStore.getState().setUserInfo(user.firstName ?? "", user.lastName ?? "", user.email ?? "");
      useAuthStore.getState().setPhoneNumber(storedPhone);
      return true;
    } catch (err: any) {
      setOtpError(err.message ?? "Fel kod. Försök igen.");
      return false;
    } finally {
      setVerifyingOtp(false);
    }
  }, [storedPhone, storedFirstName, storedLastName, storedEmail]);

  const finishOnboarding = useCallback(
    (city: string) => {
      setSelectedCity(city);
      setOnboardingComplete();
      router.replace("/(tabs)");
    },
    [router, setSelectedCity, setOnboardingComplete]
  );

  const skipToApp = useCallback(() => {
    setGuestMode();
    router.replace("/(tabs)");
  }, [router, setGuestMode]);

  if (!fontsLoaded) return null;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1 }}>
        {step === "splash" ? (
          <SplashStep
            onGetStarted={() => setStep("phone")}
            onExplore={skipToApp}
          />
        ) : null}

        {step === "phone" ? (
          <PhoneStep
            onNext={handleSendOtp}
            onBack={() => setStep("splash")}
            isLoading={sendingOtp}
            error={otpError}
          />
        ) : null}

        {step === "otp" ? (
          <OTPStep
            phone={storedPhone || phone}
            onNext={async (code: string) => {
              const ok = await handleVerifyOtp(code);
              if (ok) setStep("register");
            }}
            onBack={() => setStep("phone")}
            onEditPhone={() => setStep("phone")}
            isLoading={verifyingOtp}
            error={otpError}
          />
        ) : null}

        {step === "register" ? (
          <RegisterStep
            onNext={async (first: string, last: string, email: string) => {
              setStoredFirstName(first);
              setStoredLastName(last);
              setStoredEmail(email);
              setFirstName(first);
              setUserInfo(first, last, email);
              const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL!;
              const sessionToken = useAuthStore.getState().sessionToken;
              if (sessionToken) {
                await fetch(`${baseUrl}/api/profile`, {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${sessionToken}`,
                  },
                  body: JSON.stringify({ firstName: first, lastName: last, email, phone: storedPhone || phone }),
                }).catch(() => {});
              }
              setStep("onboard");
            }}
            onBack={() => setStep("otp")}
          />
        ) : null}

        {step === "onboard" ? (
          <OnboardingCarousel
            onDone={() => setStep("welcome")}
            onSkip={() => setStep("welcome")}
          />
        ) : null}

        {step === "welcome" ? (
          <WelcomeStep firstName={firstName} onContinue={() => setStep("city")} />
        ) : null}

        {step === "city" ? (
          <CityStep onSelect={finishOnboarding} />
        ) : null}
      </SafeAreaView>
    </View>
  );
}
