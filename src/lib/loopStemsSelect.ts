import { supabase } from "@/lib/supabaseClient";
import { readAceCoverFromStems } from "@/lib/stemsAceMerge";

function isMissingColumnError(error: unknown, column: string): boolean {
  const e = error as { message?: string; details?: string; hint?: string } | null;
  const haystack = `${e?.message ?? ""} ${e?.details ?? ""} ${e?.hint ?? ""}`.toLowerCase();
  const c = column.toLowerCase();
  return haystack.includes(c) && (haystack.includes("column") || haystack.includes("schema cache"));
}

export type LoopStemsCoverRow = {
  stems_url: unknown;
  cover_url?: string | null;
};

/** Lecture stems + cover — compatible prod sans migration cover_url. */
export async function fetchLoopStemsAndCover(
  loopId: string,
  userId: string,
): Promise<LoopStemsCoverRow | null> {
  const withCol = await supabase
    .from("loops")
    .select("stems_url, cover_url")
    .eq("id", loopId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!withCol.error && withCol.data) return withCol.data as LoopStemsCoverRow;

  if (withCol.error && !isMissingColumnError(withCol.error, "cover_url")) {
    if (import.meta.env.DEV) console.warn("[ProducerHit] fetchLoopStemsAndCover:", withCol.error.message);
    return null;
  }

  const stemsOnly = await supabase
    .from("loops")
    .select("stems_url")
    .eq("id", loopId)
    .eq("user_id", userId)
    .maybeSingle();

  if (stemsOnly.error || !stemsOnly.data) return null;
  const stems = stemsOnly.data.stems_url;
  const aceCover = readAceCoverFromStems(stems).coverUrl ?? null;
  return { stems_url: stems, cover_url: aceCover };
}

export function coverUrlFromStemsRow(row: LoopStemsCoverRow | null): string {
  if (!row) return "";
  const col = typeof row.cover_url === "string" ? row.cover_url.trim() : "";
  if (col.startsWith("http")) return col;
  return readAceCoverFromStems(row.stems_url).coverUrl?.trim() ?? "";
}
