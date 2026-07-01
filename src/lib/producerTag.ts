import {
  PRODUCER_TAG_CREDIT_COST,
  PRODUCER_TAG_MAX_DURATION_SEC,
  type LoopProducerTagMeta,
  type ProducerTagFxPreset,
  type ProducerTagPlacement,
  type ProducerTagRecord,
  type ProducerTagSettings,
  readLoopProducerTagMeta,
} from "@producerhit/shared";
import { canUseProducerTag, producerTagMaxCount } from "@/lib/planEntitlements";
import { supabase } from "@/lib/supabaseClient";

export {
  PRODUCER_TAG_CREDIT_COST,
  PRODUCER_TAG_MAX_DURATION_SEC,
  readLoopProducerTagMeta,
  type LoopProducerTagMeta,
  type ProducerTagFxPreset,
  type ProducerTagPlacement,
  type ProducerTagRecord,
  type ProducerTagSettings,
};

export const PRODUCER_TAG_ACCEPT =
  "audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/webm,audio/ogg,audio/aac,audio/flac,.mp3,.wav,.webm,.m4a,.aac,.flac";

export const PRODUCER_TAG_MAX_FILE_BYTES = 5 * 1024 * 1024;
export const PRODUCER_TAG_MAX_RECORD_SEC = 8;

export type ProducerTag = ProducerTagRecord & {
  settings_json: ProducerTagSettings & { variants?: Array<{ id: string; label: string; storagePath: string; fxPreset: string }> };
};

export { canUseProducerTag, producerTagMaxCount };

export function validateProducerTagFile(file: File): "missing_file" | "file_too_large" | "invalid_type" | null {
  if (!file) return "missing_file";
  if (file.size > PRODUCER_TAG_MAX_FILE_BYTES) return "file_too_large";
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

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 80) || "producer-tag.webm";
}

async function getSupabaseAccessToken(): Promise<string | undefined> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (import.meta.env.DEV) {
    console.log("[ProducerTag] getSupabaseAccessToken session?", !!session, "token?", !!session?.access_token);
  }
  return session?.access_token;
}

export async function uploadProducerTagSample(userId: string, file: File): Promise<string> {
  const err = validateProducerTagFile(file);
  if (err) throw new Error(err);
  const path = `${userId}/tags/${Date.now()}-${sanitizeFileName(file.name)}`;
  const { error } = await supabase.storage.from("producer-tags").upload(path, file, {
    cacheControl: "86400",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  return path;
}

async function extractInvokeErrorAsync(error: unknown): Promise<string> {
  const anyError = error as { message?: string; context?: unknown };
  const errContext = anyError.context;
  if (errContext && typeof errContext === "object" && typeof (errContext as Response).json === "function") {
    try {
      const parsed = (await (errContext as Response).json()) as { error?: string };
      if (typeof parsed.error === "string") return parsed.error;
    } catch {
      // ignore
    }
  }
  return anyError.message ?? "invoke_failed";
}

export async function listProducerTags(): Promise<{ tags: ProducerTag[]; maxTags: number; plan: string }> {
  const accessToken = await getSupabaseAccessToken();
  const { data, error } = await supabase.functions.invoke("producer-tag", {
    body: { action: "list" },
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
  if (error) throw new Error(await extractInvokeErrorAsync(error));
  const payload = data as { tags?: ProducerTag[]; maxTags?: number; plan?: string; error?: string };
  if (payload?.error) throw new Error(payload.error);
  return {
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    maxTags: payload.maxTags ?? 0,
    plan: payload.plan ?? "free",
  };
}

export async function saveProducerTag(input: {
  name: string;
  storagePath: string;
  durationSec?: number;
  settingsJson?: ProducerTagSettings;
}): Promise<ProducerTag> {
  const accessToken = await getSupabaseAccessToken();
  const { data, error } = await supabase.functions.invoke("producer-tag", {
    body: {
      action: "save",
      name: input.name,
      storagePath: input.storagePath,
      durationSec: input.durationSec ?? null,
      settingsJson: input.settingsJson,
    },
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
  if (error) throw new Error(await extractInvokeErrorAsync(error));
  const payload = data as { tag?: ProducerTag; error?: string };
  if (payload?.error) throw new Error(payload.error);
  if (!payload?.tag?.id) throw new Error("save_failed");
  return payload.tag;
}

export async function deleteProducerTag(id: string): Promise<void> {
  const accessToken = await getSupabaseAccessToken();
  const { data, error } = await supabase.functions.invoke("producer-tag", {
    body: { action: "delete", id },
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
  if (error) throw new Error(await extractInvokeErrorAsync(error));
  const payload = data as { error?: string };
  if (payload?.error) throw new Error(payload.error);
}

export type ApplyProducerTagInput = {
  loopId: string;
  tagId: string;
  placement?: ProducerTagPlacement;
  volumeDb?: number;
  fxPreset?: ProducerTagFxPreset;
  variantId?: string;
  fadeMs?: number;
};

export type ApplyProducerTagResult = {
  audioUrl: string;
  alreadyCounted: boolean;
  creditConsumed: boolean;
  offsetSec: number;
  placement: ProducerTagPlacement;
  producerTag: LoopProducerTagMeta;
};

export async function applyProducerTagToLoop(input: ApplyProducerTagInput): Promise<ApplyProducerTagResult> {
  const accessToken = await getSupabaseAccessToken();
  const { data, error } = await supabase.functions.invoke("apply-producer-tag", {
    body: { action: "apply", ...input },
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
  if (error) {
    const code = await extractInvokeErrorAsync(error);
    if (code === "no_credits" || code.includes("no_credits")) throw new Error("no_credits");
    throw new Error(code);
  }
  const payload = data as ApplyProducerTagResult & { error?: string };
  if (payload?.error === "no_credits") throw new Error("no_credits");
  if (payload?.error) throw new Error(payload.error);
  if (!payload?.audioUrl) throw new Error("apply_failed");
  return payload;
}

export async function removeProducerTagFromLoop(loopId: string): Promise<string> {
  const accessToken = await getSupabaseAccessToken();
  const { data, error } = await supabase.functions.invoke("apply-producer-tag", {
    body: { action: "remove", loopId },
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
  if (error) throw new Error(await extractInvokeErrorAsync(error));
  const payload = data as { audioUrl?: string; error?: string };
  if (payload?.error) throw new Error(payload.error);
  return payload.audioUrl ?? "";
}

export async function producerTagSampleToRecord(
  userId: string,
  file: File,
  name: string,
  durationSec?: number,
): Promise<ProducerTag> {
  const storagePath = await uploadProducerTagSample(userId, file);
  return saveProducerTag({
    name,
    storagePath,
    durationSec,
    settingsJson: { volumeDb: -3, fxPreset: "clean", defaultPlacement: "intro", fadeMs: 50 },
  });
}
