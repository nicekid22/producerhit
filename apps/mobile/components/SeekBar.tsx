import { LayoutChangeEvent, Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  progress: number;
  onSeek: (ratio: number) => void;
  disabled?: boolean;
};

export function SeekBar({ progress, onSeek, disabled }: Props) {
  const { colors, radius } = useTheme();
  const widthRef = { current: 1 };

  const onLayout = (e: LayoutChangeEvent) => {
    widthRef.current = Math.max(1, e.nativeEvent.layout.width);
  };

  const seekAt = (locationX: number) => {
    if (disabled) return;
    const ratio = Math.min(1, Math.max(0, locationX / widthRef.current));
    onSeek(ratio);
  };

  const clamped = Math.min(1, Math.max(0, progress));

  return (
    <Pressable
      onLayout={onLayout}
      onPress={(e) => seekAt(e.nativeEvent.locationX)}
      style={[styles.track, { backgroundColor: colors.seekTrack }]}
      disabled={disabled}
    >
      <View style={[styles.fill, { width: `${clamped * 100}%`, backgroundColor: colors.seekFill }]} />
      <View
        style={[
          styles.thumb,
          { left: `${clamped * 100}%`, backgroundColor: colors.seekFill },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 24,
    justifyContent: "center",
    borderRadius: 999,
    overflow: "visible",
  },
  fill: {
    position: "absolute",
    left: 0,
    top: 10,
    height: 4,
    borderRadius: 2,
  },
  thumb: {
    position: "absolute",
    top: 6,
    width: 12,
    height: 12,
    marginLeft: -6,
    borderRadius: 6,
  },
});
