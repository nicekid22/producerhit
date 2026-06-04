import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export const PINTEREST_DEDUP_RETENTION_DAYS = 7;

export function dedupSinceIso(retentionDays = PINTEREST_DEDUP_RETENTION_DAYS): string {
  return new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
}

/** Dédup globale : une pinimg ne peut servir qu’à une cover plateforme (fenêtre 7j). */
export async function loadGlobalUsedUrlHashes(
  admin: SupabaseClient,
  retentionDays = PINTEREST_DEDUP_RETENTION_DAYS,
): Promise<Set<string>> {
  const since = dedupSinceIso(retentionDays);
  const { data: usedRows } = await admin
    .from("used_pinterest_covers")
    .select("url_hash")
    .gte("created_at", since);
  return new Set((usedRows ?? []).map((r) => r.url_hash as string));
}
