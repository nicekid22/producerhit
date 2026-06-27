import type { GenerateParams } from './types';
import { BASE_INFLUENCE_MAP, BASE_MOOD_MAP, ENERGY_MAP, REVERB_MAP } from './catalogMaps';
import { getExtendedAceTagMap, getExtendedBpmMap, getInfluenceMap, getMoodMap } from './extendedRegistry';
import { ACE_GENRE_TAGS_BEAT, ACE_GENRE_TAGS_SONG } from './aceGenreTagMaps';
import { normalizeAceCaption } from '../prompt/acePromptContract';

function resolveMoodMap(): Record<string, string> {
  return { ...BASE_MOOD_MAP, ...getMoodMap() };
}

function resolveInfluenceMap(): Record<string, string> {
  return { ...BASE_INFLUENCE_MAP, ...getInfluenceMap() };
}
function clean(s: string) {
  return s
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/,\s*,/g, ", ")
    .replace(/\s+\./g, ".")
    .replace(/,\s*$/g, "")
    .trim();
}

function limitChars(s: string, max: number) {
  const t = clean(s);
  if (t.length <= max) return t;
  return t.slice(0, max).replace(/[,\s]+$/g, "").trim();
}

function uniqTags(tags: string[]) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of tags) {
    const t = clean(raw);
    if (!t) continue;
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}

function extractVocalStyle(prompt: string) {
  const m = prompt.match(/vocal\s*style\s*:\s*([^,]+)(?:,|$)/i);
  if (!m) return { style: "", rest: prompt };
  const style = clean(m[1] || "");
  const rest = clean(prompt.replace(m[0], " "));
  return { style, rest };
}

function tempoHintFromBpm(bpm: number) {
  if (!Number.isFinite(bpm) || bpm <= 0) return "";
  if (bpm >= 165) return "very fast tempo";
  if (bpm >= 140) return "fast tempo";
  if (bpm >= 115) return "upbeat tempo";
  if (bpm >= 90) return "mid-tempo";
  return "slow tempo";
}

export function buildAceCaption(
  params: GenerateParams,
  options?: { isSong?: boolean; instrumental?: boolean; autoMeta?: boolean; vocalLanguage?: string },
) {
  const isSong = Boolean(options?.isSong);
  const instrumental = options?.instrumental ?? true;
  const autoMeta = options?.autoMeta ?? true;
  const vocalLanguage = (options?.vocalLanguage || "").trim();
  const genreKey = params.genre === "Auto" ? "" : params.genre;

  const defaultBpmByGenre: Record<string, number> = {
    "Melodic Trap": 140,
    "Dark Trap": 140,
    Trapsoul: 140,
    Drill: 145,
    "UK Drill": 145,
    "NY Drill": 145,
    "Baile Funk": 150,
    House: 128,
    "UK Garage": 132,
    "Jersey Club": 140,
    "Jersey Drill": 150,
    Reggaeton: 95,
    Afrobeats: 105,
    Amapiano: 112,
    Dancehall: 98,
    Hyperpop: 160,
    "Hyperpop (Hip-Hop/R&B)": 160,
    "R&B Alternative": 105,
    "Video Game": 140,
    Electro: 128,
    Rock: 140,
    "Pop Rock": 140,
    "Speed Garage": 138,
    "Drum and Bass": 174,
    "Old School Hip-Hop": 92,
    "Lo-Fi Hip-Hop": 86,
    "Contemporary Rap": 145,
    "Contemporary R&B": 105,
    Pop: 120,
    "French Pop": 120,
    Soul: 96,
    Funk: 110,
    PluggnB: 150,
    Rage: 165,
    "Cloud Rap": 140,
    "Emo Rap": 150,
    "Sad Rap": 140,
    "Atmospheric Rap": 140,
    "Ambient Trap": 140,
    "Cinematic Trap": 145,
    "Sample Drill": 142,
    "Melodic Drill": 142,
    "Dark R&B": 105,
    "Future R&B": 110,
    "Afro R&B": 108,
    "Afro House": 124,
    VinaHouse: 132,
    EDM: 128,
    Chillstep: 140,
    Dubstep: 140,
    Reggae: 90,
    Latin: 100,
    "Rage + Ambient": 165,
    "Ambient Drill": 142,
    ...getExtendedBpmMap(),
  };

  const bpmHint = (Number.isFinite(params.bpm) && params.bpm > 0 ? Math.round(params.bpm) : defaultBpmByGenre[genreKey]) || 0;

  const aceGenreTagsBeat: Record<string, string> = {
    ...ACE_GENRE_TAGS_BEAT,
    ...getExtendedAceTagMap(),
  };

  const aceGenreTagsSong: Record<string, string> = {
    ...aceGenreTagsBeat,
    ...ACE_GENRE_TAGS_SONG,
  };

  const genreTags = (isSong ? aceGenreTagsSong[genreKey] : aceGenreTagsBeat[genreKey]) || genreKey;
  const influence = resolveInfluenceMap()[params.influence] ?? params.influence;
  const mood = resolveMoodMap()[params.mood] ?? params.mood;
  const energy = ENERGY_MAP[params.energyLevel] ?? params.energyLevel;
  const reverb = REVERB_MAP[params.reverb] ?? params.reverb;

  const extraRaw = (params.prompt || "").trim();
  const { rest: extraRest } = extractVocalStyle(extraRaw);
  const extra = limitChars(extraRest, 220);

  const tags = uniqTags(
    [
      genreTags,
      params.influence && params.influence !== "No Influence" && influence ? influence : "",
      mood,
      energy,
      reverb,
      bpmHint > 0 ? `${bpmHint} BPM` : "",
      !isSong && params.loopLengthBars > 0 ? `loopable ${params.loopLengthBars} bars` : "",
      autoMeta ? "" : params.key && params.scale ? `${params.key} ${params.scale}` : "",
      tempoHintFromBpm(params.bpm),
      instrumental ? "instrumental" : "",
      instrumental && !isSong ? "no vocals" : "",
      instrumental && !isSong ? "no lyrics" : "",
      extra ? extra : "",
    ].filter(Boolean) as string[],
  );

  const rawCaption = tags.join(", ");
  const effectiveBpm =
    Number.isFinite(params.bpm) && params.bpm > 0 ? Math.round(params.bpm) : bpmHint > 0 ? bpmHint : null;

  return normalizeAceCaption(rawCaption, {
    mode: instrumental ? "beat" : "song",
    instrumental,
    bpm: effectiveBpm,
    key: autoMeta ? undefined : params.key,
    scale: autoMeta ? undefined : params.scale,
    vocalLanguage,
  }).caption;
}

