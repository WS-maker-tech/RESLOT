import React, { useCallback } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { C, FONTS, SPACING } from "../lib/theme";

const CITY_NEIGHBORHOODS: Record<string, string[]> = {
  "Stockholm": ["City", "Östermalm", "Södermalm", "Vasastan", "Gamla stan", "Kungsholmen"],
  "Göteborg": ["Centrum", "Linnéstaden", "Majorna", "Haga", "Järntorget", "Östra Göteborg"],
  "Malmö": ["Centrum", "Möllevången", "Limhamn", "Husie", "Hyllie", "Västra Hamnen"],
};

interface FilterChipsProps {
  active: string;
  onSelect: (filter: string) => void;
  city: string;
}

function FilterChip({
  filter,
  isActive,
  onSelect,
}: {
  filter: string;
  isActive: boolean;
  onSelect: (filter: string) => void;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      key={filter}
      testID={`filter-${filter}`}
      accessibilityLabel={`Filtrera på ${filter}`}
      onPressIn={() => {
        scale.value = withSpring(0.93, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 200 });
      }}
      onPress={() => {
        onSelect(filter);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
    >
      <Animated.View
        style={[
          animStyle,
          styles.chip,
          isActive ? styles.chipActive : styles.chipInactive,
        ]}
      >
        <Text
          style={[
            styles.chipText,
            isActive ? styles.chipTextActive : styles.chipTextInactive,
          ]}
        >
          {filter}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export const FilterChips = React.memo(function FilterChips({
  active,
  onSelect,
  city,
}: FilterChipsProps) {
  const neighborhoods = CITY_NEIGHBORHOODS[city];

  if (!neighborhoods) return null;

  const allFilters = ["Alla", ...neighborhoods];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.scroll}
    >
      {allFilters.map((filter: string) => {
        const isActive = active === filter;
        return (
          <FilterChip
            key={filter}
            filter={filter}
            isActive={isActive}
            onSelect={onSelect}
          />
        );
      })}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingLeft: SPACING.lg,
    paddingRight: SPACING.lg,
    paddingVertical: 6,
    alignItems: "center",
  },
  chip: {
    marginRight: 8,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipActive: {
    backgroundColor: C.coral,
    borderWidth: 0,
  },
  chipInactive: {
    backgroundColor: C.bgCard,
    borderWidth: 1,
    borderColor: C.borderLight,
  },
  chipText: {
    fontSize: 13,
  },
  chipTextActive: {
    fontFamily: FONTS.semiBold,
    color: "#111827",
  },
  chipTextInactive: {
    fontFamily: FONTS.medium,
    color: C.textSecondary,
  },
});
