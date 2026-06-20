/**
 * Jobs de génération ACE async — poll 3s + Supabase Realtime.
 * Voir GENERATION_ASYNC.md
 */

import { usesDirectAceFromBrowser } from "@/lib/aceBrowserKeys";
import { supabase, trackClientEvent } from "@/lib/supabaseClient";
import type { AceMeta } from "@/lib/audioApi";

export type GenerationJobStatus = "pending" | "running" | "completed" | "failed";

export type GenerationJobResult = {
  audioUrl: string;
  meta?: AceMeta | null;
  jobId: string;
};

const POLL_MS_DEFAULT = 3_000;

/** Pas de plafond par défaut — attendre la fin du job ACE (comme en local). Optionnel : VITE_ACE_JOB_TIMEOUT_MS */
function jobTimeoutMs(): number | null {
  const raw = import.meta.env.VITE_ACE_JOB_TIMEOUT_MS as string | undefined;
  if (raw === "" || raw == null) return null;
  if (raw === "0" || raw.toLowerCase() === "off") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.min(n, 3_600_000);
}
/** Aligné sur jobResponsePayload côté Edge — au-delà, fetch binaire get_job_audio. */
const INLINE_AUDIO_MAX_CHARS = 400_000;

async function fetchGenerationJobAudioBlobUrl(jobId: string): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Authentication required");
  const base = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";
  const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ?? "";
  const res = await fetch(`${base}/functions/v1/generate-loop-ace`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
      ...(anon ? { apikey: anon } : {}),
    },
    body: JSON.stringify({ action: "get_job_audio", jobId }),
  });
  if (!res.ok) throw new Error(`get_job_audio failed (${res.status})`);
  const blob = await res.blob();
  if (!blob.size) throw new Error("Empty job audio");
  return URL.createObjectURL(blob);
}

async function resolveJobAudioUrl(jobId: string, audioUrl: string): Promise<string> {
  const raw = audioUrl.trim();
  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("blob:")) return raw;
  if (raw.startsWith("data:") && raw.length > INLINE_AUDIO_MAX_CHARS) {
    return fetchGenerationJobAudioBlobUrl(jobId);
  }
  if (raw.startsWith("data:")) {
    try {
      const res = await fetch(raw);
      const blob = await res.blob();
      if (blob.size) return URL.createObjectURL(blob);
    } catch {
      return fetchGenerationJobAudioBlobUrl(jobId).catch(() => "");
    }
  }
  return raw;
}

/**
 * Jobs async (start_job + poll) — évite le mur 150s Supabase Edge en prod.
 * Local avec VITE_ACE_* : appel direct navigateur → sync OK.
 * Prod sans clés VITE : auto async sauf VITE_ACE_ASYNC_JOBS=0 explicite.
 */
export function asyncGenerationJobsEnabled(): boolean {
  const raw = import.meta.env.VITE_ACE_ASYNC_JOBS as string | undefined;
  if (raw === "1") return true;
  if (raw === "0") return false;
  return !usesDirectAceFromBrowser();
}

function pollIntervalMs(): number {
  const raw = import.meta.env.VITE_ACE_JOB_POLL_MS;
  if (raw === "" || raw == null) return POLL_MS_DEFAULT;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1000 ? Math.min(n, 15_000) : POLL_MS_DEFAULT;
}

async function invokeJobAction<T>(body: Record<string, unknown>): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Authentication required");

  const { data, error } = await supabase.functions.invoke("generate-loop-ace", {
    body,
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(msg || "Edge Function error");
  }

  const payload = data as T & { error?: string; limitReached?: boolean };
  if (payload && typeof payload === "object" && "error" in payload && payload.error) {
    const e = new Error(payload.error) as Error & { limitReached?: boolean };
    if (payload.limitReached) e.limitReached = true;
    throw e;
  }
  return data as T;
}

export async function startGenerationJob(body: Record<string, unknown>): Promise<{ jobId: string }> {
  const res = await invokeJobAction<{ jobId: string; status: string }>({
    action: "start_job",
    ...body,
  });
  if (!res?.jobId) throw new Error("No jobId returned");
  trackClientEvent("generate_job_started", {
    job_id: res.jobId,
    mode: body.isSong ? "song" : "beat",
  });
  return { jobId: res.jobId };
}

