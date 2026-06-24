import type { PromptMode } from "@/lib/randomPromptIdeas";

/** Catégorie de prompts aléatoires (dé au générateur). */
export type PromptCategoryId =
  | "natural"
  | "cinematic"
  | "acoustic"
  | "urban"
  | "pop_rnb"
  | "world"
  | "rock"
  | "electronic"
  | "impressive"
  | "ace_prose"
  | "genre_menu";

export type PromptCategory = {
  id: PromptCategoryId;
  /** Libellé UI (locale du pool). */
  label: string;
  mode: PromptMode;
  prompts: readonly string[];
};

export type CategorizedLocalePools = {
  song: readonly PromptCategory[];
  beat: readonly PromptCategory[];
  hero: readonly string[];
};
