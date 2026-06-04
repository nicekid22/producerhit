import { supabase } from "@/lib/supabaseClient";
import {
  COMMUNITY_PINTEREST_FOREGROUND,
  LANDING_PINTEREST_COVERS,
  LANDING_PINTEREST_SEARCH_TAGS,
  PINTEREST_PERSIST_COVERS,
} from "@/lib/featureFlags";
import type { Loop } from "@/types/loop";
import { hashString } from "@/lib/utils";
import type { GeneratorSideCard } from "@/components/landing/LandingGenerator";

const SESSION_CACHE_KEY = "ph_pinterest_cover_urls_v2";
const SESSION_TTL_MS = 30 * 60 * 1000;
const memoryCache = new Map<string, { url: string; ts: number }>();
const preloadedUrls = new Set<string>();

let warmPromise: Promise<string[]> | null = null;

/** Lazy Pinterest désactivé quand les covers sont persistées en Storage (même URL partout). */
function pinterestApiEnabled(): boolean {
  if (PINTEREST_PERSIST_COVERS) return false;
  return LANDING_PINTEREST_COVERS || COMMUNITY_PINTEREST_FOREGROUND;
}

/** Flux communauté — fetch Pinterest à la volée si pas de cover persistée (sans écrire en DB). */
export function communityCoverFetchEnabled(): boolean {
  if (COMMUNITY_PINTEREST_FOREGROUND) return true;
  if (import.meta.env.VITE_COMMUNITY_COVER_LAZY === "0") return false;
  return PINTEREST_PERSIST_COVERS;
}

/** Tags fixes (.env) — ex. retro purple, streetwear, girl */
export function landingPinterestSearchQuery(): string {
  if (LANDING_PINTEREST_SEARCH_TAGS.length > 0) {
    return LANDING_PINTEREST_SEARCH_TAGS.join(" ");
  }
  return "streetwear";
}

export type PinterestStyleInput = {
  genre?: string | null;
  mood?: string | null;
  name?: string | null;
  prompt?: string | null;
};

