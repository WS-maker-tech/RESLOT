import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  Platform,
  useWindowDimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeInDown,
  FadeIn,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { ArrowLeft } from "lucide-react-native";
import {
  useFonts,
  PlayfairDisplay_400Regular_Italic,
  PlayfairDisplay_900Black,
} from "@expo-google-fonts/playfair-display";
import { FONTS, RADIUS, SPACING } from "@/lib/theme";

// Pi-screen palette — deep green big-word matches Pi exactly. One-off intro accent.
const INTRO_DARK_GREEN = "#1F4D2A";
const INTRO_BG = "#FAF5F0";

type IntroSlide = {
  id: "hej" | "bord" | "klara";
  smallWord: string | null;
  bigWord: string;
  subtitle?: string;
  hero: string;
  isCTA?: boolean;
};

const SLIDES: IntroSlide[] = [
  {
    id: "hej",
    smallWord: null,
    bigWord: "Hej",
    hero:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=900&q=80&auto=format&fit=crop&crop=center",
  },
  {
    id: "bord",
    smallWord: "Sista minuten-",
    bigWord: "Bord",
    hero:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&q=80&auto=format&fit=crop&crop=center",
  },
  {
    id: "klara",
    smallWord: null,
    bigWord: "Hitta ditt bord",
    subtitle:
      "Skapa ett konto för att se bord nära dig och spara dina favoriter.",
    hero:
      "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=900&q=80&auto=format&fit=crop&crop=center",
    isCTA: true,
  },
];

