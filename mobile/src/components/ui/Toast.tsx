import React, { useEffect } from "react";
import { StyleProp, Text, View, ViewStyle } from "react-native";
import { CheckCircle2, AlertCircle, Info, XCircle } from "lucide-react-native";
import Animated, {
  FadeInDown,
  FadeOutDown,
  FadeInUp,
  FadeOutUp,
} from "react-native-reanimated";
import { C, FONTS, ICON, MOTION, RADIUS, SHADOW, SPACING } from "@/lib/theme";

export type ToastVariant = "success" | "error" | "warning" | "info";
export type ToastPosition = "top" | "bottom";

export type ToastProps = {
  /** Toast-varianten */
  variant?: ToastVariant;
  /** Visningstext */
  message: string;
  /** Sub-text under huvudraden */
  detail?: string;
  /** Position på skärmen */
  position?: ToastPosition;
  /** Antal ms innan auto-dismiss (0 = stannar tills man klickar bort) */
  duration?: number;
  /** Anropas när toasten stängs */
  onDismiss?: () => void;
  /** Synlighet (controlled) */
  visible: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

function getVisuals(variant: ToastVariant) {
  switch (variant) {
    case "success":
      return { Icon: CheckCircle2, fg: C.success, bg: C.successLight };
    case "error":
      return { Icon: XCircle, fg: C.error, bg: C.errorLight };
    case "warning":
      return { Icon: AlertCircle, fg: C.warning, bg: "rgba(245,158,11,0.12)" };
    case "info":
      return { Icon: Info, fg: C.info, bg: C.infoLight };
  }
}

/**
 * Toast — kort feedback-meddelande som glider in/ut.
 *
 * Användning:
 *   const [visible, setVisible] = useState(false);
 *   <Toast
 *     visible={visible}
 *     variant="success"
 *     message="Bokning sparad"
 *     onDismiss={() => setVisible(false)}
 *   />
 */
export function Toast({
  variant = "info",
  message,
  detail,
  position = "bottom",
  duration = 3500,
  onDismiss,
  visible,
  style,
  testID,
}: ToastProps) {
  const { Icon, fg, bg } = getVisuals(variant);

  useEffect(() => {
    if (!visible || duration <= 0) return;
    const id = setTimeout(() => onDismiss?.(), duration);
    return () => clearTimeout(id);
  }, [visible, duration, onDismiss]);

  if (!visible) return null;

  const enter =
    position === "top"
      ? FadeInUp.duration(MOTION.duration.ease)
      : FadeInDown.duration(MOTION.duration.ease);
  const exit =
    position === "top"
      ? FadeOutUp.duration(MOTION.duration.fast)
      : FadeOutDown.duration(MOTION.duration.fast);

  return (
    <Animated.View
      testID={testID}
      entering={enter}
      exiting={exit}
      style={[
        {
          position: "absolute",
          left: SPACING.lg,
          right: SPACING.lg,
          [position]: SPACING.xxl,
          backgroundColor: C.bgCard,
          borderRadius: RADIUS.lg,
          padding: SPACING.md,
          flexDirection: "row",
          alignItems: "center",
          columnGap: SPACING.sm,
          ...SHADOW.floating,
          zIndex: 1000,
        },
        style,
      ]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={ICON.size.md} color={fg} strokeWidth={ICON.strokeWidth} />
      </View>
      <View style={{ flex: 1, rowGap: 2 }}>
        <Text
          style={{
            fontFamily: FONTS.semiBold,
            fontSize: 15,
            color: C.textPrimary,
            letterSpacing: -0.1,
          }}
          numberOfLines={2}
        >
          {message}
        </Text>
        {detail ? (
          <Text
            style={{
              fontFamily: FONTS.regular,
              fontSize: 13,
              color: C.textSecondary,
              lineHeight: 18,
            }}
            numberOfLines={3}
          >
            {detail}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );
}
