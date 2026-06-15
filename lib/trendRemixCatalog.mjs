/**
 * Catalog of trending songs → AI genre remixes (SEO + ACE generation).
 * Full original lyrics live in trendRemixCatalogLyrics.mjs (verse + chorus minimum).
 */
import { catalogLyricsById } from "./trendRemixCatalogLyrics.mjs";
import { validateTrendRemixLyrics } from "./trendRemixLyricsQuality.mjs";

export const TREND_REMIX_CATALOG = [
  {
    id: "die-with-a-smile",
    original_title: "Die With A Smile",
    original_artist: "Lady Gaga & Bruno Mars",
    trend_keywords: ["die with a smile", "lady gaga bruno mars", "ai cover", "remix"],
    search_queries: ["die with a smile remix", "die with a smile cover ai"],
    remix_genre: "Afrobeats",
    mood: "Romantic",
    bpm: 108,
    duration_sec: 95,
    lyrics: "",
    lyrics_theme: "Bittersweet love, staying together until the end, warm vocal harmonies",
    ace_caption: "Afrobeats AI remix inspired by a viral pop duet — emotional vocals, log drums, warm chords",
    sample_query: "Afrobeats emotional love song duet vibe log drums",
    trend_score: 98,
  },
  {
    id: "birds-of-a-feather",
    original_title: "Birds of a Feather",
    original_artist: "Billie Eilish",
    trend_keywords: ["birds of a feather", "billie eilish", "ai remix", "trap remix"],
    search_queries: ["birds of a feather remix", "billie eilish trap remix ai"],
    remix_genre: "Dark Trap",
    mood: "Moody",
    bpm: 132,
    duration_sec: 88,
    lyrics: "",
    lyrics_theme: "Ride-or-die bond, intimate loyalty, whispered confessions over heavy 808s",
    ace_caption: "Dark trap remix — airy vocals, sliding 808s, hypnotic night-drive mood",
    sample_query: "dark trap moody female vocal intimate loyalty 808s",
    trend_score: 96,
  },
  {
    id: "apt",
    original_title: "APT.",
    original_artist: "ROSÉ & Bruno Mars",
    trend_keywords: ["apt song", "rose bruno mars", "apt remix", "ai cover"],
    search_queries: ["apt remix", "apt ai cover drill"],
    remix_genre: "UK Drill",
    mood: "Hype",
    bpm: 142,
    duration_sec: 82,
    lyrics: "",
    lyrics_theme: "Playful catchy hook, flirty call-and-response energy, party anthem",
    ace_caption: "UK drill flip of a viral pop hook — skippy drums, bold vocals, club energy",
    sample_query: "uk drill catchy hook party vocals skippy drums",
    trend_score: 97,
  },
  {
    id: "beautiful-things",
    original_title: "Beautiful Things",
    original_artist: "Benson Boone",
    trend_keywords: ["beautiful things", "benson boone", "ai remix", "rnb remix"],
    search_queries: ["beautiful things remix ai", "beautiful things rnb version"],
    remix_genre: "90s R&B",
    mood: "Emotional",
    bpm: 118,
    duration_sec: 92,
    lyrics: "",
    lyrics_theme: "Fear of losing something perfect, gratitude and vulnerability, soaring chorus",
    ace_caption: "90s R&B remix — warm keys, layered harmonies, emotional male vocal",
    sample_query: "90s rnb emotional male vocal piano heartfelt chorus",
    trend_score: 94,
  },
  {
    id: "lose-control",
    original_title: "Lose Control",
    original_artist: "Teddy Swims",
    trend_keywords: ["lose control", "teddy swims", "ai remix", "jersey remix"],
    search_queries: ["lose control remix", "lose control jersey club ai"],
    remix_genre: "Jersey Club",
    mood: "Euphoric",
    bpm: 130,
    duration_sec: 90,
    lyrics: "",
    lyrics_theme: "Obsessive love, can't stop thinking about you, high-energy release",
    ace_caption: "Jersey club remix — bouncy kick pattern, soulful vocals, dancefloor bounce",
    sample_query: "jersey club soulful vocal love obsession bounce",
    trend_score: 93,
  },
  {
    id: "espresso",
    original_title: "Espresso",
    original_artist: "Sabrina Carpenter",
    trend_keywords: ["espresso sabrina carpenter", "espresso remix", "ai cover"],
    search_queries: ["espresso remix ai", "espresso latin remix"],
    remix_genre: "Latin Pop",
    mood: "Flirty",
    bpm: 120,
    duration_sec: 85,
    lyrics: "",
    lyrics_theme: "Confident flirty energy, staying up all night, playful sass",
    ace_caption: "Latin pop remix — dembow-lite groove, glossy female vocal, summer night",
    sample_query: "latin pop flirty female vocal summer dembow groove",
    trend_score: 95,
  },
  {
    id: "greedy",
    original_title: "Greedy",
    original_artist: "Tate McRae",
    trend_keywords: ["greedy tate mcrae", "greedy remix", "ai remix"],
    search_queries: ["greedy remix trap", "greedy ai cover"],
    remix_genre: "Melodic Trap",
    mood: "Bold",
    bpm: 128,
    duration_sec: 86,
    lyrics: "",
    lyrics_theme: "Self-assured desire, knowing your worth, sharp attitude",
    ace_caption: "Melodic trap remix — crisp hats, attitude vocal, glossy synth lead",
    sample_query: "melodic trap confident female vocal attitude",
    trend_score: 91,
  },
  {
    id: "stick-season",
    original_title: "Stick Season",
    original_artist: "Noah Kahan",
    trend_keywords: ["stick season", "noah kahan", "folk remix ai"],
    search_queries: ["stick season remix", "stick season edm remix ai"],
    remix_genre: "Future Bass",
    mood: "Nostalgic",
    bpm: 124,
    duration_sec: 94,
    lyrics: "",
    lyrics_theme: "Small-town heartbreak, seasonal melancholy, longing for home",
    ace_caption: "Future bass remix of indie heartbreak — wide chords, emotional drop, male vocal",
    sample_query: "future bass nostalgic male vocal emotional drop",
    trend_score: 88,
  },
];

export function catalogById(id) {
  return TREND_REMIX_CATALOG.find((c) => c.id === id) ?? null;
}

export function activeCatalogSorted() {
  return [...TREND_REMIX_CATALOG].sort((a, b) => b.trend_score - a.trend_score);
}

export function buildDisplayTitle(entry) {
  return `${entry.original_title} — ${entry.remix_genre} AI Remix`;
}

export function buildAceLyrics(entry) {
  const provided = String(entry.lyrics ?? "").trim();
  if (provided.length > 120 && validateTrendRemixLyrics(provided).ok) return provided;

  const catalogLyrics = catalogLyricsById(entry.id);
  if (catalogLyrics && validateTrendRemixLyrics(catalogLyrics).ok) return catalogLyrics;

  throw new Error(`catalog_lyrics_missing_or_invalid:${entry.id}`);
}
