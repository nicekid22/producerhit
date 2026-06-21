import type { AppLocale } from "@/i18n/config";

export type Phase2PageSeo = {
  title: string;
  description: string;
  h1: string;
};

const GENRE_STATS: Record<"en" | "fr", Phase2PageSeo> = {
  en: {
    title: "AI Music Genre Stats 2026 — 3,400+ tracks analyzed | ProducerHit",
    description:
      "Original data: top genres generated on ProducerHit in 2026 — R&B, melodic trap, drill, afro & more. Based on 3,430 AI-generated tracks.",
    h1: "Top AI music genres on ProducerHit (2026)",
  },
  fr: {
    title: "Stats genres musique IA 2026 — 3 400+ morceaux | ProducerHit",
    description:
      "Données exclusives : genres les plus générés sur ProducerHit en 2026 — R&B, trap mélodique, drill, afro et plus. 3 430 morceaux analysés.",
    h1: "Top genres musique IA sur ProducerHit (2026)",
  },
};

function contentLocale(locale: AppLocale): "en" | "fr" {
  return locale === "fr" ? "fr" : "en";
}

export function getGenreStatsPageSeo(locale: AppLocale): Phase2PageSeo {
  return GENRE_STATS[contentLocale(locale)];
}

export function buildGenreStatsJsonLd(locale: AppLocale): Record<string, unknown> {
  const isFr = locale === "fr";
  return {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: isFr ? "Stats genres musique IA ProducerHit 2026" : "ProducerHit AI music genre stats 2026",
    description: isFr
      ? "Répartition des genres sur 3 430 morceaux générés par IA sur ProducerHit."
      : "Genre distribution across 3,430 AI-generated tracks on ProducerHit.",
    url: "https://www.producerhit.com/ai-music-genre-stats-2026",
    dateModified: "2026-06-21",
    creator: { "@type": "Organization", name: "ProducerHit", url: "https://www.producerhit.com" },
    variableMeasured: "music genre",
    measurementTechnique: "Aggregate SQL on production loops table",
  };
}
