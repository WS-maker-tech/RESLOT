// Native fallback — ElevenLabs only runs on web
import React, { useState } from "react";
import { View, Pressable } from "react-native";
import { Headphones, X } from "lucide-react-native";
import { C } from "@/lib/theme";
import SupportWidget from "./SupportWidget";

export default function SupportBubble() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View
      style={{ position: "absolute", bottom: 100, right: 20, zIndex: 9999 }}
      pointerEvents="box-none"
    >
      {isOpen ? (
        <SupportWidget
          onClose={() => setIsOpen(false)}
        />
      ) : null}

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
    </View>
  );
}
