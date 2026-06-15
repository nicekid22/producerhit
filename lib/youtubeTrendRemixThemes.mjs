/**
 * Pro YouTube lyrics templates — refs: cinematic title cards, dark premium, neon karaoke, letterbox.
 */
export const TREND_REMIX_LANDSCAPE_THEMES = [
  "cinematic-glow",
  "dark-premium",
  "neon-karaoke",
  "letterbox-cinema",
];

export function normalizeTrendRemixTheme(raw) {
  const key = String(raw ?? "cinematic-glow").trim().toLowerCase();
  if (TREND_REMIX_LANDSCAPE_THEMES.includes(key)) return key;
  return "cinematic-glow";
}

export function trendRemixLandscapeTheme() {
  return normalizeTrendRemixTheme(process.env.TREND_REMIX_LANDSCAPE_THEME ?? "cinematic-glow");
}

/** @type {Record<string, object>} */
export const TREND_REMIX_THEMES = {
  "cinematic-glow": {
    id: "cinematic-glow",
    label: "Cinematic Glow",
    ref: "Pinterest photo bg · light blur · warm veil · glowing title · prism grain",
    bgGrade: "eq=brightness=-0.02:saturation=1.18:gamma_r=1.04:gamma_g=1.02",
    blurSigma: 5,
    zoom: 0.000035,
    vignette: "PI/6",
    upscaleW: 2560,
    upscaleH: 1440,
    useSiteCta: true,
    useDust: true,
    useVeil: true,
    useNoiseGrain: true,
    noiseStrength: 2,
    dustOpacity: 0.55,
    veilOpacity: 0.22,
    svgGrainSlope: 0.048,
  },
  "dark-premium": {
    id: "dark-premium",
    label: "Dark Premium",
    ref: "Gritty dark · condensed glow title + credits",
    bgGrade: "eq=brightness=-0.18:saturation=0.88:gamma=0.92",
    blurSigma: 22,
    zoom: 0.00003,
    vignette: "PI/3.5",
    tint: "rgba(0,0,0,0.35)",
    accent: "#FF6B2C",
    accentAlt: "#4DA3FF",
  },
  "neon-karaoke": {
    id: "neon-karaoke",
    label: "Neon Karaoke",
    ref: "Purple aesthetic · neon lyric glow center",
    bgGrade: "eq=brightness=-0.10:saturation=1.35:gamma_b=1.12:gamma_r=1.04,hue=s=0.12",
    blurSigma: 8,
    zoom: 0.00005,
    vignette: "PI/4.2",
    tint: "rgba(120,40,180,0.18)",
    lyricGlow: "#FFE566",
    lyricColor: "#FFF8DC",
  },
  "letterbox-cinema": {
    id: "letterbox-cinema",
    label: "Letterbox Cinema",
    ref: "2.35 bars · yellow title · bold side lyrics",
    bgGrade: "eq=brightness=-0.06:saturation=1.05:gamma=1.0",
    blurSigma: 10,
    zoom: 0.000045,
    vignette: "PI/4.8",
    tint: "rgba(0,0,0,0.12)",
    titleColor: "#F5D547",
    lyricColor: "#FFFFFF",
  },
};

export function getTrendRemixTheme(themeId) {
  return TREND_REMIX_THEMES[normalizeTrendRemixTheme(themeId)] ?? TREND_REMIX_THEMES["cinematic-glow"];
}
