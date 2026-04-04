import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Clock,
  Coins,
  Search,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Check,
  Calendar,
  AlertCircle,
  HelpCircle,
  Eye,
  TrendingUp,
  Flame,
  Sparkles,
  Star,
  MapPin,
, UtensilsCrossed } from "lucide-react-native";
import Animated, {
  FadeInDown,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Extrapolation,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { useQuery } from "@tanstack/react-query";
import { useReservations, useProfile, useMissedReservations, useNewOnReslot } from "@/lib/api/hooks";
import { api } from "@/lib/api/api";
import { useAuthStore } from "@/lib/auth-store";
import type { Reservation, MissedReservation, Restaurant } from "@/lib/api/types";
import { C, FONTS, SPACING, SHADOW, RADIUS, ICON } from "../../lib/theme";
import { RestaurantCard } from "@/components/RestaurantCard";
import { FilterChips } from "@/components/FilterChips";
import { DayPicker, generateDays } from "@/components/DayPicker";
import { CreditsBanner } from "@/components/CreditsBanner";
import { Skeleton } from "@/components/Skeleton";

// DAYS is now computed inside the component via useMemo so it refreshes after midnight

const CITIES = ["Stockholm", "Göteborg", "Malmö", "Uppsala"];

// --- Skeleton Card with shimmer sweep ---
const SkeletonCard = React.memo(function SkeletonCard({ index = 0 }: { index?: number }) {
  const opacity1 = useSharedValue(0.3);
  const opacity2 = useSharedValue(0.15);
  // Stagger duration per card for organic feel
  const baseDuration = 900 + index * 150;

  React.useEffect(() => {
    // Primary layer: three-step pulse (low → mid → low)
    opacity1.value = withRepeat(
      withSequence(
        withTiming(0.15, { duration: baseDuration * 0.4 }),
        withTiming(0.5, { duration: baseDuration * 0.3 }),
        withTiming(0.3, { duration: baseDuration * 0.3 }),
      ),
      -1,
      false,
    );
    // Secondary layer: offset phase sweep for shimmer illusion
    opacity2.value = withRepeat(
      withSequence(
        withTiming(0.0, { duration: baseDuration * 0.3 }),
        withTiming(0.35, { duration: baseDuration * 0.35 }),
        withTiming(0.0, { duration: baseDuration * 0.35 }),
      ),
      -1,
      false,
    );
  }, []);

  const baseStyle = useAnimatedStyle(() => ({ opacity: opacity1.value }));
  const sweepStyle = useAnimatedStyle(() => ({ opacity: opacity2.value }));

  return (
    <View
      style={{
        borderRadius: RADIUS.lg,
        height: 120,
        marginHorizontal: 20,
        marginBottom: 12,
        overflow: "hidden",
      }}
    >
      {/* Base skeleton layer */}
      <Animated.View
        style={[
          baseStyle,
          {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: C.bgInput,
          },
        ]}
      />
      {/* Sweep highlight layer */}
      <Animated.View
        style={[
          sweepStyle,
          {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: "#FFFFFF",
          },
        ]}
      />
      {/* Inner content placeholders */}
      <View style={{ padding: 16, gap: 10 }}>
        <Animated.View
          style={[
            baseStyle,
            {
              width: "60%",
              height: 14,
              borderRadius: RADIUS.sm,
              backgroundColor: "rgba(0,0,0,0.06)",
            },
          ]}
        />
        <Animated.View
          style={[
            baseStyle,
            {
              width: "40%",
              height: 12,
              borderRadius: RADIUS.sm,
              backgroundColor: "rgba(0,0,0,0.04)",
            },
          ]}
        />
        <Animated.View
          style={[
            baseStyle,
            {
              width: "80%",
              height: 12,
              borderRadius: RADIUS.sm,
              backgroundColor: "rgba(0,0,0,0.04)",
              marginTop: 8,
            },
          ]}
        />
      </View>
    </View>
  );
});

// --- Pulsing Green Dot (used in today-bookings banner + missed bookings) ---
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

// UrgencyBadge is now in RestaurantCard component

// --- Header ---
const Header = React.memo(function Header({
  selectedCity,
  onCityPress,
  onFAQPress,
  onCreditsPress,
  onMapPress,
  credits,
  isLoading,
  showSearch,
  onSearchToggle,
  searchQuery,
  onSearchChange,
}: {
  selectedCity: string;
  onCityPress: () => void;
  onFAQPress: () => void;
  onCreditsPress: () => void;
  onMapPress: () => void;
  credits: number;
  isLoading?: boolean;
  showSearch: boolean;
  onSearchToggle: () => void;
  searchQuery: string;
  onSearchChange: (v: string) => void;
}) {
  return (
    <View>
      <View className="flex-row items-center justify-between px-5 pt-2 pb-1">
        <Pressable
          testID="faq-button"
          accessibilityLabel="Vanliga frågor"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onFAQPress();
          }}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: C.borderLight,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <HelpCircle size={20} color={C.textTertiary} strokeWidth={2} />
        </Pressable>

        <Pressable
          testID="city-picker-button"
          accessibilityLabel="Välj stad"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onCityPress();
          }}
          style={{ flexDirection: "row", alignItems: "center" }}
        >
          <Text
            style={{
              fontFamily: FONTS.displayBold,
              fontSize: 22,
              color: C.dark,
              letterSpacing: -0.5,
            }}
          >
            Bokningar i{" "}
          </Text>
          <Text
            style={{
              fontFamily: FONTS.displayBold,
              fontSize: 22,
              color: C.coral,
              letterSpacing: -0.5,
              opacity: 0.9,
            }}
          >
            {selectedCity}
          </Text>
          <ChevronDown size={14} color={C.coral} strokeWidth={ICON.strokeWidth} style={{ marginLeft: 2 }} />
        </Pressable>

        <View className="flex-row items-center" style={{ gap: 8 }}>
          <Pressable
            testID="credits-pill"
            accessibilityLabel="Visa credits"
            className="flex-row items-center rounded-full px-3 py-1.5"
            style={{ backgroundColor: "rgba(201, 169, 110, 0.1)" }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onCreditsPress();
            }}
          >
            <Coins size={14} color={C.gold} strokeWidth={ICON.strokeWidth} />
            <Text
              style={{
                fontFamily: FONTS.bold,
                fontSize: 13,
                color: C.gold,
                marginLeft: 4,
              }}
            >
              {isLoading ? "..." : credits}
            </Text>
          </Pressable>
          <Pressable
            testID="map-button"
            accessibilityLabel="Visa karta"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onMapPress();
            }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: C.borderLight,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MapPin size={18} color={C.textTertiary} strokeWidth={2} />
          </Pressable>
          <Pressable
            testID="search-toggle"
            accessibilityLabel="Sök restaurang"
            onPress={onSearchToggle}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: C.borderLight,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Search size={18} color={C.textTertiary} strokeWidth={2} />
          </Pressable>
        </View>
      </View>
      {showSearch ? (
        <View style={{ paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm }}>
          <TextInput
            testID="search-input"
            value={searchQuery}
            onChangeText={onSearchChange}
            placeholder="Sök restaurang..."
            placeholderTextColor={C.textTertiary}
            style={{
              backgroundColor: C.bgCard,
              borderRadius: RADIUS.md,
              paddingHorizontal: 14,
              paddingVertical: 10,
              fontFamily: FONTS.regular,
              fontSize: 14,
              color: C.dark,
              borderWidth: 0.5,
              borderColor: C.borderLight,
            }}
          />
        </View>
      ) : null}
    </View>
  );
});

