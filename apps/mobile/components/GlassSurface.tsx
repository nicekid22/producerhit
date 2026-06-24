import { memo } from "react";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

type Props = {
  intensity?: number;
  tint?: "light" | "dark" | "default";
  /** Semi-opaque fill when blur is unavailable (Android / Expo Go mismatch). */
  fallbackColor?: string;
  style?: StyleProp<ViewStyle>;
  /** Subtle top highlight for liquid glass */
  highlight?: string;
};

/** Apple-style glass with safe fallback — never renders a broken native view. */
export const GlassSurface = memo(function GlassSurface({
  intensity = 32,
  tint = "dark",
  fallbackColor = "rgba(18, 18, 20, 0.88)",
  highlight = "rgba(255,255,255,0.06)",
  style,
}: Props) {
  if (Platform.OS === "ios") {
    return (
      <>
        <BlurView intensity={intensity} tint={tint} style={[StyleSheet.absoluteFill, style]} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(255,255,255,0.04)" }]} pointerEvents="none" />
        {highlight ? (
          <View
            style={[styles.highlight, { backgroundColor: highlight }]}
            pointerEvents="none"
          />
        ) : null}
      </>
    );
  }

  return (
    <>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: fallbackColor }, style]} />
      {highlight ? (
        <View style={[styles.highlight, { backgroundColor: highlight }]} pointerEvents="none" />
      ) : null}
    </>
  );
});

const styles = StyleSheet.create({
  highlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
});
