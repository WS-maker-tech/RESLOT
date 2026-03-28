import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  Share,
  Linking,
  Modal,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Star,
  Clock,
  Users,
  Calendar,
  MapPin,
  X,
  ChevronRight,
  Share2,
  Instagram,
  Globe,
  Home,
  AlertCircle,
} from "lucide-react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withSpring,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useReservation, useClaimReservation } from "@/lib/api/hooks";
import { useAuthStore } from "@/lib/auth-store";
import type { TagWithCount } from "@/lib/api/types";
import { parseTagsWithCount, parseTags } from "@/lib/api/types";

// Swedish day/month formatting
const MONTHS_SV = [
  "jan", "feb", "mar", "apr", "maj", "jun",
  "jul", "aug", "sep", "okt", "nov", "dec",
];
const DAYS_SV = ["Sön", "Mån", "Tis", "Ons", "Tor", "Fre", "Lör"];

function formatReservationDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${DAYS_SV[d.getDay()]}, ${d.getDate()} ${MONTHS_SV[d.getMonth()]}`;
  } catch {
    return dateStr;
  }
}

// --- Tag chip ---
function TagChip({ tag }: { tag: TagWithCount }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(17,24,39,0.04)",
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 7,
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: "rgba(17,24,39,0.07)",
      }}
    >
      <Text
        style={{
          fontFamily: "PlusJakartaSans_500Medium",
          fontSize: 13,
          color: "#374151",
        }}
      >
        {tag.label}
      </Text>
      <View
        style={{
          width: 3,
          height: 3,
          borderRadius: 1.5,
          backgroundColor: "#9CA3AF",
          marginHorizontal: 6,
        }}
      />
      <Text
        style={{
          fontFamily: "PlusJakartaSans_600SemiBold",
          fontSize: 12,
          color: "#9CA3AF",
        }}
      >
        {tag.count}
      </Text>
    </View>
  );
}

// --- Tag section ---
function TagSection({ title, tags }: { title: string; tags: TagWithCount[] }) {
  if (!tags || tags.length === 0) return null;
  return (
    <View style={{ marginBottom: 22 }}>
      <Text
        style={{
          fontFamily: "PlusJakartaSans_600SemiBold",
          fontSize: 13,
          color: "#6B7280",
          letterSpacing: 0.4,
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        {title}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {tags.map((tag, i) => (
          <TagChip key={`${tag.label}-${i}`} tag={tag} />
        ))}
      </View>
    </View>
  );
}

// --- Detail row ---
function DetailRow({
  icon,
  label,
  isLast = false,
}: {
  icon: React.ReactNode;
  label: string;
  isLast?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 18,
        paddingHorizontal: 20,
        gap: 16,
        borderBottomWidth: isLast ? 0 : 0.5,
        borderBottomColor: "rgba(0,0,0,0.06)",
      }}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 12,
          backgroundColor: "rgba(201,169,110,0.10)",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </View>
      <Text
        style={{
          fontFamily: "PlusJakartaSans_500Medium",
          fontSize: 16,
          color: "#111827",
          flex: 1,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const phone = useAuthStore((s) => s.phoneNumber);

  const { data: reservation, isLoading, error } = useReservation(id ?? "");
  const claimMutation = useClaimReservation();

  const [activeTab, setActiveTab] = useState<"om" | "bokning">("bokning");
  const [accepted, setAccepted] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const scaleBtn = useSharedValue(1);
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleBtn.value }],
  }));

  const ctaRevealStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [100, 220], [0.65, 1], Extrapolation.CLAMP);
    const scale = interpolate(scrollY.value, [100, 220], [0.97, 1], Extrapolation.CLAMP);
    return { opacity, transform: [{ scale }] };
  });

  const handleClaim = useCallback(async () => {
    if (!accepted || !reservation) return;
    if (!phone) return;
    setClaimError(null);
    scaleBtn.value = withSpring(0.96, { damping: 10 }, () => {
      scaleBtn.value = withSpring(1);
    });
    try {
      await claimMutation.mutateAsync({
        reservationId: reservation.id,
        claimerPhone: phone,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setClaimSuccess(true);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = err?.message ?? "Något gick fel. Försök igen.";
      setClaimError(msg);
    }
  }, [accepted, reservation, phone, claimMutation, scaleBtn]);

  // Loading state
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#FAFAF8" }}>
        <SafeAreaView edges={["top"]} style={{ backgroundColor: "#FAFAF8" }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: "#111827" }}>Ta över bokning</Text>
            <Pressable testID="close-button" onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(17,24,39,0.05)", alignItems: "center", justifyContent: "center" }}>
              <X size={17} color="#374151" strokeWidth={2.5} />
            </Pressable>
          </View>
        </SafeAreaView>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#E06A4E" />
        </View>
      </View>
    );
  }

  // Error state
  if (error || !reservation) {
    return (
      <View style={{ flex: 1, backgroundColor: "#FAFAF8" }}>
        <SafeAreaView edges={["top"]} style={{ backgroundColor: "#FAFAF8" }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 4, paddingBottom: 12 }}>
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: "#111827" }}>Ta över bokning</Text>
            <Pressable testID="close-button" onPress={() => router.back()} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(17,24,39,0.05)", alignItems: "center", justifyContent: "center" }}>
              <X size={17} color="#374151" strokeWidth={2.5} />
            </Pressable>
          </View>
        </SafeAreaView>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <AlertCircle size={40} color="#E06A4E" strokeWidth={1.5} />
          <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 16, color: "#111827", marginTop: 16, textAlign: "center" }}>Bokningen hittades inte</Text>
          <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: "#9CA3AF", marginTop: 6, textAlign: "center" }}>Den kan ha blivit tagen av någon annan.</Text>
        </View>
      </View>
    );
  }

  const restaurant = reservation.restaurant;
  const tags = parseTags(restaurant.tags);
  const vibeTags = parseTagsWithCount(restaurant.vibeTags);
  const goodForTags = parseTagsWithCount(restaurant.goodForTags);
  const foodTags = parseTagsWithCount(restaurant.foodTags);
  const displayDate = formatReservationDate(reservation.reservationDate);
  const displayTime = reservation.reservationTime.substring(0, 5);
  const isClaimed = claimSuccess || reservation.status === "claimed";

  return (
    <View style={{ flex: 1, backgroundColor: "#FAFAF8" }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#FAFAF8" }}>
        {/* Top bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingTop: 4,
            paddingBottom: 12,
          }}
        >
          <Text
            style={{
              fontFamily: "PlusJakartaSans_600SemiBold",
              fontSize: 15,
              color: "#111827",
            }}
          >
            Ta över bokning
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Pressable
              testID="share-button"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                const shareMessage = `Kolla in ${restaurant.name} på Reslot — ledigt bord ${displayDate} kl ${displayTime}!`;
                if (Platform.OS === "web") {
                  navigator.clipboard.writeText(shareMessage).catch(() => {});
                } else {
                  Share.share({ message: shareMessage }).catch(() => {});
                }
              }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "rgba(17,24,39,0.05)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Share2 size={17} color="#374151" strokeWidth={2} />
            </Pressable>
            <Pressable
              testID="close-button"
              onPress={() => router.back()}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "rgba(17,24,39,0.05)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={17} color="#374151" strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      {/* Divider */}
      <View style={{ height: 0.5, backgroundColor: "rgba(0,0,0,0.07)" }} />

      <Animated.ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Restaurant header card */}
        <Animated.View entering={FadeInDown.duration(350).springify()}>
          <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 }}>
            <View style={{ flexDirection: "row", gap: 14 }}>
              {/* Left content */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_700Bold",
                      fontSize: 22,
                      color: "#111827",
                      letterSpacing: -0.5,
                      flexShrink: 1,
                    }}
                    numberOfLines={2}
                  >
                    {restaurant.name}
                  </Text>
                  {restaurant.isExclusive ? (
                    <View
                      style={{
                        backgroundColor: "rgba(201,169,110,0.15)",
                        paddingHorizontal: 7,
                        paddingVertical: 3,
                        borderRadius: 5,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: "PlusJakartaSans_700Bold",
                          fontSize: 9,
                          color: "#C9A96E",
                          letterSpacing: 0.6,
                          textTransform: "uppercase",
                        }}
                      >
                        VIP
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Stars */}
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6, gap: 4 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={14}
                      color="#C9A96E"
                      fill={restaurant.rating >= s ? "#C9A96E" : "transparent"}
                      strokeWidth={1.5}
                    />
                  ))}
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_600SemiBold",
                      fontSize: 13,
                      color: "#C9A96E",
                      marginLeft: 4,
                    }}
                  >
                    {restaurant.rating}
                  </Text>
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_400Regular",
                      fontSize: 13,
                      color: "#9CA3AF",
                    }}
                  >
                    ({restaurant.reviewCount})
                  </Text>
                </View>

                {/* Address · Cuisine */}
                <Text
                  style={{
                    fontFamily: "PlusJakartaSans_400Regular",
                    fontSize: 13,
                    color: "#6B7280",
                    marginTop: 5,
                    lineHeight: 18,
                  }}
                  numberOfLines={2}
                >
                  {restaurant.address} · {restaurant.cuisine}
                </Text>

                {/* Tags */}
                {tags.length > 0 ? (
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_400Regular",
                      fontSize: 12,
                      color: "#9CA3AF",
                      marginTop: 4,
                    }}
                    numberOfLines={1}
                  >
                    {tags.join(" · ")}
                  </Text>
                ) : null}
              </View>

              {/* Thumbnail */}
              <Image
                source={{ uri: restaurant.image }}
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 14,
                  backgroundColor: "#F0F0EE",
                }}
                resizeMode="cover"
              />
            </View>
          </View>
        </Animated.View>

        {/* Divider */}
        <View style={{ height: 0.5, backgroundColor: "rgba(0,0,0,0.07)", marginHorizontal: 20 }} />

        {/* Tabs */}
        <Animated.View
          entering={FadeInDown.delay(60).duration(350).springify()}
          style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 }}
        >
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "rgba(17,24,39,0.05)",
              borderRadius: 12,
              padding: 3,
            }}
          >
            {(["bokning", "om"] as const).map((tab) => (
              <Pressable
                key={tab}
                testID={`tab-${tab}`}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActiveTab(tab);
                }}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 10,
                  alignItems: "center",
                  backgroundColor: activeTab === tab ? "#FFFFFF" : "transparent",
                  shadowColor: activeTab === tab ? "#000" : "transparent",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: activeTab === tab ? 0.08 : 0,
                  shadowRadius: 3,
                }}
              >
                <Text
                  style={{
                    fontFamily:
                      activeTab === tab
                        ? "PlusJakartaSans_600SemiBold"
                        : "PlusJakartaSans_400Regular",
                    fontSize: 14,
                    color: activeTab === tab ? "#111827" : "#9CA3AF",
                  }}
                >
                  {tab === "bokning" ? "Bokning" : "Om"}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        {/* Tab content */}
        {activeTab === "bokning" ? (
          <Animated.View
            key="bokning"
            entering={FadeInDown.duration(300).springify()}
            style={{ paddingHorizontal: 20, paddingTop: 16 }}
          >
            {/* Reservation detail card */}
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 20,
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.06)",
                marginBottom: 20,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 12,
                elevation: 2,
              }}
            >
              <DetailRow
                icon={<Calendar size={20} color="#C9A96E" strokeWidth={1.8} />}
                label={displayDate}
              />
              <DetailRow
                icon={<Clock size={20} color="#C9A96E" strokeWidth={1.8} />}
                label={displayTime}
              />
              <DetailRow
                icon={<Users size={20} color="#C9A96E" strokeWidth={1.8} />}
                label={`${reservation.partySize} ${reservation.partySize === 1 ? "person" : "personer"}`}
              />
              <DetailRow
                icon={<Home size={20} color="#C9A96E" strokeWidth={1.8} />}
                label={reservation.seatType}
                isLast
              />
            </View>

            {/* Cancellation checkbox */}
            <Pressable
              testID="cancellation-checkbox"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setAccepted((v) => !v);
              }}
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 12,
                marginBottom: 28,
              }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  borderWidth: 1.5,
                  borderColor: accepted ? "#E06A4E" : "rgba(0,0,0,0.20)",
                  backgroundColor: accepted ? "#E06A4E" : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 1,
                  flexShrink: 0,
                }}
              >
                {accepted ? (
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 13,
                      fontFamily: "PlusJakartaSans_700Bold",
                      lineHeight: 15,
                    }}
                  >
                    ✓
                  </Text>
                ) : null}
              </View>
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_400Regular",
                  fontSize: 14,
                  color: "#6B7280",
                  flex: 1,
                  lineHeight: 20,
                }}
              >
                Jag godkänner{" "}
                <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", color: "#374151" }}>
                  avbokningsvillkoren
                </Text>{" "}
                och övriga villkor
              </Text>
            </Pressable>

            {/* Error message */}
            {claimError ? (
              <View
                style={{
                  backgroundColor: "rgba(224,106,78,0.08)",
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <AlertCircle size={16} color="#E06A4E" strokeWidth={2} />
                <Text style={{ fontFamily: "PlusJakartaSans_500Medium", fontSize: 13, color: "#E06A4E", flex: 1 }}>
                  {claimError}
                </Text>
              </View>
            ) : null}

            {/* CTA button */}
            <Animated.View style={[btnStyle, ctaRevealStyle]}>
              <Pressable
                testID="claim-button"
                onPress={handleClaim}
                onPressIn={() => {
                  scaleBtn.value = withSpring(0.95, { damping: 15, stiffness: 300 });
                }}
                onPressOut={() => {
                  scaleBtn.value = withSpring(1, { damping: 12, stiffness: 200 });
                }}
                disabled={claimMutation.isPending || isClaimed}
                style={{
                  backgroundColor: isClaimed
                    ? "#8B9E7E"
                    : accepted
                    ? "#111827"
                    : "rgba(17,24,39,0.25)",
                  borderRadius: 16,
                  paddingVertical: 17,
                  alignItems: "center",
                }}
              >
                {claimMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_600SemiBold",
                      fontSize: 16,
                      color: "#FFFFFF",
                      letterSpacing: -0.2,
                    }}
                  >
                    {isClaimed ? "Bokning Övertagen ✓" : "Ta över bokning"}
                  </Text>
                )}
              </Pressable>
            </Animated.View>
          </Animated.View>
        ) : (
          <Animated.View
            key="om"
            entering={FadeInDown.duration(300).springify()}
            style={{ paddingHorizontal: 20, paddingTop: 16 }}
          >
            {/* Social links */}
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
              {restaurant.instagram ? (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    Linking.openURL(`https://instagram.com/${restaurant.instagram}`);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 7,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    backgroundColor: "#FFFFFF",
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: "rgba(0,0,0,0.08)",
                  }}
                >
                  <Instagram size={16} color="#374151" strokeWidth={1.8} />
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_500Medium",
                      fontSize: 14,
                      color: "#374151",
                    }}
                  >
                    Instagram
                  </Text>
                </Pressable>
              ) : null}
              {restaurant.website ? (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    Linking.openURL(`https://${restaurant.website}`);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 7,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    backgroundColor: "#FFFFFF",
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: "rgba(0,0,0,0.08)",
                  }}
                >
                  <Globe size={16} color="#374151" strokeWidth={1.8} />
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_500Medium",
                      fontSize: 14,
                      color: "#374151",
                    }}
                  >
                    Webbplats
                  </Text>
                </Pressable>
              ) : null}
            </View>

            {/* Description */}
            <Text
              style={{
                fontFamily: "PlusJakartaSans_400Regular",
                fontSize: 15,
                color: "#374151",
                lineHeight: 23,
                marginBottom: 24,
              }}
            >
              {restaurant.description}
            </Text>

            <View
              style={{
                height: 0.5,
                backgroundColor: "rgba(0,0,0,0.07)",
                marginBottom: 22,
              }}
            />

            <TagSection title="Stämning" tags={vibeTags} />
            <TagSection title="Passar för" tags={goodForTags} />
            <TagSection title="Mat" tags={foodTags} />
          </Animated.View>
        )}
      </Animated.ScrollView>
    </View>
  );
}
