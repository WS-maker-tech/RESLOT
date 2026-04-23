import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, ShieldCheck, CreditCard, CheckCircle2, AlertCircle } from "lucide-react-native";
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
  const [setupError, setSetupError] = useState<string | null>(null);

  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");

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
          <Pressable
            testID="back-button"
            accessibilityLabel="Gå tillbaka"
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.overlayLight, alignItems: "center", justifyContent: "center", marginRight: 12 }}
          >
            <ChevronLeft size={20} color={C.textSecondary} strokeWidth={2} />
          </Pressable>
          <Text style={{ fontFamily: FONTS.displayBold, fontSize: 20, color: C.textPrimary, letterSpacing: -0.4 }}>Betalning</Text>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80 }}>
        {/* Security info box */}
        <Animated.View entering={FadeInDown.springify()}>
          <View style={{ backgroundColor: "rgba(126,200,122,0.08)", borderRadius: RADIUS.lg, padding: SPACING.md, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20, borderWidth: 1, borderColor: "rgba(126,200,122,0.15)" }}>
            <ShieldCheck size={22} color="#7EC87A" strokeWidth={ICON.strokeWidth} />
            <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textSecondary, flex: 1, lineHeight: 20 }}>
              Ditt kort används bara som säkerhet. Du debiteras aldrig enbart för att lägga in kortuppgifter.
            </Text>
          </View>
        </Animated.View>

        {/* Existing card status */}
        {cardLoading ? (
          <ActivityIndicator size="small" color={C.coral} style={{ marginBottom: 20 }} />
        ) : cardStatus?.hasCard ? (
          <Animated.View entering={FadeInDown.delay(40).springify()} style={{ marginBottom: 20 }}>
            <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 0.5, borderColor: C.divider, ...SHADOW.card }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <CheckCircle2 size={16} color={C.success} strokeWidth={2} />
                <Text style={{ fontFamily: FONTS.semiBold, fontSize: 14, color: C.textPrimary }}>
                  {(cardStatus.cardBrand ?? "Kort").charAt(0).toUpperCase() + (cardStatus.cardBrand ?? "kort").slice(1)} som slutar på {cardStatus.cardLast4}
                </Text>
              </View>
              <Pressable
                testID="change-card-button"
                accessibilityLabel="Byt betalkort"
                onPress={handleSetupCard}
                disabled={setupCardMutation.isPending}
                style={{ backgroundColor: C.overlayLight, borderRadius: RADIUS.md, paddingVertical: 10, alignItems: "center" }}
              >
                <Text style={{ fontFamily: FONTS.semiBold, fontSize: 13, color: C.textSecondary }}>
                  {setupCardMutation.isPending ? "Öppnar..." : "Byt kort"}
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        ) : null}

        {/* Card input section */}
        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 0.5, borderColor: C.borderLight, ...SHADOW.card, marginBottom: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: SPACING.md }}>
              <CreditCard size={18} color={C.textSecondary} strokeWidth={2} />
              <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: C.textPrimary }}>Kortuppgifter</Text>
            </View>

            {/* Card number */}
            <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: C.textTertiary, marginBottom: 6 }}>Kortnummer</Text>
            <TextInput
              testID="card-number-input"
              value={cardNumber}
              onChangeText={setCardNumber}
              placeholder="•••• •••• •••• ••••"
              placeholderTextColor={C.grayLight}
              keyboardType="numeric"
              maxLength={19}
              style={{
                fontFamily: FONTS.medium,
                fontSize: 16,
                color: C.textPrimary,
                backgroundColor: C.bgInput,
                borderRadius: RADIUS.md,
                paddingHorizontal: 14,
                paddingVertical: 14,
                marginBottom: 14,
                letterSpacing: 2,
              }}
            />

            {/* Expiry + CVV row */}
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 14 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: C.textTertiary, marginBottom: 6 }}>Giltig till</Text>
                <TextInput
                  testID="expiry-input"
                  value={expiry}
                  onChangeText={setExpiry}
                  placeholder="MM/ÅÅ"
                  placeholderTextColor={C.grayLight}
                  keyboardType="numeric"
                  maxLength={5}
                  style={{
                    fontFamily: FONTS.medium,
                    fontSize: 16,
                    color: C.textPrimary,
                    backgroundColor: C.bgInput,
                    borderRadius: RADIUS.md,
                    paddingHorizontal: 14,
                    paddingVertical: 14,
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: C.textTertiary, marginBottom: 6 }}>CVV</Text>
                <TextInput
                  testID="cvv-input"
                  value={cvv}
                  onChangeText={setCvv}
                  placeholder="•••"
                  placeholderTextColor={C.grayLight}
                  keyboardType="numeric"
                  secureTextEntry
                  maxLength={4}
                  style={{
                    fontFamily: FONTS.medium,
                    fontSize: 16,
                    color: C.textPrimary,
                    backgroundColor: C.bgInput,
                    borderRadius: RADIUS.md,
                    paddingHorizontal: 14,
                    paddingVertical: 14,
                  }}
                />
              </View>
            </View>

            {/* Card holder name */}
            <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: C.textTertiary, marginBottom: 6 }}>Namn på kort</Text>
            <TextInput
              testID="card-name-input"
              value={cardName}
              onChangeText={setCardName}
              placeholder="Förnamn Efternamn"
              placeholderTextColor={C.grayLight}
              autoCapitalize="words"
              style={{
                fontFamily: FONTS.medium,
                fontSize: 16,
                color: C.textPrimary,
                backgroundColor: C.bgInput,
                borderRadius: RADIUS.md,
                paddingHorizontal: 14,
                paddingVertical: 14,
              }}
            />
          </View>
        </Animated.View>

        {/* Save card button */}
        <Animated.View entering={FadeInDown.delay(140).springify()}>
          <Pressable
            testID="save-card-button"
            accessibilityLabel="Spara kort"
            onPress={handleSetupCard}
            disabled={setupCardMutation.isPending}
            style={{
              backgroundColor: "#7EC87A",
              borderRadius: RADIUS.full,
              paddingVertical: 16,
              alignItems: "center",
              marginBottom: 14,
              ...SHADOW.elevated,
            }}
          >
            <Text style={{ fontFamily: FONTS.bold, fontSize: 16, color: "#111827" }}>
              {setupCardMutation.isPending ? "Öppnar Stripe..." : "Spara kort"}
            </Text>
          </Pressable>

          {setupError ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14, backgroundColor: C.errorBg, borderRadius: RADIUS.sm, padding: 10 }}>
              <AlertCircle size={14} color={C.error} strokeWidth={2} />
              <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.error, flex: 1 }}>{setupError}</Text>
            </View>
          ) : null}

          <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textTertiary, textAlign: "center", lineHeight: 18, paddingHorizontal: 10 }}>
            Betalningsansvar uppstår först om du inte dyker upp eller avbokar för sent. Vi lagrar aldrig dina kortuppgifter okrypterat.
          </Text>
        </Animated.View>

        {/* Security section */}
        <Animated.View entering={FadeInDown.delay(200).springify()} style={{ marginTop: 28 }}>
          <Text style={{ fontFamily: FONTS.semiBold, fontSize: 12, color: C.textTertiary, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 12 }}>Säkerhet</Text>
          <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 0.5, borderColor: C.borderLight, ...SHADOW.card, gap: 16 }}>
            {[
              { emoji: "🔒", text: "256-bitars kryptering" },
              { emoji: "✓", text: "PCI DSS-certifierat" },
              { emoji: "🛡️", text: "Skyddad av Stripe" },
            ].map((item, i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <Text style={{ fontSize: 18, width: 28, textAlign: "center" }}>{item.emoji}</Text>
                <Text style={{ fontFamily: FONTS.medium, fontSize: 14, color: C.textPrimary }}>{item.text}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
