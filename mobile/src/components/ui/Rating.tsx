import React from "react";
import { Pressable, StyleProp, Text, View, ViewStyle } from "react-native";
import { Star } from "lucide-react-native";
import { C, FONTS, SPACING } from "@/lib/theme";

export type RatingProps = {
  /** Värde 0-5 (kan vara halvor: 4.5) */
  value: number;
  /** Maximalt antal stjärnor */
  max?: number;
  /** Visa numerisk värde efter stjärnor (ex '4.8') */
  showNumeric?: boolean;
  /** Storlek på stjärnan i px */
  starSize?: number;
  /** Interaktivt — onChange anropas vid klick på stjärna */
  onChange?: (newValue: number) => void;
  /** Stjärnfärg (default gold) */
  color?: string;
  /** Bakgrundsfärg på "tom" stjärna */
  emptyColor?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Rating — stjärn-display, statisk eller interaktiv.
 *
 * Användning (display):
 *   <Rating value={restaurant.rating} showNumeric />
 *
 * Användning (interaktiv för feedback):
 *   <Rating value={selected} onChange={setSelected} starSize={32} />
 */
export function Rating({
  value,
  max = 5,
  showNumeric = false,
  starSize = 14,
  onChange,
  color = C.gold,
  emptyColor = C.bgInput,
  style,
  testID,
}: RatingProps) {
  const isInteractive = typeof onChange === "function";

  return (
    <View
      testID={testID}
      style={[
        { flexDirection: "row", alignItems: "center", columnGap: SPACING.xs },
        style,
      ]}
    >
      <View style={{ flexDirection: "row", columnGap: 2 }}>
        {Array.from({ length: max }).map((_, i) => {
          const starValue = i + 1;
          const filled = value >= starValue;
          const half = !filled && value >= starValue - 0.5;

          const starNode = (
            <View key={`star-${i}`} style={{ width: starSize, height: starSize }}>
              {/* Bottom: empty */}
              <Star
                size={starSize}
                color={emptyColor}
                fill={emptyColor}
                strokeWidth={0}
              />
              {/* Overlay: filled (eller half) */}
              {(filled || half) && (
                <View
                  style={{
                    position: "absolute",
                    width: half ? starSize / 2 : starSize,
                    height: starSize,
                    overflow: "hidden",
                  }}
                >
                  <Star
                    size={starSize}
                    color={color}
                    fill={color}
                    strokeWidth={0}
                  />
                </View>
              )}
            </View>
          );

          if (isInteractive) {
            return (
              <Pressable
                key={`star-press-${i}`}
                onPress={() => onChange!(starValue)}
                accessibilityRole="button"
                accessibilityLabel={`Sätt ${starValue} av ${max} stjärnor`}
                hitSlop={4}
              >
                {starNode}
              </Pressable>
            );
          }
          return starNode;
        })}
      </View>
      {showNumeric ? (
        <Text
          style={{
            fontFamily: FONTS.semiBold,
            fontSize: 13,
            color: C.textPrimary,
            fontVariant: ["tabular-nums"],
          }}
        >
          {value.toFixed(1)}
        </Text>
      ) : null}
    </View>
  );
}
