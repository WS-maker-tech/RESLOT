import { useState, useEffect } from 'react';
import { View } from 'react-native';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Redirect, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useAuthStore } from '@/lib/auth-store';


export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const ReslotTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#FAFAF8',
    card: '#FAFAF8',
    text: '#111827',
    border: 'rgba(0,0,0,0.06)',
    primary: '#E06A4E',
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
      </Stack>
      {!hasCompletedOnboarding ? <Redirect href="/onboarding" /> : null}
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
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
  );
}
