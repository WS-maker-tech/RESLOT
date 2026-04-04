import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  Pencil,
  Check,
  Coins,
  Upload,
  ArrowDownLeft,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Users,
} from "lucide-react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useAuthStore } from "@/lib/auth-store";
import { supabase } from "@/lib/supabase";
import { C as ThemeC, FONTS } from "../lib/theme";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

// --- Colors ---
const C = {
  ...ThemeC,
  orange: ThemeC.coral,
  text: ThemeC.textPrimary,
  gray: ThemeC.textSecondary,
  grayLight: ThemeC.textTertiary,
};

// ── Spring configs (Emil: punchier press, snappy release) ──
const SPRING_PRESS_IN = { damping: 14, stiffness: 400 };
const SPRING_PRESS_OUT = { damping: 10, stiffness: 260 };

// ── Entrance animation helpers ──
const enterHeading = (delayMs: number) => FadeInDown.delay(delayMs).springify().damping(14).stiffness(130);
const enterContent = (delayMs: number) => FadeInDown.delay(delayMs).springify().damping(18).stiffness(140);
const enterFromBottom = (delayMs: number) => FadeInUp.delay(delayMs).springify().damping(16).stiffness(130);

// ── Animated Strip ──
const CARD_H = 157;
const CARD_GAP = 9;
const CARD_STEP = CARD_H + CARD_GAP;
const STRIP_HALF = 6 * CARD_STEP;
const STRIP_H = SCREEN_H * 0.58;
const COL_W = (SCREEN_W - CARD_GAP * 2) / 3;

type StripCard = { name: string; meta: string; image: string };

