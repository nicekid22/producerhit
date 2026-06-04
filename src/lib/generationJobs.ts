/**
 * Jobs de génération ACE async — poll 3s + Supabase Realtime.
 * Voir GENERATION_ASYNC.md
 */

import { supabase, trackClientEvent } from "@/lib/supabaseClient";
import type { AceMeta } from "@/lib/audioApi";

export type GenerationJobStatus = "pending" | "running" | "completed" | "failed";

export type GenerationJobResult = {
  audioUrl: string;
  meta?: AceMeta | null;
  jobId: string;
};

const POLL_MS_DEFAULT = 3_000;
const JOB_TIMEOUT_MS = 600_000;

/** Activer après migration 046 + secrets Edge (GENERATION_ASYNC.md). */
export function asyncGenerationJobsEnabled(): boolean {
  return import.meta.env.VITE_ACE_ASYNC_JOBS === "1";
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
    meta?: AceMeta | null;
    error?: string;
  }>({ action: "poll_job", jobId });
  return {
    status: res.status,
    audioUrl: res.audioUrl,
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
      return finish({
        jobId,
        audioUrl: row.audio_url,
        meta: (row.meta as AceMeta | null) ?? null,
      });
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
    while (!settled && Date.now() - startedAt < JOB_TIMEOUT_MS) {
      if (options?.signal?.aborted) {
        fail("Generation cancelled");
      }
      const polled = await pollGenerationJob(jobId);
      lastStatus = polled.status;
      options?.onStatus?.(polled.status);
      if (polled.status === "completed" && polled.audioUrl) {
        return finish({ jobId, audioUrl: polled.audioUrl, meta: polled.meta ?? null });
      }
      if (polled.status === "failed") {
        fail(polled.error ?? "Generation job failed");
      }
      await new Promise((r) => setTimeout(r, pollMs));
    }
    fail("Generation timed out — réessaie dans un instant");
  } finally {
    void supabase.removeChannel(channel);
  }

  throw new Error("Unreachable");
}
