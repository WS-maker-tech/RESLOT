import React from "react";
import { StyleProp, Text, View, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from "react-native-reanimated";
import { C, FONTS, MOTION, SPACING } from "@/lib/theme";

export type StepperProps = {
  /** Aktuellt steg (0-indexerat). Värden 0..total */
  current: number;
  /** Totalt antal steg */
  total: number;
  /** Visa "Steg X av Y"-label ovanför */
  showLabel?: boolean;
  /** Custom label-text (annars auto "Steg X av Y") */
  label?: string;
  /** Tunna/feta segment */
  size?: "sm" | "md";
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const SIZE_CONFIG = {
  sm: { height: 4, gap: SPACING.xxs },
  md: { height: 6, gap: SPACING.xs },
} as const;

/**
 * Stepper — visualiserar progress i ett flerstegs-flöde (submit-formulär).
 *
 * Segment per steg, fyllt eller tomt. Aktivt steg animeras in via spring.
 *
 * Användning:
 *   <Stepper current={2} total={6} showLabel />
 */
export function Stepper({
  current,
  total,
  showLabel = false,
  label,
  size = "md",
  style,
  testID,
}: StepperProps) {
  const cfg = SIZE_CONFIG[size];
  const safeCurrent = Math.max(0, Math.min(current, total));

  return (
    <View testID={testID} style={[{ rowGap: SPACING.xs }, style]}>
      {showLabel ? (
        <Text
          style={{
            fontFamily: FONTS.semiBold,
            fontSize: 11,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            color: C.textTertiary,
          }}
        >
          {label ?? `Steg ${safeCurrent + 1} av ${total}`}
        </Text>
      ) : null}
      <View style={{ flexDirection: "row", columnGap: cfg.gap }}>
        {Array.from({ length: total }).map((_, i) => (
          <StepperSegment
            key={`segment-${i}`}
            filled={i < safeCurrent}
            active={i === safeCurrent}
            height={cfg.height}
          />
        ))}
      </View>
    </View>
  );
}

function StepperSegment({
  filled,
  active,
  height,
}: {
  filled: boolean;
  active: boolean;
  height: number;
}) {
  const fillProgress = useDerivedValue(() => {
    if (filled) return withSpring(1, MOTION.easing.spring);
    if (active) return withSpring(0.5, MOTION.easing.spring);
    return withSpring(0, MOTION.easing.spring);
  }, [filled, active]);

  const animStyle = useAnimatedStyle(() => ({
    width: `${fillProgress.value * 100}%`,
    backgroundColor: filled
      ? C.pistachio
      : active
        ? C.pistachio
        : "transparent",
  }));

  return (
    <View
      style={{
        flex: 1,
        height,
        backgroundColor: C.bgInput,
        borderRadius: height / 2,
        overflow: "hidden",
      }}
    >
      <Animated.View
        style={[
          {
            height: "100%",
            borderRadius: height / 2,
          },
          animStyle,
        ]}
      />
    </View>
  );
}
