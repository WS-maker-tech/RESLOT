import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Keyboard,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
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
  Eye,
  Trash2,
  Clock,
  Calendar,
  Users,
} from "lucide-react-native";
import { useAuthStore } from "@/lib/auth-store";
import {
  useActivityAlerts,
  useRestaurantAlerts,
  useAddRestaurantAlert,
  useRemoveRestaurantAlert,
  useRestaurants,
  useMarkAlertsRead,
  useWatches,
  useDeleteWatch,
} from "@/lib/api/hooks";
import type { ActivityAlert, RestaurantAlertWithRestaurant, Watch, WatchFilterOptions } from "@/lib/api/types";
import { parseWatchFilters } from "@/lib/api/types";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { C, FONTS, SPACING, RADIUS, ICON } from "../../lib/theme";
import { Skeleton } from "@/components/Skeleton";

function AlertsSkeleton() {
  return (
    <View style={{ paddingHorizontal: SPACING.lg, paddingTop: 12, gap: 12 }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.md, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Skeleton width={40} height={40} style={{ borderRadius: RADIUS.md }} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton width="70%" height={14} />
            <Skeleton width="50%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

const ALERT_ICONS: Record<
  ActivityAlert["type"],
  { icon: typeof Flame; color: string; bg: string }
> = {
  drop: { icon: Flame, color: C.coral, bg: C.coralLight },
  claim: { icon: CheckCircle2, color: C.success, bg: C.successLight },
  credit: { icon: Coins, color: C.gold, bg: "rgba(201, 169, 110, 0.10)" },
  premium: { icon: Crown, color: C.gold, bg: "rgba(201, 169, 110, 0.10)" },
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
    <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
      <Pressable
        testID={`restaurant-alert-${alert.id}`}
        accessibilityLabel={`Visa bevakning för ${restaurant.name}`}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress?.(restaurant.id);
        }}
        style={{
          backgroundColor: C.bgCard,
          borderRadius: RADIUS.md,
          borderWidth: 0.5,
          borderColor: C.borderLight,
          padding: 16,
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
                fontFamily: FONTS.displaySemiBold,
                fontSize: 15,
                color: C.dark,
                letterSpacing: -0.2,
              }}
              numberOfLines={1}
            >
              {restaurant.name}
            </Text>
            <Text
              style={{
                fontFamily: FONTS.regular,
                fontSize: 13,
                color: C.textTertiary,
                marginTop: 4,
              }}
              numberOfLines={1}
            >
              {restaurant.address}
            </Text>
            <View className="flex-row items-center" style={{ marginTop: 5, gap: 4 }}>
              <Star size={11} color={C.gold} fill={C.gold} strokeWidth={0} />
              <Text
                style={{
                  fontFamily: FONTS.semiBold,
                  fontSize: 12,
                  color: C.dark,
                }}
              >
                {restaurant.rating.toFixed(1)}
              </Text>
              <View
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: 1.5,
                  backgroundColor: C.textTertiary,
                  marginHorizontal: 4,
                }}
              />
              <Text
                style={{
                  fontFamily: FONTS.regular,
                  fontSize: 12,
                  color: C.textTertiary,
                }}
              >
                {restaurant.cuisine}
              </Text>
            </View>
          </View>
          <Image
            source={{ uri: restaurant.image }}
            style={{
              width: 60,
              height: 60,
              borderRadius: RADIUS.md,
              backgroundColor: C.bgInput,
            }}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        </View>
        {onRemove ? (
          <Pressable
            testID={`remove-alert-${alert.id}`}
            accessibilityLabel={`Ta bort bevakning för ${restaurant.name}`}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onRemove(alert.id);
            }}
            style={{ marginLeft: 12, padding: 8 }}
          >
            <X size={16} color={C.textTertiary} strokeWidth={2} />
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
    <Animated.View entering={FadeInDown.delay((index + 2) * 60).springify()}>
      <Pressable
        testID={`alert-${alert.id}`}
        accessibilityLabel={`Händelse: ${alert.title}`}
        className="flex-row items-start rounded-xl p-4"
        style={{
          backgroundColor: alert.read ? C.bgCard : "rgba(224,106,78,0.04)",
          marginBottom: 8,
          borderWidth: alert.read ? 0 : 1,
          borderColor: alert.read ? "transparent" : "rgba(224,106,78,0.12)",
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
            borderRadius: RADIUS.md,
            backgroundColor: config.bg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconComponent size={18} color={config.color} strokeWidth={ICON.strokeWidth} />
        </View>
        <View className="ml-3 flex-1">
          <View className="flex-row items-center justify-between">
            <Text
              style={{
                fontFamily: FONTS.semiBold,
                fontSize: 14,
                color: C.dark,
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
                  backgroundColor: C.coral,
                  marginLeft: 8,
                }}
              />
            ) : null}
          </View>
          <Text
            style={{
              fontFamily: FONTS.regular,
              fontSize: 13,
              color: C.textSecondary,
              marginTop: 3,
              lineHeight: 18,
            }}
            numberOfLines={2}
          >
            {alert.message}
          </Text>
          <Text
            style={{
              fontFamily: FONTS.regular,
              fontSize: 11,
              color: C.textTertiary,
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
  const [activeTab, setActiveTab] = useState<"activity" | "watches">("activity");
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch activity alerts
  const {
    data: activityAlerts = [],
    isLoading: alertsLoading,
    error: alertsError,
    refetch: alertsRefetch,
  } = useActivityAlerts(phone || "");

  // Fetch restaurant alerts
  const {
    data: restaurantAlerts = [],
    isLoading: restaurantAlertsLoading,
    refetch: restaurantAlertsRefetch,
  } = useRestaurantAlerts(phone || "");

  // Fetch all restaurants for add modal
  const { data: allRestaurants = [] } = useRestaurants();

  // Mutations
  const addAlertMutation = useAddRestaurantAlert();
  const removeAlertMutation = useRemoveRestaurantAlert();
  const markReadMutation = useMarkAlertsRead();

  // Watches
  const { data: watches = [], isLoading: watchesLoading, refetch: watchesRefetch } = useWatches(phone);
  const { mutate: deleteWatch } = useDeleteWatch();

  const unreadCount = useMemo(() => (activityAlerts as ActivityAlert[]).filter((a) => !a.read).length, [activityAlerts]);
  const filteredActivityAlerts = useMemo(() => (activityAlerts as ActivityAlert[]).filter((a) => a.type !== "premium"), [activityAlerts]);
  const totalAlerts = restaurantAlerts.length;
  const enabledAlerts = useMemo(() => (restaurantAlerts as RestaurantAlertWithRestaurant[]).filter((a) => a.enabled).length, [restaurantAlerts]);

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
        userPhone: phone || "",
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
      await markReadMutation.mutateAsync({ phone: phone || "" });
    } catch (err) {
      console.error("[Alerts] Mark read failed:", err);
    }
  };

  const handleRestaurantAlertPress = (restaurantId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/");
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: C.bg }}>
        <View className="flex-row items-center justify-between px-5 pt-2 pb-2">
          <View>
            <Text
              testID="alerts-header"
              style={{
                fontFamily: FONTS.displayBold,
                fontSize: 24,
                color: C.dark,
                letterSpacing: -0.5,
              }}
            >
              Bevakningar
            </Text>
            {unreadCount > 0 && activeTab === "activity" ? (
              <Text
                testID="unread-count"
                style={{
                  fontFamily: FONTS.regular,
                  fontSize: 13,
                  color: C.coral,
                  marginTop: 2,
                }}
              >
                {unreadCount} {unreadCount > 1 ? "nya händelser" : "ny händelse"}
              </Text>
            ) : null}
          </View>
          {activeTab === "activity" ? (
            <Pressable
              testID="mark-all-read-button"
              accessibilityLabel="Markera alla händelser som lästa"
              onPress={handleMarkAllRead}
              className="rounded-full px-3.5 py-2"
              style={{ backgroundColor: "rgba(0,0,0,0.04)" }}
            >
              <Text
                style={{
                  fontFamily: FONTS.medium,
                  fontSize: 12,
                  color: C.textSecondary,
                }}
              >
                Markera alla som lästa
              </Text>
            </Pressable>
          ) : null}
        </View>
        {/* Tab navigation */}
        <View style={{ flexDirection: "row", backgroundColor: "rgba(0,0,0,0.05)", borderRadius: RADIUS.md, padding: 3, marginHorizontal: SPACING.lg, marginBottom: SPACING.sm }}>
          {(["activity", "watches"] as const).map((tab) => (
            <Pressable
              key={tab}
              testID={`tab-${tab}`}
              accessibilityLabel={tab === "activity" ? "Visa aktivitet" : "Visa mina bevakningar"}
              onPress={() => { setActiveTab(tab); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              style={{ flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: activeTab === tab ? C.bgCard : "transparent", alignItems: "center" }}
            >
              <Text style={{ fontFamily: FONTS.semiBold, fontSize: 13, color: activeTab === tab ? C.dark : C.textTertiary }}>
                {tab === "activity" ? "Aktivitet" : "Mina bevakningar"}
              </Text>
            </Pressable>
          ))}
        </View>
      </SafeAreaView>

      <ScrollView
        testID="alerts-scroll"
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 4 }}
      >
        {alertsLoading ? (
          <AlertsSkeleton />
        ) : alertsError ? (
          <View testID="alerts-error" style={{ alignItems: "center", justifyContent: "center", paddingTop: 60 }}>
            <AlertCircle size={40} color={C.coral} strokeWidth={ICON.strokeWidth} />
            <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: C.dark, marginTop: 12 }}>
              Något gick fel
            </Text>
            <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textTertiary, marginTop: SPACING.xs, textAlign: "center", paddingHorizontal: SPACING.lg }}>
              Kunde inte ladda bevakningar. Försök igen senare.
            </Text>
            <Pressable
              testID="alerts-retry-button"
              accessibilityLabel="Försök igen"
              onPress={() => { alertsRefetch(); restaurantAlertsRefetch(); watchesRefetch(); }}
              style={{ marginTop: SPACING.md, backgroundColor: C.coral, borderRadius: RADIUS.md, paddingVertical: 12, paddingHorizontal: 28 }}
            >
              <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: "#FFFFFF" }}>
                Försök igen
              </Text>
            </Pressable>
          </View>
        ) : activeTab === "activity" ? (
          <>
            {/* Restaurant Alerts Section */}
            <Animated.View entering={FadeInDown.springify()}>
              <View className="px-5" style={{ marginBottom: 8 }}>
                <View className="flex-row items-center justify-between" style={{ marginBottom: 12 }}>
                  <View className="flex-row items-center" style={{ gap: 8 }}>
                    <Text
                      testID="restaurant-alerts-header"
                      style={{
                        fontFamily: FONTS.displaySemiBold,
                        fontSize: 16,
                        color: C.dark,
                        letterSpacing: -0.2,
                      }}
                    >
                      Restaurangbevakningar
                    </Text>
                    <View
                      style={{
                        backgroundColor: C.coralLight,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: RADIUS.sm,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: FONTS.semiBold,
                          fontSize: 11,
                          color: C.coral,
                        }}
                      >
                        {enabledAlerts} / {totalAlerts}
                      </Text>
                    </View>
                  </View>
                </View>

                {restaurantAlertsLoading ? (
                  <View testID="restaurant-alerts-loading" style={{ gap: 8 }}>
                    {[0, 1].map((i) => (
                      <View key={i} style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.md, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
                        <Skeleton width={56} height={56} style={{ borderRadius: RADIUS.md }} />
                        <View style={{ flex: 1, gap: 6 }}>
                          <Skeleton width="60%" height={14} />
                          <Skeleton width="80%" height={12} />
                        </View>
                      </View>
                    ))}
                  </View>
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
                  accessibilityLabel="Lägg till restaurangbevakning"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowAddAlert(true);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                    backgroundColor: C.bgCard,
                    borderRadius: RADIUS.md,
                    borderWidth: 1,
                    borderColor: C.borderLight,
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
                      backgroundColor: C.coralLight,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Plus size={16} color={C.coral} strokeWidth={ICON.strokeWidth} />
                  </View>
                  <Text
                    style={{
                      fontFamily: FONTS.semiBold,
                      fontSize: 14,
                      color: C.dark,
                      flex: 1,
                    }}
                  >
                    Lägg till bevakning
                  </Text>
                  <ChevronRight size={16} color={C.textTertiary} strokeWidth={2} />
                </Pressable>
              </View>
            </Animated.View>

            {/* Divider */}
            <View
              style={{
                height: 0.5,
                backgroundColor: C.borderLight,
                marginHorizontal: SPACING.lg,
                marginTop: 12,
                marginBottom: 16,
              }}
            />

            {/* Recent Activity Section */}
            <View className="px-5" style={{ marginBottom: 8 }}>
              <Text
                testID="recent-activity-header"
                style={{
                  fontFamily: FONTS.displaySemiBold,
                  fontSize: 16,
                  color: C.dark,
                  letterSpacing: -0.2,
                  marginBottom: 12,
                }}
              >
                Senaste händelser
              </Text>
            </View>

            <View className="px-5">
              {filteredActivityAlerts
                .map((alert, index) => (
                  <AlertItem key={alert.id} alert={alert} index={index} />
                ))}
            </View>

            {/* Empty state for activity if needed */}
            {filteredActivityAlerts.length === 0 ? (
              <View
                testID="empty-activity"
                style={{ alignItems: "center", justifyContent: "center", paddingTop: 40 }}
              >
                <Animated.View
                  entering={ZoomIn.delay(100).springify()}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: C.coralLight,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <Bell size={28} color={C.coral} strokeWidth={ICON.strokeWidth} />
                </Animated.View>
                <Animated.Text
                  entering={FadeInDown.delay(200).springify()}
                  style={{
                    fontFamily: FONTS.displayBold,
                    fontSize: 17,
                    color: C.dark,
                    letterSpacing: -0.3,
                  }}
                >
                  Inga händelser än
                </Animated.Text>
                <Animated.Text
                  entering={FadeInDown.delay(300).springify()}
                  style={{
                    fontFamily: FONTS.regular,
                    fontSize: 14,
                    color: C.textTertiary,
                    marginTop: 6,
                    textAlign: "center",
                    paddingHorizontal: 40,
                    lineHeight: 20,
                  }}
                >
                  Här visas dina händelser — när du lägger upp eller tar över bokningar
                </Animated.Text>
              </View>
            ) : null}
          </>
        ) : (
          <View style={{ flex: 1 }}>
            <Pressable
              testID="add-watch-button"
              accessibilityLabel="Lägg till bevakning"
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push("/add-watch"); }}
              style={{ marginHorizontal: SPACING.lg, marginTop: SPACING.md, marginBottom: SPACING.sm, backgroundColor: C.coral, borderRadius: RADIUS.md, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <Plus size={18} color="#FFFFFF" strokeWidth={ICON.strokeWidth} />
              <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: "#FFFFFF" }}>Lägg till bevakning</Text>
            </Pressable>

            {watchesLoading ? (
              <View testID="watches-loading" style={{ paddingHorizontal: SPACING.lg, marginTop: SPACING.md, gap: 10 }}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, padding: SPACING.md, flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <View style={{ flex: 1, gap: 6 }}>
                      <Skeleton width="50%" height={15} />
                      <Skeleton width="30%" height={12} />
                    </View>
                    <Skeleton width={32} height={32} style={{ borderRadius: 16 }} />
                  </View>
                ))}
              </View>
            ) : watches.length === 0 ? (
              <View
                testID="empty-watches"
                style={{ alignItems: "center", paddingTop: 60 }}
              >
                <Animated.View
                  entering={ZoomIn.delay(100).springify()}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: "rgba(59, 130, 246, 0.10)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <Eye size={28} color={C.info} strokeWidth={ICON.strokeWidth} />
                </Animated.View>
                <Animated.Text
                  entering={FadeInDown.delay(200).springify()}
                  style={{
                    fontFamily: FONTS.displayBold,
                    fontSize: 17,
                    color: C.dark,
                    letterSpacing: -0.3,
                  }}
                >
                  Inga bevakningar
                </Animated.Text>
                <Animated.Text
                  entering={FadeInDown.delay(300).springify()}
                  style={{
                    fontFamily: FONTS.regular,
                    fontSize: 14,
                    color: C.textTertiary,
                    marginTop: 6,
                    textAlign: "center",
                    paddingHorizontal: 40,
                    lineHeight: 20,
                  }}
                >
                  Bevaka restauranger för att få notiser om lediga bord
                </Animated.Text>
                <Animated.View entering={FadeInDown.delay(400).springify()}>
                  <Pressable
                    testID="empty-watches-cta"
                    accessibilityLabel="Lägg till bevakning"
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push("/add-watch");
                    }}
                    style={{
                      marginTop: 20,
                      backgroundColor: C.coral,
                      borderRadius: RADIUS.md,
                      paddingVertical: 14,
                      paddingHorizontal: 28,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Plus size={16} color="#FFFFFF" strokeWidth={ICON.strokeWidth} />
                    <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: "#FFFFFF" }}>
                      Lägg till bevakning
                    </Text>
                  </Pressable>
                </Animated.View>
              </View>
            ) : (
              <View style={{ paddingHorizontal: SPACING.lg, gap: 10, marginTop: 4 }}>
                {watches.map((watch: Watch, index: number) => {
                  const filters = parseWatchFilters(watch.filterOptions);
                  const WEEKDAY_LABELS_SHORT = ["Sön", "Mån", "Tis", "Ons", "Tor", "Fre", "Lör"];
                  return (
                    <Animated.View key={watch.id} entering={FadeInDown.delay(index * 60).springify()}>
                      <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, borderWidth: 0.5, borderColor: C.borderLight, padding: SPACING.md, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                              <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: C.dark }}>
                                {watch.restaurant?.name ?? "Valfri restaurang"}
                              </Text>
                              {/* Persistent badge */}
                              <View style={{ backgroundColor: "rgba(34,197,94,0.10)", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                                <Text style={{ fontFamily: FONTS.semiBold, fontSize: 9, color: C.success, textTransform: "uppercase", letterSpacing: 0.5 }}>Alltid aktiv</Text>
                              </View>
                            </View>
                            <View style={{ flexDirection: "row", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
                              {watch.date ? <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textTertiary }}>{watch.date}</Text> : null}
                              {watch.partySize ? <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textTertiary }}>{watch.partySize} pers</Text> : null}
                              {watch.notes ? <Text numberOfLines={1} style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textTertiary }}>{watch.notes}</Text> : null}
                            </View>
                          </View>
                          <Pressable
                            testID={`delete-watch-${watch.id}`}
                            accessibilityLabel={`Ta bort bevakning för ${watch.restaurant?.name ?? "valfri restaurang"}`}
                            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); deleteWatch({ id: watch.id, userPhone: phone! }); }}
                            style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: C.coralLight, alignItems: "center", justifyContent: "center" }}
                          >
                            <Trash2 size={15} color={C.coral} strokeWidth={2} />
                          </Pressable>
                        </View>
                        {/* Smart filter tags */}
                        {filters ? (
                          <View style={{ flexDirection: "row", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                            {filters.timeRange ? (
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(59,130,246,0.08)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                                <Clock size={11} color="#3B82F6" strokeWidth={2} />
                                <Text style={{ fontFamily: FONTS.medium, fontSize: 11, color: "#3B82F6" }}>{filters.timeRange[0]}–{filters.timeRange[1]}</Text>
                              </View>
                            ) : null}
                            {filters.weekdays && filters.weekdays.length > 0 ? (
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(126,200,122,0.12)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                                <Calendar size={11} color={C.success} strokeWidth={2} />
                                <Text style={{ fontFamily: FONTS.medium, fontSize: 11, color: C.success }}>{filters.weekdays.map((d) => WEEKDAY_LABELS_SHORT[d]).join(", ")}</Text>
                              </View>
                            ) : null}
                            {filters.partySize ? (
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(224,106,78,0.08)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                                <Users size={11} color={C.coral} strokeWidth={2} />
                                <Text style={{ fontFamily: FONTS.medium, fontSize: 11, color: C.coral }}>{filters.partySize} pers</Text>
                              </View>
                            ) : null}
                          </View>
                        ) : null}
                      </View>
                    </Animated.View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Add Alert Modal */}
      <Modal
        visible={showAddAlert}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddAlert(false)}
      >
        <View style={{ flex: 1, backgroundColor: C.bg }}>
          <SafeAreaView edges={["top"]} style={{ backgroundColor: C.bg }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: SPACING.lg,
                paddingTop: 4,
                paddingBottom: 14,
              }}
            >
              <View>
                <Text
                  testID="add-alert-modal-header"
                  style={{
                    fontFamily: FONTS.displayBold,
                    fontSize: 20,
                    color: C.dark,
                    letterSpacing: -0.4,
                  }}
                >
                  Lägg till bevakning
                </Text>
                <Text
                  style={{
                    fontFamily: FONTS.regular,
                    fontSize: 13,
                    color: C.textTertiary,
                    marginTop: 2,
                  }}
                >
                  Få ett meddelande när ett bord dyker upp
                </Text>
              </View>
              <Pressable
                testID="close-add-alert-modal"
                accessibilityLabel="Stäng dialogrutan"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowAddAlert(false);
                }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "rgba(0,0,0,0.05)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={17} color={C.textSecondary} strokeWidth={ICON.strokeWidth} />
              </Pressable>
            </View>
          </SafeAreaView>

          <View style={{ height: 0.5, backgroundColor: C.divider }} />

          {/* Search Bar */}
          <View style={{ paddingHorizontal: SPACING.lg, paddingTop: 12, paddingBottom: 8 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: C.bg,
                borderRadius: RADIUS.md,
                paddingHorizontal: 14,
                height: 44,
                borderWidth: 1,
                borderColor: searchQuery ? C.coralPressed : C.divider,
              }}
            >
              <Search size={16} color={C.textTertiary} strokeWidth={2} />
              <TextInput
                testID="restaurant-search"
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Sök restaurang..."
                placeholderTextColor="#D1D5DB"
                style={{
                  flex: 1,
                  fontFamily: FONTS.regular,
                  fontSize: 15,
                  color: C.dark,
                  marginLeft: 10,
                }}
              />
              {searchQuery ? (
                <Pressable
                  testID="clear-search"
                  accessibilityLabel="Rensa sökning"
                  onPress={() => setSearchQuery("")}
                  hitSlop={8}
                >
                  <X size={16} color={C.textTertiary} strokeWidth={ICON.strokeWidth} />
                </Pressable>
              ) : null}
            </View>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: SPACING.lg, gap: 10 }}
            showsVerticalScrollIndicator={false}
            onScrollBeginDrag={() => Keyboard.dismiss()}
          >
            {allRestaurants && allRestaurants.length > 0 ? (
              (() => {
                const lowerQuery = searchQuery.toLowerCase();
                const filtered = allRestaurants.filter((r: any) =>
                  r.name.toLowerCase().includes(lowerQuery)
                );
                return filtered.length > 0 ? (
                  filtered.map((restaurant: any, index: number) => {
                    const alreadyAdded =
                      restaurantAlerts.some((a: RestaurantAlertWithRestaurant) => a.restaurantId === restaurant.id) ||
                      addedIds.includes(restaurant.id);
                    return (
                      <Animated.View key={restaurant.id} entering={FadeInDown.delay(index * 60).springify()}>
                        <Pressable
                          testID={`add-restaurant-${restaurant.id}`}
                          accessibilityLabel={`Lägg till bevakning för ${restaurant.name}`}
                          onPress={() => {
                            if (!alreadyAdded) {
                              handleAddAlert(restaurant.id);
                            }
                          }}
                          style={{
                            backgroundColor: C.bgCard,
                            borderRadius: RADIUS.md,
                            padding: 14,
                            flexDirection: "row",
                            alignItems: "center",
                            borderWidth: 1,
                            borderColor: alreadyAdded
                              ? "rgba(74,140,107,0.30)"
                              : C.borderLight,
                            opacity: alreadyAdded ? 0.6 : 1,
                          }}
                        >
                          <Image
                            source={{ uri: restaurant.image }}
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 10,
                              backgroundColor: C.bgInput,
                              marginRight: 12,
                            }}
                            contentFit="cover"
            cachePolicy="memory-disk"
                          />
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontFamily: FONTS.semiBold,
                                fontSize: 15,
                                color: C.dark,
                                letterSpacing: -0.2,
                              }}
                              numberOfLines={1}
                            >
                              {restaurant.name}
                            </Text>
                            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 3, gap: 4 }}>
                              <Star size={11} color={C.gold} fill={C.gold} strokeWidth={0} />
                              <Text
                                style={{
                                  fontFamily: FONTS.medium,
                                  fontSize: 12,
                                  color: C.textTertiary,
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
                                ? "rgba(74,140,107,0.15)"
                                : C.coralLight,
                              alignItems: "center",
                              justifyContent: "center",
                              marginLeft: 10,
                            }}
                          >
                            {alreadyAdded ? (
                              <Check size={14} color={C.success} strokeWidth={ICON.strokeWidth} />
                            ) : (
                              <Plus size={14} color={C.coral} strokeWidth={ICON.strokeWidth} />
                            )}
                          </View>
                        </Pressable>
                      </Animated.View>
                    );
                  })
                ) : (
                  <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textTertiary, textAlign: "center", paddingTop: 40 }}>
                    Inga restauranger matchar "{searchQuery}"
                  </Text>
                );
              })()
            ) : (
              <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textTertiary, textAlign: "center", paddingTop: 20 }}>
                Hämtar restauranger...
              </Text>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