/** Titre de génération (genre par défaut ou titre/idée modifié par l'utilisateur). */
export function pinterestGenerationTitle(input: PinterestStyleInput): string {
  const name = (input.name ?? "").trim();
  const cleaned = name
    .replace(/[^a-zA-Z0-9À-ÿ\s'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length >= 2 && !/^untitled$/i.test(cleaned)) return cleaned.slice(0, 48);
  const genre = (typeof input.genre === "string" ? input.genre : "").trim();
  if (genre.length >= 2) return genre.slice(0, 48);
  const prompt = (typeof input.prompt === "string" ? input.prompt : "").trim();
  const snippet = prompt.split(/[,.]/)[0]?.trim() ?? "";
  if (snippet.length >= 3 && snippet.length <= 48) return snippet;
  return "";
}

/** Tags style + mood (sans le titre — composé avec pinterestGenerationTitle). */
export function buildPinterestStyleTail(input: PinterestStyleInput, slotIndex = 0): string {
  const base = landingPinterestSearchQuery();
  const musicStyle = [input.genre, input.mood]
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter((s) => s.length > 1);
  const title = pinterestGenerationTitle(input);
  const variant = queryVariantToken(input, slotIndex);
  const parts = [base, ...musicStyle];
  if (variant && !title.toLowerCase().includes(variant.toLowerCase())) parts.push(variant);
  parts.push("music aesthetic", "people portrait ambiance");
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

/** Mot-clé court dérivé du titre pour diversifier la recherche Pinterest. */
function queryVariantToken(input: PinterestStyleInput, slotIndex: number): string {
  const name = (input.name ?? "").trim();
  const words = name
    .replace(/[^a-zA-Z0-9À-ÿ\s-]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3)
    .slice(0, 2);
  if (words.length) return words.join(" ");
  const id = (input as { id?: string }).id;
  if (typeof id === "string" && id.length > 4) return id.slice(-6);
  return `set${slotIndex}`;
}

/** Requête Pinterest — titre de génération en premier, puis tags + style musical. */
export function buildPinterestSearchQueryForStyle(input: PinterestStyleInput, slotIndex = 0): string {
  const title = pinterestGenerationTitle(input);
  const tail = buildPinterestStyleTail(input, slotIndex);
  const parts = [title, tail].filter((p) => p.length > 0);
  return parts.join(" ").replace(/\s+/g, " ").trim().slice(0, 100);
}

/** Requête Pinterest = tags fixes + style musical du morceau (genre, mood). */
export function buildPinterestSearchQueryForCard(
  card: Pick<GeneratorSideCard, "genre" | "mood" | "name" | "prompt">,
  slotIndex = 0,
): string {
  return buildPinterestSearchQueryForStyle(card, slotIndex);
}

/** Choisit une URL Pinterest unique (jamais la même sur la session d’enrichissement). */
async function fetchUniquePinterestCover(
  query: string,
  seed: number,
  usedUrls: Set<string>,
): Promise<string | null> {
  const q = query.trim() || landingPinterestSearchQuery();

  for (let attempt = 0; attempt < 6; attempt++) {
    const attemptSeed = (seed + attempt * 9973) >>> 0;
    const cached = getCachedUrl(q, attemptSeed);
    if (cached && !usedUrls.has(cached)) {
      usedUrls.add(cached);
      preloadPinterestCoverUrl(cached);
      return cached;
    }

    const { data, error } = await supabase.functions.invoke("fetch-pinterest-cover", {
      body: { query: q, seed: attemptSeed, count: 12 },
    });

    if (error) {
      if (import.meta.env.DEV && attempt === 0) {
        console.warn("[ProducerHit] fetch-pinterest-cover:", await extractInvokeError(error));
      }
      continue;
    }

    const list = Array.isArray(data?.imageUrls)
      ? (data.imageUrls as unknown[]).filter((u): u is string => typeof u === "string" && u.startsWith("http"))
      : [];
    const single =
      typeof data?.imageUrl === "string" && data.imageUrl.startsWith("http") ? [data.imageUrl as string] : [];
    const pool = list.length ? list : single;

    for (let i = 0; i < pool.length; i++) {
      const url = pool[i]!;
      if (usedUrls.has(url)) continue;
      usedUrls.add(url);
      setCachedUrl(q, attemptSeed + i, url);
      preloadPinterestCoverUrl(url);
      return url;
    }
  }

  return null;
}

/** Images Pinterest pour les cartes « communauté » de la landing (non bloquant). */
export async function enrichTracksWithPinterestCovers<
  T extends PinterestStyleInput & { id: string },
>(tracks: T[]): Promise<Array<T & { pinterestCoverUrl: string | null }>> {
  if (!LANDING_PINTEREST_COVERS || tracks.length === 0) {
    return tracks.map((t) => ({ ...t, pinterestCoverUrl: null }));
  }

  const usedUrls = new Set<string>();
  const byId = new Map<string, string | null>();

  for (let index = 0; index < tracks.length; index++) {
    const track = tracks[index]!;
    const query = buildPinterestSearchQueryForStyle(track, index);
    const seed = (hashString(`${track.id}:${query}:${index}`) + index * 47) >>> 0;
    const url = await fetchUniquePinterestCover(query, seed, usedUrls);
    byId.set(track.id, url);
  }

  return tracks.map((t) => ({
    ...t,
    pinterestCoverUrl: byId.get(t.id) ?? null,
  }));
}

export function isPinterestSideCard(card: GeneratorSideCard): boolean {
  return card.coverUrl.includes("pinimg.com");
}

export function isPinterestCoverPreloaded(url: string): boolean {
  return preloadedUrls.has(url);
}

function cacheKey(query: string, seed: number): string {
  return `${query}:${seed}`;
}

function readSessionCache(): Record<string, { url: string; ts: number }> {
  try {
    const raw = sessionStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, { url: string; ts: number }>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeSessionCache(entry: Record<string, { url: string; ts: number }>): void {
  try {
    sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(entry));
  } catch {
    // ignore quota
  }
}

function getCachedUrl(query: string, seed: number): string | null {
  const key = cacheKey(query, seed);
  const now = Date.now();
  const mem = memoryCache.get(key);
  if (mem && now - mem.ts < SESSION_TTL_MS) return mem.url;

  const session = readSessionCache();
  const hit = session[key];
  if (hit && now - hit.ts < SESSION_TTL_MS) {
    memoryCache.set(key, hit);
    return hit.url;
  }
  return null;
}

function setCachedUrl(query: string, seed: number, url: string): void {
  const key = cacheKey(query, seed);
  const row = { url, ts: Date.now() };
  memoryCache.set(key, row);
  const session = readSessionCache();
  session[key] = row;
  writeSessionCache(session);
}

const workspaceUsedPinterestUrls = new Set<string>();

/** Dashboard — 1 URL Pinterest stable par morceau (session, jusqu’au refresh). */
const WORKSPACE_LOOP_PIN_KEY = "ph_workspace_pinterest_by_loop_v1";
const workspaceCoverByLoopId = new Map<string, string>();

function readWorkspaceLoopPinSession(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem(WORKSPACE_LOOP_PIN_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeWorkspaceLoopPinSession(entries: Record<string, string>): void {
  try {
    sessionStorage.setItem(WORKSPACE_LOOP_PIN_KEY, JSON.stringify(entries));
  } catch {
    // ignore quota
  }
}

function rememberWorkspacePinterestCover(loopId: string, url: string): void {
  workspaceCoverByLoopId.set(loopId, url);
  const session = readWorkspaceLoopPinSession();
  session[loopId] = url;
  writeWorkspaceLoopPinSession(session);
}

/** URL Pinterest déjà résolue pour ce morceau (mémoire + sessionStorage). */
export function getCachedWorkspacePinterestCover(loopId: string): string | null {
  const mem = workspaceCoverByLoopId.get(loopId);
  if (mem?.startsWith("http")) return mem;

  const session = readWorkspaceLoopPinSession();
  const hit = session[loopId];
  if (typeof hit === "string" && hit.startsWith("http")) {
    workspaceCoverByLoopId.set(loopId, hit);
    preloadPinterestCoverUrl(hit);
    return hit;
  }
  return null;
}

/**
 * Dashboard / Mon espace — une image Pinterest par loop.id (stable, cache session).
 * Réutilise la même URL entre bannière carte et panneau détails.
 */
export async function fetchWorkspacePinterestCover(
  item: PinterestStyleInput & { id: string },
): Promise<string | null> {
  const cached = getCachedWorkspacePinterestCover(item.id);
  if (cached) return cached;

  if (!pinterestApiEnabled()) return null;

  const query = buildPinterestSearchQueryForStyle(item, 0);
  const seed = hashString(`${item.id}:workspace:${query}`) >>> 0;
  const url = await fetchUniquePinterestCover(query, seed, workspaceUsedPinterestUrls);
  if (!url?.startsWith("http")) return null;

  rememberWorkspacePinterestCover(item.id, url);
  await preloadPinterestCoverUrlAsync(url);
  return url;
}

/** Précharge dans le cache navigateur pour affichage immédiat. */
export function preloadPinterestCoverUrl(url: string): void {
  if (!url.startsWith("http")) return;
  if (preloadedUrls.has(url)) return;
  const img = new Image();
  img.referrerPolicy = "no-referrer";
  img.decoding = "async";
  img.onload = () => preloadedUrls.add(url);
  img.onerror = () => preloadedUrls.delete(url);
  img.src = url;
}

/** Précharge puis résout quand l’image est décodée (évite le « pop » visuel). */
export function preloadPinterestCoverUrlAsync(url: string): Promise<boolean> {
  if (!url.startsWith("http")) return Promise.resolve(false);
  if (preloadedUrls.has(url)) return Promise.resolve(true);
  return new Promise((resolve) => {
    const img = new Image();
    img.referrerPolicy = "no-referrer";
    img.decoding = "async";
    img.onload = () => {
      preloadedUrls.add(url);
      resolve(true);
    };
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

/** Une cover Pinterest pour un morceau / carte (lazy scroll). */
export async function fetchPinterestCoverForStyle(
  item: PinterestStyleInput & { id: string },
  slotIndex = 0,
): Promise<string | null> {
  if (!pinterestApiEnabled() && !communityCoverFetchEnabled()) return null;
  const query = buildPinterestSearchQueryForStyle(item, slotIndex);
  const seed = (hashString(`${item.id}:${query}:${slotIndex}`) + slotIndex * 53) >>> 0;
  const url = await fetchUniquePinterestCover(query, seed, workspaceUsedPinterestUrls);
  if (!url?.startsWith("http")) return null;
  await preloadPinterestCoverUrlAsync(url);
  return url;
}

async function extractInvokeError(error: unknown): Promise<string> {
  const anyError = error as { message?: string; context?: unknown };
  const errContext = anyError.context;
  if (errContext && typeof errContext === "object" && typeof (errContext as Response).text === "function") {
    try {
      const text = await (errContext as Response).text();
      const parsed = JSON.parse(text) as { error?: string };
      if (typeof parsed.error === "string") return parsed.error;
      if (text.trim()) return text.trim();
    } catch {
      // ignore
    }
  }
  return anyError.message ?? "invoke_failed";
}

export async function fetchPinterestCoverForLoop(
  loop: Pick<Loop, "id" | "genre" | "mood" | "name" | "prompt">,
  slotIndex = 0,
): Promise<string | null> {
  if (!pinterestApiEnabled()) return null;
  const query = buildPinterestSearchQueryForStyle(loop, slotIndex);
  const seed = (hashString(`${loop.id}:${query}`) + slotIndex * 53) >>> 0;
  return fetchUniquePinterestCover(query, seed, workspaceUsedPinterestUrls);
}

/** Map id → URL Pinterest (flux communauté). */
export async function fetchPinterestCoversForStyles<T extends PinterestStyleInput & { id: string }>(
  items: T[],
): Promise<Record<string, string>> {
  if (!pinterestApiEnabled() || !items.length) return {};
  const usedUrls = new Set<string>();
  const out: Record<string, string> = {};
  for (let index = 0; index < items.length; index++) {
    const item = items[index]!;
    const query = buildPinterestSearchQueryForStyle(item, index);
    const seed = (hashString(`${item.id}:${query}:${index}`) + index * 41) >>> 0;
    const url = await fetchUniquePinterestCover(query, seed, usedUrls);
    if (url?.startsWith("http")) out[item.id] = url;
  }
  return out;
}

/** 1 appel Pinterest pour une requête donnée. */
export async function fetchPinterestCoverForQuery(query: string, seed = 0): Promise<string | null> {
  if (!pinterestApiEnabled()) return null;

  const q = query.trim() || landingPinterestSearchQuery();
  const cached = getCachedUrl(q, seed);
  if (cached) {
    preloadPinterestCoverUrl(cached);
    return cached;
  }

  const { data, error } = await supabase.functions.invoke("fetch-pinterest-cover", {
    body: { query: q, seed, count: 1 },
  });

  if (error) {
    if (import.meta.env.DEV) {
      console.warn("[ProducerHit] fetch-pinterest-cover:", await extractInvokeError(error));
    }
    return null;
  }

  const url =
    (typeof data?.imageUrl === "string" && data.imageUrl.startsWith("http") ? data.imageUrl : null) ??
    (Array.isArray(data?.imageUrls) ? (data.imageUrls[0] as string) : null);

  if (!url?.startsWith("http")) return null;

  setCachedUrl(q, seed, url);
  preloadPinterestCoverUrl(url);
  return url;
}

/** Plusieurs images pour la même requête (legacy / warm). */
export async function fetchPinterestCoverBatch(
  count = 2,
  seed = 0,
  query?: string,
): Promise<string[]> {
  if (!pinterestApiEnabled()) return [];

  const q = (query ?? landingPinterestSearchQuery()).trim();
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const cached = getCachedUrl(q, seed + i);
    if (cached) {
      out.push(cached);
      preloadPinterestCoverUrl(cached);
    }
  }
  if (out.length >= count) return out.slice(0, count);

  const { data, error } = await supabase.functions.invoke("fetch-pinterest-cover", {
    body: { query: q, seed, count },
  });

  if (error) {
    if (import.meta.env.DEV) {
      console.warn("[ProducerHit] fetch-pinterest-cover:", await extractInvokeError(error));
    }
    return out;
  }

  const list = Array.isArray(data?.imageUrls)
    ? (data.imageUrls as unknown[]).filter((u): u is string => typeof u === "string" && u.startsWith("http"))
    : [];
  const single = typeof data?.imageUrl === "string" && data.imageUrl.startsWith("http") ? [data.imageUrl] : [];
  const merged = list.length ? list : single;

  merged.slice(0, count).forEach((url, i) => {
    setCachedUrl(q, seed + i, url);
    preloadPinterestCoverUrl(url);
    out[i] = url;
  });

  return out.filter(Boolean).slice(0, count);
}

/** Applique des URLs Pinterest (requête par carte pour le tooltip). */
export function applyPinterestUrlsToSideCards(
  cards: GeneratorSideCard[],
  entries: Array<{ url: string; query: string }>,
): GeneratorSideCard[] {
  return cards.map((card, index) => {
    const entry = entries[index];
    if (!entry?.url.startsWith("http")) return card;
    preloadPinterestCoverUrl(entry.url);
    return {
      ...card,
      coverUrlFallback: card.coverUrlFallback ?? card.coverUrl,
      coverUrl: entry.url,
      coverPinterestQuery: entry.query,
    };
  });
}

/** Une image Pinterest par carte — requête = tags fixes + genre/mood du morceau. */
export async function resolveSideCardsWithPinterest(cards: GeneratorSideCard[]): Promise<GeneratorSideCard[]> {
  if (!LANDING_PINTEREST_COVERS || cards.length === 0) return cards;

  const usedUrls = new Set<string>();
  const entries: Array<{ url: string; query: string }> = [];
  for (let index = 0; index < cards.length; index++) {
    const card = cards[index]!;
    const query = buildPinterestSearchQueryForCard(card, index);
    const seed = (hashString(`${card.id}:${query}:${index}`) + index * 19) >>> 0;
    const url = (await fetchUniquePinterestCover(query, seed, usedUrls)) ?? "";
    entries.push({ url, query });
  }

  const valid = entries.filter((e) => e.url.startsWith("http"));
  if (!valid.length) return cards;

  return applyPinterestUrlsToSideCards(
    cards,
    entries.map((e) => ({ url: e.url, query: e.query })),
  );
}

/** Précharge l’Edge + cache générique (tags fixes sans genre). */
export function warmLandingPinterestCovers(): Promise<string[]> {
  if (!LANDING_PINTEREST_COVERS) return Promise.resolve([]);
  warmPromise ??= fetchPinterestCoverBatch(2, 0, landingPinterestSearchQuery());
  return warmPromise;
}

/** @deprecated Utiliser resolveSideCardsWithPinterest */
export async function enrichSideCardsWithPinterestCovers(
  cards: GeneratorSideCard[],
): Promise<GeneratorSideCard[]> {
  return resolveSideCardsWithPinterest(cards);
}
