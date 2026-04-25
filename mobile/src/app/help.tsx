import React from "react";
import { View, Text, Pressable, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight, MessageCircle, Mail, HelpCircle } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { C, FONTS, SPACING, RADIUS } from "@/lib/theme";

const CONTACT_OPTIONS = [
  {
    key: "chat",
    label: "Chatta med oss",
    icon: MessageCircle,
    iconBg: "#7EC87A",
    iconColor: "#FFFFFF",
    action: "chat",
  },
  {
    key: "email",
    label: "Skicka e-post",
    icon: Mail,
    iconBg: "#E5E7EB",
    iconColor: "#6B7280",
    action: "email",
  },
  {
    key: "faq",
    label: "Vanliga fr\u00e5gor",
    icon: HelpCircle,
    iconBg: "#E5E7EB",
    iconColor: "#6B7280",
    action: "faq",
  },
] as const;

export default function HelpScreen() {
  const router = useRouter();

  const handleAction = (action: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    switch (action) {
      case "chat":
        router.push("/faq");
        break;
      case "email":
        Linking.openURL("mailto:hej@reslot.se");
        break;
      case "faq":
        router.push("/faq");
        break;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: C.bg }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: SPACING.lg,
            paddingTop: 4,
            paddingBottom: 12,
            gap: 12,
          }}
        >
          <Pressable
            testID="back-button"
            accessibilityLabel="G\u00e5 tillbaka"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={({ pressed }) => ({
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(0,0,0,0.04)",
              alignItems: "center",
              justifyContent: "center",
              transform: [{ scale: pressed ? 0.93 : 1 }],
            })}
          >
            <ChevronLeft size={20} color={C.dark} strokeWidth={2} />
          </Pressable>
          <Text
            style={{
              fontFamily: FONTS.displayBold,
              fontSize: 20,
              color: C.textPrimary,
              letterSpacing: -0.4,
            }}
          >
            Hj\u00e4lp & support
          </Text>
        </View>
      </SafeAreaView>

      <View style={{ flex: 1, paddingHorizontal: SPACING.lg, paddingTop: 8 }}>
        {/* Info box */}
        <Animated.View entering={FadeInDown.springify().damping(16)}>
          <View
            style={{
              backgroundColor: "rgba(126,200,122,0.08)",
              borderRadius: RADIUS.lg,
              padding: 18,
              marginBottom: 28,
              borderWidth: 1,
              borderColor: "rgba(126,200,122,0.15)",
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.medium,
                fontSize: 14,
                color: C.textPrimary,
                lineHeight: 21,
              }}
            >
              Har du en fr\u00e5ga? Vi svarar s\u00e5 snart vi kan.
            </Text>
          </View>
        </Animated.View>

        {/* Contact options */}
        <Animated.View entering={FadeInDown.delay(80).springify().damping(16)}>
          <View
            style={{
              backgroundColor: C.bgCard,
              borderRadius: RADIUS.lg,
              borderWidth: 1,
              borderColor: C.borderLight,
              overflow: "hidden",
            }}
          >
            {CONTACT_OPTIONS.map((option, index) => {
              const Icon = option.icon;
              const isLast = index === CONTACT_OPTIONS.length - 1;
              return (
                <Pressable
                  key={option.key}
                  testID={`help-${option.key}`}
                  accessibilityLabel={option.label}
                  onPress={() => handleAction(option.action)}
                  style={({ pressed }) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                    gap: 14,
                    backgroundColor: pressed ? "rgba(0,0,0,0.02)" : "transparent",
                    borderBottomWidth: isLast ? 0 : 0.5,
                    borderBottomColor: C.divider,
                  })}
                >
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      backgroundColor: option.iconBg,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={18} color={option.iconColor} strokeWidth={2} />
                  </View>
                  <Text
                    style={{
                      fontFamily: FONTS.semiBold,
                      fontSize: 15,
                      color: C.textPrimary,
                      flex: 1,
                    }}
                  >
                    {option.label}
                  </Text>
                  <ChevronRight size={16} color={C.textTertiary} strokeWidth={2} />
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {/* Response time info */}
        <Animated.View entering={FadeInDown.delay(160).springify().damping(16)}>
          <Text
            style={{
              fontFamily: FONTS.regular,
              fontSize: 12,
              color: C.textTertiary,
              marginTop: 20,
              textAlign: "center",
            }}
          >
            Vi svarar normalt inom 24 timmar p\u00e5 vardagar.
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}
