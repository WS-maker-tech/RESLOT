import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Copy, Share2, CheckCircle, ShieldCheck } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { useReferralCode } from "@/lib/api/hooks";
import { useAuthStore } from "@/lib/auth-store";
import { C, FONTS, SPACING, RADIUS, SHADOW, ICON } from "@/lib/theme";

export default function InviteScreen() {
  const router = useRouter();
  const phone = useAuthStore((s) => s.phoneNumber);
  const { data: referralData, error: referralError } = useReferralCode(phone);
  const referralCode = referralError ? "FEL" : referralData?.referralCode ?? "LADDAR...";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Clipboard.setStringAsync(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Share.share({
      message: `Gå med på Reslot med min kod ${referralCode} och vi får vardera 1 gratis credit! Ladda ner: https://reslot.se`,
    }).catch((err) => console.error("[Invite] Share failed:", err));
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
          <Text style={{ fontFamily: FONTS.displayBold, fontSize: 20, color: C.textPrimary, letterSpacing: -0.4 }}>Bjud in en vän</Text>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80 }}>
        {/* Big emoji + description */}
        <Animated.View entering={ZoomIn.springify()} style={{ alignItems: "center", paddingTop: 32, paddingBottom: 8 }}>
          <Text style={{ fontSize: 64 }}>🎁</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).springify()} style={{ alignItems: "center", paddingBottom: 32 }}>
          <Text style={{ fontFamily: FONTS.regular, fontSize: 15, color: C.textSecondary, textAlign: "center", lineHeight: 22, maxWidth: 300 }}>
            Du och din vän får vardera 1 credit när hen registrerar sig med din kod.
          </Text>
        </Animated.View>

        {/* Referral code box — dark */}
        <Animated.View entering={FadeInDown.delay(120).springify()}>
          <Text style={{ fontFamily: FONTS.semiBold, fontSize: 12, color: C.textTertiary, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Din inbjudningskod</Text>
          <View style={{ backgroundColor: C.dark, borderRadius: RADIUS.xl, padding: SPACING.lg, ...SHADOW.elevated, marginBottom: 14 }}>
            <Text
              testID="referral-code"
              style={{
                fontFamily: FONTS.displayBold,
                fontSize: 32,
                color: C.white,
                letterSpacing: 8,
                textAlign: "center",
                marginBottom: SPACING.md,
              }}
            >
              {referralCode}
            </Text>

            <Pressable
              testID="copy-code-button"
              accessibilityLabel="Kopiera inbjudningskod"
              onPress={handleCopy}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                backgroundColor: copied ? "rgba(126,200,122,0.20)" : "rgba(255,255,255,0.10)",
                borderRadius: RADIUS.md,
                paddingVertical: 12,
              }}
            >
              {copied ? (
                <CheckCircle size={16} color="#7EC87A" strokeWidth={2} />
              ) : (
                <Copy size={16} color={C.white} strokeWidth={2} />
              )}
              <Text style={{ fontFamily: FONTS.semiBold, fontSize: 14, color: copied ? "#7EC87A" : C.white }}>
                {copied ? "Kopierad! ✓" : "Kopiera kod"}
              </Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* Share button */}
        <Animated.View entering={FadeInDown.delay(180).springify()}>
          <Pressable
            testID="share-button"
            accessibilityLabel="Dela med vän"
            onPress={handleShare}
            style={{
              backgroundColor: "#7EC87A",
              borderRadius: RADIUS.full,
              paddingVertical: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              marginBottom: 24,
              ...SHADOW.elevated,
            }}
          >
            <Share2 size={18} color="#111827" strokeWidth={ICON.strokeWidth} />
            <Text style={{ fontFamily: FONTS.bold, fontSize: 16, color: "#111827" }}>Dela med vän</Text>
          </Pressable>
        </Animated.View>

        {/* Anti-abuse info */}
        <Animated.View entering={FadeInDown.delay(240).springify()}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 0.5, borderColor: C.borderLight, ...SHADOW.card }}>
            <ShieldCheck size={18} color={C.textTertiary} strokeWidth={ICON.strokeWidth} />
            <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textTertiary, flex: 1, lineHeight: 19 }}>
              Skyddat mot missbruk — ny registrering verifieras via e-post och telefon.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
