import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft,
  Calendar,
  Clock,
  Users,
  User,
  CheckCircle,
  AlertCircle,
  PartyPopper,
  Undo2,
  Timer,
  MapPin,
  Share2,
  CalendarPlus,
  QrCode,
  Copy,
  ShieldCheck,
  Coins,
} from "lucide-react-native";
import Animated, {
  FadeInDown,
  FadeIn,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useReservation, useCancelClaim } from "@/lib/api/hooks";
import { useAuthStore } from "@/lib/auth-store";
import { C, FONTS, SPACING, SHADOW, RADIUS, ICON } from "../lib/theme";
import { Doodle, Scribble } from "../reslot-art";

const GRACE_PERIOD_SECONDS = 5 * 60; // 5 minutes

const MONTHS_SV = [
  "januari", "februari", "mars", "april", "maj", "juni",
  "juli", "augusti", "september", "oktober", "november", "december",
];
const DAYS_SV = ["Söndag", "Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag"];

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${DAYS_SV[d.getDay()]} ${d.getDate()} ${MONTHS_SV[d.getMonth()]}`;
  } catch {
    return dateStr;
  }
}

function formatTime(timeStr: string): string {
  try {
    return timeStr.substring(0, 5);
  } catch {
    return timeStr;
  }
}

function CountdownTimer({
  endsAt,
  onExpired,
}: {
  endsAt: Date;
  onExpired: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    const diff = Math.max(0, Math.floor((endsAt.getTime() - Date.now()) / 1000));
    return diff;
  });

  const pulseScale = useSharedValue(1);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 600, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
      ),
      -1,
      false
    );
  }, [pulseScale]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Math.max(0, Math.floor((endsAt.getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
      if (diff <= 0) {
        clearInterval(interval);
        onExpired();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [endsAt, onExpired]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = secondsLeft / GRACE_PERIOD_SECONDS;

  return (
    <Animated.View style={pulseStyle}>
      <View
        testID="countdown-timer"
        style={{
          alignItems: "center",
          backgroundColor: C.pistachioLight,
          borderRadius: RADIUS.xl,
          padding: SPACING.lg,
          borderWidth: 1,
          borderColor: C.pistachioPressed,
        }}
      >
        <Timer size={24} color={C.pistachio} strokeWidth={2} />
        <Text
          style={{
            fontFamily: FONTS.bold,
            fontSize: 14,
            color: C.pistachio,
            marginTop: SPACING.sm,
            letterSpacing: 0.3,
            textTransform: "uppercase",
          }}
        >
          Ångerfrist
        </Text>
        <Text
          testID="countdown-value"
          style={{
            fontFamily: FONTS.bold,
            fontSize: 42,
            color: C.pistachio,
            marginTop: SPACING.xs,
            letterSpacing: -1,
          }}
        >
          {minutes}:{seconds.toString().padStart(2, "0")}
        </Text>
        {/* Progress bar */}
        <View
          style={{
            width: "100%",
            height: 4,
            backgroundColor: C.pistachioLight,
            borderRadius: 2,
            marginTop: SPACING.md,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${progress * 100}%`,
              height: "100%",
              backgroundColor: C.pistachio,
              borderRadius: 2,
            }}
          />
        </View>
        <Text
          style={{
            fontFamily: FONTS.regular,
            fontSize: 13,
            color: C.textSecondary,
            marginTop: SPACING.sm,
            textAlign: "center",
            lineHeight: 19,
          }}
        >
          Du kan ångra övertagandet utan kostnad under ångerfristen.
        </Text>
      </View>
    </Animated.View>
  );
}

