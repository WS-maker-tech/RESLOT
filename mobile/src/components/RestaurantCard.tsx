import React, { useCallback, useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  Star,
  Clock,
  Users,
  Eye,
  Heart,
} from "lucide-react-native";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import type { Reservation } from "@/lib/api/types";
import { C, FONTS, SPACING, RADIUS } from "../lib/theme";
import { useSavedRestaurants, useSaveRestaurant, useUnsaveRestaurant } from "@/lib/api/hooks";
import { useAuthStore } from "@/lib/auth-store";

// --- Pulsing Green Dot ---
function PulsingGreenDot({ size = 8 }: { size?: number }) {
  const scale = useSharedValue(1);
  const dotOpacity = useSharedValue(1);
  React.useEffect(() => {
    scale.value = withRepeat(withTiming(1.5, { duration: 1000 }), -1, true);
    dotOpacity.value = withRepeat(withTiming(0.5, { duration: 1000 }), -1, true);
  }, []);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: dotOpacity.value,
  }));
  return (
    <Animated.View
      style={[
        animStyle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: C.success,
        },
      ]}
    />
  );
}

// --- Urgency Badge ---
function UrgencyBadge({ reservation }: { reservation: Reservation }) {
  const { cancellationWindowHours, createdAt, reservationDate, reservationTime } = reservation;
  const now = new Date();

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const isToday = reservationDate === todayStr;

  if (isToday && reservationTime) {
    const [h, m] = reservationTime.split(":").map(Number);
    const resDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
    const hoursUntilVisit = (resDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilVisit > 0 && hoursUntilVisit <= 6) {
      return (
        <View
          testID="urgency-badge-today"
          style={styles.urgencyBadgeToday}
        >
          <PulsingGreenDot size={8} />
          <Text style={styles.urgencyBadgeTodayText}>
            Idag kl {reservationTime.slice(0, 5)}
          </Text>
        </View>
      );
    }
  }

  if (!cancellationWindowHours) return null;

  const created = new Date(createdAt);
  const deadline = new Date(created.getTime() + cancellationWindowHours * 60 * 60 * 1000);
  const diffMs = deadline.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours <= 0 || diffHours > 2) return null;

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <View testID="urgency-badge" style={styles.urgencyBadge}>
      <Clock size={12} color={C.coral} strokeWidth={2} />
      <Text style={styles.urgencyBadgeText}>
        {hours}h {minutes}m kvar
      </Text>
    </View>
  );
}

interface RestaurantCardProps {
  reservation: Reservation;
  index: number;
  isLast: boolean;
}

