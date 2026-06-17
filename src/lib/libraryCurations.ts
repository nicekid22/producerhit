import type { ElementKind } from "@/components/icons/ElementIcons";
import type { Loop } from "@/types/loop";
import { genreCoverGradient } from "@/lib/genreCoverStyle";

export type LibraryCollection = {
  id: string;
  kind: "playlist" | "mixtape";
  element: ElementKind;
  titleFr: string;
  titleEn: string;
  subtitleFr: string;
  subtitleEn: string;
  loopIds: string[];
  coverStyle: string;
  trackCount: number;
};

function sortRecent(loops: Loop[]): Loop[] {
  return loops.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function buildLibraryCollections(loops: Loop[]): LibraryCollection[] {
  if (!loops.length) return [];

  const recent = sortRecent(loops);
  const saved = recent.filter((l) => l.isSaved);
  const today = recent.filter((l) => isToday(l.createdAt));
  const collections: LibraryCollection[] = [];

  if (saved.length) {
    collections.push({
      id: "playlist-favorites",
      kind: "playlist",
      element: "earth",
      titleFr: "Mes favoris",
      titleEn: "My favorites",
      subtitleFr: "Tes sons à revisiter",
      subtitleEn: "Tracks you love",
      loopIds: saved.slice(0, 24).map((l) => l.id),
      coverStyle: "linear-gradient(135deg, #8ec838 0%, #58a828 52%, #3d8820 100%)",
      trackCount: saved.length,
    });
  }

  collections.push({
    id: "playlist-recent",
    kind: "playlist",
    element: "water",
    titleFr: "Écoute récente",
    titleEn: "Recently played",
    subtitleFr: "Reprends où tu t'es arrêté",
    subtitleEn: "Pick up where you left off",
    loopIds: recent.slice(0, 20).map((l) => l.id),
    coverStyle: "linear-gradient(135deg, #b8e8ff 0%, #68b8f0 48%, #4898d8 100%)",
    trackCount: Math.min(recent.length, 20),
  });

  if (today.length >= 2) {
    collections.push({
      id: "playlist-today",
      kind: "playlist",
      element: "fire",
      titleFr: "Session du jour",
      titleEn: "Today's session",
      subtitleFr: "Créations d'aujourd'hui",
      subtitleEn: "Made today",
      loopIds: today.map((l) => l.id),
      coverStyle: "linear-gradient(135deg, #ffd8c8 0%, #ff8868 48%, #e85868 100%)",
      trackCount: today.length,
    });
  }

  const genreCounts = new Map<string, Loop[]>();
  for (const l of loops) {
    if (!l.genre) continue;
    const arr = genreCounts.get(l.genre) ?? [];
    arr.push(l);
    genreCounts.set(l.genre, arr);
  }

  const topGenres = Array.from(genreCounts.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 3);

  for (const [genre, genreLoops] of topGenres) {
    if (genreLoops.length < 2) continue;
    collections.push({
      id: `mixtape-genre-${genre.toLowerCase().replace(/\s+/g, "-")}`,
      kind: "mixtape",
      element: "air",
      titleFr: `Mix · ${genre}`,
      titleEn: `${genre} mix`,
      subtitleFr: "Mixtape auto — vibe homogène",
      subtitleEn: "Auto mixtape — same vibe",
      loopIds: sortRecent(genreLoops).slice(0, 16).map((l) => l.id),
      coverStyle: genreCoverGradient(genre),
      trackCount: genreLoops.length,
    });
  }

  const chill = loops.filter((l) => l.bpm <= 98).sort((a, b) => a.bpm - b.bpm);
  if (chill.length >= 3) {
    collections.push({
      id: "mixtape-chill",
      kind: "mixtape",
      element: "water",
      titleFr: "Deep Flow",
      titleEn: "Deep Flow",
      subtitleFr: "BPM lent · ambiance cozy",
      subtitleEn: "Slow BPM · cozy mood",
      loopIds: chill.slice(0, 14).map((l) => l.id),
      coverStyle: "linear-gradient(145deg, #c8f0ff 0%, #78c0f0 55%, #4898d8 100%)",
      trackCount: chill.length,
    });
  }

  const hype = loops.filter((l) => l.bpm >= 132).sort((a, b) => b.bpm - a.bpm);
  if (hype.length >= 3) {
    collections.push({
      id: "mixtape-hype",
      kind: "mixtape",
      element: "fire",
      titleFr: "Peak Energy",
      titleEn: "Peak Energy",
      subtitleFr: "High BPM · en feu",
      subtitleEn: "High BPM · on fire",
      loopIds: hype.slice(0, 14).map((l) => l.id),
      coverStyle: "linear-gradient(145deg, #ffe8d8 0%, #ff9878 45%, #e85868 100%)",
      trackCount: hype.length,
    });
  }

  const publicLoops = loops.filter((l) => l.isPublic);
  if (publicLoops.length >= 2) {
    collections.push({
      id: "playlist-public",
      kind: "playlist",
      element: "air",
      titleFr: "Partagés",
      titleEn: "Shared",
      subtitleFr: "Tes morceaux publics",
      subtitleEn: "Your public tracks",
      loopIds: sortRecent(publicLoops).slice(0, 16).map((l) => l.id),
      coverStyle: "linear-gradient(135deg, #ffd4e8 0%, #c8b8ff 42%, #a8d4ff 100%)",
      trackCount: publicLoops.length,
    });
  }

  return collections;
}

export function loopsForCollection(loops: Loop[], collectionId: string | null, collections: LibraryCollection[]): Loop[] {
  if (!collectionId) return loops;
  const col = collections.find((c) => c.id === collectionId);
  if (!col) return loops;
  return col.loopIds.map((id) => loops.find((l) => l.id === id)).filter((l): l is Loop => !!l);
}
