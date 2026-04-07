import React, { useState, useCallback, useEffect, useReducer } from "react";
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
  MapPin,
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
  Sparkles,
  Armchair,
  Trees,
  AlertCircle,
} from "lucide-react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useSubmitReservation, useRestaurants, useProfile } from "@/lib/api/hooks";
import { useAuthStore } from "@/lib/auth-store";
import type { Restaurant } from "@/lib/api/types";
import { C, FONTS, SPACING, SHADOW, RADIUS, ICON } from "../../lib/theme";

// ── Web Date Picker ──
const MONTHS_SV = ["Januari","Februari","Mars","April","Maj","Juni","Juli","Augusti","September","Oktober","November","December"];
const DAYS_SV = ["Mån","Tis","Ons","Tor","Fre","Lör","Sön"];

function WebDatePicker({ value, onChange }: { value: Date; onChange: (d: Date) => void }) {
  const [viewDate, setViewDate] = useState(new Date(value));
  const today = new Date(); today.setHours(0,0,0,0);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = firstDay === 0 ? 6 : firstDay - 1;

  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);
  while (cells.length % 7 !== 0) cells.push(null);

  const isSelected = (d: number) => {
    const sel = new Date(value);
    return sel.getDate() === d && sel.getMonth() === month && sel.getFullYear() === year;
  };
  const isPast = (d: number) => new Date(year, month, d) < today;

  return (
    <View style={{ paddingTop: 4 }}>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <Pressable accessibilityLabel="Föregående månad" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); const d = new Date(viewDate); d.setMonth(d.getMonth()-1); setViewDate(d); }}
          style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.05)", alignItems: "center", justifyContent: "center" }}>
          <ChevronLeft size={16} color={C.textSecondary} strokeWidth={ICON.strokeWidth} />
        </Pressable>
        <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: C.dark }}>
          {MONTHS_SV[month]} {year}
        </Text>
        <Pressable accessibilityLabel="Nästa månad" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); const d = new Date(viewDate); d.setMonth(d.getMonth()+1); setViewDate(d); }}
          style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.05)", alignItems: "center", justifyContent: "center" }}>
          <ChevronRight size={16} color={C.textSecondary} strokeWidth={ICON.strokeWidth} />
        </Pressable>
      </View>
      {/* Day labels */}
      <View style={{ flexDirection: "row", marginBottom: 4 }}>
        {DAYS_SV.map(d => (
          <Text key={d} style={{ flex: 1, textAlign: "center", fontFamily: FONTS.medium, fontSize: 11, color: C.textTertiary, letterSpacing: 0.3 }}>{d}</Text>
        ))}
      </View>
      {/* Grid */}
      {Array.from({ length: cells.length / 7 }, (_, row) => (
        <View key={row} style={{ flexDirection: "row", marginBottom: 2 }}>
          {cells.slice(row*7, row*7+7).map((d, i) => (
            <Pressable key={i} accessibilityLabel={d ? `Välj dag ${d}` : undefined} onPress={() => { if (!d || isPast(d)) return; Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); const next = new Date(value); next.setFullYear(year, month, d); onChange(next); }}
              style={{ flex: 1, height: 38, alignItems: "center", justifyContent: "center",
                backgroundColor: d && isSelected(d) ? C.coral : "transparent",
                borderRadius: 19, opacity: d && isPast(d) ? 0.3 : 1 }}>
              {d ? <Text style={{ fontFamily: isSelected(d) ? FONTS.semiBold : FONTS.regular, fontSize: 14,
                color: isSelected(d) ? "#111827" : C.dark }}>{d}</Text> : null}
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}

function WebTimePicker({ value, onChange }: { value: Date; onChange: (d: Date) => void }) {
  const times: string[] = [];
  for (let h = 6; h < 24; h++) {
    for (const m of [0, 15, 30, 45]) {
      times.push(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`);
    }
  }
  const current = `${String(value.getHours()).padStart(2,"0")}:${String(Math.round(value.getMinutes()/15)*15).padStart(2,"0")}`;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}
      contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
      {times.map(t => {
        const selected = t === current;
        return (
          <Pressable key={t} accessibilityLabel={`Välj tid ${t}`} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); const [h,m] = t.split(":").map(Number); const next = new Date(value); next.setHours(h!,m!,0,0); onChange(next); }}
            style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
              backgroundColor: selected ? C.coral : "rgba(0,0,0,0.05)" }}>
            <Text style={{ fontFamily: selected ? FONTS.semiBold : FONTS.regular, fontSize: 14,
              color: selected ? "#111827" : C.textSecondary }}>{t}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
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
  mealType: "lunch" | "middag" | "brunch" | null;
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

export default function SubmitScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const [step, setStep] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [form, dispatch] = useReducer(formReducer, initialFormState);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
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
  const progressAnim = useSharedValue((0 + 1) / STEP_LABELS.length);

  const phone = useAuthStore((s) => s.phoneNumber);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const { data: restaurants = [] } = useRestaurants();
  const { data: profile } = useProfile(phone);
  const submitReservationMutation = useSubmitReservation();

  useEffect(() => {
    progressAnim.value = withTiming((step + 1) / STEP_LABELS.length, {
      duration: 450,
      easing: Easing.out(Easing.cubic),
    });
  }, [step]);

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

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressAnim.value * 100}%`,
  }));

  const filteredRestaurants = restaurants.filter((r: Restaurant) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <Animated.View entering={FadeInDown.springify()}>
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
                Bokning Upplagd
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
                {selectedRestaurant?.name} är uppe.{"\n"}Du får 2 credits när någon tar bordet.
              </Text>
              <Pressable
                testID="submit-another-button"
                accessibilityLabel="Lägg upp en till bokning"
                onPress={resetForm}
                className="mt-8 items-center rounded-full py-4 px-8"
                style={{ backgroundColor: C.dark, alignSelf: "center" }}
              >
                <Text
                  style={{
                    fontFamily: FONTS.semiBold,
                    fontSize: 15,
                    color: "#FFFFFF",
                  }}
                >
                  Lägg upp en till
                </Text>
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
        <Animated.View entering={FadeInDown.springify()} className="px-5 pt-2 pb-1">
          <Text
            testID="submit-header"
            style={{
              fontFamily: FONTS.displayBold,
              fontSize: 24,
              color: C.dark,
              letterSpacing: -0.5,
            }}
          >
            Lägg upp bokning
          </Text>
          <Text
            style={{
              fontFamily: FONTS.regular,
              fontSize: 14,
              color: C.textTertiary,
              marginTop: 3,
            }}
          >
            {STEP_SUBTITLES[step]}
          </Text>
        </Animated.View>

        {/* Animated progress bar */}
        <View className="px-5 pt-3 pb-2">
          <View
            style={{
              height: 2,
              backgroundColor: C.borderLight,
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <Animated.View
              style={[
                progressBarStyle,
                { height: 2, backgroundColor: C.coral, borderRadius: 2 },
              ]}
            />
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 6,
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.semiBold,
                fontSize: 11,
                color: C.coral,
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
              {step + 1} / {STEP_LABELS.length}
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
            <Animated.View entering={FadeInRight.duration(400)}>
              {/* Search input */}
              <Animated.View
                entering={FadeInDown.delay(0 * 50).springify()}
                className="flex-row items-center"
                style={{
                  backgroundColor: C.bgCard,
                  borderRadius: RADIUS.md,
                  paddingHorizontal: 16,
                  borderWidth: 1,
                  borderColor: searchQuery.length > 0 ? C.coralPressed : C.borderLight,
                  ...SHADOW.card,
                }}
              >
                <Search size={18} color={C.textTertiary} strokeWidth={2} />
                <TextInput
                  testID="restaurant-search-input"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Sök restaurang..."
                  placeholderTextColor="#D1D5DB"
                  style={{
                    fontFamily: FONTS.regular,
                    fontSize: 16,
                    color: C.dark,
                    flex: 1,
                    paddingVertical: 16,
                    marginLeft: 10,
                  }}
                />
              </Animated.View>

              {/* Restaurant list */}
              <View style={{ marginTop: 12, gap: 6 }}>
                {filteredRestaurants.map((restaurant: Restaurant, index: number) => {
                  const isSelected = selectedRestaurant?.id === restaurant.id;
                  return (
                    <Animated.View key={restaurant.id} entering={FadeInDown.delay((index + 1) * 50).springify()}>
                      <Pressable
                        testID={`restaurant-${restaurant.name.toLowerCase().replace(/\s/g, "-")}`}
                        accessibilityLabel={`Välj ${restaurant.name}`}
                        onPress={() => {
                          setField("selectedRestaurant", restaurant);
                          if (validationErrors.restaurant) setValidationErrors(prev => ({ ...prev, restaurant: false }));
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                        style={{
                          backgroundColor: isSelected ? "rgba(224,106,78,0.06)" : C.bgCard,
                          borderRadius: RADIUS.md,
                          paddingHorizontal: 16,
                          paddingVertical: 14,
                          borderWidth: 1.5,
                          borderColor: isSelected ? C.coral : "rgba(0,0,0,0.05)",
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontFamily: isSelected ? FONTS.semiBold : FONTS.medium,
                              fontSize: 15,
                              color: isSelected ? C.coral : C.dark,
                            }}
                          >
                            {restaurant.name}
                          </Text>
                          <View className="flex-row items-center" style={{ marginTop: 3, gap: 4 }}>
                            <MapPin size={12} color={C.textTertiary} strokeWidth={2} />
                            <Text
                              style={{
                                fontFamily: FONTS.regular,
                                fontSize: 12,
                                color: C.textTertiary,
                              }}
                            >
                              {restaurant.address}
                            </Text>
                          </View>
                        </View>
                        {isSelected ? (
                          <View
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              backgroundColor: C.coral,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Check size={14} color="#111827" strokeWidth={ICON.strokeWidth} />
                          </View>
                        ) : null}
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </View>

              {/* Inline validation error */}
              {validationErrors.restaurant ? (
                <Animated.View entering={FadeInDown.duration(300)} style={{ marginTop: 8, paddingLeft: 4 }}>
                  <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.error }}>
                    Välj en restaurang
                  </Text>
                </Animated.View>
              ) : null}
            </Animated.View>
          ) : null}

          {/* Step 1: Location */}
          {step === 1 ? (
            <Animated.View entering={FadeInRight.duration(400)}>
              <Animated.View entering={FadeInDown.delay(0 * 50).springify()} className="flex-row" style={{ gap: 12 }}>
                <Pressable
                  testID="location-indoor"
                  accessibilityLabel="Välj inomhus"
                  onPress={() => {
                    setField("location", "indoor");
                    if (validationErrors.location) setValidationErrors(prev => ({ ...prev, location: false }));
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 22,
                    borderRadius: RADIUS.lg,
                    backgroundColor: location === "indoor" ? "rgba(224,106,78,0.06)" : C.bgCard,
                    borderWidth: 1.5,
                    borderColor: location === "indoor" ? C.coral : "rgba(0,0,0,0.05)",
                    alignItems: "center",
                    justifyContent: "center",
                    ...SHADOW.card,
                  }}
                >
                  <Armchair
                    size={30}
                    color={location === "indoor" ? C.coral : C.textTertiary}
                    strokeWidth={ICON.strokeWidth}
                    style={{ marginBottom: 8 }}
                  />
                  <Text
                    style={{
                      fontFamily: location === "indoor" ? FONTS.bold : FONTS.semiBold,
                      fontSize: 16,
                      color: location === "indoor" ? C.coral : C.dark,
                    }}
                  >
                    Inomhus
                  </Text>
                </Pressable>

                <Pressable
                  testID="location-outdoor"
                  accessibilityLabel="Välj utomhus"
                  onPress={() => {
                    setField("location", "outdoor");
                    if (validationErrors.location) setValidationErrors(prev => ({ ...prev, location: false }));
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 22,
                    borderRadius: RADIUS.lg,
                    backgroundColor: location === "outdoor" ? "rgba(224,106,78,0.06)" : C.bgCard,
                    borderWidth: 1.5,
                    borderColor: location === "outdoor" ? C.coral : "rgba(0,0,0,0.05)",
                    alignItems: "center",
                    justifyContent: "center",
                    ...SHADOW.card,
                  }}
                >
                  <Trees
                    size={30}
                    color={location === "outdoor" ? C.coral : C.textTertiary}
                    strokeWidth={ICON.strokeWidth}
                    style={{ marginBottom: 8 }}
                  />
                  <Text
                    style={{
                      fontFamily: location === "outdoor" ? FONTS.bold : FONTS.semiBold,
                      fontSize: 16,
                      color: location === "outdoor" ? C.coral : C.dark,
                    }}
                  >
                    Utomhus
                  </Text>
                </Pressable>
              </Animated.View>

              {/* Location validation error */}
              {validationErrors.location ? (
                <Animated.View entering={FadeInDown.duration(300)} style={{ marginTop: 8, paddingLeft: 4 }}>
                  <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.error }}>
                    Välj inomhus eller utomhus
                  </Text>
                </Animated.View>
              ) : null}

              {/* Meal type selector */}
              <Animated.View entering={FadeInDown.delay(1 * 50).springify()} style={{ marginTop: 20 }}>
                <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: C.textSecondary, marginBottom: 8 }}>
                  Typ av sittning (valfritt)
                </Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {(["lunch", "middag", "brunch"] as const).map((type) => (
                    <Pressable
                      key={type}
                      testID={`meal-type-${type}`}
                      accessibilityLabel={`Välj ${type}`}
                      onPress={() => { setField("mealType", mealType === type ? null : type); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: RADIUS.md,
                        backgroundColor: mealType === type ? "rgba(224,106,78,0.06)" : C.bgCard,
                        borderWidth: 1.5,
                        borderColor: mealType === type ? C.coral : "rgba(0,0,0,0.05)",
                        alignItems: "center",
                        ...SHADOW.card,
                      }}
                    >
                      <Text style={{ fontFamily: mealType === type ? FONTS.bold : FONTS.semiBold, fontSize: 14, color: mealType === type ? C.coral : C.dark }}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(2 * 50).springify()} style={{ marginTop: 20 }}>
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
            <Animated.View entering={FadeInRight.duration(400)}>
              <Animated.View entering={FadeInDown.delay(0 * 50).springify()}>
                <Text
                  style={{
                    fontFamily: FONTS.semiBold,
                    fontSize: 16,
                    color: C.dark,
                    marginBottom: 16,
                    letterSpacing: -0.2,
                  }}
                >
                  När är bokningen?
                </Text>

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
              <Animated.View entering={FadeInDown.delay(1 * 50).springify()}>
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
              <Animated.View entering={FadeInDown.delay(2 * 50).springify()}>
                <View
                  className="rounded-xl p-4"
                  style={{ backgroundColor: C.successBg }}
                >
                  <View className="flex-row items-center" style={{ gap: 6 }}>
                    <Sparkles size={14} color={C.success} strokeWidth={2} />
                    <Text
                      style={{
                        fontFamily: FONTS.medium,
                        fontSize: 13,
                        color: C.success,
                        flex: 1,
                      }}
                    >
                      Se till att datum och tid matchar exakt det som står på din bokning.
                    </Text>
                  </View>
                </View>
              </Animated.View>
            </Animated.View>
          ) : null}

          {/* Step 3: Who */}
          {step === 3 ? (
            <Animated.View entering={FadeInRight.duration(400)}>
              <Animated.View entering={FadeInDown.delay(0 * 50).springify()} className="mb-5">
                <View className="flex-row items-center mb-3" style={{ gap: 8 }}>
                  <User size={18} color={C.coral} strokeWidth={2} />
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
                    borderColor: validationErrors.firstName ? C.error : firstName.length > 0 ? C.coralPressed : C.borderLight,
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

              <Animated.View entering={FadeInDown.delay(1 * 50).springify()} className="mb-5">
                <View className="flex-row items-center mb-3" style={{ gap: 8 }}>
                  <User size={18} color={C.coral} strokeWidth={2} />
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
                    borderColor: validationErrors.lastName ? C.error : lastName.length > 0 ? C.coralPressed : C.borderLight,
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

              <Animated.View entering={FadeInDown.delay(2 * 50).springify()}>
                <View
                  className="rounded-xl p-4 mb-6"
                  style={{ backgroundColor: "rgba(201, 169, 110, 0.08)" }}
                >
                  <Text
                    style={{
                      fontFamily: FONTS.regular,
                      fontSize: 13,
                      color: C.gold,
                      lineHeight: 19,
                    }}
                  >
                    Ditt namn delas bara med den som tar över bokningen.
                  </Text>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(3 * 50).springify()} style={{ paddingBottom: 16 }}>
                <View className="flex-row items-center mb-3" style={{ gap: 8 }}>
                  <Users size={18} color={C.coral} strokeWidth={2} />
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
                        backgroundColor: partySize === size ? C.dark : C.bgCard,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1.5,
                        borderColor: partySize === size ? C.dark : C.borderLight,
                        ...SHADOW.card,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: FONTS.semiBold,
                          fontSize: 17,
                          color: partySize === size ? "#FFFFFF" : C.dark,
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
            <Animated.View entering={FadeInRight.duration(400)}>
              {/* Cancel fee */}
              <Animated.View entering={FadeInDown.delay(0 * 50).springify()}>
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
                          backgroundColor: C.coralLight,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Banknote size={20} color={C.coral} strokeWidth={2} />
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
                          Avgift vid sen avbokning
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
                      trackColor={{ false: "#E5E5E0", true: C.coral }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                  {hasCancelFee ? (
                    <TextInput
                      testID="cancel-fee-input"
                      value={cancelFeeAmount}
                      onChangeText={(v) => setField("cancelFeeAmount", v)}
                      placeholder="Belopp i kr (t.ex. 500)"
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
                  {hasCancelFee && cancelFeeAmount && partySize ? (
                    <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textTertiary, marginTop: 6 }}>
                      Totalt: {parseFloat(cancelFeeAmount) * partySize} kr ({cancelFeeAmount} kr/person × {partySize} pers)
                    </Text>
                  ) : null}
                </View>
              </Animated.View>

              {/* Prepaid fee */}
              <Animated.View entering={FadeInDown.delay(1 * 50).springify()}>
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
                      trackColor={{ false: "#E5E5E0", true: C.coral }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                  {hasPrepaidFee ? (
                    <TextInput
                      testID="prepaid-fee-input"
                      value={prepaidFeeAmount}
                      onChangeText={(v) => setField("prepaidFeeAmount", v)}
                      placeholder="Belopp i kr (t.ex. 1200)"
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
              <Animated.View entering={FadeInDown.delay(2 * 50).springify()}>
                <View style={{ marginBottom: 14 }}>
                  <Text style={{ fontFamily: FONTS.semiBold, fontSize: 14, color: C.dark, marginBottom: 4 }}>
                    Avbokningsfönster (timmar)
                  </Text>
                  <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textTertiary, marginBottom: 8 }}>
                    Antal timmar innan bokningstillfället som avbokning måste ske. Om sen avbokning sker övergår betalningsansvaret till den som tagit över bokningen.
                  </Text>
                  <TextInput
                    testID="cancellation-window-input"
                    value={cancellationWindowHours}
                    onChangeText={(v) => setField("cancellationWindowHours", v)}
                    keyboardType="numeric"
                    placeholder="t.ex. 24"
                    placeholderTextColor="#D1D5DB"
                    style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.md, paddingHorizontal: 16, paddingVertical: 13, fontFamily: FONTS.regular, fontSize: 15, color: C.dark, borderWidth: 0.5, borderColor: C.divider }}
                  />
                </View>
              </Animated.View>

              {/* Other info */}
              <Animated.View entering={FadeInDown.delay(3 * 50).springify()}>
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
            <Animated.View entering={FadeInRight.duration(400)}>
              {/* Booking summary */}
              <Animated.View entering={FadeInDown.delay(0 * 50).springify()}>
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
                  <Text
                    style={{
                      fontFamily: FONTS.semiBold,
                      fontSize: 13,
                      color: C.textTertiary,
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                      marginBottom: 12,
                    }}
                  >
                    Sammanfattning
                  </Text>
                  <View style={{ gap: 8 }}>
                    <View className="flex-row items-center" style={{ gap: 10 }}>
                      <CalendarDays size={15} color={C.coral} strokeWidth={2} />
                      <Text
                        style={{
                          fontFamily: FONTS.medium,
                          fontSize: 14,
                          color: C.dark,
                        }}
                      >
                        {bookingDate.toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" })}
                      </Text>
                    </View>
                    <View className="flex-row items-center" style={{ gap: 10 }}>
                      <Clock size={15} color={C.coral} strokeWidth={2} />
                      <Text
                        style={{
                          fontFamily: FONTS.medium,
                          fontSize: 14,
                          color: C.dark,
                        }}
                      >
                        {bookingDate.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}
                      </Text>
                    </View>
                  </View>
                </View>
              </Animated.View>

              {/* Invitation link option */}
              <Animated.View entering={FadeInDown.delay(1 * 50).springify()}>
                <Pressable
                  testID="verify-link"
                  accessibilityLabel="Verifiera med inbjudningslänk"
                  onPress={() => {
                    setField("verifyMethod", "link");
                    if (validationErrors.verifyMethod) setValidationErrors(prev => ({ ...prev, verifyMethod: false }));
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={{
                    backgroundColor: verifyMethod === "link" ? "rgba(224,106,78,0.06)" : C.bgCard,
                    borderRadius: RADIUS.lg,
                    padding: SPACING.lg,
                    marginBottom: 12,
                    borderWidth: 1.5,
                    borderColor: verifyMethod === "link" ? C.coral : "rgba(0,0,0,0.05)",
                    ...SHADOW.card,
                  }}
                >
                  <View className="flex-row items-center" style={{ gap: 14 }}>
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: RADIUS.md,
                        backgroundColor: verifyMethod === "link"
                          ? C.coralLight
                          : "rgba(0,0,0,0.04)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Link
                        size={22}
                        color={verifyMethod === "link" ? C.coral : C.textSecondary}
                        strokeWidth={2}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: FONTS.semiBold,
                          fontSize: 16,
                          color: verifyMethod === "link" ? C.coral : C.dark,
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
                          backgroundColor: C.coral,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Check size={14} color="#111827" strokeWidth={ICON.strokeWidth} />
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              </Animated.View>

              {/* Screenshot option */}
              <Animated.View entering={FadeInDown.delay(2 * 50).springify()}>
                <Pressable
                  testID="verify-screenshot"
                  accessibilityLabel="Verifiera med skärmdump"
                  onPress={() => {
                    setField("verifyMethod", "screenshot");
                    if (validationErrors.verifyMethod) setValidationErrors(prev => ({ ...prev, verifyMethod: false }));
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={{
                    backgroundColor: verifyMethod === "screenshot" ? "rgba(224,106,78,0.06)" : C.bgCard,
                    borderRadius: RADIUS.lg,
                    padding: SPACING.lg,
                    marginBottom: 16,
                    borderWidth: 1.5,
                    borderColor: verifyMethod === "screenshot" ? C.coral : "rgba(0,0,0,0.05)",
                    ...SHADOW.card,
                  }}
                >
                  <View className="flex-row items-center" style={{ gap: 14 }}>
                    <View
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: RADIUS.md,
                        backgroundColor: verifyMethod === "screenshot"
                          ? C.coralLight
                          : "rgba(0,0,0,0.04)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Camera
                        size={22}
                        color={verifyMethod === "screenshot" ? C.coral : C.textSecondary}
                        strokeWidth={2}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: FONTS.semiBold,
                          fontSize: 16,
                          color: verifyMethod === "screenshot" ? C.coral : C.dark,
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
                          backgroundColor: C.coral,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Check size={14} color="#111827" strokeWidth={ICON.strokeWidth} />
                      </View>
                    ) : null}
                  </View>
                </Pressable>
              </Animated.View>

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
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                    style={{
                      borderWidth: 2,
                      borderStyle: "dashed",
                      borderColor: C.coralPressed,
                      borderRadius: RADIUS.lg,
                      paddingVertical: 28,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "rgba(224,106,78,0.04)",
                      marginBottom: 16,
                    }}
                  >
                    <Upload size={28} color={C.coral} strokeWidth={ICON.strokeWidth} />
                    <Text
                      style={{
                        fontFamily: FONTS.semiBold,
                        fontSize: 15,
                        color: C.coral,
                        marginTop: 10,
                      }}
                    >
                      Ladda upp bekräftelse
                    </Text>
                    <Text
                      style={{
                        fontFamily: FONTS.regular,
                        fontSize: 12,
                        color: C.textTertiary,
                        marginTop: 4,
                      }}
                    >
                      JPG, PNG eller PDF
                    </Text>
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
                      "Restaurangens namn",
                      "Datum och tid",
                      "Antal gäster",
                      "Bokningsbekräftelsenummer",
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
          backgroundColor: "rgba(250, 248, 245, 0.97)",
          borderTopWidth: 0.5,
          borderTopColor: "rgba(0,0,0,0.04)",
        }}
      >
        {submissionError ? (
          <View
            style={{
              backgroundColor: C.coralLight,
              borderRadius: RADIUS.sm,
              padding: 10,
              marginBottom: 10,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertCircle size={14} color={C.coral} strokeWidth={2} />
            <Text style={{ fontFamily: FONTS.medium, fontSize: 12, color: C.coral, flex: 1 }}>
              {submissionError}
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
              buttonScale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
            }}
            onPressOut={() => {
              buttonScale.value = withSpring(1, { damping: 10, stiffness: 200 });
            }}
            onPress={handleNext}
            style={{ flex: 1, opacity: (step === 0 && !selectedRestaurant) ? 0.5 : 1 }}
          >
            <Animated.View
              style={[
                buttonStyle,
                {
                  backgroundColor: canAdvance() ? C.coral : C.coralPressed,
                  borderRadius: 26,
                  paddingVertical: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  shadowColor: canAdvance() ? C.coral : "transparent",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: canAdvance() ? 0.25 : 0,
                  shadowRadius: 8,
                  elevation: canAdvance() ? 4 : 0,
                },
              ]}
            >
              {submitReservationMutation.isPending ? (
                <ActivityIndicator size="small" color="#111827" />
              ) : (
                <>
                  <Text
                    style={{
                      fontFamily: FONTS.bold,
                      fontSize: 15,
                      color: "#111827",
                    }}
                  >
                    {NEXT_LABELS[step]}
                  </Text>
                  {step < 5 ? (
                    <ChevronRight
                      size={18}
                      color="#111827"
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
            entering={FadeInDown.springify().damping(18).stiffness(200)}
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

            {/* Info text */}
            <Text
              style={{
                fontFamily: FONTS.regular,
                fontSize: 13,
                color: C.textSecondary,
                textAlign: "center",
                marginBottom: 20,
              }}
            >
              Du får 2 credits när någon tar över din bokning
            </Text>

            {/* Confirm CTA */}
            <Pressable
              testID="confirm-submit-btn"
              accessibilityLabel="Bekräfta och lägg upp bokning"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                handleActualSubmit();
              }}
              style={{
                backgroundColor: C.coral,
                borderRadius: RADIUS.full,
                paddingVertical: 16,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: C.coral,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              {submitReservationMutation.isPending ? (
                <ActivityIndicator size="small" color="#111827" />
              ) : (
                <Text style={{ fontFamily: FONTS.bold, fontSize: 15, color: "#111827" }}>
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
    </View>
  );
}
