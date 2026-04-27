import React from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { ChevronRight } from "lucide-react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { C, FONTS, ICON, MOTION, SPACING } from "@/lib/theme";

export type ListItemDensity = "tight" | "cozy" | "comfortable";

export type ListItemProps = {
  /** Vänster ikon-slot — typiskt en lucide-ikon eller `<Avatar>` */
  leftIcon?: React.ReactNode;
  /** Huvudtext */
  title: string;
  /** Sekundär text under titeln */
  subtitle?: string;
  /** Höger slot — chevron, värde-text, switch, custom JSX */
  trailing?: React.ReactNode;
  /** Visa default chevron till höger om trailing inte är satt */
  showChevron?: boolean;
  /** Onpress → blir Pressable med ripple/scale-feedback */
  onPress?: () => void;
  /** Fyllnad/storlek */
  density?: ListItemDensity;
  /** Lägg till hairline-divider längst ned */
  divider?: boolean;
  /** Stil-override på rotcontainer */
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
};

const DENSITY_CONFIG = {
  tight: { paddingV: SPACING.sm, gap: SPACING.sm },
  cozy: { paddingV: SPACING.md, gap: SPACING.md },
  comfortable: { paddingV: SPACING.lg, gap: SPACING.md },
} as const;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * ListItem — standardiserad rad med vänsterikon + titel/subtitel + trailing.
 * Används för settings-rader, profil-länkar, navigation-listor m.m.
 */
export function ListItem({
  leftIcon,
  title,
  subtitle,
  trailing,
  showChevron = false,
  onPress,
  density = "cozy",
  divider = false,
  style,
  testID,
  accessibilityLabel,
}: ListItemProps) {
  const cfg = DENSITY_CONFIG[density];
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const content = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        columnGap: cfg.gap,
        paddingVertical: cfg.paddingV,
        paddingHorizontal: SPACING.md,
        borderBottomWidth: divider ? StyleSheet.hairlineWidth : 0,
        borderBottomColor: C.divider,
      }}
    >
      {leftIcon ? (
        <View style={styles.leftSlot}>{leftIcon}</View>
      ) : null}

      <View style={{ flex: 1, rowGap: SPACING.xxs }}>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: FONTS.semiBold,
            fontSize: 16,
            color: C.textPrimary,
            letterSpacing: -0.1,
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            numberOfLines={2}
            style={{
              fontFamily: FONTS.regular,
              fontSize: 13,
              color: C.textSecondary,
              lineHeight: 18,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {trailing ? (
        <View style={styles.trailingSlot}>{trailing}</View>
      ) : showChevron ? (
        <ChevronRight
          size={ICON.size.md}
          color={C.textTertiary}
          strokeWidth={ICON.strokeWidth}
        />
      ) : null}
    </View>
  );

  if (!onPress) {
    return (
      <View
        testID={testID}
        accessibilityLabel={accessibilityLabel}
        style={style}
      >
        {content}
      </View>
    );
  }

  const handlePressIn = () => {
    opacity.value = withTiming(0.6, { duration: MOTION.duration.fast });
  };
  const handlePressOut = () => {
    opacity.value = withTiming(1, { duration: MOTION.duration.fast });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      style={[animatedStyle, style]}
    >
      {content}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  leftSlot: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  trailingSlot: {
    flexDirection: "row",
    alignItems: "center",
  },
});
