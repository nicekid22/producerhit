import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function asString(v: unknown) {
  return typeof v === "string" ? v : "";
}

async function planFromPriceId(
  supabase: ReturnType<typeof createClient>,
  priceId: string,
  pricePro: string,
  priceStudio: string,
  pricePlus: string,
) {
  if (priceId && priceId === pricePro) return "pro";
  if (priceId && priceId === priceStudio) return "studio";
  if (priceId && priceId === pricePlus) return "plus";
  if (!priceId) return "free";

  const { data } = await supabase.from("billing_stripe_prices").select("plan").eq("stripe_price_id", priceId).maybeSingle();
  const mapped = typeof data?.plan === "string" ? data.plan : "";
  if (mapped === "pro" || mapped === "studio" || mapped === "plus") return mapped;
  return "free";
}

async function fetchSubscription(stripeKey: string, subscriptionId: string) {
  const res = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${stripeKey}` },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error("Stripe subscription fetch failed");
  return json as Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
    const pricePro = Deno.env.get("STRIPE_PRICE_ID_PRO") ?? "";
    const priceStudio = Deno.env.get("STRIPE_PRICE_ID_STUDIO") ?? "";
    const pricePlus = Deno.env.get("STRIPE_PRICE_ID_PLUS") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY") ?? "";

    if (!stripeKey || !supabaseUrl || !anonKey || !serviceRoleKey) {
      throw new Error("Missing configuration");
    }

    const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.replace("Bearer ", "").trim() : "";
    if (!token) {
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

    const body = (await req.json().catch(() => ({}))) as { sessionId?: unknown };
    const sessionId = asString(body.sessionId);
    if (!sessionId.startsWith("cs_")) {
      return new Response(JSON.stringify({ error: "Invalid sessionId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sessionRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${stripeKey}` },
    });
    const session = (await sessionRes.json().catch(() => null)) as Record<string, unknown> | null;
    if (!sessionRes.ok || !session) {
      throw new Error("Could not retrieve checkout session");
    }

    const metadata = (session.metadata ?? {}) as Record<string, unknown>;
    const sessionUserId = asString(metadata.supabase_user_id) || asString(session.client_reference_id);
    if (sessionUserId !== user.id) {
      return new Response(JSON.stringify({ error: "Session does not belong to user" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paymentStatus = asString(session.payment_status);
    const sessionStatus = asString(session.status);
    if (paymentStatus !== "paid" && sessionStatus !== "complete") {
      return new Response(JSON.stringify({ ok: false, pending: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subscriptionId = asString(session.subscription);
    const customerId = asString(session.customer);
    if (!subscriptionId) {
      return new Response(JSON.stringify({ ok: false, pending: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const sub = await fetchSubscription(stripeKey, subscriptionId);
    const items = (sub.items as { data?: unknown } | undefined)?.data;
    const firstItem = Array.isArray(items) && items[0] && typeof items[0] === "object" ? (items[0] as Record<string, unknown>) : null;
    const price = firstItem && typeof firstItem.price === "object" ? (firstItem.price as Record<string, unknown>) : null;
    const priceId = asString(price?.id);
    const currentPeriodEnd = typeof sub.current_period_end === "number" ? sub.current_period_end : null;
    const periodEndIso = currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null;

    const plan = await planFromPriceId(admin, priceId, pricePro, priceStudio, pricePlus);
    if (plan === "free") {
      return new Response(JSON.stringify({ ok: false, error: "Unknown price" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: updateError } = await admin
      .from("profiles")
      .update({
        plan,
        stripe_customer_id: customerId || null,
        stripe_subscription_id: subscriptionId,
        stripe_price_id: priceId || null,
        stripe_current_period_end: periodEndIso,
      })
      .eq("id", user.id);
    if (updateError) throw updateError;

    return new Response(JSON.stringify({ ok: true, plan }), {
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
