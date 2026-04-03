import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Upload, ArrowDownLeft, UserPlus, ChevronRight, Clock, ShoppingCart, Gift, AlertCircle } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useProfile, useActivityAlerts, usePurchaseCredits } from "@/lib/api/hooks";
import type { ActivityAlert } from "@/lib/api/types";
import { useAuthStore } from "@/lib/auth-store";
import { C, FONTS, SPACING, SHADOW, RADIUS, ICON } from "../lib/theme";

function AnimatedPressable({
  children,
  onPress,
  style,
  testID,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: object;
  testID?: string;
  accessibilityLabel?: string;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 200 });
      }}
      onPress={onPress}
    >
      <Animated.View style={[animStyle, style]}>{children}</Animated.View>
    </Pressable>
  );
}

function MiniSpinner({ color }: { color: string }) {
  const rotation = useSharedValue(0);
  React.useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 800 }), -1, false);
  }, []);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));
  return (
    <Animated.View
      style={[
        animStyle,
        {
          width: 18,
          height: 18,
          borderRadius: 9,
          borderWidth: 2,
          borderColor: "transparent",
          borderTopColor: color,
          borderRightColor: color,
        },
      ]}
    />
  );
}

function CreditBadge({ label, color }: { label: string; color: "green" | "coral" }) {
  const bgColor = color === "green" ? C.successLight : C.coralLight;
  const textColor = color === "green" ? C.success : C.coral;
  return (
    <View
      style={{
        backgroundColor: bgColor,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: RADIUS.sm,
      }}
    >
      <Text style={{ fontFamily: FONTS.bold, fontSize: 12, color: textColor }}>
        {label}
      </Text>
    </View>
  );
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Idag";
  if (diffDays === 1) return "Igår";
  return `${diffDays} dagar sedan`;
}

