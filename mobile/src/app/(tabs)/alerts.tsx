import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  Pressable,
  Modal,
  ActivityIndicator,
  TextInput,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Bell,
  Flame,
  CheckCircle2,
  Coins,
  Crown,
  ChevronRight,
  Star,
  Plus,
  X,
  Check,
  AlertCircle,
  Search,
} from "lucide-react-native";
import { useAuthStore } from "@/lib/auth-store";
import {
  useActivityAlerts,
  useRestaurantAlerts,
  useAddRestaurantAlert,
  useRemoveRestaurantAlert,
  useRestaurants,
  useMarkAlertsRead,
} from "@/lib/api/hooks";
import type { ActivityAlert, RestaurantAlertWithRestaurant } from "@/lib/api/types";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";

const ALERT_ICONS: Record<
  ActivityAlert["type"],
  { icon: typeof Flame; color: string; bg: string }
> = {
  drop: { icon: Flame, color: "#E06A4E", bg: "rgba(224, 106, 78, 0.10)" },
  claim: { icon: CheckCircle2, color: "#8B9E7E", bg: "rgba(139, 158, 126, 0.10)" },
  token: { icon: Coins, color: "#C9A96E", bg: "rgba(201, 169, 110, 0.10)" },
  premium: { icon: Crown, color: "#C9A96E", bg: "rgba(201, 169, 110, 0.10)" },
};

