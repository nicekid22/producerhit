import type { Loop } from "@/types/loop";
import { parseStemsUrl } from "@/lib/publicLoops";

import type { CoverKind } from "@/lib/coverMedia";

import { USE_POLLINATIONS_CARD_COVERS } from "@/lib/featureFlags";
import { coverUrlFromLoop, coverUrlFromLoopRow } from "@/lib/loopCoverUrl";
import { buildCoverPromptSnapshot, hashString } from "@/lib/utils";

export { persistLoopCover, saveLoopCoverUrl } from "@/lib/loopCoverUrl";



/**

 * Rollback perf / covers : passer à `false` pour revenir aux URLs externes à la volée.

 */

export const USE_PERSISTED_COVER_URL = true;



const LEGACY_POLLINATIONS_HOSTS = ["pollinations.ai", "image.pollinations.ai"] as const;



export type AceCoverFields = {

  coverPrompt?: string;

  coverUrl?: string;

  coverKind?: CoverKind;

};



export type CoverPersistResult = {

  coverUrl: string | null;

  coverKind?: CoverKind;

};



export function parseAceCoverFields(stemsUrl: unknown): AceCoverFields {

  const stems = parseStemsUrl(stemsUrl);

  if (!stems) return {};

  const ace = stems.ace;

  if (!ace || typeof ace !== "object") return {};

  const obj = ace as Record<string, unknown>;

  const coverPrompt = typeof obj.coverPrompt === "string" ? obj.coverPrompt.trim() : undefined;

  const coverUrl = typeof obj.coverUrl === "string" ? obj.coverUrl.trim() : undefined;

  const coverKindRaw = obj.coverKind;

  const coverKind = coverKindRaw === "video" || coverKindRaw === "image" ? coverKindRaw : undefined;

  return {

    coverPrompt: coverPrompt || undefined,

    coverUrl: coverUrl && (coverUrl.startsWith("http://") || coverUrl.startsWith("https://")) ? coverUrl : undefined,

    coverKind,

  };

}



function isStoredVideoCover(loop: Loop, url: string): boolean {

  if (loop.details?.coverKind === "video") return true;

  const lower = url.toLowerCase();

  return lower.includes("/loop-covers/") && lower.endsWith(".mp4");

}



/** Cover enregistrée dans loop-covers (Pinterest persistée ou média stocké). */

export function isPersistedStorageCoverUrl(url: string | null | undefined): boolean {

  const u = (url ?? "").trim().toLowerCase();

  if (!u.startsWith("http")) return false;

  return u.includes("/loop-covers/") || (u.includes("supabase.co/storage") && u.includes("loop-covers"));

}



/** Cover Pinterest affichable (Storage ou pinimg en attendant le déploiement persist). */

export function isDisplayablePinterestCoverUrl(url: string | null | undefined): boolean {

  const u = (url ?? "").trim().toLowerCase();

  if (!u.startsWith("http")) return false;

  return isPersistedStorageCoverUrl(u) || u.includes("pinimg.com");

}



export function isPollinationsCoverUrl(url: string | null | undefined): boolean {

  const u = (url ?? "").trim().toLowerCase();

  if (!u) return false;

  return LEGACY_POLLINATIONS_HOSTS.some((h) => u.includes(h));

}



/** Morceau sans cover Storage (à assigner). */
export function needsLoopCardCover(loop: Loop): boolean {
  if (!USE_POLLINATIONS_CARD_COVERS) return false;

  const stored = loop.details?.coverUrl?.trim() ?? "";
  if (!stored) return true;
  if (isPersistedStorageCoverUrl(stored)) return false;
  return true;
}

/** @deprecated Utiliser needsLoopCardCover */
export function needsPinterestCover(loop: Loop): boolean {
  return needsLoopCardCover(loop);
}



/** Ancienne cover pinimg en DB — à remplacer par Pollinations Storage. */
export function needsPinimgStorageUpgrade(loop: Loop): boolean {
  const stored = loop.details?.coverUrl?.trim() ?? "";
  return stored.includes("pinimg.com") && !isPersistedStorageCoverUrl(stored);
}



/** URL d’affichage unique pour une carte — workspace, community, landing, détail, player. */

export function resolveLoopDisplayCoverUrl(loop: Loop, _size = 512): string {

  return resolveCoverImageUrl(loop, _size);

}



export function resolveCoverImageUrl(loop: Loop, _size = 512): string {
  const stored = resolveStoredCoverUrl(loop);
  if (USE_PERSISTED_COVER_URL && stored && !isStoredVideoCover(loop, stored)) {
    return stored;
  }
  return "";
}



/** Cover pour une row publique : URL persistée uniquement. */

export function resolvePublicRowCoverUrl(

  row: Parameters<typeof publicRowToCoverLoop>[0],

  size = 512,

): string {

  return resolveCoverImageUrl(publicRowToCoverLoop(row), size);

}



/** Flux communauté — cover persistée uniquement (Pinterest Storage). */

