/**
 * Dusty Cloud — source of truth palette (ProducerHit iOS premium redesign).
 * @see design-system/DUSTY-CLOUD.md
 */

export const DUSTY = {
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
  grainOpacity: 0.055,
} as const;

export const DUSTY_BACKGROUND = {
  base: DUSTY.void,
  gradient: [DUSTY.void, DUSTY.surface, DUSTY.void] as const,
  cardDeep: DUSTY.surface,
} as const;

/** Orbe palette — bass / mid / high + seamless void background */
export const DUSTY_ORB = {
  colorA: DUSTY.rose,
  colorB: DUSTY.mauve,
  colorC: DUSTY.lavenderLight,
  background: DUSTY.void,
} as const;

/**
 * Mesh orb keys (legacy PRISM_MESH shape) mapped to Dusty Cloud.
 * Used by AIOrb Skia + theme iris.mesh.
 */
export const DUSTY_ORB_MESH = {
  apex: DUSTY.peachLight,
  gold: DUSTY.peach,
  mid: DUSTY.mauve,
  violet: DUSTY.lavender,
  base: DUSTY.rose,
  coral: DUSTY.rose,
  hot: DUSTY.lavenderLight,
  cyan: DUSTY.lavender,
  ice: DUSTY.lavenderLight,
  rose: DUSTY.rose,
  sky: DUSTY.lavender,
  lavender: DUSTY.lavenderLight,
  cream: DUSTY.text,
} as const;

export const DUSTY_IRIS = {
  rose: DUSTY.rose,
  sky: DUSTY.lavender,
  lavender: DUSTY.lavenderLight,
  cream: DUSTY.text,
  gradient: [DUSTY.rose, DUSTY.mauve, DUSTY.lavenderLight] as const,
} as const;

export const DUSTY_GLASS = {
  surface: "rgba(255,255,255,0.05)",
  surfaceElevated: DUSTY.elevated,
  border: "rgba(245,238,248,0.08)",
  borderActive: DUSTY.lavenderLight,
  blur: 24,
  highlight: "rgba(245,238,248,0.08)",
} as const;

export const DUSTY_GLOW = {
  iris: {
    shadowColor: DUSTY.mauve,
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  accent: {
    shadowColor: DUSTY.rose,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
} as const;

/** 8pt spacing system */
export const DUSTY_SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  section: 40,
  screen: 20,
} as const;

/** Border radius per Dusty spec */
export const DUSTY_RADIUS = {
  input: 12,
  button: 14,
  card: 20,
  cover: 12,
  pill: 100,
} as const;
