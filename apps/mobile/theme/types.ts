import type { TextStyle } from "react-native";

export type VisualTheme = "dusty" | "light" | "warm" | "pastel" | "bloom" | "noir" | "spectrum";

export type ThemeMaterial = "studio" | "paper" | "flat";

export type ThemeBackground = {
  base: string;
  gradient: readonly string[];
  cardDeep: string;
};

export type ThemeMesh = {
  apex: string;
  gold: string;
  mid: string;
  violet: string;
  base: string;
  coral: string;
  hot: string;
  cyan?: string;
  ice?: string;
  rose?: string;
  sky?: string;
  lavender?: string;
  cream?: string;
};

export type ThemeIris = {
  rose: string;
  sky: string;
  lavender: string;
  cream: string;
  gradient: readonly string[];
  /** Prism liquid mesh orb — optional on air/warm */
  mesh?: ThemeMesh;
};

export type ThemeAccent = {
  primary: string;
  onPrimary: string;
};

export type ThemeGlassTokens = {
  blur: number;
  border: string;
  highlight: string;
  surface: string;
  surfaceElevated: string;
  borderActive: string;
};

export type ThemeGlow = {
  iris: {
    shadowColor: string;
    shadowOpacity: number;
    shadowRadius: number;
    shadowOffset: { width: number; height: number };
  };
  accent: {
    shadowColor: string;
    shadowOpacity: number;
    shadowRadius: number;
    shadowOffset: { width: number; height: number };
  };
};

export type ThemeColors = {
  bg: string;
  bgElevated: string;
  bgGlass: string;
  surface: string;
  surfaceBorder: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  /** @deprecated use accent.primary */
  accent: string;
  accentSolid: string;
  accentGradient: readonly string[];
  accentPrimary: string;
  accentOnPrimary: string;
  pillActiveBg: string;
  pillActiveText: string;
  success: string;
  warning: string;
  danger: string;
  tabInactive: string;
  tabActive: string;
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
  low: {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
  };
  high: {
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
  springDamping?: number;
  springStiffness?: number;
};

export type ThemeTokens = {
  theme: VisualTheme;
  material: ThemeMaterial;
  background: ThemeBackground;
  iris: ThemeIris;
  glow: ThemeGlow;
  colors: ThemeColors;
  typography: ThemeTypography;
  radius: ThemeRadius;
  elevation: ThemeElevation;
  motion: ThemeMotion;
  glass: ThemeGlassTokens | null;
};

export const THEME_LABELS: Record<VisualTheme, { en: string; fr: string; tagline: { en: string; fr: string } }> = {
  dusty: {
    en: "Dusty Cloud",
    fr: "Dusty Cloud",
    tagline: { en: "Signature mauve studio", fr: "Mauve studio signature" },
  },
  light: {
    en: "Light",
    fr: "Clair",
    tagline: { en: "Clean iOS daylight", fr: "Jour clair style iOS" },
  },
  warm: {
    en: "Ember",
    fr: "Braise",
    tagline: { en: "Amber & terracotta glow", fr: "Lueur ambre & terre cuite" },
  },
  pastel: {
    en: "Pastel",
    fr: "Pastel",
    tagline: { en: "Soft lavender mist", fr: "Brume lavande douce" },
  },
  bloom: {
    en: "Bloom",
    fr: "Bloom",
    tagline: { en: "Vivid rose & violet", fr: "Rose & violet vibrants" },
  },
  noir: {
    en: "Noir",
    fr: "Noir",
    tagline: { en: "OLED minimal depth", fr: "Profondeur OLED minimale" },
  },
  spectrum: {
    en: "Spectrum",
    fr: "Spectrum",
    tagline: { en: "Mauve grain — yellow to violet", fr: "Mauve grainé — jaune vers violet" },
  },
};

export const THEME_CYCLE: VisualTheme[] = ["bloom", "dusty", "light", "warm", "pastel", "noir", "spectrum"];

/** Thèmes fond clair (status bar sombre, ombres douces). */
export function isLightVisualTheme(theme: VisualTheme): boolean {
  return theme === "light" || theme === "spectrum";
}
