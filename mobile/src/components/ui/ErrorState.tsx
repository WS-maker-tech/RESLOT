import React from "react";
import { StyleProp, Text, View, ViewStyle } from "react-native";
import { AlertTriangle, WifiOff, ServerCrash } from "lucide-react-native";
import { C, FONTS, ICON, SPACING } from "@/lib/theme";
import { Button } from "./Button";

export type ErrorStateVariant = "generic" | "network" | "server";

export type ErrorStateProps = {
  variant?: ErrorStateVariant;
  /** Huvudrubrik */
  title?: string;
  /** Stödtext */
  body?: string;
  /** Retry-CTA */
  onRetry?: () => void;
  /** Retry-knapp-text */
  retryLabel?: string;
  /** Sekundär CTA (ex 'Kontakta support') */
  secondaryCta?: {
    label: string;
    onPress: () => void;
  };
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

function getDefaults(variant: ErrorStateVariant) {
  switch (variant) {
    case "network":
      return {
        Icon: WifiOff,
        defaultTitle: "Ingen anslutning",
        defaultBody: "Kontrollera din internetanslutning och försök igen.",
      };
    case "server":
      return {
        Icon: ServerCrash,
        defaultTitle: "Servern svarar inte",
        defaultBody: "Något gick fel hos oss. Försök igen om en stund.",
      };
    default:
      return {
        Icon: AlertTriangle,
        defaultTitle: "Något gick fel",
        defaultBody: "Vi kunde inte ladda innehållet. Försök igen.",
      };
  }
}

/**
 * ErrorState — för felhantering på sidor (nätverksfel, server-fel).
 * Tar `onRetry` för retry-action; default-rubrik och body baserat på variant.
 */
export function ErrorState({
  variant = "generic",
  title,
  body,
  onRetry,
  retryLabel = "Försök igen",
  secondaryCta,
  style,
  testID,
}: ErrorStateProps) {
  const { Icon, defaultTitle, defaultBody } = getDefaults(variant);

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
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: C.errorLight,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: SPACING.sm,
        }}
      >
        <Icon size={36} color={C.error} strokeWidth={ICON.strokeWidth} />
      </View>

      <Text
        style={{
          fontFamily: FONTS.displayBold,
          fontSize: 20,
          color: C.textPrimary,
          textAlign: "center",
          letterSpacing: -0.4,
        }}
      >
        {title ?? defaultTitle}
      </Text>

      <Text
        style={{
          fontFamily: FONTS.regular,
          fontSize: 14,
          color: C.textSecondary,
          textAlign: "center",
          lineHeight: 20,
          maxWidth: 320,
          marginBottom: onRetry || secondaryCta ? SPACING.sm : 0,
        }}
      >
        {body ?? defaultBody}
      </Text>

      {onRetry ? (
        <Button onPress={onRetry} variant="primary">
          {retryLabel}
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
