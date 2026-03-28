import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Star,
  Clock,
  Users,
  Coins,
  Search,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Check,
  Calendar,
  AlertCircle,
  HelpCircle,
} from "lucide-react-native";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useReservations, useProfile } from "@/lib/api/hooks";
import { useAuthStore } from "@/lib/auth-store";
import type { Restaurant, Reservation } from "@/lib/api/types";
import { parseTags } from "@/lib/api/types";

// --- Day Picker Data ---
const DAY_NAMES = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

function generateDays(): { label: string; date: number; fullDate: Date; isToday: boolean }[] {
  const today = new Date();
  const days: { label: string; date: number; fullDate: Date; isToday: boolean }[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dayOfWeek = d.getDay();
    const mapped = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    days.push({
      label: DAY_NAMES[mapped],
      date: d.getDate(),
      fullDate: new Date(d),
      isToday: i === 0,
    });
  }
  return days;
}

const DAYS = generateDays();

const CITIES = ["Stockholm", "Göteborg", "Malmö", "Uppsala"];

// --- Header ---
function Header({
  selectedCity,
  onCityPress,
  onFAQPress,
  onCreditsPress,
  tokens,
  isLoading,
}: {
  selectedCity: string;
  onCityPress: () => void;
  onFAQPress: () => void;
  onCreditsPress: () => void;
  tokens: number;
  isLoading?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between px-5 pt-2 pb-1">
      <Pressable
        testID="faq-button"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onFAQPress();
        }}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: "rgba(0,0,0,0.04)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <HelpCircle size={20} color="#9CA3AF" strokeWidth={2} />
      </Pressable>

      <Pressable
        testID="city-picker-button"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onCityPress();
        }}
        style={{ flexDirection: "row", alignItems: "center" }}
      >
        <Text
          style={{
            fontFamily: "PlusJakartaSans_700Bold",
            fontSize: 17,
            color: "#111827",
            letterSpacing: -0.3,
          }}
        >
          Bokningar i{" "}
        </Text>
        <Text
          style={{
            fontFamily: "PlusJakartaSans_700Bold",
            fontSize: 17,
            color: "#E06A4E",
            letterSpacing: -0.3,
            opacity: 0.9,
          }}
        >
          {selectedCity}
        </Text>
        <ChevronDown size={14} color="#E06A4E" strokeWidth={2.5} style={{ marginLeft: 2 }} />
      </Pressable>

      <View className="flex-row items-center" style={{ gap: 8 }}>
        <Pressable
          testID="token-pill"
          className="flex-row items-center rounded-full px-3 py-1.5"
          style={{ backgroundColor: "rgba(201, 169, 110, 0.1)" }}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onCreditsPress();
          }}
        >
          <Coins size={14} color="#C9A96E" strokeWidth={2.2} />
          <Text
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              fontSize: 13,
              color: "#C9A96E",
              marginLeft: 4,
            }}
          >
            {isLoading ? "..." : tokens}
          </Text>
        </Pressable>
        <Pressable
          testID="search-button"
          onPress={() =>
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          }
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "rgba(0,0,0,0.04)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Search size={18} color="#9CA3AF" strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  );
}

const CITY_NEIGHBORHOODS: Record<string, string[]> = {
  "Stockholm": ["City", "Östermalm", "Södermalm", "Vasastan", "Gamla stan", "Kungsholmen"],
  "Göteborg": ["Centrum", "Linnéstaden", "Majorna", "Haga", "Järntorget", "Östra Göteborg"],
  "Malmö": ["Centrum", "Möllevången", "Limhamn", "Husie", "Hyllie", "Västra Hamnen"],
};

