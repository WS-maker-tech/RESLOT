import React from "react";
import { StyleProp, Text, View, ViewStyle } from "react-native";
import { C, FONTS, SPACING } from "@/lib/theme";
import { Button, type ButtonProps } from "./Button";

export type EmptyStateProps = {
  /** Vänster ikon eller illustration (Reactnod) */
  icon?: React.ReactNode;
  /** Huvudrubrik */
  title: string;
  /** Stödtext under rubriken */
  body?: string;
  /** Primary CTA — om satt visas en <Button> */
  cta?: {
    label: string;
    onPress: () => void;
    variant?: ButtonProps["variant"];
  };
  /** Sekundär CTA */
  secondaryCta?: {
    label: string;
    onPress: () => void;
  };
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * EmptyState — för tomma listor (Reservations, Alerts, Saved, etc).
 * Ikon + rubrik + stödtext + valfri CTA.
 *
 * Användning:
 *   <EmptyState
 *     icon={<Inbox size={48} color={C.pistachio} />}
 *     title="Inga bokningar än"
 *     body="När du lägger upp eller övertar en bokning visas den här."
 *     cta={{ label: "Lägg upp bokning", onPress: () => router.push('/submit') }}
 *   />
 */
export function EmptyState({
  icon,
  title,
  body,
  cta,
  secondaryCta,
  style,
  testID,
}: EmptyStateProps) {
  return (
    <View
      testID={testID}
      style={[
        {
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: SPACING.lg,
          paddingVertical: SPACING.xxxl,
          rowGap: SPACING.sm,
        },
        style,
      ]}
    >
      {icon ? (
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: C.pistachioLight,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: SPACING.sm,
          }}
        >
          {icon}
        </View>
      ) : null}

      <Text
        style={{
          fontFamily: FONTS.displayBold,
          fontSize: 22,
          color: C.textPrimary,
          textAlign: "center",
          letterSpacing: -0.5,
        }}
      >
        {title}
      </Text>

      {body ? (
        <Text
          style={{
            fontFamily: FONTS.regular,
            fontSize: 14,
            color: C.textSecondary,
            textAlign: "center",
            lineHeight: 20,
            maxWidth: 320,
            marginBottom: cta || secondaryCta ? SPACING.sm : 0,
          }}
        >
          {body}
        </Text>
      ) : null}

      {cta ? (
        <Button onPress={cta.onPress} variant={cta.variant ?? "primary"}>
          {cta.label}
        </Button>
      ) : null}

      {secondaryCta ? (
        <Button onPress={secondaryCta.onPress} variant="link">
          {secondaryCta.label}
        </Button>
      ) : null}
    </View>
  );
}
