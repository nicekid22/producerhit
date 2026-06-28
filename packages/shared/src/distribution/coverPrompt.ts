import { extractDiceThemePhrase, extractPromptBankSubject } from "../prompt/themeFromDiceDisplay";
import { extractHookFromDisplay } from "../prompt/promptBank/buildBankLyrics";

/** Max recommended prompt length for Pollinations album covers. */
export const COVER_PROMPT_MAX_LENGTH = 150;

export type StructuredCoverPromptInput = {  subject: string;
  mood: string;
  palette: string;
  lighting: string;
  style: string;
};

export const COVER_LIGHTING_PRESETS = [
  "cinematic lighting",
  "neon rim light",
  "soft haze",
  "dramatic shadows",
  "studio spotlight",
] as const;

export const COVER_STYLE_PRESETS = [
  "minimal album artwork",
  "editorial photography",
  "abstract shapes",
  "35mm film grain",
  "hand-painted watercolor",
] as const;

export function buildStructuredCoverPrompt(
  input: StructuredCoverPromptInput,
  options?: { maxLength?: number },
): string {
  const maxLen = options?.maxLength ?? COVER_PROMPT_MAX_LENGTH;
  const subject = input.subject.trim();
  const mood = input.mood.trim();
  const palette = input.palette.trim();
  const lighting = input.lighting.trim();
  const style = input.style.trim();

  const parts = [
    subject,
    mood ? `${mood} mood` : "",
    palette ? `${palette} palette` : "",
    lighting,
    style,
    "album cover, no text, square composition",
  ].filter((p) => p.length > 0);

  return parts.join(", ").replace(/\s+/g, " ").slice(0, maxLen);
}

/**
 * Idée narrative du prompt aléatoire (dé / banque) — sans genre, BPM ni tags ACE.
 * Ex. « Monte le son ouvre ton cœur — afrobeat, 110 bpm » → « Monte le son ouvre ton cœur ».
 */
export function extractCoverVisualIdeaFromPrompt(prompt: string): string {
  const t = prompt.trim();
  if (!t) return "";

  const bankHead = extractPromptBankSubject(t);
  if (bankHead.length >= 3) {
    return bankHead.replace(/,?\s*\d+\s*bpm$/i, "").trim();
  }

  if (/\s[—–-]\s/.test(t)) {
    const head = extractHookFromDisplay(t);
    if (head.length >= 3) return head;
  }

  const diceTheme = extractDiceThemePhrase(t);
  if (diceTheme.length >= 3) return diceTheme;

  const first = t.split(/[,.]/)[0]?.trim() ?? t;
  const stripped = first.replace(/,?\s*\d+\s*bpm$/i, "").trim();
  if ((t.match(/,/g)?.length ?? 0) >= 3) return "";
  return stripped.length >= 3 ? stripped : "";
}

export function parseStructuredCoverPromptFromText(text: string): StructuredCoverPromptInput {
  const raw = text.trim();
  const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
  return {
    subject: parts[0] ?? "",
    mood: parts[1]?.replace(/\s+mood$/i, "") ?? "",
    palette: parts[2]?.replace(/\s+palette$/i, "") ?? "",
    lighting: parts[3] ?? "",
    style: parts[4] ?? "",
  };
}

export function buildCoverPromptSuggestionsFromLoop(loop: {
  prompt?: string;
  genre?: string;
  mood?: string;
  influence?: string;
  name?: string;
}): StructuredCoverPromptInput[] {
  const genre = (loop.genre ?? "").trim();
  const mood = (loop.mood ?? "").trim();
  const influence = (loop.influence ?? "").trim();
  const name = (loop.name ?? "").trim();
  const fromPrompt = extractCoverVisualIdeaFromPrompt(typeof loop.prompt === "string" ? loop.prompt : "");

  const subjects = [
    fromPrompt || `${genre} artist silhouette`,
    name ? `${name} portrait` : "",
    influence ? `${influence} inspired figure` : "",
  ].filter((s) => s.length >= 3);

  const palettes = [
    "deep orange and blue",
    "neon pink and black",
    "monochrome blue",
    "gold and charcoal",
  ];

  const out: StructuredCoverPromptInput[] = [];
  for (let i = 0; i < subjects.length; i++) {
    const subject = subjects[i]!;
    out.push({
      subject,
      mood: mood || genre || "dreamy",
      palette: palettes[i % palettes.length]!,
      lighting: COVER_LIGHTING_PRESETS[i % COVER_LIGHTING_PRESETS.length]!,
      style: COVER_STYLE_PRESETS[i % COVER_STYLE_PRESETS.length]!,
    });
  }
  return out;
}

export function canAccessDistributionAcademy(plan: string | null | undefined): boolean {
  return plan === "studio" || plan === "plus";
}
