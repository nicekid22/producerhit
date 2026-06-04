import type { Loop } from "@/types/loop";
import { pinterestGenerationTitle } from "@/lib/pinterestCoverFetch";
import { coverImageSeed, hashString } from "@/lib/utils";
import { PINTEREST_DISCOVERY_PREVIEW } from "@/lib/featureFlags";

/** Rollback : supprimer ce fichier + flag off — voir PINTEREST_DISCOVERY_ROLLBACK.md */
export const PINTEREST_DISCOVERY_MODULE = true;

export type PinterestDiscoveryTemplate = "default" | "streetwear" | "retro-futur";

export type PinterestTermSource = "genre" | "mood" | "prompt" | "template" | "universal";

export type PinterestDiscoveryTerm = {
  query: string;
  score: number;
  sources: PinterestTermSource[];
};

export type PinterestDiscoveryResult = {
  /** Termes classés (score décroissant). */
  terms: PinterestDiscoveryTerm[];
  /** Terme principal pour une future recherche image / prompt enrichi. */
  picked: string;
  template: PinterestDiscoveryTemplate;
  /** Bucket genre détecté (debug). */
  genreBucket: string;
  seed: number;
  /** Contexte utilisé pour le scoring. */
  context: {
    genre: string;
    mood: string;
    promptSnippet: string;
  };
};

export type DiscoverPinterestOptions = {
  template?: PinterestDiscoveryTemplate;
  /** Variante stable (ex. index de refresh) — change le tirage sans casser le seed de base. */
  variant?: number;
  maxTerms?: number;
};

type BucketDef = {
  id: string;
  matchers: string[];
  terms: Array<{ query: string; weight: number }>;
};

const VISUAL_BOOSTERS = [
  { query: "pinterest streetwearaesthetic", weight: 0.12 },
  { query: "music people portrait lifestyle", weight: 0.1 },
  { query: "editorial beatmaker photography", weight: 0.08 },
  { query: "trending visual", weight: 0.06 },
] as const;

const TEMPLATE_TERMS: Record<PinterestDiscoveryTemplate, Array<{ query: string; weight: number }>> = {
  default: [],
  streetwear: [],
  "retro-futur": [
    { query: "retro futurism aesthetic", weight: 0.95 },
    { query: "y2k chrome portrait editorial", weight: 0.9 },
    { query: "frutiger aero nostalgia", weight: 0.88 },
    { query: "vhs glitch neon noir", weight: 0.86 },
    { query: "ps2 era digital dream", weight: 0.84 },
    { query: "cyber luxury chrome trap", weight: 0.82 },
    { query: "analog horror aesthetic edit", weight: 0.78 },
    { query: "neon highway retro future", weight: 0.76 },
  ],
};

