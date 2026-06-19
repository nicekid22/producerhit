import type { AppLocale } from "@/i18n/config";
import {
  blogCategoryDescriptionI18n,
  blogCategoryLabelI18n,
} from "@/i18n/blogCategoryCatalog";
import type { BlogCategoryId } from "./types";

export type BlogCategory = {
  id: BlogCategoryId;
  slug: string;
  labelEn: string;
  labelFr: string;
  descriptionEn: string;
  descriptionFr: string;
};

export const BLOG_CATEGORIES: BlogCategory[] = [
  {
    id: "beat-generator",
    slug: "beat-generator",
    labelEn: "AI Beat Generator",
    labelFr: "Générateur beats IA",
    descriptionEn: "Prompts, templates, and tactics for AI beat generation.",
    descriptionFr: "Prompts, modèles et tactiques pour générer des beats IA.",
  },
  {
    id: "type-beat",
    slug: "type-beat",
    labelEn: "Type Beats",
    labelFr: "Type beats",
    descriptionEn: "Type beat workflows, BPM control, and producer-ready exports.",
    descriptionFr: "Workflows type beat, contrôle BPM et exports producteur.",
  },
  {
    id: "song-vocals",
    slug: "song-vocals",
    labelEn: "Songs & Vocals",
    labelFr: "Chansons & voix",
    descriptionEn: "Full songs, lyrics, and vocal AI music guides.",
    descriptionFr: "Chansons complètes, paroles et guides musique vocale IA.",
  },
  {
    id: "genre-guides",
    slug: "genre-guides",
    labelEn: "Genre Guides",
    labelFr: "Guides genre",
    descriptionEn: "Trap, drill, lo-fi, Latin, K-Pop, and regional genre prompts.",
    descriptionFr: "Trap, drill, lo-fi, Latin, K-Pop et prompts régionaux.",
  },
  {
    id: "comparisons",
    slug: "comparisons",
    labelEn: "Comparisons",
    labelFr: "Comparatifs",
    descriptionEn: "ProducerHit vs Suno, Udio, Beatoven, and alternatives.",
    descriptionFr: "ProducerHit vs Suno, Udio, Beatoven et alternatives.",
  },
  {
    id: "workflow",
    slug: "workflow",
    labelEn: "Workflow",
    labelFr: "Workflow",
    descriptionEn: "Seeds, variations, remix, and iteration systems.",
    descriptionFr: "Seeds, variations, remix et systèmes d'itération.",
  },
  {
    id: "monetization",
    slug: "monetization",
    labelEn: "Monetization",
    labelFr: "Monétisation",
    descriptionEn: "Commercial rights, YouTube, Spotify, beat sales, sync — free monetization academy for beatmakers, singers & AI artists.",
    descriptionFr: "Droits commerciaux, YouTube, Spotify, vente de beats, sync — académie gratuite beatmaker, chanteur & artiste IA.",
  },
  {
    id: "community",
    slug: "community",
    labelEn: "Community",
    labelFr: "Communauté",
    descriptionEn: "Community feed, trending beats, and remix culture.",
    descriptionFr: "Flux communautaire, beats trending et culture remix.",
  },
];

const byId = new Map(BLOG_CATEGORIES.map((c) => [c.id, c]));
const bySlug = new Map(BLOG_CATEGORIES.map((c) => [c.slug, c]));

export function getBlogCategory(id: BlogCategoryId): BlogCategory {
  return byId.get(id)!;
}

export function getBlogCategoryBySlug(slug: string): BlogCategory | null {
  return bySlug.get(slug) ?? null;
}

export function blogCategoryLabel(id: BlogCategoryId, locale: AppLocale): string {
  return blogCategoryLabelI18n(id, locale);
}

export function blogCategoryDescription(id: BlogCategoryId, locale: AppLocale): string {
  return blogCategoryDescriptionI18n(id, locale);
}
