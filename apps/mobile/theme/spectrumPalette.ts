/** Palette stricte logo Spectrum — jaune pastel, mauve/violet uniquement. */
export const SPECTRUM_PALETTE = {
  /** Fond icône — mauve violet pastel */
  bg: "#D4CAE4",
  bgSoft: "#DDD4EA",
  bgDeep: "#C8BBD8",
  /** Jaune pastel (haut des barres / CTA) */
  yellow: "#FFE8B8",
  yellowSoft: "#FFF4D8",
  /** Violets (bas des barres / accents) */
  violetLight: "#C4B5DC",
  violet: "#A894C8",
  violetDeep: "#9580B8",
  /** Texte — dérivé du violet, pas de gris neutre */
  text: "#4A4060",
  textMuted: "rgba(74,64,96,0.58)",
  textSubtle: "rgba(74,64,96,0.36)",
} as const;

/** Dégradé bouton primaire — jaune pastel → violet */
export const SPECTRUM_BUTTON_GRADIENT = [
  SPECTRUM_PALETTE.yellow,
  SPECTRUM_PALETTE.violetLight,
  SPECTRUM_PALETTE.violet,
] as const;

/** Intensité du grain procédural (shader Skia) — très subtil, type argentique. */
export const SPECTRUM_GRAIN_STRENGTH = 0.04;