// DayPicker and FilterChips are now in extracted components

// --- Missed Booking Card (Premium) ---
const MissedBookingCard = React.memo(function MissedBookingCard({
  item,
  index,
  onWatch,
}: {
  item: MissedReservation;
  index: number;
  onWatch: (restaurantId: string) => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  }, [scale]);

  const restaurant = item.restaurant;
  if (!restaurant) return null;

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return null;
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    if (hours >= 24) return `Igår`;
    if (hours >= 1) return `${hours}h sedan`;
    return `${mins} min sedan`;
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 70).springify()}
    >
      <Pressable
        testID={`missed-card-${index}`}
        accessibilityLabel={`Missad bokning på ${restaurant.name}`}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onWatch(restaurant.id);
        }}
      >
        <Animated.View
          style={[
            animStyle,
            {
              width: 220,
              marginRight: 12,
              borderRadius: RADIUS.lg,
              backgroundColor: C.bgCard,
              overflow: "hidden",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 3,
            },
          ]}
        >
          {/* Image with overlay */}
          <View style={{ position: "relative" }}>
            <Image
              source={{ uri: restaurant.image }}
              style={{
                width: 220,
                height: 130,
                backgroundColor: C.bgInput,
              }}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
            {/* Gradient-like dark overlay */}
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.30)",
              }}
            />
            {/* "Tagen" badge — top left, bold red */}
            <View
              style={{
                position: "absolute",
                top: 10,
                left: 10,
                backgroundColor: "#EF4444",
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 4,
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Flame size={10} color="#FFFFFF" fill="#FFFFFF" strokeWidth={0} />
              <Text
                style={{
                  fontFamily: FONTS.bold,
                  fontSize: 10,
                  color: "#FFFFFF",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                }}
              >
                Tagen
              </Text>
            </View>
            {/* Time-to-claim badge — bottom left, speed indicator */}
            {item.timeToClaim !== null && item.timeToClaim > 0 ? (
              <View
                style={{
                  position: "absolute",
                  bottom: 10,
                  left: 10,
                  backgroundColor: "rgba(0,0,0,0.65)",
                  borderRadius: 20,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Clock size={10} color="#FFFFFF" strokeWidth={2.5} />
                <Text
                  style={{
                    fontFamily: FONTS.bold,
                    fontSize: 10,
                    color: "#FFFFFF",
                    letterSpacing: -0.1,
                  }}
                >
                  Gick på {item.timeToClaim} min
                </Text>
              </View>
            ) : null}
            {/* Restaurant name on image — bottom right */}
            <View
              style={{
                position: "absolute",
                bottom: 10,
                right: 10,
              }}
            >
              {item.claimedAt ? (
                <Text
                  style={{
                    fontFamily: FONTS.semiBold,
                    fontSize: 10,
                    color: "rgba(255,255,255,0.8)",
                    textAlign: "right",
                  }}
                >
                  {formatTimeAgo(item.claimedAt)}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Content */}
          <View style={{ padding: 12, gap: 2 }}>
            <Text
              style={{
                fontFamily: FONTS.displaySemiBold,
                fontSize: 15,
                color: C.dark,
                letterSpacing: -0.3,
              }}
              numberOfLines={1}
            >
              {restaurant.name}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                <Clock size={11} color={C.textTertiary} strokeWidth={2} />
                <Text
                  style={{
                    fontFamily: FONTS.medium,
                    fontSize: 12,
                    color: C.textSecondary,
                  }}
                >
                  {item.reservationTime?.slice(0, 5)}
                </Text>
              </View>
              <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.borderLight }} />
              <Text
                style={{
                  fontFamily: FONTS.medium,
                  fontSize: 12,
                  color: C.textSecondary,
                }}
              >
                {item.partySize} gäster
              </Text>
            </View>

            {/* CTA: Bevaka — full width, prominent */}
            <View
              style={{
                marginTop: 10,
                backgroundColor: C.coral,
                borderRadius: 10,
                paddingVertical: 8,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 5,
              }}
            >
              <Eye size={13} color="#111827" strokeWidth={2.5} />
              <Text
                style={{
                  fontFamily: FONTS.bold,
                  fontSize: 12.5,
                  color: "#111827",
                  letterSpacing: -0.1,
                }}
              >
                Bevaka liknande
              </Text>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
});

// --- Missed Bookings Section (Premium) ---
function MissedBookingsSection({ city }: { city: string }) {
  const router = useRouter();
  const { data: missed = [] } = useMissedReservations(city);

  if (missed.length === 0) return null;

  return (
    <Animated.View
      testID="missed-bookings-section"
      entering={FadeInDown.delay(50).springify()}
      style={{ marginBottom: 8 }}
    >
      {/* Section header with FOMO styling */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: SPACING.lg,
          marginBottom: 12,
          marginTop: 6,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              backgroundColor: "rgba(239,68,68,0.08)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Flame size={15} color="#EF4444" fill="#EF4444" strokeWidth={0} />
          </View>
          <View>
            <Text
              style={{
                fontFamily: FONTS.displayBold,
                fontSize: 17,
                color: C.dark,
                letterSpacing: -0.4,
              }}
            >
              Du missade
            </Text>
            <Text
              style={{
                fontFamily: FONTS.regular,
                fontSize: 12,
                color: C.textTertiary,
                marginTop: 0,
              }}
            >
              {missed.length} bokningar tagna nyligen
            </Text>
          </View>
        </View>
        <Pressable
          testID="missed-see-watches"
          accessibilityLabel="Lägg till bevakningar"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/add-watch");
          }}
          style={{
            backgroundColor: C.coral,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 7,
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Eye size={12} color="#111827" strokeWidth={2.5} />
          <Text
            style={{
              fontFamily: FONTS.bold,
              fontSize: 12,
              color: "#111827",
              letterSpacing: -0.1,
            }}
          >
            Bevaka fler
          </Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: SPACING.lg,
          paddingBottom: 6,
        }}
        style={{ flexGrow: 0 }}
      >
        {missed.map((item: MissedReservation, index: number) => (
          <MissedBookingCard
            key={item.id}
            item={item}
            index={index}
            onWatch={(restaurantId) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push(`/add-watch?restaurantId=${restaurantId}`);
            }}
          />
        ))}
      </ScrollView>
    </Animated.View>
  );
}

