import type { AppLocale } from "@/i18n/config";
import { ALL_GENRE_OPTIONS } from "@/lib/genres";
import type { PromptMode } from "@/lib/randomPromptIdeas";
import type { ThemeGroup } from "@/lib/randomPromptIdeas/genreDiceThemes/types";

const FR_BEAT_THEMES: Record<ThemeGroup, readonly string[]> = {
  trap: ["sur une nuit pluvieuse", "sur la confiance en rue", "pour célébrer une victoire à la Coupe du monde", "sur une session studio à 3h du mat", "pour un edit TikTok qui doit percer"],
  rnb: ["sur un cœur brisé nocturne", "pour une slow-jam sensuelle", "sur un ghosting après trois dates parfaites", "sur une confession après minuit au téléphone"],
  afro_latin: ["sur un sunset en festival", "pour un after mariage qui part en danse", "sur une nuit reggaeton à Barcelone", "sur une énergie afro-urban estivale"],
  electronic_pop: ["pour un hook radio accrocheur", "sur une vibe TikTok virale", "pour une pub sneakers Gen Z", "sur une prod bedroom pop ironique"],
  rock: ["sur une répétition garage", "pour un anthem de stade", "sur un burnout qui finit en cri libérateur", "sur une tension post-punk nocturne"],
  jazz_classical: ["sur un set jazz tardif fumé", "pour une bande-annonce indie", "sur un lounge moderne parisien", "sur une tension classique ciné"],
  world: ["sur une caravane dans le désert", "sur une nuit à Tokyo", "pour un mariage balkan qui dure trois jours", "sur les montagnes andines au lever du soleil"],
  cinematic: ["pour une montée de trailer IMAX", "sur une allée film noir", "pour un dernier stand héroïque", "sur un slow-burn suspense"],
  dnb: ["sur un roller liquid en warehouse", "pour un rush jungle underground", "sur une tension neurofunk", "sur un drift atmosphérique"],
  electronic_club: ["pour une after warehouse", "sur un drop festival mainstage", "pour une groove tech-house sunrise", "sur un peak techno Berlin"],
  lab: ["sur un clash futuriste glitch", "pour une expérience AI-pop", "sur une fusion sci-fi", "pour un reel producteur insomniaque"],
  default: ["pour entendre ton morceau en public pour la première fois", "sur une vibe nocturne créative", "pour un moment de vérité émotionnelle", "sur une atmosphère ciné sans cliché"],
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
  trap: ["about a rainy late-night drive", "about street confidence", "to celebrate a World Cup win", "about a 3am studio session", "for a TikTok edit that needs to pop"],
  rnb: ["about a heartbreak night", "for a sensual slow jam", "about getting ghosted after three perfect dates", "about a midnight phone confession"],
  afro_latin: ["about a festival sunset", "for a wedding after-party dance riot", "about a reggaeton night in Barcelona", "about summer afro-urban crossover energy"],
  electronic_pop: ["for a radio-ready hook", "about a viral TikTok moment", "for a Gen Z sneakers ad", "about ironic bedroom pop"],
  rock: ["about a garage rehearsal", "for a stadium anthem", "about burnout turning into a liberating scream", "about late-night post-punk tension"],
  jazz_classical: ["about a smoky late jazz set", "for an indie trailer", "about a modern Paris lounge", "about cinematic classical tension"],
  world: ["about a desert caravan", "about a Tokyo night market", "for a three-day Balkan wedding", "about Andean sunrise mountains"],
  cinematic: ["for an IMAX trailer rise", "about a film-noir alley", "for a heroic last stand", "about slow-burn suspense"],
  dnb: ["about a liquid warehouse roller", "for an underground jungle rush", "about neurofunk tension", "about atmospheric drift"],
  electronic_club: ["for a warehouse afterhours", "about a festival mainstage drop", "for a sunrise tech-house groove", "about Berlin peak techno"],
  lab: ["about a glitch futuristic clash", "for an AI-pop experiment", "about sci-fi fusion", "for an insomniac producer reel"],
  default: ["about hearing your track in public for the first time", "about a creative nocturnal vibe", "for a raw emotional truth moment", "about cinematic atmosphere without cliché"],
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