export async function pollGenerationJob(jobId: string): Promise<{
  status: GenerationJobStatus;
  audioUrl?: string;
  meta?: AceMeta | null;
  error?: string;
}> {
  const res = await invokeJobAction<{
    jobId: string;
    status: GenerationJobStatus;
    audioUrl?: string;
    audioInline?: boolean;
    meta?: AceMeta | null;
    error?: string;
  }>({ action: "poll_job", jobId });
  let audioUrl = res.audioUrl;
  const httpFromMeta =
    res.meta && typeof res.meta === "object" && typeof (res.meta as { httpAudioUrl?: unknown }).httpAudioUrl === "string"
      ? String((res.meta as { httpAudioUrl: string }).httpAudioUrl).trim()
      : "";
  if (httpFromMeta.startsWith("http://") || httpFromMeta.startsWith("https://")) {
    audioUrl = httpFromMeta;
  } else if (res.status === "completed" && (!audioUrl || res.audioInline)) {
    audioUrl = await fetchGenerationJobAudioBlobUrl(jobId).catch(() => audioUrl);
  } else if (audioUrl) {
    audioUrl = await resolveJobAudioUrl(jobId, audioUrl);
  }
  return {
    status: res.status,
    audioUrl,
    meta: res.meta ?? null,
    error: res.error,
  };
}

export type WaitForJobOptions = {
  pollMs?: number;
  onStatus?: (status: GenerationJobStatus) => void;
  signal?: AbortSignal;
};

/**
 * Attend la fin du job (Realtime + poll de secours toutes les 3s).
 */
export async function waitForGenerationJob(
  jobId: string,
  options?: WaitForJobOptions,
): Promise<GenerationJobResult> {
  const pollMs = options?.pollMs ?? pollIntervalMs();
  const startedAt = Date.now();
  let settled = false;
  let lastStatus: GenerationJobStatus = "pending";

  const finish = (result: GenerationJobResult): GenerationJobResult => {
    settled = true;
    trackClientEvent("generate_job_completed", {
      job_id: jobId,
      elapsed_ms: Date.now() - startedAt,
      async: true,
    });
    return result;
  };

  const fail = (message: string): never => {
    settled = true;
    trackClientEvent("generate_job_failed", { job_id: jobId, error: message.slice(0, 200) });
    throw new Error(message);
  };

  const handleRow = (row: {
    status?: string;
    audio_url?: string | null;
    meta?: unknown;
    error?: string | null;
  }) => {
    const status = (row.status ?? "pending") as GenerationJobStatus;
    if (status !== lastStatus) {
      lastStatus = status;
      options?.onStatus?.(status);
    }
    if (status === "completed" && row.audio_url) {
      void resolveJobAudioUrl(jobId, row.audio_url)
        .then((audioUrl) => {
          if (!settled && audioUrl) {
            finish({
              jobId,
              audioUrl,
              meta: (row.meta as AceMeta | null) ?? null,
            });
          }
        })
        .catch(() => {
          /* poll de secours */
        });
      return null;
    }
    if (status === "failed") {
      fail(row.error ?? "Generation job failed");
    }
    return null;
  };

  const channel = supabase
    .channel(`generation-job-${jobId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "generation_jobs",
        filter: `id=eq.${jobId}`,
      },
      (payload) => {
        if (settled) return;
        const row = payload.new as {
          status?: string;
          audio_url?: string | null;
          meta?: unknown;
          error?: string | null;
        };
        handleRow(row);
      },
    )
    .subscribe();

  try {
    while (!settled) {
      if (options?.signal?.aborted) {
        fail("Generation cancelled");
      }
      const deadline = jobTimeoutMs();
      if (deadline != null && Date.now() - startedAt >= deadline) {
        fail("Generation timed out — réessaie dans un instant");
      }
      const polled = await pollGenerationJob(jobId);
      lastStatus = polled.status;
      options?.onStatus?.(polled.status);
      if (polled.status === "completed" && polled.audioUrl) {
        return finish({ jobId, audioUrl: polled.audioUrl, meta: polled.meta ?? null });
      }
      if (polled.status === "completed" && !polled.audioUrl) {
        const blobUrl = await fetchGenerationJobAudioBlobUrl(jobId).catch(() => "");
        if (blobUrl) {
          return finish({ jobId, audioUrl: blobUrl, meta: polled.meta ?? null });
        }
      }
      if (polled.status === "failed") {
        fail(polled.error ?? "Generation job failed");
      }
      await new Promise((r) => setTimeout(r, pollMs));
    }
    if (!settled) {
      fail("Generation timed out — réessaie dans un instant");
    }
  } finally {
    void supabase.removeChannel(channel);
  }

  throw new Error("Unreachable");
}
