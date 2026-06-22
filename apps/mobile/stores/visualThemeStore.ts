import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { THEME_CYCLE, type VisualTheme } from "@/theme/types";

const STORAGE_KEY = "producerhit_visual_theme_v1";

function normalizeTheme(raw: string | null): VisualTheme | null {
  if (raw === "prism" || raw === "air" || raw === "warm") return raw;
  if (raw === "warm-glass") return "warm";
  if (raw === "cloud") return "air";
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
  theme: "prism",
  hydrated: false,
  setTheme: (theme) => {
    set({ theme });
    void AsyncStorage.setItem(STORAGE_KEY, theme);
  },
  cycleTheme: () => {
    const current = get().theme;
    const index = THEME_CYCLE.indexOf(current);
    const next = THEME_CYCLE[(index + 1) % THEME_CYCLE.length] ?? "prism";
    get().setTheme(next);
  },
  hydrate: async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const theme = normalizeTheme(raw) ?? "prism";
    set({ theme, hydrated: true });
  },
}));
