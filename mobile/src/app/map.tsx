import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MapPin, ArrowLeft } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { C, FONTS, SPACING, RADIUS } from "@/lib/theme";

export default function MapScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} testID="map-screen">
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} testID="map-back-button">
          <ArrowLeft size={22} color={C.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Kartvy</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Placeholder content */}
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(500)} style={styles.card}>
          <View style={styles.iconCircle}>
            <MapPin size={36} color={C.coral} />
          </View>

          <Text style={styles.title}>Kartvy kommer snart!</Text>
          <Text style={styles.description}>
            Här kommer du kunna se tillgängliga bokningar på en karta.
          </Text>

          <View style={styles.featureList}>
            {[
              "Se bokningar nära dig",
              "Filtrera på restaurangtyp",
              "Navigera direkt till restaurangen",
            ].map((feature, i) => (
              <View key={i} style={styles.featureRow}>
                <View style={styles.dot} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: C.bgCard,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 18,
    color: C.textPrimary,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.xl,
  },
  card: {
    backgroundColor: C.bgCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: "center",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.coralLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SPACING.lg,
  },
  title: {
    fontFamily: FONTS.displayBold,
    fontSize: 20,
    color: C.textPrimary,
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  description: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: C.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  featureList: {
    alignSelf: "stretch",
    gap: SPACING.sm,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.coral,
  },
  featureText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: C.textPrimary,
  },
});
