import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Star, MapPin, Globe, Instagram } from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { C, FONTS, SPACING, RADIUS, ICON } from "../lib/theme";

interface RestaurantInfoProps {
  name: string;
  rating: number;
  reviewCount: number;
  cuisine: string;
  priceLevel: number;
  address: string;
  website: string | null;
  instagram: string | null;
  tags: string[];
  vibeTags: { label: string; count: number }[];
  onOpenMap: () => void;
  onOpenWebsite: () => void;
  onOpenInstagram: () => void;
}

export const RestaurantInfo = React.memo(function RestaurantInfo({
  name,
  rating,
  reviewCount,
  cuisine,
  priceLevel,
  address,
  website,
  instagram,
  tags,
  vibeTags,
  onOpenMap,
  onOpenWebsite,
  onOpenInstagram,
}: RestaurantInfoProps) {
  return (
    <Animated.View
      entering={FadeInDown.springify().damping(16)}
      style={styles.container}
    >
      <Text
        testID="restaurant-name"
        style={styles.name}
        numberOfLines={2}
      >
        {name}
      </Text>

      {/* Rating + cuisine row */}
      <View style={styles.ratingRow}>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              size={13}
              color={C.gold}
              fill={rating >= s ? C.gold : "transparent"}
              strokeWidth={ICON.strokeWidth}
            />
          ))}
        </View>
        <Text style={styles.ratingText}>{rating}</Text>
        <Text style={styles.reviewCount}>({reviewCount})</Text>
        <View style={styles.dot} />
        <Text style={styles.cuisineText}>{cuisine}</Text>
        <View style={styles.dotSmall} />
        <Text style={styles.cuisineText}>
          {"€".repeat(priceLevel)}
        </Text>
      </View>

      {/* Address */}
      <Pressable
        testID="map-link"
        accessibilityLabel="Visa på karta"
        onPress={onOpenMap}
        style={({ pressed }) => [styles.addressLink, { opacity: pressed ? 0.6 : 1 }]}
      >
        <MapPin size={13} color={C.textTertiary} strokeWidth={2} />
        <Text style={styles.addressText}>{address}</Text>
      </Pressable>

      {/* Tags row */}
      {(tags.length > 0 || vibeTags.length > 0) ? (
        <View style={styles.tagsRow}>
          {tags.map((tag: string) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
          {vibeTags.map((vt) => (
            <View key={vt.label} style={styles.vibeTag}>
              <Text style={styles.vibeTagText}>{vt.label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Links */}
      <View style={styles.linksRow}>
        {website ? (
          <Pressable
            testID="website-link"
            accessibilityLabel="Besök hemsida"
            onPress={onOpenWebsite}
            style={({ pressed }) => [styles.pillLink, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Globe size={13} color={C.textSecondary} strokeWidth={2} />
            <Text style={styles.pillLinkText}>
              {website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
            </Text>
          </Pressable>
        ) : null}
        {instagram ? (
          <Pressable
            testID="instagram-link"
            accessibilityLabel="Öppna Instagram"
            onPress={onOpenInstagram}
            style={({ pressed }) => [styles.pillLink, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Instagram size={13} color={C.textSecondary} strokeWidth={2} />
            <Text style={styles.pillLinkText}>@{instagram}</Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 20,
  },
  name: {
    fontFamily: FONTS.displayBold,
    fontSize: 28,
    color: C.textPrimary,
    letterSpacing: -0.8,
    lineHeight: 34,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 6,
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingText: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: C.gold,
  },
  reviewCount: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: C.textTertiary,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: C.textTertiary,
    marginHorizontal: 4,
  },
  dotSmall: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: C.textTertiary,
    marginHorizontal: 2,
  },
  cuisineText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: C.textSecondary,
  },
  addressLink: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 5,
  },
  addressText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: C.textSecondary,
    textDecorationLine: "underline",
    textDecorationColor: "rgba(0,0,0,0.1)",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 14,
  },
  tag: {
    backgroundColor: C.successLight,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: C.success,
  },
  vibeTag: {
    backgroundColor: "rgba(201,169,110,0.10)",
    borderRadius: RADIUS.lg,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  vibeTagText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: C.gold,
  },
  linksRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
  },
  pillLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.04)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillLinkText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: C.textSecondary,
  },
});
