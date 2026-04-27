import React from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { C, FONTS, SPACING } from "@/lib/theme";

export type DividerVariant = "hairline" | "thin" | "section";
export type DividerOrientation = "horizontal" | "vertical";

export type DividerProps = {
  variant?: DividerVariant;
  orientation?: DividerOrientation;
  /** Frivillig label i mitten (ex 'eller') — bryter linjen */
  label?: string;
  /** Färg-override */
  color?: string;
  /** Vertikal spacing runt — bara för horizontal */
  spacingY?: keyof typeof SPACING | "none";
  style?: StyleProp<ViewStyle>;
};

const VARIANT_THICKNESS: Record<DividerVariant, number> = {
  hairline: StyleSheet.hairlineWidth,
  thin: 1,
  section: 8, // tjockt mellan sektioner
};

/**
 * Divider — typad horisontell eller vertikal avgränsare.
 * - hairline: subtila lista-rader-divider
 * - thin: 1px solid
 * - section: tjock 8px utan färg (whitespace-divider mellan sektioner)
 *
 * label="eller" ger en linje med text i mitten (för auth-flöden).
 */
export function Divider({
  variant = "hairline",
  orientation = "horizontal",
  label,
  color,
  spacingY = "none",
  style,
}: DividerProps) {
  const thickness = VARIANT_THICKNESS[variant];
  const isSection = variant === "section";
  const dividerColor = color ?? (isSection ? C.bg : C.divider);

  if (orientation === "vertical") {
    return (
      <View
        style={[
          {
            width: thickness,
            backgroundColor: dividerColor,
            alignSelf: "stretch",
          },
          style,
        ]}
      />
    );
  }

  const verticalMargin = spacingY === "none" ? 0 : SPACING[spacingY];

  if (label) {
    return (
      <View
        style={[
          {
            flexDirection: "row",
            alignItems: "center",
            marginVertical: verticalMargin,
            columnGap: SPACING.sm,
          },
          style,
        ]}
      >
        <View style={{ flex: 1, height: thickness, backgroundColor: dividerColor }} />
        <Text
          style={{
            fontFamily: FONTS.medium,
            fontSize: 12,
            color: C.textTertiary,
            letterSpacing: 0.4,
          }}
        >
          {label}
        </Text>
        <View style={{ flex: 1, height: thickness, backgroundColor: dividerColor }} />
      </View>
    );
  }

  return (
    <View
      style={[
        {
          height: thickness,
          backgroundColor: dividerColor,
          marginVertical: verticalMargin,
        },
        style,
      ]}
    />
  );
}
