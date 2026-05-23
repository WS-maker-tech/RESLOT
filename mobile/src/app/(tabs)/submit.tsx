import React, { useState, useCallback, useEffect, useReducer, useMemo } from "react";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { router } from "expo-router";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
  ActivityIndicator,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Check,
  CalendarDays,
  Clock,
  Users,
  User,
  Banknote,
  Link,
  Camera,
  Upload,
  CheckCircle2,
  Armchair,
  Trees,
  AlertCircle,
  Star,
  Flame,
  Ticket,
  X,
} from "lucide-react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
  Easing,
  ReduceMotion,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useSubmitReservation, useRestaurants, useProfile } from "@/lib/api/hooks";
import { useAuthStore } from "@/lib/auth-store";
import type { Restaurant } from "@/lib/api/types";
import { RestaurantMonogram } from "@/components/RestaurantMonogram";
import { C, FONTS, SPACING, SHADOW, RADIUS, ICON, MOTION, TYPO, SELECT } from "../../lib/theme";
import { Callout } from "@/components/Callout";
import { LegalModal } from "@/components/LegalModal";
import { TERMS_CONDITIONS } from "@/lib/legal-content";

// ── Web Date Picker ──
const MONTHS_SV = ["Januari","Februari","Mars","April","Maj","Juni","Juli","Augusti","September","Oktober","November","December"];
const DAYS_SV = ["Mån","Tis","Ons","Tor","Fre","Lör","Sön"];

// Horizontal day-circle row (Airbnb/Fresha pattern) — replaces the month grid on web.
function WebDatePicker({ value, onChange }: { value: Date; onChange: (d: Date) => void }) {
  const days = useMemo(() => {
    const base = new Date(); base.setHours(0, 0, 0, 0);
    return Array.from({ length: 45 }, (_, i) => {
      const d = new Date(base); d.setDate(base.getDate() + i); return d;
    });
  }, []);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0, marginHorizontal: -4 }}
      contentContainerStyle={{ gap: 8, paddingVertical: 4, paddingHorizontal: 4 }}
    >
      {days.map((d, i) => {
        const selected = d.toDateString() === value.toDateString();
        const weekday = DAYS_SV[(d.getDay() + 6) % 7];
        return (
          <Pressable
            key={i}
            testID={`day-${i}`}
            accessibilityLabel={`Välj ${weekday} ${d.getDate()} ${MONTHS_SV[d.getMonth()]}`}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const next = new Date(value);
              next.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
              onChange(next);
            }}
            style={{
              width: 54,
              paddingVertical: 10,
              borderRadius: RADIUS.lg,
              alignItems: "center",
              backgroundColor: selected ? SELECT.solid : C.bgCard,
              borderWidth: 1.5,
              borderColor: selected ? SELECT.solid : C.borderLight,
              ...SHADOW.subtle,
            }}
          >
            <Text style={{ fontFamily: FONTS.medium, fontSize: 10.5, letterSpacing: 0.4, textTransform: "uppercase", color: selected ? "rgba(250,250,248,0.75)" : C.textTertiary }}>
              {i === 0 ? "Idag" : weekday}
            </Text>
            <Text style={{ fontFamily: FONTS.semiBold, fontSize: 18, marginTop: 3, color: selected ? SELECT.onSolid : C.dark }}>
              {d.getDate()}
            </Text>
            <Text style={{ fontFamily: FONTS.regular, fontSize: 10, marginTop: 1, color: selected ? "rgba(250,250,248,0.75)" : C.textTertiary }}>
              {MONTHS_SV[d.getMonth()].slice(0, 3).toLowerCase()}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// Build "HH:MM" slots every 30 min between two times (inclusive).
function makeSlots(sh: number, sm: number, eh: number, em: number): string[] {
  const out: string[] = [];
  let h = sh, m = sm;
  while (h < eh || (h === eh && m <= em)) {
    out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    m += 30; if (m >= 60) { m = 0; h++; }
  }
  return out;
}

const TIME_GROUPS = [
  { label: "Lunch", slots: makeSlots(11, 0, 14, 30) },
  { label: "Middag", slots: makeSlots(17, 0, 21, 30) },
  { label: "Sent", slots: makeSlots(22, 0, 23, 30) },
] as const;

// Period-grouped time-slot pills (Fresha pattern) — replaces the 15-min scroll.
function WebTimePicker({ value, onChange }: { value: Date; onChange: (d: Date) => void }) {
  const current = `${String(value.getHours()).padStart(2, "0")}:${value.getMinutes() < 30 ? "00" : "30"}`;
  return (
    <View style={{ gap: 16 }}>
      {TIME_GROUPS.map((g) => (
        <View key={g.label}>
          <Text style={{ fontFamily: FONTS.semiBold, fontSize: 12, letterSpacing: 0.4, textTransform: "uppercase", color: C.textTertiary, marginBottom: 9 }}>{g.label}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {g.slots.map((t) => {
              const selected = t === current;
              return (
                <Pressable
                  key={t}
                  accessibilityLabel={`Välj tid ${t}`}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    const [h, m] = t.split(":").map(Number);
                    const next = new Date(value); next.setHours(h!, m!, 0, 0);
                    onChange(next);
                  }}
                  style={{
                    paddingHorizontal: 15,
                    paddingVertical: 9,
                    borderRadius: RADIUS.pill,
                    backgroundColor: selected ? SELECT.solid : C.bgCard,
                    borderWidth: 1.5,
                    borderColor: selected ? SELECT.solid : C.borderLight,
                  }}
                >
                  <Text style={{ fontFamily: selected ? FONTS.semiBold : FONTS.medium, fontSize: 14, color: selected ? SELECT.onSolid : C.dark }}>
                    {t}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const STEP_LABELS = [
  "Restaurang",
  "Plats",
  "När",
  "Vem",
  "Avgifter",
  "Verifiera",
] as const;

const STEP_SUBTITLES = [
  "Var finns bokningen?",
  "Inomhus eller utomhus?",
  "När är bokningen?",
  "Vem står bokningen på?",
  "Eventuella avgifter",
  "Hur vill du verifiera bokningen?",
];

const NEXT_LABELS = [
  "Plats",
  "När",
  "Vem",
  "Avgifter",
  "Verifiera",
  "Skicka in",
];

const PARTY_SIZES = [1, 2, 3, 4, 5, 6, 7, 8] as const;

// --- Form state reducer ---
interface FormState {
  selectedRestaurant: Restaurant | null;
  location: "indoor" | "outdoor" | null;
  locationDetail: string;
  mealType: "frukost" | "brunch" | "lunch" | "middag" | null;
  bookingDate: Date;
  firstName: string;
  lastName: string;
  partySize: number;
  hasCancelFee: boolean;
  cancelFeeAmount: string;
  hasPrepaidFee: boolean;
  prepaidFeeAmount: string;
  otherInfo: string;
  verifyMethod: "link" | "screenshot" | null;
  cancellationWindowHours: string;
}

type FormAction =
  | { type: "SET_FIELD"; field: keyof FormState; value: any }
  | { type: "RESET" };

const initialFormState: FormState = {
  selectedRestaurant: null,
  location: null,
  locationDetail: "",
  mealType: null,
  bookingDate: (() => { const d = new Date(); d.setHours(18, 0, 0, 0); return d; })(),
  firstName: "",
  lastName: "",
  partySize: 2,
  hasCancelFee: false,
  cancelFeeAmount: "",
  hasPrepaidFee: false,
  prepaidFeeAmount: "",
  otherInfo: "",
  verifyMethod: null,
  cancellationWindowHours: "",
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "RESET":
      return { ...initialFormState, bookingDate: (() => { const d = new Date(); d.setHours(18, 0, 0, 0); return d; })() };
    default:
      return state;
  }
}

// ── Segmented step indicator — fills as you progress ──
function StepSegment({ active }: { active: boolean }) {
  const fill = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    fill.value = withTiming(active ? 1 : 0, {
      duration: 340,
      easing: Easing.out(Easing.cubic),
      reduceMotion: ReduceMotion.System,
    });
  }, [active]);
  const style = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(fill.value, [0, 1], [C.borderLight, SELECT.solid]),
  }));
  return (
    <View style={{ flex: 1, height: 4, borderRadius: 2, overflow: "hidden", backgroundColor: C.borderLight }}>
      <Animated.View style={[style, { flex: 1, borderRadius: 2 }]} />
    </View>
  );
}

// ── Price level as a 4-dot scale ──
function PriceDots({ level }: { level: number }) {
  const n = Math.max(0, Math.min(4, Math.round(level || 0)));
  if (n === 0) return null;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 2.5 }}>
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          style={{
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: i < n ? C.gold : "rgba(0,0,0,0.12)",
          }}
        />
      ))}
    </View>
  );
}

