import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { C, FONTS, MOTION, RADIUS, SPACING } from "@/lib/theme";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "link";
export type ButtonSize = "sm" | "md" | "lg";

export type ButtonProps = {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  hapticOnPress?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
};

const SIZE_CONFIG = {
  sm: { height: 36, paddingH: SPACING.md, fontSize: 14, iconGap: SPACING.xs },
  md: { height: 48, paddingH: SPACING.lg, fontSize: 16, iconGap: SPACING.sm },
  lg: { height: 56, paddingH: SPACING.xl, fontSize: 17, iconGap: SPACING.sm },
} as const;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  children,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  hapticOnPress = true,
  style,
  testID,
  accessibilityLabel,
}: ButtonProps) {
  const scale = useSharedValue(1);
  const isInactive = disabled || loading;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const cfg = SIZE_CONFIG[size];

  const variantStyle = useMemo(() => {
    switch (variant) {
      case "primary":
        return { bg: C.pistachio, fg: C.dark, border: undefined };
      case "secondary":
        return { bg: "transparent", fg: C.textPrimary, border: C.divider };
      case "ghost":
        return { bg: "transparent", fg: C.textPrimary, border: undefined };
      case "danger":
        return { bg: C.error, fg: C.white, border: undefined };
      case "link":
        return { bg: "transparent", fg: C.pistachio, border: undefined };
      default:
        return { bg: C.pistachio, fg: C.dark, border: undefined };
    }
  }, [variant]);

  const handlePressIn = () => {
    scale.value = withTiming(0.97, { duration: MOTION.duration.fast });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: MOTION.duration.fast });
  };

  const handlePress = () => {
    if (isInactive) return;
    if (hapticOnPress && variant !== "link") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPress?.();
  };

  const isLink = variant === "link";

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isInactive}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isInactive, busy: loading }}
      hitSlop={isLink ? 8 : 4}
      style={[
        styles.base,
        {
          height: isLink ? undefined : cfg.height,
          paddingHorizontal: isLink ? 0 : cfg.paddingH,
          backgroundColor: variantStyle.bg,
          borderWidth: variantStyle.border ? StyleSheet.hairlineWidth : 0,
          borderColor: variantStyle.border ?? "transparent",
          borderRadius: RADIUS.pill,
          opacity: disabled ? 0.5 : 1,
          alignSelf: fullWidth ? "stretch" : "auto",
        },
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyle.fg} />
      ) : (
        <View style={[styles.row, { columnGap: cfg.iconGap }]}>
          {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
          <Text
            style={{
              fontFamily: FONTS.semiBold,
              fontSize: cfg.fontSize,
              color: variantStyle.fg,
              letterSpacing: -0.1,
            }}
            numberOfLines={1}
          >
            {children}
          </Text>
          {rightIcon ? <View style={styles.icon}>{rightIcon}</View> : null}
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    alignItems: "center",
    justifyContent: "center",
  },
});
