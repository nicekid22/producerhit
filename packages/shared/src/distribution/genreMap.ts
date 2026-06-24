/** Fallback mapping ProducerHit genre → LabelGrid genre name (resolved to ID at submit time). */
export const PRODUCERHIT_TO_LABELGRID_GENRE: Record<string, string> = {
  Pop: "Pop",
  House: "House",
  "Dark Trap": "Hip Hop",
  "Melodic Trap": "Hip Hop",
  Drill: "Hip Hop",
  "Lo-Fi Hip-Hop": "Hip Hop",
  Trapsoul: "R&B",
  "Contemporary R&B": "R&B",
  Afrobeats: "Afrobeat",
  Reggaeton: "Latin",
  EDM: "Electronic",
  Techno: "Techno",
  "Drum and Bass": "Drum & Bass",
  Dubstep: "Dubstep",
  Rock: "Rock",
  Metal: "Metal",
  Jazz: "Jazz",
  Classical: "Classical",
  Country: "Country",
  Folk: "Folk",
  Ambient: "Ambient",
};

export function suggestLabelGridGenreName(producerHitGenre: string): string {
  const trimmed = producerHitGenre.trim();
  if (!trimmed) return "Electronic";
  return PRODUCERHIT_TO_LABELGRID_GENRE[trimmed] ?? "Electronic";
}
