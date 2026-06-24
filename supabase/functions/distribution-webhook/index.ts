import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { verifyWebhookSignatureAsync } from "../_shared/labelgridClient.ts";
import {
  logDistributionEvent,
  serviceClient,
} from "../_shared/distributionAssets.ts";
import { mapLabelGridStatusToLocal } from "../_shared/distributionStatusMap.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-labelgrid-signature, x-signature",
};

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

  const rawBody = await req.text();
  const secret = Deno.env.get("LABELGRID_WEBHOOK_SECRET") ?? "";
  const signature =
    req.headers.get("x-labelgrid-signature") ??
    req.headers.get("x-signature") ??
    req.headers.get("x-webhook-signature");

  if (secret) {
    const valid = await verifyWebhookSignatureAsync(rawBody, signature, secret);
    if (!valid) {
      return new Response(JSON.stringify({ error: "invalid_signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = serviceClient();
  const eventType = String(payload.event ?? payload.type ?? "unknown");
  const data = (payload.data ?? payload) as Record<string, unknown>;
  const lgReleaseId = String(
    data.release_id ?? data.releaseId ?? payload.release_id ?? "",
  ).trim();

  let releaseRow: { id: string; user_id: string; status: string } | null = null;
  if (lgReleaseId) {
    const { data: row } = await admin
      .from("distribution_releases")
      .select("id, user_id, status")
      .eq("labelgrid_release_id", lgReleaseId)
      .maybeSingle();
    releaseRow = row;
  }

  await logDistributionEvent(
    admin,
    releaseRow?.id ?? null,
    releaseRow?.user_id ?? null,
    `webhook:${eventType}`,
    payload,
  );

  if (releaseRow) {
    const lgStatus = String(data.status ?? payload.status ?? "");
    const localStatus = mapLabelGridStatusToLocal(lgStatus || eventType);
    const updates: Record<string, unknown> = {
      status: localStatus,
      status_detail: data,
    };
    if (localStatus === "live") {
      updates.live_at = new Date().toISOString();
    }
    if (localStatus === "rejected") {
      updates.status = "rejected";
    }
    await admin.from("distribution_releases").update(updates).eq("id", releaseRow.id);

    const outletSlug = String(data.outlet_slug ?? data.outlet ?? "").trim();
    const outletName = String(data.outlet_name ?? data.outletSlug ?? outletSlug).trim();
    if (outletSlug) {
      const outletStatus = mapLabelGridStatusToLocal(String(data.outlet_status ?? lgStatus));
      await admin.from("distribution_outlet_status").upsert({
        release_id: releaseRow.id,
        outlet_slug: outletSlug,
        outlet_name: outletName || outletSlug,
        status: outletStatus === "live" ? "live" : outletStatus === "rejected" ? "rejected" : "processing",
        external_url: typeof data.external_url === "string" ? data.external_url : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "release_id,outlet_slug" });
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
