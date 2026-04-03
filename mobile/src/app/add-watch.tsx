import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useAddWatch, useRestaurants } from "@/lib/api/hooks";
import { useAuthStore } from "@/lib/auth-store";
import { C, FONTS, SPACING, RADIUS, SHADOW, ICON } from "@/lib/theme";

export default function AddWatchScreen() {
  const router = useRouter();
  const phone = useAuthStore((s) => s.phoneNumber);
  const { data: restaurants = [] } = useRestaurants();
  const { mutate: addWatch, isPending } = useAddWatch();

  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [partySize, setPartySize] = useState("");
  const [notes, setNotes] = useState("");

  const handleAdd = () => {
    if (!phone) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addWatch({
      userPhone: phone,
      restaurantId: selectedRestaurantId ?? undefined,
      date: date || undefined,
      partySize: partySize ? parseInt(partySize) : undefined,
      notes: notes || undefined,
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
            Välj vad du vill bevaka. Du får en notis när en matchande bokning dyker upp.
          </Text>

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

          <Text style={{ fontFamily: FONTS.semiBold, fontSize: 12, color: C.textTertiary, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Datum (valfritt)</Text>
          <TextInput value={date} onChangeText={setDate} placeholder="t.ex. 2026-04-15" placeholderTextColor={C.textTertiary} style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.md, paddingHorizontal: 16, paddingVertical: 13, fontFamily: FONTS.regular, fontSize: 15, color: C.textPrimary, borderWidth: 0.5, borderColor: C.borderLight, marginBottom: 16 }} />

          <Text style={{ fontFamily: FONTS.semiBold, fontSize: 12, color: C.textTertiary, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Antal personer (valfritt)</Text>
          <TextInput value={partySize} onChangeText={setPartySize} keyboardType="numeric" placeholder="t.ex. 2" placeholderTextColor={C.textTertiary} style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.md, paddingHorizontal: 16, paddingVertical: 13, fontFamily: FONTS.regular, fontSize: 15, color: C.textPrimary, borderWidth: 0.5, borderColor: C.borderLight, marginBottom: 16 }} />

          <Text style={{ fontFamily: FONTS.semiBold, fontSize: 12, color: C.textTertiary, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Anteckningar (valfritt)</Text>
          <TextInput value={notes} onChangeText={setNotes} placeholder="t.ex. Kvällsbokning föredras" placeholderTextColor={C.textTertiary} multiline style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.md, paddingHorizontal: 16, paddingVertical: 13, fontFamily: FONTS.regular, fontSize: 15, color: C.textPrimary, borderWidth: 0.5, borderColor: C.borderLight, minHeight: 80, marginBottom: 32 }} />

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
