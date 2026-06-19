import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set([
  "https://www.producerhit.com",
  "https://producerhit.com",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
]);

function corsHeadersForRequest(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? req.headers.get("origin") ?? "";
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "https://www.producerhit.com";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

const PLAN_NAMES = { pro: "Pro", studio: "Studio", plus: "Plus" } as const;
const PAID_PLANS = new Set(["pro", "studio", "plus"]);
const CREDIT_PACKS = {
  credit_pack_50: { credits: 50, label: "50 generations" },
} as const;

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
  if (!serviceRoleKey) throw new Error("Missing service role key");
  const admin = createClient(supabaseUrl, serviceRoleKey);
  const periodEndIso = currentPeriodEnd ? new Date(currentPeriodEnd * 1000).toISOString() : null;
  const { error } = await admin
    .from("profiles")
    .update({
      plan,
      stripe_customer_id: customerId || null,
      stripe_subscription_id: subscriptionId,
      stripe_price_id: priceId || null,
      stripe_current_period_end: periodEndIso,
    })
    .eq("id", userId);
  if (error) throw error;
}

function planFromEnvPriceId(
  priceId: string,
  pricePro: string,
  priceStudio: string,
  pricePlus: string,
  priceProAnnual = "",
  priceStudioAnnual = "",
  pricePlusAnnual = "",
): string {
  if (priceId && (priceId === pricePro || priceId === priceProAnnual)) return "pro";
  if (priceId && (priceId === priceStudio || priceId === priceStudioAnnual)) return "studio";
  if (priceId && (priceId === pricePlus || priceId === pricePlusAnnual)) return "plus";
  return "free";
}

function subscriptionPriceId(sub: Record<string, unknown>): string {
  const items = (sub.items as { data?: unknown } | undefined)?.data;
  const firstItem = Array.isArray(items) && items[0] && typeof items[0] === "object" ? (items[0] as Record<string, unknown>) : null;
  const price = firstItem && typeof firstItem.price === "object" ? (firstItem.price as Record<string, unknown>) : null;
  return asString(price?.id);
}

async function clearStaleBilling(
  supabaseUrl: string,
  serviceRoleKey: string,
  userId: string,
) {
  if (!serviceRoleKey) return;
  const admin = createClient(supabaseUrl, serviceRoleKey);
  await admin
    .from("profiles")
    .update({
      plan: "free",
      stripe_subscription_id: null,
      stripe_price_id: null,
      stripe_current_period_end: null,
    })
    .eq("id", userId);
}

function priceIdForPlan(
  plan: string,
  interval: string,
  pricePro: string,
  priceStudio: string,
  pricePlus: string,
  priceProAnnual: string,
  priceStudioAnnual: string,
  pricePlusAnnual: string,
): string {
  const annual = interval === "year";
  if (plan === "pro") return annual ? priceProAnnual : pricePro;
  if (plan === "studio") return annual ? priceStudioAnnual : priceStudio;
  if (plan === "plus") return annual ? pricePlusAnnual : pricePlus;
  return "";
}

function buildEmbeddedReturnUrl(successUrl: string): string {
  if (successUrl.includes("{CHECKOUT_SESSION_ID}")) return successUrl;
  const join = successUrl.includes("?") ? "&" : "?";
  return `${successUrl}${join}session_id={CHECKOUT_SESSION_ID}`;
}

type StripeSessionResult = {
  ok: boolean;
  session: {
    url?: unknown;
    client_secret?: unknown;
    error?: { message?: unknown; type?: unknown; code?: unknown };
  } | null;
};

async function createStripeCheckoutSession(
  stripeKey: string,
  params: URLSearchParams,
  stripeVersion?: string,
): Promise<StripeSessionResult> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${stripeKey}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
  if (stripeVersion) headers["Stripe-Version"] = stripeVersion;

  const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers,
    body: params,
  });

  const session = (await stripeRes.json().catch(() => null)) as StripeSessionResult["session"];
  return { ok: stripeRes.ok, session };
}

function stripeErrorMessage(session: StripeSessionResult["session"]): string {
  return typeof session?.error?.message === "string" ? session.error.message : "Stripe error";
}

function applyCheckoutBranding(
  params: URLSearchParams,
  plan: string,
  visualTheme: string,
  cloudAccent: string,
): void {
  const palette = brandingPalette(visualTheme, cloudAccent, plan);
  params.set("branding_settings[background_color]", palette.background);
  params.set("branding_settings[button_color]", palette.button);
  params.set("branding_settings[font_family]", "inter");
  params.set("branding_settings[border_style]", "rounded");
  params.set("branding_settings[display_name]", "ProducerHit");
}

