import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Settings,
  ChevronRight,
  UserPlus,
  CreditCard,
  HelpCircle,
  LogOut,
  AlertCircle,
  Camera,
  CheckCircle,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Heart,
} from "lucide-react-native";
import Animated, {
  FadeInDown,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useProfile, useMyReservations, useSavedRestaurants } from "@/lib/api/hooks";
import { useAuthStore } from "@/lib/auth-store";
import { LoginGate } from "@/components/LoginGate";
import { C, FONTS, SPACING, SHADOW, RADIUS, ICON } from "../../lib/theme";
import { Skeleton } from "@/components/Skeleton";

const AnimatedCreditsCount = React.memo(function AnimatedCreditsCount({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (value === 0) {
      setDisplayValue(0);
      return;
    }
    setDisplayValue(0);
    const steps = 20;
    const stepDuration = 800 / steps;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= steps; i++) {
      const timer = setTimeout(() => {
        setDisplayValue(Math.round((i / steps) * value));
      }, i * stepDuration);
      timers.push(timer);
    }
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [value]);

  return (
    <Text testID="credits-amount" style={{ fontFamily: FONTS.bold, fontSize: 38, color: "#fff" }}>
      {displayValue}
    </Text>
  );
});

// Skeleton replaced by shared Skeleton component

const ProfileSkeleton = React.memo(function ProfileSkeleton() {
  return (
    <View style={{ paddingTop: 20, alignItems: "center" }}>
      <Skeleton width={84} height={84} style={{ borderRadius: 42, marginBottom: 14 }} />
      <Skeleton width={160} height={26} style={{ marginBottom: 8 }} />
      <Skeleton width={120} height={14} style={{ marginBottom: 24 }} />
      <View style={{ marginHorizontal: SPACING.lg, width: "100%", paddingHorizontal: SPACING.lg }}>
        <Skeleton width="100%" height={100} style={{ borderRadius: RADIUS.lg, marginBottom: 16 }} />
        <Skeleton width="100%" height={180} style={{ borderRadius: RADIUS.xl, marginBottom: 16 }} />
        <Skeleton width="100%" height={160} style={{ borderRadius: RADIUS.xl }} />
      </View>
    </View>
  );
});

interface MenuItemProps {
  icon: any;
  label: string;
  color: string;
  bgColor: string;
  isLast?: boolean;
  onPress?: () => void;
  index?: number;
}

const MenuItem = React.memo(function MenuItem({
  icon: Icon,
  label,
  color,
  bgColor,
  isLast,
  onPress,
  index = 0,
}: MenuItemProps) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <Pressable
        testID={`menu-${label
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/ä/g, "a")
          .replace(/ö/g, "o")
          .replace(/å/g, "a")}`}
        accessibilityLabel={label}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress?.();
        }}
        className="flex-row items-center py-4"
        style={{
          borderBottomWidth: isLast ? 0 : 0.5,
          borderBottomColor: C.divider,
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
            fontFamily: FONTS.medium,
            fontSize: 15,
            color: color === C.coral ? C.coral : C.textPrimary,
            marginLeft: 14,
            flex: 1,
          }}
        >
          {label}
        </Text>
        <ChevronRight size={18} color={C.textTertiary} strokeWidth={2} />
      </Pressable>
    </Animated.View>
  );
});

