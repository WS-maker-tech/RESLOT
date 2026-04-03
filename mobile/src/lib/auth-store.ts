import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "./supabase";
import type { Session } from "@supabase/supabase-js";

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
  sessionToken: string | null; // kept for backward compat with api.ts
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
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Listen for Supabase auth state changes and sync to store
supabase.auth.onAuthStateChange((_event, session) => {
  useAuthStore.getState().setSupabaseSession(session);
});
