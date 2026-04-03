import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft, Navigation, MapPin, Star, ChevronRight } from "lucide-react-native";
import { Image } from "expo-image";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import MapView, { Marker, Callout, PROVIDER_DEFAULT } from "react-native-maps";
import * as Haptics from "expo-haptics";
import { useRestaurants } from "@/lib/api/hooks";
import { useAuthStore } from "@/lib/auth-store";
import type { Restaurant } from "@/lib/api/types";
import { C, FONTS, SPACING, RADIUS, SHADOW } from "@/lib/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Stockholm default region
const STOCKHOLM_REGION = {
  latitude: 59.3293,
  longitude: 18.0686,
  latitudeDelta: 0.06,
  longitudeDelta: 0.06,
};

const CITY_REGIONS: Record<string, typeof STOCKHOLM_REGION> = {
  Stockholm: STOCKHOLM_REGION,
  Göteborg: { latitude: 57.7089, longitude: 11.9746, latitudeDelta: 0.06, longitudeDelta: 0.06 },
  Malmö: { latitude: 55.6050, longitude: 13.0038, latitudeDelta: 0.06, longitudeDelta: 0.06 },
  Uppsala: { latitude: 59.8586, longitude: 17.6389, latitudeDelta: 0.06, longitudeDelta: 0.06 },
};

