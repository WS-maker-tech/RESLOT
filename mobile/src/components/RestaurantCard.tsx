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
  Flame,
} from "lucide-react-native";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  interpolateColor,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import type { Reservation } from "@/lib/api/types";
import { C, FONTS, SPACING, RADIUS, SHADOW } from "../lib/theme";
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
          backgroundColor: C.successBright,
        },
      ]}
    />
  );
}

// --- Pulsing Urgency Dot (coral/red) ---
function PulsingUrgencyDot({ size = 7 }: { size?: number }) {
  const scale = useSharedValue(1);
  const dotOpacity = useSharedValue(1);
  React.useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 600 }),
        withTiming(1, { duration: 600 }),
      ),
      -1,
      false,
    );
    dotOpacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 600 }),
        withTiming(1, { duration: 600 }),
      ),
      -1,
      false,
    );
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
          backgroundColor: C.error,
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
          <PulsingGreenDot size={7} />
          <Text style={styles.urgencyBadgeTodayText}>
            Idag kl {reservationTime.slice(0, 5)}
          </Text>
        </View>
      );
    }
  }

  return null;
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
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
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

  const watcherCount = restaurant.timesBookedOnReslot >= 3
    ? Math.max(2, Math.floor(restaurant.timesBookedOnReslot * 1.5))
    : 0;

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
          <View style={styles.cardRow}>
            {/* Left: Large rounded image */}
            <View style={styles.imageWrapper}>
              <Image
                source={{ uri: restaurant.image }}
                style={styles.thumbnail}
                cachePolicy="memory-disk"
                contentFit="cover"
              />
              {/* Save button overlay */}
              {!isGuest && phone ? (
                <Pressable
                  testID={`save-restaurant-${restaurant.id}`}
                  accessibilityLabel={isSaved ? "Ta bort från sparade" : "Spara restaurang"}
                  onPress={handleToggleSave}
                  style={styles.saveButton}
                  hitSlop={8}
                >
                  <Animated.View style={heartAnimStyle}>
                    <Heart
                      size={14}
                      color={isSaved ? C.white : C.white}
                      fill={isSaved ? C.white : "transparent"}
                      strokeWidth={2}
                    />
                  </Animated.View>
                </Pressable>
              ) : null}
              {/* Watcher count on image */}
              {watcherCount > 0 ? (
                <View style={styles.watcherOverlay}>
                  <Eye size={10} color={C.white} strokeWidth={2.5} />
                  <Text style={styles.watcherOverlayText}>{watcherCount}</Text>
                </View>
              ) : null}
            </View>

            {/* Right content */}
            <View style={styles.cardRightContent}>
              {/* Restaurant name */}
              <Text
                style={styles.restaurantName}
                numberOfLines={1}
              >
                {restaurant.name}
              </Text>

              {/* Rating + cuisine row */}
              <View style={styles.metaRow}>
                <Star size={12} color={C.gold} fill={C.gold} strokeWidth={0} />
                <Text style={styles.ratingText}>
                  {restaurant.rating.toFixed(1)}
                </Text>
                <Text style={styles.reviewCountText}>
                  ({restaurant.reviewCount})
                </Text>

              </View>

              {/* Address */}
              <Text
                style={styles.restaurantAddress}
                numberOfLines={1}
              >
                {restaurant.address}
              </Text>

              {/* Time + party size chips */}
              <View style={styles.chipRow}>
                <View style={styles.chip}>
                  <Clock size={12} color={C.textPrimary} strokeWidth={2} />
                  <Text style={styles.chipText}>
                    {formatTime(reservation.reservationTime)}
                  </Text>
                </View>
                <View style={styles.chip}>
                  <Users size={12} color={C.textPrimary} strokeWidth={2} />
                  <Text style={styles.chipText}>
                    {reservation.partySize} gäster
                  </Text>
                </View>
              </View>

              {/* Urgency badge */}
              <UrgencyBadge reservation={reservation} />
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
    paddingVertical: 14,
  },
  cardRow: {
    flexDirection: "row",
    gap: 14,
  },
  imageWrapper: {
    position: "relative",
  },
  cardRightContent: {
    flex: 1,
    justifyContent: "center",
  },
  restaurantName: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 17,
    color: C.textPrimary,
    letterSpacing: -0.4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  restaurantAddress: {
    fontFamily: FONTS.regular,
    fontSize: 12.5,
    color: C.textTertiary,
    marginTop: 3,
    letterSpacing: -0.1,
  },
  ratingText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12.5,
    color: C.textPrimary,
  },
  reviewCountText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: C.textTertiary,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: C.borderLight,
    marginHorizontal: 4,
  },
  cuisineText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: C.textTertiary,
  },
  chipRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.bgInput,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  chipText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12.5,
    color: C.textPrimary,
    letterSpacing: -0.1,
  },
  watcherOverlay: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: C.overlayDark,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  watcherOverlayText: {
    fontFamily: FONTS.bold,
    fontSize: 10.5,
    color: C.white,
  },
  saveButton: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: RADIUS.lg,
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
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    gap: 6,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  urgencyBadgeTodayText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: C.success,
    letterSpacing: -0.2,
  },
  urgencyBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.errorLight,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
    gap: 4,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  urgencyBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: C.error,
    letterSpacing: -0.2,
  },
});
