import type { PublicLoopRow } from "@/lib/publicLoops";
import { sortPublicLoopsByNewest } from "@/lib/publicLoops";

export const COMMUNITY_HUB_NAV = {
  fr: "Découvrir",
  en: "Discover",
} as const;

export const COMMUNITY_HUB_PAGE = {
  title: { fr: "Le Flux", en: "The Feed" },
  hook: {
    fr: "Streaming IA par le peuple, pour le peuple.",
    en: "AI streaming by the people, for the people.",
  },
  tagline: {
    fr: "Des beats drop par la commu. Écoute, commente, remix — c'est ton tour. Pas une app corporate : un flux qui vit.",
    en: "Beats dropped by the community. Listen, comment, remix — your turn. Not corporate fluff: a feed that actually moves.",
  },
  ctaPrimary: { fr: "Drop ton son", en: "Drop your track" },
  ctaShuffle: { fr: "Surprends-moi", en: "Surprise me" },
} as const;

export const DISCOVER_RAIL_ID = "discover";

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
    genreMatchers: ["hip hop", "hip-hop", "trap", "drill", "boom bap", "boom-bap", "grime", "jersey"],
    moodMatchers: ["hard", "aggressive", "street"],
  },
  {
    id: "lofi",
    title: { fr: "Lo-Fi & Chill", en: "Lo-Fi & Chill" },
    subtitle: { fr: "Études, pluie & café", en: "Study, rain & coffee" },
    accent: "linear-gradient(135deg, #34d399 0%, #2dd4bf 50%, #38bdf8 100%)",
    genreMatchers: ["lo-fi", "lofi", "chillhop", "jazz hop", "downtempo"],
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

export type CommunityRailSort = "love" | "newest" | "plays" | "comments" | "shuffle";

export type CommunitySortContext = {
  ratingsById: Record<string, { sum: number; count: number }>;
  playsById?: Record<string, number>;
  commentsById?: Record<string, number>;
};

/** Tri dédié à chaque vibe — évite le même ordre partout. */
export const CATEGORY_RAIL_SORT: Record<string, CommunityRailSort> = {
  bedroom: "love",
  "night-drive": "newest",
  club: "plays",
  hiphop: "love",
  lofi: "newest",
  cinematic: "comments",
};

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function seededShuffleRows<T extends { id: string }>(rows: T[], seed: string): T[] {
  const copy = rows.slice();
  let state = hashSeed(seed) || 1;
  const rand = () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function scoreCategoryMatch(row: PublicLoopRow, cat: CommunityVibeCategory): number {
  const h = haystack(row);
  const genre = (row.genre ?? "").toLowerCase();
  const mood = (row.mood ?? "").toLowerCase();
  let score = 0;

  for (const matcher of cat.genreMatchers) {
    const m = matcher.toLowerCase();
    if (genre.includes(m)) score += 100 + m.length;
    else if (h.includes(m)) score += 10 + m.length;
  }
  for (const matcher of cat.moodMatchers ?? []) {
    const m = matcher.toLowerCase();
    if (mood.includes(m)) score += 40 + m.length;
    else if (h.includes(m)) score += 5 + m.length;
  }
  return score;
}

export function assignPrimaryCategory(row: PublicLoopRow): CommunityVibeCategory | null {
  let best: { cat: CommunityVibeCategory; score: number } | null = null;
  for (const cat of COMMUNITY_VIBE_CATEGORIES) {
    const score = scoreCategoryMatch(row, cat);
    if (score <= 0) continue;
    if (!best || score > best.score || (score === best.score && cat.id < best.cat.id)) {
      best = { cat, score };
    }
  }
  return best?.cat ?? null;
}

export function sortByCommentBuzz(
  rows: PublicLoopRow[],
  commentsById: Record<string, number> = {},
  ratingsById: Record<string, { sum: number; count: number }> = {},
): PublicLoopRow[] {
  return rows.slice().sort((a, b) => {
    const ca = commentsById[a.id] ?? 0;
    const cb = commentsById[b.id] ?? 0;
    if (cb !== ca) return cb - ca;
    return sortByCommunityLove([a, b], ratingsById)[0]?.id === a.id ? -1 : 1;
  });
}

export function sortCommunityRail(
  rows: PublicLoopRow[],
  mode: CommunityRailSort,
  ctx: CommunitySortContext,
  shuffleSeed = "community",
): PublicLoopRow[] {
  const ratingsById = ctx.ratingsById;
  const playsById = ctx.playsById ?? {};
  const commentsById = ctx.commentsById ?? {};

  switch (mode) {
    case "newest":
      return sortPublicLoopsByNewest(rows);
    case "plays":
      return rows.slice().sort((a, b) => {
        const pa = playsById[a.id] ?? 0;
        const pb = playsById[b.id] ?? 0;
        if (pb !== pa) return pb - pa;
        return sortByCommunityLove([a, b], ratingsById, playsById)[0]?.id === a.id ? -1 : 1;
      });
    case "comments":
      return sortByCommentBuzz(rows, commentsById, ratingsById);
    case "shuffle":
      return seededShuffleRows(rows, shuffleSeed);
    case "love":
    default:
      return sortByCommunityLove(rows, ratingsById, playsById);
  }
}

/** Préfère des cartes uniques ; complète si le pool est petit. */
export function takeUniqueRailItems(
  sorted: PublicLoopRow[],
  limit: number,
  usedIds: Set<string>,
  preferFresh = true,
): PublicLoopRow[] {
  const out: PublicLoopRow[] = [];
  const pass = preferFresh ? [true, false] : [false];
  for (const freshOnly of pass) {
    for (const row of sorted) {
      if (out.length >= limit) break;
      if (freshOnly && usedIds.has(row.id)) continue;
      if (out.some((x) => x.id === row.id)) continue;
      out.push(row);
      usedIds.add(row.id);
    }
    if (out.length >= limit) break;
  }
  return out;
}

export type CommunityHubRailPlan = {
  id: string;
  category: CommunityVibeCategory;
  sort: CommunityRailSort;
  tracks: PublicLoopRow[];
};

export function buildCategoryRailPlans(
  rows: PublicLoopRow[],
  ctx: CommunitySortContext,
  options: { limit?: number; shuffleSeed?: string; usedIds?: Set<string> } = {},
): CommunityHubRailPlan[] {
  const limit = options.limit ?? 10;
  const usedIds = options.usedIds ?? new Set<string>();
  const shuffleSeed = options.shuffleSeed ?? "community";
  const byCategory = new Map<string, PublicLoopRow[]>();

  for (const row of rows) {
    const cat = assignPrimaryCategory(row);
    if (!cat) continue;
    const bucket = byCategory.get(cat.id) ?? [];
    bucket.push(row);
    byCategory.set(cat.id, bucket);
  }

  return COMMUNITY_VIBE_CATEGORIES.map((category) => {
    const pool = byCategory.get(category.id) ?? [];
    if (!pool.length) return null;
    const sort = CATEGORY_RAIL_SORT[category.id] ?? "love";
    const sorted = sortCommunityRail(pool, sort, ctx, `${shuffleSeed}:${category.id}`);
    const tracks = takeUniqueRailItems(sorted, limit, usedIds);
    if (!tracks.length) return null;
    return { id: category.id, category, sort, tracks };
  }).filter((x): x is CommunityHubRailPlan => x !== null);
}

export function tracksWithoutPrimaryCategory(rows: PublicLoopRow[]): PublicLoopRow[] {
  return rows.filter((r) => !assignPrimaryCategory(r));
}

export function buildDiscoverRailItems(
  rows: PublicLoopRow[],
  ctx: CommunitySortContext,
  options: { limit?: number; shuffleSeed?: string; usedIds?: Set<string> } = {},
): PublicLoopRow[] {
  const limit = options.limit ?? 10;
  const usedIds = options.usedIds ?? new Set<string>();
  const shuffleSeed = options.shuffleSeed ?? "community";
  const pool = tracksWithoutPrimaryCategory(rows);
  if (!pool.length) return [];
  const sorted = sortCommunityRail(pool, "shuffle", ctx, `${shuffleSeed}:${DISCOVER_RAIL_ID}`);
  return takeUniqueRailItems(sorted, limit, usedIds);
}

export function rowMatchesVibeCategory(row: PublicLoopRow, cat: CommunityVibeCategory): boolean {
  const h = haystack(row);
  if (cat.genreMatchers.some((m) => h.includes(m.toLowerCase()))) return true;
  if (cat.moodMatchers?.some((m) => h.includes(m.toLowerCase()))) return true;
  return false;
}

export function tracksForCategory(rows: PublicLoopRow[], cat: CommunityVibeCategory, exclusive = false): PublicLoopRow[] {
  if (exclusive) {
    return rows.filter((r) => assignPrimaryCategory(r)?.id === cat.id);
  }
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
  exclusive = true,
): Array<{ category: CommunityVibeCategory; tracks: PublicLoopRow[] }> {
  return COMMUNITY_VIBE_CATEGORIES.map((category) => ({
    category,
    tracks: tracksForCategory(rows, category, exclusive),
  })).filter((x) => x.tracks.length > 0);
}
