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
} from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
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
import type { ActivityAlert } from "@/lib/api/types";

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
    scale.value = withSpring(focused ? 1.08 : 0.92, {
      damping: 14,
      stiffness: 220,
    });
  }, [focused, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (isCenter) {
    return (
      <View
        style={{
          backgroundColor: "#E06A4E",
          width: 48,
          height: 48,
          borderRadius: 24,
          alignItems: "center",
          justifyContent: "center",
          marginTop: -12,
          shadowColor: "#E06A4E",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
          elevation: 6,
        }}
      >
        <Icon size={24} color="#FFFFFF" strokeWidth={2.5} />
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

  const { data: activityAlerts = [] } = useActivityAlerts(phone || "test@reslot.se");
  const unreadCount = (activityAlerts as ActivityAlert[]).filter((a) => !a.read).length;
  const badgeCount = unreadCount > 0 ? unreadCount : undefined;

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
    <View className="flex-1" style={{ backgroundColor: "#FAFAF8" }}>
      {showSplash ? (
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "#FAFAF8",
              zIndex: 999,
              alignItems: "center",
              justifyContent: "center",
            },
            splashStyle,
          ]}
        >
          <Text
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              fontSize: 28,
              color: "#111827",
              letterSpacing: -0.5,
            }}
          >
            Reslot
          </Text>
          <Text
            style={{
              fontFamily: "PlusJakartaSans_400Regular",
              fontSize: 15,
              color: "#9CA3AF",
              marginTop: 12,
              letterSpacing: 0.2,
            }}
          >
            Bra saker händer i sista minuten.
          </Text>
        </Animated.View>
      ) : null}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#111827",
          tabBarInactiveTintColor: "#9CA3AF",
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontFamily: "PlusJakartaSans_500Medium",
            fontSize: 10,
            marginTop: 2,
          },
          tabBarStyle: {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "transparent",
            borderTopWidth: 0.5,
            borderTopColor: "rgba(0,0,0,0.06)",
            height: 88,
            paddingTop: 8,
            paddingBottom: 28,
            elevation: 0,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.05,
            shadowRadius: 16,
          },
          tabBarBackground: () => (
            <BlurView
              intensity={85}
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
            title: "Notiser",
            tabBarIcon: ({
              color,
              focused,
            }: {
              color: string;
              focused: boolean;
            }) => <TabIcon icon={Bell} color={color} focused={focused} />,
            tabBarBadge: badgeCount,
            tabBarBadgeStyle: {
              backgroundColor: "#E06A4E",
              fontSize: 10,
              fontFamily: "PlusJakartaSans_600SemiBold",
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
