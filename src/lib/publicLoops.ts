import { clearPlayableAudioBlobCache, resolvePlayableAudioUrl } from "@/lib/playableAudio";
import { CURATED_COMMUNITY_LOOPS, CURATED_COMMUNITY_MIN_COUNT } from "@/lib/communityCurated";
import {
  buildPublicAceStreamUrl,
  isPlayablePublicAudioUrl,
  isPublicAceStreamEnabled,
  isPublicAceStreamUrl,
  pickInlineProviderAudioUrl,
  withSupabaseFunctionAuth,
} from "@/lib/publicAcePlayback";
import { fetchPublicProfileCards, type PublicProfileCard } from "@/lib/creatorProfile";
import { SUPABASE_LOOP_AUDIO_UPLOAD } from "@/lib/storageAudio";
import { supabase } from "@/lib/supabaseClient";

export type PublicLoopRow = {
  id: string;
  user_id?: string | null;
  name: string | null;
  genre: string | null;
  influence?: string | null;
  mood: string | null;
  bpm: number | null;
  prompt: string | null;
  audio_url: string | null;
  stems_url: unknown;
  created_at: string | null;
  seed?: number | null;
  author?: PublicProfileCard | null;
};

const PUBLIC_LOOP_LIST_SELECT =
  "id, user_id, name, genre, influence, mood, bpm, prompt, audio_url, stems_url, created_at, seed";

/** Détail loop (page publique) — inclut stems_url pour taskId / cover. */
export const PUBLIC_LOOP_DETAIL_SELECT = `${PUBLIC_LOOP_LIST_SELECT}, stems_url`;

const PUBLIC_LOOP_SELECT = PUBLIC_LOOP_DETAIL_SELECT;
/** stems_url.ace.coverUrl + coverPrompt — pas de régénération Pollinations côté landing. */

