import React from "react";
import { View, Text } from "react-native";
import { Sparkles, ShieldCheck, Info } from "lucide-react-native";
import { C, FONTS, RADIUS } from "@/lib/theme";

export type CalloutVariant = "tip" | "note" | "trust";

const VARIANTS = {
  tip: { bg: "rgba(31,77,42,0.06)", icon: C.forest, text: C.forest, Icon: Sparkles },
  trust: { bg: "rgba(31,77,42,0.06)", icon: C.forest, text: C.forest, Icon: ShieldCheck },
  note: { bg: C.goldLight, icon: C.gold, text: C.textSecondary, Icon: Info },
} as const;

interface CalloutProps {
  variant?: CalloutVariant;
  children: React.ReactNode;
  /** Override the default variant icon */
  icon?: React.ReactNode;
  testID?: string;
}

/**
 * Callout — one calm, editorial info box for the whole submit flow.
 * Replaces the ad-hoc green/gold hint boxes so callouts read as one system.
 * `tip` (forest) for guidance, `trust` (forest + shield) for reassurance,
 * `note` (gold) for soft asides.
 */
export function Callout({ variant = "tip", children, icon, testID }: CalloutProps) {
  const v = VARIANTS[variant];
  const Icon = v.Icon;
  return (
    <View
      testID={testID}
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 9,
        backgroundColor: v.bg,
        borderRadius: RADIUS.md,
        paddingVertical: 13,
        paddingHorizontal: 14,
      }}
    >
      {icon ?? <Icon size={15} color={v.icon} strokeWidth={2} style={{ marginTop: 1 }} />}
      <Text style={{ flex: 1, fontFamily: FONTS.medium, fontSize: 13, lineHeight: 19, color: v.text }}>
        {children}
      </Text>
    </View>
  );
}
