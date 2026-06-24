import type { VisualTheme } from "./types";

/** Raw palette per Dusty Cloud color variant (Apple-inspired 2026). */
export type DustyVariantDef = {
  id: VisualTheme;
  void: string;
  surface: string;
  elevated: string;
  highlight: string;
  rose: string;
  peach: string;
  peachLight: string;
  mauve: string;
  lavender: string;
  lavenderLight: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  shadowBase: string;
  statusBar: "light" | "dark";
  grainOpacity: number;
  glassSurface: string;
  glassBorder: string;
  glassHighlight: string;
  pillActiveBg: string;
  pillActiveText: string;
  tabBarBg: string;
  overlay: string;
  seekTrack: string;
};

/** Default — studio mauve (ex-prism). */
const DUSTY_CORE: DustyVariantDef = {
  id: "dusty",
  void: "#1A1220",
  surface: "#221729",
  elevated: "#2C1F35",
  highlight: "#38273F",
  rose: "#C4687A",
  peach: "#D4847A",
  peachLight: "#E8A598",
  mauve: "#8B6FA8",
  lavender: "#A688C4",
  lavenderLight: "#C4AEDE",
  text: "#F5EEF8",
  textSecondary: "rgba(245,238,248,0.6)",
  textTertiary: "rgba(245,238,248,0.3)",
  shadowBase: "#0D0810",
  statusBar: "light",
  grainOpacity: 0.055,
  glassSurface: "rgba(255,255,255,0.05)",
  glassBorder: "rgba(245,238,248,0.08)",
  glassHighlight: "rgba(245,238,248,0.08)",
  pillActiveBg: "rgba(139,111,168,0.22)",
  pillActiveText: "#C4AEDE",
  tabBarBg: "rgba(26,18,32,0.96)",
  overlay: "rgba(13,8,16,0.72)",
  seekTrack: "rgba(245,238,248,0.12)",
};

/** iOS light — Settings / Music clair. */
const DUSTY_LIGHT: DustyVariantDef = {
  id: "light",
  void: "#F2F2F7",
  surface: "#FFFFFF",
  elevated: "#FFFFFF",
  highlight: "#E5E5EA",
  rose: "#B85C6E",
  peach: "#C97A6A",
  peachLight: "#E8A89A",
  mauve: "#6B5B95",
  lavender: "#8B7AB8",
  lavenderLight: "#6B5B95",
  text: "#1C1C1E",
  textSecondary: "rgba(60,60,67,0.65)",
  textTertiary: "rgba(60,60,67,0.35)",
  shadowBase: "#000000",
  statusBar: "dark",
  grainOpacity: 0.03,
  glassSurface: "rgba(255,255,255,0.88)",
  glassBorder: "rgba(60,60,67,0.1)",
  glassHighlight: "rgba(255,255,255,0.9)",
  pillActiveBg: "rgba(107,91,149,0.14)",
  pillActiveText: "#6B5B95",
  tabBarBg: "rgba(255,255,255,0.94)",
  overlay: "rgba(0,0,0,0.35)",
  seekTrack: "rgba(60,60,67,0.12)",
};

/** Chaud — ambre & terre cuite sur fond sombre. */
const DUSTY_WARM: DustyVariantDef = {
  id: "warm",
  void: "#1A1410",
  surface: "#241C16",
  elevated: "#2E241C",
  highlight: "#3A2E24",
  rose: "#D4847A",
  peach: "#E8A574",
  peachLight: "#F0C49A",
  mauve: "#B8886A",
  lavender: "#D4A88C",
  lavenderLight: "#E8C4A8",
  text: "#F8F0E8",
  textSecondary: "rgba(248,240,232,0.62)",
  textTertiary: "rgba(248,240,232,0.32)",
  shadowBase: "#0C0806",
  statusBar: "light",
  grainOpacity: 0.05,
  glassSurface: "rgba(255,248,240,0.06)",
  glassBorder: "rgba(248,240,232,0.1)",
  glassHighlight: "rgba(255,248,240,0.08)",
  pillActiveBg: "rgba(232,164,116,0.2)",
  pillActiveText: "#F0C49A",
  tabBarBg: "rgba(26,20,16,0.96)",
  overlay: "rgba(12,8,6,0.75)",
  seekTrack: "rgba(248,240,232,0.12)",
};

/** Pastel — brume lavande douce. */
const DUSTY_PASTEL: DustyVariantDef = {
  id: "pastel",
  void: "#2A2438",
  surface: "#322C42",
  elevated: "#3C354E",
  highlight: "#48405A",
  rose: "#E8B4B8",
  peach: "#E8C4B8",
  peachLight: "#F0D8D0",
  mauve: "#B8A9C9",
  lavender: "#C9B8DA",
  lavenderLight: "#D8C8E8",
  text: "#F5F0FA",
  textSecondary: "rgba(245,240,250,0.58)",
  textTertiary: "rgba(245,240,250,0.3)",
  shadowBase: "#14101C",
  statusBar: "light",
  grainOpacity: 0.045,
  glassSurface: "rgba(255,255,255,0.06)",
  glassBorder: "rgba(216,200,232,0.12)",
  glassHighlight: "rgba(255,255,255,0.07)",
  pillActiveBg: "rgba(201,184,218,0.18)",
  pillActiveText: "#D8C8E8",
  tabBarBg: "rgba(42,36,56,0.96)",
  overlay: "rgba(20,16,28,0.72)",
  seekTrack: "rgba(245,240,250,0.1)",
};

