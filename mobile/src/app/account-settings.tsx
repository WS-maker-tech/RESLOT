import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, Modal, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Check, AlertTriangle, CheckCircle } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { useProfile } from "@/lib/api/hooks";
import { useAuthStore } from "@/lib/auth-store";
import { C, FONTS, SPACING, RADIUS, SHADOW, ICON } from "@/lib/theme";

function InputField({
  label, value, onChangeText, placeholder, keyboardType = "default", verified, editable = true,
}: {
  label: string; value: string; onChangeText: (v: string) => void; placeholder?: string;
  keyboardType?: "default" | "email-address" | "phone-pad"; verified?: boolean; editable?: boolean;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6, gap: 6 }}>
        <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: C.textSecondary }}>{label}</Text>
        {verified !== undefined ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: verified ? C.successLight : "rgba(201,169,110,0.15)", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
            <Check size={10} color={verified ? C.success : C.gold} strokeWidth={3} />
            <Text style={{ fontFamily: FONTS.semiBold, fontSize: 12, color: verified ? C.success : C.gold }}>
              {verified ? "Verifierad" : "Ej verifierad"}
            </Text>
          </View>
        ) : null}
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.textTertiary}
        keyboardType={keyboardType}
        editable={editable}
        style={{ backgroundColor: editable ? C.bgCard : "rgba(0,0,0,0.03)", borderRadius: RADIUS.md, paddingHorizontal: 16, paddingVertical: 13, fontFamily: FONTS.regular, fontSize: 15, color: editable ? C.textPrimary : C.textTertiary, borderWidth: 0.5, borderColor: C.borderLight }}
      />
    </View>
  );
}

