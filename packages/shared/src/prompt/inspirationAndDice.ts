import { buildAceCaption } from "../generation/promptAce";
import type { GenerateParams } from "../generation/types";
import type { AppLocale } from "../i18n/locales";
import { uiLocaleToAceVocalLanguage } from "../vocalLanguage";
import { getCuratedDisplayPromptPool, interleaveDisplayPrompts, mergeUniqueDisplayPrompts, resolveCuratedPromptLocale, sampleAceProseDisplayPool } from "./curated/index";
import {
  findGenreDiceItemByDisplay,
  getGenreDiceDisplayPromptPool,
  pickRandomChipGenre,
  pickRandomGenreDice,
} from "./genreDicePool";
import { getAceProseCuratedPool, looksLikeAceProsePrompt, optimizeAceProsePrompt } from "./aceProse";
import { resolvePromptPools } from "./localePools";
import { findPromptBankByDisplay, getPromptBankDisplayPool, pickPromptBankRoll, shouldUsePromptBank } from "./promptBank";

export type PromptLocale = AppLocale;
export type PromptMode = "beat" | "song";

export const GENRE_INSPIRATION_CHIPS: Record<string, readonly string[]> = {
  "Contemporary Rap": ["Hard Drums", "808/Sub", "Minimal Melody", "Bouncy Hats", "Ear Candy", "Modern"],
  "Lo-Fi Hip-Hop": ["Vintage", "Sad", "Vinyl", "Rain", "Night City", "Study"],
  "90s R&B": ["Live Keys", "Rhodes", "Soulful Chords", "Swinging Drums", "Warm Tape", "Smooth Groove"],
  Trapsoul: ["Smooth 808", "Half-time", "Dark Pads", "Tight Hats", "Woozy Melody", "Emotional"],
  "Melodic Trap": ["Hip-Hop Trap", "Atlanta", "Emotional Guitar", "Airy Pads", "808 Glides", "Space For Vocals"],
  "Jersey Drill": ["Kick Clusters", "Stop/Start", "808 Slides", "Dark Motif", "Bouncy Pocket", "Hype"],
  "Contemporary R&B": ["Polished", "Lush Chords", "Clean Drums", "Modern", "Sub Bass", "Hooky"],
  "R&B Alternative": ["Moody", "Minimal", "Texture", "Off-Kilter Drums", "Airy Pads", "Deep"],
  "Lo-fi R&B": ["Warm Tape", "Dusty", "Chill", "Soft Drums", "Late Night", "Vinyl"],
  "Neo Soul": ["Jazzy Chords", "Organic Feel", "Laid-back", "Live Bass", "Soulful", "Warm"],
  "Old School Hip-Hop": ["Boom Bap", "Chopped Samples", "Vinyl Dust", "MPC Swing", "Scratches", "Jazz/Soul"],
  "UK Drill": ["Dark Melody", "Sliding 808", "Off-beat Hats", "Aggressive", "Minor Key", "Street"],
  Afrobeats: ["Percussion Heavy", "Bright Guitar", "Danceable", "West African", "Rhythmic", "Uplifting"],
  Amapiano: ["Log Drum", "Deep Bass", "Piano Keys", "Shuffle", "South African", "Smooth", "Shakers"],
  House: ["4-on-the-floor", "Groovy Bass", "Chord Stabs", "Hi-hats", "Uplifting", "Club"],
  Pop: ["Catchy", "Bright", "Commercial", "Modern", "Upbeat", "Radio-ready"],
  "UK Garage": ["2-Step", "Syncopated", "Bouncy Bass", "Swing", "Vocal Chops", "London Vibe"],
  "Jersey Club": ["Fast Kicks", "Club Bounce", "Chopped Vocals", "Bed Squeak", "High Energy"],
  Electro: ["Punchy Bass", "Sidechain", "Bright Synths", "Club", "Clean Mix", "Energy"],
  "Video Game": ["Arps", "Chiptune", "Loopable", "Bright Motif", "SFX", "Bouncy"],
  "Pop Rock": ["Guitar Hook", "Big Chorus", "Live Drums", "Bright", "Uplifting", "Radio"],
  Rock: ["Distorted Guitars", "Driving Drums", "Energy", "Anthem", "Riffs", "Punchy"],
  Hyperpop: ["Kawaii", "Gaming", "Glitchy", "Distorted", "Fast", "Maximal"],
  "Baile Funk": ["Funk Mandelão", "Distorted Kick", "Sharp Snare", "Saw Lead", "DJ Drops", "Favela Energy"],
  Afrotrap: ["Hybrid Drums", "Aggressive Afro", "Heavy 808", "Rhythmic", "High Energy"],
  Dancehall: ["Island Vibe", "Club Energy", "Heavy Bass", "Rhythmic", "Tropical", "Summer"],
  Country: ["Acoustic Guitar", "Live Drums", "Warm Bass", "Lead Guitar", "Anthemic", "Emotional"],
  PluggnB: ["Plucky Synths", "Bouncy 808", "Soft Drums", "Airy", "Melodic", "Internet"],
  Rage: ["Distorted Lead", "Hype", "Aggressive", "Fast Hats", "Big Drops", "Energy"],
  "Cloud Rap": ["Dreamy", "Washed Reverb", "Airy Pads", "Soft 808", "Float", "Wide"],
  "Emo Rap": ["Sad Guitar", "Emotional", "Melodic", "Trap Drums", "Vulnerable", "Minor"],
  "Sad Rap": ["Melancholic", "Minor Chords", "Soft Drums", "Deep Sub", "Late Night", "Vibes"],
  "Atmospheric Rap": ["Airy Pads", "Minimal Drums", "Wide Space", "Moody", "Hypnotic", "Modern"],
  "Emotional Trap": ["Cinematic Chords", "Melodic", "Deep 808", "Emotional", "Modern Drums", "Space"],
  "Ambient Trap": ["Spacious Pads", "Minimal", "Deep Sub", "Hypnotic", "Texture", "Airy"],
  "Cinematic Trap": ["Cinematic", "Big Drums", "Dark", "Trailer", "Impacts", "Transitions"],
  "Experimental Trap": ["Glitchy", "Weird Textures", "Warped 808", "Unusual", "Futuristic", "Surprise"],
  "Sample Drill": ["Chopped Sample", "Gritty", "808 Slides", "Dark", "Drill Drums", "Underground"],
  "Melodic Drill": ["Emotional Melody", "808 Slides", "Dark", "Hooky", "Crisp Drums", "Street"],
  "Dark R&B": ["Moody", "Sparse", "Deep Sub", "Minor Chords", "Nocturnal", "Tension"],
  "Future R&B": ["Futuristic", "Glossy", "Airy", "Clean Drums", "Deep Sub", "Space"],
  "Afro R&B": ["Smooth", "Afro Perc", "Warm Guitar", "Sensual", "Modern", "Groove"],
  "Toxic R&B": ["Dark", "Sensual", "Cold Pads", "Tension", "Deep Sub", "Modern"],
  "Afro House": ["Afro Perc", "House Groove", "Hypnotic", "Club", "Warm Chords", "Deep Bass"],
  Latin: ["Latin Perc", "Danceable", "Catchy", "Warm Bass", "Club", "Bright"],
  Reggae: ["Skank Guitar", "Deep Bass", "One Drop", "Warm", "Sunny", "Laid-back"],
  "K-Pop": ["Glossy", "Catchy", "Bright", "Punchy Drums", "Modern", "Hook"],
  "Indie Pop": ["Warm", "Dreamy", "Guitars", "Soft Drums", "Understated", "Hooky"],
  "Dream Pop": ["Hazy", "Reverb", "Soft Drums", "Airy", "Lush", "Float"],
  "Dance Pop": ["Upbeat", "Bright Hook", "Punchy Drums", "Club", "Clean", "Radio"],
  "Viral TikTok": ["Hook First", "Catchy", "Short", "Memorable", "Clean Mix", "Earworm"],
  "Viral TikTok Pop": ["Catchy Hook", "Bright", "Punchy", "Glossy", "Earworm", "Pop"],
  EDM: ["Build-up", "Drop", "Big Synths", "Festival", "Energy", "Wide"],
  Chillstep: ["Chill", "Uplifting", "Atmospheric", "Sidechain", "Smooth", "Melodic"],
  Dubstep: ["Heavy Bass", "Half-time", "Aggressive", "Dark", "Drops", "Sound Design"],
  Vaporwave: ["Nostalgic", "Hazy", "Tape", "Retro", "Dreamy", "Soft"],
  Synthwave: ["Retro Synths", "Neon", "Arps", "Driving", "Cinematic", "Nostalgia"],
  "Witch House": ["Dark", "Hazy", "Occult", "Slow", "Distorted", "Atmospheric"],
  Glitchcore: ["Glitch", "Stutter", "Chaotic", "Digital", "Fast", "Edits"],
  Digicore: ["Internet", "Bright Synths", "Glitchy", "808s", "Energetic", "Hooks"],
  "Brazilian Phonk": ["Cowbell", "Aggressive", "Club", "Distorted Bass", "Fast", "Raw"],
  VinaHouse: ["Fast", "Bouncy", "Festival", "Bright Lead", "Hard Drums", "Energy"],
  "Study Beats": ["Lo-fi", "Warm Chords", "Soft Drums", "Calm", "Focus", "Vinyl"],
  Jazz: ["Live Feel", "Rich Chords", "Swing", "Warm", "Bass", "Expressive"],
  "New Jazz": ["Jazzy Chords", "Modern", "Tight Pocket", "Clean", "Warm Bass", "Texture"],
  Classical: ["Orchestral", "Strings", "Piano", "Dynamics", "Cinematic", "Hall"],
  Opera: ["Dramatic", "Orchestral", "Grand", "Hall Reverb", "Power", "Theme"],
  Oriental: ["Scales", "Oud", "Darbuka", "Ornaments", "Cinematic", "Hypnotic"],
  "Guitar Acoustic Live": ["Live", "Acoustic", "Natural Room", "Fingerpicking", "Intimate", "Warm"],
  "Piano Acoustic Live": ["Live", "Piano", "Natural Room", "Dynamics", "Intimate", "Warm"],
  "Rage + Ambient": ["Rage Lead", "Ambient Pads", "Ethereal", "Big Drops", "Wide", "Hype"],
  "Holographic R&B": ["Shimmer", "Glossy Chords", "Neon", "Smooth Drums", "Future", "Sensual"],
  "Futuristic Trap Soul": ["Trap Soul", "Futuristic", "Emotional", "808", "Clean Drums", "Airy"],
  "Ambient Drill": ["Drill Drums", "Ambient Pads", "Cold", "Wide", "Minimal", "808 Slides"],
  "Cinematic Afro Trap": ["Afro Perc", "Trap Drums", "Cinematic", "Big Transitions", "Energy", "Hybrid"],
  "AI-assisted Pop": ["Modern Pop", "Futuristic", "Catchy Hook", "Clean", "Polished", "Earworm"],
  "Experimental Afro House": ["Afro House", "Experimental", "Futuristic", "Hypnotic", "Textures", "Club"],
  "Hyper Melodic Rap": ["Hooky", "Melodic", "Emotional", "Modern Drums", "Bright", "Vocal Space"],
  "Dark Atmospheric Pop": ["Moody", "Cinematic", "Pop Drums", "Dark", "Hooky", "Wide"],
  "Y2K Futuristic Pop": ["Y2K", "Glossy", "2000s", "Future", "Catchy", "Ear Candy"],
  "Hybrid Electronic Rap": ["Rap Drums", "Electronic", "Club", "Sound Design", "Tight", "Energy"],
  "Sci-Fi R&B": ["Alien Textures", "Moody", "Wide", "Deep Sub", "Minimal", "Future"],
  "Ethereal Trap": ["Airy", "Shimmer", "Dreamy", "Minimal Drums", "Deep 808", "Float"],
  "Nostalgic Future Beats": ["Nostalgic", "Future", "Warm Chords", "Shimmer", "Modern Drums", "Retro"],
};

