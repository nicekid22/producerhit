import { useCallback } from "react";
import * as Haptics from "expo-haptics";
import { Pressable, type GestureResponderEvent, type PressableProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useTheme } from "@/theme/ThemeProvider";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, "style"> & {
  style?: StyleProp<ViewStyle>;
  haptic?: boolean;
};

export function usePressScale() {
  const { motion } = useTheme();
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = useCallback(() => {
    if (reduced) return;
    scale.value = withTiming(motion.pressScale, { duration: motion.pressDuration });
  }, [motion.pressDuration, motion.pressScale, reduced, scale]);

  const onPressOut = useCallback(() => {
    if (reduced) return;
    scale.value = withTiming(1, { duration: motion.pressDuration });
  }, [motion.pressDuration, reduced, scale]);

  return { animatedStyle, onPressIn, onPressOut };
}

export function PressableScale({ children, onPress, haptic = true, style, onPressIn, onPressOut, ...rest }: Props) {
  const { animatedStyle, onPressIn: scaleIn, onPressOut: scaleOut } = usePressScale();

  return (
    <AnimatedPressable
      {...rest}
      style={[animatedStyle, style]}
      onPress={(e: GestureResponderEvent) => {
        if (haptic) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(e);
      }}
      onPressIn={(e: GestureResponderEvent) => {
        scaleIn();
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        scaleOut();
        onPressOut?.(e);
      }}
    >
      {children}
    </AnimatedPressable>
  );
}
