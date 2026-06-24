import type {
  DistributionReleaseInput,
  DistributionReleaseRow,
  DistributionUsageSummary,
} from "@producerhit/shared";
import { supabase } from "@/lib/supabaseClient";

export type DistributionReleaseWithOutlets = DistributionReleaseRow & {
  outlets: DistributionOutletRow[];
  loopName?: string | null;
  coverUrl?: string | null;
};

export type DistributionOutletRow = {
  id: string;
  releaseId: string;
  outletSlug: string;
  outletName: string;
  status: string;
  externalUrl: string | null;
  updatedAt: string;
};

function mapReleaseRow(row: Record<string, unknown>): DistributionReleaseRow {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    loopId: String(row.loop_id),
    releaseType: (row.release_type as DistributionReleaseRow["releaseType"]) ?? "single",
    title: String(row.title ?? ""),
    artistName: String(row.artist_name ?? ""),
    featuring: Array.isArray(row.featuring) ? row.featuring.map(String) : [],
    genreLabelgridId: row.genre_labelgrid_id ? String(row.genre_labelgrid_id) : null,
    genreName: row.genre_name ? String(row.genre_name) : null,
    languageCode: String(row.language_code ?? "en"),
    explicit: Boolean(row.explicit),
    releaseDate: row.release_date ? String(row.release_date) : null,
    labelgridReleaseId: row.labelgrid_release_id ? String(row.labelgrid_release_id) : null,
    labelgridTrackId: row.labelgrid_track_id ? String(row.labelgrid_track_id) : null,
    isrc: row.isrc ? String(row.isrc) : null,
    upc: row.upc ? String(row.upc) : null,
    status: (row.status as DistributionReleaseRow["status"]) ?? "draft",
    statusDetail: (row.status_detail as Record<string, unknown>) ?? {},
    submittedAt: row.submitted_at ? String(row.submitted_at) : null,
    liveAt: row.live_at ? String(row.live_at) : null,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

function mapOutletRow(row: Record<string, unknown>): DistributionOutletRow {
  return {
    id: String(row.id),
    releaseId: String(row.release_id),
    outletSlug: String(row.outlet_slug),
    outletName: String(row.outlet_name),
    status: String(row.status),
    externalUrl: row.external_url ? String(row.external_url) : null,
    updatedAt: String(row.updated_at ?? ""),
  };
}

export async function fetchDistributionUsage(): Promise<DistributionUsageSummary | null> {
  const { data, error } = await supabase.rpc("get_distribution_usage_summary");
  if (error) return null;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    plan: String(row.plan ?? "free"),
    used: Number(row.used ?? 0),
    quota: Number(row.quota ?? 0),
    monthKey: String(row.month_key ?? ""),
  };
}

export async function acceptDistributionTerms(): Promise<boolean> {
  const { data, error } = await supabase.rpc("accept_distribution_terms");
  if (error) return false;
  return Boolean(data && typeof data === "object" && (data as { ok?: boolean }).ok);
}

export async function fetchDistributionReleases(): Promise<DistributionReleaseWithOutlets[]> {
  const { data: releases, error } = await supabase
    .from("distribution_releases")
    .select(
      "id, user_id, loop_id, release_type, title, artist_name, featuring, genre_labelgrid_id, genre_name, language_code, explicit, release_date, labelgrid_release_id, labelgrid_track_id, isrc, upc, status, status_detail, submitted_at, live_at, created_at, updated_at, loops(name, cover_url)",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;

  const ids = (releases ?? []).map((r) => r.id as string);
  let outlets: DistributionOutletRow[] = [];
  if (ids.length) {
    const { data: outletRows } = await supabase
      .from("distribution_outlet_status")
      .select("id, release_id, outlet_slug, outlet_name, status, external_url, updated_at")
      .in("release_id", ids);
    outlets = (outletRows ?? []).map((o) => mapOutletRow(o as Record<string, unknown>));
  }

  return (releases ?? []).map((r) => {
    const loops = r.loops as { name?: string; cover_url?: string } | null;
    const mapped = mapReleaseRow(r as Record<string, unknown>);
    return {
      ...mapped,
      loopName: loops?.name ?? null,
      coverUrl: loops?.cover_url ?? null,
      outlets: outlets.filter((o) => o.releaseId === mapped.id),
    };
  });
}

export async function recordDistributionPackExport(
  input: DistributionReleaseInput,
): Promise<{ ok: boolean; releaseId?: string; error?: string; used?: number; quota?: number }> {
  const { data, error } = await supabase.rpc("record_distribution_pack_export", {
    p_loop_id: input.loopId,
    p_title: input.title,
    p_artist_name: input.artistName,
    p_featuring: input.featuring ?? [],
    p_genre_name: input.genreName ?? null,
    p_language_code: input.languageCode ?? "en",
    p_explicit: input.explicit ?? false,
    p_release_date: input.releaseDate ?? null,
  });
  if (error) return { ok: false, error: error.message };
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.ok) {
    return {
      ok: false,
      error: String(row?.error_code ?? "export_failed"),
      used: row?.used,
      quota: row?.quota,
    };
  }
  return {
    ok: true,
    releaseId: row.release_id ? String(row.release_id) : undefined,
    used: row.used,
    quota: row.quota,
  };
}

export function subscribeDistributionReleases(
  userId: string,
  onChange: () => void,
): () => void {
  const channel = supabase
    .channel(`distribution-releases-${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "distribution_releases", filter: `user_id=eq.${userId}` },
      () => onChange(),
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
