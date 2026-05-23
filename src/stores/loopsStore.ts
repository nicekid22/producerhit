import { create } from "zustand";
import { supabase } from "@/lib/supabaseClient";
import {
  extractAceTaskId as extractAceTaskIdFromStemsUrl,
  buildStemsUrlForDb,
  finalizePublicLoopRecord,
  isHttpAudioUrl,
  resolveAceAudioUrl,
  uploadPublicLoopAudio,
} from "@/lib/publicLoops";
import { useAuthStore } from "@/stores/authStore";
import { usePlayerStore } from "@/stores/playerStore";
import type { Loop } from "@/types/loop";

type DbLoop = {
  id: string;
  user_id: string;
  engine?: string | null;
  name: string;
  genre: string;
  influence: string;
  key: string;
  scale: string;
  bpm: number;
  loop_length: string;
  swing: number;
  mood: string;
  energy_level?: string | null;
  vocal_type?: string | null;
  reverb: string;
  prompt: string;
  audio_url: string | null;
  stems_url: unknown;
  is_saved: boolean;
  is_public?: boolean | null;
  seed?: number | string | null;
  created_at: string;
};

type AudioCacheRecord = { id: string; blob: Blob; durationSec?: number; updatedAt: number };

type PendingLoopSave = {
  localId: string;
  createdAt: string;
  draft: Omit<Loop, "id" | "createdAt" | "userId">;
};

let myLoopsLoadEpoch = 0;

function isHttpUrl(v: unknown): v is string {
  return isHttpAudioUrl(v);
}

async function fetchMyLoopsRows(userId: string): Promise<DbLoop[]> {
  const attempts: string[] = [
    "id, user_id, engine, name, genre, influence, key, scale, bpm, loop_length, swing, mood, energy_level, reverb, prompt, audio_url, stems_url, is_saved, is_public, seed, created_at",
    "id, user_id, name, genre, influence, key, scale, bpm, loop_length, swing, mood, energy_level, reverb, prompt, audio_url, stems_url, is_saved, is_public, seed, created_at",
    "id, user_id, engine, name, genre, influence, key, scale, bpm, loop_length, swing, mood, vocal_type, reverb, prompt, audio_url, stems_url, is_saved, is_public, seed, created_at",
    "id, user_id, name, genre, influence, key, scale, bpm, loop_length, swing, mood, vocal_type, reverb, prompt, audio_url, stems_url, is_saved, is_public, seed, created_at",
    "id, user_id, name, genre, influence, key, scale, bpm, loop_length, swing, mood, energy_level, reverb, prompt, audio_url, stems_url, is_saved, created_at",
    "id, user_id, name, genre, influence, key, scale, bpm, loop_length, swing, mood, vocal_type, reverb, prompt, audio_url, stems_url, is_saved, created_at",
  ];

  let lastError: unknown = null;
  for (const sel of attempts) {
    const { data, error } = await supabase
      .from("loops")
      .select(sel)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      lastError = error;
      continue;
    }
    return (data ?? []) as unknown as DbLoop[];
  }

  throw lastError ?? new Error("Failed to fetch loops");
}

function persistMyLoopsCache(userId: string, loops: Loop[]) {
  const cacheKey = `producerhit_my_loops_cache_v1:${userId}`;
  try {
    const safe = loops.map((l) => {
      const url = typeof l.audioUrl === "string" ? l.audioUrl.trim() : "";
      const keep = url.startsWith("https://") || url.startsWith("http://");
      const taskId = extractAceTaskIdFromStemsUrl(l.stemsUrl);
      return {
        ...l,
        audioUrl: keep ? url : null,
        stemsUrl: taskId ? { ace: { taskId } } : null,
      };
    });
    window.localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), loops: safe }));
  } catch {
    return;
  }
}

function pendingSavesKey(userId: string) {
  return `producerhit_pending_loop_saves_v1:${userId}`;
}

function loadPendingSaves(userId: string): PendingLoopSave[] {
  try {
    const raw = window.localStorage.getItem(pendingSavesKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    const list = Array.isArray(parsed) ? (parsed as PendingLoopSave[]) : [];
    return list.filter(
      (it) =>
        it &&
        typeof it.localId === "string" &&
        it.localId.startsWith("local-") &&
        typeof it.createdAt === "string" &&
        typeof (it as PendingLoopSave).draft === "object" &&
        (it as PendingLoopSave).draft !== null,
    );
  } catch {
    return [];
  }
}

function savePendingSaves(userId: string, list: PendingLoopSave[]) {
  try {
    const limited = (list ?? []).slice(0, 40);
    window.localStorage.setItem(pendingSavesKey(userId), JSON.stringify(limited));
  } catch {
    return;
  }
}

function toLocalLoop(userId: string, item: PendingLoopSave): Loop {
  return {
    id: item.localId,
    userId,
    engine: item.draft.engine ?? undefined,
    name: item.draft.name,
    genre: item.draft.genre,
    influence: item.draft.influence,
    key: item.draft.key,
    scale: item.draft.scale,
    bpm: item.draft.bpm,
    loopLength: item.draft.loopLength,
    swing: item.draft.swing,
    mood: item.draft.mood,
    energyLevel: item.draft.energyLevel,
    reverb: item.draft.reverb,
    prompt: item.draft.prompt,
    audioUrl: item.draft.audioUrl ?? null,
    seed: item.draft.seed ?? null,
    details: item.draft.details ?? null,
    stemsUrl: item.draft.stemsUrl ?? null,
    isSaved: Boolean(item.draft.isSaved),
    isPublic: Boolean(item.draft.isPublic),
    createdAt: item.createdAt,
  };
}

function openAudioCacheDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("producerkit-audio-cache", 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("loops")) db.createObjectStore("loops", { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("indexedDB open failed"));
  });
}

