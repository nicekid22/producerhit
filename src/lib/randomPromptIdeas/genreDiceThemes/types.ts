import type { AppLocale } from "@/i18n/config";

/** Narrative + mood pools for ACE-Step 1.5 dice captions (comma tags, not prose). */
export type ThemeGroup =
  | "trap"
  | "rnb"
  | "afro_latin"
  | "electronic_pop"
  | "rock"
  | "jazz_classical"
  | "world"
  | "cinematic"
  | "dnb"
  | "electronic_club"
  | "lab"
  | "default";

export type LocaleThemeLayers = {
  beatNarrative: Record<ThemeGroup, readonly string[]>;
  songNarrative: Record<ThemeGroup, readonly string[]>;
  songVocal: Record<ThemeGroup, readonly string[]>;
  beatProduction: readonly string[];
  songProduction: readonly string[];
};

export function resolveThemeGroup(group: string | undefined): ThemeGroup {
  const g = (group ?? "").toLowerCase();
  if (g.includes("trap") || g.includes("hip-hop")) return "trap";
  if (g.includes("r&b") || g.includes("soul")) return "rnb";
  if (g.includes("afro") || g.includes("latin") || g.includes("island")) return "afro_latin";
  if (g.includes("electronic / pop") || g === "electronic / pop") return "electronic_pop";
  if (g.includes("rock")) return "rock";
  if (g.includes("jazz") || g.includes("classical") || g.includes("opera")) return "jazz_classical";
  if (g.includes("world") || g.includes("regional") || g.includes("oriental")) return "world";
  if (g.includes("cinematic") || g.includes("score") || g.includes("film")) return "cinematic";
  if (g.includes("dnb") || g.includes("breaks")) return "dnb";
  if (g.includes("electronic / club") || g.includes("club")) return "electronic_club";
  if (g.includes("lab") || g.includes("futur")) return "lab";
  return "default";
}

export type ThemeLocale = AppLocale;