const STRIP_COL_A: StripCard[] = [
  { name: "Frantzén", meta: "New Nordic · 20:00", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300&h=500&fit=crop" },
  { name: "Oaxen Krog", meta: "Scandinavian · 20:30", image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=300&h=500&fit=crop" },
  { name: "Gastrologik", meta: "Nordic · 19:00", image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=300&h=500&fit=crop" },
  { name: "Adam/Albin", meta: "Fine Dining · 19:30", image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=300&h=500&fit=crop" },
  { name: "Ekstedt", meta: "Fire Nordic · 18:30", image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=300&h=500&fit=crop" },
  { name: "Nello", meta: "Italian · 21:00", image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&h=500&fit=crop" },
];

const STRIP_COL_B: StripCard[] = [
  { name: "Babette", meta: "French-Nordic · 19:30", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=500&fit=crop" },
  { name: "Punk Royale", meta: "Avant-garde · 21:00", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=500&fit=crop" },
  { name: "Mathias D.", meta: "Nordic · 20:00", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&h=500&fit=crop" },
  { name: "Operakällaren", meta: "Classic · 19:00", image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=300&h=500&fit=crop" },
  { name: "Speceriet", meta: "Swedish · 18:00", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300&h=500&fit=crop&sat=-20" },
  { name: "Agrikultur", meta: "Neo-bistro · 20:00", image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=300&h=500&fit=crop&sat=-20" },
];

const STRIP_COL_C: StripCard[] = [
  { name: "Sushi Sho", meta: "Japanese · 19:00", image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=300&h=500&fit=crop&sat=-10" },
  { name: "Lilla Ego", meta: "French · 20:30", image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=300&h=500&fit=crop&sat=-10" },
  { name: "Basement", meta: "Bar & Grill · 21:00", image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=500&fit=crop&sat=-10" },
  { name: "Gro", meta: "Vegetarian · 19:30", image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&h=500&fit=crop&sat=-10" },
  { name: "Prinsen", meta: "Brasserie · 18:30", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=500&fit=crop&sat=-10" },
  { name: "Djuret", meta: "Meat · 20:00", image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=300&h=500&fit=crop&sat=-10" },
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
        contentFit="cover"
        cachePolicy="memory-disk"
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.72)"]}
        style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 74 }}
      />
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 8 }}>
        <Text
          style={{ fontFamily: FONTS.semiBold, fontSize: 11, color: "#FFFFFF", lineHeight: 14 }}
          numberOfLines={1}
        >
          {card.name}
        </Text>
        <Text
          style={{ fontFamily: FONTS.regular, fontSize: 9, color: "rgba(255,255,255,0.70)", lineHeight: 12, marginTop: 2 }}
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

// ── Pulsing availability dot ──
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
          { position: "absolute", width: 8, height: 8, borderRadius: 4, backgroundColor: C.success },
        ]}
      />
      <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.success }} />
    </View>
  );
}

// --- Step Enum ---
type Step = "splash" | "phone" | "otp" | "register" | "city" | "credits_intro" | "welcome";

// --- Shared Button ---
function PrimaryButton({
  label,
  onPress,
  disabled,
  testID,
  icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
  icon?: React.ReactNode;
}) {
  const scale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Animated.View style={btnStyle}>
      <Pressable
        testID={testID}
        accessibilityLabel={label}
        onPress={() => {
          if (disabled) return;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        onPressIn={() => {
          scale.value = withSpring(0.96, SPRING_PRESS_IN);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, SPRING_PRESS_OUT);
        }}
        style={{
          backgroundColor: disabled ? C.coralPressed : C.orange,
          borderRadius: 28,
          paddingVertical: 17,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 8,
          shadowColor: disabled ? "transparent" : C.orange,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: disabled ? 0 : 0.25,
          shadowRadius: 16,
        }}
      >
        <Text
          style={{
            fontFamily: FONTS.bold,
            fontSize: 16,
            color: "#111827",
            letterSpacing: -0.2,
          }}
        >
          {label}
        </Text>
        {icon ?? null}
      </Pressable>
    </Animated.View>
  );
}

// --- Secondary / Ghost button ---
function GhostButton({
  label,
  onPress,
  testID,
}: {
  label: string;
  onPress: () => void;
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
        accessibilityLabel={label}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={() => {
          scale.value = withSpring(0.97, SPRING_PRESS_IN);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, SPRING_PRESS_OUT);
        }}
        style={{ alignItems: "center", paddingVertical: 14 }}
      >
        <Text
          style={{
            fontFamily: FONTS.medium,
            fontSize: 15,
            color: C.orange,
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
  const scale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Animated.View style={btnStyle}>
      <Pressable
        testID="back-button"
        accessibilityLabel="Gå tillbaka"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={() => {
          scale.value = withSpring(0.9, SPRING_PRESS_IN);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, SPRING_PRESS_OUT);
        }}
        style={{
          width: 42,
          height: 42,
          borderRadius: 21,
          backgroundColor: "rgba(0,0,0,0.04)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ChevronLeft size={22} color={C.text} strokeWidth={2.2} />
      </Pressable>
    </Animated.View>
  );
}

// --- Progress Bar ---
function ProgressBar({ current, total }: { current: number; total: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring((current + 1) / total, { damping: 16, stiffness: 160 });
  }, [current, total]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View style={{ height: 3, backgroundColor: "rgba(0,0,0,0.06)", borderRadius: 1.5, marginBottom: 8 }}>
      <Animated.View
        style={[
          barStyle,
          {
            height: 3,
            backgroundColor: C.orange,
            borderRadius: 1.5,
          },
        ]}
      />
    </View>
  );
}

// ==================== STEP 1: SPLASH ====================
function SplashStep({ onGetStarted, onExplore }: { onGetStarted: () => void; onExplore: () => void }) {
  return (
    <View style={{ flex: 1 }}>
      {/* Animated Restaurant Strip */}
      <View style={{ height: STRIP_H, flexDirection: "row", gap: CARD_GAP, overflow: "hidden" }}>
        <AnimatedColumn cards={STRIP_COL_A} direction="down" durationSec={30} startOffsetSec={9} />
        <AnimatedColumn cards={STRIP_COL_B} direction="up" durationSec={23} startOffsetSec={4} />
        <AnimatedColumn cards={STRIP_COL_C} direction="down" durationSec={37} startOffsetSec={22} />

        <LinearGradient
          colors={[C.bg, "transparent"]}
          style={{ position: "absolute", top: 0, left: 0, right: 0, height: 80 }}
          pointerEvents="none"
        />
        <LinearGradient
          colors={["transparent", C.bg, C.bg]}
          locations={[0, 0.35, 1]}
          style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 160 }}
          pointerEvents="none"
        />
      </View>

      {/* Copy Section */}
      <View style={{ paddingHorizontal: 28, paddingBottom: 12, marginTop: -24 }}>
        {/* Logo — dramatic entrance, tighter spring for punch */}
        <Animated.View entering={FadeInUp.delay(50).springify().damping(14).stiffness(140)} style={{ marginTop: 0 }}>
          <Text
            style={{
              fontFamily: FONTS.displayBold,
              fontSize: 38,
              color: C.text,
              letterSpacing: -1.4,
            }}
          >
            Reslot
          </Text>
        </Animated.View>

        {/* Tagline — 50ms stagger after logo */}
        <Animated.View entering={FadeInUp.delay(100).springify().damping(16).stiffness(120)} style={{ marginTop: 10 }}>
          <Text
            style={{
              fontFamily: FONTS.displayBold,
              fontSize: 27,
              color: C.text,
              letterSpacing: -0.7,
              lineHeight: 35,
            }}
          >
            Bord som andra{"\n"}inte kan ta
          </Text>
          <Text
            style={{
              fontFamily: FONTS.regular,
              fontSize: 15,
              color: C.gray,
              marginTop: 12,
              lineHeight: 23,
            }}
          >
            Någon kan inte gå på Frantzén.{"\n"}Nu kan du.
          </Text>
        </Animated.View>
      </View>

      {/* Bottom Actions — 50ms after tagline */}
      <Animated.View
        entering={FadeInUp.delay(160).springify().damping(16).stiffness(130)}
        style={{ paddingHorizontal: 28, paddingBottom: 12 }}
      >
        <PrimaryButton
          testID="get-started-btn"
          label="Visa mig borden"
          onPress={onGetStarted}
          icon={<ArrowRight size={18} color="#111827" strokeWidth={2.5} />}
        />
        <GhostButton testID="explore-btn" label="Utforska utan konto" onPress={onExplore} />
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

  const checkScale = useSharedValue(agreed ? 1 : 0);
  useEffect(() => {
    checkScale.value = withSpring(agreed ? 1 : 0, { damping: 14, stiffness: 300 });
  }, [agreed]);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <BackArrow onPress={onBack} />
        </View>

        <ProgressBar current={0} total={5} />

        <Animated.View entering={enterHeading(60)} style={{ marginTop: 20 }}>
          <Text
            style={{
              fontFamily: FONTS.displayBold,
              fontSize: 28,
              color: C.text,
              letterSpacing: -0.8,
              lineHeight: 36,
            }}
          >
            Ditt nummer —{"\n"}det räcker
          </Text>
          <Text
            style={{
              fontFamily: FONTS.regular,
              fontSize: 15,
              color: C.gray,
              marginTop: 8,
              lineHeight: 22,
            }}
          >
            Vi skickar en verifieringskod via SMS
          </Text>
        </Animated.View>

        <Animated.View entering={enterContent(120)} style={{ marginTop: 32 }}>
          <View
            style={{
              backgroundColor: C.bgInput,
              borderRadius: 16,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              height: 58,
            }}
          >
            <Text style={{ fontSize: 20, marginRight: 8 }}>🇸🇪</Text>
            <Text
              style={{
                fontFamily: FONTS.semiBold,
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
              placeholder="70 123 45 67"
              placeholderTextColor={C.grayLight}
              style={{
                flex: 1,
                fontFamily: FONTS.regular,
                fontSize: 17,
                color: C.text,
                letterSpacing: 0.5,
              }}
              keyboardType="phone-pad"
              autoFocus
            />
          </View>
        </Animated.View>

        <Animated.View entering={enterContent(180)} style={{ marginTop: 20 }}>
          <Pressable
            testID="sms-checkbox"
            accessibilityLabel="Godkänn villkor för SMS-verifiering"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setAgreed(!agreed);
            }}
            style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 7,
                borderWidth: 1.5,
                borderColor: agreed ? C.coral : "rgba(0,0,0,0.18)",
                backgroundColor: agreed ? C.coral : "transparent",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 1,
              }}
            >
              <Animated.View style={checkStyle}>
                <Check size={14} color="#FFF" strokeWidth={3} />
              </Animated.View>
            </View>
            <Text
              style={{
                fontFamily: FONTS.regular,
                fontSize: 13,
                color: C.gray,
                flex: 1,
                lineHeight: 20,
              }}
            >
              Jag godkänner att ta emot SMS-aviseringar.{" "}
              <Text style={{ color: C.orange, fontFamily: FONTS.medium }}>Villkor</Text> och{" "}
              <Text style={{ color: C.orange, fontFamily: FONTS.medium }}>Integritetspolicy</Text>.
            </Text>
          </Pressable>
        </Animated.View>

        <View style={{ flex: 1 }} />

        {error ? (
          <Animated.View entering={FadeIn.duration(200)} style={{ paddingBottom: 12 }}>
            <Text
              style={{
                fontFamily: FONTS.medium,
                fontSize: 13,
                color: error.startsWith("DEV:") ? C.gold : C.error,
                textAlign: "center",
                lineHeight: 18,
              }}
            >
              {error}
            </Text>
          </Animated.View>
        ) : null}

        <Animated.View entering={enterFromBottom(240)} style={{ paddingBottom: 16 }}>
          <PrimaryButton
            testID="phone-next-btn"
            label={isLoading ? "Skickar..." : "Skicka kod"}
            onPress={() => onNext(phone)}
            disabled={phone.length < 6 || !agreed || !!isLoading}
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
  onResend,
  isLoading,
  error,
}: {
  phone: string;
  onNext: (code: string) => void;
  onBack: () => void;
  onEditPhone: () => void;
  onResend: () => void;
  isLoading?: boolean;
  error?: string | null;
}) {
  const [code, setCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [hasError, setHasError] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const shakeX = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const triggerShake = useCallback(() => {
    shakeX.value = withSequence(
      withTiming(12, { duration: 50 }),
      withTiming(-12, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(-8, { duration: 50 }),
      withTiming(4, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setHasError(true);
    setTimeout(() => setHasError(false), 2000);
  }, [shakeX]);

  // Trigger shake when error prop changes
  useEffect(() => {
    if (error) triggerShake();
  }, [error]);

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

  const handleResend = useCallback(() => {
    if (resendCooldown > 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onResend();
    setResendCooldown(30);
  }, [resendCooldown, onResend]);

  const isFull = code.every((c) => c.length === 1);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <BackArrow onPress={onBack} />
        </View>

        <ProgressBar current={1} total={5} />

        <Animated.View entering={enterHeading(60)} style={{ marginTop: 20 }}>
          <Text
            style={{
              fontFamily: FONTS.displayBold,
              fontSize: 28,
              color: C.text,
              letterSpacing: -0.8,
            }}
          >
            Verifiera ditt nummer
          </Text>
          <Pressable
            testID="edit-phone"
            accessibilityLabel="Ändra telefonnummer"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onEditPhone();
            }}
            style={{ flexDirection: "row", alignItems: "center", marginTop: 8, gap: 6 }}
          >
            <Text
              style={{
                fontFamily: FONTS.medium,
                fontSize: 15,
                color: C.gray,
              }}
            >
              Kod skickad till{" "}
            </Text>
            <Text
              style={{
                fontFamily: FONTS.semiBold,
                fontSize: 15,
                color: C.orange,
              }}
            >
              +46 {phone}
            </Text>
            <Pencil size={13} color={C.orange} strokeWidth={2} />
          </Pressable>
        </Animated.View>

        <Animated.View entering={enterContent(120)} style={{ marginTop: 40 }}>
          <Animated.View style={[shakeStyle, { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }]}>
            {code.map((digit, i) => (
              <React.Fragment key={i}>
                {i === 3 ? (
                  <View style={{ width: 16, alignItems: "center" }}>
                    <View style={{ width: 10, height: 2, borderRadius: 1, backgroundColor: C.grayLight }} />
                  </View>
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
                  autoFocus={i === 0}
                  style={{
                    width: 50,
                    height: 58,
                    borderRadius: 14,
                    backgroundColor: hasError ? "rgba(239,68,68,0.08)" : C.bgInput,
                    textAlign: "center",
                    fontFamily: FONTS.bold,
                    fontSize: 22,
                    color: hasError ? C.error : C.text,
                    borderWidth: digit ? 1.5 : 0,
                    borderColor: hasError ? "rgba(239,68,68,0.25)" : digit ? C.coralPressed : "transparent",
                  }}
                />
              </React.Fragment>
            ))}
          </Animated.View>

          {hasError || error ? (
            <Animated.View entering={FadeIn.springify()}>
              <Text
                style={{
                  fontFamily: FONTS.medium,
                  fontSize: 13,
                  color: C.error,
                  textAlign: "center",
                  marginTop: 14,
                }}
              >
                {error ?? "Fel kod — försök igen"}
              </Text>
            </Animated.View>
          ) : null}
        </Animated.View>

        <Animated.View entering={enterContent(180)} style={{ marginTop: 24, alignItems: "center" }}>
          <Pressable
            testID="resend-otp-btn"
            accessibilityLabel="Skicka ny verifieringskod"
            onPress={handleResend}
            disabled={resendCooldown > 0}
            style={{ paddingVertical: 8, paddingHorizontal: 16 }}
          >
            <Text
              style={{
                fontFamily: FONTS.medium,
                fontSize: 14,
                color: resendCooldown > 0 ? C.grayLight : C.orange,
              }}
            >
              {resendCooldown > 0
                ? `Skicka igen om ${resendCooldown}s`
                : "Skicka ny kod"}
            </Text>
          </Pressable>
        </Animated.View>

        <View style={{ flex: 1 }} />

        <Animated.View entering={enterFromBottom(240)} style={{ paddingBottom: 16 }}>
          <PrimaryButton
            testID="otp-next-btn"
            label={isLoading ? "Verifierar..." : "Verifiera"}
            onPress={() => onNext(code.join(""))}
            disabled={!isFull || !!isLoading}
          />
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ==================== STEP 4: REGISTER (Name + Email) ====================
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

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canContinue = first.trim().length >= 2 && last.trim().length >= 2 && isValidEmail;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <BackArrow onPress={onBack} />
        </View>

        <ProgressBar current={2} total={5} />

        <Animated.View entering={enterHeading(60)} style={{ marginTop: 20 }}>
          <Text
            style={{
              fontFamily: FONTS.displayBold,
              fontSize: 28,
              color: C.text,
              letterSpacing: -0.8,
              lineHeight: 36,
            }}
          >
            Berätta lite om dig
          </Text>
          <Text
            style={{
              fontFamily: FONTS.regular,
              fontSize: 15,
              color: C.gray,
              marginTop: 8,
              lineHeight: 22,
            }}
          >
            Så att restaurangen vet vem som kommer
          </Text>
        </Animated.View>

        <Animated.View
          entering={enterContent(120)}
          style={{ marginTop: 28, gap: 12 }}
        >
          {/* First name */}
          <View>
            <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: C.gray, marginBottom: 6, marginLeft: 4 }}>
              Förnamn
            </Text>
            <View
              style={{
                backgroundColor: C.bgInput,
                borderRadius: 14,
                paddingHorizontal: 16,
                height: 52,
                justifyContent: "center",
              }}
            >
              <TextInput
                testID="first-name-input"
                value={first}
                onChangeText={setFirst}
                placeholder="Anna"
                placeholderTextColor={C.grayLight}
                style={{
                  fontFamily: FONTS.regular,
                  fontSize: 16,
                  color: C.text,
                }}
                autoCapitalize="words"
                autoFocus
              />
            </View>
          </View>

          {/* Last name */}
          <View>
            <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: C.gray, marginBottom: 6, marginLeft: 4 }}>
              Efternamn
            </Text>
            <View
              style={{
                backgroundColor: C.bgInput,
                borderRadius: 14,
                paddingHorizontal: 16,
                height: 52,
                justifyContent: "center",
              }}
            >
              <TextInput
                testID="last-name-input"
                value={last}
                onChangeText={setLast}
                placeholder="Andersson"
                placeholderTextColor={C.grayLight}
                style={{
                  fontFamily: FONTS.regular,
                  fontSize: 16,
                  color: C.text,
                }}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Email */}
          <View>
            <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: C.gray, marginBottom: 6, marginLeft: 4 }}>
              E-postadress
            </Text>
            <View
              style={{
                backgroundColor: C.bgInput,
                borderRadius: 14,
                paddingHorizontal: 16,
                height: 52,
                justifyContent: "center",
              }}
            >
              <TextInput
                testID="email-input"
                value={email}
                onChangeText={setEmail}
                placeholder="anna@exempel.se"
                placeholderTextColor={C.grayLight}
                style={{
                  fontFamily: FONTS.regular,
                  fontSize: 16,
                  color: C.text,
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
            {email.length > 0 && !isValidEmail ? (
              <Text
                style={{
                  fontFamily: FONTS.regular,
                  fontSize: 12,
                  color: C.error,
                  marginTop: 4,
                  marginLeft: 4,
                }}
              >
                Ange en giltig e-postadress
              </Text>
            ) : null}
          </View>
        </Animated.View>

        <View style={{ flex: 1 }} />

        <Animated.View entering={enterFromBottom(240)} style={{ paddingBottom: 16 }}>
          <PrimaryButton
            testID="register-next-btn"
            label="Fortsätt"
            onPress={() => onNext(first.trim(), last.trim(), email.trim())}
            disabled={!canContinue}
          />
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ==================== STEP 5: CITY ====================
function CityStep({ onSelect, onBack }: { onSelect: (city: string) => void; onBack: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const cities = [
    { name: "Stockholm", emoji: "🏛️", count: "" },
    { name: "Göteborg", emoji: "⛵", count: "" },
    { name: "Malmö", emoji: "🌉", count: "" },
    { name: "Uppsala", emoji: "🎓", count: "" },
  ];

  const handleSelect = useCallback(
    (city: string) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSelected(city);
      setTimeout(() => onSelect(city), 350);
    },
    [onSelect]
  );

  return (
    <View style={{ flex: 1, paddingHorizontal: 24 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <BackArrow onPress={onBack} />
      </View>

      <ProgressBar current={3} total={5} />

      <Animated.View entering={enterHeading(60)} style={{ marginTop: 20, marginBottom: 8 }}>
        <Text
          style={{
            fontFamily: FONTS.displayBold,
            fontSize: 28,
            color: C.text,
            letterSpacing: -0.8,
          }}
        >
          Var bor du?
        </Text>
        <Text
          style={{
            fontFamily: FONTS.regular,
            fontSize: 15,
            color: C.gray,
            marginTop: 8,
            lineHeight: 22,
          }}
        >
          Vi visar bokningar nära dig
        </Text>
      </Animated.View>

      <View style={{ marginTop: 24, gap: 10 }}>
        {cities.map((city, i) => {
          const isSelected = selected === city.name;
          return (
            <Animated.View key={city.name} entering={enterContent(120 + i * 55)}>
              <CityCard
                city={city}
                isSelected={isSelected}
                onPress={() => handleSelect(city.name)}
              />
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

function CityCard({
  city,
  isSelected,
  onPress,
}: {
  city: { name: string; emoji: string; count: string };
  isSelected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={cardStyle}>
      <Pressable
        testID={`city-${city.name}`}
        accessibilityLabel={city.name}
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.97, SPRING_PRESS_IN);
        }}
        onPressOut={() => {
          scale.value = withSpring(1, SPRING_PRESS_OUT);
        }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 16,
          paddingHorizontal: 16,
          backgroundColor: isSelected ? C.coralLight : C.bgCard,
          borderRadius: 16,
          borderWidth: 1.5,
          borderColor: isSelected ? C.orange : C.divider,
          gap: 14,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: isSelected ? C.coralLight : "rgba(0,0,0,0.03)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 22 }}>{city.emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: FONTS.semiBold,
              fontSize: 17,
              color: isSelected ? C.orange : C.text,
              letterSpacing: -0.2,
            }}
          >
            {city.name}
          </Text>
          {city.count ? (
            <Text
              style={{
                fontFamily: FONTS.regular,
                fontSize: 13,
                color: C.gray,
                marginTop: 2,
              }}
            >
              {city.count}
            </Text>
          ) : null}
        </View>
        {isSelected ? (
          <Animated.View entering={FadeIn.springify()}>
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
        ) : (
          <ChevronRight size={18} color={C.grayLight} strokeWidth={2} />
        )}
      </Pressable>
    </Animated.View>
  );
}

// ==================== STEP 6: CREDITS INTRO ====================
function CreditsIntroStep({ onContinue, onBack }: { onContinue: () => void; onBack: () => void }) {
  const rows = [
    {
      icon: Upload,
      iconBg: C.coralLight,
      iconColor: C.orange,
      title: "Ledigtt bord? Lägg upp det.",
      subtitle: "Tar 30 sekunder. Borden hittar nya ägare.",
      badge: "+2 credits",
      badgeBg: C.successLight,
      badgeColor: C.success,
      step: 0,
    },
    {
      icon: Coins,
      iconBg: "rgba(201,169,110,0.12)",
      iconColor: C.gold,
      title: "Du tjänar — de vinner",
      subtitle: "Någon tar ditt bord. Du får 2 credits. Alla glada.",
      badge: null as string | null,
      badgeBg: undefined as string | undefined,
      badgeColor: undefined as string | undefined,
      step: 1,
    },
    {
      icon: ArrowDownLeft,
      iconBg: C.successLight,
      iconColor: C.success,
      title: "Snappa ett bord",
      subtitle: "Använd dina credits. Ta bordet. Njut av kvällen.",
      badge: "−2 credits",
      badgeBg: C.coralLight,
      badgeColor: C.orange,
      step: 2,
    },
  ];

  return (
    <View style={{ flex: 1, paddingHorizontal: 24 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <BackArrow onPress={onBack} />
      </View>

      <ProgressBar current={4} total={5} />

      <View style={{ flex: 1, justifyContent: "center" }}>
        {/* Animated coin icon */}
        <Animated.View
          entering={enterHeading(60)}
          style={{ alignItems: "center", marginBottom: 10 }}
        >
          <AnimatedCoinIcon />
        </Animated.View>

        <Animated.View
          entering={enterHeading(120)}
          style={{ alignItems: "center", marginBottom: 28 }}
        >
          <Text
            style={{
              fontFamily: FONTS.displayBold,
              fontSize: 28,
              color: C.text,
              textAlign: "center",
              letterSpacing: -0.8,
            }}
          >
            Så fungerar credits
          </Text>
          <Text
            style={{
              fontFamily: FONTS.regular,
              fontSize: 15,
              color: C.gray,
              textAlign: "center",
              marginTop: 10,
              lineHeight: 23,
            }}
          >
            Så fungerar det — med riktiga restauranger
          </Text>
        </Animated.View>

        {/* Credit flow: rows with step numbers + connectors */}
        {rows.map((row, i) => {
          const RowIcon = row.icon;
          return (
            <React.Fragment key={i}>
              {i > 0 ? (
                <Animated.View
                  entering={enterContent(200 + i * 60)}
                  style={{ alignItems: "center", marginVertical: 3 }}
                >
                  <View style={{ width: 2, height: 22, backgroundColor: "rgba(201,169,110,0.20)", borderRadius: 1 }} />
                </Animated.View>
              ) : null}
              <Animated.View
                entering={enterContent(200 + i * 60)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  backgroundColor: C.bgCard,
                  borderRadius: 16,
                  borderWidth: 0.5,
                  borderColor: C.divider,
                  gap: 12,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.04,
                  shadowRadius: 10,
                }}
              >
                {/* Step number */}
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: "rgba(201,169,110,0.10)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontFamily: FONTS.bold, fontSize: 11, color: C.gold }}>{i + 1}</Text>
                </View>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: row.iconBg,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <RowIcon size={20} color={row.iconColor} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: FONTS.semiBold,
                      fontSize: 15,
                      color: C.text,
                      letterSpacing: -0.1,
                    }}
                  >
                    {row.title}
                  </Text>
                  <Text
                    style={{
                      fontFamily: FONTS.regular,
                      fontSize: 13,
                      color: C.gray,
                      marginTop: 2,
                      lineHeight: 18,
                    }}
                  >
                    {row.subtitle}
                  </Text>
                </View>
                {row.badge ? (
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 10,
                      backgroundColor: row.badgeBg,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: FONTS.bold,
                        fontSize: 12,
                        color: row.badgeColor,
                      }}
                    >
                      {row.badge}
                    </Text>
                  </View>
                ) : (
                  <Coins size={20} color={C.gold} strokeWidth={2} />
                )}
              </Animated.View>
            </React.Fragment>
          );
        })}

        {/* Loop indicator */}
        <Animated.View
          entering={enterContent(420)}
          style={{ alignItems: "center", marginTop: 14 }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingVertical: 8,
              paddingHorizontal: 16,
              backgroundColor: "rgba(201,169,110,0.08)",
              borderRadius: 20,
            }}
          >
            <Sparkles size={14} color={C.gold} strokeWidth={2} />
            <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: C.gold, letterSpacing: -0.1 }}>
              Loopen fortsätter — dela mer, ta mer
            </Text>
          </View>
        </Animated.View>
      </View>

      <Animated.View
        entering={enterFromBottom(460)}
        style={{ paddingBottom: 16 }}
      >
        <Pressable
          testID="credits-intro-skip-btn"
          accessibilityLabel="Hoppa över"
          onPress={onContinue}
          style={{ alignItems: "center", paddingVertical: 10, marginBottom: 4 }}
        >
          <Text style={{ fontFamily: FONTS.medium, fontSize: 14, color: C.grayLight }}>
            Hoppa över
          </Text>
        </Pressable>
        <PrimaryButton
          testID="credits-intro-continue-btn"
          label="Fattat — kör!"
          onPress={onContinue}
        />
      </Animated.View>
    </View>
  );
}

// Animated coin — gentle float + subtle rotation (not frenetic)
function AnimatedCoinIcon() {
  const y = useSharedValue(0);
  const rotate = useSharedValue(0);

  useEffect(() => {
    // Slow, elegant float
    y.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
    // Gentle tilt
    rotate.value = withRepeat(
      withSequence(
        withTiming(3, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
        withTiming(-3, { duration: 1400, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
  }, []);

  const coinStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }, { rotate: `${rotate.value}deg` }],
  }));

  return (
    <Animated.View
      style={[
        coinStyle,
        {
          width: 76,
          height: 76,
          borderRadius: 38,
          backgroundColor: "rgba(201,169,110,0.10)",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
        },
      ]}
    >
      <View
        style={{
          width: 54,
          height: 54,
          borderRadius: 27,
          backgroundColor: "rgba(201,169,110,0.16)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Coins size={28} color={C.gold} strokeWidth={2} />
      </View>
    </Animated.View>
  );
}

// ── Floating celebration particle (geometric, no emoji) ──
const PARTICLE_SHAPES = [
  { shape: "circle", color: "#7EC87A" },
  { shape: "square", color: "#FF6B6B" },
  { shape: "circle", color: "#111827" },
  { shape: "square", color: "#7EC87A" },
  { shape: "circle", color: "#FF6B6B" },
];
function FloatingParticle({ index, delay: d, startX, startY }: { index: number; delay: number; startX: number; startY: number }) {
  const tY = useSharedValue(0);
  const tX = useSharedValue(0);
  const op = useSharedValue(0);
  const pSc = useSharedValue(0.4);
  const rot = useSharedValue(0);
  const { shape, color } = PARTICLE_SHAPES[index % PARTICLE_SHAPES.length];
  useEffect(() => {
    const driftX = (Math.random() - 0.5) * 40;
    op.value = withDelay(d, withSequence(
      withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) }),
      withDelay(800, withTiming(0, { duration: 600, easing: Easing.in(Easing.quad) }))
    ));
    tY.value = withDelay(d, withTiming(-70 - Math.random() * 40, { duration: 1700, easing: Easing.out(Easing.quad) }));
    tX.value = withDelay(d, withTiming(driftX, { duration: 1700, easing: Easing.out(Easing.quad) }));
    pSc.value = withDelay(d, withSpring(1, { damping: 8, stiffness: 120 }));
    rot.value = withDelay(d, withTiming(shape === "square" ? 45 : 0, { duration: 1700 }));
  }, []);
  const pStyle = useAnimatedStyle(() => ({
    position: "absolute" as const, left: startX, top: startY,
    transform: [{ translateY: tY.value }, { translateX: tX.value }, { scale: pSc.value }, { rotate: `${rot.value}deg` }],
    opacity: op.value,
  }));
  const size = 8 + (index % 3) * 3;
  return (
    <Animated.View style={[pStyle, {
      width: size, height: size,
      borderRadius: shape === "circle" ? size / 2 : 2,
      backgroundColor: color,
    }]} />
  );
}

function SocialProofCounter({ cityName }: { cityName: string }) {
  const [count, setCount] = useState(0);
  const target = 2400;

  useEffect(() => {
    const duration = 1400;
    const steps = 35;
    const stepValue = target / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += stepValue;
      if (current >= target) {
        setCount(target);
        clearInterval(interval);
      } else {
        setCount(Math.round(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, []);

  const formatted = count >= 1000 ? `${Math.floor(count / 1000)} ${(count % 1000).toString().padStart(3, "0")}` : count.toString();

  return (
    <Text style={{ fontFamily: FONTS.medium, fontSize: 14, color: C.gold }}>
      Gå med {formatted}+ andra i {cityName}
    </Text>
  );
}

// ==================== STEP 7: WELCOME ====================
function WelcomeStep({ onContinue, firstName, cityName }: { onContinue: () => void; firstName: string; cityName: string }) {
  // Emil: NEVER animate from scale(0). Start from 0.85 + opacity.
  const ringScale = useSharedValue(0.85);
  const ringOpacity = useSharedValue(0);
  const outerPulse = useSharedValue(1);

  useEffect(() => {
    // Layered haptics: success + light tap 200ms later
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 200);
    ringScale.value = withSpring(1, { damping: 10, stiffness: 100 });
    ringOpacity.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.quad) });
    // Subtle breathing pulse after entrance settles
    setTimeout(() => {
      outerPulse.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.quad) })
        ), -1, true
      );
    }, 600);
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }], opacity: ringOpacity.value,
  }));
  const outerPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: outerPulse.value }],
  }));

  const particles = [
    { index: 0, delay: 200, startX: -30, startY: -20 },
    { index: 1, delay: 350, startX: 50, startY: -10 },
    { index: 2, delay: 500, startX: -40, startY: 30 },
    { index: 3, delay: 450, startX: 60, startY: 20 },
    { index: 4, delay: 300, startX: 10, startY: -30 },
  ];

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }}>
      {/* Celebration ring + floating particles */}
      <View style={{ marginBottom: 32, alignItems: "center", justifyContent: "center" }}>
        <View style={{ position: "absolute", width: 130, height: 130, alignItems: "center", justifyContent: "center" }}>
          {particles.map((p, i) => <FloatingParticle key={i} {...p} />)}
        </View>
        <Animated.View style={outerPulseStyle}>
          <Animated.View style={ringStyle}>
            <View
              style={{
                width: 130,
                height: 130,
                borderRadius: 65,
                backgroundColor: C.coralLight,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  backgroundColor: C.coralPressed,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: C.pistachio, alignItems: "center", justifyContent: "center" }}>
                  <Check size={22} color={C.dark} strokeWidth={2.5} />
                </View>
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      </View>

      {/* Welcome text */}
      <Animated.View entering={enterHeading(200)}>
        <Text
          style={{
            fontFamily: FONTS.displayBold,
            fontSize: 34,
            color: C.text,
            textAlign: "center",
            letterSpacing: -1,
          }}
        >
          Välkommen{firstName ? `,\n${firstName}` : null}!
        </Text>
      </Animated.View>

      <Animated.View entering={enterContent(260)}>
        <Text
          style={{
            fontFamily: FONTS.regular,
            fontSize: 16,
            color: C.gray,
            textAlign: "center",
            marginTop: 14,
            lineHeight: 24,
          }}
        >
          Du är inne.{"\n"}Borden väntar.
        </Text>
      </Animated.View>

      {/* Social proof */}
      <Animated.View
        entering={enterContent(320)}
        style={{
          marginTop: 32,
          paddingVertical: 14,
          paddingHorizontal: 20,
          backgroundColor: C.successBg,
          borderRadius: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <PulsingDot />
        <Text
          style={{
            fontFamily: FONTS.medium,
            fontSize: 14,
            color: C.success,
          }}
        >
          Bokningar delas varje dag
        </Text>
      </Animated.View>

      <Animated.View
        entering={enterContent(380)}
        style={{
          marginTop: 10,
          paddingVertical: 14,
          paddingHorizontal: 20,
          backgroundColor: "rgba(201,169,110,0.08)",
          borderRadius: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Users size={14} color={C.gold} strokeWidth={2} />
        <SocialProofCounter cityName={cityName || "Stockholm"} />
      </Animated.View>

      <View style={{ flex: 1 }} />

      <Animated.View entering={enterFromBottom(420)} style={{ width: "100%", paddingBottom: 16 }}>
        <PrimaryButton
          testID="welcome-continue-btn"
          label="Visa mig borden"
          onPress={onContinue}
          icon={<ArrowRight size={18} color="#111827" strokeWidth={2.5} />}
        />
      </Animated.View>
    </View>
  );
}

// ==================== MAIN FLOW CONTROLLER ====================
export default function OnboardingScreen() {
  const [step, setStep] = useState<Step>("splash");
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

  // Normalize phone to E.164 format for Supabase
  const normalizePhone = useCallback((phone: string): string => {
    const digits = phone.replace(/\D/g, "");
    if (digits.startsWith("0")) return "+46" + digits.slice(1);
    if (digits.startsWith("46")) return "+" + digits;
    if (digits.startsWith("7")) return "+46" + digits;
    return "+" + digits;
  }, []);

  const handleSendOtp = useCallback(async (phoneInput: string) => {
    setSendingOtp(true);
    setOtpError(null);
    try {
      const normalized = normalizePhone(phoneInput);
      // DEV BYPASS: skip Supabase OTP in dev (remove before production)
      setStoredPhone(normalized);
      setPhoneNumber(normalized);
      setStep("otp");
    } catch (err: any) {
      setOtpError(err.message ?? "Kunde inte skicka SMS. Försök igen.");
    } finally {
      setSendingOtp(false);
    }
  }, [setPhoneNumber, normalizePhone]);

  const handleResendOtp = useCallback(async () => {
    if (!storedPhone) return;
    setOtpError(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: storedPhone });
      if (error) throw new Error(error.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      setOtpError(err.message ?? "Kunde inte skicka ny kod.");
    }
  }, [storedPhone]);

  const handleVerifyOtp = useCallback(async (code: string): Promise<boolean> => {
    setVerifyingOtp(true);
    setOtpError(null);
    try {
      // DEV BYPASS: accept any code (remove before production)
      if (code === code) { // always true in dev
        useAuthStore.getState().setPhoneNumber(storedPhone);
        return true;
      }
      const { data, error } = await supabase.auth.verifyOtp({
        phone: storedPhone,
        token: code,
        type: "sms",
      });
      if (error) throw new Error(error.message);
      if (data.session) {
        useAuthStore.getState().setSupabaseSession(data.session);
        useAuthStore.getState().setPhoneNumber(storedPhone);
      }
      return true;
    } catch (err: any) {
      setOtpError(err.message ?? "Fel kod. Försök igen.");
      return false;
    } finally {
      setVerifyingOtp(false);
    }
  }, [storedPhone]);

  const finishOnboarding = useCallback(
    (city: string) => {
      setSelectedCity(city);
      setOnboardingComplete();
      router.replace("/(tabs)");
    },
    [router, setSelectedCity, setOnboardingComplete]
  );

  const skipToApp = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGuestMode();
    router.replace("/(tabs)");
  }, [router, setGuestMode]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1 }}>
        {step === "splash" ? (
          <SplashStep
            onGetStarted={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setStep("phone");
            }}
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
            phone={storedPhone}
            onNext={async (code: string) => {
              const ok = await handleVerifyOtp(code);
              if (ok) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setStep("register");
              }
            }}
            onBack={() => setStep("phone")}
            onEditPhone={() => setStep("phone")}
            onResend={handleResendOtp}
            isLoading={verifyingOtp}
            error={otpError}
          />
        ) : null}

        {step === "register" ? (
          <RegisterStep
            onNext={async (first: string, last: string, email: string) => {
              setFirstName(first);
              setUserInfo(first, last, email);
              const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL!;
              const { data: sessionData } = await supabase.auth.getSession();
              const accessToken = sessionData.session?.access_token;
              if (accessToken) {
                await fetch(`${baseUrl}/api/profile`, {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`,
                  },
                  body: JSON.stringify({ firstName: first, lastName: last, email, phone: storedPhone }),
                }).catch(() => {});
              }
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setStep("city");
            }}
            onBack={() => setStep("otp")}
          />
        ) : null}

        {step === "city" ? (
          <CityStep
            onSelect={(city) => {
              setStep("credits_intro");
              setSelectedCity(city);
            }}
            onBack={() => setStep("register")}
          />
        ) : null}

        {step === "credits_intro" ? (
          <CreditsIntroStep
            onContinue={() => setStep("welcome")}
            onBack={() => setStep("city")}
          />
        ) : null}

        {step === "welcome" ? (
          <WelcomeStep
            firstName={firstName}
            cityName={useAuthStore.getState().selectedCity}
            onContinue={() => finishOnboarding(useAuthStore.getState().selectedCity)}
          />
        ) : null}
      </SafeAreaView>
    </View>
  );
}
