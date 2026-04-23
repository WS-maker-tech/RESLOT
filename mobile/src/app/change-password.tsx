import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, Eye, EyeOff, CheckCircle } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, FadeOutUp } from "react-native-reanimated";
import { C, FONTS, SPACING, RADIUS } from "@/lib/theme";
import { supabase } from "@/lib/supabase";

export default function ChangePasswordScreen() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const newTooShort = newPassword.length > 0 && newPassword.length < 8;
  const confirmMismatch = confirmPassword.length > 0 && confirmPassword !== newPassword;
  const allFilled = currentPassword.length > 0 && newPassword.length >= 8 && confirmPassword === newPassword;

  const handleSave = async () => {
    if (!allFilled) return;
    setSaving(true);
    setErrorMessage("");
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setErrorMessage(error.message);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowSuccess(true);
        setTimeout(() => {
          router.back();
        }, 1200);
      }
    } catch {
      setErrorMessage("Något gick fel. Försök igen.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: C.bg }}>
        {showSuccess ? (
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
              Lösenord uppdaterat!
            </Text>
          </Animated.View>
        ) : null}
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
            Byt lösenord
          </Text>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.springify()}>
          <View style={{ backgroundColor: C.bgCard, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: C.borderLight, padding: 20, marginTop: 8 }}>
            {/* Nuvarande lösenord */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: C.textSecondary, marginBottom: 6 }}>Nuvarande lösenord</Text>
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: C.bgInput, borderRadius: RADIUS.md, borderWidth: 0.5, borderColor: C.borderLight }}>
                <TextInput
                  testID="current-password-input"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Ange nuvarande lösenord"
                  placeholderTextColor={C.textTertiary}
                  secureTextEntry={!showCurrent}
                  style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 13, fontFamily: FONTS.regular, fontSize: 15, color: C.textPrimary }}
                />
                <Pressable onPress={() => setShowCurrent(!showCurrent)} style={{ paddingHorizontal: 14 }}>
                  {showCurrent ? <EyeOff size={18} color={C.textTertiary} strokeWidth={2} /> : <Eye size={18} color={C.textTertiary} strokeWidth={2} />}
                </Pressable>
              </View>
            </View>

            {/* Nytt lösenord */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: C.textSecondary, marginBottom: 6 }}>Nytt lösenord</Text>
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: C.bgInput, borderRadius: RADIUS.md, borderWidth: 0.5, borderColor: newTooShort ? C.error : C.borderLight }}>
                <TextInput
                  testID="new-password-input"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Ange nytt lösenord"
                  placeholderTextColor={C.textTertiary}
                  secureTextEntry={!showNew}
                  style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 13, fontFamily: FONTS.regular, fontSize: 15, color: C.textPrimary }}
                />
                <Pressable onPress={() => setShowNew(!showNew)} style={{ paddingHorizontal: 14 }}>
                  {showNew ? <EyeOff size={18} color={C.textTertiary} strokeWidth={2} /> : <Eye size={18} color={C.textTertiary} strokeWidth={2} />}
                </Pressable>
              </View>
              {newTooShort ? (
                <Text style={{ fontFamily: FONTS.regular, fontSize: 11, color: C.error, marginTop: 4 }}>Minst 8 tecken</Text>
              ) : (
                <Text style={{ fontFamily: FONTS.regular, fontSize: 11, color: C.textTertiary, marginTop: 4 }}>Minst 8 tecken</Text>
              )}
            </View>

            {/* Bekräfta nytt lösenord */}
            <View>
              <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: C.textSecondary, marginBottom: 6 }}>Bekräfta nytt lösenord</Text>
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: C.bgInput, borderRadius: RADIUS.md, borderWidth: 0.5, borderColor: confirmMismatch ? C.error : C.borderLight }}>
                <TextInput
                  testID="confirm-password-input"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Upprepa nytt lösenord"
                  placeholderTextColor={C.textTertiary}
                  secureTextEntry={!showConfirm}
                  style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 13, fontFamily: FONTS.regular, fontSize: 15, color: C.textPrimary }}
                />
                <Pressable onPress={() => setShowConfirm(!showConfirm)} style={{ paddingHorizontal: 14 }}>
                  {showConfirm ? <EyeOff size={18} color={C.textTertiary} strokeWidth={2} /> : <Eye size={18} color={C.textTertiary} strokeWidth={2} />}
                </Pressable>
              </View>
              {confirmMismatch ? (
                <Text style={{ fontFamily: FONTS.regular, fontSize: 11, color: C.error, marginTop: 4 }}>Lösenorden matchar inte</Text>
              ) : null}
            </View>
          </View>

          {errorMessage ? (
            <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.error, textAlign: "center", marginTop: 16 }}>{errorMessage}</Text>
          ) : null}

          <Pressable
            testID="save-password-button"
            accessibilityLabel="Spara nytt lösenord"
            onPress={handleSave}
            disabled={!allFilled || saving}
            style={{
              backgroundColor: C.pistachio,
              borderRadius: RADIUS.full,
              paddingVertical: 16,
              alignItems: "center",
              marginTop: 28,
              opacity: allFilled && !saving ? 1 : 0.4,
            }}
          >
            {saving ? (
              <ActivityIndicator color={C.dark} size="small" />
            ) : (
              <Text style={{ fontFamily: FONTS.bold, fontSize: 16, color: C.dark }}>Spara nytt lösenord</Text>
            )}
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
