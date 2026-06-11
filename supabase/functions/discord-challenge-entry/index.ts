import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isoWeekKey, loadDiscordConfig, PRODUCERHIT_SITE, resolveDiscordChannels, sendDiscordEmbed } from "../_shared/discordApi.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization") ?? "";
  const supabaseUrl = (Deno.env.get("SUPABASE_URL") ?? "").trim();
  const supabaseAnon = (Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "").trim();
  if (!supabaseUrl || !supabaseAnon) {
    return new Response(JSON.stringify({ error: "server_config" }), { status: 500, headers: corsHeaders });
  }

  const authed = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userErr } = await authed.auth.getUser();
  if (userErr || !userData.user) {
    return new Response(JSON.stringify({ error: "not_authenticated" }), { status: 401, headers: corsHeaders });
  }

  const body = await req.json().catch(() => ({}));
  const loopId = typeof body?.loopId === "string" ? body.loopId.trim() : "";
  if (!loopId) {
    return new Response(JSON.stringify({ error: "missing_loop_id" }), { status: 400, headers: corsHeaders });
  }

  const weekKey = isoWeekKey();
  const rawCfg = loadDiscordConfig();
  const cfg = rawCfg ? await resolveDiscordChannels(rawCfg) : null;
  if (!cfg?.channels.showcase) {
    return new Response(JSON.stringify({ error: "discord_not_configured" }), { status: 503, headers: corsHeaders });
  }

  const serviceKey = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "").trim();
  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const { data: challenge } = await db
    .from("discord_weekly_challenges")
    .select("id, week_key, closed_at")
    .eq("week_key", weekKey)
    .maybeSingle();

  if (!challenge?.id || challenge.closed_at) {
    return new Response(JSON.stringify({ error: "no_active_challenge" }), { status: 400, headers: corsHeaders });
  }

  const { data: loop } = await authed.from("loops").select("id, name, is_public, cover_url, user_id").eq("id", loopId).maybeSingle();
  if (!loop?.id || loop.user_id !== userData.user.id) {
    return new Response(JSON.stringify({ error: "loop_not_found" }), { status: 404, headers: corsHeaders });
  }
  if (!loop.is_public) {
    return new Response(JSON.stringify({ error: "loop_must_be_public" }), { status: 400, headers: corsHeaders });
  }

  const { data: existing } = await db
    .from("discord_challenge_entries")
    .select("id")
    .eq("challenge_id", challenge.id)
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (existing?.id) {
    return new Response(JSON.stringify({ error: "already_submitted" }), { status: 409, headers: corsHeaders });
  }

  const loopUrl = `${PRODUCERHIT_SITE}/loop/${loop.id}`;
  const embed: Record<string, unknown> = {
    title: `🎵 ${loop.name}`,
    description:
      `Weekly challenge **${weekKey}** — [Listen on ProducerHit](${loopUrl})\n` +
      `[Make your own free](${PRODUCERHIT_SITE}) · [Go Pro](${PRODUCERHIT_SITE}/pricing)`,
  };
  if (loop.cover_url) embed.thumbnail = { url: loop.cover_url };

  const sent = await sendDiscordEmbed(cfg, cfg.channels.showcase, embed);
  const messageId =
    sent.ok && sent.json && typeof sent.json === "object" && typeof (sent.json as { id?: unknown }).id === "string"
      ? (sent.json as { id: string }).id
      : null;

  const { error: insertErr } = await db.from("discord_challenge_entries").insert({
    challenge_id: challenge.id,
    user_id: userData.user.id,
    loop_id: loop.id,
    discord_message_id: messageId,
  });

  if (insertErr) {
    return new Response(JSON.stringify({ error: insertErr.message }), { status: 500, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ ok: true, weekKey, loopUrl, discordMessageId: messageId }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