export function parseStemsUrl(stemsUrl: unknown): Record<string, unknown> | null {
  if (!stemsUrl) return null;
  if (typeof stemsUrl === "object") return stemsUrl as Record<string, unknown>;
  if (typeof stemsUrl === "string") {
    const raw = stemsUrl.trim();
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as unknown;
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  return null;
}

export function extractAceTaskId(stemsUrl: unknown): string {
  const obj = parseStemsUrl(stemsUrl);
  if (!obj) return "";

  const rootTaskId = obj.taskId ?? obj.task_id ?? obj.ace_task_id;
  if (typeof rootTaskId === "string" && rootTaskId.trim()) return rootTaskId.trim();

  const ace = obj.ace;
  if (!ace || typeof ace !== "object") return "";
  const taskId = (ace as Record<string, unknown>).taskId ?? (ace as Record<string, unknown>).task_id;
  return typeof taskId === "string" ? taskId.trim() : "";
}

export function isHttpAudioUrl(url: unknown): url is string {
  const s = typeof url === "string" ? url.trim() : "";
  return !!s && (s.startsWith("https://") || s.startsWith("http://"));
}

export function isPlayablePublicLoop(audioUrl: unknown, stemsUrl?: unknown): boolean {
  if (isPlayablePublicAudioUrl(audioUrl)) return true;
  return extractAceTaskId(stemsUrl).length > 0;
}

/** URL HTTP à écrire en DB — depuis audioUrl direct ou stems.ace.httpAudioUrl */
export function pickHttpAudioUrlForDb(audioUrlInput: unknown, stemsUrl?: unknown): string | null {
  const direct = typeof audioUrlInput === "string" ? audioUrlInput.trim() : "";
  if (isHttpAudioUrl(direct) && !direct.startsWith("blob:")) return direct;

  const obj = parseStemsUrl(stemsUrl);
  const ace = obj?.ace && typeof obj.ace === "object" ? (obj.ace as Record<string, unknown>) : null;
  const fromAce = typeof ace?.httpAudioUrl === "string" ? ace.httpAudioUrl.trim() : "";
  if (isHttpAudioUrl(fromAce)) return fromAce;

  return null;
}

function isReleaseTaskId(taskId: string): boolean {
  const t = taskId.trim();
  return !!t && !t.startsWith("chatcmpl-");
}

export async function resolveAceAudioUrl(taskId: string): Promise<string> {
  const tid = taskId.trim();
  if (!tid) throw new Error("Missing taskId");
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const { data, error } = await supabase.functions.invoke("generate-loop-ace", {
    body: { action: "resolve_audio", taskId: tid },
    headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
  });
  if (error) throw error;
  const payload = (data ?? null) as { audioUrl?: unknown; error?: unknown } | null;
  if (typeof payload?.error === "string" && payload.error.trim()) {
    throw new Error(payload.error.trim());
  }
  const url = typeof payload?.audioUrl === "string" ? payload.audioUrl.trim() : "";
  if (!url) throw new Error("Audio manquant");
  return url;
}

async function resolveAceAudioUrlWithRetry(taskId: string): Promise<string> {
  let resolved = await resolveAceAudioUrl(taskId).catch(() => "");
  if (!isHttpAudioUrl(resolved)) {
    await new Promise((r) => setTimeout(r, 900));
    resolved = await resolveAceAudioUrl(taskId).catch(() => "");
  }
  return isHttpAudioUrl(resolved) ? resolved.trim() : "";
}

export function normalizePublicLoopRow(row: PublicLoopRow): PublicLoopRow {
  const url = typeof row.audio_url === "string" ? row.audio_url.trim() : "";
  return {
    ...row,
    audio_url: url || null,
    stems_url: parseStemsUrl(row.stems_url) ?? row.stems_url,
  };
}

export function sortPublicLoopsByNewest(rows: PublicLoopRow[]): PublicLoopRow[] {
  return rows.slice().sort(
    (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime(),
  );
}

function mergeWithCuratedCommunityLoops(rows: PublicLoopRow[], options?: { playableOnly?: boolean; minCount?: number }) {
  const playableOnly = options?.playableOnly ?? false;
  const minCount = options?.minCount ?? CURATED_COMMUNITY_MIN_COUNT;

  const dbFiltered = playableOnly ? rows.filter((r) => isPlayablePublicLoop(r.audio_url, r.stems_url)) : rows;
  const curatedFiltered = playableOnly
    ? CURATED_COMMUNITY_LOOPS.filter((r) => isPlayablePublicLoop(r.audio_url, r.stems_url))
    : CURATED_COMMUNITY_LOOPS;

  const byId = new Map<string, PublicLoopRow>();
  for (const row of dbFiltered) byId.set(row.id, row);
  for (const row of curatedFiltered) {
    if (!byId.has(row.id)) byId.set(row.id, row);
  }

  const merged = sortPublicLoopsByNewest([...byId.values()]);
  if (merged.length >= minCount) return merged;

  for (const row of curatedFiltered) {
    if (merged.length >= minCount) break;
    if (!byId.has(row.id)) merged.push(row);
  }

  return sortPublicLoopsByNewest(merged);
}

export async function fetchPublicLoops(options?: {
  limit?: number;
  timeoutMs?: number;
  /** Exclut les loops sans audio jouable (HTTP, stream_public ou taskId ACE). */
  playableOnly?: boolean;
}): Promise<PublicLoopRow[]> {
  const limit = options?.limit ?? 36;
  const timeoutMs = options?.timeoutMs ?? 12000;
  const playableOnly = options?.playableOnly ?? false;

  const loadFromDb = async (): Promise<PublicLoopRow[]> => {
    let query = supabase
      .from("loops")
      .select(PUBLIC_LOOP_LIST_SELECT)
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (playableOnly) {
      query = query.not("audio_url", "is", null);
    }

    query = query.limit(limit);

    const result = (await Promise.race([
      query,
      new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error("timeout")), timeoutMs)),
    ])) as Awaited<typeof query>;

    if (result.error) throw result.error;

    let rows = ((result.data ?? []) as PublicLoopRow[]).map(normalizePublicLoopRow);
    if (playableOnly) {
      rows = rows.filter((row) => isPlayablePublicLoop(row.audio_url));
    }
    try {
      rows = await attachAuthorsToPublicLoops(rows);
    } catch {
      // feed OK sans auteurs
    }
    return rows;
  };

  try {
    const rows = await loadFromDb();
    return mergeWithCuratedCommunityLoops(rows, { playableOnly }).slice(0, limit);
  } catch {
    return mergeWithCuratedCommunityLoops([], { playableOnly }).slice(0, limit);
  }
}

export async function attachAuthorsToPublicLoops(rows: PublicLoopRow[]): Promise<PublicLoopRow[]> {
  const userIds = rows.map((r) => r.user_id).filter((id): id is string => !!id);
  if (!userIds.length) return rows;
  const cards = await fetchPublicProfileCards(userIds);
  if (!cards.size) return rows;
  return rows.map((row) => {
    const author = row.user_id ? cards.get(row.user_id) ?? null : null;
    return author ? { ...row, author } : row;
  });
}