function RestaurantAlertCard({
  alert,
  index,
  onRemove,
  onPress,
}: {
  alert: RestaurantAlertWithRestaurant;
  index: number;
  onRemove?: (id: string) => void;
  onPress?: (restaurantId: string) => void;
}) {
  const restaurant = alert.restaurant;

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(400).springify()}>
      <Pressable
        testID={`restaurant-alert-${alert.id}`}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress?.(restaurant.id);
        }}
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 14,
          padding: 14,
          marginBottom: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.03,
          shadowRadius: 6,
          elevation: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View className="flex-row items-center flex-1">
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text
              style={{
                fontFamily: "PlusJakartaSans_600SemiBold",
                fontSize: 15,
                color: "#111827",
                letterSpacing: -0.2,
              }}
              numberOfLines={1}
            >
              {restaurant.name}
            </Text>
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
            <View className="flex-row items-center" style={{ marginTop: 5, gap: 4 }}>
              <Star size={11} color="#C9A96E" fill="#C9A96E" strokeWidth={0} />
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_600SemiBold",
                  fontSize: 12,
                  color: "#111827",
                }}
              >
                {restaurant.rating.toFixed(1)}
              </Text>
              <View
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: 1.5,
                  backgroundColor: "#D1D5DB",
                  marginHorizontal: 4,
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
          </View>
          <Image
            source={{ uri: restaurant.image }}
            style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              backgroundColor: "#F0F0EE",
            }}
            resizeMode="cover"
          />
        </View>
        {onRemove ? (
          <Pressable
            onPress={() => onRemove(alert.id)}
            style={{ marginLeft: 12, padding: 8 }}
          >
            <X size={16} color="#9CA3AF" strokeWidth={2} />
          </Pressable>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

function AlertItem({ alert, index }: { alert: ActivityAlert; index: number }) {
  const config = ALERT_ICONS[alert.type];
  const IconComponent = config.icon;

  return (
    <Animated.View entering={FadeInDown.delay((index + 2) * 60).duration(400).springify()}>
      <Pressable
        testID={`alert-${alert.id}`}
        className="flex-row items-start rounded-xl p-4"
        style={{
          backgroundColor: alert.read ? "#FFFFFF" : "rgba(224, 106, 78, 0.05)",
          marginBottom: 8,
          borderWidth: alert.read ? 0 : 1,
          borderColor: alert.read ? "transparent" : "rgba(224,106,78,0.15)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: alert.read ? 0.02 : 0.04,
          shadowRadius: 6,
          elevation: alert.read ? 1 : 2,
        }}
        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: config.bg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconComponent size={18} color={config.color} strokeWidth={2.2} />
        </View>
        <View className="ml-3 flex-1">
          <View className="flex-row items-center justify-between">
            <Text
              style={{
                fontFamily: "PlusJakartaSans_600SemiBold",
                fontSize: 14,
                color: "#111827",
                flex: 1,
              }}
              numberOfLines={1}
            >
              {alert.title}
            </Text>
            {!alert.read ? (
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: "#E06A4E",
                  marginLeft: 8,
                }}
              />
            ) : null}
          </View>
          <Text
            style={{
              fontFamily: "PlusJakartaSans_400Regular",
              fontSize: 13,
              color: "#6B7280",
              marginTop: 3,
              lineHeight: 18,
            }}
            numberOfLines={2}
          >
            {alert.message}
          </Text>
          <Text
            style={{
              fontFamily: "PlusJakartaSans_400Regular",
              fontSize: 11,
              color: "#9CA3AF",
              marginTop: 6,
            }}
          >
            {new Date(alert.createdAt).toLocaleDateString("sv-SE")}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function AlertsScreen() {
  const phone = useAuthStore((s) => s.phoneNumber);
  const router = useRouter();
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch activity alerts
  const {
    data: activityAlerts = [],
    isLoading: alertsLoading,
    error: alertsError,
  } = useActivityAlerts(phone || "test@reslot.se");

  // Fetch restaurant alerts
  const {
    data: restaurantAlerts = [],
    isLoading: restaurantAlertsLoading,
  } = useRestaurantAlerts(phone || "test@reslot.se");

  // Fetch all restaurants for add modal
  const { data: allRestaurants = [] } = useRestaurants();

  // Mutations
  const addAlertMutation = useAddRestaurantAlert();
  const removeAlertMutation = useRemoveRestaurantAlert();
  const markReadMutation = useMarkAlertsRead();

  const unreadCount = (activityAlerts as ActivityAlert[]).filter((a) => !a.read).length;
  const totalAlerts = restaurantAlerts.length;
  const enabledAlerts = (restaurantAlerts as RestaurantAlertWithRestaurant[]).filter((a) => a.enabled).length;

  const handleRemoveAlert = async (alertId: string) => {
    try {
      await removeAlertMutation.mutateAsync(alertId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleAddAlert = async (restaurantId: string) => {
    try {
      await addAlertMutation.mutateAsync({
        userPhone: phone || "test@reslot.se",
        restaurantId,
      });
      setAddedIds((prev) => [...prev, restaurantId]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await markReadMutation.mutateAsync({ phone: phone || "test@reslot.se" });
    } catch (err) {
      // silently ignore
    }
  };

  const handleRestaurantAlertPress = (restaurantId: string) => {
    // Navigate to find the first active reservation for this restaurant
    // For now navigate to the home page — the restaurant doesn't have its own page
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FAFAF8" }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "#FAFAF8" }}>
        <View className="flex-row items-center justify-between px-5 pt-2 pb-4">
          <View>
            <Text
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                fontSize: 26,
                color: "#111827",
                letterSpacing: -0.8,
              }}
            >
              Aviseringar
            </Text>
            {unreadCount > 0 ? (
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_400Regular",
                  fontSize: 13,
                  color: "#E06A4E",
                  marginTop: 2,
                }}
              >
                {unreadCount} {unreadCount > 1 ? "nya aviseringar" : "ny avisering"}
              </Text>
            ) : null}
          </View>
          <Pressable
            testID="mark-all-read-button"
            onPress={handleMarkAllRead}
            className="rounded-full px-3.5 py-2"
            style={{ backgroundColor: "rgba(0,0,0,0.04)" }}
          >
            <Text
              style={{
                fontFamily: "PlusJakartaSans_500Medium",
                fontSize: 12,
                color: "#6B7280",
              }}
            >
              Markera alla som lästa
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView
        testID="alerts-scroll"
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 4 }}
      >
        {alertsLoading ? (
          <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 60 }}>
            <ActivityIndicator size="large" color="#E06A4E" />
            <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: "#9CA3AF", marginTop: 12 }}>
              Hämtar aviseringar...
            </Text>
          </View>
        ) : alertsError ? (
          <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 60 }}>
            <AlertCircle size={40} color="#E06A4E" strokeWidth={1.5} />
            <Text style={{ fontFamily: "PlusJakartaSans_600SemiBold", fontSize: 15, color: "#111827", marginTop: 12 }}>
              Något gick fel
            </Text>
          </View>
        ) : (
          <>
            {/* Restaurant Alerts Section */}
            <Animated.View entering={FadeInDown.delay(0).duration(400).springify()}>
              <View className="px-5" style={{ marginBottom: 8 }}>
                <View className="flex-row items-center justify-between" style={{ marginBottom: 12 }}>
                  <View className="flex-row items-center" style={{ gap: 8 }}>
                    <Text
                      style={{
                        fontFamily: "PlusJakartaSans_600SemiBold",
                        fontSize: 16,
                        color: "#111827",
                        letterSpacing: -0.2,
                      }}
                    >
                      Restaurangaviseringar
                    </Text>
                    <View
                      style={{
                        backgroundColor: "rgba(224, 106, 78, 0.10)",
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: "PlusJakartaSans_600SemiBold",
                          fontSize: 11,
                          color: "#E06A4E",
                        }}
                      >
                        {enabledAlerts} / {totalAlerts}
                      </Text>
                    </View>
                  </View>
                </View>

                {restaurantAlertsLoading ? (
                  <ActivityIndicator size="small" color="#E06A4E" />
                ) : restaurantAlerts && restaurantAlerts.length > 0 ? (
                  (restaurantAlerts as RestaurantAlertWithRestaurant[]).map((alert, index) => (
                    <RestaurantAlertCard
                      key={alert.id}
                      alert={alert}
                      index={index}
                      onRemove={handleRemoveAlert}
                      onPress={handleRestaurantAlertPress}
                    />
                  ))
                ) : null}

                {/* Add alert button */}
                <Pressable
                  testID="add-alert-button"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowAddAlert(true);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    backgroundColor: "#FFFFFF",
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "rgba(0,0,0,0.06)",
                    marginBottom: 4,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.03,
                    shadowRadius: 6,
                    elevation: 1,
                    gap: 12,
                  }}
                >
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 10,
                      backgroundColor: "rgba(224, 106, 78, 0.10)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Plus size={16} color="#E06A4E" strokeWidth={2.5} />
                  </View>
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_600SemiBold",
                      fontSize: 14,
                      color: "#111827",
                      flex: 1,
                    }}
                  >
                    Lägg till avisering
                  </Text>
                  <ChevronRight size={16} color="#D1D5DB" strokeWidth={2} />
                </Pressable>
              </View>
            </Animated.View>

            {/* Divider */}
            <View
              style={{
                height: 0.5,
                backgroundColor: "rgba(0,0,0,0.06)",
                marginHorizontal: 20,
                marginTop: 12,
                marginBottom: 16,
              }}
            />

            {/* Recent Activity Section */}
            <View className="px-5" style={{ marginBottom: 8 }}>
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_600SemiBold",
                  fontSize: 16,
                  color: "#111827",
                  letterSpacing: -0.2,
                  marginBottom: 12,
                }}
              >
                Senaste händelser
              </Text>
            </View>

            <View className="px-5">
              {(activityAlerts as ActivityAlert[])
                .filter((a) => a.type !== "premium")
                .map((alert, index) => (
                  <AlertItem key={alert.id} alert={alert} index={index} />
                ))}
            </View>

            {/* Empty state for activity if needed */}
            {(activityAlerts as ActivityAlert[]).filter((a) => a.type !== "premium").length === 0 ? (
              <View className="items-center justify-center" style={{ paddingTop: 40 }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    backgroundColor: "rgba(0,0,0,0.03)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <Bell size={24} color="#D1D5DB" strokeWidth={1.5} />
                </View>
                <Text
                  style={{
                    fontFamily: "PlusJakartaSans_600SemiBold",
                    fontSize: 15,
                    color: "#111827",
                  }}
                >
                  Inga händelser än
                </Text>
                <Text
                  style={{
                    fontFamily: "PlusJakartaSans_400Regular",
                    fontSize: 13,
                    color: "#9CA3AF",
                    marginTop: 4,
                  }}
                >
                  Här visas dina senaste aktiviteter.
                </Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      {/* Add Alert Modal */}
      <Modal
        visible={showAddAlert}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddAlert(false)}
      >
        <View style={{ flex: 1, backgroundColor: "#FAFAF8" }}>
          <SafeAreaView edges={["top"]} style={{ backgroundColor: "#FAFAF8" }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 20,
                paddingTop: 4,
                paddingBottom: 14,
              }}
            >
              <View>
                <Text
                  style={{
                    fontFamily: "PlusJakartaSans_700Bold",
                    fontSize: 20,
                    color: "#111827",
                    letterSpacing: -0.4,
                  }}
                >
                  Lägg till avisering
                </Text>
                <Text
                  style={{
                    fontFamily: "PlusJakartaSans_400Regular",
                    fontSize: 13,
                    color: "#9CA3AF",
                    marginTop: 2,
                  }}
                >
                  Få ett meddelande när ett bord dyker upp
                </Text>
              </View>
              <Pressable
                onPress={() => setShowAddAlert(false)}
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
          </SafeAreaView>

          <View style={{ height: 0.5, backgroundColor: "rgba(0,0,0,0.07)" }} />

          {/* Search Bar */}
          <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#FAFAF8",
                borderRadius: 12,
                paddingHorizontal: 14,
                height: 44,
                borderWidth: 1,
                borderColor: searchQuery ? "rgba(224,106,78,0.20)" : "rgba(0,0,0,0.08)",
              }}
            >
              <Search size={16} color="#9CA3AF" strokeWidth={2} />
              <TextInput
                testID="restaurant-search"
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Sök restaurang..."
                placeholderTextColor="#D1D5DB"
                style={{
                  flex: 1,
                  fontFamily: "PlusJakartaSans_400Regular",
                  fontSize: 15,
                  color: "#111827",
                  marginLeft: 10,
                }}
              />
              {searchQuery ? (
                <Pressable
                  testID="clear-search"
                  onPress={() => setSearchQuery("")}
                  hitSlop={8}
                >
                  <X size={16} color="#9CA3AF" strokeWidth={2.5} />
                </Pressable>
              ) : null}
            </View>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 20, gap: 10 }}
            showsVerticalScrollIndicator={false}
            onScrollBeginDrag={() => Keyboard.dismiss()}
          >
            {allRestaurants && allRestaurants.length > 0 ? (
              (() => {
                const filtered = allRestaurants.filter((r: any) =>
                  r.name.toLowerCase().includes(searchQuery.toLowerCase())
                );
                return filtered.length > 0 ? (
                  filtered.map((restaurant: any) => {
                    const alreadyAdded =
                      restaurantAlerts.some((a: RestaurantAlertWithRestaurant) => a.restaurantId === restaurant.id) ||
                      addedIds.includes(restaurant.id);
                    return (
                      <Pressable
                        key={restaurant.id}
                        onPress={() => {
                          if (!alreadyAdded) {
                            handleAddAlert(restaurant.id);
                          }
                        }}
                        style={{
                          backgroundColor: "#FFFFFF",
                          borderRadius: 14,
                          padding: 14,
                          flexDirection: "row",
                          alignItems: "center",
                          borderWidth: 1,
                          borderColor: alreadyAdded
                            ? "rgba(139,158,126,0.30)"
                            : "rgba(0,0,0,0.06)",
                          opacity: alreadyAdded ? 0.6 : 1,
                        }}
                      >
                        <Image
                          source={{ uri: restaurant.image }}
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 10,
                            backgroundColor: "#F0F0EE",
                            marginRight: 12,
                          }}
                          resizeMode="cover"
                        />
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontFamily: "PlusJakartaSans_600SemiBold",
                              fontSize: 15,
                              color: "#111827",
                              letterSpacing: -0.2,
                            }}
                            numberOfLines={1}
                          >
                            {restaurant.name}
                          </Text>
                          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 3, gap: 4 }}>
                            <Star size={11} color="#C9A96E" fill="#C9A96E" strokeWidth={0} />
                            <Text
                              style={{
                                fontFamily: "PlusJakartaSans_500Medium",
                                fontSize: 12,
                                color: "#9CA3AF",
                              }}
                            >
                              {restaurant.rating.toFixed(1)} · {restaurant.cuisine}
                            </Text>
                          </View>
                        </View>
                        <View
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            backgroundColor: alreadyAdded
                              ? "rgba(139,158,126,0.15)"
                              : "rgba(224,106,78,0.08)",
                            alignItems: "center",
                            justifyContent: "center",
                            marginLeft: 10,
                          }}
                        >
                          {alreadyAdded ? (
                            <Check size={14} color="#8B9E7E" strokeWidth={2.5} />
                          ) : (
                            <Plus size={14} color="#E06A4E" strokeWidth={2.5} />
                          )}
                        </View>
                      </Pressable>
                    );
                  })
                ) : (
                  <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: "#9CA3AF", textAlign: "center", paddingTop: 40 }}>
                    Inga restauranger matchar "{searchQuery}"
                  </Text>
                );
              })()
            ) : (
              <Text style={{ fontFamily: "PlusJakartaSans_400Regular", fontSize: 14, color: "#9CA3AF", textAlign: "center", paddingTop: 20 }}>
                Hämtar restauranger...
              </Text>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
