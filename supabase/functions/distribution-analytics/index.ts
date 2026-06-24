import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getAnalyticsStreams, getLabelGridConfig } from "../_shared/labelgridClient.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

  const authHeader = req.headers.get("Authorization") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user) {
    return new Response(JSON.stringify({ error: "not_authenticated" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = (await req.json().catch(() => ({}))) as {
    releaseId?: string;
    from?: string;
    to?: string;
  };

  const { data: profile } = await userClient
    .from("profiles")
    .select("plan")
    .eq("id", authData.user.id)
    .single();

  const plan = profile?.plan ?? "free";
  if (plan !== "plus" && plan !== "studio") {
    return new Response(JSON.stringify({ error: "plan_not_eligible" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let labelgridReleaseId: string | undefined;
  if (body.releaseId) {
    const { data: release } = await userClient
      .from("distribution_releases")
      .select("labelgrid_release_id, user_id")
      .eq("id", body.releaseId)
      .maybeSingle();
    if (!release || release.user_id !== authData.user.id) {
      return new Response(JSON.stringify({ error: "release_not_found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    labelgridReleaseId = release.labelgrid_release_id ?? undefined;
  }

  try {
    const lg = getLabelGridConfig();
    const now = new Date();
    const from = body.from ?? new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);
    const to = body.to ?? now.toISOString().slice(0, 10);
    const analytics = await getAnalyticsStreams({
      releaseId: labelgridReleaseId,
      from,
      to,
    }, lg);

    return new Response(JSON.stringify({
      ok: true,
      from,
      to,
      canExportCsv: plan === "plus",
      analytics,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "analytics_failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
