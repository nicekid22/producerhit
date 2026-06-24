import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getLabelGridConfig, getRelease, listReviewIssues } from "../_shared/labelgridClient.ts";
import {
  logDistributionEvent,
  serviceClient,
} from "../_shared/distributionAssets.ts";
import { mapLabelGridStatusToLocal } from "../_shared/distributionStatusMap.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-distribution-cron-secret",
};

function verifyCronSecret(req: Request): boolean {
  const expected = Deno.env.get("DISTRIBUTION_CRON_SECRET") ?? Deno.env.get("CRON_SECRET") ?? "";
  if (!expected) return false;
  const provided =
    req.headers.get("x-distribution-cron-secret") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  return provided === expected;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!verifyCronSecret(req)) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = serviceClient();
  const { data: pending, error } = await admin
    .from("distribution_releases")
    .select("id, user_id, labelgrid_release_id, status")
    .in("status", ["submitted", "in_review"])
    .not("labelgrid_release_id", "is", null)
    .limit(50);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let lg: ReturnType<typeof getLabelGridConfig> | null = null;
  try {
    lg = getLabelGridConfig();
  } catch {
    return new Response(JSON.stringify({ error: "labelgrid_not_configured", synced: 0 }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let synced = 0;
  for (const row of pending ?? []) {
    const lgId = row.labelgrid_release_id;
    if (!lgId) continue;
    try {
      const remote = await getRelease(lgId, lg);
      const localStatus = mapLabelGridStatusToLocal(String(remote.status ?? ""));
      const updates: Record<string, unknown> = {
        status: localStatus,
        status_detail: remote,
      };
      if (localStatus === "live") updates.live_at = new Date().toISOString();
      if (localStatus === "rejected") {
        const issues = await listReviewIssues(lgId, lg);
        updates.status_detail = { ...remote, review_issues: issues };
      }
      await admin.from("distribution_releases").update(updates).eq("id", row.id);
      await logDistributionEvent(admin, row.id, row.user_id, "sync_cron", {
        labelgrid_release_id: lgId,
        status: localStatus,
      });
      synced += 1;
    } catch (syncErr) {
      await logDistributionEvent(admin, row.id, row.user_id, "sync_cron_error", {
        error: syncErr instanceof Error ? syncErr.message : "sync_failed",
      });
    }
  }

  return new Response(JSON.stringify({ ok: true, synced, checked: pending?.length ?? 0 }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