/**
 * URL jouable en communauté.
 * stream_public → lecture <audio> native (comme ACE), pas de fetch blob ~25 Mo.
 */
export async function resolvePlayableCommunityAudio(row: PublicLoopRow): Promise<string> {
  const cacheKey = `community:${row.id}`;
  const stems = parseStemsUrl(row.stems_url);
  const httpFromStems = pickHttpAudioUrlForDb(null, stems);

  const existing = typeof row.audio_url === "string" ? row.audio_url.trim() : "";

  if (existing && isPublicAceStreamUrl(existing) && isPublicAceStreamEnabled()) {
    return withSupabaseFunctionAuth(existing);
  }

  if (!existing) {
    if (httpFromStems) return resolvePlayableAudioUrl(httpFromStems, cacheKey);
    const taskId = extractAceTaskId(stems);
    if (taskId) {
      const resolved = await resolveAceAudioUrlWithRetry(taskId);
      if (resolved) return resolvePlayableAudioUrl(resolved, cacheKey);
    }
    return "";
  }

  const playable = await resolvePlayableAudioUrl(existing, cacheKey);
  return playable || existing;
}

export function clearCommunityAudioBlobCache(loopId?: string) {
  clearPlayableAudioBlobCache(loopId ? `community:${loopId}` : undefined);
}

export async function persistPublicLoopAudioUrl(loopId: string, userId: string, taskId: string): Promise<string | null> {
  const url = await resolveAceAudioUrl(taskId).catch(() => "");
  if (!url) return null;
  const { error } = await supabase.from("loops").update({ audio_url: url }).eq("id", loopId).eq("user_id", userId);
  if (error) return null;
  return url;
}

function guessAudioExtension(sourceUrl: string, mimeType: string): string {
  const mime = mimeType.toLowerCase();
  if (mime.includes("wav")) return "wav";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("webm")) return "webm";
  if (mime.includes("aac") || mime.includes("mp4")) return "m4a";
  if (sourceUrl.startsWith("data:audio/wav")) return "wav";
  if (sourceUrl.startsWith("data:audio/ogg")) return "ogg";
  return "mp3";
}

export async function uploadPublicLoopAudio(userId: string, loopId: string, sourceUrl: string): Promise<string | null> {
  if (!SUPABASE_LOOP_AUDIO_UPLOAD) return null;
  const trimmed = sourceUrl.trim();
  if (!trimmed || (!trimmed.startsWith("data:") && !trimmed.startsWith("blob:"))) return null;
  try {
    const res = await fetch(trimmed);
    const blob = await res.blob();
    if (!blob.size) return null;
    const ext = guessAudioExtension(trimmed, blob.type || "audio/mpeg");
    const path = `${userId}/${loopId}.${ext}`;
    const { error } = await supabase.storage.from("loop-audio").upload(path, blob, {
      upsert: true,
      contentType: blob.type || "audio/mpeg",
    });
    if (error) return null;
    const { data } = supabase.storage.from("loop-audio").getPublicUrl(path);
    return data.publicUrl?.trim() || null;
  } catch {
    return null;
  }
}

export function buildStemsUrlForDb(
  inputStemsUrl: unknown,
  details: {
    caption?: string;
    lyrics?: string;
    bpm?: number | null;
    duration?: number | null;
    keyScale?: string;
    timeSignature?: string;
    audioFormat?: string | null;
    coverPrompt?: string;
    coverUrl?: string;
    httpAudioUrl?: string;
  } | null,
): Record<string, unknown> | null {
  const taskIdFromInput = extractAceTaskId(inputStemsUrl);
  const base = inputStemsUrl && typeof inputStemsUrl === "object" ? (inputStemsUrl as Record<string, unknown>) : {};
  const existingAce =
    base.ace && typeof base.ace === "object" && base.ace !== null ? (base.ace as Record<string, unknown>) : {};

  if (!details && !taskIdFromInput && !Object.keys(existingAce).length) {
    return Object.keys(base).length ? base : null;
  }

  const ace: Record<string, unknown> = { ...existingAce, ...(details ?? {}) };
  const httpFromDetails = typeof details?.httpAudioUrl === "string" ? details.httpAudioUrl.trim() : "";
  if (isHttpAudioUrl(httpFromDetails)) ace.httpAudioUrl = httpFromDetails;
  delete ace.providerDataUrl;
  const taskId =
    (typeof existingAce.taskId === "string" && existingAce.taskId.trim()) ||
    (typeof existingAce.task_id === "string" && existingAce.task_id.trim()) ||
    taskIdFromInput;
  if (taskId) {
    ace.taskId = taskId;
    delete ace.task_id;
  }

  return { ...base, ace };
}

