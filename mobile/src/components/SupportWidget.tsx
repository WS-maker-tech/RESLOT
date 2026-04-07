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
import Animated, {
  FadeIn,
  FadeOut,
  FadeInDown,
} from "react-native-reanimated";
import { X, Send, Bot } from "lucide-react-native";
import { C, FONTS, RADIUS, SHADOW } from "@/lib/theme";

interface Message {
  id: string;
  role: "user" | "agent";
  text: string;
  timestamp: Date;
}

interface SupportWidgetProps {
  onClose: () => void;
  onSendMessage?: (text: string) => Promise<string>;
}

const SYSTEM_PROMPT = `Du är Reslots kundsupportagent. Reslot är en app där användare kan dela och ta över restaurangbokningar som de inte längre kan använda — en andrahandsmarknad för bordbokningar på exklusiva restauranger i Sverige.

Du hjälper användare med:
- Hur Reslot fungerar (credits-systemet, hur man lägger upp och tar bokningar)
- Problem med betalning och credits
- Frågor om specifika bokningar
- Tekniska problem med appen

Viktiga fakta:
- Credits kostar inget — man tjänar dem genom att dela bokningar
- Varje delad bokning ger 2 credits, att ta en bokning kostar 2 credits
- Reslot garanterar inte att restaurangen accepterar överlåtelsen
- Vid problem: support@reslot.se

Ton: Varm, hjälpsam och professionell. Tala svenska. Håll svaren korta och konkreta.`;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function sendToAgent(messages: ChatMessage[]): Promise<string> {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.EXPO_PUBLIC_OPENROUTER_KEY ?? ""}`,
        "HTTP-Referer": "https://reslot.se",
        "X-Title": "Reslot Support",
      },
      body: JSON.stringify({
        model: "openai/gpt-4.1-mini",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        max_tokens: 300,
      }),
    });
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "Jag förstår inte riktigt, kan du förtydliga?";
  } catch {
    return "Tyvärr kan jag inte svara just nu. Kontakta oss på support@reslot.se";
  }
}

export default function SupportWidget({ onClose, onSendMessage }: SupportWidgetProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "0",
      role: "agent",
      text: "Hej! Välkommen till Reslot Support 👋 Hur kan jag hjälpa dig idag?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const historyRef = useRef<ChatMessage[]>([]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, isTyping]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      text,
      timestamp: new Date(),
    };

    historyRef.current = [...historyRef.current, { role: "user", content: text }];
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const reply = onSendMessage
        ? await onSendMessage(text)
        : await sendToAgent(historyRef.current);

      historyRef.current = [...historyRef.current, { role: "assistant", content: reply }];

      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "agent",
        text: reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, agentMsg]);
    } finally {
      setIsTyping(false);
    }
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
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: "rgba(126,200,122,0.12)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Bot size={18} color={C.pistachio} strokeWidth={2} />
          </View>
          <View>
            <Text style={{ fontFamily: FONTS.displayBold, fontSize: 15, color: C.textPrimary, letterSpacing: -0.3 }}>
              <Text style={{ color: C.textPrimary }}>Re</Text>
              <Text style={{ color: C.pistachio }}>slot</Text>
              <Text style={{ color: C.textPrimary }}> Support</Text>
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 1 }}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: "#4CAF50" }} />
              <Text style={{ fontFamily: FONTS.regular, fontSize: 11, color: C.textTertiary }}>
                Online
              </Text>
            </View>
          </View>
        </View>
        <Pressable
          onPress={onClose}
          hitSlop={10}
          style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: "rgba(0,0,0,0.05)", alignItems: "center", justifyContent: "center" }}
        >
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
        {messages.map((msg) => (
          <Animated.View
            key={msg.id}
            entering={FadeInDown.duration(200).springify()}
            style={{
              alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "82%",
            }}
          >
            <View
              style={{
                backgroundColor: msg.role === "user" ? C.pistachio : "rgba(0,0,0,0.05)",
                borderRadius: 16,
                borderBottomRightRadius: msg.role === "user" ? 4 : 16,
                borderBottomLeftRadius: msg.role === "agent" ? 4 : 16,
                paddingHorizontal: 14,
                paddingVertical: 10,
              }}
            >
              <Text
                style={{
                  fontFamily: FONTS.regular,
                  fontSize: 14,
                  color: msg.role === "user" ? "#FFFFFF" : C.textPrimary,
                  lineHeight: 20,
                }}
              >
                {msg.text}
              </Text>
            </View>
          </Animated.View>
        ))}

        {isTyping ? (
          <Animated.View entering={FadeInDown.duration(200)} style={{ alignSelf: "flex-start" }}>
            <View
              style={{
                backgroundColor: "rgba(0,0,0,0.05)",
                borderRadius: 16,
                borderBottomLeftRadius: 4,
                paddingHorizontal: 16,
                paddingVertical: 12,
                flexDirection: "row",
                gap: 4,
                alignItems: "center",
              }}
            >
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.textTertiary, opacity: 0.5 + i * 0.2 }}
                />
              ))}
            </View>
          </Animated.View>
        ) : null}
      </ScrollView>

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderTopWidth: 1,
            borderTopColor: C.divider,
            gap: 8,
          }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Skriv ett meddelande..."
            placeholderTextColor={C.textTertiary}
            style={{
              flex: 1,
              fontFamily: FONTS.regular,
              fontSize: 14,
              color: C.textPrimary,
              backgroundColor: "rgba(0,0,0,0.04)",
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 9,
              maxHeight: 80,
            }}
            multiline
            returnKeyType="send"
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <Pressable
            onPress={handleSend}
            disabled={!input.trim()}
            style={({ pressed }) => ({
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: input.trim() ? C.pistachio : "rgba(0,0,0,0.08)",
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Send size={16} color={input.trim() ? "#FFFFFF" : C.textTertiary} strokeWidth={2} />
          </Pressable>
        </View>
        <Text style={{ fontFamily: FONTS.regular, fontSize: 10, color: C.textTertiary, textAlign: "center", paddingBottom: 8, opacity: 0.6 }}>
          Powered by ElevenLabs
        </Text>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}
