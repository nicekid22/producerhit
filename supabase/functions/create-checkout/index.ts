import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_NAMES = { pro: "Pro", studio: "Studio" } as const;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as { plan?: unknown; successUrl?: unknown; cancelUrl?: unknown };
    const plan = String(body.plan ?? "");
    const successUrl = String(body.successUrl ?? "");
    const cancelUrl = String(body.cancelUrl ?? "");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const pricePro = Deno.env.get("STRIPE_PRICE_ID_PRO") ?? "";
    const priceStudio = Deno.env.get("STRIPE_PRICE_ID_STUDIO") ?? "";
    if (!stripeKey || !pricePro || !priceStudio) {
      return new Response(
        JSON.stringify({
          mock: true,
          message: "Stripe not configured yet",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const planName = PLAN_NAMES[plan as keyof typeof PLAN_NAMES];
    if (!planName) throw new Error("Invalid plan: " + plan);
    const priceId = plan === "pro" ? pricePro : priceStudio;

    const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.replace("Bearer ", "").trim() : "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    if (!token || !supabaseUrl || !anonKey) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!successUrl.startsWith("http") || !cancelUrl.startsWith("http")) {
      return new Response(JSON.stringify({ error: "Missing successUrl/cancelUrl" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();
    const customerId = typeof profile?.stripe_customer_id === "string" ? profile.stripe_customer_id : "";

    const params = new URLSearchParams({
      mode: "subscription",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: "true",
      client_reference_id: user.id,
      "metadata[plan]": plan,
      "metadata[supabase_user_id]": user.id,
      "metadata[price_id]": priceId,
      "subscription_data[metadata][plan]": plan,
      "subscription_data[metadata][supabase_user_id]": user.id,
      "subscription_data[metadata][price_id]": priceId,
    });
    if (customerId) params.set("customer", customerId);
    else params.set("customer_email", user.email ?? "");

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    });

    const session = (await stripeRes.json().catch(() => null)) as
      | { url?: unknown; error?: { message?: unknown } }
      | null;
    if (!stripeRes.ok) {
      const stripeMessage = typeof session?.error?.message === "string" ? session.error.message : "Stripe error";
      return new Response(JSON.stringify({ error: stripeMessage }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const checkoutUrl = typeof session?.url === "string" ? session.url : null;
    if (!checkoutUrl) throw new Error("Stripe response missing checkout URL");

    return new Response(JSON.stringify({ url: checkoutUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
