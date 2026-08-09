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
import { isLoopAudioPlayableByAge } from "@/lib/loopAudioRetention";
import { isSupabaseLoopAudioUrl, SUPABASE_LOOP_AUDIO_UPLOAD, uploadPublicLoopAudio } from "@/lib/storageAudio";
import { fetchLoopStemsAndCover, coverUrlFromStemsRow } from "@/lib/loopStemsSelect";
import { supabase } from "@/lib/supabaseClient";
import { fbDb } from "@/lib/firebaseSupabaseClient";
import {
  collection,
  query as fbQuery,
  where,
  orderBy,
  limit as fbLimit,
  onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { mergeStemsPreservingAceCover } from "@/lib/stemsAceMerge";
import {
  buildStemsUrlForDb as buildStemsUrlForDbShared,
  extractAceTaskId,
  isHttpAudioUrl,
} from "@producerhit/shared";

export { extractAceTaskId, isHttpAudioUrl };

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
  cover_url?: string | null;
  created_at: string | null;
  seed?: number | null;
  author?: PublicProfileCard | null;
};

const PUBLIC_LOOP_LIST_SELECT =
  "id, user_id, name, genre, influence, mood, bpm, prompt, audio_url, created_at, seed, stems_url, cover_url";

const PUBLIC_LOOP_LIST_SELECT_LEGACY =
  "id, user_id, name, genre, influence, mood, bpm, prompt, audio_url, created_at, seed, stems_url";

/** Détail loop (play / remix) — alias listing (stems_url inclus pour cover + taskId). */
export const PUBLIC_LOOP_DETAIL_SELECT = PUBLIC_LOOP_LIST_SELECT;

const PUBLIC_LOOP_SELECT = PUBLIC_LOOP_DETAIL_SELECT;

const PUBLIC_LOOP_SELECT_ATTEMPTS = [PUBLIC_LOOP_LIST_SELECT, PUBLIC_LOOP_LIST_SELECT_LEGACY];
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

export function isPlayablePublicLoop(
  audioUrl: unknown,
  stemsUrl?: unknown,
  _createdAt?: string | null,
): boolean {
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

  const dbFiltered = playableOnly
    ? rows.filter((r) => isPlayablePublicLoop(r.audio_url, r.stems_url, r.created_at))
    : rows;
  const curatedFiltered = playableOnly
    ? CURATED_COMMUNITY_LOOPS.filter((r) => isPlayablePublicLoop(r.audio_url, r.stems_url, r.created_at))
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

/** Détail loop (play / remix) — stems_url chargé à la demande, pas dans le listing. */
export async function fetchPublicLoopById(loopId: string): Promise<PublicLoopRow | null> {
  const id = loopId.trim();
  if (!id) return null;
  for (const sel of PUBLIC_LOOP_SELECT_ATTEMPTS) {
    const { data, error } = await supabase
      .from("loops")
      .select(sel)
      .eq("id", id)
      .eq("is_public", true)
      .maybeSingle();
    if (error) continue;
    if (!data) return null;
    return normalizePublicLoopRow(data as unknown as PublicLoopRow);
  }
  return null;
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
    let lastError: unknown = null;
    let data: PublicLoopRow[] | null = null;
    const fetchLimit = playableOnly ? Math.max(limit * 3, 120) : limit;
    for (const sel of PUBLIC_LOOP_SELECT_ATTEMPTS) {
      const query = supabase
        .from("loops")
        .select(sel)
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(fetchLimit);

      const result = (await Promise.race([
        query,
        new Promise<never>((_, reject) => window.setTimeout(() => reject(new Error("timeout")), timeoutMs)),
      ])) as Awaited<typeof query>;

      if (result.error) {
        lastError = result.error;
        continue;
      }

      data = (result.data ?? []) as unknown as PublicLoopRow[];
      break;
    }
    if (!data) throw lastError ?? new Error("fetch_public_loops_failed");

    let rows = data.map(normalizePublicLoopRow);
    if (playableOnly) {
      rows = rows.filter((row) => isPlayablePublicLoop(row.audio_url, row.stems_url, row.created_at));
    }
    try {
      rows = await attachAuthorsToPublicLoops(rows);
    } catch {
      // feed OK sans auteurs
    }
    console.debug("[community-debug] fetchPublicLoops pool", rows.length, rows.slice(0,3));
    return rows;
  };

  try {
    const rows = await loadFromDb();
    return mergeWithCuratedCommunityLoops(rows, { playableOnly }).slice(0, limit);
  } catch {
    return mergeWithCuratedCommunityLoops([], { playableOnly }).slice(0, limit);
  }
}

