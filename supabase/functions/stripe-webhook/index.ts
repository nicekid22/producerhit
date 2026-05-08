import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function asString(v: unknown) {
  return typeof v === "string" ? v : "";
}

function equalBytes(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function hexToBytes(hex: string) {
  const clean = hex.trim();
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

async function hmacSha256(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return new Uint8Array(sig);
}

function planFromPriceId(priceId: string) {
  const pro = Deno.env.get("STRIPE_PRICE_ID_PRO") ?? "";
  const studio = Deno.env.get("STRIPE_PRICE_ID_STUDIO") ?? "";
  if (priceId && priceId === pro) return "pro";
  if (priceId && priceId === studio) return "studio";
  return "free";
}

async function resolveUserIdByCustomerId(supabase: ReturnType<typeof createClient>, customerId: string) {
  if (!customerId) return "";
  const { data } = await supabase.from("profiles").select("id").eq("stripe_customer_id", customerId).maybeSingle();
  return typeof data?.id === "string" ? data.id : "";
}

async function fetchSubscription(stripeKey: string, subscriptionId: string) {
  const res = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${stripeKey}` },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = typeof json === "object" && json && typeof (json as { error?: unknown }).error === "object" ? "Stripe error" : "Stripe error";
    throw new Error(msg);
  }
  return json as Record<string, unknown>;
}

serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? Deno.env.get("STRIPE_ENDPOINT_SECRET") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SERVICE_ROLE_KEY") ?? "";

  if (!stripeKey || !webhookSecret || !supabaseUrl || !serviceRoleKey) {
    return new Response("missing env", { status: 500 });
  }
  if (webhookSecret.startsWith("http://") || webhookSecret.startsWith("https://")) {
    return new Response("invalid webhook secret", { status: 500 });
  }

  const sigHeader = req.headers.get("stripe-signature") ?? "";
  const rawBody = await req.text();

  const parts = sigHeader.split(",").map((p) => p.trim());
  const timestamp = parts.find((p) => p.startsWith("t="))?.slice(2) ?? "";
  const v1s = parts.filter((p) => p.startsWith("v1=")).map((p) => p.slice(3)).filter(Boolean);
  if (!timestamp || v1s.length === 0) return new Response("bad signature header", { status: 400 });

  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = await hmacSha256(webhookSecret, signedPayload);
  let ok = false;
  for (const v1 of v1s) {
    const provided = hexToBytes(v1);
    if (equalBytes(expected, provided)) {
      ok = true;
      break;
    }
  }
  if (!ok) return new Response("invalid signature", { status: 400 });

  const event = (JSON.parse(rawBody) as { type?: unknown; data?: unknown }) ?? {};
  const type = asString(event.type);
  const dataObj =
    typeof event.data === "object" && event.data && typeof (event.data as { object?: unknown }).object === "object"
      ? ((event.data as { object: unknown }).object as Record<string, unknown>)
      : null;

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    if (!dataObj) return new Response("ok");

    if (type === "checkout.session.completed") {
      const subscriptionId = asString(dataObj.subscription);
      const customerId = asString(dataObj.customer);
      const metadata = (dataObj.metadata ?? {}) as Record<string, unknown>;
      const userId = asString(metadata.supabase_user_id) || asString(dataObj.client_reference_id);
      if (!userId || !subscriptionId) return new Response("ok");

      const sub = await fetchSubscription(stripeKey, subscriptionId);
      const items = (sub.items as { data?: unknown } | undefined)?.data;
      const firstItem = Array.isArray(items) && items[0] && typeof items[0] === "object" ? (items[0] as Record<string, unknown>) : null;
      const price = firstItem && typeof firstItem.price === "object" ? (firstItem.price as Record<string, unknown>) : null;
      const priceId = asString(price?.id);
      const currentPeriodEnd = typeof sub.current_period_end === "number" ? sub.current_period_end : null;
      const periodEndIso = currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null;

      const plan = planFromPriceId(priceId);
      await supabase
        .from("profiles")
        .update({
          plan,
          stripe_customer_id: customerId || null,
          stripe_subscription_id: subscriptionId,
          stripe_price_id: priceId || null,
          stripe_current_period_end: periodEndIso,
        })
        .eq("id", userId);

      return new Response("ok");
    }

    if (type === "customer.subscription.updated" || type === "customer.subscription.deleted") {
      const subscriptionId = asString(dataObj.id);
      const customerId = asString(dataObj.customer);
      const status = asString(dataObj.status);
      const metadata = (dataObj.metadata ?? {}) as Record<string, unknown>;
      const userId = asString(metadata.supabase_user_id) || (await resolveUserIdByCustomerId(supabase, customerId));

      const items = (dataObj.items as { data?: unknown } | undefined)?.data;
      const firstItem = Array.isArray(items) && items[0] && typeof items[0] === "object" ? (items[0] as Record<string, unknown>) : null;
      const price = firstItem && typeof firstItem.price === "object" ? (firstItem.price as Record<string, unknown>) : null;
      const priceId = asString(price?.id);
      const currentPeriodEnd = typeof dataObj.current_period_end === "number" ? (dataObj.current_period_end as number) : null;
      const periodEndIso = currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null;

      if (!userId) return new Response("ok");

      const active = status === "active" || status === "trialing";
      const plan = active ? planFromPriceId(priceId) : "free";

      await supabase
        .from("profiles")
        .update({
          plan,
          stripe_customer_id: customerId || null,
          stripe_subscription_id: active ? subscriptionId : null,
          stripe_price_id: active ? priceId || null : null,
          stripe_current_period_end: active ? periodEndIso : null,
        })
        .eq("id", userId);

      return new Response("ok");
    }

    return new Response("ok");
  } catch {
    return new Response("ok");
  }
});
