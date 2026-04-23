import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Pressable, Switch } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Bell, Mail, MessageSquare } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { C, FONTS, SPACING, RADIUS } from "@/lib/theme";

type ToggleKey =
  | "notif_push_new_booking"
  | "notif_push_booking_taken"
  | "notif_push_reminder"
  | "notif_email_confirmation"
  | "notif_email_weekly"
  | "notif_sms_critical";

const DEFAULTS: Record<ToggleKey, boolean> = {
  notif_push_new_booking: true,
  notif_push_booking_taken: true,
  notif_push_reminder: true,
  notif_email_confirmation: true,
  notif_email_weekly: false,
  notif_sms_critical: true,
};

function ToggleRow({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
  isLast,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  isLast?: boolean;
}) {
  return (
    <Pressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onValueChange(!value); }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        borderBottomWidth: isLast ? 0 : 0.5,
        borderBottomColor: C.divider,
      }}
    >
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.overlayLight, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
        {icon}
      </View>
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={{ fontFamily: FONTS.medium, fontSize: 15, color: C.textPrimary }}>{title}</Text>
        <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textTertiary, marginTop: 2 }}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={(v) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onValueChange(v); }}
        trackColor={{ false: C.overlayMedium, true: "#7EC87A" }}
        thumbColor="#FFFFFF"
      />
    </Pressable>
  );
}

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const [toggles, setToggles] = useState<Record<ToggleKey, boolean>>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const keys = Object.keys(DEFAULTS) as ToggleKey[];
      const stored = await AsyncStorage.multiGet(keys);
      const parsed: Partial<Record<ToggleKey, boolean>> = {};
      for (const [key, val] of stored) {
        if (val !== null) {
          parsed[key as ToggleKey] = val === "true";
        }
      }
      setToggles({ ...DEFAULTS, ...parsed });
      setLoaded(true);
    })();
  }, []);

  const setToggle = useCallback((key: ToggleKey, value: boolean) => {
    setToggles((prev) => ({ ...prev, [key]: value }));
    AsyncStorage.setItem(key, String(value));
  }, []);

  if (!loaded) return null;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: C.bg }}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
          <Pressable
            testID="back-button"
            accessibilityLabel="Gå tillbaka"
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.borderLight, alignItems: "center", justifyContent: "center", marginRight: 12 }}
          >
            <ChevronLeft size={20} color={C.textSecondary} strokeWidth={2} />
          </Pressable>
          <Text style={{ fontFamily: FONTS.displayBold, fontSize: 20, color: C.textPrimary, letterSpacing: -0.4, flex: 1, textAlign: "center", marginRight: 48 }}>
            Notisinställningar
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80 }}>
        {/* PUSHNOTISER */}
        <Animated.View entering={FadeInDown.springify()}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8, marginBottom: 10 }}>
            <Bell size={14} color={C.textTertiary} strokeWidth={2} />
            <Text style={{ fontFamily: FONTS.semiBold, fontSize: 12, color: C.textTertiary, letterSpacing: 1, textTransform: "uppercase" }}>Pushnotiser</Text>
          </View>
          <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: C.borderLight, paddingHorizontal: 16 }}>
            <ToggleRow
              icon={<Bell size={16} color={C.textSecondary} strokeWidth={2} />}
              title="Ny bokning tillgänglig"
              subtitle="När en restaurang du bevakar får ny bokning"
              value={toggles.notif_push_new_booking}
              onValueChange={(v) => setToggle("notif_push_new_booking", v)}
            />
            <ToggleRow
              icon={<Bell size={16} color={C.textSecondary} strokeWidth={2} />}
              title="Bokning övertagen"
              subtitle="När någon tar din upplagda bokning"
              value={toggles.notif_push_booking_taken}
              onValueChange={(v) => setToggle("notif_push_booking_taken", v)}
            />
            <ToggleRow
              icon={<Bell size={16} color={C.textSecondary} strokeWidth={2} />}
              title="Påminnelse inför besök"
              subtitle="24 timmar innan din bokningsdag"
              value={toggles.notif_push_reminder}
              onValueChange={(v) => setToggle("notif_push_reminder", v)}
              isLast
            />
          </View>
        </Animated.View>

        {/* E-POSTNOTISER */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 28, marginBottom: 10 }}>
            <Mail size={14} color={C.textTertiary} strokeWidth={2} />
            <Text style={{ fontFamily: FONTS.semiBold, fontSize: 12, color: C.textTertiary, letterSpacing: 1, textTransform: "uppercase" }}>E-postnotiser</Text>
          </View>
          <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: C.borderLight, paddingHorizontal: 16 }}>
            <ToggleRow
              icon={<Mail size={16} color={C.textSecondary} strokeWidth={2} />}
              title="Bokningsbekräftelse"
              subtitle="Vid överlåtelse av bokning"
              value={toggles.notif_email_confirmation}
              onValueChange={(v) => setToggle("notif_email_confirmation", v)}
            />
            <ToggleRow
              icon={<Mail size={16} color={C.textSecondary} strokeWidth={2} />}
              title="Veckosammanfattning"
              subtitle="Tips och tillgängliga bord varje vecka"
              value={toggles.notif_email_weekly}
              onValueChange={(v) => setToggle("notif_email_weekly", v)}
              isLast
            />
          </View>
        </Animated.View>

        {/* SMS-NOTISER */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 28, marginBottom: 10 }}>
            <MessageSquare size={14} color={C.textTertiary} strokeWidth={2} />
            <Text style={{ fontFamily: FONTS.semiBold, fontSize: 12, color: C.textTertiary, letterSpacing: 1, textTransform: "uppercase" }}>SMS-notiser</Text>
          </View>
          <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: C.borderLight, paddingHorizontal: 16 }}>
            <ToggleRow
              icon={<MessageSquare size={16} color={C.textSecondary} strokeWidth={2} />}
              title="Kritiska uppdateringar"
              subtitle="Vid avbokning eller ändring av bokning"
              value={toggles.notif_sms_critical}
              onValueChange={(v) => setToggle("notif_sms_critical", v)}
              isLast
            />
          </View>
        </Animated.View>

        <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textTertiary, textAlign: "center", marginTop: 32, lineHeight: 18, paddingHorizontal: 12 }}>
          Du kan alltid ändra dessa inställningar. Pushnotiser kräver att du godkänt notiser i din telefon.
        </Text>
      </ScrollView>
    </View>
  );
}
