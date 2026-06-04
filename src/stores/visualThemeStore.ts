import { create } from "zustand";
import { WARM_GLASS_THEME_DEFAULT } from "@/lib/featureFlags";

export type VisualTheme = "prism" | "warm-glass";

const STORAGE_KEY = "producerhit_visual_theme_v1";

function normalizeTheme(raw: string | null | undefined): VisualTheme | null {
  if (raw === "prism" || raw === "warm-glass") return raw;
  return null;
}

function getInitialTheme(): VisualTheme {
  if (typeof window === "undefined") return "prism";
  const stored = normalizeTheme(window.localStorage.getItem(STORAGE_KEY));
  if (stored) return stored;
  return WARM_GLASS_THEME_DEFAULT ? "warm-glass" : "prism";
}

function persistTheme(theme: VisualTheme) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, theme);
}

type VisualThemeState = {
  theme: VisualTheme;
  setTheme: (theme: VisualTheme) => void;
  toggleTheme: () => void;
};

export const useVisualThemeStore = create<VisualThemeState>((set, get) => ({
  theme: getInitialTheme(),
  setTheme: (theme) => {
    persistTheme(theme);
    set({ theme });
  },
  toggleTheme: () => {
    const next: VisualTheme = get().theme === "warm-glass" ? "prism" : "warm-glass";
    persistTheme(next);
    set({ theme: next });
  },
}));

export function isWarmGlassTheme(theme: VisualTheme): boolean {
  return theme === "warm-glass";
}
