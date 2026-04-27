import React, { useEffect, useState } from "react";
import { StyleProp, Text, View, ViewStyle } from "react-native";
import { Clock } from "lucide-react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { C, FONTS, ICON, MOTION, RADIUS, SPACING } from "@/lib/theme";

export type CountdownPillProps = {
  /** Mål-tidpunkt — när countdown är 0 */
  targetAt: Date | string | number;
  /** Tröskel (ms) under vilken pillen blir röd och pulsar (default 1h) */
  urgencyThresholdMs?: number;
  /** Visa ikon-prefix */
  showIcon?: boolean;
  /** size sm/md */
  size?: "sm" | "md";
  /** Custom prefix-text ("Försvinner om", "Tagen för", etc) — om angiven används istället för auto */
  prefix?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const SIZE_CONFIG = {
  sm: { paddingV: SPACING.xss, paddingH: SPACING.sm, fontSize: 11, gap: SPACING.xs, iconSize: 12 },
  md: { paddingV: SPACING.xs, paddingH: SPACING.md, fontSize: 13, gap: SPACING.xs, iconSize: 14 },
} as const;

function formatRemaining(ms: number): { text: string; isPast: boolean } {
  if (ms <= 0) {
    const past = Math.abs(ms);
    if (past < 60_000) return { text: "nu", isPast: true };
    if (past < 3_600_000) return { text: `${Math.floor(past / 60_000)} min sedan`, isPast: true };
    if (past < 86_400_000) return { text: `${Math.floor(past / 3_600_000)} h sedan`, isPast: true };
    return { text: `${Math.floor(past / 86_400_000)} d sedan`, isPast: true };
  }
  if (ms < 60_000) return { text: `< 1 min`, isPast: false };
  if (ms < 3_600_000) return { text: `${Math.floor(ms / 60_000)} min`, isPast: false };
  if (ms < 86_400_000) {
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    return { text: m === 0 ? `${h}h` : `${h}h ${m}min`, isPast: false };
  }
  return { text: `${Math.floor(ms / 86_400_000)} d`, isPast: false };
}

/**
 * CountdownPill — visar tid kvar (eller tid sedan) i pill-format.
 * Under urgencyThreshold (default 1h) → röd + pulserar.
 * Över → pistachio.
 * Past (negativ ms) → neutral grå.
 */
export function CountdownPill({
  targetAt,
  urgencyThresholdMs = 3_600_000,
  showIcon = true,
  size = "md",
  prefix,
  style,
  testID,
}: CountdownPillProps) {
  const cfg = SIZE_CONFIG[size];
  const targetMs =
    typeof targetAt === "number"
      ? targetAt
      : typeof targetAt === "string"
        ? new Date(targetAt).getTime()
        : targetAt.getTime();

  const [remaining, setRemaining] = useState(targetMs - Date.now());

  useEffect(() => {
    const tick = () => setRemaining(targetMs - Date.now());
    tick();
    const id = setInterval(tick, 30_000); // 30s precision
    return () => clearInterval(id);
  }, [targetMs]);

  const { text, isPast } = formatRemaining(remaining);
  const isUrgent = !isPast && remaining > 0 && remaining < urgencyThresholdMs;

  // Pulse for urgent
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (isUrgent) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.04, { duration: MOTION.duration.slow }),
          withTiming(1, { duration: MOTION.duration.slow }),
        ),
        -1,
        true,
      );
    } else {
      pulse.value = 1;
    }
  }, [isUrgent]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const bg = isPast ? C.bgInput : isUrgent ? C.errorLight : C.pistachioLight;
  const fg = isPast ? C.textTertiary : isUrgent ? C.error : C.pistachio;

  return (
    <Animated.View
      testID={testID}
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          alignSelf: "flex-start",
          backgroundColor: bg,
          paddingVertical: cfg.paddingV,
          paddingHorizontal: cfg.paddingH,
          borderRadius: RADIUS.pill,
          columnGap: cfg.gap,
        },
        animStyle,
        style,
      ]}
    >
      {showIcon ? (
        <Clock size={cfg.iconSize} color={fg} strokeWidth={ICON.strokeWidth} />
      ) : null}
      <Text
        style={{
          fontFamily: FONTS.semiBold,
          fontSize: cfg.fontSize,
          color: fg,
          letterSpacing: -0.1,
        }}
      >
        {prefix ? `${prefix} ${text}` : text}
      </Text>
    </Animated.View>
  );
}
