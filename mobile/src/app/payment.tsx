import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Shield, CreditCard, ChevronRight, Sparkles } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { C, FONTS, SPACING, RADIUS, SHADOW, ICON } from "@/lib/theme";

export default function PaymentScreen() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: C.bg }}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
          <Pressable testID="back-button" accessibilityLabel="Gå tillbaka" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.04)", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
            <ChevronLeft size={20} color={C.textSecondary} strokeWidth={2} />
          </Pressable>
          <Text style={{ fontFamily: FONTS.displayBold, fontSize: 20, color: C.textPrimary, letterSpacing: -0.4 }}>Betalningar</Text>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80 }}>
        {/* Secure payment info */}
        <Animated.View entering={FadeInDown.springify()} style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 0.5, borderColor: C.divider, marginBottom: 24, gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Shield size={18} color={C.success} strokeWidth={2} />
            <Text style={{ fontFamily: FONTS.semiBold, fontSize: 14, color: C.textPrimary }}>Säker betalning med Stripe</Text>
          </View>
          <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textSecondary, lineHeight: 20 }}>
            Reslot hanterar betalningar säkert via Stripe. Vi sparar aldrig dina kortuppgifter — de hanteras direkt av Stripe.
          </Text>
          <Text style={{ fontFamily: FONTS.semiBold, fontSize: 13, color: C.success, lineHeight: 20, marginTop: 8 }}>
            Inga pengar dras enbart av att du lägger in kortuppgifter.
          </Text>
        </Animated.View>

        {/* How payments work */}
        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <Text style={{ fontFamily: FONTS.displayBold, fontSize: 17, color: C.textPrimary, letterSpacing: -0.3, marginBottom: 14 }}>Så fungerar betalningar</Text>

          <View style={{ gap: 10 }}>
            {/* Claim payment */}
            <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.md, padding: 14, borderWidth: 0.5, borderColor: C.divider, flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: C.coralLight, alignItems: "center", justifyContent: "center" }}>
                <CreditCard size={20} color={C.coral} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONTS.semiBold, fontSize: 14, color: C.textPrimary }}>Serviceavgift vid övertagande</Text>
                <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textSecondary, marginTop: 2 }}>29 kr debiteras efter 5 min ångerfrist</Text>
              </View>
            </View>

            {/* Credits purchase */}
            <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.md, padding: 14, borderWidth: 0.5, borderColor: C.divider, flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(201,169,110,0.1)", alignItems: "center", justifyContent: "center" }}>
                <Sparkles size={20} color={C.gold} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONTS.semiBold, fontSize: 14, color: C.textPrimary }}>Köp credits</Text>
                <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textSecondary, marginTop: 2 }}>39 kr per credit — betalas direkt via Stripe</Text>
              </View>
            </View>

            {/* No-show */}
            <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.md, padding: 14, borderWidth: 0.5, borderColor: C.divider, flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(239,68,68,0.1)", alignItems: "center", justifyContent: "center" }}>
                <Shield size={20} color={C.error} strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONTS.semiBold, fontSize: 14, color: C.textPrimary }}>No-show-avgift</Text>
                <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textSecondary, marginTop: 2 }}>10-20% av bokningens avbokningsavgift vid uteblivet besök</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* CTA */}
        <Animated.View entering={FadeInDown.delay(160).springify()} style={{ marginTop: 28 }}>
          <Pressable
            testID="buy-credits-cta"
            accessibilityLabel="Köp credits"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/credits");
            }}
            style={{ backgroundColor: C.coral, borderRadius: RADIUS.lg, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, shadowColor: C.coral, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 14, elevation: 6 }}
          >
            <Text style={{ fontFamily: FONTS.bold, fontSize: 16, color: "#111827", letterSpacing: -0.2 }}>Köp credits</Text>
            <ChevronRight size={18} color="#111827" strokeWidth={2.5} />
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
