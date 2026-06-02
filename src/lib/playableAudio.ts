/**
 * Lecture audio fiable avec le visualizer Web Audio.
 *
 * Problème : createMediaElementSource() coupe la sortie directe de <audio>.
 * Les URLs HTTP cross-origin (ACE, Supabase, etc.) passent en silence alors que currentTime avance.
 *
 * Rollback :
 * - VITE_AUDIO_BLOB_PLAYBACK=0  → pas de conversion blob (comportement legacy)
 * - VITE_AUDIO_SKIP_WEB_AUDIO=1 → sortie directe <audio>, sans visualizer (secours)
 */

import { PLAYBACK_LOUDNESS } from "@/lib/playbackLoudness";
import { isPublicAceStreamUrl } from "@/lib/publicAcePlayback";
import { isSupabaseLoopAudioUrl } from "@/lib/storageAudio";

export const AUDIO_BLOB_PLAYBACK = import.meta.env.VITE_AUDIO_BLOB_PLAYBACK !== "0";

export const AUDIO_SKIP_WEB_AUDIO = import.meta.env.VITE_AUDIO_SKIP_WEB_AUDIO === "1";

const blobCache = new Map<string, string>();

export function isBlobOrDataUrl(url: string): boolean {
  const s = url.trim();
  return s.startsWith("blob:") || s.startsWith("data:");
}

export function isHttpAudioUrl(url: unknown): url is string {
  const s = typeof url === "string" ? url.trim() : "";
  return !!s && (s.startsWith("https://") || s.startsWith("http://"));
}

export function isCrossOriginHttpUrl(url: string): boolean {
  if (!isHttpAudioUrl(url)) return false;
  try {
    return new URL(url).origin !== window.location.origin;
  } catch {
    return true;
  }
}

/**
 * URLs partenaires / flux public — lecture directe <audio>, pas de fetch blob ni Web Audio.
 * Inclut ?action=stream_public (Edge) : le player ne télécharge pas ~25 Mo avant lecture.
 */
export function isAcePartnerAudioUrl(url: unknown): boolean {
  const s = typeof url === "string" ? url.trim() : "";
  if (!isHttpAudioUrl(s)) return false;
  if (isPublicAceStreamUrl(s)) return true;
  if (isSupabaseLoopAudioUrl(s)) return true;
  try {
    const host = new URL(s).hostname.toLowerCase();
    if (host.includes("acemusic.ai")) return true;
    if (host.includes("amazonaws.com") && s.includes("ace-music")) return true;
    return false;
  } catch {
    return s.includes("acemusic.ai") || isSupabaseLoopAudioUrl(s);
  }
}

export function shouldConvertToBlob(url: string): boolean {
  if (!AUDIO_BLOB_PLAYBACK) return false;
  if (isBlobOrDataUrl(url)) return false;
  if (isAcePartnerAudioUrl(url)) return false;
  return isHttpAudioUrl(url);
}

export function shouldUseWebAudioGraph(url: string): boolean {
  if (AUDIO_SKIP_WEB_AUDIO) return false;
  if (isAcePartnerAudioUrl(url)) return false;
  if (isBlobOrDataUrl(url)) return true;
  if (!isHttpAudioUrl(url)) return false;
  return !isCrossOriginHttpUrl(url);
}

/**
 * Chaîne Web Audio pour la sortie (gain makeup + visualizer optionnel).
 * Inclut loop-audio Supabase quand PLAYBACK_LOUDNESS est actif (CORS bucket public).
 */
export function shouldUsePlaybackOutputGraph(url: string): boolean {
  if (AUDIO_SKIP_WEB_AUDIO) return false;
  if (PLAYBACK_LOUDNESS && isSupabaseLoopAudioUrl(url)) return true;
  return shouldUseWebAudioGraph(url);
}

export function clearPlayableAudioBlobCache(key?: string) {
  if (key) {
    const url = blobCache.get(key);
    if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
    blobCache.delete(key);
    return;
  }
  for (const url of blobCache.values()) {
    if (url.startsWith("blob:")) URL.revokeObjectURL(url);
  }
  blobCache.clear();
}

export async function fetchAudioAsBlobUrl(
  sourceUrl: string,
  cacheKey: string,
  extraHeaders?: Record<string, string>,
): Promise<string> {
  const trimmed = sourceUrl.trim();
  if (!trimmed) throw new Error("empty url");

  const cached = blobCache.get(cacheKey);
  if (cached) return cached;

  if (cacheKey && !cacheKey.includes(":") && !extraHeaders) {
    try {
      const { fetchCachedLoopAudioBlob } = await import("@/stores/loopsStore");
      const blob = await fetchCachedLoopAudioBlob(cacheKey);
      if (blob?.size) {
        const blobUrl = URL.createObjectURL(blob);
        blobCache.set(cacheKey, blobUrl);
        return blobUrl;
      }
    } catch {
      // ignore
    }
  }

  if (isBlobOrDataUrl(trimmed)) {
    blobCache.set(cacheKey, trimmed);
    return trimmed;
  }

  const res = await fetch(trimmed, {
    mode: "cors",
    credentials: "omit",
    referrerPolicy: "no-referrer",
    headers: extraHeaders,
  });
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  const blob = await res.blob();
  if (!blob.size) throw new Error("empty blob");

  const blobUrl = URL.createObjectURL(blob);
  blobCache.set(cacheKey, blobUrl);
  return blobUrl;
}

/** Convertit une URL HTTP en blob: si nécessaire pour une lecture audible via Web Audio. */
export async function resolvePlayableAudioUrl(sourceUrl: string, cacheKey?: string): Promise<string> {
  const trimmed = typeof sourceUrl === "string" ? sourceUrl.trim() : "";
  if (!trimmed) return "";
  if (!shouldConvertToBlob(trimmed)) return trimmed;

  const key = cacheKey?.trim() || trimmed;
  try {
    return await fetchAudioAsBlobUrl(trimmed, key);
  } catch {
    // CORS / réseau : retomber sur l’URL directe (lecture <audio> sans visualizer).
    return trimmed;
  }
}
