import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Animated, { FadeIn, FadeOut, FadeInDown } from "react-native-reanimated";
import { X, Send, Bot } from "lucide-react-native";
import { C, FONTS, SHADOW } from "@/lib/theme";

interface Message {
  id: string;
  role: "user" | "agent";
  text: string;
}

interface SupportWidgetProps {
  onClose: () => void;
  // Injected from .web.tsx version
  onSendMessage?: (text: string) => void;
  agentMessages?: Message[];
  isConnected?: boolean;
  isTyping?: boolean;
}

export default function SupportWidget({
  onClose,
  onSendMessage,
  agentMessages = [],
  isConnected = false,
  isTyping = false,
}: SupportWidgetProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  const allMessages: Message[] = [
    {
      id: "welcome",
      role: "agent",
      text: "Hej! Välkommen till Reslot Support 👋 Hur kan jag hjälpa dig idag?",
    },
    ...agentMessages,
  ];

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [agentMessages, isTyping]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || !onSendMessage) return;
    onSendMessage(text);
    setInput("");
  };

  return (
    <Animated.View
      entering={FadeIn.duration(200).springify().damping(18)}
      exiting={FadeOut.duration(150)}
      style={[
        {
          position: "absolute",
          bottom: 70,
          right: 0,
          width: 320,
          height: 440,
          backgroundColor: C.bgCard ?? "#FFFFFF",
          borderRadius: 24,
          overflow: "hidden",
          flexDirection: "column",
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
          paddingHorizontal: 18,
          paddingTop: 16,
          paddingBottom: 14,
          borderBottomWidth: 1,
          borderBottomColor: C.divider,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(126,200,122,0.12)", alignItems: "center", justifyContent: "center" }}>
            <Bot size={18} color={C.pistachio} strokeWidth={2} />
          </View>
          <View>
            <Text style={{ fontFamily: FONTS.displayBold, fontSize: 15, color: C.textPrimary, letterSpacing: -0.3 }}>
              <Text style={{ color: C.textPrimary }}>Re</Text>
              <Text style={{ color: C.pistachio }}>slot</Text>
              <Text style={{ color: C.textPrimary }}> Support</Text>
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 1 }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: isConnected ? "#4CAF50" : "#aaa" }} />
              <Text style={{ fontFamily: FONTS.regular, fontSize: 11, color: C.textTertiary }}>
                {isConnected ? "Online" : "Ansluter..."}
              </Text>
            </View>
          </View>
        </View>
        <Pressable onPress={onClose} hitSlop={10} style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: "rgba(0,0,0,0.05)", alignItems: "center", justifyContent: "center" }}>
          <X size={16} color={C.textSecondary} strokeWidth={2} />
        </Pressable>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 14, gap: 10 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {allMessages.map((msg) => (
          <Animated.View
            key={msg.id}
            entering={FadeInDown.duration(200).springify()}
            style={{ alignSelf: msg.role === "user" ? "flex-end" : "flex-start", maxWidth: "82%" }}
          >
            <View style={{
              backgroundColor: msg.role === "user" ? C.pistachio : "rgba(0,0,0,0.05)",
              borderRadius: 16,
              borderBottomRightRadius: msg.role === "user" ? 4 : 16,
              borderBottomLeftRadius: msg.role === "agent" ? 4 : 16,
              paddingHorizontal: 14,
              paddingVertical: 10,
            }}>
              <Text style={{ fontFamily: FONTS.regular, fontSize: 14, color: msg.role === "user" ? "#FFFFFF" : C.textPrimary, lineHeight: 20 }}>
                {msg.text}
              </Text>
            </View>
          </Animated.View>
        ))}

        {isTyping ? (
          <Animated.View entering={FadeInDown.duration(200)} style={{ alignSelf: "flex-start" }}>
            <View style={{ backgroundColor: "rgba(0,0,0,0.05)", borderRadius: 16, borderBottomLeftRadius: 4, paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", gap: 4, alignItems: "center" }}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.textTertiary, opacity: 0.4 + i * 0.2 }} />
              ))}
            </View>
          </Animated.View>
        ) : null}
      </ScrollView>

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.divider, gap: 8 }}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Skriv ett meddelande..."
            placeholderTextColor={C.textTertiary}
            style={{ flex: 1, fontFamily: FONTS.regular, fontSize: 14, color: C.textPrimary, backgroundColor: "rgba(0,0,0,0.04)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, maxHeight: 80 }}
            multiline
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <Pressable
            onPress={handleSend}
            disabled={!input.trim() || !isConnected}
            style={({ pressed }) => ({
              width: 38, height: 38, borderRadius: 19,
              backgroundColor: input.trim() && isConnected ? C.pistachio : "rgba(0,0,0,0.08)",
              alignItems: "center", justifyContent: "center",
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Send size={16} color={input.trim() && isConnected ? "#FFFFFF" : C.textTertiary} strokeWidth={2} />
          </Pressable>
        </View>
        <Text style={{ fontFamily: FONTS.regular, fontSize: 10, color: C.textTertiary, textAlign: "center", paddingBottom: 8, opacity: 0.5 }}>
          Powered by ElevenLabs
        </Text>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}
