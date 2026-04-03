import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  CalendarDays,
  Clock,
  Users,
  LayoutGrid,
  Star,
  BookOpen,
  Trash2,
  AlertCircle,
} from "lucide-react-native";
import { useAuthStore } from "@/lib/auth-store";
import { LoginGate } from "@/components/LoginGate";
import { useMyReservations, useCancelReservation } from "@/lib/api/hooks";
import type { Reservation } from "@/lib/api/types";
import Animated, {
  FadeInDown,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { C, FONTS, SPACING, SHADOW, RADIUS, TYPO, ICON } from "../../lib/theme";
import { Skeleton } from "@/components/Skeleton";

function ReservationsSkeleton() {
  return (
    <View testID="reservations-loading" style={{ paddingTop: 12 }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ marginHorizontal: SPACING.lg, marginBottom: SPACING.md, backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, ...SHADOW.card }}>
          <View style={{ flexDirection: "row" }}>
            <View style={{ flex: 1, gap: 8 }}>
              <Skeleton width="60%" height={16} />
              <Skeleton width="40%" height={12} />
              <Skeleton width="75%" height={13} />
            </View>
            <Skeleton width={70} height={70} style={{ borderRadius: RADIUS.md }} />
          </View>
          <View style={{ height: 0.5, backgroundColor: C.borderLight, marginVertical: 12 }} />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Skeleton width={60} height={12} />
            <Skeleton width={50} height={12} />
            <Skeleton width={30} height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return { label: "Aktiv", bg: "rgba(74,140,107,0.12)", color: C.success };
    case "grace_period":
      return { label: "Under ångerfrist", bg: "rgba(245,158,11,0.12)", color: C.warning };
    case "claimed":
    case "completed":
      return { label: "Övertagen", bg: "rgba(156,163,175,0.12)", color: C.textSecondary };
    case "cancelled":
      return { label: "Avbokad", bg: "rgba(220,38,38,0.1)", color: C.danger };
    case "expired":
      return { label: "Utgången", bg: "rgba(156,163,175,0.12)", color: C.textSecondary };
    default:
      return { label: status, bg: C.bgInput, color: C.textSecondary };
  }
}

