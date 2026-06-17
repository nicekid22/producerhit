import { supabase } from "@/lib/supabaseClient";
import { normalizePlanId, type PlanId } from "@/lib/planEntitlements";
import { validateVoiceFile, VOICE_ACCEPT, VOICE_MAX_FILE_BYTES } from "@/lib/voiceToSong";

export type VoiceProfile = {
  id: string;
  name: string;
  storage_path: string;
  sample_sec: number | null;
  created_at: string;
};

/** Chansons générées avec timbre cloné (reference_audio ACE) / mois */
export const VOICE_CLONE_GEN_LIMITS: Record<PlanId, number | null> = {
  free: 1,
  pro: 3,
  studio: null,
  plus: null,
};

/** Profils vocaux sauvegardés max */
export const VOICE_PROFILE_MAX: Record<PlanId, number> = {
  free: 1,
  pro: 2,
  studio: 10,
  plus: 10,
};

export function voiceCloneMonthlyLimit(plan: string | null | undefined): number {
  const cap = VOICE_CLONE_GEN_LIMITS[normalizePlanId(plan)];
  return cap ?? 999_999;
}

export function voiceProfileMaxCount(plan: string | null | undefined): number {
  return VOICE_PROFILE_MAX[normalizePlanId(plan)] ?? 1;
}

export function getVoiceCloneRemaining(plan: string, usedThisMonth: number): number {
  return Math.max(0, voiceCloneMonthlyLimit(plan) - Math.max(0, usedThisMonth));
}

export function hasUnlimitedVoiceClone(plan: string | null | undefined): boolean {
  return VOICE_CLONE_GEN_LIMITS[normalizePlanId(plan)] === null;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80) || "voice-sample.webm";
}

export async function uploadVoiceProfileSample(userId: string, file: File): Promise<string> {
  const err = validateVoiceFile(file);
  if (err) throw new Error(err);
  const path = `${userId}/profiles/${Date.now()}-${sanitizeFileName(file.name)}`;
  const { error } = await supabase.storage.from("voice-profiles").upload(path, file, {
    cacheControl: "86400",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  return path;
}

export async function listVoiceProfiles(): Promise<VoiceProfile[]> {
  const { data, error } = await supabase.functions.invoke("voice-profile", { body: { action: "list" } });
  if (error) throw error;
  const rows = (data as { profiles?: VoiceProfile[] } | null)?.profiles;
  return Array.isArray(rows) ? rows : [];
}

export async function saveVoiceProfile(input: { name: string; storagePath: string; sampleSec?: number }): Promise<VoiceProfile> {
  const { data, error } = await supabase.functions.invoke("voice-profile", {
    body: { action: "save", name: input.name, storagePath: input.storagePath, sampleSec: input.sampleSec ?? null },
  });
  if (error) throw error;
  const payload = data as { profile?: VoiceProfile; error?: string };
  if (payload?.error) throw new Error(payload.error);
  if (!payload?.profile?.id) throw new Error("save_failed");
  return payload.profile;
}

export async function deleteVoiceProfile(id: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke("voice-profile", { body: { action: "delete", id } });
  if (error) throw error;
  const payload = data as { error?: string };
  if (payload?.error) throw new Error(payload.error);
}

export async function voiceSampleToProfile(userId: string, file: File, name: string): Promise<VoiceProfile> {
  const storagePath = await uploadVoiceProfileSample(userId, file);
  try {
    return await saveVoiceProfile({ name: name.trim() || "Ma voix", storagePath });
  } catch (e) {
    void supabase.storage.from("voice-profiles").remove([storagePath]);
    throw e;
  }
}

export { VOICE_ACCEPT, VOICE_MAX_FILE_BYTES };
