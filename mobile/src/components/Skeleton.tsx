import React from "react";
import { ViewStyle, StyleSheet, type DimensionValue } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import { C } from "../lib/theme";

interface SkeletonProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton = React.memo(function Skeleton({
  width,
  height,
  borderRadius = 6,
  style,
}: SkeletonProps) {
  const baseOpacity = useSharedValue(0.4);
  const highlightOpacity = useSharedValue(0);

  React.useEffect(() => {
    // Base layer: three-step pulse for organic breathing feel
    baseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 450 }),
        withTiming(0.4, { duration: 450 })
      ),
      -1,
      false
    );

    // Highlight layer: offset phase sweep for shimmer illusion
    highlightOpacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 450 }),
        withTiming(0, { duration: 450 })
      ),
      -1,
      false
    );
  }, []);

  const baseStyle = useAnimatedStyle(() => ({
    opacity: baseOpacity.value,
  }));

  const highlightStyle = useAnimatedStyle(() => ({
    opacity: highlightOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        baseStyle,
        styles.base,
        {
          width: width as DimensionValue,
          height,
          borderRadius,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          highlightStyle,
          styles.highlight,
          { borderRadius },
        ]}
      />
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  base: {
    backgroundColor: C.bgInput,
  },
  highlight: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
});
