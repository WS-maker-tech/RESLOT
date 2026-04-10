import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  FlatList,
  Keyboard,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Search, X, Check, Bell, Users, Calendar } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { useAddWatch, useRestaurants } from "@/lib/api/hooks";
import { useAuthStore } from "@/lib/auth-store";
import type { WatchFilterOptions } from "@/lib/api/types";
import { C, FONTS, SPACING, RADIUS, ICON } from "@/lib/theme";

const WEEKDAY_LABELS = ["Alla", "Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];
const PARTY_SIZES = [1, 2, 3, 4, 5, 6, 7, 8];

export default function AddWatchScreen() {
  const router = useRouter();
  const phone = useAuthStore((s) => s.phoneNumber);
  const { data: restaurants = [] } = useRestaurants();
  const { mutate: addWatch, isPending } = useAddWatch();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [selectedPartySize, setSelectedPartySize] = useState<number | null>(null);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);

  const filteredRestaurants = useMemo(() => {
    if (!searchQuery.trim()) return restaurants;
    const q = searchQuery.toLowerCase();
    return restaurants.filter((r: any) => r.name.toLowerCase().includes(q));
  }, [restaurants, searchQuery]);

  const selectedRestaurant = useMemo(
    () => restaurants.find((r: any) => r.id === selectedRestaurantId),
    [restaurants, selectedRestaurantId]
  );

  const toggleWeekday = (day: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedRestaurantId(id === selectedRestaurantId ? null : id);
    Keyboard.dismiss();
  };

  const handleAdd = () => {
    if (!phone || !selectedRestaurantId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const filterOptions: WatchFilterOptions = {};
    if (selectedWeekdays.length > 0) filterOptions.weekdays = selectedWeekdays;
    if (selectedPartySize) filterOptions.partySize = selectedPartySize;
    const hasFilters = Object.keys(filterOptions).length > 0;

    addWatch(
      {
        userPhone: phone,
        restaurantId: selectedRestaurantId,
        partySize: selectedPartySize ?? undefined,
        filterOptions: hasFilters ? filterOptions : undefined,
      },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.back();
        },
      }
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: C.bg }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14 }}>
          <Pressable
            testID="back-button"
            accessibilityLabel="Gå tillbaka"
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.04)", alignItems: "center", justifyContent: "center", marginRight: 12 }}
          >
            <ChevronLeft size={20} color={C.textSecondary} strokeWidth={2} />
          </Pressable>
          <Text style={{ fontFamily: FONTS.displayBold, fontSize: 20, color: C.textPrimary, letterSpacing: -0.4, flex: 1 }}>
            Bevaka restaurang
          </Text>
        </View>

        {/* Search bar */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: C.bgCard,
            borderRadius: RADIUS.md,
            paddingHorizontal: 14,
            height: 48,
            borderWidth: 1,
            borderColor: searchQuery ? C.coral : C.borderLight,
          }}>
            <Search size={17} color={C.textTertiary} strokeWidth={2} />
            <TextInput
              testID="restaurant-search"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Sök restaurangnamn..."
              placeholderTextColor={C.textTertiary}
              autoFocus
              style={{
                flex: 1,
                fontFamily: FONTS.regular,
                fontSize: 15,
                color: C.textPrimary,
                marginLeft: 10,
              }}
            />
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
                <X size={16} color={C.textTertiary} strokeWidth={2} />
              </Pressable>
            ) : null}
          </View>
          <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textTertiary, marginTop: 8, lineHeight: 18 }}>
            Du får en notis så fort restaurangen dyker upp bland tillgängliga bord.
          </Text>
        </View>
      </SafeAreaView>

      {/* Filters (visas direkt under sök) */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
        {/* Veckodagar */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Calendar size={13} color={C.textTertiary} strokeWidth={2} />
          <Text style={{ fontFamily: FONTS.semiBold, fontSize: 11, color: C.textTertiary, letterSpacing: 0.8, textTransform: "uppercase" }}>Veckodag</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {WEEKDAY_LABELS.map((label, index) => {
            const isSelected = selectedWeekdays.includes(index);
            return (
              <Pressable
                key={label}
                testID={`weekday-${index}`}
                accessibilityLabel={label}
                onPress={() => toggleWeekday(index)}
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: isSelected ? C.pistachio : C.bgCard,
                  borderWidth: 0.5,
                  borderColor: isSelected ? C.pistachio : C.borderLight,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontFamily: FONTS.semiBold, fontSize: 12, color: isSelected ? C.dark : C.textSecondary }}>{label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Antal personer */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Users size={13} color={C.textTertiary} strokeWidth={2} />
          <Text style={{ fontFamily: FONTS.semiBold, fontSize: 11, color: C.textTertiary, letterSpacing: 0.8, textTransform: "uppercase" }}>Sällskap</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, marginBottom: 16, flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
          <Pressable
            testID="party-size-any"
            accessibilityLabel="Valfritt antal"
            onPress={() => { setSelectedPartySize(null); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: !selectedPartySize ? C.pistachio : C.bgCard, borderWidth: 0.5, borderColor: !selectedPartySize ? C.pistachio : C.borderLight }}
          >
            <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: !selectedPartySize ? C.dark : C.textSecondary }}>Alla</Text>
          </Pressable>
          {PARTY_SIZES.map((size) => {
            const isSelected = selectedPartySize === size;
            return (
              <Pressable
                key={size}
                testID={`party-size-${size}`}
                accessibilityLabel={`${size} personer`}
                onPress={() => { setSelectedPartySize(isSelected ? null : size); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={{ width: 44, height: 36, borderRadius: RADIUS.full, backgroundColor: isSelected ? C.pistachio : C.bgCard, borderWidth: 0.5, borderColor: isSelected ? C.pistachio : C.borderLight, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ fontFamily: FONTS.semiBold, fontSize: 14, color: isSelected ? C.dark : C.textSecondary }}>{size}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={{ height: 0.5, backgroundColor: C.borderLight, marginBottom: 12 }} />
      </View>

      {/* Restaurant list */}
      <FlatList
        data={filteredRestaurants}
        keyExtractor={(item: any) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          searchQuery ? (
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textTertiary }}>
                Inga restauranger matchar "{searchQuery}"
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item: restaurant, index }: { item: any; index: number }) => {
          const isSelected = selectedRestaurantId === restaurant.id;
          return (
            <Animated.View entering={FadeInDown.delay(index * 40).springify()}>
              <Pressable
                testID={`restaurant-${restaurant.id}`}
                accessibilityLabel={`Välj ${restaurant.name}`}
                onPress={() => handleSelect(restaurant.id)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: isSelected ? "rgba(126,200,122,0.08)" : C.bgCard,
                  borderRadius: RADIUS.md,
                  padding: 12,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: isSelected ? C.pistachio : C.borderLight,
                }}
              >
                <Image
                  source={{ uri: restaurant.image }}
                  style={{ width: 52, height: 52, borderRadius: 10, backgroundColor: C.bgInput, marginRight: 12 }}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: C.textPrimary, letterSpacing: -0.2 }} numberOfLines={1}>
                    {restaurant.name}
                  </Text>
                  <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textTertiary, marginTop: 2 }} numberOfLines={1}>
                    {restaurant.address}
                  </Text>
                </View>
                <View style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: isSelected ? C.pistachio : "rgba(0,0,0,0.04)",
                  alignItems: "center",
                  justifyContent: "center",
                  marginLeft: 10,
                }}>
                  {isSelected ? (
                    <Animated.View entering={ZoomIn.springify()}>
                      <Check size={15} color={C.dark} strokeWidth={2.5} />
                    </Animated.View>
                  ) : null}
                </View>
              </Pressable>
            </Animated.View>
          );
        }}
      />

      {/* Bottom CTA */}
      {selectedRestaurant ? (
        <Animated.View
          entering={FadeInDown.springify()}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: C.bg,
            borderTopWidth: 0.5,
            borderTopColor: C.borderLight,
            paddingHorizontal: 20,
            paddingTop: 14,
            paddingBottom: 32,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <Bell size={15} color={C.pistachio} strokeWidth={2} />
            <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: C.textSecondary }}>
              Bevakar <Text style={{ color: C.textPrimary, fontFamily: FONTS.semiBold }}>{selectedRestaurant.name}</Text>
            </Text>
          </View>
          <Pressable
            testID="add-watch-submit"
            accessibilityLabel="Aktivera bevakning"
            onPress={handleAdd}
            disabled={isPending}
            style={{
              backgroundColor: C.pistachio,
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: "center",
              shadowColor: C.pistachio,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 10,
            }}
          >
            {isPending ? (
              <ActivityIndicator color={C.dark} />
            ) : (
              <Text style={{ fontFamily: FONTS.bold, fontSize: 16, color: C.dark, letterSpacing: -0.2 }}>
                Aktivera bevakning
              </Text>
            )}
          </Pressable>
        </Animated.View>
      ) : null}
    </View>
  );
}
