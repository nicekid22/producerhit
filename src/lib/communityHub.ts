import type { PublicLoopRow } from "@/lib/publicLoops";

export const COMMUNITY_HUB_NAV = {
  fr: "Découvrir",
  en: "Discover",
} as const;

export const COMMUNITY_HUB_PAGE = {
  title: { fr: "Le Flux", en: "The Feed" },
  tagline: {
    fr: "Écoute, explore par vibe et remixe — comme une plateforme de streaming, alimentée par la communauté.",
    en: "Listen, browse by vibe, and remix — streaming-style, powered by the community.",
  },
} as const;

export type CommunityVibeCategory = {
  id: string;
  title: { fr: string; en: string };
  subtitle: { fr: string; en: string };
  /** CSS gradient for cards / hero accents */
  accent: string;
  genreMatchers: string[];
  moodMatchers?: string[];
};

export const COMMUNITY_VIBE_CATEGORIES: CommunityVibeCategory[] = [
  {
    id: "bedroom",
    title: { fr: "Bedroom", en: "Bedroom" },
    subtitle: { fr: "R&B, neo-soul & vibes intimes", en: "R&B, neo-soul & late-night feels" },
    accent: "linear-gradient(135deg, #7c3aed 0%, #ec4899 48%, #f472b6 100%)",
    genreMatchers: ["r&b", "rnb", "neo soul", "neo-soul", "soul", "alternative r&b", "quiet storm", "soft girl"],
    moodMatchers: ["soft", "chill", "romantic", "dreamy", "sensual", "intimate"],
  },
  {
    id: "night-drive",
    title: { fr: "Night Drive", en: "Night Drive" },
    subtitle: { fr: "Synthwave, phonk & routes nocturnes", en: "Synthwave, phonk & midnight lanes" },
    accent: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 55%, #a855f7 100%)",
    genreMatchers: ["synth", "wave", "synthwave", "phonk", "dark", "drift", "retro"],
    moodMatchers: ["dark", "moody", "nocturnal", "cinematic"],
  },
  {
    id: "club",
    title: { fr: "Club & Dance", en: "Club & Dance" },
    subtitle: { fr: "House, techno, EDM & dancefloor", en: "House, techno, EDM & dancefloor" },
    accent: "linear-gradient(135deg, #22d3ee 0%, #3b82f6 50%, #8b5cf6 100%)",
    genreMatchers: ["house", "techno", "edm", "trance", "dancehall", "afro", "amapiano", "garage", "uk garage"],
    moodMatchers: ["energetic", "party", "euphoric", "club"],
  },
  {
    id: "hiphop",
    title: { fr: "Hip-Hop Lab", en: "Hip-Hop Lab" },
    subtitle: { fr: "Trap, drill, boom bap & beats", en: "Trap, drill, boom bap & beats" },
    accent: "linear-gradient(135deg, #f59e0b 0%, #ef4444 45%, #a855f7 100%)",
    genreMatchers: ["hip hop", "hip-hop", "trap", "drill", "boom bap", "boom-bap", "grime", "jersey", "lo-fi", "lofi"],
    moodMatchers: ["hard", "aggressive", "street"],
  },
  {
    id: "lofi",
    title: { fr: "Lo-Fi & Chill", en: "Lo-Fi & Chill" },
    subtitle: { fr: "Études, pluie & café", en: "Study, rain & coffee" },
    accent: "linear-gradient(135deg, #34d399 0%, #2dd4bf 50%, #38bdf8 100%)",
    genreMatchers: ["lo-fi", "lofi", "chillhop", "jazz hop", "ambient", "downtempo"],
    moodMatchers: ["chill", "relaxed", "calm", "cozy"],
  },
  {
    id: "cinematic",
    title: { fr: "Cinematic", en: "Cinematic" },
    subtitle: { fr: "Ambiant, orchestral & scores", en: "Ambient, orchestral & scores" },
    accent: "linear-gradient(135deg, #94a3b8 0%, #64748b 40%, #818cf8 100%)",
    genreMatchers: ["ambient", "cinematic", "orchestral", "soundtrack", "classical", "neo-classical"],
    moodMatchers: ["epic", "emotional", "cinematic", "atmospheric"],
  },
];

function haystack(row: PublicLoopRow): string {
  return `${row.genre ?? ""} ${row.mood ?? ""} ${row.influence ?? ""} ${row.name ?? ""} ${row.prompt ?? ""}`.toLowerCase();
}

export function rowMatchesVibeCategory(row: PublicLoopRow, cat: CommunityVibeCategory): boolean {
  const h = haystack(row);
  if (cat.genreMatchers.some((m) => h.includes(m.toLowerCase()))) return true;
  if (cat.moodMatchers?.some((m) => h.includes(m.toLowerCase()))) return true;
  return false;
}

export function tracksForCategory(rows: PublicLoopRow[], cat: CommunityVibeCategory): PublicLoopRow[] {
  return rows.filter((r) => rowMatchesVibeCategory(r, cat));
}

export function sortByRating(
  rows: PublicLoopRow[],
  ratingsById: Record<string, { sum: number; count: number }>,
): PublicLoopRow[] {
  return sortByCommunityLove(rows, ratingsById);
}

/** Notes d'abord (moyenne puis nb de votes), sinon écoutes communauté, sinon récence. */
export function sortByCommunityLove(
  rows: PublicLoopRow[],
  ratingsById: Record<string, { sum: number; count: number }>,
  playsById: Record<string, number> = {},
): PublicLoopRow[] {
  const score = (id: string) => {
    const r = ratingsById[id];
    const count = r?.count ?? 0;
    const avg = count > 0 ? r!.sum / count : 0;
    const plays = playsById[id] ?? 0;
    return { count, avg, plays };
  };

  return rows.slice().sort((a, b) => {
    const sa = score(a.id);
    const sb = score(b.id);
    const ratedA = sa.count > 0;
    const ratedB = sb.count > 0;

    if (ratedA && ratedB) {
      if (sb.avg !== sa.avg) return sb.avg - sa.avg;
      if (sb.count !== sa.count) return sb.count - sa.count;
    } else if (ratedA !== ratedB) {
      return ratedB ? 1 : -1;
    }

    if (sb.plays !== sa.plays) return sb.plays - sa.plays;
    return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
  });
}

export function pickSpotlight(
  rows: PublicLoopRow[],
  ratingsById: Record<string, { sum: number; count: number }>,
  playsById: Record<string, number> = {},
): PublicLoopRow | null {
  const sorted = sortByCommunityLove(rows, ratingsById, playsById);
  const rated = sorted.find((r) => (ratingsById[r.id]?.count ?? 0) >= 1);
  if (rated) return rated;
  return sorted[0] ?? null;
}

export function categoriesWithTracks(
  rows: PublicLoopRow[],
): Array<{ category: CommunityVibeCategory; tracks: PublicLoopRow[] }> {
  return COMMUNITY_VIBE_CATEGORIES.map((category) => ({
    category,
    tracks: tracksForCategory(rows, category),
  })).filter((x) => x.tracks.length > 0);
}
