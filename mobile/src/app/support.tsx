import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Linking,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Mail,
  Bell,
  Send,
  CheckCircle,
  HelpCircle,
  AlertCircle,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { C, FONTS, SPACING, RADIUS, SHADOW } from "@/lib/theme";
import { useSubmitSupportMessage } from "@/lib/api/hooks";
import { useAuthStore } from "@/lib/auth-store";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQ_ITEMS = [
  {
    q: "Hur fungerar Reslot?",
    a: "Reslot låter dig ta över restaurangbokningar från andra som inte kan gå. Allt sker direkt mellan användare.",
  },
  {
    q: "Vad är Reslot credits?",
    a: "Credits är din valuta i Reslot. Lägg upp ett bord, bjud in en vän eller köp credits — sedan snappas bord.",
  },
  {
    q: "Kan jag ångra en bokning jag tagit över?",
    a: "Ja, så länge du avbokar inom avbokningsfönstret. Efter det gäller restaurangens villkor.",
  },
];

const COMMON_PROBLEMS = [
  {
    q: "Jag kan inte logga in",
    a: "Kontrollera att du anger rätt telefonnummer. Om du fortsätter ha problem, prova att starta om appen eller kontakta oss via e-post.",
  },
  {
    q: "Min bokning syns inte",
    a: "Det kan ta några sekunder för en ny bokning att dyka upp. Dra ned för att uppdatera. Om det fortsätter, kontakta support.",
  },
  {
    q: "Jag blev debiterad felaktigt",
    a: "Kontakta oss via e-post på support@reslot.se med ditt bokningsnummer så utreder vi ärendet.",
  },
  {
    q: "Push-notiser fungerar inte",
    a: "Gå till telefonens inställningar > Reslot > Notiser och kontrollera att notiser är aktiverade.",
  },
];

