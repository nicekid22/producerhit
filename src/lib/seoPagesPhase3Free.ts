import type { SeoPageConfig } from "@/lib/seoPages";

type FreeGenreSpec = {
  slug: string;
  slugFr: string;
  labelEn: string;
  labelFr: string;
  prefillGenre: string;
  relatedSlugKey: string;
  bpmHint?: string;
};

const FREE_GENRE_SPECS: FreeGenreSpec[] = [
  {
    slug: "trap",
    slugFr: "trap",
    labelEn: "Trap",
    labelFr: "Trap",
    prefillGenre: "Melodic trap",
    relatedSlugKey: "ai-trap-beat-generator",
    bpmHint: "140–150 BPM",
  },
  {
    slug: "drill",
    slugFr: "drill",
    labelEn: "Drill",
    labelFr: "Drill",
    prefillGenre: "Drill",
    relatedSlugKey: "ai-drill-beat-generator",
    bpmHint: "140+ BPM",
  },
  {
    slug: "rnb",
    slugFr: "rnb",
    labelEn: "R&B / Trapsoul",
    labelFr: "R&B / Trapsoul",
    prefillGenre: "90s R&B",
    relatedSlugKey: "ai-rnb-beat-generator",
  },
  {
    slug: "lofi",
    slugFr: "lofi",
    labelEn: "Lo-Fi",
    labelFr: "Lo-Fi",
    prefillGenre: "Lo-fi hip-hop",
    relatedSlugKey: "ai-lofi-beat-generator",
    bpmHint: "70–90 BPM",
  },
  {
    slug: "hip-hop",
    slugFr: "hip-hop",
    labelEn: "Hip Hop",
    labelFr: "Hip Hop",
    prefillGenre: "Old school hip-hop",
    relatedSlugKey: "ai-hip-hop-beat-generator",
  },
  {
    slug: "dark-trap",
    slugFr: "dark-trap",
    labelEn: "Dark Trap",
    labelFr: "Dark Trap",
    prefillGenre: "Dark trap",
    relatedSlugKey: "ai-trap-beat-generator",
    bpmHint: "130–150 BPM",
  },
  {
    slug: "uk-garage",
    slugFr: "uk-garage",
    labelEn: "UK Garage",
    labelFr: "UK Garage",
    prefillGenre: "UK garage",
    relatedSlugKey: "ai-beat-generator",
    bpmHint: "130–140 BPM",
  },
  {
    slug: "rap",
    slugFr: "rap",
    labelEn: "Rap",
    labelFr: "Rap",
    prefillGenre: "Contemporary rap",
    relatedSlugKey: "ai-hip-hop-beat-generator",
  },
  {
    slug: "reggaeton",
    slugFr: "reggaeton",
    labelEn: "Reggaeton",
    labelFr: "Reggaeton",
    prefillGenre: "Reggaeton",
    relatedSlugKey: "ai-reggaeton-beat-generator",
  },
  {
    slug: "amapiano",
    slugFr: "amapiano",
    labelEn: "Amapiano",
    labelFr: "Amapiano",
    prefillGenre: "Amapiano",
    relatedSlugKey: "ai-afrobeats-generator",
  },
];

