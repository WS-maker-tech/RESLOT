import React from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { C, MOTION, RADIUS, SHADOW, SPACING } from "@/lib/theme";

export type CardVariant = "flat" | "raised" | "interactive";
export type CardPaddingKey = keyof typeof SPACING | "none";

export type CardProps = {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPaddingKey;
  radius?: keyof typeof RADIUS;
  onPress?: () => void;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function getPadding(padding: CardPaddingKey): number {
  if (padding === "none") return 0;
  return SPACING[padding];
}

/**
 * Card — visuellt skal kring innehåll. Tre varianter:
 * - flat: bakgrundsfärg + RADIUS, ingen skugga (passar i listor)
 * - raised: SHADOW.raised — fristående kort med svävande känsla
 * - interactive: raised + Pressable + scale-on-press
 */
export function Card({
  children,
  variant = "flat",
  padding = "lg",
  radius = "lg",
  onPress,
  fullWidth = true,
  style,
  testID,
  accessibilityLabel,
}: CardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const baseStyle: StyleProp<ViewStyle> = [
    {
      backgroundColor: C.bgCard,
      borderRadius: RADIUS[radius],
      padding: getPadding(padding),
      alignSelf: fullWidth ? "stretch" : "auto",
    },
    variant === "raised" && SHADOW.raised,
    variant === "interactive" && SHADOW.raised,
  ];

  const handlePressIn = () => {
    scale.value = withTiming(0.99, { duration: MOTION.duration.fast });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: MOTION.duration.fast });
  };

  if (variant === "interactive" && onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={[baseStyle, animatedStyle, style]}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <View
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      style={[baseStyle, style]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  // reserved for future variants
});
