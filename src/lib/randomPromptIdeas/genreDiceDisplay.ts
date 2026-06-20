import type { AppLocale } from "@/i18n/config";
import { ALL_GENRE_OPTIONS } from "@/lib/genres";
import type { PromptMode } from "@/lib/randomPromptIdeas";
import type { ThemeGroup } from "@/lib/randomPromptIdeas/genreDiceThemes/types";

const FR_BEAT_THEMES: Record<ThemeGroup, readonly string[]> = {
  trap: ["sur une nuit pluvieuse", "sur la confiance en rue", "sur une montée de tension", "sur une session studio tardive"],
  rnb: ["sur un cœur brisé nocturne", "sur une slow-jam sensuelle", "sur une vibe neo-soul", "sur une confession après minuit"],
  afro_latin: ["sur un sunset en festival", "sur une nuit reggaeton", "sur une énergie afro-urban", "sur une fête caribéenne"],
  electronic_pop: ["sur un hook radio accrocheur", "sur une vibe TikTok", "sur une nuit néon rétro", "sur une prod bedroom pop"],
  rock: ["sur une répétition garage", "sur un anthem de stade", "sur une vibe indie basement", "sur une tension post-punk"],
  jazz_classical: ["sur un set jazz tardif", "sur un drame de chambre", "sur un lounge moderne", "sur une tension classique"],
  world: ["sur une caravane dans le désert", "sur une nuit à Tokyo", "sur les montagnes andines", "sur un mariage balkan"],
  cinematic: ["sur une montée de trailer", "sur une allée noir", "sur un dernier stand héroïque", "sur un slow-burn suspense"],
  dnb: ["sur un roller liquid", "sur un rush jungle", "sur une tension neurofunk", "sur un drift atmosphérique"],
  electronic_club: ["sur une after warehouse", "sur un drop festival", "sur une groove tech-house", "sur un peak techno"],
  lab: ["sur un clash futuriste", "sur une expérience AI-pop", "sur une fusion glitch", "sur une vibe sci-fi"],
  default: ["sur une vibe nocturne", "sur une énergie montante", "sur un mood introspectif", "sur une atmosphère ciné"],
};

const FR_SONG_THEMES: Record<ThemeGroup, readonly string[]> = {
  trap: ["sur un cœur brisé en banlieue", "sur la confiance retrouvée", "sur l'anxiété nocturne", "sur une relève de rue"],
  rnb: ["sur une rupture douce-amère", "sur une romance sensuelle", "sur une âme neo-soul", "sur un secret après minuit"],
  afro_latin: ["sur une fête sous les palmiers", "sur une nuit reggaeton", "sur une love story afro-urban", "sur une vibe île soleil"],
  electronic_pop: ["sur un hook qui reste en tête", "sur une chanson virale", "sur une nuit néon", "sur un rêve pop bedroom"],
  rock: ["sur une rébellion garage", "sur un cri de stade", "sur une peine indie", "sur une rupture post-punk"],
  jazz_classical: ["sur une romance fumée", "sur une tragédie lyrique", "sur une confidence jazz", "sur une promesse classique"],
  world: ["sur un voyage dans le désert", "sur une nuit à Tokyo", "sur un conte andin", "sur une fête balkan"],
  cinematic: ["sur une montée héroïque", "sur une ombre de film noir", "sur un adieu épique", "sur une tension qui serre"],
  dnb: ["sur une nuit liquid", "sur une ruée jungle", "sur une rage contrôlée", "sur un rêve atmosphérique"],
  electronic_club: ["sur une nuit warehouse", "sur une montée festival", "sur une groove club", "sur une transe techno"],
  lab: ["sur un futur glitché", "sur une love story AI", "sur une fusion expérimentale", "sur une orbite sci-fi"],
  default: ["sur une histoire nocturne", "sur une émotion brute", "sur un moment de vérité", "sur une vibe cinématique"],
};

