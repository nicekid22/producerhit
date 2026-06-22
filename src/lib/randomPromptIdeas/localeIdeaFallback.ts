import type { AppLocale } from "@/i18n/config";
import { legacyEnFr } from "@/i18n/config";
import { getCuratedDisplayPromptPool } from "@/lib/randomPromptIdeas/curatedDisplayPrompts";
import type { PromptMode } from "@/lib/randomPromptIdeas";

/** Placeholder statique quand le pool rotatif est vide. */
export function getLocaleIdeaFallback(locale: AppLocale, mode: PromptMode): string {
  if (locale === "fr") {
    const fr = getCuratedDisplayPromptPool("fr", mode);
    if (fr[0]?.trim()) return fr[0]!.trim();
    return mode === "song"
      ? "ex : une chanson pop sur une nuit d'été à la plage"
      : "ex : un beat trap mélodique pour une nuit pluvieuse";
  }

  const en = getCuratedDisplayPromptPool("en", mode);
  if (en[0]?.trim()) return en[0]!.trim();

  return mode === "song"
    ? legacyEnFr(locale, "e.g. a pop song about a summer night at the beach", "ex : une chanson pop sur une nuit d'été à la plage")
    : legacyEnFr(
        locale,
        "e.g. a melodic trap beat about a rainy late-night drive",
        "ex : un beat trap mélodique pour une nuit pluvieuse",
      );
}
