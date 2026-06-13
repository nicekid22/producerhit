import type { SeoPageConfig } from "@/lib/seoPages";

type LatinSongOpts = {
  slugKey: string;
  path: string;
  pathFr: string;
  nameEn: string;
  nameFr: string;
  keywordEn: string;
  keywordFr: string;
  bpm: number;
  promptEn: string;
  promptFr: string;
  instrumentsEn: string;
  instrumentsFr: string;
  relatedSlugKeys: string[];
};

/** Landing SEO chanson / beat latino — prompts ACE alignés au catalogue ProducerHit. */
export function latinMusicSeoPage(o: LatinSongOpts): SeoPageConfig {
  return {
    path: o.path,
    pathFr: o.pathFr,
    slugKey: o.slugKey,
    category: "latin",
    prefillGenre: o.nameEn,
    prefillMode: "song",
    relatedSlugKeys: o.relatedSlugKeys,
    relatedLimit: 8,
    promptHintEn: o.promptEn,
    promptHintFr: o.promptFr,
    titleEn: `${o.nameEn} AI Generator — Songs & Beats Online (2026) | ProducerHit`,
    titleFr: `Générateur ${o.nameFr} IA — Chansons & beats en ligne (2026) | ProducerHit`,
    descriptionEn: `Generate ${o.keywordEn} with AI: ${o.instrumentsEn}. Song Mode with Spanish/Portuguese vocals or instrumental beats. Free to start — MP3 export.`,
    descriptionFr: `Génère de la ${o.keywordFr} avec l'IA : ${o.instrumentsFr}. Song Mode voix ES/PT ou beats instrumentaux. Gratuit pour commencer — export MP3.`,
    keywords: [
      `${o.keywordEn} AI generator`,
      `AI ${o.keywordEn} generator`,
      `free ${o.keywordEn} generator`,
      `${o.nameEn.toLowerCase()} song generator AI`,
      `${o.nameEn.toLowerCase()} beat maker online`,
    ],
    h1En: `${o.nameEn} AI Generator`,
    h1Fr: `Générateur ${o.nameFr} IA`,
    leadEn: `ProducerHit generates authentic ${o.keywordEn} from text — pick **${o.nameEn}** in Genre précis, use Song Mode for vocals or Beat mode for instrumentals. Typical BPM ~${o.bpm}. Versions×2 + seed variations beat generic « latin loop » tools.`,
    leadFr: `ProducerHit génère de la ${o.keywordFr} authentique depuis un texte — choisis **${o.nameFr}** en Genre précis, Song Mode pour les voix ou Beat pour l'instrumental. BPM typique ~${o.bpm}. Versions×2 + variations seed — mieux qu'une boucle « latin » générique.`,
    bulletsEn: [
      `Catalog genre: ${o.nameEn} (~${o.bpm} BPM)`,
      "Song Mode — your lyrics or AI lyrics (ES/PT/FR)",
      "Beat mode for dembow, perreo & dance edits",
      "640+ genres · royalty-free MP3 on Free plan",
    ],
    bulletsFr: [
      `Genre catalogue : ${o.nameFr} (~${o.bpm} BPM)`,
      "Song Mode — tes paroles ou paroles IA (ES/PT/FR)",
      "Mode Beat pour dembow, perreo & edits danse",
      "640+ genres · MP3 royalty-free sur le plan Free",
    ],
    faqEn: [
      {
        q: `Can I use my own lyrics for ${o.nameEn}?`,
        a: "Yes — Song Mode → manual lyrics. Genre précis keeps the instrumental style while preserving your text.",
      },
      {
        q: "Is it royalty-free?",
        a: "Downloads on your plan are for your content workflows. Check platform rules for AI music on streaming services.",
      },
      {
        q: `Best BPM for ${o.nameEn}?`,
        a: `Start near ${o.bpm} BPM in your prompt. Use auto tempo in Song Mode or set Genre précis for consistent groove.`,
      },
    ],
    faqFr: [
      {
        q: `Je peux utiliser mes paroles en ${o.nameFr} ?`,
        a: "Oui — Song Mode → paroles manuelles. Genre précis garde le style instrumental tout en respectant ton texte.",
      },
      {
        q: "C'est royalty-free ?",
        a: "Les téléchargements suivent ton plan pour tes workflows contenu. Vérifie les règles plateformes pour la musique IA en streaming.",
      },
      {
        q: `Quel BPM pour ${o.nameFr} ?`,
        a: `Commence autour de ${o.bpm} BPM dans ton prompt. Tempo auto en Song Mode ou Genre précis pour un groove cohérent.`,
      },
    ],
  };
}

