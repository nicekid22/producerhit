import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { fbGetProfile } from "../_shared/firestoreServer.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    if (!stripeKey || !supabaseUrl || !anonKey) throw new Error("Missing configuration");

    const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.replace("Bearer ", "").trim() : "";
    if (!token) return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const firebaseApiKey = Deno.env.get("FIREBASE_API_KEY") ?? "";

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
      const supabase = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (userError || !user) return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      userId = user.id;
    }
    if (!userId) return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const fbProfile = await fbGetProfile(userId!);
    const customerId = fbProfile?.stripe_customer_id ?? "";
    if (!customerId) throw new Error("No Stripe customer");

    const body = (await req.json().catch(() => ({}))) as { returnUrl?: unknown };
    const returnUrl = typeof body?.returnUrl === "string" ? body.returnUrl : "";

    const portalRes = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        customer: customerId,
        return_url: returnUrl,
      }),
    });

    const portalJson = (await portalRes.json().catch(() => null)) as { url?: unknown } | null;
    const url = typeof portalJson?.url === "string" ? portalJson.url : null;
    if (!url) throw new Error("Stripe response missing portal URL");

    return new Response(JSON.stringify({ url }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
