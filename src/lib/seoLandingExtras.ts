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

const PACKS: Record<SeoPageCategory, CategoryPack> = {
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
    blogSlugs: ["generate-beats-online-free-guide", "ai-beat-generator-better-results", "ai-song-generator-by-genre-hub-2026"],
    comparePairs: [
      { pathEn: "/suno-alternatives", pathFr: "/alternatives-suno", labelEn: "Suno alternatives", labelFr: "Alternatives Suno" },
      { pathEn: "/udio-alternatives", pathFr: "/alternatives-udio", labelEn: "Udio alternatives", labelFr: "Alternatives Udio" },
    ],
  },
  song: {
    useCasesEn: ["Full songs with your lyrics", "Demo vocals before studio", "TikTok hooks with structure"],
    useCasesFr: ["Chansons complètes avec tes paroles", "Démos voix avant studio", "Hooks TikTok structurés"],
    workflowEn: [
      { step: "Song Mode", detail: "Vocals on — Beat mode off." },
      { step: "Genre précis", detail: "640+ genres lock the instrumental." },
      { step: "Manual or AI lyrics", detail: "Paste text — genre still applies." },
      { step: "Versions ×2 + seed", detail: "Pick chorus, iterate verse." },
    ],
    workflowFr: [
      { step: "Song Mode", detail: "Voix activées — pas Beat mode." },
      { step: "Genre précis", detail: "640+ genres verrouillent l'instrumental." },
      { step: "Paroles manuelles ou IA", detail: "Colle le texte — le genre s'applique." },
      { step: "Versions ×2 + seed", detail: "Choisis le refrain, itère couplet." },
    ],
    blogSlugs: ["ai-song-generator-guide-2026", "producerhit-vs-suno-udio-advantages-2026", "ai-song-generator-by-genre-hub-2026"],
    comparePairs: [
      { pathEn: "/ai-song-generator-alternatives", pathFr: "/alternatives-generateur-chanson-ia", labelEn: "Song AI alternatives", labelFr: "Alternatives chanson IA" },
      { pathEn: "/producerhit-vs-suno", pathFr: "/producteurhit-vs-suno", labelEn: "ProducerHit vs Suno", labelFr: "ProducerHit vs Suno" },
    ],
  },
  latin: {
    useCasesEn: ["Reggaeton & perreo content", "Bachata dance TikTok", "Regional Mexican storytelling"],
    useCasesFr: ["Contenu reggaeton & perreo", "TikTok danse bachata", "Storytelling regional Mexican"],
    workflowEn: [
      { step: "Genre précis", detail: "Bachata, Reggaeton, Salsa — not generic Latin." },
      { step: "Spanish/Portuguese lyrics", detail: "Manual lyrics + language detect." },
      { step: "BPM in prompt", detail: "Bachata ~130, Reggaeton ~92, Salsa ~180." },
      { step: "Link from Latin hub", detail: "Internal SEO mesh boosts all Latin URLs." },
    ],
    workflowFr: [
      { step: "Genre précis", detail: "Bachata, Reggaeton, Salsa — pas Latin générique." },
      { step: "Paroles ES/PT", detail: "Paroles manuelles + détection langue." },
      { step: "BPM dans le prompt", detail: "Bachata ~130, Reggaeton ~92, Salsa ~180." },
      { step: "Hub Latin", detail: "Maillage interne booste toutes les URLs Latin." },
    ],
    blogSlugs: ["ai-bachata-song-generator-guide", "ai-reggaeton-dembow-generator-guide", "producerhit-vs-suno-udio-advantages-2026"],
    comparePairs: [
      { pathEn: "/latin-music-generator", pathFr: "/generateur-musique-latine-ia", labelEn: "Latin hub", labelFr: "Hub Latin" },
      { pathEn: "/ai-song-generator-by-genre", pathFr: "/generateur-chanson-ia-par-genre", labelEn: "All genres hub", labelFr: "Hub tous genres" },
    ],
  },
  country: {
    useCasesEn: ["AI country song demos", "Nashville-style hooks", "Acoustic social content"],
    useCasesFr: ["Démos chanson country IA", "Hooks style Nashville", "Contenu social acoustique"],
    workflowEn: [
      { step: "Contemporary Country", detail: "Or Country Pop / Outlaw / Bluegrass." },
      { step: "English lyrics", detail: "Storytelling verse + chorus." },
      { step: "Song Mode", detail: "Full vocal song — fastest growing US genre." },
      { step: "Target keyword", detail: "AI generated country song (+6800% YoY)." },
    ],
    workflowFr: [
      { step: "Contemporary Country", detail: "Ou Country Pop / Outlaw / Bluegrass." },
      { step: "Paroles anglaises", detail: "Couplet storytelling + refrain." },
      { step: "Song Mode", detail: "Chanson vocale — genre US en forte croissance." },
      { step: "Mot-clé cible", detail: "AI generated country song (+6800% YoY)." },
    ],
    blogSlugs: ["ai-generated-country-song-guide-2026", "ai-song-generator-by-genre-hub-2026", "producerhit-vs-suno-udio-advantages-2026"],
    comparePairs: [
      { pathEn: "/ai-generated-country-song", pathFr: "/chanson-country-ia", labelEn: "Country song AI", labelFr: "Chanson country IA" },
      { pathEn: "/suno-alternatives", pathFr: "/alternatives-suno", labelEn: "Suno alternatives", labelFr: "Alternatives Suno" },
    ],
  },
  hub: {
    useCasesEn: ["SEO landing clusters", "Genre discovery", "Internal link equity"],
    useCasesFr: ["Clusters landing SEO", "Découverte genres", "Link equity interne"],
    workflowEn: [
      { step: "Pick sub-page", detail: "Each genre has dedicated URL." },
      { step: "Same studio", detail: "One account — all genres." },
      { step: "Cross-link", detail: "Hub → genre → blog → community." },
      { step: "680+ catalog", detail: "Beat competitors' 5–8 genre lists." },
    ],
    workflowFr: [
      { step: "Choisir sous-page", detail: "Chaque genre a son URL dédiée." },
      { step: "Même studio", detail: "Un compte — tous les genres." },
      { step: "Cross-link", detail: "Hub → genre → blog → communauté." },
      { step: "Catalogue 680+", detail: "Bat les listes 5–8 genres des concurrents." },
    ],
    blogSlugs: ["latin-music-generator-hub-guide-2026", "asia-music-generator-hub-guide-2026", "producerhit-vs-suno-udio-advantages-2026"],
    comparePairs: [
      { pathEn: "/producerhit-vs-suno", pathFr: "/producteurhit-vs-suno", labelEn: "ProducerHit vs Suno", labelFr: "ProducerHit vs Suno" },
      { pathEn: "/ai-music-generator-comparison-2026", pathFr: "/comparatif-generateur-musique-ia-2026", labelEn: "AI comparison 2026", labelFr: "Comparatif IA 2026" },
    ],
  },
  asia: {
    useCasesEn: ["K-Pop demo hooks", "Anime AMV beds", "Bollywood content creators"],
    useCasesFr: ["Hooks démo K-Pop", "Fonds AMV anime", "Créateurs Bollywood"],
    workflowEn: [
      { step: "Genre précis", detail: "K-Pop Idol, J-Pop, Anison, City Pop — not generic Asian." },
      { step: "Manual lyrics", detail: "Korean, Japanese, Hindi — auto language detect." },
      { step: "Versions ×2", detail: "Pick idol chorus, seed-lock verse." },
      { step: "Asia hub cross-link", detail: "Internal SEO mesh for K-Pop & J-Pop clusters." },
    ],
    workflowFr: [
      { step: "Genre précis", detail: "K-Pop Idol, J-Pop, Anison, City Pop — pas Asie générique." },
      { step: "Paroles manuelles", detail: "Coréen, japonais, hindi — détection auto." },
      { step: "Versions ×2", detail: "Choisis refrain idol, seed-lock couplet." },
      { step: "Hub Asie", detail: "Maillage SEO clusters K-Pop & J-Pop." },
    ],
    blogSlugs: ["k-pop-ai-generator-guide-2026", "asia-music-generator-hub-guide-2026", "producerhit-vs-suno-udio-advantages-2026"],
    comparePairs: [
      { pathEn: "/asia-music-generator", pathFr: "/generateur-musique-asie-ia", labelEn: "Asia hub", labelFr: "Hub Asie" },
      { pathEn: "/producerhit-vs-suno", pathFr: "/producteurhit-vs-suno", labelEn: "vs Suno", labelFr: "vs Suno" },
    ],
  },
  "middle-east": {
    useCasesEn: ["Khaleeji wedding content", "Mahraganat TikTok", "Arabic pop demos"],
    useCasesFr: ["Contenu mariage khaleeji", "TikTok mahraganat", "Démos pop arabe"],
    workflowEn: [
      { step: "Genre précis", detail: "Khaleeji, Arabic Pop, Mahraganat, Dabke — separate ACE prompts." },
      { step: "Arabic lyrics", detail: "Manual lyrics + Genre précis for darbuka/oud groove." },
      { step: "BPM guide", detail: "Khaleeji ~98, Mahraganat ~128, Dabke ~120." },
      { step: "ME hub", detail: "13+ genres vs one « Middle Eastern » slider." },
    ],
    workflowFr: [
      { step: "Genre précis", detail: "Khaleeji, Arabic Pop, Mahraganat, Dabke — prompts ACE séparés." },
      { step: "Paroles arabes", detail: "Paroles manuelles + Genre précis pour groove darbuka/oud." },
      { step: "Guide BPM", detail: "Khaleeji ~98, Mahraganat ~128, Dabke ~120." },
      { step: "Hub MO", detail: "13+ genres vs un slider « Middle Eastern »." },
    ],
    blogSlugs: ["middle-east-khaleeji-arabic-pop-guide-2026", "producerhit-vs-suno-udio-advantages-2026", "asia-music-generator-hub-guide-2026"],
    comparePairs: [
      { pathEn: "/middle-east-music-generator", pathFr: "/generateur-musique-moyen-orient-ia", labelEn: "Middle East hub", labelFr: "Hub Moyen-Orient" },
      { pathEn: "/producerhit-vs-udio", pathFr: "/producteurhit-vs-udio", labelEn: "vs Udio", labelFr: "vs Udio" },
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
  "ai-bachata-song-generator-guide": { labelEn: "Bachata AI guide", labelFr: "Guide bachata IA" },
  "ai-reggaeton-dembow-generator-guide": { labelEn: "Reggaeton & dembow", labelFr: "Reggaeton & dembow" },
  "ai-generated-country-song-guide-2026": { labelEn: "AI country song", labelFr: "Chanson country IA" },
  "latin-music-generator-hub-guide-2026": { labelEn: "Latin hub guide", labelFr: "Guide hub Latin" },
  "ai-song-generator-by-genre-hub-2026": { labelEn: "Song by genre hub", labelFr: "Hub chanson par genre" },
  "phonk-drift-memphis-brazilian-guide-2026": { labelEn: "Phonk complete guide", labelFr: "Guide phonk complet" },
  "ai-worship-song-generator-guide-2026": { labelEn: "Worship AI guide", labelFr: "Guide louange IA" },
  "ai-salsa-generator-guide-2026": { labelEn: "Salsa AI guide", labelFr: "Guide salsa IA" },
  "kizomba-zouk-ai-music-guide-2026": { labelEn: "Kizomba & zouk", labelFr: "Kizomba & zouk" },
  "corridos-regional-mexican-ai-guide-2026": { labelEn: "Corridos guide", labelFr: "Guide corridos" },
  "cumbia-generator-guide-2026": { labelEn: "Cumbia generator", labelFr: "Générateur cumbia" },
  "asia-music-generator-hub-guide-2026": { labelEn: "Asia hub guide", labelFr: "Guide hub Asie" },
  "middle-east-khaleeji-arabic-pop-guide-2026": { labelEn: "Middle East guide", labelFr: "Guide Moyen-Orient" },
  "k-pop-ai-generator-guide-2026": { labelEn: "K-Pop AI guide", labelFr: "Guide K-Pop IA" },
  "producerhit-vs-suno-udio-advantages-2026": { labelEn: "vs Suno & Udio 2026", labelFr: "vs Suno & Udio 2026" },
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
