import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, type AppStateStatus } from "react-native";
import { create } from "zustand";
import { UI_LOCALES, type AppLocale } from "@producerhit/shared";
import { t, tf, type I18nKey } from "@/lib/i18n/catalog";
import { getDeviceAppLocale } from "@/lib/deviceLocale";

/** Choix explicite dans Paramètres → langue. */
const LOCALE_OVERRIDE_KEY = "producerhit_mobile_locale_override";
/** Ancienne clé (sans distinction auto/manuel) — ignorée après migration. */
const LEGACY_LOCALE_KEY = "producerhit_mobile_locale";

const LOCALE_SET = new Set<string>(UI_LOCALES);

function parseStoredLocale(raw: string | null): AppLocale | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  return LOCALE_SET.has(v) ? (v as AppLocale) : null;
}

type LocaleState = {
  locale: AppLocale;
  hydrated: boolean;
  /** true = l'utilisateur a choisi une langue dans Paramètres (ne pas écraser par le device). */
  userOverride: boolean;
  hydrate: () => Promise<void>;
  /** Suit la langue du téléphone (supprime le choix manuel). */
  syncDeviceLocale: () => void;
  setLocale: (locale: AppLocale) => Promise<void>;
};

function applyDeviceLocale(set: (partial: Partial<LocaleState>) => void): AppLocale {
  const device = getDeviceAppLocale();
  set({ locale: device, userOverride: false });
  return device;
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: getDeviceAppLocale(),
  hydrated: false,
  userOverride: false,
  hydrate: async () => {
    try {
      let override = parseStoredLocale(await AsyncStorage.getItem(LOCALE_OVERRIDE_KEY));

      if (!override) {
        const legacy = parseStoredLocale(await AsyncStorage.getItem(LEGACY_LOCALE_KEY));
        const device = getDeviceAppLocale();
        if (legacy && legacy !== device) {
          override = legacy;
          await AsyncStorage.setItem(LOCALE_OVERRIDE_KEY, legacy);
        }
        await AsyncStorage.removeItem(LEGACY_LOCALE_KEY);
      }

      if (override) {
        set({ locale: override, userOverride: true, hydrated: true });
        return;
      }

      applyDeviceLocale(set);
      set({ hydrated: true });
    } catch {
      applyDeviceLocale(set);
      set({ hydrated: true });
    }
  },
  syncDeviceLocale: () => {
    void AsyncStorage.removeItem(LOCALE_OVERRIDE_KEY);
    applyDeviceLocale(set);
  },
  setLocale: async (locale) => {
    await AsyncStorage.setItem(LOCALE_OVERRIDE_KEY, locale);
    set({ locale, userOverride: true });
  },
}));

let appStateListenerAttached = false;

/** Rafraîchit la langue si l'utilisateur change les réglages iOS (sans override manuel). */
export function attachLocaleAppStateListener(): void {
  if (appStateListenerAttached) return;
  appStateListenerAttached = true;

  const onChange = (state: AppStateStatus) => {
    if (state !== "active") return;
    const { userOverride, hydrated } = useLocaleStore.getState();
    if (!hydrated || userOverride) return;
    const device = getDeviceAppLocale();
    if (device !== useLocaleStore.getState().locale) {
      useLocaleStore.setState({ locale: device });
    }
  };

  AppState.addEventListener("change", onChange);
}

export function useI18n() {
  const locale = useLocaleStore((s) => s.locale);
  const userOverride = useLocaleStore((s) => s.userOverride);
  return {
    locale,
    userOverride,
    t: (key: I18nKey) => t(locale, key),
    tf: (key: I18nKey, vars: Record<string, string | number>) => tf(locale, key, vars),
  };
}
