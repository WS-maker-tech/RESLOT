import React from "react";
import { View, Text, Pressable, ActivityIndicator, StyleSheet, Platform } from "react-native";
import { Check, Shield, Sparkles, CreditCard, AlertCircle } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { C, FONTS, SPACING, SHADOW, RADIUS } from "../lib/theme";

interface ClaimSectionProps {
  userCredits: number;
  hasEnoughCredits: boolean;
  accepted: boolean;
  isClaimed: boolean;
  claimPending: boolean;
  claimError: string | null;
  onToggleAccepted: () => void;
  onClaim: () => void;
  onBuyCredits: () => void;
  btnStyle: any;
  errorShakeStyle: any;
  onPressIn: () => void;
  onPressOut: () => void;
}

export const ClaimSection = React.memo(function ClaimSection({
  userCredits,
  hasEnoughCredits,
  accepted,
  isClaimed,
  claimPending,
  claimError,
  onToggleAccepted,
  onClaim,
  onBuyCredits,
  btnStyle,
  errorShakeStyle,
  onPressIn,
  onPressOut,
}: ClaimSectionProps) {
  return (
    <>
      {/* Cost breakdown */}
      <Animated.View
        entering={FadeInDown.delay(200).springify()}
        style={styles.costContainer}
      >
        <View
          testID="cost-breakdown"
          style={styles.costCard}
        >
          <View style={styles.costHeader}>
            <View style={styles.costIconContainer}>
              <CreditCard size={16} color={C.gold} strokeWidth={2} />
            </View>
            <Text style={styles.costTitle}>Kostnad</Text>
          </View>

          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Bokning</Text>
            <View style={styles.costValue}>
              <Sparkles size={13} color={C.gold} strokeWidth={2} />
              <Text style={styles.costCreditsText}>2 credits</Text>
            </View>
          </View>

          <View style={styles.feeRow}>
            <Text style={styles.costLabel}>Serviceavgift</Text>
            <Text style={styles.feeText}>29 kr</Text>
          </View>

          <View style={styles.costDivider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Totalt</Text>
            <Text style={styles.totalValue}>2 credits + 29 kr</Text>
          </View>

          <View
            style={[
              styles.balanceRow,
              { backgroundColor: hasEnoughCredits ? C.successBg : "rgba(239,68,68,0.06)" },
            ]}
          >
            <Text style={styles.balanceLabel}>Ditt saldo</Text>
            <View style={styles.balanceValue}>
              <Sparkles size={11} color={hasEnoughCredits ? C.success : C.error} strokeWidth={2} />
              <Text
                testID="user-credits-balance"
                style={[
                  styles.balanceCredits,
                  { color: hasEnoughCredits ? C.success : C.error },
                ]}
              >
                {userCredits} credits
              </Text>
            </View>
          </View>

          {!hasEnoughCredits ? (
            <Pressable
              testID="buy-credits-button"
              accessibilityLabel="Köp credits"
              onPress={onBuyCredits}
              style={({ pressed }) => [
                styles.buyCreditsButton,
                { transform: [{ scale: pressed ? 0.97 : 1 }] },
              ]}
            >
              <Text style={styles.buyCreditsText}>
                Köp credits — 39 kr/st
              </Text>
            </Pressable>
          ) : null}
        </View>
      </Animated.View>

      {/* Grace period info */}
      <Animated.View
        entering={FadeInDown.delay(260).springify()}
        style={styles.graceContainer}
      >
        <View testID="grace-period-info" style={styles.graceCard}>
          <View style={styles.graceIconContainer}>
            <Shield size={16} color={C.info} strokeWidth={2} />
          </View>
          <View style={styles.graceTextContainer}>
            <Text style={styles.graceTitle}>5 minuters ångerfrist</Text>
            <Text style={styles.graceDescription}>
              Du kan ångra gratis inom 5 minuter efter övertagandet. Inga avgifter under ångerfristen.
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Guarantee badge */}
      <Animated.View
        entering={FadeInDown.delay(310).springify()}
        style={styles.guaranteeContainer}
      >
        <View testID="guarantee-badge" style={styles.guaranteeCard}>
          <Check size={16} color={C.success} strokeWidth={2.5} />
          <Text style={styles.guaranteeText}>
            Om bordet inte finns — 2 credits tillbaka
          </Text>
        </View>
      </Animated.View>

      {/* Error message with shake */}
      {claimError ? (
        <Animated.View
          entering={FadeInDown.springify()}
          style={[styles.errorContainer, errorShakeStyle]}
        >
          <View testID="claim-error" style={styles.errorCard}>
            <AlertCircle size={18} color={C.error} strokeWidth={2} />
            <Text style={styles.errorText}>{claimError}</Text>
          </View>
        </Animated.View>
      ) : null}
    </>
  );
});

const styles = StyleSheet.create({
  costContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 24,
  },
  costCard: {
    backgroundColor: C.bgCard,
    borderRadius: RADIUS.xl,
    padding: 22,
    borderWidth: 0.5,
    borderColor: C.borderLight,
    borderLeftWidth: 3,
    borderLeftColor: "rgba(201,169,110,0.4)",
    ...SHADOW.card,
  },
  costHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 18,
  },
  costIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(201,169,110,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  costTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 17,
    color: C.textPrimary,
    letterSpacing: -0.3,
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  costLabel: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: C.textSecondary,
  },
  costValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  costCreditsText: {
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    color: C.gold,
  },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  feeText: {
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    color: C.textPrimary,
  },
  costDivider: {
    height: 1,
    backgroundColor: C.divider,
    marginBottom: 14,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  totalLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 17,
    color: C.textPrimary,
  },
  totalValue: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: C.textPrimary,
  },
  balanceRow: {
    borderRadius: RADIUS.md,
    paddingVertical: 11,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceLabel: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: C.textSecondary,
  },
  balanceValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  balanceCredits: {
    fontFamily: FONTS.bold,
    fontSize: 14,
  },
  buyCreditsButton: {
    backgroundColor: C.gold,
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 12,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  buyCreditsText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: "#FFFFFF",
  },
  graceContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 14,
  },
  graceCard: {
    backgroundColor: "rgba(59,130,246,0.04)",
    borderRadius: RADIUS.lg,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(59,130,246,0.10)",
  },
  graceIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(59,130,246,0.10)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  graceTextContainer: {
    flex: 1,
  },
  graceTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: C.info,
    marginBottom: 3,
  },
  graceDescription: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: C.info,
    lineHeight: 19,
    opacity: 0.85,
  },
  guaranteeContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 10,
  },
  guaranteeCard: {
    backgroundColor: C.successBg,
    borderRadius: RADIUS.lg,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: C.successLight,
  },
  guaranteeText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: C.success,
    flex: 1,
  },
  errorContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 16,
  },
  errorCard: {
    backgroundColor: "rgba(239,68,68,0.06)",
    borderRadius: RADIUS.md,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.12)",
  },
  errorText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: C.error,
    flex: 1,
  },
});
