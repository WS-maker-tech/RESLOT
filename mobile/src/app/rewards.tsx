import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  ChevronLeft,
  Diamond,
  Gift,
  PlusCircle,
  UserPlus,
  Coins,
} from "lucide-react-native";
import { useAuthStore } from "@/lib/auth-store";
import { useProfile } from "@/lib/api/hooks";

const MILESTONES = [5, 10, 15, 20, 25, 30];
const MAX_MILESTONE = 30;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function RewardsScreen() {
  const router = useRouter();
  const phone = useAuthStore((s) => s.phoneNumber);
  const { data: profile } = useProfile(phone);
  const tokens = profile?.tokens ?? 0;

  const progressWidth = useSharedValue(0);

  useEffect(() => {
    const ratio = Math.min(tokens / MAX_MILESTONE, 1);
    progressWidth.value = withTiming(ratio, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, [tokens]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleBuyPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Purchase flow placeholder
  };

  return (
    <SafeAreaView style={styles.container} testID="rewards-screen">
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={styles.backButton}
          testID="rewards-back-button"
        >
          <ChevronLeft size={24} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Rewards</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Rewards Card */}
        <Animated.View
          entering={FadeInDown.duration(500).delay(100)}
          style={styles.rewardsCard}
        >
          {/* Top row */}
          <View style={styles.cardTopRow}>
            <Text style={styles.cardLabel}>RESLOT REWARDS</Text>
            <View style={styles.tokenBadge}>
              <Coins size={14} color="#FFFFFF" />
              <Text style={styles.tokenBadgeText}>{tokens} TOKENS</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, progressStyle]} />
          </View>

          {/* Milestones */}
          <View style={styles.milestonesRow}>
            {MILESTONES.map((m) => {
              const reached = tokens >= m;
              const position = (m / MAX_MILESTONE) * 100;
              return (
                <View
                  key={m}
                  style={[
                    styles.milestoneItem,
                    { left: `${position}%` },
                  ]}
                >
                  <View
                    style={[
                      styles.milestoneIcon,
                      reached
                        ? styles.milestoneReached
                        : styles.milestoneUnreached,
                    ]}
                  >
                    <Diamond
                      size={10}
                      color={reached ? "#FFFFFF" : "#9CA3AF"}
                    />
                  </View>
                  <Text
                    style={[
                      styles.milestoneLabel,
                      reached ? styles.milestoneLabelReached : null,
                    ]}
                  >
                    {m}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Bottom pill */}
          <View style={styles.greenPill}>
            <Gift size={14} color="#FFFFFF" />
            <Text style={styles.greenPillText}>Tokens och rewards</Text>
          </View>
        </Animated.View>

        {/* Ways to earn */}
        <Animated.View entering={FadeInDown.duration(500).delay(250)}>
          <Text style={styles.sectionTitle}>Satt att tjana</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(350)}>
          <Pressable
            style={styles.earnCard}
            testID="earn-submit-reservation"
            onPress={() =>
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            }
          >
            <View style={styles.earnIconCircle}>
              <PlusCircle size={22} color="#E06A4E" />
            </View>
            <View style={styles.earnTextBlock}>
              <Text style={styles.earnTitle}>Skicka in en reservation</Text>
              <Text style={styles.earnSubtitle}>
                Dela en reservation du inte kan anvanda
              </Text>
            </View>
            <View style={styles.earnTokenBadge}>
              <Text style={styles.earnTokenText}>1 TOKEN</Text>
            </View>
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(450)}>
          <Pressable
            style={styles.earnCard}
            testID="earn-invite-friend"
            onPress={() =>
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            }
          >
            <View style={styles.earnIconCircle}>
              <UserPlus size={22} color="#E06A4E" />
            </View>
            <View style={styles.earnTextBlock}>
              <Text style={styles.earnTitle}>Bjud in en van till Reslot</Text>
              <Text style={styles.earnSubtitle}>
                Dela din inbjudningslank
              </Text>
            </View>
            <View style={styles.earnTokenBadge}>
              <Text style={styles.earnTokenText}>1 TOKEN</Text>
            </View>
          </Pressable>
        </Animated.View>

        {/* Buy tokens */}
        <Animated.View entering={FadeInDown.duration(500).delay(550)}>
          <Text style={styles.sectionTitle}>Kop tokens</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(500).delay(650)}>
          <View style={styles.buyCard}>
            <View style={styles.buyLeft}>
              <View style={styles.buyIconCircle}>
                <Coins size={22} color="#E06A4E" />
              </View>
              <View>
                <Text style={styles.buyTitle}>1 Token</Text>
                <Text style={styles.buySubtitle}>Serviceavgift 39 SEK</Text>
              </View>
            </View>
            <Pressable
              style={styles.buyButton}
              onPress={handleBuyPress}
              testID="buy-token-button"
            >
              <Text style={styles.buyButtonText}>Kop</Text>
            </Pressable>
          </View>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAF8",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 18,
    color: "#111827",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },

  // Rewards card
  rewardsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 28,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  cardLabel: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 12,
    color: "#9CA3AF",
    letterSpacing: 1,
  },
  tokenBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E06A4E",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tokenBadgeText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 12,
    color: "#FFFFFF",
  },

  // Progress bar
  progressTrack: {
    height: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 20,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#E06A4E",
    borderRadius: 4,
  },

  // Milestones
  milestonesRow: {
    height: 44,
    position: "relative",
    marginBottom: 18,
  },
  milestoneItem: {
    position: "absolute",
    alignItems: "center",
    transform: [{ translateX: -14 }],
  },
  milestoneIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "45deg" }],
    marginBottom: 4,
  },
  milestoneReached: {
    backgroundColor: "#E06A4E",
  },
  milestoneUnreached: {
    backgroundColor: "#F3F4F6",
  },
  milestoneLabel: {
    fontFamily: "PlusJakartaSans_500Medium",
    fontSize: 10,
    color: "#9CA3AF",
  },
  milestoneLabelReached: {
    color: "#E06A4E",
    fontFamily: "PlusJakartaSans_700Bold",
  },

  // Green pill
  greenPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 6,
    backgroundColor: "#8B9E7E",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  greenPillText: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 13,
    color: "#FFFFFF",
  },

  // Section title
  sectionTitle: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 18,
    color: "#111827",
    marginBottom: 14,
  },

  // Earn cards
  earnCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  earnIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(224, 106, 78, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  earnTextBlock: {
    flex: 1,
  },
  earnTitle: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 15,
    color: "#111827",
    marginBottom: 2,
  },
  earnSubtitle: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: "#9CA3AF",
  },
  earnTokenBadge: {
    backgroundColor: "rgba(224, 106, 78, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  earnTokenText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 11,
    color: "#E06A4E",
  },

  // Buy card
  buyCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  buyLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  buyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(224, 106, 78, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  buyTitle: {
    fontFamily: "PlusJakartaSans_600SemiBold",
    fontSize: 15,
    color: "#111827",
  },
  buySubtitle: {
    fontFamily: "PlusJakartaSans_400Regular",
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  buyButton: {
    backgroundColor: "#E06A4E",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  buyButtonText: {
    fontFamily: "PlusJakartaSans_700Bold",
    fontSize: 14,
    color: "#FFFFFF",
  },
});