export const DEFAULT_INSPIRATION_CHIPS = ["Dark", "Melodic", "Emotional", "Hard", "Smooth", "Atmospheric"] as const;

export function getInspirationChipsForGenre(genre: string): readonly string[] {
  return GENRE_INSPIRATION_CHIPS[genre] ?? DEFAULT_INSPIRATION_CHIPS;
}

export function toggleInspirationChip(current: string, chip: string): string {
  const trimmed = current.trim();
  const on = trimmed.includes(chip);
  if (on) {
    return trimmed
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s !== chip)
      .join(", ");
  }
  return trimmed ? `${trimmed}, ${chip}` : chip;
}

const FULL_DISPLAY_LOCALES = new Set<PromptLocale>(["en", "fr", "es", "pt", "de", "it", "ja", "ko", "zh", "ar"]);

/** Phrases lisibles — curated traduit (langue ACE) ; nl/tr/hi/th → en. */
export function getDisplayPromptPool(locale: PromptLocale, mode: PromptMode): readonly string[] {
  const curatedLocale = resolveCuratedPromptLocale(locale);
  return getCuratedDisplayPromptPool(curatedLocale, mode);
}

/** Pool unifié curated + phrases display liées au genre (aligné web). */
export function getUnifiedMobileDisplayPool(locale: PromptLocale, mode: PromptMode): readonly string[] {
  if (mode === "song" && shouldUsePromptBank(locale)) {
    const bank = getPromptBankDisplayPool(locale);
    if (bank.length > 0) return bank;
  }
  const curatedLocale = resolveCuratedPromptLocale(locale);
  const curated = getCuratedDisplayPromptPool(curatedLocale, mode);
  const genreDisplays = getGenreDiceDisplayPromptPool(mode, locale);
  const aceProse = sampleAceProseDisplayPool(getAceProseCuratedPool(mode, curatedLocale));
  const merged = interleaveDisplayPrompts(curated, genreDisplays, aceProse);
  if (FULL_DISPLAY_LOCALES.has(locale)) {
    return merged;
  }
  return mergeUniqueDisplayPrompts(merged, resolvePromptPools("en").hero);
}