/** Écrit l’URL HTTP ACE déjà connue + métadonnées stems — sans re-résolution ACE. */
export async function persistLoopAceAudioRecord(args: {
  loopId: string;
  userId: string;
  audioUrlInput: string;
  audioUrlForDb: string | null;
  stemsUrlForDb: unknown;
}): Promise<{ audioUrl: string | null; stemsUrl: Record<string, unknown> | null }> {
  const stemsRecord =
    args.stemsUrlForDb && typeof args.stemsUrlForDb === "object" ? (args.stemsUrlForDb as Record<string, unknown>) : null;

  const taskId = extractAceTaskId(stemsRecord);

  let audioUrl =
    args.audioUrlForDb ||
    pickHttpAudioUrlForDb(args.audioUrlInput, stemsRecord) ||
    null;

  if (!audioUrl && taskId) {
    const resolved = isReleaseTaskId(taskId)
      ? await resolveAceAudioUrlWithRetry(taskId)
      : await resolveAceAudioUrl(taskId).catch(() => "");
    if (isHttpAudioUrl(resolved)) audioUrl = resolved.trim();
  }

  const inlineData =
    !audioUrl && isPublicAceStreamEnabled() ? pickInlineProviderAudioUrl(args.audioUrlInput, stemsRecord) : null;
  let streamUrl = inlineData ? buildPublicAceStreamUrl(args.loopId) : "";

  const updatePayload: {
    audio_url?: string;
    stems_url?: Record<string, unknown>;
    provider_audio_inline?: string;
  } = {};
  if (audioUrl) {
    updatePayload.audio_url = audioUrl;
  } else if (streamUrl && inlineData) {
    updatePayload.audio_url = streamUrl;
    updatePayload.provider_audio_inline = inlineData;
    if (stemsRecord) {
      const ace =
        stemsRecord.ace && typeof stemsRecord.ace === "object"
          ? ({ ...(stemsRecord.ace as Record<string, unknown>) } as Record<string, unknown>)
          : {};
      delete ace.providerDataUrl;
      ace.publicPlayback = "edge-stream";
      updatePayload.stems_url = { ...stemsRecord, ace };
    }
  } else if (stemsRecord) {
    updatePayload.stems_url = stemsRecord;
  }

  if (!Object.keys(updatePayload).length) {
    return { audioUrl: args.audioUrlForDb, stemsUrl: stemsRecord };
  }

  const { error } = await supabase.from("loops").update(updatePayload).eq("id", args.loopId).eq("user_id", args.userId);
  if (error && updatePayload.provider_audio_inline) {
    const fallbackPayload = { ...updatePayload };
    delete fallbackPayload.provider_audio_inline;
    if (Object.keys(fallbackPayload).length) {
      const retry = await supabase.from("loops").update(fallbackPayload).eq("id", args.loopId).eq("user_id", args.userId);
      if (retry.error) {
        return { audioUrl: args.audioUrlForDb, stemsUrl: stemsRecord };
      }
    } else {
      return { audioUrl: args.audioUrlForDb, stemsUrl: stemsRecord };
    }
  } else if (error) {
    return { audioUrl: args.audioUrlForDb, stemsUrl: stemsRecord };
  }

  const resolvedAudioUrl = audioUrl || (streamUrl && inlineData ? streamUrl : null);
  return { audioUrl: resolvedAudioUrl, stemsUrl: (updatePayload.stems_url as Record<string, unknown> | undefined) ?? stemsRecord };
}

export async function finalizePublicLoopRecord(args: {
  loopId: string;
  userId: string;
  isPublic: boolean;
  audioUrlInput: string;
  audioUrlForDb: string | null;
  stemsUrlForDb: unknown;
}): Promise<{ audioUrl: string | null; stemsUrl: Record<string, unknown> | null }> {
  const result = await persistLoopAceAudioRecord({
    loopId: args.loopId,
    userId: args.userId,
    audioUrlInput: args.audioUrlInput,
    audioUrlForDb: args.audioUrlForDb,
    stemsUrlForDb: args.stemsUrlForDb,
  });

  if (!args.isPublic) return result;

  const { error } = await supabase
    .from("loops")
    .update({ is_public: true })
    .eq("id", args.loopId)
    .eq("user_id", args.userId);
  if (error) return result;

  return result;
}