// ── Rich, monogram-led restaurant row with spring selection feedback ──
interface RestaurantRowProps {
  restaurant: Restaurant;
  isSelected: boolean;
  onSelect: () => void;
  entering?: any;
}

const RestaurantRow = React.memo(function RestaurantRow({
  restaurant,
  isSelected,
  onSelect,
  entering,
}: RestaurantRowProps) {
  const pressScale = useSharedValue(1);
  const selectProgress = useSharedValue(isSelected ? 1 : 0);

  useEffect(() => {
    selectProgress.value = withTiming(isSelected ? 1 : 0, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
      reduceMotion: ReduceMotion.System,
    });
  }, [isSelected]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
    backgroundColor: interpolateColor(
      selectProgress.value,
      [0, 1],
      ["rgba(255,255,255,0)", SELECT.bg],
    ),
    borderColor: interpolateColor(
      selectProgress.value,
      [0, 1],
      ["rgba(0,0,0,0)", SELECT.border],
    ),
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: selectProgress.value }],
    opacity: selectProgress.value,
  }));

  const cuisine = restaurant.cuisine?.trim();
  const neighborhood = restaurant.neighborhood?.trim();
  const subtitle = [cuisine, neighborhood].filter(Boolean).join(" · ");
  const bookedCount = restaurant.timesBookedOnReslot ?? 0;

  return (
    <Animated.View entering={entering}>
      <Pressable
        testID={`restaurant-${restaurant.name.toLowerCase().replace(/\s/g, "-")}`}
        accessibilityLabel={`Välj ${restaurant.name}`}
        onPressIn={() => { pressScale.value = withSpring(0.98, MOTION.press); }}
        onPressOut={() => { pressScale.value = withSpring(1, MOTION.press); }}
        onPress={onSelect}
      >
        <Animated.View
          style={[
            containerStyle,
            {
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              paddingVertical: 11,
              paddingHorizontal: 11,
              borderRadius: RADIUS.lg,
              borderWidth: 1.5,
            },
          ]}
        >
          <RestaurantMonogram name={restaurant.name} size={52} ring={isSelected} />

          <View style={{ flex: 1, gap: 2 }}>
            <Text numberOfLines={1} style={{ fontFamily: FONTS.semiBold, fontSize: 15.5, color: C.dark, letterSpacing: -0.3 }}>
              {restaurant.name}
            </Text>
            {subtitle ? (
              <Text numberOfLines={1} style={{ fontFamily: FONTS.regular, fontSize: 12.5, color: C.textTertiary }}>
                {subtitle}
              </Text>
            ) : null}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 9, marginTop: 2 }}>
              {restaurant.rating > 0 ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                  <Star size={12} color={C.gold} fill={C.gold} strokeWidth={0} />
                  <Text style={{ fontFamily: FONTS.semiBold, fontSize: 12, color: C.dark }}>
                    {restaurant.rating.toFixed(1)}
                  </Text>
                  {restaurant.reviewCount > 0 ? (
                    <Text style={{ fontFamily: FONTS.regular, fontSize: 11.5, color: C.textTertiary }}>
                      ({restaurant.reviewCount})
                    </Text>
                  ) : null}
                </View>
              ) : null}
              <PriceDots level={restaurant.priceLevel} />
              {bookedCount >= 3 ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                  <Flame size={11} color={C.pistachio} strokeWidth={2.4} />
                  <Text style={{ fontFamily: FONTS.semiBold, fontSize: 11.5, color: "#3d7a3a" }}>
                    {bookedCount} bokade
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <Animated.View
            style={[
              checkStyle,
              {
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: SELECT.solid,
                alignItems: "center",
                justifyContent: "center",
              },
            ]}
          >
            <Check size={15} color={SELECT.onSolid} strokeWidth={ICON.strokeWidth} />
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
});

// ── Shared selectable tile — one selection vocabulary across all steps ──
interface SelectableTileProps {
  selected: boolean;
  onPress: () => void;
  children: React.ReactNode;
  contentStyle?: any;
  flex?: number;
  testID?: string;
  accessibilityLabel?: string;
}