async function audioCachePut(id: string, blob: Blob, durationSec: number | null): Promise<void> {
  const db = await openAudioCacheDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("loops", "readwrite");
      const store = tx.objectStore("loops");
      const rec: AudioCacheRecord = { id, blob, updatedAt: Date.now() };
      if (durationSec && isFinite(durationSec) && durationSec > 0) rec.durationSec = durationSec;
      store.put(rec);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("indexedDB put failed"));
      tx.onabort = () => reject(tx.error ?? new Error("indexedDB put aborted"));
    });
  } finally {
    db.close();
  }
}

async function resolveAceAudioUrlWithRetry(taskId: string): Promise<string> {
  let resolved = await resolveAceAudioUrl(taskId).catch(() => "");
  if (!isHttpUrl(resolved)) {
    await new Promise((r) => setTimeout(r, 900));
    resolved = await resolveAceAudioUrl(taskId).catch(() => "");
  }
  return isHttpUrl(resolved) ? resolved.trim() : "";
}

async function cacheLoopAudioFromSrc(id: string, src: string | null | undefined): Promise<void> {
  const raw = typeof src === "string" ? src.trim() : "";
  if (!raw) return;
  try {
    const res = await fetch(raw);
    if (!res.ok) return;
    const blob = await res.blob();
    if (!blob.size) return;
    const objectUrl = URL.createObjectURL(blob);
    const durationSec = await probeDurationSec(objectUrl);
    URL.revokeObjectURL(objectUrl);
    await audioCachePut(id, blob, durationSec);
    if (durationSec) {
      useLoopsStore.setState((s) => ({
        durationsSecById: { ...s.durationsSecById, [id]: durationSec },
      }));
    }
  } catch {
    // ignore cache failures
  }
}

async function audioCacheGet(id: string): Promise<AudioCacheRecord | null> {
  const db = await openAudioCacheDb();
  try {
    return await new Promise<AudioCacheRecord | null>((resolve, reject) => {
      const tx = db.transaction("loops", "readonly");
      const store = tx.objectStore("loops");
      const req = store.get(id);
      req.onsuccess = () => {
        const v = req.result as AudioCacheRecord | undefined;
        resolve(v ?? null);
      };
      req.onerror = () => reject(req.error ?? new Error("indexedDB get failed"));
    });
  } finally {
    db.close();
  }
}

async function probeDurationSec(src: string): Promise<number | null> {
  return await new Promise<number | null>((resolve) => {
    const audio = new Audio();
    audio.preload = "metadata";
    const cleanup = () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("error", onError);
      audio.src = "";
    };
    const onLoaded = () => {
      const dur = audio.duration;
      cleanup();
      resolve(isFinite(dur) && dur > 0 ? dur : null);
    };
    const onError = () => {
      cleanup();
      resolve(null);
    };
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("error", onError);
    audio.src = src;
  });
}

function normalizeStoredAceAudioUrl(url: string): string {
  try {
    const u = new URL(url);
    const idx = u.pathname.indexOf("/v1/audio");
    if (idx >= 0) return `https://api.acemusic.ai${u.pathname.slice(idx)}${u.search}`;
  } catch {
    // ignore
  }
  return url;
}

function toLoop(row: DbLoop): Loop {
  const rawAudio = typeof row.audio_url === "string" ? row.audio_url.trim() : "";
  const audioUrl =
    rawAudio && (rawAudio.startsWith("https://") || rawAudio.startsWith("http://"))
      ? normalizeStoredAceAudioUrl(rawAudio)
      : null;
  const stemsObj = row.stems_url && typeof row.stems_url === "object" ? (row.stems_url as Record<string, unknown>) : null;
  const aceObj = stemsObj && stemsObj.ace && typeof stemsObj.ace === "object" ? (stemsObj.ace as Record<string, unknown>) : null;
  const details =
    aceObj
      ? {
          caption: typeof aceObj.caption === "string" ? aceObj.caption : undefined,
          lyrics: typeof aceObj.lyrics === "string" ? aceObj.lyrics : undefined,
          bpm: typeof aceObj.bpm === "number" ? aceObj.bpm : null,
          duration: typeof aceObj.duration === "number" ? aceObj.duration : null,
          keyScale: typeof aceObj.keyScale === "string" ? aceObj.keyScale : undefined,
          timeSignature: typeof aceObj.timeSignature === "string" ? aceObj.timeSignature : undefined,
          audioFormat: typeof aceObj.audioFormat === "string" ? aceObj.audioFormat : undefined,
        }
      : null;

  const seed =
    typeof row.seed === "number"
      ? (Number.isFinite(row.seed) ? row.seed : null)
      : typeof row.seed === "string"
        ? (() => {
            const n = Number(row.seed);
            return Number.isFinite(n) ? n : null;
          })()
        : null;

  return {
    id: row.id,
    userId: row.user_id,
    engine: row.engine ?? undefined,
    name: row.name,
    genre: row.genre,
    influence: row.influence,
    key: row.key,
    scale: row.scale,
    bpm: row.bpm,
    loopLength: row.loop_length as Loop["loopLength"],
    swing: row.swing ?? 0,
    mood: row.mood,
    energyLevel: row.energy_level ?? row.vocal_type ?? "Medium",
    reverb: row.reverb,
    prompt: row.prompt,
    audioUrl,
    seed,
    details,
    stemsUrl: stemsObj,
    isSaved: row.is_saved,
    isPublic: Boolean(row.is_public),
    createdAt: row.created_at,
  };
}