const GENRE_BUCKETS: BucketDef[] = [
  {
    id: "trap",
    matchers: ["trap", "plugg", "rage", "opium", "jersey club", "phonk trap"],
    terms: [
      { query: "streetwear aesthetic", weight: 1 },
      { query: "hip hop fashion editorial", weight: 0.95 },
      { query: "rapper portrait dark luxury", weight: 0.92 },
      { query: "trap jewelry chrome", weight: 0.9 },
      { query: "underground rap portrait streetwear", weight: 0.88 },
      { query: "night city flex aesthetic", weight: 0.85 },
    ],
  },
  {
    id: "lofi",
    matchers: ["lo-fi", "lofi", "chillhop", "jazz hop", "study beat", "downtempo"],
    terms: [
      { query: "anime room cozy aesthetic", weight: 1 },
      { query: "desk setup rainy window", weight: 0.96 },
      { query: "lofi girl study cafe", weight: 0.94 },
      { query: "rainy city night mood", weight: 0.9 },
      { query: "warm lamp bedroom aesthetic", weight: 0.88 },
      { query: "cat window rainy vibe", weight: 0.82 },
    ],
  },
  {
    id: "phonk",
    matchers: ["phonk", "drift", "sigma", "memphis", "dark phonk"],
    terms: [
      { query: "drift car tokyo night", weight: 1 },
      { query: "cyberpunk street neon", weight: 0.96 },
      { query: "tokyo night drive aesthetic", weight: 0.94 },
      { query: "night drive portrait neon street", weight: 0.9 },
      { query: "aggressive night city edit", weight: 0.88 },
      { query: "anime villain night street", weight: 0.84 },
    ],
  },
  {
    id: "rnb90s",
    matchers: ["r&b", "rnb", "soul", "neo soul", "neo-soul", "90s r&b", "quiet storm", "boom bap soul"],
    terms: [
      { query: "90s rnb aesthetic", weight: 1 },
      { query: "old school soul portrait vintage", weight: 0.96 },
      { query: "vintage vinyl warm portrait", weight: 0.92 },
      { query: "90s fashion editorial soul", weight: 0.9 },
      { query: "golden hour rnb couple aesthetic", weight: 0.86 },
      { query: "film grain soul music vibe", weight: 0.84 },
    ],
  },
  {
    id: "drill",
    matchers: ["drill", "uk drill", "ny drill", "chicago drill"],
    terms: [
      { query: "uk drill street aesthetic", weight: 1 },
      { query: "balaclava streetwear mood", weight: 0.94 },
      { query: "grime city night portrait", weight: 0.9 },
      { query: "aggressive urban fashion edit", weight: 0.88 },
    ],
  },
  {
    id: "house",
    matchers: ["house", "techno", "edm", "garage", "amapiano", "afro house", "dancehall"],
    terms: [
      { query: "club lights bokeh aesthetic", weight: 1 },
      { query: "rave flash photography mood", weight: 0.94 },
      { query: "festival night crowd glow", weight: 0.9 },
      { query: "neon dancefloor editorial", weight: 0.88 },
    ],
  },
  {
    id: "synthwave",
    matchers: ["synth", "wave", "synthwave", "retrowave", "vaporwave", "outrun"],
    terms: [
      { query: "synthwave sunset highway", weight: 1 },
      { query: "retrowave neon grid aesthetic", weight: 0.96 },
      { query: "vaporwave statue glitch", weight: 0.9 },
      { query: "80s neon palm drive mood", weight: 0.88 },
    ],
  },
  {
    id: "ambient",
    matchers: ["ambient", "cinematic", "orchestral", "soundtrack", "neo-classical"],
    terms: [
      { query: "cinematic fog landscape mood", weight: 1 },
      { query: "film still atmospheric", weight: 0.94 },
      { query: "minimal nature cinematic edit", weight: 0.9 },
      { query: "cinematic portrait atmospheric sky", weight: 0.86 },
    ],
  },
  {
    id: "hiphop",
    matchers: ["hip hop", "hip-hop", "boom bap", "grime"],
    terms: [
      { query: "hip hop street photography", weight: 1 },
      { query: "vinyl crate digger aesthetic", weight: 0.92 },
      { query: "graffiti wall portrait mood", weight: 0.9 },
      { query: "90s hip hop fashion editorial", weight: 0.88 },
    ],
  },
];

const DEFAULT_BUCKET: BucketDef = {
  id: "default",
  matchers: [],
  terms: [
    { query: "music producer aesthetic streetwear 2026", weight: 0.7 },
    { query: "dark editorial fashion portrait", weight: 0.68 },
    { query: "neon night urban aesthetic", weight: 0.66 },
    { query: "minimal chrome object mood", weight: 0.64 },
  ],
};

