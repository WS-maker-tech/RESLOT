import React from "react";
import { View, Text, Image, type StyleProp, type ViewStyle, type ImageStyle } from "react-native";
import { ImageIcon } from "lucide-react-native";
import { C, RADIUS, IMG } from "@/lib/theme";

/**
 * PhotoSlot — platshållare för foton som ska genereras via image-gen senare.
 *
 * Per William's beslut 5: foton först, illustrationer kommer post-natt via image-gen.
 * Denna komponent renderar en cream-tinted dashed-border-platshållare med italic
 * label tills `src` är satt — då blir den en vanlig <Image>.
 *
 * Drop-in för foto-positioner: hero-bilder, restaurang-cards, empty-state-illustrationer.
 *
 * @example
 *   <PhotoSlot label="Hero-bild" aspect="hero" />
 *   <PhotoSlot src={restaurant.imageUrl} aspect="banner" />
 */

export type PhotoAspect = keyof typeof IMG;
export type PhotoRadius = keyof typeof RADIUS;

interface PhotoSlotProps {
  src?: string | null;
  label?: string;
  aspect?: PhotoAspect | number;
  rounded?: PhotoRadius | number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function PhotoSlot({
  src,
  label = "Bild kommer",
  aspect = "hero",
  rounded = "lg",
  style,
  testID,
}: PhotoSlotProps) {
  const aspectRatio = typeof aspect === "number" ? aspect : IMG[aspect];
  const borderRadius = typeof rounded === "number" ? rounded : RADIUS[rounded];

  if (src) {
    const imageStyle: StyleProp<ImageStyle> = [
      { aspectRatio, borderRadius, backgroundColor: C.creamSoft, width: "100%" },
      style as StyleProp<ImageStyle>,
    ];
    return (
      <Image
        source={{ uri: src }}
        style={imageStyle}
        resizeMode="cover"
        testID={testID ?? "photo-slot-filled"}
      />
    );
  }

  return (
    <View
      style={[
        {
          aspectRatio,
          borderRadius,
          backgroundColor: C.creamSoft,
          borderWidth: 1.5,
          borderColor: C.forestSoft,
          borderStyle: "dashed",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          width: "100%",
        },
        style,
      ]}
      testID={testID ?? "photo-slot-empty"}
    >
      <ImageIcon size={28} color={C.inkFaint} strokeWidth={1.5} />
      <Text
        style={{
          fontFamily: "Fraunces_400Regular_Italic",
          fontSize: 13,
          color: C.inkFaint,
          fontStyle: "italic",
        }}
      >
        {label}
      </Text>
    </View>
  );
}
