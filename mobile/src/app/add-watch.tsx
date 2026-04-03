import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Clock, Calendar, Users } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useAddWatch, useRestaurants } from "@/lib/api/hooks";
import { useAuthStore } from "@/lib/auth-store";
import type { WatchFilterOptions } from "@/lib/api/types";
import { C, FONTS, SPACING, RADIUS, ICON } from "@/lib/theme";

const WEEKDAY_LABELS = ["Sön", "Mån", "Tis", "Ons", "Tor", "Fre", "Lör"];
const TIME_PRESETS = [
  { label: "Lunch (11–14)", range: ["11:00", "14:00"] as [string, string] },
  { label: "Kväll (18–22)", range: ["18:00", "22:00"] as [string, string] },
  { label: "Sen kväll (21–00)", range: ["21:00", "23:59"] as [string, string] },
];
const PARTY_SIZES = [1, 2, 3, 4, 5, 6, 7, 8];

export default function AddWatchScreen() {
  const router = useRouter();
  const phone = useAuthStore((s) => s.phoneNumber);
  const { data: restaurants = [] } = useRestaurants();
  const { mutate: addWatch, isPending } = useAddWatch();

  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  // Smart filter state
  const [selectedTimeRange, setSelectedTimeRange] = useState<[string, string] | null>(null);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [selectedPartySize, setSelectedPartySize] = useState<number | null>(null);

  const toggleWeekday = (day: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleAdd = () => {
    if (!phone) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const filterOptions: WatchFilterOptions = {};
    if (selectedTimeRange) filterOptions.timeRange = selectedTimeRange;
    if (selectedWeekdays.length > 0) filterOptions.weekdays = selectedWeekdays;
    if (selectedPartySize) filterOptions.partySize = selectedPartySize;

    const hasFilters = Object.keys(filterOptions).length > 0;

    addWatch({
      userPhone: phone,
      restaurantId: selectedRestaurantId ?? undefined,
      date: date || undefined,
      partySize: selectedPartySize ?? undefined,
      notes: notes || undefined,
      filterOptions: hasFilters ? filterOptions : undefined,
    }, {
      onSuccess: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      },
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: C.bg }}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
          <Pressable testID="back-button" accessibilityLabel="Gå tillbaka" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.04)", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
            <ChevronLeft size={20} color={C.textSecondary} strokeWidth={2} />
          </Pressable>
          <Text style={{ fontFamily: FONTS.displayBold, fontSize: 20, color: C.textPrimary, letterSpacing: -0.4, flex: 1 }}>Lägg till bevakning</Text>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80 }}>
        <Animated.View entering={FadeInDown.springify()}>
          <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textSecondary, lineHeight: 20, marginBottom: 24 }}>
            Välj vad du vill bevaka. Du får en notis när en matchande bokning dyker upp. Bevakningen är aktiv tills du tar bort den.
          </Text>

          {/* Restaurant picker */}
          <Text style={{ fontFamily: FONTS.semiBold, fontSize: 12, color: C.textTertiary, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Restaurang (valfritt)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, marginBottom: 20, flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
            <Pressable
              accessibilityLabel="Valfri restaurang"
              onPress={() => { setSelectedRestaurantId(null); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: !selectedRestaurantId ? C.coral : C.bgCard, borderWidth: 0.5, borderColor: !selectedRestaurantId ? C.coral : C.borderLight }}
            >
              <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: !selectedRestaurantId ? "#111827" : C.textSecondary }}>Valfri</Text>
            </Pressable>
            {restaurants.map((r) => (
              <Pressable
                key={r.id}
                accessibilityLabel={`Välj ${r.name}`}
                onPress={() => { setSelectedRestaurantId(r.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: selectedRestaurantId === r.id ? C.coral : C.bgCard, borderWidth: 0.5, borderColor: selectedRestaurantId === r.id ? C.coral : C.borderLight }}
              >
                <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: selectedRestaurantId === r.id ? "#111827" : C.textSecondary }}>{r.name}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Smart Filter: Time Range */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Clock size={14} color={C.textTertiary} strokeWidth={2} />
            <Text style={{ fontFamily: FONTS.semiBold, fontSize: 12, color: C.textTertiary, letterSpacing: 1, textTransform: "uppercase" }}>Tid på dagen</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, marginBottom: 20, flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
            <Pressable
              testID="time-filter-any"
              accessibilityLabel="Valfri tid"
              onPress={() => { setSelectedTimeRange(null); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: !selectedTimeRange ? C.coral : C.bgCard, borderWidth: 0.5, borderColor: !selectedTimeRange ? C.coral : C.borderLight }}
            >
              <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: !selectedTimeRange ? "#111827" : C.textSecondary }}>Valfri tid</Text>
            </Pressable>
            {TIME_PRESETS.map((preset) => {
              const isSelected = selectedTimeRange?.[0] === preset.range[0] && selectedTimeRange?.[1] === preset.range[1];
              return (
                <Pressable
                  key={preset.label}
                  testID={`time-filter-${preset.label}`}
                  accessibilityLabel={preset.label}
                  onPress={() => { setSelectedTimeRange(isSelected ? null : preset.range); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: isSelected ? C.coral : C.bgCard, borderWidth: 0.5, borderColor: isSelected ? C.coral : C.borderLight }}
                >
                  <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: isSelected ? "#111827" : C.textSecondary }}>{preset.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Smart Filter: Weekdays */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Calendar size={14} color={C.textTertiary} strokeWidth={2} />
            <Text style={{ fontFamily: FONTS.semiBold, fontSize: 12, color: C.textTertiary, letterSpacing: 1, textTransform: "uppercase" }}>Veckodagar</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
            {WEEKDAY_LABELS.map((label, index) => {
              const isSelected = selectedWeekdays.includes(index);
              return (
                <Pressable
                  key={label}
                  testID={`weekday-${index}`}
                  accessibilityLabel={label}
                  onPress={() => toggleWeekday(index)}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: isSelected ? C.coral : C.bgCard,
                    borderWidth: 0.5,
                    borderColor: isSelected ? C.coral : C.borderLight,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontFamily: FONTS.semiBold, fontSize: 12, color: isSelected ? "#111827" : C.textSecondary }}>{label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Smart Filter: Party Size */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Users size={14} color={C.textTertiary} strokeWidth={2} />
            <Text style={{ fontFamily: FONTS.semiBold, fontSize: 12, color: C.textTertiary, letterSpacing: 1, textTransform: "uppercase" }}>Antal personer</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, marginBottom: 20, flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
            <Pressable
              testID="party-size-any"
              accessibilityLabel="Valfritt antal"
              onPress={() => { setSelectedPartySize(null); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: !selectedPartySize ? C.coral : C.bgCard, borderWidth: 0.5, borderColor: !selectedPartySize ? C.coral : C.borderLight }}
            >
              <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: !selectedPartySize ? "#111827" : C.textSecondary }}>Alla</Text>
            </Pressable>
            {PARTY_SIZES.map((size) => {
              const isSelected = selectedPartySize === size;
              return (
                <Pressable
                  key={size}
                  testID={`party-size-${size}`}
                  accessibilityLabel={`${size} personer`}
                  onPress={() => { setSelectedPartySize(isSelected ? null : size); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  style={{ width: 44, height: 36, borderRadius: RADIUS.full, backgroundColor: isSelected ? C.coral : C.bgCard, borderWidth: 0.5, borderColor: isSelected ? C.coral : C.borderLight, alignItems: "center", justifyContent: "center" }}
                >
                  <Text style={{ fontFamily: FONTS.semiBold, fontSize: 14, color: isSelected ? "#111827" : C.textSecondary }}>{size}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Date (optional) */}
          <Text style={{ fontFamily: FONTS.semiBold, fontSize: 12, color: C.textTertiary, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Specifikt datum (valfritt)</Text>
          <TextInput value={date} onChangeText={setDate} placeholder="t.ex. 2026-04-15" placeholderTextColor={C.textTertiary} style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.md, paddingHorizontal: 16, paddingVertical: 13, fontFamily: FONTS.regular, fontSize: 15, color: C.textPrimary, borderWidth: 0.5, borderColor: C.borderLight, marginBottom: 16 }} />

          {/* Notes */}
          <Text style={{ fontFamily: FONTS.semiBold, fontSize: 12, color: C.textTertiary, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Anteckningar (valfritt)</Text>
          <TextInput value={notes} onChangeText={setNotes} placeholder="t.ex. Uteservering föredras" placeholderTextColor={C.textTertiary} multiline style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.md, paddingHorizontal: 16, paddingVertical: 13, fontFamily: FONTS.regular, fontSize: 15, color: C.textPrimary, borderWidth: 0.5, borderColor: C.borderLight, minHeight: 80, marginBottom: 12 }} />

          {/* Persistent alert info */}
          <View style={{ backgroundColor: "rgba(59,130,246,0.06)", borderRadius: RADIUS.md, padding: 14, marginBottom: 24, flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.success }} />
            <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: C.textSecondary, flex: 1, lineHeight: 18 }}>
              Bevakningen är aktiv tills du tar bort den — den försvinner aldrig automatiskt.
            </Text>
          </View>

          <Pressable
            testID="add-watch-submit"
            accessibilityLabel="Lägg till bevakning"
            onPress={handleAdd}
            disabled={isPending}
            style={{ backgroundColor: C.dark, borderRadius: 16, paddingVertical: 16, alignItems: "center", shadowColor: C.dark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 3 }}
          >
            {isPending ? <ActivityIndicator color={C.bgCard} /> : <Text style={{ fontFamily: FONTS.bold, fontSize: 16, color: C.bgCard, letterSpacing: -0.2 }}>Lägg till bevakning</Text>}
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
