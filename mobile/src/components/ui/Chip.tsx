import React from "react";
import { Pressable, StyleProp, Text, View, ViewStyle } from "react-native";
import { Check, X } from "lucide-react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { C, FONTS, ICON, MOTION, RADIUS, SPACING } from "@/lib/theme";

export type ChipSize = "sm" | "md";

export type ChipProps = {
  /** Etikett-text */
  label: string;
  /** Är vald (controlled) */
  selected?: boolean;
  /** Klickas → toggle */
  onToggle?: (next: boolean) => void;
  /** Vänsterikon */
  leftIcon?: React.ReactNode;
  /** Visa check när selected */
  showCheckWhenSelected?: boolean;
  /** Visa X-knapp för att rensa (på selected) */
  removable?: boolean;
  onRemove?: () => void;
  /** Storlek */
  size?: ChipSize;
  /** Disabled-state */
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const SIZE_CONFIG = {
  sm: { paddingV: SPACING.xss, paddingH: SPACING.sm, fontSize: 12, gap: SPACING.xs, iconSize: 12 },
  md: { paddingV: SPACING.xs, paddingH: SPACING.md, fontSize: 13, gap: SPACING.xs, iconSize: 14 },
} as const;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Chip — interaktiv filter-/kategori-chip.
 * Generalisering av befintliga FilterChips. Stöder selected-state, ikoner,
 * removable (X-knapp), accessibilityRole="checkbox".
 */
export function Chip({
  label,
  selected = false,
  onToggle,
  leftIcon,
  showCheckWhenSelected = false,
  removable = false,
  onRemove,
  size = "md",
  disabled = false,
  style,
  testID,
}: ChipProps) {
  const cfg = SIZE_CONFIG[size];
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled) scale.value = withTiming(0.96, { duration: MOTION.duration.fast });
  };
  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: MOTION.duration.fast });
  };
  const handlePress = () => {
    if (disabled) return;
    onToggle?.(!selected);
  };

  const bg = selected ? C.pistachio : C.bgInput;
  const fg = selected ? C.dark : C.textSecondary;

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      testID={testID}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected, disabled }}
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: bg,
          paddingVertical: cfg.paddingV,
          paddingHorizontal: cfg.paddingH,
          borderRadius: RADIUS.pill,
          columnGap: cfg.gap,
          alignSelf: "flex-start",
          opacity: disabled ? 0.5 : 1,
        },
        animatedStyle,
        style,
      ]}
    >
      {selected && showCheckWhenSelected ? (
        <Check size={cfg.iconSize} color={fg} strokeWidth={2.5} />
      ) : leftIcon ? (
        <View>{leftIcon}</View>
      ) : null}
      <Text
        numberOfLines={1}
        style={{
          fontFamily: FONTS.semiBold,
          fontSize: cfg.fontSize,
          color: fg,
          letterSpacing: -0.1,
        }}
      >
        {label}
      </Text>
      {removable && selected ? (
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`Ta bort ${label}`}
        >
          <X size={cfg.iconSize - 1} color={fg} strokeWidth={ICON.strokeWidth} />
        </Pressable>
      ) : null}
    </AnimatedPressable>
  );
}
