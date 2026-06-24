import { supabase } from "@/lib/supabaseClient";
import { preloadCoverImage } from "@/lib/coverArt";
import { persistLoopCover } from "@/lib/loopCoverUrl";
import type { Loop } from "@/types/loop";
import { useAuthStore } from "@/stores/authStore";

export const LOOP_COVER_AI_CREDIT_COST = 1;

export function newCoverAiIdempotencyKey(loopId: string): string {
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${loopId}:${suffix}`;
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

export async function generatePollinationsCoverForLoop(params: {
  loop: Pick<Loop, "id" | "userId" | "stemsUrl">;
  prompt: string;
  seed?: number;
}): Promise<{ coverUrl: string | null }> {
  const user = useAuthStore.getState().user;
  if (!user?.id || params.loop.userId !== user.id) return { coverUrl: null };

  const idempotencyKey = newCoverAiIdempotencyKey(params.loop.id);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { data, error } = await supabase.functions.invoke("persist-pollinations-cover", {
    body: {
      loopId: params.loop.id,
      prompt: params.prompt,
      seed: params.seed ?? 0,
      idempotencyKey,
    },
    headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
  });

  if (error) {
    const code = await extractInvokeErrorAsync(error);
    if (code === "no_credits" || code.includes("no_credits")) throw new Error("no_credits");
    return { coverUrl: null };
  }

  if (data?.error === "no_credits") throw new Error("no_credits");

  const coverUrl = typeof data?.coverUrl === "string" ? data.coverUrl.trim() : "";
  if (!coverUrl.startsWith("http")) return { coverUrl: null };

  preloadCoverImage(coverUrl);
  await persistLoopCover(params.loop.id, user.id, coverUrl, params.loop.stemsUrl ?? null, "image");
  return { coverUrl };
}

