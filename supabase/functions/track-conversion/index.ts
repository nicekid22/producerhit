import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set([
  "https://www.producerhit.com",
  "https://producerhit.com",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
]);

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? req.headers.get("origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin) ? origin : "https://www.producerhit.com",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    Vary: "Origin",
  };
}

function asString(v: unknown) {
  return typeof v === "string" ? v : "";
}

async function sha256Hex(input: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input.trim().toLowerCase()));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sendMetaCapi(args: {
  pixelId: string;
  token: string;
  eventName: string;
  eventId: string;
  eventTime: number;
  pageUrl?: string;
  userAgent?: string;
  emailHash?: string;
  externalId?: string;
  customData?: Record<string, unknown>;
  attribution?: Record<string, string>;
}) {
  const userData: Record<string, unknown> = {};
  if (args.emailHash) userData.em = [args.emailHash];
  if (args.externalId) userData.external_id = [args.externalId];
  if (args.userAgent) userData.client_user_agent = args.userAgent;

  const customData = { ...(args.customData ?? {}) };
  if (args.attribution?.utm_source) customData.utm_source = args.attribution.utm_source;
  if (args.attribution?.utm_campaign) customData.utm_campaign = args.attribution.utm_campaign;
  if (args.attribution?.fbclid) customData.fbclid = args.attribution.fbclid;

  const body = {
    data: [
      {
        event_name: args.eventName,
        event_time: args.eventTime,
        event_id: args.eventId,
        event_source_url: args.pageUrl,
        action_source: "website",
        user_data: userData,
        custom_data: customData,
      },
    ],
  };

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${encodeURIComponent(args.pixelId)}/events?access_token=${encodeURIComponent(args.token)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    console.warn("Meta CAPI error:", text.slice(0, 400));
  }
}

async function sendTikTokEvents(args: {
  pixelId: string;
  token: string;
  eventName: string;
  eventId: string;
  eventTime: number;
  pageUrl?: string;
  email?: string;
  externalId?: string;
  customData?: Record<string, unknown>;
  attribution?: Record<string, string>;
}) {
  const user: Record<string, unknown> = {};
  if (args.email) user.email = args.email;
  if (args.externalId) user.external_id = args.externalId;

  const body = {
    pixel_code: args.pixelId,
    event: args.eventName,
    event_id: args.eventId,
    timestamp: new Date(args.eventTime * 1000).toISOString(),
    context: {
      page: { url: args.pageUrl },
      user,
      ad: args.attribution?.ttclid ? { callback: args.attribution.ttclid } : undefined,
    },
    properties: args.customData ?? {},
  };

  const res = await fetch("https://business-api.tiktok.com/open_api/v1.3/pixel/track/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Access-Token": args.token,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    console.warn("TikTok Events API error:", text.slice(0, 400));
  }
}

const EVENT_MAP: Record<string, { meta?: string; tiktok?: string }> = {
  signup_completed: { meta: "CompleteRegistration", tiktok: "CompleteRegistration" },
  generate_success: { meta: "Lead", tiktok: "SubmitForm" },
  checkout_start: { meta: "InitiateCheckout", tiktok: "InitiateCheckout" },
  subscription_activated: { meta: "Subscribe", tiktok: "Subscribe" },
  email_capture: { meta: "Lead", tiktok: "SubmitForm" },
};

serve(async (req) => {
  const cors = corsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response("method not allowed", { status: 405, headers: cors });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const metaPixelId = Deno.env.get("META_PIXEL_ID") ?? Deno.env.get("VITE_META_PIXEL_ID") ?? "";
    const metaToken = Deno.env.get("META_CONVERSION_API_ACCESS_TOKEN") ?? "";
    const tiktokPixelId = Deno.env.get("TIKTOK_PIXEL_ID") ?? Deno.env.get("VITE_TIKTOK_PIXEL_ID") ?? "";
    const tiktokToken = Deno.env.get("TIKTOK_EVENTS_API_ACCESS_TOKEN") ?? "";

    if (!supabaseUrl || !anonKey) {
      return new Response(JSON.stringify({ ok: false, error: "missing_config" }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    const supabase = createClient(
      supabaseUrl,
      anonKey,
      jwt && jwt !== anonKey ? { global: { headers: { Authorization: `Bearer ${jwt}` } } } : undefined,
    );

    let user: { id: string; email?: string } | null = null;
    if (jwt && jwt !== anonKey) {
      const { data } = await supabase.auth.getUser(jwt);
      user = data.user;
    }

    const body = (await req.json().catch(() => ({}))) as {
      event_name?: unknown;
      event_id?: unknown;
      props?: unknown;
      page_url?: unknown;
      user_agent?: unknown;
      attribution?: unknown;
      session_id?: unknown;
    };

    const eventName = asString(body.event_name);
    const eventId = asString(body.event_id);
    const map = EVENT_MAP[eventName];
    if (!map || !eventId) {
      return new Response(JSON.stringify({ ok: false, error: "ignored" }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const props = typeof body.props === "object" && body.props ? (body.props as Record<string, unknown>) : {};
    const attribution =
      typeof body.attribution === "object" && body.attribution ? (body.attribution as Record<string, string>) : {};
    const eventTime = Math.floor(Date.now() / 1000);
    const pageUrl = asString(body.page_url);
    const userAgent = asString(body.user_agent) || req.headers.get("user-agent") || "";
    const email = user?.email ?? asString(props.email);
    const emailHash = email ? await sha256Hex(email) : undefined;
    const externalId = user?.id ?? asString(body.session_id);

    const tasks: Promise<void>[] = [];

    if (metaPixelId && metaToken && map.meta) {
      tasks.push(
        sendMetaCapi({
          pixelId: metaPixelId,
          token: metaToken,
          eventName: map.meta,
          eventId,
          eventTime,
          pageUrl,
          userAgent,
          emailHash,
          externalId,
          customData: props,
          attribution,
        }),
      );
    }

    if (tiktokPixelId && tiktokToken && map.tiktok) {
      tasks.push(
        sendTikTokEvents({
          pixelId: tiktokPixelId,
          token: tiktokToken,
          eventName: map.tiktok,
          eventId,
          eventTime,
          pageUrl,
          email: email || undefined,
          externalId,
          customData: props,
          attribution,
        }),
      );
    }

    await Promise.all(tasks);

    return new Response(JSON.stringify({ ok: true, mirrored: tasks.length }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("track-conversion error:", error);
    return new Response(JSON.stringify({ ok: false }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
