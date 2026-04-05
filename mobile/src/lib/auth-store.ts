import { create } from "zustand";
import { persist, createJSONStorage, type StateStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { supabase } from "./supabase";
import type { Session } from "@supabase/supabase-js";

const SECURE_KEY = "reslot-auth-tokens";

const secureStorage: StateStorage = {
  getItem: async (name: string) => {
    if (Platform.OS === "web") {
      return AsyncStorage.getItem(name);
    }
    try {
      const secureData = await SecureStore.getItemAsync(SECURE_KEY);
      const asyncData = await AsyncStorage.getItem(name);
      if (!asyncData) return null;
      const parsed = JSON.parse(asyncData);
      if (secureData) {
        const tokens = JSON.parse(secureData);
        parsed.state.supabaseAccessToken = tokens.supabaseAccessToken ?? null;
        parsed.state.sessionToken = tokens.sessionToken ?? null;
      }
      return JSON.stringify(parsed);
    } catch {
      return AsyncStorage.getItem(name);
    }
  },
  setItem: async (name: string, value: string) => {
    if (Platform.OS === "web") {
      return AsyncStorage.setItem(name, value);
    }
    try {
      const parsed = JSON.parse(value);
      const tokens = {
        supabaseAccessToken: parsed.state.supabaseAccessToken,
        sessionToken: parsed.state.sessionToken,
      };
      await SecureStore.setItemAsync(SECURE_KEY, JSON.stringify(tokens));
      parsed.state.supabaseAccessToken = null;
      parsed.state.sessionToken = null;
      await AsyncStorage.setItem(name, JSON.stringify(parsed));
    } catch {
      await AsyncStorage.setItem(name, value);
    }
  },
  removeItem: async (name: string) => {
    if (Platform.OS !== "web") {
      await SecureStore.deleteItemAsync(SECURE_KEY).catch(() => {});
    }
    await AsyncStorage.removeItem(name);
  },
};

interface AuthState {
  hasCompletedOnboarding: boolean;
  isLoggedIn: boolean;
  isGuest: boolean;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  selectedCity: string;
  supabaseAccessToken: string | null;
  sessionToken: string | null;
  setOnboardingComplete: () => void;
  setGuestMode: () => void;
  setLoggedIn: (value: boolean) => void;
  setPhoneNumber: (phone: string) => void;
  setUserInfo: (first: string, last: string, email: string) => void;
  setSelectedCity: (city: string) => void;
  setSessionToken: (token: string) => void;
  setSupabaseSession: (session: Session | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      isLoggedIn: false,
      isGuest: false,
      phoneNumber: "",
      firstName: "",
      lastName: "",
      email: "",
      selectedCity: "Stockholm",
      supabaseAccessToken: null,
      sessionToken: null,
      setOnboardingComplete: () =>
        set({ hasCompletedOnboarding: true, isLoggedIn: true, isGuest: false }),
      setGuestMode: () =>
        set({ hasCompletedOnboarding: true, isLoggedIn: false, isGuest: true }),
      setLoggedIn: (value) => set({ isLoggedIn: value }),
      setPhoneNumber: (phone) => set({ phoneNumber: phone }),
      setUserInfo: (first, last, email) =>
        set({ firstName: first, lastName: last, email: email }),
      setSelectedCity: (city) => set({ selectedCity: city }),
      setSessionToken: (token) =>
        set({ sessionToken: token, supabaseAccessToken: token }),
      setSupabaseSession: (session) => {
        if (session) {
          set({
            supabaseAccessToken: session.access_token,
            sessionToken: session.access_token,
            isLoggedIn: true,
          });
        } else {
          set({
            supabaseAccessToken: null,
            sessionToken: null,
            isLoggedIn: false,
          });
        }
      },
      logout: () => {
        supabase.auth.signOut();
        set({
          hasCompletedOnboarding: false,
          isLoggedIn: false,
          isGuest: false,
          phoneNumber: "",
          firstName: "",
          lastName: "",
          email: "",
          sessionToken: null,
          supabaseAccessToken: null,
        });
      },
    }),
    {
      name: "reslot-auth",
      storage: createJSONStorage(() => secureStorage),
    }
  )
);

supabase.auth.onAuthStateChange((_event, session) => {
  useAuthStore.getState().setSupabaseSession(session);
});
