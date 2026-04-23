import React from "react";
import { View, Text, ScrollView, Pressable, LayoutAnimation, Platform, UIManager } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronRight, MessageCircle } from "lucide-react-native";
import { useRouter } from "expo-router";
import SupportBubble from "@/components/SupportBubble";
import * as Haptics from "expo-haptics";
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { C, FONTS, SPACING, RADIUS, SHADOW, ICON } from "@/lib/theme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQ_ITEMS = [
  {
    q: "Hur fungerar Reslot?",
    a: "Reslot låter dig ta över restaurangbokningar från andra som inte kan gå. Inget samarbete med restauranger — allt sker direkt mellan användare.",
  },
  {
    q: "Vad är Reslot credits?",
    a: "Credits är din valuta i Reslot. Lägg upp ett bord, bjud in en vän eller köp credits — sedan snappas bord.",
  },
  {
    q: "När betalar jag något?",
    a: "Du betalar inget när du lägger in kortuppgifter. Betalning sker bara om du bryter mot bokningens villkor, till exempel om du inte dyker upp i tid.",
  },
  {
    q: "Varför behöver jag lägga in kortuppgifter?",
    a: "Kortuppgifter används som en säkerhet. Det gör att bokningar tas på allvar och minskar risken för att bord står tomma.",
  },
  {
    q: "Vad händer om jag inte kan gå på bokningen?",
    a: "Du kan avboka enligt restaurangens regler. Om du avbokar för sent eller inte dyker upp kan du bli debiterad.",
  },
  {
    q: "Kan jag ångra en bokning jag tagit över?",
    a: "Ja, så länge du avbokar inom avbokningsfönstret. Efter det gäller restaurangens villkor.",
  },
  {
    q: "Hur fungerar bevakningar?",
    a: "Du kan spara bevakningar för restauranger eller tider du är intresserad av. När en matchande bokning dyker upp får du en notis.",
  },
  {
    q: "Hur får jag fler credits?",
    a: "Lägg upp ett bord (+2), bjud in en vän (+1) eller köp direkt i appen.",
  },
];

function AnimatedPressable({
  children,
  onPress,
  style,
  testID,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: object;
  testID?: string;
  accessibilityLabel?: string;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      testID={testID}
      accessibilityLabel={accessibilityLabel}
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
      <AnimatedPressable
        testID={`faq-item-${question.slice(0, 10)}`}
        accessibilityLabel={`Fråga: ${question}`}
        onPress={handlePress}
        style={{
          backgroundColor: C.bgCard,
          borderRadius: RADIUS.lg,
          borderWidth: 0.5,
          borderColor: C.divider,
          overflow: "hidden",
          ...SHADOW.card,
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
              width: 28,
              height: 28,
              borderRadius: 8,
              backgroundColor: open ? C.coralLight : "rgba(0,0,0,0.04)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Animated.View style={chevronStyle}>
              <ChevronRight
                size={14}
                color={open ? C.coral : C.textTertiary}
                strokeWidth={2.5}
              />
            </Animated.View>
          </View>
        </View>
        {open ? (
          <View
            style={{
              paddingHorizontal: 16,
              paddingBottom: 16,
              borderTopWidth: 0.5,
              borderTopColor: C.borderLight,
            }}
          >
            <Text
              style={{
                fontFamily: FONTS.regular,
                fontSize: 13,
                color: C.textSecondary,
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
  const router = useRouter();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={["top", "bottom"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInDown.springify()}
          style={{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.xl, paddingBottom: 6 }}
        >
          <Text
            style={{
              fontFamily: FONTS.displayBold,
              fontSize: 28,
              color: C.textPrimary,
              letterSpacing: -0.8,
            }}
          >
            Frågor och svar
          </Text>
          <Text
            style={{
              fontFamily: FONTS.regular,
              fontSize: 14,
              color: C.textTertiary,
              marginTop: 5,
            }}
          >
            Allt du behöver veta om Reslot.
          </Text>
        </Animated.View>

        <View style={{ marginTop: SPACING.lg, paddingHorizontal: SPACING.lg, gap: SPACING.sm }}>
          {FAQ_ITEMS.map((item, i) => (
            <FaqItem key={i} question={item.q} answer={item.a} delay={80 + i * 40} />
          ))}
        </View>

        <Animated.View
          entering={FadeInDown.delay(80 + FAQ_ITEMS.length * 40 + 40).springify()}
          style={{
            marginHorizontal: SPACING.lg,
            marginTop: 32,
            borderTopWidth: 0.5,
            borderTopColor: C.divider,
            paddingTop: 24,
          }}
        >
          <Text
            style={{
              fontFamily: FONTS.medium,
              fontSize: 14,
              color: C.textSecondary,
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            Hittar du inte din fråga här?
          </Text>
          <AnimatedPressable
            testID="contact-support-button"
            accessibilityLabel="Kontakta support"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/support");
            }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              backgroundColor: C.dark,
              paddingVertical: 14,
              borderRadius: RADIUS.md,
              shadowColor: C.dark,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 10,
              elevation: 3,
            }}
          >
            <MessageCircle size={16} color={C.bgCard} strokeWidth={2} />
            <Text
              style={{
                fontFamily: FONTS.semiBold,
                fontSize: 15,
                color: C.bgCard,
              }}
            >
              Kontakta support
            </Text>
          </AnimatedPressable>
        </Animated.View>
      </ScrollView>
      <SupportBubble />
    </SafeAreaView>
  );
}