const MOOD_TERM_MAP: Array<{ matchers: string[]; terms: Array<{ query: string; weight: number }> }> = [
  {
    matchers: ["dark", "moody", "aggressive", "hard"],
    terms: [
      { query: "dark luxury aesthetic", weight: 0.75 },
      { query: "noir street portrait", weight: 0.7 },
    ],
  },
  {
    matchers: ["chill", "soft", "calm", "cozy", "relaxed"],
    terms: [
      { query: "soft ambient room aesthetic", weight: 0.75 },
      { query: "pastel cozy lifestyle portrait", weight: 0.7 },
    ],
  },
  {
    matchers: ["energetic", "party", "club", "euphoric"],
    terms: [
      { query: "flash party photography aesthetic", weight: 0.75 },
      { query: "neon club energy edit", weight: 0.7 },
    ],
  },
  {
    matchers: ["romantic", "sensual", "dreamy", "intimate"],
    terms: [
      { query: "romantic film grain portrait", weight: 0.75 },
      { query: "dreamy bokeh night aesthetic", weight: 0.7 },
    ],
  },
  {
    matchers: ["cinematic", "epic", "atmospheric"],
    terms: [
      { query: "cinematic color grade mood", weight: 0.75 },
      { query: "widescreen film still aesthetic", weight: 0.7 },
    ],
  },
];

function normalizeHaystack(loop: Pick<Loop, "genre" | "mood" | "influence" | "prompt" | "name">): string {
  return `${loop.genre} ${loop.mood} ${loop.influence} ${loop.prompt} ${loop.name}`.toLowerCase();
}

function detectGenreBucket(haystack: string): BucketDef {
  let best: BucketDef = DEFAULT_BUCKET;
  let bestScore = 0;
  for (const bucket of GENRE_BUCKETS) {
    let score = 0;
    for (const m of bucket.matchers) {
      if (haystack.includes(m)) score += m.length;
    }
    if (score > bestScore) {
      bestScore = score;
      best = bucket;
    }
  }
  return best;
}

function tokenizePrompt(prompt: string, max = 6): string[] {
  const stop = new Set([
    "the",
    "and",
    "with",
    "for",
    "beat",
    "music",
    "loop",
    "instrumental",
    "producer",
    "style",
    "vibe",
    "mood",
  ]);
  const words = prompt
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stop.has(w));
  const unique: string[] = [];
  for (const w of words) {
    if (!unique.includes(w)) unique.push(w);
    if (unique.length >= max) break;
  }
  return unique;
}

function addTerm(
  map: Map<string, PinterestDiscoveryTerm>,
  query: string,
  delta: number,
  source: PinterestTermSource,
) {
  const q = query.trim().replace(/\s+/g, " ");
  if (q.length < 3) return;
  const prev = map.get(q);
  if (prev) {
    prev.score += delta;
    if (!prev.sources.includes(source)) prev.sources.push(source);
  } else {
    map.set(q, { query: q, score: delta, sources: [source] });
  }
}

function stablePickIndex(seed: number, variant: number, length: number): number {
  if (length <= 1) return 0;
  const mixed = (seed + variant * 7919) >>> 0;
  return mixed % length;
}

/**
 * Génère une liste classée de termes de recherche style Pinterest (aucun fetch image).
 * N'affecte pas les covers tant que le flag preview seul est actif.
 */
