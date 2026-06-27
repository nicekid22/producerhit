import { matchGenreFromPrompt } from "../../genres/matchGenreFromPrompt";
import { getAceGenreTagLine } from "../../generation/aceGenreTagMaps";

/** Partie genre dans le display banque : « hook — tropical house, 126 bpm » → « tropical house ». */
export function extractGenreFromBankDisplay(display: string): string {
  const tail = display.split(/\s[—–-]\s/)[1]?.trim() ?? "";
  return tail.replace(/,?\s*\d+\s*bpm$/i, "").trim();
}

function normalizeGenreToken(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/** BPM affiché après le tiret cadratin (ex. 130 bpm). */
export function extractBpmFromBankDisplay(display: string): string | null {
  const m = display.match(/(\d{2,3})\s*bpm\b/i);
  return m ? `${m[1]} bpm` : null;
}

/** BPM numérique depuis caption ACE ou display banque (ex. « 95 bpm »). */
export function extractBpmNumberFromText(text: string): number | null {
  const m = text.match(/(\d{2,3})\s*bpm\b/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n >= 50 && n <= 220 ? n : null;
}

/** Caption ACE minimal reconstruit depuis le genre du display (prioritaire sur le JSON baked). */
export function buildDisplayGenreCaptionSeed(display: string): string {
  const genre = extractGenreFromBankDisplay(display);
  const bpm = extractBpmFromBankDisplay(display);
  const genreNorm = normalizeGenreToken(genre);

  let production = "vibrant, polished studio mix";
  if (/\btrap\b/.test(genreNorm)) {
    production = "dark, hard 808, trap hi-hats, sliding bass";
  } else if (/\bdrill\b/.test(genreNorm)) {
    production = "sliding 808, dark piano stabs, syncopated hats";
  } else if (/\btrapsoul\b/.test(genreNorm)) {
    production = "808 bass, trap hi-hats, airy synths, trap soul pocket";
  } else if (/\bhouse\b/.test(genreNorm)) {
    production = "four-on-the-floor kick, groovy bassline, bright stabs";
  } else if (/\bpop\b/.test(genreNorm)) {
    production = "bright synth hook, punchy drums, radio-ready polish";
  } else if (/\bsoul\b/.test(genreNorm) || /\br&b\b/.test(genreNorm) || /\brnb\b/.test(genreNorm)) {
    production = "warm chords, smooth 808, intimate vocal space";
  }

  return [genre, production, bpm].filter(Boolean).join(", ");
}

/**
 * Vérifie que le caption baked (v1) correspond au genre affiché après le —.
 * Beaucoup d'entrées v1 ont des captions permutés (ex. club trap → afroswing).
 */
export function bankCaptionAlignsWithDisplay(display: string, caption: string): boolean {
  const displayGenre = normalizeGenreToken(extractGenreFromBankDisplay(display));
  if (!displayGenre || !caption.trim()) return true;

  const captionNorm = normalizeGenreToken(caption);
  const firstTag = normalizeGenreToken(caption.split(",")[0]?.trim() ?? "");
  const leadTags = caption
    .split(",")
    .slice(0, 3)
    .map((t) => normalizeGenreToken(t))
    .join(" ");

  if (captionNorm.includes(displayGenre) || firstTag === displayGenre) return true;

  const displayTokens = displayGenre.split(/\s+/).filter((t) => t.length >= 3);
  if (displayTokens.some((token) => leadTags.includes(token))) return true;

  const soulFamily = /\b(soul|ballade|ballad|rnb|r&b)\b/;
  if (soulFamily.test(displayGenre) && soulFamily.test(firstTag)) return true;

  const trapFamily = /trapsoul|\btrap\b|\bdrill\b/;
  if (trapFamily.test(displayGenre) && trapFamily.test(firstTag)) return true;

  if (/\btrapsoul\b/.test(displayGenre) && /\b(pop rnb|pop r&b|pop\b|acoustic guitar|bedroom pop)\b/.test(firstTag)) {
    return false;
  }

  if (/\btrap\b/.test(displayGenre)) {
    if (/\b(afroswing|afrobeats|afropop|dancehall|amapiano|dance pop|reggae|hip hop)\b/.test(firstTag)) {
      return false;
    }
  }
  if (/\bdance pop\b/.test(displayGenre) && /\b(trap|drill|afroswing)\b/.test(firstTag) && !/\bdance\b/.test(firstTag)) {
    return false;
  }
  if (/\bhouse\b/.test(displayGenre) && /\b(trap|drill)\b/.test(firstTag) && !/\bhouse\b/.test(firstTag)) {
    return false;
  }

  return displayTokens.some((token) => token.length >= 4 && captionNorm.includes(token));
}

const FR_ACE_TAG_REPLACEMENTS: Array<[RegExp, string]> = [
  [/cordes sombres/gi, "dark strings"],
  [/808 glissant/gi, "sliding 808"],
  [/synthés froids/gi, "cold synths"],
  [/trap tranchant/gi, "sharp trap drums"],
  [/hi-hats tranchants/gi, "sharp hi-hats"],
  [/kick lourd/gi, "heavy kick"],
  [/pads émotionnels/gi, "emotional pads"],
  [/pads sombres/gi, "dark pads"],
  [/basse froide/gi, "cold bass"],
  [/basse profonde/gi, "deep bass"],
  [/piano sombre/gi, "dark piano"],
  [/drill conscient/gi, "conscious drill"],
  [/trap mélodique/gi, "melodic trap"],
  [/trap nostalgique/gi, "nostalgic trap"],
  [/hard trap/gi, "hard trap"],
  [/rap émotionnel/gi, "emotional rap"],
];

/** ACE attend des tags EN — traduit les captions FR baked v2 avant envoi. */
export function englishAceCaptionFromBank(display: string, caption: string, catalogGenre: string): string {
  let out = caption.trim();
  if (!out) return buildDisplayGenreCaptionSeed(display);

  for (const [re, en] of FR_ACE_TAG_REPLACEMENTS) {
    out = out.replace(re, en);
  }

  if (/[àâäéèêëïîôùûüç]/i.test(out)) {
    const seed = buildDisplayGenreCaptionSeed(display);
    const base = getAceGenreTagLine(catalogGenre, true);
    const parts = [seed, base].filter(Boolean).join(", ");
    return parts || out;
  }

  return out;
}

/** Map ACE caption / display hints → genre catalogue (best-effort). */
export function guessGenreFromPromptBank(display: string, caption: string): string {
  const displayGenre = extractGenreFromBankDisplay(display);
  const fromDisplay = displayGenre ? matchGenreFromPrompt(displayGenre) : null;
  if (fromDisplay) return fromDisplay;

  const hay = `${display} ${caption}`;
  const fromHaystack = matchGenreFromPrompt(hay);
  if (fromHaystack) return fromHaystack;

  const rules: Array<[RegExp, string]> = [
    [/\bclub trap\b/, "Dark Trap"],
    [/\buk drill\b/, "UK Drill"],
    [/\bny drill\b|\bdrill\b/, "Melodic Drill"],
    [/\btrapsoul\b/, "Trapsoul"],
    [/\bdark r&b\b|\bdark rnb\b/, "Dark R&B"],
    [/\bneo soul\b/, "Neo Soul"],
    [/\bafrobeat\b|\bafrobeats\b/, "Afrobeats"],
    [/\bafropop\b/, "Afrobeats"],
    [/\bdancehall\b/, "Dancehall"],
    [/\bboom bap\b/, "Old School Hip-Hop"],
    [/\blo-?fi\b/, "Lo-Fi Hip-Hop"],
    [/\bgospel\b/, "Neo Soul"],
    [/\bconscious rap\b|\bspoken word\b/, "Contemporary Rap"],
    [/\bcloud trap\b/, "Cloud Rap"],
    [/\bambient trap\b/, "Ambient Trap"],
    [/\bamapiano\b/, "Amapiano"],
    [/\btropical house\b/, "House"],
    [/\bbedroom pop\b/, "Indie Pop"],
    [/\bfunk pop\b|\belectro pop\b|\bpop rock\b|\bcinematic pop\b/, "Pop"],
    [/\bedm\b/, "EDM"],
    [/\bdance pop\b/, "Dance Pop"],
    [/\bindie pop\b/, "Indie Pop"],
    [/\banthem pop\b|\bstadium pop\b/, "Pop"],
    [/\bhouse\b/, "House"],
    [/\bhyperpop\b/, "Hyperpop"],
    [/\bphonk\b/, "Brazilian Phonk"],
    [/\bpop r&b\b|\bpop rnb\b/, "Contemporary R&B"],
    [/\br&b\b|\brnb\b/, "Contemporary R&B"],
    [/\btrap\b/, "Melodic Trap"],
    [/\bhip hop\b|\bhip-hop\b/, "Contemporary Rap"],
    [/\bsoul\b/, "Neo Soul"],
    [/\bindie r&b\b|\bindie rnb\b/, "R&B Alternative"],
    [/\balt r&b\b|\balt rnb\b/, "R&B Alternative"],
    [/\bpop\b/, "Pop"],
  ];

  const hayLower = hay.toLowerCase();
  for (const [re, genre] of rules) {
    if (re.test(hayLower)) return genre;
  }
  return "Pop";
}
