import { View, Text } from "react-native";
import { Shield, ShieldCheck, Star, Sparkles } from "lucide-react-native";
import { C, FONTS, RADIUS, SPACING } from "@/lib/theme";

interface TrustBadgeProps {
  score: number;
  compact?: boolean;
}

type TrustLevel = {
  label: string;
  color: string;
  bg: string;
  icon: typeof Shield;
};

function getTrustLevel(score: number): TrustLevel {
  if (score >= 4.5) return { label: "Betrodd", color: C.successBright, bg: C.successLight, icon: Star };
  if (score >= 3.5) return { label: "Pålitlig", color: C.success, bg: C.successBg, icon: ShieldCheck };
  if (score >= 2.5) return { label: "Etablerad", color: C.gold, bg: C.goldLight, icon: Shield };
  return { label: "Ny", color: C.textTertiary, bg: C.overlayLight, icon: Sparkles };
}

export function TrustBadge({ score, compact = false }: TrustBadgeProps) {
  const level = getTrustLevel(score);
  const Icon = level.icon;

  if (compact) {
    return (
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: level.bg,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: RADIUS.sm,
        gap: 3,
      }}>
        <Icon size={10} color={level.color} strokeWidth={2.5} />
        <Text style={{
          fontFamily: FONTS.semiBold,
          fontSize: 10,
          color: level.color,
        }}>
          {level.label}
        </Text>
      </View>
    );
  }

  return (
    <View style={{
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: level.bg,
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xs,
      borderRadius: RADIUS.sm,
      gap: SPACING.xs,
    }}>
      <Icon size={14} color={level.color} strokeWidth={2.5} />
      <Text style={{
        fontFamily: FONTS.semiBold,
        fontSize: 12,
        color: level.color,
      }}>
        {level.label}
      </Text>
    </View>
  );
}
