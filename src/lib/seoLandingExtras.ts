import type { SeoPageCategory } from "@/lib/seoPages";

export type SeoLandingExtras = {
  useCases: string[];
  workflow: { step: string; detail: string }[];
  blogSlugs: { slug: string; labelEn: string; labelFr: string }[];
  comparePaths: { pathEn: string; pathFr: string; labelEn: string; labelFr: string }[];
};

type CategoryPack = {
  useCasesEn: string[];
  useCasesFr: string[];
  workflowEn: { step: string; detail: string }[];
  workflowFr: { step: string; detail: string }[];
  blogSlugs: string[];
  comparePairs: { pathEn: string; pathFr: string; labelEn: string; labelFr: string }[];
};

const PACKS: Record<Exclude<SeoPageCategory, "comparison">, CategoryPack> = {
  "music-ai": {
    useCasesEn: ["YouTube & Shorts beds", "Podcast intros without a composer", "Prototype ideas before studio"],
    useCasesFr: ["Fonds YouTube & Shorts", "Intros podcast sans compositeur", "Prototypes avant studio"],
    workflowEn: [
      { step: "Genre + mood + BPM", detail: "Short prompt (15–25 words) for cleaner transients." },
      { step: "Versions ×2", detail: "Pick groove over loudness." },
      { step: "Seed variation", detail: "Lock vibe, tweak bass or melody." },
      { step: "Export MP3/WAV", detail: "Free MP3; WAV on paid plans." },
    ],
    workflowFr: [
      { step: "Genre + mood + BPM", detail: "Prompt court (15–25 mots) pour des transitoires propres." },
      { step: "Versions ×2", detail: "Choisis le groove, pas le volume." },
      { step: "Variation seed", detail: "Garde la vibe, ajuste basse ou mélodie." },
      { step: "Export MP3/WAV", detail: "MP3 gratuit ; WAV sur plans payants." },
    ],
    blogSlugs: ["music-ai-generator-prompt-guide-2026", "ai-beat-generator-better-results", "type-beat-generator-ai-prompt-examples"],
    comparePairs: [
      { pathEn: "/suno-alternatives", pathFr: "/alternatives-suno", labelEn: "Suno alternatives", labelFr: "Alternatives Suno" },
      { pathEn: "/ai-music-generator-comparison-2026", pathFr: "/comparatif-generateur-musique-ia-2026", labelEn: "AI comparison 2026", labelFr: "Comparatif IA 2026" },
    ],
  },
  intent: {
    useCasesEn: ["Sleep & wellness apps", "Study / focus playlists", "Meditation & yoga creators"],
    useCasesFr: ["Apps sommeil & bien-être", "Playlists étude / focus", "Créateurs méditation & yoga"],
    workflowEn: [
      { step: "Instrumental-only", detail: 'Say "no vocals" and soft dynamics.' },
      { step: "Low BPM + warm timbres", detail: "Pads, piano — avoid sharp trap hats." },
      { step: "Loop-friendly", detail: "Short gens first, extend with same seed." },
      { step: "Test on phone", detail: "If harsh on phone speakers, soften prompt." },
    ],
    workflowFr: [
      { step: "Instrumental uniquement", detail: "« Sans voix », dynamique douce." },
      { step: "BPM bas + timbres chauds", detail: "Pads, piano — évite les hats trap." },
      { step: "Boucle fluide", detail: "Générations courtes, même seed." },
      { step: "Test sur téléphone", detail: "Si c’est agressif sur mobile, adoucis le prompt." },
    ],
    blogSlugs: ["ai-sleep-study-music-generator-guide", "generateur-musique-ia-sommeil-etude-fr", "music-ai-generator-prompt-guide-2026"],
    comparePairs: [
      { pathEn: "/mubert-alternatives", pathFr: "/alternatives-mubert", labelEn: "Mubert alternatives", labelFr: "Alternatives Mubert" },
      { pathEn: "/spotify-ready-ai-music", pathFr: "/musique-ia-spotify-ready", labelEn: "Spotify-ready AI", labelFr: "Spotify-ready IA" },
    ],
  },
  genre: {
    useCasesEn: ["Type beat previews", "Beat lease demos", "Freestyle & content"],
    useCasesFr: ["Previews type beat", "Démos lease beats", "Freestyle & contenu"],
    workflowEn: [
      { step: "Subgenre + era", detail: "Trap dark, drill 808s, UKG skippy — be specific." },
      { step: "Versions ×2", detail: "Lock pocket before long takes." },
      { step: "Seed variations", detail: "Keep drums, swap melody/bass." },
      { step: "Public loop", detail: "Share to community for feedback." },
    ],
    workflowFr: [
      { step: "Sous-genre + époque", detail: "Trap dark, drill 808, UKG skippy — sois précis." },
      { step: "Versions ×2", detail: "Verrouille le pocket avant les longues prises." },
      { step: "Variations seed", detail: "Garde les drums, change mélodie/basse." },
      { step: "Loop public", detail: "Partage en communauté pour feedback." },
    ],
    blogSlugs: ["type-beat-generator-ai-prompt-examples", "drum-and-bass-beat-generator-prompt-template", "hyperpop-hiphop-rnb-prompts"],
    comparePairs: [
      { pathEn: "/best-ai-beat-generator-for-producers", pathFr: "/meilleur-generateur-beats-ia-producteurs", labelEn: "Best beat AI", labelFr: "Meilleur beats IA" },
      { pathEn: "/producerhit-vs-suno", pathFr: "/producteurhit-vs-suno", labelEn: "ProducerHit vs Suno", labelFr: "ProducerHit vs Suno" },
    ],
  },
  beat: {
    useCasesEn: ["Lo-fi study channels", "Phonk short-form", "Stream background"],
    useCasesFr: ["Chaînes lo-fi étude", "Phonk short-form", "Fond de stream"],
    workflowEn: [
      { step: "Tempo + drum feel", detail: "Lo-fi: dusty swing; phonk: 808 + cowbell." },
      { step: "Two versions", detail: "Let the model suggest texture." },
      { step: "Variation loop", detail: "Same seed until seamless." },
      { step: "Tag BPM/key", detail: "Rename for your library." },
    ],
    workflowFr: [
      { step: "Tempo + feel drums", detail: "Lo-fi : swing dusty ; phonk : 808 + cowbell." },
      { step: "Deux versions", detail: "Laisse le modèle proposer la texture." },
      { step: "Boucle variation", detail: "Même seed jusqu’à seamless." },
      { step: "Tag BPM/tonalité", detail: "Renomme pour ta bibliothèque." },
    ],
    blogSlugs: ["type-beat-generator-ai-prompt-examples", "generate-beats-online-free-guide", "seed-variations-remix-workflow"],
    comparePairs: [
      { pathEn: "/beatoven-alternatives", pathFr: "/alternatives-beatoven", labelEn: "Beatoven alternatives", labelFr: "Alternatives Beatoven" },
    ],
  },
  core: {
    useCasesEn: ["First beat in 30s", "Song demos with vocals", "Royalty-free for content"],
    useCasesFr: ["Premier beat en 30 s", "Démos chanson avec voix", "Royalty-free pour contenu"],
    workflowEn: [
      { step: "Type Beat or Song Mode", detail: "Instrumentals vs vocals." },
      { step: "Short + Versions ×2", detail: "Less credit burn." },
      { step: "Community + Remix", detail: "Remix public loops or upload audio." },
      { step: "Scale on pricing", detail: "WAV + more credits on Pro." },
    ],
    workflowFr: [
      { step: "Type Beat ou Song Mode", detail: "Instrumental vs voix." },
      { step: "Court + Versions ×2", detail: "Moins de crédits brûlés." },
      { step: "Communauté + Remix", detail: "Remix loops publics ou upload audio." },
      { step: "Upgrade tarifs", detail: "WAV + plus de crédits sur Pro." },
    ],
    blogSlugs: ["generate-beats-online-free-guide", "ai-beat-generator-better-results", "ai-music-generator-vs-agent"],
    comparePairs: [
      { pathEn: "/suno-alternatives", pathFr: "/alternatives-suno", labelEn: "Suno alternatives", labelFr: "Alternatives Suno" },
      { pathEn: "/udio-alternatives", pathFr: "/alternatives-udio", labelEn: "Udio alternatives", labelFr: "Alternatives Udio" },
    ],
  },
};

