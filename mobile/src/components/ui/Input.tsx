import React, { forwardRef, useState } from "react";
import {
  Platform,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
import { C, FONTS, MOTION, RADIUS, SPACING } from "@/lib/theme";

export type InputVariant = "text" | "numeric" | "phone" | "email" | "password";
export type InputSize = "sm" | "md" | "lg";

export type InputProps = Omit<TextInputProps, "style"> & {
  variant?: InputVariant;
  size?: InputSize;
  hasError?: boolean;
  multiline?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
};

const SIZE_CONFIG = {
  sm: { height: 40, paddingV: SPACING.xs, fontSize: 14 },
  md: { height: 48, paddingV: SPACING.sm, fontSize: 16 },
  lg: { height: 56, paddingV: SPACING.md, fontSize: 17 },
} as const;

function getInputProps(variant: InputVariant): Partial<TextInputProps> {
  switch (variant) {
    case "numeric":
      return { keyboardType: "numeric", autoCorrect: false };
    case "phone":
      return {
        keyboardType: "phone-pad",
        autoComplete: "tel",
        textContentType: "telephoneNumber",
        autoCorrect: false,
      };
    case "email":
      return {
        keyboardType: "email-address",
        autoCapitalize: "none",
        autoComplete: "email",
        textContentType: "emailAddress",
        autoCorrect: false,
      };
    case "password":
      return {
        secureTextEntry: true,
        autoCapitalize: "none",
        autoComplete: "password",
        textContentType: "password",
        autoCorrect: false,
      };
    default:
      return {};
  }
}

/**
 * Input — premium textfält med fokus-ring, error-state och variants.
 * Kombinera med FormField för label/error/helper-presentation.
 */
export const Input = forwardRef<TextInput, InputProps>(function Input(
  {
    variant = "text",
    size = "md",
    hasError = false,
    multiline = false,
    leftIcon,
    rightIcon,
    containerStyle,
    onFocus,
    onBlur,
    placeholderTextColor,
    ...rest
  },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const focus = useSharedValue(0);

  const cfg = SIZE_CONFIG[size];

  const animatedStyle = useAnimatedStyle(() => {
    const targetColor = hasError
      ? C.error
      : interpolateColor(focus.value, [0, 1], [C.bgInput, C.pistachio]);
    return {
      borderColor: targetColor,
      borderWidth: hasError || focus.value > 0.5 ? 1.5 : StyleSheet.hairlineWidth,
    };
  });

  const handleFocus = (e: Parameters<NonNullable<TextInputProps["onFocus"]>>[0]) => {
    setFocused(true);
    focus.value = withTiming(1, { duration: MOTION.duration.fast });
    onFocus?.(e);
  };

  const handleBlur = (e: Parameters<NonNullable<TextInputProps["onBlur"]>>[0]) => {
    setFocused(false);
    focus.value = withTiming(0, { duration: MOTION.duration.fast });
    onBlur?.(e);
  };

  const variantProps = getInputProps(variant);
  const minH = multiline ? cfg.height * 2.5 : cfg.height;

  return (
    <Animated.View
      style={[
        {
          flexDirection: "row",
          alignItems: multiline ? "flex-start" : "center",
          backgroundColor: C.bgInput,
          borderRadius: RADIUS.md,
          paddingHorizontal: SPACING.md,
          paddingVertical: multiline ? SPACING.sm : 0,
          minHeight: minH,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: C.bgInput,
        },
        animatedStyle,
        containerStyle,
      ]}
    >
      {leftIcon ? <View style={styles.icon}>{leftIcon}</View> : null}
      <TextInput
        ref={ref}
        {...variantProps}
        {...rest}
        multiline={multiline}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholderTextColor={placeholderTextColor ?? C.textTertiary}
        style={{
          flex: 1,
          fontFamily: FONTS.regular,
          fontSize: cfg.fontSize,
          color: C.textPrimary,
          paddingVertical: multiline ? 0 : cfg.paddingV,
          paddingHorizontal: leftIcon || rightIcon ? SPACING.xs : 0,
          minHeight: multiline ? cfg.height * 2.2 : undefined,
          textAlignVertical: multiline ? "top" : "center",
          ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
        }}
      />
      {rightIcon ? <View style={styles.icon}>{rightIcon}</View> : null}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  icon: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.xs,
  },
});
