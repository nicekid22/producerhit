/** Base mood/influence maps — web registers full catalogs via extendedRegistry. */
export const BASE_MOOD_MAP: Record<string, string> = {
  Smooth: "smooth silky groove, relaxed pocket, effortless flow, polished low-end, soft transients",
  Dark: "dark brooding atmosphere, minor tonality, tense harmonic color, shadowy low-mids, ominous space",
  Melancholic: "melancholic emotional tone, bittersweet longing, vulnerable melodic contour, rainy introspection",
  Happy: "happy uplifting mood, bright melodic feel, positive sunshine energy",
  Sad: "sad melancholic mood, vulnerable emotional weight, fragile beauty",
  Aggressive: "aggressive hard-hitting energy, intense powerful, street edge",
  Medium: "balanced moderate energy, steady groove, controlled intensity",
};

export const BASE_INFLUENCE_MAP: Record<string, string> = {
  "No Influence": "",
  None: "",
};

export const ENERGY_MAP: Record<string, string> = {
  Chill: "relaxed laid-back vibe, smooth easy flow, no rush",
  Happy: "uplifting joyful energy, bright melodic feel, positive vibes",
  Sad: "sad emotional depth, vulnerable feel, raw emotion",
  Romantic: "romantic intimate atmosphere, sensual smooth vibe, love energy",
  Aggressive: "aggressive hard-hitting energy, intense powerful, street edge",
  Confident: "confident bold swagger, self-assured groove, effortless cool",
  Nostalgic: "nostalgic warm feeling, throwback emotion, bittersweet memory",
  Hype: "high energy hype, club ready, adrenaline rush, crowd energy",
  Medium: "balanced moderate energy, steady groove, controlled intensity",
  High: "high energy hype, club ready, adrenaline rush, crowd energy",
};

export const REVERB_MAP: Record<string, string> = {
  Dry: "dry close sound, minimal reverb",
  Subtle: "subtle room reverb, slight space",
  Medium: "medium reverb, warm spatial feel",
  Heavy: "heavy reverb, washed out, dreamy space",
};
