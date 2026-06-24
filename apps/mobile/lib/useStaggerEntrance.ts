import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import { useReducedMotion } from "@/lib/useReducedMotion";

const playedScreens = new Set<string>();

type Options = {
  /** Skip animation on revisit (tab remount). */
  screenKey?: string;
};

/** Fade + translateY pour entrées écran (stagger via delayMs). */
export function useStaggerEntrance(delayMs = 0, options?: Options) {
  const screenKey = options?.screenKey;
  const skipAnimation = screenKey ? playedScreens.has(screenKey) : false;
  const reduced = useReducedMotion();
  const opacity = useRef(new Animated.Value(reduced || skipAnimation ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(reduced || skipAnimation ? 0 : 14)).current;

  useEffect(() => {
    if (screenKey) playedScreens.add(screenKey);
    if (reduced || skipAnimation) return;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 280,
        delay: delayMs,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        delay: delayMs,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [delayMs, opacity, reduced, screenKey, skipAnimation, translateY]);

  return {
    style: {
      opacity,
      transform: [{ translateY }],
    },
  };
}
