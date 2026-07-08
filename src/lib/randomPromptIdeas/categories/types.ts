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
  | "genre_menu"
  | "fun_urban"
  | "fun_rnb"
  | "fun_latino"
  | "fun_electronic"
  | "fun_pop"
  | "content_creator"
  | "gaming"
  | "fitness_sports"
  | "food_culinary"
  | "travel_adventure"
  | "mental_health_selfcare"
  | "family_parenting"
  | "career_business"
  | "pets_animals"
  | "memes_internet"
  | "nostalgia_throwbacks"
  | "seasonal_holidays"
  | "urban_raw"
  | "urban_beats"
  | "rb_soul_specific"
  | "uk_garage_dancehall"
  | "rb_soul_beats";

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
