import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { fbGetProfile, fbUpdateProfile, fbGrantCredits } from "../_shared/firestoreServer.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const HOSTED_AUDIO_GRACE_DAYS = 7;

function asString(v: unknown) {
  return typeof v === "string" ? v : "";
}

function hostedAudioExpiresAtIso(days = HOSTED_AUDIO_GRACE_DAYS): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function profilePlanPatch(prevPlan: string, nextPlan: string): Record<string, unknown> {
  const patch: Record<string, unknown> = { plan: nextPlan };
  if (nextPlan === "plus") {
    patch.hosted_audio_expires_at = null;
  } else if (prevPlan === "plus") {
    patch.hosted_audio_expires_at = hostedAudioExpiresAtIso();
  }
  return patch;
}

async function planFromPriceId(
  priceId: string,
  pricePro: string,
  priceStudio: string,
  pricePlus: string,
  priceProAnnual: string,
  priceStudioAnnual: string,
  pricePlusAnnual: string,
) {
  if (priceId && (priceId === pricePro || priceId === priceProAnnual)) return "pro";
  if (priceId && (priceId === priceStudio || priceId === priceStudioAnnual)) return "studio";
  if (priceId && (priceId === pricePlus || priceId === pricePlusAnnual)) return "plus";
  if (!priceId) return "free";
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
    const priceProAnnual = Deno.env.get("STRIPE_PRICE_ID_PRO_ANNUAL") ?? "";
    const priceStudioAnnual = Deno.env.get("STRIPE_PRICE_ID_STUDIO_ANNUAL") ?? "";
    const pricePlusAnnual = Deno.env.get("STRIPE_PRICE_ID_PLUS_ANNUAL") ?? "";
    const firebaseApiKey = Deno.env.get("FIREBASE_API_KEY") ?? "";

    if (!stripeKey) {
      throw new Error("Missing STRIPE_SECRET_KEY");
    }

    const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.replace("Bearer ", "").trim() : "";
    if (!token) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify Firebase ID token
    let userId: string | null = null;
    if (firebaseApiKey && token.startsWith("eyJ")) {
      try {
        const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: token }),
        });
        if (res.ok) {
          const j = (await res.json()) as { users?: Array<{ localId?: string }> };
          userId = j.users?.[0]?.localId ?? null;
        }
      } catch { /* fall through */ }
    }
    if (!userId) {
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
    const sessionUserId = asString(metadata.firebase_uid) || asString(session.client_reference_id);
    if (sessionUserId !== userId!) {
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

    const mode = asString(session.mode);
    const customerId = asString(session.customer);

    if (mode === "payment") {
      const creditPack = asString(metadata.credit_pack);
      const creditsRaw = asString(metadata.credits);
      const credits = Number.parseInt(creditsRaw, 10);
      if (!creditPack || !Number.isFinite(credits) || credits <= 0) {
        return new Response(JSON.stringify({ ok: false, error: "Invalid credit pack session" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      await fbGrantCredits(userId!, {
        idempotencyKey: `confirm:${sessionId}`,
        bonusType: "purchased",
        credits,
      });
      return new Response(JSON.stringify({ ok: true, product: "credit_pack" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subscriptionId = asString(session.subscription);
    if (!subscriptionId) {
      return new Response(JSON.stringify({ ok: false, pending: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sub = await fetchSubscription(stripeKey, subscriptionId);
    const items = (sub.items as { data?: unknown } | undefined)?.data;
    const firstItem = Array.isArray(items) && items[0] && typeof items[0] === "object" ? (items[0] as Record<string, unknown>) : null;
    const price = firstItem && typeof firstItem.price === "object" ? (firstItem.price as Record<string, unknown>) : null;
    const priceId = asString(price?.id);
    const currentPeriodEnd = typeof sub.current_period_end === "number" ? sub.current_period_end : null;
    const periodEndIso = currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null;

    const plan = await planFromPriceId(
      priceId,
      pricePro,
      priceStudio,
      pricePlus,
      priceProAnnual,
      priceStudioAnnual,
      pricePlusAnnual,
    );
    if (plan === "free") {
      return new Response(JSON.stringify({ ok: false, error: "Unknown price" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prevProfile = await fbGetProfile(userId!);
    const prevPlan = prevProfile?.plan ?? "free";

    await fbUpdateProfile(userId!, {
      ...profilePlanPatch(prevPlan, plan),
      stripe_customer_id: customerId || null,
      stripe_subscription_id: subscriptionId,
      stripe_price_id: priceId || null,
      stripe_current_period_end: periodEndIso,
    });

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
