import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  Share,
  Linking,
  Platform,
  ActivityIndicator,
  Dimensions,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Star,
  Clock,
  Users,
  Calendar,
  MapPin,
  ChevronLeft,
  Share2,
  Instagram,
  Globe,
  AlertCircle,
  Check,
  Shield,
  Sparkles,
  CreditCard,
  Undo2,
  Timer,
} from "lucide-react-native";
import Animated, {
  FadeInDown,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Extrapolation,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import {
  useReservation,
  useClaimReservation,
  useCancelClaim,
  useProfile,
} from "@/lib/api/hooks";
import { useAuthStore } from "@/lib/auth-store";
import { parseTagsWithCount, parseTags } from "@/lib/api/types";
import { C, FONTS, SPACING, SHADOW, RADIUS } from "../../lib/theme";
import { HeroSection } from "@/components/HeroSection";
import { BookingDetails } from "@/components/BookingDetails";
import { RestaurantInfo } from "@/components/RestaurantInfo";
import { ClaimSection } from "@/components/ClaimSection";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HERO_HEIGHT = 280;

// Swedish day/month formatting
const MONTHS_SV = [
  "januari", "februari", "mars", "april", "maj", "juni",
  "juli", "augusti", "september", "oktober", "november", "december",
];
const DAYS_SV = ["Söndag", "Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag"];

function formatReservationDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${DAYS_SV[d.getDay()]} ${d.getDate()} ${MONTHS_SV[d.getMonth()]}`;
  } catch {
    return dateStr;
  }
}

// --- Confetti particle ---
const ConfettiParticle = React.memo(function ConfettiParticle({ delay, color, startX }: { delay: number; color: string; startX: number }) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    const xDrift = (Math.random() - 0.5) * 180;
    scale.value = withDelay(delay, withSpring(1, { damping: 8, stiffness: 200 }));
    translateY.value = withDelay(
      delay,
      withTiming(300 + Math.random() * 140, { duration: 1600, easing: Easing.out(Easing.quad) })
    );
    translateX.value = withDelay(
      delay,
      withTiming(xDrift, { duration: 1600, easing: Easing.out(Easing.quad) })
    );
    rotate.value = withDelay(
      delay,
      withTiming(360 * (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random()), { duration: 1600 })
    );
    opacity.value = withDelay(delay + 900, withTiming(0, { duration: 700 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    position: "absolute" as const,
    top: -10,
    left: startX,
    width: Math.random() > 0.5 ? 8 : 6,
    height: Math.random() > 0.5 ? 10 : 7,
    borderRadius: Math.random() > 0.5 ? 2 : 4,
    backgroundColor: color,
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
    ],
  }));

  return <Animated.View style={style} />;
});

// --- Success overlay with confetti ---
const SuccessOverlay = React.memo(function SuccessOverlay({
  visible,
  restaurantName,
  reservationDate,
  reservationTime,
}: {
  visible: boolean;
  restaurantName: string;
  reservationDate: string;
  reservationTime: string;
}) {
  const shareBtnScale = useSharedValue(1);

  const shareBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: shareBtnScale.value }],
  }));

  const handleShare = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    shareBtnScale.value = withSpring(0.93, { damping: 10 }, () => {
      shareBtnScale.value = withSpring(1, { damping: 8, stiffness: 200 });
    });
    const message = `Jag fick precis ett bord på ${restaurantName} via Reslot! ${reservationDate} kl ${reservationTime} — kolla in appen!`;
    if (Platform.OS === "web") {
      navigator.clipboard.writeText(message).catch(() => {});
    } else {
      Share.share({ message }).catch(() => {});
    }
  }, [restaurantName, reservationDate, reservationTime, shareBtnScale]);

  if (!visible) return null;

  const confettiColors = [C.coral, C.gold, C.success, "#3B82F6", "#A855F7", "#F472B6", "#FBBF24"];
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    delay: Math.random() * 400,
    color: confettiColors[i % confettiColors.length],
    startX: SCREEN_WIDTH * 0.15 + Math.random() * SCREEN_WIDTH * 0.7,
  }));

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.6)",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 200,
      }}
    >
      {/* Confetti */}
      <View style={{ position: "absolute", top: "25%", left: 0, right: 0 }}>
        {particles.map((p) => (
          <ConfettiParticle key={p.id} delay={p.delay} color={p.color} startX={p.startX} />
        ))}
      </View>

      {/* Success circle */}
      <Animated.View
        entering={ZoomIn.springify().damping(10).stiffness(150)}
        style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          backgroundColor: C.success,
          alignItems: "center",
          justifyContent: "center",
          ...SHADOW.elevated,
          shadowColor: C.success,
          shadowOpacity: 0.35,
        }}
      >
        <Check size={50} color="#FFFFFF" strokeWidth={3} />
      </Animated.View>

      <Animated.Text
        entering={FadeInDown.delay(200).springify()}
        style={{
          fontFamily: FONTS.displayBold,
          fontSize: 26,
          color: "#FFFFFF",
          marginTop: 22,
          letterSpacing: -0.6,
        }}
      >
        Bokning övertagen!
      </Animated.Text>

      <Animated.Text
        entering={FadeInDown.delay(260).springify()}
        style={{
          fontFamily: FONTS.bold,
          fontSize: 20,
          color: "#FFFFFF",
          marginTop: 14,
          letterSpacing: -0.4,
          textAlign: "center",
          paddingHorizontal: 32,
        }}
      >
        {restaurantName}
      </Animated.Text>

      <Animated.Text
        entering={FadeInDown.delay(320).springify()}
        style={{
          fontFamily: FONTS.medium,
          fontSize: 15,
          color: "rgba(255,255,255,0.8)",
          marginTop: 6,
          textAlign: "center",
        }}
      >
        {reservationDate} · {reservationTime}
      </Animated.Text>

      <Animated.Text
        entering={FadeInDown.delay(380).springify()}
        style={{
          fontFamily: FONTS.regular,
          fontSize: 14,
          color: "rgba(255,255,255,0.6)",
          marginTop: 4,
        }}
      >
        Ångerfristen börjar nu
      </Animated.Text>

      {/* Share button */}
      <Animated.View
        entering={FadeInDown.delay(440).springify().damping(12)}
        style={shareBtnStyle}
      >
        <Pressable
          testID="success-share-button"
          accessibilityLabel="Dela med en vän"
          onPress={handleShare}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            backgroundColor: "#FFFFFF",
            borderRadius: RADIUS.lg,
            paddingVertical: 15,
            paddingHorizontal: 28,
            marginTop: 28,
            opacity: pressed ? 0.92 : 1,
            ...SHADOW.elevated,
          })}
        >
          <Share2 size={18} color={C.dark} strokeWidth={2.5} />
          <Text
            style={{
              fontFamily: FONTS.semiBold,
              fontSize: 15,
              color: C.textPrimary,
            }}
          >
            Dela med en vän
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
});

// --- Grace period countdown overlay ---
const GracePeriodOverlay = React.memo(function GracePeriodOverlay({
  visible,
  onCancel,
  onExpired,
  onDone,
  cancelPending,
  restaurantName,
}: {
  visible: boolean;
  onCancel: () => void;
  onExpired: () => void;
  onDone: () => void;
  cancelPending: boolean;
  restaurantName: string;
}) {
  const [secondsLeft, setSecondsLeft] = useState(300);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      setSecondsLeft(300);
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            onExpired();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [visible, onExpired]);

  // Pulse animation when urgent
  useEffect(() => {
    if (visible && secondsLeft < 60 && secondsLeft > 0) {
      pulseScale.value = withSequence(
        withSpring(1.04, { damping: 6, stiffness: 200 }),
        withSpring(1, { damping: 8, stiffness: 200 })
      );
    }
  }, [secondsLeft, visible]);

  const ringPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  if (!visible) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const progress = secondsLeft / 300;
  const isUrgent = secondsLeft < 60;

  // Ring color based on urgency
  const ringColor = isUrgent ? C.error : C.success;
  const ringBg = isUrgent ? "rgba(239,68,68,0.06)" : C.successBg;
  const ringBorder = isUrgent ? "rgba(239,68,68,0.25)" : C.successLight;

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.7)",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <Animated.View
        entering={FadeInDown.springify().damping(14)}
        style={{
          backgroundColor: C.bgCard,
          borderRadius: RADIUS.xl,
          padding: 28,
          marginHorizontal: 24,
          alignItems: "center",
          width: SCREEN_WIDTH - 48,
          ...SHADOW.elevated,
        }}
      >
        {/* Success badge */}
        <Animated.View
          entering={ZoomIn.springify().damping(10)}
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: C.success,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 14,
            shadowColor: C.success,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 10,
          }}
        >
          <Check size={26} color="#FFFFFF" strokeWidth={3} />
        </Animated.View>

        <Text
          testID="grace-period-title"
          style={{
            fontFamily: FONTS.displayBold,
            fontSize: 22,
            color: C.textPrimary,
            textAlign: "center",
            letterSpacing: -0.5,
            marginBottom: 3,
          }}
        >
          Bokning övertagen!
        </Text>
        <Text
          style={{
            fontFamily: FONTS.regular,
            fontSize: 14,
            color: C.textSecondary,
            textAlign: "center",
            lineHeight: 20,
            marginBottom: 22,
          }}
        >
          {restaurantName}
        </Text>

        {/* Countdown ring */}
        <Animated.View
          testID="grace-period-countdown"
          style={[
            {
              width: 144,
              height: 144,
              borderRadius: 72,
              backgroundColor: ringBg,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 18,
              borderWidth: 3,
              borderColor: ringBorder,
            },
            ringPulseStyle,
          ]}
        >
          <Text
            style={{
              fontFamily: FONTS.bold,
              fontSize: 40,
              color: isUrgent ? C.error : C.dark,
              letterSpacing: 2,
            }}
          >
            {timeStr}
          </Text>
          <Text
            style={{
              fontFamily: FONTS.medium,
              fontSize: 11,
              color: isUrgent ? C.error : C.textTertiary,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginTop: 2,
            }}
          >
            Ångerfrist
          </Text>
        </Animated.View>

        {/* Progress bar */}
        <View
          style={{
            width: "100%",
            height: 4,
            backgroundColor: "rgba(0,0,0,0.06)",
            borderRadius: 2,
            marginBottom: 18,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${progress * 100}%`,
              height: "100%",
              backgroundColor: isUrgent ? C.error : C.success,
              borderRadius: 2,
            }}
          />
        </View>

        {/* Info text */}
        <Text
          style={{
            fontFamily: FONTS.regular,
            fontSize: 13,
            color: C.textSecondary,
            textAlign: "center",
            lineHeight: 19,
            marginBottom: 18,
          }}
        >
          Du kan ångra utan kostnad innan tiden går ut.{"\n"}Credits och avgift återbetalas.
        </Text>

        {/* Cancel button */}
        <Pressable
          testID="cancel-claim-button"
          accessibilityLabel="Ångra övertagande"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onCancel();
          }}
          disabled={cancelPending}
          style={({ pressed }) => ({
            backgroundColor: pressed ? "rgba(239,68,68,0.14)" : "rgba(239,68,68,0.07)",
            borderRadius: RADIUS.lg,
            paddingVertical: 15,
            paddingHorizontal: 24,
            width: "100%",
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
            transform: [{ scale: pressed ? 0.97 : 1 }],
          })}
        >
          {cancelPending ? (
            <ActivityIndicator size="small" color={C.error} />
          ) : (
            <>
              <Undo2 size={16} color={C.error} strokeWidth={2.5} />
              <Text
                style={{
                  fontFamily: FONTS.semiBold,
                  fontSize: 15,
                  color: C.error,
                }}
              >
                Ångra övertagande
              </Text>
            </>
          )}
        </Pressable>

        {/* Done button */}
        <Pressable
          testID="grace-period-done-button"
          accessibilityLabel="Klar, gå vidare"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onDone();
          }}
          style={({ pressed }) => ({
            backgroundColor: pressed ? C.success : C.dark,
            borderRadius: RADIUS.lg,
            paddingVertical: 15,
            paddingHorizontal: 24,
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 10,
            transform: [{ scale: pressed ? 0.97 : 1 }],
          })}
        >
          <Text
            style={{
              fontFamily: FONTS.semiBold,
              fontSize: 15,
              color: "#FFFFFF",
            }}
          >
            Klar
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
});

