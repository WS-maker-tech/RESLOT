import React from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Heart, MapPin, Trash2 } from "lucide-react-native";
import { Image } from "expo-image";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useSavedRestaurants, useUnsaveRestaurant } from "@/lib/api/hooks";
import { useAuthStore } from "@/lib/auth-store";
import { C, FONTS, SPACING, RADIUS, SHADOW } from "@/lib/theme";
import { Skeleton } from "@/components/Skeleton";
import type { SavedRestaurant } from "@/lib/api/types";

export default function SavedScreen() {
  const router = useRouter();
  const phone = useAuthStore((s) => s.phoneNumber);
  const { data: saved = [], isLoading } = useSavedRestaurants(phone ?? "");
  const unsaveMutation = useUnsaveRestaurant();

  const handleUnsave = (restaurantId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    unsaveMutation.mutate(restaurantId);
  };

  const handleRestaurantPress = (restaurantId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/restaurant/${restaurantId}`);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: C.bg }}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
          <Pressable
            testID="back-button"
            accessibilityLabel="Gå tillbaka"
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.overlayLight, alignItems: "center", justifyContent: "center", marginRight: 12 }}
          >
            <ChevronLeft size={20} color={C.textSecondary} strokeWidth={2} />
          </Pressable>
          <Text style={{ fontFamily: FONTS.displayBold, fontSize: 20, color: C.textPrimary, letterSpacing: -0.4, flex: 1 }}>
            Sparade restauranger
          </Text>
          <Heart size={20} color={C.coral} fill={saved.length > 0 ? C.coral : "transparent"} strokeWidth={2} />
        </View>
      </SafeAreaView>

      {isLoading ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 8, gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} width="100%" height={80} style={{ borderRadius: RADIUS.lg }} />
          ))}
        </View>
      ) : saved.length === 0 ? (
        <Animated.View entering={FadeInDown.springify()} style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 }}>
          <View style={{ width: 64, height: 64, borderRadius: 24, backgroundColor: C.coralLight, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <Heart size={28} color={C.coral} strokeWidth={2} />
          </View>
          <Text style={{ fontFamily: FONTS.displayBold, fontSize: 18, color: C.textPrimary, textAlign: "center", letterSpacing: -0.3 }}>
            Inga sparade restauranger
          </Text>
          <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textTertiary, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
            Tryck på hjärtat på en restaurangsida för att spara den här.
          </Text>
        </Animated.View>
      ) : (
        <FlatList
          testID="saved-list"
          data={saved}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 100 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item, index }: { item: SavedRestaurant; index: number }) => (
            <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
              <Pressable
                testID={`saved-restaurant-${item.restaurantId}`}
                accessibilityLabel={`Öppna ${item.restaurant.name}`}
                onPress={() => handleRestaurantPress(item.restaurantId)}
                style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, borderWidth: 0.5, borderColor: C.borderLight, flexDirection: "row", alignItems: "center", overflow: "hidden", ...SHADOW.card }}
              >
                <Image
                  source={{ uri: item.restaurant.image }}
                  style={{ width: 80, height: 80 }}
                  contentFit="cover"
                />
                <View style={{ flex: 1, paddingHorizontal: 14, paddingVertical: 12 }}>
                  <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: C.textPrimary, letterSpacing: -0.2 }} numberOfLines={1}>
                    {item.restaurant.name}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 }}>
                    <MapPin size={12} color={C.textTertiary} strokeWidth={2} />
                    <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textTertiary }} numberOfLines={1}>
                      {item.restaurant.neighborhood}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textSecondary, marginTop: 2 }} numberOfLines={1}>
                    {item.restaurant.cuisine}
                  </Text>
                </View>
                <Pressable
                  testID={`unsave-${item.restaurantId}`}
                  accessibilityLabel={`Ta bort ${item.restaurant.name} från sparade`}
                  onPress={() => handleUnsave(item.restaurantId)}
                  style={{ padding: 16 }}
                >
                  <Trash2 size={18} color={C.coral} strokeWidth={2} />
                </Pressable>
              </Pressable>
            </Animated.View>
          )}
        />
      )}
    </View>
  );
}
