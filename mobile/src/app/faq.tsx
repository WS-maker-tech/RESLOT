import React from "react";
import { View, Text, ScrollView, Pressable, LayoutAnimation, Platform, UIManager } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronRight, MessageCircle } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DARK = "#111827";
const BG = "#FAFAF8";
const CORAL = "#E06A4E";

const FAQ_ITEMS = [
  {
    q: "Hur fungerar Reslot?",
    a: "Reslot är en marknadsplats för restaurangbokningar. Du kan lägga upp bokningar du inte längre kan använda, och andra kan ta över dem mot credits.",
  },
  {
    q: "Vad är Reslot credits?",
    a: "Credits är Reslots valuta. Du tjänar credits när du lägger upp bokningar. Du använder credits för att ta över andras bokningar. Credits kan även köpas i appen.",
  },
  {
    q: "Hur tar jag över en bokning?",
    a: "Hitta en bokning som passar dig på Hem-flödet, tryck på den och välj 'Ta över bokning'. Du behöver credits och godkänna villkoren.",
  },
  {
    q: "Vad händer om jag inte kan gå?",
    a: "Du kan lägga upp bokningen i flödet igen. Tänk på att du ansvarar för bokningen tills någon annan tar över den.",
  },
  {
    q: "Hur tjänar jag credits?",
    a: "Du tjänar credits när du lägger upp en bokning och den tas över av någon annan. Du kan också köpa credits eller bjuda in vänner.",
  },
  {
    q: "Är mina betalningsuppgifter säkra?",
    a: "Ja. Vi använder Stripe för säker betalningshantering. Vi drar aldrig pengar utan din vetskap.",
  },
  {
    q: "Kan jag lägga upp vilken restaurang som helst?",
    a: "Ja, du kan lägga upp bokningar från restauranger som finns i Reslots databas. Kontakta support om din restaurang saknas.",
  },
];

function AnimatedPressable({
  children,
  onPress,
  style,
  testID,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: object;
  testID?: string;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      testID={testID}
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 12, stiffness: 200 }); }}
      onPress={onPress}
    >
      <Animated.View style={[animStyle, style]}>{children}</Animated.View>
    </Pressable>
  );
}

function FaqItem({ question, answer, delay }: { question: string; answer: string; delay: number }) {
  const [open, setOpen] = React.useState(false);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext({
      duration: 280,
      create: { type: "easeInEaseOut", property: "opacity" },
      update: { type: "spring", springDamping: 0.8 },
    });
    setOpen((v) => !v);
  };

  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(400).springify()}>
      <AnimatedPressable
        testID={`faq-item-${question.slice(0, 10)}`}
        onPress={handlePress}
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 16,
          borderWidth: 0.5,
          borderColor: "rgba(0,0,0,0.07)",
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
          elevation: 1,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 16,
          }}
        >
          <Text
            style={{
              fontFamily: "PlusJakartaSans_600SemiBold",
              fontSize: 14,
              color: DARK,
              flex: 1,
              marginRight: 12,
              letterSpacing: -0.1,
            }}
          >
            {question}
          </Text>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              backgroundColor: open ? "rgba(224,106,78,0.1)" : "rgba(0,0,0,0.04)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronRight
              size={14}
              color={open ? CORAL : "#9CA3AF"}
              strokeWidth={2.5}
              style={{ transform: [{ rotate: open ? "90deg" : "0deg" }] }}
            />
          </View>
        </View>
        {open ? (
          <View
            style={{
              paddingHorizontal: 16,
              paddingBottom: 16,
              borderTopWidth: 0.5,
              borderTopColor: "rgba(0,0,0,0.06)",
            }}
          >
            <Text
              style={{
                fontFamily: "PlusJakartaSans_400Regular",
                fontSize: 13,
                color: "#6B7280",
                lineHeight: 20,
                marginTop: 12,
              }}
            >
              {answer}
            </Text>
          </View>
        ) : null}
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function FaqScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.delay(0).duration(400).springify()}
          style={{ paddingHorizontal: 20, paddingTop: 28, paddingBottom: 6 }}
        >
          <Text
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              fontSize: 28,
              color: DARK,
              letterSpacing: -0.8,
            }}
          >
            Frågor och svar
          </Text>
          <Text
            style={{
              fontFamily: "PlusJakartaSans_400Regular",
              fontSize: 14,
              color: "#9CA3AF",
              marginTop: 5,
            }}
          >
            Allt du behöver veta om Reslot.
          </Text>
        </Animated.View>

        <View style={{ marginTop: 20, paddingHorizontal: 20, gap: 8 }}>
          {FAQ_ITEMS.map((item, i) => (
            <FaqItem key={i} question={item.q} answer={item.a} delay={80 + i * 40} />
          ))}
        </View>

        <Animated.View
          entering={FadeInDown.delay(80 + FAQ_ITEMS.length * 40 + 40).duration(400).springify()}
          style={{
            marginHorizontal: 20,
            marginTop: 32,
            borderTopWidth: 0.5,
            borderTopColor: "rgba(0,0,0,0.08)",
            paddingTop: 24,
          }}
        >
          <Text
            style={{
              fontFamily: "PlusJakartaSans_500Medium",
              fontSize: 14,
              color: "#6B7280",
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            Hittar du inte din fråga här?
          </Text>
          <AnimatedPressable
            testID="contact-support-button"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              backgroundColor: DARK,
              paddingVertical: 14,
              borderRadius: 14,
              shadowColor: DARK,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 10,
              elevation: 3,
            }}
          >
            <MessageCircle size={16} color="#FFFFFF" strokeWidth={2} />
            <Text
              style={{
                fontFamily: "PlusJakartaSans_600SemiBold",
                fontSize: 15,
                color: "#FFFFFF",
              }}
            >
              Kontakta support
            </Text>
          </AnimatedPressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