export default function MapScreen() {
  const router = useRouter();
  const selectedCity = useAuthStore((s) => s.selectedCity);
  const mapRef = useRef<MapView>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  const { data: restaurants = [], isLoading } = useRestaurants({ city: selectedCity });

  // Filter restaurants that have lat/lng
  const mappableRestaurants = useMemo(
    () => restaurants.filter((r: Restaurant) => r.latitude != null && r.longitude != null),
    [restaurants]
  );

  const initialRegion = CITY_REGIONS[selectedCity] ?? STOCKHOLM_REGION;

  const handleMarkerPress = useCallback((restaurant: Restaurant) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedRestaurant(restaurant);
  }, []);

  const handleCardPress = useCallback(() => {
    if (!selectedRestaurant) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/restaurant/${selectedRestaurant.id}`);
  }, [selectedRestaurant, router]);

  const handleMapPress = useCallback(() => {
    setSelectedRestaurant(null);
  }, []);

  const handleRecenter = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    mapRef.current?.animateToRegion(initialRegion, 500);
  }, [initialRegion]);

  return (
    <View style={styles.container} testID="map-screen">
      {/* Map */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={initialRegion}
        provider={PROVIDER_DEFAULT}
        showsUserLocation
        showsMyLocationButton={false}
        onPress={handleMapPress}
        mapType="standard"
      >
        {mappableRestaurants.map((restaurant: Restaurant) => (
          <Marker
            key={restaurant.id}
            coordinate={{
              latitude: restaurant.latitude!,
              longitude: restaurant.longitude!,
            }}
            onPress={() => handleMarkerPress(restaurant)}
          >
            <View
              style={[
                styles.markerContainer,
                selectedRestaurant?.id === restaurant.id && styles.markerSelected,
              ]}
            >
              <MapPin
                size={16}
                color={selectedRestaurant?.id === restaurant.id ? "#FFFFFF" : C.coral}
                strokeWidth={2.5}
                fill={selectedRestaurant?.id === restaurant.id ? "#FFFFFF" : "transparent"}
              />
            </View>
            <View style={styles.markerTail} />
          </Marker>
        ))}
      </MapView>

      {/* Header overlay */}
      <SafeAreaView edges={["top"]} style={styles.headerSafe}>
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={styles.headerButton}
            testID="map-back-button"
            accessibilityLabel="Gå tillbaka"
          >
            <ArrowLeft size={20} color={C.dark} strokeWidth={2.5} />
          </Pressable>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Karta</Text>
            <Text style={styles.headerSubtitle}>
              {mappableRestaurants.length} restauranger i {selectedCity}
            </Text>
          </View>

          <Pressable
            onPress={handleRecenter}
            style={styles.headerButton}
            testID="map-recenter-button"
            accessibilityLabel="Centrera karta"
          >
            <Navigation size={18} color={C.dark} strokeWidth={2.5} />
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Loading overlay */}
      {isLoading ? (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingPill}>
            <ActivityIndicator size="small" color={C.coral} />
            <Text style={styles.loadingText}>Laddar restauranger...</Text>
          </View>
        </View>
      ) : null}

      {/* Selected restaurant card */}
      {selectedRestaurant ? (
        <Animated.View
          entering={FadeInDown.springify().damping(14)}
          style={styles.cardContainer}
        >
          <Pressable
            testID="map-restaurant-card"
            accessibilityLabel={`Visa ${selectedRestaurant.name}`}
            onPress={handleCardPress}
            style={({ pressed }) => [
              styles.card,
              { transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
          >
            <Image
              source={{ uri: selectedRestaurant.image }}
              style={styles.cardImage}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
            <View style={styles.cardContent}>
              <Text style={styles.cardName} numberOfLines={1}>
                {selectedRestaurant.name}
              </Text>
              <View style={styles.cardMeta}>
                <Star size={12} color={C.gold} fill={C.gold} strokeWidth={0} />
                <Text style={styles.cardRating}>{selectedRestaurant.rating.toFixed(1)}</Text>
                <View style={styles.cardDot} />
                <Text style={styles.cardCuisine} numberOfLines={1}>
                  {selectedRestaurant.cuisine}
                </Text>
              </View>
              <Text style={styles.cardAddress} numberOfLines={1}>
                {selectedRestaurant.address}
              </Text>
              {selectedRestaurant.timesBookedOnReslot > 0 ? (
                <View style={styles.cardBookedBadge}>
                  <Text style={styles.cardBookedText}>
                    {selectedRestaurant.timesBookedOnReslot}x bokad på Reslot
                  </Text>
                </View>
              ) : null}
            </View>
            <View style={styles.cardArrow}>
              <ChevronRight size={18} color={C.textTertiary} strokeWidth={2} />
            </View>
          </Pressable>
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
  headerSafe: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.92)",
    alignItems: "center",
    justifyContent: "center",
    ...SHADOW.card,
  },
  headerTitleContainer: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: RADIUS.full,
    paddingHorizontal: 18,
    paddingVertical: 8,
    ...SHADOW.card,
  },
  headerTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 15,
    color: C.dark,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: C.textTertiary,
    marginTop: 1,
  },
  loadingOverlay: {
    position: "absolute",
    top: 120,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 5,
  },
  loadingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: RADIUS.full,
    paddingHorizontal: 18,
    paddingVertical: 10,
    ...SHADOW.elevated,
  },
  loadingText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: C.textSecondary,
  },
  markerContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: C.coral,
    ...SHADOW.card,
  },
  markerSelected: {
    backgroundColor: C.coral,
    borderColor: C.coral,
    transform: [{ scale: 1.15 }],
  },
  markerTail: {
    width: 8,
    height: 8,
    backgroundColor: C.coral,
    transform: [{ rotate: "45deg" }],
    alignSelf: "center",
    marginTop: -5,
  },
  cardContainer: {
    position: "absolute",
    bottom: 40,
    left: SPACING.lg,
    right: SPACING.lg,
    zIndex: 20,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: RADIUS.xl,
    overflow: "hidden",
    ...SHADOW.elevated,
  },
  cardImage: {
    width: 100,
    height: 110,
    backgroundColor: C.bgInput,
  },
  cardContent: {
    flex: 1,
    padding: 14,
    justifyContent: "center",
  },
  cardName: {
    fontFamily: FONTS.displayBold,
    fontSize: 16,
    color: C.dark,
    letterSpacing: -0.3,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  cardRating: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    color: C.gold,
  },
  cardDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: C.textTertiary,
  },
  cardCuisine: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: C.textSecondary,
    flex: 1,
  },
  cardAddress: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: C.textTertiary,
    marginTop: 3,
  },
  cardBookedBadge: {
    backgroundColor: C.coralLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  cardBookedText: {
    fontFamily: FONTS.semiBold,
    fontSize: 10,
    color: C.coral,
    letterSpacing: -0.1,
  },
  cardArrow: {
    alignItems: "center",
    justifyContent: "center",
    paddingRight: 12,
  },
});