const BLOG_LABELS: Record<string, { labelEn: string; labelFr: string }> = {
  "music-ai-generator-prompt-guide-2026": { labelEn: "Music AI prompt guide", labelFr: "Guide prompts music AI" },
  "ai-sleep-study-music-generator-guide": { labelEn: "Sleep & study guide", labelFr: "Guide sommeil & étude" },
  "generateur-musique-ia-sommeil-etude-fr": { labelEn: "Sommeil & étude (FR)", labelFr: "Sommeil & étude (FR)" },
  "ai-beat-generator-better-results": { labelEn: "Better beat results", labelFr: "Meilleurs beats IA" },
  "type-beat-generator-ai-prompt-examples": { labelEn: "Type beat prompts", labelFr: "Prompts type beat" },
  "drum-and-bass-beat-generator-prompt-template": { labelEn: "DnB template", labelFr: "Template DnB" },
  "hyperpop-hiphop-rnb-prompts": { labelEn: "Hyperpop & R&B", labelFr: "Hyperpop & R&B" },
  "generate-beats-online-free-guide": { labelEn: "Free beats guide", labelFr: "Beats gratuits" },
  "seed-variations-remix-workflow": { labelEn: "Seed workflow", labelFr: "Workflow seed" },
  "ai-music-generator-vs-agent": { labelEn: "AI vs agent", labelFr: "IA vs agent" },
};

export function getSeoLandingExtras(category: SeoPageCategory | undefined, isFr: boolean): SeoLandingExtras | null {
  if (!category) return null;
  const pack = PACKS[category];
  if (!pack) return null;

  return {
    useCases: isFr ? pack.useCasesFr : pack.useCasesEn,
    workflow: isFr ? pack.workflowFr : pack.workflowEn,
    blogSlugs: pack.blogSlugs.map((slug) => ({
      slug,
      labelEn: BLOG_LABELS[slug]?.labelEn ?? slug,
      labelFr: BLOG_LABELS[slug]?.labelFr ?? slug,
    })),
    comparePaths: pack.comparePairs,
  };
}
