import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import type { VocalLanguageMode } from "@/lib/resolvePromptLocale";

const VOCAL_PREFS_KEY = "producerhit_mobile_vocal_prefs_v1";

const VOCAL_CODES = new Set(["en", "fr", "es", "pt", "it", "de", "ja", "zh", "ko", "ar", "ru"]);

type VocalPrefs = {
  mode: VocalLanguageMode;
  manualCode: string;
};

type GenerationPrefsState = {
  vocalLanguageMode: VocalLanguageMode;
  manualVocalLanguage: string;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setVocalLanguage: (mode: VocalLanguageMode, manualCode?: string) => Promise<void>;
};

function normalizeManualCode(code: string | undefined): string {
  const c = (code ?? "en").trim().toLowerCase();
  return VOCAL_CODES.has(c) ? c : "en";
}

export const useGenerationPrefsStore = create<GenerationPrefsState>((set, get) => ({
  vocalLanguageMode: "auto",
  manualVocalLanguage: "en",
  hydrated: false,
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(VOCAL_PREFS_KEY);
      if (!raw) {
        set({ hydrated: true });
        return;
      }
      const parsed = JSON.parse(raw) as Partial<VocalPrefs>;
      const mode = parsed.mode === "manual" ? "manual" : "auto";
      const manualCode = normalizeManualCode(parsed.manualCode);
      set({ vocalLanguageMode: mode, manualVocalLanguage: manualCode, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },
  setVocalLanguage: async (mode, manualCode) => {
    const code = normalizeManualCode(manualCode ?? get().manualVocalLanguage);
    const next: VocalPrefs = { mode, manualCode: code };
    await AsyncStorage.setItem(VOCAL_PREFS_KEY, JSON.stringify(next));
    set({ vocalLanguageMode: mode, manualVocalLanguage: code });
  },
}));
