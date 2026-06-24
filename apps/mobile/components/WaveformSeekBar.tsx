import { memo, useMemo, useRef } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  progress: number;
  onSeek: (ratio: number) => void;
  disabled?: boolean;
  bars?: number;
  height?: number;
};

const BASE = [0.35, 0.62, 0.48, 0.78, 0.55, 0.9, 0.42, 0.68, 0.52, 0.85, 0.38, 0.72, 0.58, 0.44, 0.8, 0.5];

export const WaveformSeekBar = memo(function WaveformSeekBar({
  progress,
  onSeek,
  disabled,
  bars = 52,
  height = 56,
}: Props) {
  const { colors } = useTheme();
  const widthRef = useRef(1);

  const seeds = useMemo(
    () => Array.from({ length: bars }, (_, i) => BASE[i % BASE.length] ?? 0.5),
    [bars],
  );

  const clamped = Math.min(1, Math.max(0, progress));
  const activeBars = Math.floor(clamped * bars);

  const onLayout = (e: LayoutChangeEvent) => {
    widthRef.current = Math.max(1, e.nativeEvent.layout.width);
  };

  const seekAt = (locationX: number) => {
    if (disabled) return;
    const ratio = Math.min(1, Math.max(0, locationX / widthRef.current));
    onSeek(ratio);
  };

  return (
    <Pressable
      onLayout={onLayout}
      onPress={(e) => seekAt(e.nativeEvent.locationX)}
      style={[styles.track, { height }]}
      disabled={disabled}
      accessibilityRole="adjustable"
    >
      {seeds.map((seed, i) => {
        const filled = i <= activeBars;
        const barH = height * (0.28 + seed * 0.72);
        return (
          <View
            key={i}
            style={[
              styles.bar,
              {
                height: barH,
                backgroundColor: filled ? colors.accentPrimary : colors.seekTrack,
                opacity: filled ? 1 : 0.4,
              },
            ]}
          />
        );
      })}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 2,
    paddingVertical: 4,
  },
  bar: {
    flex: 1,
    borderRadius: 2,
    minWidth: 2,
  },
});