function SelectableTile({ selected, onPress, children, contentStyle, flex, testID, accessibilityLabel }: SelectableTileProps) {
  const scale = useSharedValue(1);
  const progress = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    progress.value = withTiming(selected ? 1 : 0, {
      duration: 180,
      easing: Easing.out(Easing.cubic),
      reduceMotion: ReduceMotion.System,
    });
  }, [selected]);
  const aStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolateColor(progress.value, [0, 1], ["#FFFFFF", SELECT.bg]),
    borderColor: interpolateColor(progress.value, [0, 1], ["rgba(0,0,0,0.05)", SELECT.border]),
  }));
  return (
    <Pressable
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.97, MOTION.press); }}
      onPressOut={() => { scale.value = withSpring(1, MOTION.press); }}
      style={flex != null ? { flex } : undefined}
    >
      <Animated.View
        style={[
          aStyle,
          { borderWidth: 1.5, borderRadius: RADIUS.lg, ...SHADOW.card },
          contentStyle,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

// Selected-state accent (readable dark green) vs resting tone
const SELECTED_ACCENT = SELECT.fg;

export default function SubmitScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const [step, setStep] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [form, dispatch] = useReducer(formReducer, initialFormState);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const [showTerms, setShowTerms] = useState<boolean>(false);
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    restaurant: boolean;
    date: boolean;
    time: boolean;
    partySize: boolean;
    firstName: boolean;
    lastName: boolean;
    location: boolean;
    verifyMethod: boolean;
  }>({
    restaurant: false,
    date: false,
    time: false,
    partySize: false,
    firstName: false,
    lastName: false,
    location: false,
    verifyMethod: false,
  });

  // Convenience accessors for form fields
  const {
    selectedRestaurant,
    location,
    locationDetail,
    mealType,
    bookingDate,
    firstName,
    lastName,
    partySize,
    hasCancelFee,
    cancelFeeAmount,
    hasPrepaidFee,
    prepaidFeeAmount,
    otherInfo,
    verifyMethod,
    cancellationWindowHours,
  } = form;

  // Convenience setter for form fields
  const setField = useCallback(<K extends keyof FormState>(field: K, value: FormState[K]) => {
    dispatch({ type: "SET_FIELD", field, value });
  }, []);

  const buttonScale = useSharedValue(1);
  const ctaProgress = useSharedValue(0);

  const phone = useAuthStore((s) => s.phoneNumber);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const { data: restaurants = [], isLoading: restaurantsLoading } = useRestaurants();
  const { data: profile } = useProfile(phone);
  const submitReservationMutation = useSubmitReservation();

  useEffect(() => {
    if (profile?.firstName && !firstName) {
      setField("firstName", profile.firstName);
    }
    if (profile?.lastName && !lastName) {
      setField("lastName", profile.lastName);
    }
  }, [profile]);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const ctaAnimStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(ctaProgress.value, [0, 1], ["rgba(31,77,42,0.06)", SELECT.solid]),
    borderColor: interpolateColor(ctaProgress.value, [0, 1], [SELECT.border, SELECT.solid]),
  }));

  const filteredRestaurants = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matches = restaurants.filter((r: Restaurant) =>
      r.name.toLowerCase().includes(q) ||
      r.address.toLowerCase().includes(q) ||
      (r.neighborhood ?? "").toLowerCase().includes(q) ||
      (r.cuisine ?? "").toLowerCase().includes(q),
    );
    return [...matches].sort((a, b) => (b.timesBookedOnReslot ?? 0) - (a.timesBookedOnReslot ?? 0));
  }, [restaurants, searchQuery]);

  const popularRestaurants = useMemo(
    () =>
      [...restaurants]
        .filter((r: Restaurant) => (r.timesBookedOnReslot ?? 0) > 0)
        .sort((a, b) => (b.timesBookedOnReslot ?? 0) - (a.timesBookedOnReslot ?? 0))
        .slice(0, 6),
    [restaurants],
  );

  const handleSelectRestaurant = useCallback((restaurant: Restaurant) => {
    setField("selectedRestaurant", restaurant);
    setValidationErrors((prev) => (prev.restaurant ? { ...prev, restaurant: false } : prev));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [setField]);

  const canAdvance = useCallback(() => {
    switch (step) {
      case 0:
        return selectedRestaurant !== null;
      case 1:
        return location !== null;
      case 2:
        return true;
      case 3:
        return firstName.trim().length > 0 && lastName.trim().length > 0;
      case 4:
        return true;
      case 5:
        return verifyMethod !== null;
      default:
        return false;
    }
  }, [step, selectedRestaurant, location, firstName, lastName, verifyMethod]);

  const ready = canAdvance();
  useEffect(() => {
    ctaProgress.value = withTiming(ready ? 1 : 0, {
      duration: 220,
      easing: Easing.out(Easing.cubic),
      reduceMotion: ReduceMotion.System,
    });
  }, [ready]);

  // Live context line carried in the footer (Airbnb pattern) — confirms choices as you go.
  const footerSummary = useMemo(() => {
    switch (step) {
      case 0:
        return selectedRestaurant?.name ?? null;
      case 1:
        return location
          ? `${location === "indoor" ? "Inomhus" : "Utomhus"}${mealType ? ` · ${mealType.charAt(0).toUpperCase()}${mealType.slice(1)}` : ""}`
          : null;
      case 2:
        return `${bookingDate.toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" })} · ${bookingDate.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}`;
      case 3:
        return `${partySize} ${partySize === 1 ? "gäst" : "gäster"}`;
      case 4:
        return hasCancelFee || hasPrepaidFee ? "Avgifter tillagda" : "Inga avgifter";
      case 5:
        return "Du tjänar 1 credit direkt";
      default:
        return null;
    }
  }, [step, selectedRestaurant, location, mealType, bookingDate, partySize, hasCancelFee, hasPrepaidFee]);

  const handleActualSubmit = async () => {
    if (!selectedRestaurant || !phone) {
      setSubmitted(true);
      setShowConfirmation(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    setSubmissionError(null);
    const dateOnly = bookingDate.toISOString().split("T")[0];
    const timeOnly = bookingDate.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
    const seatType = location === "indoor" ? "Inomhus" : location === "outdoor" ? "Utomhus" : "Inomhus";
    const mealLabel = mealType ? mealType.charAt(0).toUpperCase() + mealType.slice(1) : null;
    try {
      await submitReservationMutation.mutateAsync({
        restaurantId: selectedRestaurant.id,
        submitterPhone: phone,
        submitterFirstName: firstName,
        submitterLastName: lastName,
        reservationDate: dateOnly,
        reservationTime: timeOnly,
        partySize,
        seatType,
        nameOnReservation: `${firstName} ${lastName}`,
        cancelFee: hasCancelFee && cancelFeeAmount ? parseFloat(cancelFeeAmount) : undefined,
        prepaidAmount: hasPrepaidFee && prepaidFeeAmount ? parseFloat(prepaidFeeAmount) : undefined,
        extraInfo: [locationDetail, mealLabel].filter(Boolean).join(", ") || undefined,
        verificationLink: verifyMethod === "link" ? otherInfo || undefined : undefined,
        cancellationWindowHours: cancellationWindowHours ? parseInt(cancellationWindowHours) : undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowConfirmation(false);
      setSubmitted(true);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setSubmissionError(err?.message ?? "Något gick fel. Försök igen.");
      setShowConfirmation(false);
    }
  };

  const handleNext = async () => {
    // Validate current step before advancing
    const errors = { ...validationErrors };
    let hasError = false;

    if (step === 0 && !selectedRestaurant) {
      errors.restaurant = true;
      hasError = true;
    }
    if (step === 1 && !location) {
      errors.location = true;
      hasError = true;
    }
    if (step === 3) {
      if (!firstName.trim()) { errors.firstName = true; hasError = true; }
      if (!lastName.trim()) { errors.lastName = true; hasError = true; }
    }
    if (step === 4 && hasCancelFee && !cancellationWindowHours.trim()) {
      hasError = true;
    }
    if (step === 5 && !verifyMethod) {
      errors.verifyMethod = true;
      hasError = true;
    }

    if (hasError) {
      setValidationErrors(errors);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    // Clear errors for current step on success
    setValidationErrors({
      restaurant: false,
      date: false,
      time: false,
      partySize: false,
      firstName: false,
      lastName: false,
      location: false,
      verifyMethod: false,
    });

    if (step < 5) {
      setStep(step + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      // Kräv inloggning innan bekräftelse
      if (!isLoggedIn) {
        useAuthStore.getState().openAuthModal({ type: "drop" });
        return;
      }
      setShowConfirmation(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const resetForm = () => {
    setSubmitted(false);
    setStep(0);
    setSearchQuery("");
    dispatch({ type: "RESET" });
    setShowConfirmation(false);
    setValidationErrors({
      restaurant: false,
      date: false,
      time: false,
      partySize: false,
      firstName: false,
      lastName: false,
      location: false,
      verifyMethod: false,
    });
  };

  if (submitted) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1 }}>
          <View className="flex-1 items-center justify-center px-8">
            <Animated.View entering={FadeInDown.duration(220)}>
              <View
                className="items-center justify-center"
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: C.successLight,
                  alignSelf: "center",
                  marginBottom: 24,
                }}
              >
                <Check size={36} color={C.success} strokeWidth={ICON.strokeWidth} />
              </View>
              <Text
                style={{
                  fontFamily: FONTS.displayBold,
                  fontSize: 26,
                  color: C.dark,
                  textAlign: "center",
                  letterSpacing: -0.5,
                }}
              >
                Bokning upplagd
              </Text>
              <Text
                style={{
                  fontFamily: FONTS.regular,
                  fontSize: 15,
                  color: C.textTertiary,
                  textAlign: "center",
                  marginTop: 10,
                  lineHeight: 22,
                  paddingHorizontal: 16,
                }}
              >
                {selectedRestaurant?.name} är uppe och syns nu för andra användare.
              </Text>

              {/* Credits info box */}
              <View style={{ backgroundColor: "rgba(126,200,122,0.1)", borderRadius: RADIUS.lg, padding: 16, marginTop: 20, marginBottom: 8, borderWidth: 1, borderColor: "rgba(126,200,122,0.3)" }}>
                <Text style={{ fontFamily: FONTS.semiBold, fontSize: 14, color: "#3d7a3a", textAlign: "center" }}>+1 credit tillagd på ditt konto</Text>
              </View>

              <Pressable
                testID="submit-another-button"
                accessibilityLabel="Lägg upp en till bokning"
                onPress={resetForm}
                style={{ backgroundColor: C.dark, borderRadius: RADIUS.full, paddingVertical: 14, paddingHorizontal: 32, alignSelf: "center", marginTop: 16 }}
              >
                <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: C.white }}>Lägg upp en till</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Gå till mina bokningar"
                onPress={() => { router.replace("/(tabs)/reservations"); }}
                style={{ alignSelf: "center", marginTop: 12, paddingVertical: 8 }}
              >
                <Text style={{ fontFamily: FONTS.medium, fontSize: 14, color: C.textSecondary }}>Visa mina bokningar →</Text>
              </Pressable>
            </Animated.View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: C.bg }}>
        <Animated.View entering={FadeInDown.duration(220)} className="px-5 pt-2 pb-1">
          <Text
            style={{
              fontFamily: FONTS.semiBold,
              fontSize: 11,
              letterSpacing: 1.4,
              textTransform: "uppercase",
              color: C.textTertiary,
              marginBottom: 6,
            }}
          >
            Lägg upp bokning
          </Text>
          <Animated.Text
            key={step}
            entering={FadeIn.duration(MOTION.duration.entrance).easing(Easing.out(Easing.cubic)).reduceMotion(ReduceMotion.System)}
            testID="submit-header"
            style={TYPO.stepHero}
          >
            {STEP_SUBTITLES[step]}
          </Animated.Text>
        </Animated.View>

        {/* Segmented step indicator */}
        <View className="px-5 pt-3 pb-2">
          <View style={{ flexDirection: "row", gap: 5 }}>
            {STEP_LABELS.map((_, i) => (
              <StepSegment key={i} active={i <= step} />
            ))}
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 8,
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.semiBold,
                fontSize: 11,
                color: SELECT.fg,
              }}
            >
              {STEP_LABELS[step]}
            </Text>
            <Text
              style={{
                fontFamily: FONTS.regular,
                fontSize: 11,
                color: C.textTertiary,
              }}
            >
              Steg {step + 1} av {STEP_LABELS.length}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          testID="submit-scroll"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: SPACING.lg,
            paddingTop: SPACING.md,
            paddingBottom: 160,
          }}
        >
          {/* Step 0: Restaurant */}
          {step === 0 ? (
            <Animated.View entering={FadeInRight.duration(MOTION.duration.slow).easing(Easing.out(Easing.cubic)).reduceMotion(ReduceMotion.System)}>
              {/* Credits reward strip */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  backgroundColor: "rgba(126,200,122,0.10)",
                  borderRadius: RADIUS.lg,
                  padding: 14,
                  marginBottom: 18,
                  borderWidth: 1,
                  borderColor: "rgba(126,200,122,0.22)",
                }}
              >
                <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(126,200,122,0.22)", alignItems: "center", justifyContent: "center" }}>
                  <Ticket size={19} color="#3d7a3a" strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONTS.semiBold, fontSize: 13.5, color: "#2f6b2d" }}>
                    Du tjänar 1 credit direkt
                  </Text>
                  <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textSecondary, marginTop: 1, lineHeight: 16 }}>
                    Lägg upp en bokning — använd din credit för att ta över andras.
                  </Text>
                </View>
              </View>

              {/* Search input */}
              <View
                className="flex-row items-center"
                style={{
                  backgroundColor: C.bgCard,
                  borderRadius: RADIUS.md,
                  paddingHorizontal: 16,
                  borderWidth: 1,
                  borderColor: searchQuery.length > 0 ? SELECT.border : C.borderLight,
                  ...SHADOW.card,
                }}
              >
                <Search size={18} color={C.textTertiary} strokeWidth={2} />
                <TextInput
                  testID="restaurant-search-input"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Sök restaurang eller område..."
                  placeholderTextColor="#C2C6CC"
                  style={{
                    fontFamily: FONTS.regular,
                    fontSize: 16,
                    color: C.dark,
                    flex: 1,
                    paddingVertical: 15,
                    marginLeft: 10,
                  }}
                />
                {searchQuery.length > 0 ? (
                  <Pressable
                    testID="clear-search"
                    accessibilityLabel="Rensa sökning"
                    hitSlop={10}
                    onPress={() => { setSearchQuery(""); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    style={{ padding: 4 }}
                  >
                    <X size={16} color={C.textTertiary} strokeWidth={2.2} />
                  </Pressable>
                ) : null}
              </View>

              {/* Popular quick-pick chips */}
              {searchQuery.length === 0 && popularRestaurants.length > 0 ? (
                <View style={{ marginTop: 16 }}>
                  <Text style={{ fontFamily: FONTS.semiBold, fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", color: C.textTertiary, marginBottom: 9 }}>
                    Populära just nu
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ flexGrow: 0 }}
                    contentContainerStyle={{ gap: 8, paddingRight: 8 }}
                  >
                    {popularRestaurants.map((r: Restaurant) => {
                      const active = selectedRestaurant?.id === r.id;
                      return (
                        <Pressable
                          key={r.id}
                          testID={`popular-${r.name.toLowerCase().replace(/\s/g, "-")}`}
                          accessibilityLabel={`Snabbval ${r.name}`}
                          onPress={() => handleSelectRestaurant(r)}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 8,
                            paddingVertical: 6,
                            paddingLeft: 6,
                            paddingRight: 14,
                            borderRadius: RADIUS.pill,
                            backgroundColor: active ? SELECT.bgStrong : C.bgCard,
                            borderWidth: 1.5,
                            borderColor: active ? SELECT.border : C.borderLight,
                            ...SHADOW.subtle,
                          }}
                        >
                          <RestaurantMonogram name={r.name} size={28} radius={9} />
                          <Text style={{ fontFamily: FONTS.semiBold, fontSize: 13, color: active ? SELECT.fg : C.dark }}>
                            {r.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : null}

              {/* Section label */}
              <Text style={{ fontFamily: FONTS.semiBold, fontSize: 11, letterSpacing: 0.8, textTransform: "uppercase", color: C.textTertiary, marginTop: 18, marginBottom: 8 }}>
                {searchQuery.length > 0
                  ? `${filteredRestaurants.length} ${filteredRestaurants.length === 1 ? "träff" : "träffar"}`
                  : "Alla restauranger"}
              </Text>

              {/* Restaurant list or empty state */}
              {filteredRestaurants.length > 0 ? (
                <View style={{ gap: 4 }}>
                  {filteredRestaurants.map((restaurant: Restaurant, index: number) => (
                    <RestaurantRow
                      key={restaurant.id}
                      restaurant={restaurant}
                      isSelected={selectedRestaurant?.id === restaurant.id}
                      onSelect={() => handleSelectRestaurant(restaurant)}
                      entering={
                        searchQuery.length === 0
                          ? FadeInDown.delay(Math.min(index, 8) * 40)
                              .duration(MOTION.duration.entrance)
                              .easing(Easing.out(Easing.cubic))
                              .reduceMotion(ReduceMotion.System)
                          : undefined
                      }
                    />
                  ))}
                </View>
              ) : searchQuery.length > 0 ? (
                <Animated.View
                  entering={FadeIn.duration(MOTION.duration.entrance).reduceMotion(ReduceMotion.System)}
                  style={{ alignItems: "center", paddingVertical: 36, paddingHorizontal: 24 }}
                >
                  <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(0,0,0,0.04)", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                    <Search size={24} color={C.textTertiary} strokeWidth={2} />
                  </View>
                  <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: C.dark, textAlign: "center" }}>
                    Ingen träff på ”{searchQuery}”
                  </Text>
                  <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textTertiary, textAlign: "center", marginTop: 4, lineHeight: 19 }}>
                    Kontrollera stavningen eller sök på området istället.
                  </Text>
                  <Pressable
                    testID="empty-clear-search"
                    accessibilityLabel="Rensa sökning"
                    onPress={() => { setSearchQuery(""); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    style={{ marginTop: 16, paddingVertical: 10, paddingHorizontal: 20, borderRadius: RADIUS.pill, backgroundColor: C.dark }}
                  >
                    <Text style={{ fontFamily: FONTS.semiBold, fontSize: 13.5, color: C.white }}>Rensa sökning</Text>
                  </Pressable>
                </Animated.View>
              ) : restaurantsLoading ? (
                <View testID="restaurants-loading" style={{ alignItems: "center", paddingVertical: 48 }}>
                  <ActivityIndicator size="small" color={C.pistachio} />
                  <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textTertiary, marginTop: 12 }}>
                    Hämtar restauranger…
                  </Text>
                </View>
              ) : (
                <View style={{ alignItems: "center", paddingVertical: 40, paddingHorizontal: 24 }}>
                  <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(0,0,0,0.04)", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                    <Search size={24} color={C.textTertiary} strokeWidth={2} />
                  </View>
                  <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: C.dark, textAlign: "center" }}>
                    Inga restauranger tillgängliga än
                  </Text>
                  <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textTertiary, textAlign: "center", marginTop: 4, lineHeight: 19 }}>
                    Försök igen om en liten stund.
                  </Text>
                </View>
              )}

              {/* Inline validation error */}
              {validationErrors.restaurant ? (
                <Animated.View entering={FadeInDown.duration(300)} style={{ marginTop: 10, paddingLeft: 4 }}>
                  <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.error }}>
                    Välj en restaurang för att fortsätta
                  </Text>
                </Animated.View>
              ) : null}
            </Animated.View>
          ) : null}

          {/* Step 1: Location */}
          {step === 1 ? (
            <Animated.View entering={FadeInRight.duration(MOTION.duration.slow).easing(Easing.out(Easing.cubic)).reduceMotion(ReduceMotion.System)}>
              <View className="flex-row" style={{ gap: 12 }}>
                <SelectableTile
                  testID="location-indoor"
                  accessibilityLabel="Välj inomhus"
                  flex={1}
                  selected={location === "indoor"}
                  onPress={() => {
                    setField("location", "indoor");
                    if (validationErrors.location) setValidationErrors(prev => ({ ...prev, location: false }));
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  contentStyle={{ paddingVertical: 22, alignItems: "center", justifyContent: "center" }}
                >
                  <Armchair
                    size={30}
                    color={location === "indoor" ? SELECTED_ACCENT : C.textTertiary}
                    strokeWidth={ICON.strokeWidth}
                    style={{ marginBottom: 8 }}
                  />
                  <Text
                    style={{
                      fontFamily: location === "indoor" ? FONTS.bold : FONTS.semiBold,
                      fontSize: 16,
                      color: location === "indoor" ? SELECTED_ACCENT : C.dark,
                    }}
                  >
                    Inomhus
                  </Text>
                </SelectableTile>

                <SelectableTile
                  testID="location-outdoor"
                  accessibilityLabel="Välj utomhus"
                  flex={1}
                  selected={location === "outdoor"}
                  onPress={() => {
                    setField("location", "outdoor");
                    if (validationErrors.location) setValidationErrors(prev => ({ ...prev, location: false }));
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  contentStyle={{ paddingVertical: 22, alignItems: "center", justifyContent: "center" }}
                >
                  <Trees
                    size={30}
                    color={location === "outdoor" ? SELECTED_ACCENT : C.textTertiary}
                    strokeWidth={ICON.strokeWidth}
                    style={{ marginBottom: 8 }}
                  />
                  <Text
                    style={{
                      fontFamily: location === "outdoor" ? FONTS.bold : FONTS.semiBold,
                      fontSize: 16,
                      color: location === "outdoor" ? SELECTED_ACCENT : C.dark,
                    }}
                  >
                    Utomhus
                  </Text>
                </SelectableTile>
              </View>

              {/* Location validation error */}
              {validationErrors.location ? (
                <Animated.View entering={FadeInDown.duration(300)} style={{ marginTop: 8, paddingLeft: 4 }}>
                  <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.error }}>
                    Välj inomhus eller utomhus
                  </Text>
                </Animated.View>
              ) : null}

              {/* Meal type selector */}
              <Animated.View entering={FadeInDown.delay(1 * 50).duration(220)} style={{ marginTop: 20 }}>
                <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: C.textSecondary, marginBottom: 8 }}>
                  Typ av sittning (valfritt)
                </Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {(["frukost", "brunch", "lunch", "middag"] as const).map((type) => (
                    <SelectableTile
                      key={type}
                      testID={`meal-type-${type}`}
                      accessibilityLabel={`Välj ${type}`}
                      flex={1}
                      selected={mealType === type}
                      onPress={() => { setField("mealType", mealType === type ? null : type); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                      contentStyle={{ paddingVertical: 11, alignItems: "center", borderRadius: RADIUS.md }}
                    >
                      <Text style={{ fontFamily: mealType === type ? FONTS.bold : FONTS.semiBold, fontSize: 14, color: mealType === type ? SELECTED_ACCENT : C.dark }}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </SelectableTile>
                  ))}
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(2 * 50).duration(220)} style={{ marginTop: 20 }}>
                <Text
                  style={{
                    fontFamily: FONTS.medium,
                    fontSize: 13,
                    color: C.textSecondary,
                    marginBottom: 8,
                  }}
                >
                  Specifik plats (valfritt)
                </Text>
                <TextInput
                  testID="location-detail-input"
                  value={locationDetail}
                  onChangeText={(v) => setField("locationDetail", v)}
                  placeholder="T.ex. Terrass, Bar, Chefens bord..."
                  placeholderTextColor="#D1D5DB"
                  style={{
                    fontFamily: FONTS.regular,
                    fontSize: 15,
                    color: C.dark,
                    backgroundColor: C.bgCard,
                    borderRadius: RADIUS.md,
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                    borderWidth: 1,
                    borderColor: C.borderLight,
                    ...SHADOW.card,
                  }}
                />
              </Animated.View>
            </Animated.View>
          ) : null}

          {/* Step 2: When */}
          {step === 2 ? (
            <Animated.View entering={FadeInRight.duration(MOTION.duration.slow).easing(Easing.out(Easing.cubic)).reduceMotion(ReduceMotion.System)}>
              <Animated.View entering={FadeInDown.delay(0 * 50).duration(220)}>
                {/* Date picker — native spinner on iOS/Android, html input on web */}
                <View
                  style={{
                    backgroundColor: C.bgCard,
                    borderRadius: RADIUS.xl,
                    borderWidth: 1,
                    borderColor: C.borderLight,
                    overflow: "hidden",
                    marginBottom: 14,
                    ...SHADOW.card,
                  }}
                >
                  <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 }}>
                    <Text
                      style={{
                        fontFamily: FONTS.medium,
                        fontSize: 12,
                        color: C.textTertiary,
                        letterSpacing: 0.4,
                        textTransform: "uppercase",
                        marginBottom: 8,
                      }}
                    >
                      Datum
                    </Text>
                    {Platform.OS === "web" ? (
                      <WebDatePicker value={bookingDate} onChange={(d) => setField("bookingDate", d)} />
                    ) : (
                      <DateTimePicker
                        testID="date-picker"
                        value={bookingDate}
                        mode="date"
                        display="spinner"
                        locale="sv-SE"
                        minimumDate={new Date()}
                        onChange={(_event, selected) => {
                          if (!selected) return;
                          const next = new Date(selected);
                          next.setHours(bookingDate.getHours(), bookingDate.getMinutes(), 0, 0);
                          setField("bookingDate", next);
                        }}
                        style={{ width: "100%" }}
                      />
                    )}
                  </View>
                </View>
              </Animated.View>

              {/* Time picker — native spinner on iOS/Android, html input on web */}
              <Animated.View entering={FadeInDown.delay(1 * 50).duration(220)}>
                <View
                  style={{
                    backgroundColor: C.bgCard,
                    borderRadius: RADIUS.xl,
                    borderWidth: 1,
                    borderColor: C.borderLight,
                    overflow: "hidden",
                    marginBottom: 20,
                    ...SHADOW.card,
                  }}
                >
                  <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 }}>
                    <Text
                      style={{
                        fontFamily: FONTS.medium,
                        fontSize: 12,
                        color: C.textTertiary,
                        letterSpacing: 0.4,
                        textTransform: "uppercase",
                        marginBottom: 8,
                      }}
                    >
                      Tid
                    </Text>
                    {Platform.OS === "web" ? (
                      <WebTimePicker value={bookingDate} onChange={(d) => setField("bookingDate", d)} />
                    ) : (
                      <DateTimePicker
                        testID="time-picker"
                        value={bookingDate}
                        mode="time"
                        display="spinner"
                        locale="sv-SE"
                        minuteInterval={15}
                        onChange={(_event, selected) => {
                          if (!selected) return;
                          const next = new Date(bookingDate);
                          next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
                          setField("bookingDate", next);
                        }}
                        style={{ width: "100%" }}
                      />
                    )}
                  </View>
                </View>
              </Animated.View>

              {/* Helper hint */}
              <Animated.View entering={FadeInDown.delay(2 * 50).duration(220)}>
                <Callout variant="tip">
                  Se till att datum och tid matchar exakt det som står på din bokning.
                </Callout>
              </Animated.View>
            </Animated.View>
          ) : null}

          {/* Step 3: Who */}
          {step === 3 ? (
            <Animated.View entering={FadeInRight.duration(MOTION.duration.slow).easing(Easing.out(Easing.cubic)).reduceMotion(ReduceMotion.System)}>
              <Animated.View entering={FadeInDown.delay(0 * 50).duration(220)} className="mb-5">
                <View className="flex-row items-center mb-3" style={{ gap: 8 }}>
                  <User size={18} color={C.forest} strokeWidth={2} />
                  <Text
                    style={{
                      fontFamily: FONTS.semiBold,
                      fontSize: 16,
                      color: C.dark,
                    }}
                  >
                    Förnamn
                  </Text>
                  <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: C.error, marginLeft: 2 }}>*</Text>
                </View>
                <TextInput
                  testID="first-name-input"
                  value={firstName}
                  onChangeText={(val) => {
                    setField("firstName", val);
                    if (validationErrors.firstName && val.trim()) setValidationErrors(prev => ({ ...prev, firstName: false }));
                  }}
                  placeholder="Ditt förnamn"
                  placeholderTextColor="#D1D5DB"
                  style={{
                    fontFamily: FONTS.regular,
                    fontSize: 16,
                    color: C.dark,
                    backgroundColor: C.bgCard,
                    borderRadius: RADIUS.md,
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                    borderWidth: 1,
                    borderColor: validationErrors.firstName ? C.error : firstName.length > 0 ? SELECT.border : C.borderLight,
                    ...SHADOW.card,
                  }}
                />
                {validationErrors.firstName ? (
                  <Animated.View entering={FadeInDown.duration(300)} style={{ marginTop: 6, paddingLeft: 4 }}>
                    <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.error }}>
                      Ange förnamn
                    </Text>
                  </Animated.View>
                ) : null}
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(1 * 50).duration(220)} className="mb-5">
                <View className="flex-row items-center mb-3" style={{ gap: 8 }}>
                  <User size={18} color={C.forest} strokeWidth={2} />
                  <Text
                    style={{
                      fontFamily: FONTS.semiBold,
                      fontSize: 16,
                      color: C.dark,
                    }}
                  >
                    Efternamn
                  </Text>
                  <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: C.error, marginLeft: 2 }}>*</Text>
                </View>
                <TextInput
                  testID="last-name-input"
                  value={lastName}
                  onChangeText={(val) => {
                    setField("lastName", val);
                    if (validationErrors.lastName && val.trim()) setValidationErrors(prev => ({ ...prev, lastName: false }));
                  }}
                  placeholder="Ditt efternamn"
                  placeholderTextColor="#D1D5DB"
                  style={{
                    fontFamily: FONTS.regular,
                    fontSize: 16,
                    color: C.dark,
                    backgroundColor: C.bgCard,
                    borderRadius: RADIUS.md,
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                    borderWidth: 1,
                    borderColor: validationErrors.lastName ? C.error : lastName.length > 0 ? SELECT.border : C.borderLight,
                    ...SHADOW.card,
                  }}
                />
                {validationErrors.lastName ? (
                  <Animated.View entering={FadeInDown.duration(300)} style={{ marginTop: 6, paddingLeft: 4 }}>
                    <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.error }}>
                      Ange efternamn
                    </Text>
                  </Animated.View>
                ) : null}
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(2 * 50).duration(220)} style={{ marginBottom: 24 }}>
                <Callout variant="trust">
                  Ditt namn delas bara med den som tar över bokningen.
                </Callout>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(3 * 50).duration(220)} style={{ paddingBottom: 16 }}>
                <View className="flex-row items-center mb-3" style={{ gap: 8 }}>
                  <Users size={18} color={C.forest} strokeWidth={2} />
                  <Text
                    style={{
                      fontFamily: FONTS.semiBold,
                      fontSize: 16,
                      color: C.dark,
                    }}
                  >
                    Antal gäster
                  </Text>
                  <Text style={{ fontFamily: FONTS.bold, fontSize: 14, color: C.error, marginLeft: 2 }}>*</Text>
                </View>
                <View className="flex-row flex-wrap" style={{ gap: 10, paddingBottom: 4 }}>
                  {PARTY_SIZES.map((size) => (
                    <Pressable
                      key={size}
                      testID={`party-size-${size}`}
                      accessibilityLabel={`${size} gäster`}
                      onPress={() => {
                        setField("partySize", size);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: RADIUS.md,
                        backgroundColor: partySize === size ? SELECT.solid : C.bgCard,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1.5,
                        borderColor: partySize === size ? SELECT.solid : C.borderLight,
                        ...SHADOW.card,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: FONTS.semiBold,
                          fontSize: 17,
                          color: partySize === size ? SELECT.onSolid : C.dark,
                        }}
                      >
                        {size}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Animated.View>
            </Animated.View>
          ) : null}

          {/* Step 4: Fees */}
          {step === 4 ? (
            <Animated.View entering={FadeInRight.duration(MOTION.duration.slow).easing(Easing.out(Easing.cubic)).reduceMotion(ReduceMotion.System)}>
              {/* Cancel fee */}
              <Animated.View entering={FadeInDown.delay(0 * 50).duration(220)}>
                <View
                  style={{
                    backgroundColor: C.bgCard,
                    borderRadius: RADIUS.lg,
                    padding: SPACING.lg,
                    marginBottom: 14,
                    ...SHADOW.card,
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1" style={{ gap: 12 }}>
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: RADIUS.md,
                          backgroundColor: SELECT.bgStrong,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Banknote size={20} color={C.forest} strokeWidth={2} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontFamily: FONTS.semiBold,
                            fontSize: 15,
                            color: C.dark,
                          }}
                        >
                          Avbokningsavgift?
                        </Text>
                        <Text
                          style={{
                            fontFamily: FONTS.regular,
                            fontSize: 12,
                            color: C.textTertiary,
                            marginTop: 2,
                          }}
                        >
                          Avgift vid sen avbokning (per person)
                        </Text>
                      </View>
                    </View>
                    <Switch
                      testID="cancel-fee-toggle"
                      value={hasCancelFee}
                      onValueChange={(val) => {
                        setField("hasCancelFee", val);
                        if (!val) setField("cancelFeeAmount", "");
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      trackColor={{ false: "#E5E5E0", true: C.forest }}
                      thumbColor={C.white}
                    />
                  </View>
                  {hasCancelFee ? (
                    <TextInput
                      testID="cancel-fee-input"
                      value={cancelFeeAmount}
                      onChangeText={(v) => setField("cancelFeeAmount", v)}
                      placeholder="Avgift per person i SEK (t.ex. 250)"
                      placeholderTextColor="#D1D5DB"
                      keyboardType="numeric"
                      style={{
                        fontFamily: FONTS.regular,
                        fontSize: 15,
                        color: C.dark,
                        backgroundColor: "rgba(0,0,0,0.02)",
                        borderRadius: RADIUS.md,
                        paddingHorizontal: 14,
                        paddingVertical: 14,
                        marginTop: 14,
                        borderWidth: 1,
                        borderColor: C.borderLight,
                      }}
                    />
                  ) : null}
                  {hasCancelFee && cancelFeeAmount && parseFloat(cancelFeeAmount) > 0 && partySize > 0 ? (
                    <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textTertiary, marginTop: 6 }}>
                      Totalt: {parseFloat(cancelFeeAmount) * partySize} SEK för {partySize} personer
                    </Text>
                  ) : null}
                </View>
              </Animated.View>

              {/* Prepaid fee */}
              <Animated.View entering={FadeInDown.delay(1 * 50).duration(220)}>
                <View
                  style={{
                    backgroundColor: C.bgCard,
                    borderRadius: RADIUS.lg,
                    padding: SPACING.lg,
                    marginBottom: 14,
                    ...SHADOW.card,
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1" style={{ gap: 12 }}>
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: RADIUS.md,
                          backgroundColor: "rgba(201, 169, 110, 0.1)",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Banknote size={20} color={C.gold} strokeWidth={2} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontFamily: FONTS.semiBold,
                            fontSize: 15,
                            color: C.dark,
                          }}
                        >
                          Förbetalda avgifter?
                        </Text>
                        <Text
                          style={{
                            fontFamily: FONTS.regular,
                            fontSize: 12,
                            color: C.textTertiary,
                            marginTop: 2,
                          }}
                        >
                          T.ex. förbetalad meny
                        </Text>
                      </View>
                    </View>
                    <Switch
                      testID="prepaid-fee-toggle"
                      value={hasPrepaidFee}
                      onValueChange={(val) => {
                        setField("hasPrepaidFee", val);
                        if (!val) setField("prepaidFeeAmount", "");
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      trackColor={{ false: "#E5E5E0", true: C.forest }}
                      thumbColor={C.white}
                    />
                  </View>
                  {hasPrepaidFee ? (
                    <TextInput
                      testID="prepaid-fee-input"
                      value={prepaidFeeAmount}
                      onChangeText={(v) => setField("prepaidFeeAmount", v)}
                      placeholder="Totalt belopp i SEK (t.ex. 1200)"
                      placeholderTextColor="#D1D5DB"
                      keyboardType="numeric"
                      style={{
                        fontFamily: FONTS.regular,
                        fontSize: 15,
                        color: C.dark,
                        backgroundColor: "rgba(0,0,0,0.02)",
                        borderRadius: RADIUS.md,
                        paddingHorizontal: 14,
                        paddingVertical: 14,
                        marginTop: 14,
                        borderWidth: 1,
                        borderColor: C.borderLight,
                      }}
                    />
                  ) : null}
                  {hasPrepaidFee && prepaidFeeAmount && partySize > 0 ? (
                    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4, marginTop: 8 }}>
                      <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textSecondary }}>
                        Totalt ({partySize} pers × {prepaidFeeAmount} kr)
                      </Text>
                      <Text style={{ fontFamily: FONTS.semiBold, fontSize: 13, color: C.dark }}>
                        {partySize * Number(prepaidFeeAmount)} kr
                      </Text>
                    </View>
                  ) : null}
                </View>
              </Animated.View>

              {/* Cancellation window */}
              <Animated.View entering={FadeInDown.delay(2 * 50).duration(220)}>
                <View style={{ marginBottom: 14 }}>
                  <Text style={{ fontFamily: FONTS.semiBold, fontSize: 14, color: C.dark, marginBottom: 4 }}>
                    Avbokningsfönster (timmar)
                  </Text>
                  <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textTertiary, marginBottom: 8 }}>
                    Inom hur många timmar före bokningen kan gästen avboka gratis?
                  </Text>
                  <TextInput
                    testID="cancellation-window-input"
                    value={cancellationWindowHours}
                    onChangeText={(v) => setField("cancellationWindowHours", v)}
                    keyboardType="numeric"
                    placeholder="24"
                    placeholderTextColor="#D1D5DB"
                    style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.md, paddingHorizontal: 16, paddingVertical: 13, fontFamily: FONTS.regular, fontSize: 15, color: C.dark, borderWidth: 0.5, borderColor: C.divider }}
                  />
                </View>
              </Animated.View>

              {/* Other info */}
              <Animated.View entering={FadeInDown.delay(3 * 50).duration(220)}>
                <View style={{ marginTop: 6 }}>
                  <Text
                    style={{
                      fontFamily: FONTS.semiBold,
                      fontSize: 15,
                      color: C.dark,
                      marginBottom: 8,
                    }}
                  >
                    Övrig information
                  </Text>
                  <TextInput
                    testID="other-info-input"
                    value={otherInfo}
                    onChangeText={(v) => setField("otherInfo", v)}
                    placeholder="Något annat den som tar över bör veta..."
                    placeholderTextColor="#D1D5DB"
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    style={{
                      fontFamily: FONTS.regular,
                      fontSize: 15,
                      color: C.dark,
                      backgroundColor: C.bgCard,
                      borderRadius: RADIUS.md,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      minHeight: 100,
                      borderWidth: 1,
                      borderColor: C.borderLight,
                      ...SHADOW.card,
                    }}
                  />
                </View>
              </Animated.View>
            </Animated.View>
          ) : null}

          {/* Step 5: Verify */}
          {step === 5 ? (
            <Animated.View entering={FadeInRight.duration(MOTION.duration.slow).easing(Easing.out(Easing.cubic)).reduceMotion(ReduceMotion.System)}>
              {/* Booking summary */}
              <Animated.View entering={FadeInDown.duration(MOTION.duration.entrance).easing(Easing.out(Easing.cubic)).reduceMotion(ReduceMotion.System)}>
                <View
                  style={{
                    backgroundColor: C.bgCard,
                    borderRadius: RADIUS.lg,
                    padding: 16,
                    marginBottom: 20,
                    borderWidth: 1,
                    borderColor: C.borderLight,
                    ...SHADOW.card,
                  }}
                >
                  {selectedRestaurant ? (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        paddingBottom: 14,
                        marginBottom: 14,
                        borderBottomWidth: 1,
                        borderBottomColor: C.divider,
                      }}
                    >
                      <RestaurantMonogram name={selectedRestaurant.name} size={44} radius={12} />
                      <View style={{ flex: 1 }}>
                        <Text numberOfLines={1} style={{ fontFamily: FONTS.semiBold, fontSize: 16, color: C.dark, letterSpacing: -0.3 }}>
                          {selectedRestaurant.name}
                        </Text>
                        {selectedRestaurant.cuisine || selectedRestaurant.neighborhood ? (
                          <Text numberOfLines={1} style={{ fontFamily: FONTS.regular, fontSize: 12.5, color: C.textTertiary, marginTop: 2 }}>
                            {[selectedRestaurant.cuisine, selectedRestaurant.neighborhood].filter(Boolean).join(" · ")}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  ) : (
                    <Text style={{ fontFamily: FONTS.semiBold, fontSize: 13, color: C.textTertiary, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 12 }}>
                      Sammanfattning
                    </Text>
                  )}

                  <View style={{ gap: 11 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
                        <CalendarDays size={15} color={C.forest} strokeWidth={2} />
                        <Text style={{ fontFamily: FONTS.regular, fontSize: 13.5, color: C.textSecondary }}>Datum</Text>
                      </View>
                      <Text style={{ fontFamily: FONTS.semiBold, fontSize: 13.5, color: C.dark }}>
                        {bookingDate.toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" })}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
                        <Clock size={15} color={C.forest} strokeWidth={2} />
                        <Text style={{ fontFamily: FONTS.regular, fontSize: 13.5, color: C.textSecondary }}>Tid</Text>
                      </View>
                      <Text style={{ fontFamily: FONTS.semiBold, fontSize: 13.5, color: C.dark }}>
                        {bookingDate.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
                        <Users size={15} color={C.forest} strokeWidth={2} />
                        <Text style={{ fontFamily: FONTS.regular, fontSize: 13.5, color: C.textSecondary }}>Gäster</Text>
                      </View>
                      <Text style={{ fontFamily: FONTS.semiBold, fontSize: 13.5, color: C.dark }}>{partySize} pers</Text>
                    </View>
                    {location ? (
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 9 }}>
                          {location === "indoor" ? (
                            <Armchair size={15} color={C.forest} strokeWidth={2} />
                          ) : (
                            <Trees size={15} color={C.forest} strokeWidth={2} />
                          )}
                          <Text style={{ fontFamily: FONTS.regular, fontSize: 13.5, color: C.textSecondary }}>Plats</Text>
                        </View>
                        <Text style={{ fontFamily: FONTS.semiBold, fontSize: 13.5, color: C.dark }}>
                          {location === "indoor" ? "Inomhus" : "Utomhus"}
                          {mealType ? ` · ${mealType.charAt(0).toUpperCase()}${mealType.slice(1)}` : ""}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </Animated.View>

              {/* Invitation link option */}
              <View style={{ marginBottom: 12 }}>
                <SelectableTile
                  testID="verify-link"
                  accessibilityLabel="Verifiera med inbjudningslänk"
                  selected={verifyMethod === "link"}
                  onPress={() => {
                    setField("verifyMethod", "link");
                    if (validationErrors.verifyMethod) setValidationErrors(prev => ({ ...prev, verifyMethod: false }));
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  contentStyle={{ padding: SPACING.lg }}
                >
                  <View className="flex-row items-center" style={{ gap: 14 }}>
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: RADIUS.md,
                        backgroundColor: verifyMethod === "link" ? SELECT.bgStrong : "rgba(0,0,0,0.04)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Link
                        size={22}
                        color={verifyMethod === "link" ? SELECTED_ACCENT : C.textSecondary}
                        strokeWidth={2}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: FONTS.semiBold,
                          fontSize: 16,
                          color: verifyMethod === "link" ? SELECTED_ACCENT : C.dark,
                        }}
                      >
                        Inbjudningslänk
                      </Text>
                      <Text
                        style={{
                          fontFamily: FONTS.regular,
                          fontSize: 13,
                          color: C.textTertiary,
                          marginTop: 3,
                        }}
                      >
                        Dela en länk som ger tillgång till din bokning
                      </Text>
                    </View>
                    {verifyMethod === "link" ? (
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: SELECT.solid,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Check size={14} color={SELECT.onSolid} strokeWidth={ICON.strokeWidth} />
                      </View>
                    ) : null}
                  </View>
                </SelectableTile>
              </View>

              {/* Screenshot option */}
              <View style={{ marginBottom: 16 }}>
                <SelectableTile
                  testID="verify-screenshot"
                  accessibilityLabel="Verifiera med skärmdump"
                  selected={verifyMethod === "screenshot"}
                  onPress={() => {
                    setField("verifyMethod", "screenshot");
                    if (validationErrors.verifyMethod) setValidationErrors(prev => ({ ...prev, verifyMethod: false }));
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  contentStyle={{ padding: SPACING.lg }}
                >
                  <View className="flex-row items-center" style={{ gap: 14 }}>
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: RADIUS.md,
                        backgroundColor: verifyMethod === "screenshot" ? SELECT.bgStrong : "rgba(0,0,0,0.04)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Camera
                        size={22}
                        color={verifyMethod === "screenshot" ? SELECTED_ACCENT : C.textSecondary}
                        strokeWidth={2}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: FONTS.semiBold,
                          fontSize: 16,
                          color: verifyMethod === "screenshot" ? SELECTED_ACCENT : C.dark,
                        }}
                      >
                        Skärmdump
                      </Text>
                      <Text
                        style={{
                          fontFamily: FONTS.regular,
                          fontSize: 13,
                          color: C.textTertiary,
                          marginTop: 3,
                        }}
                      >
                        Ladda upp en bild på din bokningsbekräftelse
                      </Text>
                    </View>
                    {verifyMethod === "screenshot" ? (
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: SELECT.solid,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Check size={14} color={SELECT.onSolid} strokeWidth={ICON.strokeWidth} />
                      </View>
                    ) : null}
                  </View>
                </SelectableTile>
              </View>

              {/* Verification validation error */}
              {validationErrors.verifyMethod ? (
                <Animated.View entering={FadeInDown.duration(300)} style={{ marginTop: 4, marginBottom: 8, paddingLeft: 4 }}>
                  <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.error }}>
                    Välj en verifieringsmetod
                  </Text>
                </Animated.View>
              ) : null}

              {/* Screenshot upload area */}
              {verifyMethod === "screenshot" ? (
                <Animated.View entering={FadeInDown.duration(300)}>
                  <Pressable
                    testID="upload-screenshot-button"
                    accessibilityLabel="Ladda upp bokningsbekräftelse"
                    onPress={async () => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      const result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        allowsEditing: false,
                        quality: 0.8,
                      });
                      if (!result.canceled && result.assets[0]) {
                        setScreenshotUri(result.assets[0].uri);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      }
                    }}
                    style={{
                      borderWidth: 2,
                      borderStyle: "dashed",
                      borderColor: SELECT.border,
                      borderRadius: RADIUS.lg,
                      paddingVertical: 28,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: SELECT.bg,
                      marginBottom: 16,
                    }}
                  >
                    {screenshotUri ? (
                      <>
                        <Image source={{ uri: screenshotUri }} style={{ width: "100%", height: 160, borderRadius: RADIUS.md }} contentFit="cover" />
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 }}>
                          <CheckCircle2 size={14} color={C.success} strokeWidth={2} />
                          <Text style={{ fontFamily: FONTS.semiBold, fontSize: 13, color: C.success }}>Bild uppladdad — tryck för att byta</Text>
                        </View>
                      </>
                    ) : (
                      <>
                        <Upload size={28} color={C.forest} strokeWidth={ICON.strokeWidth} />
                        <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: C.forest, marginTop: 10 }}>Ladda upp bekräftelse</Text>
                        <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textTertiary, marginTop: 4 }}>JPG eller PNG</Text>
                      </>
                    )}
                  </Pressable>

                  <View
                    style={{
                      backgroundColor: C.successBg,
                      borderRadius: RADIUS.md,
                      padding: 16,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: FONTS.semiBold,
                        fontSize: 13,
                        color: C.success,
                        marginBottom: 10,
                      }}
                    >
                      Skärmdumpen bör visa:
                    </Text>
                    {[
                      "Namn på bokning",
                      "Restaurangens namn",
                      "Datum och tid",
                      "Antal gäster",
                      "Avbokningsavgifter och detaljer",
                    ].map((req) => (
                      <View
                        key={req}
                        className="flex-row items-center"
                        style={{ gap: 8, marginBottom: 6 }}
                      >
                        <CheckCircle2 size={14} color={C.success} strokeWidth={2} />
                        <Text
                          style={{
                            fontFamily: FONTS.regular,
                            fontSize: 13,
                            color: C.textSecondary,
                          }}
                        >
                          {req}
                        </Text>
                      </View>
                    ))}
                  </View>
                </Animated.View>
              ) : null}
            </Animated.View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom navigation */}
      <View
        style={{
          position: "absolute",
          bottom: tabBarHeight,
          left: 0,
          right: 0,
          paddingHorizontal: SPACING.lg,
          paddingTop: 16,
          paddingBottom: 16,
          backgroundColor: "rgba(250, 250, 248, 0.97)",
          borderTopWidth: 0.5,
          borderTopColor: "rgba(0,0,0,0.04)",
        }}
      >
        {submissionError ? (
          <View
            style={{
              backgroundColor: C.errorBg,
              borderRadius: RADIUS.sm,
              padding: 10,
              marginBottom: 10,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertCircle size={14} color={C.error} strokeWidth={2} />
            <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: C.error, flex: 1 }}>
              {submissionError}
            </Text>
          </View>
        ) : null}
        {footerSummary ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 10, paddingHorizontal: 4 }}>
            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: SELECT.solid }} />
            <Text numberOfLines={1} style={{ flex: 1, fontFamily: FONTS.medium, fontSize: 12.5, color: C.textSecondary }}>
              {footerSummary}
            </Text>
          </View>
        ) : null}
        <View className="flex-row items-center" style={{ gap: 12 }}>
          {step > 0 ? (
            <Pressable
              testID="back-button"
              accessibilityLabel="Gå tillbaka"
              onPress={handleBack}
              style={{
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: "rgba(0,0,0,0.04)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronLeft size={22} color={C.textSecondary} strokeWidth={2} />
            </Pressable>
          ) : null}

          <Pressable
            testID="next-button"
            accessibilityLabel={step < 5 ? `Gå vidare till ${NEXT_LABELS[step]}` : "Skicka in bokning"}
            disabled={submitReservationMutation.isPending}
            onPressIn={() => {
              buttonScale.value = withSpring(0.96, MOTION.press);
            }}
            onPressOut={() => {
              buttonScale.value = withSpring(1, MOTION.press);
            }}
            onPress={handleNext}
            style={{ flex: 1 }}
          >
            <Animated.View
              style={[
                buttonStyle,
                ctaAnimStyle,
                {
                  borderRadius: 26,
                  paddingVertical: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  borderWidth: 1.5,
                  shadowColor: C.forest,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: ready ? 0.22 : 0,
                  shadowRadius: 12,
                  elevation: ready ? 5 : 0,
                },
              ]}
            >
              {submitReservationMutation.isPending ? (
                <ActivityIndicator size="small" color={SELECT.onSolid} />
              ) : (
                <>
                  <Text
                    style={{
                      fontFamily: FONTS.bold,
                      fontSize: 15,
                      color: ready ? SELECT.onSolid : SELECT.fg,
                    }}
                  >
                    {NEXT_LABELS[step]}
                  </Text>
                  {step < 5 ? (
                    <ChevronRight
                      size={18}
                      color={ready ? SELECT.onSolid : SELECT.fg}
                      strokeWidth={ICON.strokeWidth}
                      style={{ marginLeft: 4 }}
                    />
                  ) : null}
                </>
              )}
            </Animated.View>
          </Pressable>
        </View>
      </View>

      {/* Confirmation Overlay */}
      {showConfirmation ? (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 100,
          }}
        >
          {/* Backdrop */}
          <Animated.View
            entering={FadeIn.duration(250)}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.45)",
            }}
          >
            <Pressable
              testID="confirmation-backdrop"
              accessibilityLabel="Stäng bekräftelse"
              style={{ flex: 1 }}
              onPress={() => setShowConfirmation(false)}
            />
          </Animated.View>

          {/* Bottom Sheet Card */}
          <Animated.View
            entering={FadeInDown.duration(220)}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: C.bgCard,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: SPACING.lg,
              paddingTop: 24,
              paddingBottom: 40,
              ...SHADOW.elevated,
            }}
          >
            {/* Grabber */}
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(0,0,0,0.12)", alignSelf: "center", marginBottom: 20 }} />

            <Text
              testID="confirm-header"
              style={{
                fontFamily: FONTS.displayBold,
                fontSize: 20,
                color: C.dark,
                marginBottom: 20,
              }}
            >
              Bekräfta bokning
            </Text>

            {/* Summary rows */}
            <View style={{ gap: 12, marginBottom: 20 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textSecondary }}>Restaurang</Text>
                <Text style={{ fontFamily: FONTS.semiBold, fontSize: 14, color: C.dark }}>{selectedRestaurant?.name ?? "-"}</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textSecondary }}>Datum</Text>
                <Text style={{ fontFamily: FONTS.semiBold, fontSize: 14, color: C.dark }}>
                  {bookingDate.toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" })}
                </Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textSecondary }}>Tid</Text>
                <Text style={{ fontFamily: FONTS.semiBold, fontSize: 14, color: C.dark }}>
                  {bookingDate.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textSecondary }}>Antal gäster</Text>
                <Text style={{ fontFamily: FONTS.semiBold, fontSize: 14, color: C.dark }}>{partySize} pers</Text>
              </View>
            </View>

            {/* Divider */}
            <View style={{ height: 0.5, backgroundColor: C.divider, marginBottom: 16 }} />

            {/* Reward + trust */}
            <Text
              style={{
                fontFamily: FONTS.regular,
                fontSize: 13,
                color: C.textSecondary,
                textAlign: "center",
                marginBottom: 8,
              }}
            >
              Du får 1 credit direkt när du lägger upp bokningen.
            </Text>
            <Text
              style={{
                fontFamily: FONTS.regular,
                fontSize: 12,
                color: C.textTertiary,
                textAlign: "center",
                lineHeight: 18,
                marginBottom: 20,
              }}
            >
              Genom att lägga upp godkänner du Reslots{" "}
              <Text
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowTerms(true); }}
                style={{ fontFamily: FONTS.semiBold, color: C.forest, textDecorationLine: "underline" }}
              >
                villkor
              </Text>
              .
            </Text>

            {/* Confirm CTA */}
            <Pressable
              testID="confirm-submit-btn"
              accessibilityLabel="Bekräfta och lägg upp bokning"
              disabled={submitReservationMutation.isPending}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                handleActualSubmit();
              }}
              style={{
                backgroundColor: C.forest,
                borderRadius: RADIUS.full,
                paddingVertical: 16,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                shadowColor: C.forest,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              {submitReservationMutation.isPending ? (
                <>
                  <ActivityIndicator size="small" color={SELECT.onSolid} />
                  <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: SELECT.onSolid }}>
                    Lägger upp…
                  </Text>
                </>
              ) : (
                <Text style={{ fontFamily: FONTS.bold, fontSize: 15, color: SELECT.onSolid }}>
                  Lägg upp bokning
                </Text>
              )}
            </Pressable>

            {/* Cancel button */}
            <Pressable
              testID="cancel-confirm-btn"
              accessibilityLabel="Avbryt"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowConfirmation(false);
              }}
              style={{ alignItems: "center", paddingVertical: 14, marginTop: 4 }}
            >
              <Text style={{ fontFamily: FONTS.medium, fontSize: 14, color: C.textSecondary }}>
                Avbryt
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      ) : null}

      <LegalModal
        visible={showTerms}
        onClose={() => setShowTerms(false)}
        title="Användarvillkor"
        content={TERMS_CONDITIONS}
      />
    </View>
  );
}