/** Caption ACE pour un prompt display (dé genre, curated structuré). */
export function buildDiceAceCaptionFromDisplay(
  locale: PromptLocale,
  mode: PromptMode,
  genre: string,
  displayPrompt: string,
): string {
  const vocalLanguage = uiLocaleToAceVocalLanguage(locale);
  const params: GenerateParams = {
    genre,
    influence: "No Influence",
    key: "",
    scale: "",
    bpm: 0,
    loopLengthBars: mode === "song" ? 16 : 8,
    swing: 0,
    mood: "",
    energyLevel: "",
    reverb: "Medium",
    prompt: displayPrompt,
  };
  return buildAceCaption(params, {
    isSong: mode === "song",
    instrumental: mode === "beat",
    autoMeta: true,
    vocalLanguage,
  });
}

function buildDiceAceCaption(
  locale: PromptLocale,
  mode: PromptMode,
  genre: string,
  displayPrompt: string,
): string {
  return buildDiceAceCaptionFromDisplay(locale, mode, genre, displayPrompt);
}

/** Dé / placeholder — même logique que web pickRandomUnifiedDiceRoll. */
export function pickUnifiedDiceRoll(locale: PromptLocale, mode: PromptMode): MobileDiceRoll {
  if (mode === "song" && shouldUsePromptBank(locale)) {
    const bank = pickPromptBankRoll(locale);
    return {
      displayPrompt: bank.display,
      acePrompt: bank.aceCaption,
      lyricsStructure: bank.lyricsStructure,
      genre: bank.genre,
      promptBankId: bank.id,
    };
  }

  const pool = getUnifiedMobileDisplayPool(locale, mode);
  const curatedLocale = resolveCuratedPromptLocale(locale);
  const curatedSet = new Set(
    getCuratedDisplayPromptPool(curatedLocale, mode).map((p) => p.trim().toLowerCase()),
  );

  const displayPrompt = pool[Math.floor(Math.random() * pool.length)] ?? pickRandomDisplayPrompt(locale, mode);
  const isCurated = curatedSet.has(displayPrompt.trim().toLowerCase());

  if (looksLikeAceProsePrompt(displayPrompt)) {
    const fallback = pickRandomGenreDice(mode, locale);
    return {
      displayPrompt,
      acePrompt: optimizeAceProsePrompt(displayPrompt, { mode }),
      genre: fallback.genre,
    };
  }

  if (isCurated) {
    const genre = pickRandomChipGenre();
    return {
      displayPrompt,
      acePrompt: "",
      genre,
    };
  }

  const matched = findGenreDiceItemByDisplay(displayPrompt, mode, locale);
  if (matched) {
    return {
      genre: matched.genre,
      displayPrompt: matched.displayPrompt,
      acePrompt: buildDiceAceCaption(locale, mode, matched.genre, matched.displayPrompt),
    };
  }

  const fallback = pickRandomGenreDice(mode, locale);
  return {
    genre: fallback.genre,
    displayPrompt,
    acePrompt: buildDiceAceCaption(locale, mode, fallback.genre, displayPrompt),
  };
}

