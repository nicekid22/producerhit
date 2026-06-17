import type { LocalePromptPools } from "../localePools/types";
import type { CategorizedLocalePools, PromptCategory, PromptCategoryId } from "./types";

export function flattenCategories(categories: readonly PromptCategory[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const cat of categories) {
    for (const p of cat.prompts) {
      const key = p.trim();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(key);
    }
  }
  return out;
}

export function buildLocalePools(categorized: CategorizedLocalePools): LocalePromptPools {
  return {
    song: flattenCategories(categorized.song),
    beat: flattenCategories(categorized.beat),
    hero: [...categorized.hero],
  };
}

export function getCategory(
  categorized: CategorizedLocalePools,
  mode: "song" | "beat",
  id: PromptCategoryId,
): PromptCategory | undefined {
  const list = mode === "song" ? categorized.song : categorized.beat;
  return list.find((c) => c.id === id);
}

export function pickFromCategory(
  categorized: CategorizedLocalePools,
  mode: "song" | "beat",
  id: PromptCategoryId,
): string {
  const cat = getCategory(categorized, mode, id);
  if (!cat || cat.prompts.length === 0) return "";
  const raw = cat.prompts[Math.floor(Math.random() * cat.prompts.length)] ?? cat.prompts[0]!;
  return raw;
}
