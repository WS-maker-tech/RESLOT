import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { BlurView } from "expo-blur";
import {
  Home,
  PlusCircle,
  CalendarCheck,
  Bell,
  User,
  Map,
} from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";

import * as SplashScreen from "expo-splash-screen";
import { useActivityAlerts } from "@/lib/api/hooks";
import { useAuthStore } from "@/lib/auth-store";
import { C, FONTS } from "@/lib/theme";
import type { ActivityAlert } from "@/lib/api/types";
import { usePendingFeedback } from "@/lib/use-pending-feedback";

function TabIcon({
  icon: Icon,
  color,
  focused,
  isCenter,
}: {
  icon: typeof Home;
  color: string;
  focused: boolean;
  isCenter?: boolean;
}) {
  const scale = useSharedValue(focused ? 1.05 : 0.92);

  useEffect(() => {
    if (focused) {
      scale.value = withSequence(
        withSpring(1.25, { damping: 8, stiffness: 400 }),
        withSpring(1.08, { damping: 14, stiffness: 220 })
      );
    } else {
      scale.value = withSpring(0.92, {
        damping: 14,
        stiffness: 220,
      });
    }
  }, [focused, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (isCenter) {
    return (
      <View
        style={{
          backgroundColor: C.coral,
          width: 48,
          height: 48,
          borderRadius: 24,
          alignItems: "center",
          justifyContent: "center",
          marginTop: -12,
          shadowColor: C.coral,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
          elevation: 6,
        }}
      >
        <Icon size={24} color="#FFFFFF" strokeWidth={2} />
      </View>
    );
  }

  return (
    <Animated.View style={animStyle}>
      <Icon
        size={22}
        color={color}
        strokeWidth={focused ? 2.2 : 1.8}
      />
    </Animated.View>
  );
}

export default function TabLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  const [showSplash, setShowSplash] = useState(true);
  const splashOpacity = useSharedValue(1);
  const phone = useAuthStore((s) => s.phoneNumber);

  const { data: activityAlerts = [] } = useActivityAlerts(phone || "");
  const unreadCount = (activityAlerts as ActivityAlert[]).filter((a) => !a.read).length;
  const badgeCount = unreadCount > 0 ? (unreadCount > 99 ? "99+" : unreadCount) : undefined;

  usePendingFeedback();

  const splashStyle = useAnimatedStyle(() => ({
    opacity: splashOpacity.value,
  }));

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
      const timer = setTimeout(() => {
        splashOpacity.value = withTiming(0, { duration: 800 });
        setTimeout(() => setShowSplash(false), 900);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [fontsLoaded, splashOpacity]);

  if (!fontsLoaded) return null;

  return (
    <View className="flex-1" style={{ backgroundColor: C.bg }}>
      {showSplash ? (
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: C.bg,
              zIndex: 999,
              alignItems: "center",
              justifyContent: "center",
            },
            splashStyle,
          ]}
        >
          <Text
            style={{
              fontFamily: FONTS.displayBold,
              fontSize: 32,
              letterSpacing: -0.8,
            }}
          >
            <Text style={{ color: C.textPrimary }}>Re</Text><Text style={{ color: C.pistachio }}>slot</Text>
          </Text>
          <Text
            style={{
              fontFamily: FONTS.regular,
              fontSize: 15,
              color: C.textTertiary,
              marginTop: 12,
              letterSpacing: 0.2,
            }}
          >
            Din genväg till fullbokade restauranger.
          </Text>
        </Animated.View>
      ) : null}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: C.dark,
          tabBarInactiveTintColor: C.textSecondary,
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontFamily: FONTS.semiBold,
            fontSize: 9,
            marginTop: 4,
          },
          tabBarStyle: {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "rgba(250,250,248,0.97)",
            borderTopWidth: 0.5,
            borderTopColor: C.divider,
            height: 72,
            paddingTop: 6,
            paddingBottom: 8,
            elevation: 0,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
          },
          tabBarBackground: () => (
            <BlurView
              intensity={60}
              tint="light"
              style={StyleSheet.absoluteFill}
            />
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Hem",
            tabBarIcon: ({
              color,
              focused,
            }: {
              color: string;
              focused: boolean;
            }) => <TabIcon icon={Home} color={color} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="reservations"
          options={{
            title: "Bokningar",
            tabBarIcon: ({
              color,
              focused,
            }: {
              color: string;
              focused: boolean;
            }) => (
              <TabIcon icon={CalendarCheck} color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: "Karta",
            tabBarIcon: ({
              color,
              focused,
            }: {
              color: string;
              focused: boolean;
            }) => <TabIcon icon={Map} color={color} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="submit"
          options={{
            title: "Lägg upp",
            tabBarIcon: ({
              color,
              focused,
            }: {
              color: string;
              focused: boolean;
            }) => (
              <TabIcon
                icon={PlusCircle}
                color={color}
                focused={focused}
                isCenter
              />
            ),
            tabBarLabel: () => null,
          }}
        />
        <Tabs.Screen
          name="alerts"
          options={{
            title: "Bevakningar",
            tabBarIcon: ({
              color,
              focused,
            }: {
              color: string;
              focused: boolean;
            }) => <TabIcon icon={Bell} color={color} focused={focused} />,
            tabBarBadge: badgeCount,
            tabBarBadgeStyle: {
              backgroundColor: C.coral,
              color: "#FFFFFF",
              fontSize: 10,
              fontFamily: FONTS.semiBold,
              minWidth: 18,
              height: 18,
              lineHeight: 18,
              borderRadius: 9,
            },
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profil",
            tabBarIcon: ({
              color,
              focused,
            }: {
              color: string;
              focused: boolean;
            }) => <TabIcon icon={User} color={color} focused={focused} />,
          }}
        />

      </Tabs>
    </View>
  );
}
