import {
  buildAceStemsFromMeta,
  buildSongUiPrompt,
  defaultBeatName,
  defaultSongName,
  estimateSongDurationFromLyrics,
  generateTypeBeatAce,
  isHttpAudioUrl,
  prepareLoopVariantGeneration,
  resolveSongVocalLanguage,
  toGenerateParams,
  toSongGenerateParams,
  variantResultTitle,
  type GenerateParams,
  type GenerateTypeBeatAceDeps,
  type GenerationJobStatus,
  type LoopVariantKind,
} from "@producerhit/shared";
import type { GenerateBeatInput, Loop, LoopLength, UserProfile } from "@producerhit/shared";
import { normalizePlanId, planMonthlyLimit } from "@producerhit/shared";
import { mobileJobsClient } from "./generationClient";
import { assignLoopCoverWithTimeout } from "./pinterestCover";
import { invokeSupabaseFunction } from "./edgeInvoke";
import { supabase } from "./supabase";

export { defaultBeatName, defaultSongName };

const LOOP_SELECT =
  "id, user_id, name, genre, influence, key, scale, bpm, loop_length, swing, mood, energy_level, reverb, prompt, audio_url, cover_url, is_saved, is_public, created_at, stems_url, seed";

function randomKey(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function isMissingColumnError(error: { message?: string } | null, column: string): boolean {
  const msg = error?.message?.toLowerCase() ?? "";
  return msg.includes(column.toLowerCase()) && (msg.includes("column") || msg.includes("schema cache"));
}

function createAceDeps(accessToken: string): GenerateTypeBeatAceDeps {
  return {
    jobsClient: mobileJobsClient,
    asyncJobsEnabled: true,
    invokeAceSync: async (body) => {
      const { data, errorText, limitReached } = await invokeSupabaseFunction<{
        audioUrl?: string;
        meta?: Record<string, unknown>;
        error?: string;
        limitReached?: boolean;
      }>({
        name: "generate-loop-ace",
        body,
        accessToken,
      });
      if (errorText) return { error: errorText, limitReached };
      return {
        audioUrl: data?.audioUrl,
        meta: data?.meta ?? null,
        error: data?.error,
        limitReached: data?.limitReached,
      };
    },
    invokeSonauto: async (body) => {
      const { data, errorText, limitReached } = await invokeSupabaseFunction<{ audioUrl?: string }>({
        name: "generate-loop",
        body,
        accessToken,
      });
      if (errorText) {
        const err = new Error(errorText) as Error & { limitReached?: boolean };
        err.limitReached = limitReached;
        throw err;
      }
      const audioUrl = data?.audioUrl?.trim();
      if (!audioUrl) throw new Error("No audio URL returned");
      return { audioUrl };
    },
  };
}

function parseKeyScale(keyScale?: string | null): { key: string; scale: string } {
  const raw = (keyScale ?? "").trim();
  if (!raw) return { key: "A", scale: "Minor" };
  const parts = raw.split(/\s+/);
  if (parts.length >= 2) return { key: parts[0] ?? "A", scale: parts.slice(1).join(" ") };
  return { key: raw, scale: "Minor" };
}

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, plan, loops_used_this_month, email, referral_bonus, level_bonus, daily_bonus_month, purchased_bonus, referral_code, username",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return {
    id: data.id,
    plan: normalizePlanId(data.plan),
    loopsUsedThisMonth: data.loops_used_this_month ?? 0,
    email: data.email,
    referralBonus: data.referral_bonus ?? 0,
    levelBonus: data.level_bonus ?? 0,
    dailyBonusMonth: data.daily_bonus_month ?? 0,
    purchasedBonus: data.purchased_bonus ?? 0,
    referralCode: data.referral_code ?? null,
    username: data.username ?? null,
  };
}

type DbLoopRow = {
  id: string;
  user_id: string;
  name: string;
  genre: string;
  influence: string;
  key: string;
  scale: string;
  bpm: number;
  loop_length: string;
  swing: number;
  mood: string;
  energy_level: string;
  reverb: string;
  prompt: string;
  audio_url: string | null;
  cover_url: string | null;
  is_saved: boolean;
  is_public: boolean;
  created_at: string;
  stems_url?: unknown;
  seed?: number | null;
};

