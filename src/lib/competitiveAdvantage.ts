export type CompetitiveRow = {
  feature: string;
  featureFr: string;
  producerhit: string;
  producerhitFr: string;
  suno: string;
  sunoFr: string;
  udio: string;
  udioFr: string;
  highlight?: boolean;
};

/** Tableau comparatif ProducerHit vs Suno/Udio — utilisé sur landings SEO et blog. */
export const COMPETITIVE_ADVANTAGE_ROWS: CompetitiveRow[] = [
  {
    feature: "Genre catalog depth",
    featureFr: "Profondeur catalogue genres",
    producerhit: "680+ ACE-tuned genres (Latin, ME, K-Pop, phonk…)",
    producerhitFr: "680+ genres ACE (Latin, MO, K-Pop, phonk…)",
    suno: "~20 style presets",
    sunoFr: "~20 presets style",
    udio: "~15–25 styles",
    udioFr: "~15–25 styles",
    highlight: true,
  },
  {
    feature: "Beat + song in one studio",
    featureFr: "Beat + chanson un studio",
    producerhit: "Type Beat + Song Mode + Remix",
    producerhitFr: "Type Beat + Song Mode + Remix",
    suno: "Song-focused",
    sunoFr: "Orienté chanson",
    udio: "Song-focused",
    udioFr: "Orienté chanson",
    highlight: true,
  },
  {
    feature: "Manual lyrics + genre control",
    featureFr: "Paroles manuelles + genre",
    producerhit: "Genre précis keeps instrumental style",
    producerhitFr: "Genre précis garde le style instrumental",
    suno: "Lyrics yes — fewer genre locks",
    sunoFr: "Paroles oui — moins de verrouillage genre",
    udio: "Similar",
    udioFr: "Similaire",
    highlight: true,
  },
  {
    feature: "Producer iteration",
    featureFr: "Itération producteur",
    producerhit: "Versions×2 · seed lock · Variation loop",
    producerhitFr: "Versions×2 · seed lock · boucle Variation",
    suno: "Regenerate / extend",
    sunoFr: "Regénérer / étendre",
    udio: "Regenerate / inpaint",
    udioFr: "Regénérer / inpaint",
    highlight: true,
  },
  {
    feature: "Regional music (Latin / ME / Asia)",
    featureFr: "Musique régionale (Latin / MO / Asie)",
    producerhit: "33+ Latin · 13+ ME · 25+ Asia genres",
    producerhitFr: "33+ Latin · 13+ MO · 25+ Asie",
    suno: "5–8 regional approximations",
    sunoFr: "5–8 approximations régionales",
    udio: "Generic « world » tags",
    udioFr: "Tags « world » génériques",
    highlight: true,
  },
  {
    feature: "Community & remix",
    featureFr: "Communauté & remix",
    producerhit: "Public loops · remix upload · trending",
    producerhitFr: "Loops publics · remix upload · trending",
    suno: "Limited social",
    sunoFr: "Social limité",
    udio: "Limited social",
    udioFr: "Social limité",
  },
  {
    feature: "Free tier",
    featureFr: "Plan gratuit",
    producerhit: "Monthly credits · MP3 export",
    producerhitFr: "Crédits mensuels · export MP3",
    suno: "Limited free credits",
    sunoFr: "Crédits free limités",
    udio: "Limited free credits",
    udioFr: "Crédits free limités",
  },
  {
    feature: "WAV export",
    featureFr: "Export WAV",
    producerhit: "Pro plans",
    producerhitFr: "Plans Pro",
    suno: "Paid tiers",
    sunoFr: "Plans payants",
    udio: "Paid tiers",
    udioFr: "Plans payants",
  },
];

export const COMPETITIVE_ADVANTAGE_BLOG_SLUG = "producerhit-vs-suno-udio-advantages-2026";

export const COMPETITIVE_COMPARE_LINKS = {
  pathEn: "/producerhit-vs-suno",
  pathFr: "/producteurhit-vs-suno",
  pathUdioEn: "/producerhit-vs-udio",
  pathUdioFr: "/producteurhit-vs-udio",
  blogSlug: COMPETITIVE_ADVANTAGE_BLOG_SLUG,
};