function CelebrationView() {
  // Start på 0.85, inte 0 (Emil: nothing appears from scale(0))
  // Damping 12, inte 8 — gentler, mer professional celebration
  const bounceScale = useSharedValue(0.85);
  const ringPulse = useSharedValue(1);

  useEffect(() => {
    bounceScale.value = withSpring(1, { damping: 12, stiffness: 140 });
    setTimeout(() => {
      ringPulse.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: 800, easing: Easing.out(Easing.cubic) }),
          withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) })
        ),
        -1,
        true
      );
    }, 400);
  }, [bounceScale, ringPulse]);

  const celebrationStyle = useAnimatedStyle(() => ({
    transform: [{ scale: bounceScale.value }],
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringPulse.value }],
  }));

  return (
    <Animated.View
      entering={FadeIn.duration(400)}
      style={{
        alignItems: "center",
        backgroundColor: C.successLight,
        borderRadius: RADIUS.xl,
        padding: SPACING.xl,
        borderWidth: 1,
        borderColor: C.successLight,
      }}
    >
      <Animated.View style={pulseStyle}>
        <Animated.View style={celebrationStyle}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: C.success,
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <PartyPopper size={36} color={C.white} strokeWidth={2} />
            {/* B&B-krydda — terracotta spark som accent på celebration-ringen */}
            <Scribble
              name="spark"
              color={C.coral}
              width={28}
              style={{ position: "absolute", top: -14, right: -14 }}
            />
          </View>
        </Animated.View>
      </Animated.View>
      <Text
        testID="confirmed-text"
        style={{
          fontFamily: FONTS.displayBold,
          fontSize: 24,
          color: C.success,
          marginTop: SPACING.md,
          letterSpacing: -0.5,
        }}
      >
        Bokningen är din!
      </Text>
      <Text
        style={{
          fontFamily: FONTS.regular,
          fontSize: 14,
          color: C.textSecondary,
          marginTop: SPACING.sm,
          textAlign: "center",
          lineHeight: 21,
        }}
      >
        Övertagandet är bekräftat. Vi ses på restaurangen!
      </Text>
    </Animated.View>
  );
}