function AccordionItem({
  question,
  answer,
  delay,
}: {
  question: string;
  answer: string;
  delay: number;
}) {
  const [open, setOpen] = useState(false);
  const chevronRotation = useSharedValue(0);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRotation.value}deg` }],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext({
      duration: 280,
      create: { type: "easeInEaseOut", property: "opacity" },
      update: { type: "spring", springDamping: 0.8 },
    });
    chevronRotation.value = withSpring(open ? 0 : 90, { damping: 14, stiffness: 180 });
    setOpen((v) => !v);
  };

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()}>
      <Pressable
        testID={`accordion-${question.slice(0, 15).replace(/\s+/g, "-")}`}
        accessibilityLabel={`Fråga: ${question}`}
        onPress={handlePress}
        style={{
          backgroundColor: C.bgCard,
          borderRadius: RADIUS.md,
          borderWidth: 0.5,
          borderColor: C.divider,
          overflow: "hidden",
          ...SHADOW.card,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14 }}>
          <Text
            style={{
              fontFamily: FONTS.semiBold,
              fontSize: 14,
              color: C.textPrimary,
              flex: 1,
              marginRight: 12,
              letterSpacing: -0.1,
            }}
          >
            {question}
          </Text>
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              backgroundColor: open ? C.coralLight : "rgba(0,0,0,0.04)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Animated.View style={chevronStyle}>
              <ChevronRight size={13} color={open ? C.coral : C.textTertiary} strokeWidth={2.5} />
            </Animated.View>
          </View>
        </View>
        {open ? (
          <View style={{ paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 0.5, borderTopColor: C.borderLight }}>
            <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textSecondary, lineHeight: 20, marginTop: 10 }}>
              {answer}
            </Text>
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

export default function SupportScreen() {
  const router = useRouter();
  const phone = useAuthStore((s) => s.phoneNumber);
  const email = useAuthStore((s) => s.email);
  const submitMutation = useSubmitSupportMessage();

  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitFeedback = async () => {
    if (!feedbackMessage.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await submitMutation.mutateAsync({
        message: feedbackMessage.trim(),
        phone: phone || undefined,
        email: email || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmitted(true);
      setFeedbackMessage("");
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <SafeAreaView edges={["top"]} style={{ backgroundColor: C.bg }}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
          <Pressable
            testID="back-button"
            accessibilityLabel="Gå tillbaka"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.04)", alignItems: "center", justifyContent: "center", marginRight: 12 }}
          >
            <ChevronLeft size={20} color={C.textSecondary} strokeWidth={2} />
          </Pressable>
          <Text style={{ fontFamily: FONTS.displayBold, fontSize: 20, color: C.textPrimary, letterSpacing: -0.4 }}>
            Hjälp och support
          </Text>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          testID="support-scroll"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Intro */}
          <Animated.View entering={FadeInDown.springify()} style={{ paddingTop: 16, paddingBottom: 20 }}>
            <Text style={{ fontFamily: FONTS.regular, fontSize: 15, color: C.textSecondary, lineHeight: 22 }}>
              Vi hjälper dig gärna. Här hittar du svar på vanliga frågor, eller så kan du kontakta oss direkt.
            </Text>
          </Animated.View>

          {/* FAQ Section */}
          <Animated.View entering={FadeInDown.delay(40).springify()}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <HelpCircle size={18} color={C.gold} strokeWidth={2} />
              <Text style={{ fontFamily: FONTS.displayBold, fontSize: 16, color: C.textPrimary, letterSpacing: -0.3 }}>
                Vanliga frågor
              </Text>
            </View>
          </Animated.View>

          <View style={{ gap: 8, marginBottom: 28 }}>
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={`faq-${i}`} question={item.q} answer={item.a} delay={80 + i * 40} />
            ))}
            <Animated.View entering={FadeInDown.delay(80 + FAQ_ITEMS.length * 40).springify()}>
              <Pressable
                testID="see-all-faq"
                accessibilityLabel="Se alla frågor och svar"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push("/faq");
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  paddingVertical: 12,
                }}
              >
                <Text style={{ fontFamily: FONTS.semiBold, fontSize: 14, color: C.coral }}>
                  Se alla frågor och svar
                </Text>
                <ChevronRight size={16} color={C.coral} strokeWidth={2} />
              </Pressable>
            </Animated.View>
          </View>

          {/* Common Problems */}
          <Animated.View entering={FadeInDown.delay(200).springify()}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <AlertCircle size={18} color={C.coral} strokeWidth={2} />
              <Text style={{ fontFamily: FONTS.displayBold, fontSize: 16, color: C.textPrimary, letterSpacing: -0.3 }}>
                Vanliga problem
              </Text>
            </View>
          </Animated.View>

          <View style={{ gap: 8, marginBottom: 28 }}>
            {COMMON_PROBLEMS.map((item, i) => (
              <AccordionItem key={`problem-${i}`} question={item.q} answer={item.a} delay={240 + i * 40} />
            ))}
          </View>

          {/* Contact Section */}
          <Animated.View entering={FadeInDown.delay(400).springify()}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <MessageCircle size={18} color={C.gold} strokeWidth={2} />
              <Text style={{ fontFamily: FONTS.displayBold, fontSize: 16, color: C.textPrimary, letterSpacing: -0.3 }}>
                Kontakta oss
              </Text>
            </View>
          </Animated.View>

          <View style={{ gap: 12, marginBottom: 28 }}>
            {/* Email */}
            <Animated.View entering={FadeInDown.delay(440).springify()}>
              <Pressable
                testID="email-support"
                accessibilityLabel="Skicka e-post till support"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Linking.openURL("mailto:support@reslot.se");
                }}
                style={{
                  backgroundColor: C.bgCard,
                  borderRadius: RADIUS.lg,
                  padding: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  borderWidth: 0.5,
                  borderColor: C.divider,
                  ...SHADOW.card,
                }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: C.coralLight, alignItems: "center", justifyContent: "center" }}>
                  <Mail size={20} color={C.coral} strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: C.dark }}>Skicka e-post</Text>
                  <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textTertiary, marginTop: 2 }}>
                    support@reslot.se
                  </Text>
                </View>
                <ChevronRight size={18} color={C.textTertiary} strokeWidth={2} />
              </Pressable>
            </Animated.View>

            {/* In-app feedback form */}
            <Animated.View entering={FadeInDown.delay(480).springify()}>
              <View
                testID="feedback-form"
                style={{
                  backgroundColor: C.bgCard,
                  borderRadius: RADIUS.lg,
                  padding: 16,
                  borderWidth: 0.5,
                  borderColor: C.divider,
                  ...SHADOW.card,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(201,169,110,0.12)", alignItems: "center", justifyContent: "center" }}>
                    <Send size={20} color={C.gold} strokeWidth={2} />
                  </View>
                  <View>
                    <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: C.dark }}>Skicka feedback</Text>
                    <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textTertiary, marginTop: 2 }}>
                      Beskriv ditt ärende nedan
                    </Text>
                  </View>
                </View>

                {submitted ? (
                  <View style={{ alignItems: "center", paddingVertical: SPACING.md }}>
                    <CheckCircle size={32} color={C.success} strokeWidth={2} />
                    <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: C.success, marginTop: 8 }}>
                      Tack för ditt meddelande!
                    </Text>
                    <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textSecondary, marginTop: 4, textAlign: "center" }}>
                      Vi återkommer så snart vi kan.
                    </Text>
                    <Pressable
                      testID="send-another-button"
                      accessibilityLabel="Skicka ett till meddelande"
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSubmitted(false);
                      }}
                      style={{ marginTop: 12 }}
                    >
                      <Text style={{ fontFamily: FONTS.semiBold, fontSize: 14, color: C.coral }}>
                        Skicka ett till
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <>
                    <TextInput
                      testID="feedback-input"
                      placeholder="Beskriv ditt ärende..."
                      placeholderTextColor={C.textTertiary}
                      value={feedbackMessage}
                      onChangeText={setFeedbackMessage}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      style={{
                        fontFamily: FONTS.regular,
                        fontSize: 14,
                        color: C.textPrimary,
                        backgroundColor: C.bgInput,
                        borderRadius: RADIUS.md,
                        padding: 12,
                        minHeight: 100,
                        lineHeight: 20,
                      }}
                    />
                    <Pressable
                      testID="submit-feedback-button"
                      accessibilityLabel="Skicka meddelande"
                      onPress={handleSubmitFeedback}
                      disabled={!feedbackMessage.trim() || submitMutation.isPending}
                      style={{
                        marginTop: 12,
                        backgroundColor: feedbackMessage.trim() ? C.coral : C.textTertiary,
                        borderRadius: RADIUS.md,
                        paddingVertical: 13,
                        alignItems: "center",
                        flexDirection: "row",
                        justifyContent: "center",
                        gap: 8,
                        opacity: feedbackMessage.trim() ? 1 : 0.6,
                      }}
                    >
                      {submitMutation.isPending ? (
                        <ActivityIndicator size="small" color="#111827" />
                      ) : (
                        <>
                          <Send size={16} color="#111827" strokeWidth={2} />
                          <Text style={{ fontFamily: FONTS.semiBold, fontSize: 15, color: "#111827" }}>
                            Skicka
                          </Text>
                        </>
                      )}
                    </Pressable>
                  </>
                )}
              </View>
            </Animated.View>
          </View>

          {/* Info banner */}
          <Animated.View entering={FadeInDown.delay(520).springify()}>
            <View style={{ backgroundColor: C.coralLight, borderRadius: RADIUS.lg, padding: 16, flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
              <Bell size={16} color={C.coral} strokeWidth={2} style={{ marginTop: 2 }} />
              <Text style={{ fontFamily: FONTS.regular, fontSize: 13, color: C.textSecondary, lineHeight: 20, flex: 1 }}>
                Vi svarar vanligtvis inom 24 timmar. Du får en push-notis när vi svarar på ditt ärende.
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