// BookingPill is now in @/components/BookingDetails

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const phone = useAuthStore((s) => s.phoneNumber);

  const { data: reservation, isLoading, error } = useReservation(id ?? "");
  const { data: profile } = useProfile(phone ?? "");
  const claimMutation = useClaimReservation();
  const cancelClaimMutation = useCancelClaim();

  const [accepted, setAccepted] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [showGracePeriod, setShowGracePeriod] = useState(false);
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);

  const scaleBtn = useSharedValue(1);
  const scrollY = useSharedValue(0);
  const shakeX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleBtn.value }],
  }));

  // Parallax hero
  const heroStyle = useAnimatedStyle(() => {
    const translateY = interpolate(scrollY.value, [-100, 0, HERO_HEIGHT], [-50, 0, 80], Extrapolation.CLAMP);
    const scale = interpolate(scrollY.value, [-100, 0], [1.2, 1], Extrapolation.CLAMP);
    return { transform: [{ translateY }, { scale }] };
  });

  // Header opacity (scroll-linked)
  const headerBgStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [HERO_HEIGHT - 100, HERO_HEIGHT - 40], [0, 1], Extrapolation.CLAMP);
    return { opacity };
  });

  // Bottom CTA bar shadow intensity linked to scroll
  const ctaShadowStyle = useAnimatedStyle(() => {
    const shadowOp = interpolate(scrollY.value, [0, 200], [0.08, 0.18], Extrapolation.CLAMP);
    return { shadowOpacity: shadowOp };
  });

  // Error shake
  const errorShakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const userCredits = profile?.credits ?? 0;
  const hasEnoughCredits = userCredits >= 2;

  // These useMemo hooks MUST be before any early returns to satisfy Rules of Hooks
  const restaurant = reservation?.restaurant;
  const tags = useMemo(() => parseTags(restaurant?.tags ?? "[]"), [restaurant?.tags]);
  const vibeTags = useMemo(() => parseTagsWithCount(restaurant?.vibeTags ?? "[]"), [restaurant?.vibeTags]);
  const displayDate = useMemo(() => reservation ? formatReservationDate(reservation.reservationDate) : "", [reservation?.reservationDate]);
  const displayTime = useMemo(() => reservation ? reservation.reservationTime.substring(0, 5) : "", [reservation?.reservationTime]);
  const isClaimed = useMemo(() => claimSuccess || reservation?.status === "claimed" || reservation?.status === "grace_period", [claimSuccess, reservation?.status]);
  const seatTypeLabel = useMemo(() => {
    const st = reservation?.seatType;
    return st === "inside" ? "Inomhus" : st === "outside" ? "Utomhus" : st === "bar" ? "Bar" : st ?? "";
  }, [reservation?.seatType]);

  const handleClaim = useCallback(async () => {
    if (!accepted || !reservation) return;
    if (!phone) return;
    if (!hasEnoughCredits) return;
    setClaimError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scaleBtn.value = withSpring(0.96, { damping: 10 }, () => {
      scaleBtn.value = withSpring(1);
    });
    try {
      await claimMutation.mutateAsync({
        reservationId: reservation.id,
        claimerPhone: phone,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setClaimSuccess(true);
      setShowSuccessAnim(true);
      setTimeout(() => {
        setShowSuccessAnim(false);
        setShowGracePeriod(true);
      }, 4000);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = err?.message ?? "Något gick fel. Försök igen.";
      setClaimError(msg);
      // Shake animation on error
      shakeX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-4, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [accepted, reservation, phone, claimMutation, scaleBtn, hasEnoughCredits, shakeX]);

  const handleCancelClaim = useCallback(async () => {
    if (!reservation) return;
    try {
      await cancelClaimMutation.mutateAsync(reservation.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowGracePeriod(false);
      setClaimSuccess(false);
      setAccepted(false);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setClaimError(err?.message ?? "Kunde inte ångra. Försök igen.");
      setShowGracePeriod(false);
    }
  }, [reservation, cancelClaimMutation]);

  const handleGraceExpired = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowGracePeriod(false);
    if (reservation) {
      router.push(`/booking-confirmation?reservationId=${reservation.id}`);
    }
  }, [reservation, router]);

  const handleGraceDone = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowGracePeriod(false);
    if (reservation) {
      router.push(`/booking-confirmation?reservationId=${reservation.id}`);
    }
  }, [reservation, router]);

  const handleGoBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const handleToggleAccepted = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAccepted((v) => !v);
  }, []);

  const handleOpenMap = useCallback(() => {
    if (!reservation) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`https://maps.apple.com/?q=${encodeURIComponent(reservation.restaurant.address)}`);
  }, [reservation]);

  const handleOpenWebsite = useCallback(() => {
    if (!reservation?.restaurant.website) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(reservation.restaurant.website);
  }, [reservation]);

  const handleOpenInstagram = useCallback(() => {
    if (!reservation?.restaurant.instagram) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`https://instagram.com/${reservation.restaurant.instagram}`);
  }, [reservation]);

  const handleBuyCredits = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/credits");
  }, [router]);

  const handleShare = useCallback(() => {
    if (!reservation) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const r = reservation.restaurant;
    const date = formatReservationDate(reservation.reservationDate);
    const time = reservation.reservationTime.substring(0, 5);
    const shareMessage = `Kolla in ${r.name} på Reslot — ledigt bord ${date} kl ${time}!`;
    if (Platform.OS === "web") {
      navigator.clipboard.writeText(shareMessage).catch(() => {});
    } else {
      Share.share({ message: shareMessage }).catch(() => {});
    }
  }, [reservation]);

  // --- Loading state (skeleton) ---
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        {/* Skeleton hero */}
        <View style={{ height: HERO_HEIGHT, backgroundColor: C.bgInput }} />
        <View style={{ paddingHorizontal: SPACING.lg, paddingTop: 20 }}>
          <View style={{ width: "70%", height: 28, backgroundColor: C.bgInput, borderRadius: 8, marginBottom: 10 }} />
          <View style={{ width: "50%", height: 16, backgroundColor: C.bgInput, borderRadius: 6, marginBottom: 8 }} />
          <View style={{ width: "40%", height: 14, backgroundColor: C.bgInput, borderRadius: 6 }} />
        </View>
        {/* Floating back button */}
        <SafeAreaView edges={["top"]} style={{ position: "absolute", top: 0, left: 0 }}>
          <Pressable
            testID="back-button"
            accessibilityLabel="Gå tillbaka"
            onPress={handleGoBack}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(255,255,255,0.85)",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: SPACING.lg,
              marginTop: 4,
              ...SHADOW.card,
            }}
          >
            <ChevronLeft size={20} color={C.dark} strokeWidth={2} />
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  // --- Error state ---
  if (error || !reservation) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <SafeAreaView edges={["top"]} style={{ backgroundColor: C.bg }}>
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: SPACING.lg, paddingTop: 4, paddingBottom: 12 }}>
            <Pressable testID="back-button" accessibilityLabel="Gå tillbaka" onPress={handleGoBack} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.04)", alignItems: "center", justifyContent: "center" }}>
              <ChevronLeft size={20} color={C.dark} strokeWidth={2} />
            </Pressable>
          </View>
        </SafeAreaView>
        <View testID="error-view" style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: C.coralLight, alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <AlertCircle size={36} color={C.coral} strokeWidth={2} />
          </View>
          <Text style={{ fontFamily: FONTS.displayBold, fontSize: 20, color: C.textPrimary, textAlign: "center", letterSpacing: -0.5 }}>
            Bokningen hittades inte
          </Text>
          <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textTertiary, marginTop: 8, textAlign: "center", lineHeight: 20 }}>
            Den kan ha blivit tagen av någon annan, eller så har den tagits bort.
          </Text>
          <Pressable
            testID="back-to-home-button"
            accessibilityLabel="Gå tillbaka"
            onPress={handleGoBack}
            style={({ pressed }) => ({
              marginTop: 28,
              backgroundColor: C.coral,
              borderRadius: RADIUS.lg,
              paddingVertical: 15,
              paddingHorizontal: 32,
              transform: [{ scale: pressed ? 0.97 : 1 }],
              ...SHADOW.elevated,
              shadowColor: C.coral,
              shadowOpacity: 0.25,
            })}
          >
            <Text style={{ fontFamily: FONTS.bold, fontSize: 15, color: "#FFFFFF" }}>Gå tillbaka</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // After the early return above, reservation and restaurant are guaranteed non-null
  const r = restaurant!;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Success confetti overlay */}
      <SuccessOverlay
        visible={showSuccessAnim}
        restaurantName={r.name}
        reservationDate={displayDate}
        reservationTime={displayTime}
      />

      {/* Grace period overlay */}
      <GracePeriodOverlay
        visible={showGracePeriod}
        onCancel={handleCancelClaim}
        onExpired={handleGraceExpired}
        onDone={handleGraceDone}
        cancelPending={cancelClaimMutation.isPending}
        restaurantName={r.name}
      />

      {/* Floating header (appears on scroll) */}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 50 }}>
        <Animated.View style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: C.bg }, headerBgStyle]} />
        <SafeAreaView edges={["top"]}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: SPACING.lg,
              paddingTop: 4,
              paddingBottom: 10,
            }}
          >
            <Pressable
              testID="back-button"
              accessibilityLabel="Gå tillbaka"
              onPress={handleGoBack}
              style={({ pressed }) => ({
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: "rgba(255,255,255,0.9)",
                alignItems: "center",
                justifyContent: "center",
                transform: [{ scale: pressed ? 0.93 : 1 }],
                ...SHADOW.card,
              })}
            >
              <ChevronLeft size={20} color={C.dark} strokeWidth={2.5} />
            </Pressable>

            <Pressable
              testID="share-button"
              accessibilityLabel="Dela bokning"
              onPress={handleShare}
              style={({ pressed }) => ({
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: "rgba(255,255,255,0.9)",
                alignItems: "center",
                justifyContent: "center",
                transform: [{ scale: pressed ? 0.93 : 1 }],
                ...SHADOW.card,
              })}
            >
              <Share2 size={17} color={C.dark} strokeWidth={2} />
            </Pressable>
          </View>
        </SafeAreaView>
      </View>

      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Hero Image — 280px */}
        <View style={{ height: HERO_HEIGHT, overflow: "hidden" }}>
          <Animated.View style={[{ width: "100%", height: "100%" }, heroStyle]}>
            <Image
              testID="hero-image"
              source={{ uri: r.image }}
              style={{ width: "100%", height: "100%", backgroundColor: C.bgInput }}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          </Animated.View>
          {/* Gradient overlays — top + bottom */}
          <LinearGradient
            colors={["rgba(0,0,0,0.25)", "transparent"]}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 100,
            }}
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.04)", "rgba(0,0,0,0.40)"]}
            locations={[0.25, 0.55, 1]}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: HERO_HEIGHT * 0.6,
            }}
          />
          {/* Bottom hero overlay: party size + time chip */}
          <View
            style={{
              position: "absolute",
              bottom: 14,
              left: SPACING.lg,
              right: SPACING.lg,
              flexDirection: "row",
              gap: 8,
            }}
          >
            <View style={{ backgroundColor: "rgba(255,255,255,0.92)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Users size={13} color={C.dark} strokeWidth={2} />
              <Text style={{ fontFamily: FONTS.semiBold, fontSize: 12, color: C.textPrimary }}>{reservation.partySize} pers</Text>
            </View>
            <View style={{ backgroundColor: "rgba(255,255,255,0.92)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Clock size={13} color={C.dark} strokeWidth={2} />
              <Text style={{ fontFamily: FONTS.semiBold, fontSize: 12, color: C.textPrimary }}>{displayTime}</Text>
            </View>
          </View>
        </View>

        {/* Restaurant name + info */}
        <Animated.View
          entering={FadeInDown.springify().damping(16)}
          style={{ paddingHorizontal: SPACING.lg, paddingTop: 20 }}
        >
          <Text
            testID="restaurant-name"
            style={{
              fontFamily: FONTS.displayBold,
              fontSize: 30,
              color: C.textPrimary,
              letterSpacing: -0.8,
              lineHeight: 38,
            }}
            numberOfLines={2}
          >
            {r.name}
          </Text>

          {/* Rating + cuisine row */}
          <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", marginTop: 10, gap: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={13}
                  color={C.gold}
                  fill={r.rating >= s ? C.gold : "transparent"}
                  strokeWidth={2}
                />
              ))}
            </View>
            <Text style={{ fontFamily: FONTS.semiBold, fontSize: 13, color: C.gold }}>
              {r.rating}
            </Text>
            <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textTertiary }}>
              ({r.reviewCount})
            </Text>
            <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.textTertiary, marginHorizontal: 4 }} />
            <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: C.textSecondary }}>
              {r.cuisine}
            </Text>
            <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.textTertiary, marginHorizontal: 2 }} />
            <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: C.textSecondary }}>
              {"€".repeat(r.priceLevel)}
            </Text>
          </View>

          {/* Address */}
          <Pressable
            testID="map-link"
            accessibilityLabel="Visa på karta"
            onPress={handleOpenMap}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              marginTop: 8,
              gap: 5,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <MapPin size={13} color={C.textTertiary} strokeWidth={2} />
            <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textSecondary, textDecorationLine: "underline", textDecorationColor: "rgba(0,0,0,0.1)" }}>
              {r.address}
            </Text>
          </Pressable>

          {/* Tags row */}
          {(tags.length > 0 || vibeTags.length > 0) ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
              {tags.map((tag: string) => (
                <View key={tag} style={{ backgroundColor: C.successLight, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5 }}>
                  <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: C.success }}>{tag}</Text>
                </View>
              ))}
              {vibeTags.map((vt) => (
                <View key={vt.label} style={{ backgroundColor: "rgba(201,169,110,0.10)", borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5 }}>
                  <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: C.gold }}>{vt.label}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Links */}
          <View style={{ flexDirection: "row", gap: 12, marginTop: 14 }}>
            {r.website ? (
              <Pressable
                testID="website-link"
                accessibilityLabel="Öppna webbsida"
                onPress={handleOpenWebsite}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Globe size={14} color={C.textTertiary} strokeWidth={2} />
                <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: C.textSecondary }}>Webbsida</Text>
              </Pressable>
            ) : null}
            {r.instagram ? (
              <Pressable
                testID="instagram-link"
                accessibilityLabel="Öppna Instagram"
                onPress={handleOpenInstagram}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Instagram size={14} color={C.textTertiary} strokeWidth={2} />
                <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: C.textSecondary }}>@{r.instagram}</Text>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>

        {/* Divider */}
        <View style={{ height: 0.5, backgroundColor: C.divider, marginHorizontal: SPACING.lg, marginTop: 20 }} />

        {/* Booking details */}
        <BookingDetails
          displayDate={displayDate}
          displayTime={displayTime}
          partySize={reservation.partySize}
          seatTypeLabel={reservation.seatType ? seatTypeLabel : null}
        />

        {/* Cost breakdown — BEFORE claim */}
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          style={{ paddingHorizontal: SPACING.lg, paddingTop: 24 }}
        >
          <View
            testID="cost-breakdown"
            style={{
              backgroundColor: C.bgCard,
              borderRadius: RADIUS.xl,
              padding: 22,
              borderWidth: 0.5,
              borderColor: C.borderLight,
              borderLeftWidth: 3,
              borderLeftColor: "rgba(201,169,110,0.4)",
              ...SHADOW.card,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 18 }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: "rgba(201,169,110,0.10)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CreditCard size={16} color={C.gold} strokeWidth={2} />
              </View>
              <Text style={{ fontFamily: FONTS.displayBold, fontSize: 17, color: C.textPrimary, letterSpacing: -0.3 }}>
                Kostnad
              </Text>
            </View>

            {/* Credits row */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ fontFamily: FONTS.regular, fontSize: 15, color: C.textSecondary }}>Bokning</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Sparkles size={13} color={C.gold} strokeWidth={2} />
                <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: C.gold }}>2 credits</Text>
              </View>
            </View>

            {/* Service fee row */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Text style={{ fontFamily: FONTS.regular, fontSize: 15, color: C.textSecondary }}>Serviceavgift</Text>
              <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: C.textPrimary }}>29 kr</Text>
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: C.divider, marginBottom: 14 }} />

            {/* Total */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <Text style={{ fontFamily: FONTS.semiBold, fontSize: 17, color: C.textPrimary }}>Totalt</Text>
              <Text style={{ fontFamily: FONTS.bold, fontSize: 18, color: C.textPrimary }}>2 credits + 29 kr</Text>
            </View>

            {/* Balance */}
            <View
              style={{
                backgroundColor: hasEnoughCredits ? C.successBg : "rgba(239,68,68,0.06)",
                borderRadius: RADIUS.md,
                paddingVertical: 11,
                paddingHorizontal: 14,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: C.textSecondary }}>Ditt saldo</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Sparkles size={11} color={hasEnoughCredits ? C.success : C.error} strokeWidth={2} />
                <Text
                  testID="user-credits-balance"
                  style={{
                    fontFamily: FONTS.bold,
                    fontSize: 14,
                    color: hasEnoughCredits ? C.success : C.error,
                  }}
                >
                  {userCredits} credits
                </Text>
              </View>
            </View>

            {!hasEnoughCredits ? (
              <Pressable
                testID="buy-credits-button"
                accessibilityLabel="Köp credits"
                onPress={handleBuyCredits}
                style={({ pressed }) => ({
                  backgroundColor: C.gold,
                  borderRadius: RADIUS.md,
                  paddingVertical: 13,
                  alignItems: "center",
                  marginTop: 12,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                  shadowColor: C.gold,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 10,
                })}
              >
                <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: "#FFFFFF" }}>
                  Köp credits — 39 kr/st
                </Text>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>

        {/* Grace period info */}
        <Animated.View
          entering={FadeInDown.delay(260).springify()}
          style={{ paddingHorizontal: SPACING.lg, paddingTop: 14 }}
        >
          <View
            testID="grace-period-info"
            style={{
              backgroundColor: "rgba(59,130,246,0.06)",
              borderRadius: RADIUS.lg,
              padding: 16,
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 12,
              borderWidth: 1,
              borderColor: "rgba(59,130,246,0.12)",
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: "rgba(59,130,246,0.12)",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Shield size={16} color={C.info} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONTS.semiBold, fontSize: 14, color: C.info, marginBottom: 3 }}>
                5 minuters ångerfrist
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.regular,
                  fontSize: 13,
                  color: C.info,
                  lineHeight: 19,
                }}
              >
                Du kan ångra gratis inom 5 minuter efter övertagandet. Inga avgifter under ångerfristen.
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Guarantee badge */}
        <Animated.View
          entering={FadeInDown.delay(310).springify()}
          style={{ paddingHorizontal: SPACING.lg, paddingTop: 10 }}
        >
          <View
            testID="guarantee-badge"
            style={{
              backgroundColor: C.successBg,
              borderRadius: RADIUS.lg,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              borderWidth: 1,
              borderColor: C.successLight,
            }}
          >
            <Check size={16} color={C.success} strokeWidth={2.5} />
            <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: C.success, flex: 1 }}>
              Om bordet inte finns — 2 credits tillbaka
            </Text>
          </View>
        </Animated.View>

        {/* Description */}
        {r.description ? (
          <Animated.View
            entering={FadeInDown.delay(350).springify()}
            style={{ paddingHorizontal: SPACING.lg, paddingTop: 20 }}
          >
            <Text style={{ fontFamily: FONTS.displayBold, fontSize: 17, color: C.textPrimary, marginBottom: 8, letterSpacing: -0.3 }}>
              Om restaurangen
            </Text>
            <Text style={{ fontFamily: FONTS.regular, fontSize: 15, color: C.textSecondary, lineHeight: 23 }}>
              {r.description}
            </Text>
          </Animated.View>
        ) : null}

        {/* Error message with shake */}
        {claimError ? (
          <Animated.View
            entering={FadeInDown.springify()}
            style={[{ paddingHorizontal: SPACING.lg, paddingTop: 16 }, errorShakeStyle]}
          >
            <View
              testID="claim-error"
              style={{
                backgroundColor: "rgba(239,68,68,0.06)",
                borderRadius: RADIUS.md,
                padding: 14,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                borderWidth: 1,
                borderColor: "rgba(239,68,68,0.12)",
              }}
            >
              <AlertCircle size={18} color={C.error} strokeWidth={2} />
              <Text style={{ fontFamily: FONTS.medium, fontSize: 14, color: C.error, flex: 1 }}>
                {claimError}
              </Text>
            </View>
          </Animated.View>
        ) : null}
      </Animated.ScrollView>

      {/* Bottom CTA bar */}
      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: C.bgCard,
            borderTopWidth: 0.5,
            borderTopColor: C.divider,
            paddingHorizontal: SPACING.lg,
            paddingTop: 12,
            paddingBottom: Platform.OS === "ios" ? 34 : 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowRadius: 16,
            elevation: 8,
          },
          ctaShadowStyle,
        ]}
      >
        {/* Checkbox */}
        {!isClaimed ? (
          <Pressable
            testID="cancellation-checkbox"
            accessibilityLabel="Godkänn villkor för att ta över bokning"
            onPress={handleToggleAccepted}
            style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 12 }}
          >
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 7,
                borderWidth: 1.5,
                borderColor: accepted ? C.coral : "rgba(0,0,0,0.18)",
                backgroundColor: accepted ? C.coral : "transparent",
                alignItems: "center",
                justifyContent: "center",
                marginTop: 1,
              }}
            >
              {accepted ? <Check size={13} color="#FFFFFF" strokeWidth={3} /> : null}
            </View>
            <Text style={{ flex: 1, fontFamily: FONTS.regular, fontSize: 12, color: C.textSecondary, lineHeight: 17 }}>
              Jag förstår att 2 credits dras direkt, serviceavgiften (29 kr) debiteras efter 5 min ångerfrist, och att jag tar ansvar för bokningen. No-show kan medföra en avgift på 10-20%.
            </Text>
          </Pressable>
        ) : null}

        {/* CTA Button */}
        <Animated.View style={btnStyle}>
          <Pressable
            testID="claim-button"
            accessibilityLabel="Ta över bokning"
            onPress={handleClaim}
            onPressIn={() => {
              scaleBtn.value = withSpring(0.96, { damping: 15, stiffness: 300 });
            }}
            onPressOut={() => {
              scaleBtn.value = withSpring(1, { damping: 12, stiffness: 200 });
            }}
            disabled={claimMutation.isPending || isClaimed || !hasEnoughCredits}
            style={{
              backgroundColor: isClaimed
                ? C.success
                : !hasEnoughCredits
                ? C.textTertiary
                : accepted
                ? C.coral
                : "rgba(0,0,0,0.08)",
              borderRadius: RADIUS.lg,
              paddingVertical: 16,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 8,
              ...(accepted && !isClaimed && hasEnoughCredits
                ? {
                    shadowColor: C.coral,
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.35,
                    shadowRadius: 20,
                    elevation: 10,
                  }
                : {}),
            }}
          >
            {claimMutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : isClaimed ? (
              <>
                <Check size={18} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={{ fontFamily: FONTS.bold, fontSize: 16, color: "#FFFFFF" }}>
                  Bokning övertagen
                </Text>
              </>
            ) : !hasEnoughCredits ? (
              <Text style={{ fontFamily: FONTS.bold, fontSize: 16, color: "#FFFFFF" }}>
                Köp credits för att ta över
              </Text>
            ) : (
              <Text
                style={{
                  fontFamily: FONTS.bold,
                  fontSize: 17,
                  color: accepted ? "#FFFFFF" : C.textTertiary,
                }}
              >
                Ta över — 2 credits + 29 kr
              </Text>
            )}
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
}
