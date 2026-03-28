import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
} from "react-native";
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
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

const STATUS_CONFIG: Record<
  Reservation["status"],
  { label: string; color: string; bg: string }
> = {
  active: { label: "Aktiv", color: "#8B9E7E", bg: "rgba(139, 158, 126, 0.12)" },
  claimed: { label: "Övertagen", color: "#E06A4E", bg: "rgba(224, 106, 78, 0.10)" },
  expired: { label: "Utgången", color: "#9CA3AF", bg: "rgba(156, 163, 175, 0.10)" },
  cancelled: { label: "Avbokad", color: "#9CA3AF", bg: "rgba(156, 163, 175, 0.10)" },
};

function SegmentedControl({
  activeTab,
  onTabChange,
}: {
  activeTab: "submitted" | "claimed";
  onTabChange: (tab: "submitted" | "claimed") => void;
}) {
  return (
    <View
      className="mx-5 flex-row"
      style={{
        backgroundColor: "rgba(0,0,0,0.04)",
        borderRadius: 12,
        padding: 3,
      }}
    >
      <Pressable
        testID="tab-submitted"
        onPress={() => {
          onTabChange("submitted");
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        style={{
          flex: 1,
          paddingVertical: 10,
          borderRadius: 10,
          backgroundColor: activeTab === "submitted" ? "#FFFFFF" : "transparent",
          alignItems: "center",
          shadowColor: activeTab === "submitted" ? "#000" : "transparent",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: activeTab === "submitted" ? 0.06 : 0,
          shadowRadius: 4,
          elevation: activeTab === "submitted" ? 2 : 0,
        }}
      >
        <Text
          style={{
            fontFamily:
              activeTab === "submitted"
                ? "PlusJakartaSans_600SemiBold"
                : "PlusJakartaSans_500Medium",
            fontSize: 14,
            color: activeTab === "submitted" ? "#111827" : "#9CA3AF",
          }}
        >
          Upplagda
        </Text>
      </Pressable>
      <Pressable
        testID="tab-claimed"
        onPress={() => {
          onTabChange("claimed");
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        style={{
          flex: 1,
          paddingVertical: 10,
          borderRadius: 10,
          backgroundColor: activeTab === "claimed" ? "#FFFFFF" : "transparent",
          alignItems: "center",
          shadowColor: activeTab === "claimed" ? "#000" : "transparent",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: activeTab === "claimed" ? 0.06 : 0,
          shadowRadius: 4,
          elevation: activeTab === "claimed" ? 2 : 0,
        }}
      >
        <Text
          style={{
            fontFamily:
              activeTab === "claimed"
                ? "PlusJakartaSans_600SemiBold"
                : "PlusJakartaSans_500Medium",
            fontSize: 14,
            color: activeTab === "claimed" ? "#111827" : "#9CA3AF",
          }}
        >
          Övertagna
        </Text>
      </Pressable>
    </View>
  );
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
  const status = STATUS_CONFIG[reservation.status];
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
    <Animated.View entering={FadeInDown.delay(index * 70).duration(400).springify()}>
      <Pressable
        testID={`reservation-card-${reservation.id}`}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <Animated.View
          style={[
            animStyle,
            {
              marginHorizontal: 20,
              marginBottom: 12,
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              padding: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 2,
            },
          ]}
        >
          <View className="flex-row">
            {/* Left content */}
            <View style={{ flex: 1, marginRight: 14 }}>
              {/* Restaurant name + rating + cuisine */}
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <Text
                  style={{
                    fontFamily: "PlusJakartaSans_600SemiBold",
                    fontSize: 16,
                    color: "#111827",
                    letterSpacing: -0.2,
                  }}
                  numberOfLines={1}
                >
                  {restaurant.name}
                </Text>
              </View>

              <View className="flex-row items-center" style={{ marginTop: 4, gap: 4 }}>
                <Star size={11} color="#C9A96E" fill="#C9A96E" strokeWidth={0} />
                <Text
                  style={{
                    fontFamily: "PlusJakartaSans_600SemiBold",
                    fontSize: 12,
                    color: "#111827",
                  }}
                >
                  {restaurant.rating.toFixed(1)}
                </Text>
                <View
                  style={{
                    width: 3,
                    height: 3,
                    borderRadius: 1.5,
                    backgroundColor: "#D1D5DB",
                    marginHorizontal: 4,
                  }}
                />
                <Text
                  style={{
                    fontFamily: "PlusJakartaSans_400Regular",
                    fontSize: 12,
                    color: "#9CA3AF",
                  }}
                >
                  {restaurant.cuisine}
                </Text>
              </View>

              {/* Address */}
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_400Regular",
                  fontSize: 13,
                  color: "#9CA3AF",
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
                borderRadius: 12,
                backgroundColor: "#F0F0EE",
              }}
              resizeMode="cover"
            />
          </View>

          {/* Divider */}
          <View
            style={{
              height: 0.5,
              backgroundColor: "rgba(0,0,0,0.06)",
              marginTop: 14,
              marginBottom: 12,
            }}
          />

          {/* Detail row */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            <View className="flex-row items-center" style={{ gap: 5 }}>
              <CalendarDays size={13} color="#9CA3AF" strokeWidth={1.8} />
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_500Medium",
                  fontSize: 12,
                  color: "#6B7280",
                }}
              >
                {formatDate(reservation.reservationDate)}
              </Text>
            </View>
            <View className="flex-row items-center" style={{ gap: 5 }}>
              <Clock size={13} color="#9CA3AF" strokeWidth={1.8} />
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_500Medium",
                  fontSize: 12,
                  color: "#6B7280",
                }}
              >
                {formatTime(reservation.reservationTime)}
              </Text>
            </View>
            <View className="flex-row items-center" style={{ gap: 5 }}>
              <Users size={13} color="#9CA3AF" strokeWidth={1.8} />
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_500Medium",
                  fontSize: 12,
                  color: "#6B7280",
                }}
              >
                {reservation.partySize}
              </Text>
            </View>
            <View className="flex-row items-center" style={{ gap: 5 }}>
              <LayoutGrid size={13} color="#9CA3AF" strokeWidth={1.8} />
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_500Medium",
                  fontSize: 12,
                  color: "#6B7280",
                }}
              >
                {reservation.seatType}
              </Text>
            </View>
          </View>

          {/* Status badge */}
          <View style={{ marginTop: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View
              style={{
                alignSelf: "flex-start",
                backgroundColor: status.bg,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_600SemiBold",
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
                onPress={handleCancel}
                style={{
                  padding: 8,
                  borderRadius: 8,
                  backgroundColor: "rgba(224, 106, 78, 0.1)",
                }}
              >
                <Trash2 size={14} color="#E06A4E" strokeWidth={2} />
              </Pressable>
            )}
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

function EmptyState({ type }: { type: "submitted" | "claimed" }) {
  const isSubmitted = type === "submitted";
  return (
    <Animated.View
      entering={FadeInDown.delay(100).duration(400).springify()}
      className="items-center justify-center"
      style={{ paddingTop: 80, paddingHorizontal: 40 }}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 20,
          backgroundColor: "rgba(0,0,0,0.03)",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <BookOpen size={28} color="#D1D5DB" strokeWidth={1.5} />
      </View>
      <Text
        style={{
          fontFamily: "PlusJakartaSans_600SemiBold",
          fontSize: 16,
          color: "#111827",
          textAlign: "center",
          letterSpacing: -0.2,
        }}
      >
        {isSubmitted
          ? "Du har inga upplagda bokningar \u00e4nnu."
          : "Du har inga h\u00e4mtade bokningar \u00e4nnu."}
      </Text>
      <Text
        style={{
          fontFamily: "PlusJakartaSans_400Regular",
          fontSize: 14,
          color: "#9CA3AF",
          textAlign: "center",
          marginTop: 8,
          lineHeight: 20,
        }}
      >
        {isSubmitted
          ? "L\u00e4gg upp din f\u00f6rsta bokning f\u00f6r att komma ig\u00e5ng."
          : "H\u00e4mta din f\u00f6rsta bokning f\u00f6r att komma ig\u00e5ng."}
      </Text>
    </Animated.View>
  );
}

export default function ReservationsScreen() {
  const [activeTab, setActiveTab] = useState<"submitted" | "claimed">("submitted");
  const isGuest = useAuthStore((s) => s.isGuest);
  const phone = useAuthStore((s) => s.phoneNumber);

  // Fetch user's reservations
  const {
    data: allReservations = [],
    isLoading,
    error,
  } = useMyReservations(phone || "test@reslot.se");

  // Cancel mutation
  const cancelMutation = useCancelReservation();

  const filteredReservations = useMemo(() => {
    if (activeTab === "submitted") {
      return allReservations.filter((r: Reservation) => r.submitterPhone === phone);
    } else {
      return allReservations.filter((r: Reservation) => r.claimerPhone === phone);
    }
  }, [allReservations, activeTab, phone]);

  const handleCancel = useCallback(
    async (reservationId: string) => {
      try {
        await cancelMutation.mutateAsync(reservationId);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (err) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
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
    <View style={{ flex: 1, backgroundColor: "#FAFAF8" }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#FAFAF8" }}>
        <View className="px-5 pt-2 pb-4">
          <Text
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              fontSize: 26,
              color: "#111827",
              letterSpacing: -0.8,
            }}
          >
            Mina bokningar
          </Text>
          <Text
            style={{
              fontFamily: "PlusJakartaSans_400Regular",
              fontSize: 13,
              color: "#9CA3AF",
              marginTop: 4,
            }}
          >
            {allReservations.length} bokningar totalt
          </Text>
        </View>
        <SegmentedControl activeTab={activeTab} onTabChange={setActiveTab} />
      </SafeAreaView>

      <ScrollView
        testID="reservations-scroll"
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 16 }}
      >
        {isLoading ? (
          <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 60 }}>
            <ActivityIndicator size="large" color="#E06A4E" />
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: "#9CA3AF", marginTop: 12 }}>
              Hämtar dina bokningar...
            </Text>
          </View>
        ) : error ? (
          <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 60 }}>
            <AlertCircle size={40} color="#E06A4E" strokeWidth={1.5} />
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: "#111827", marginTop: 12 }}>
              Något gick fel
            </Text>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: "#9CA3AF", marginTop: 4, textAlign: "center", paddingHorizontal: 20 }}>
              Kunde inte hämta dina bokningar. Försök igen senare.
            </Text>
          </View>
        ) : filteredReservations.length > 0 ? (
          filteredReservations.map((reservation: Reservation, index: number) => (
            <ReservationCard
              key={reservation.id}
              reservation={reservation}
              index={index}
              onCancel={handleCancel}
            />
          ))
        ) : (
          <EmptyState type={activeTab} />
        )}
      </ScrollView>
    </View>
  );
}
