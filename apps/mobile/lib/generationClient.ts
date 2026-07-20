import Constants from "expo-constants";
import {
  createGenerationJobsClient,
  INLINE_AUDIO_MAX_CHARS,
  type GenerationJobStatus,
} from "@producerhit/shared";
import { invokeSupabaseFunction } from "./edgeInvoke";
import { generationPollIntervalMs } from "./generationPolling";
import { supabase } from "./supabase";

function supabaseBaseUrl(): string {
  return (
    process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ??
    (Constants.expoConfig?.extra?.supabaseUrl as string | undefined)?.replace(/\/$/, "") ??
    ""
  );
}

function supabaseAnonKey(): string {
  return (
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() ??
    (Constants.expoConfig?.extra?.supabaseAnonKey as string | undefined)?.trim() ??
    ""
  );
}

async function fetchGenerationJobAudioHttp(jobId: string): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Authentication required");

  const base = supabaseBaseUrl();
  const anon = supabaseAnonKey();
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

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const payload = (await res.json()) as { audioUrl?: string };
    const url = payload.audioUrl?.trim();
    if (url?.startsWith("http")) return url;
    throw new Error("No HTTP audio URL in job response");
  }

  throw new Error("Expected HTTP audio URL from generation job");
}

async function resolveJobAudioUrl(jobId: string, audioUrl: string): Promise<string> {
  const raw = audioUrl.trim();
  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  if (raw.startsWith("data:") && raw.length > INLINE_AUDIO_MAX_CHARS) {
    return fetchGenerationJobAudioHttp(jobId);
  }
  if (raw.startsWith("data:")) {
    return fetchGenerationJobAudioHttp(jobId).catch(() => "");
  }
  return raw.startsWith("http") ? raw : "";
}

async function invokeAce<T>(body: Record<string, unknown>): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Authentication required");

  const { data, errorText, limitReached } = await invokeSupabaseFunction<T & { error?: string; limitReached?: boolean }>({
    name: "generate-loop-ace",
    body,
    accessToken: session.access_token,
  });

  if (errorText) {
    const err = new Error(errorText) as Error & { limitReached?: boolean };
    if (limitReached) err.limitReached = true;
    throw err;
  }

  const payload = data as T & { error?: string; limitReached?: boolean };
  if (payload && typeof payload === "object" && "error" in payload && payload.error) {
    const err = new Error(payload.error) as Error & { limitReached?: boolean };
    if (payload.limitReached) err.limitReached = true;
    throw err;
  }

  return data as T;
}

export const mobileJobsClient = createGenerationJobsClient({
  config: {
    getPollMs: () => generationPollIntervalMs(),
    // 20 min — évite un spinner infini si le job serveur est orphelin.
    getJobTimeoutMs: () => 20 * 60 * 1000,
  },
  getAccessToken: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  },
  invokeAce,
  subscribeJob: (jobId, onUpdate) => {
    const channel = supabase
      .channel(`generation-job-mobile-${jobId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "generation_jobs",
          filter: `id=eq.${jobId}`,
        },
        (payload: { new?: Record<string, unknown>; old?: Record<string, unknown>; eventType?: string }) => {
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
  fetchJobAudio: fetchGenerationJobAudioHttp,
});

export function jobStatusProgress(status: GenerationJobStatus): number {
  switch (status) {
    case "pending":
      return 5;
    case "running":
      return 40;
    case "completed":
      return 100;
    case "failed":
      return 0;
    default:
      return 3;
  }
}

export function jobStatusLabel(status: GenerationJobStatus, isSong = false): string {
  switch (status) {
    case "pending":
      return isSong ? "Queued…" : "Queued…";
    case "running":
      return isSong ? "Writing vocals…" : "Composing…";
    case "completed":
      return "Ready";
    case "failed":
      return "Failed";
    default:
      return isSong ? "Composing song…" : "Generating…";
  }
}