export default function CreditsScreen() {
  const router = useRouter();
  const phone = useAuthStore((s) => s.phoneNumber);
  const { data: profile, isLoading: profileLoading, error: profileError, refetch: profileRefetch } = useProfile(phone);
  const { data: activityAlerts } = useActivityAlerts(phone ?? "");
  const creditAlerts = (activityAlerts ?? []).filter(
    (a: ActivityAlert) => a.type === "credit"
  );
  const purchaseMutation = usePurchaseCredits();
  const [buyingQuantity, setBuyingQuantity] = React.useState<number | null>(null);
  const targetCredits = profile?.credits ?? 0;

  const handleBuyCredits = async (quantity: number) => {
    if (!phone) return;
    setBuyingQuantity(quantity);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await purchaseMutation.mutateAsync({ phone, quantity });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error("[Credits] Purchase failed:", err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setBuyingQuantity(null);
    }
  };

  // Count-up animation
  const [displayCredits, setDisplayCredits] = React.useState(0);
  React.useEffect(() => {
    if (targetCredits === 0) return;
    const duration = 1200;
    const steps = 30;
    const stepValue = targetCredits / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += stepValue;
      if (current >= targetCredits) {
        setDisplayCredits(targetCredits);
        clearInterval(interval);
      } else {
        setDisplayCredits(Math.round(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [targetCredits]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["bottom"]}>
      {profileError ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <View style={{ width: 56, height: 56, borderRadius: RADIUS.lg, backgroundColor: C.coralLight, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <AlertCircle size={24} color={C.coral} strokeWidth={ICON.strokeWidth} />
          </View>
          <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: C.textPrimary, marginBottom: 4 }}>Något gick fel</Text>
          <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textTertiary, textAlign: "center", marginBottom: 20 }}>Kunde inte ladda credits. Försök igen senare.</Text>
          <Pressable onPress={() => profileRefetch()} style={{ backgroundColor: C.coral, borderRadius: RADIUS.md, paddingVertical: 12, paddingHorizontal: 28 }}>
            <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: "#111827" }}>Försök igen</Text>
          </Pressable>
        </View>
      ) : (
      <ScrollView
        contentContainerStyle={{ paddingBottom: 56 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.springify()}
          style={{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: SPACING.xs }}
        >
          <Text
            style={{
              fontFamily: FONTS.displayBold,
              fontSize: 28,
              color: C.textPrimary,
              letterSpacing: -0.8,
            }}
          >
            Reslot credits
          </Text>
          <Text
            style={{
              fontFamily: FONTS.regular,
              fontSize: 14,
              color: C.textTertiary,
              marginTop: 5,
            }}
          >
            Tjäna och använd credits för att ta över bokningar.
          </Text>
        </Animated.View>

        {/* Balance card */}
        <Animated.View
          entering={FadeInDown.delay(80).springify()}
          style={{ marginHorizontal: SPACING.lg, marginTop: SPACING.lg }}
        >
          <View
            style={{
              backgroundColor: C.dark,
              borderRadius: 24,
              padding: SPACING.xl,
              overflow: "hidden",
              shadowColor: C.dark,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 24,
              elevation: 8,
            }}
          >
            {/* Decorative circles */}
            <View
              style={{
                position: "absolute",
                top: -40,
                right: -40,
                width: 140,
                height: 140,
                borderRadius: 70,
                backgroundColor: "rgba(201,169,110,0.07)",
              }}
            />
            <View
              style={{
                position: "absolute",
                bottom: -20,
                left: -20,
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: C.coralLight,
              }}
            />

            {/* DITT SALDO label */}
            <Text
              style={{
                fontFamily: FONTS.medium,
                fontSize: 12,
                color: "rgba(255,255,255,0.6)",
                letterSpacing: 0.5,
                textTransform: "uppercase",
                marginBottom: SPACING.sm,
              }}
            >
              DITT SALDO
            </Text>

            {/* Credit number + "credits" label */}
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10 }}>
              <Text
                style={{
                  fontFamily: FONTS.bold,
                  fontSize: 52,
                  color: "#FFFFFF",
                  letterSpacing: -2,
                  lineHeight: 56,
                }}
              >
                {displayCredits}
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.semiBold,
                  fontSize: 18,
                  color: C.gold,
                }}
              >
                credits
              </Text>
            </View>

            {/* Monetary value */}
            <Text
              style={{
                fontFamily: FONTS.medium,
                fontSize: 14,
                color: "rgba(255,255,255,0.5)",
                marginTop: 4,
              }}
            >
              Värde: {displayCredits * 39} kr
            </Text>
          </View>
        </Animated.View>

        {/* Så fungerar det */}
        <View style={{ marginTop: 32, paddingHorizontal: SPACING.lg }}>
          <Animated.View entering={FadeInDown.delay(160).springify()}>
            <Text
              style={{
                fontFamily: FONTS.displayBold,
                fontSize: 18,
                color: C.textPrimary,
                letterSpacing: -0.3,
                marginBottom: SPACING.md,
              }}
            >
              Så fungerar det
            </Text>
          </Animated.View>

          <View style={{ gap: SPACING.sm }}>
            {/* Earn row */}
            <Animated.View entering={FadeInDown.delay(220).springify()}>
              <View
                style={{
                  backgroundColor: C.bgCard,
                  borderRadius: RADIUS.lg,
                  borderWidth: 0.5,
                  borderColor: C.divider,
                  padding: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  ...SHADOW.card,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: RADIUS.md,
                    backgroundColor: C.coralLight,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Upload size={20} color={C.coral} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: FONTS.semiBold,
                      fontSize: 14,
                      color: C.textPrimary,
                      letterSpacing: -0.1,
                    }}
                  >
                    Lägg upp en bokning
                  </Text>
                  <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textTertiary, marginTop: 1 }}>
                    +2 credits efter att bokningen tagits över
                  </Text>
                </View>
                <CreditBadge label="+2 credits" color="green" />
              </View>
            </Animated.View>

            {/* Spend row */}
            <Animated.View entering={FadeInDown.delay(280).springify()}>
              <View
                style={{
                  backgroundColor: C.bgCard,
                  borderRadius: RADIUS.lg,
                  borderWidth: 0.5,
                  borderColor: C.divider,
                  padding: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  ...SHADOW.card,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: RADIUS.md,
                    backgroundColor: C.coralLight,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <ArrowDownLeft size={20} color={C.coral} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: FONTS.semiBold,
                      fontSize: 14,
                      color: C.textPrimary,
                      letterSpacing: -0.1,
                    }}
                  >
                    Ta över en bokning
                  </Text>
                </View>
                <CreditBadge label="-2 credits" color="coral" />
              </View>
            </Animated.View>
          </View>
        </View>

        {/* Köp credits */}
        <View style={{ marginTop: SPACING.xl, paddingHorizontal: SPACING.lg }}>
          <Animated.View entering={FadeInDown.delay(340).springify()}>
            <View
              style={{
                backgroundColor: C.bgCard,
                borderRadius: RADIUS.lg,
                borderWidth: 0.5,
                borderColor: C.divider,
                padding: SPACING.md,
                ...SHADOW.card,
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.semiBold,
                  fontSize: 15,
                  color: C.textPrimary,
                  marginBottom: 4,
                }}
              >
                Köp credits
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.regular,
                  fontSize: 13,
                  color: C.textSecondary,
                  marginBottom: SPACING.md,
                }}
              >
                1 credit = 39 kr
              </Text>
              {[1, 3, 5].map((qty) => (
                <AnimatedPressable
                  key={qty}
                  testID={`buy-${qty}-credits-btn`}
                  accessibilityLabel={`Köp ${qty} credit${qty > 1 ? "s" : ""} för ${qty * 39} kronor`}
                  onPress={() => handleBuyCredits(qty)}
                  style={{
                    backgroundColor: qty === 3 ? C.coral : C.bgCard,
                    borderRadius: RADIUS.md,
                    paddingVertical: 14,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: qty === 3 ? 0 : 0.5,
                    borderColor: C.divider,
                    marginBottom: 8,
                    ...(qty === 3 ? SHADOW.elevated : SHADOW.card),
                  }}
                >
                  {buyingQuantity === qty ? (
                    <MiniSpinner color={qty === 3 ? "#111827" : C.coral} />
                  ) : (
                    <Text
                      style={{
                        fontFamily: FONTS.bold,
                        fontSize: 15,
                        color: qty === 3 ? "#111827" : C.textPrimary,
                        letterSpacing: -0.1,
                      }}
                    >
                      {qty === 1 ? "Köp 1 credit · 39 kr" : qty === 3 ? "Köp 3 credits · 117 kr" : "Köp 5 credits · 195 kr"}
                    </Text>
                  )}
                </AnimatedPressable>
              ))}
            </View>
          </Animated.View>
        </View>

        {/* Få gratis credits */}
        <View style={{ marginTop: 32, paddingHorizontal: SPACING.lg }}>
          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <Text
              style={{
                fontFamily: FONTS.displayBold,
                fontSize: 18,
                color: C.textPrimary,
                letterSpacing: -0.3,
                marginBottom: SPACING.md,
              }}
            >
              Få gratis credits
            </Text>
          </Animated.View>

          <View style={{ gap: SPACING.sm }}>
            {/* Bjud in en vän */}
            <Animated.View entering={FadeInDown.delay(460).springify()}>
              <AnimatedPressable
                testID="invite-friend-btn"
                accessibilityLabel="Bjud in en vän och få 1 credit"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/invite");
                }}
                style={{
                  backgroundColor: C.bgCard,
                  borderRadius: RADIUS.lg,
                  borderWidth: 0.5,
                  borderColor: C.divider,
                  padding: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  ...SHADOW.card,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: RADIUS.md,
                    backgroundColor: C.coralLight,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <UserPlus size={20} color={C.coral} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: FONTS.semiBold,
                      fontSize: 14,
                      color: C.textPrimary,
                      letterSpacing: -0.1,
                    }}
                  >
                    Bjud in en vän
                  </Text>
                </View>
                <CreditBadge label="+1 credit vardera" color="green" />
                <ChevronRight size={16} color={C.textTertiary} strokeWidth={2} />
              </AnimatedPressable>
            </Animated.View>

            {/* Lägg upp en bokning */}
            <Animated.View entering={FadeInDown.delay(520).springify()}>
              <AnimatedPressable
                testID="post-booking-btn"
                accessibilityLabel="Lägg upp en bokning och få 2 credits"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/(tabs)/submit");
                }}
                style={{
                  backgroundColor: C.bgCard,
                  borderRadius: RADIUS.lg,
                  borderWidth: 0.5,
                  borderColor: C.divider,
                  padding: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  ...SHADOW.card,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: RADIUS.md,
                    backgroundColor: C.coralLight,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Upload size={20} color={C.coral} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontFamily: FONTS.semiBold,
                      fontSize: 14,
                      color: C.textPrimary,
                      letterSpacing: -0.1,
                    }}
                  >
                    Lägg upp en bokning
                  </Text>
                </View>
                <CreditBadge label="+2 credits" color="green" />
                <ChevronRight size={16} color={C.textTertiary} strokeWidth={2} />
              </AnimatedPressable>
            </Animated.View>
          </View>
        </View>

        {/* Historik */}
        <View style={{ marginTop: 32, paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg }}>
          <Animated.View entering={FadeInDown.delay(580).springify()}>
            <Text
              style={{
                fontFamily: FONTS.displayBold,
                fontSize: 18,
                color: C.textPrimary,
                letterSpacing: -0.3,
                marginBottom: SPACING.md,
              }}
            >
              Historik
            </Text>
          </Animated.View>

          {creditAlerts.length === 0 ? (
            <Animated.View entering={FadeInDown.delay(620).springify()} style={{ alignItems: "center", paddingVertical: 24 }}>
              <View style={{ width: 52, height: 52, borderRadius: RADIUS.lg, backgroundColor: "rgba(0,0,0,0.03)", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <Clock size={24} color={C.textTertiary} strokeWidth={ICON.strokeWidth} />
              </View>
              <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: C.textPrimary, textAlign: "center" }}>
                Ingen historik än
              </Text>
              <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textSecondary, marginTop: 4, textAlign: "center" }}>
                Dina credits-transaktioner visas här
              </Text>
            </Animated.View>
          ) : (
            <View
              style={{
                backgroundColor: C.bgCard,
                borderRadius: RADIUS.lg,
                borderWidth: 0.5,
                borderColor: C.divider,
                overflow: "hidden",
                ...SHADOW.card,
              }}
            >
              {creditAlerts.map((alert, index) => {
                const isSpent = alert.title.toLowerCase().includes("köpt");
                const isEarned =
                  alert.title.toLowerCase().includes("tjäna") ||
                  alert.title.toLowerCase().includes("credit");
                const iconColor = isSpent ? C.coral : C.success;
                const IconComponent = isSpent ? ShoppingCart : isEarned ? Gift : Clock;
                const iconBg = isSpent
                  ? C.coralLight
                  : C.successLight;

                return (
                  <Animated.View
                    key={alert.id}
                    entering={FadeInDown.delay(620 + index * 60)
                      .springify()}
                  >
                    {index > 0 && (
                      <View
                        style={{
                          height: 0.5,
                          backgroundColor: C.divider,
                          marginLeft: 62,
                        }}
                      />
                    )}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        padding: 14,
                        gap: 12,
                      }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          backgroundColor: iconBg,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <IconComponent size={18} color={iconColor} strokeWidth={2} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 2,
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: FONTS.semiBold,
                              fontSize: 14,
                              color: C.textPrimary,
                              flex: 1,
                            }}
                            numberOfLines={1}
                          >
                            {alert.title}
                          </Text>
                          <Text
                            style={{
                              fontFamily: FONTS.regular,
                              fontSize: 12,
                              color: C.textTertiary,
                              marginLeft: 8,
                            }}
                          >
                            {formatRelativeDate(alert.createdAt)}
                          </Text>
                        </View>
                        <Text
                          style={{
                            fontFamily: FONTS.regular,
                            fontSize: 13,
                            color: C.textSecondary,
                          }}
                          numberOfLines={2}
                        >
                          {alert.message}
                        </Text>
                      </View>
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
      )}
    </SafeAreaView>
  );
}