// --- New on Reslot Discovery Section ---
function NewOnReslotSection() {
  const router = useRouter();
  const { data: newRestaurants = [] } = useNewOnReslot();

  if (newRestaurants.length === 0) return null;

  return (
    <Animated.View
      testID="new-on-reslot-section"
      entering={FadeInDown.delay(80).springify()}
      style={{ marginBottom: 8 }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: SPACING.lg,
          marginBottom: 12,
          marginTop: 6,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              backgroundColor: "rgba(126,200,122,0.12)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sparkles size={15} color={C.success} strokeWidth={2} />
          </View>
          <View>
            <Text
              style={{
                fontFamily: FONTS.displayBold,
                fontSize: 17,
                color: C.dark,
                letterSpacing: -0.4,
              }}
            >
              Nya på Reslot
            </Text>
            <Text
              style={{
                fontFamily: FONTS.regular,
                fontSize: 12,
                color: C.textTertiary,
                marginTop: 0,
              }}
            >
              Restauranger med sin första bokning
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 6 }}
        style={{ flexGrow: 0 }}
      >
        {newRestaurants.map((restaurant: Restaurant, index: number) => (
          <Animated.View key={restaurant.id} entering={FadeInDown.delay(index * 70).springify()}>
            <Pressable
              testID={`new-restaurant-${index}`}
              accessibilityLabel={`Visa ${restaurant.name}`}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/restaurant/${restaurant.id}`);
              }}
              style={{
                width: 180,
                marginRight: 12,
                borderRadius: RADIUS.lg,
                backgroundColor: C.bgCard,
                overflow: "hidden",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
                elevation: 3,
              }}
            >
              <Image
                source={{ uri: restaurant.image }}
                style={{ width: 180, height: 110, backgroundColor: C.bgInput }}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
              <View style={{ position: "absolute", top: 8, left: 8, backgroundColor: "rgba(126,200,122,0.90)", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Sparkles size={10} color="#111827" strokeWidth={2.5} />
                <Text style={{ fontFamily: FONTS.bold, fontSize: 10, color: "#111827", textTransform: "uppercase", letterSpacing: 0.8 }}>Ny</Text>
              </View>
              <View style={{ padding: 12, gap: 2 }}>
                <Text
                  style={{ fontFamily: FONTS.displaySemiBold, fontSize: 14, color: C.dark, letterSpacing: -0.3 }}
                  numberOfLines={1}
                >
                  {restaurant.name}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                  <Star size={11} color={C.gold} fill={C.gold} strokeWidth={0} />
                  <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: C.textSecondary }}>
                    {restaurant.rating.toFixed(1)}
                  </Text>
                  <View style={{ width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.borderLight }} />
                  <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: C.textSecondary }} numberOfLines={1}>
                    {restaurant.cuisine}
                  </Text>
                </View>
              </View>
            </Pressable>
          </Animated.View>
        ))}
      </ScrollView>
    </Animated.View>
  );
}

// RestaurantRow is now RestaurantCard in @/components/RestaurantCard
// RewardsBanner is now CreditsBanner in @/components/CreditsBanner

// --- Calendar Modal ---
const MONTH_NAMES = ["Januari","Februari","Mars","April","Maj","Juni","Juli","Augusti","September","Oktober","November","December"];
const DAY_SHORT = ["Mån","Tis","Ons","Tor","Fre","Lör","Sön"];

function CalendarModal({
  visible,
  selectedDate,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selectedDate: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  // Monday-first: Sunday = 6, Monday = 0
  const startOffset = (firstDay.getDay() + 6) % 7;
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push(new Date(viewYear, viewMonth, d));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8 }}>
          <Pressable testID="calendar-close-button" accessibilityLabel="Stäng kalender" onPress={onClose} style={{ padding: 4 }}>
            <Text style={{ fontFamily: FONTS.medium, fontSize: 16, color: C.textTertiary }}>Stäng</Text>
          </Pressable>
          <Text style={{ fontFamily: FONTS.displayBold, fontSize: 17, color: C.dark, letterSpacing: -0.3 }}>Välj datum</Text>
          <View style={{ width: 48 }} />
        </View>

        {/* Month navigation */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingVertical: 16 }}>
          <Pressable testID="calendar-prev-month" accessibilityLabel="Föregående månad" onPress={prevMonth} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.borderLight, alignItems: "center", justifyContent: "center" }}>
            <ChevronLeft size={18} color={C.dark} strokeWidth={2} />
          </Pressable>
          <Text style={{ fontFamily: FONTS.displayBold, fontSize: 18, color: C.dark, letterSpacing: -0.3 }}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </Text>
          <Pressable testID="calendar-next-month" accessibilityLabel="Nästa månad" onPress={nextMonth} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.borderLight, alignItems: "center", justifyContent: "center" }}>
            <ChevronRight size={18} color={C.dark} strokeWidth={2} />
          </Pressable>
        </View>

        {/* Day labels */}
        <View style={{ flexDirection: "row", paddingHorizontal: 16, marginBottom: 8 }}>
          {DAY_SHORT.map(d => (
            <View key={d} style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontFamily: FONTS.medium, fontSize: 11, color: C.textTertiary, textTransform: "uppercase", letterSpacing: 0.5 }}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={{ paddingHorizontal: 16 }}>
          {Array.from({ length: cells.length / 7 }).map((_, row) => (
            <View key={row} style={{ flexDirection: "row", marginBottom: 4 }}>
              {cells.slice(row * 7, row * 7 + 7).map((date, col) => {
                if (!date) return <View key={col} style={{ flex: 1, height: 44 }} />;
                const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const isToday = date.toDateString() === today.toDateString();
                const isSelected = date.toDateString() === selectedDate.toDateString();
                return (
                  <Pressable
                    key={col}
                    testID={`calendar-day-${date.getDate()}`}
                    accessibilityLabel={`Välj dag ${date.getDate()}`}
                    onPress={() => {
                      if (!isPast) {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onSelect(date);
                        onClose();
                      }
                    }}
                    style={{ flex: 1, height: 44, alignItems: "center", justifyContent: "center" }}
                  >
                    <View style={{
                      width: 36, height: 36, borderRadius: 18,
                      alignItems: "center", justifyContent: "center",
                      backgroundColor: isSelected ? C.coral : isToday ? C.coralLight : "transparent",
                    }}>
                      <Text style={{
                        fontFamily: isSelected ? FONTS.bold : FONTS.medium,
                        fontSize: 15,
                        color: isSelected ? "#111827" : isPast ? "#D1D5DB" : isToday ? C.coral : C.dark,
                      }}>
                        {date.getDate()}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </Modal>
  );
}

// --- City Picker Modal ---
function CityPickerModal({
  visible,
  selectedCity,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selectedCity: string;
  onSelect: (city: string) => void;
  onClose: () => void;
}) {
  const translateY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      'worklet';
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      'worklet';
      if (e.translationY > 50 || e.velocityY > 500) {
        translateY.value = withTiming(400, { duration: 200 });
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      }
    });

  // Reset on open and handle close via translation
  React.useEffect(() => {
    if (visible) {
      translateY.value = 0;
    }
  }, [visible, translateY]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        accessibilityLabel="Stäng stadsväljaren"
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}
        onPress={handleClose}
      >
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              sheetStyle,
              {
                backgroundColor: C.bg,
                borderTopLeftRadius: RADIUS.xl,
                borderTopRightRadius: RADIUS.xl,
                paddingTop: 12,
                paddingBottom: 40,
              },
            ]}
          >
            {/* Grab handle */}
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: "rgba(0,0,0,0.12)",
                alignSelf: "center",
                marginBottom: 16,
              }}
            />
            <Text
              style={{
                fontFamily: FONTS.displaySemiBold,
                fontSize: 16,
                color: C.dark,
                letterSpacing: -0.3,
                paddingHorizontal: SPACING.lg,
                paddingBottom: 12,
              }}
            >
              Välj stad
            </Text>
            {CITIES.map((city, index) => {
              const isSelected = city === selectedCity;
              const isLast = index === CITIES.length - 1;
              return (
                <React.Fragment key={city}>
                  <Pressable
                    testID={`city-option-${city}`}
                    accessibilityLabel={`Välj ${city}`}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onSelect(city);
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingHorizontal: SPACING.lg,
                      paddingVertical: 16,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: FONTS.displaySemiBold,
                        fontSize: 16,
                        color: isSelected ? C.coral : C.dark,
                        letterSpacing: -0.2,
                      }}
                    >
                      {city}
                    </Text>
                    {isSelected ? (
                      <Check size={18} color={C.coral} strokeWidth={ICON.strokeWidth} />
                    ) : null}
                  </Pressable>
                  {!isLast ? (
                    <View
                      style={{
                        height: 0.5,
                        backgroundColor: C.borderLight,
                        marginHorizontal: SPACING.lg,
                      }}
                    />
                  ) : null}
                </React.Fragment>
              );
            })}
          </Animated.View>
        </GestureDetector>
      </Pressable>
    </Modal>
  );
}

// --- Count-up text for social proof (Premium) ---
function CountUpText({ value, suffix, city }: { value: number; suffix: string; city: string }) {
  const [display, setDisplay] = React.useState(0);
  React.useEffect(() => {
    if (value <= 0) { setDisplay(0); return; }
    setDisplay(0);
    const steps = 24;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= steps; i++) {
      timers.push(setTimeout(() => {
        setDisplay(Math.round((i / steps) * value));
      }, i * (700 / steps)));
    }
    return () => timers.forEach(clearTimeout);
  }, [value]);
  return (
    <View
      testID="social-proof-banner"
      style={{
        marginHorizontal: SPACING.lg,
        marginVertical: 6,
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: "rgba(59,130,246,0.05)",
        borderRadius: RADIUS.md,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: "rgba(59,130,246,0.10)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <TrendingUp size={16} color="#3B82F6" strokeWidth={2.5} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: FONTS.bold,
            fontSize: 15,
            color: C.dark,
            letterSpacing: -0.3,
          }}
        >
          {display} bokningar
        </Text>
        <Text
          style={{
            fontFamily: FONTS.regular,
            fontSize: 12,
            color: C.textTertiary,
            marginTop: 1,
          }}
        >
          delade denna vecka i {city}
        </Text>
      </View>
    </View>
  );
}

// --- Main Screen ---
export default function HomeScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<string>("Alla");
  const [selectedCity, setSelectedCity] = useState<string>("Stockholm");
  const [showCityPicker, setShowCityPicker] = useState<boolean>(false);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const phone = useAuthStore((s) => s.phoneNumber);

  // Generate days inside the component so dates refresh when the app is reopened after midnight
  const DAYS = useMemo(() => generateDays(), []);

  // Stable callbacks for child components
  const onCityPress = useCallback(() => setShowCityPicker(true), []);
  const onFAQPress = useCallback(() => router.push("/faq"), [router]);
  const onCreditsPress = useCallback(() => router.push("/credits"), [router]);
  const onMapPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/map");
  }, [router]);
  const onSearchToggle = useCallback(() => setShowSearch((v: boolean) => !v), []);
  const onSearchChange = useCallback((v: string) => setSearchQuery(v), []);
  const onDaySelect = useCallback((date: Date) => setSelectedDate(date), []);
  const onOpenCalendar = useCallback(() => setShowCalendar(true), []);
  const onFilterSelect = useCallback((filter: string) => setActiveFilter(filter), []);
  const onCalendarClose = useCallback(() => setShowCalendar(false), []);
  const onCitySelect = useCallback((city: string) => {
    setSelectedCity(city);
    setActiveFilter("");
    setShowCityPicker(false);
  }, []);
  const onCityPickerClose = useCallback(() => setShowCityPicker(false), []);

  // Fetch reservations from real API
  const {
    data: reservations = [],
    isLoading: reservationsLoading,
    isRefetching,
    refetch,
    error: reservationsError,
  } = useReservations({
    city: selectedCity,
    neighborhood: activeFilter === "Alla" ? undefined : activeFilter,
  });

  // Fetch profile to get credits
  const {
    data: profile,
    isLoading: profileLoading,
  } = useProfile(phone || "");

  // Memoized filtering for performance
  const filteredReservations = useMemo(() => {
    return reservations.filter((res: Reservation) => {
      if (activeFilter && activeFilter !== "Alla" && res.restaurant?.neighborhood !== activeFilter) return false;
      if (searchQuery) {
        return res.restaurant?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    });
  }, [reservations, activeFilter, searchQuery]);

  const isLoading = reservationsLoading || profileLoading;

  // Scroll-linked header animation
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerAnimStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, 40],
      [60, 48],
      Extrapolation.CLAMP
    );
    return { height, overflow: 'hidden' as const };
  });

  const subtitleAnimStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 20],
      [1, 0],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  // Memoize today's bookings to avoid recalculating on every render
  const todayBookings = useMemo(() => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    return filteredReservations.filter(
      (r: Reservation) => r.reservationDate === todayStr
    );
  }, [filteredReservations]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView
        edges={["top"]}
        style={{
          backgroundColor: C.bg,
          zIndex: 10,
        }}
      >
        <Animated.View style={headerAnimStyle}>
          <Header
            selectedCity={selectedCity}
            onCityPress={onCityPress}
            onFAQPress={onFAQPress}
            onCreditsPress={onCreditsPress}
            onMapPress={onMapPress}
            credits={profile?.credits ?? 0}
            isLoading={profileLoading}
            showSearch={showSearch}
            onSearchToggle={onSearchToggle}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
          />
        </Animated.View>
        <DayPicker
          selectedDate={selectedDate}
          onSelect={onDaySelect}
          onOpenCalendar={onOpenCalendar}
          days={DAYS}
        />
        <FilterChips active={activeFilter} onSelect={onFilterSelect} city={selectedCity} />
        
        {/* Hard break line right at categories bottom */}
        <View
          style={{
            height: 0.5,
            backgroundColor: C.divider,
            marginHorizontal: 0,
          }}
        />
      </SafeAreaView>

      <CalendarModal
        visible={showCalendar}
        selectedDate={selectedDate}
        onSelect={onDaySelect}
        onClose={onCalendarClose}
      />

      <CityPickerModal
        visible={showCityPicker}
        selectedCity={selectedCity}
        onSelect={onCitySelect}
        onClose={onCityPickerClose}
      />

      <Animated.FlatList
        testID="home-feed-scroll"
        data={isLoading || reservationsError ? [] : filteredReservations}
        keyExtractor={(item: Reservation) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            testID="home-refresh-control"
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={C.coral}
          />
        }
        ListHeaderComponent={
          <>
            {/* Nya bokningar idag section */}
            {todayBookings.length > 0 ? (
              <Animated.View
                testID="today-bookings-section"
                entering={FadeInDown.delay(100).springify()}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginHorizontal: SPACING.lg,
                  marginBottom: SPACING.sm,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  backgroundColor: "rgba(34,197,94,0.06)",
                  borderRadius: RADIUS.md,
                  borderWidth: 1,
                  borderColor: "rgba(34,197,94,0.12)",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <PulsingGreenDot size={9} />
                  <View>
                    <Text
                      style={{
                        fontFamily: FONTS.bold,
                        fontSize: 14,
                        color: C.dark,
                        letterSpacing: -0.2,
                      }}
                    >
                      Nya bokningar idag
                    </Text>
                    <Text
                      style={{
                        fontFamily: FONTS.regular,
                        fontSize: 11.5,
                        color: C.textTertiary,
                        marginTop: 1,
                      }}
                    >
                      Uppdateras löpande
                    </Text>
                  </View>
                </View>
                <View
                  style={{
                    backgroundColor: "#16A34A",
                    borderRadius: 12,
                    minWidth: 28,
                    height: 28,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 10,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONTS.bold,
                      fontSize: 13,
                      color: "#FFFFFF",
                    }}
                  >
                    {todayBookings.length}
                  </Text>
                </View>
              </Animated.View>
            ) : null}



            {/* Nya på Reslot — discovery section */}
            <NewOnReslotSection />

            {/* Du missade — loss aversion section */}
            <MissedBookingsSection city={selectedCity} />

            {/* Loading State - Skeleton Cards */}
            {isLoading ? (
              <View testID="skeleton-loading" style={{ paddingTop: 12 }}>
                {[0, 1, 2].map((i) => (
                  <SkeletonCard key={i} index={i} />
                ))}
              </View>
            ) : reservationsError ? (
              <View testID="error-state" style={{ alignItems: "center", justifyContent: "center", paddingTop: 60 }}>
                <AlertCircle size={40} color={C.coral} strokeWidth={ICON.strokeWidth} />
                <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: C.dark, marginTop: 12 }}>
                  Något gick fel
                </Text>
                <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textTertiary, marginTop: 4, textAlign: "center", paddingHorizontal: SPACING.lg }}>
                  Kunde inte hämta bokningar. Försök igen senare.
                </Text>
                <Pressable
                  testID="error-retry-button"
                  accessibilityLabel="Försök igen"
                  onPress={() => refetch()}
                  style={{
                    marginTop: 16,
                    backgroundColor: C.coral,
                    borderRadius: RADIUS.md,
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                  }}
                >
                  <Text style={{ fontFamily: FONTS.semiBold, fontSize: 14, color: "#111827" }}>
                    Försök igen
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </>
        }
        renderItem={({ item, index }: { item: Reservation; index: number }) => (
          <>
            <RestaurantCard
              reservation={item}
              index={index}
              isLast={index === filteredReservations.length - 1}
            />
            {index === 2 ? <CreditsBanner /> : null}
          </>
        )}
        ListEmptyComponent={
          !isLoading && !reservationsError ? (
            <Animated.View
              testID="empty-state"
              entering={FadeInDown.delay(100).springify()}
              style={{ alignItems: "center", justifyContent: "center", paddingTop: 40, paddingHorizontal: 24 }}
            >
              <Animated.View
                entering={ZoomIn.springify().delay(150)}
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 44,
                  backgroundColor: C.coralLight,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 24,
                }}
              >
                <UtensilsCrossed size={38} color={C.grayLight} strokeWidth={1.5} />
              </Animated.View>
              <Animated.View entering={FadeInDown.delay(220).springify()}>
                <Text
                  style={{
                    fontFamily: FONTS.displayBold,
                    fontSize: 22,
                    color: C.dark,
                    letterSpacing: -0.5,
                    textAlign: "center",
                  }}
                >
                  Inga bord just nu
                </Text>
              </Animated.View>
              <Animated.View entering={FadeInDown.delay(300).springify()}>
                <Text
                  style={{
                    fontFamily: FONTS.regular,
                    fontSize: 15,
                    color: C.textTertiary,
                    marginTop: 10,
                    textAlign: "center",
                    lineHeight: 22,
                  }}
                >
                  Nya bokningar dyker upp hela tiden.{"\n"}Bevaka en restaurang så pingar vi dig!
                </Text>
              </Animated.View>

              {/* Example cards showing what's possible */}
              <Animated.View entering={FadeInDown.delay(380).springify()} style={{ marginTop: 28, width: "100%", gap: 10 }}>
                <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, borderWidth: 0.5, borderColor: C.borderLight, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, opacity: 0.5, ...SHADOW.card }}>
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: C.bgInput }} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={{ width: 100, height: 12, borderRadius: 4, backgroundColor: C.bgInput }} />
                    <View style={{ width: 140, height: 10, borderRadius: 4, backgroundColor: C.bgInput }} />
                  </View>
                </View>
                <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, borderWidth: 0.5, borderColor: C.borderLight, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, opacity: 0.3, ...SHADOW.card }}>
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: C.bgInput }} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={{ width: 80, height: 12, borderRadius: 4, backgroundColor: C.bgInput }} />
                    <View style={{ width: 120, height: 10, borderRadius: 4, backgroundColor: C.bgInput }} />
                  </View>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(450).springify()}>
                <Pressable
                  testID="empty-state-cta"
                  accessibilityLabel="Bevaka restaurang"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push("/add-watch");
                  }}
                  style={{
                    marginTop: 24,
                    backgroundColor: C.coral,
                    borderRadius: RADIUS.md,
                    paddingVertical: 14,
                    paddingHorizontal: 28,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Eye size={16} color="#111827" strokeWidth={2} />
                  <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: "#111827" }}>
                    Bevaka restaurang
                  </Text>
                </Pressable>
              </Animated.View>
            </Animated.View>
          ) : null
        }
        ListFooterComponent={<View style={{ height: 32 }} />}
      />
    </View>
  );
}
