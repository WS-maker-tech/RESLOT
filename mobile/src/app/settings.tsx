import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useProfile } from "@/lib/api/hooks";
import { useAuthStore } from "@/lib/auth-store";
import { supabase } from "@/lib/supabase";
import { C, FONTS, SPACING, RADIUS } from "@/lib/theme";

const CITIES = ["Stockholm", "Göteborg", "Malmö", "Uppsala", "Västerås", "Örebro", "Linköping", "Helsingborg", "Jönköping", "Norrköping"];

function formatDate(date: Date): string {
  const months = [
    "jan", "feb", "mar", "apr", "maj", "jun",
    "jul", "aug", "sep", "okt", "nov", "dec",
  ];
  const d = date.getDate().toString().padStart(2, "0");
  const m = months[date.getMonth()];
  const y = date.getFullYear();
  return `${d} ${m} ${y}`;
}

export default function SettingsScreen() {
  const router = useRouter();
  const phone = useAuthStore((s) => s.phoneNumber);
  const { data: profile } = useProfile(phone || "");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthdate, setBirthdate] = useState<Date | null>(null);
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Original values for dirty check
  const [origValues, setOrigValues] = useState({
    firstName: "",
    lastName: "",
    birthdate: null as Date | null,
    city: "",
    email: "",
    phoneNumber: "",
  });

  useEffect(() => {
    if (profile) {
      const vals = {
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        birthdate: profile.dateOfBirth ? new Date(profile.dateOfBirth) : null,
        city: profile.selectedCity || "",
        email: profile.email || "",
        phoneNumber: profile.phone?.replace("+46", "") || "",
      };
      setFirstName(vals.firstName);
      setLastName(vals.lastName);
      setBirthdate(vals.birthdate);
      setCity(vals.city);
      setEmail(vals.email);
      setPhoneNumber(vals.phoneNumber);
      setOrigValues(vals);
    }
  }, [profile]);

  const isDirty = useMemo(() => {
    return (
      firstName !== origValues.firstName ||
      lastName !== origValues.lastName ||
      (birthdate?.getTime() ?? 0) !== (origValues.birthdate?.getTime() ?? 0) ||
      city !== origValues.city ||
      email !== origValues.email ||
      phoneNumber !== origValues.phoneNumber
    );
  }, [firstName, lastName, birthdate, city, email, phoneNumber, origValues]);

  const maxBirthdate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d;
  }, []);

  const handleSave = useCallback(async () => {
    if (!isDirty || saving) return;
    setSaving(true);
    setErrorMsg("");
    try {
      const { error } = await supabase
        .from("UserProfile")
        .update({
          firstName,
          lastName,
          dateOfBirth: birthdate ? birthdate.toISOString() : null,
          selectedCity: city,
          email,
          phone: phoneNumber ? `+46${phoneNumber}` : phone,
        })
        .eq("phone", phone);

      if (error) {
        setErrorMsg("Kunde inte spara. Försök igen.");
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.back();
      }
    } catch {
      setErrorMsg("Något gick fel. Försök igen.");
    } finally {
      setSaving(false);
    }
  }, [isDirty, saving, firstName, lastName, birthdate, city, email, phoneNumber, phone, router]);

  const handleDeleteAccount = useCallback(async () => {
    if (deleteConfirmText !== "RADERA") return;
    try {
      await supabase.from("UserProfile").delete().eq("phone", phone);
      const logout = useAuthStore.getState().logout;
      logout();
      router.replace("/onboarding");
    } catch {
      setErrorMsg("Kunde inte radera kontot. Försök igen.");
    }
  }, [deleteConfirmText, phone, router]);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: C.bg }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: SPACING.lg,
            paddingTop: 8,
            paddingBottom: 12,
          }}
        >
          <Pressable
            testID="settings-back"
            onPress={() => router.back()}
            hitSlop={12}
          >
            <ChevronLeft size={24} color={C.textPrimary} strokeWidth={2} />
          </Pressable>

          <Text
            style={{
              fontFamily: FONTS.displayBold,
              fontSize: 20,
              color: C.textPrimary,
              letterSpacing: -0.3,
            }}
          >
            Kontoinställningar
          </Text>

          <Pressable
            testID="settings-save"
            onPress={handleSave}
            disabled={!isDirty || saving}
            hitSlop={12}
          >
            <Text
              style={{
                fontFamily: FONTS.semiBold,
                fontSize: 15,
                color: isDirty ? "#7EC87A" : C.textTertiary,
                opacity: isDirty ? 1 : 0.4,
              }}
            >
              Spara
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: SPACING.lg }}
        keyboardShouldPersistTaps="handled"
      >
        {errorMsg ? (
          <Text
            style={{
              fontFamily: FONTS.medium,
              fontSize: 13,
              color: C.error,
              textAlign: "center",
              marginBottom: SPACING.md,
            }}
          >
            {errorMsg}
          </Text>
        ) : null}

        {/* PERSONUPPGIFTER */}
        <Text
          style={{
            fontFamily: FONTS.semiBold,
            fontSize: 11,
            letterSpacing: 1.5,
            color: C.textTertiary,
            textTransform: "uppercase",
            marginTop: SPACING.lg,
            marginBottom: SPACING.sm,
            paddingHorizontal: 4,
          }}
        >
          PERSONUPPGIFTER
        </Text>

        <View
          style={{
            backgroundColor: C.bgCard,
            borderRadius: RADIUS.lg,
            borderWidth: 1,
            borderColor: C.borderLight,
          }}
        >
          {/* Förnamn */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: 0.5,
              borderBottomColor: C.divider,
            }}
          >
            <Text style={{ fontFamily: FONTS.regular, fontSize: 15, color: C.textTertiary, width: 100 }}>
              Förnamn
            </Text>
            <TextInput
              testID="input-first-name"
              value={firstName}
              onChangeText={setFirstName}
              style={{
                flex: 1,
                fontFamily: FONTS.medium,
                fontSize: 15,
                color: C.textPrimary,
                padding: 0,
                textAlign: "right",
              }}
              placeholder="Ange förnamn"
              placeholderTextColor={C.textTertiary}
            />
          </View>

          {/* Efternamn */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: 0.5,
              borderBottomColor: C.divider,
            }}
          >
            <Text style={{ fontFamily: FONTS.regular, fontSize: 15, color: C.textTertiary, width: 100 }}>
              Efternamn
            </Text>
            <TextInput
              testID="input-last-name"
              value={lastName}
              onChangeText={setLastName}
              style={{
                flex: 1,
                fontFamily: FONTS.medium,
                fontSize: 15,
                color: C.textPrimary,
                padding: 0,
                textAlign: "right",
              }}
              placeholder="Ange efternamn"
              placeholderTextColor={C.textTertiary}
            />
          </View>

          {/* Födelsedag */}
          <Pressable
            testID="input-birthdate"
            onPress={() => setShowDatePicker(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: 0.5,
              borderBottomColor: C.divider,
            }}
          >
            <Text style={{ fontFamily: FONTS.regular, fontSize: 15, color: C.textTertiary, width: 100 }}>
              Födelsedatum{" "}
              <Text style={{ fontFamily: FONTS.regular, fontSize: 12, color: C.textTertiary, opacity: 0.6 }}>(valfritt)</Text>
            </Text>
            <Text
              style={{
                flex: 1,
                fontFamily: FONTS.medium,
                fontSize: 15,
                color: birthdate ? C.textPrimary : C.textTertiary,
                textAlign: "right",
              }}
            >
              {birthdate ? formatDate(birthdate) : "Ange födelsedatum"}
            </Text>
          </Pressable>

          {/* Stad */}
          <Pressable
            testID="input-city"
            onPress={() => setShowCityModal(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}
          >
            <Text style={{ fontFamily: FONTS.regular, fontSize: 15, color: C.textTertiary, width: 100 }}>
              Stad
            </Text>
            <Text
              style={{
                flex: 1,
                fontFamily: FONTS.medium,
                fontSize: 15,
                color: city ? C.textPrimary : C.textTertiary,
                textAlign: "right",
              }}
            >
              {city || "Välj stad"}
            </Text>
          </Pressable>
        </View>

        {/* KONTAKTUPPGIFTER */}
        <Text
          style={{
            fontFamily: FONTS.semiBold,
            fontSize: 11,
            letterSpacing: 1.5,
            color: C.textTertiary,
            textTransform: "uppercase",
            marginTop: 28,
            marginBottom: SPACING.sm,
            paddingHorizontal: 4,
          }}
        >
          KONTAKTUPPGIFTER
        </Text>

        <View
          style={{
            backgroundColor: C.bgCard,
            borderRadius: RADIUS.lg,
            borderWidth: 1,
            borderColor: C.borderLight,
          }}
        >
          {/* E-post */}
          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: 14,
              paddingBottom: 10,
              borderBottomWidth: 0.5,
              borderBottomColor: C.divider,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ fontFamily: FONTS.regular, fontSize: 15, color: C.textTertiary, width: 100 }}>
                E-post
              </Text>
              <TextInput
                testID="input-email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={{
                  flex: 1,
                  fontFamily: FONTS.medium,
                  fontSize: 15,
                  color: C.textPrimary,
                  padding: 0,
                  textAlign: "right",
                }}
                placeholder="din@email.se"
                placeholderTextColor={C.textTertiary}
              />
            </View>
            <Text
              style={{
                fontFamily: FONTS.regular,
                fontSize: 11,
                color: C.textTertiary,
                marginTop: 6,
                lineHeight: 15,
              }}
            >
              Används för inloggning. Ett bekräftelsemejl skickas vid ändring.
            </Text>
          </View>

          {/* Mobilnummer */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}
          >
            <Text style={{ fontFamily: FONTS.regular, fontSize: 15, color: C.textTertiary, width: 100 }}>
              Mobilnummer
            </Text>
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "flex-end" }}>
              <Text style={{ fontFamily: FONTS.medium, fontSize: 15, color: C.textTertiary, marginRight: 4 }}>
                +46
              </Text>
              <TextInput
                testID="input-phone"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                style={{
                  fontFamily: FONTS.medium,
                  fontSize: 15,
                  color: C.textPrimary,
                  padding: 0,
                  minWidth: 120,
                  textAlign: "right",
                }}
                placeholder="070-123 45 67"
                placeholderTextColor={C.textTertiary}
              />
            </View>
          </View>
        </View>

        {/* Integritetstext */}
        <Text
          style={{
            fontFamily: FONTS.regular,
            fontSize: 12,
            color: C.textTertiary,
            textAlign: "center",
            marginTop: 8,
          }}
        >
          {"🔒 Dina uppgifter är privata och visas inte för andra användare."}
        </Text>

        {/* SÄKERHET */}
        <Text
          style={{
            fontFamily: FONTS.semiBold,
            fontSize: 11,
            letterSpacing: 1.5,
            color: C.textTertiary,
            textTransform: "uppercase",
            marginTop: 28,
            marginBottom: SPACING.sm,
            paddingHorizontal: 4,
          }}
        >
          SÄKERHET
        </Text>

        <Pressable
          testID="change-password"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/change-password");
          }}
          style={{
            backgroundColor: C.bgCard,
            borderRadius: RADIUS.lg,
            borderWidth: 1,
            borderColor: C.borderLight,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 14,
          }}
        >
          <Text style={{ fontFamily: FONTS.medium, fontSize: 15, color: C.textPrimary, flex: 1 }}>
            Byt lösenord
          </Text>
          <ChevronRight size={18} color={C.textTertiary} strokeWidth={2} />
        </Pressable>

        {/* NOTISER */}
        <Text
          style={{
            fontFamily: FONTS.semiBold,
            fontSize: 11,
            letterSpacing: 1.5,
            color: C.textTertiary,
            textTransform: "uppercase",
            marginTop: 28,
            marginBottom: SPACING.sm,
            paddingHorizontal: 4,
          }}
        >
          NOTISER
        </Text>

        <Pressable
          testID="notification-settings"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/notification-settings");
          }}
          style={{
            backgroundColor: C.bgCard,
            borderRadius: RADIUS.lg,
            borderWidth: 1,
            borderColor: C.borderLight,
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 14,
          }}
        >
          <Text style={{ fontFamily: FONTS.medium, fontSize: 15, color: C.textPrimary, flex: 1 }}>
            Notisinställningar
          </Text>
          <ChevronRight size={18} color={C.textTertiary} strokeWidth={2} />
        </Pressable>

        {/* Radera konto */}
        <Pressable
          testID="delete-account"
          onPress={() => setShowDeleteModal(true)}
          style={{ marginTop: 36, alignItems: "center", paddingVertical: 12 }}
        >
          <Text style={{ fontFamily: FONTS.medium, fontSize: 14, color: C.error }}>
            Radera konto
          </Text>
        </Pressable>
      </ScrollView>

      {/* DateTimePicker */}
      {showDatePicker ? (
        Platform.OS === "web" ? (
          <Modal transparent animationType="fade" onRequestClose={() => setShowDatePicker(false)}>
            <Pressable
              style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" }}
              onPress={() => setShowDatePicker(false)}
            >
              <Pressable
                onPress={() => {}}
                style={{
                  backgroundColor: C.bgCard,
                  borderRadius: RADIUS.xl,
                  padding: 24,
                  marginHorizontal: 32,
                  width: 320,
                }}
              >
                <Text style={{ fontFamily: FONTS.displayBold, fontSize: 18, color: C.textPrimary, marginBottom: 16, textAlign: "center" }}>
                  Välj födelsedatum
                </Text>
                <TextInput
                  testID="web-date-input"
                  placeholder="ÅÅÅÅ-MM-DD"
                  placeholderTextColor={C.textTertiary}
                  value={birthdate ? birthdate.toISOString().split("T")[0] : ""}
                  onChangeText={(text) => {
                    const parsed = new Date(text);
                    if (!isNaN(parsed.getTime()) && parsed <= maxBirthdate) {
                      setBirthdate(parsed);
                    }
                  }}
                  style={{
                    fontFamily: FONTS.medium,
                    fontSize: 16,
                    color: C.textPrimary,
                    borderWidth: 1,
                    borderColor: C.borderLight,
                    borderRadius: RADIUS.md,
                    padding: 12,
                    textAlign: "center",
                    marginBottom: 16,
                  }}
                />
                <Pressable
                  onPress={() => setShowDatePicker(false)}
                  style={{
                    backgroundColor: C.dark,
                    borderRadius: RADIUS.md,
                    paddingVertical: 12,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: C.white }}>Klar</Text>
                </Pressable>
              </Pressable>
            </Pressable>
          </Modal>
        ) : (
          <DateTimePicker
            value={birthdate ?? maxBirthdate}
            mode="date"
            maximumDate={maxBirthdate}
            display="spinner"
            onChange={(_, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setBirthdate(selectedDate);
            }}
          />
        )
      ) : null}

      {/* City Modal */}
      <Modal
        visible={showCityModal}
        transparent
        animationType="fade"
        onRequestClose={() => { setShowCityModal(false); setCitySearch(""); }}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" }}
          onPress={() => { setShowCityModal(false); setCitySearch(""); }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: C.bgCard,
              borderRadius: RADIUS.xl,
              padding: 24,
              marginHorizontal: 32,
              width: 320,
              maxHeight: 480,
            }}
          >
            <Text style={{ fontFamily: FONTS.displayBold, fontSize: 18, color: C.textPrimary, marginBottom: 12, textAlign: "center" }}>
              Välj stad
            </Text>
            <TextInput
              testID="city-search-input"
              value={citySearch}
              onChangeText={setCitySearch}
              placeholder="Sök stad..."
              placeholderTextColor={C.textTertiary}
              autoFocus
              style={{
                fontFamily: FONTS.regular,
                fontSize: 15,
                color: C.textPrimary,
                borderWidth: 1,
                borderColor: C.borderLight,
                borderRadius: RADIUS.md,
                padding: 10,
                marginBottom: 12,
              }}
            />
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
              {CITIES.filter((c) => c.toLowerCase().includes(citySearch.toLowerCase())).map((c, idx, arr) => (
                <Pressable
                  key={c}
                  testID={`city-${c.toLowerCase()}`}
                  onPress={() => {
                    setCity(c);
                    setShowCityModal(false);
                    setCitySearch("");
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={{
                    paddingVertical: 14,
                    borderBottomWidth: idx === arr.length - 1 ? 0 : 0.5,
                    borderBottomColor: C.divider,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: city === c ? FONTS.semiBold : FONTS.regular,
                      fontSize: 16,
                      color: city === c ? "#7EC87A" : C.textPrimary,
                    }}
                  >
                    {c}
                  </Text>
                  {city === c ? (
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#7EC87A" }} />
                  ) : null}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" }}
          onPress={() => setShowDeleteModal(false)}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: C.bgCard,
              borderRadius: RADIUS.xl,
              padding: 28,
              marginHorizontal: 24,
              width: "85%",
              maxWidth: 360,
            }}
          >
            <Text style={{ fontFamily: FONTS.displayBold, fontSize: 20, color: C.textPrimary, marginBottom: 12 }}>
              Radera konto
            </Text>
            <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: C.textTertiary, lineHeight: 20, marginBottom: 20 }}>
              Det här går inte att ångra. Alla dina uppgifter och credits raderas permanent.
            </Text>
            <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: C.textSecondary, marginBottom: 8 }}>
              {"Skriv \"RADERA\" för att bekräfta:"}
            </Text>
            <TextInput
              testID="delete-confirm-input"
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="RADERA"
              placeholderTextColor={C.textTertiary}
              autoCapitalize="characters"
              style={{
                fontFamily: FONTS.medium,
                fontSize: 16,
                color: C.textPrimary,
                borderWidth: 1,
                borderColor: deleteConfirmText === "RADERA" ? C.error : C.borderLight,
                borderRadius: RADIUS.md,
                padding: 12,
                textAlign: "center",
                marginBottom: 20,
              }}
            />
            <Pressable
              testID="confirm-delete"
              onPress={handleDeleteAccount}
              disabled={deleteConfirmText !== "RADERA"}
              style={{
                backgroundColor: deleteConfirmText === "RADERA" ? C.error : C.bgInput,
                borderRadius: RADIUS.md,
                paddingVertical: 14,
                alignItems: "center",
                marginBottom: 10,
                opacity: deleteConfirmText === "RADERA" ? 1 : 0.5,
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.semiBold,
                  fontSize: 15,
                  color: deleteConfirmText === "RADERA" ? C.white : C.textTertiary,
                }}
              >
                Bekräfta radering
              </Text>
            </Pressable>
            <Pressable
              testID="cancel-delete"
              onPress={() => {
                setShowDeleteModal(false);
                setDeleteConfirmText("");
              }}
              style={{
                borderRadius: RADIUS.md,
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ fontFamily: FONTS.medium, fontSize: 15, color: C.textSecondary }}>
                Avbryt
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
