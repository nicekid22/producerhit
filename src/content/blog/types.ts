import type { AppLocale } from "@/i18n/config";

export type BlogBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "callout"; variant: "tip" | "cta" | "note"; title?: string; text: string }
  | { type: "links"; items: { labelEn: string; labelFr: string; href: string }[] };

export type BlogCategoryId =
  | "beat-generator"
  | "type-beat"
  | "song-vocals"
  | "genre-guides"
  | "comparisons"
  | "workflow"
  | "monetization"
  | "community";

export type BlogAuthorId = "producerhit-team" | "producerhit-editorial";

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  publishedAt: string;
  updatedAt: string;
  blocks: BlogBlock[];
  /** Explicit category — inferred from slug/keywords when omitted */
  categoryId?: BlogCategoryId;
  /** URL-safe tag slugs, e.g. "trap", "suno-alternatives" */
  tags?: string[];
  authorId?: BlogAuthorId;
  /** Primary language for hreflang hints */
  locale?: AppLocale;
};

export type EnrichedBlogPost = BlogPost & {
  categoryId: BlogCategoryId;
  tags: string[];
  authorId: BlogAuthorId;
  readingMinutes: number;
  wordCount: number;
  ogImageUrl: string;
};