function isMissingColumnError(error: unknown, column: string) {
  const e = error as { message?: string; details?: string; hint?: string; code?: string } | null;
  const haystack = `${e?.message ?? ""} ${e?.details ?? ""} ${e?.hint ?? ""}`.toLowerCase();
  const c = column.toLowerCase();
  return haystack.includes(c) && (haystack.includes("schema cache") || haystack.includes("column") || haystack.includes("not found"));
}

async function hydrateAudioFromCache(nextLoops: Loop[]) {
  const candidates = nextLoops.slice(0, 20);
  if (!candidates.length) return;
  await Promise.allSettled(
    candidates.map(async (l) => {
      const rec = await audioCacheGet(l.id).catch(() => null);
      if (!rec?.blob) return;
      const url = URL.createObjectURL(rec.blob);

      useLoopsStore.setState((s) => {
        const next = s.loops.map((it) => {
          if (it.id !== l.id) return it;
          if (it.audioUrl?.startsWith("blob:")) URL.revokeObjectURL(it.audioUrl);
          return { ...it, audioUrl: url };
        });
        return { loops: next };
      });

      const player = usePlayerStore.getState();
      const current = player.current;
      if (current?.id === l.id && !current.audioUrl) {
        player.setCurrent({ ...current, audioUrl: url }, player.isPlaying);
      }

      if (rec.durationSec && isFinite(rec.durationSec) && rec.durationSec > 0) {
        useLoopsStore.setState((s) => ({
          durationsSecById: { ...s.durationsSecById, [l.id]: rec.durationSec as number },
        }));
      }
    }),
  );
}

async function resolvePublicAudioForLoop(loop: Loop, loopId: string, userId: string): Promise<string | null> {
  const pickHttp = (v: unknown) => (isHttpUrl(v) ? (v as string).trim() : "");
  const httpFromLoop = pickHttp(loop.audioUrl);
  if (httpFromLoop) return httpFromLoop;

  const ensured = await useLoopsStore.getState().ensureAudioReady(loopId).catch(() => "");
  const httpFromEnsured = pickHttp(ensured);
  if (httpFromEnsured) return httpFromEnsured;

  for (const candidate of [ensured, loop.audioUrl]) {
    const raw = typeof candidate === "string" ? candidate.trim() : "";
    if (raw.startsWith("blob:") || raw.startsWith("data:")) {
      const uploaded = await uploadPublicLoopAudio(userId, loopId, raw).catch(() => null);
      if (uploaded) return uploaded;
    }
  }

  const taskId = extractAceTaskIdFromStemsUrl(loop.stemsUrl);
  if (taskId) {
    const resolved = await resolveAceAudioUrlWithRetry(taskId);
    if (pickHttp(resolved)) return resolved;
  }

  const finalized = await finalizePublicLoopRecord({
    loopId,
    userId,
    isPublic: true,
    audioUrlInput: typeof loop.audioUrl === "string" ? loop.audioUrl : "",
    audioUrlForDb: httpFromLoop || null,
    stemsUrlForDb: loop.stemsUrl,
  }).catch(() => ({ audioUrl: null as string | null, stemsUrl: null }));

  return pickHttp(finalized.audioUrl) || null;
}

async function migrateAudioCache(fromId: string, toId: string): Promise<void> {
  if (!fromId || !toId || fromId === toId) return;
  try {
    const rec = await audioCacheGet(fromId).catch(() => null);
    if (!rec?.blob) return;
    await audioCachePut(toId, rec.blob, rec.durationSec ?? null);
  } catch {
    // ignore
  }
}

type LoopsState = {
  loops: Loop[];
  loading: boolean;
  lastSyncError: string | null;
  durationsSecById: Record<string, number>;
  setLoops: (loops: Loop[]) => void;
  upsertLoop: (loop: Loop) => void;
  removeLoop: (id: string) => void;
  toggleSaved: (id: string) => void;
  togglePublic: (id: string) => void;
  enqueuePendingSave: (draft: Omit<Loop, "id" | "createdAt" | "userId">, localId: string, createdAtIso: string) => void;
  ensureAudioReady: (id: string) => Promise<string>;
  primeAudioCache: (id: string, src: string) => void;
  migrateAudioCache: (fromId: string, toId: string) => Promise<void>;
  clear: () => void;
  loadMyLoops: () => Promise<void>;
  createLoop: (
    input: Omit<Loop, "id" | "createdAt" | "userId">,
    options?: { replaceLoopId?: string },
  ) => Promise<Loop>;
  toggleSavedRemote: (id: string) => Promise<boolean>;
  togglePublicRemote: (id: string) => Promise<boolean>;
  renameLoopRemote: (id: string, name: string) => Promise<void>;
  deleteLoopRemote: (id: string) => Promise<void>;
};