/**
 * Subscribe en temps réel aux dernières loops publiques via Firestore `onSnapshot`.
 * Les nouvelles générations publiques apparaissent immédiatement chez tous les visiteurs,
 * sans reload. Le toggle privé depuis la carte audio (togglePublicRemote -> updateDoc)
 * retire la loop du feed en quasi-temps-réel.
 *
 * Requiert l'index composite Firestore : is_public (Asc) + created_at (Desc).
 * Voir firestore.indexes.json + `firebase deploy --only firestore:indexes`.
 *
 * @returns fonction unsubscribe (à appeler dans le cleanup d'un useEffect).
 */
export function subscribePublicLoops(opts: {
  limit?: number;
  onNext: (rows: PublicLoopRow[]) => void;
  onError?: (err: Error) => void;
}): Unsubscribe {
  const lim = opts.limit ?? 48;
  const db = fbDb();
  if (!db) {
    opts.onError?.(new Error("Firebase not configured"));
    // Retourne un no-op typé Unsubscribe pour pouvoir l'appeler dans le cleanup.
    const noop = (): void => {};
    return noop as Unsubscribe;
  }

  try {
    const q = fbQuery(
      collection(db, "loops"),
      where("is_public", "==", true),
      orderBy("created_at", "desc"),
      fbLimit(lim),
    );

    return onSnapshot(
      q,
      async (snap) => {
        const rows = snap.docs.map((d) =>
          normalizePublicLoopRow({ id: d.id, ...(d.data() as Record<string, unknown>) } as PublicLoopRow),
        );
        try {
          const withAuthors = await attachAuthorsToPublicLoops(rows);
          opts.onNext(withAuthors);
        } catch {
          // Feed OK sans auteurs (même tolérance que fetchPublicLoops).
          opts.onNext(rows);
        }
      },
      (err) => opts.onError?.(err instanceof Error ? err : new Error(String(err))),
    );
  } catch (err) {
    // Erreur synchrone (ex: index manquant au build de la query).
    opts.onError?.(err instanceof Error ? err : new Error(String(err)));
    const noop = (): void => {};
    return noop as Unsubscribe;
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
  const hostedExpired =
    Boolean(row.created_at) && !isLoopAudioPlayableByAge(row.created_at, row.audio_url);

  let playableRow = row;
  const existingEarly = typeof row.audio_url === "string" ? row.audio_url.trim() : "";
  if (!parseStemsUrl(row.stems_url) && (!existingEarly || isPublicAceStreamUrl(existingEarly))) {
    const detail = await fetchPublicLoopById(row.id).catch(() => null);
    if (detail) playableRow = detail;
  }

  const cacheKey = `community:${playableRow.id}`;
  const stems = parseStemsUrl(playableRow.stems_url);
  const httpFromStems = pickHttpAudioUrlForDb(null, stems);
  const aceTaskId = extractAceTaskId(stems);

  if (hostedExpired) {
    const aceStream =
      existingEarly && isPublicAceStreamUrl(existingEarly) && isPublicAceStreamEnabled();
    if (!aceTaskId && !httpFromStems && !aceStream) return "";
  }

  const existing = typeof playableRow.audio_url === "string" ? playableRow.audio_url.trim() : "";

  if (existing && isPublicAceStreamUrl(existing) && isPublicAceStreamEnabled()) {
    return withSupabaseFunctionAuth(existing);
  }

  if (!existing || hostedExpired) {
    if (httpFromStems) return resolvePlayableAudioUrl(httpFromStems, cacheKey);
    if (aceTaskId) {
      const resolved = await resolveAceAudioUrlWithRetry(aceTaskId);
      if (resolved) return resolvePlayableAudioUrl(resolved, cacheKey);
    }
    if (!existing) return "";
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

export { uploadPublicLoopAudio } from "@/lib/storageAudio";

export function buildStemsUrlForDb(
  inputStemsUrl: unknown,
  details: Parameters<typeof buildStemsUrlForDbShared>[1],
): Record<string, unknown> | null {
  return buildStemsUrlForDbShared(inputStemsUrl, details);
}

/** Écrit l’URL HTTP ACE déjà connue + métadonnées stems — sans re-résolution ACE. */
export async function persistLoopAceAudioRecord(args: {
  loopId: string;
  userId: string;
  audioUrlInput: string;
  audioUrlForDb: string | null;
  stemsUrlForDb: unknown;
}): Promise<{ audioUrl: string | null; stemsUrl: Record<string, unknown> | null }> {
  const incomingStems =
    args.stemsUrlForDb && typeof args.stemsUrlForDb === "object" ? (args.stemsUrlForDb as Record<string, unknown>) : null;

  const freshRow = await fetchLoopStemsAndCover(args.loopId, args.userId);

  const { mergeCoverIntoStems } = await import("@/lib/coverArt");
  const dbStems = parseStemsUrl(freshRow?.stems_url ?? null);
  let stemsRecord = mergeStemsPreservingAceCover(incomingStems, dbStems) ?? incomingStems ?? dbStems;
  const colCoverAtStart = coverUrlFromStemsRow(freshRow);
  if (colCoverAtStart.startsWith("http") && stemsRecord) {
    stemsRecord = mergeCoverIntoStems(stemsRecord, colCoverAtStart, "image") ?? stemsRecord;
  }

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

  const inlineSource = pickInlineProviderAudioUrl(args.audioUrlInput, stemsRecord);

  if (!audioUrl && inlineSource && SUPABASE_LOOP_AUDIO_UPLOAD) {
    const storageUrl = await uploadPublicLoopAudio(args.userId, args.loopId, inlineSource);
    if (storageUrl) audioUrl = storageUrl;
  }

  // Sortie ACE HTTP (Song / Remix) → mirror loop-audio, évite URLs temporaires + gros inline Postgres.
  if (audioUrl && !isSupabaseLoopAudioUrl(audioUrl) && SUPABASE_LOOP_AUDIO_UPLOAD && isHttpAudioUrl(audioUrl)) {
    const storageUrl = await uploadPublicLoopAudio(args.userId, args.loopId, audioUrl);
    if (storageUrl) audioUrl = storageUrl;
  }

  const inlineData = !audioUrl && isPublicAceStreamEnabled() ? inlineSource : null;
  const streamUrl = inlineData ? buildPublicAceStreamUrl(args.loopId) : "";

  const updatePayload: {
    audio_url?: string;
    stems_url?: Record<string, unknown>;
    provider_audio_inline?: string | null;
  } = {};
  if (audioUrl) {
    updatePayload.audio_url = audioUrl;
    if (isSupabaseLoopAudioUrl(audioUrl)) {
      updatePayload.provider_audio_inline = null;
      if (stemsRecord) {
        const ace =
          stemsRecord.ace && typeof stemsRecord.ace === "object"
            ? ({ ...(stemsRecord.ace as Record<string, unknown>) } as Record<string, unknown>)
            : {};
        delete ace.providerDataUrl;
        ace.publicPlayback = "supabase-storage";
        updatePayload.stems_url = { ...stemsRecord, ace };
      }
    }
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

  if (updatePayload.stems_url) {
    const freshBeforeWrite = await fetchLoopStemsAndCover(args.loopId, args.userId);

    const { mergeCoverIntoStems } = await import("@/lib/coverArt");
    const dbStems = parseStemsUrl(freshBeforeWrite?.stems_url ?? null);
    const incoming = updatePayload.stems_url as Record<string, unknown>;
    let merged = mergeStemsPreservingAceCover(incoming, dbStems) ?? incoming;
    const colCover = coverUrlFromStemsRow(freshBeforeWrite);
    if (colCover.startsWith("http")) {
      merged = mergeCoverIntoStems(merged, colCover, "image") ?? merged;
    }
    updatePayload.stems_url = merged;
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

/** Compteur d'écoutes communauté (growth_events.community_play) — RPC security definer. */
export async function fetchCommunityPlayCounts(loopIds: string[]): Promise<Record<string, number>> {
  const ids = loopIds.filter(Boolean);
  if (!ids.length) return {};
  try {
    const { data, error } = await supabase.rpc("get_community_loop_play_counts", { p_loop_ids: ids });
    if (error) return {};
    const out: Record<string, number> = {};
    for (const row of (data ?? []) as Array<{ loop_id?: string; play_count?: number }>) {
      if (typeof row.loop_id === "string" && typeof row.play_count === "number") {
        out[row.loop_id] = row.play_count;
      }
    }
    return out;
  } catch {
    return {};
  }
}
