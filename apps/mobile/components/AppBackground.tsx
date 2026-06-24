import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { SpectrumProceduralBackground } from "@/components/SpectrumProceduralBackground";
import { useTheme } from "@/theme/ThemeProvider";

/** Fond app — Spectrum : dégradé mauve + grain procédural Skia (une passe GPU). */
export const AppBackground = memo(function AppBackground() {
  const { background, theme } = useTheme();

  if (theme === "spectrum") {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <SpectrumProceduralBackground />
      </View>
    );
  }

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: background.base }]} pointerEvents="none" />
  );
});

export const AppBackgroundLayer = memo(function AppBackgroundLayer() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <AppBackground />
    </View>
  );
});
