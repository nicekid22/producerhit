import { SPECTRUM_BUTTON_GRADIENT } from "./spectrumPalette";
import { DUSTY_RADIUS, DUSTY_SPACING } from "./dustyCloud";
import { DUSTY_VARIANTS, dustyOrbMeshFrom, type DustyVariantDef } from "./dustyVariants";
import { motionTokens } from "./motion";
import type { ThemeTokens, VisualTheme } from "./types";
import { isLightVisualTheme } from "./types";

function buildFromVariant(def: DustyVariantDef): ThemeTokens {
  const light = isLightVisualTheme(def.id);
  const gradient =
    def.id === "spectrum"
      ? ([def.void, def.surface, def.highlight] as const)
      : light
        ? ([def.void, def.surface, "#F4F1FA"] as const)
        : ([def.void, def.surface, def.void] as const);
  const irisGradient =
    def.id === "spectrum"
      ? ([def.peach, def.mauve, def.lavender] as const)
      : ([def.rose, def.mauve, def.lavenderLight] as const);
  const buttonGradient =
    def.id === "spectrum" ? SPECTRUM_BUTTON_GRADIENT : irisGradient;
  const mesh = dustyOrbMeshFrom(def);

  return {
    theme: def.id,
    material: "studio",
    background: {
      base: def.void,
      gradient,
      cardDeep: def.surface,
    },
    iris: {
      rose: def.rose,
      sky: def.lavender,
      lavender: def.lavenderLight,
      cream: def.text,
      gradient: irisGradient,
      mesh: { ...mesh },
    },
    glow: {
      iris: {
        shadowColor: def.mauve,
        shadowOpacity: light ? 0.18 : 0.28,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 0 },
      },
      accent: {
        shadowColor: def.id === "spectrum" ? def.lavender : def.rose,
        shadowOpacity: light ? 0.2 : 0.35,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 4 },
      },
    },
    colors: {
      bg: def.void,
      bgElevated: def.elevated,
      bgGlass: def.glassSurface,
      surface: def.surface,
      surfaceBorder: def.glassBorder,
      text: def.text,
      textMuted: def.textSecondary,
      textSubtle: def.textTertiary,
      accent: def.lavender,
      accentSolid: def.lavender,
      accentGradient: buttonGradient,
      accentPrimary: def.peach,
      accentOnPrimary: def.id === "spectrum" ? def.text : light ? "#FFFFFF" : def.text,
      pillActiveBg: def.pillActiveBg,
      pillActiveText: def.pillActiveText,
      success: def.id === "spectrum" ? def.lavender : light ? "#34C759" : "#7FD8A0",
      warning: def.peach,
      danger: def.id === "spectrum" ? def.lavenderLight : light ? "#FF3B30" : "#E07A7A",
      tabInactive: def.textTertiary,
      tabActive: def.lavenderLight,
      tabBarBg: def.tabBarBg,
      tabBarBorder: def.glassBorder,
      overlay: def.overlay,
      shadow: def.shadowBase,
      logoBase: def.text,
      logoAccent: def.lavender,
      statusBar: def.statusBar,
      seekTrack: def.seekTrack,
      seekFill: def.id === "spectrum" ? def.lavender : def.rose,
    },
    typography: {
      display: { fontSize: 30, fontWeight: "700", letterSpacing: -0.9, lineHeight: 36 },
      title: { fontSize: 20, fontWeight: "600", letterSpacing: -0.6 },
      subtitle: { fontSize: 18, fontWeight: "600", letterSpacing: -0.4 },
      body: { fontSize: 16, fontWeight: "400", lineHeight: 24 },
      caption: { fontSize: 13, fontWeight: "500", lineHeight: 18 },
      micro: { fontSize: 11, fontWeight: "500", letterSpacing: 0.2 },
      mono: { fontSize: 13, fontWeight: "400", fontVariant: ["tabular-nums"] },
    },
    radius: {
      sm: DUSTY_RADIUS.input,
      md: DUSTY_RADIUS.button,
      lg: DUSTY_RADIUS.card,
      xl: 24,
      cover: DUSTY_RADIUS.cover,
      pill: DUSTY_RADIUS.pill,
    },
    elevation: {
      card: {
        shadowColor: def.shadowBase,
        shadowOffset: { width: 0, height: light ? 2 : 4 },
        shadowOpacity: light ? 0.08 : 0.2,
        shadowRadius: light ? 8 : 12,
        elevation: light ? 2 : 4,
      },
      low: {
        shadowColor: def.shadowBase,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: light ? 0.06 : 0.15,
        shadowRadius: 8,
        elevation: 2,
      },
      high: {
        shadowColor: def.id === "spectrum" ? def.lavender : def.rose,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: light ? 0.2 : 0.35,
        shadowRadius: 16,
        elevation: 6,
      },
    },
    motion: {
      pressScale: motionTokens.pressScale,
      pressDuration: motionTokens.pressDuration,
      modalDuration: motionTokens.modalDuration,
      springDamping: motionTokens.spring.damping,
      springStiffness: motionTokens.spring.stiffness,
    },
    glass: {
      blur: 24,
      border: def.glassBorder,
      highlight: def.glassHighlight,
      surface: def.glassSurface,
      surfaceElevated: def.elevated,
      borderActive: def.lavenderLight,
    },
  };
}

const BUILT: Record<VisualTheme, ThemeTokens> = {
  dusty: buildFromVariant(DUSTY_VARIANTS.dusty),
  light: buildFromVariant(DUSTY_VARIANTS.light),
  warm: buildFromVariant(DUSTY_VARIANTS.warm),
  pastel: buildFromVariant(DUSTY_VARIANTS.pastel),
  bloom: buildFromVariant(DUSTY_VARIANTS.bloom),
  noir: buildFromVariant(DUSTY_VARIANTS.noir),
  spectrum: buildFromVariant(DUSTY_VARIANTS.spectrum),
};

export function buildDustyTheme(theme: VisualTheme): ThemeTokens {
  return BUILT[theme] ?? BUILT.dusty;
}

export { DUSTY_SPACING };