function ReservationCard({
  reservation,
  index,
  onCancel,
}: {
  reservation: Reservation;
  index: number;
  onCancel?: (id: string) => void;
}) {
  const scale = useSharedValue(1);
  const status = getStatusBadge(reservation.status);
  const restaurant = reservation.restaurant;
  const router = useRouter();

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (reservation.status === "active") {
      router.push(`/restaurant/${reservation.id}`);
    }
  }, [reservation.id, reservation.status, router]);

  const handleCancel = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onCancel?.(reservation.id);
  }, [reservation.id, onCancel]);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("sv-SE", { weekday: "short", month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string) => {
    try {
      return timeStr.substring(0, 5);
    } catch {
      return timeStr;
    }
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
      <Pressable
        testID={`reservation-card-${reservation.id}`}
        accessibilityLabel={`Visa bokning på ${restaurant.name}`}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <Animated.View
          style={[
            animStyle,
            {
              marginHorizontal: SPACING.lg,
              marginBottom: SPACING.md,
              backgroundColor: C.bgCard,
              borderRadius: RADIUS.lg,
              borderWidth: 0.5,
              borderColor: C.borderLight,
              padding: SPACING.md,
              ...SHADOW.card,
            },
          ]}
        >
          <View className="flex-row">
            {/* Left content */}
            <View style={{ flex: 1, marginRight: 14 }}>
              {/* Restaurant name + rating + cuisine */}
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <Text
                  testID={`reservation-restaurant-${reservation.id}`}
                  style={{
                    fontFamily: FONTS.displaySemiBold,
                    fontSize: 16,
                    color: C.textPrimary,
                    letterSpacing: -0.2,
                  }}
                  numberOfLines={1}
                >
                  {restaurant.name}
                </Text>
              </View>

              <View className="flex-row items-center" style={{ marginTop: SPACING.xs, gap: 4 }}>
                <Star size={11} color={C.gold} fill={C.gold} strokeWidth={0} />
                <Text
                  style={{
                    fontFamily: FONTS.semiBold,
                    fontSize: 12,
                    color: C.textPrimary,
                  }}
                >
                  {restaurant.rating.toFixed(1)}
                </Text>
                <View
                  style={{
                    width: 3,
                    height: 3,
                    borderRadius: 1.5,
                    backgroundColor: C.textTertiary,
                    marginHorizontal: 4,
                  }}
                />
                <Text
                  style={{
                    fontFamily: FONTS.regular,
                    fontSize: 12,
                    color: C.textTertiary,
                  }}
                >
                  {restaurant.cuisine}
                </Text>
              </View>

              {/* Address */}
              <Text
                style={{
                  fontFamily: FONTS.regular,
                  fontSize: 13,
                  color: C.textTertiary,
                  marginTop: 6,
                }}
                numberOfLines={1}
              >
                {restaurant.address}
              </Text>
            </View>

            {/* Thumbnail */}
            <Image
              source={{ uri: restaurant.image }}
              style={{
                width: 70,
                height: 70,
                borderRadius: RADIUS.md,
                backgroundColor: C.bgInput,
              }}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          </View>

          {/* Divider */}
          <View
            style={{
              height: 0.5,
              backgroundColor: C.borderLight,
              marginTop: 14,
              marginBottom: 12,
            }}
          />

          {/* Detail row */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <View className="flex-row items-center" style={{ gap: 5 }}>
              <CalendarDays size={13} color={C.textTertiary} strokeWidth={ICON.strokeWidth} />
              <Text
                style={{
                  fontFamily: FONTS.medium,
                  fontSize: 12,
                  color: C.textSecondary,
                }}
              >
                {formatDate(reservation.reservationDate)}
              </Text>
            </View>
            <View className="flex-row items-center" style={{ gap: 5 }}>
              <Clock size={13} color={C.textTertiary} strokeWidth={ICON.strokeWidth} />
              <Text
                style={{
                  fontFamily: FONTS.medium,
                  fontSize: 12,
                  color: C.textSecondary,
                }}
              >
                {formatTime(reservation.reservationTime)}
              </Text>
            </View>
            <View className="flex-row items-center" style={{ gap: 5 }}>
              <Users size={13} color={C.textTertiary} strokeWidth={ICON.strokeWidth} />
              <Text
                style={{
                  fontFamily: FONTS.medium,
                  fontSize: 12,
                  color: C.textSecondary,
                }}
              >
                {reservation.partySize}
              </Text>
            </View>
            <View className="flex-row items-center" style={{ gap: 5 }}>
              <LayoutGrid size={13} color={C.textTertiary} strokeWidth={ICON.strokeWidth} />
              <Text
                style={{
                  fontFamily: FONTS.medium,
                  fontSize: 12,
                  color: C.textSecondary,
                }}
              >
                {reservation.seatType}
              </Text>
            </View>
          </View>

          {/* Status badge */}
          <View style={{ marginTop: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View
              testID={`reservation-status-${reservation.id}`}
              style={{
                alignSelf: "flex-start",
                backgroundColor: status.bg,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: RADIUS.sm,
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.semiBold,
                  fontSize: 11,
                  color: status.color,
                  letterSpacing: 0.3,
                  textTransform: "uppercase",
                }}
              >
                {status.label}
              </Text>
            </View>
            {reservation.status === "active" && (
              <Pressable
                testID={`reservation-cancel-${reservation.id}`}
                accessibilityLabel="Avboka bokning"
                onPress={handleCancel}
                style={{
                  padding: 8,
                  borderRadius: RADIUS.sm,
                  backgroundColor: C.coralLight,
                }}
              >
                <Trash2 size={14} color={C.coral} strokeWidth={2} />
              </Pressable>
            )}
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export default function ReservationsScreen() {
  const isGuest = useAuthStore((s) => s.isGuest);
  const phone = useAuthStore((s) => s.phoneNumber);

  // Fetch user's reservations
  const {
    data: allReservations = [],
    isLoading,
    error,
    refetch,
  } = useMyReservations(phone || "");

  // Cancel mutation
  const cancelMutation = useCancelReservation();

  const submittedReservations = useMemo(() => {
    return allReservations.filter((r: Reservation) => r.submitterPhone === phone);
  }, [allReservations, phone]);

  const claimedReservations = useMemo(() => {
    return allReservations.filter((r: Reservation) => r.claimerPhone === phone);
  }, [allReservations, phone]);

  const handleCancel = useCallback(
    (reservationId: string) => {
      Alert.alert(
        "Avbryt bokning?",
        "Är du säker? Detta kan inte ångras.",
        [
          { text: "Behåll", style: "cancel" },
          {
            text: "Avbryt bokning",
            style: "destructive",
            onPress: async () => {
              try {
                await cancelMutation.mutateAsync(reservationId);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } catch (err) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              }
            },
          },
        ]
      );
    },
    [cancelMutation]
  );

  if (isGuest) {
    return (
      <LoginGate
        title="Dina bokningar"
        subtitle="Logga in för att se och hantera dina upplagda och övertagna bokningar."
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: C.bg }}>
        <View className="px-5 pt-2 pb-4">
          <Text
            testID="reservations-header"
            style={{
              fontFamily: FONTS.displayBold,
              fontSize: 24,
              color: C.textPrimary,
              letterSpacing: -0.5,
            }}
          >
            Mina bokningar
          </Text>
          <Text
            testID="reservations-count"
            style={{
              fontFamily: FONTS.regular,
              fontSize: 13,
              color: C.textTertiary,
              marginTop: SPACING.xs,
            }}
          >
            {allReservations.length} bokningar totalt
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView
        testID="reservations-scroll"
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: SPACING.sm }}
      >
        {isLoading ? (
          <ReservationsSkeleton />
        ) : error ? (
          <View testID="reservations-error" style={{ alignItems: "center", justifyContent: "center", paddingTop: 60 }}>
            <AlertCircle size={40} color={C.coral} strokeWidth={ICON.strokeWidth} />
            <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: C.textPrimary, marginTop: 12 }}>
              Något gick fel
            </Text>
            <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textTertiary, marginTop: SPACING.xs, textAlign: "center", paddingHorizontal: SPACING.lg }}>
              Kunde inte hämta dina bokningar. Försök igen senare.
            </Text>
            <Pressable
              testID="reservations-retry-button"
              accessibilityLabel="Försök igen"
              onPress={() => refetch()}
              style={{ marginTop: SPACING.md, backgroundColor: C.coral, borderRadius: RADIUS.md, paddingVertical: 12, paddingHorizontal: 28 }}
            >
              <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: "#FFFFFF" }}>
                Försök igen
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Upplagda bokningar */}
            <View style={{ marginTop: SPACING.sm }}>
              <Text testID="section-submitted" style={{ fontFamily: FONTS.semiBold, fontSize: 13, color: C.textTertiary, letterSpacing: 0.5, textTransform: "uppercase", paddingHorizontal: SPACING.lg, marginBottom: 10 }}>
                Upplagda bokningar
              </Text>
              {submittedReservations.length === 0 ? (
                <Animated.View entering={FadeInDown.delay(100).springify()} style={{ paddingHorizontal: SPACING.lg, paddingVertical: 32, alignItems: "center" }}>
                  <Animated.View entering={ZoomIn.springify().delay(150)} style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.03)", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                    <BookOpen size={24} color={C.textTertiary} strokeWidth={ICON.strokeWidth} />
                  </Animated.View>
                  <Animated.View entering={FadeInDown.delay(200).springify()}>
                    <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: C.textPrimary, textAlign: "center" }}>Inga upplagda bokningar</Text>
                  </Animated.View>
                  <Animated.View entering={FadeInDown.delay(280).springify()}>
                    <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textTertiary, marginTop: 4, textAlign: "center", lineHeight: 20 }}>Dela din bokning och tjäna 2 credits</Text>
                  </Animated.View>
                </Animated.View>
              ) : submittedReservations.map((reservation: Reservation, index: number) => (
                <ReservationCard key={reservation.id} reservation={reservation} index={index} onCancel={handleCancel} />
              ))}
            </View>

            {/* Övertagna bokningar */}
            <View style={{ marginTop: 24 }}>
              <Text testID="section-claimed" style={{ fontFamily: FONTS.semiBold, fontSize: 13, color: C.textTertiary, letterSpacing: 0.5, textTransform: "uppercase", paddingHorizontal: SPACING.lg, marginBottom: 10 }}>
                Övertagna bokningar
              </Text>
              {claimedReservations.length === 0 ? (
                <Animated.View entering={FadeInDown.delay(100).springify()} style={{ paddingHorizontal: SPACING.lg, paddingVertical: 32, alignItems: "center" }}>
                  <Animated.View entering={ZoomIn.springify().delay(150)} style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.03)", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                    <BookOpen size={24} color={C.textTertiary} strokeWidth={ICON.strokeWidth} />
                  </Animated.View>
                  <Animated.View entering={FadeInDown.delay(200).springify()}>
                    <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: C.textPrimary, textAlign: "center" }}>Inga övertagna bokningar</Text>
                  </Animated.View>
                  <Animated.View entering={FadeInDown.delay(280).springify()}>
                    <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textTertiary, marginTop: 4, textAlign: "center", lineHeight: 20 }}>Utforska bokningar och ta över ett bord</Text>
                  </Animated.View>
                </Animated.View>
              ) : claimedReservations.map((reservation: Reservation, index: number) => (
                <ReservationCard key={reservation.id} reservation={reservation} index={index} onCancel={handleCancel} />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