export function resolveCommunityDisplayCoverUrl(

  row: Parameters<typeof publicRowToCoverLoop>[0],

  size = 512,

): string {

  return resolvePublicRowCoverUrl(row, size);

}



/** Player dock — cover persistée uniquement. */

export function resolvePlayerDisplayCoverUrl(loop: Loop, size = 96): string {

  return resolveLoopDisplayCoverUrl(loop, size);

}



export function loopDetailsFromAceStems(stemsUrl: unknown): Loop["details"] {

  const ace = parseAceCoverFields(stemsUrl);

  if (!ace.coverPrompt && !ace.coverUrl) return null;

  return {

    coverPrompt: ace.coverPrompt,

    coverUrl: ace.coverUrl,

    coverKind: ace.coverKind,

  };

}



export function mergeCoverIntoStems(
  stemsUrl: unknown,
  coverUrl: string,
  coverKind?: CoverKind,
): Record<string, unknown> | null {
  const trimmed = coverUrl.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) return parseStemsUrl(stemsUrl);
  const base = parseStemsUrl(stemsUrl) ?? {};
  const existingAce =
    base.ace && typeof base.ace === "object" && base.ace !== null ? (base.ace as Record<string, unknown>) : {};
  return {
    ...base,
    ace: {
      ...existingAce,
      coverUrl: trimmed,
      ...(coverKind ? { coverKind } : {}),
    },
  };
}

/** Lit la cover — colonne loops.cover_url puis details / stems legacy. */
export function resolveStoredCoverUrl(loop: Pick<Loop, "details" | "stemsUrl">): string {
  return coverUrlFromLoop(loop);
}



/** @deprecated use mergeCoverIntoStems */

export function mergeCoverUrlIntoStems(stemsUrl: unknown, coverUrl: string): Record<string, unknown> | null {

  return mergeCoverIntoStems(stemsUrl, coverUrl, "image");

}



export function publicRowToCoverLoop(row: {

  id: string;

  name: string | null;

  genre: string | null;

  influence?: string | null;

  mood: string | null;

  bpm: number | null;

  prompt: string | null;

  audio_url?: string | null;

  stems_url?: unknown;

  cover_url?: string | null;

  created_at?: string | null;

  seed?: number | null;

}): Loop {

  const ace = parseAceCoverFields(row.stems_url);

  const resolvedCover = coverUrlFromLoopRow(row);

  const name = (row.name ?? "Untitled").trim() || "Untitled";

  const genre = (row.genre ?? "").trim();

  const mood = (row.mood ?? "").trim();

  const prompt = (row.prompt ?? "").trim() || [name, genre, mood].filter(Boolean).join(", ");

  return {

    id: row.id,

    name,

    genre: genre || "",

    influence: (row.influence ?? "").trim() || "No Influence",

    key: "",

    scale: "",

    bpm: typeof row.bpm === "number" ? row.bpm : 0,

    loopLength: "16 bars",

    swing: 0,

    mood: mood || "",

    energyLevel: "Medium",

    reverb: "Subtle",

    prompt,

    audioUrl: typeof row.audio_url === "string" ? row.audio_url.trim() || null : null,

    seed: typeof row.seed === "number" ? row.seed : null,

    details:
      resolvedCover || ace.coverPrompt
        ? {
            coverPrompt: ace.coverPrompt,
            coverUrl: resolvedCover || ace.coverUrl,
            coverKind: ace.coverKind ?? (resolvedCover ? "image" : undefined),
          }
        : null,

    stemsUrl: parseStemsUrl(row.stems_url),

    isSaved: false,

    isPublic: true,

    createdAt: row.created_at ?? new Date().toISOString(),

  };

}



export function coverImageKeyFromLoop(loop: Loop): string {
  const stored = loop.details?.coverUrl?.trim();
  const rev = loop.details?.coverRevision ?? 0;
  if (stored) {
    return `${loop.id}:stored:${hashString(stored)}:${rev}:${loop.details?.coverKind ?? "image"}`;
  }
  return `${loop.id}:pending`;
}

/** URL d’affichage — bust cache navigateur après reroll (même chemin Storage). */
export function displayCoverUrl(url: string, revision?: number): string {
  const u = url.trim();
  if (!u.startsWith("http")) return u;
  const rev = typeof revision === "number" && revision > 0 ? revision : 0;
  if (!rev) return u;
  const sep = u.includes("?") ? "&" : "?";
  return `${u}${sep}phv=${rev}`;
}



export { buildCoverPromptSnapshot };

const preloadedCoverUrls = new Set<string>();

/** Précharge une cover pour affichage plus rapide sur les cartes. */
export function preloadCoverImage(url: string | null | undefined): void {
  const u = (url ?? "").trim();
  if (!u.startsWith("http") || preloadedCoverUrls.has(u)) return;
  preloadedCoverUrls.add(u);
  const img = new Image();
  img.referrerPolicy = "no-referrer";
  img.decoding = "async";
  img.src = u;
}


