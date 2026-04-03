import React from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Shield, CreditCard, ChevronRight, Sparkles, CheckCircle2, AlertCircle } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import Animated, { FadeInDown } from "react-native-reanimated";
import { C, FONTS, SPACING, RADIUS, SHADOW, ICON } from "@/lib/theme";
import { useCardStatus, useSetupCard } from "@/lib/api/hooks";
import { useAuthStore } from "@/lib/auth-store";

export default function PaymentScreen() {
  const router = useRouter();
  const phone = useAuthStore((s) => s.phoneNumber);
  const { data: cardStatus, isLoading: cardLoading, refetch: refetchCard } = useCardStatus(phone);
  const setupCardMutation = useSetupCard();
  const [setupError, setSetupError] = React.useState<string | null>(null);

  const handleSetupCard = async () => {
    setSetupError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const result = await setupCardMutation.mutateAsync();
      if (result.checkoutUrl) {
        await WebBrowser.openBrowserAsync(result.checkoutUrl, {
          dismissButtonStyle: "close",
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
        });
        // Refetch card status after returning from Stripe
        refetchCard();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Kunde inte öppna kortregistrering. Försök igen.";
      setSetupError(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

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
        {/* Card status section */}
        <Animated.View entering={FadeInDown.springify()} style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 0.5, borderColor: C.divider, marginBottom: 16, ...SHADOW.card }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <CreditCard size={18} color={C.coral} strokeWidth={2} />
            <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: C.textPrimary }}>Ditt betalkort</Text>
          </View>

          {cardLoading ? (
            <ActivityIndicator size="small" color={C.coral} />
          ) : cardStatus?.hasCard ? (
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <CheckCircle2 size={16} color={C.success} strokeWidth={2} />
                <Text style={{ fontFamily: FONTS.medium, fontSize: 14, color: C.textPrimary }}>
                  {(cardStatus.cardBrand ?? "Kort").charAt(0).toUpperCase() + (cardStatus.cardBrand ?? "kort").slice(1)} som slutar på {cardStatus.cardLast4}
                </Text>
              </View>
              <Pressable
                testID="change-card-button"
                accessibilityLabel="Byt betalkort"
                onPress={handleSetupCard}
                disabled={setupCardMutation.isPending}
                style={{ backgroundColor: "rgba(0,0,0,0.04)", borderRadius: RADIUS.md, paddingVertical: 10, alignItems: "center" }}
              >
                <Text style={{ fontFamily: FONTS.semiBold, fontSize: 13, color: C.textSecondary }}>
                  {setupCardMutation.isPending ? "Öppnar..." : "Byt kort"}
                </Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textSecondary, lineHeight: 20 }}>
                Lägg till ett betalkort för att kunna ta över bokningar och köpa credits.
              </Text>
              <Pressable
                testID="add-card-button"
                accessibilityLabel="Lägg till betalkort"
                onPress={handleSetupCard}
                disabled={setupCardMutation.isPending}
                style={{ backgroundColor: C.coral, borderRadius: RADIUS.md, paddingVertical: 14, alignItems: "center", ...SHADOW.elevated }}
              >
                <Text style={{ fontFamily: FONTS.bold, fontSize: 15, color: "#111827" }}>
                  {setupCardMutation.isPending ? "Öppnar..." : "Lägg till kort"}
                </Text>
              </Pressable>
            </View>
          )}

          {setupError ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, backgroundColor: "rgba(239,68,68,0.08)", borderRadius: RADIUS.sm, padding: 10 }}>
              <AlertCircle size={14} color={C.error} strokeWidth={2} />
              <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.error, flex: 1 }}>{setupError}</Text>
            </View>
          ) : null}
        </Animated.View>

        {/* Secure payment info */}
        <Animated.View entering={FadeInDown.delay(60).springify()} style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 0.5, borderColor: C.divider, marginBottom: 24, gap: 12 }}>
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
        <Animated.View entering={FadeInDown.delay(120).springify()}>
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
        <Animated.View entering={FadeInDown.delay(200).springify()} style={{ marginTop: 28 }}>
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
