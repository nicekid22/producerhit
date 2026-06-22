/**
 * Jobs de génération ACE async — poll 3s + Supabase Realtime.
 * Voir GENERATION_ASYNC.md
 */

import { usesDirectAceFromBrowser } from "@/lib/aceBrowserKeys";
import { supabase, trackClientEvent } from "@/lib/supabaseClient";
import {
  createGenerationJobsClient,
  INLINE_AUDIO_MAX_CHARS,
  type AceMeta,
  type GenerationJobResult,
  type GenerationJobStatus,
  type WaitForJobOptions,
} from "@producerhit/shared";

export type { GenerationJobResult, GenerationJobStatus };

const POLL_MS_DEFAULT = 3_000;

function jobTimeoutMs(): number | null {
  const raw = import.meta.env.VITE_ACE_JOB_TIMEOUT_MS as string | undefined;
  if (raw === "" || raw == null) return null;
  if (raw === "0" || raw.toLowerCase() === "off") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.min(n, 3_600_000);
}

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

const jobsClient = createGenerationJobsClient({
  getAccessToken: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  },
  invokeAce: invokeJobAction,
  subscribeJob: (jobId, onUpdate) => {
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
          onUpdate(
            payload.new as {
              status?: string;
              audio_url?: string | null;
              meta?: unknown;
              error?: string | null;
            },
          );
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  },
  resolveAudioUrl: resolveJobAudioUrl,
  fetchJobAudio: fetchGenerationJobAudioBlobUrl,
  onJobStarted: (jobId, mode) => {
    trackClientEvent("generate_job_started", { job_id: jobId, mode });
  },
  onJobCompleted: (jobId, elapsedMs) => {
    trackClientEvent("generate_job_completed", { job_id: jobId, elapsed_ms: elapsedMs, async: true });
  },
  onJobFailed: (jobId, error) => {
    trackClientEvent("generate_job_failed", { job_id: jobId, error });
  },
  config: {
    getPollMs: pollIntervalMs,
    getJobTimeoutMs: jobTimeoutMs,
  },
});

export async function startGenerationJob(body: Record<string, unknown>): Promise<{ jobId: string }> {
  return jobsClient.startGenerationJob(body);
}

export async function pollGenerationJob(jobId: string): Promise<{
  status: GenerationJobStatus;
  audioUrl?: string;
  meta?: AceMeta | null;
  error?: string;
}> {
  return jobsClient.pollGenerationJob(jobId);
}

export async function waitForGenerationJob(
  jobId: string,
  options?: WaitForJobOptions,
): Promise<GenerationJobResult> {
  return jobsClient.waitForGenerationJob(jobId, options);
}

export type { WaitForJobOptions };
