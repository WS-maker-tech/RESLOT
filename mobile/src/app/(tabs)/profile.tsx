import React, { useEffect, useState } from "react";
// v2 - Fixed all JSX syntax errors
import { useRouter } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  Share,
  Platform,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Settings,
  ChevronRight,
  UserPlus,
  CreditCard,
  Shield,
  HelpCircle,
  LogOut,
  Diamond,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  AlertCircle,
} from "lucide-react-native";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useProfile, useMyReservations } from "@/lib/api/hooks";
import { useAuthStore } from "@/lib/auth-store";
import { LoginGate } from "@/components/LoginGate";

const REWARD_MILESTONES = [5, 10, 15, 20, 25, 30] as const;

interface MenuItemProps {
  icon: any;
  label: string;
  color: string;
  bgColor: string;
  isLast?: boolean;
  onPress?: () => void;
}

function MenuItem({
  icon: Icon,
  label,
  color,
  bgColor,
  isLast,
  onPress,
}: MenuItemProps) {
  return (
    <Pressable
      testID={`menu-${label
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/ä/g, "a")
        .replace(/ö/g, "o")
        .replace(/å/g, "a")}`}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      className="flex-row items-center py-4"
      style={{
        borderBottomWidth: isLast ? 0 : 0.5,
        borderBottomColor: "rgba(0,0,0,0.05)",
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 11,
          backgroundColor: bgColor,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={18} color={color} strokeWidth={2} />
      </View>
      <Text
        style={{
          fontFamily: "PlusJakartaSans_500Medium",
          fontSize: 15,
          color: color === "#E06A4E" ? "#E06A4E" : "#111827",
          marginLeft: 14,
          flex: 1,
        }}
      >
        {label}
      </Text>
      <ChevronRight size={18} color="#D1D5DB" strokeWidth={2} />
    </Pressable>
  );
}

interface RewardsProgressBarProps {
  tokens: number;
}

function RewardsProgressBar({ tokens }: RewardsProgressBarProps) {
  const maxMilestone = REWARD_MILESTONES[REWARD_MILESTONES.length - 1];
  const progressFraction = Math.min(tokens / maxMilestone, 1);

  const barWidth = useSharedValue(0);

  useEffect(() => {
    barWidth.value = withTiming(progressFraction * 100, {
      duration: 900,
      easing: Easing.out(Easing.cubic),
    });
  }, [progressFraction, barWidth]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value}%`,
  }));

  return (
    <View>
      <View
        style={{
          height: 8,
          borderRadius: 4,
          backgroundColor: "rgba(0,0,0,0.05)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Animated.View
          style={[
            barStyle,
            {
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              borderRadius: 4,
              backgroundColor: "#E06A4E",
            },
          ]}
        />
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 10,
          paddingHorizontal: 0,
        }}
      >
        {REWARD_MILESTONES.map((milestone) => {
          const reached = tokens >= milestone;
          return (
            <View
              key={milestone}
              style={{
                alignItems: "center",
                width: 30,
              }}
            >
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: reached ? "#E06A4E" : "rgba(0,0,0,0.06)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Diamond
                  size={10}
                  color={reached ? "#FFFFFF" : "#9CA3AF"}
                  strokeWidth={2.5}
                  fill={reached ? "#FFFFFF" : "none"}
                />
              </View>
              <Text
                style={{
                  fontFamily: reached
                    ? "PlusJakartaSans_600SemiBold"
                    : "PlusJakartaSans_400Regular",
                  fontSize: 10,
                  color: reached ? "#E06A4E" : "#9CA3AF",
                  marginTop: 4,
                }}
              >
                {milestone}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const isGuest = useAuthStore((s) => s.isGuest);
  const firstName = useAuthStore((s) => s.firstName);
  const lastName = useAuthStore((s) => s.lastName);
  const phone = useAuthStore((s) => s.phoneNumber);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonTitle, setComingSoonTitle] = useState("");

  const { data: profile, isLoading, error } = useProfile(
    phone || "test@reslot.se"
  );

  const { data: myReservations = [] } = useMyReservations(phone || "test@reslot.se");
  const submittedCount = myReservations.filter((r) => r.submitterPhone === phone).length;
  const claimedCount = myReservations.filter((r) => r.claimerPhone === phone).length;
  const availableRewards = Math.floor((profile?.tokens ?? 0) / 5);

  if (isGuest) {
    return (
      <LoginGate
        title="Din profil"
        subtitle="Logga in för att se din profil, dina tokens och dina inställningar."
      />
    );
  }

  const displayName =
    profile?.firstName && profile?.lastName
      ? `${profile.firstName} ${profile.lastName}`
      : firstName && lastName
        ? `${firstName} ${lastName}`
        : "Din profil";

  const tokens = profile?.tokens ?? 0;
  const avatar =
    profile?.avatar ??
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face";
  const email = profile?.email ?? "";

  return (
    <View style={{ flex: 1, backgroundColor: "#FAFAF8" }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#FAFAF8" }}>
        <View className="flex-row items-center justify-between px-5 pt-2 pb-3">
          <Text
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              fontSize: 26,
              color: "#111827",
              letterSpacing: -0.8,
            }}
          >
            Profil
          </Text>
          <Pressable
            testID="settings-button"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setComingSoonTitle("Inställningar");
              setShowComingSoon(true);
            }}
            className="rounded-full p-2"
            style={{ backgroundColor: "rgba(0,0,0,0.04)" }}
          >
            <Settings size={20} color="#6B7280" strokeWidth={2} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {isLoading ? (
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              paddingTop: 60,
            }}
            testID="loading-indicator"
          >
            <ActivityIndicator size="large" color="#E06A4E" />
            <Text
              style={{
                fontFamily: "PlusJakartaSans_400Regular",
                fontSize: 14,
                color: "#9CA3AF",
                marginTop: 12,
              }}
            >
              Laddar din profil...
            </Text>
          </View>
        ) : error ? (
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              paddingTop: 60,
            }}
            testID="error-state"
          >
            <AlertCircle size={40} color="#E06A4E" strokeWidth={1.5} />
            <Text
              style={{
                fontFamily: "PlusJakartaSans_600SemiBold",
                fontSize: 15,
                color: "#111827",
                marginTop: 12,
              }}
            >
              Något gick fel
            </Text>
            <Text
              style={{
                fontFamily: "PlusJakartaSans_400Regular",
                fontSize: 13,
                color: "#9CA3AF",
                marginTop: 4,
                textAlign: "center",
                paddingHorizontal: 20,
              }}
            >
              Kunde inte ladda din profil. Försök igen senare.
            </Text>
          </View>
        ) : (
          <>
            <Animated.View
              entering={FadeInDown.duration(500)}
              className="items-center px-5 pt-4 pb-6"
              testID="profile-header"
            >
              <Image
                source={{ uri: avatar }}
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: 42,
                  borderWidth: 3,
                  borderColor: "rgba(224, 106, 78, 0.15)",
                }}
              />
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_700Bold",
                  fontSize: 22,
                  color: "#111827",
                  marginTop: 14,
                  letterSpacing: -0.4,
                }}
              >
                {displayName}
              </Text>
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_400Regular",
                  fontSize: 13,
                  color: "#9CA3AF",
                  marginTop: 4,
                }}
              >
                {email || phone}
              </Text>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(100).duration(500)}
              className="mx-5 mb-5"
              testID="rewards-card"
            >
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/rewards");
                }}
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 20,
                  padding: 20,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 12,
                  elevation: 3,
                }}
              >
                <View
                  className="flex-row items-center justify-between"
                  style={{ marginBottom: 16 }}
                >
                  <View>
                    <Text
                      style={{
                        fontFamily: "PlusJakartaSans_600SemiBold",
                        fontSize: 12,
                        color: "#9CA3AF",
                        letterSpacing: 1,
                        textTransform: "uppercase",
                      }}
                    >
                      Reslot Rewards
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: "rgba(224, 106, 78, 0.08)",
                      borderRadius: 20,
                      paddingHorizontal: 12,
                      paddingVertical: 5,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "PlusJakartaSans_700Bold",
                        fontSize: 14,
                        color: "#E06A4E",
                        letterSpacing: 0.5,
                      }}
                    >
                      {tokens} TOKENS
                    </Text>
                  </View>
                </View>

                <RewardsProgressBar tokens={tokens} />

                <View
                  style={{
                    marginTop: 14,
                    backgroundColor: "rgba(139, 158, 126, 0.08)",
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Gift size={14} color="#8B9E7E" strokeWidth={2} />
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_500Medium",
                      fontSize: 13,
                      color: "#8B9E7E",
                    }}
                  >
                    Tokens och rewards
                  </Text>
                </View>
              </Pressable>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(200).duration(500)}
              className="mx-5 mb-5"
              testID="history-card"
            >
              <View
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 20,
                  padding: 20,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                <Text
                  style={{
                    fontFamily: "PlusJakartaSans_600SemiBold",
                    fontSize: 12,
                    color: "#9CA3AF",
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    marginBottom: 16,
                  }}
                >
                  Bokningshistorik
                </Text>

                <View style={{ gap: 14 }}>
                  <View className="flex-row items-center" style={{ gap: 12 }}>
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 11,
                        backgroundColor: "rgba(139, 158, 126, 0.12)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ArrowUpRight
                        size={18}
                        color="#8B9E7E"
                        strokeWidth={2}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: "PlusJakartaSans_400Regular",
                          fontSize: 13,
                          color: "#9CA3AF",
                        }}
                      >
                        Upplagda Bokningar
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontFamily: "PlusJakartaSans_700Bold",
                        fontSize: 20,
                        color: "#111827",
                        letterSpacing: -0.3,
                      }}
                    >
                      {submittedCount}
                    </Text>
                  </View>

                  <View
                    style={{
                      height: 0.5,
                      backgroundColor: "rgba(0,0,0,0.05)",
                    }}
                  />

                  <View className="flex-row items-center" style={{ gap: 12 }}>
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 11,
                        backgroundColor: "rgba(224, 106, 78, 0.1)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ArrowDownLeft
                        size={18}
                        color="#E06A4E"
                        strokeWidth={2}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: "PlusJakartaSans_400Regular",
                          fontSize: 13,
                          color: "#9CA3AF",
                        }}
                      >
                        Övertagna bokningar
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontFamily: "PlusJakartaSans_700Bold",
                        fontSize: 20,
                        color: "#111827",
                        letterSpacing: -0.3,
                      }}
                    >
                      {claimedCount}
                    </Text>
                  </View>

                  <View
                    style={{
                      height: 0.5,
                      backgroundColor: "rgba(0,0,0,0.05)",
                    }}
                  />

                  <View className="flex-row items-center" style={{ gap: 12 }}>
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 11,
                        backgroundColor: "rgba(201, 169, 110, 0.12)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Gift size={18} color="#C9A96E" strokeWidth={2} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: "PlusJakartaSans_400Regular",
                          fontSize: 13,
                          color: "#9CA3AF",
                        }}
                      >
                        Belöningar Tillgängliga
                      </Text>
                    </View>
                    <Text
                      style={{
                        fontFamily: "PlusJakartaSans_700Bold",
                        fontSize: 20,
                        color: "#111827",
                        letterSpacing: -0.3,
                      }}
                    >
                      {availableRewards}
                    </Text>
                  </View>
                </View>
              </View>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(300).duration(500)}
              className="mx-5 mb-2"
              testID="account-section"
            >
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_600SemiBold",
                  fontSize: 10,
                  color: "#9CA3AF",
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  marginBottom: 8,
                  paddingHorizontal: 4,
                }}
              >
                Konto
              </Text>
              <View
                className="rounded-2xl px-5"
                style={{
                  backgroundColor: "#FFFFFF",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.03,
                  shadowRadius: 6,
                  elevation: 1,
                }}
              >
                <MenuItem
                  icon={UserPlus}
                  label="Bjud in en vän — få 5 tokens"
                  color="#C9A96E"
                  bgColor="rgba(201, 169, 110, 0.12)"
                  onPress={() => {
                    const shareMessage = `Jag använder Reslot för att hitta och sälja restaurangbokningar i sista minuten. `;
                    if (Platform.OS === "web") {
                      navigator.clipboard
                        .writeText(shareMessage)
                        .catch(() => {});
                    } else {
                      Share.share({
                        message: shareMessage,
                        title: "Prova Reslot",
                      }).catch(() => {});
                    }
                  }}
                />
                <MenuItem
                  icon={CreditCard}
                  label="Betalningar"
                  color="#6B7280"
                  bgColor="rgba(107, 114, 128, 0.1)"
                  onPress={() => {
                    setComingSoonTitle("Betalningar");
                    setShowComingSoon(true);
                  }}
                />
                <MenuItem
                  icon={Settings}
                  label="Kontoinställningar"
                  color="#6B7280"
                  bgColor="rgba(107, 114, 128, 0.1)"
                  isLast
                  onPress={() => {
                    setComingSoonTitle("Kontoinställningar");
                    setShowComingSoon(true);
                  }}
                />
              </View>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(380).duration(500)}
              className="mx-5 mb-5"
              testID="support-section"
            >
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_600SemiBold",
                  fontSize: 10,
                  color: "#9CA3AF",
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  marginBottom: 8,
                  paddingHorizontal: 4,
                }}
              >
                Support & Övrigt
              </Text>
              <View
                className="rounded-2xl px-5"
                style={{
                  backgroundColor: "#FFFFFF",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.03,
                  shadowRadius: 6,
                  elevation: 1,
                }}
              >
                <MenuItem
                  icon={Shield}
                  label="Integritet & Säkerhet"
                  color="#8B9E7E"
                  bgColor="rgba(139, 158, 126, 0.1)"
                  onPress={() => {
                    setComingSoonTitle("Integritet & Säkerhet");
                    setShowComingSoon(true);
                  }}
                />
                <MenuItem
                  icon={HelpCircle}
                  label="Hjälp & Support"
                  color="#C9A96E"
                  bgColor="rgba(201, 169, 110, 0.1)"
                  onPress={() => {
                    setComingSoonTitle("Hjälp & Support");
                    setShowComingSoon(true);
                  }}
                />
                <MenuItem
                  icon={LogOut}
                  label="Logga ut"
                  color="#E06A4E"
                  bgColor="rgba(224, 106, 78, 0.08)"
                  isLast
                  onPress={() => {
                    logout();
                    router.replace("/onboarding");
                  }}
                />
              </View>
            </Animated.View>
          </>
        )}
      </ScrollView>

      {/* Coming Soon Modal */}
      <Modal
        visible={showComingSoon}
        transparent
        animationType="fade"
        onRequestClose={() => setShowComingSoon(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" }}
          onPress={() => setShowComingSoon(false)}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 20,
              padding: 28,
              marginHorizontal: 32,
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 24,
              elevation: 10,
            }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                backgroundColor: "rgba(224,106,78,0.10)",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Settings size={24} color="#E06A4E" strokeWidth={2} />
            </View>
            <Text
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                fontSize: 18,
                color: "#111827",
                letterSpacing: -0.3,
                textAlign: "center",
              }}
            >
              {comingSoonTitle}
            </Text>
            <Text
              style={{
                fontFamily: "PlusJakartaSans_400Regular",
                fontSize: 14,
                color: "#9CA3AF",
                marginTop: 8,
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              Den här funktionen är under utveckling och kommer snart.
            </Text>
            <Pressable
              onPress={() => setShowComingSoon(false)}
              style={{
                marginTop: 20,
                backgroundColor: "#111827",
                borderRadius: 12,
                paddingVertical: 13,
                paddingHorizontal: 32,
              }}
            >
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_600SemiBold",
                  fontSize: 15,
                  color: "#FFFFFF",
                }}
              >
                Stäng
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
