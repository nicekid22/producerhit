import type { AppLocale } from "../i18n/locales";
import { buildRichAceCaption } from "./richDisplayAce";

type PromptMode = "beat" | "song";

export function looksLikeNaturalUserIdea(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  // Shell dé / catalogue — enrichi via buildRichAceCaption + thème extrait, pas « naturel ».
  if (/^une chanson\s+.+?\s+sur\s+\S/i.test(t) && t.split(/\s+/).length <= 14) {
    if (/\b(hip hop|hip-hop|vacances|bord de la mer|plage|fais|crée|génère)\b/i.test(t)) return true;
    return false;
  }
  if (/^un beat\s+.+?\s+sur\s+\S/i.test(t) && t.split(/\s+/).length <= 14) return false;
  if (/^a [a-z0-9][\w\s\-'&]* song\s+about\s+\S/i.test(t) && t.split(/\s+/).length <= 16) return false;
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

/** Transforme une idée naturelle en caption ACE tags (EN) — shared (web + mobile). */
export function enhanceNaturalIdeaToAce(
  idea: string,
  formGenre: string,
  mode: PromptMode,
  uiLocale: AppLocale = "en",
): string {
  const trimmed = idea.trim();
  if (!trimmed) return "";
  return buildRichAceCaption({
    display: trimmed,
    locale: uiLocale,
    mode,
    formGenre,
  });
}