function brandingPalette(
  visualTheme: string,
  cloudAccent: string,
  plan: string,
): { background: string; button: string } {
  if (visualTheme === "cloud") {
    const buttons: Record<string, string> = {
      transparent: "#8a9cff",
      green: "#7ec850",
      red: "#e87858",
      blue: "#58a8e8",
    };
    return {
      background: "#f5f5f7",
      button: buttons[cloudAccent] ?? buttons.transparent,
    };
  }
  if (visualTheme === "warm-glass") {
    return { background: "#261008", button: "#d4845a" };
  }
  return {
    background: "#0f0d18",
    button: plan === "pro" ? "#5eb8ff" : "#9d7cff",
  };
}

function stripCheckoutBranding(params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params);
  for (const key of [...next.keys()]) {
    if (key.startsWith("branding_settings")) next.delete(key);
  }
  return next;
}

function buildCreditPackCheckoutParams(
  priceId: string,
  product: string,
  credits: number,
  userId: string,
  customerId: string,
  customerEmail: string,
  visualTheme: string,
  cloudAccent: string,
  locale: string,
): URLSearchParams {
  const params = new URLSearchParams({
    mode: "payment",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    allow_promotion_codes: "true",
    client_reference_id: userId,
    "metadata[credit_pack]": product,
    "metadata[credits]": String(credits),
    "metadata[supabase_user_id]": userId,
    "metadata[price_id]": priceId,
  });
  if (customerId) params.set("customer", customerId);
  else if (customerEmail) params.set("customer_email", customerEmail);
  params.set("locale", locale === "fr" ? "fr" : "auto");
  if (locale === "fr") {
    params.set("custom_text[submit][message]", "Confirmer l'achat");
  }
  applyCheckoutBranding(params, "pro", visualTheme, cloudAccent);
  return params;
}

function buildBaseCheckoutParams(
  priceId: string,
  plan: string,
  userId: string,
  customerId: string,
  customerEmail: string,
  visualTheme: string,
  cloudAccent: string,
  locale: string,
  checkoutRecovery = false,
): URLSearchParams {
  const params = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    allow_promotion_codes: "true",
    client_reference_id: userId,
    "metadata[plan]": plan,
    "metadata[supabase_user_id]": userId,
    "metadata[price_id]": priceId,
    "subscription_data[metadata][plan]": plan,
    "subscription_data[metadata][supabase_user_id]": userId,
    "subscription_data[metadata][price_id]": priceId,
  });
  if (checkoutRecovery) {
    params.set("metadata[checkout_recovery]", "true");
    params.set("subscription_data[metadata][checkout_recovery]", "true");
  }
  if (customerId) params.set("customer", customerId);
  else if (customerEmail) params.set("customer_email", customerEmail);
  params.set("locale", locale === "fr" ? "fr" : "auto");
  if (locale === "fr") {
    params.set("custom_text[submit][message]", "Confirmer l'abonnement");
  }
  applyCheckoutBranding(params, plan, visualTheme, cloudAccent);
  return params;
}

async function createEmbeddedCheckoutSession(
  stripeKey: string,
  baseParams: URLSearchParams,
  successUrl: string,
): Promise<{ clientSecret: string } | { error: string; code?: string }> {
  const attempts: URLSearchParams[] = [
    (() => {
      const params = new URLSearchParams(baseParams);
      params.set("ui_mode", "embedded_page");
      params.set("redirect_on_completion", "never");
      return params;
    })(),
    (() => {
      const params = new URLSearchParams(baseParams);
      params.set("ui_mode", "embedded_page");
      params.set("return_url", buildEmbeddedReturnUrl(successUrl));
      params.set("redirect_on_completion", "if_required");
      return params;
    })(),
    (() => {
      const params = new URLSearchParams(baseParams);
      params.set("ui_mode", "embedded");
      params.set("return_url", buildEmbeddedReturnUrl(successUrl));
      return params;
    })(),
    (() => {
      const params = stripCheckoutBranding(new URLSearchParams(baseParams));
      params.set("ui_mode", "embedded_page");
      params.set("redirect_on_completion", "never");
      return params;
    })(),
  ];

  let lastError = "Stripe error";
  let lastCode: string | undefined;

  for (const params of attempts) {
    const { ok, session } = await createStripeCheckoutSession(stripeKey, params);
    const clientSecret = typeof session?.client_secret === "string" ? session.client_secret : null;
    if (ok && clientSecret) return { clientSecret };
    lastError = stripeErrorMessage(session);
    lastCode = typeof session?.error?.code === "string" ? session.error.code : undefined;
    console.warn("create-checkout embedded attempt failed", {
      ui_mode: params.get("ui_mode"),
      redirect_on_completion: params.get("redirect_on_completion"),
      message: lastError,
      code: lastCode,
    });
  }

  return { error: lastError, code: lastCode };
}

