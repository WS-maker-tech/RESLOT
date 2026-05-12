import { useEffect, useState } from "react";
import { AccessibilityInfo, Platform } from "react-native";

/**
 * useReducedMotion — Google/Apple accessibility-respect för animations.
 *
 * Returnerar `true` om user har slagit på Reduce Motion i system-settings.
 * Komponenter ska då skippa motion-heavy entrances och bara använda opacity-fades.
 *
 * Usage:
 *   const reduce = useReducedMotion();
 *   <Animated.View entering={reduce ? FadeIn.duration(120) : FadeInDown.duration(220)} />
 *
 * För Reanimated entering-animations finns även `reduceMotion`-config-prop direkt
 * på FadeInDown etc. Den hooken är primärt för custom withTiming/withSpring-calls.
 */
export function useReducedMotion(): boolean {
  const [reduce, setReduce] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReduce(enabled);
    });

    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (enabled: boolean) => {
        if (mounted) setReduce(enabled);
      }
    );

    return () => {
      mounted = false;
      // Reanimated subscription cleanup-pattern varierar per RN-version
      if (typeof (sub as any)?.remove === "function") (sub as any).remove();
    };
  }, []);

  // Web: Use CSS prefers-reduced-motion as fallback
  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduce(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  return reduce;
}
