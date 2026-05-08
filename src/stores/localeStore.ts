import { create } from "zustand";

export type Locale = "en" | "fr";

function normalizeLocale(input: string | null | undefined): Locale | null {
  if (!input) return null;
  const v = input.toLowerCase();
  if (v === "en" || v.startsWith("en-")) return "en";
  if (v === "fr" || v.startsWith("fr-")) return "fr";
  return null;
}

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const fromQuery = normalizeLocale(new URLSearchParams(window.location.search).get("lang"));
  if (fromQuery) return fromQuery;
  const fromStorage = normalizeLocale(window.localStorage.getItem("producerhit_locale"));
  if (fromStorage) return fromStorage;
  const fromNavigator = normalizeLocale(window.navigator.language);
  return fromNavigator ?? "en";
}

function applyLocale(locale: Locale) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("producerhit_locale", locale);
  document.documentElement.lang = locale;
  const url = new URL(window.location.href);
  url.searchParams.set("lang", locale);
  window.history.replaceState({}, "", url.toString());
}

type LocaleState = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
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
