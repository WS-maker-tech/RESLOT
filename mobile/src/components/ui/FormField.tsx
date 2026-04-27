import React from "react";
import { StyleProp, Text, View, ViewStyle } from "react-native";
import { C, FONTS, SPACING } from "@/lib/theme";

export type FormFieldProps = {
  /** Label visad ovanför fältet */
  label?: string;
  /** Felmeddelande — visas under fältet, ersätter helper när satt */
  error?: string;
  /** Hjälptext — visas under fältet (göms när error finns) */
  helper?: string;
  /** Markera som obligatorisk med * efter labeln */
  required?: boolean;
  /** Innehållet — typiskt en <Input>, men kan vara Switch, Select, etc. */
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * FormField — wrappar en input/control med konsekvent label, error och helper.
 *
 * Användning:
 *   <FormField label="Telefonnummer" error={errors.phone}>
 *     <Input variant="phone" value={phone} onChangeText={setPhone} />
 *   </FormField>
 */
export function FormField({
  label,
  error,
  helper,
  required = false,
  children,
  style,
  testID,
}: FormFieldProps) {
  const hasError = Boolean(error);

  return (
    <View testID={testID} style={[{ rowGap: SPACING.xs }, style]}>
      {label ? (
        <Text
          style={{
            fontFamily: FONTS.semiBold,
            fontSize: 13,
            letterSpacing: 0.2,
            color: C.textSecondary,
          }}
          accessibilityRole="text"
        >
          {label}
          {required ? (
            <Text style={{ color: C.error }}>{" *"}</Text>
          ) : null}
        </Text>
      ) : null}

      {children}

      {hasError ? (
        <Text
          style={{
            fontFamily: FONTS.medium,
            fontSize: 13,
            color: C.error,
            marginTop: SPACING.xxs,
          }}
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      ) : helper ? (
        <Text
          style={{
            fontFamily: FONTS.regular,
            fontSize: 13,
            color: C.textTertiary,
            marginTop: SPACING.xxs,
          }}
        >
          {helper}
        </Text>
      ) : null}
    </View>
  );
}
