import React, { useState, useCallback } from "react";
import { View, Pressable } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle } from "react-native-reanimated";
import { Headphones, X } from "lucide-react-native";
import { useConversation, ConversationProvider } from "@elevenlabs/react";
import { C } from "@/lib/theme";
import SupportWidget from "./SupportWidget";

const AGENT_ID = "agent_8401knmr5642fcevgdh642e4zhv7";

interface Message {
  id: string;
  role: "user" | "agent";
  text: string;
}

function WebSupportBubbleInner() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scale = useSharedValue(1);
  const bubbleAnim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const conversation = useConversation({
    onMessage: (msg: any) => {
      // Incoming agent message
      if (msg.source === "ai") {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: "agent", text: msg.message },
        ]);
      }
    },
    onError: (err: Error) => console.error("ElevenLabs:", err),
  });

  const isConnected = conversation.status === "connected";

  const handleOpen = useCallback(async () => {
    setIsOpen(true);
    if (conversation.status === "disconnected") {
      try {
        await conversation.startSession({
          agentId: AGENT_ID,
          connectionType: "websocket",
        });
      } catch (e) {
        console.error("Could not connect:", e);
      }
    }
  }, [conversation]);

  const handleClose = useCallback(async () => {
    setIsOpen(false);
    if (isConnected) {
      await conversation.endSession();
      setMessages([]);
    }
  }, [conversation, isConnected]);

  const handleSendMessage = useCallback((text: string) => {
    // Add user message to local state
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", text },
    ]);
    setIsTyping(true);
    // Send to ElevenLabs agent
    conversation.sendUserMessage(text);
  }, [conversation]);

  return (
    <View
      style={{ position: "absolute", bottom: 100, right: 20, zIndex: 9999 }}
      pointerEvents="box-none"
    >
      {isOpen ? (
        <SupportWidget
          onClose={handleClose}
          onSendMessage={handleSendMessage}
          agentMessages={messages}
          isConnected={isConnected}
          isTyping={isTyping}
        />
      ) : null}

      <Animated.View style={bubbleAnim}>
        <Pressable
          onPress={isOpen ? handleClose : handleOpen}
          testID="support-bubble"
          style={({ pressed }) => ({
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: pressed ? "#6ab866" : isConnected ? "#3d7a3a" : C.pistachio,
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

export default function SupportBubble() {
  return (
    <ConversationProvider>
      <WebSupportBubbleInner />
    </ConversationProvider>
  );
}