export function discoverPinterestCoverTerms(
  loop: Pick<Loop, "id" | "genre" | "mood" | "influence" | "prompt" | "name" | "seed">,
  options?: DiscoverPinterestOptions,
): PinterestDiscoveryResult {
  const template = options?.template ?? "retro-futur";
  const maxTerms = Math.min(24, Math.max(6, options?.maxTerms ?? 16));
  const variant = options?.variant ?? 0;
  const seed = coverImageSeed(loop as Loop);
  const haystack = normalizeHaystack(loop);
  const bucket = detectGenreBucket(haystack);
  const map = new Map<string, PinterestDiscoveryTerm>();

  const generationTitle = pinterestGenerationTitle(loop);
  if (generationTitle.length >= 3) {
    addTerm(map, `${generationTitle} pinterest aesthetic portrait`, 1.12, "prompt");
    for (const word of generationTitle
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length >= 3)) {
      addTerm(map, `${word} editorial portrait ambiance`, 0.88, "prompt");
    }
  }

  for (const t of bucket.terms) addTerm(map, t.query, t.weight, "genre");
  for (const t of TEMPLATE_TERMS[template]) addTerm(map, t.query, t.weight, "template");
  for (const t of VISUAL_BOOSTERS) addTerm(map, t.query, t.weight, "universal");

  for (const moodGroup of MOOD_TERM_MAP) {
    if (!moodGroup.matchers.some((m) => haystack.includes(m))) continue;
    for (const t of moodGroup.terms) addTerm(map, t.query, t.weight, "mood");
  }

  const promptSnippet = (loop.prompt || "").trim().slice(0, 120);
  for (const token of tokenizePrompt(promptSnippet)) {
    addTerm(map, `${token} aesthetic portrait people`, 0.55 + hashString(token) * 0.0000001, "prompt");
  }

  if (loop.genre?.trim()) {
    addTerm(map, `${loop.genre.trim()} pinterest aesthetic`, 0.72, "genre");
  }
  if (loop.mood?.trim()) {
    addTerm(map, `${loop.mood.trim()} editorial portrait ambiance`, 0.65, "mood");
  }

  const ranked = [...map.values()]
    .sort((a, b) => b.score - a.score || a.query.localeCompare(b.query))
    .slice(0, maxTerms);

  const jittered = ranked.map((term, i) => ({
    ...term,
    score: term.score + ((hashString(`${seed}:${term.query}:${variant}`) % 1000) / 10000) * (1 - i * 0.04),
  }));
  jittered.sort((a, b) => b.score - a.score);

  const pickIdx = stablePickIndex(seed, variant, jittered.length);
  const picked = jittered[pickIdx]?.query ?? jittered[0]?.query ?? "music aesthetic streetwear hip hop";

  return {
    terms: jittered,
    picked,
    template,
    genreBucket: bucket.id,
    seed,
    context: {
      genre: loop.genre?.trim() || "",
      mood: loop.mood?.trim() || "",
      promptSnippet,
    },
  };
}

/** Référence future — enrichir un prompt cover sans toucher aux URLs affichées. */
export function buildPinterestEnrichedCoverPrompt(
  loop: Pick<Loop, "id" | "genre" | "mood" | "influence" | "prompt" | "name" | "seed">,
  options?: DiscoverPinterestOptions,
): string {
  const { picked, template } = discoverPinterestCoverTerms(loop, options);
  const suffix =
    template === "retro-futur"
      ? "retro futurism, y2k chrome, portrait editorial, pinterest trending aesthetic"
      : "pinterest aesthetic, editorial portrait people, trending visual";
  return `${picked}, ${suffix}`.slice(0, 200);
}

/** Preview console — uniquement si VITE_PINTEREST_DISCOVERY_PREVIEW=1 */
export function previewPinterestDiscoveryIfEnabled(
  loop: Pick<Loop, "id" | "genre" | "mood" | "influence" | "prompt" | "name" | "seed">,
): PinterestDiscoveryResult | null {
  if (!PINTEREST_DISCOVERY_PREVIEW) return null;
  const result = discoverPinterestCoverTerms(loop, { template: "retro-futur" });
  if (typeof console !== "undefined" && console.groupCollapsed) {
    console.groupCollapsed(
      `[ProducerHit] Pinterest discovery — ${loop.name || loop.id} (${result.genreBucket})`,
    );
    console.table(result.terms.map((t) => ({ query: t.query, score: t.score.toFixed(3), sources: t.sources.join("+") })));
    console.log("picked:", result.picked);
    console.log("enriched cover query:", buildPinterestEnrichedCoverPrompt(loop));
    console.groupEnd();
  }
  return result;
}

if (PINTEREST_DISCOVERY_PREVIEW && typeof window !== "undefined") {
  const w = window as Window & { __phDiscoverPinterest?: typeof discoverPinterestCoverTerms };
  w.__phDiscoverPinterest = discoverPinterestCoverTerms;
}
