import { type AppLocale, DEFAULT_LOCALE, normalizeLocale, UI_LOCALES } from "@/i18n/config";

export type RandomPromptLocaleContext =
  | { surface: "landing"; uiLocale: AppLocale }
  | { surface: "dashboard-beat"; uiLocale: AppLocale }
  | {
      surface: "dashboard-song";
      uiLocale: AppLocale;
      vocalLanguageMode: "auto" | "manual";
      manualVocalLanguage: string;
    };

const PROMPT_LOCALE_SET = new Set<string>(UI_LOCALES);

/** Langue navigateur — utilisée pour auto-détection (dashboard song + première visite landing). */
export function getBrowserAppLocale(): AppLocale {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  return normalizeLocale(navigator.language) ?? DEFAULT_LOCALE;
}

/** Map code vocal ACE (en, ja, ru…) → pool de prompts (14 locales UI). */
export function vocalCodeToPromptLocale(code: string): AppLocale {
  const normalized = code.trim().toLowerCase();
  if (PROMPT_LOCALE_SET.has(normalized)) return normalized as AppLocale;
  return DEFAULT_LOCALE;
}

/**
 * Locale des pools aléatoires (dé, hero typewriter).
 * - Landing : langue visiteur (UI = query / storage / navigateur).
 * - Dashboard beat : langue UI de l'app.
 * - Dashboard song auto : navigateur.
 * - Dashboard song manuel : langue choisie dans le menu génération.
 */
export function resolveRandomPromptLocale(ctx: RandomPromptLocaleContext): AppLocale {
  if (ctx.surface === "landing") {
    return ctx.uiLocale;
  }

  if (ctx.surface === "dashboard-beat") {
    return ctx.uiLocale;
  }

  if (ctx.vocalLanguageMode === "manual") {
    return vocalCodeToPromptLocale(ctx.manualVocalLanguage);
  }

  return getBrowserAppLocale();
}