export const useLoopsStore = create<LoopsState>((set) => ({
  loops: [],
  loading: false,
  lastSyncError: null,
  durationsSecById: {},
  setLoops: (loops) => set({ loops }),
  upsertLoop: (loop) =>
    set((s) => {
      const next = s.loops.slice();
      const i = next.findIndex((l) => l.id === loop.id);
      if (i >= 0) next[i] = loop;
      else next.unshift(loop);
      return { loops: next.slice(0, 200) };
    }),
  removeLoop: (id) =>
    set((s) => {
      const loop = s.loops.find((l) => l.id === id);
      if (loop?.audioUrl?.startsWith("blob:")) URL.revokeObjectURL(loop.audioUrl);
      return { loops: s.loops.filter((l) => l.id !== id) };
    }),
  toggleSaved: (id) =>
    set((s) => ({
      loops: s.loops.map((l) => (l.id === id ? { ...l, isSaved: !l.isSaved } : l)),
    })),
  togglePublic: (id) =>
    set((s) => ({
      loops: s.loops.map((l) => (l.id === id ? { ...l, isPublic: !l.isPublic } : l)),
    })),
  enqueuePendingSave: (draft, localId, createdAtIso) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    const item: PendingLoopSave = {
      localId: localId.startsWith("local-") ? localId : `local-${localId}`,
      createdAt: createdAtIso,
      draft,
    };
    const existing = loadPendingSaves(user.id);
    const next = [item, ...existing.filter((it) => it.localId !== item.localId)];
    savePendingSaves(user.id, next);
  },
  ensureAudioReady: async (id) => {
    const fromState = useLoopsStore.getState().loops.find((l) => l.id === id);

    const cached = await audioCacheGet(id).catch(() => null);
    if (cached?.blob) {
      const url = URL.createObjectURL(cached.blob);
      useLoopsStore.setState((s) => ({
        loops: s.loops.map((l) => {
          if (l.id !== id) return l;
          if (l.audioUrl?.startsWith("blob:")) URL.revokeObjectURL(l.audioUrl);
          return { ...l, audioUrl: url };
        }),
      }));
      return url;
    }

    const currentUrl = typeof fromState?.audioUrl === "string" ? fromState.audioUrl.trim() : "";
    if (isHttpUrl(currentUrl)) return currentUrl;

    const user = useAuthStore.getState().user;
    const taskIdFromState = extractAceTaskIdFromStemsUrl(fromState?.stemsUrl);
    if (!user) {
      if (!taskIdFromState) throw new Error("Not authenticated");
      const resolved = await resolveAceAudioUrlWithRetry(taskIdFromState);
      if (!isHttpUrl(resolved)) throw new Error("Audio manquant");
      useLoopsStore.setState((s) => ({
        loops: s.loops.map((l) => (l.id === id ? { ...l, audioUrl: resolved } : l)),
      }));
      return resolved;
    }

    const { data, error } = await supabase
      .from("loops")
      .select("audio_url, stems_url")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw error;
    const dbUrl = typeof (data as { audio_url?: unknown } | null)?.audio_url === "string" ? ((data as { audio_url: string }).audio_url || "").trim() : "";
    if (isHttpUrl(dbUrl)) {
      useLoopsStore.setState((s) => ({
        loops: s.loops.map((l) => (l.id === id ? { ...l, audioUrl: dbUrl } : l)),
      }));
      void cacheLoopAudioFromSrc(id, dbUrl);
      return dbUrl;
    }

    const taskId = taskIdFromState || extractAceTaskIdFromStemsUrl((data as { stems_url?: unknown } | null)?.stems_url);
    if (!taskId) throw new Error("Audio manquant");
    const resolved = await resolveAceAudioUrlWithRetry(taskId);
    if (!isHttpUrl(resolved)) throw new Error("Audio manquant");

    if (!id.startsWith("local-") && !id.startsWith("preview-")) {
      await supabase.from("loops").update({ audio_url: resolved }).eq("id", id).eq("user_id", user.id);
    }

    useLoopsStore.setState((s) => ({
      loops: s.loops.map((l) => (l.id === id ? { ...l, audioUrl: resolved } : l)),
    }));
    void cacheLoopAudioFromSrc(id, resolved);
    return resolved;
  },
  primeAudioCache: (id, src) => {
    void cacheLoopAudioFromSrc(id, src);
  },
  migrateAudioCache: async (fromId, toId) => {
    await migrateAudioCache(fromId, toId);
  },
  clear: () =>
    set((s) => {
      myLoopsLoadEpoch += 1;
      s.loops.forEach((l) => {
        if (l.audioUrl?.startsWith("blob:")) URL.revokeObjectURL(l.audioUrl);
      });
      return { loops: [] };
    }),
  loadMyLoops: async () => {
    const epoch = (myLoopsLoadEpoch += 1);
    const user = useAuthStore.getState().user;
    if (!user) {
      useLoopsStore.getState().clear();
      return;
    }
    const userId = user.id;

    const cacheKey = `producerhit_my_loops_cache_v1:${userId}`;
    const hasAny = useLoopsStore.getState().loops.length > 0;
    let cachedLoopsForFallback: Loop[] | null = null;
    if (!hasAny) {
      try {
        const raw = window.localStorage.getItem(cacheKey);
        if (raw) {
          const parsed = JSON.parse(raw) as { ts?: unknown; loops?: unknown };
          const ts = typeof parsed?.ts === "number" ? parsed.ts : 0;
          const cachedLoops = Array.isArray(parsed?.loops) ? (parsed.loops as unknown[]) : [];
          if (Date.now() - ts < 7 * 24 * 60 * 60 * 1000 && cachedLoops.length) {
            cachedLoopsForFallback = cachedLoops as Loop[];
            if (epoch === myLoopsLoadEpoch && useAuthStore.getState().user?.id === userId) set({ loops: cachedLoopsForFallback });
          }
        }
      } catch {
        // ignore
      }
    }

    if (epoch === myLoopsLoadEpoch && useAuthStore.getState().user?.id === userId) set({ loading: true });
    try {
      const prevLoops = useLoopsStore.getState().loops;
      const prevById = new Map<string, Loop>();
      prevLoops.forEach((l) => prevById.set(l.id, l));
      let rows: DbLoop[] = [];
      let lastError: unknown = null;
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          rows = await fetchMyLoopsRows(userId);
          lastError = null;
          break;
        } catch (e) {
          lastError = e;
          if (attempt === 0) await new Promise((r) => setTimeout(r, 900));
        }
      }
      if (lastError) {
        if (epoch === myLoopsLoadEpoch && useAuthStore.getState().user?.id === userId) set({ lastSyncError: "sync_failed" });
        void hydrateAudioFromCache(useLoopsStore.getState().loops);
        return;
      }
      if (epoch !== myLoopsLoadEpoch || useAuthStore.getState().user?.id !== userId) return;

      if (rows.length === 0) {
        const prevLikelyHasRemote = prevLoops.some(
          (l) => l.userId === userId && !l.id.startsWith("local-") && !l.id.startsWith("preview-"),
        );
        if (prevLikelyHasRemote) {
          await new Promise((r) => setTimeout(r, 900));
          if (epoch !== myLoopsLoadEpoch || useAuthStore.getState().user?.id !== userId) return;
          try {
            rows = await fetchMyLoopsRows(userId);
          } catch {
            // ignore
          }
        }
      }

      const rowsById = new Map<string, DbLoop>();
      rows.forEach((r) => rowsById.set(r.id, r));
      const nextLoops = rows.map((row) => {
        if (row.audio_url) return toLoop(row);
        const prev = prevById.get(row.id);
        if (prev?.audioUrl) return toLoop({ ...row, audio_url: prev.audioUrl });
        return toLoop(row);
      });

      if (nextLoops.length === 0 && cachedLoopsForFallback && cachedLoopsForFallback.length > 0) {
        set({ loops: cachedLoopsForFallback, lastSyncError: "sync_failed" });
        void hydrateAudioFromCache(useLoopsStore.getState().loops);
        return;
      }

      if (nextLoops.length === 0) {
        const fallbackPrev = prevLoops.filter((l) => l.userId === userId);
        const hadRemoteBefore = fallbackPrev.some((l) => !l.id.startsWith("local-") && !l.id.startsWith("preview-"));
        if (hadRemoteBefore) {
          set({ loops: fallbackPrev, lastSyncError: "sync_failed" });
          void hydrateAudioFromCache(useLoopsStore.getState().loops);
          return;
        }
      }

      const pending = loadPendingSaves(userId);

      const nextAudioUrls = new Set<string>();
      nextLoops.forEach((l) => {
        if (typeof l.audioUrl === "string" && l.audioUrl.trim()) nextAudioUrls.add(l.audioUrl.trim());
      });

      const pendingLoops = pending
        .filter((p) => {
          const url = typeof p.draft.audioUrl === "string" ? p.draft.audioUrl.trim() : "";
          return !url || !nextAudioUrls.has(url);
        })
        .map((p) => toLocalLoop(user.id, p));

      const nextIds = new Set(nextLoops.map((l) => l.id));
      const preservedPrev = prevLoops.filter((l) => {
        if (nextIds.has(l.id)) return false;
        if (l.id.startsWith("local-") || l.id.startsWith("preview-")) return true;
        const createdAtMs = Date.parse(l.createdAt ?? "");
        return Number.isFinite(createdAtMs) && Date.now() - createdAtMs < 5 * 60 * 1000;
      });

      set({ loops: [...pendingLoops, ...preservedPrev, ...nextLoops], lastSyncError: null });

      void hydrateAudioFromCache(useLoopsStore.getState().loops);
      persistMyLoopsCache(userId, useLoopsStore.getState().loops);

      void (async () => {
        if (epoch !== myLoopsLoadEpoch || useAuthStore.getState().user?.id !== userId) return;
        const candidates = useLoopsStore
          .getState()
          .loops.filter((l) => !l.id.startsWith("preview-") && !isHttpUrl(l.audioUrl) && extractAceTaskIdFromStemsUrl(l.stemsUrl))
          .slice(0, 12);
        if (!candidates.length) return;

        let changed = false;
        for (const c of candidates) {
          try {
            const taskId = extractAceTaskIdFromStemsUrl(c.stemsUrl);
            if (!taskId) continue;
            const url = await resolveAceAudioUrlWithRetry(taskId);
            if (!isHttpUrl(url)) continue;

            if (epoch !== myLoopsLoadEpoch || useAuthStore.getState().user?.id !== userId) return;
            const { error } = await supabase.from("loops").update({ audio_url: url }).eq("id", c.id).eq("user_id", userId);
            if (error) continue;

            changed = true;
            useLoopsStore.setState((s) => ({
              loops: s.loops.map((l) => (l.id === c.id ? { ...l, audioUrl: url } : l)),
            }));
            void cacheLoopAudioFromSrc(c.id, url);
          } catch {
            continue;
          }
        }

        if (changed) {
          const currentLoops = useLoopsStore.getState().loops;
          if (epoch === myLoopsLoadEpoch && useAuthStore.getState().user?.id === userId) persistMyLoopsCache(userId, currentLoops);
        }
      })();

      void (async () => {
        if (epoch !== myLoopsLoadEpoch || useAuthStore.getState().user?.id !== userId) return;
        const existing = useLoopsStore.getState().durationsSecById;
        const candidates = nextLoops.filter((l) => l.audioUrl && !existing[l.id]);
        if (!candidates.length) return;
        const results = await Promise.all(
          candidates.map(async (l) => {
            const dur = await probeDurationSec(l.audioUrl as string);
            return dur ? ([l.id, dur] as const) : null;
          }),
        );
        const merged: Record<string, number> = { ...useLoopsStore.getState().durationsSecById };
        let changed = false;
        for (const pair of results) {
          if (!pair) continue;
          merged[pair[0]] = pair[1];
          changed = true;
        }
        if (changed && epoch === myLoopsLoadEpoch && useAuthStore.getState().user?.id === userId) set({ durationsSecById: merged });
      })();

      void (async () => {
        if (epoch !== myLoopsLoadEpoch || useAuthStore.getState().user?.id !== userId) return;
        const pendingNow = loadPendingSaves(userId);
        if (!pendingNow.length) return;
        let remaining = pendingNow.slice();
        for (const p of pendingNow.slice(0, 8)) {
          const url = typeof p.draft.audioUrl === "string" ? p.draft.audioUrl.trim() : "";
          if (!url || (!url.startsWith("https://") && !url.startsWith("http://"))) continue;
          try {
            const { data, error } = await supabase
              .from("loops")
              .select("id")
              .eq("user_id", userId)
              .eq("audio_url", url)
              .limit(1)
              .maybeSingle();
            if (error) throw error;
            if (data?.id) {
              remaining = remaining.filter((it) => it.localId !== p.localId);
              useLoopsStore.getState().removeLoop(p.localId);
              continue;
            }
            const created = await useLoopsStore.getState().createLoop(p.draft);
            useLoopsStore.getState().removeLoop(p.localId);
            remaining = remaining.filter((it) => it.localId !== p.localId);
            useLoopsStore.getState().upsertLoop(created);
          } catch {
            continue;
          }
        }
        if (remaining.length !== pendingNow.length) savePendingSaves(userId, remaining);
      })();
    } finally {
      if (epoch === myLoopsLoadEpoch && useAuthStore.getState().user?.id === userId) set({ loading: false });
    }
  },
  createLoop: async (input, options) => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error("Not authenticated");

    const replaceLoopId = options?.replaceLoopId;

    const trimmedAudioUrl = typeof input.audioUrl === "string" ? input.audioUrl.trim() : "";
    const audioUrlForDb =
      trimmedAudioUrl && (trimmedAudioUrl.startsWith("https://") || trimmedAudioUrl.startsWith("http://")) && !trimmedAudioUrl.startsWith("blob:")
        ? trimmedAudioUrl
        : null;

    const safeCaption = (v: unknown) => (typeof v === "string" ? v.trim().slice(0, 2000) : "");
    const safeLyrics = (v: unknown) => (typeof v === "string" ? v.trim().slice(0, 20000) : "");
    const safeAudioFormat = (v: unknown) => {
      const s = typeof v === "string" ? v.trim() : "";
      if (!s) return null;
      return s.length > 24 ? s.slice(0, 24) : s;
    };

    const detailsForDb = input.details
      ? {
          caption: safeCaption(input.details.caption ?? ""),
          lyrics: safeLyrics(input.details.lyrics ?? ""),
          bpm: input.details.bpm ?? null,
          duration: input.details.duration ?? null,
          keyScale: safeCaption(input.details.keyScale ?? ""),
          timeSignature: safeCaption(input.details.timeSignature ?? ""),
          audioFormat: safeAudioFormat(input.details.audioFormat ?? null),
        }
      : null;

    const stemsUrlForDb = buildStemsUrlForDb(input.stemsUrl, detailsForDb);

    const payload = {
      user_id: user.id,
      engine: input.engine ?? null,
      name: input.name,
      genre: input.genre,
      influence: input.influence,
      key: input.key,
      scale: input.scale,
      bpm: input.bpm,
      loop_length: input.loopLength,
      swing: input.swing,
      mood: input.mood,
      energy_level: input.energyLevel,
      reverb: input.reverb,
      prompt: input.prompt,
      audio_url: audioUrlForDb,
      stems_url: stemsUrlForDb,
      is_saved: input.isSaved,
      is_public: input.isPublic,
      seed: typeof input.seed === "number" && Number.isFinite(input.seed) ? input.seed : null,
    };

    const attemptPayload = payload as unknown as Record<string, unknown>;
    let result = await supabase.from("loops").insert(attemptPayload).select("*").single();
    for (let i = 0; i < 3 && result.error; i++) {
      let changed = false;
      if (isMissingColumnError(result.error, "energy_level") && "energy_level" in attemptPayload) {
        attemptPayload.vocal_type = input.energyLevel;
        delete attemptPayload.energy_level;
        changed = true;
      }
      if (isMissingColumnError(result.error, "engine") && "engine" in attemptPayload) {
        delete attemptPayload.engine;
        changed = true;
      }
      if (isMissingColumnError(result.error, "is_public") && "is_public" in attemptPayload) {
        delete attemptPayload.is_public;
        changed = true;
      }
      if (isMissingColumnError(result.error, "seed") && "seed" in attemptPayload) {
        delete attemptPayload.seed;
        changed = true;
      }
      if (!changed) break;
      result = await supabase.from("loops").insert(attemptPayload).select("*").single();
    }
    if (result.error) {
      const minimal: Record<string, unknown> = {
        user_id: user.id,
        name: input.name,
        genre: input.genre,
        influence: input.influence,
        key: input.key,
        scale: input.scale,
        bpm: input.bpm,
        loop_length: input.loopLength,
        mood: input.mood,
        energy_level: input.energyLevel,
        reverb: input.reverb,
        swing: input.swing,
        prompt: input.prompt,
        audio_url: audioUrlForDb,
        stems_url: stemsUrlForDb,
        is_saved: input.isSaved,
        is_public: input.isPublic,
      };
      result = await supabase.from("loops").insert(minimal).select("*").single();
      if (result.error && isMissingColumnError(result.error, "energy_level")) {
        minimal.vocal_type = input.energyLevel;
        delete minimal.energy_level;
        result = await supabase.from("loops").insert(minimal).select("*").single();
      }
      if (result.error && isMissingColumnError(result.error, "is_public")) {
        delete minimal.is_public;
        result = await supabase.from("loops").insert(minimal).select("*").single();
      }
      if (result.error && "stems_url" in minimal) {
        delete minimal.stems_url;
        result = await supabase.from("loops").insert(minimal).select("*").single();
        if (result.error && isMissingColumnError(result.error, "energy_level")) {
          minimal.vocal_type = input.energyLevel;
          delete minimal.energy_level;
          result = await supabase.from("loops").insert(minimal).select("*").single();
        }
        if (result.error && isMissingColumnError(result.error, "is_public")) {
          delete minimal.is_public;
          result = await supabase.from("loops").insert(minimal).select("*").single();
        }
      }
    }
    if (result.error) throw result.error;

    const row = result.data as DbLoop;
    const baseLoop = toLoop(row);
    let finalLoop: Loop = {
      ...baseLoop,
      ...(trimmedAudioUrl ? { audioUrl: trimmedAudioUrl } : {}),
      isPublic: Boolean(input.isPublic),
    };

    if (input.isPublic) {
      void (async () => {
        try {
          const finalized = await finalizePublicLoopRecord({
            loopId: row.id,
            userId: user.id,
            isPublic: true,
            audioUrlInput: trimmedAudioUrl,
            audioUrlForDb,
            stemsUrlForDb,
          });
          if (!finalized.audioUrl && !finalized.stemsUrl) return;

          useLoopsStore.setState((s) => ({
            loops: s.loops.map((l) =>
              l.id === row.id
                ? {
                    ...l,
                    audioUrl: finalized.audioUrl ?? l.audioUrl,
                    stemsUrl: finalized.stemsUrl ?? l.stemsUrl,
                    isPublic: true,
                  }
                : l,
            ),
          }));
          persistMyLoopsCache(user.id, useLoopsStore.getState().loops);
        } catch {
          // ignore background finalize errors
        }
      })();
    }

    set((s) => {
      const replaceId = replaceLoopId;

      if (replaceId) {
        const next: Loop[] = [];
        let replaced = false;
        for (const l of s.loops) {
          if (l.id === replaceId) {
            next.push(finalLoop);
            replaced = true;
            continue;
          }
          if (l.id === finalLoop.id) continue;
          if (l.id.startsWith("preview-") && l.name === finalLoop.name) continue;
          next.push(l);
        }
        if (!replaced) next.unshift(finalLoop);
        return { loops: next.slice(0, 200) };
      }

      const withoutDup = s.loops.filter(
        (l) => l.id !== finalLoop.id && !(l.id.startsWith("preview-") && l.name === finalLoop.name),
      );
      return { loops: [finalLoop, ...withoutDup].slice(0, 200) };
    });
    persistMyLoopsCache(user.id, useLoopsStore.getState().loops);
    void cacheLoopAudioFromSrc(row.id, finalLoop.audioUrl ?? trimmedAudioUrl);

    const player = usePlayerStore.getState();
    const current = player.current;
    if (replaceLoopId && current?.id === replaceLoopId) {
      player.setCurrent({ ...finalLoop }, player.isPlaying);
    }

    return finalLoop;
  },
  toggleSavedRemote: async (id) => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error("Not authenticated");
    const current = useLoopsStore.getState().loops.find((l) => l.id === id);
    const next = !(current?.isSaved ?? false);

    const { error } = await supabase
      .from("loops")
      .update({ is_saved: next })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;
    set((s) => ({ loops: s.loops.map((l) => (l.id === id ? { ...l, isSaved: next } : l)) }));
    persistMyLoopsCache(user.id, useLoopsStore.getState().loops);
    return next;
  },
  togglePublicRemote: async (id) => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error("Not authenticated");
    const pickHttp = (v: unknown) => (isHttpUrl(v) ? v.trim() : "");
    const extractAceTaskId = (loop: Loop | null) => extractAceTaskIdFromStemsUrl(loop?.stemsUrl);

    if (id.startsWith("local-") || id.startsWith("preview-")) {
      const local = useLoopsStore.getState().loops.find((l) => l.id === id) ?? null;
      if (!local) throw new Error("Track introuvable");
      const next = !(local.isPublic ?? false);
      const draft: Omit<Loop, "id" | "createdAt" | "userId"> = {
        engine: local.engine,
        name: local.name,
        genre: local.genre,
        influence: local.influence,
        key: local.key,
        scale: local.scale,
        bpm: local.bpm,
        loopLength: local.loopLength,
        swing: local.swing,
        mood: local.mood,
        energyLevel: local.energyLevel,
        reverb: local.reverb,
        prompt: local.prompt,
        audioUrl: local.audioUrl,
        seed: local.seed ?? null,
        details: local.details ?? null,
        stemsUrl: local.stemsUrl ?? null,
        isSaved: local.isSaved,
        isPublic: next,
      };

      const created = await useLoopsStore.getState().createLoop(draft);
      useLoopsStore.getState().removeLoop(id);
      const pending = loadPendingSaves(user.id);
      if (pending.length) savePendingSaves(user.id, pending.filter((p) => p.localId !== id));

      const payload: { is_public: boolean; audio_url?: string | null } = { is_public: next };
      if (next) {
        const url = await resolvePublicAudioForLoop(local, created.id, user.id);
        if (url) payload.audio_url = url;
        if (!payload.audio_url) throw new Error("Audio not ready");
      }

      const { error } = await supabase.from("loops").update(payload).eq("id", created.id).eq("user_id", user.id);
      if (error) throw error;

      const updated = {
        ...created,
        isPublic: next,
        audioUrl: typeof payload.audio_url === "string" && payload.audio_url.trim().length > 0 ? payload.audio_url.trim() : created.audioUrl,
      };
      useLoopsStore.getState().upsertLoop(updated);
      persistMyLoopsCache(user.id, useLoopsStore.getState().loops);
      return next;
    }

    const current = useLoopsStore.getState().loops.find((l) => l.id === id);
    if (!current) throw new Error("Track introuvable");
    const next = !(current.isPublic ?? false);

    const payload: { is_public: boolean; audio_url?: string | null } = { is_public: next };

    if (next) {
      const url = await resolvePublicAudioForLoop(current, id, user.id);
      if (url) payload.audio_url = url;
      if (!payload.audio_url) throw new Error("Audio not ready");
    }

    const { error } = await supabase.from("loops").update(payload).eq("id", id).eq("user_id", user.id);
    if (error) throw error;
    set((s) => ({
      loops: s.loops.map((l) =>
        l.id === id
          ? {
              ...l,
              isPublic: next,
              audioUrl: typeof payload.audio_url === "string" && payload.audio_url.trim().length > 0 ? payload.audio_url.trim() : l.audioUrl,
            }
          : l,
      ),
    }));
    persistMyLoopsCache(user.id, useLoopsStore.getState().loops);
    return next;
  },
  renameLoopRemote: async (id, name) => {
    const nextName = name.trim().replace(/\s+/g, " ").slice(0, 72);
    if (!nextName) throw new Error("Invalid name");
    set((s) => ({ loops: s.loops.map((l) => (l.id === id ? { ...l, name: nextName } : l)) }));

    if (id.startsWith("local-") || id.startsWith("preview-")) return;

    const user = useAuthStore.getState().user;
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase.from("loops").update({ name: nextName }).eq("id", id).eq("user_id", user.id);
    if (error) throw error;
  },
  deleteLoopRemote: async (id) => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase.from("loops").delete().eq("id", id).eq("user_id", user.id);
    if (error) throw error;
    useLoopsStore.getState().removeLoop(id);
  },
}));

