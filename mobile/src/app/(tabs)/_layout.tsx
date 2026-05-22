import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Tabs } from "expo-router";
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
  withTiming,
  Easing,
} from "react-native-reanimated";

// Strong custom ease-out (per Emil's design-eng — built-in CSS easings lack punch)
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);

import * as SplashScreen from "expo-splash-screen";
import { useActivityAlerts } from "@/lib/api/hooks";
import { useAuthStore } from "@/lib/auth-store";
import { C, FONTS } from "@/lib/theme";
import type { ActivityAlert } from "@/lib/api/types";
import { usePendingFeedback } from "@/lib/use-pending-feedback";

/**
 * Tab-bar — Identity v2 upgrade (2026-05-09):
 *   - Icon-only (no labels) — clean minimalistic look
 *   - FAB i forest (matchar map-pill — en primary brand-accent över hela appen)
 *   - Active-state: forest icon + 4px forest-dot under icon (scale-spring 0→1)
 *   - Inactive: inkSoft strokes, no fill
 *   - Bg: creamSoft (warmer integration än vit)
 *   - Scale-bounce på icon vid tap (spring overshoot)
 *   - FAB shadow: forest-tinted, soft
 */

function TabIcon({
  icon: Icon,
  focused,
  isCenter,
}: {
  icon: typeof Home;
  focused: boolean;
  isCenter?: boolean;
}) {
  // Subtle scale shift + opacity dot. No spring overshoot — Emil: button-feedback
  // <160ms ease-out feels more responsive than ANY spring at the same duration.
  // Dot starts at 0.5 (not 0) — nothing in real world appears from nothing.
  const scale = useSharedValue(focused ? 1 : 0.96);
  const dotScale = useSharedValue(focused ? 1 : 0.5);
  const dotOpacity = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    scale.value = withTiming(focused ? 1 : 0.96, { duration: 160, easing: EASE_OUT });
    dotScale.value = withTiming(focused ? 1 : 0.5, { duration: 200, easing: EASE_OUT });
    dotOpacity.value = withTiming(focused ? 1 : 0, { duration: 200, easing: EASE_OUT });
  }, [focused, scale, dotScale, dotOpacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
    opacity: dotOpacity.value,
  }));

  if (isCenter) {
    return (
      <Animated.View
        style={[
          {
            backgroundColor: C.forest,
            width: 54,
            height: 54,
            borderRadius: 27,
            alignItems: "center",
            justifyContent: "center",
            marginTop: -16,
            shadowColor: C.forest,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.32,
            shadowRadius: 14,
            elevation: 8,
          },
          animStyle,
        ]}
      >
        <Icon size={26} color={C.cream} strokeWidth={2.4} />
      </Animated.View>
    );
  }

  return (
    <View style={{ alignItems: "center", justifyContent: "center", gap: 6, paddingTop: 4 }}>
      <Animated.View style={animStyle}>
        <Icon
          size={24}
          color={focused ? C.forest : C.inkSoft}
          strokeWidth={focused ? 2.3 : 1.7}
        />
      </Animated.View>
      <Animated.View
        style={[
          {
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: C.forest,
          },
          dotStyle,
        ]}
      />
    </View>
  );
}

export default function TabLayout() {
  // Fonts laddas i root _layout.tsx — (tabs) renderas inte förrän de är klara.
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
    SplashScreen.hideAsync();
    // Kort hold + snabb fade — splash visas vid varje session
    // (Emil: frequent UI = under 300ms, anteckna ej även när det är "branding")
    const timer = setTimeout(() => {
      splashOpacity.value = withTiming(0, { duration: 280, easing: EASE_OUT });
      setTimeout(() => setShowSplash(false), 320);
    }, 600);
    return () => clearTimeout(timer);
  }, [splashOpacity]);

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
            <Text style={{ color: C.textPrimary }}>Re</Text>
            <Text style={{ color: C.pistachio }}>slot</Text>
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
          tabBarShowLabel: false,
          tabBarStyle: {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: C.creamSoft,
            borderTopWidth: 1,
            borderTopColor: C.forestSoft,
            height: 64,
            paddingTop: 10,
            paddingBottom: 10,
            elevation: 0,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.04,
            shadowRadius: 16,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Hem",
            tabBarIcon: ({ focused }) => <TabIcon icon={Home} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="reservations"
          options={{
            title: "Bokningar",
            tabBarIcon: ({ focused }) => <TabIcon icon={CalendarCheck} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="map"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="submit"
          options={{
            title: "Lägg upp",
            tabBarIcon: ({ focused }) => (
              <TabIcon icon={PlusCircle} focused={focused} isCenter />
            ),
          }}
        />
        <Tabs.Screen
          name="alerts"
          options={{
            title: "Bevakningar",
            tabBarIcon: ({ focused }) => <TabIcon icon={Bell} focused={focused} />,
            tabBarBadge: badgeCount,
            tabBarBadgeStyle: {
              backgroundColor: C.coral,
              color: C.cream,
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
            tabBarIcon: ({ focused }) => <TabIcon icon={User} focused={focused} />,
          }}
        />
      </Tabs>
    </View>
  );
}
