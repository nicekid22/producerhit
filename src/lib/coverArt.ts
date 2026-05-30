import type { Loop } from "@/types/loop";
import { supabase } from "@/lib/supabaseClient";
import { parseStemsUrl } from "@/lib/publicLoops";
import {
  buildCoverPromptSnapshot,
  coverImageSeed,
  coverImageUrl as buildPollinationsCoverUrl,
  hashString,
  resolveCoverArtPrompt,
} from "@/lib/utils";

/**
 * Rollback perf / covers : passer à `false` pour revenir aux URLs Pollinations à la volée partout.
 */
export const USE_PERSISTED_COVER_URL = true;

export type AceCoverFields = {
  coverPrompt?: string;
  coverUrl?: string;
};

export function parseAceCoverFields(stemsUrl: unknown): AceCoverFields {
  const stems = parseStemsUrl(stemsUrl);
  if (!stems) return {};
  const ace = stems.ace;
  if (!ace || typeof ace !== "object") return {};
  const obj = ace as Record<string, unknown>;
  const coverPrompt = typeof obj.coverPrompt === "string" ? obj.coverPrompt.trim() : undefined;
  const coverUrl = typeof obj.coverUrl === "string" ? obj.coverUrl.trim() : undefined;
  return {
    coverPrompt: coverPrompt || undefined,
    coverUrl: coverUrl && (coverUrl.startsWith("http://") || coverUrl.startsWith("https://")) ? coverUrl : undefined,
  };
}

/** URL affichée : cover persistée en DB si présente, sinon Pollinations (comportement historique). */
export function resolveCoverImageUrl(loop: Loop, size = 512): string {
  const stored = loop.details?.coverUrl?.trim();
  if (USE_PERSISTED_COVER_URL && stored && (stored.startsWith("http://") || stored.startsWith("https://"))) {
    return stored;
  }
  return buildPollinationsCoverUrl(loop, size);
}

/** Cover pour une row publique : URL persistée ou Pollinations stable (même seed/prompt à chaque visite). */
export function resolvePublicRowCoverUrl(
  row: Parameters<typeof publicRowToCoverLoop>[0],
  size = 512,
): string {
  return resolveCoverImageUrl(publicRowToCoverLoop(row), size);
}

export function loopDetailsFromAceStems(stemsUrl: unknown): Loop["details"] {
  const ace = parseAceCoverFields(stemsUrl);
  if (!ace.coverPrompt && !ace.coverUrl) return null;
  return {
    coverPrompt: ace.coverPrompt,
    coverUrl: ace.coverUrl,
  };
}

export function mergeCoverUrlIntoStems(stemsUrl: unknown, coverUrl: string): Record<string, unknown> | null {
  const trimmed = coverUrl.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) return parseStemsUrl(stemsUrl);
  const base = parseStemsUrl(stemsUrl) ?? {};
  const existingAce =
    base.ace && typeof base.ace === "object" && base.ace !== null ? (base.ace as Record<string, unknown>) : {};
  return { ...base, ace: { ...existingAce, coverUrl: trimmed } };
}

/** Enregistre l’URL Pollinations canonique une fois (génération ou premier affichage carte). */
export async function persistCoverUrlForLoop(
  loopId: string,
  userId: string,
  loop: Loop,
  stemsUrl: unknown,
): Promise<string | null> {
  const existing = loop.details?.coverUrl?.trim();
  if (existing && (existing.startsWith("http://") || existing.startsWith("https://"))) return existing;

  const canonical = buildPollinationsCoverUrl(loop, 512);
  const nextStems = mergeCoverUrlIntoStems(stemsUrl, canonical);
  if (!nextStems) return null;

  const { error } = await supabase.from("loops").update({ stems_url: nextStems }).eq("id", loopId).eq("user_id", userId);
  if (error) return null;
  return canonical;
}

/** Précharge l’image puis persiste l’URL (best-effort, non bloquant). */
export function warmCoverAndPersist(
  loopId: string,
  userId: string,
  loop: Loop,
  stemsUrl: unknown,
  onDone?: (coverUrl: string | null) => void,
): void {
  if (loop.details?.coverUrl?.trim()) {
    onDone?.(loop.details.coverUrl.trim());
    return;
  }
  const url = buildPollinationsCoverUrl(loop, 512);
  const img = new Image();
  img.referrerPolicy = "no-referrer";
  const done = () => {
    void persistCoverUrlForLoop(loopId, userId, loop, stemsUrl).then((saved) => onDone?.(saved));
  };
  img.onload = done;
  img.onerror = done;
  img.src = url;
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
  created_at?: string | null;
  seed?: number | null;
}): Loop {
  const ace = parseAceCoverFields(row.stems_url);
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
    details: ace.coverPrompt || ace.coverUrl ? { coverPrompt: ace.coverPrompt, coverUrl: ace.coverUrl } : null,
    stemsUrl: parseStemsUrl(row.stems_url),
    isSaved: false,
    isPublic: true,
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

export function coverImageKeyFromLoop(loop: Loop): string {
  const stored = loop.details?.coverUrl?.trim();
  if (stored) return `${loop.id}:stored:${hashString(stored)}`;
  return `${loop.id}:${coverImageSeed(loop)}:${hashString(resolveCoverArtPrompt(loop))}`;
}

export { buildCoverPromptSnapshot };
