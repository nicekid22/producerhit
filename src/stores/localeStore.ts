import { create } from "zustand";
import {
  type AppLocale,
  DEFAULT_LOCALE,
  normalizeLocale as normalizeAppLocale,
} from "@/i18n/config";

export type { AppLocale as Locale, AppLocale } from "@/i18n/config";

function getInitialLocale(): AppLocale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const fromQuery = normalizeAppLocale(new URLSearchParams(window.location.search).get("lang"));
  if (fromQuery) return fromQuery;
  const fromStorage = normalizeAppLocale(window.localStorage.getItem("producerhit_locale"));
  if (fromStorage) return fromStorage;
  const fromNavigator = normalizeAppLocale(window.navigator.language);
  return fromNavigator ?? DEFAULT_LOCALE;
}

function applyLocale(locale: AppLocale) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("producerhit_locale", locale);
  document.documentElement.lang = locale;
  const url = new URL(window.location.href);
  url.searchParams.set("lang", locale);
  window.history.replaceState({}, "", url.toString());
}

type LocaleState = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
};

export const useLocaleStore = create<LocaleState>((set) => {
  const initial = getInitialLocale();
  if (typeof window !== "undefined") applyLocale(initial);
  return {
    locale: initial,
    setLocale: (locale) => {
      applyLocale(locale);
      set({ locale });
    },
  };
});