type CountrySongOpts = {
  slugKey: string;
  path: string;
  pathFr: string;
  variantEn: string;
  variantFr: string;
  keywordEn: string;
  keywordFr: string;
  genreValue: string;
  promptEn: string;
  promptFr: string;
  relatedSlugKeys: string[];
};

export function countryMusicSeoPage(o: CountrySongOpts): SeoPageConfig {
  return {
    path: o.path,
    pathFr: o.pathFr,
    slugKey: o.slugKey,
    category: "country",
    prefillGenre: o.genreValue,
    prefillMode: "song",
    relatedSlugKeys: o.relatedSlugKeys,
    relatedLimit: 8,
    promptHintEn: o.promptEn,
    promptHintFr: o.promptFr,
    titleEn: `${o.variantEn} AI Generator — Create Country Songs Online (2026) | ProducerHit`,
    titleFr: `${o.variantFr} IA — Chansons country en ligne (2026) | ProducerHit`,
    descriptionEn: `Generate ${o.keywordEn} with AI. Acoustic storytelling, Nashville hooks, English vocals. Free AI country song generator — MP3 export.`,
    descriptionFr: `Génère de la ${o.keywordFr} avec l'IA. Storytelling acoustique, hooks Nashville, voix anglaises. Générateur country IA gratuit — export MP3.`,
    keywords: [
      "AI generated country song",
      "AI country song generator",
      "free AI country song generator",
      `${o.keywordEn} AI`,
      "country music maker online",
    ],
    h1En: `${o.variantEn} AI Generator`,
    h1Fr: `Générateur ${o.variantFr} IA`,
    leadEn: `The fastest **AI generated country song** workflow in 2026: select **${o.genreValue}** (or Country Pop / Contemporary Country), Song Mode, English lyrics, Versions×2. Beats Suno for iteration speed and producer controls.`,
    leadFr: `Workflow **chanson country IA** le plus rapide en 2026 : sélectionne **${o.genreValue}**, Song Mode, paroles anglaises, Versions×2. Bat Suno sur l'itération et les contrôles producteur.`,
    bulletsEn: [
      "Genre précis: Country · Country Pop · Bluegrass",
      "Song Mode + manual English lyrics",
      "Seed variations lock the chorus",
      "Free tier — upgrade for WAV",
    ],
    bulletsFr: [
      "Genre précis : Country · Country Pop · Bluegrass",
      "Song Mode + paroles anglaises manuelles",
      "Variations seed pour verrouiller le refrain",
      "Plan free — upgrade pour WAV",
    ],
    faqEn: [
      { q: "Is AI generated country song allowed on Spotify?", a: "Policies evolve — export MP3/WAV and follow each distributor's AI disclosure rules." },
      { q: "Can I make Morgan Wallen-style country?", a: "Describe era and mood (neo-traditional, stadium country) — don't paste artist names in prompts." },
    ],
    faqFr: [
      { q: "Une chanson country IA est autorisée sur Spotify ?", a: "Les règles évoluent — exporte MP3/WAV et suis la politique AI de chaque distributeur." },
      { q: "Je peux viser un country radio moderne ?", a: "Décris l'ère et le mood (neo-trad, stadium country) — évite les noms d'artistes dans les prompts." },
    ],
  };
}

type RegionalSongOpts = LatinSongOpts & {
  category: "asia" | "middle-east";
  vocalLangEn?: string;
  vocalLangFr?: string;
  competitorNoteEn?: string;
  competitorNoteFr?: string;
  prefillGenre?: string;
  prefillMode?: "song" | "beat";
};

