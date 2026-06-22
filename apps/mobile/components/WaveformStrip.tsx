import { useMemo } from "react";
import { View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  height?: number;
  bars?: number;
  opacity?: number;
};

export function WaveformStrip({ height = 28, bars = 40, opacity = 1 }: Props) {
  const { colors } = useTheme();

  const barHeights = useMemo(() => {
    const seed = [0.35, 0.62, 0.48, 0.78, 0.55, 0.9, 0.42, 0.68, 0.52, 0.85, 0.38, 0.72];
    return Array.from({ length: bars }, (_, i) => {
      const base = seed[i % seed.length] ?? 0.5;
      const wave = Math.sin(i * 0.45) * 0.12;
      return Math.max(0.15, Math.min(1, base + wave));
    });
  }, [bars]);

  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", height, gap: 2, opacity }}>
      {barHeights.map((h, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: height * h,
            borderRadius: 1,
            backgroundColor: colors.accent,
            opacity: 0.25 + h * 0.45,
          }}
        />
      ))}
    </View>
  );
}
