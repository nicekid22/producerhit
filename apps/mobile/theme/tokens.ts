/**
 * Shared layout tokens. Prefer `useTheme()` for colors, typography, radius per theme.
 */
import { prismTheme } from "./palettes/prism";

export const colors = prismTheme.colors;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  section: 40,
  screen: 20,
} as const;

/** @deprecated use theme.radius from useTheme() */
export const radius = prismTheme.radius;

/** @deprecated use theme.typography from useTheme() */
export const typography = prismTheme.typography;

/** @deprecated use theme.motion from useTheme() */
export const motion = prismTheme.motion;

/** @deprecated use theme.elevation from useTheme() */
export const shadows = {
  card: prismTheme.elevation.card,
};
