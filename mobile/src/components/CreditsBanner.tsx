import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Coins, ChevronRight } from "lucide-react-native";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { C, FONTS, SPACING, RADIUS } from "../lib/theme";

export function CreditsBanner() {
  const router = useRouter();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(200).springify()}>
      <Pressable
        testID="credits-banner"
        accessibilityLabel="Visa Reslot credits"
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 12, stiffness: 200 });
        }}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push("/credits");
        }}
      >
        <Animated.View style={[animStyle, styles.container]}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center" style={styles.leftContent}>
              <View style={styles.iconContainer}>
                <Coins size={18} color={C.gold} strokeWidth={2} />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.title}>
                  Reslot credits
                </Text>
                <Text style={styles.subtitle} numberOfLines={2}>
                  Lägg upp bokningar och tjäna credits. Utforska nu
                </Text>
              </View>
            </View>
            <ChevronRight size={18} color={C.gold} strokeWidth={2} style={{ marginLeft: 8 }} />
          </View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: SPACING.lg,
    marginVertical: 12,
    backgroundColor: "rgba(201, 169, 110, 0.06)",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "rgba(201, 169, 110, 0.12)",
    padding: SPACING.md,
  },
  leftContent: {
    flex: 1,
    gap: 10,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(201, 169, 110, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: FONTS.displaySemiBold,
    fontSize: 14,
    color: C.textPrimary,
    letterSpacing: -0.1,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: C.textTertiary,
    marginTop: 2,
    lineHeight: 16,
  },
});
