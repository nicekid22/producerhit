import type { AppLocale, PromptMode } from "@producerhit/shared";
import { vocalCodeToPromptLocale } from "@producerhit/shared";

export type VocalLanguageMode = "auto" | "manual";

/** Locale des pools aléatoires (placeholder + dé) — aligné web resolveRandomPromptLocale. */
export function resolveMobilePromptLocale(input: {
  uiLocale: AppLocale;
  mode: PromptMode;
  vocalLanguageMode?: VocalLanguageMode;
  manualVocalLanguage?: string;
}): AppLocale {
  if (input.mode === "beat") return input.uiLocale;

  if (input.vocalLanguageMode === "manual") {
    return vocalCodeToPromptLocale(input.manualVocalLanguage ?? "en");
  }

  return input.uiLocale;
}
