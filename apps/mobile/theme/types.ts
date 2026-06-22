import type { TextStyle } from "react-native";

export type VisualTheme = "prism" | "air" | "warm";

export type ThemeMaterial = "studio" | "paper" | "flat";

export type ThemeColors = {
  bg: string;
  bgElevated: string;
  bgGlass: string;
  surface: string;
  surfaceBorder: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  accent: string;
  /** Solid CTA fill — gradient only when explicitly requested */
  accentSolid: string;
  accentGradient: readonly [string, string];
  pillActiveBg: string;
  pillActiveText: string;
  success: string;
  warning: string;
  danger: string;
  tabInactive: string;
  tabBarBg: string;
  tabBarBorder: string;
  overlay: string;
  shadow: string;
  logoBase: string;
  logoAccent: string;
  statusBar: "light" | "dark";
  seekTrack: string;
  seekFill: string;
};

export type ThemeTypography = {
  display: TextStyle;
  title: TextStyle;
  subtitle: TextStyle;
  body: TextStyle;
  caption: TextStyle;
  micro: TextStyle;
  mono: TextStyle;
  displayFontFamily?: string;
};

export type ThemeRadius = {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  cover: number;
  pill: number;
};

export type ThemeElevation = {
  card: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
};

export type ThemeMotion = {
  pressScale: number;
  pressDuration: number;
  modalDuration: number;
};

export type ThemeTokens = {
  theme: VisualTheme;
  material: ThemeMaterial;
  colors: ThemeColors;
  typography: ThemeTypography;
  radius: ThemeRadius;
  elevation: ThemeElevation;
  motion: ThemeMotion;
  glass: {
    blur: number;
    border: string;
    highlight: string;
  } | null;
};

export const THEME_LABELS: Record<VisualTheme, { en: string; fr: string; tagline: { en: string; fr: string } }> = {
  prism: {
    en: "Prism",
    fr: "Prism",
    tagline: { en: "Studio night", fr: "Studio nuit" },
  },
  air: {
    en: "Air",
    fr: "Air",
    tagline: { en: "Minimal", fr: "Minimal" },
  },
  warm: {
    en: "Warm",
    fr: "Warm",
    tagline: { en: "Editorial", fr: "Éditorial" },
  },
};

export const THEME_CYCLE: VisualTheme[] = ["prism", "air", "warm"];
