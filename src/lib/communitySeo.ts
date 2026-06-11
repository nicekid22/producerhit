import {
  COMMUNITY_VIBE_CATEGORIES,
  type CommunityVibeCategory,
} from "@/lib/communityHub";
import type { PublicLoopRow } from "@/lib/publicLoops";

export const COMMUNITY_VIBE_BASE = "/community/vibe";
export const TRENDING_PATH = "/trending";

const ORIGIN = "https://www.producerhit.com";

export function communityVibePath(vibeId: string): string {
  return `${COMMUNITY_VIBE_BASE}/${vibeId}`;
}

export function getCommunityVibeById(id: string): CommunityVibeCategory | null {
  return COMMUNITY_VIBE_CATEGORIES.find((c) => c.id === id) ?? null;
}

export function isValidCommunityVibeId(id: string): boolean {
  return COMMUNITY_VIBE_CATEGORIES.some((c) => c.id === id);
}

export function buildCommunityVibeSeo(opts: {
  vibe: CommunityVibeCategory;
  isFr: boolean;
  trackCount?: number;
}) {
  const { vibe, isFr, trackCount } = opts;
  const title = isFr ? vibe.title.fr : vibe.title.en;
  const subtitle = isFr ? vibe.subtitle.fr : vibe.subtitle.en;
  const path = communityVibePath(vibe.id);
  const pageUrl = `${ORIGIN}${path}`;

  const titleMeta = isFr
    ? `${title} — beats IA communauté | ProducerHit`
    : `${title} — community AI beats | ProducerHit`;

  const countHint = trackCount && trackCount > 0 ? (isFr ? `${trackCount} tracks` : `${trackCount} tracks`) : "";

  const description = isFr
    ? `Écoute des beats IA ${title.toLowerCase()} sur ProducerHit : ${subtitle}. Remixe, commente et crée le tien — flux communautaire gratuit.${countHint ? ` ${countHint} publics.` : ""}`
    : `Listen to ${title.toLowerCase()} AI beats on ProducerHit: ${subtitle}. Remix, comment, and create your own — free community feed.${countHint ? ` ${countHint} public.` : ""}`;

  const keywords = isFr
    ? [
        `beat ${title.toLowerCase()} IA`,
        "beats IA communauté",
        "remix beat IA",
        "type beat IA",
        "générateur beats IA",
        subtitle,
        "ProducerHit",
      ]
    : [
        `${title.toLowerCase()} AI beat`,
        "community AI beats",
        "AI beat remix",
        "AI type beat",
        "AI beat generator",
        subtitle,
        "ProducerHit",
      ];

  return { titleMeta, description, keywords, pageUrl, path, title, subtitle };
}

export function buildTrendingSeo(isFr: boolean) {
  const pageUrl = `${ORIGIN}${TRENDING_PATH}`;
  return {
    titleMeta: isFr
      ? "Trending beats IA 2026 — remix & vibes du moment | ProducerHit"
      : "Trending AI beats 2026 — remix hot vibes | ProducerHit",
    description: isFr
      ? "Les beats IA les plus kiffés du moment sur ProducerHit. Écoute le trending TikTok-ready, remixe les vibes du flux et crée ton type beat en 30 secondes."
      : "Most-loved AI beats right now on ProducerHit. Stream TikTok-ready trending tracks, remix community vibes, and create your type beat in 30 seconds.",
    keywords: isFr
      ? [
          "trending beats IA",
          "beat viral TikTok IA",
          "remix beat tendance",
          "meilleur générateur beats IA",
          "type beat IA 2026",
          "ProducerHit trending",
        ]
      : [
          "trending AI beats",
          "viral TikTok AI beat",
          "trending beat remix",
          "best AI beat generator 2026",
          "AI type beat",
          "ProducerHit trending",
        ],
    pageUrl,
  };
}

export function buildCommunityItemListSchema(opts: {
  pageUrl: string;
  listName: string;
  items: Array<{ id: string; name: string; genre?: string | null }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: opts.listName,
    url: opts.pageUrl,
    numberOfItems: opts.items.length,
    itemListElement: opts.items.slice(0, 12).map((row, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: row.name || "Track",
      url: `${ORIGIN}/loop/${row.id}`,
      item: {
        "@type": "MusicRecording",
        name: row.name || "Track",
        url: `${ORIGIN}/loop/${row.id}`,
        genre: row.genre || undefined,
      },
    })),
  };
}

export function applyCommunityPageSeo(opts: {
  title: string;
  description: string;
  keywords: string[];
  pageUrl: string;
  jsonLd?: unknown;
}) {
  if (typeof document === "undefined") return;
  document.title = opts.title;
  const setMeta = (name: string, value: string) => {
    let el = document.head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", name);
      document.head.appendChild(el);
    }
    el.setAttribute("content", value);
  };
  const setOg = (prop: string, value: string) => {
    let el = document.head.querySelector(`meta[property="${prop}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("property", prop);
      document.head.appendChild(el);
    }
    el.setAttribute("content", value);
  };
  setMeta("description", opts.description);
  setMeta("keywords", opts.keywords.join(", "));
  setMeta("robots", "index,follow");
  setOg("og:title", opts.title);
  setOg("og:description", opts.description);
  setOg("og:url", opts.pageUrl);
  let canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = opts.pageUrl;
  if (opts.jsonLd) {
    let el = document.getElementById("pk-community-jsonld") as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement("script");
      el.id = "pk-community-jsonld";
      el.type = "application/ld+json";
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(opts.jsonLd);
  }
}

export function pickSimilarTracks(currentId: string, pool: PublicLoopRow[], genre?: string | null, limit = 8): PublicLoopRow[] {
  const sameGenre = genre ? pool.filter((r) => r.id !== currentId && r.genre === genre) : [];
  const source = sameGenre.length >= 3 ? sameGenre : pool.filter((r) => r.id !== currentId);
  return source.slice(0, limit);
}

/** Liens internes SEO — comparatifs, remix, vibes. */
export const SEO_INTERNAL_LINKS = {
  en: [
    { href: "/remix-cover-ai", label: "AI remix & cover workflow" },
    { href: "/suno-alternatives", label: "Suno alternatives" },
    { href: "/best-ai-beat-generator-for-producers", label: "Best AI beat generator" },
    { href: "/ai-music-generator-comparison-2026", label: "AI music generator comparison 2026" },
    { href: TRENDING_PATH, label: "Trending AI beats" },
  ],
  fr: [
    { href: "/remix-cover-ia", label: "Workflow remix & cover IA" },
    { href: "/alternatives-suno", label: "Alternatives Suno" },
    { href: "/meilleur-generateur-beats-ia-producteurs", label: "Meilleur générateur beats IA" },
    { href: "/comparatif-generateur-musique-ia-2026", label: "Comparatif générateur musique IA 2026" },
    { href: TRENDING_PATH, label: "Beats IA trending" },
  ],
} as const;