const EN_BEAT_THEMES: Record<ThemeGroup, readonly string[]> = {
  trap: ["about a rainy late-night drive", "about street confidence", "about rising cinematic tension", "about a late studio session"],
  rnb: ["about a heartbreak night", "about a sensual slow jam", "about a neo-soul pocket", "about a midnight confession"],
  afro_latin: ["about a festival sunset", "about a reggaeton night", "about afro-urban crossover energy", "about a Caribbean block party"],
  electronic_pop: ["about a radio-ready hook", "about a TikTok earworm", "about a retro neon night", "about a bedroom producer vibe"],
  rock: ["about a garage rehearsal", "about an arena anthem", "about basement indie grit", "about post-punk tension"],
  jazz_classical: ["about a late jazz set", "about chamber drama", "about modern lounge jazz", "about minimal classical tension"],
  world: ["about a desert caravan", "about a Tokyo night market", "about Andean mountains", "about a Balkan wedding"],
  cinematic: ["about a trailer rise", "about a noir alley", "about a heroic last stand", "about slow-burn suspense"],
  dnb: ["about a liquid roller", "about a jungle warehouse rush", "about neurofunk tension", "about atmospheric drift"],
  electronic_club: ["about an afterhours warehouse", "about a festival mainstage drop", "about a tech-house groove", "about hard techno peak time"],
  lab: ["about a futuristic clash", "about an AI-pop experiment", "about a glitch fusion", "about sci-fi orbit"],
  default: ["about a nocturnal vibe", "about rising energy", "about an introspective mood", "about a cinematic atmosphere"],
};

const EN_SONG_THEMES: Record<ThemeGroup, readonly string[]> = {
  trap: ["about a broken heart in the suburbs", "about finding confidence again", "about late-night anxiety", "about a street comeback"],
  rnb: ["about a bittersweet breakup", "about a sensual romance", "about a neo-soul confession", "about a midnight secret"],
  afro_latin: ["about a party under palm trees", "about a reggaeton night out", "about an afro-urban love story", "about sunny island vibes"],
  electronic_pop: ["about a catchy hook", "about a viral pop moment", "about a neon night", "about a bedroom pop dream"],
  rock: ["about garage rebellion", "about a stadium cry", "about indie heartache", "about a post-punk breakup"],
  jazz_classical: ["about a smoky romance", "about a lyrical tragedy", "about a jazz confession", "about a classical promise"],
  world: ["about a desert journey", "about a Tokyo night", "about an Andean tale", "about a Balkan celebration"],
  cinematic: ["about a heroic rise", "about a film-noir shadow", "about an epic goodbye", "about tightening suspense"],
  dnb: ["about a liquid night", "about a jungle rush", "about controlled rage", "about an atmospheric dream"],
  electronic_club: ["about a warehouse night", "about a festival build", "about a club groove", "about a techno trance"],
  lab: ["about a glitched future", "about an AI love story", "about an experimental fusion", "about a sci-fi orbit"],
  default: ["about a nocturnal story", "about raw emotion", "about a moment of truth", "about a cinematic vibe"],
};

const FR_GENRE_LABELS: Partial<Record<string, string>> = {
  "Melodic Trap": "melodic trap",
  "Contemporary Rap": "hip-hop",
  "Dark Trap": "dark trap",
  "Contemporary R&B": "R&B",
  "90s R&B": "R&B des années 90",
  Afrobeats: "afrobeats",
  Reggaeton: "reggaeton",
  Pop: "pop",
  House: "house",
  "Lo-Fi Hip-Hop": "lo-fi hip-hop",
  Drill: "drill",
  "French Pop": "pop française",
};

function pickTheme(locale: AppLocale, group: ThemeGroup, mode: PromptMode, variant: number): string {
  const pools =
    locale === "fr"
      ? mode === "song"
        ? FR_SONG_THEMES
        : FR_BEAT_THEMES
      : mode === "song"
        ? EN_SONG_THEMES
        : EN_BEAT_THEMES;
  const pool = pools[group] ?? pools.default;
  return pool[variant % pool.length] ?? pool[0] ?? "";
}

export function getGenreDisplayLabel(genre: string, locale: AppLocale): string {
  if (locale === "fr" && FR_GENRE_LABELS[genre]) return FR_GENRE_LABELS[genre]!;
  const opt = ALL_GENRE_OPTIONS.find((o) => o.value === genre);
  return (opt?.label ?? genre).toLowerCase();
}

export function buildGenreDiceDisplayPrompt(
  locale: AppLocale,
  genre: string,
  mode: PromptMode,
  themeGroup: ThemeGroup,
  variant: number,
): string {
  const genreLabel = getGenreDisplayLabel(genre, locale);
  const theme = pickTheme(locale, themeGroup, mode, variant);
  if (locale === "fr") {
    return mode === "song" ? `Une chanson ${genreLabel} ${theme}` : `Un beat ${genreLabel} ${theme}`;
  }
  return mode === "song" ? `A ${genreLabel} song ${theme}` : `A ${genreLabel} beat ${theme}`;
}
