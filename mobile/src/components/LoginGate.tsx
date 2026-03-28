import React from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { LogIn } from "lucide-react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useAuthStore } from "@/lib/auth-store";

interface LoginGateProps {
  title: string;
  subtitle: string;
}

export function LoginGate({ title, subtitle }: LoginGateProps) {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const handleLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    logout();
    router.replace("/onboarding");
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#FAFAF8",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 40,
      }}
    >
      {/* Icon */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(500)}
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: "rgba(224,106,78,0.08)",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
        }}
      >
        <LogIn size={32} color="#E06A4E" strokeWidth={1.5} />
      </Animated.View>

      {/* Text */}
      <Animated.View entering={FadeInDown.delay(200).duration(500)} style={{ alignItems: "center" }}>
        <Text
          style={{
            fontFamily: "PlusJakartaSans_700Bold",
            fontSize: 22,
            color: "#111827",
            textAlign: "center",
            letterSpacing: -0.4,
            marginBottom: 10,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontFamily: "PlusJakartaSans_400Regular",
            fontSize: 15,
            color: "#9CA3AF",
            textAlign: "center",
            lineHeight: 22,
          }}
        >
          {subtitle}
        </Text>
      </Animated.View>

      {/* CTA */}
      <Animated.View entering={FadeInUp.delay(350).duration(500)} style={{ width: "100%", marginTop: 36 }}>
        <Pressable
          testID="login-gate-btn"
          onPress={handleLogin}
          style={{
            backgroundColor: "#111827",
            borderRadius: 28,
            paddingVertical: 16,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              fontSize: 16,
              color: "#FFFFFF",
              letterSpacing: -0.2,
            }}
          >
            Logga in
          </Text>
        </Pressable>
      </Animated.View>

      {/* Ghost link */}
      <Animated.View entering={FadeInUp.delay(450).duration(500)} style={{ marginTop: 16 }}>
        <Pressable
          testID="create-account-btn"
          onPress={handleLogin}
        >
          <Text
            style={{
              fontFamily: "PlusJakartaSans_500Medium",
              fontSize: 14,
              color: "#E06A4E",
            }}
          >
            Skapa konto
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}
