import { normalizeAceCaption } from "./acePromptContract";
import type { PromptMode } from "./captionContext";

export function looksLikeNaturalUserIdea(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  // Keep this conservative: only trigger on clear “user intent” prompts.
  if (
    /^(fais|crée|génère|make me|create|generate)\b/i.test(t) ||
    /^(chanson sur|beat sur|song about|beat about)\b/i.test(t) ||
    /^une chanson\s+/i.test(t) ||
    /^un beat\s+/i.test(t)
  ) {
    return true;
  }
  const commas = (t.match(/,/g) || []).length;
  return commas <= 1 && t.split(/\s+/).length >= 6;
}

const THEME_PHRASE_MAP: Array<[RegExp, string]> = [
  [/vacances?|été|summer holiday/i, "summer vacation mood"],
  [/bord de la mer|au bord de la mer|plage|seaside|beach|ocean|océan|mer\b/i, "beach seaside vibe, coastal atmosphere"],
  [/nuit|night/i, "nocturnal mood"],
  [/amour|love|cœur|coeur|heartbreak/i, "romantic emotional theme"],
  [/rue|street|banlieue|suburb/i, "street life atmosphere"],
  [/fête|party|club|soirée/i, "party energy, club-ready vibe"],
  [/triste|sad|mélancol|melanchol/i, "melancholic emotional depth"],
  [/hype|énergie|energy|motiv/i, "high energy motivational vibe"],
  [/pluie|rain/i, "rainy atmospheric mood"],
  [/ville|city|urban/i, "urban city atmosphere"],
];

function themeToAceTags(idea: string): string {
  const tags: string[] = [];
  for (const [re, tag] of THEME_PHRASE_MAP) {
    if (re.test(idea)) tags.push(tag);
  }
  return tags.join(", ");
}

function resolveGenreSeed(formGenre: string): string {
  const g = (formGenre || "").trim();
  if (!g || g === "Auto") return "Melodic Trap";
  return g;
}

/** Transforme une idée naturelle en caption ACE tags (EN) — shared (web + mobile). */
export function enhanceNaturalIdeaToAce(idea: string, formGenre: string, mode: PromptMode): string {
  const trimmed = idea.trim();
  if (!trimmed) return "";
  const genre = resolveGenreSeed(formGenre);
  const themeTags = themeToAceTags(trimmed);
  const production =
    mode === "song"
      ? "catchy hook, memorable chorus, radio-ready mix"
      : "punchy drums, polished mix, hook-ready loop";

  const raw = [genre, themeTags, production].filter(Boolean).join(", ");
  return normalizeAceCaption(raw, {
    mode: mode === "song" ? "song" : "beat",
    instrumental: mode === "beat",
  }).caption;
}

