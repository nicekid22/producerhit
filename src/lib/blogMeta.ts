import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Disc3,
  DollarSign,
  Headphones,
  Mic2,
  Moon,
  Music2,
  Scale,
  Sparkles,
  Users,
  Waves,
  Zap,
} from "lucide-react";
import { BLOG_POSTS } from "@/content/blog";
import type { BlogCategoryId, EnrichedBlogPost } from "@/content/blog/types";
import { enrichBlogPost, estimateReadingMinutes } from "@/lib/blogEngine";

export type BlogVisual = {
  slug: string;
  categoryId: BlogCategoryId;
  heroImage: string;
  icon: LucideIcon;
  accent: string;
  genreMatchers: RegExp[];
  readingMinutes: number;
  excerptEn: string;
  excerptFr: string;
};

const HERO_IMAGES = [
  "/img/img/5324a6a6e010dc761c51822bda8d5074.jpg",
  "/img/img/e78f23b7b55720cfbadfc569b3a54f00.jpg",
  "/img/img/0a83e344393ef9b5157fb8f2a59345b7.jpg",
  "/img/img/249b94848491176ecd789debd23d30dd.jpg",
  "/img/img/7ac398f9999859951a49e7f6c3a41cc0.jpg",
  "/img/img/921b96e860f021a15db7cafda25b093a.jpg",
  "/img/img/c6c91d85ad46b078c51e13d78cffa178.jpg",
  "/img/img/d756171e1a2e1d4e05a62e112a8e5e35.jpg",
  "/img/img/315040da285c6f82824ffb8a06203135.jpg",
  "/img/img/666af1ce36bf5abd9eec9cbd5f7c19be.jpg",
  "/img/img/99aa996209673c9a905aec5364399f77.jpg",
  "/img/img/28e276ba9c5a818304f2c90e66fef153.jpg",
  "/img/img/5a9d56ba1fc42ee86242aa2bfec143a0.jpg",
  "/img/img/7014ba887a6e68783500b3d15d87bc81.jpg",
  "/img/img/b27fc16acca95d03da10d2d2a844842e.jpg",
  "/img/Gemini_Generated_Image_5dc3ts5dc3ts5dc3-jukebox-bg-removed.png",
] as const;

const CATEGORY_ICON: Record<BlogCategoryId, LucideIcon> = {
  "beat-generator": Music2,
  "type-beat": Disc3,
  "song-vocals": Mic2,
  "genre-guides": Waves,
  comparisons: Scale,
  workflow: Sparkles,
  monetization: DollarSign,
  community: Users,
};

const CATEGORY_ACCENT: Record<BlogCategoryId, string> = {
  "beat-generator": "from-violet-600/40 via-fuchsia-500/20 to-transparent",
  "type-beat": "from-cyan-500/35 via-violet-500/15 to-transparent",
  "song-vocals": "from-emerald-500/25 via-cyan-500/15 to-transparent",
  "genre-guides": "from-cyan-500/35 via-violet-500/15 to-transparent",
  comparisons: "from-pink-500/30 via-violet-500/20 to-transparent",
  workflow: "from-amber-500/30 via-violet-500/15 to-transparent",
  monetization: "from-green-500/25 via-emerald-500/15 to-transparent",
  community: "from-indigo-500/35 via-violet-500/15 to-transparent",
};

function hashSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return h;
}

function inferGenreMatchers(slug: string, keywords: string[]): RegExp[] {
  const s = `${slug} ${keywords.join(" ")}`.toLowerCase();
  if (/sleep|sommeil|meditation|ambient|calm|relax/.test(s)) return [/sleep|ambient|calm|meditation|relax|lofi|chill|pad/i];
  if (/study|focus|étude|concentration|lofi/.test(s)) return [/lofi|study|chill|ambient|focus|piano|jazz/i];
  if (/trap|drill/.test(s)) return [/trap|drill|808|hip hop|rap/i];
  if (/dnb|drum.and.bass/.test(s)) return [/dnb|drum|bass|jungle|break/i];
  if (/garage|ukg|speed/.test(s)) return [/garage|ukg|bassline|house/i];
  if (/hyperpop|rnb|r&b/.test(s)) return [/hyperpop|r&b|rnb|pop|trap/i];
  if (/funk|soul/.test(s)) return [/funk|soul|disco|groove/i];
  if (/afro|amapiano/.test(s)) return [/afro|amapiano|dancehall/i];
  if (/remix|cover/.test(s)) return [/remix|cover|pop|r&b|trap/i];
  if (/suno|udio|song|chanson/.test(s)) return [/pop|r&b|trap|song|vocal|melodic/i];
  return [/trap|drill|lofi|pop|r&b|hip hop|ambient|house|afro/i];
}

const SLUG_OVERRIDES: Partial<Record<string, { genreMatchers?: RegExp[]; icon?: LucideIcon; accent?: string }>> = {
  "drum-and-bass-beat-generator-prompt-template": { genreMatchers: [/dnb|drum|bass|jungle|breakbeat/i], icon: Waves },
  "ai-sleep-study-music-generator-guide": {
    genreMatchers: [/sleep|ambient|lofi|meditation|calm|study|focus/i],
    icon: Moon,
    accent: "from-indigo-500/40 via-violet-500/15 to-transparent",
  },
};

function buildVisual(slug: string, enriched?: EnrichedBlogPost): BlogVisual {
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  const e = enriched ?? (post ? enrichBlogPost(post) : null);
  const categoryId = e?.categoryId ?? "beat-generator";
  const keywords = post?.keywords ?? [];
  const heroImage = HERO_IMAGES[hashSlug(slug) % HERO_IMAGES.length]!;
  const base: BlogVisual = {
    slug,
    categoryId,
    heroImage,
    icon: CATEGORY_ICON[categoryId],
    accent: CATEGORY_ACCENT[categoryId],
    genreMatchers: inferGenreMatchers(slug, keywords),
    readingMinutes: post ? estimateReadingMinutes(post.blocks) : 5,
    excerptEn: post?.description ?? "",
    excerptFr: post?.description ?? "",
  };
  const over = SLUG_OVERRIDES[slug];
  if (!over) return base;
  return {
    ...base,
    icon: over.icon ?? base.icon,
    accent: over.accent ?? base.accent,
    genreMatchers: over.genreMatchers ?? base.genreMatchers,
  };
}

const visualCache = new Map<string, BlogVisual>();

function ensureVisualCache(): void {
  if (visualCache.size > 0) return;
  for (const p of BLOG_POSTS) {
    visualCache.set(p.slug, buildVisual(p.slug));
  }
}

export function getBlogVisual(slug: string, enriched?: EnrichedBlogPost): BlogVisual {
  if (enriched) return buildVisual(slug, enriched);
  ensureVisualCache();
  return visualCache.get(slug) ?? buildVisual(slug);
}

export function getH2SectionIcon(heading: string): LucideIcon {
  const h = heading.toLowerCase();
  if (/prompt|template|example|copy/.test(h)) return Zap;
  if (/workflow|step|iterate|variation|seed|remix/.test(h)) return Sparkles;
  if (/compare|alternative|vs|winner|bottom/.test(h)) return Scale;
  if (/listen|audio|preview|community/.test(h)) return Headphones;
  if (/sleep|calm|meditation/.test(h)) return Moon;
  return Music2;
}
