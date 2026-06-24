import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function planFromProductId(productId: string | undefined): "pro" | "studio" | "plus" {
  const id = (productId ?? "").toLowerCase();
  if (id.includes(".plus.monthly")) return "plus";
  if (id.includes(".studio.monthly")) return "studio";
  return "pro";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json().catch(() => ({}))) as {
      action?: string;
      productId?: string;
      plan?: string;
      transactionId?: string;
      originalTransactionId?: string;
    };

    const allowDevSync = (Deno.env.get("APPLE_IAP_ALLOW_CLIENT_SYNC") ?? "").trim() === "1";
    if (!allowDevSync && body.action === "purchase") {
      return new Response(
        JSON.stringify({
          error: "Server-side Apple receipt validation required. Enable RevenueCat or APPLE_IAP_ALLOW_CLIENT_SYNC for sandbox.",
          plan: null,
        }),
        { status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const admin = createClient(supabaseUrl, serviceKey);

    if (body.action === "restore") {
      const { data: profile } = await admin.from("profiles").select("plan, billing_source").eq("id", user.id).single();
      return new Response(
        JSON.stringify({
          ok: true,
          plan: profile?.plan ?? "free",
          billing_source: profile?.billing_source ?? "none",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const productId = body.productId ?? "com.producerhit.app.pro.monthly";
    const plan =
      body.plan === "plus" || body.plan === "studio" || body.plan === "pro"
        ? body.plan
        : planFromProductId(productId);

    const { error: rpcError } = await admin.rpc("apply_apple_plan_entitlement", {
      p_user_id: user.id,
      p_product_id: productId,
      p_plan: plan,
      p_original_transaction_id: body.originalTransactionId ?? body.transactionId ?? null,
    });

    if (rpcError) {
      console.error("apply_apple_plan_entitlement", rpcError.message);
      return new Response(JSON.stringify({ error: rpcError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await admin.from("profiles").select("plan, billing_source").eq("id", user.id).single();

    return new Response(
      JSON.stringify({
        ok: true,
        plan: profile?.plan ?? plan,
        billing_source: profile?.billing_source ?? "apple",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
