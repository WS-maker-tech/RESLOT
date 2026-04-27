import React from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { C, FONTS, RADIUS, SPACING } from "@/lib/theme";

export type TagVariant =
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "gold"
  | "neutral";
export type TagStyle = "soft" | "solid";
export type TagSize = "sm" | "md";

export type TagProps = {
  children: React.ReactNode;
  variant?: TagVariant;
  appearance?: TagStyle;
  size?: TagSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  uppercase?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const SIZE_CONFIG = {
  sm: { paddingV: SPACING.xss, paddingH: SPACING.sm, fontSize: 11, gap: SPACING.xxs },
  md: { paddingV: SPACING.xs, paddingH: SPACING.md, fontSize: 12, gap: SPACING.xs },
} as const;

function getColors(variant: TagVariant, appearance: TagStyle) {
  if (appearance === "solid") {
    switch (variant) {
      case "brand":
        return { bg: C.pistachio, fg: C.dark };
      case "success":
        return { bg: C.successBright, fg: C.white };
      case "warning":
        return { bg: C.warning, fg: C.dark };
      case "danger":
        return { bg: C.error, fg: C.white };
      case "info":
        return { bg: C.info, fg: C.white };
      case "gold":
        return { bg: C.gold, fg: C.dark };
      case "neutral":
        return { bg: C.bgInput, fg: C.textSecondary };
    }
  }
  // soft
  switch (variant) {
    case "brand":
      return { bg: C.coralLight, fg: C.pistachio };
    case "success":
      return { bg: C.successLight, fg: C.success };
    case "warning":
      return { bg: "rgba(245,158,11,0.12)", fg: C.warning };
    case "danger":
      return { bg: C.errorLight, fg: C.error };
    case "info":
      return { bg: C.infoLight, fg: C.info };
    case "gold":
      return { bg: C.goldLight, fg: C.gold };
    case "neutral":
      return { bg: C.bgInput, fg: C.textSecondary };
  }
}

/**
 * Tag — kompakt etikett för status, badges och kategorier.
 * Två stilar: 'soft' (ljus bakgrund + färgad text) eller 'solid' (full färg-bakgrund + ljus text).
 */
export function Tag({
  children,
  variant = "neutral",
  appearance = "soft",
  size = "md",
  leftIcon,
  rightIcon,
  uppercase = false,
  style,
  testID,
}: TagProps) {
  const cfg = SIZE_CONFIG[size];
  const { bg, fg } = getColors(variant, appearance);

  return (
    <View
      testID={testID}
      style={[
        styles.base,
        {
          backgroundColor: bg,
          paddingVertical: cfg.paddingV,
          paddingHorizontal: cfg.paddingH,
          columnGap: cfg.gap,
          borderRadius: RADIUS.pill,
        },
        style,
      ]}
    >
      {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
      <Text
        numberOfLines={1}
        style={{
          fontFamily: FONTS.semiBold,
          fontSize: cfg.fontSize,
          color: fg,
          letterSpacing: uppercase ? 0.6 : 0,
          textTransform: uppercase ? "uppercase" : "none",
        }}
      >
        {children}
      </Text>
      {rightIcon ? <View style={styles.icon}>{rightIcon}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  icon: {
    alignItems: "center",
    justifyContent: "center",
  },
});
