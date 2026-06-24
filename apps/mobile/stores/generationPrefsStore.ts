import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import type { VocalLanguageMode } from "@/lib/resolvePromptLocale";

const VOCAL_PREFS_KEY = "producerhit_mobile_vocal_prefs_v1";
const STUDIO_ADVANCED_KEY = "producerhit_studio_advanced_open_v1";
const ONBOARDING_PREFS_KEY = "producerhit_mobile_onboarding_prefs_v1";

export type OnboardingCreationMode = "song" | "beat";

const VOCAL_CODES = new Set(["en", "fr", "es", "pt", "it", "de", "ja", "zh", "ko", "ar", "ru"]);

type VocalPrefs = {
  mode: VocalLanguageMode;
  manualCode: string;
};

type OnboardingPrefs = {
  creationMode: OnboardingCreationMode;
  genre: string;
};

type GenerationPrefsState = {
  vocalLanguageMode: VocalLanguageMode;
  manualVocalLanguage: string;
  studioAdvancedOpen: boolean;
  onboardingCreationMode: OnboardingCreationMode | null;
  onboardingGenre: string | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setVocalLanguage: (mode: VocalLanguageMode, manualCode?: string) => Promise<void>;
  setStudioAdvancedOpen: (open: boolean) => Promise<void>;
  setOnboardingPrefs: (prefs: OnboardingPrefs) => Promise<void>;
};

function normalizeManualCode(code: string | undefined): string {
  const c = (code ?? "en").trim().toLowerCase();
  return VOCAL_CODES.has(c) ? c : "en";
}

function parseOnboardingPrefs(raw: string | null): Partial<OnboardingPrefs> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as Partial<OnboardingPrefs>;
    const creationMode = parsed.creationMode === "beat" ? "beat" : parsed.creationMode === "song" ? "song" : undefined;
    const genre = typeof parsed.genre === "string" && parsed.genre.trim() ? parsed.genre.trim() : undefined;
    return { creationMode, genre };
  } catch {
    return {};
  }
}

export const useGenerationPrefsStore = create<GenerationPrefsState>((set, get) => ({
  vocalLanguageMode: "auto",
  manualVocalLanguage: "en",
  studioAdvancedOpen: false,
  onboardingCreationMode: null,
  onboardingGenre: null,
  hydrated: false,
  hydrate: async () => {
    try {
      const [raw, advancedRaw, onboardingRaw] = await Promise.all([
        AsyncStorage.getItem(VOCAL_PREFS_KEY),
        AsyncStorage.getItem(STUDIO_ADVANCED_KEY),
        AsyncStorage.getItem(ONBOARDING_PREFS_KEY),
      ]);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<VocalPrefs>;
        const mode = parsed.mode === "manual" ? "manual" : "auto";
        const manualCode = normalizeManualCode(parsed.manualCode);
        set({ vocalLanguageMode: mode, manualVocalLanguage: manualCode });
      }
      const onboarding = parseOnboardingPrefs(onboardingRaw);
      set({
        studioAdvancedOpen: advancedRaw === "1",
        onboardingCreationMode: onboarding.creationMode ?? null,
        onboardingGenre: onboarding.genre ?? null,
        hydrated: true,
      });
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
  setStudioAdvancedOpen: async (open) => {
    await AsyncStorage.setItem(STUDIO_ADVANCED_KEY, open ? "1" : "0");
    set({ studioAdvancedOpen: open });
  },
  setOnboardingPrefs: async (prefs) => {
    await AsyncStorage.setItem(ONBOARDING_PREFS_KEY, JSON.stringify(prefs));
    set({ onboardingCreationMode: prefs.creationMode, onboardingGenre: prefs.genre });
  },
}));
