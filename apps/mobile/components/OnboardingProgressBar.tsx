import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  total: number;
  active: number;
};

export function OnboardingProgressBar({ total, active }: Props) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;
  const ratio = total <= 1 ? 1 : (active + 1) / total;

  useEffect(() => {
    if (reduced) {
      progress.setValue(ratio);
      return;
    }
    Animated.spring(progress, {
      toValue: ratio,
      friction: 9,
      tension: 80,
      useNativeDriver: false,
    }).start();
  }, [active, progress, ratio, reduced]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={[styles.track, { backgroundColor: colors.surfaceBorder }]}>
      <Animated.View style={[styles.fill, { width, backgroundColor: colors.accentPrimary }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
    width: "100%",
  },
  fill: {
    height: "100%",
    borderRadius: 2,
  },
});
