import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getAnalyticsStreams, getLabelGridConfig } from "../_shared/labelgridClient.ts";
import { fbGetProfile } from "../_shared/firestoreServer.ts";

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
  const firebaseApiKey = Deno.env.get("FIREBASE_API_KEY") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "").trim() : "";

  let userId: string | null = null;
  if (firebaseApiKey && token.startsWith("eyJ")) {
    try {
      const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts/lookup?key=${firebaseApiKey}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
      });
      if (res.ok) {
        const j = (await res.json()) as { users?: Array<{ localId?: string }> };
        userId = j.users?.[0]?.localId ?? null;
      }
    } catch { /* fall through */ }
  }
  if (!userId && supabaseUrl && anonKey) {
    const sc = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: authData, error: authError } = await sc.auth.getUser();
    if (!authError && authData.user) userId = authData.user.id;
  }
  if (!userId) {
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

  const fbProfile = await fbGetProfile(userId!);
  const plan = fbProfile?.plan ?? "free";
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
