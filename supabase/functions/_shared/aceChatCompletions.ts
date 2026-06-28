/**
 * ACE chat/completions LM instruction builder — shared web + edge.
 */

export const MELODY_COMPOSITION_ACE_RULES = [
  "TASK: Melody-only sample pack composition for beatmakers (ProducerGrind / Beatstars style).",
  "CRITICAL — generate ZERO drums: no kick, snare, clap, hi-hat, percussion loop, trap drums, 808 bass, or beat programming.",
  "Only melodic/harmonic layers: keys, guitar, synth, pads, optional musical bass line (not 808), optional pitched vocal chops.",
  "This is NOT a beat and NOT a full song with vocals — it is an instrumental composition the producer will chop and add drums to in their DAW.",
  "Do not output any lyrics text. Omit the '## Lyrics' section entirely.",
].join(" ");

export const ACE_SONG_LM_RULES = [
  "Write singable lyrics with ACE section markers: [intro], [verse], [pre-chorus], [chorus], [bridge], [outro].",
  "Each sung line must be 4-8 syllables maximum.",
  "Repeat the chorus lyrics identically every time.",
  "Vocal delivery: controlled phrasing, clean studio vocal, steady pitch.",
  "Replace any parenthetical stage directions with real short singable lines.",
  "When no user lyrics are provided: invent original song words that fit the genre mood.",
  "**Caption:** must be a short prose musical description (instruments, groove, energy) — not a tag list.",
  "## Lyrics must contain real singable words only — never copy Caption tags, BPM, vocal language, or production instructions.",
].join(" ");

export const ACE_AI_COMPOSE_SONG_LM_RULES = [
  "CRITICAL: The singer performs the ## Lyrics you write — not the Caption metadata.",
  "Never put comma-separated tags, technical directions, or the words \"vocal style\" / \"vocal language\" in ## Lyrics.",
  "This is a vocal song with a lead singer — not instrumental, not a beat, not an arrangement sketch.",
].join(" ");

export const ACE_BEAT_LM_RULES = [
  "Instrumental beat only. No lead vocals, no rapped verses, no lyrics section.",
  "Vocal chops allowed only as short non-lyrical texture.",
].join(" ");

export type BuildAceChatCompletionsInput = {
  seedKey: string;
  baseCaption: string;
  prompt: string;
  lyrics: string;
  instrumental: boolean;
  melodyComposition?: boolean;
  genre: string;
  mood: string;
  energyLevel: string;
  autoMeta: boolean;
  bpm: number | null;
  key: string;
  scale: string;
  timeSignature: string;
  vocalLanguage?: string;
  vocalStyle?: string;
};

function isAiComposeSongRequest(args: { instrumental: boolean; lyrics: string }): boolean {
  return !args.instrumental && !args.lyrics.trim();
}

function hashToIndex(seed: string, length: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return h % length;
}

function pickOneBySeed<T>(items: readonly T[], seed: string): T {
  if (items.length <= 1) return items[0]!;
  return items[hashToIndex(seed, items.length)]!;
}

function lyricsNeedsLmExpansion(lyrics: string): boolean {
  const t = lyrics.trim();
  if (!t) return false;
  if (/\(storytelling|emotional tension|peak moment|atmospheric intro|fade into/i.test(t)) return true;
  const lines = t.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return lines.length > 0 && lines.every((l) => LYRICS_PLACEHOLDER_LINE_RE.test(l) || /^\[[^\]]+\]$/.test(l));
}

const LYRICS_PLACEHOLDER_LINE_RE = /^\([^)]*\)\s*$/;

const VOCAL_LANGUAGE_LYRIC_LABEL: Record<string, string> = {
  fr: "French",
  es: "Spanish",
  pt: "Portuguese",
  it: "Italian",
  de: "German",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese",
  ar: "Arabic",
  ru: "Russian",
};

export function lyricsLanguageInstruction(vocalLanguage: string): string | null {
  const code = vocalLanguage.trim().toLowerCase();
  if (!code || code === "en") return null;
  const label = VOCAL_LANGUAGE_LYRIC_LABEL[code] ?? code.toUpperCase();
  return `All ## Lyrics must be written entirely in ${label} (native words, not English).`;
}

/** Message utilisateur en sample_mode — idée naturelle + tags genre (sans les chanter). */
export function buildAceSampleModeUserMessage(args: {
  sampleQuery: string;
  captionOverride?: string;
  vocalLanguage?: string;
}): string {
  const sq = args.sampleQuery.trim();
  const tags = (args.captionOverride || "").trim();
  let message = sq;
  if (tags && tags !== sq) {
    const head = tags.slice(0, Math.min(40, tags.length)).toLowerCase();
    if (!sq.toLowerCase().includes(head)) {
      message = `${sq}\n\nProduction style tags (sound design only — the singer must NOT recite these words in lyrics): ${tags}`;
    }
  }
  const langRule = lyricsLanguageInstruction(args.vocalLanguage || "");
  if (langRule) message = `${message}\n\n${langRule}`;
  return message;
}

