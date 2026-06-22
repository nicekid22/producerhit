import { airTheme } from "./palettes/air";
import { prismTheme } from "./palettes/prism";
import { warmTheme } from "./palettes/warm";
import type { ThemeTokens, VisualTheme } from "./types";

export type { ThemeColors, ThemeTokens, VisualTheme } from "./types";
export { THEME_CYCLE, THEME_LABELS } from "./types";
export { prismTheme, airTheme, warmTheme };

const PALETTES: Record<VisualTheme, ThemeTokens> = {
  prism: prismTheme,
  air: airTheme,
  warm: warmTheme,
};

export function getThemeTokens(theme: VisualTheme): ThemeTokens {
  return PALETTES[theme] ?? prismTheme;
}
