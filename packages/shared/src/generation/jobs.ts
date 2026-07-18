import type { AceMeta, GenerationJobResult, GenerationJobStatus } from "./types";

const POLL_MS_DEFAULT = 3_000;
const INLINE_AUDIO_MAX_CHARS = 400_000;

export type GenerationJobsConfig = {
  getPollMs?: () => number;
  getJobTimeoutMs?: () => number | null;
};

export type GenerationJobsDeps = {
  getAccessToken: () => Promise<string | null>;
  invokeAce: <T>(body: Record<string, unknown>) => Promise<T>;
  subscribeJob: (
    jobId: string,
    onUpdate: (row: {
      status?: string;
      audio_url?: string | null;
      meta?: unknown;
      error?: string | null;
    }) => void,
  ) => () => void;
  resolveAudioUrl: (jobId: string, audioUrl: string) => Promise<string>;
  fetchJobAudio: (jobId: string) => Promise<string>;
  onJobStarted?: (jobId: string, mode: string) => void;
  onJobCompleted?: (jobId: string, elapsedMs: number) => void;
  onJobFailed?: (jobId: string, error: string) => void;
  config?: GenerationJobsConfig;
};

export type WaitForJobOptions = {
  pollMs?: number;
  onStatus?: (status: GenerationJobStatus) => void;
  signal?: AbortSignal;
};

function pollIntervalMs(config?: GenerationJobsConfig): number {
  const raw = config?.getPollMs?.();
  if (raw == null) return POLL_MS_DEFAULT;
  return Number.isFinite(raw) && raw >= 1000 ? Math.min(raw, 15_000) : POLL_MS_DEFAULT;
}

function jobTimeoutMs(config?: GenerationJobsConfig): number | null {
  const raw = config?.getJobTimeoutMs?.();
  if (raw === null || raw === undefined) return null;
  if (raw <= 0) return null;
  return Math.min(raw, 3_600_000);
}

export function createGenerationJobsClient(deps: GenerationJobsDeps) {
  const config = deps.config ?? {};

  async function invokeJobAction<T>(body: Record<string, unknown>): Promise<T> {
    const token = await deps.getAccessToken();
    if (!token) throw new Error("Authentication required");
    return deps.invokeAce<T>(body);
  }

  async function startGenerationJob(body: Record<string, unknown>): Promise<{ jobId: string }> {
    const res = await invokeJobAction<{ jobId: string; status: string }>({
      action: "start_job",
      ...body,
    });
    if (!res?.jobId) throw new Error("No jobId returned");
    deps.onJobStarted?.(res.jobId, body.isSong ? "song" : "beat");
    return { jobId: res.jobId };
  }

  async function pollGenerationJob(jobId: string): Promise<{
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
      audioUrl = await deps.fetchJobAudio(jobId).catch(() => audioUrl);
    } else if (audioUrl) {
      audioUrl = await deps.resolveAudioUrl(jobId, audioUrl);
    }
    return {
      status: res.status,
      audioUrl,
      meta: res.meta ?? null,
      error: res.error,
    };
  }

  async function waitForGenerationJob(jobId: string, options?: WaitForJobOptions): Promise<GenerationJobResult> {
    const pollMs = options?.pollMs ?? pollIntervalMs(config);
    const startedAt = Date.now();
    let settled = false;
    let settledResolvers: Array<() => void> = [];
    let completedResult: GenerationJobResult | null = null;
    let lastStatus: GenerationJobStatus = "pending";

    /** Notify all pending sleepers that settled became true. */
    const notifySettled = () => {
      for (const r of settledResolvers) r();
      settledResolvers = [];
    };

    /** Sleep that resolves early when settled becomes true (Realtime won the race). */
    const sleepUnlessSettled = (ms: number): Promise<void> =>
      new Promise((resolve) => {
        if (settled) return resolve();
        const timer = setTimeout(resolve, ms);
        settledResolvers.push(() => {
          clearTimeout(timer);
          resolve();
        });
      });

    const finish = (result: GenerationJobResult): GenerationJobResult => {
      settled = true;
      completedResult = result;
      notifySettled();
      deps.onJobCompleted?.(jobId, Date.now() - startedAt);
      return result;
    };

    const fail = (message: string): never => {
      settled = true;
      notifySettled();
      deps.onJobFailed?.(jobId, message.slice(0, 200));
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
        void deps
          .resolveAudioUrl(jobId, row.audio_url)
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
            /* poll fallback */
          });
        return;
      }
      if (status === "failed") {
        fail(row.error ?? "Generation job failed");
      }
    };

    const unsubscribe = deps.subscribeJob(jobId, handleRow);

    try {
      // Poll immédiat — ne pas attendre 3 s avant le premier statut.
      const firstPoll = await pollGenerationJob(jobId);
      lastStatus = firstPoll.status;
      options?.onStatus?.(firstPoll.status);
      if (firstPoll.status === "completed" && firstPoll.audioUrl) {
        return finish({ jobId, audioUrl: firstPoll.audioUrl, meta: firstPoll.meta ?? null });
      }
      if (firstPoll.status === "completed" && !firstPoll.audioUrl) {
        const fetched = await deps.fetchJobAudio(jobId).catch(() => "");
        if (fetched) {
          return finish({ jobId, audioUrl: fetched, meta: firstPoll.meta ?? null });
        }
      }
      if (firstPoll.status === "failed") {
        fail(firstPoll.error ?? "Generation job failed");
      }

      while (!settled) {
        if (options?.signal?.aborted) {
          fail("Generation cancelled");
        }
        const deadline = jobTimeoutMs(config);
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
          const fetched = await deps.fetchJobAudio(jobId).catch(() => "");
          if (fetched) {
            return finish({ jobId, audioUrl: fetched, meta: polled.meta ?? null });
          }
        }
        if (polled.status === "failed") {
          fail(polled.error ?? "Generation job failed");
        }
        // Sleep that exits early if Realtime fires during the wait.
        await sleepUnlessSettled(pollMs);
      }
    } finally {
      unsubscribe();
    }

    if (completedResult) return completedResult;
    return fail("Generation timed out — réessaie dans un instant");
  }

  return {
    startGenerationJob,
    pollGenerationJob,
    waitForGenerationJob,
  };
}

export { INLINE_AUDIO_MAX_CHARS, POLL_MS_DEFAULT };
