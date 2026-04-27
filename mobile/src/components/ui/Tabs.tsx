import React from "react";
import {
  Pressable,
  StyleProp,
  Text,
  View,
  ViewStyle,
  LayoutChangeEvent,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { C, FONTS, MOTION, SPACING } from "@/lib/theme";

export type TabItem<T extends string = string> = {
  key: T;
  label: string;
  badge?: string | number | null;
};

export type TabsProps<T extends string = string> = {
  /** Tab-definitioner */
  items: TabItem<T>[];
  /** Aktivt tab-key */
  active: T;
  /** onChange anropas när användaren byter tab */
  onChange: (key: T) => void;
  /** size sm/md */
  size?: "sm" | "md";
  /** Underline-färg */
  underlineColor?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const SIZE_CONFIG = {
  sm: { paddingV: SPACING.sm, fontSize: 13, gap: SPACING.lg },
  md: { paddingV: SPACING.md, fontSize: 14, gap: SPACING.xl },
} as const;

/**
 * Tabs — animerad underline-tab-rad.
 *
 * Användning:
 *   const [active, setActive] = useState<'all' | 'active'>('all');
 *   <Tabs
 *     items={[{ key: 'all', label: 'Alla' }, { key: 'active', label: 'Aktiva' }]}
 *     active={active}
 *     onChange={setActive}
 *   />
 */
export function Tabs<T extends string = string>({
  items,
  active,
  onChange,
  size = "md",
  underlineColor = C.pistachio,
  style,
  testID,
}: TabsProps<T>) {
  const cfg = SIZE_CONFIG[size];

  // Track each tab's layout for underline-positioning
  const layouts = React.useRef<Record<string, { x: number; w: number }>>({});
  const underlineX = useSharedValue(0);
  const underlineW = useSharedValue(0);

  const handleLayout = (key: T) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    layouts.current[key] = { x, w: width };
    if (key === active) {
      underlineX.value = withTiming(x, { duration: MOTION.duration.ease });
      underlineW.value = withTiming(width, { duration: MOTION.duration.ease });
    }
  };

  React.useEffect(() => {
    const layout = layouts.current[active];
    if (layout) {
      underlineX.value = withSpring(layout.x, MOTION.easing.spring);
      underlineW.value = withSpring(layout.w, MOTION.easing.spring);
    }
  }, [active]);

  const underlineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: underlineX.value }],
    width: underlineW.value,
  }));

  return (
    <View
      testID={testID}
      style={[
        {
          flexDirection: "row",
          borderBottomWidth: 1,
          borderBottomColor: C.divider,
          columnGap: cfg.gap,
          paddingHorizontal: SPACING.lg,
        },
        style,
      ]}
    >
      {items.map((item) => {
        const isActive = item.key === active;
        return (
          <Pressable
            key={item.key}
            onPress={() => onChange(item.key)}
            onLayout={handleLayout(item.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            style={{ paddingVertical: cfg.paddingV }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", columnGap: SPACING.xs }}>
              <Text
                style={{
                  fontFamily: isActive ? FONTS.semiBold : FONTS.medium,
                  fontSize: cfg.fontSize,
                  color: isActive ? C.textPrimary : C.textSecondary,
                  letterSpacing: -0.1,
                }}
              >
                {item.label}
              </Text>
              {item.badge != null ? (
                <View
                  style={{
                    backgroundColor: isActive ? C.pistachioLight : C.bgInput,
                    paddingHorizontal: SPACING.xs,
                    paddingVertical: 1,
                    borderRadius: 999,
                    minWidth: 18,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: FONTS.semiBold,
                      fontSize: 10,
                      color: isActive ? C.pistachio : C.textTertiary,
                    }}
                  >
                    {String(item.badge)}
                  </Text>
                </View>
              ) : null}
            </View>
          </Pressable>
        );
      })}

      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: -1,
            left: SPACING.lg,
            height: 2,
            backgroundColor: underlineColor,
            borderRadius: 1,
          },
          underlineStyle,
        ]}
      />
    </View>
  );
}
