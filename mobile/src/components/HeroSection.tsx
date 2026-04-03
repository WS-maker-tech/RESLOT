import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Users, Clock } from "lucide-react-native";
import Animated from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { C, FONTS, SPACING, RADIUS } from "../lib/theme";

const HERO_HEIGHT = 280;

interface HeroSectionProps {
  imageUri: string;
  partySize: number;
  displayTime: string;
  heroStyle: any;
}

export const HeroSection = React.memo(function HeroSection({
  imageUri,
  partySize,
  displayTime,
  heroStyle,
}: HeroSectionProps) {
  return (
    <View style={styles.container}>
      <Animated.View style={[styles.imageWrapper, heroStyle]}>
        <Image
          testID="hero-image"
          source={{ uri: imageUri }}
          style={styles.image}
          cachePolicy="memory-disk"
          contentFit="cover"
        />
      </Animated.View>
      {/* Gradient overlays */}
      <LinearGradient
        colors={["rgba(0,0,0,0.25)", "transparent"]}
        style={styles.topGradient}
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.04)", "rgba(0,0,0,0.40)"]}
        locations={[0.25, 0.55, 1]}
        style={styles.bottomGradient}
      />
      {/* Bottom hero overlay: party size + time chip */}
      <View style={styles.chipRow}>
        <View style={styles.chip}>
          <Users size={13} color={C.dark} strokeWidth={2} />
          <Text style={styles.chipText}>{partySize} pers</Text>
        </View>
        <View style={styles.chip}>
          <Clock size={13} color={C.dark} strokeWidth={2} />
          <Text style={styles.chipText}>{displayTime}</Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    height: HERO_HEIGHT,
    overflow: "hidden",
  },
  imageWrapper: {
    width: "100%",
    height: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: C.bgInput,
  },
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: HERO_HEIGHT * 0.6,
  },
  chipRow: {
    position: "absolute",
    bottom: 14,
    left: SPACING.lg,
    right: SPACING.lg,
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  chipText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    color: C.dark,
  },
});