function freeBeatPage(spec: FreeGenreSpec): SeoPageConfig {
  const bpm = spec.bpmHint ? ` (${spec.bpmHint})` : "";
  return {
    path: `/free-${spec.slug}-beat-generator`,
    pathFr: `/generateur-${spec.slugFr}-beat-gratuit`,
    slugKey: `free-${spec.slug}-beat-generator`,
    category: "beat",
    prefillGenre: spec.prefillGenre,
    prefillMode: "beat",
    relatedSlugKeys: [spec.relatedSlugKey, "ai-beat-generator", "generate-beats-online-free", "free-beat-generators-hub"],
    promptHintEn: `${spec.prefillGenre} type beat${bpm}, punchy drums, clean mix, loopable 16 bars, no vocals`,
    promptHintFr: `Type beat ${spec.labelFr}${bpm}, drums punchy, mix propre, 16 mesures loop, sans voix`,
    titleEn: `Free ${spec.labelEn} Beat Generator — No Signup | ProducerHit`,
    titleFr: `Générateur beat ${spec.labelFr} gratuit — sans inscription | ProducerHit`,
    descriptionEn: `Free ${spec.labelEn.toLowerCase()} beat generator online. ${spec.prefillGenre} type beats from text — MP3 export, 10 free gens/month. No credit card.`,
    descriptionFr: `Générateur beat ${spec.labelFr.toLowerCase()} gratuit en ligne. Type beats ${spec.prefillGenre} — export MP3, ~10 gens/mois gratuites.`,
    keywords: [
      `free ${spec.slug} beat generator`,
      `free ${spec.labelEn.toLowerCase()} type beat`,
      `${spec.slug} beat maker online free`,
      "AI beat generator free",
    ],
    h1En: `Free ${spec.labelEn} Beat Generator`,
    h1Fr: `Générateur beat ${spec.labelFr} gratuit`,
    leadEn: `Generate ${spec.labelEn.toLowerCase()} type beats for free — lock genre, BPM and key, export MP3. Built from real ProducerHit usage data (${spec.prefillGenre} is a top community genre).`,
    leadFr: `Génère des type beats ${spec.labelFr.toLowerCase()} gratuitement — genre, BPM et tonalité verrouillés, export MP3. Basé sur les stats réelles ProducerHit.`,
    bulletsEn: [
      "Free tier — no credit card",
      "Two versions per generation",
      "Seed variations to refine",
      "Upgrade for WAV + commercial",
    ],
    bulletsFr: [
      "Offre gratuite — sans carte",
      "Deux versions par génération",
      "Variations seed pour affiner",
      "Upgrade WAV + commercial",
    ],
    faqEn: [
      {
        q: `Is this ${spec.labelEn.toLowerCase()} beat generator really free?`,
        a: "Yes — the free plan includes monthly generations and MP3 download. No signup required to try the landing prompt.",
      },
      {
        q: "Can I use beats commercially?",
        a: "Free MP3 is for personal use. Pro plans include commercial licensing — see Pricing.",
      },
    ],
    faqFr: [
      {
        q: `Ce générateur ${spec.labelFr.toLowerCase()} est vraiment gratuit ?`,
        a: "Oui — le plan gratuit inclut des générations mensuelles et le MP3. Essai sans carte bancaire.",
      },
      {
        q: "Usage commercial ?",
        a: "MP3 gratuit = usage perso. Les plans Pro incluent la licence commerciale.",
      },
    ],
  };
}

export const FREE_BEAT_PAGES: SeoPageConfig[] = FREE_GENRE_SPECS.map(freeBeatPage);

export const FREE_BEAT_HUB_PAGE: SeoPageConfig = {
  path: "/free-beat-generators",
  pathFr: "/generateurs-beats-gratuits",
  slugKey: "free-beat-generators-hub",
  category: "hub",
  relatedLimit: 12,
  relatedSlugKeys: FREE_GENRE_SPECS.map((s) => `free-${s.slug}-beat-generator`),
  titleEn: "Free AI Beat Generators by Genre — Trap, Drill, Lo-Fi & More | ProducerHit",
  titleFr: "Générateurs de beats IA gratuits par genre — Trap, Drill, Lo-Fi | ProducerHit",
  descriptionEn:
    "10 free AI beat generators by genre — trap, drill, R&B, lo-fi, UK garage and more. No signup to start. MP3 export on free tier.",
  descriptionFr:
    "10 générateurs de beats IA gratuits par genre — trap, drill, R&B, lo-fi, UK garage. Sans inscription pour commencer.",
  keywords: ["free beat generator", "free type beat generator", "AI beat maker free", "free trap beat generator"],
  h1En: "Free AI Beat Generators by Genre",
  h1Fr: "Générateurs de beats IA gratuits par genre",
  leadEn:
    "Long-tail landing pages for the genres producers generate most on ProducerHit — based on 3,400+ real tracks. Pick a genre, generate free, export MP3.",
  leadFr:
    "Pages ciblées sur les genres les plus générés sur ProducerHit — stats de 3 400+ morceaux. Choisis un genre, génère gratuit, exporte MP3.",
  bulletsEn: FREE_GENRE_SPECS.map((s) => `Free ${s.labelEn} beat generator`),
  bulletsFr: FREE_GENRE_SPECS.map((s) => `Beat ${s.labelFr} gratuit`),
  faqEn: [
    {
      q: "Why separate pages per genre?",
      a: "Each page matches how people search — “free trap beat generator” vs generic “AI music”. Same studio, genre-locked prompts.",
    },
    {
      q: "Where is the data from?",
      a: "Top genres from our public stats page — updated from production database.",
    },
  ],
  faqFr: [
    {
      q: "Pourquoi une page par genre ?",
      a: "Chaque page match une recherche longue — « générateur beat trap gratuit ». Même studio, prompts verrouillés genre.",
    },
    {
      q: "D'où viennent les stats ?",
      a: "Top genres de notre page stats — base de données production.",
    },
  ],
};

export const PHASE3_FREE_PATHS = [
  FREE_BEAT_HUB_PAGE.path,
  FREE_BEAT_HUB_PAGE.pathFr,
  ...FREE_BEAT_PAGES.flatMap((p) => [p.path, p.pathFr]),
];
