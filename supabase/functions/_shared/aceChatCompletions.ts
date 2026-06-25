/**
 * ACE chat/completions LM instruction builder — edge function copy (keep in sync with packages/shared).
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
};

const LYRICS_PLACEHOLDER_LINE_RE = /^\([^)]*\)\s*$/;

function lyricsNeedsLmExpansion(lyrics: string): boolean {
  const t = lyrics.trim();
  if (!t) return false;
  if (/\(storytelling|emotional tension|peak moment|atmospheric intro|fade into/i.test(t)) return true;
  const lines = t.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return lines.length > 0 && lines.every((l) => LYRICS_PLACEHOLDER_LINE_RE.test(l) || /^\[[^\]]+\]$/.test(l));
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
  }

  if (!input.autoMeta && input.bpm && input.bpm > 0) parts.push(`BPM: ${input.bpm}.`);
  if (!input.autoMeta && input.key && input.scale) parts.push(`Key: ${input.key} ${input.scale}.`);
  if (input.timeSignature.trim()) parts.push(`Time signature: ${input.timeSignature.trim()}.`);
  if (input.genre) {
    parts.push(`In the generated Metadata caption, explicitly include the genre: "${input.genre}".`);
  }
  if (input.genre === "Dancehall") {
    parts.push('In the generated Metadata caption, explicitly include the words: "dancehall" and "riddim".');
  }

  return parts;
}
