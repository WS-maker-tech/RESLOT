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
  Modal,
  TextInput,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import Head from "expo-router/head";
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
  Flag,
  X,
  AlertTriangle,
  ChevronRight,
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
  useReservations,
  useClaimReservation,
  useCancelClaim,
  useProfile,
  useReportReservation,
} from "@/lib/api/hooks";
import { useAuthStore } from "@/lib/auth-store";
import { parseTagsWithCount, parseTags } from "@/lib/api/types";
import { C, FONTS, SPACING, SHADOW, RADIUS } from "../../lib/theme";
import { HeroSection } from "@/components/HeroSection";
import { BookingDetails } from "@/components/BookingDetails";
import { RestaurantInfo } from "@/components/RestaurantInfo";
import { ClaimSection } from "@/components/ClaimSection";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const HERO_HEIGHT = 380;

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
    const xDrift = (Math.random() - 0.5) * 260;
    scale.value = withDelay(delay, withSpring(1, { damping: 6, stiffness: 300 }));
    translateY.value = withDelay(
      delay,
      withTiming(350 + Math.random() * 200, { duration: 2200, easing: Easing.out(Easing.cubic) })
    );
    translateX.value = withDelay(
      delay,
      withTiming(xDrift, { duration: 2200, easing: Easing.out(Easing.cubic) })
    );
    rotate.value = withDelay(
      delay,
      withTiming(720 * (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random()), { duration: 2200 })
    );
    opacity.value = withDelay(delay + 1200, withTiming(0, { duration: 900 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    position: "absolute" as const,
    top: -10,
    left: startX,
    width: 5 + Math.random() * 7,
    height: 6 + Math.random() * 8,
    borderRadius: Math.random() > 0.6 ? 2 : Math.random() > 0.3 ? 6 : 1,
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

  const confettiColors = [C.coral, C.gold, "#3B82F6", "#A855F7", "#F472B6", "#FBBF24", "#34D399", "#FB923C", "#818CF8"];
  const particles = Array.from({ length: 55 }, (_, i) => ({
    id: i,
    delay: Math.random() * 600,
    color: confettiColors[i % confettiColors.length],
    startX: SCREEN_WIDTH * 0.05 + Math.random() * SCREEN_WIDTH * 0.9,
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
      {/* Confetti burst */}
      <View style={{ position: "absolute", top: "18%", left: 0, right: 0 }}>
        {particles.map((p) => (
          <ConfettiParticle key={p.id} delay={p.delay} color={p.color} startX={p.startX} />
        ))}
      </View>

      {/* Success circle — pistachio glow */}
      <Animated.View
        entering={ZoomIn.springify().damping(8).stiffness(120)}
        style={{
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: C.coral,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: C.coral,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 30,
          elevation: 12,
        }}
      >
        <Check size={58} color="#FFFFFF" strokeWidth={3} />
      </Animated.View>

      <Animated.Text
        entering={FadeInDown.delay(180).springify()}
        style={{
          fontFamily: FONTS.displayBold,
          fontSize: 30,
          color: "#FFFFFF",
          marginTop: 26,
          letterSpacing: -0.8,
        }}
      >
        Bokning övertagen!
      </Animated.Text>

      <Animated.Text
        entering={FadeInDown.delay(240).springify()}
        style={{
          fontFamily: FONTS.bold,
          fontSize: 22,
          color: "#FFFFFF",
          marginTop: 12,
          letterSpacing: -0.4,
          textAlign: "center",
          paddingHorizontal: 32,
        }}
      >
        {restaurantName}
      </Animated.Text>

      <Animated.Text
        entering={FadeInDown.delay(300).springify()}
        style={{
          fontFamily: FONTS.medium,
          fontSize: 16,
          color: "rgba(255,255,255,0.85)",
          marginTop: 8,
          textAlign: "center",
        }}
      >
        {reservationDate} · {reservationTime}
      </Animated.Text>

      <Animated.View
        entering={FadeInDown.delay(360).springify()}
        style={{
          backgroundColor: "rgba(126,200,122,0.20)",
          borderRadius: RADIUS.full,
          paddingHorizontal: 16,
          paddingVertical: 8,
          marginTop: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        }}
      >
        <Shield size={14} color="rgba(255,255,255,0.9)" strokeWidth={2} />
        <Text
          style={{
            fontFamily: FONTS.semiBold,
            fontSize: 13,
            color: "rgba(255,255,255,0.9)",
          }}
        >
          5 min ångerfrist aktiv
        </Text>
      </Animated.View>

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
        entering={FadeInDown.springify().damping(12)}
        style={{
          backgroundColor: C.bgCard,
          borderRadius: 24,
          padding: 30,
          marginHorizontal: 20,
          alignItems: "center",
          width: SCREEN_WIDTH - 40,
          ...SHADOW.elevated,
          shadowOpacity: 0.18,
          shadowRadius: 24,
        }}
      >
        {/* Success badge — pistachio */}
        <Animated.View
          entering={ZoomIn.springify().damping(8)}
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: C.coral,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
            shadowColor: C.coral,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          <Check size={28} color="#FFFFFF" strokeWidth={3} />
        </Animated.View>

        <Text
          testID="grace-period-title"
          style={{
            fontFamily: FONTS.displayBold,
            fontSize: 24,
            color: C.textPrimary,
            textAlign: "center",
            letterSpacing: -0.6,
            marginBottom: 4,
          }}
        >
          Bokning övertagen!
        </Text>
        <Text
          style={{
            fontFamily: FONTS.medium,
            fontSize: 15,
            color: C.textSecondary,
            textAlign: "center",
            lineHeight: 21,
            marginBottom: 24,
          }}
        >
          {restaurantName} — du har 5 min att ångra
          </Text>

        {/* Countdown ring — larger, clearer */}
        <Animated.View
          testID="grace-period-countdown"
          style={[
            {
              width: 160,
              height: 160,
              borderRadius: 80,
              backgroundColor: ringBg,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
              borderWidth: 4,
              borderColor: ringBorder,
            },
            ringPulseStyle,
          ]}
        >
          <Text
            style={{
              fontFamily: FONTS.bold,
              fontSize: 44,
              color: isUrgent ? C.error : C.dark,
              letterSpacing: 2,
            }}
          >
            {timeStr}
          </Text>
          <Text
            style={{
              fontFamily: FONTS.semiBold,
              fontSize: 12,
              color: isUrgent ? C.error : C.textTertiary,
              textTransform: "uppercase",
              letterSpacing: 1.5,
              marginTop: 4,
            }}
          >
            {secondsLeft > 0 ? "Ångra utan avgift" : "Tid ute"}
          </Text>
        </Animated.View>

        {/* Progress bar — thicker */}
        <View
          style={{
            width: "100%",
            height: 6,
            backgroundColor: "rgba(0,0,0,0.06)",
            borderRadius: 3,
            marginBottom: 18,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${progress * 100}%`,
              height: "100%",
              backgroundColor: isUrgent ? C.error : C.coral,
              borderRadius: 3,
            }}
          />
        </View>

        {/* Info text — clearer */}
        <View style={{
          backgroundColor: "rgba(59,130,246,0.05)",
          borderRadius: RADIUS.md,
          padding: 14,
          marginBottom: 20,
          width: "100%",
          borderWidth: 1,
          borderColor: "rgba(59,130,246,0.10)",
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Shield size={14} color={C.info} strokeWidth={2.5} />
            <Text style={{ fontFamily: FONTS.semiBold, fontSize: 13, color: C.info }}>
              Ångra inom ångerfristen — inga avgifter
            </Text>
          </View>
          <Text
            style={{
              fontFamily: FONTS.regular,
              fontSize: 13,
              color: C.textSecondary,
              lineHeight: 19,
            }}
          >
            Du kan ångra utan kostnad innan tiden går ut. Credits och avgift återbetalas direkt. När ångerfristen löper ut ansvarar du fullt för bokningen.
          </Text>
        </View>

        {/* Done button — primary, pistachio */}
        <Pressable
          testID="grace-period-done-button"
          accessibilityLabel="Klar, gå vidare"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onDone();
          }}
          style={({ pressed }) => ({
            backgroundColor: C.coral,
            borderRadius: RADIUS.lg,
            paddingVertical: 16,
            paddingHorizontal: 24,
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
            transform: [{ scale: pressed ? 0.97 : 1 }],
            shadowColor: C.coral,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.3,
            shadowRadius: 14,
            elevation: 6,
          })}
        >
          <Text
            style={{
              fontFamily: FONTS.bold,
              fontSize: 16,
              color: C.dark,
              letterSpacing: -0.2,
            }}
          >
            Klar — gå till bokning
          </Text>
        </Pressable>

        {/* Cancel button — secondary */}
        <Pressable
          testID="cancel-claim-button"
          accessibilityLabel="Ångra övertagande"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onCancel();
          }}
          disabled={cancelPending}
          style={({ pressed }) => ({
            backgroundColor: "transparent",
            borderRadius: RADIUS.lg,
            paddingVertical: 14,
            paddingHorizontal: 24,
            width: "100%",
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
            marginTop: 8,
            transform: [{ scale: pressed ? 0.97 : 1 }],
          })}
        >
          {cancelPending ? (
            <ActivityIndicator size="small" color={C.error} />
          ) : (
            <>
              <Undo2 size={15} color={C.error} strokeWidth={2.5} />
              <Text
                style={{
                  fontFamily: FONTS.medium,
                  fontSize: 14,
                  color: C.error,
                }}
              >
                Ångra övertagande
              </Text>
            </>
          )}
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

  // Report modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState<string | null>(null);
  const [reportDetails, setReportDetails] = useState("");
  const [reportSuccess, setReportSuccess] = useState(false);
  const reportMutation = useReportReservation();

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
    const translateY = interpolate(scrollY.value, [0, 200], [0, -60], Extrapolation.CLAMP);
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

  // Fetch other reservations in same neighborhood for internal linking
  const neighborhood = reservation?.restaurant?.neighborhood;
  const { data: neighborhoodReservations } = useReservations({
    neighborhood: neighborhood ?? undefined,
  });
  const otherReservations = useMemo(() => {
    if (!neighborhoodReservations || !reservation) return [];
    return neighborhoodReservations
      .filter((res) => res.id !== reservation.id && res.status === "active")
      .slice(0, 3);
  }, [neighborhoodReservations, reservation]);

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
    const addr = encodeURIComponent(reservation.restaurant.address);
    const url = Platform.OS === "android"
      ? `https://www.google.com/maps/search/?api=1&query=${addr}`
      : `https://maps.apple.com/?q=${addr}`;
    Linking.openURL(url);
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

  const handleShare = useCallback(async () => {
    if (!reservation) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const r = reservation.restaurant;
    const date = formatReservationDate(reservation.reservationDate);
    const time = reservation.reservationTime.substring(0, 5);
    const shareText = `Kolla in ${r.name} på Reslot — ledigt bord ${date} kl ${time}!`;
    const shareUrl = Platform.OS === "web"
      ? window.location.href
      : `https://reslot.se/restaurant/${reservation.id}`;

    if (Platform.OS === "web") {
      // Försök Web Share API (mobil Chrome/Safari stöder detta)
      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          await navigator.share({
            title: `${r.name} — Reslot`,
            text: shareText,
            url: shareUrl,
          });
          return;
        } catch (_) {}
      }
      // Fallback: kopiera länk + visa toast
      try {
        await navigator.clipboard.writeText(`${shareText}
${shareUrl}`);
        // Kort visuell feedback via alert (ingen toast-lib installerad)
        alert("Länk kopierad! 🔗");
      } catch (_) {}
    } else {
      Share.share({
        message: `${shareText}
${shareUrl}`,
        url: shareUrl,
      }).catch(() => {});
    }
  }, [reservation]);

  const isClaimerAndCompleted = useMemo(() => {
    if (!reservation || !phone) return false;
    return reservation.claimerPhone === phone && reservation.status === "completed";
  }, [reservation, phone]);

  const handleOpenReport = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowReportModal(true);
    setReportReason(null);
    setReportDetails("");
    setReportSuccess(false);
  }, []);

  const handleSubmitReport = useCallback(async () => {
    if (!reservation || !reportReason) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await reportMutation.mutateAsync({
        reservationId: reservation.id,
        reason: reportReason,
        details: reportDetails.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setReportSuccess(true);
      setTimeout(() => {
        setShowReportModal(false);
        setReportSuccess(false);
      }, 2000);
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [reservation, reportReason, reportDetails, reportMutation]);

  const handleCloseReport = useCallback(() => {
    setShowReportModal(false);
  }, []);

  const REPORT_REASONS = [
    { key: "booking_not_found", label: "Bokningen finns inte" },
    { key: "wrong_details", label: "Fel detaljer" },
    { key: "restaurant_denied", label: "Restaurangen nekade" },
    { key: "fraud", label: "Bedrägeri" },
  ] as const;

  // --- Loading state (skeleton) ---
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        {/* Skeleton hero — matches new 380px height */}
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
            <Text style={{ fontFamily: FONTS.bold, fontSize: 15, color: "#111827" }}>Gå tillbaka</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // After the early return above, reservation and restaurant are guaranteed non-null
  const r = restaurant!;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Meta / screen title for SEO + web */}
      <Stack.Screen
        options={{
          title: `${r.name} — Reslot`,
          headerShown: false,
        }}
      />
      {Platform.OS === "web" ? (
        <Head>
          <title>{r.name} — Reslot</title>
          <meta property="og:type" content="website" />
          <meta property="og:title" content={`${r.name} — Ta över bordet på Reslot`} />
          <meta property="og:description" content={r.description ?? `Ledigt bord på ${r.name}. Ta över via Reslot.`} />
          <meta property="og:image" content={r.image ?? "https://reslot.se/og-image.jpg"} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={`${r.name} — Reslot`} />
          <meta name="twitter:description" content={r.description ?? `Ledigt bord på ${r.name}.`} />
          <meta name="twitter:image" content={r.image ?? "https://reslot.se/og-image.jpg"} />
        </Head>
      ) : null}

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
                width: 44,
                height: 44,
                borderRadius: 22,
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
                width: 44,
                height: 44,
                borderRadius: 22,
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
        {/* Hero Image — full-width, dramatic */}
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
          {/* Top gradient — deeper for header readability */}
          <LinearGradient
            colors={["rgba(0,0,0,0.45)", "rgba(0,0,0,0.15)", "transparent"]}
            locations={[0, 0.4, 1]}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 140,
            }}
          />
          {/* Bottom gradient — rich cinematic fade */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.06)", "rgba(0,0,0,0.55)"]}
            locations={[0.2, 0.5, 1]}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: HERO_HEIGHT * 0.65,
            }}
          />
          {/* Restaurant name overlay on hero */}
          <View
            style={{
              position: "absolute",
              bottom: 50,
              left: SPACING.lg,
              right: SPACING.lg,
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.displayBold,
                fontSize: 28,
                color: "#FFFFFF",
                letterSpacing: -0.8,
                lineHeight: 34,
                textShadowColor: "rgba(0,0,0,0.3)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
              }}
              numberOfLines={2}
            >
              {r.name}
            </Text>
          </View>
          {/* Bottom hero chips: party size + time */}
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
            <View style={{
              backgroundColor: "rgba(255,255,255,0.95)",
              borderRadius: RADIUS.sm,
              paddingHorizontal: 12,
              paddingVertical: 7,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 6,
              elevation: 3,
            }}>
              <Users size={14} color={C.dark} strokeWidth={2.2} />
              <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: C.textPrimary }}>{reservation.partySize} pers</Text>
            </View>
            <View style={{
              backgroundColor: "rgba(255,255,255,0.95)",
              borderRadius: RADIUS.sm,
              paddingHorizontal: 12,
              paddingVertical: 7,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 6,
              elevation: 3,
            }}>
              <Clock size={14} color={C.dark} strokeWidth={2.2} />
              <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: C.textPrimary }}>{displayTime}</Text>
            </View>
            <View style={{
              backgroundColor: "rgba(255,255,255,0.95)",
              borderRadius: RADIUS.sm,
              paddingHorizontal: 12,
              paddingVertical: 7,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 6,
              elevation: 3,
            }}>
              <Calendar size={14} color={C.dark} strokeWidth={2.2} />
              <Text style={{ fontFamily: FONTS.bold, fontSize: 13, color: C.textPrimary }}>{displayDate}</Text>
            </View>
          </View>
        </View>

        {/* Restaurant info */}
        <Animated.View
          entering={FadeInDown.springify().damping(16)}
          style={{ paddingHorizontal: SPACING.lg, paddingTop: 18 }}
        >
          <Text
            testID="restaurant-name"
            style={{
              fontFamily: FONTS.displayBold,
              fontSize: 24,
              color: C.textPrimary,
              letterSpacing: -0.6,
              lineHeight: 30,
            }}
            numberOfLines={2}
          >
            {r.name}
          </Text>

          {/* Rating + cuisine row */}
          <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", marginTop: 10, gap: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
              {[0, 1, 2, 3, 4].map((i) => {
                const fill = Math.min(1, Math.max(0, r.rating - i));
                return (
                  <View key={i} style={{ width: 13, height: 13 }}>
                    <Star size={13} color={C.gold} fill="transparent" strokeWidth={2} />
                    {fill > 0 && (
                      <View style={{ position: "absolute", top: 0, left: 0, width: 13 * fill, height: 13, overflow: "hidden" }}>
                        <Star size={13} color={C.gold} fill={C.gold} strokeWidth={2} />
                      </View>
                    )}
                  </View>
                );
              })}
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
              {tags.filter((tag: string) => tag && tag.trim()).map((tag: string) => (
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

          {/* Links — pill style */}
          <View style={{ flexDirection: "row", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            {r.website ? (
              <Pressable
                testID="website-link"
                accessibilityLabel="Besök hemsida"
                onPress={handleOpenWebsite}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  backgroundColor: "rgba(0,0,0,0.04)",
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Globe size={13} color={C.textSecondary} strokeWidth={2} />
                <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: C.textSecondary }}>
                  {r.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                </Text>
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
                  backgroundColor: "rgba(0,0,0,0.04)",
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Instagram size={13} color={C.textSecondary} strokeWidth={2} />
                <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: C.textSecondary }}>{r.instagram?.startsWith("@") ? r.instagram : `@${r.instagram}`}</Text>
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

        {/* Seller info */}
        {reservation.submitterFirstName ? (
          <Animated.View entering={FadeInDown.delay(180).springify()} style={{ paddingHorizontal: SPACING.lg, paddingTop: 24 }}>
            <View style={{
              backgroundColor: C.bgCard,
              borderRadius: RADIUS.lg,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              borderWidth: 0.5,
              borderColor: C.borderLight,
              ...SHADOW.card,
            }}>
              <View style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: "rgba(126,200,122,0.15)",
                alignItems: "center", justifyContent: "center",
              }}>
                <Text style={{ fontFamily: FONTS.bold, fontSize: 17, color: C.pistachio }}>
                  {reservation.submitterFirstName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONTS.semiBold, fontSize: 14, color: C.textPrimary, letterSpacing: -0.2 }}>
                  {reservation.submitterFirstName} {reservation.submitterLastName ? reservation.submitterLastName.charAt(0) + "." : ""} delar detta bord
                </Text>
                <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textSecondary, marginTop: 2 }}>
                  Verifierad användare
                </Text>
              </View>
              <View style={{
                width: 24, height: 24, borderRadius: 12,
                backgroundColor: C.successBg,
                alignItems: "center", justifyContent: "center",
                borderWidth: 1, borderColor: C.successLight,
              }}>
                <Check size={12} color={C.success} strokeWidth={3} />
              </View>
            </View>
          </Animated.View>
        ) : null}

        {/* Cost breakdown — IMPOSSIBLE TO MISS */}
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          style={{ paddingHorizontal: SPACING.lg, paddingTop: 24 }}
        >
          <View
            testID="cost-breakdown"
            style={{
              backgroundColor: C.bgCard,
              borderRadius: RADIUS.xl,
              padding: 24,
              borderWidth: 1.5,
              borderColor: "rgba(201,169,110,0.25)",
              ...SHADOW.elevated,
            }}
          >
            {/* Header */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  backgroundColor: "rgba(201,169,110,0.12)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CreditCard size={18} color={C.gold} strokeWidth={2} />
              </View>
              <View>
                <Text style={{ fontFamily: FONTS.displayBold, fontSize: 18, color: C.textPrimary, letterSpacing: -0.3 }}>
                  Kostnad
                </Text>
                <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textTertiary, marginTop: 1 }}>
                  Dras vid övertagande
                </Text>
              </View>
            </View>

            {/* Credits row — highlighted */}
            <View style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "rgba(201,169,110,0.06)",
              borderRadius: RADIUS.md,
              paddingVertical: 14,
              paddingHorizontal: 16,
              marginBottom: 8,
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Sparkles size={16} color={C.gold} strokeWidth={2} />
                <Text style={{ fontFamily: FONTS.semiBold, fontSize: 16, color: C.textPrimary }}>Bokning</Text>
              </View>
              <Text style={{ fontFamily: FONTS.bold, fontSize: 18, color: C.gold }}>2 credits</Text>
            </View>

            {/* Service fee row — highlighted */}
            <View style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "rgba(0,0,0,0.025)",
              borderRadius: RADIUS.md,
              paddingVertical: 14,
              paddingHorizontal: 16,
              marginBottom: 16,
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <CreditCard size={16} color={C.textSecondary} strokeWidth={2} />
                <Text style={{ fontFamily: FONTS.semiBold, fontSize: 16, color: C.textPrimary }}>Serviceavgift</Text>
              </View>
              <Text style={{ fontFamily: FONTS.bold, fontSize: 18, color: C.textPrimary }}>29 kr</Text>
            </View>

            {/* Total — big and bold */}
            <View style={{
              backgroundColor: C.dark,
              borderRadius: RADIUS.lg,
              paddingVertical: 16,
              paddingHorizontal: 18,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 14,
            }}>
              <Text style={{ fontFamily: FONTS.bold, fontSize: 16, color: "rgba(255,255,255,0.7)" }}>Totalt</Text>
              <Text style={{ fontFamily: FONTS.bold, fontSize: 20, color: "#FFFFFF", letterSpacing: -0.3 }}>2 credits + 29 kr</Text>
            </View>

            {/* Balance */}
            <View
              style={{
                backgroundColor: hasEnoughCredits ? "rgba(126,200,122,0.08)" : "rgba(239,68,68,0.06)",
                borderRadius: RADIUS.md,
                paddingVertical: 12,
                paddingHorizontal: 16,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                borderWidth: 1,
                borderColor: hasEnoughCredits ? "rgba(126,200,122,0.15)" : "rgba(239,68,68,0.12)",
              }}
            >
              <Text style={{ fontFamily: FONTS.medium, fontSize: 14, color: C.textSecondary }}>Ditt saldo</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <Sparkles size={13} color={hasEnoughCredits ? C.coral : C.error} strokeWidth={2} />
                <Text
                  testID="user-credits-balance"
                  style={{
                    fontFamily: FONTS.bold,
                    fontSize: 16,
                    color: hasEnoughCredits ? C.coral : C.error,
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
                  borderRadius: RADIUS.lg,
                  paddingVertical: 15,
                  alignItems: "center",
                  marginTop: 14,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                  shadowColor: C.gold,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.3,
                  shadowRadius: 14,
                  elevation: 6,
                })}
              >
                <Text style={{ fontFamily: FONTS.bold, fontSize: 15, color: "#FFFFFF" }}>
                  Köp credits — 39 kr/st
                </Text>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>

        {/* Grace period info — prominent */}
        <Animated.View
          entering={FadeInDown.delay(260).springify()}
          style={{ paddingHorizontal: SPACING.lg, paddingTop: 14 }}
        >
          <View
            testID="grace-period-info"
            style={{
              backgroundColor: "rgba(126,200,122,0.06)",
              borderRadius: RADIUS.xl,
              padding: 18,
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 14,
              borderWidth: 1.5,
              borderColor: "rgba(126,200,122,0.18)",
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: "rgba(126,200,122,0.15)",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Shield size={18} color={C.coral} strokeWidth={2.2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONTS.bold, fontSize: 15, color: C.dark, marginBottom: 4 }}>
                5 minuters ångerfrist
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.regular,
                  fontSize: 13,
                  color: C.textSecondary,
                  lineHeight: 19,
                }}
              >
                Du har 5 minuter att ångra dig — helt kostnadsfritt. Inga frågor.
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Guarantee badge — pistachio accent */}
        <Animated.View
          entering={FadeInDown.delay(310).springify()}
          style={{ paddingHorizontal: SPACING.lg, paddingTop: 10 }}
        >
          <View
            testID="guarantee-badge"
            style={{
              backgroundColor: "rgba(126,200,122,0.06)",
              borderRadius: RADIUS.lg,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              borderWidth: 1,
              borderColor: "rgba(126,200,122,0.15)",
            }}
          >
            <View style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              backgroundColor: "rgba(126,200,122,0.15)",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Check size={14} color={C.coral} strokeWidth={3} />
            </View>
            <Text style={{ fontFamily: FONTS.semiBold, fontSize: 13, color: C.dark, flex: 1 }}>
              Reslot-garanti: fungerar inte överlåtelsen? Credits tillbaka.
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

        {/* Liability transfer — trust builder */}
        {!isClaimed ? (
          <Animated.View
            entering={FadeInDown.delay(370).springify()}
            style={{ paddingHorizontal: SPACING.lg, paddingTop: 16 }}
          >
            <View
              testID="liability-transfer-card"
              style={{
                backgroundColor: "rgba(245,158,11,0.04)",
                borderRadius: RADIUS.xl,
                padding: 20,
                borderWidth: 1.5,
                borderColor: "rgba(245,158,11,0.15)",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: "rgba(245,158,11,0.12)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Shield size={18} color={C.warning} strokeWidth={2.2} />
                </View>
                <Text style={{ fontFamily: FONTS.displayBold, fontSize: 16, color: C.dark, letterSpacing: -0.3 }}>
                  Ansvarsövergång
                </Text>
              </View>

              {/* Visual transfer: original booker → you */}
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                backgroundColor: "rgba(0,0,0,0.025)",
                borderRadius: RADIUS.lg,
                paddingVertical: 16,
                paddingHorizontal: 14,
                marginBottom: 14,
              }}>
                {/* Original booker */}
                <View style={{ alignItems: "center", flex: 1 }}>
                  <View style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: "rgba(156,163,175,0.12)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 6,
                  }}>
                    <Users size={20} color={C.textTertiary} strokeWidth={2} />
                  </View>
                  <Text style={{ fontFamily: FONTS.semiBold, fontSize: 12, color: C.textTertiary }}>
                    Originalbokare
                  </Text>
                </View>

                {/* Arrow */}
                <View style={{ alignItems: "center", paddingBottom: 18 }}>
                  <View style={{
                    width: 40,
                    height: 2,
                    backgroundColor: C.warning,
                    borderRadius: 1,
                  }} />
                  <View style={{
                    position: "absolute",
                    right: -2,
                    top: -4,
                    width: 0,
                    height: 0,
                    borderTopWidth: 5,
                    borderBottomWidth: 5,
                    borderLeftWidth: 8,
                    borderTopColor: "transparent",
                    borderBottomColor: "transparent",
                    borderLeftColor: C.warning,
                  }} />
                </View>

                {/* You */}
                <View style={{ alignItems: "center", flex: 1 }}>
                  <View style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: "rgba(126,200,122,0.15)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 6,
                    borderWidth: 2,
                    borderColor: "rgba(126,200,122,0.3)",
                  }}>
                    <Users size={20} color={C.coral} strokeWidth={2} />
                  </View>
                  <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: C.coral }}>
                    Du
                  </Text>
                </View>
              </View>

              <Text style={{
                fontFamily: FONTS.regular,
                fontSize: 13,
                color: C.textSecondary,
                lineHeight: 20,
              }}>
                När du tar över bokningen övergår ansvaret för eventuella avbokningsavgifter till dig efter 5 minuters ångerfrist. Under ångerfristen kan du ångra kostnadsfritt.
              </Text>
            </View>
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

        {/* Report button — only for claimer on completed reservations */}
        {isClaimerAndCompleted ? (
          <Animated.View
            entering={FadeInDown.delay(400).springify()}
            style={{ paddingHorizontal: SPACING.lg, paddingTop: 20, paddingBottom: 8, alignItems: "center" }}
          >
            <Pressable
              testID="report-problem-button"
              accessibilityLabel="Rapportera problem med bokningen"
              onPress={handleOpenReport}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingVertical: 12,
                paddingHorizontal: 16,
                minHeight: 44,
                opacity: pressed ? 0.5 : 1,
              })}
            >
              <Flag size={15} color={C.textTertiary} strokeWidth={2} />
              <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: C.textTertiary }}>
                Rapportera problem
              </Text>
            </Pressable>
          </Animated.View>
        ) : null}

        {/* Internal linking — other reservations in same neighborhood */}
        {otherReservations.length > 0 && neighborhood ? (
          <Animated.View
            entering={FadeInDown.delay(420).springify()}
            style={{ paddingHorizontal: SPACING.lg, paddingTop: 28, paddingBottom: 24 }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <Text style={{ fontFamily: FONTS.displayBold, fontSize: 17, color: C.textPrimary, letterSpacing: -0.3 }}>
                Andra bord i {neighborhood}
              </Text>
              <ChevronRight size={18} color={C.textTertiary} strokeWidth={2} />
            </View>
            {otherReservations.map((res) => (
              <Pressable
                key={res.id}
                testID={`neighborhood-reservation-${res.id}`}
                accessibilityLabel={`Visa ${res.restaurant.name}`}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/restaurant/${res.id}`);
                }}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingVertical: 10,
                  opacity: pressed ? 0.7 : 1,
                  borderBottomWidth: 0.5,
                  borderBottomColor: C.divider,
                })}
              >
                <Image
                  source={{ uri: res.restaurant.image }}
                  style={{ width: 48, height: 48, borderRadius: RADIUS.md }}
                  contentFit="cover"
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONTS.semiBold, fontSize: 14, color: C.textPrimary, letterSpacing: -0.2 }} numberOfLines={1}>
                    {res.restaurant.name}
                  </Text>
                  <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textSecondary, marginTop: 2 }}>
                    {formatReservationDate(res.reservationDate)} kl {res.reservationTime.substring(0, 5)} · {res.partySize} pers
                  </Text>
                </View>
                <ChevronRight size={16} color={C.textTertiary} strokeWidth={2} />
              </Pressable>
            ))}
          </Animated.View>
        ) : null}
      </Animated.ScrollView>

      {/* Report Modal */}
      <Modal
        visible={showReportModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseReport}
      >
        <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: C.bg }}>
          {/* Modal header */}
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: SPACING.lg,
            paddingVertical: 14,
            borderBottomWidth: 0.5,
            borderBottomColor: C.divider,
          }}>
            <Text style={{ fontFamily: FONTS.displayBold, fontSize: 18, color: C.textPrimary, letterSpacing: -0.3 }}>
              Rapportera problem
            </Text>
            <Pressable
              testID="report-modal-close"
              accessibilityLabel="Stäng"
              onPress={handleCloseReport}
              style={({ pressed }) => ({
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "rgba(0,0,0,0.04)",
                alignItems: "center",
                justifyContent: "center",
                transform: [{ scale: pressed ? 0.93 : 1 }],
              })}
            >
              <X size={20} color={C.textSecondary} strokeWidth={2} />
            </Pressable>
          </View>

          {reportSuccess ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
              <View style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: C.coralLight,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}>
                <Check size={36} color={C.coral} strokeWidth={2.5} />
              </View>
              <Text style={{ fontFamily: FONTS.displayBold, fontSize: 20, color: C.textPrimary, textAlign: "center", letterSpacing: -0.4 }}>
                Tack för din rapport
              </Text>
              <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textTertiary, marginTop: 8, textAlign: "center", lineHeight: 20 }}>
                Vi granskar ärendet och återkommer vid behov.
              </Text>
            </View>
          ) : (
            <View style={{ flex: 1, paddingHorizontal: SPACING.lg, paddingTop: 20 }}>
              {/* Reason selection */}
              <Text style={{ fontFamily: FONTS.semiBold, fontSize: 14, color: C.textSecondary, marginBottom: 12 }}>
                Vad gick fel?
              </Text>
              {REPORT_REASONS.map((r) => (
                <Pressable
                  key={r.key}
                  testID={`report-reason-${r.key}`}
                  accessibilityLabel={r.label}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setReportReason(r.key);
                  }}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    backgroundColor: reportReason === r.key ? C.coralLight : C.bgCard,
                    borderRadius: RADIUS.md,
                    paddingVertical: 16,
                    paddingHorizontal: 16,
                    marginBottom: 8,
                    borderWidth: 1.5,
                    borderColor: reportReason === r.key ? C.coral : C.borderLight,
                    minHeight: 44,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  })}
                >
                  <AlertTriangle
                    size={18}
                    color={reportReason === r.key ? C.coral : C.textTertiary}
                    strokeWidth={2}
                  />
                  <Text style={{
                    fontFamily: reportReason === r.key ? FONTS.semiBold : FONTS.medium,
                    fontSize: 15,
                    color: reportReason === r.key ? C.textPrimary : C.textSecondary,
                    flex: 1,
                  }}>
                    {r.label}
                  </Text>
                  {reportReason === r.key ? (
                    <View style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: C.coral,
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <Check size={13} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  ) : null}
                </Pressable>
              ))}

              {/* Details input — shows after selecting reason */}
              {reportReason ? (
                <View style={{ marginTop: 16 }}>
                  <Text style={{ fontFamily: FONTS.semiBold, fontSize: 14, color: C.textSecondary, marginBottom: 8 }}>
                    Beskriv problemet (valfritt)
                  </Text>
                  <TextInput
                    testID="report-details-input"
                    value={reportDetails}
                    onChangeText={setReportDetails}
                    placeholder="T.ex. restaurangen sa att bokningen inte fanns..."
                    placeholderTextColor={C.textTertiary}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    style={{
                      backgroundColor: C.bgInput,
                      borderRadius: RADIUS.md,
                      padding: 14,
                      fontFamily: FONTS.regular,
                      fontSize: 14,
                      color: C.textPrimary,
                      minHeight: 100,
                      lineHeight: 20,
                    }}
                  />

                  {/* Submit button */}
                  <Pressable
                    testID="report-submit-button"
                    accessibilityLabel="Skicka rapport"
                    onPress={handleSubmitReport}
                    disabled={reportMutation.isPending}
                    style={({ pressed }) => ({
                      backgroundColor: C.coral,
                      borderRadius: RADIUS.lg,
                      paddingVertical: 16,
                      alignItems: "center",
                      justifyContent: "center",
                      marginTop: 20,
                      minHeight: 52,
                      opacity: reportMutation.isPending ? 0.7 : 1,
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                      shadowColor: C.coral,
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.25,
                      shadowRadius: 14,
                      elevation: 6,
                    })}
                  >
                    {reportMutation.isPending ? (
                      <ActivityIndicator size="small" color={C.dark} />
                    ) : (
                      <Text style={{ fontFamily: FONTS.bold, fontSize: 16, color: C.dark }}>
                        Skicka rapport
                      </Text>
                    )}
                  </Pressable>

                  {/* Error message */}
                  {reportMutation.isError ? (
                    <View style={{
                      backgroundColor: "rgba(239,68,68,0.06)",
                      borderRadius: RADIUS.md,
                      padding: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 12,
                      borderWidth: 1,
                      borderColor: "rgba(239,68,68,0.12)",
                    }}>
                      <AlertCircle size={16} color={C.error} strokeWidth={2} />
                      <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: C.error, flex: 1 }}>
                        Något gick fel. Försök igen.
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </View>
          )}
        </SafeAreaView>
      </Modal>

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
              Jag tar över ansvaret för denna bokning efter ångerfristen på 5 min. Credits dras direkt. Serviceavgift (29 kr) efter ångerfristen. No-show kan medföra avgift.
            </Text>
          </Pressable>
        ) : null}

        {/* CTA Button — premium pistachio + black text */}
        <Animated.View style={btnStyle}>
          <Pressable
            testID="claim-button"
            accessibilityLabel="Ta bordet"
            onPress={handleClaim}
            onPressIn={() => {
              scaleBtn.value = withSpring(0.97, { damping: 14, stiffness: 280 });
            }}
            onPressOut={() => {
              scaleBtn.value = withSpring(1, { damping: 10, stiffness: 180 });
            }}
            disabled={claimMutation.isPending || isClaimed || !hasEnoughCredits}
            style={{
              backgroundColor: isClaimed
                ? C.coral
                : !hasEnoughCredits
                ? C.textTertiary
                : accepted
                ? C.coral
                : "rgba(0,0,0,0.06)",
              borderRadius: RADIUS.lg,
              paddingVertical: 18,
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "row",
              gap: 10,
              ...(accepted && !isClaimed && hasEnoughCredits
                ? {
                    shadowColor: C.coral,
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.4,
                    shadowRadius: 24,
                    elevation: 12,
                  }
                : {}),
              ...(isClaimed
                ? {
                    shadowColor: C.coral,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.25,
                    shadowRadius: 16,
                    elevation: 8,
                  }
                : {}),
            }}
          >
            {claimMutation.isPending ? (
              <ActivityIndicator size="small" color={C.dark} />
            ) : isClaimed ? (
              <>
                <Check size={20} color={C.dark} strokeWidth={2.5} />
                <Text style={{ fontFamily: FONTS.bold, fontSize: 17, color: C.dark, letterSpacing: -0.2 }}>
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
                  color: accepted ? C.dark : C.textTertiary,
                  letterSpacing: -0.2,
                }}
              >
                Ta över bokning — 2 credits + 29 kr
              </Text>
            )}
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
}
