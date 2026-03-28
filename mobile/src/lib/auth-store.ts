import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthState {
  hasCompletedOnboarding: boolean;
  isLoggedIn: boolean;
  isGuest: boolean;
  phoneNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  selectedCity: string;
  sessionToken: string | null;
  setOnboardingComplete: () => void;
  setGuestMode: () => void;
  setLoggedIn: (value: boolean) => void;
  setPhoneNumber: (phone: string) => void;
  setUserInfo: (first: string, last: string, email: string) => void;
  setSelectedCity: (city: string) => void;
  setSessionToken: (token: string) => void;
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
      setSessionToken: (token) => set({ sessionToken: token }),
      logout: () =>
        set({
          hasCompletedOnboarding: false,
          isLoggedIn: false,
          isGuest: false,
          phoneNumber: "",
          firstName: "",
          lastName: "",
          email: "",
          sessionToken: null,
        }),
    }),
    {
      name: "reslot-auth",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
