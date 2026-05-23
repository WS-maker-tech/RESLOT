import React, { useMemo } from "react";
import { View, Text } from "react-native";
import { FONTS } from "../lib/theme";

/**
 * Tonal palette for monograms — muted, earthy pairs that sit next to the
 * pistachio/forest/gold brand without competing. No neon, no purple.
 */
const MONOGRAM_PALETTE: { bg: string; fg: string }[] = [
  { bg: "#E4EDE1", fg: "#3F5E3B" }, // sage
  { bg: "#F2EAD6", fg: "#876529" }, // sand / gold
  { bg: "#F5E2D8", fg: "#A2543A" }, // terracotta
  { bg: "#E1E8EF", fg: "#3D5566" }, // dusty blue
  { bg: "#EFE6DD", fg: "#6B5440" }, // clay
  { bg: "#ECEEDC", fg: "#5B6135" }, // olive
];

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function getMonogramColors(name: string): { bg: string; fg: string } {
  return MONOGRAM_PALETTE[hashString(name) % MONOGRAM_PALETTE.length]!;
}

export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0]!.charAt(0).toUpperCase();
  return (words[0]!.charAt(0) + words[1]!.charAt(0)).toUpperCase();
}

interface RestaurantMonogramProps {
  name: string;
  size?: number;
  radius?: number;
  ring?: boolean;
}

export function RestaurantMonogram({
  name,
  size = 52,
  radius = 15,
  ring = false,
}: RestaurantMonogramProps) {
  const { bg, fg } = useMemo(() => getMonogramColors(name), [name]);
  const initials = useMemo(() => getInitials(name), [name]);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: ring ? 2 : 0,
        borderColor: ring ? "rgba(126,200,122,0.55)" : "transparent",
      }}
    >
      <Text
        style={{
          fontFamily: FONTS.bold,
          fontSize: size * 0.36,
          color: fg,
          letterSpacing: -0.5,
        }}
      >
        {initials}
      </Text>
    </View>
  );
}