function PaginationDots({ index, total }: { index: number; total: number }) {
  return (
    <View
      style={{
        flexDirection: "row",
        gap: SPACING.sm,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {Array.from({ length: total }).map((_, i) => (
        <Dot key={i} active={i === index} />
      ))}
    </View>
  );
}

function Dot({ active }: { active: boolean }) {
  const w = useSharedValue(active ? 24 : 6);
  const op = useSharedValue(active ? 1 : 0.4);

  React.useEffect(() => {
    w.value = withSpring(active ? 24 : 6, { damping: 18, stiffness: 220 });
    op.value = withTiming(active ? 1 : 0.4, { duration: 220 });
  }, [active]);

  const style = useAnimatedStyle(() => ({
    width: w.value,
    opacity: op.value,
  }));

  return (
    <Animated.View
      style={[
        {
          height: 6,
          borderRadius: 999,
          backgroundColor: active ? INTRO_DARK_GREEN : "rgba(31,77,42,0.35)",
        },
        style,
      ]}
    />
  );
}

function IntroPrimaryButton({
  label,
  onPress,
  testID,
}: {
  label: string;
  onPress: () => void;
  testID?: string;
}) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={style}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 14, stiffness: 400 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 10, stiffness: 260 });
        }}
        onPress={() => {
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          onPress();
        }}
        style={{
          backgroundColor: INTRO_DARK_GREEN,
          height: 56,
          borderRadius: RADIUS.full,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: SPACING.lg2,
        }}
      >
        <Text
          style={{
            fontFamily: FONTS.bold,
            fontSize: 16,
            color: INTRO_BG,
            letterSpacing: -0.2,
          }}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function IntroGhostButton({
  label,
  onPress,
  testID,
}: {
  label: string;
  onPress: () => void;
  testID?: string;
}) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={style}>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 14, stiffness: 400 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 10, stiffness: 260 });
        }}
        onPress={() => {
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          onPress();
        }}
        style={{
          height: 52,
          borderRadius: RADIUS.full,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: SPACING.lg2,
          borderWidth: 1.5,
          borderColor: "rgba(31,77,42,0.18)",
          backgroundColor: "transparent",
        }}
      >
        <Text
          style={{
            fontFamily: FONTS.semiBold,
            fontSize: 15,
            color: INTRO_DARK_GREEN,
            letterSpacing: -0.1,
          }}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function IntroSlideView({
  slide,
  windowW,
  bigWordSize,
  serifLoaded,
  onCreateAccount,
  onSkip,
}: {
  slide: IntroSlide;
  windowW: number;
  bigWordSize: number;
  serifLoaded: boolean;
  onCreateAccount: () => void;
  onSkip: () => void;
}) {
  // Pi-stil hero — kvadratisk, top-left, ~55% av container-bredden
  const heroSize = Math.min(windowW * 0.55, 240);

  return (
    <View
      style={{
        flex: 1,
        alignItems: "flex-start",
        justifyContent: "flex-start",
        paddingHorizontal: SPACING.lg2,
      }}
    >
      <Animated.View
        key={`hero-${slide.id}`}
        entering={FadeIn.duration(420).easing(Easing.out(Easing.quad))}
        style={{
          marginTop: SPACING.md,
          width: heroSize,
          height: heroSize,
          borderRadius: RADIUS.xxl,
          overflow: "hidden",
          backgroundColor: "rgba(31,77,42,0.08)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.12,
          shadowRadius: 24,
          elevation: 6,
        }}
      >
        <Image
          source={{ uri: slide.hero }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      </Animated.View>

      <View
        style={{
          alignSelf: "stretch",
          alignItems: "flex-start",
          marginTop: SPACING.xl,
        }}
      >
        {slide.smallWord ? (
          <Animated.Text
            key={`small-${slide.id}`}
            entering={FadeInDown.delay(60)
              .springify()
              .damping(14)
              .stiffness(130)}
            style={{
              fontFamily: serifLoaded
                ? "PlayfairDisplay_400Regular_Italic"
                : FONTS.medium,
              fontStyle: serifLoaded ? "normal" : "italic",
              fontSize: 36,
              lineHeight: 40,
              color: INTRO_DARK_GREEN,
              letterSpacing: -0.5,
              textAlign: "left",
              marginBottom: SPACING.xs,
            }}
          >
            {slide.smallWord}
          </Animated.Text>
        ) : null}

        <Animated.Text
          key={`big-${slide.id}`}
          entering={FadeInDown.delay(slide.smallWord ? 120 : 60)
            .springify()
            .damping(14)
            .stiffness(130)}
          numberOfLines={2}
          adjustsFontSizeToFit
          style={{
            fontFamily: serifLoaded
              ? "PlayfairDisplay_900Black"
              : FONTS.displayBold,
            fontSize: bigWordSize,
            lineHeight: bigWordSize * 0.92,
            letterSpacing: -bigWordSize * 0.04,
            color: INTRO_DARK_GREEN,
            textAlign: "left",
          }}
        >
          {slide.bigWord}
        </Animated.Text>

        {slide.subtitle ? (
          <Animated.Text
            entering={FadeInDown.delay(200)
              .springify()
              .damping(18)
              .stiffness(140)}
            style={{
              fontFamily: FONTS.regular,
              fontSize: 15,
              lineHeight: 22,
              color: "rgba(31,77,42,0.65)",
              textAlign: "left",
              marginTop: SPACING.md,
              maxWidth: 320,
            }}
          >
            {slide.subtitle}
          </Animated.Text>
        ) : null}
      </View>

      {slide.isCTA ? (
        <Animated.View
          entering={FadeInDown.delay(260)
            .springify()
            .damping(18)
            .stiffness(140)}
          style={{
            width: "100%",
            marginTop: SPACING.xl,
            gap: SPACING.sm,
            paddingHorizontal: SPACING.xs,
          }}
        >
          <IntroPrimaryButton
            testID="intro-create-btn"
            label="Skapa konto"
            onPress={onCreateAccount}
          />
          <IntroGhostButton
            testID="intro-skip-btn"
            label="Hoppa över"
            onPress={onSkip}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

export default function IntroCarousel({
  onComplete,
  onLogin,
  onBack,
  onSkipToTabs,
}: {
  onComplete: () => void;
  onLogin: () => void;
  onBack: () => void;
  onSkipToTabs: () => void;
}) {
  const { width: winW } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const containerW = Platform.OS === "web" ? Math.min(winW, 430) : winW;

  const [serifLoaded] = useFonts({
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_900Black,
  });

  // Pi-stil — bigWord MASSIVE, fyller bredden med editorial impact
  const baseBig = Math.min(containerW * 0.55, 240);
  const slide = SLIDES[index];

  const advance = useCallback(() => {
    if (index < SLIDES.length - 1) {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setIndex((i) => i + 1);
    }
  }, [index]);

  const retreat = useCallback(() => {
    if (index > 0) {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      setIndex((i) => i - 1);
    } else {
      onBack();
    }
  }, [index, onBack]);

  const swipe = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-32, 32])
    .onEnd((e) => {
      "worklet";
      if (e.translationX < -50 && Math.abs(e.velocityX) > 200) {
        runOnJS(advance)();
      } else if (e.translationX > 50 && Math.abs(e.velocityX) > 200) {
        runOnJS(retreat)();
      }
    });

  const handleTap = useCallback(() => {
    if (!slide.isCTA) advance();
  }, [slide.isCTA, advance]);

  return (
    <View style={{ flex: 1, backgroundColor: INTRO_BG }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: SPACING.lg,
          paddingTop: SPACING.sm,
          paddingBottom: SPACING.xs,
          height: 48,
        }}
      >
        <Pressable
          testID="intro-back-btn"
          accessibilityRole="button"
          accessibilityLabel="Tillbaka"
          onPress={retreat}
          hitSlop={12}
          style={{
            width: 40,
            height: 40,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 20,
            backgroundColor: "rgba(31,77,42,0.06)",
          }}
        >
          <ArrowLeft size={20} color={INTRO_DARK_GREEN} strokeWidth={2.2} />
        </Pressable>

        <Pressable
          testID="intro-login-btn"
          accessibilityRole="button"
          accessibilityLabel="Logga in"
          onPress={onLogin}
          hitSlop={12}
        >
          <Text
            style={{
              fontFamily: FONTS.semiBold,
              fontSize: 15,
              color: INTRO_DARK_GREEN,
              letterSpacing: -0.1,
            }}
          >
            Logga in
          </Text>
        </Pressable>
      </View>

      <GestureDetector gesture={swipe}>
        <Pressable
          testID="intro-slide-tap"
          onPress={handleTap}
          style={{ flex: 1 }}
        >
          <IntroSlideView
            slide={slide}
            windowW={containerW}
            bigWordSize={baseBig}
            serifLoaded={!!serifLoaded}
            onCreateAccount={onComplete}
            onSkip={onSkipToTabs}
          />
        </Pressable>
      </GestureDetector>

      <View
        style={{
          paddingBottom: SPACING.lg2,
          paddingTop: SPACING.md,
          alignItems: "center",
        }}
      >
        <PaginationDots index={index} total={SLIDES.length} />
      </View>
    </View>
  );
}
