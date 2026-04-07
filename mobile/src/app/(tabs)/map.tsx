import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  Platform,
  Dimensions,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { MapPin, X, ChevronRight, Users, Clock } from "lucide-react-native";
import Animated, { FadeInDown, FadeIn, FadeOut } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { useReservations } from "@/lib/api/hooks";
import { useAuthStore } from "@/lib/auth-store";
import { C, FONTS, SPACING, RADIUS, SHADOW } from "@/lib/theme";
import { WebMap } from "@/components/WebMap";
import type { Reservation, Restaurant } from "@/lib/api/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const CITY_CENTERS: Record<string, [number, number]> = {
  Stockholm: [59.3293, 18.0686],
  Göteborg: [57.7089, 11.9746],
  Malmö: [55.605, 13.0038],
  Uppsala: [59.8586, 17.6389],
};

const CITIES = Object.keys(CITY_CENTERS);

interface RestaurantGroup {
  restaurant: Restaurant;
  reservations: Reservation[];
  nextTime: string;
  nextDate: string;
  minPartySize: number;
}

function groupByRestaurant(reservations: Reservation[]): RestaurantGroup[] {
  const map = new Map<string, Reservation[]>();

  for (const r of reservations) {
    if (r.status !== "active") continue;
    if (!r.restaurant.latitude || !r.restaurant.longitude) continue;

    const key = r.restaurant.id;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }

  const groups: RestaurantGroup[] = [];
  for (const [, rsvps] of map) {
    const sorted = rsvps.sort((a, b) => {
      const da = new Date(`${a.reservationDate}T${a.reservationTime}`);
      const db = new Date(`${b.reservationDate}T${b.reservationTime}`);
      return da.getTime() - db.getTime();
    });

    const first = sorted[0];
    groups.push({
      restaurant: first.restaurant,
      reservations: sorted,
      nextTime: first.reservationTime.slice(0, 5),
      nextDate: first.reservationDate,
      minPartySize: first.partySize,
    });
  }

  return groups;
}

