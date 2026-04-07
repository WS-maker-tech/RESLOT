// Web version — includes ElevenLabs
import React, { useState, useEffect, useCallback } from "react";
import { View, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { Headphones, Mic, X } from "lucide-react-native";
import { useConversation, ConversationProvider } from "@elevenlabs/react";
import { C } from "@/lib/theme";
import SupportWidget from "./SupportWidget";

type ConversationStatus = "connected" | "disconnected" | "connecting";

const AGENT_ID = "agent_8401knmr5642fcevgdh642e4zhv7";

function WebSupportBubbleInner() {
  const [isOpen, setIsOpen] = useState(false);
  const [micGranted, setMicGranted] = useState(false);
  const scale = useSharedValue(1);

  const conversation = useConversation({
    onError: (error: Error) => {
      console.error("ElevenLabs error:", error);
    },
  });

  const { status, isSpeaking } = conversation;
  const isConnected = status === "connected";

  useEffect(() => {
    if (isSpeaking) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
    }
  }, [isSpeaking, scale]);

  const bubbleAnim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleStart = useCallback(async () => {
    try {
      if (!micGranted) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicGranted(true);
      }
      await conversation.startSession({ agentId: AGENT_ID });
    } catch (err) {
      console.error("ElevenLabs start failed:", err);
    }
  }, [conversation, micGranted]);

  const handleEnd = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch (err) {
      console.error("ElevenLabs end failed:", err);
    }
  }, [conversation]);

  const bgColor = isConnected ? "#3d7a3a" : C.pistachio;

  return (
    <View
      style={{ position: "absolute", bottom: 100, right: 20, zIndex: 9999 }}
      pointerEvents="box-none"
    >
      {isOpen ? (
        <SupportWidget
          status={status as ConversationStatus}
          isSpeaking={isSpeaking}
          onStart={handleStart}
          onEnd={handleEnd}
          onClose={() => setIsOpen(false)}
        />
      ) : null}

      <Animated.View style={bubbleAnim}>
        <Pressable
          onPress={() => setIsOpen((prev) => !prev)}
          testID="support-bubble"
          style={({ pressed }) => ({
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: pressed ? "#6ab866" : bgColor,
            alignItems: "center",
            justifyContent: "center",
            alignSelf: "flex-end",
            shadowColor: C.pistachio,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 20,
            elevation: 8,
          })}
        >
          {isOpen ? (
            <X size={24} color="#FFFFFF" strokeWidth={2} />
          ) : isConnected ? (
            <Mic size={24} color="#FFFFFF" strokeWidth={2} />
          ) : (
            <Headphones size={24} color="#FFFFFF" strokeWidth={2} />
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

export default function SupportBubble() {
  return (
    <ConversationProvider>
      <WebSupportBubbleInner />
    </ConversationProvider>
  );
}
