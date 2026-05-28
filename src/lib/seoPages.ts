export type SeoPageConfig = {
  path: string;
  slugKey: string;
  titleEn: string;
  titleFr: string;
  descriptionEn: string;
  descriptionFr: string;
  keywords: string[];
  h1En: string;
  h1Fr: string;
  leadEn: string;
  leadFr: string;
  bulletsEn: string[];
  bulletsFr: string[];
  faqEn: { q: string; a: string }[];
  faqFr: { q: string; a: string }[];
};

const GENRE_PAGES: SeoPageConfig[] = [
  {
    path: "/ai-trap-beat-generator",
    slugKey: "ai-trap-beat-generator",
    titleEn: "AI Trap Beat Generator — Dark 808 Type Beats Online | ProducerHit",
    titleFr: "Générateur trap IA — Type beats 808 en ligne | ProducerHit",
    descriptionEn: "Generate trap beats with AI: dark 808s, sliding bass, tight hats. Free to start. Export MP3/WAV.",
    descriptionFr: "Génère des beats trap avec l’IA : 808 dark, bass qui slide, hats serrés. Gratuit pour commencer.",
    keywords: ["AI trap beat generator", "trap type beat AI", "808 beat generator", "dark trap beats online"],
    h1En: "AI Trap Beat Generator",
    h1Fr: "Générateur de beats trap IA",
    leadEn: "Create dark trap and type beats from a text prompt. Generate two versions, pick the best bounce, iterate with seed variations.",
    leadFr: "Crée des beats trap dark et des type beats à partir d’un prompt. Génère deux versions, choisis le meilleur bounce, itère avec des variations seed.",
    bulletsEn: ["Dark trap & drill-ready bounce", "808-focused prompts", "Versions x2 for faster hits", "MP3 free · WAV on Pro"],
    bulletsFr: ["Bounce trap dark & drill-ready", "Prompts orientés 808", "Versions x2 pour trouver plus vite", "MP3 gratuit · WAV sur Pro"],
    faqEn: [{ q: "Can I make Metro-style trap beats?", a: "Yes — describe the vibe (dark, minimal, sliding 808s) and iterate with Variation to lock the pocket." }],
    faqFr: [{ q: "Je peux faire des beats style Metro ?", a: "Oui — décris la vibe (dark, minimal, 808 qui slide) et itère avec Variation pour verrouiller le pocket." }],
  },
  {
    path: "/ai-drill-beat-generator",
    slugKey: "ai-drill-beat-generator",
    titleEn: "AI Drill Beat Generator — UK & NY Drill Online | ProducerHit",
    titleFr: "Générateur drill IA — UK & NY drill en ligne | ProducerHit",
    descriptionEn: "AI drill beat generator for aggressive pockets, sliding bass and tight hats. Generate online free.",
    descriptionFr: "Générateur de beats drill IA : pocket agressif, bass qui slide, hats serrés. Génère en ligne gratuitement.",
    keywords: ["AI drill beat generator", "UK drill AI", "NY drill type beat", "drill beat maker online"],
    h1En: "AI Drill Beat Generator",
    h1Fr: "Générateur de beats drill IA",
    leadEn: "Generate drill type beats with AI — sliding 808s, aggressive drums, dark melodies. Built for quick iteration.",
    leadFr: "Génère des type beats drill avec l’IA — 808 qui slide, drums agressifs, mélodies dark. Pensé pour itérer vite.",
    bulletsEn: ["UK & NY drill vibes", "140+ BPM friendly", "Seed variations", "Community remix inspiration"],
    bulletsFr: ["Vibes UK & NY drill", "Compatible 140+ BPM", "Variations seed", "Inspiration remix communauté"],
    faqEn: [{ q: "How do I get a harder drill pocket?", a: "Generate short, try Versions=2, then use Variation on the best take with a tighter prompt." }],
    faqFr: [{ q: "Comment avoir un pocket drill plus hard ?", a: "Génère court, active Versions=2, puis Variation sur le meilleur take avec un prompt plus serré." }],
  },
  {
    path: "/ai-rnb-beat-generator",
    slugKey: "ai-rnb-beat-generator",
    titleEn: "AI R&B Beat Generator — Trapsoul & 90s R&B Online | ProducerHit",
    titleFr: "Générateur R&B IA — Trapsoul & 90s R&B en ligne | ProducerHit",
    descriptionEn: "Create R&B and trapsoul beats with AI. Warm chords, moody drums, song-ready structure.",
    descriptionFr: "Crée des beats R&B et trapsoul avec l’IA. Accords chauds, drums moody, structure prête chanson.",
    keywords: ["AI R&B beat generator", "trapsoul AI", "90s R&B beats online", "R&B type beat generator"],
    h1En: "AI R&B Beat Generator",
    h1Fr: "Générateur de beats R&B IA",
    leadEn: "Generate R&B, trapsoul and neo-soul instrumentals from prompts. Perfect for hooks and toplines.",
    leadFr: "Génère des instrumentaux R&B, trapsoul et neo-soul à partir de prompts. Parfait pour hooks et toplines.",
    bulletsEn: ["Warm chords & moody drums", "Song Mode with vocals", "Type beat workflow", "Free MP3 export"],
    bulletsFr: ["Accords chauds & drums moody", "Song Mode avec voix", "Workflow type beat", "Export MP3 gratuit"],
    faqEn: [{ q: "Can I generate full R&B songs?", a: "Yes — switch to Song Mode for vocals, structure and hooks." }],
    faqFr: [{ q: "Je peux générer des chansons R&B complètes ?", a: "Oui — passe en Song Mode pour voix, structure et hooks." }],
  },
  {
    path: "/ai-afrobeats-generator",
    slugKey: "ai-afrobeats-generator",
    titleEn: "AI Afrobeats Generator — Summer Hits & Grooves Online | ProducerHit",
    titleFr: "Générateur Afrobeats IA — Hits d’été en ligne | ProducerHit",
    descriptionEn: "Generate Afrobeats and amapiano-inspired grooves with AI. Bright chords, percussive grooves, export-ready.",
    descriptionFr: "Génère des grooves Afrobeats et amapiano avec l’IA. Accords lumineux, grooves percussifs, prêt export.",
    keywords: ["AI afrobeats generator", "afrobeats beat maker", "amapiano AI beats", "afrobeat type beat online"],
    h1En: "AI Afrobeats Generator",
    h1Fr: "Générateur Afrobeats IA",
    leadEn: "Create Afrobeats instrumentals and songs with AI — percussive grooves, bright energy, release-ready mixes.",
    leadFr: "Crée des instrumentaux et chansons Afrobeats avec l’IA — grooves percussifs, énergie lumineuse, mix release-ready.",
    bulletsEn: ["Afrobeats & amapiano vibes", "Song Mode for vocals", "Fast iteration", "Public community previews"],
    bulletsFr: ["Vibes Afrobeats & amapiano", "Song Mode pour voix", "Itération rapide", "Aperçus communauté publique"],
    faqEn: [{ q: "Is Afrobeats good for TikTok clips?", a: "Yes — generate short clips first, then export MP3 for social content." }],
    faqFr: [{ q: "L’Afrobeats marche pour TikTok ?", a: "Oui — génère d’abord des clips courts, puis exporte MP3 pour le social." }],
  },
  {
    path: "/ai-hip-hop-beat-generator",
    slugKey: "ai-hip-hop-beat-generator",
    titleEn: "AI Hip Hop Beat Generator — Boom Bap & Modern Beats | ProducerHit",
    titleFr: "Générateur hip-hop IA — Boom bap & beats modernes | ProducerHit",
    descriptionEn: "AI hip hop beat generator for boom bap, trap and modern rap production. Free online beat maker.",
    descriptionFr: "Générateur hip-hop IA pour boom bap, trap et prod rap moderne. Beat maker en ligne gratuit.",
    keywords: ["AI hip hop beat generator", "boom bap AI", "rap beat maker online", "hip hop type beat AI"],
    h1En: "AI Hip Hop Beat Generator",
    h1Fr: "Générateur de beats hip-hop IA",
    leadEn: "From boom bap samples to modern trap — generate hip hop beats online with producer-first controls.",
    leadFr: "Du boom bap au trap moderne — génère des beats hip-hop en ligne avec des contrôles producteur.",
    bulletsEn: ["Multiple hip-hop subgenres", "BPM & key control", "Versions x2", "Library & remix workflow"],
    bulletsFr: ["Plusieurs sous-genres hip-hop", "Contrôle BPM & key", "Versions x2", "Bibliothèque & remix"],
    faqEn: [{ q: "Old school or new school?", a: "Both — describe the era and influence in your prompt for targeted results." }],
    faqFr: [{ q: "Old school ou new school ?", a: "Les deux — décris l’ère et l’influence dans ton prompt pour des résultats ciblés." }],
  },
  {
    path: "/ai-pop-beat-generator",
    slugKey: "ai-pop-beat-generator",
    titleEn: "AI Pop Beat Generator — Catchy Hooks & Radio-Ready | ProducerHit",
    titleFr: "Générateur pop IA — Hooks catchy & radio-ready | ProducerHit",
    descriptionEn: "Generate pop beats and full pop songs with AI. Catchy hooks, clean mixes, fast iteration.",
    descriptionFr: "Génère des beats pop et des chansons pop complètes avec l’IA. Hooks catchy, mix clean, itération rapide.",
    keywords: ["AI pop beat generator", "pop song AI generator", "catchy pop beats online", "pop music maker AI"],
    h1En: "AI Pop Beat Generator",
    h1Fr: "Générateur de beats pop IA",
    leadEn: "Create pop instrumentals and full songs with vocals. Built for hooks, choruses and release-ready energy.",
    leadFr: "Crée des instrumentaux pop et des chansons complètes avec voix. Pensé pour hooks, refrains et énergie release-ready.",
    bulletsEn: ["Song Mode with vocals", "Hook-focused prompts", "Seed variations", "WAV export on Pro"],
    bulletsFr: ["Song Mode avec voix", "Prompts orientés hook", "Variations seed", "Export WAV sur Pro"],
    faqEn: [{ q: "Can I export for streaming?", a: "Download MP3 (Free) or WAV (Pro) and check platform rules for AI content." }],
    faqFr: [{ q: "Je peux exporter pour le streaming ?", a: "Télécharge MP3 (Free) ou WAV (Pro) et vérifie les règles plateformes pour le contenu IA." }],
  },
];

