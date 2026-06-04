import type { VisualTheme } from "@/stores/visualThemeStore";

export function getWaveformColors(theme: VisualTheme) {
  if (theme === "warm-glass") {
    return {
      played: "rgba(255, 201, 120, 0.95)",
      unplayed: "rgba(255, 230, 200, 0.22)",
      gradientStart: "rgba(255, 160, 190, 0.62)",
      gradientEnd: "rgba(255, 201, 120, 0.98)",
    };
  }

  return {
    played: "rgba(103, 195, 255, 0.92)",
    unplayed: "rgba(255, 255, 255, 0.14)",
    gradientStart: "rgba(157, 124, 255, 0.55)",
    gradientEnd: "rgba(103, 195, 255, 0.95)",
  };
}

/** Interpolation RGB pour le visualiseur canvas du player dock. */
export function getPlayerVisualizerRgb(theme: VisualTheme, t: number): [number, number, number] {
  if (theme === "warm-glass") {
    const r = Math.round(255 + (255 - 255) * t);
    const g = Math.round(220 + (107 - 220) * t);
    const b = Math.round(180 + (138 - 180) * t);
    return [r, g, b];
  }

  const r = Math.round(203 + (103 - 203) * t);
  const g = Math.round(213 + (195 - 213) * t);
  const b = Math.round(225 + (255 - 225) * t);
  return [r, g, b];
}
