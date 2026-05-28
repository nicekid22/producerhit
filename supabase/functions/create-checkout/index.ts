import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_NAMES = { pro: "Pro", studio: "Studio", plus: "Plus" } as const;
const PAID_PLANS = new Set(["pro", "studio", "plus"]);

function planRank(plan: string): number {
  if (plan === "plus") return 3;
  if (plan === "studio") return 2;
  if (plan === "pro") return 1;
  return 0;
}

function asString(v: unknown) {
  return typeof v === "string" ? v : "";
}

async function fetchSubscription(stripeKey: string, subscriptionId: string) {
  const res = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${stripeKey}` },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(typeof json === "object" && json && typeof (json as { error?: { message?: unknown } }).error?.message === "string"
      ? String((json as { error: { message: string } }).error.message)
      : "Stripe subscription fetch failed");
  }
  return json as Record<string, unknown>;
}

async function upgradeExistingSubscription(
  stripeKey: string,
  subscriptionId: string,
  priceId: string,
  plan: string,
  userId: string,
) {
  const sub = await fetchSubscription(stripeKey, subscriptionId);
  const status = asString(sub.status);
  if (status !== "active" && status !== "trialing") {
    throw new Error("Subscription is not active");
  }

  const items = (sub.items as { data?: unknown } | undefined)?.data;
  const firstItem = Array.isArray(items) && items[0] && typeof items[0] === "object" ? (items[0] as Record<string, unknown>) : null;
  const itemId = asString(firstItem?.id);
  if (!itemId) throw new Error("Missing subscription item");

  const updateRes = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      "items[0][id]": itemId,
      "items[0][price]": priceId,
      proration_behavior: "create_prorations",
      "metadata[plan]": plan,
      "metadata[supabase_user_id]": userId,
      "metadata[price_id]": priceId,
    }),
  });

  const updateJson = (await updateRes.json().catch(() => null)) as Record<string, unknown> | { error?: { message?: unknown } } | null;
  if (!updateRes.ok) {
    const stripeMessage = typeof updateJson === "object" && updateJson && typeof (updateJson as { error?: { message?: unknown } }).error?.message === "string"
      ? String((updateJson as { error: { message: string } }).error.message)
      : "Stripe subscription update failed";
    throw new Error(stripeMessage);
  }
  return updateJson as Record<string, unknown>;
}

async function syncProfilePlan(
  supabaseUrl: string,
  serviceRoleKey: string,
  userId: string,
  plan: string,
  customerId: string,
  subscriptionId: string,
  priceId: string,
  currentPeriodEnd: number | null,
) {
  if (!serviceRoleKey) return;
  const admin = createClient(supabaseUrl, serviceRoleKey);
  const periodEndIso = currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null;
  await admin
    .from("profiles")
    .update({
      plan,
      stripe_customer_id: customerId || null,
      stripe_subscription_id: subscriptionId,
      stripe_price_id: priceId || null,
      stripe_current_period_end: periodEndIso,
    })
    .eq("id", userId);
}

function priceIdForPlan(plan: string, pricePro: string, priceStudio: string, pricePlus: string): string {
  if (plan === "pro") return pricePro;
  if (plan === "studio") return priceStudio;
  if (plan === "plus") return pricePlus;
  return "";
}

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
    const pricePlus = Deno.env.get("STRIPE_PRICE_ID_PLUS") ?? "";
    if (!stripeKey || !pricePro || !priceStudio || !pricePlus) {
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
    const priceId = priceIdForPlan(plan, pricePro, priceStudio, pricePlus);
    if (!priceId) throw new Error("Invalid plan: " + plan);

    const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.replace("Bearer ", "").trim() : "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY") ?? "";
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
      .select("stripe_customer_id, stripe_subscription_id, plan")
      .eq("id", user.id)
      .maybeSingle();
    const customerId = typeof profile?.stripe_customer_id === "string" ? profile.stripe_customer_id : "";
    const subscriptionId = typeof profile?.stripe_subscription_id === "string" ? profile.stripe_subscription_id : "";
    const currentPlan = typeof profile?.plan === "string" ? profile.plan : "free";

    if (subscriptionId && PAID_PLANS.has(currentPlan)) {
      if (currentPlan === plan) {
        return new Response(JSON.stringify({ url: successUrl, alreadySubscribed: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (planRank(plan) < planRank(currentPlan)) {
        return new Response(JSON.stringify({ error: "Use the billing portal to change your plan" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const updatedSub = await upgradeExistingSubscription(stripeKey, subscriptionId, priceId, plan, user.id);
      const updatedCustomerId = asString(updatedSub.customer) || customerId;
      const currentPeriodEnd = typeof updatedSub.current_period_end === "number" ? updatedSub.current_period_end : null;
      await syncProfilePlan(
        supabaseUrl,
        serviceRoleKey,
        user.id,
        plan,
        updatedCustomerId,
        subscriptionId,
        priceId,
        currentPeriodEnd,
      );
      return new Response(JSON.stringify({ url: successUrl, upgraded: true, plan }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
