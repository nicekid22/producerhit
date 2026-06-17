import type { DropdownOption } from "@/components/ui/Dropdown";

import type { AppLocale } from "@/i18n/config";
export type BeatAmbianceEntry = {
  value: string;
  labelEn: string;
  labelFr: string;
  groupEn: string;
  groupFr: string;
  /** Tags ACE Step — vocabulaire production, pas de prose générique. */
  acePrompt: string;
};

export const BEAT_AMBIANCE_CATALOG: BeatAmbianceEntry[] = [
  {
    value: "Smooth",
    labelEn: "Smooth",
    labelFr: "Smooth",
    groupEn: "Essentials",
    groupFr: "Essentiel",
    acePrompt: "smooth silky groove, relaxed pocket, effortless flow, polished low-end, soft transients",
  },
  {
    value: "Dark",
    labelEn: "Dark",
    labelFr: "Sombre",
    groupEn: "Essentials",
    groupFr: "Essentiel",
    acePrompt: "dark brooding atmosphere, minor tonality, tense harmonic color, shadowy low-mids, ominous space",
  },
  {
    value: "Melancholic",
    labelEn: "Melancholic",
    labelFr: "Mélancolique",
    groupEn: "Essentials",
    groupFr: "Essentiel",
    acePrompt: "melancholic emotional tone, bittersweet longing, vulnerable melodic contour, rainy introspection",
  },
  {
    value: "Euphoric",
    labelEn: "Euphoric",
    labelFr: "Euphorique",
    groupEn: "Essentials",
    groupFr: "Essentiel",
    acePrompt: "euphoric uplifting lift, triumphant harmonic rise, bright emotional peak, festival-ready energy",
  },
  {
    value: "Aggressive",
    labelEn: "Aggressive",
    labelFr: "Agressif",
    groupEn: "Essentials",
    groupFr: "Essentiel",
    acePrompt: "aggressive intense energy, hard-hitting transients, confrontational drum impact, raw power",
  },
  {
    value: "Dreamy",
    labelEn: "Dreamy",
    labelFr: "Onirique",
    groupEn: "Essentials",
    groupFr: "Essentiel",
    acePrompt: "dreamy atmospheric haze, ethereal floating pads, wide reverb wash, soft surreal texture",
  },
  {
    value: "Hypnotic",
    labelEn: "Hypnotic",
    labelFr: "Hypnotique",
    groupEn: "Essentials",
    groupFr: "Essentiel",
    acePrompt: "hypnotic repetitive motif, trance-like cyclic groove, mesmerizing minimal variation, locked pocket",
  },
  {
    value: "Chill",
    labelEn: "Chill",
    labelFr: "Chill",
    groupEn: "Energy & Mood",
    groupFr: "Énergie & humeur",
    acePrompt: "chill relaxed mood, laid-back swing, easy head-nod groove, soft dynamics, unhurried pocket",
  },
  {
    value: "Hype",
    labelEn: "Hype",
    labelFr: "Hype",
    groupEn: "Energy & Mood",
    groupFr: "Énergie & humeur",
    acePrompt: "hype high-energy mood, crowd-ready adrenaline, explosive drum accents, peak-time excitement",
  },
  {
    value: "Confident",
    labelEn: "Confident",
    labelFr: "Confiant",
    groupEn: "Energy & Mood",
    groupFr: "Énergie & humeur",
    acePrompt: "confident bold swagger, self-assured groove, assertive bass presence, clean punchy mix",
  },
  {
    value: "Romantic",
    labelEn: "Romantic",
    labelFr: "Romantique",
    groupEn: "Energy & Mood",
    groupFr: "Énergie & humeur",
    acePrompt: "romantic intimate mood, sensual warm chords, close-mic softness, tender late-night glow",
  },
  {
    value: "Nostalgic",
    labelEn: "Nostalgic",
    labelFr: "Nostalgique",
    groupEn: "Energy & Mood",
    groupFr: "Énergie & humeur",
    acePrompt: "nostalgic bittersweet mood, throwback warmth, vintage tape color, memory-laced melody",
  },
  {
    value: "Triumphant",
    labelEn: "Triumphant",
    labelFr: "Triomphant",
    groupEn: "Energy & Mood",
    groupFr: "Énergie & humeur",
    acePrompt: "triumphant victory arc, rising chord lift, anthemic peak moment, celebratory wide stereo",
  },
  {
    value: "Savage",
    labelEn: "Savage",
    labelFr: "Sauvage",
    groupEn: "Energy & Mood",
    groupFr: "Énergie & humeur",
    acePrompt: "savage relentless energy, distorted low-end grit, violent drum transients, menacing forward drive",
  },
  {
    value: "Cinematic",
    labelEn: "Cinematic",
    labelFr: "Cinématique",
    groupEn: "Atmosphere",
    groupFr: "Atmosphère",
    acePrompt: "cinematic wide atmosphere, orchestral hybrid hits, tension build arcs, trailer-scale dynamics, epic spatial depth",
  },
  {
    value: "Noir",
    labelEn: "Noir",
    labelFr: "Noir",
    groupEn: "Atmosphere",
    groupFr: "Atmosphère",
    acePrompt: "noir night-city mood, smoky jazz-influenced harmony, rain-soaked tension, muted trumpet or Rhodes space",
  },
  {
    value: "Mysterious",
    labelEn: "Mysterious",
    labelFr: "Mystérieux",
    groupEn: "Atmosphere",
    groupFr: "Atmosphère",
    acePrompt: "mysterious unresolved harmony, lurking sub-bass, suspense motifs, hidden unease, slow reveal texture",
  },
  {
    value: "Frozen",
    labelEn: "Frozen",
    labelFr: "Glacial",
    groupEn: "Atmosphere",
    groupFr: "Atmosphère",
    acePrompt: "frozen sterile atmosphere, icy bright pads, sparse minimal arrangement, emotional distance, cold high-end",
  },
  {
    value: "Underground",
    labelEn: "Underground",
    labelFr: "Underground",
    groupEn: "Atmosphere",
    groupFr: "Atmosphère",
    acePrompt: "underground basement rawness, DIY distorted texture, sub-heavy darkness, unpolished club edge",
  },
  {
    value: "Sunset",
    labelEn: "Sunset",
    labelFr: "Sunset",
    groupEn: "Atmosphere",
    groupFr: "Atmosphère",
    acePrompt: "sunset golden-hour warmth, mellow fading light, nostalgic summer groove, soft amber harmonic glow",
  },
  {
    value: "Neon",
    labelEn: "Neon",
    labelFr: "Néon",
    groupEn: "Texture & Color",
    groupFr: "Texture & couleur",
    acePrompt: "neon synthwave glow, retro arpeggiated sequences, 80s city-night palette, analog warm saturation",
  },
  {
    value: "Warm",
    labelEn: "Warm",
    labelFr: "Chaleureux",
    groupEn: "Texture & Color",
    groupFr: "Texture & couleur",
    acePrompt: "warm analog tone, tape-saturated transients, cozy intimate mix, round low-mids, human feel",
  },
  {
    value: "Gritty",
    labelEn: "Gritty",
    labelFr: "Gritty",
    groupEn: "Texture & Color",
    groupFr: "Texture & couleur",
    acePrompt: "gritty dusty texture, saturated drum crunch, lo-fi harmonic dirt, street-level rawness",
  },
  {
    value: "Luxury",
    labelEn: "Luxury",
    labelFr: "Luxe",
    groupEn: "Texture & Color",
    groupFr: "Texture & couleur",
    acePrompt: "luxury premium polish, sleek expensive transients, designer groove, high-end clean mix, refined spacing",
  },
  {
    value: "Playful",
    labelEn: "Playful",
    labelFr: "Joueur",
    groupEn: "Texture & Color",
    groupFr: "Texture & couleur",
    acePrompt: "playful bouncy rhythm, quirky staccato synths, lighthearted melodic bounce, bright rhythmic surprise",
  },
  {
    value: "Detached",
    labelEn: "Detached",
    labelFr: "Détaché",
    groupEn: "Texture & Color",
    groupFr: "Texture & couleur",
    acePrompt: "detached emotionally cold tone, sparse arrangement, numb aesthetic space, autotune-friendly emptiness",
  },
  {
    value: "Rave",
    labelEn: "Rave",
    labelFr: "Rave",
    groupEn: "Texture & Color",
    groupFr: "Texture & couleur",
    acePrompt: "rave warehouse energy, hoover stab accents, rolling break pressure, 90s-00s ecstasy lift, sweaty club intensity",
  },
];

export function buildBeatAmbianceMoodMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const entry of BEAT_AMBIANCE_CATALOG) {
    map[entry.value] = entry.acePrompt;
  }
  map.Happy = "happy uplifting mood, bright melodic feel, positive sunshine energy";
  map.Sad = "sad melancholic mood, vulnerable emotional weight, fragile beauty";
  return map;
}

export function beatAmbianceDropdownOptions(locale: AppLocale): DropdownOption[] {
  const fr = locale === "fr";
  return BEAT_AMBIANCE_CATALOG.map((entry) => ({
    value: entry.value,
    label: fr ? entry.labelFr : entry.labelEn,
    group: fr ? entry.groupFr : entry.groupEn,
  }));
}

export const DEFAULT_BEAT_AMBIANCE = "Smooth";