export const RestaurantCard = React.memo(function RestaurantCard({
  reservation,
  index,
  isLast,
}: RestaurantCardProps) {
  const scale = useSharedValue(1);
  const bgFlash = useSharedValue(0);
  const heartScale = useSharedValue(1);
  const router = useRouter();
  const restaurant = reservation.restaurant;
  const phone = useAuthStore((s) => s.phoneNumber);
  const isGuest = useAuthStore((s) => s.isGuest);

  const { data: savedRestaurants } = useSavedRestaurants(phone || null);
  const saveRestaurant = useSaveRestaurant();
  const unsaveRestaurant = useUnsaveRestaurant();

  const isSaved = useMemo(
    () => savedRestaurants?.some((s) => s.restaurantId === restaurant.id) ?? false,
    [savedRestaurants, restaurant.id]
  );

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolateColor(
      bgFlash.value,
      [0, 1],
      ['transparent', 'rgba(0,0,0,0.03)']
    ),
  }));

  const heartAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
    bgFlash.value = withTiming(1, { duration: 100 });
  }, [scale, bgFlash]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
    bgFlash.value = withTiming(0, { duration: 200 });
  }, [scale, bgFlash]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/restaurant/${reservation.id}`);
  }, [router, reservation.id]);

  const handleToggleSave = useCallback(() => {
    if (isGuest || !phone) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    heartScale.value = withSpring(1.3, { damping: 8, stiffness: 300 }, () => {
      heartScale.value = withSpring(1, { damping: 10, stiffness: 200 });
    });
    if (isSaved) {
      unsaveRestaurant.mutate(restaurant.id);
    } else {
      saveRestaurant.mutate({ restaurantId: restaurant.id });
    }
  }, [isGuest, phone, isSaved, restaurant.id, saveRestaurant, unsaveRestaurant, heartScale]);

  const formatTime = (timeStr: string) => {
    try {
      return timeStr.substring(0, 5);
    } catch {
      return timeStr;
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50)
        .springify()}
    >
      <Pressable
        testID={`restaurant-row-${restaurant.id}`}
        accessibilityLabel={`Visa bokning på ${restaurant.name}`}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <Animated.View
          style={[
            animStyle,
            styles.cardContainer,
          ]}
        >
          <View className="flex-row">
            {/* Left content */}
            <View style={styles.cardLeftContent}>
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <Text
                  style={styles.restaurantName}
                  numberOfLines={1}
                >
                  {restaurant.name}
                </Text>
              </View>

              <Text
                style={styles.restaurantAddress}
                numberOfLines={1}
              >
                {restaurant.address}
              </Text>

              <View
                className="flex-row items-center"
                style={{ marginTop: 6, gap: 4 }}
              >
                <Star size={12} color={C.gold} fill={C.gold} strokeWidth={0} />
                <Text style={styles.ratingText}>
                  {restaurant.rating.toFixed(1)}
                </Text>
                <Text style={styles.reviewCountText}>
                  ({restaurant.reviewCount})
                </Text>
                <View style={styles.dot} />
                <Text style={styles.cuisineText}>
                  {restaurant.cuisine}
                </Text>
              </View>

              <View
                className="flex-row items-center"
                style={{ marginTop: 8, gap: 14 }}
              >
                <View className="flex-row items-center" style={{ gap: 4 }}>
                  <Clock size={13} color={C.textTertiary} strokeWidth={2} />
                  <Text style={styles.detailText}>
                    {formatTime(reservation.reservationTime)}
                  </Text>
                </View>
                <View className="flex-row items-center" style={{ gap: 4 }}>
                  <Users size={13} color={C.textTertiary} strokeWidth={2} />
                  <Text style={styles.detailText}>
                    {reservation.partySize} gäster
                  </Text>
                </View>
              </View>

              {restaurant.timesBookedOnReslot >= 3 ? (
                <View
                  className="flex-row items-center"
                  style={styles.watchingBadge}
                >
                  <Eye size={11} color={C.info} strokeWidth={2} />
                  <Text style={styles.watchingText}>
                    {Math.max(2, Math.floor(restaurant.timesBookedOnReslot * 1.5))} bevakar
                  </Text>
                </View>
              ) : null}

              <UrgencyBadge reservation={reservation} />
            </View>

            {/* Right thumbnail + save button */}
            <View style={{ position: "relative" }}>
              <Image
                source={{ uri: restaurant.image }}
                style={styles.thumbnail}
                cachePolicy="memory-disk"
                contentFit="cover"
              />
              {!isGuest && phone ? (
                <Pressable
                  testID={`save-restaurant-${restaurant.id}`}
                  accessibilityLabel={isSaved ? "Ta bort fran sparade" : "Spara restaurang"}
                  onPress={handleToggleSave}
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: "rgba(255,255,255,0.85)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  hitSlop={8}
                >
                  <Animated.View style={heartAnimStyle}>
                    <Heart
                      size={14}
                      color={isSaved ? C.coral : C.textTertiary}
                      fill={isSaved ? C.coral : "transparent"}
                      strokeWidth={2}
                    />
                  </Animated.View>
                </Pressable>
              ) : null}
            </View>
          </View>
        </Animated.View>
      </Pressable>

      {!isLast ? (
        <View style={styles.divider} />
      ) : null}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 16,
  },
  cardLeftContent: {
    flex: 1,
    marginRight: 16,
  },
  restaurantName: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 17,
    color: C.textPrimary,
    letterSpacing: -0.3,
  },
  restaurantAddress: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: C.textTertiary,
    marginTop: 3,
  },
  ratingText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    color: C.textPrimary,
  },
  reviewCountText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: C.textTertiary,
    marginLeft: 2,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: C.borderLight,
    marginHorizontal: 6,
  },
  cuisineText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: C.textTertiary,
  },
  detailText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: C.textSecondary,
    letterSpacing: -0.1,
  },
  watchingBadge: {
    marginTop: 6,
    backgroundColor: "rgba(59,130,246,0.08)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
    gap: 4,
  },
  watchingText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: C.info,
  },
  thumbnail: {
    width: 84,
    height: 84,
    borderRadius: RADIUS.md,
    backgroundColor: C.bgInput,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.borderLight,
    marginLeft: SPACING.lg,
    marginRight: SPACING.lg,
  },
  urgencyBadgeToday: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.successLight,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  urgencyBadgeTodayText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    color: C.success,
  },
  urgencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.coralLight,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  urgencyBadgeText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: C.coral,
  },
});
