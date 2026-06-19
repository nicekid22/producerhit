import type { BlogBlock, BlogCategoryId, BlogPost, EnrichedBlogPost } from "@/content/blog/types";
import { BLOG_CATEGORIES } from "@/content/blog/categories";

const ORIGIN = "https://www.producerhit.com";

export const BLOG_POSTS_PER_PAGE = 12;

export function slugifyTag(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export function countBlogWords(blocks: BlogBlock[]): number {
  let words = 0;
  for (const b of blocks) {
    if (b.type === "p" || b.type === "h2" || b.type === "h3" || b.type === "callout") {
      words += b.text.split(/\s+/).filter(Boolean).length;
      if (b.type === "callout" && b.title) words += b.title.split(/\s+/).filter(Boolean).length;
    } else if (b.type === "ul") {
      words += b.items.join(" ").split(/\s+/).filter(Boolean).length;
    }
  }
  return words;
}

export function estimateReadingMinutes(blocks: BlogBlock[]): number {
  const words = countBlogWords(blocks);
  return Math.max(3, Math.min(18, Math.ceil(words / 200)));
}

export function buildBlogOgImageUrl(post: Pick<BlogPost, "slug" | "title" | "categoryId"> & { categoryId?: BlogCategoryId }): string {
  const params = new URLSearchParams();
  params.set("slug", post.slug);
  params.set("title", post.title.slice(0, 80));
  if (post.categoryId) params.set("category", post.categoryId);
  return `${ORIGIN}/api/og-blog?${params.toString()}`;
}

function inferCategoryId(post: BlogPost): BlogCategoryId {
  if (post.categoryId) return post.categoryId;
  const s = `${post.slug} ${post.keywords.join(" ")} ${post.title}`.toLowerCase();
  if (/suno|udio|beatoven|mubert|loudly|alternatives|comparatif|vs-/.test(s)) return "comparisons";
  if (/community|trending|feed|remix-culture/.test(s)) return "community";
  if (/youtube|spotify|royalty|commercial|monetiz|copyright|droits/.test(s)) return "monetization";
  if (/seed|workflow|variation|iterate|step-by-step|etape/.test(s)) return "workflow";
  if (/type-beat|type beat|typebeat/.test(s)) return "type-beat";
  if (/song|vocal|chanson|lyrics|paroles/.test(s)) return "song-vocals";
  if (/trap|drill|lofi|phonk|afro|reggaeton|rnb|soul|funk|dnb|garage|k-pop|latin|genre/.test(s)) return "genre-guides";
  return "beat-generator";
}

function inferTags(post: BlogPost): string[] {
  if (post.tags?.length) return post.tags;
  const tags = new Set<string>();
  for (const kw of post.keywords) tags.add(slugifyTag(kw));
  const s = `${post.slug} ${post.title}`.toLowerCase();
  const hints: [RegExp, string][] = [
    [/trap/, "trap"],
    [/drill/, "drill"],
    [/lofi|lo-fi/, "lo-fi"],
    [/phonk/, "phonk"],
    [/suno/, "suno-alternatives"],
    [/udio/, "udio-alternatives"],
    [/type.beat|typebeat/, "type-beat"],
    [/seed|variation/, "seed-workflow"],
    [/spotify/, "spotify"],
    [/youtube/, "youtube"],
    [/prompt/, "prompts"],
    [/free|gratuit/, "free-tier"],
    [/remix/, "remix"],
    [/afro/, "afrobeats"],
    [/reggaeton|dembow/, "reggaeton"],
    [/rnb|r&b/, "rnb"],
  ];
  for (const [re, tag] of hints) {
    if (re.test(s)) tags.add(tag);
  }
  return [...tags].slice(0, 8);
}

export function enrichBlogPost(post: BlogPost): EnrichedBlogPost {
  const categoryId = inferCategoryId(post);
  const tags = inferTags(post);
  const wordCount = countBlogWords(post.blocks);
  const readingMinutes = estimateReadingMinutes(post.blocks);
  return {
    ...post,
    categoryId,
    tags,
    authorId: post.authorId ?? "producerhit-editorial",
    readingMinutes,
    wordCount,
    ogImageUrl: buildBlogOgImageUrl({ ...post, categoryId }),
  };
}

export function sortPostsNewest(posts: BlogPost[]): BlogPost[] {
  return posts.slice().sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export type BlogSearchParams = {
  q?: string;
  categoryId?: BlogCategoryId;
  tag?: string;
  page?: number;
  perPage?: number;
  /** Boost posts written for the visitor's UI locale (e.g. fr, ja). */
  uiLocale?: string;
};

export function searchBlogPosts(allPosts: BlogPost[], params: BlogSearchParams): {
  posts: EnrichedBlogPost[];
  total: number;
  page: number;
  totalPages: number;
  perPage: number;
} {
  const perPage = params.perPage ?? BLOG_POSTS_PER_PAGE;
  const page = Math.max(1, params.page ?? 1);
  const q = (params.q ?? "").trim().toLowerCase();

  let filtered = sortPostsNewest(allPosts).map(enrichBlogPost);

  if (params.categoryId) {
    filtered = filtered.filter((p) => p.categoryId === params.categoryId);
  }
  if (params.tag) {
    const tag = slugifyTag(params.tag);
    filtered = filtered.filter((p) => p.tags.includes(tag));
  }
  if (q) {
    filtered = filtered.filter((p) => {
      const hay = [p.title, p.description, p.keywords.join(" "), p.tags.join(" "), p.slug].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }

  if (params.uiLocale) {
    filtered = filtered.slice().sort((a, b) => {
      const boost = (p: EnrichedBlogPost) => (p.locale === params.uiLocale ? 1 : 0);
      const diff = boost(b) - boost(a);
      if (diff !== 0) return diff;
      return a.publishedAt < b.publishedAt ? 1 : -1;
    });
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * perPage;

  return {
    posts: filtered.slice(start, start + perPage),
    total,
    page: safePage,
    totalPages,
    perPage,
  };
}

export function getRelatedBlogPosts(post: EnrichedBlogPost, allPosts: BlogPost[], limit = 4): EnrichedBlogPost[] {
  const tagSet = new Set(post.tags);
  const kwSet = new Set(post.keywords.map((k) => k.toLowerCase()));

  return sortPostsNewest(allPosts)
    .map(enrichBlogPost)
    .filter((p) => p.slug !== post.slug)
    .map((p) => {
      let score = 0;
      if (p.categoryId === post.categoryId) score += 3;
      for (const t of p.tags) if (tagSet.has(t)) score += 2;
      for (const k of p.keywords) if (kwSet.has(k.toLowerCase())) score += 1;
      if (p.locale && post.locale && p.locale === post.locale) score += 1;
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.p);
}

export function getAllBlogTags(allPosts: BlogPost[]): { slug: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const post of allPosts) {
    for (const tag of enrichBlogPost(post).tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([slug, count]) => ({ slug, count }))
    .sort((a, b) => b.count - a.count);
}

export function getBlogCategoryArchivePaths(): string[] {
  return BLOG_CATEGORIES.map((c) => `/blog/category/${c.slug}`);
}

export function getBlogTagArchivePaths(allPosts: BlogPost[]): string[] {
  return getAllBlogTags(allPosts).map((t) => `/blog/tag/${t.slug}`);
}

export function buildBlogArticleJsonLd(post: EnrichedBlogPost, author: { name: string; url: string }) {
  const url = `${ORIGIN}/blog/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    image: [post.ogImageUrl],
    datePublished: `${post.publishedAt}T08:00:00.000Z`,
    dateModified: `${post.updatedAt}T08:00:00.000Z`,
    author: { "@type": "Organization", name: author.name, url: author.url },
    publisher: {
      "@type": "Organization",
      name: "ProducerHit",
      url: ORIGIN,
      logo: { "@type": "ImageObject", url: `${ORIGIN}/icon-512.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    wordCount: post.wordCount,
    timeRequired: `PT${post.readingMinutes}M`,
    keywords: post.keywords.join(", "),
    articleSection: post.categoryId,
    inLanguage: post.locale ?? "en",
  };
}
