// Web version — includes ElevenLabs
import React, { useState } from "react";
import { View, Pressable } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle } from "react-native-reanimated";
import { Headphones, X } from "lucide-react-native";
import { C } from "@/lib/theme";
import SupportWidget from "./SupportWidget";

type ConversationStatus = "connected" | "disconnected" | "connecting";

const AGENT_ID = "agent_8401knmr5642fcevgdh642e4zhv7";

function WebSupportBubbleInner() {
  const [isOpen, setIsOpen] = useState(false);
  const scale = useSharedValue(1);

  const bubbleAnim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View
      style={{ position: "absolute", bottom: 100, right: 20, zIndex: 9999 }}
      pointerEvents="box-none"
    >
      {isOpen ? (
        <SupportWidget onClose={() => setIsOpen(false)} />
      ) : null}

      <Animated.View style={bubbleAnim}>
        <Pressable
          onPress={() => setIsOpen((prev) => !prev)}
          testID="support-bubble"
          style={({ pressed }) => ({
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: pressed ? "#6ab866" : C.pistachio,
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
          ) : (
            <Headphones size={24} color="#FFFFFF" strokeWidth={2} />
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}

export default function WebSupportBubble() {
  return <WebSupportBubbleInner />;
}