/** Bloom — accents vifs type iOS vibrant. */
const DUSTY_BLOOM: DustyVariantDef = {
  id: "bloom",
  void: "#1F1228",
  surface: "#281830",
  elevated: "#321E3C",
  highlight: "#3E264A",
  rose: "#FF6B9D",
  peach: "#FF8FA8",
  peachLight: "#FFB3C6",
  mauve: "#9B5DE5",
  lavender: "#B47AFF",
  lavenderLight: "#C99BFF",
  text: "#FAF5FF",
  textSecondary: "rgba(250,245,255,0.62)",
  textTertiary: "rgba(250,245,255,0.32)",
  shadowBase: "#0A0610",
  statusBar: "light",
  grainOpacity: 0.05,
  glassSurface: "rgba(255,255,255,0.06)",
  glassBorder: "rgba(201,155,255,0.14)",
  glassHighlight: "rgba(255,255,255,0.09)",
  pillActiveBg: "rgba(155,93,229,0.24)",
  pillActiveText: "#C99BFF",
  tabBarBg: "rgba(31,18,40,0.96)",
  overlay: "rgba(10,6,16,0.74)",
  seekTrack: "rgba(250,245,255,0.12)",
};

/** Spectrum — logo : fond mauve violet grainé, accents jaune pastel → violet uniquement. */
const DUSTY_SPECTRUM: DustyVariantDef = {
  id: "spectrum",
  void: "#D4CAE4",
  surface: "#DDD4EA",
  elevated: "#E4DCEF",
  highlight: "#C8BBD8",
  rose: "#FFE8B8",
  peach: "#FFE8B8",
  peachLight: "#FFF4D8",
  mauve: "#C4B5DC",
  lavender: "#A894C8",
  lavenderLight: "#9580B8",
  text: "#4A4060",
  textSecondary: "rgba(74,64,96,0.58)",
  textTertiary: "rgba(74,64,96,0.36)",
  shadowBase: "#A894C8",
  statusBar: "dark",
  grainOpacity: 0.14,
  glassSurface: "rgba(228,220,239,0.72)",
  glassBorder: "rgba(168,148,200,0.35)",
  glassHighlight: "rgba(255,244,216,0.28)",
  pillActiveBg: "rgba(168,148,200,0.22)",
  pillActiveText: "#9580B8",
  tabBarBg: "rgba(212,202,228,0.94)",
  overlay: "rgba(74,64,96,0.28)",
  seekTrack: "rgba(74,64,96,0.1)",
};

/** Noir — OLED minimal, accent argent-bleu. */
const DUSTY_NOIR: DustyVariantDef = {
  id: "noir",
  void: "#0A0A0C",
  surface: "#121214",
  elevated: "#1C1C1E",
  highlight: "#2C2C2E",
  rose: "#FF6B6B",
  peach: "#FF8E8E",
  peachLight: "#FFB3B3",
  mauve: "#5E5CE6",
  lavender: "#7D7AFF",
  lavenderLight: "#9896FF",
  text: "#F5F5F7",
  textSecondary: "rgba(245,245,247,0.55)",
  textTertiary: "rgba(245,245,247,0.28)",
  shadowBase: "#000000",
  statusBar: "light",
  grainOpacity: 0.04,
  glassSurface: "rgba(255,255,255,0.04)",
  glassBorder: "rgba(245,245,247,0.08)",
  glassHighlight: "rgba(255,255,255,0.06)",
  pillActiveBg: "rgba(94,92,230,0.2)",
  pillActiveText: "#9896FF",
  tabBarBg: "rgba(10,10,12,0.97)",
  overlay: "rgba(0,0,0,0.82)",
  seekTrack: "rgba(245,245,247,0.1)",
};

export const DUSTY_VARIANTS: Record<VisualTheme, DustyVariantDef> = {
  dusty: DUSTY_CORE,
  light: DUSTY_LIGHT,
  warm: DUSTY_WARM,
  pastel: DUSTY_PASTEL,
  bloom: DUSTY_BLOOM,
  noir: DUSTY_NOIR,
  spectrum: DUSTY_SPECTRUM,
};

export function dustyOrbMeshFrom(def: DustyVariantDef) {
  if (def.id === "spectrum") {
    return {
      apex: def.peachLight,
      gold: def.peach,
      mid: def.mauve,
      violet: def.lavender,
      base: def.lavenderLight,
      coral: def.peach,
      hot: def.lavender,
      cyan: def.mauve,
      ice: def.peachLight,
      rose: def.peach,
      sky: def.lavender,
      lavender: def.mauve,
      cream: def.peachLight,
    };
  }
  return {
    apex: def.peachLight,
    gold: def.peach,
    mid: def.mauve,
    violet: def.lavender,
    base: def.rose,
    coral: def.rose,
    hot: def.lavenderLight,
    cyan: def.lavender,
    ice: def.lavenderLight,
    rose: def.rose,
    sky: def.lavender,
    lavender: def.lavenderLight,
    cream: def.text,
  };
}
