import type { Loop } from "@/types/loop";

import type { AppLocale } from "@/i18n/config";
const GEN_SINCE_KEY = "producerhit_share_prompt_gen_since_v2";
const LAST_SHOWN_KEY = "producerhit_share_prompt_last_shown_v2";
const HOURLY_KEY = "producerhit_share_prompt_hourly_v2";

/** Milestones early growth (gen #1, #3, #8) puis cadence ~8 gen, max 3/h. */
const EARLY_MILESTONE_GENS = [1, 3, 8];
const MIN_GENERATIONS_BETWEEN = 8;
/** Minimum delay between two prompts (20 min → max ~3/h). */
const MIN_INTERVAL_MS = 20 * 60 * 1000;
const MAX_PROMPTS_PER_HOUR = 3;
const ONE_HOUR_MS = 60 * 60 * 1000;

type SharePromptCopy = {
  title: string;
  description: string;
  privateHint: string;
  makePublicLabel: string;
  laterLabel: string;
  shareButtonLabel: string;
};

const PROMPTS_FR: SharePromptCopy[] = [
  {
    title: "Wallah ce son mérite d'être partagé 🔥",
    description: "Envoie-le à ton pote — il va dire « eh mec j'ai vu un site de ouf »",
    privateHint: "Astuce : passe en public = lien d'écoute direct pour ta commu.",
    makePublicLabel: "Rendre public pour mes potes",
    laterLabel: "Plus tard j'flex",
    shareButtonLabel: "Flex ce son",
  },
  {
    title: "T'as cook un truc de malade",
    description: "Partage avant que quelqu'un te le vole frérot",
    privateHint: "En public, tes amis écoutent en 1 clic — mode viral activé.",
    makePublicLabel: "Mode viral — passer public",
    laterLabel: "Pas maintenant",
    shareButtonLabel: "Envoyer à la commu",
  },
  {
    title: "No cap c'est hard 🧢",
    description: "Montre ce que tu produces — la fierté se partage naturellement.",
    privateHint: "Privé = tes potes découvrent ProducerHit. Public = écoute directe.",
    makePublicLabel: "Ouvrir l'écoute à tous",
    laterLabel: "Je flex plus tard",
    shareButtonLabel: "Partager ma créa",
  },
  {
    title: "Tes proches vont halluciner",
    description: "WhatsApp, Insta, TikTok… choisis ton canal et fais le buzz.",
    privateHint: "Public = lien straight au track. Go.",
    makePublicLabel: "Lien d'écoute direct",
    laterLabel: "Plus tard",
    shareButtonLabel: "Faire le buzz",
  },
  {
    title: "C'est du cinema ce son 🎬",
    description: "Tu as bossé dessus — partage avec ta commu, tes amis ou ta famille.",
    privateHint: "En public le lien mène straight au track. Sinon ils découvrent l'app.",
    makePublicLabel: "Activer le lien d'écoute",
    laterLabel: "Pas maintenant",
    shareButtonLabel: "Partager avec ma commu",
  },
];

const PROMPTS_EN: SharePromptCopy[] = [
  {
    title: "Bro this track needs to be shared 🔥",
    description: "Send it to your friend — they'll say « this site is insane »",
    privateHint: "Tip: go public = direct listen link for your people.",
    makePublicLabel: "Go public for friends",
    laterLabel: "Flex later",
    shareButtonLabel: "Flex this track",
  },
  {
    title: "You cooked something sick",
    description: "Share before someone steals it fr",
    privateHint: "Public = one-click listen — viral mode on.",
    makePublicLabel: "Viral mode — go public",
    laterLabel: "Not now",
    shareButtonLabel: "Send to the crew",
  },
  {
    title: "No cap it's hard 🧢",
    description: "Show what you made — good music is meant to be shared.",
    privateHint: "Private = friends discover ProducerHit. Public = direct playback.",
    makePublicLabel: "Open listening to all",
    laterLabel: "I'll flex later",
    shareButtonLabel: "Share my track",
  },
  {
    title: "Your people are gonna lose it",
    description: "WhatsApp, Insta, TikTok… pick your channel and make noise.",
    privateHint: "Public = straight to your track. Go.",
    makePublicLabel: "Direct listen link",
    laterLabel: "Later",
    shareButtonLabel: "Make noise",
  },
  {
    title: "This is cinema 🎬",
    description: "You put in the work — share with your community, friends, or family.",
    privateHint: "Public links go straight to your track. Private helps friends discover the app.",
    makePublicLabel: "Enable listen link",
    laterLabel: "Not now",
    shareButtonLabel: "Share with my community",
  },
];

