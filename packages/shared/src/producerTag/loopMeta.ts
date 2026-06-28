import type { LoopProducerTagMeta } from "./types";

export function readLoopProducerTagMeta(stemsUrl: unknown): LoopProducerTagMeta | null {
  if (!stemsUrl || typeof stemsUrl !== "object") return null;
  const ace = (stemsUrl as Record<string, unknown>).ace;
  if (!ace || typeof ace !== "object") return null;
  const raw = (ace as Record<string, unknown>).producerTag;
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const tagId = typeof o.tagId === "string" ? o.tagId.trim() : "";
  if (!tagId) return null;
  return {
    tagId,
    tagName: typeof o.tagName === "string" ? o.tagName : "Tag",
    placement: (typeof o.placement === "string" ? o.placement : "intro") as LoopProducerTagMeta["placement"],
    appliedAt: typeof o.appliedAt === "string" ? o.appliedAt : "",
    originalAudioPath: typeof o.originalAudioPath === "string" ? o.originalAudioPath : undefined,
    volumeDb: typeof o.volumeDb === "number" ? o.volumeDb : undefined,
    fxPreset: typeof o.fxPreset === "string" ? (o.fxPreset as LoopProducerTagMeta["fxPreset"]) : undefined,
    variantId: typeof o.variantId === "string" ? o.variantId : undefined,
    creditConsumed: o.creditConsumed === true,
  };
}

export function mergeProducerTagIntoStems(
  stemsUrl: unknown,
  meta: LoopProducerTagMeta,
): Record<string, unknown> {
  const parsed =
    stemsUrl && typeof stemsUrl === "object" ? { ...(stemsUrl as Record<string, unknown>) } : {};
  const aceRaw = parsed.ace;
  const ace: Record<string, unknown> =
    aceRaw && typeof aceRaw === "object" ? { ...(aceRaw as Record<string, unknown>) } : {};
  ace.producerTag = meta;
  parsed.ace = ace;
  return parsed;
}

export function clearProducerTagFromStems(stemsUrl: unknown): Record<string, unknown> | null {
  if (!stemsUrl || typeof stemsUrl !== "object") return null;
  const parsed = { ...(stemsUrl as Record<string, unknown>) };
  const aceRaw = parsed.ace;
  if (!aceRaw || typeof aceRaw !== "object") return parsed;
  const ace = { ...(aceRaw as Record<string, unknown>) };
  delete ace.producerTag;
  parsed.ace = ace;
  return parsed;
}
