import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Share, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Copy, Share2, UserPlus, CheckCircle } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useReferralCode } from "@/lib/api/hooks";
import { useAuthStore } from "@/lib/auth-store";
import { C, FONTS, SPACING, RADIUS, SHADOW, ICON } from "@/lib/theme";

export default function InviteScreen() {
  const router = useRouter();
  const phone = useAuthStore((s) => s.phoneNumber);
  const { data: referralData, error: referralError, refetch: referralRefetch } = useReferralCode(phone);
  const referralCode = referralError ? "FEL" : referralData?.referralCode ?? "LADDAR...";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === "web") {
      navigator.clipboard?.writeText(referralCode).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Share.share({
      message: `Prova Reslot — ta över restaurangbokningar i sista minuten! Använd min kod ${referralCode} när du registrerar dig så får vi båda 1 credit.`,
      title: "Prova Reslot",
    }).catch(() => {});
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: C.bg }}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
          <Pressable testID="back-button" accessibilityLabel="Gå tillbaka" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.04)", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
            <ChevronLeft size={20} color={C.textSecondary} strokeWidth={2} />
          </Pressable>
          <Text style={{ fontFamily: FONTS.displayBold, fontSize: 20, color: C.textPrimary, letterSpacing: -0.4 }}>Bjud in en vän</Text>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80 }}>
        <Animated.View entering={FadeInDown.springify()} style={{ alignItems: "center", paddingTop: 24, paddingBottom: 32 }}>
          <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: C.coralLight, alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
            <UserPlus size={32} color={C.coral} strokeWidth={ICON.strokeWidth} />
          </View>
          <Text style={{ fontFamily: FONTS.displayBold, fontSize: 26, color: C.textPrimary, letterSpacing: -0.8, textAlign: "center" }}>
            Dela och få credits
          </Text>
          <Text style={{ fontFamily: FONTS.regular, fontSize: 15, color: C.textSecondary, marginTop: 10, textAlign: "center", lineHeight: 22, maxWidth: 300 }}>
            Du och din vän får vardera 1 credit när din vän registrerar sig med din kod.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <Text style={{ fontFamily: FONTS.semiBold, fontSize: 12, color: C.textTertiary, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Din inbjudningskod</Text>
          <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.xl, padding: SPACING.lg, borderWidth: 0.5, borderColor: C.borderLight, ...SHADOW.card }}>
            <Text style={{ fontFamily: FONTS.displayBold, fontSize: 32, color: C.textPrimary, letterSpacing: 4, textAlign: "center", marginBottom: SPACING.md }}>
              {referralCode}
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable testID="copy-code-button" accessibilityLabel="Kopiera inbjudningskod" onPress={handleCopy} style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: copied ? C.successLight : "rgba(0,0,0,0.05)", borderRadius: 14, paddingVertical: 12 }}>
                {copied ? <CheckCircle size={16} color={C.success} strokeWidth={2} /> : <Copy size={16} color={C.textSecondary} strokeWidth={2} />}
                <Text style={{ fontFamily: FONTS.semiBold, fontSize: 14, color: copied ? C.success : C.textSecondary }}>
                  {copied ? "Kopierad!" : "Kopiera"}
                </Text>
              </Pressable>
              <Pressable testID="share-button" accessibilityLabel="Dela inbjudningskod" onPress={handleShare} style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: C.coral, borderRadius: RADIUS.md, paddingVertical: 12 }}>
                <Share2 size={16} color="#111827" strokeWidth={ICON.strokeWidth} />
                <Text style={{ fontFamily: FONTS.semiBold, fontSize: 14, color: "#111827" }}>Dela</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).springify()} style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, marginTop: SPACING.lg, borderWidth: 0.5, borderColor: C.divider, gap: 10 }}>
          <Text style={{ fontFamily: FONTS.displayBold, fontSize: 15, color: C.textPrimary, marginBottom: 6, letterSpacing: -0.3 }}>Hur det fungerar</Text>
          {[
            "Din vän registrerar sig på Reslot",
            "Din vän anger din inbjudningskod",
            "Ni får båda 1 Reslot credit",
          ].map((step, i) => (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: C.coralLight, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: C.coral }}>{i + 1}</Text>
              </View>
              <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textSecondary, flex: 1 }}>{step}</Text>
            </View>
          ))}
        </Animated.View>
      </ScrollView>
    </View>
  );
}
