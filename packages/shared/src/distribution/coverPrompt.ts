/** Max recommended prompt length for Pollinations album covers. */
export const COVER_PROMPT_MAX_LENGTH = 150;

export type StructuredCoverPromptInput = {
  subject: string;
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

export function buildStructuredCoverPrompt(input: StructuredCoverPromptInput): string {
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

  return parts.join(", ").replace(/\s+/g, " ").slice(0, COVER_PROMPT_MAX_LENGTH);
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
  const fromPrompt = (typeof loop.prompt === "string" ? loop.prompt : "").trim().split(/[,.]/)[0]?.trim() ?? "";

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