export function resolveAudioUrl(raw: string | null | undefined): string | null {
  const src = typeof raw === "string" ? raw.trim() : "";
  if (!src) return null;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  return null;
}

function parseStemsRecord(raw: unknown): Record<string, unknown> | null {
  if (!raw) return null;
  if (typeof raw === "object") return raw as Record<string, unknown>;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  return null;
}

export function mapLoopRow(row: DbLoopRow): Loop {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    genre: row.genre,
    influence: row.influence,
    key: row.key,
    scale: row.scale,
    bpm: row.bpm,
    loopLength: row.loop_length as LoopLength,
    swing: row.swing ?? 0,
    mood: row.mood,
    energyLevel: row.energy_level ?? "Medium",
    reverb: row.reverb,
    prompt: row.prompt,
    audioUrl: resolveAudioUrl(row.audio_url),
    coverUrl: row.cover_url,
    stemsUrl: parseStemsRecord(row.stems_url),
    seed: row.seed ?? null,
    isSaved: row.is_saved,
    isPublic: row.is_public,
    createdAt: row.created_at,
  };
}

export async function fetchUserLoops(userId: string, limit = 50): Promise<Loop[]> {
  const { data, error } = await supabase
    .from("loops")
    .select(LOOP_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map((row) => mapLoopRow(row as DbLoopRow));
}

export function subscribeUserLoops(userId: string, onChange: () => void) {
  const channel = supabase
    .channel(`loops-mobile-${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "loops", filter: `user_id=eq.${userId}` },
      () => onChange(),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function deleteLoop(loopId: string): Promise<void> {
  const { error } = await supabase.from("loops").delete().eq("id", loopId);
  if (error) throw error;
}

export async function updateLoop(
  loopId: string,
  patch: { name?: string; isPublic?: boolean },
): Promise<Loop> {
  const payload: Record<string, unknown> = {};
  if (patch.name !== undefined) payload.name = patch.name.trim();
  if (patch.isPublic !== undefined) payload.is_public = patch.isPublic;

  const { data, error } = await supabase.from("loops").update(payload).eq("id", loopId).select(LOOP_SELECT).single();
  if (error) throw error;
  return mapLoopRow(data as DbLoopRow);
}

export async function setLoopPublic(loopId: string, isPublic: boolean): Promise<Loop> {
  return updateLoop(loopId, { isPublic });
}

type InsertMeta = {
  name: string;
  mood: string;
  influence: string;
  key: string;
  scale: string;
  loopLength: LoopLength;
  bpm: number;
};

async function insertLoopRow(
  sessionUserId: string,
  genre: string,
  meta: InsertMeta,
  audioUrl: string,
  prompt: string,
  stemsUrl: Record<string, unknown> | null,
): Promise<Loop> {
  const payload: Record<string, unknown> = {
    user_id: sessionUserId,
    name: meta.name,
    genre,
    influence: meta.influence,
    key: meta.key,
    scale: meta.scale,
    bpm: meta.bpm,
    loop_length: meta.loopLength,
    swing: 0,
    mood: meta.mood,
    energy_level: "Medium",
    reverb: "Medium",
    prompt: prompt.slice(0, 500),
    audio_url: audioUrl,
    stems_url: stemsUrl,
    is_saved: true,
    is_public: false,
  };

  let result = await supabase.from("loops").insert(payload).select(LOOP_SELECT).single();

  for (let i = 0; i < 3 && result.error; i++) {
    let changed = false;
    if (isMissingColumnError(result.error, "energy_level") && "energy_level" in payload) {
      payload.vocal_type = "Medium";
      delete payload.energy_level;
      changed = true;
    }
    if (isMissingColumnError(result.error, "is_public") && "is_public" in payload) {
      delete payload.is_public;
      changed = true;
    }
    if (isMissingColumnError(result.error, "stems_url") && "stems_url" in payload) {
      delete payload.stems_url;
      changed = true;
    }
    if (!changed) break;
    result = await supabase.from("loops").insert(payload).select(LOOP_SELECT).single();
  }

  if (result.error) throw result.error;
  const loop = mapLoopRow(result.data as DbLoopRow);
  return assignLoopCoverWithTimeout(loop, { timeoutMs: 14_000 });
}

export type GenerateJobOptions = {
  onJobStatus?: (status: GenerationJobStatus) => void;
};

export type GenerateSongInput = {
  genre: string;
  description: string;
  lyrics?: string;
  lyricsMode: "ai" | "manual";
  vocalStyle?: string;
  captionOverride?: string | null;
  vocalLanguageMode?: "auto" | "manual";
  manualVocalLanguage?: string;
};

export async function generateSong(input: GenerateSongInput, options?: GenerateJobOptions): Promise<Loop> {
  const generationKey = randomKey();
  const description = input.description.trim() || (input.lyricsMode === "manual" ? (input.lyrics ?? "").trim() : "");
  if (!description) throw new Error("Describe your song idea first");

  let effectiveLyricsMode = input.lyricsMode;
  let effectiveLyrics = input.lyricsMode === "manual" ? (input.lyrics ?? "").trim() : "";
  if (effectiveLyricsMode === "manual" && !effectiveLyrics) {
    effectiveLyricsMode = "ai";
    effectiveLyrics = "";
  }

  const hasManualLyrics = effectiveLyricsMode === "manual" && effectiveLyrics.length > 0;
  const vocalLanguage = resolveSongVocalLanguage({
    mode: input.vocalLanguageMode ?? "auto",
    manualCode: input.manualVocalLanguage ?? "en",
    lyricsMode: effectiveLyricsMode,
    lyrics: effectiveLyrics,
    songDescription: description,
  });

  const params: GenerateParams = toSongGenerateParams({
    genre: input.genre,
    description,
    vocalStyle: input.vocalStyle,
    loopLength: "16 bars",
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");

  const result = await generateTypeBeatAce(params, createAceDeps(session.access_token), {
    instrumental: false,
    isSong: true,
    lyrics: effectiveLyrics,
    vocalLanguage,
    autoMeta: true,
    thinking: true,
    useFormat: !hasManualLyrics,
    duration: hasManualLyrics ? estimateSongDurationFromLyrics(effectiveLyrics) : undefined,
    generationKey,
    requirePersistableUrl: true,
    captionOverride: input.captionOverride ?? undefined,
    onJobStatus: options?.onJobStatus,
  });

  const playableUrl = isHttpAudioUrl(result.audioUrl) ? result.audioUrl.trim() : "";
  if (!playableUrl) throw new Error("No playable HTTP audio URL returned");

  const stemsUrl = buildAceStemsFromMeta(result.meta, playableUrl);
  const storedPrompt = buildSongUiPrompt(input.genre, description, input.vocalStyle);
  const keyScale = parseKeyScale(result.meta?.keyScale);
  const bpm = result.meta?.bpm && result.meta.bpm > 0 ? result.meta.bpm : 120;

  return assignLoopCoverWithTimeout(
    await insertLoopRow(
      session.user.id,
      input.genre,
      {
        name: defaultSongName(input.genre),
        mood: "",
        influence: "No Influence",
        key: keyScale.key,
        scale: keyScale.scale,
        loopLength: "16 bars",
        bpm,
      },
      playableUrl,
      storedPrompt,
      stemsUrl,
    ),
    { timeoutMs: 14_000 },
  );
}

export async function generateLoopVariant(
  loop: Loop,
  kind: LoopVariantKind,
  options?: GenerateJobOptions,
): Promise<Loop> {
  const generationKey = randomKey();
  const { inputParams, generateOptions, nextSeed } = prepareLoopVariantGeneration(loop, kind);

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");

  const result = await generateTypeBeatAce(inputParams, createAceDeps(session.access_token), {
    ...generateOptions,
    generationKey,
    requirePersistableUrl: true,
    onJobStatus: options?.onJobStatus,
  });

  const playableUrl = isHttpAudioUrl(result.audioUrl) ? result.audioUrl.trim() : "";
  if (!playableUrl) throw new Error("No playable HTTP audio URL returned");

  const stemsUrl = buildAceStemsFromMeta(result.meta, playableUrl);
  const keyScale = parseKeyScale(result.meta?.keyScale);
  const bpm = result.meta?.bpm && result.meta.bpm > 0 ? result.meta.bpm : loop.bpm;

  const payload: Record<string, unknown> = {
    user_id: session.user.id,
    name: variantResultTitle(loop, kind),
    genre: loop.genre,
    influence: loop.influence,
    key: keyScale.key || loop.key,
    scale: keyScale.scale || loop.scale,
    bpm,
    loop_length: loop.loopLength,
    swing: loop.swing,
    mood: loop.mood,
    energy_level: loop.mood ? "Medium" : "",
    reverb: loop.reverb,
    prompt: inputParams.prompt,
    audio_url: playableUrl,
    stems_url: stemsUrl,
    seed: nextSeed,
    is_saved: true,
    is_public: false,
  };

  let insertResult = await supabase.from("loops").insert(payload).select(LOOP_SELECT).single();

  for (let i = 0; i < 3 && insertResult.error; i++) {
    let changed = false;
    if (isMissingColumnError(insertResult.error, "seed") && "seed" in payload) {
      delete payload.seed;
      changed = true;
    }
    if (isMissingColumnError(insertResult.error, "energy_level") && "energy_level" in payload) {
      payload.vocal_type = "Medium";
      delete payload.energy_level;
      changed = true;
    }
    if (isMissingColumnError(insertResult.error, "is_public") && "is_public" in payload) {
      delete payload.is_public;
      changed = true;
    }
    if (!changed) break;
    insertResult = await supabase.from("loops").insert(payload).select(LOOP_SELECT).single();
  }

  if (insertResult.error) throw insertResult.error;
  return assignLoopCoverWithTimeout(
    mapLoopRow(insertResult.data as DbLoopRow),
    { timeoutMs: 14_000 },
  );
}

export async function generateTypeBeat(
  input: GenerateBeatInput,
  meta: { name: string; mood: string; influence: string; key: string; scale: string; loopLength: LoopLength },
  options?: GenerateJobOptions & { captionOverride?: string | null },
): Promise<Loop> {
  const generationKey = randomKey();
  const params: GenerateParams = toGenerateParams({
    genre: input.genre,
    bpm: input.bpm,
    prompt: input.prompt,
    mood: meta.mood,
    influence: meta.influence,
    key: meta.key,
    scale: meta.scale,
    loopLength: meta.loopLength,
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");

  const result = await generateTypeBeatAce(params, createAceDeps(session.access_token), {
    instrumental: true,
    isSong: false,
    generationKey,
    requirePersistableUrl: true,
    autoMeta: false,
    captionOverride: options?.captionOverride ?? undefined,
    onJobStatus: options?.onJobStatus,
  });

  const playableUrl = isHttpAudioUrl(result.audioUrl) ? result.audioUrl.trim() : "";
  if (!playableUrl) throw new Error("No playable HTTP audio URL returned");

  const stemsUrl = buildAceStemsFromMeta(result.meta, playableUrl);
  const storedPrompt = input.prompt?.trim() || params.prompt || "";

  return assignLoopCoverWithTimeout(
    await insertLoopRow(
      session.user.id,
      input.genre,
      {
        name: meta.name,
        mood: meta.mood,
        influence: meta.influence,
        key: meta.key,
        scale: meta.scale,
        loopLength: meta.loopLength,
        bpm: input.bpm,
      },
      playableUrl,
      storedPrompt,
      stemsUrl,
    ),
    { timeoutMs: 14_000 },
  );
}

export function getTotalGenerationLimit(profile: UserProfile | null): number {
  if (!profile) return planMonthlyLimit("free");
  const base = planMonthlyLimit(profile.plan);
  const extra =
    Math.max(0, profile.referralBonus ?? 0) +
    Math.max(0, profile.levelBonus ?? 0) +
    Math.max(0, profile.dailyBonusMonth ?? 0) +
    Math.max(0, profile.purchasedBonus ?? 0);
  return base + extra;
}

export function usageSummary(profile: UserProfile | null): { used: number; limit: number; remaining: number } {
  const used = profile?.loopsUsedThisMonth ?? 0;
  const limit = getTotalGenerationLimit(profile);
  return { used, limit, remaining: Math.max(0, limit - used) };
}