export function pickRandomDisplayPrompt(locale: PromptLocale, mode: PromptMode): string {
  const pool = getDisplayPromptPool(locale, mode);
  return pool[Math.floor(Math.random() * pool.length)] ?? "";
}

export function pickRandomAcePrompt(locale: PromptLocale, mode: PromptMode): string {
  const pools = resolvePromptPools(locale);
  const acePool = pools[mode];
  return acePool[Math.floor(Math.random() * acePool.length)] ?? "";
}

export type MobileDiceRoll = {
  displayPrompt: string;
  acePrompt: string;
  genre?: string;
  /** Structure lyrics ACE-Step (banque curated 2000). */
  lyricsStructure?: string;
  promptBankId?: number;
};

/** @deprecated genreOptions ignoré — utiliser pickUnifiedDiceRoll */
export function pickMobileDiceRoll(
  locale: PromptLocale,
  mode: PromptMode,
  _currentGenre: string,
  _genreOptions?: readonly { value: string; label: string }[],
): MobileDiceRoll {
  return pickUnifiedDiceRoll(locale, mode);
}

export function pickNextPoolIndex(pool: readonly string[], current: number): number {
  if (pool.length <= 1) return 0;
  let next = current;
  while (next === current) {
    next = Math.floor(Math.random() * pool.length);
  }
  return next;
}

export function pickRotatingPlaceholder(
  locale: PromptLocale,
  mode: PromptMode,
  index: number,
): { text: string; nextIndex: number } {
  const pool =
    mode === "song" && shouldUsePromptBank(locale)
      ? getPromptBankDisplayPool(locale)
      : getDisplayPromptPool(locale, mode);
  if (!pool.length) return { text: "", nextIndex: 0 };
  const next = (index + 1) % pool.length;
  return { text: pool[index % pool.length] ?? pool[0] ?? "", nextIndex: next };
}
