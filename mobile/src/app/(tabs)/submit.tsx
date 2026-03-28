import React, { useState, useCallback, useEffect } from "react";
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
  Alert,
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
  DollarSign,
  ShieldCheck,
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

export default function SubmitScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const [step, setStep] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [location, setLocation] = useState<"indoor" | "outdoor" | null>(null);
  const [locationDetail, setLocationDetail] = useState<string>("");
  const [bookingDate, setBookingDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(18, 0, 0, 0);
    return d;
  });
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [partySize, setPartySize] = useState<number>(2);
  const [hasCancelFee, setHasCancelFee] = useState<boolean>(false);
  const [cancelFeeAmount, setCancelFeeAmount] = useState<string>("");
  const [hasPrepaidFee, setHasPrepaidFee] = useState<boolean>(false);
  const [prepaidFeeAmount, setPrepaidFeeAmount] = useState<string>("");
  const [otherInfo, setOtherInfo] = useState<string>("");
  const [verifyMethod, setVerifyMethod] = useState<"link" | "screenshot" | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const buttonScale = useSharedValue(1);
  const progressAnim = useSharedValue((0 + 1) / STEP_LABELS.length);

  const phone = useAuthStore((s) => s.phoneNumber);
  const { data: restaurants = [], isLoading: restaurantsLoading } = useRestaurants();
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
      setFirstName(profile.firstName);
    }
    if (profile?.lastName && !lastName) {
      setLastName(profile.lastName);
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

  const handleNext = async () => {
    if (step < 5) {
      setStep(step + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      // Submit to API
      if (!selectedRestaurant || !phone) {
        setSubmitted(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      }
      setSubmissionError(null);
      const dateOnly = bookingDate.toISOString().split("T")[0];
      const timeOnly = bookingDate.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
      const seatType = location === "indoor" ? "Inomhus" : location === "outdoor" ? "Utomhus" : "Inomhus";
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
          verificationLink: verifyMethod === "link" ? otherInfo || undefined : undefined,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSubmitted(true);
      } catch (err: any) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setSubmissionError(err?.message ?? "Något gick fel. Försök igen.");
      }
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
    setSelectedRestaurant(null);
    setLocation(null);
    setLocationDetail("");
    setBookingDate(() => {
      const d = new Date();
      d.setHours(18, 0, 0, 0);
      return d;
    });
    setFirstName("");
    setLastName("");
    setPartySize(2);
    setHasCancelFee(false);
    setCancelFeeAmount("");
    setHasPrepaidFee(false);
    setPrepaidFeeAmount("");
    setOtherInfo("");
    setVerifyMethod(null);
  };

  if (submitted) {
    return (
      <View style={{ flex: 1, backgroundColor: "#FAFAF8" }}>
        <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1 }}>
          <View className="flex-1 items-center justify-center px-8">
            <Animated.View entering={FadeInDown.duration(600).springify()}>
              <View
                className="items-center justify-center"
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: "rgba(139, 158, 126, 0.12)",
                  alignSelf: "center",
                  marginBottom: 24,
                }}
              >
                <Check size={36} color="#8B9E7E" strokeWidth={2.5} />
              </View>
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_700Bold",
                  fontSize: 26,
                  color: "#111827",
                  textAlign: "center",
                  letterSpacing: -0.5,
                }}
              >
                Bokning Upplagd
              </Text>
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_400Regular",
                  fontSize: 15,
                  color: "#9CA3AF",
                  textAlign: "center",
                  marginTop: 10,
                  lineHeight: 22,
                  paddingHorizontal: 16,
                }}
              >
                {selectedRestaurant?.name} är nu listad på Reslot.{"\n"}Du tjänar 2 tokens när någon tar över den.
              </Text>
              <Pressable
                testID="submit-another-button"
                onPress={resetForm}
                className="mt-8 items-center rounded-full py-4 px-8"
                style={{ backgroundColor: "#111827", alignSelf: "center" }}
              >
                <Text
                  style={{
                    fontFamily: "PlusJakartaSans_600SemiBold",
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
    <View style={{ flex: 1, backgroundColor: "#FAFAF8" }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#FAFAF8" }}>
        <View className="px-5 pt-2 pb-1">
          <Text
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              fontSize: 28,
              color: "#111827",
              letterSpacing: -0.8,
            }}
          >
            Lägg upp bokning
          </Text>
          <Text
            style={{
              fontFamily: "PlusJakartaSans_400Regular",
              fontSize: 14,
              color: "#9CA3AF",
              marginTop: 3,
            }}
          >
            {STEP_SUBTITLES[step]}
          </Text>
        </View>

        {/* Animated progress bar */}
        <View className="px-5 pt-3 pb-2">
          <View
            style={{
              height: 2,
              backgroundColor: "rgba(0,0,0,0.06)",
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <Animated.View
              style={[
                progressBarStyle,
                { height: 2, backgroundColor: "#E06A4E", borderRadius: 2 },
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
                fontFamily: "PlusJakartaSans_600SemiBold",
                fontSize: 11,
                color: "#E06A4E",
              }}
            >
              {STEP_LABELS[step]}
            </Text>
            <Text
              style={{
                fontFamily: "PlusJakartaSans_400Regular",
                fontSize: 11,
                color: "#9CA3AF",
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
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 160,
          }}
        >
          {/* Step 0: Restaurant */}
          {step === 0 ? (
            <Animated.View entering={FadeInRight.duration(400)}>
              {/* Search input */}
              <View
                className="flex-row items-center"
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  borderWidth: 1,
                  borderColor: searchQuery.length > 0 ? "rgba(224, 106, 78, 0.3)" : "rgba(0,0,0,0.06)",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.03,
                  shadowRadius: 6,
                  elevation: 1,
                }}
              >
                <Search size={18} color="#9CA3AF" strokeWidth={2} />
                <TextInput
                  testID="restaurant-search-input"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Sök restaurang..."
                  placeholderTextColor="#D1D5DB"
                  style={{
                    fontFamily: "PlusJakartaSans_400Regular",
                    fontSize: 16,
                    color: "#111827",
                    flex: 1,
                    paddingVertical: 16,
                    marginLeft: 10,
                  }}
                />
              </View>

              {/* Restaurant list */}
              <View style={{ marginTop: 12, gap: 6 }}>
                {filteredRestaurants.map((restaurant: Restaurant) => {
                  const isSelected = selectedRestaurant?.id === restaurant.id;
                  return (
                    <Pressable
                      key={restaurant.id}
                      testID={`restaurant-${restaurant.name.toLowerCase().replace(/\s/g, "-")}`}
                      onPress={() => {
                        setSelectedRestaurant(restaurant);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      style={{
                        backgroundColor: isSelected ? "rgba(224, 106, 78, 0.06)" : "#FFFFFF",
                        borderRadius: 14,
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        borderWidth: 1.5,
                        borderColor: isSelected ? "#E06A4E" : "rgba(0,0,0,0.05)",
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontFamily: isSelected
                              ? "PlusJakartaSans_600SemiBold"
                              : "PlusJakartaSans_500Medium",
                            fontSize: 15,
                            color: isSelected ? "#E06A4E" : "#111827",
                          }}
                        >
                          {restaurant.name}
                        </Text>
                        <View className="flex-row items-center" style={{ marginTop: 3, gap: 4 }}>
                          <MapPin size={12} color="#9CA3AF" strokeWidth={2} />
                          <Text
                            style={{
                              fontFamily: "PlusJakartaSans_400Regular",
                              fontSize: 12,
                              color: "#9CA3AF",
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
                            backgroundColor: "#E06A4E",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Check size={14} color="#FFFFFF" strokeWidth={3} />
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>
          ) : null}

          {/* Step 1: Location */}
          {step === 1 ? (
            <Animated.View entering={FadeInRight.duration(400)}>
              <View className="flex-row" style={{ gap: 12 }}>
                <Pressable
                  testID="location-indoor"
                  onPress={() => {
                    setLocation("indoor");
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 22,
                    borderRadius: 16,
                    backgroundColor: location === "indoor" ? "rgba(224, 106, 78, 0.06)" : "#FFFFFF",
                    borderWidth: 1.5,
                    borderColor: location === "indoor" ? "#E06A4E" : "rgba(0,0,0,0.05)",
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.03,
                    shadowRadius: 6,
                    elevation: 1,
                  }}
                >
                  <Armchair
                    size={30}
                    color={location === "indoor" ? "#E06A4E" : "#9CA3AF"}
                    strokeWidth={1.5}
                    style={{ marginBottom: 8 }}
                  />
                  <Text
                    style={{
                      fontFamily: location === "indoor"
                        ? "PlusJakartaSans_700Bold"
                        : "PlusJakartaSans_600SemiBold",
                      fontSize: 16,
                      color: location === "indoor" ? "#E06A4E" : "#111827",
                    }}
                  >
                    Inomhus
                  </Text>
                </Pressable>

                <Pressable
                  testID="location-outdoor"
                  onPress={() => {
                    setLocation("outdoor");
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 22,
                    borderRadius: 16,
                    backgroundColor: location === "outdoor" ? "rgba(224, 106, 78, 0.06)" : "#FFFFFF",
                    borderWidth: 1.5,
                    borderColor: location === "outdoor" ? "#E06A4E" : "rgba(0,0,0,0.05)",
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.03,
                    shadowRadius: 6,
                    elevation: 1,
                  }}
                >
                  <Trees
                    size={30}
                    color={location === "outdoor" ? "#E06A4E" : "#9CA3AF"}
                    strokeWidth={1.5}
                    style={{ marginBottom: 8 }}
                  />
                  <Text
                    style={{
                      fontFamily: location === "outdoor"
                        ? "PlusJakartaSans_700Bold"
                        : "PlusJakartaSans_600SemiBold",
                      fontSize: 16,
                      color: location === "outdoor" ? "#E06A4E" : "#111827",
                    }}
                  >
                    Utomhus
                  </Text>
                </Pressable>
              </View>

              <View style={{ marginTop: 20 }}>
                <Text
                  style={{
                    fontFamily: "PlusJakartaSans_500Medium",
                    fontSize: 13,
                    color: "#6B7280",
                    marginBottom: 8,
                  }}
                >
                  Specifik plats (valfritt)
                </Text>
                <TextInput
                  testID="location-detail-input"
                  value={locationDetail}
                  onChangeText={setLocationDetail}
                  placeholder="T.ex. Terrass, Bar, Chefens bord..."
                  placeholderTextColor="#D1D5DB"
                  style={{
                    fontFamily: "PlusJakartaSans_400Regular",
                    fontSize: 15,
                    color: "#111827",
                    backgroundColor: "#FFFFFF",
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                    borderWidth: 1,
                    borderColor: "rgba(0,0,0,0.06)",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.03,
                    shadowRadius: 6,
                    elevation: 1,
                  }}
                />
              </View>
            </Animated.View>
          ) : null}

          {/* Step 2: When */}
          {step === 2 ? (
            <Animated.View entering={FadeInRight.duration(400)}>
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_600SemiBold",
                  fontSize: 16,
                  color: "#111827",
                  marginBottom: 16,
                  letterSpacing: -0.2,
                }}
              >
                När är bokningen?
              </Text>

              {/* Native date picker */}
              <View
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: "rgba(0,0,0,0.06)",
                  overflow: "hidden",
                  marginBottom: 14,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.04,
                  shadowRadius: 12,
                }}
              >
                <View style={{ paddingHorizontal: 4, paddingTop: 4, paddingBottom: 4 }}>
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_500Medium",
                      fontSize: 12,
                      color: "#9CA3AF",
                      letterSpacing: 0.4,
                      textTransform: "uppercase",
                      paddingHorizontal: 16,
                      paddingTop: 12,
                      paddingBottom: 4,
                    }}
                  >
                    Datum
                  </Text>
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
                      setBookingDate(next);
                    }}
                    style={{ width: "100%" }}
                  />
                </View>
              </View>

              {/* Native time picker */}
              <View
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: "rgba(0,0,0,0.06)",
                  overflow: "hidden",
                  marginBottom: 20,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.04,
                  shadowRadius: 12,
                }}
              >
                <View style={{ paddingHorizontal: 4, paddingTop: 4, paddingBottom: 4 }}>
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_500Medium",
                      fontSize: 12,
                      color: "#9CA3AF",
                      letterSpacing: 0.4,
                      textTransform: "uppercase",
                      paddingHorizontal: 16,
                      paddingTop: 12,
                      paddingBottom: 4,
                    }}
                  >
                    Tid
                  </Text>
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
                      setBookingDate(next);
                    }}
                    style={{ width: "100%" }}
                  />
                </View>
              </View>

              {/* Helper hint */}
              <View
                className="rounded-xl p-4"
                style={{ backgroundColor: "rgba(139, 158, 126, 0.08)" }}
              >
                <View className="flex-row items-center" style={{ gap: 6 }}>
                  <Sparkles size={14} color="#8B9E7E" strokeWidth={2} />
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_500Medium",
                      fontSize: 13,
                      color: "#8B9E7E",
                      flex: 1,
                    }}
                  >
                    Se till att datum och tid matchar exakt det som står på din bokning.
                  </Text>
                </View>
              </View>
            </Animated.View>
          ) : null}

          {/* Step 3: Who */}
          {step === 3 ? (
            <Animated.View entering={FadeInRight.duration(400)}>
              <View className="mb-5">
                <View className="flex-row items-center mb-3" style={{ gap: 8 }}>
                  <User size={18} color="#E06A4E" strokeWidth={2} />
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_600SemiBold",
                      fontSize: 16,
                      color: "#111827",
                    }}
                  >
                    Förnamn
                  </Text>
                </View>
                <TextInput
                  testID="first-name-input"
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Ditt förnamn"
                  placeholderTextColor="#D1D5DB"
                  style={{
                    fontFamily: "PlusJakartaSans_400Regular",
                    fontSize: 16,
                    color: "#111827",
                    backgroundColor: "#FFFFFF",
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                    borderWidth: 1,
                    borderColor: firstName.length > 0 ? "rgba(224, 106, 78, 0.3)" : "rgba(0,0,0,0.06)",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.03,
                    shadowRadius: 6,
                    elevation: 1,
                  }}
                />
              </View>

              <View className="mb-5">
                <View className="flex-row items-center mb-3" style={{ gap: 8 }}>
                  <User size={18} color="#E06A4E" strokeWidth={2} />
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_600SemiBold",
                      fontSize: 16,
                      color: "#111827",
                    }}
                  >
                    Efternamn
                  </Text>
                </View>
                <TextInput
                  testID="last-name-input"
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Ditt efternamn"
                  placeholderTextColor="#D1D5DB"
                  style={{
                    fontFamily: "PlusJakartaSans_400Regular",
                    fontSize: 16,
                    color: "#111827",
                    backgroundColor: "#FFFFFF",
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                    borderWidth: 1,
                    borderColor: lastName.length > 0 ? "rgba(224, 106, 78, 0.3)" : "rgba(0,0,0,0.06)",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.03,
                    shadowRadius: 6,
                    elevation: 1,
                  }}
                />
              </View>

              <View
                className="rounded-xl p-4 mb-6"
                style={{ backgroundColor: "rgba(201, 169, 110, 0.08)" }}
              >
                <Text
                  style={{
                    fontFamily: "PlusJakartaSans_400Regular",
                    fontSize: 13,
                    color: "#C9A96E",
                    lineHeight: 19,
                  }}
                >
                  Ditt namn delas bara med den som tar över bokningen.
                </Text>
              </View>

              <View style={{ paddingBottom: 16 }}>
                <View className="flex-row items-center mb-3" style={{ gap: 8 }}>
                  <Users size={18} color="#E06A4E" strokeWidth={2} />
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_600SemiBold",
                      fontSize: 16,
                      color: "#111827",
                    }}
                  >
                    Antal gäster
                  </Text>
                </View>
                <View className="flex-row flex-wrap" style={{ gap: 10, paddingBottom: 4 }}>
                  {PARTY_SIZES.map((size) => (
                    <Pressable
                      key={size}
                      testID={`party-size-${size}`}
                      onPress={() => {
                        setPartySize(size);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 14,
                        backgroundColor: partySize === size ? "#111827" : "#FFFFFF",
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1.5,
                        borderColor: partySize === size ? "#111827" : "rgba(0,0,0,0.06)",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.03,
                        shadowRadius: 6,
                        elevation: 1,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: "PlusJakartaSans_600SemiBold",
                          fontSize: 17,
                          color: partySize === size ? "#FFFFFF" : "#111827",
                        }}
                      >
                        {size}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </Animated.View>
          ) : null}

          {/* Step 4: Fees */}
          {step === 4 ? (
            <Animated.View entering={FadeInRight.duration(400)}>
              {/* Cancel fee */}
              <View
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 14,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1" style={{ gap: 12 }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: "rgba(224, 106, 78, 0.1)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <DollarSign size={20} color="#E06A4E" strokeWidth={2} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: "PlusJakartaSans_600SemiBold",
                          fontSize: 15,
                          color: "#111827",
                        }}
                      >
                        Avbokningsavgift?
                      </Text>
                      <Text
                        style={{
                          fontFamily: "PlusJakartaSans_400Regular",
                          fontSize: 12,
                          color: "#9CA3AF",
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
                      setHasCancelFee(val);
                      if (!val) setCancelFeeAmount("");
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    trackColor={{ false: "#E5E5E0", true: "#E06A4E" }}
                    thumbColor="#FFFFFF"
                  />
                </View>
                {hasCancelFee ? (
                  <TextInput
                    testID="cancel-fee-input"
                    value={cancelFeeAmount}
                    onChangeText={setCancelFeeAmount}
                    placeholder="Belopp i kr (t.ex. 500)"
                    placeholderTextColor="#D1D5DB"
                    keyboardType="numeric"
                    style={{
                      fontFamily: "PlusJakartaSans_400Regular",
                      fontSize: 15,
                      color: "#111827",
                      backgroundColor: "rgba(0,0,0,0.02)",
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 14,
                      marginTop: 14,
                      borderWidth: 1,
                      borderColor: "rgba(0,0,0,0.06)",
                    }}
                  />
                ) : null}
              </View>

              {/* Prepaid fee */}
              <View
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 14,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1" style={{ gap: 12 }}>
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        backgroundColor: "rgba(201, 169, 110, 0.1)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <DollarSign size={20} color="#C9A96E" strokeWidth={2} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: "PlusJakartaSans_600SemiBold",
                          fontSize: 15,
                          color: "#111827",
                        }}
                      >
                        Förbetalda avgifter?
                      </Text>
                      <Text
                        style={{
                          fontFamily: "PlusJakartaSans_400Regular",
                          fontSize: 12,
                          color: "#9CA3AF",
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
                      setHasPrepaidFee(val);
                      if (!val) setPrepaidFeeAmount("");
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    trackColor={{ false: "#E5E5E0", true: "#E06A4E" }}
                    thumbColor="#FFFFFF"
                  />
                </View>
                {hasPrepaidFee ? (
                  <TextInput
                    testID="prepaid-fee-input"
                    value={prepaidFeeAmount}
                    onChangeText={setPrepaidFeeAmount}
                    placeholder="Belopp i kr (t.ex. 1200)"
                    placeholderTextColor="#D1D5DB"
                    keyboardType="numeric"
                    style={{
                      fontFamily: "PlusJakartaSans_400Regular",
                      fontSize: 15,
                      color: "#111827",
                      backgroundColor: "rgba(0,0,0,0.02)",
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 14,
                      marginTop: 14,
                      borderWidth: 1,
                      borderColor: "rgba(0,0,0,0.06)",
                    }}
                  />
                ) : null}
              </View>

              {/* Other info */}
              <View style={{ marginTop: 6 }}>
                <Text
                  style={{
                    fontFamily: "PlusJakartaSans_600SemiBold",
                    fontSize: 15,
                    color: "#111827",
                    marginBottom: 8,
                  }}
                >
                  Övrig information
                </Text>
                <TextInput
                  testID="other-info-input"
                  value={otherInfo}
                  onChangeText={setOtherInfo}
                  placeholder="Något annat den som tar över bör veta..."
                  placeholderTextColor="#D1D5DB"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  style={{
                    fontFamily: "PlusJakartaSans_400Regular",
                    fontSize: 15,
                    color: "#111827",
                    backgroundColor: "#FFFFFF",
                    borderRadius: 14,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    minHeight: 100,
                    borderWidth: 1,
                    borderColor: "rgba(0,0,0,0.06)",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.03,
                    shadowRadius: 6,
                    elevation: 1,
                  }}
                />
              </View>
            </Animated.View>
          ) : null}

          {/* Step 5: Verify */}
          {step === 5 ? (
            <Animated.View entering={FadeInRight.duration(400)}>
              {/* Booking summary */}
              <View
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 20,
                  borderWidth: 1,
                  borderColor: "rgba(0,0,0,0.06)",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                <Text
                  style={{
                    fontFamily: "PlusJakartaSans_600SemiBold",
                    fontSize: 13,
                    color: "#9CA3AF",
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                    marginBottom: 12,
                  }}
                >
                  Sammanfattning
                </Text>
                <View style={{ gap: 8 }}>
                  <View className="flex-row items-center" style={{ gap: 10 }}>
                    <CalendarDays size={15} color="#E06A4E" strokeWidth={2} />
                    <Text
                      style={{
                        fontFamily: "PlusJakartaSans_500Medium",
                        fontSize: 14,
                        color: "#111827",
                      }}
                    >
                      {bookingDate.toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" })}
                    </Text>
                  </View>
                  <View className="flex-row items-center" style={{ gap: 10 }}>
                    <Clock size={15} color="#E06A4E" strokeWidth={2} />
                    <Text
                      style={{
                        fontFamily: "PlusJakartaSans_500Medium",
                        fontSize: 14,
                        color: "#111827",
                      }}
                    >
                      {bookingDate.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Invitation link option */}
              <Pressable
                testID="verify-link"
                onPress={() => {
                  setVerifyMethod("link");
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={{
                  backgroundColor: verifyMethod === "link" ? "rgba(224, 106, 78, 0.06)" : "#FFFFFF",
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 12,
                  borderWidth: 1.5,
                  borderColor: verifyMethod === "link" ? "#E06A4E" : "rgba(0,0,0,0.05)",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                <View className="flex-row items-center" style={{ gap: 14 }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      backgroundColor: verifyMethod === "link"
                        ? "rgba(224, 106, 78, 0.12)"
                        : "rgba(0,0,0,0.04)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Link
                      size={22}
                      color={verifyMethod === "link" ? "#E06A4E" : "#6B7280"}
                      strokeWidth={2}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: "PlusJakartaSans_600SemiBold",
                        fontSize: 16,
                        color: verifyMethod === "link" ? "#E06A4E" : "#111827",
                      }}
                    >
                      Inbjudningslänk
                    </Text>
                    <Text
                      style={{
                        fontFamily: "PlusJakartaSans_400Regular",
                        fontSize: 13,
                        color: "#9CA3AF",
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
                        backgroundColor: "#E06A4E",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Check size={14} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  ) : null}
                </View>
              </Pressable>

              {/* Screenshot option */}
              <Pressable
                testID="verify-screenshot"
                onPress={() => {
                  setVerifyMethod("screenshot");
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={{
                  backgroundColor: verifyMethod === "screenshot" ? "rgba(224, 106, 78, 0.06)" : "#FFFFFF",
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 16,
                  borderWidth: 1.5,
                  borderColor: verifyMethod === "screenshot" ? "#E06A4E" : "rgba(0,0,0,0.05)",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                <View className="flex-row items-center" style={{ gap: 14 }}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      backgroundColor: verifyMethod === "screenshot"
                        ? "rgba(224, 106, 78, 0.12)"
                        : "rgba(0,0,0,0.04)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Camera
                      size={22}
                      color={verifyMethod === "screenshot" ? "#E06A4E" : "#6B7280"}
                      strokeWidth={2}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: "PlusJakartaSans_600SemiBold",
                        fontSize: 16,
                        color: verifyMethod === "screenshot" ? "#E06A4E" : "#111827",
                      }}
                    >
                      Skärmdump
                    </Text>
                    <Text
                      style={{
                        fontFamily: "PlusJakartaSans_400Regular",
                        fontSize: 13,
                        color: "#9CA3AF",
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
                        backgroundColor: "#E06A4E",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Check size={14} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  ) : null}
                </View>
              </Pressable>

              {/* Screenshot upload area */}
              {verifyMethod === "screenshot" ? (
                <Animated.View entering={FadeInDown.duration(300)}>
                  <Pressable
                    testID="upload-screenshot-button"
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                    style={{
                      borderWidth: 2,
                      borderStyle: "dashed",
                      borderColor: "rgba(224, 106, 78, 0.3)",
                      borderRadius: 16,
                      paddingVertical: 28,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "rgba(224, 106, 78, 0.03)",
                      marginBottom: 16,
                    }}
                  >
                    <Upload size={28} color="#E06A4E" strokeWidth={1.5} />
                    <Text
                      style={{
                        fontFamily: "PlusJakartaSans_600SemiBold",
                        fontSize: 15,
                        color: "#E06A4E",
                        marginTop: 10,
                      }}
                    >
                      Ladda upp bekräftelse
                    </Text>
                    <Text
                      style={{
                        fontFamily: "PlusJakartaSans_400Regular",
                        fontSize: 12,
                        color: "#9CA3AF",
                        marginTop: 4,
                      }}
                    >
                      JPG, PNG eller PDF
                    </Text>
                  </Pressable>

                  <View
                    style={{
                      backgroundColor: "rgba(139, 158, 126, 0.08)",
                      borderRadius: 12,
                      padding: 16,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "PlusJakartaSans_600SemiBold",
                        fontSize: 13,
                        color: "#8B9E7E",
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
                        <CheckCircle2 size={14} color="#8B9E7E" strokeWidth={2} />
                        <Text
                          style={{
                            fontFamily: "PlusJakartaSans_400Regular",
                            fontSize: 13,
                            color: "#6B7280",
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
          paddingHorizontal: 20,
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
              backgroundColor: "rgba(224,106,78,0.08)",
              borderRadius: 10,
              padding: 10,
              marginBottom: 10,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertCircle size={14} color="#E06A4E" strokeWidth={2} />
            <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 12, color: "#E06A4E", flex: 1 }}>
              {submissionError}
            </Text>
          </View>
        ) : null}
        <View className="flex-row items-center" style={{ gap: 12 }}>
          {step > 0 ? (
            <Pressable
              testID="back-button"
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
              <ChevronLeft size={22} color="#6B7280" strokeWidth={2} />
            </Pressable>
          ) : null}

          <Pressable
            testID="next-button"
            disabled={!canAdvance() || submitReservationMutation.isPending}
            onPressIn={() => {
              buttonScale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
            }}
            onPressOut={() => {
              buttonScale.value = withSpring(1, { damping: 10, stiffness: 200 });
            }}
            onPress={handleNext}
            style={{ flex: 1 }}
          >
            <Animated.View
              style={[
                buttonStyle,
                {
                  backgroundColor: canAdvance() ? "#E06A4E" : "rgba(224, 106, 78, 0.3)",
                  borderRadius: 26,
                  paddingVertical: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  shadowColor: canAdvance() ? "#E06A4E" : "transparent",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: canAdvance() ? 0.25 : 0,
                  shadowRadius: 8,
                  elevation: canAdvance() ? 4 : 0,
                },
              ]}
            >
              {submitReservationMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_700Bold",
                      fontSize: 15,
                      color: "#FFFFFF",
                    }}
                  >
                    {NEXT_LABELS[step]}
                  </Text>
                  {step < 5 ? (
                    <ChevronRight
                      size={18}
                      color="#FFFFFF"
                      strokeWidth={2.5}
                      style={{ marginLeft: 4 }}
                    />
                  ) : null}
                </>
              )}
            </Animated.View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
