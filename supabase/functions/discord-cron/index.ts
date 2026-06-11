import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  DAILY_PRODUCER_TIPS,
  DAILY_PULSE_PROMPTS,
  isoWeekKey,
  loadDiscordConfig,
  loopEmbed,
  pickChallengeTheme,
  pickDailyItem,
  pinDiscordMessage,
  PRODUCERHIT_SITE,
  resolveDiscordChannels,
  sendDiscordEmbed,
  type DiscordConfig,
  type PublicLoopRow,
  utcDayKey,
  verifyDiscordCronSecret,
  weekBounds,
} from "../_shared/discordApi.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-discord-cron-secret",
};

type Db = ReturnType<typeof createClient>;

function serviceClient() {
  const url = (Deno.env.get("SUPABASE_URL") ?? "").trim();
  const key = (Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "").trim();
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function logEvent(db: Db, type: string, payload: Record<string, unknown>, ok: boolean, error?: string) {
  await db.from("discord_bot_events").insert({ event_type: type, payload, ok, error: error ?? null });
}

async function alreadyRan(db: Db, eventType: string, idempotencyKey: string): Promise<boolean> {
  const { data } = await db
    .from("discord_bot_events")
    .select("id")
    .eq("event_type", eventType)
    .contains("payload", { idempotency_key: idempotencyKey })
    .limit(1)
    .maybeSingle();
  return !!data?.id;
}

async function markRan(db: Db, eventType: string, idempotencyKey: string, payload: Record<string, unknown> = {}) {
  await logEvent(db, eventType, { idempotency_key: idempotencyKey, ...payload }, true);
}

async function fetchLoop(db: Db, loopId: string): Promise<PublicLoopRow | null> {
  const { data } = await db
    .from("loops")
    .select("id, name, genre, bpm, cover_url, user_id, created_at, is_public")
    .eq("id", loopId)
    .maybeSingle();
  if (!data?.id || !data.is_public) return null;
  return data as PublicLoopRow;
}

async function postedLoopIds(db: Db): Promise<Set<string>> {
  const { data } = await db
    .from("discord_bot_events")
    .select("payload")
    .eq("event_type", "showcase_post")
    .order("created_at", { ascending: false })
    .limit(500);
  const ids = new Set<string>();
  for (const row of data ?? []) {
    const id = row?.payload && typeof row.payload === "object" ? (row.payload as { loop_id?: string }).loop_id : null;
    if (id) ids.add(id);
  }
  return ids;
}

async function postPublicLoop(
  db: Db,
  cfg: DiscordConfig,
  loop: PublicLoopRow,
  source: string,
): Promise<{ ok: boolean; skipped?: boolean; loopId?: string; messageId?: string | null }> {
  const idempotencyKey = `showcase-${loop.id}`;
  if (await alreadyRan(db, "showcase_post", idempotencyKey)) {
    return { ok: true, skipped: true, loopId: loop.id };
  }

  const sent = await sendDiscordEmbed(
    cfg,
    cfg.channels.showcase,
    loopEmbed(loop, source === "challenge" ? "🏆 Weekly challenge entry" : "✨ New public track on ProducerHit"),
  );
  if (!sent.ok) throw new Error(`Discord showcase post failed (${sent.status})`);

  const messageId =
    sent.json && typeof sent.json === "object" && typeof (sent.json as { id?: unknown }).id === "string"
      ? (sent.json as { id: string }).id
      : null;

  await markRan(db, "showcase_post", idempotencyKey, { loop_id: loop.id, source, message_id: messageId });
  return { ok: true, loopId: loop.id, messageId };
}

async function startWeekly(db: Db, cfg: DiscordConfig) {
  const weekKey = isoWeekKey();
  const { startsAt, endsAt } = weekBounds();

  const { data: existing } = await db.from("discord_weekly_challenges").select("id").eq("week_key", weekKey).maybeSingle();
  if (existing?.id) {
    return { ok: true, skipped: true, weekKey };
  }

  const { data: recent } = await db
    .from("discord_weekly_challenges")
    .select("genre_tag")
    .order("created_at", { ascending: false })
    .limit(4);
  const recentGenres = (recent ?? []).map((r) => String(r.genre_tag ?? "")).filter(Boolean);
  const theme = pickChallengeTheme(weekKey, recentGenres);

  const embed = {
    title: `🎯 Weekly Challenge — ${weekKey}`,
    description:
      `**Theme:** ${theme.themeEn}\n` +
      `**Suggested BPM:** ${theme.bpm}\n\n` +
      `**Rules:**\n` +
      `• 1 entry max per person\n` +
      `• Track must be **public** on ProducerHit\n` +
      `• Deadline: Sunday 11:59 PM UTC\n` +
      `• Top 3 win bonus generation credits\n\n` +
      `[Join on ProducerHit](${PRODUCERHIT_SITE}/community?challenge=${weekKey}) · [Go Pro](${PRODUCERHIT_SITE}/pricing)`,
  };

  const sent = await sendDiscordEmbed(cfg, cfg.channels.challenges, embed, "@everyone");
  if (!sent.ok) throw new Error(`Discord post failed (${sent.status})`);

  const messageId =
    sent.json && typeof sent.json === "object" && sent.json !== null && typeof (sent.json as { id?: unknown }).id === "string"
      ? (sent.json as { id: string }).id
      : null;

  if (messageId) await pinDiscordMessage(cfg, cfg.channels.challenges, messageId);

  const { error } = await db.from("discord_weekly_challenges").insert({
    week_key: weekKey,
    theme_fr: theme.themeFr,
    theme_en: theme.themeEn,
    genre_tag: theme.genre,
    bpm_range: theme.bpm,
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    discord_message_id: messageId,
  });
  if (error) throw new Error(error.message);

  if (cfg.channels.french) {
    await sendDiscordEmbed(cfg, cfg.channels.french, {
      title: `🎯 Challenge ${weekKey}`,
      description: `**Thème:** ${theme.themeFr}\n**BPM:** ${theme.bpm}\n\nPoste ton lien public dans <#${cfg.channels.challenges}>`,
    });
  }
  if (cfg.channels.spanish) {
    await sendDiscordEmbed(cfg, cfg.channels.spanish, {
      title: `🎯 Reto ${weekKey}`,
      description: `**Tema:** ${theme.themeEn}\n**BPM:** ${theme.bpm}\n\nPublica tu enlace en <#${cfg.channels.challenges}>`,
    });
  }

  await logEvent(db, "weekly_challenge_started", { weekKey, messageId }, true);
  return { ok: true, weekKey, messageId };
}

async function closeWeekly(db: Db, cfg: DiscordConfig) {
  const weekKey = isoWeekKey();
  const { data: challenge } = await db
    .from("discord_weekly_challenges")
    .select("id, week_key, closed_at")
    .eq("week_key", weekKey)
    .maybeSingle();

  if (!challenge?.id) return { ok: true, skipped: true, reason: "no_challenge" };
  if (challenge.closed_at) return { ok: true, skipped: true, reason: "already_closed" };

  const { data: entries } = await db
    .from("discord_challenge_entries")
    .select("id, user_id, loop_id, votes")
    .eq("challenge_id", challenge.id)
    .order("votes", { ascending: false })
    .limit(10);

  const rewards = [30, 15, 10];
  const winners: Array<{ userId: string; rank: number; credits: number }> = [];

  for (let i = 0; i < (entries ?? []).length && i < 3; i++) {
    const entry = entries![i]!;
    const credits = rewards[i] ?? 0;
    winners.push({ userId: entry.user_id, rank: i + 1, credits });
    await db.from("discord_challenge_entries").update({ rank: i + 1, reward_credits: credits }).eq("id", entry.id);
    await db.rpc("grant_discord_challenge_bonus", {
      p_user_id: entry.user_id,
      p_credits: credits,
      p_idempotency_key: `challenge-${weekKey}-rank-${i + 1}`,
    });
  }

  for (const entry of entries ?? []) {
    if (winners.some((w) => w.userId === entry.user_id)) continue;
    await db.rpc("grant_discord_challenge_bonus", {
      p_user_id: entry.user_id,
      p_credits: 3,
      p_idempotency_key: `challenge-${weekKey}-part-${entry.user_id}`,
    });
    await db.from("discord_challenge_entries").update({ reward_credits: 3 }).eq("id", entry.id);
  }

  const podium =
    winners.length > 0
      ? winners.map((w) => `#${w.rank} — +${w.credits} bonus credits`).join("\n")
      : "No entries this week — next challenge drops Monday 9:00 AM UTC!";

  await sendDiscordEmbed(cfg, cfg.channels.announcements, {
    title: `🏆 Challenge results — ${weekKey}`,
    description:
      podium +
      `\n\n[Upgrade for unlimited workflow](${PRODUCERHIT_SITE}/pricing)\n` +
      `Next theme Monday in <#${cfg.channels.challenges}>`,
  });

  await db.from("discord_weekly_challenges").update({ closed_at: new Date().toISOString() }).eq("id", challenge.id);
  await logEvent(db, "weekly_challenge_closed", { weekKey, winners }, true);
  return { ok: true, weekKey, winners };
}

async function dailyPulse(db: Db, cfg: DiscordConfig) {
  const dayKey = utcDayKey();
  const idempotencyKey = `pulse-${dayKey}`;
  if (await alreadyRan(db, "daily_pulse", idempotencyKey)) return { ok: true, skipped: true };

  const prompt = pickDailyItem(DAILY_PULSE_PROMPTS, dayKey);
  const sent = await sendDiscordEmbed(cfg, cfg.channels.general, {
    title: "☀️ Daily check-in",
    description: prompt,
  });

  if (!sent.ok) throw new Error(`daily_pulse failed (${sent.status})`);
  await markRan(db, "daily_pulse", idempotencyKey);
  return { ok: true, dayKey };
}

async function dailyTip(db: Db, cfg: DiscordConfig) {
  const dayKey = utcDayKey();
  const idempotencyKey = `tip-${dayKey}`;
  if (await alreadyRan(db, "daily_tip", idempotencyKey)) return { ok: true, skipped: true };

  const tip = pickDailyItem(DAILY_PRODUCER_TIPS, dayKey);
  const sent = await sendDiscordEmbed(cfg, cfg.channels.tips, {
    title: "💡 Producer tip",
    description: tip,
  });

  if (!sent.ok) throw new Error(`daily_tip failed (${sent.status})`);
  await markRan(db, "daily_tip", idempotencyKey);
  return { ok: true, dayKey };
}

async function challengeReminder(db: Db, cfg: DiscordConfig) {
  const dayKey = utcDayKey();
  const idempotencyKey = `challenge-reminder-${dayKey}`;
  if (await alreadyRan(db, "challenge_reminder", idempotencyKey)) return { ok: true, skipped: true };

  const weekKey = isoWeekKey();
  const { data } = await db
    .from("discord_weekly_challenges")
    .select("theme_en, bpm_range, ends_at, closed_at")
    .eq("week_key", weekKey)
    .maybeSingle();

  if (!data || data.closed_at) return { ok: true, skipped: true, reason: "no_active_challenge" };

  const sent = await sendDiscordEmbed(cfg, cfg.channels.challenges, {
    title: `⏰ Challenge reminder — ${weekKey}`,
    description:
      `**${data.theme_en}** · BPM ${data.bpm_range ?? "your choice"}\n` +
      `Deadline **Sunday 11:59 PM UTC** — post your **public** loop link here.\n\n` +
      `[Create free](${PRODUCERHIT_SITE}) · [Community hub](${PRODUCERHIT_SITE}/community?challenge=${weekKey})`,
  });

  if (!sent.ok) throw new Error(`challenge_reminder failed (${sent.status})`);
  await markRan(db, "challenge_reminder", idempotencyKey, { weekKey });
  return { ok: true, weekKey };
}

async function showcaseSpotlight(db: Db, cfg: DiscordConfig) {
  const posted = await postedLoopIds(db);
  const { data: loops } = await db
    .from("loops")
    .select("id, name, genre, bpm, cover_url, user_id, created_at, is_public")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(30);

  const candidate = (loops ?? []).find((l) => l?.id && !posted.has(l.id)) as PublicLoopRow | undefined;
  if (!candidate) return { ok: true, skipped: true, reason: "no_new_loops" };

  return postPublicLoop(db, cfg, candidate, "spotlight");
}

async function postPublicLoopAction(db: Db, cfg: DiscordConfig, loopId: string) {
  const loop = await fetchLoop(db, loopId);
  if (!loop) return { ok: true, skipped: true, reason: "loop_not_public" };
  return postPublicLoop(db, cfg, loop, "auto_publish");
}

async function memberWelcomePulse(db: Db, cfg: DiscordConfig) {
  const res = await fetch(`https://discord.com/api/v10/guilds/${cfg.guildId}?with_counts=true`, {
    headers: { Authorization: `Bot ${cfg.token}` },
  });
  if (!res.ok) throw new Error(`guild fetch ${res.status}`);
  const guild = await res.json();
  const count = typeof guild.approximate_member_count === "number" ? guild.approximate_member_count : 0;

  const { data: last } = await db
    .from("discord_bot_events")
    .select("payload")
    .eq("event_type", "member_count_snapshot")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const prev = last?.payload && typeof last.payload === "object"
    ? Number((last.payload as { count?: number }).count ?? count)
    : count;

  await logEvent(db, "member_count_snapshot", { count, prev }, true);

  if (count > prev && cfg.channels.welcome) {
    const delta = count - prev;
    await sendDiscordEmbed(cfg, cfg.channels.welcome, {
      title: delta === 1 ? "👋 New producer joined!" : `👋 ${delta} new producers joined!`,
      description:
        `Welcome to **ProducerHit Global** 🌍\n` +
        `Say hi in <#${cfg.channels.general}> · read <#${cfg.channels.rules}>\n` +
        `[Create your first beat free](${PRODUCERHIT_SITE})`,
    });
    return { ok: true, count, prev, welcomed: true };
  }

  return { ok: true, count, prev, welcomed: false };
}

async function communityStats(db: Db, cfg: DiscordConfig) {
  const weekKey = isoWeekKey();
  const idempotencyKey = `stats-${weekKey}`;
  if (await alreadyRan(db, "community_stats", idempotencyKey)) return { ok: true, skipped: true };

  const weekStart = weekBounds().startsAt.toISOString();
  const { count: publicLoops } = await db
    .from("loops")
    .select("id", { count: "exact", head: true })
    .eq("is_public", true)
    .gte("created_at", weekStart);

  const { data: challenge } = await db
    .from("discord_weekly_challenges")
    .select("id")
    .eq("week_key", weekKey)
    .maybeSingle();

  let entries = 0;
  if (challenge?.id) {
    const { count } = await db
      .from("discord_challenge_entries")
      .select("id", { count: "exact", head: true })
      .eq("challenge_id", challenge.id);
    entries = count ?? 0;
  }

  await sendDiscordEmbed(cfg, cfg.channels.announcements, {
    title: `📊 Week in review — ${weekKey}`,
    description:
      `• **${publicLoops ?? 0}** new public tracks this week\n` +
      `• **${entries}** challenge entries so far\n` +
      `• Results tonight — keep posting in <#${cfg.channels.showcase}>\n\n` +
      `[Generate free](${PRODUCERHIT_SITE}) · [Go Pro](${PRODUCERHIT_SITE}/pricing)`,
  });

  await markRan(db, "community_stats", idempotencyKey, { publicLoops, entries });
  return { ok: true, weekKey, publicLoops, entries };
}

async function weekendVibes(db: Db, cfg: DiscordConfig) {
  const dayKey = utcDayKey();
  const idempotencyKey = `weekend-${dayKey}`;
  if (await alreadyRan(db, "weekend_vibes", idempotencyKey)) return { ok: true, skipped: true };

  const sent = await sendDiscordEmbed(cfg, cfg.channels.general, {
    title: "🎛️ Weekend studio session",
    description:
      `Share what you're working on — **genre + mood + public link**.\n` +
      `Need inspiration? Browse [/community](${PRODUCERHIT_SITE}/community) or try \`/challenge\`.`,
  });

  if (!sent.ok) throw new Error(`weekend_vibes failed (${sent.status})`);
  await markRan(db, "weekend_vibes", idempotencyKey);
  return { ok: true, dayKey };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (!verifyDiscordCronSecret(req)) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: corsHeaders });
  }

  const rawCfg = loadDiscordConfig();
  const db = serviceClient();
  if (!rawCfg || !db) {
    return new Response(JSON.stringify({ error: "missing_config" }), { status: 500, headers: corsHeaders });
  }

  const cfg = await resolveDiscordChannels(rawCfg);
  if (!cfg) {
    return new Response(JSON.stringify({ error: "channels_unresolved" }), { status: 500, headers: corsHeaders });
  }

  let action = "";
  try {
    const body = await req.json().catch(() => ({}));
    action = typeof body?.action === "string" ? body.action : "";

    const handlers: Record<string, () => Promise<unknown>> = {
      start_weekly: () => startWeekly(db, cfg),
      close_weekly: () => closeWeekly(db, cfg),
      daily_pulse: () => dailyPulse(db, cfg),
      daily_tip: () => dailyTip(db, cfg),
      challenge_reminder: () => challengeReminder(db, cfg),
      showcase_spotlight: () => showcaseSpotlight(db, cfg),
      post_public_loop: () => {
        const loopId = typeof body?.loop_id === "string" ? body.loop_id.trim() : "";
        if (!loopId) return Promise.resolve({ error: "missing_loop_id" });
        return postPublicLoopAction(db, cfg, loopId);
      },
      member_welcome: () => memberWelcomePulse(db, cfg),
      community_stats: () => communityStats(db, cfg),
      weekend_vibes: () => weekendVibes(db, cfg),
    };

    const handler = handlers[action];
    if (!handler) {
      return new Response(JSON.stringify({ error: "unknown_action", actions: Object.keys(handlers) }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const result = await handler();
    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const message = e instanceof Error ? e.message : "error";
    await logEvent(db, "cron_error", { action }, false, message);
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: corsHeaders });
  }
});
