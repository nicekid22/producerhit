import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { THEME_CYCLE, type VisualTheme } from "@/theme/types";

const STORAGE_KEY = "producerhit_visual_theme_v1";

function normalizeTheme(raw: string | null): VisualTheme | null {
  const v = raw?.trim().toLowerCase();
  if (v === "dusty" || v === "prism") return "dusty";
  if (v === "light" || v === "air" || v === "cloud") return "light";
  if (v === "warm" || v === "warm-glass" || v === "ember") return "warm";
  if (v === "pastel") return "pastel";
  if (v === "bloom") return "bloom";
  if (v === "noir") return "noir";
  if (v === "spectrum" || v === "signal" || v === "splash") return "spectrum";
  return null;
}

type VisualThemeState = {
  theme: VisualTheme;
  hydrated: boolean;
  setTheme: (theme: VisualTheme) => void;
  cycleTheme: () => void;
  hydrate: () => Promise<void>;
};

export const useVisualThemeStore = create<VisualThemeState>((set, get) => ({
  theme: "bloom",
  hydrated: false,
  setTheme: (theme) => {
    set({ theme });
    void AsyncStorage.setItem(STORAGE_KEY, theme);
  },
  cycleTheme: () => {
    const current = get().theme;
    const index = THEME_CYCLE.indexOf(current);
    const next = THEME_CYCLE[(index + 1) % THEME_CYCLE.length] ?? "bloom";
    get().setTheme(next);
  },
  hydrate: async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const theme = normalizeTheme(raw) ?? "bloom";
    set({ theme, hydrated: true });
  },
}));
