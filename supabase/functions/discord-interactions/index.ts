import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  DAILY_PRODUCER_TIPS,
  isoWeekKey,
  loadDiscordConfig,
  loopEmbed,
  pickDailyItem,
  PRODUCERHIT_SITE,
  resolveDiscordChannels,
  sendDiscordEmbed,
  utcDayKey,
  verifyDiscordInteractionSignature,
} from "../_shared/discordApi.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature-ed25519, x-signature-timestamp",
};

function serviceClient() {
  const url = (Deno.env.get("SUPABASE_URL") ?? "").trim();
  const key = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "").trim();
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function interactionResponse(type: number, data?: Record<string, unknown>) {
  return new Response(JSON.stringify({ type, ...(data ? { data } : {}) }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const publicKey = (Deno.env.get("DISCORD_PUBLIC_KEY") ?? "").trim();
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature-ed25519") ?? "";
  const timestamp = req.headers.get("x-signature-timestamp") ?? "";

  // PING (endpoint verification) must respond even while rolling out signature checks.
  let body: { type?: number; data?: { name?: string } };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return new Response("bad request", { status: 400 });
  }

  if (body?.type === 1) {
    if (publicKey) {
      const valid = await verifyDiscordInteractionSignature(rawBody, signature, timestamp, publicKey);
      if (!valid) return new Response("invalid signature", { status: 401 });
    }
    return interactionResponse(1);
  }

  if (publicKey) {
    const valid = await verifyDiscordInteractionSignature(rawBody, signature, timestamp, publicKey);
    if (!valid) return new Response("invalid signature", { status: 401 });
  }

  const type = typeof body?.type === "number" ? body.type : 0;

  if (type === 2) {
    const name = body?.data?.name ?? "";
    const db = serviceClient();
    const rawCfg = loadDiscordConfig();
    const cfg = rawCfg ? await resolveDiscordChannels(rawCfg) : null;

    if (name === "rules") {
      return interactionResponse(4, {
        content:
          "**ProducerHit rules**\n" +
          "• Respect other producers\n" +
          "• Public loops only in #showcase\n" +
          "• 1 challenge entry per week\n" +
          `• Commercial license: ${PRODUCERHIT_SITE}/legal#commercial-license\n` +
          `• Free tier: 10 gens/mo → [Pro plans](${PRODUCERHIT_SITE}/pricing)`,
      });
    }

    if (name === "link") {
      return interactionResponse(4, {
        content:
          `**ProducerHit**\n` +
          `Create free: ${PRODUCERHIT_SITE}\n` +
          `Upgrade: ${PRODUCERHIT_SITE}/pricing\n` +
          `Community hub: ${PRODUCERHIT_SITE}/community\n\n` +
          `**Discord:** English in #general · #french · #spanish · #portuguese\n` +
          `Share public loops in #showcase · Weekly challenge in #weekly-challenge`,
      });
    }

    if (name === "tip") {
      const tip = pickDailyItem(DAILY_PRODUCER_TIPS, utcDayKey());
      return interactionResponse(4, { content: `💡 **Producer tip**\n${tip}` });
    }

    if (name === "spotlight" && db) {
      const { data: loop } = await db
        .from("loops")
        .select("id, name, genre, bpm, cover_url, user_id, created_at")
        .eq("is_public", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!loop?.id) {
        return interactionResponse(4, {
          content: `No public tracks yet — [create the first one free](${PRODUCERHIT_SITE})`,
        });
      }

      const loopUrl = `${PRODUCERHIT_SITE}/loop/${loop.id}`;
      const meta = [loop.genre, loop.bpm ? `${loop.bpm} BPM` : null].filter(Boolean).join(" · ");
      return interactionResponse(4, {
        content:
          `🎵 **${loop.name ?? "Untitled"}**${meta ? ` — ${meta}` : ""}\n${loopUrl}\n[Browse community](${PRODUCERHIT_SITE}/community)`,
      });
    }

    if (name === "challenge" && db) {
      const weekKey = isoWeekKey();
      const { data } = await db
        .from("discord_weekly_challenges")
        .select("theme_fr, theme_en, bpm_range, ends_at")
        .eq("week_key", weekKey)
        .maybeSingle();

      if (!data) {
        return interactionResponse(4, {
          content: `No active challenge — next drop Monday 9:00 AM UTC. Start free: ${PRODUCERHIT_SITE}`,
        });
      }

      return interactionResponse(4, {
        content:
          `**Challenge ${weekKey}**\n` +
          `${data.theme_en}\n` +
          `BPM: ${data.bpm_range ?? "your choice"}\n` +
          `Deadline: ${data.ends_at}\n` +
          `${PRODUCERHIT_SITE}/community?challenge=${weekKey}`,
      });
    }

    return interactionResponse(4, { content: "Unknown command." });
  }

  return interactionResponse(4, { content: "OK" });
});
