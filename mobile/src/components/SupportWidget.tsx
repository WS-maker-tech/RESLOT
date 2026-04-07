import React, { useEffect } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { Headphones, Phone, PhoneOff } from "lucide-react-native";
import { C, FONTS, SHADOW } from "@/lib/theme";

type ConversationStatus = "connected" | "disconnected" | "connecting";

interface SupportWidgetProps {
  status: ConversationStatus;
  isSpeaking: boolean;
  onStart: () => void;
  onEnd: () => void;
  onClose: () => void;
  webOnly?: boolean;
}

function WaveBar({ index, isSpeaking }: { index: number; isSpeaking: boolean }) {
  const height = useSharedValue(8);

  useEffect(() => {
    const minH = isSpeaking ? 10 : 6;
    const maxH = isSpeaking ? 36 : 28;
    const dur = isSpeaking ? 600 + index * 80 : 400 + index * 60;

    height.value = withDelay(
      index * 70,
      withRepeat(
        withSequence(
          withTiming(maxH, { duration: dur, easing: Easing.inOut(Easing.ease) }),
          withTiming(minH, { duration: dur, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, [isSpeaking, index, height]);

  const barStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: 4,
          borderRadius: 2,
          backgroundColor: isSpeaking ? C.pistachio : C.textTertiary,
          marginHorizontal: 3,
        },
        barStyle,
      ]}
    />
  );
}

function StatusDot({ status }: { status: ConversationStatus }) {
  const dotColor =
    status === "connected"
      ? C.successBright
      : status === "connecting"
        ? C.warning
        : C.grayLight;

  const opacity = useSharedValue(1);

  useEffect(() => {
    if (status === "connecting") {
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 600 }),
          withTiming(1, { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      opacity.value = withTiming(1, { duration: 200 });
    }
  }, [status, opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: dotColor,
        },
        animStyle,
      ]}
    />
  );
}

function SpinnerDots() {
  const dots = [0, 1, 2];
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      {dots.map((i) => (
        <PulsingDot key={i} delay={i * 200} />
      ))}
    </View>
  );
}

function PulsingDot({ delay }: { delay: number }) {
  const scale = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.2, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.6, { duration: 500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, [delay, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: C.pistachio,
        },
        style,
      ]}
    />
  );
}

export default function SupportWidget({
  status,
  isSpeaking,
  onStart,
  onEnd,
  onClose,
  webOnly,
}: SupportWidgetProps) {
  const isConnected = status === "connected";
  const isConnecting = status === "connecting";
  const isIdle = status === "disconnected";

  const subtitleText = isConnected
    ? isSpeaking
      ? "Pratar..."
      : "Lyssnar..."
    : isConnecting
      ? "Ansluter..."
      : "Tryck för att prata med oss";

  return (
    <Animated.View
      entering={FadeIn.duration(250).springify().damping(18)}
      exiting={FadeOut.duration(150)}
      style={[
        {
          position: "absolute",
          bottom: 170,
          right: 20,
          width: 300,
          backgroundColor: C.bgCard,
          borderRadius: 24,
          overflow: "hidden",
        },
        SHADOW.elevated,
      ]}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingTop: 18,
          paddingBottom: 12,
        }}
      >
        <View>
          <Text
            style={{
              fontFamily: FONTS.displayBold,
              fontSize: 16,
              color: C.textPrimary,
              letterSpacing: -0.3,
            }}
          >
            <Text style={{ color: C.textPrimary }}>Re</Text>
            <Text style={{ color: C.pistachio }}>slot</Text>
            <Text style={{ color: C.textPrimary }}> Support</Text>
          </Text>
          <Text
            style={{
              fontFamily: FONTS.regular,
              fontSize: 13,
              color: C.textTertiary,
              marginTop: 2,
            }}
          >
            {subtitleText}
          </Text>
        </View>
        <StatusDot status={status} />
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: C.divider, marginHorizontal: 20 }} />

      {/* Body */}
      <View
        style={{
          height: 120,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 20,
        }}
      >
        {webOnly ? (
          <View style={{ alignItems: "center" }}>
            <Headphones size={36} color={C.grayLight} strokeWidth={1.8} />
            <Text
              style={{
                fontFamily: FONTS.medium,
                fontSize: 14,
                color: C.textTertiary,
                marginTop: 10,
                textAlign: "center",
              }}
            >
              Kommer snart
            </Text>
            <Text
              style={{
                fontFamily: FONTS.regular,
                fontSize: 12,
                color: C.textTertiary,
                marginTop: 4,
                textAlign: "center",
              }}
            >
              Röststöd är tillgängligt på webben
            </Text>
          </View>
        ) : isIdle ? (
          <View style={{ alignItems: "center" }}>
            <Headphones size={44} color={C.pistachio} strokeWidth={1.8} />
            <Text
              style={{
                fontFamily: FONTS.medium,
                fontSize: 15,
                color: C.textPrimary,
                marginTop: 10,
              }}
            >
              Få hjälp direkt
            </Text>
          </View>
        ) : isConnecting ? (
          <SpinnerDots />
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center", height: 48 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <WaveBar key={i} index={i} isSpeaking={isSpeaking} />
            ))}
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 18, paddingTop: 4 }}>
        {webOnly ? null : (
          <>
            <Pressable
              onPress={isIdle || isConnecting ? onStart : onEnd}
              testID="support-action-button"
              style={({ pressed }) => ({
                backgroundColor: isConnected
                  ? "#E06A4E"
                  : pressed
                    ? "#6ab866"
                    : C.pistachio,
                borderRadius: 16,
                paddingVertical: 14,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
                opacity: pressed ? 0.92 : 1,
              })}
            >
              {isConnected ? (
                <PhoneOff size={18} color="#FFFFFF" strokeWidth={2} />
              ) : (
                <Phone size={18} color="#FFFFFF" strokeWidth={2} />
              )}
              <Text
                style={{
                  fontFamily: FONTS.bold,
                  fontSize: 15,
                  color: "#FFFFFF",
                }}
              >
                {isConnected ? "Avsluta" : "Starta samtal"}
              </Text>
            </Pressable>
            <Text
              style={{
                fontFamily: FONTS.regular,
                fontSize: 11,
                color: C.textTertiary,
                textAlign: "center",
                marginTop: 10,
                opacity: 0.7,
              }}
            >
              Powered by ElevenLabs
            </Text>
          </>
        )}
      </View>
    </Animated.View>
  );
}