async function createHostedCheckoutSession(
  stripeKey: string,
  baseParams: URLSearchParams,
  successUrl: string,
  cancelUrl: string,
): Promise<{ url: string } | { error: string; code?: string }> {
  const attempts: URLSearchParams[] = [
    (() => {
      const params = new URLSearchParams(baseParams);
      params.set("success_url", successUrl);
      params.set("cancel_url", cancelUrl);
      return params;
    })(),
    (() => {
      const params = new URLSearchParams(baseParams);
      params.set("ui_mode", "hosted_page");
      params.set("success_url", successUrl);
      params.set("cancel_url", cancelUrl);
      return params;
    })(),
  ];

  let lastError = "Stripe error";
  let lastCode: string | undefined;

  for (const params of attempts) {
    const { ok, session } = await createStripeCheckoutSession(stripeKey, params);
    const checkoutUrl = typeof session?.url === "string" ? session.url : null;
    if (ok && checkoutUrl) return { url: checkoutUrl };
    lastError = stripeErrorMessage(session);
    lastCode = typeof session?.error?.code === "string" ? session.error.code : undefined;
  }

  return { error: lastError, code: lastCode };
}

serve(async (req) => {
  const corsHeaders = corsHeadersForRequest(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      plan?: unknown;
      product?: unknown;
      successUrl?: unknown;
      cancelUrl?: unknown;
      uiMode?: unknown;
      visualTheme?: unknown;
      cloudAccent?: unknown;
      locale?: unknown;
      checkoutRecovery?: unknown;
      billingInterval?: unknown;
    };
    const plan = String(body.plan ?? "");
    const product = String(body.product ?? "");
    const successUrl = String(body.successUrl ?? "");
    const cancelUrl = String(body.cancelUrl ?? "");
    const uiMode = String(body.uiMode ?? "embedded");
    const visualTheme = String(body.visualTheme ?? "prism");
    const cloudAccent = String(body.cloudAccent ?? "transparent");
    const checkoutLocale = String(body.locale ?? "auto");
    const checkoutRecovery = body.checkoutRecovery === true || body.checkoutRecovery === "true";
    const billingIntervalRaw = String(body.billingInterval ?? "month");
    const billingInterval = billingIntervalRaw === "year" ? "year" : "month";
    const embedded = uiMode === "embedded";

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const pricePro = Deno.env.get("STRIPE_PRICE_ID_PRO") ?? "";
    const priceStudio = Deno.env.get("STRIPE_PRICE_ID_STUDIO") ?? "";
    const pricePlus = Deno.env.get("STRIPE_PRICE_ID_PLUS") ?? "";
    const priceProAnnual = Deno.env.get("STRIPE_PRICE_ID_PRO_ANNUAL") ?? "";
    const priceStudioAnnual = Deno.env.get("STRIPE_PRICE_ID_STUDIO_ANNUAL") ?? "";
    const pricePlusAnnual = Deno.env.get("STRIPE_PRICE_ID_PLUS_ANNUAL") ?? "";
    const priceCreditPack50 = Deno.env.get("STRIPE_PRICE_ID_CREDIT_PACK_50") ?? "";

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
    if (!successUrl.startsWith("http")) {
      return new Response(JSON.stringify({ error: "Missing successUrl" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!embedded && !cancelUrl.startsWith("http")) {
      return new Response(JSON.stringify({ error: "Missing cancelUrl" }), {
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

    if (product === "credit_pack_50") {
      if (!stripeKey || !priceCreditPack50) {
        return new Response(
          JSON.stringify({
            mock: true,
            message: "Credit packs not configured yet — add STRIPE_PRICE_ID_CREDIT_PACK_50",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const pack = CREDIT_PACKS.credit_pack_50;
      const baseParams = buildCreditPackCheckoutParams(
        priceCreditPack50,
        product,
        pack.credits,
        user.id,
        customerId,
        user.email ?? "",
        visualTheme,
        cloudAccent,
        checkoutLocale,
      );

      if (embedded) {
        const embeddedResult = await createEmbeddedCheckoutSession(stripeKey, baseParams, successUrl);
        if ("clientSecret" in embeddedResult) {
          return new Response(JSON.stringify({ clientSecret: embeddedResult.clientSecret, uiMode: "embedded", product }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const hostedResult = await createHostedCheckoutSession(stripeKey, baseParams, successUrl, cancelUrl);
        if ("url" in hostedResult) {
          return new Response(
            JSON.stringify({ url: hostedResult.url, uiMode: "hosted", fallback: true, product }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
        return new Response(
          JSON.stringify({ error: hostedResult.error, code: hostedResult.code ?? null }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const hostedResult = await createHostedCheckoutSession(stripeKey, baseParams, successUrl, cancelUrl);
      if ("url" in hostedResult) {
        return new Response(JSON.stringify({ url: hostedResult.url, uiMode: "hosted", product }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(
        JSON.stringify({ error: hostedResult.error, code: hostedResult.code ?? null }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

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
    const priceId = priceIdForPlan(
      plan,
      billingInterval,
      pricePro,
      priceStudio,
      pricePlus,
      priceProAnnual,
      priceStudioAnnual,
      pricePlusAnnual,
    );
    if (!priceId) {
      if (billingInterval === "year") {
        return new Response(
          JSON.stringify({
            error: "Annual billing is not configured yet. Please choose monthly billing or contact support.",
          }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      throw new Error("Invalid plan: " + plan);
    }

    let subscriptionId = typeof profile?.stripe_subscription_id === "string" ? profile.stripe_subscription_id : "";
    let currentPlan = typeof profile?.plan === "string" ? profile.plan : "free";

    if (subscriptionId) {
      let subActive = false;
      let subRecord: Record<string, unknown> | null = null;
      try {
        subRecord = await fetchSubscription(stripeKey, subscriptionId);
        const status = asString(subRecord.status);
        subActive = status === "active" || status === "trialing";
      } catch {
        subActive = false;
      }

      if (!subActive) {
        await clearStaleBilling(supabaseUrl, serviceRoleKey, user.id);
        subscriptionId = "";
        currentPlan = "free";
      } else if (subRecord && !PAID_PLANS.has(currentPlan)) {
        const subPriceId = subscriptionPriceId(subRecord);
        const healedPlan = planFromEnvPriceId(
          subPriceId,
          pricePro,
          priceStudio,
          pricePlus,
          priceProAnnual,
          priceStudioAnnual,
          pricePlusAnnual,
        );
        if (PAID_PLANS.has(healedPlan)) {
          const healedCustomerId = asString(subRecord.customer) || customerId;
          const currentPeriodEnd = typeof subRecord.current_period_end === "number" ? subRecord.current_period_end : null;
          await syncProfilePlan(
            supabaseUrl,
            serviceRoleKey,
            user.id,
            healedPlan,
            healedCustomerId,
            subscriptionId,
            subPriceId,
            currentPeriodEnd,
          );
          currentPlan = healedPlan;
        }
      }
    }

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

    const baseParams = buildBaseCheckoutParams(
      priceId,
      plan,
      user.id,
      customerId,
      user.email ?? "",
      visualTheme,
      cloudAccent,
      checkoutLocale,
      checkoutRecovery,
    );

    if (embedded) {
      const embeddedResult = await createEmbeddedCheckoutSession(stripeKey, baseParams, successUrl);
      if ("clientSecret" in embeddedResult) {
        return new Response(JSON.stringify({ clientSecret: embeddedResult.clientSecret, uiMode: "embedded" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.error("create-checkout embedded failed, trying hosted fallback", {
        plan,
        message: embeddedResult.error,
        code: embeddedResult.code,
      });

      const hostedResult = await createHostedCheckoutSession(stripeKey, baseParams, successUrl, cancelUrl);
      if ("url" in hostedResult) {
        return new Response(
          JSON.stringify({ url: hostedResult.url, uiMode: "hosted", fallback: true }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ error: hostedResult.error, code: hostedResult.code ?? null }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const hostedResult = await createHostedCheckoutSession(stripeKey, baseParams, successUrl, cancelUrl);
    if ("url" in hostedResult) {
      return new Response(JSON.stringify({ url: hostedResult.url, uiMode: "hosted" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: hostedResult.error, code: hostedResult.code ?? null }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
