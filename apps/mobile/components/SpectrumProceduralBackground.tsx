import { memo, useMemo } from "react";
import { PixelRatio, StyleSheet, useWindowDimensions } from "react-native";
import { Canvas, Fill, Shader, vec } from "@shopify/react-native-skia";
import { LinearGradient } from "expo-linear-gradient";

import { hexToRgbUnit, spectrumBackgroundEffect } from "@/lib/spectrum/spectrumBackgroundShader";
import { gradientPair } from "@/theme/gradient";
import { SPECTRUM_GRAIN_STRENGTH } from "@/theme/spectrumPalette";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Fond Spectrum intégré — dégradé mauve + grain film procédural (Skia GPU).
 * Une seule passe shader, pas d'overlay PNG tileable.
 */
export const SpectrumProceduralBackground = memo(function SpectrumProceduralBackground() {
  const { width, height } = useWindowDimensions();
  const { background } = useTheme();
  const density = PixelRatio.get();

  const uniforms = useMemo(() => {
    const [top, mid, bottom] = background.gradient;
    return {
      u_resolution: vec(width, height),
      u_grain: SPECTRUM_GRAIN_STRENGTH,
      u_density: density,
      u_top: hexToRgbUnit(top ?? "#D4CAE4"),
      u_mid: hexToRgbUnit(mid ?? "#DDD4EA"),
      u_bottom: hexToRgbUnit(bottom ?? "#C8BBD8"),
    };
  }, [background.gradient, density, height, width]);

  if (!spectrumBackgroundEffect || width <= 0 || height <= 0) {
    const stops = gradientPair(background.gradient);
    return (
      <LinearGradient
        colors={[stops[0], stops[1] ?? stops[0], background.gradient[2] ?? stops[1] ?? stops[0]]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        pointerEvents="none"
      />
    );
  }

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Fill>
        <Shader source={spectrumBackgroundEffect} uniforms={uniforms} />
      </Fill>
    </Canvas>
  );
});