export default function AccountSettingsScreen() {
  const router = useRouter();
  const phone = useAuthStore((s) => s.phoneNumber);
  const logout = useAuthStore((s) => s.logout);
  const sessionToken = useAuthStore((s) => s.sessionToken);
  const { data: profile, isLoading } = useProfile(phone || "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [city, setCity] = useState("Stockholm");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
      setEmail(profile.email);
      setDateOfBirth(profile.dateOfBirth ?? "");
      setCity(profile.selectedCity);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!phone) return;
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL!;
      await fetch(`${baseUrl}/api/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ phone, firstName, lastName, email, dateOfBirth, selectedCity: city }),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowSaveSuccess(true);
      setTimeout(() => {
        setShowSaveSuccess(false);
      }, 2000);
    } catch (err) {
      console.error("[AccountSettings] Save failed:", err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!phone) return;
    try {
      const baseUrl = process.env.EXPO_PUBLIC_BACKEND_URL!;
      await fetch(`${baseUrl}/api/profile`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionToken}` },
        body: JSON.stringify({ phone }),
      });
      setShowDeleteConfirm(false);
      logout();
      router.replace("/onboarding");
    } catch (err) {
      console.error("[AccountSettings] Delete account failed:", err);
      setShowDeleteConfirm(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Fel", "Kunde inte radera kontot. Försök igen senare.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: C.bg }}>
        {showSaveSuccess ? (
          <Animated.View
            entering={FadeInDown.springify()}
            exiting={FadeOutUp.duration(300)}
            style={{
              backgroundColor: C.success,
              marginHorizontal: 20,
              borderRadius: 12,
              paddingVertical: 10,
              paddingHorizontal: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              marginBottom: 4,
            }}
          >
            <CheckCircle size={18} color={C.bgCard} strokeWidth={2.5} />
            <Text style={{ fontFamily: FONTS.semiBold, fontSize: 14, color: C.bgCard }}>
              Ändringarna har sparats
            </Text>
          </Animated.View>
        ) : null}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
          <Pressable testID="back-button" accessibilityLabel="Gå tillbaka" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.borderLight, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
            <ChevronLeft size={20} color={C.textSecondary} strokeWidth={2} />
          </Pressable>
          <Text style={{ fontFamily: FONTS.displayBold, fontSize: 20, color: C.textPrimary, letterSpacing: -0.4, flex: 1 }}>Kontoinställningar</Text>
          <Pressable testID="save-button" accessibilityLabel="Spara ändringar" onPress={handleSave} disabled={saving} style={{ backgroundColor: C.coral, borderRadius: RADIUS.md, paddingHorizontal: 16, paddingVertical: 8 }}>
            {saving ? <ActivityIndicator color="#111827" size="small" /> : <Text style={{ fontFamily: FONTS.semiBold, fontSize: 14, color: "#111827" }}>Spara</Text>}
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80 }}>
        {isLoading ? <ActivityIndicator color={C.coral} style={{ marginTop: 40 }} /> : (
          <>
            <Animated.View entering={FadeInDown.springify()}>
              <Text style={{ fontFamily: FONTS.semiBold, fontSize: 12, color: C.textTertiary, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14, marginTop: 8 }}>Personuppgifter</Text>
              <InputField label="Förnamn" value={firstName} onChangeText={setFirstName} placeholder="Anna" />
              <InputField label="Efternamn" value={lastName} onChangeText={setLastName} placeholder="Svensson" />
              <InputField label="Födelsedag" value={dateOfBirth} onChangeText={setDateOfBirth} placeholder="ÅÅÅÅ-MM-DD" />
              <InputField label="Stad" value={city} onChangeText={setCity} placeholder="Stockholm" />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(100).springify()}>
              <Text style={{ fontFamily: FONTS.semiBold, fontSize: 12, color: C.textTertiary, letterSpacing: 1, textTransform: "uppercase", marginBottom: 14, marginTop: 24 }}>Kontaktuppgifter</Text>
              <InputField label="E-post" value={email} onChangeText={setEmail} placeholder="anna@example.com" keyboardType="email-address" verified={profile?.emailVerified} />
              <InputField label="Telefon" value={phone ?? ""} onChangeText={() => {}} placeholder={phone ?? ""} keyboardType="phone-pad" verified={profile?.phoneVerified} editable={false} />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <Pressable
                testID="delete-account-button"
                accessibilityLabel="Radera konto"
                onPress={() => { setShowDeleteConfirm(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); }}
                style={{ marginTop: 40, paddingVertical: 14, borderRadius: 14, borderWidth: 1, borderColor: C.coralPressed, alignItems: "center" }}
              >
                <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: C.coral }}>Radera konto</Text>
              </Pressable>
            </Animated.View>
          </>
        )}
      </ScrollView>

      <Modal visible={showDeleteConfirm} transparent animationType="fade" onRequestClose={() => setShowDeleteConfirm(false)}>
        <Pressable accessibilityLabel="Stäng dialogrutan" style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" }} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowDeleteConfirm(false); }}>
          <Pressable accessibilityLabel="Bekräfta radering av konto" onPress={() => {}} style={{ backgroundColor: C.bgCard, borderRadius: 24, padding: 28, marginHorizontal: 32, alignItems: "center" }}>
            <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: C.coralLight, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <AlertTriangle size={24} color={C.coral} strokeWidth={2} />
            </View>
            <Text style={{ fontFamily: FONTS.bold, fontSize: 18, color: C.textPrimary, letterSpacing: -0.3, textAlign: "center" }}>Radera konto?</Text>
            <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textSecondary, marginTop: 8, textAlign: "center", lineHeight: 20 }}>
              Det här går inte att ångra. All din data raderas permanent i enlighet med GDPR.
            </Text>
            <View style={{ flexDirection: "row", gap: 12, marginTop: 24, width: "100%" }}>
              <Pressable accessibilityLabel="Avbryt" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowDeleteConfirm(false); }} style={{ flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: C.borderLight, alignItems: "center" }}>
                <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: C.textPrimary }}>Avbryt</Text>
              </Pressable>
              <Pressable testID="confirm-delete-button" accessibilityLabel="Bekräfta radering" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); handleDeleteAccount(); }} style={{ flex: 1, paddingVertical: 13, borderRadius: RADIUS.md, backgroundColor: C.coral, alignItems: "center" }}>
                <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: "#111827" }}>Radera</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