/** Landing SEO régionale (Asia, Middle East) — même pattern que Latin. */
export function regionalMusicSeoPage(o: RegionalSongOpts): SeoPageConfig {
  const vocalEn = o.vocalLangEn ?? "local language vocals";
  const vocalFr = o.vocalLangFr ?? "voix langue locale";
  const vsNoteEn = o.competitorNoteEn ?? "generic « world music » presets";
  const vsNoteFr = o.competitorNoteFr ?? "presets « world music » génériques";
  const genre = o.prefillGenre ?? o.nameEn;

  return {
    path: o.path,
    pathFr: o.pathFr,
    slugKey: o.slugKey,
    category: o.category,
    prefillGenre: genre,
    prefillMode: o.prefillMode ?? "song",
    relatedSlugKeys: o.relatedSlugKeys,
    relatedLimit: 8,
    promptHintEn: o.promptEn,
    promptHintFr: o.promptFr,
    titleEn: `${o.nameEn} AI Generator — Songs & Beats Online (2026) | ProducerHit`,
    titleFr: `Générateur ${o.nameFr} IA — Chansons & beats en ligne (2026) | ProducerHit`,
    descriptionEn: `Generate ${o.keywordEn} with AI: ${o.instrumentsEn}. Song Mode with ${vocalEn}. ACE-tuned genre — not a generic preset. Free MP3 export.`,
    descriptionFr: `Génère de la ${o.keywordFr} avec l'IA : ${o.instrumentsFr}. Song Mode ${vocalFr}. Genre ACE — pas un preset générique. Export MP3 gratuit.`,
    keywords: [
      `${o.keywordEn} AI generator`,
      `AI ${o.keywordEn} generator`,
      `free ${o.keywordEn} generator`,
      `${o.nameEn.toLowerCase()} song generator AI`,
      `${o.nameEn.toLowerCase()} beat maker online`,
    ],
    h1En: `${o.nameEn} AI Generator`,
    h1Fr: `Générateur ${o.nameFr} IA`,
    leadEn: `ProducerHit generates authentic ${o.keywordEn} — pick **${genre}** in Genre précis, Song Mode for vocals or Beat for instrumentals. ~${o.bpm} BPM. Versions×2 beats ${vsNoteEn}.`,
    leadFr: `ProducerHit génère de la ${o.keywordFr} authentique — **${genre}** en Genre précis, Song Mode ou Beat. ~${o.bpm} BPM. Versions×2 bat ${vsNoteFr}.`,
    bulletsEn: [
      `ACE genre: ${genre} (~${o.bpm} BPM)`,
      `Song Mode — manual or AI lyrics (${vocalEn})`,
      "680+ genres · seed iteration · community remix",
      "Free MP3 · WAV on Pro",
    ],
    bulletsFr: [
      `Genre ACE : ${genre} (~${o.bpm} BPM)`,
      `Song Mode — paroles manuelles ou IA (${vocalFr})`,
      "680+ genres · iteration seed · remix communauté",
      "MP3 gratuit · WAV sur Pro",
    ],
    faqEn: [
      { q: `Can I use my own lyrics for ${o.nameEn}?`, a: "Yes — Song Mode → manual lyrics. Genre précis keeps the instrumental style while preserving your text." },
      { q: "ProducerHit vs Suno for this genre?", a: "Dedicated ACE prompts per subgenre, Versions×2, seed lock, and beat+song in one studio — Suno offers fewer regional genres and less iteration control." },
      { q: `Best BPM for ${o.nameEn}?`, a: `Start near ${o.bpm} BPM. Genre précis sets the default groove.` },
    ],
    faqFr: [
      { q: `Mes paroles en ${o.nameFr} ?`, a: "Oui — Song Mode → paroles manuelles + Genre précis pour le style instrumental." },
      { q: "ProducerHit vs Suno pour ce genre ?", a: "Prompts ACE dédiés, Versions×2, seed, beat+chanson — Suno a moins de genres régionaux et moins de contrôle d'itération." },
      { q: `BPM pour ${o.nameFr} ?`, a: `Commence autour de ${o.bpm} BPM avec Genre précis.` },
    ],
  };
}
