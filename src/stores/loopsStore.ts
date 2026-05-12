import { create } from "zustand";
import { supabase } from "@/lib/supabaseClient";
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

function toLoop(row: DbLoop): Loop {
  const audioUrl = row.audio_url || null;
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

type LoopsState = {
  loops: Loop[];
  loading: boolean;
  durationsSecById: Record<string, number>;
  setLoops: (loops: Loop[]) => void;
  upsertLoop: (loop: Loop) => void;
  removeLoop: (id: string) => void;
  toggleSaved: (id: string) => void;
  togglePublic: (id: string) => void;
  clear: () => void;
  loadMyLoops: () => Promise<void>;
  createLoop: (input: Omit<Loop, "id" | "createdAt" | "userId">) => Promise<Loop>;
  toggleSavedRemote: (id: string) => Promise<boolean>;
  togglePublicRemote: (id: string) => Promise<boolean>;
  deleteLoopRemote: (id: string) => Promise<void>;
};

export const useLoopsStore = create<LoopsState>((set) => ({
  loops: [],
  loading: false,
  durationsSecById: {},
  setLoops: (loops) => set({ loops }),
  upsertLoop: (loop) =>
    set((s) => {
      const next = s.loops.slice();
      const i = next.findIndex((l) => l.id === loop.id);
      if (i >= 0) next[i] = loop;
      else next.unshift(loop);
      return { loops: next.slice(0, 50) };
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
  clear: () =>
    set((s) => {
      s.loops.forEach((l) => {
        if (l.audioUrl?.startsWith("blob:")) URL.revokeObjectURL(l.audioUrl);
      });
      return { loops: [] };
    }),
  loadMyLoops: async () => {
    const user = useAuthStore.getState().user;
    if (!user) {
      useLoopsStore.getState().clear();
      return;
    }
    set({ loading: true });
    try {
      const prevLoops = useLoopsStore.getState().loops;
      const prevById = new Map<string, Loop>();
      prevLoops.forEach((l) => prevById.set(l.id, l));
      const { data, error } = await supabase
        .from("loops")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      const rows = (data ?? []) as DbLoop[];
      const nextLoops = rows.map((row) => {
        if (row.audio_url) return toLoop(row);
        const prev = prevById.get(row.id);
        if (prev?.audioUrl) return toLoop({ ...row, audio_url: prev.audioUrl });
        return toLoop(row);
      });

      const missing = nextLoops.filter((l) => !l.audioUrl);
      if (missing.length) {
        const recs = await Promise.all(missing.map((l) => audioCacheGet(l.id).catch(() => null)));
        const nextById = new Map<string, string>();
        const nextDurById = new Map<string, number>();
        for (let i = 0; i < missing.length; i++) {
          const rec = recs[i];
          if (!rec?.blob) continue;
          nextById.set(missing[i].id, URL.createObjectURL(rec.blob));
          if (rec.durationSec && isFinite(rec.durationSec) && rec.durationSec > 0) nextDurById.set(missing[i].id, rec.durationSec);
        }
        if (nextById.size) {
          for (let i = 0; i < nextLoops.length; i++) {
            const url = nextById.get(nextLoops[i].id);
            if (url) nextLoops[i] = { ...nextLoops[i], audioUrl: url };
          }
          const player = usePlayerStore.getState();
          const current = player.current;
          if (current && !current.audioUrl) {
            const url = nextById.get(current.id);
            if (url) {
              player.setCurrent({ ...current, audioUrl: url }, player.isPlaying);
            }
          }
          if (nextDurById.size) {
            set((s) => {
              const merged: Record<string, number> = { ...s.durationsSecById };
              nextDurById.forEach((v, k) => {
                merged[k] = v;
              });
              return { durationsSecById: merged };
            });
          }
        }
      }

      set({ loops: nextLoops });

      void (async () => {
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
        if (changed) set({ durationsSecById: merged });
      })();
    } finally {
      set({ loading: false });
    }
  },
  createLoop: async (input) => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error("Not authenticated");

    const audioUrlForDb =
      input.audioUrl?.startsWith("https://") && !input.audioUrl.startsWith("blob:") ? input.audioUrl : null;

    const stemsUrlForDb =
      input.details
        ? { ...(input.stemsUrl ?? {}), ace: input.details }
        : (input.stemsUrl ?? null);

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
      if (isMissingColumnError(result.error, "seed") && "seed" in attemptPayload) {
        delete attemptPayload.seed;
        changed = true;
      }
      if (!changed) break;
      result = await supabase.from("loops").insert(attemptPayload).select("*").single();
    }
    if (result.error) throw result.error;

    const row = result.data as DbLoop;
    const baseLoop = toLoop(row);
    const finalLoop = input.audioUrl ? { ...baseLoop, audioUrl: input.audioUrl } : baseLoop;
    set((s) => ({ loops: [finalLoop, ...s.loops].slice(0, 50) }));

    if (input.audioUrl && (input.audioUrl.startsWith("blob:") || input.audioUrl.startsWith("data:"))) {
      void (async () => {
        try {
          const res = await fetch(input.audioUrl);
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const durationSec = await probeDurationSec(url);
          URL.revokeObjectURL(url);
          await audioCachePut(row.id, blob, durationSec);
          if (durationSec) {
            set((s) => ({ durationsSecById: { ...s.durationsSecById, [row.id]: durationSec } }));
          }
        } catch (e) {
          void e;
        }
      })();
    }

    if (input.audioUrl && input.audioUrl.startsWith("https://")) {
      void (async () => {
        const durationSec = await probeDurationSec(input.audioUrl as string);
        if (durationSec) set((s) => ({ durationsSecById: { ...s.durationsSecById, [row.id]: durationSec } }));
      })();
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
    return next;
  },
  togglePublicRemote: async (id) => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error("Not authenticated");
    const current = useLoopsStore.getState().loops.find((l) => l.id === id);
    const next = !(current?.isPublic ?? false);

    const { error } = await supabase
      .from("loops")
      .update({ is_public: next })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;
    set((s) => ({ loops: s.loops.map((l) => (l.id === id ? { ...l, isPublic: next } : l)) }));
    return next;
  },
  deleteLoopRemote: async (id) => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase.from("loops").delete().eq("id", id).eq("user_id", user.id);
    if (error) throw error;
    useLoopsStore.getState().removeLoop(id);
  },
}));