function bumpGenerationsSinceLastPrompt(): number {
  try {
    const raw = window.localStorage.getItem(GEN_SINCE_KEY);
    const prev = raw ? Number(raw) : 0;
    const next = Number.isFinite(prev) && prev >= 0 ? prev + 1 : 1;
    window.localStorage.setItem(GEN_SINCE_KEY, String(next));
    return next;
  } catch {
    return 1;
  }
}

function resetGenerationsSinceLastPrompt(): void {
  try {
    window.localStorage.setItem(GEN_SINCE_KEY, "0");
  } catch {
    // ignore
  }
}

function readHourlyShownTimestamps(now: number): number[] {
  try {
    const raw = window.localStorage.getItem(HOURLY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((n): n is number => typeof n === "number" && now - n < ONE_HOUR_MS);
  } catch {
    return [];
  }
}

function recordSharePromptShown(now: number): void {
  try {
    window.localStorage.setItem(LAST_SHOWN_KEY, String(now));
    const hourly = [...readHourlyShownTimestamps(now), now];
    window.localStorage.setItem(HOURLY_KEY, JSON.stringify(hourly.slice(-MAX_PROMPTS_PER_HOUR)));
  } catch {
    // ignore
  }
}

/**
 * Call after a successful generation/remix.
 * @param lifetimeGenCount — loops_used_this_month après la génération (free/paid)
 */
export function shouldShowSharePromptAfterGeneration(lifetimeGenCount?: number): boolean {
  const since = bumpGenerationsSinceLastPrompt();
  const now = Date.now();
  const lastShownRaw = window.localStorage.getItem(LAST_SHOWN_KEY);
  const lastShown = lastShownRaw ? Number(lastShownRaw) : 0;
  const intervalOk = !Number.isFinite(lastShown) || lastShown <= 0 || now - lastShown >= MIN_INTERVAL_MS;
  const hourly = readHourlyShownTimestamps(now);
  const hourlyOk = hourly.length < MAX_PROMPTS_PER_HOUR;

  if (!intervalOk || !hourlyOk) return false;

  if (typeof lifetimeGenCount === "number" && EARLY_MILESTONE_GENS.includes(lifetimeGenCount)) {
    resetGenerationsSinceLastPrompt();
    recordSharePromptShown(now);
    return true;
  }

  if (since < MIN_GENERATIONS_BETWEEN) return false;

  resetGenerationsSinceLastPrompt();
  recordSharePromptShown(now);
  return true;
}

export function pickSharePromptCopy(locale: AppLocale, seed?: string): SharePromptCopy {
  const pool = locale === "fr" ? PROMPTS_FR : PROMPTS_EN;
  let index = Math.floor(Math.random() * pool.length);
  if (seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    index = hash % pool.length;
  }
  return pool[index] ?? pool[0]!;
}

function isPlayableLoop(loop: Loop): boolean {
  return typeof loop.audioUrl === "string" && loop.audioUrl.trim().length > 0;
}

/** Pick an older track for share prompts — Pollinations cover is usually warmed already. */
export function pickLoopForSharePrompt(loops: Loop[], excludeIds: string[] = [], seed = ""): Loop | null {
  const exclude = new Set(excludeIds);
  const eligible = loops.filter((l) => isPlayableLoop(l) && !exclude.has(l.id));
  const fallback = loops.find((l) => isPlayableLoop(l)) ?? null;
  if (!eligible.length) return fallback;

  const sorted = [...eligible].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const skipFresh = Math.min(1, sorted.length - 1);
  const olderPool = sorted.slice(skipFresh);
  const pool = (olderPool.length > 0 ? olderPool : sorted).slice(0, Math.min(12, sorted.length));
  if (pool.length === 1) return pool[0]!;

  let hash = 0;
  const mix = `${seed}:${excludeIds.join(",")}:${pool.map((l) => l.id).join(",")}`;
  for (let i = 0; i < mix.length; i++) hash = (hash * 31 + mix.charCodeAt(i)) >>> 0;
  return pool[hash % pool.length] ?? pool[0] ?? fallback;
}

export function buildShareMessage(loopName: string, locale: AppLocale, isPublic: boolean): string {
  if (locale === "fr") {
    return isPublic
      ? `Écoute « ${loopName} » que j'ai produit sur ProducerHit — site de ouf 🎵`
      : `Eh mec j'ai trouvé un site de ouf pour produire — viens tester avec moi 🎵 « ${loopName} »`;
  }
  return isPublic
    ? `Listen to "${loopName}" I made on ProducerHit — insane site 🎵`
    : `Bro I found the craziest AI studio — come try it with me 🎵 "${loopName}"`;
}
