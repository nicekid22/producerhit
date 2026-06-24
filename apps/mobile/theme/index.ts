import { buildDustyTheme } from "./buildDustyTheme";
import type { ThemeTokens, VisualTheme } from "./types";

export type { ThemeColors, ThemeTokens, VisualTheme } from "./types";
export { THEME_CYCLE, THEME_LABELS } from "./types";
export { DUSTY, DUSTY_BACKGROUND, DUSTY_GLASS, DUSTY_ORB, DUSTY_ORB_MESH } from "./dustyCloud";
export { DUSTY_VARIANTS } from "./dustyVariants";
export { buildDustyTheme };

const PALETTES: Record<VisualTheme, ThemeTokens> = {
  dusty: buildDustyTheme("dusty"),
  light: buildDustyTheme("light"),
  warm: buildDustyTheme("warm"),
  pastel: buildDustyTheme("pastel"),
  bloom: buildDustyTheme("bloom"),
  noir: buildDustyTheme("noir"),
  spectrum: buildDustyTheme("spectrum"),
};

/** @deprecated use buildDustyTheme — kept for imports */
export const prismTheme = PALETTES.dusty;

export function getThemeTokens(theme: VisualTheme): ThemeTokens {
  return PALETTES[theme] ?? PALETTES.dusty;
}
