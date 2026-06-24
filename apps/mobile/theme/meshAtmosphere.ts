import { DUSTY_VARIANTS } from "./dustyVariants";
import { SPECTRUM_PALETTE } from "./spectrumPalette";
import { isLightVisualTheme, type VisualTheme } from "./types";

export type MeshWash = {
  x: number;
  y: number;
  rx: number;
  ry: number;
  color: string;
  opacity: number;
  blur: number;
};

export type MeshAtmosphereConfig = {
  base: string;
  washes: MeshWash[];
  matte?: string;
  grainOpacity: number;
  vignetteStrength: number;
  paperRule?: boolean;
};

function wash(
  x: number,
  y: number,
  rx: number,
  ry: number,
  color: string,
  opacity: number,
  blur: number,
): MeshWash {
  return { x, y, rx, ry, color, opacity, blur };
}

function atmosphereFor(themeId: VisualTheme): MeshAtmosphereConfig {
  if (themeId === "spectrum") {
    const v = DUSTY_VARIANTS.spectrum;
    return {
      base: SPECTRUM_PALETTE.bg,
      matte: "rgba(212,202,228,0.4)",
      grainOpacity: v.grainOpacity,
      vignetteStrength: 0.06,
      paperRule: true,
      washes: [
        wash(0.5, 0.42, 0.9, 0.7, SPECTRUM_PALETTE.violetLight, 0.22, 88),
        wash(0.22, 0.16, 0.55, 0.45, SPECTRUM_PALETTE.yellowSoft, 0.14, 72),
        wash(0.78, 0.18, 0.55, 0.48, SPECTRUM_PALETTE.violet, 0.16, 72),
      ],
    };
  }

  const v = DUSTY_VARIANTS[themeId] ?? DUSTY_VARIANTS.dusty;
  const isLight = isLightVisualTheme(themeId);
  return {
    base: v.void,
    matte: isLight ? "rgba(255,255,255,0.35)" : `rgba(0,0,0,${themeId === "noir" ? 0.35 : 0.22})`,
    grainOpacity: v.grainOpacity,
    vignetteStrength: isLight ? 0.1 : themeId === "noir" ? 0.45 : 0.36,
    paperRule: isLight,
    washes: [
      wash(0.18, 0.1, 0.78, 0.52, v.peach, isLight ? 0.28 : 0.42, 64),
      wash(0.72, 0.22, 0.7, 0.58, v.lavender, isLight ? 0.32 : 0.48, 64),
      wash(0.42, 0.48, 0.92, 0.72, v.mauve, isLight ? 0.26 : 0.38, 64),
      wash(0.88, 0.62, 0.62, 0.5, v.rose, isLight ? 0.22 : 0.32, 58),
    ],
  };
}

const CACHE: Partial<Record<VisualTheme, MeshAtmosphereConfig>> = {};

export function meshAtmosphereForTheme(themeId: VisualTheme): MeshAtmosphereConfig {
  if (themeId === "spectrum") {
    return atmosphereFor(themeId);
  }
  if (!CACHE[themeId]) CACHE[themeId] = atmosphereFor(themeId);
  return CACHE[themeId]!;
}