export default function BookingConfirmationScreen() {
  const { reservationId } = useLocalSearchParams<{ reservationId: string }>();
  const router = useRouter();
  const phone = useAuthStore((s) => s.phoneNumber);

  const { data: reservation, isLoading, error } = useReservation(reservationId ?? "");
  const cancelClaimMutation = useCancelClaim();

  const [graceExpired, setGraceExpired] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  const graceEndsAt = useRef<Date>(
    reservation?.gracePeriodEndsAt
      ? new Date(reservation.gracePeriodEndsAt)
      : new Date(Date.now() + GRACE_PERIOD_SECONDS * 1000)
  );

  // Update graceEndsAt when reservation loads
  useEffect(() => {
    if (reservation?.gracePeriodEndsAt) {
      graceEndsAt.current = new Date(reservation.gracePeriodEndsAt);
      // Check if already expired
      if (graceEndsAt.current.getTime() <= Date.now()) {
        setGraceExpired(true);
      }
    }
  }, [reservation?.gracePeriodEndsAt]);

  // Check if reservation is already past grace period on load
  useEffect(() => {
    if (reservation?.status === "claimed") {
      setGraceExpired(true);
    }
  }, [reservation?.status]);

  const handleGraceExpired = useCallback(() => {
    setGraceExpired(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleCancelClaim = useCallback(async () => {
    if (!reservation) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await cancelClaimMutation.mutateAsync(reservation.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCancelSuccess(true);
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [reservation, cancelClaimMutation, router]);

  const handleGoBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator testID="loading-indicator" size="large" color={C.pistachio} />
      </View>
    );
  }

  if (error || !reservation) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <SafeAreaView edges={["top"]} style={{ backgroundColor: C.bg }}>
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
            <Pressable
              testID="back-button"
              accessibilityLabel="Gå tillbaka"
              onPress={handleGoBack}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.04)", alignItems: "center", justifyContent: "center", marginRight: 12 }}
            >
              <ChevronLeft size={20} color={C.textSecondary} strokeWidth={2} />
            </Pressable>
          </View>
        </SafeAreaView>
        <View testID="error-state" style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <AlertCircle size={40} color={C.pistachio} strokeWidth={ICON.strokeWidth} />
          <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: C.textPrimary, marginTop: 12 }}>
            Kunde inte ladda bokningen
          </Text>
        </View>
      </View>
    );
  }

  const restaurant = reservation.restaurant;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: C.bg }}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
          <Pressable
            testID="back-button"
            accessibilityLabel="Gå tillbaka"
            onPress={handleGoBack}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.04)", alignItems: "center", justifyContent: "center" }}
          >
            <ChevronLeft size={20} color={C.textSecondary} strokeWidth={2} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView
        testID="confirmation-scroll"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80 }}
      >
        {/* Success header */}
        <Animated.View entering={FadeInDown.duration(180)} style={{ paddingTop: 16, paddingBottom: 24 }}>
          {cancelSuccess ? (
            <View style={{ alignItems: "center", padding: SPACING.lg }}>
              <CheckCircle size={40} color={C.success} strokeWidth={ICON.strokeWidth} />
              <Text style={{ fontFamily: FONTS.displayBold, fontSize: 20, color: C.success, marginTop: 12 }}>
                Övertagandet har ångrats
              </Text>
              <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textSecondary, marginTop: 8, textAlign: "center" }}>
                Dina credits har återförts.
              </Text>
            </View>
          ) : null}
        </Animated.View>

        {/* Restaurant info card */}
        {!cancelSuccess ? (
          <>
            <Animated.View entering={FadeInDown.delay(40).duration(180)}>
              <View
                testID="restaurant-card"
                style={{
                  backgroundColor: C.bgCard,
                  borderRadius: RADIUS.xl,
                  borderWidth: 0.5,
                  borderColor: C.borderLight,
                  padding: SPACING.lg,
                  ...SHADOW.card,
                }}
              >
                <Text
                  testID="restaurant-name"
                  style={{
                    fontFamily: FONTS.displayBold,
                    fontSize: 22,
                    color: C.textPrimary,
                    letterSpacing: -0.4,
                    marginBottom: SPACING.md,
                  }}
                >
                  {restaurant.name}
                </Text>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <MapPin size={16} color={C.textTertiary} strokeWidth={2} />
                  <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textSecondary, flex: 1 }}>
                    {restaurant.address}
                  </Text>
                </View>

                <View style={{ height: 0.5, backgroundColor: C.divider, marginVertical: 12 }} />

                {/* Booking details grid */}
                <View style={{ gap: 14 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: C.pistachioLight, alignItems: "center", justifyContent: "center" }}>
                      <Calendar size={18} color={C.pistachio} strokeWidth={2} />
                    </View>
                    <View>
                      <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textTertiary }}>Datum</Text>
                      <Text testID="booking-date" style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: C.textPrimary }}>
                        {formatDate(reservation.reservationDate)}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: C.pistachioLight, alignItems: "center", justifyContent: "center" }}>
                      <Clock size={18} color={C.pistachio} strokeWidth={2} />
                    </View>
                    <View>
                      <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textTertiary }}>Tid</Text>
                      <Text testID="booking-time" style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: C.textPrimary }}>
                        {formatTime(reservation.reservationTime)}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: C.pistachioLight, alignItems: "center", justifyContent: "center" }}>
                      <Users size={18} color={C.pistachio} strokeWidth={2} />
                    </View>
                    <View>
                      <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textTertiary }}>Antal gäster</Text>
                      <Text testID="booking-party-size" style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: C.textPrimary }}>
                        {reservation.partySize} {reservation.partySize === 1 ? "gäst" : "gäster"}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: C.pistachioLight, alignItems: "center", justifyContent: "center" }}>
                      <User size={18} color={C.pistachio} strokeWidth={2} />
                    </View>
                    <View>
                      <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textTertiary }}>Bokningsnamn</Text>
                      <Text testID="booking-name" style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: C.textPrimary }}>
                        {reservation.nameOnReservation}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* Cost breakdown */}
            <Animated.View entering={FadeInDown.delay(100).duration(180)} style={{ marginTop: SPACING.lg }}>
              <View
                testID="cost-breakdown-card"
                style={{
                  backgroundColor: C.bgCard,
                  borderRadius: RADIUS.xl,
                  borderWidth: 0.5,
                  borderColor: C.borderLight,
                  padding: SPACING.lg,
                  ...SHADOW.card,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: "rgba(201,169,110,0.10)", alignItems: "center", justifyContent: "center" }}>
                      <Coins size={16} color={C.gold} strokeWidth={2} />
                    </View>
                    <Text style={{ fontFamily: FONTS.regular, fontSize: 15, color: C.textPrimary }}>2 credits</Text>
                  </View>
                  <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: C.textPrimary }}>2 st</Text>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <Text style={{ fontFamily: FONTS.regular, fontSize: 15, color: C.textSecondary, paddingLeft: 42 }}>Serviceavgift</Text>
                  <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: C.textPrimary }}>29 kr</Text>
                </View>

                <View style={{ height: 0.5, backgroundColor: C.divider, marginBottom: 12 }} />

                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text style={{ fontFamily: FONTS.bold, fontSize: 16, color: C.textPrimary, paddingLeft: 42 }}>Totalt</Text>
                  <Text style={{ fontFamily: FONTS.bold, fontSize: 16, color: C.textPrimary }}>2 credits + 29 kr</Text>
                </View>
              </View>
            </Animated.View>

            {/* Ångerfrist notice */}
            <Animated.View entering={FadeInDown.delay(160).duration(180)} style={{ marginTop: SPACING.md }}>
              <Text
                testID="angerfrist-notice"
                style={{
                  fontFamily: FONTS.regular,
                  fontSize: 13,
                  color: C.textTertiary,
                  textAlign: "center",
                  lineHeight: 19,
                }}
              >
                5 minuter att ångra — inga frågor
              </Text>
            </Animated.View>

            {/* Reslot-garanti badge */}
            <Animated.View entering={FadeInDown.delay(220).duration(180)} style={{ marginTop: SPACING.md }}>
              <View
                testID="reslot-garanti-badge"
                style={{
                  backgroundColor: C.pistachioLight,
                  borderRadius: RADIUS.lg,
                  paddingVertical: 12,
                  paddingHorizontal: SPACING.md,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <ShieldCheck size={18} color={C.pistachio} strokeWidth={2} />
                <Text style={{ fontFamily: FONTS.semiBold, fontSize: 13, color: C.textSecondary, flex: 1, lineHeight: 19 }}>
                  Fungerar inte överlåtelsen? Credits tillbaka.
                </Text>
              </View>
            </Animated.View>

            {/* Grace period / celebration */}
            <Animated.View entering={FadeInDown.delay(280).duration(180)} style={{ marginTop: SPACING.lg }}>
              {graceExpired ? (
                <CelebrationView />
              ) : (
                <CountdownTimer
                  endsAt={graceEndsAt.current}
                  onExpired={handleGraceExpired}
                />
              )}
            </Animated.View>

            {/* Action buttons - shown after grace period */}
            {graceExpired && !cancelSuccess ? (
              <Animated.View entering={FadeInDown.delay(360).duration(180)} style={{ marginTop: SPACING.lg, gap: 10 }}>
                {/* Reference number */}
                <View
                  style={{
                    backgroundColor: C.bgCard,
                    borderRadius: RADIUS.lg,
                    borderWidth: 0.5,
                    borderColor: C.borderLight,
                    padding: SPACING.md,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    ...SHADOW.card,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: "rgba(201,169,110,0.10)", alignItems: "center", justifyContent: "center" }}>
                      <QrCode size={18} color={C.gold} strokeWidth={2} />
                    </View>
                    <View>
                      <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textTertiary }}>Referensnummer</Text>
                      <Text testID="reference-number" style={{ fontFamily: FONTS.bold, fontSize: 16, color: C.textPrimary, letterSpacing: 1 }}>
                        {reservation.id.substring(0, 8).toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    testID="copy-reference-btn"
                    accessibilityLabel="Kopiera referensnummer"
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={{ width: 38, height: 38, borderRadius: 11, backgroundColor: C.pistachioLight, alignItems: "center", justifyContent: "center" }}
                  >
                    <Copy size={16} color={C.pistachio} strokeWidth={2} />
                  </Pressable>
                </View>

                {/* Calendar + Share buttons */}
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <Pressable
                    testID="add-to-calendar-btn"
                    accessibilityLabel="Lägg till i kalender"
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: C.bgCard,
                      borderRadius: RADIUS.lg,
                      borderWidth: 0.5,
                      borderColor: C.borderLight,
                      paddingVertical: 14,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      ...SHADOW.card,
                    }}
                  >
                    <CalendarPlus size={18} color={C.pistachio} strokeWidth={2} />
                    <Text style={{ fontFamily: FONTS.semiBold, fontSize: 14, color: C.textPrimary }}>
                      Kalender
                    </Text>
                  </Pressable>
                  <Pressable
                    testID="share-booking-btn"
                    accessibilityLabel="Dela med vänner"
                    onPress={async () => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      try {
                        await Share.share({
                          message: `Jag har bokat bord på ${restaurant.name} den ${formatDate(reservation.reservationDate)} kl ${formatTime(reservation.reservationTime)}!`,
                        });
                      } catch {}
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: C.pistachio,
                      borderRadius: RADIUS.lg,
                      paddingVertical: 14,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      ...SHADOW.elevated,
                    }}
                  >
                    <Share2 size={18} color={C.dark} strokeWidth={2} />
                    <Text style={{ fontFamily: FONTS.semiBold, fontSize: 14, color: C.dark }}>
                      Dela
                    </Text>
                  </Pressable>
                </View>
              </Animated.View>
            ) : null}

            {/* Cancel button during grace period */}
            {!graceExpired ? (
              <Animated.View entering={FadeInDown.delay(340).duration(180)} style={{ marginTop: SPACING.lg }}>
                <Pressable
                  testID="cancel-claim-button"
                  accessibilityLabel="Ångra övertagande"
                  onPress={handleCancelClaim}
                  disabled={cancelClaimMutation.isPending}
                  style={{
                    backgroundColor: C.bgCard,
                    borderRadius: RADIUS.lg,
                    borderWidth: 1,
                    borderColor: "rgba(239,68,68,0.2)",
                    padding: SPACING.md,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    ...SHADOW.card,
                  }}
                >
                  {cancelClaimMutation.isPending ? (
                    <ActivityIndicator size="small" color={C.error} />
                  ) : (
                    <>
                      <Undo2 size={18} color={C.error} strokeWidth={2} />
                      <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: C.error }}>
                        Ångra — få tillbaka credits
                      </Text>
                    </>
                  )}
                </Pressable>
              </Animated.View>
            ) : null}

            {/* Helpful info */}
            <Animated.View entering={FadeInDown.delay(420).duration(180)} style={{ marginTop: SPACING.xl }}>
              <View
                style={{
                  backgroundColor: C.pistachioLight,
                  borderRadius: RADIUS.lg,
                  padding: SPACING.md,
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <AlertCircle size={16} color={C.pistachio} strokeWidth={2} style={{ marginTop: 2 }} />
                <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textSecondary, lineHeight: 20, flex: 1 }}>
                  {graceExpired
                    ? "Bokningen är bekräftad. Kom ihåg att följa restaurangens avbokningsvillkor om du inte kan komma."
                    : "Under ångerfristen kan du ångra övertagandet helt kostnadsfritt. Dina credits och serviceavgiften återförs."}
                </Text>
              </View>
            </Animated.View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
