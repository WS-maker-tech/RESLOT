import React, { useCallback } from "react";
import { View, Text, ScrollView, Pressable, LayoutAnimation, Platform, UIManager } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Coins, UserPlus, PlusCircle, ChevronRight, Zap } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useProfile } from "@/lib/api/hooks";
import { useAuthStore } from "@/lib/auth-store";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CORAL = "#E06A4E";
const GOLD = "#C9A96E";
const DARK = "#111827";
const BG = "#FAFAF8";

function AnimatedPressable({
  children,
  onPress,
  style,
  testID,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: object;
  testID?: string;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      testID={testID}
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 12, stiffness: 200 }); }}
      onPress={onPress}
    >
      <Animated.View style={[animStyle, style]}>{children}</Animated.View>
    </Pressable>
  );
}

function SectionLabel({ children, delay }: { children: string; delay: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400).springify()}>
      <Text
        style={{
          fontFamily: "PlusJakartaSans_700Bold",
          fontSize: 12,
          color: "#9CA3AF",
          letterSpacing: 0.8,
          textTransform: "uppercase",
          paddingHorizontal: 20,
          marginBottom: 10,
        }}
      >
        {children}
      </Text>
    </Animated.View>
  );
}

function ActionRow({
  icon,
  iconBg,
  title,
  subtitle,
  onPress,
  testID,
  delay,
  rightElement,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  testID?: string;
  delay: number;
  rightElement?: React.ReactNode;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400).springify()}>
      <AnimatedPressable
        testID={testID}
        onPress={onPress}
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          borderWidth: 0.5,
          borderColor: "rgba(0,0,0,0.07)",
          padding: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
          elevation: 1,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: iconBg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: "PlusJakartaSans_600SemiBold",
              fontSize: 14,
              color: DARK,
              letterSpacing: -0.1,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              fontFamily: "PlusJakartaSans_400Regular",
              fontSize: 12,
              color: "#9CA3AF",
              marginTop: 2,
              lineHeight: 16,
            }}
          >
            {subtitle}
          </Text>
        </View>
        {rightElement ?? <ChevronRight size={16} color="#D1D5DB" strokeWidth={2} />}
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function CreditsScreen() {
  const router = useRouter();
  const phone = useAuthStore((s) => s.phoneNumber);
  const { data: profile } = useProfile(phone);
  const credits = profile?.tokens ?? 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 56 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(0).duration(400).springify()}
          style={{ paddingHorizontal: 20, paddingTop: 28, paddingBottom: 6 }}
        >
          <Text
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              fontSize: 28,
              color: DARK,
              letterSpacing: -0.8,
            }}
          >
            Reslot credits
          </Text>
          <Text
            style={{
              fontFamily: "PlusJakartaSans_400Regular",
              fontSize: 14,
              color: "#9CA3AF",
              marginTop: 5,
            }}
          >
            Tjäna och använd credits för att ta över bokningar.
          </Text>
        </Animated.View>

        {/* Balance card */}
        <Animated.View
          entering={FadeInDown.delay(80).duration(500).springify()}
          style={{ marginHorizontal: 20, marginTop: 20 }}
        >
          <View
            style={{
              backgroundColor: DARK,
              borderRadius: 24,
              padding: 28,
              alignItems: "center",
              overflow: "hidden",
              shadowColor: DARK,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.2,
              shadowRadius: 24,
              elevation: 8,
            }}
          >
            {/* Decorative circle */}
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
                backgroundColor: "rgba(224,106,78,0.06)",
              }}
            />

            {/* Coin icon */}
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: "rgba(201,169,110,0.15)",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Coins size={28} color={GOLD} strokeWidth={1.8} />
            </View>

            <Text
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                fontSize: 64,
                color: "#FFFFFF",
                letterSpacing: -3,
                lineHeight: 68,
              }}
            >
              {credits}
            </Text>
            <Text
              style={{
                fontFamily: "PlusJakartaSans_500Medium",
                fontSize: 13,
                color: "rgba(255,255,255,0.4)",
                marginTop: 6,
                letterSpacing: 0.3,
              }}
            >
              tillgängliga credits
            </Text>
          </View>
        </Animated.View>

        {/* Hur det fungerar */}
        <View style={{ marginTop: 32 }}>
          <SectionLabel delay={160}>Hur det fungerar</SectionLabel>
          <View style={{ paddingHorizontal: 20, gap: 8 }}>
            <ActionRow
              icon={<PlusCircle size={20} color={CORAL} strokeWidth={2} />}
              iconBg="rgba(224,106,78,0.1)"
              title="Lägg upp en bokning"
              subtitle="Tjäna 1 credit när någon tar över"
              onPress={() => {}}
              delay={200}
              rightElement={
                <View
                  style={{
                    backgroundColor: "rgba(224,106,78,0.1)",
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 11, color: CORAL }}>
                    +1
                  </Text>
                </View>
              }
            />
            <ActionRow
              icon={<Coins size={20} color={GOLD} strokeWidth={2} />}
              iconBg="rgba(201,169,110,0.1)"
              title="Ta över en bokning"
              subtitle="Kostar 2 credits per bokning"
              onPress={() => {}}
              delay={240}
              rightElement={
                <View
                  style={{
                    backgroundColor: "rgba(201,169,110,0.1)",
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 11, color: GOLD }}>
                    −2
                  </Text>
                </View>
              }
            />
          </View>
        </View>

        {/* Köp credits */}
        <View style={{ marginTop: 28 }}>
          <SectionLabel delay={300}>Köp credits</SectionLabel>
          <Animated.View
            entering={FadeInDown.delay(340).duration(400).springify()}
            style={{ paddingHorizontal: 20 }}
          >
            <AnimatedPressable
              testID="buy-credits-button"
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }}
              style={{
                backgroundColor: CORAL,
                borderRadius: 18,
                padding: 18,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                shadowColor: CORAL,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.28,
                shadowRadius: 14,
                elevation: 4,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: "rgba(255,255,255,0.18)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Zap size={20} color="#FFFFFF" strokeWidth={2} />
                </View>
                <View>
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_700Bold",
                      fontSize: 16,
                      color: "#FFFFFF",
                      letterSpacing: -0.2,
                    }}
                  >
                    1 credit
                  </Text>
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_400Regular",
                      fontSize: 13,
                      color: "rgba(255,255,255,0.7)",
                      marginTop: 1,
                    }}
                  >
                    39 kr per styck
                  </Text>
                </View>
              </View>
              <View
                style={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 12,
                }}
              >
                <Text
                  style={{
                    fontFamily: "PlusJakartaSans_700Bold",
                    fontSize: 14,
                    color: "#FFFFFF",
                  }}
                >
                  Köp
                </Text>
              </View>
            </AnimatedPressable>
          </Animated.View>
        </View>

        {/* Få gratis credits */}
        <View style={{ marginTop: 28 }}>
          <SectionLabel delay={400}>Få gratis credits</SectionLabel>
          <View style={{ paddingHorizontal: 20, gap: 8 }}>
            <ActionRow
              testID="invite-friend-button"
              icon={<UserPlus size={20} color={CORAL} strokeWidth={2} />}
              iconBg="rgba(224,106,78,0.1)"
              title="Bjud in en vän"
              subtitle="Du och din vän får 1 credit var"
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              delay={440}
            />
            <ActionRow
              testID="post-booking-button"
              icon={<PlusCircle size={20} color={CORAL} strokeWidth={2} />}
              iconBg="rgba(224,106,78,0.1)"
              title="Lägg upp en bokning"
              subtitle="Tjäna 1 credit när någon tar över"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/(tabs)/submit");
              }}
              delay={480}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
