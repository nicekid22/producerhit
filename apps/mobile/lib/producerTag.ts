import type { LoopProducerTagMeta, ProducerTagFxPreset, ProducerTagPlacement } from "@producerhit/shared";
import { invokeSupabaseFunction } from "./edgeInvoke";

export type ProducerTag = {
  id: string;
  name: string;
  storage_path: string;
  duration_sec?: number | null;
  settings_json?: Record<string, unknown>;
};

export async function listProducerTags(): Promise<{ tags: ProducerTag[]; maxTags: number; plan: string }> {
  const res = await invokeSupabaseFunction<{ tags?: ProducerTag[]; maxTags?: number; plan?: string }>({
    name: "producer-tag",
    body: { action: "list" },
  });
  if (res.errorText) throw new Error(res.errorText);
  return {
    tags: Array.isArray(res.data?.tags) ? res.data.tags : [],
    maxTags: res.data?.maxTags ?? 0,
    plan: res.data?.plan ?? "free",
  };
}

export async function applyProducerTagToLoop(input: {
  loopId: string;
  tagId: string;
  placement?: ProducerTagPlacement;
  volumeDb?: number;
  fxPreset?: ProducerTagFxPreset;
  variantId?: string;
}): Promise<{
  audioUrl: string;
  creditConsumed: boolean;
  producerTag: LoopProducerTagMeta;
}> {
  const res = await invokeSupabaseFunction<{
    audioUrl?: string;
    creditConsumed?: boolean;
    producerTag?: LoopProducerTagMeta;
    error?: string;
  }>({
    name: "apply-producer-tag",
    body: { action: "apply", ...input },
  });
  if (res.errorText === "no_credits" || res.data?.error === "no_credits") throw new Error("no_credits");
  if (res.errorText) throw new Error(res.errorText);
  if (!res.data?.audioUrl || !res.data.producerTag) throw new Error("apply_failed");
  return {
    audioUrl: res.data.audioUrl,
    creditConsumed: res.data.creditConsumed === true,
    producerTag: res.data.producerTag,
  };
}

export async function removeProducerTagFromLoop(loopId: string): Promise<string> {
  const res = await invokeSupabaseFunction<{ audioUrl?: string; error?: string }>({
    name: "apply-producer-tag",
    body: { action: "remove", loopId },
  });
  if (res.errorText) throw new Error(res.errorText);
  return res.data?.audioUrl ?? "";
}