const CORE_PAGES: SeoPageConfig[] = [
  {
    path: "/ai-beat-generator",
    slugKey: "ai-beat-generator",
    titleEn: "AI Beat Generator — Create Type Beats Online | ProducerHit",
    titleFr: "Générateur de beats IA — Type beats en ligne | ProducerHit",
    descriptionEn: "Use ProducerHit as your AI beat generator: generate type beats fast, try 2 versions, and refine with seed-based variations.",
    descriptionFr: "Utilise ProducerHit comme générateur de beats IA : crée des type beats rapidement, génère 2 versions, et fais des variations via seed.",
    keywords: ["AI beat generator", "type beat generator", "generate beats online"],
    h1En: "AI Beat Generator",
    h1Fr: "Générateur de beats IA",
    leadEn: "Generate producer-ready type beats from a text prompt. Start with short clips, generate two candidates, then lock in a vibe with seed-based variations.",
    leadFr: "Génère des type beats niveau pro à partir d’un prompt. Commence avec des clips courts, génère deux versions, puis garde la vibe avec des variations via seed.",
    bulletsEn: ["Modern genres: trap, drill, afrobeats, UK garage, house, and more", "Short generation defaults", "Seed saved per result", "MP3/WAV export depending on plan"],
    bulletsFr: ["Genres modernes : trap, drill, afrobeats, UK garage, house, etc.", "Générations courtes par défaut", "Seed sauvegardé par résultat", "Export MP3/WAV selon plan"],
    faqEn: [{ q: "What is an AI beat generator?", a: "An AI beat generator creates instrumental music from a text description (genre, mood, tempo)." }],
    faqFr: [{ q: "C’est quoi un générateur de beats IA ?", a: "Un générateur de beats IA crée des instrumentaux à partir d’une description (genre, mood, tempo)." }],
  },
  {
    path: "/ai-music-generator",
    slugKey: "ai-music-generator",
    titleEn: "AI Music Generator — Generate Songs & Beats | ProducerHit",
    titleFr: "Générateur de musique IA — Songs & beats | ProducerHit",
    descriptionEn: "AI music generator for songs and type beats. Describe a vibe, generate, iterate with variations, and export your track.",
    descriptionFr: "Générateur de musique IA pour chansons et type beats. Décris une vibe, génère, itère avec des variations, et exporte ton track.",
    keywords: ["AI music generator", "AI song generator", "generate music online"],
    h1En: "AI Music Generator",
    h1Fr: "Générateur de musique IA",
    leadEn: "Create beats and full songs online with an AI music generator built for producers.",
    leadFr: "Crée des beats et des chansons en ligne avec un générateur de musique IA pensé pour les producteurs.",
    bulletsEn: ["Generate songs with vocals or producer-grade type beats", "Pick the best take with Versions=2", "Reproducible seeds", "Built for speed"],
    bulletsFr: ["Génère des chansons avec voix ou des type beats niveau pro", "Choisis le meilleur avec Versions=2", "Seeds reproductibles", "Pensé pour aller vite"],
    faqEn: [{ q: "Can I generate both songs and beats?", a: "Yes. ProducerHit supports full songs and type beats depending on your mode." }],
    faqFr: [{ q: "Je peux générer des chansons et des beats ?", a: "Oui. ProducerHit supporte chansons complètes et type beats selon le mode." }],
  },
  {
    path: "/type-beat-generator-ai",
    slugKey: "type-beat-generator-ai",
    titleEn: "Type Beat Generator AI — Producer-Ready Beats | ProducerHit",
    titleFr: "Type beat generator IA — Beats pro | ProducerHit",
    descriptionEn: "Type beat generator AI built for producers: modern genres, clean mix, quick iterations, and reproducible seeds.",
    descriptionFr: "Type beat generator IA pensé pour les producteurs : genres modernes, mix clean, itérations rapides, seeds reproductibles.",
    keywords: ["type beat generator AI", "AI type beat maker", "producer beats online"],
    h1En: "Type Beat Generator AI",
    h1Fr: "Type beat generator IA",
    leadEn: "Generate type beats with AI using producer-first controls: genre, mood, BPM, and prompt-driven iteration.",
    leadFr: "Génère des type beats avec l’IA via des contrôles producteur : genre, mood, BPM et itération par prompt.",
    bulletsEn: ["Prompt-driven workflow", "Versions x2", "Seed variations", "Export MP3/WAV"],
    bulletsFr: ["Workflow piloté par prompt", "Versions x2", "Variations seed", "Export MP3/WAV"],
    faqEn: [{ q: "What makes a good type beat prompt?", a: "Include genre, mood, BPM, and 1–2 reference vibes. Keep generations short first." }],
    faqFr: [{ q: "Qu’est-ce qu’un bon prompt type beat ?", a: "Inclus genre, mood, BPM et 1–2 vibes de référence. Commence par des générations courtes." }],
  },
  {
    path: "/generate-beats-online-free",
    slugKey: "generate-beats-online-free",
    titleEn: "Generate Beats Online Free — AI Beat Generator | ProducerHit",
    titleFr: "Générer des beats en ligne gratuit — IA | ProducerHit",
    descriptionEn: "Generate beats online free with ProducerHit. Start with short clips, pick the best version, then iterate with variations.",
    descriptionFr: "Génère des beats en ligne gratuitement avec ProducerHit. Commence par des clips courts, choisis la meilleure version, puis itère.",
    keywords: ["generate beats online free", "free beat maker AI", "free AI beat generator"],
    h1En: "Generate Beats Online Free",
    h1Fr: "Générer des beats en ligne gratuit",
    leadEn: "Generate beats online for free with ProducerHit. Start with a short clip, pick the best version, then iterate with variations and export.",
    leadFr: "Génère des beats en ligne gratuitement avec ProducerHit. Commence par un clip court, choisis la meilleure version, puis itère avec des variations et exporte.",
    bulletsEn: ["Free MP3 downloads on the free plan", "WAV export on paid plans", "Generate two versions at once", "Seed-based Variation"],
    bulletsFr: ["Téléchargements MP3 gratuits sur le plan free", "Export WAV sur les plans payants", "Génère deux versions d’un coup", "Variation via seed"],
    faqEn: [{ q: "Is it really free to generate beats?", a: "Yes. You can generate beats on the free plan. Upgrade for more credits and WAV exports." }],
    faqFr: [{ q: "C’est vraiment gratuit de générer des beats ?", a: "Oui. Tu peux générer des beats sur le plan gratuit. Upgrade pour plus de crédits et l’export WAV." }],
  },
];

export const SEO_PAGES: SeoPageConfig[] = [...CORE_PAGES, ...GENRE_PAGES];

export const SEO_PAGE_PATHS = SEO_PAGES.map((p) => p.path);

export function getSeoPageByPath(pathname: string): SeoPageConfig | null {
  return SEO_PAGES.find((p) => p.path === pathname) ?? null;
}

export function getSeoPageBySlugKey(slugKey: string): SeoPageConfig | null {
  return SEO_PAGES.find((p) => p.slugKey === slugKey) ?? null;
}
