import { normalizePlanId, type PlanId } from "@/lib/planEntitlements";
import { supabase } from "@/lib/supabaseClient";

/** Transcriptions voix → paroles / mois (Song Mode). Studio+ = illimité côté UI. */
export const VOICE_TO_SONG_TRIAL_LIMITS: Record<PlanId, number | null> = {
  free: 2,
  pro: 5,
  studio: null,
  plus: null,
};

export const VOICE_MAX_FILE_BYTES = 12 * 1024 * 1024;
export const VOICE_MAX_RECORD_SEC = 90;

export const VOICE_ACCEPT =
  "audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/webm,audio/ogg,audio/aac,audio/flac,.mp3,.wav,.webm,.m4a,.aac,.flac";

export function voiceToSongMonthlyLimit(plan: string | null | undefined): number {
  const id = normalizePlanId(plan);
  const cap = VOICE_TO_SONG_TRIAL_LIMITS[id];
  return cap ?? 999_999;
}

export function hasUnlimitedVoiceToSong(plan: string | null | undefined): boolean {
  return VOICE_TO_SONG_TRIAL_LIMITS[normalizePlanId(plan)] === null;
}

export function getVoiceToSongRemaining(plan: string, usedThisMonth: number): number {
  const limit = voiceToSongMonthlyLimit(plan);
  return Math.max(0, limit - Math.max(0, usedThisMonth));
}

export function validateVoiceFile(file: File): "missing_file" | "file_too_large" | "invalid_type" | null {
  if (!file) return "missing_file";
  if (file.size > VOICE_MAX_FILE_BYTES) return "file_too_large";
  const name = file.name.toLowerCase();
  const ok =
    file.type.startsWith("audio/") ||
    name.endsWith(".mp3") ||
    name.endsWith(".wav") ||
    name.endsWith(".webm") ||
    name.endsWith(".m4a") ||
    name.endsWith(".aac") ||
    name.endsWith(".flac");
  return ok ? null : "invalid_type";
}

export type VoiceTranscribeResult = {
  text: string;
  language?: string;
  used: number;
  limit: number;
  remaining: number;
  plan: string;
};

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80) || "voice.webm";
}

export async function uploadVoiceFile(userId: string, file: File): Promise<string> {
  const err = validateVoiceFile(file);
  if (err === "file_too_large") throw new Error("file_too_large");
  if (err) throw new Error(err);

  const path = `${userId}/${Date.now()}-${sanitizeFileName(file.name)}`;
  const { error } = await supabase.storage.from("voice-uploads").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  return path;
}

export async function transcribeVoiceUpload(storagePath: string): Promise<VoiceTranscribeResult> {
  const { data, error } = await supabase.functions.invoke("transcribe-voice", {
    body: { storagePath },
  });

  if (error) {
    const ctx = error as { context?: { body?: string }; message?: string };
    if (typeof ctx.context?.body === "string") {
      try {
        const parsed = JSON.parse(ctx.context.body) as { error?: string };
        if (parsed.error) throw new Error(parsed.error);
      } catch (e) {
        if (e instanceof Error && e.message !== ctx.context.body) throw e;
      }
    }
    throw new Error(error.message || "transcribe_failed");
  }

  const payload = data as
    | (VoiceTranscribeResult & { error?: string; ok?: boolean })
    | null;

  if (payload?.error) throw new Error(payload.error);

  if (!payload?.text?.trim()) {
    throw new Error("transcribe_failed");
  }

  return {
    text: payload.text.trim(),
    language: typeof payload.language === "string" ? payload.language : undefined,
    used: typeof payload.used === "number" ? payload.used : 0,
    limit: typeof payload.limit === "number" ? payload.limit : 0,
    remaining: typeof payload.remaining === "number" ? payload.remaining : 0,
    plan: typeof payload.plan === "string" ? payload.plan : "free",
  };
}

export async function voiceFileToLyrics(userId: string, file: File): Promise<VoiceTranscribeResult> {
  const storagePath = await uploadVoiceFile(userId, file);
  try {
    return await transcribeVoiceUpload(storagePath);
  } finally {
    void supabase.storage.from("voice-uploads").remove([storagePath]);
  }
}
