import { supabase } from "@/lib/supabaseClient";
import { mergeCoverIntoStems } from "@/lib/coverArt";
import type { CoverKind } from "@/lib/coverMedia";
import { fetchLoopStemsAndCover } from "@/lib/loopStemsSelect";
import { parseStemsUrl } from "@/lib/publicLoops";
import { mergeStemsPreservingAceCover, readAceCoverFromStems } from "@/lib/stemsAceMerge";
import type { Loop } from "@/types/loop";

function isMissingColumnError(error: unknown, column: string): boolean {
  const e = error as { message?: string; details?: string; hint?: string } | null;
  const haystack = `${e?.message ?? ""} ${e?.details ?? ""} ${e?.hint ?? ""}`.toLowerCase();
  const c = column.toLowerCase();
  return haystack.includes(c) && (haystack.includes("column") || haystack.includes("schema cache"));
}

/** URL cover depuis la colonne DB ou legacy stems_url.ace. */
export function coverUrlFromLoopRow(row: {
  cover_url?: string | null;
  stems_url?: unknown;
}): string {
  const col = typeof row.cover_url === "string" ? row.cover_url.trim() : "";
  if (col.startsWith("http")) return col;
  return readAceCoverFromStems(row.stems_url).coverUrl?.trim() ?? "";
}

export function coverUrlFromLoop(loop: Pick<Loop, "details" | "stemsUrl">): string {
  const details = loop.details?.coverUrl?.trim() ?? "";
  if (details.startsWith("http")) return details;
  return readAceCoverFromStems(loop.stemsUrl).coverUrl?.trim() ?? "";
}

/**
 * Persistance cover — stems_url.ace (toujours) + colonne cover_url si disponible.
 * Fonctionne même sans migration 048.
 */
export async function persistLoopCover(
  loopId: string,
  userId: string,
  coverUrl: string,
  stemsUrl: unknown,
  coverKind: CoverKind = "image",
): Promise<boolean> {
  const trimmed = coverUrl.trim();
  if (!trimmed.startsWith("http")) return false;

  const row = await fetchLoopStemsAndCover(loopId, userId);

  const dbStems = parseStemsUrl(row?.stems_url);
  const localStems = parseStemsUrl(stemsUrl);
  const mergedBase = mergeStemsPreservingAceCover(localStems, dbStems) ?? dbStems ?? localStems ?? {};
  const nextStems = mergeCoverIntoStems(mergedBase, trimmed, coverKind);
  if (!nextStems) return false;

  const { error: stemsErr } = await supabase
    .from("loops")
    .update({ stems_url: nextStems })
    .eq("id", loopId)
    .eq("user_id", userId);

  if (stemsErr) {
    if (import.meta.env.DEV) console.warn("[ProducerHit] persistLoopCover stems_url:", stemsErr.message);
    return false;
  }

  const { error: colErr } = await supabase
    .from("loops")
    .update({ cover_url: trimmed })
    .eq("id", loopId)
    .eq("user_id", userId);

  if (colErr && !isMissingColumnError(colErr, "cover_url") && import.meta.env.DEV) {
    console.warn("[ProducerHit] persistLoopCover cover_url:", colErr.message);
  }

  return true;
}

/** @deprecated alias */
export const saveLoopCoverUrl = (
  loopId: string,
  userId: string,
  coverUrl: string,
  stemsUrl?: unknown,
) => persistLoopCover(loopId, userId, coverUrl, stemsUrl ?? null);

export function coverDetailsPatch(
  coverUrl: string,
  coverKind: CoverKind = "image",
  existing?: Loop["details"],
  options?: { bumpRevision?: boolean },
): Loop["details"] {
  const prevRev = typeof existing?.coverRevision === "number" ? existing.coverRevision : 0;
  const nextRev = options?.bumpRevision ? prevRev + 1 : prevRev;
  return {
    ...(existing ?? {}),
    coverUrl: coverUrl.trim(),
    coverKind,
    coverPrompt: existing?.coverPrompt,
    ...(nextRev > 0 ? { coverRevision: nextRev } : {}),
  };
}

/** Réinjecte la cover du store précédent si la row DB n’en a pas (évite flash noir au sync). */
export function loopWithCoverFallback(prev: Loop | undefined, loop: Loop): Loop {
  if (!prev) return loop;
  const prevCover = coverUrlFromLoop(prev);
  const current = coverUrlFromLoop(loop);
  if (!prevCover.startsWith("http") || current.startsWith("http")) return loop;
  const nextStems = mergeCoverIntoStems(loop.stemsUrl, prevCover, loop.details?.coverKind ?? "image");
  return {
    ...loop,
    stemsUrl: nextStems ?? loop.stemsUrl,
    details: coverDetailsPatch(prevCover, loop.details?.coverKind ?? "image", loop.details ?? undefined),
  };
}