// --- Day Picker ---
function DayPicker({
  selectedDate,
  onSelect,
  onOpenCalendar,
}: {
  selectedDate: Date;
  onSelect: (date: Date) => void;
  onOpenCalendar: () => void;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 16,
        }}
        style={{ flexGrow: 1, flexShrink: 1 }}
      >
        {DAYS.map((day, index) => {
          const isSelected = selectedDate.toDateString() === day.fullDate.toDateString();
          return (
            <Pressable
              key={`${day.label}-${day.date}`}
              testID={`day-picker-${index}`}
              onPress={() => {
                onSelect(day.fullDate);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={{
                alignItems: "center",
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 14,
                marginRight: 6,
                backgroundColor: isSelected
                  ? "#E06A4E"
                  : "transparent",
                minWidth: 52,
              }}
            >
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_500Medium",
                  fontSize: 11,
                  color: isSelected ? "rgba(255,255,255,0.8)" : "#9CA3AF",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {day.label}
              </Text>
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_700Bold",
                  fontSize: 18,
                  color: isSelected ? "#FFFFFF" : "#111827",
                  marginTop: 2,
                }}
              >
                {day.date}
              </Text>
              {day.isToday && !isSelected ? (
                <View
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: "#E06A4E",
                    marginTop: 4,
                  }}
                />
              ) : (
                <View style={{ width: 4, height: 4, marginTop: 4 }} />
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Calendar button */}
      <Pressable
        onPress={onOpenCalendar}
        testID="open-calendar-button"
        style={{
          marginRight: 16,
          marginLeft: 4,
          width: 30,
          height: 30,
          borderRadius: 15,
          backgroundColor: "#FFFFFF",
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.10)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Calendar size={14} color="#4B5563" strokeWidth={2} />
      </Pressable>
    </View>
  );
}

// --- Neighbourhood Filter Chips ---
function FilterChips({
  active,
  onSelect,
  city,
}: {
  active: string;
  onSelect: (filter: string) => void;
  city: string;
}) {
  const neighborhoods = CITY_NEIGHBORHOODS[city];

  if (!neighborhoods) return null;

  const allFilters = ["Alla", ...neighborhoods];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingLeft: 20, paddingRight: 20, paddingVertical: 6, alignItems: "center" }}
      style={{ flexGrow: 0 }}
    >
      {allFilters.map((filter: string) => {
        const isActive = active === filter;
        return (
          <Pressable
            key={filter}
            testID={`filter-${filter}`}
            onPress={() => {
              onSelect(filter);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={{
              marginRight: 8,
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 7,
              backgroundColor: isActive ? "#111827" : "#FFFFFF",
              borderWidth: isActive ? 0 : 1,
              borderColor: "rgba(0,0,0,0.10)",
            }}
          >
            <Text
              style={{
                fontFamily: isActive ? "PlusJakartaSans_600SemiBold" : "PlusJakartaSans_500Medium",
                fontSize: 13,
                color: isActive ? "#FFFFFF" : "#4B5563",
              }}
            >
              {filter}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// --- Restaurant Row ---
function RestaurantRow({
  reservation,
  index,
  isLast,
}: {
  reservation: Reservation;
  index: number;
  isLast: boolean;
}) {
  const scale = useSharedValue(1);
  const router = useRouter();
  const restaurant = reservation.restaurant;

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  }, [scale]);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/restaurant/${reservation.id}`);
  }, [router, reservation.id]);

  const formatTime = (timeStr: string) => {
    try {
      return timeStr.substring(0, 5);
    } catch {
      return timeStr;
    }
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50)
        .duration(400)
        .springify()}
    >
      <Pressable
        testID={`restaurant-row-${restaurant.id}`}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
      >
        <Animated.View
          style={[
            animStyle,
            {
              paddingHorizontal: 20,
              paddingVertical: 14,
            },
          ]}
        >
          <View className="flex-row">
            {/* Left content */}
            <View style={{ flex: 1, marginRight: 14 }}>
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <Text
                  style={{
                    fontFamily: "PlusJakartaSans_600SemiBold",
                    fontSize: 16,
                    color: "#111827",
                    letterSpacing: -0.2,
                  }}
                  numberOfLines={1}
                >
                  {restaurant.name}
                </Text>
              </View>

              <Text
                style={{
                  fontFamily: "PlusJakartaSans_400Regular",
                  fontSize: 13,
                  color: "#9CA3AF",
                  marginTop: 3,
                }}
                numberOfLines={1}
              >
                {restaurant.address}
              </Text>

              <View
                className="flex-row items-center"
                style={{ marginTop: 6, gap: 4 }}
              >
                <Star
                  size={12}
                  color="#C9A96E"
                  fill="#C9A96E"
                  strokeWidth={0}
                />
                <Text
                  style={{
                    fontFamily: "PlusJakartaSans_600SemiBold",
                    fontSize: 12,
                    color: "#111827",
                  }}
                >
                  {restaurant.rating.toFixed(1)}
                </Text>
                <Text
                  style={{
                    fontFamily: "PlusJakartaSans_400Regular",
                    fontSize: 12,
                    color: "#9CA3AF",
                    marginLeft: 2,
                  }}
                >
                  ({restaurant.reviewCount})
                </Text>
                <View
                  style={{
                    width: 3,
                    height: 3,
                    borderRadius: 1.5,
                    backgroundColor: "#D1D5DB",
                    marginHorizontal: 6,
                  }}
                />
                <Text
                  style={{
                    fontFamily: "PlusJakartaSans_400Regular",
                    fontSize: 12,
                    color: "#9CA3AF",
                  }}
                >
                  {restaurant.cuisine}
                </Text>
              </View>

              <View
                className="flex-row items-center"
                style={{ marginTop: 8, gap: 14 }}
              >
                <View className="flex-row items-center" style={{ gap: 4 }}>
                  <Clock size={13} color="#9CA3AF" strokeWidth={1.8} />
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_500Medium",
                      fontSize: 13,
                      color: "#6B7280",
                    }}
                  >
                    {formatTime(reservation.reservationTime)}
                  </Text>
                </View>
                <View className="flex-row items-center" style={{ gap: 4 }}>
                  <Users size={13} color="#9CA3AF" strokeWidth={1.8} />
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_500Medium",
                      fontSize: 13,
                      color: "#6B7280",
                    }}
                  >
                    {reservation.partySize} gäster
                  </Text>
                </View>
              </View>
            </View>

            {/* Right thumbnail */}
            <Image
              source={{ uri: restaurant.image }}
              style={{
                width: 80,
                height: 80,
                borderRadius: 12,
                backgroundColor: "#F0F0EE",
              }}
              resizeMode="cover"
            />
          </View>
        </Animated.View>
      </Pressable>

      {!isLast ? (
        <View
          style={{
            height: 0.5,
            backgroundColor: "rgba(0,0,0,0.06)",
            marginLeft: 20,
            marginRight: 20,
          }}
        />
      ) : null}
    </Animated.View>
  );
}

// --- Rewards Banner ---
function RewardsBanner() {
  const router = useRouter();
  return (
    <Animated.View entering={FadeInDown.delay(200).duration(400).springify()}>
      <Pressable
        testID="credits-banner"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push("/credits");
        }}
        style={{
          marginHorizontal: 20,
          marginVertical: 12,
          backgroundColor: "rgba(201, 169, 110, 0.06)",
          borderRadius: 14,
          borderWidth: 1,
          borderColor: "rgba(201, 169, 110, 0.12)",
          padding: 16,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center" style={{ flex: 1, gap: 10 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: "rgba(201, 169, 110, 0.12)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Coins size={18} color="#C9A96E" strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_600SemiBold",
                  fontSize: 14,
                  color: "#111827",
                  letterSpacing: -0.1,
                }}
              >
                Reslot credits
              </Text>
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_400Regular",
                  fontSize: 12,
                  color: "#9CA3AF",
                  marginTop: 2,
                  lineHeight: 16,
                }}
                numberOfLines={2}
              >
                Lägg upp bokningar och tjäna credits. Utforska nu
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color="#C9A96E" strokeWidth={2} style={{ marginLeft: 8 }} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

// --- Calendar Modal ---
const MONTH_NAMES = ["Januari","Februari","Mars","April","Maj","Juni","Juli","Augusti","September","Oktober","November","December"];
const DAY_SHORT = ["Mån","Tis","Ons","Tor","Fre","Lör","Sön"];

function CalendarModal({
  visible,
  selectedDate,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selectedDate: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  // Monday-first: Sunday = 6, Monday = 0
  const startOffset = (firstDay.getDay() + 6) % 7;
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push(new Date(viewYear, viewMonth, d));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#FAFAF8" }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8 }}>
          <Pressable onPress={onClose} style={{ padding: 4 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 16, color: "#9CA3AF" }}>Stäng</Text>
          </Pressable>
          <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 17, color: "#111827", letterSpacing: -0.3 }}>Välj datum</Text>
          <View style={{ width: 48 }} />
        </View>

        {/* Month navigation */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingVertical: 16 }}>
          <Pressable onPress={prevMonth} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.05)", alignItems: "center", justifyContent: "center" }}>
            <ChevronLeft size={18} color="#111827" strokeWidth={2} />
          </Pressable>
          <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 18, color: "#111827", letterSpacing: -0.3 }}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </Text>
          <Pressable onPress={nextMonth} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.05)", alignItems: "center", justifyContent: "center" }}>
            <ChevronRight size={18} color="#111827" strokeWidth={2} />
          </Pressable>
        </View>

        {/* Day labels */}
        <View style={{ flexDirection: "row", paddingHorizontal: 16, marginBottom: 8 }}>
          {DAY_SHORT.map(d => (
            <View key={d} style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 11, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5 }}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={{ paddingHorizontal: 16 }}>
          {Array.from({ length: cells.length / 7 }).map((_, row) => (
            <View key={row} style={{ flexDirection: "row", marginBottom: 4 }}>
              {cells.slice(row * 7, row * 7 + 7).map((date, col) => {
                if (!date) return <View key={col} style={{ flex: 1, height: 44 }} />;
                const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const isToday = date.toDateString() === today.toDateString();
                const isSelected = date.toDateString() === selectedDate.toDateString();
                return (
                  <Pressable
                    key={col}
                    onPress={() => {
                      if (!isPast) {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onSelect(date);
                        onClose();
                      }
                    }}
                    style={{ flex: 1, height: 44, alignItems: "center", justifyContent: "center" }}
                  >
                    <View style={{
                      width: 36, height: 36, borderRadius: 18,
                      alignItems: "center", justifyContent: "center",
                      backgroundColor: isSelected ? "#E06A4E" : isToday ? "rgba(224,106,78,0.10)" : "transparent",
                    }}>
                      <Text style={{
                        fontFamily: isSelected ? "PlusJakartaSans_700Bold" : "PlusJakartaSans_500Medium",
                        fontSize: 15,
                        color: isSelected ? "#FFFFFF" : isPast ? "#D1D5DB" : isToday ? "#E06A4E" : "#111827",
                      }}>
                        {date.getDate()}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </Modal>
  );
}

// --- City Picker Modal ---
function CityPickerModal({
  visible,
  selectedCity,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selectedCity: string;
  onSelect: (city: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}
        onPress={onClose}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: "#FAFAF8",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingTop: 12,
            paddingBottom: 40,
          }}
        >
          {/* Grab handle */}
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: "rgba(0,0,0,0.12)",
              alignSelf: "center",
              marginBottom: 16,
            }}
          />
          <Text
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              fontSize: 16,
              color: "#111827",
              letterSpacing: -0.3,
              paddingHorizontal: 20,
              paddingBottom: 12,
            }}
          >
            Välj stad
          </Text>
          {CITIES.map((city, index) => {
            const isSelected = city === selectedCity;
            const isLast = index === CITIES.length - 1;
            return (
              <React.Fragment key={city}>
                <Pressable
                  testID={`city-option-${city}`}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onSelect(city);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingHorizontal: 20,
                    paddingVertical: 16,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_700Bold",
                      fontSize: 16,
                      color: isSelected ? "#E06A4E" : "#111827",
                      letterSpacing: -0.2,
                    }}
                  >
                    {city}
                  </Text>
                  {isSelected ? (
                    <Check size={18} color="#E06A4E" strokeWidth={2.5} />
                  ) : null}
                </Pressable>
                {!isLast ? (
                  <View
                    style={{
                      height: 0.5,
                      backgroundColor: "rgba(0,0,0,0.06)",
                      marginHorizontal: 20,
                    }}
                  />
                ) : null}
              </React.Fragment>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// --- FAQ ---
const FAQ_ITEMS = [
  {
    q: "Hur fungerar Reslot?",
    a: "Reslot är en marknadsplats där du kan köpa och sälja bordsreservationer. Någon som har en bokning de inte kan använda lägger upp den — du tar över den och betalar en liten förmedlingsavgift.",
  },
  {
    q: "Hur lägger jag upp en bokning?",
    a: "Gå till 'Lägg upp'-fliken, välj restaurang, datum och tid, fyll i dina uppgifter och verifiera bokningen med en länk eller skärmbild. Enkelt som det.",
  },
  {
    q: "Hur fungerar tokens?",
    a: "Tokens är Reslots belöningssystem. Du tjänar tokens för varje genomförd transaktion. Samla ihop dem för att få rabatter och förmåner på framtida bokningar.",
  },
  {
    q: "Är bokningarna garanterade?",
    a: "Vi granskar alla upplagda bokningar. Om en bokning mot förmodan inte fungerar återbetalar vi dig fullt ut — utan krångel.",
  },
  {
    q: "Vad kostar det?",
    a: "Det är gratis att bläddra och köpa bokningar kostar en liten förmedlingsavgift som visas tydligt innan du slutför köpet. Att lägga upp bokningar är alltid gratis.",
  },
  {
    q: "Hur kontaktar jag support?",
    a: "Har du frågor eller problem? Skriv till oss via Profil → Hjälp & Support så hör vi av oss inom några timmar.",
  },
];

function FAQItem({ item, index }: { item: typeof FAQ_ITEMS[0]; index: number }) {
  const [open, setOpen] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const progress = useSharedValue(0);

  const bodyStyle = useAnimatedStyle(() => ({
    height: interpolate(progress.value, [0, 1], [0, contentHeight], Extrapolation.CLAMP),
    opacity: progress.value,
    overflow: "hidden",
  }));

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(progress.value, [0, 1], [0, 45])}deg` }],
  }));

  const toggle = () => {
    const next = !open;
    setOpen(next);
    progress.value = withSpring(next ? 1 : 0, { damping: 16, stiffness: 200 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(400).springify()}>
      <Pressable
        onPress={toggle}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 16,
          paddingHorizontal: 24,
        }}
      >
        <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: "#111827", flex: 1, marginRight: 12, letterSpacing: -0.2 }}>
          {item.q}
        </Text>
        <Animated.View style={arrowStyle}>
          <ChevronRight size={16} color="#9CA3AF" strokeWidth={2.5} />
        </Animated.View>
      </Pressable>

      {/* Hidden measure view */}
      <View
        style={{ position: "absolute", opacity: 0, left: 24, right: 24, top: 9999, pointerEvents: "none" }}
        onLayout={(e) => setContentHeight(e.nativeEvent.layout.height + 16)}
      >
        <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: "#6B7280", lineHeight: 22 }}>
          {item.a}
        </Text>
      </View>

      <Animated.View style={bodyStyle}>
        <View style={{ paddingHorizontal: 24, paddingBottom: 16 }}>
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: "#6B7280", lineHeight: 22 }}>
            {item.a}
          </Text>
        </View>
      </Animated.View>

      <View style={{ height: 0.5, backgroundColor: "rgba(0,0,0,0.06)", marginHorizontal: 24 }} />
    </Animated.View>
  );
}

function FAQModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#FAFAF8" }}>
        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingTop: 24, paddingBottom: 20 }}>
          <View>
            <Text style={{ fontFamily: "PlusJakartaSans_700Bold", fontSize: 22, color: "#111827", letterSpacing: -0.5 }}>Frågor & Svar</Text>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: "#9CA3AF", marginTop: 2 }}>Allt du behöver veta om Reslot</Text>
          </View>
          <Pressable
            onPress={onClose}
            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(0,0,0,0.06)", alignItems: "center", justifyContent: "center" }}
          >
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 14, color: "#6B7280" }}>✕</Text>
          </Pressable>
        </View>

        {/* Divider */}
        <View style={{ height: 0.5, backgroundColor: "rgba(0,0,0,0.07)" }} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {FAQ_ITEMS.map((item, index) => (
            <FAQItem key={item.q} item={item} index={index} />
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

// --- Main Screen ---
export default function HomeScreen() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [activeFilter, setActiveFilter] = useState<string>("Alla");
  const [selectedCity, setSelectedCity] = useState<string>("Stockholm");
  const [showCityPicker, setShowCityPicker] = useState<boolean>(false);
  const [showFAQ, setShowFAQ] = useState<boolean>(false);

  const phone = useAuthStore((s) => s.phoneNumber);

  // Fetch reservations from real API
  const {
    data: reservations = [],
    isLoading: reservationsLoading,
    error: reservationsError,
  } = useReservations({
    city: selectedCity,
    neighborhood: activeFilter === "Alla" ? undefined : activeFilter,
  });

  // Fetch profile to get tokens
  const {
    data: profile,
    isLoading: profileLoading,
  } = useProfile(phone || "test@reslot.se");

  // Filter reservations by neighborhood if needed
  const filteredReservations = reservations.filter((res: Reservation) => {
    if (!activeFilter || activeFilter === "Alla") return true;
    return res.restaurant?.neighborhood === activeFilter;
  });

  const isLoading = reservationsLoading || profileLoading;

  return (
    <View style={{ flex: 1, backgroundColor: "#FAFAF8" }}>
      <SafeAreaView
        edges={["top"]}
        style={{
          backgroundColor: "#FAFAF8",
          zIndex: 10,
        }}
      >
        <Header
          selectedCity={selectedCity}
          onCityPress={() => setShowCityPicker(true)}
          onFAQPress={() => setShowFAQ(true)}
          onCreditsPress={() => router.push("/credits")}
          tokens={profile?.tokens ?? 0}
          isLoading={profileLoading}
        />
        <DayPicker
          selectedDate={selectedDate}
          onSelect={setSelectedDate}
          onOpenCalendar={() => setShowCalendar(true)}
        />
        <FilterChips active={activeFilter} onSelect={setActiveFilter} city={selectedCity} />
        {/* Hard break line right at categories bottom */}
        <View
          style={{
            height: 0.5,
            backgroundColor: "rgba(0,0,0,0.07)",
            marginHorizontal: 0,
          }}
        />
      </SafeAreaView>

      <CalendarModal
        visible={showCalendar}
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
        onClose={() => setShowCalendar(false)}
      />

      <FAQModal visible={showFAQ} onClose={() => setShowFAQ(false)} />

      <CityPickerModal
        visible={showCityPicker}
        selectedCity={selectedCity}
        onSelect={(city) => {
          setSelectedCity(city);
          setActiveFilter("");
          setShowCityPicker(false);
        }}
        onClose={() => setShowCityPicker(false)}
      />

      <ScrollView
        testID="home-feed-scroll"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 8 }}
      >
        {/* Loading State */}
        {isLoading ? (
          <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 60 }}>
            <ActivityIndicator size="large" color="#E06A4E" />
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: "#9CA3AF", marginTop: 12 }}>
              Hämtar bokningar...
            </Text>
          </View>
        ) : reservationsError ? (
          <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 60 }}>
            <AlertCircle size={40} color="#E06A4E" strokeWidth={1.5} />
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: "#111827", marginTop: 12 }}>
              Något gick fel
            </Text>
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 13, color: "#9CA3AF", marginTop: 4, textAlign: "center", paddingHorizontal: 20 }}>
              Kunde inte hämta bokningar. Försök igen senare.
            </Text>
          </View>
        ) : (
          <>
            {filteredReservations.map((reservation: Reservation, index: number) => (
              <React.Fragment key={reservation.id}>
                <RestaurantRow
                  reservation={reservation}
                  index={index}
                  isLast={index === filteredReservations.length - 1}
                />
                {index === 2 ? <RewardsBanner /> : null}
              </React.Fragment>
            ))}

            {filteredReservations.length === 0 ? (
              <View className="items-center justify-center pt-20">
                <Search size={40} color="#E5E5E0" strokeWidth={1.5} />
                <Text
                  style={{
                    fontFamily: "PlusJakartaSans_500Medium",
                    fontSize: 15,
                    color: "#9CA3AF",
                    marginTop: 12,
                  }}
                >
                  Inga bord hittades
                </Text>
              </View>
            ) : null}
          </>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}