export function buildAceChatCompletionsParts(input: BuildAceChatCompletionsInput): string[] {
  const parts: string[] = [];
  const baseCaption = input.baseCaption.trim() || input.prompt.trim();

  if (input.melodyComposition) {
    parts.push(baseCaption);
    parts.push(MELODY_COMPOSITION_ACE_RULES);
    if (input.mood) parts.push(`Mood: ${input.mood}.`);
    if (input.energyLevel) parts.push(`Energy: ${input.energyLevel}.`);
    if (!input.autoMeta && input.bpm && input.bpm > 0) parts.push(`BPM: ${input.bpm}.`);
    if (!input.autoMeta && input.key && input.scale) parts.push(`Key: ${input.key} ${input.scale}.`);
    if (input.timeSignature.trim()) parts.push(`Time signature: ${input.timeSignature.trim()}.`);
    if (input.genre) {
      parts.push(`In the generated Metadata caption, explicitly include the genre: "${input.genre}".`);
    }
    return parts;
  }

  if (input.instrumental) {
    parts.push(baseCaption);
    parts.push(ACE_BEAT_LM_RULES);
    if (input.mood) parts.push(`Mood: ${input.mood}.`);
    if (input.energyLevel) parts.push(`Energy: ${input.energyLevel}.`);
  } else {
    parts.push(baseCaption);
    parts.push(ACE_SONG_LM_RULES);
    if (isAiComposeSongRequest({ instrumental: false, lyrics: input.lyrics })) {
      parts.push(ACE_AI_COMPOSE_SONG_LM_RULES);
    }
    const effectiveLyrics = input.lyrics.trim();
    if (effectiveLyrics) {
      if (lyricsNeedsLmExpansion(effectiveLyrics)) {
        parts.push(
          `Lyrics structure (expand every section into real 4-8 syllable singable lines, remove parenthetical directions):\n${effectiveLyrics}`,
        );
      } else {
        parts.push(`Lyrics:\n${effectiveLyrics}`);
      }
    }
    const vocalLanguage = (input.vocalLanguage || "").trim();
    if (vocalLanguage) parts.push(`Vocal language: ${vocalLanguage}.`);
    const lyricsLangRule = lyricsLanguageInstruction(vocalLanguage);
    if (lyricsLangRule) parts.push(lyricsLangRule);
    const vocalStyle = (input.vocalStyle || "").trim();
    if (vocalStyle) parts.push(`Vocal delivery style: ${vocalStyle}.`);
  }

  if (!input.autoMeta && input.bpm && input.bpm > 0) parts.push(`BPM: ${input.bpm}.`);
  if (input.autoMeta) {
    const bankBpm = input.baseCaption.match(/(\d{2,3})\s*bpm/i)?.[1];
    if (bankBpm) {
      parts.push(`Target BPM: ${bankBpm} — keep drill/trap tempo, do not slow down into mid-tempo pop.`);
    }
  }
  if (!input.autoMeta && input.key && input.scale) parts.push(`Key: ${input.key} ${input.scale}.`);
  if (input.timeSignature.trim()) parts.push(`Time signature: ${input.timeSignature.trim()}.`);
  if (input.genre) {
    parts.push(`In the generated Metadata caption, explicitly include the genre: "${input.genre}".`);
  }
  if (/\bdrill\b/i.test(input.genre)) {
    parts.push(
      "Music MUST be drill (sliding 808, dark minor melody, syncopated hi-hats, sparse piano or strings) — NOT dance-pop, NOT four-on-the-floor house, NOT bright euphoric pop synths.",
    );
  }
  if (/\btrapsoul\b/i.test(input.genre)) {
    parts.push(
      "Music MUST be trap soul (808 bass, trap hi-hats, R&B vocal pocket) — NOT acoustic pop ballad, NOT music-box arpeggios, NOT brushed jazz drums or upright bass singer-songwriter.",
    );
  }
  if (input.genre === "Dancehall") {
    parts.push('In the generated Metadata caption, explicitly include the words: "dancehall" and "riddim".');
  }

  return parts;
}

/** @deprecated Beat templates kept for callers that still pick a prose opener. */
export function pickBeatLmOpener(genre: string, seedKey: string): string {
  if (genre === "Old School Hip-Hop") {
    return pickOneBySeed(
      [
        "Create a classic old-school hip-hop / boom bap beat with a sample-based chopped loop.",
        "Generate an old-school boom bap hip-hop instrumental with dusty drums and a deconstructed sample chop.",
        "Old-school hip-hop beat: chopped soul/jazz sample, punchy kick/snare, MPC swing, subtle scratches.",
      ],
      seedKey,
    );
  }
  return pickOneBySeed(
    [
      `Create a modern ${genre || "hip-hop"} instrumental with contemporary drums and sound design.`,
      `Generate a release-ready ${genre || "hip-hop"} beat with a strong groove and polished mix.`,
    ],
    seedKey,
  );
}
