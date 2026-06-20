import { isCatalogGenreSelection } from "@/lib/genres/genrePickMode";
import { matchGenreFromPrompt } from "@/lib/genres/matchGenreFromPrompt";
import { getGenreCatalogPrompt } from "@/lib/promptBuilder";
import { ACE_DICE_CAPTION_MAX } from "@/lib/randomPromptIdeas/aceDiceCaption";
import type { PromptMode } from "@/lib/randomPromptIdeas";

function trimAceCaption(parts: readonly string[]): string {
  const layers = parts.map((p) => p.trim()).filter(Boolean);
  let result = layers.join(", ");
  while (result.length > ACE_DICE_CAPTION_MAX && layers.length > 1) {
    layers.pop();
    result = layers.join(", ");
  }
  if (result.length > ACE_DICE_CAPTION_MAX) {
    result = result.slice(0, ACE_DICE_CAPTION_MAX).replace(/[,\s]+$/g, "").trim();
  }
  return result;
}

/** Prompt déjà au format tags ACE (virgules, instruments, mix). */
export function looksLikeAceTechnicalPrompt(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  const commas = (t.match(/,/g) || []).length;
  if (commas >= 3 && t.length >= 60) return true;
  return /\b(808|hi-hat|rhodes|sidechain|supersaw|log drum|mix 2026|four-on-floor|reese bass)\b/i.test(t);
}

/** Idée tapée en langage naturel (pas des tags ACE). */
export function looksLikeNaturalUserIdea(text: string): boolean {
  const t = text.trim();
  if (!t || looksLikeAceTechnicalPrompt(t)) return false;
  if (
    /^(fais|crée|génère|une chanson|un beat|un son|chanson sur|beat sur|make me|create|generate|a song|song about|beat about|about|sur)\b/i.test(
      t,
    )
  ) {
    return true;
  }
  const commas = (t.match(/,/g) || []).length;
  return commas <= 1 && t.split(/\s+/).length >= 4;
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

function stripConversationalPrefix(text: string): string {
  return text
    .replace(/^(fais(-moi)?|crée(-moi)?|génère(-moi)?|make me|create|generate)\s+/gi, "")
    .replace(/^(une|un|des|a|an)\s+/gi, "")
    .replace(/^(chanson|beat|son|instru|instrumental|type beat|song|track)\s+(sur|about|on|de|d')\s+/gi, "")
    .replace(/^(chanson|beat|song|track)\s+/gi, "")
    .trim();
}

function themeToAceTags(idea: string): string {
  const tags: string[] = [];
  for (const [re, tag] of THEME_PHRASE_MAP) {
    if (re.test(idea)) tags.push(tag);
  }
  const cleaned = stripConversationalPrefix(idea)
    .replace(/\b(hip hop|hip-hop|hiphop|rap|trap|r&b|rnb|pop|drill|afrobeats|reggaeton)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length >= 8 && cleaned.length <= 80) {
    tags.push(`theme: ${cleaned}`);
  }
  return tags.join(", ");
}

function resolveGenreForEnhancement(idea: string, formGenre: string): string {
  if (isCatalogGenreSelection(formGenre) && formGenre !== "Auto") return formGenre;
  return matchGenreFromPrompt(idea) ?? (formGenre !== "Auto" ? formGenre : "Melodic Trap");
}

/** Transforme une idée naturelle en caption ACE pour l'API. */
export function enhanceNaturalIdeaToAce(idea: string, formGenre: string, mode: PromptMode): string {
  const trimmed = idea.trim();
  if (!trimmed) return "";
  const genre = resolveGenreForEnhancement(trimmed, formGenre);
  const base = getGenreCatalogPrompt(genre) || genre.toLowerCase();
  const themeTags = themeToAceTags(trimmed);
  const production =
    mode === "song"
      ? "hook chorus accrocheur, mix radio-ready 2026, vocal delivery émotionnelle"
      : "drums punchy, mix 2026 polie, loop hook-ready";
  return trimAceCaption([base, themeTags, production]);
}

export function resolveIdeaForAceGeneration(args: {
  displayIdea: string;
  formGenre: string;
  mode: PromptMode;
}): { aceCaption: string; useCaptionOverride: boolean } {
  const idea = args.displayIdea.trim();
  if (!idea) return { aceCaption: "", useCaptionOverride: false };
  if (looksLikeAceTechnicalPrompt(idea)) {
    return { aceCaption: idea, useCaptionOverride: true };
  }
  if (!looksLikeNaturalUserIdea(idea)) {
    return { aceCaption: "", useCaptionOverride: false };
  }
  const aceCaption = enhanceNaturalIdeaToAce(idea, args.formGenre, args.mode);
  return { aceCaption, useCaptionOverride: Boolean(aceCaption.trim()) };
}

/** Priorité : override dé / landing, sinon enhancement naturel. */
export function resolveCaptionOverrideForGeneration(args: {
  diceAceOverride?: string | null;
  landingAceOverride?: string | null;
  displayIdea: string;
  formGenre: string;
  mode: PromptMode;
}): string | undefined {
  const dice = args.diceAceOverride?.trim();
  if (dice) return dice;
  const landing = args.landingAceOverride?.trim();
  if (landing) return landing;
  const enhanced = resolveIdeaForAceGeneration({
    displayIdea: args.displayIdea,
    formGenre: args.formGenre,
    mode: args.mode,
  });
  return enhanced.useCaptionOverride ? enhanced.aceCaption.trim() : undefined;
}