export default function ProfileScreen() {
  const isGuest = useAuthStore((s) => s.isGuest);
  const firstName = useAuthStore((s) => s.firstName);
  const lastName = useAuthStore((s) => s.lastName);
  const phone = useAuthStore((s) => s.phoneNumber);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonTitle, setComingSoonTitle] = useState("");

  const { data: profile, isLoading, error, refetch } = useProfile(
    phone || ""
  );

  const { data: myReservations = [] } = useMyReservations(phone || "");
  const { data: savedRestaurants = [] } = useSavedRestaurants(phone || "");
  const savedCount = savedRestaurants.length;
  const completedCount = useMemo(() => myReservations.filter((r) => r.status === "completed" || r.status === "claimed").length, [myReservations]);
  const cancelledCount = useMemo(() => myReservations.filter((r) => r.status === "cancelled" && r.submitterPhone === phone).length, [myReservations, phone]);
  const submittedCount = useMemo(() => myReservations.filter((r) => r.submitterPhone === phone).length, [myReservations, phone]);
  const claimedCount = useMemo(() => myReservations.filter((r) => r.claimerPhone === phone).length, [myReservations, phone]);
  const memberSince = useMemo(() => profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("sv-SE", { month: "long", year: "numeric" })
    : null, [profile?.createdAt]);

  const displayName = useMemo(() =>
    profile?.firstName && profile?.lastName
      ? `${profile.firstName} ${profile.lastName}`
      : firstName && lastName
        ? `${firstName} ${lastName}`
        : "Din profil",
    [profile?.firstName, profile?.lastName, firstName, lastName]);

  const avatar = useMemo(() =>
    profile?.avatar ??
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    [profile?.avatar]);

  const email = useMemo(() => profile?.email ?? "", [profile?.email]);

  const handleSettingsPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/account-settings");
  }, [router]);

  const handleProfileImagePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/account-settings");
  }, [router]);

  const handleBuyCreditsPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/credits");
  }, [router]);

  const handleUploadedPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(tabs)/reservations");
  }, [router]);

  const handleClaimedPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/(tabs)/reservations");
  }, [router]);

  const handleInvitePress = useCallback(() => {
    router.push("/invite");
  }, [router]);

  const handlePaymentPress = useCallback(() => {
    router.push("/payment");
  }, [router]);

  const handleAccountSettingsPress = useCallback(() => {
    router.push("/account-settings");
  }, [router]);

  const handleSupportPress = useCallback(() => {
    router.push("/support");
  }, [router]);

  const handleLogoutPress = useCallback(() => {
    logout();
    router.replace("/onboarding");
  }, [logout, router]);

  const handleRetryPress = useCallback(() => {
    refetch();
  }, [refetch]);

  const buyScale = useSharedValue(1);
  const buyAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: buyScale.value }] }));

  if (isGuest) {
    return (
      <LoginGate
        title="Din profil"
        subtitle="Logga in för att se din profil, dina credits och dina inställningar."
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: C.bg }}>
        <View className="flex-row items-center justify-between px-5 pt-2 pb-3">
          <Text
            testID="profile-title"
            style={{
              fontFamily: FONTS.displayBold,
              fontSize: 24,
              color: C.textPrimary,
              letterSpacing: -0.5,
            }}
          >
            Profil
          </Text>
          <Pressable
            testID="settings-button"
            accessibilityLabel="Inställningar"
            onPress={handleSettingsPress}
            className="rounded-full p-2"
            style={{ backgroundColor: "rgba(0,0,0,0.04)" }}
          >
            <Settings size={20} color={C.textSecondary} strokeWidth={2} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView
        testID="profile-scroll"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {isLoading ? (
          <ProfileSkeleton />
        ) : error ? (
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              paddingTop: 60,
            }}
            testID="error-state"
          >
            <AlertCircle size={40} color={C.coral} strokeWidth={ICON.strokeWidth} />
            <Text
              style={{
                fontFamily: FONTS.semiBold,
                fontSize: 15,
                color: C.textPrimary,
                marginTop: 12,
              }}
            >
              Något gick fel
            </Text>
            <Text
              style={{
                fontFamily: FONTS.regular,
                fontSize: 13,
                color: C.textTertiary,
                marginTop: SPACING.xs,
                textAlign: "center",
                paddingHorizontal: SPACING.lg,
              }}
            >
              Kunde inte ladda din profil. Försök igen senare.
            </Text>
            <Pressable
              testID="retry-button"
              accessibilityLabel="Försök igen"
              onPress={handleRetryPress}
              style={{
                marginTop: SPACING.md,
                backgroundColor: C.coral,
                borderRadius: RADIUS.md,
                paddingVertical: 12,
                paddingHorizontal: 28,
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.semiBold,
                  fontSize: 15,
                  color: "#FFFFFF",
                }}
              >
                Försök igen
              </Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Animated.View
              entering={FadeInDown.springify()}
              className="items-center px-5 pt-4 pb-6"
              testID="profile-header"
            >
              <Pressable
                testID="profile-image-button"
                accessibilityLabel="Ändra profilbild"
                onPress={handleProfileImagePress}
                style={{ position: "relative" }}
              >
                <Image
                  source={{ uri: avatar }}
                  style={{
                    width: 84,
                    height: 84,
                    borderRadius: 42,
                    borderWidth: 3,
                    borderColor: C.coralLight,
                    backgroundColor: C.bgInput,
                  }}
                  cachePolicy="memory-disk"
                />
                <View style={{ position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: C.coral, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: C.bg }}>
                  <Camera size={12} color="#FFFFFF" strokeWidth={ICON.strokeWidth} />
                </View>
              </Pressable>
              <Text
                testID="profile-display-name"
                style={{
                  fontFamily: FONTS.displayBold,
                  fontSize: 26,
                  color: C.textPrimary,
                  marginTop: 14,
                  letterSpacing: -0.5,
                }}
              >
                {displayName}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: SPACING.xs, gap: 6 }}>
                <Text
                  testID="profile-contact"
                  style={{
                    fontFamily: FONTS.regular,
                    fontSize: 13,
                    color: C.textTertiary,
                  }}
                >
                  {email || phone}
                </Text>
                {profile?.emailVerified && email ? (
                  <CheckCircle size={14} color={C.success} strokeWidth={ICON.strokeWidth} />
                ) : null}
              </View>
              {phone && profile?.phoneVerified ? (
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2, gap: 6 }}>
                  <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textTertiary }}>
                    {phone}
                  </Text>
                  <CheckCircle size={14} color={C.success} strokeWidth={ICON.strokeWidth} />
                </View>
              ) : null}
              {completedCount >= 3 ? (
                <Animated.View
                  entering={ZoomIn.springify().delay(200)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: 20,
                    backgroundColor: C.successLight,
                  }}
                >
                  <ShieldCheck size={14} color={C.success} strokeWidth={ICON.strokeWidth} />
                  <Text
                    style={{
                      fontFamily: FONTS.semiBold,
                      fontSize: 13,
                      color: C.success,
                    }}
                  >
                    Pålitlig användare
                  </Text>
                </Animated.View>
              ) : completedCount >= 1 ? (
                <Animated.View
                  entering={ZoomIn.springify().delay(200)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: 20,
                    backgroundColor: "rgba(201,169,110,0.08)",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONTS.semiBold,
                      fontSize: 13,
                      color: C.gold,
                    }}
                  >
                    Ny användare
                  </Text>
                </Animated.View>
              ) : null}
            </Animated.View>

            {/* Credits card - simple dark background */}
            <Animated.View entering={FadeInDown.delay(60).springify()} className="mx-5 mb-5" testID="credits-card">
              <View style={{
                backgroundColor: C.dark, borderRadius: RADIUS.lg, padding: 22,
                ...SHADOW.card,
              }}>
                <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
                  Ditt saldo
                </Text>
                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
                  <AnimatedCreditsCount value={profile?.credits ?? 0} />
                  <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: C.gold }}>credits</Text>
                </View>
                <Pressable
                  testID="buy-credits-cta"
                  accessibilityLabel="Köp credits"
                  onPressIn={() => { buyScale.value = withSpring(0.96, { damping: 15, stiffness: 300 }); }}
                  onPressOut={() => { buyScale.value = withSpring(1, { damping: 12, stiffness: 200 }); }}
                  onPress={handleBuyCreditsPress}
                >
                  <Animated.View style={[buyAnimStyle, { marginTop: 12, backgroundColor: C.coral, borderRadius: 12, paddingVertical: 10, alignItems: "center" }]}>
                    <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: "#FFFFFF" }}>Köp credits</Text>
                  </Animated.View>
                </Pressable>
              </View>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(120).springify()}
              className="mx-5 mb-5"
              testID="trust-card"
            >
              <View
                style={{
                  backgroundColor: C.bgCard,
                  borderRadius: RADIUS.xl,
                  borderWidth: 0.5,
                  borderColor: C.borderLight,
                  padding: SPACING.lg,
                  ...SHADOW.card,
                }}
              >
                <Text
                  testID="section-trust"
                  style={{
                    fontFamily: FONTS.semiBold,
                    fontSize: 14,
                    color: C.textTertiary,
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                    marginBottom: SPACING.md,
                  }}
                >
                  Tillitsprofil
                </Text>

                <View style={{ gap: 14 }}>
                  {/* Genomförda bokningar */}
                  <View className="flex-row items-center" style={{ gap: 12 }}>
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 11,
                        backgroundColor: C.successLight,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ShieldCheck size={18} color={C.success} strokeWidth={2} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: FONTS.regular,
                          fontSize: 13,
                          color: C.textTertiary,
                        }}
                      >
                        Genomförda bokningar
                      </Text>
                    </View>
                    <Text
                      testID="completed-count"
                      style={{
                        fontFamily: FONTS.bold,
                        fontSize: 20,
                        color: C.textPrimary,
                        letterSpacing: -0.3,
                      }}
                    >
                      {completedCount}
                    </Text>
                  </View>

                  <View style={{ height: 0.5, backgroundColor: C.divider }} />

                  {/* Avbokade i tid */}
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
                      <Clock size={18} color={C.gold} strokeWidth={2} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: FONTS.regular,
                          fontSize: 13,
                          color: C.textTertiary,
                        }}
                      >
                        Avbokade i tid
                      </Text>
                    </View>
                    <Text
                      testID="cancelled-count"
                      style={{
                        fontFamily: FONTS.bold,
                        fontSize: 20,
                        color: C.textPrimary,
                        letterSpacing: -0.3,
                      }}
                    >
                      {cancelledCount}
                    </Text>
                  </View>

                  <View style={{ height: 0.5, backgroundColor: C.divider }} />

                  {/* Uteblivna */}
                  <View className="flex-row items-center" style={{ gap: 12 }}>
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 11,
                        backgroundColor: C.coralLight,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <AlertTriangle size={18} color={C.coral} strokeWidth={2} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: FONTS.regular,
                          fontSize: 13,
                          color: C.textTertiary,
                        }}
                      >
                        Uteblivna
                      </Text>
                    </View>
                    <Text
                      testID="noshow-count"
                      style={{
                        fontFamily: FONTS.bold,
                        fontSize: 20,
                        color: C.textPrimary,
                        letterSpacing: -0.3,
                      }}
                    >
                      0
                    </Text>
                  </View>
                </View>

                {memberSince ? (
                  <Text
                    testID="member-since"
                    style={{
                      fontFamily: FONTS.regular,
                      fontSize: 12,
                      color: C.textTertiary,
                      marginTop: SPACING.md,
                      textAlign: "center",
                    }}
                  >
                    Medlem sedan {memberSince}
                  </Text>
                ) : null}
              </View>
            </Animated.View>

            {/* Quick booking stats */}
            <Animated.View entering={FadeInDown.delay(160).springify()} className="mx-5 mb-5">
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                  testID="uploaded-bookings-link"
                  accessibilityLabel="Visa upplagda bokningar"
                  onPress={handleUploadedPress}
                  style={{ flex: 1, backgroundColor: C.bgCard, borderRadius: RADIUS.lg, borderWidth: 0.5, borderColor: C.borderLight, padding: 16, ...SHADOW.card, alignItems: "center" }}
                >
                  <Text style={{ fontFamily: FONTS.bold, fontSize: 22, color: C.coral }}>{submittedCount}</Text>
                  <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: C.textSecondary, marginTop: 2 }}>Upplagda</Text>
                </Pressable>
                <Pressable
                  testID="claimed-bookings-link"
                  accessibilityLabel="Visa övertagna bokningar"
                  onPress={handleClaimedPress}
                  style={{ flex: 1, backgroundColor: C.bgCard, borderRadius: RADIUS.lg, borderWidth: 0.5, borderColor: C.borderLight, padding: 16, ...SHADOW.card, alignItems: "center" }}
                >
                  <Text style={{ fontFamily: FONTS.bold, fontSize: 22, color: C.success }}>{claimedCount}</Text>
                  <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: C.textSecondary, marginTop: 2 }}>Övertagna</Text>
                </Pressable>
                <Pressable
                  testID="saved-restaurants-link"
                  accessibilityLabel="Visa sparade restauranger"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={{ flex: 1, backgroundColor: C.bgCard, borderRadius: RADIUS.lg, borderWidth: 0.5, borderColor: C.borderLight, padding: 16, ...SHADOW.card, alignItems: "center" }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Heart size={16} color={C.coral} fill={savedCount > 0 ? C.coral : "transparent"} strokeWidth={2} />
                    <Text style={{ fontFamily: FONTS.bold, fontSize: 22, color: C.coral }}>{savedCount}</Text>
                  </View>
                  <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: C.textSecondary, marginTop: 2 }}>Sparade</Text>
                </Pressable>
              </View>
            </Animated.View>

            <Animated.View
              entering={FadeInDown.delay(180).springify()}
              className="mx-5 mb-5"
              testID="account-section"
            >
              <Text
                testID="section-account"
                style={{
                  fontFamily: FONTS.semiBold,
                  fontSize: 12,
                  color: C.textTertiary,
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                  marginBottom: SPACING.sm,
                  paddingHorizontal: 4,
                }}
              >
                Konto
              </Text>
              <View
                className="rounded-2xl px-5"
                style={{
                  backgroundColor: C.bgCard,
                  borderWidth: 0.5,
                  borderColor: C.borderLight,
                  ...SHADOW.card,
                }}
              >
                <MenuItem
                  icon={UserPlus}
                  label="Bjud in vän"
                  color={C.gold}
                  bgColor="rgba(201, 169, 110, 0.12)"
                  onPress={handleInvitePress}
                  index={0}
                />
                <MenuItem
                  icon={CreditCard}
                  label="Betalningar"
                  color={C.textSecondary}
                  bgColor="rgba(107, 114, 128, 0.1)"
                  onPress={handlePaymentPress}
                  index={1}
                />
                <MenuItem
                  icon={HelpCircle}
                  label="Hjälp"
                  color={C.gold}
                  bgColor="rgba(201, 169, 110, 0.1)"
                  onPress={handleSupportPress}
                  index={2}
                />
                <MenuItem
                  icon={LogOut}
                  label="Logga ut"
                  color={C.coral}
                  bgColor={C.coralLight}
                  isLast
                  onPress={handleLogoutPress}
                  index={3}
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
          testID="coming-soon-backdrop"
          accessibilityLabel="Stäng dialogrutan"
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" }}
          onPress={() => setShowComingSoon(false)}
        >
          <Pressable
            testID="coming-soon-modal"
            accessibilityLabel="Kommande funktion"
            onPress={() => {}}
            style={{
              backgroundColor: C.bgCard,
              borderRadius: RADIUS.xl,
              padding: SPACING.xl,
              marginHorizontal: 32,
              alignItems: "center",
              ...SHADOW.elevated,
            }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: RADIUS.lg,
                backgroundColor: C.coralLight,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: SPACING.md,
              }}
            >
              <Settings size={24} color={C.coral} strokeWidth={2} />
            </View>
            <Text
              style={{
                fontFamily: FONTS.displayBold,
                fontSize: 18,
                color: C.textPrimary,
                letterSpacing: -0.3,
                textAlign: "center",
              }}
            >
              {comingSoonTitle}
            </Text>
            <Text
              style={{
                fontFamily: FONTS.regular,
                fontSize: 14,
                color: C.textTertiary,
                marginTop: SPACING.sm,
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              Den här funktionen är under utveckling och kommer snart.
            </Text>
            <Pressable
              testID="coming-soon-close"
              accessibilityLabel="Stäng"
              onPress={() => setShowComingSoon(false)}
              style={{
                marginTop: SPACING.lg,
                backgroundColor: C.dark,
                borderRadius: RADIUS.md,
                paddingVertical: 13,
                paddingHorizontal: 32,
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.semiBold,
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