function formatDateSv(dateStr: string): string {
  const today = new Date();
  const d = new Date(dateStr);
  const todayStr = today.toISOString().slice(0, 10);
  const tomorrowDate = new Date(today);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().slice(0, 10);

  if (dateStr === todayStr) return "Idag";
  if (dateStr === tomorrowStr) return "Imorgon";

  const days = ["Sön", "Mån", "Tis", "Ons", "Tor", "Fre", "Lör"];
  return `${days[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
}

export default function MapScreen() {
  const selectedCity = useAuthStore((s) => s.selectedCity);
  const [activeCity, setActiveCity] = useState(selectedCity || "Stockholm");
  const [selectedGroup, setSelectedGroup] = useState<RestaurantGroup | null>(null);
  const router = useRouter();

  const { data: reservations = [] } = useReservations({ city: activeCity });

  const groups = useMemo(
    () => groupByRestaurant(reservations as Reservation[]),
    [reservations]
  );

  const markers = useMemo(
    () =>
      groups.map((g) => ({
        id: g.restaurant.id,
        lat: g.restaurant.latitude!,
        lng: g.restaurant.longitude!,
        image: g.restaurant.image,
        name: g.restaurant.name,
      })),
    [groups]
  );

  const center = CITY_CENTERS[activeCity] ?? CITY_CENTERS.Stockholm;

  const handleMarkerPress = useCallback(
    (restaurantId: string) => {
      const group = groups.find((g) => g.restaurant.id === restaurantId);
      if (group) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedGroup(group);
      }
    },
    [groups]
  );

  const handleViewReservation = useCallback(() => {
    if (!selectedGroup) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/restaurant/${selectedGroup.reservations[0].id}`);
    setSelectedGroup(null);
  }, [selectedGroup, router]);

  if (Platform.OS !== "web") {
    return (
      <SafeAreaView edges={["top"]} style={styles.container}>
        <View style={styles.nativePlaceholder}>
          <View style={styles.nativeIconCircle}>
            <MapPin size={32} color={C.pistachio} strokeWidth={1.8} />
          </View>
          <Text style={styles.nativeTitle}>Karta kommer snart</Text>
          <Text style={styles.nativeSubtitle}>
            Vi jobbar på en kartvy för appen.{"\n"}Tills dess, hitta bord via Hem-fliken.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container} testID="map-screen">
      {/* Map fills entire screen */}
      <WebMap
        center={center}
        zoom={13}
        markers={markers}
        onMarkerPress={handleMarkerPress}
        style={styles.map}
      />

      {/* Header overlay */}
      <SafeAreaView edges={["top"]} style={styles.headerOverlay} pointerEvents="box-none">
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>Karta</Text>

          {/* City pills */}
          <View style={styles.cityRow}>
            {CITIES.map((city) => {
              const isActive = city === activeCity;
              return (
                <Pressable
                  key={city}
                  testID={`city-pill-${city}`}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveCity(city);
                    setSelectedGroup(null);
                  }}
                  style={[
                    styles.cityPill,
                    isActive && styles.cityPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.cityPillText,
                      isActive && styles.cityPillTextActive,
                    ]}
                  >
                    {city}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </SafeAreaView>

      {/* Empty state */}
      {groups.length === 0 ? (
        <View style={styles.emptyOverlay} pointerEvents="none">
          <Animated.View entering={FadeInDown.springify()} style={styles.emptyCard}>
            <MapPin size={24} color={C.textTertiary} strokeWidth={1.8} />
            <Text style={styles.emptyText}>Inga tillgängliga bord just nu</Text>
          </Animated.View>
        </View>
      ) : null}

      {/* Bottom sheet popup */}
      {selectedGroup ? (
        <Animated.View
          entering={FadeInDown.springify().damping(18)}
          exiting={FadeOut.duration(150)}
          style={styles.popupContainer}
        >
          <View style={styles.popup}>
            {/* Close button */}
            <Pressable
              testID="popup-close"
              onPress={() => setSelectedGroup(null)}
              style={styles.closeBtn}
              hitSlop={12}
            >
              <X size={18} color={C.textSecondary} strokeWidth={2} />
            </Pressable>

            {/* Restaurant image */}
            <Image
              source={{ uri: selectedGroup.restaurant.image }}
              style={styles.popupImage}
              contentFit="cover"
            />

            {/* Info */}
            <View style={styles.popupInfo}>
              <Text style={styles.popupName} numberOfLines={1}>
                {selectedGroup.restaurant.name}
              </Text>

              <View style={styles.popupMeta}>
                <View style={styles.metaChip}>
                  <Clock size={13} color={C.pistachio} strokeWidth={2} />
                  <Text style={styles.metaText}>
                    {formatDateSv(selectedGroup.nextDate)} {selectedGroup.nextTime}
                  </Text>
                </View>
                <View style={styles.metaChip}>
                  <Users size={13} color={C.pistachio} strokeWidth={2} />
                  <Text style={styles.metaText}>
                    {selectedGroup.minPartySize} pers
                  </Text>
                </View>
                {selectedGroup.reservations.length > 1 ? (
                  <View style={[styles.metaChip, { backgroundColor: "rgba(126,200,122,0.12)" }]}>
                    <Text style={[styles.metaText, { color: C.pistachio }]}>
                      +{selectedGroup.reservations.length - 1} bord
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* CTA */}
              <Pressable
                testID="popup-cta"
                onPress={handleViewReservation}
                style={({ pressed }) => [
                  styles.ctaBtn,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Text style={styles.ctaText}>Visa bord</Text>
                <ChevronRight size={16} color="#FFFFFF" strokeWidth={2.5} />
              </Pressable>
            </View>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  map: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  // Header
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerCard: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingTop: 14,
    paddingBottom: 12,
    ...SHADOW.elevated,
  },
  headerTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 22,
    color: C.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  cityRow: {
    flexDirection: "row",
    gap: 8,
  },
  cityPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  cityPillActive: {
    backgroundColor: C.dark,
  },
  cityPillText: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: C.textSecondary,
  },
  cityPillTextActive: {
    color: "#FFFFFF",
  },

  // Native placeholder
  nativePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  nativeIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(126,200,122,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  nativeTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 22,
    color: C.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  nativeSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: C.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },

  // Empty
  emptyOverlay: {
    position: "absolute",
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 5,
  },
  emptyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: RADIUS.full,
    ...SHADOW.card,
  },
  emptyText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: C.textSecondary,
  },

  // Popup
  popupContainer: {
    position: "absolute",
    bottom: 90,
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 20,
  },
  popup: {
    backgroundColor: C.bgCard,
    borderRadius: RADIUS.xl,
    overflow: "hidden",
    ...SHADOW.elevated,
  },
  closeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  popupImage: {
    width: "100%",
    height: 140,
  },
  popupInfo: {
    padding: SPACING.md,
  },
  popupName: {
    fontFamily: FONTS.displayBold,
    fontSize: 19,
    color: C.textPrimary,
    letterSpacing: -0.4,
  },
  popupMeta: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    flexWrap: "wrap",
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.04)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  metaText: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: C.textPrimary,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: C.pistachio,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    marginTop: 14,
  },
  ctaText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
});
