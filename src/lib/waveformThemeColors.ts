import type { CloudAccent } from "@/stores/cloudAccentStore";
import type { VisualTheme } from "@/stores/visualThemeStore";

const CLOUD_ACCENT_HEX: Record<CloudAccent, string> = {
  transparent: "#8a9cff",
  green: "#7ec850",
  red: "#e87858",
  blue: "#58a8e8",
};

function parseHexColor(hex: string): [number, number, number] | null {
  const h = hex.replace("#", "").trim();
  if (h.length === 3) {
    return [
      Number.parseInt(h[0] + h[0], 16),
      Number.parseInt(h[1] + h[1], 16),
      Number.parseInt(h[2] + h[2], 16),
    ];
  }
  if (h.length >= 6) {
    return [
      Number.parseInt(h.slice(0, 2), 16),
      Number.parseInt(h.slice(2, 4), 16),
      Number.parseInt(h.slice(4, 6), 16),
    ];
  }
  return null;
}

function rgbaFromHex(hex: string, alpha: number): string {
  const rgb = parseHexColor(hex);
  if (!rgb) return `rgba(192, 38, 211, ${alpha})`;
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

function readCloudAccentHex(cloudAccent?: CloudAccent): string {
  if (typeof document !== "undefined") {
    const css = getComputedStyle(document.body).getPropertyValue("--cloud-accent").trim();
    if (css) return css;
  }
  if (cloudAccent) return CLOUD_ACCENT_HEX[cloudAccent];
  return CLOUD_ACCENT_HEX.transparent;
}

export function getWaveformColors(theme: VisualTheme, cloudAccent?: CloudAccent) {
  if (theme === "warm-glass") {
    return {
      played: "rgba(255, 201, 120, 0.95)",
      unplayed: "rgba(255, 230, 200, 0.22)",
      gradientStart: "rgba(255, 160, 190, 0.62)",
      gradientEnd: "rgba(255, 201, 120, 0.98)",
    };
  }

  if (theme === "cloud") {
    const accent = readCloudAccentHex(cloudAccent);
    return {
      played: rgbaFromHex(accent, 0.92),
      unplayed: rgbaFromHex(accent, 0.16),
      gradientStart: rgbaFromHex(accent, 0.48),
      gradientEnd: rgbaFromHex(accent, 0.95),
    };
  }

  return {
    played: "rgba(236, 72, 153, 0.95)",
    unplayed: "rgba(255, 255, 255, 0.14)",
    gradientStart: "rgba(168, 85, 247, 0.95)",
    gradientEnd: "rgba(244, 63, 94, 0.95)",
  };
}

/** Interpolation RGB pour le visualiseur canvas du player dock. */
export function getPlayerVisualizerRgb(theme: VisualTheme, t: number, cloudAccent?: CloudAccent): [number, number, number] {
  if (theme === "warm-glass") {
    const r = Math.round(255 + (255 - 255) * t);
    const g = Math.round(220 + (107 - 220) * t);
    const b = Math.round(180 + (138 - 180) * t);
    return [r, g, b];
  }

  if (theme === "cloud") {
    const accent = parseHexColor(readCloudAccentHex(cloudAccent));
    if (accent) {
      const [ar, ag, ab] = accent;
      const r = Math.round(240 + (ar - 240) * t);
      const g = Math.round(248 + (ag - 248) * t);
      const b = Math.round(252 + (ab - 252) * t);
      return [r, g, b];
    }
  }

  /* Prism default: violet → fuchsia → rose across the bar */
  if (t < 0.5) {
    const k = t / 0.5;
    const r = Math.round(168 + (236 - 168) * k);
    const g = Math.round(85 + (72 - 85) * k);
    const b = Math.round(247 + (153 - 247) * k);
    return [r, g, b];
  }
  const k = (t - 0.5) / 0.5;
  const r = Math.round(236 + (244 - 236) * k);
  const g = Math.round(72 + (63 - 72) * k);
  const b = Math.round(153 + (94 - 153) * k);
  return [r, g, b];
}
