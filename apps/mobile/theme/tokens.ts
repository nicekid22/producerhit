/**
 * Shared layout tokens. Prefer `useTheme()` for colors, typography, radius per theme.
 */
import { DUSTY_SPACING } from "./dustyCloud";
import { buildDustyTheme } from "./buildDustyTheme";

const defaultTheme = buildDustyTheme("bloom");
export const colors = defaultTheme.colors;

export const spacing = DUSTY_SPACING;

/** @deprecated use theme.radius from useTheme() */
export const radius = defaultTheme.radius;

/** @deprecated use theme.typography from useTheme() */
export const typography = defaultTheme.typography;

/** @deprecated use theme.motion from useTheme() */
export const motion = defaultTheme.motion;

/** @deprecated use theme.elevation from useTheme() */
export const shadows = {
  card: defaultTheme.elevation.card,
  low: defaultTheme.elevation.low,
  high: defaultTheme.elevation.high,
};
