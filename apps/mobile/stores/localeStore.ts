import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { UI_LOCALES, type AppLocale } from "@producerhit/shared";
import { t, tf, type I18nKey } from "@/lib/i18n/catalog";
import { getDeviceAppLocale } from "@/lib/deviceLocale";

const LOCALE_KEY = "producerhit_mobile_locale";

const LOCALE_SET = new Set<string>(UI_LOCALES);

function parseStoredLocale(raw: string | null): AppLocale | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  return LOCALE_SET.has(v) ? (v as AppLocale) : null;
}

type LocaleState = {
  locale: AppLocale;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setLocale: (locale: AppLocale) => Promise<void>;
};

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: getDeviceAppLocale(),
  hydrated: false,
  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(LOCALE_KEY);
      const stored = parseStoredLocale(raw);
      set({ locale: stored ?? getDeviceAppLocale(), hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },
  setLocale: async (locale) => {
    await AsyncStorage.setItem(LOCALE_KEY, locale);
    set({ locale });
  },
}));

export function useI18n() {
  const locale = useLocaleStore((s) => s.locale);
  return {
    locale,
    t: (key: I18nKey) => t(locale, key),
    tf: (key: I18nKey, vars: Record<string, string | number>) => tf(locale, key, vars),
  };
}
