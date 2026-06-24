import type { AppLocale } from "@/i18n/config";
import { isSongLoop } from "@/lib/vocalLanguages";
import { parseStemsUrl } from "@/lib/publicLoops";
import type { Loop } from "@/types/loop";

export type PublicLoopSpec = {
  label: string;
  value: string;
};

export type PublicLoopFaqItem = {
  q: string;
  a: string;
};

export type PublicLoopEnrichment = {
  lyrics: string | null;
  isSong: boolean;
  aboutParagraph: string;
  specs: PublicLoopSpec[];
  extraFaq: PublicLoopFaqItem[];
  shareText: string;
};

function pickVariant<T>(seed: string, variants: T[]): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return variants[h % variants.length]!;
}

export function extractPublicLoopLyrics(stemsUrl: unknown): string | null {
  const stems = parseStemsUrl(stemsUrl);
  const ace = stems?.ace && typeof stems.ace === "object" ? (stems.ace as Record<string, unknown>) : null;
  const raw = typeof ace?.lyrics === "string" ? ace.lyrics.trim() : "";
  if (!raw || raw === "[Instrumental]" || /^instrumental$/i.test(raw)) return null;
  return raw;
}

type RowLike = {
  id: string;
  name: string;
  genre: string;
  mood: string;
  bpm: number;
  key: string;
  scale: string;
  loop_length: string;
  energy_level: string;
  influence: string;
  prompt: string;
  stems_url?: unknown;
};

export function buildPublicLoopEnrichment(row: RowLike, locale: AppLocale): PublicLoopEnrichment {
  const isFr = locale === "fr";
  const lyrics = extractPublicLoopLyrics(row.stems_url);
  const pseudoLoop = {
    id: row.id,
    name: row.name,
    genre: row.genre,
    mood: row.mood,
    bpm: row.bpm,
    prompt: row.prompt,
    details: lyrics ? { lyrics } : null,
    stemsUrl: parseStemsUrl(row.stems_url),
  } as Loop;
  const isSong = isSongLoop(pseudoLoop);

  const genre = row.genre?.trim() || (isFr ? "Auto" : "Auto");
  const mood = row.mood?.trim();
  const bpm = row.bpm > 0 ? `${row.bpm} BPM` : isFr ? "BPM auto" : "Auto BPM";
  const keyScale = [row.key, row.scale].filter(Boolean).join(" ").trim();

  const specs: PublicLoopSpec[] = [
    { label: isFr ? "Genre" : "Genre", value: genre },
    { label: isFr ? "Tempo" : "Tempo", value: bpm },
  ];
  if (mood) specs.push({ label: isFr ? "Ambiance" : "Mood", value: mood });
  if (keyScale) specs.push({ label: isFr ? "Tonalité" : "Key", value: keyScale });
  if (row.loop_length) specs.push({ label: isFr ? "Structure" : "Length", value: row.loop_length });
  if (row.energy_level) specs.push({ label: isFr ? "Énergie" : "Energy", value: row.energy_level });
  specs.push({
    label: isFr ? "Type" : "Type",
    value: isSong ? (isFr ? "Chanson IA" : "AI song") : isFr ? "Type beat / instrumental" : "Type beat / instrumental",
  });

  const aboutVariantsFr = isSong
    ? [
        `« ${row.name} » est une chanson IA publique ${genre}${mood ? ` — ambiance ${mood}` : ""}. Écoute-la, remixe la vibe ou génère ta propre version avec le même prompt.`,
        `Track communautaire ${genre} à ${bpm}${mood ? `, mood ${mood}` : ""}. Parfait pour s'inspirer avant de créer ta propre chanson dans le studio ProducerHit.`,
        `Exemple public de musique générée par IA : ${row.name}. Partage cette page ou repars du style pour ton prochain single.`,
      ]
    : [
        `« ${row.name} » est un type beat IA public en ${genre}${mood ? ` (${mood})` : ""}. Écoute, remixe ou exporte ton propre beat avec les mêmes réglages.`,
        `Beat communautaire ${genre} · ${bpm}. Idéal pour tester le workflow ProducerHit avant de publier le tien.`,
        `Instrumental IA partagé par la communauté — remixe cette vibe ou ouvre le studio pour un beat original.`,
      ];

  const aboutVariantsEn = isSong
    ? [
        `"${row.name}" is a public AI song in ${genre}${mood ? ` — ${mood} mood` : ""}. Listen, remix the vibe, or generate your own take with the same prompt.`,
        `Community ${genre} track at ${bpm}${mood ? `, ${mood} feel` : ""}. Great inspiration before you ship your own song in ProducerHit.`,
        `Public AI music example: ${row.name}. Share this page or restart from the same style for your next single.`,
      ]
    : [
        `"${row.name}" is a public AI type beat in ${genre}${mood ? ` (${mood})` : ""}. Listen, remix, or build your own beat with similar settings.`,
        `Community ${genre} beat · ${bpm}. Perfect to try ProducerHit before you publish yours.`,
        `Shared AI instrumental — remix this vibe or open the studio for something original.`,
      ];

  const aboutParagraph = pickVariant(row.id, isFr ? aboutVariantsFr : aboutVariantsEn);

  const extraFaq: PublicLoopFaqItem[] = [];

  if (lyrics) {
    extraFaq.push({
      q: isFr ? "Où sont les paroles ?" : "Where are the lyrics?",
      a: isFr
        ? "Les paroles affichées proviennent de la génération Song Mode. Tu peux t'en inspirer ou coller tes propres textes dans le studio."
        : "Lyrics shown here come from Song Mode generation. Use them as inspiration or paste your own lyrics in the studio.",
    });
  } else if (isSong) {
    extraFaq.push({
      q: isFr ? "Pourquoi pas de paroles affichées ?" : "Why no lyrics shown?",
      a: isFr
        ? "Ce titre a été généré avec des paroles IA internes ou un instrumental vocal — le prompt producteur reste la référence principale."
        : "This track used internal AI lyrics or a vocal instrumental — the producer prompt is the main reference.",
    });
  }

  extraFaq.push({
    q: isFr ? `C'est quoi le genre « ${genre} » ici ?` : `What is the « ${genre} » genre here?`,
    a: isFr
      ? `Le tag ${genre} oriente le moteur IA ProducerHit. Tu peux le reprendre tel quel ou le combiner avec une ambiance (${mood || "mood libre"}) dans le studio.`
      : `The ${genre} tag steers the ProducerHit AI engine. Reuse it as-is or combine it with a mood (${mood || "any mood"}) in the studio.`,
  });

  extraFaq.push({
    q: isFr ? "Puis-je partager cette page ?" : "Can I share this page?",
    a: isFr
      ? "Oui — chaque track public a une URL unique indexable par Google. Utilise les boutons de partage ou copie le lien."
      : "Yes — every public track has a unique URL Google can index. Use the share buttons or copy the link.",
  });

  const shareText = isFr
    ? `Écoute « ${row.name} » — ${genre} IA sur ProducerHit`
    : `Listen to "${row.name}" — AI ${genre} on ProducerHit`;

  return { lyrics, isSong, aboutParagraph, specs, extraFaq, shareText };
}
