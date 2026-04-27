import React from "react";
import { Image } from "expo-image";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { C, FONTS, RADIUS } from "@/lib/theme";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl" | "xxl";

export type AvatarProps = {
  /** Bild-URL (https). Om saknas → initialer */
  source?: string | null;
  /** Användarens namn — används för fallback-initialer (1-2 bokstäver) */
  name?: string | null;
  size?: AvatarSize;
  /** Border (t.ex. pistachio runt verifierade) */
  bordered?: boolean;
  borderColor?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const SIZE_CONFIG: Record<AvatarSize, { dim: number; font: number; border: number }> = {
  xs: { dim: 24, font: 10, border: 1 },
  sm: { dim: 32, font: 12, border: 1.5 },
  md: { dim: 44, font: 16, border: 2 },
  lg: { dim: 56, font: 20, border: 2 },
  xl: { dim: 72, font: 26, border: 3 },
  xxl: { dim: 96, font: 36, border: 3 },
};

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase();
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

/**
 * Avatar — användarens bild eller fallback-initialer.
 * Standardstorlek md (44×44) följer iOS HIG touch-target.
 */
export function Avatar({
  source,
  name,
  size = "md",
  bordered = false,
  borderColor = C.pistachio,
  style,
  testID,
}: AvatarProps) {
  const cfg = SIZE_CONFIG[size];
  const initials = getInitials(name ?? "");

  const baseStyle: StyleProp<ViewStyle> = [
    {
      width: cfg.dim,
      height: cfg.dim,
      borderRadius: cfg.dim / 2,
      backgroundColor: C.bgInput,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    bordered && {
      borderWidth: cfg.border,
      borderColor,
    },
    style,
  ];

  if (source) {
    return (
      <View testID={testID} style={baseStyle}>
        <Image
          source={{ uri: source }}
          style={{ width: cfg.dim, height: cfg.dim }}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      </View>
    );
  }

  return (
    <View testID={testID} style={baseStyle}>
      <Text
        style={{
          fontFamily: FONTS.semiBold,
          fontSize: cfg.font,
          color: C.textSecondary,
          letterSpacing: 0.2,
        }}
      >
        {initials}
      </Text>
    </View>
  );
}

export type AvatarGroupProps = {
  avatars: { source?: string | null; name?: string | null }[];
  size?: AvatarSize;
  max?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * AvatarGroup — staplade avatarer (max ~5 visas, resten som '+N').
 */
export function AvatarGroup({ avatars, size = "md", max = 4, style }: AvatarGroupProps) {
  const cfg = SIZE_CONFIG[size];
  const visible = avatars.slice(0, max);
  const overflow = Math.max(0, avatars.length - max);

  return (
    <View style={[{ flexDirection: "row" }, style]}>
      {visible.map((a, i) => (
        <View
          key={`avatar-${i}`}
          style={{
            marginLeft: i === 0 ? 0 : -cfg.dim / 3,
          }}
        >
          <Avatar
            source={a.source}
            name={a.name}
            size={size}
            bordered
            borderColor={C.bgCard}
          />
        </View>
      ))}
      {overflow > 0 ? (
        <View
          style={{
            width: cfg.dim,
            height: cfg.dim,
            borderRadius: cfg.dim / 2,
            backgroundColor: C.dark,
            alignItems: "center",
            justifyContent: "center",
            marginLeft: -cfg.dim / 3,
            borderWidth: cfg.border,
            borderColor: C.bgCard,
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.semiBold,
              fontSize: cfg.font - 2,
              color: C.white,
            }}
          >
            +{overflow}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
