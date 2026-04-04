import React from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { LogIn } from "lucide-react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useAuthStore } from "@/lib/auth-store";
import { C, FONTS, SPACING, RADIUS, ICON } from "@/lib/theme";

interface LoginGateProps {
  title: string;
  subtitle: string;
}

export function LoginGate({ title, subtitle }: LoginGateProps) {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  const handleLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Om redan inloggad men fastnat i gäst-läge — rensa isGuest direkt
    if (isLoggedIn) {
      setOnboardingComplete();
      return;
    }
    logout();
    router.replace("/onboarding");
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: C.bg,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 40,
      }}
    >
      {/* Icon */}
      <Animated.View
        entering={FadeInDown.delay(100).springify()}
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: C.coralLight,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: SPACING.xl,
        }}
      >
        <LogIn size={32} color={C.coral} strokeWidth={ICON.strokeWidth} />
      </Animated.View>

      {/* Text */}
      <Animated.View entering={FadeInDown.delay(200).springify()} style={{ alignItems: "center" }}>
        <Text
          style={{
            fontFamily: FONTS.displayBold,
            fontSize: 22,
            color: C.textPrimary,
            textAlign: "center",
            letterSpacing: -0.4,
            marginBottom: 10,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontFamily: FONTS.regular,
            fontSize: 15,
            color: C.textTertiary,
            textAlign: "center",
            lineHeight: 22,
          }}
        >
          {subtitle}
        </Text>
      </Animated.View>

      {/* CTA */}
      <Animated.View entering={FadeInUp.delay(350).springify()} style={{ width: "100%", marginTop: 36 }}>
        <Pressable
          testID="login-gate-btn"
          onPress={handleLogin}
          style={{
            backgroundColor: C.coral,
            borderRadius: RADIUS.full,
            paddingVertical: SPACING.md,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.bold,
              fontSize: 16,
              color: "#111827",
              letterSpacing: -0.2,
            }}
          >
            Logga in
          </Text>
        </Pressable>
      </Animated.View>

      {/* Ghost link */}
      <Animated.View entering={FadeInUp.delay(450).springify()} style={{ marginTop: SPACING.md }}>
        <Pressable
          testID="create-account-btn"
          onPress={handleLogin}
        >
          <Text
            style={{
              fontFamily: FONTS.medium,
              fontSize: 14,
              color: C.coral,
            }}
          >
            Skapa konto
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
