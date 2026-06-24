import { memo, useEffect, useMemo, useRef } from "react";
import { Animated, Easing, View } from "react-native";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  height?: number;
  bars?: number;
  opacity?: number;
  active?: boolean;
};

export const AnimatedWaveformStrip = memo(function AnimatedWaveformStrip({
  height = 32,
  bars = 36,
  opacity = 1,
  active = false,
}: Props) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const phase = useRef(new Animated.Value(0)).current;

  const seeds = useMemo(() => {
    const base = [0.35, 0.62, 0.48, 0.78, 0.55, 0.9, 0.42, 0.68, 0.52, 0.85, 0.38, 0.72];
    return Array.from({ length: bars }, (_, i) => base[i % base.length] ?? 0.5);
  }, [bars]);

  useEffect(() => {
    if (reduced || !active) return;
    const loop = Animated.loop(
      Animated.timing(phase, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [active, phase, reduced]);

  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", height, gap: 2, opacity }}>
      {seeds.map((seed, i) => {
        const scale = reduced || !active
          ? seed * 0.45
          : phase.interpolate({
              inputRange: [0, 0.25, 0.5, 0.75, 1],
              outputRange: [seed * 0.55, seed * 1.05, seed * 0.7, seed * 1.15, seed * 0.55],
            });
        return (
          <Animated.View
            key={i}
            style={{
              flex: 1,
              height,
              borderRadius: 2,
              backgroundColor: colors.accentPrimary,
              opacity: 0.35 + seed * 0.45,
              transform: [{ scaleY: scale }],
            }}
          />
        );
      })}
    </View>
  );
});
