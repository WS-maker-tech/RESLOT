import React, { useState, useEffect, useRef } from 'react';
import { Platform, View, Text, Pressable } from 'react-native';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Redirect, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '@/lib/auth-store';
import { useFonts } from 'expo-font';
import { registerForPushNotificationsAsync, setupNotificationHandlers } from '@/lib/notifications';
import { router as expoRouter } from 'expo-router';

// react-native-keyboard-controller is native-only; skip on web
const KeyboardProvider =
  Platform.OS !== 'web'
    ? require('react-native-keyboard-controller').KeyboardProvider
    : ({ children }: { children: React.ReactNode }) => children;


// Error Boundary to catch rendering crashes
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FAFAF8", padding: 32 }}>
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 20, color: "#111827", marginBottom: 8, letterSpacing: -0.3 }}>
            Något gick fel
          </Text>
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: "#6B7280", textAlign: "center", marginBottom: 24 }}>
            Appen stötte på ett oväntat fel. Försök igen.
          </Text>
          <Pressable
            onPress={() => this.setState({ hasError: false, error: null })}
            style={{ backgroundColor: "#7EC87A", borderRadius: 16, paddingHorizontal: 24, paddingVertical: 12 }}
          >
            <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 15, color: "#111827" }}>Försök igen</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

const ReslotTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FAFAF8',
    card: '#FAFAF8',
    text: '#111827',
    border: 'rgba(0,0,0,0.06)',
    primary: '#7EC87A',
  },
};

function RootLayoutNav() {
  const hasCompletedOnboarding = useAuthStore((s) => s.hasCompletedOnboarding);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Wait for zustand to rehydrate from AsyncStorage
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    // If already hydrated
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    }
    return unsub;
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const { sessionToken, setLoggedIn, logout } = useAuthStore.getState();
    if (!sessionToken) return;
    const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
    if (!baseUrl) return;
    fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${sessionToken}` },
    })
      .then((res) => {
        if (res.ok) {
          setLoggedIn(true);
          // Register push token on successful auth verification
          registerForPushNotificationsAsync().then((token) => {
            if (token && baseUrl) {
              fetch(`${baseUrl}/api/profile/push-token`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${sessionToken}`,
                },
                body: JSON.stringify({ token }),
              }).catch(() => {});
            }
          });
        } else {
          logout();
        }
      })
      .catch(() => {});
  }, [hydrated]);

  if (!hydrated) return null;

  return (
    <ThemeProvider value={ReslotTheme}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FAFAF8' }, animation: 'fade' }}>
        <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'none', contentStyle: { backgroundColor: '#FAFAF8' } }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="restaurant/[id]" options={{ presentation: "modal", headerShown: false, animation: "slide_from_bottom" }} />
        <Stack.Screen name="rewards" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen
          name="faq"
          options={{
            presentation: "modal",
            title: "Frågor och svar",
          }}
        />
        <Stack.Screen
          name="credits"
          options={{
            presentation: "modal",
            title: "Reslot credits",
          }}
        />
        <Stack.Screen name="account-settings" options={{ presentation: "modal", headerShown: false }} />
        <Stack.Screen name="payment" options={{ presentation: "modal", headerShown: false }} />
        <Stack.Screen name="invite" options={{ presentation: "modal", headerShown: false }} />
        <Stack.Screen name="support" options={{ presentation: "modal", headerShown: false }} />
        <Stack.Screen name="add-watch" options={{ presentation: "modal", headerShown: false }} />
        <Stack.Screen name="booking-confirmation" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="map" options={{ headerShown: false, animation: "slide_from_right" }} />
      </Stack>
      {!hasCompletedOnboarding ? <Redirect href="/onboarding" /> : null}
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({});
  const notificationCleanupRef = useRef<(() => void) | null>(null);

  // Set up push notifications on mount
  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        console.log("[Notifications] Push token:", token);
        // Save token to backend if user is authenticated
        const { sessionToken } = useAuthStore.getState();
        if (sessionToken) {
          const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
          if (baseUrl) {
            fetch(`${baseUrl}/api/profile/push-token`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${sessionToken}`,
              },
              body: JSON.stringify({ token }),
            }).catch((err) => console.error("[Notifications] Failed to save push token:", err));
          }
        }
      }
    });

    const cleanup = setupNotificationHandlers({
      onTapped: (response) => {
        const data = response.notification.request.content.data;
        console.log("[Notifications] Tapped, data:", data);
        // Deeplink: navigate to restaurant page when notification is tapped
        if (data?.restaurantId && typeof data.restaurantId === "string") {
          setTimeout(() => {
            try {
              expoRouter.push(`/restaurant/${data.restaurantId}`);
            } catch (e) {
              console.log("[Notifications] Deeplink navigation failed:", e);
            }
          }, 500); // Small delay to ensure navigation stack is ready
        }
      },
    });
    notificationCleanupRef.current = cleanup;

    return () => {
      notificationCleanupRef.current?.();
    };
  }, []);

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProvider>
            <View style={{ flex: 1 }} onLayout={() => SplashScreen.hideAsync()}>
              <StatusBar style="dark" />
              <RootLayoutNav />
            </View>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
