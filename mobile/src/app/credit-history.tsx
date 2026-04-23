import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Clock, ArrowUpRight, ArrowDownLeft } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useActivityAlerts } from "@/lib/api/hooks";
import type { ActivityAlert } from "@/lib/api/types";
import { useAuthStore } from "@/lib/auth-store";
import { C, FONTS, SPACING, SHADOW, RADIUS, ICON } from "../lib/theme";

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Idag";
  if (diffDays === 1) return "Igår";
  return `${diffDays} dagar sedan`;
}

export default function CreditHistoryScreen() {
  const router = useRouter();
  const phone = useAuthStore((s) => s.phoneNumber);
  const { data: activityAlerts } = useActivityAlerts(phone ?? "");
  const creditAlerts = (activityAlerts ?? []).filter(
    (a: ActivityAlert) => a.type === "credit"
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top", "bottom"]}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: SPACING.lg, paddingVertical: 12 }}>
        <Pressable
          testID="back-button"
          accessibilityLabel="Tillbaka"
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
          style={{ padding: 4, marginRight: 8 }}
        >
          <ChevronLeft size={24} color={C.textPrimary} strokeWidth={2} />
        </Pressable>
        <Text style={{ fontFamily: FONTS.displayBold, fontSize: 24, color: C.textPrimary, letterSpacing: -0.5 }}>
          Historik
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {creditAlerts.length === 0 ? (
          <Animated.View entering={FadeInDown.springify()} style={{ alignItems: "center", paddingTop: 80 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(201,169,110,0.10)", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <Clock size={28} color={C.gold} strokeWidth={ICON.strokeWidth} />
            </View>
            <Text style={{ fontFamily: FONTS.displayBold, fontSize: 17, color: C.textPrimary, textAlign: "center", letterSpacing: -0.2 }}>
              Ingen historik än
            </Text>
            <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textSecondary, marginTop: 6, textAlign: "center", lineHeight: 20, paddingHorizontal: 40 }}>
              Här visas dina credit-transaktioner när du börjar använda Reslot.
            </Text>
          </Animated.View>
        ) : (
          <View style={{ marginHorizontal: SPACING.lg, marginTop: SPACING.md }}>
            <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, borderWidth: 0.5, borderColor: C.borderLight, overflow: "hidden", ...SHADOW.card }}>
              {creditAlerts.map((alert: ActivityAlert, index: number) => {
                const msgLower = (alert.message ?? alert.title ?? "").toLowerCase();
                const isSpent = msgLower.includes("köp") || msgLower.includes("tog över") || msgLower.includes("−") || msgLower.includes("debit");
                const isIncoming = !isSpent;
                const iconColor = isIncoming ? "#7EC87A" : C.error;
                const IconComponent = isIncoming ? ArrowUpRight : ArrowDownLeft;
                const iconBg = isIncoming ? "rgba(126,200,122,0.12)" : "rgba(239,68,68,0.08)";
                const amountColor = isIncoming ? "#7EC87A" : C.error;

                return (
                  <Animated.View
                    key={alert.id}
                    entering={FadeInDown.delay(index * 50).springify()}
                  >
                    {index > 0 ? (
                      <View style={{ height: 0.5, backgroundColor: C.divider, marginLeft: 62 }} />
                    ) : null}
                    <View style={{ flexDirection: "row", alignItems: "center", padding: 14, gap: 12 }}>
                      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: iconBg, alignItems: "center", justifyContent: "center" }}>
                        <IconComponent size={18} color={iconColor} strokeWidth={2} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: FONTS.semiBold, fontSize: 14, color: C.textPrimary }} numberOfLines={1}>
                          {alert.title}
                        </Text>
                        <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textTertiary, marginTop: 1 }}>
                          {formatRelativeDate(alert.createdAt)}
                        </Text>
                      </View>
                      <Text style={{ fontFamily: FONTS.bold, fontSize: 15, color: amountColor, letterSpacing: -0.3 }}>
                        {isIncoming ? "+" : "−"}
                      </Text>
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
