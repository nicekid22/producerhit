import { assignPrimaryCategory } from "@/lib/communityHub";
import type { PublicLoopRow } from "@/lib/publicLoops";

export type CommunityPulseItem = {
  id: string;
  emoji: string;
  textFr: string;
  textEn: string;
  href?: string;
};

const MS_DAY = 24 * 60 * 60 * 1000;

function countRecent(rows: PublicLoopRow[], days: number): number {
  const cutoff = Date.now() - days * MS_DAY;
  return rows.filter((r) => new Date(r.created_at ?? 0).getTime() >= cutoff).length;
}

function topGenre(rows: PublicLoopRow[]): string | null {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const g = (row.genre ?? "").trim();
    if (!g) continue;
    counts.set(g, (counts.get(g) ?? 0) + 1);
  }
  let best: { genre: string; count: number } | null = null;
  for (const [genre, count] of counts) {
    if (!best || count > best.count) best = { genre, count };
  }
  return best?.genre ?? null;
}

function latestDrop(rows: PublicLoopRow[]): PublicLoopRow | null {
  const sorted = rows
    .slice()
    .sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime());
  return sorted[0] ?? null;
}

function uncategorizedCount(rows: PublicLoopRow[]): number {
  return rows.filter((r) => !assignPrimaryCategory(r)).length;
}

export function buildCommunityPulse(input: {
  rows: PublicLoopRow[];
  commentsById?: Record<string, number>;
  ratingsById?: Record<string, { sum: number; count: number }>;
}): CommunityPulseItem[] {
  const { rows, commentsById = {}, ratingsById = {} } = input;
  const items: CommunityPulseItem[] = [];

  const newToday = countRecent(rows, 1);
  const newWeek = countRecent(rows, 7);
  const totalComments = Object.values(commentsById).reduce((a, b) => a + b, 0);
  const ratedCount = Object.values(ratingsById).filter((r) => r.count > 0).length;
  const trending = topGenre(rows);
  const latest = latestDrop(rows);
  const wildcards = uncategorizedCount(rows);

  if (newToday > 0) {
    items.push({
      id: "new-today",
      emoji: "🔥",
      textFr: `${newToday} nouveau${newToday > 1 ? "x" : ""} drop${newToday > 1 ? "s" : ""} aujourd'hui sur le flux`,
      textEn: `${newToday} fresh drop${newToday > 1 ? "s" : ""} on the feed today`,
    });
  } else if (newWeek > 0) {
    items.push({
      id: "new-week",
      emoji: "✨",
      textFr: `${newWeek} son${newWeek > 1 ? "s" : ""} publié${newWeek > 1 ? "s" : ""} cette semaine — le flux grandit`,
      textEn: `${newWeek} track${newWeek > 1 ? "s" : ""} dropped this week — the feed is growing`,
    });
  }

  if (trending) {
    items.push({
      id: "trend-genre",
      emoji: "📈",
      textFr: `Vibe du moment : ${trending} — tape pour explorer`,
      textEn: `Trending vibe: ${trending} — tap in to explore`,
    });
  }

  if (totalComments > 0) {
    items.push({
      id: "comments",
      emoji: "💬",
      textFr: `${totalComments} commentaire${totalComments > 1 ? "s" : ""} sur le flux — la commu parle`,
      textEn: `${totalComments} comment${totalComments === 1 ? "" : "s"} on the feed — the community is talking`,
    });
  }

  if (ratedCount > 0) {
    items.push({
      id: "ratings",
      emoji: "⭐",
      textFr: `${ratedCount} beat${ratedCount > 1 ? "s" : ""} noté${ratedCount > 1 ? "s" : ""} par la commu`,
      textEn: `${ratedCount} beat${ratedCount === 1 ? "" : "s"} rated by the community`,
    });
  }

  if (latest?.name) {
    items.push({
      id: "latest",
      emoji: "🎧",
      textFr: `Dernier drop : « ${latest.name} » — écoute maintenant`,
      textEn: `Latest drop: “${latest.name}” — listen now`,
      href: `/loop/${latest.id}`,
    });
  }

  if (wildcards > 0) {
    items.push({
      id: "discover",
      emoji: "🎲",
      textFr: `${wildcards} son${wildcards > 1 ? "s" : ""} en Découvertes — vibes improbables`,
      textEn: `${wildcards} track${wildcards === 1 ? "" : "s"} in Discoveries — unexpected vibes`,
    });
  }

  items.push(
    {
      id: "blog-community",
      emoji: "📖",
      textFr: "Guide : streaming IA créé par la commu, pour la commu",
      textEn: "Guide: community-built AI streaming, for the people",
      href: "/blog/community-ai-music-streaming-platform",
    },
    {
      id: "blog-flux",
      emoji: "🚀",
      textFr: "Comment le Flux ProducerHit s'auto-alimente (SEO + culture)",
      textEn: "How the ProducerHit Feed grows itself (SEO + culture)",
      href: "/blog/producerhit-community-feed-guide",
    },
    {
      id: "cta",
      emoji: "⚡",
      textFr: "Ton beat peut être le prochain spotlight — publie en public",
      textEn: "Your beat could be the next spotlight — publish public",
      href: "/dashboard",
    },
  );

  return items.slice(0, 10);
}

export function countNewToday(rows: PublicLoopRow[]): number {
  return countRecent(rows, 1);
}
