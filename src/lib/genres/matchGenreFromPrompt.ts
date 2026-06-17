import { CUSTOM_GENRE_OPTIONS, pickRandomGenreValue } from "@/lib/genres/genrePickMode";

const CATALOG_VALUES = new Set(CUSTOM_GENRE_OPTIONS.map((o) => o.value));

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Minuscules, sans accents — pour recherche dans l’idée utilisateur. */
export function normalizePromptForGenreMatch(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[+/_-]/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsPhrase(hay: string, phrase: string): boolean {
  const p = normalizePromptForGenreMatch(phrase);
  if (!p) return false;
  const padded = ` ${hay} `;
  if (p.includes(" ")) {
    return padded.includes(` ${p} `);
  }
  if (p.length <= 4) {
    return new RegExp(`(?:^|[\\s])${escapeRegExp(p)}(?:$|[\\s])`).test(hay);
  }
  return padded.includes(` ${p} `);
}

/** Règles mot-clé (ordre = phrases longues d’abord) — valeurs du catalogue uniquement. */
function matchGenreByKeywordRules(hay: string): string | null {
  const rules: Array<{ test: (s: string) => boolean; genre: string }> = [
    { test: (s) => s.includes("pluggnb") || s.includes("pluggn"), genre: "PluggnB" },
    { test: (s) => s.includes("rage ambient") || s.includes("rage + ambient"), genre: "Rage + Ambient" },
    { test: (s) => s.includes("experimental rage"), genre: "Experimental Rage" },
    { test: (s) => s.includes("dark r and b") || s.includes("dark rnb"), genre: "Dark R&B" },
    { test: (s) => s.includes("future r and b") || s.includes("future rnb"), genre: "Future R&B" },
    { test: (s) => s.includes("toxic r and b") || s.includes("toxic rnb"), genre: "Toxic R&B" },
    { test: (s) => s.includes("afro r and b") || s.includes("afro rnb"), genre: "Afro R&B" },
    { test: (s) => s.includes("holographic r and b"), genre: "Holographic R&B" },
    { test: (s) => s.includes("sci fi r and b") || s.includes("sci-fi r and b"), genre: "Sci-Fi R&B" },
    { test: (s) => s.includes("afro house"), genre: "Afro House" },
    { test: (s) => s.includes("cloud rap"), genre: "Cloud Rap" },
    { test: (s) => s.includes("emo rap"), genre: "Emo Rap" },
    { test: (s) => s.includes("sad rap"), genre: "Sad Rap" },
    { test: (s) => s.includes("atmospheric rap"), genre: "Atmospheric Rap" },
    { test: (s) => s.includes("ambient drill"), genre: "Ambient Drill" },
    { test: (s) => s.includes("sample drill"), genre: "Sample Drill" },
    { test: (s) => s.includes("melodic drill"), genre: "Melodic Drill" },
    { test: (s) => s.includes("ambient trap"), genre: "Ambient Trap" },
    { test: (s) => s.includes("cinematic trap"), genre: "Cinematic Trap" },
    { test: (s) => s.includes("experimental trap"), genre: "Experimental Trap" },
    { test: (s) => s.includes("emotional trap"), genre: "Emotional Trap" },
    { test: (s) => s.includes("futuristic trap soul"), genre: "Futuristic Trap Soul" },
    { test: (s) => s.includes("cinematic afro trap"), genre: "Cinematic Afro Trap" },
    { test: (s) => s.includes("experimental afro house"), genre: "Experimental Afro House" },
    { test: (s) => s.includes("hyper melodic rap"), genre: "Hyper Melodic Rap" },
    { test: (s) => s.includes("dark atmospheric pop"), genre: "Dark Atmospheric Pop" },
    { test: (s) => s.includes("y2k") && s.includes("pop"), genre: "Y2K Futuristic Pop" },
    { test: (s) => s.includes("hybrid electronic rap"), genre: "Hybrid Electronic Rap" },
    { test: (s) => s.includes("ethereal trap"), genre: "Ethereal Trap" },
    { test: (s) => s.includes("nostalgic future"), genre: "Nostalgic Future Beats" },
    { test: (s) => s.includes("study beat"), genre: "Study Beats" },
    { test: (s) => s.includes("brazilian phonk"), genre: "Brazilian Phonk" },
    { test: (s) => s.includes("vinahouse"), genre: "VinaHouse" },
    { test: (s) => s.includes("k pop") || s.includes("kpop"), genre: "K-Pop" },
    { test: (s) => s.includes("jersey drill"), genre: "Jersey Drill" },
    { test: (s) => s.includes("uk drill"), genre: "UK Drill" },
    { test: (s) => s.includes("ny drill"), genre: "NY Drill" },
    {
      test: (s) => s.includes("hip hop") || s.includes("hiphop") || s.includes("hip-hop"),
      genre: "Contemporary Rap",
    },
    {
      test: (s) => /(?:^|\s)rap(?:$|\s)/.test(s) && !s.includes("trap"),
      genre: "Contemporary Rap",
    },
    { test: (s) => s.includes("boom bap") || s.includes("boombap") || s.includes("old school"), genre: "Old School Hip-Hop" },
    { test: (s) => s.includes("uk garage") || s.includes("2 step"), genre: "UK Garage" },
    { test: (s) => s.includes("trap soul") || s.includes("trapsoul"), genre: "Trapsoul" },
    { test: (s) => s.includes("afrobeats") || (s.includes("afro") && !s.includes("afro house") && !s.includes("afro r")), genre: "Afrobeats" },
    { test: (s) => s.includes("drill"), genre: "Drill" },
    { test: (s) => s.includes("r and b") || s.includes("rnb"), genre: "90s R&B" },
    { test: (s) => s.includes("dubstep"), genre: "Dubstep" },
    { test: (s) => s.includes("chillstep"), genre: "Chillstep" },
    { test: (s) => s.includes("synthwave") || s.includes("synth wave"), genre: "Synthwave" },
    { test: (s) => s.includes("vaporwave"), genre: "Vaporwave" },
    { test: (s) => s.includes("witch house"), genre: "Witch House" },
    { test: (s) => s.includes("glitchcore"), genre: "Glitchcore" },
    { test: (s) => s.includes("digicore"), genre: "Digicore" },
    { test: (s) => s.includes("reggae"), genre: "Reggae" },
    { test: (s) => s.includes("latin"), genre: "Latin" },
    { test: (s) => s.includes("rage"), genre: "Rage" },
    { test: (s) => s.includes("edm"), genre: "EDM" },
    { test: (s) => s.includes("trap"), genre: "Dark Trap" },
    { test: (s) => s.includes("pop"), genre: "Pop" },
  ];

  for (const { test, genre } of rules) {
    if (test(hay) && CATALOG_VALUES.has(genre)) return genre;
  }
  return null;
}

/** Cherche un genre du menu dont le nom / label apparaît dans le prompt. */
export function matchGenreFromPrompt(prompt: string): string | null {
  const hay = normalizePromptForGenreMatch(prompt);
  if (!hay) return null;

  const sorted = [...CUSTOM_GENRE_OPTIONS].sort(
    (a, b) => normalizePromptForGenreMatch(b.value).length - normalizePromptForGenreMatch(a.value).length,
  );

  for (const opt of sorted) {
    if (containsPhrase(hay, opt.value)) return opt.value;
    if (opt.label && containsPhrase(hay, opt.label)) return opt.value;
  }

  return matchGenreByKeywordRules(hay);
}

/** Landing / handoff : genre catalogue si détecté, sinon tirage aléatoire (mode custom). */
export function resolveGenreForLandingPrompt(prompt: string): {
  formGenre: string;
  matchedFromPrompt: boolean;
} {
  const matched = matchGenreFromPrompt(prompt);
  if (matched) {
    return { formGenre: matched, matchedFromPrompt: true };
  }
  return { formGenre: pickRandomGenreValue(), matchedFromPrompt: false };
}
