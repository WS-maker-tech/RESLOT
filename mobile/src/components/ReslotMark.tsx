import React from "react";
import { Text, type StyleProp, type TextStyle } from "react-native";
import { C } from "@/lib/theme";

/**
 * ReslotMark — Reslot wordmark i Fraunces SemiBold Italic.
 *
 * Wordmark-stilen ärver Pi:s editorial sensibility: enkelt, intentionellt italic,
 * lägger en lätt poetisk ton till varumärket. Identisk på ljus och mörk bakgrund
 * — bara färg ändras.
 *
 * Sparingly: använd på splash, welcome, footer-mark, eller där appen först
 * presenterar sig själv. Inte i navigation, inte i listor, inte som dekoration.
 */

export type ReslotMarkVariant = "mono" | "onCream" | "onForest" | "onCoral";
export type ReslotMarkSize = "sm" | "md" | "lg" | "xl" | "hero";

interface ReslotMarkProps {
  variant?: ReslotMarkVariant;
  size?: ReslotMarkSize;
  style?: StyleProp<TextStyle>;
  testID?: string;
}

const SIZE_FONT_SIZE: Record<ReslotMarkSize, number> = {
  sm: 18,
  md: 24,
  lg: 32,
  xl: 56,
  hero: 88,
};

const VARIANT_COLOR: Record<ReslotMarkVariant, string> = {
  mono: C.forest,
  onCream: C.forest,
  onForest: C.cream,
  onCoral: C.cream,
};

export function ReslotMark({ variant = "mono", size = "md", style, testID }: ReslotMarkProps) {
  const fontSize = SIZE_FONT_SIZE[size];
  const color = VARIANT_COLOR[variant];
  return (
    <Text
      style={[
        {
          fontFamily: "Fraunces_600SemiBold_Italic",
          fontStyle: "italic",
          fontSize,
          letterSpacing: -fontSize * 0.025,
          lineHeight: Math.round(fontSize * 1.05),
          color,
        },
        style,
      ]}
      testID={testID ?? "reslot-mark"}
    >
      Reslot
    </Text>
  );
}
