/** Snapshot agrégé depuis Supabase `loops` — regénérer via `npm run genre-stats:sync`. */

export type GenreStatRow = { genre: string; count: number; sharePct: number };

export type GenreStatsSnapshot = {
  generatedAt: string;
  totalLoops: number;
  publicLoops: number;
  topGenres: GenreStatRow[];
  insights: { en: string[]; fr: string[] };
};

export const GENRE_STATS_SNAPSHOT: GenreStatsSnapshot = {
  generatedAt: "2026-06-21",
  totalLoops: 3430,
  publicLoops: 2188,
  topGenres: [
    { genre: "90s R&B", count: 280, sharePct: 8.2 },
    { genre: "Auto (genre-detected)", count: 190, sharePct: 5.5 },
    { genre: "Melodic trap", count: 152, sharePct: 4.4 },
    { genre: "Trapsoul", count: 127, sharePct: 3.7 },
    { genre: "Dark trap", count: 94, sharePct: 2.7 },
    { genre: "Lo-fi R&B", count: 82, sharePct: 2.4 },
    { genre: "Old school hip-hop", count: 74, sharePct: 2.2 },
    { genre: "UK garage", count: 61, sharePct: 1.8 },
    { genre: "Lo-fi hip-hop", count: 57, sharePct: 1.7 },
    { genre: "Drill", count: 54, sharePct: 1.6 },
    { genre: "Contemporary rap", count: 52, sharePct: 1.5 },
    { genre: "Reggaeton", count: 40, sharePct: 1.2 },
    { genre: "Cloud rap", count: 40, sharePct: 1.2 },
    { genre: "Funk", count: 37, sharePct: 1.1 },
    { genre: "Pop", count: 36, sharePct: 1.0 },
    { genre: "Afrotrap", count: 36, sharePct: 1.0 },
    { genre: "Afro R&B", count: 35, sharePct: 1.0 },
    { genre: "French pop", count: 34, sharePct: 1.0 },
    { genre: "Amapiano", count: 32, sharePct: 0.9 },
    { genre: "Soul", count: 30, sharePct: 0.9 },
  ],
  insights: {
    en: [
      "R&B and trap-adjacent genres (90s R&B, melodic trap, trapsoul) lead combined share — vocal-ready beats dominate.",
      "UK garage and drill show strong niche demand outside US trap defaults.",
      "Afro genres (afrotrap, amapiano, afro R&B) together exceed 3% — growing long-tail for AI prompts.",
    ],
    fr: [
      "Le R&B et le trap mélodique dominent — les beats prêts pour voix restent la demande n°1.",
      "UK garage et drill : niches actives au-delà du trap US par défaut.",
      "Genres afro (afrotrap, amapiano) : long-tail en croissance pour les prompts IA.",
    ],
  },
};
