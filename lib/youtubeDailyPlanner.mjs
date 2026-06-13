/**
 * Planification quotidienne — 7 comptes × (5 Shorts + 2 long).
 */
import { COMMUNITY_YOUTUBE_ACCOUNT_IDS, communityThemeForAccount } from "./communityYoutubeAccounts.mjs";
import { REMIX_YOUTUBE_ACCOUNT_IDS, ALL_YOUTUBE_ACCOUNT_IDS, slotKind, dayKey, VIDEOS_PER_ACCOUNT_PER_DAY } from "./youtubeDailyCadence.mjs";
import {
  buildCommunityPreviewPlan,
  fetchCommunityLoopCandidates,
  communityDisplayKind,
} from "./communityYoutubePick.mjs";
import { inventTitleFromLyrics, extractAceLyrics } from "./communityYoutubeTitle.mjs";
import { pickCommunityCta } from "./communityYoutubeCta.mjs";
import { extractTrendRemixMeta } from "./youtubeSocial.mjs";

export { dayKey };

const REMIX_LONG_SLOT = {
  remix1: { 5: "remix1_morning", 6: "remix1_evening" },
  remix2: { 5: "remix2_morning", 6: "remix2_evening" },
};

async function remixLongPlanRow(db, day, account, slotIndex) {
  const trendSlot = REMIX_LONG_SLOT[account]?.[slotIndex];
  if (!trendSlot) return null;
  const { data: sameDay } = await db
    .from("trend_remix_plans")
    .select("loop_id, display_title, trend_remix_catalog(remix_genre)")
    .eq("day", day)
    .eq("slot", trendSlot)
    .maybeSingle();
  let data = sameDay;
  if (!data?.loop_id) {
    const { data: recent } = await db
      .from("trend_remix_plans")
      .select("loop_id, display_title, trend_remix_catalog(remix_genre)")
      .eq("slot", trendSlot)
      .not("loop_id", "is", null)
      .order("day", { ascending: false })
      .limit(1)
      .maybeSingle();
    data = recent ?? null;
  }
  if (!data?.loop_id) return null;
  return {
    loop_id: data.loop_id,
    display_title: data.display_title,
    track_kind: "song",
    theme: "cinema",
    content_source: "trend_remix",
  };
}

async function remixShortPlanRow(db, day, account, slotIndex) {
  const longSlots = REMIX_LONG_SLOT[account] ?? {};
  const trendSlots = Object.values(longSlots);
  const { data: plans } = await db
    .from("trend_remix_plans")
    .select("loop_id, display_title, slot")
    .eq("day", day)
    .in("slot", trendSlots)
    .not("loop_id", "is", null);
  const pool = plans ?? [];
  if (!pool.length) {
    const { data: recent } = await db
      .from("trend_remix_plans")
      .select("loop_id, display_title")
      .eq("target_youtube_account", account)
      .not("loop_id", "is", null)
      .order("day", { ascending: false })
      .limit(4);
    pool.push(...(recent ?? []));
  }
  if (!pool.length) return null;
  const pick = pool[slotIndex % pool.length];
  return {
    loop_id: pick.loop_id,
    display_title: pick.display_title,
    track_kind: "song",
    theme: "cinema",
    content_source: "trend_remix",
  };
}

async function findPendingPlanDay(db) {
  const today = dayKey();
  const { data, error } = await db
    .from("youtube_daily_plans")
    .select("day")
    .eq("status", "planned")
    .not("loop_id", "is", null)
    .lte("day", today)
    .order("day", { ascending: true })
    .limit(1);
  if (error) throw new Error(error.message);
  return data?.[0]?.day ?? today;
}

async function trendRemixSlotPublished(db, day, account, slotIndex) {
  const trendSlot = REMIX_LONG_SLOT[account]?.[slotIndex];
  if (!trendSlot) return false;
  const { data } = await db.from("trend_remix_plans").select("status").eq("day", day).eq("slot", trendSlot).maybeSingle();
  return data?.status === "published";
}

/** Répare loop_not_ready + évite les doublons long remix déjà publiés via trend pipeline. */
export async function repairYoutubeDailyPlans(db, day = null) {
  const days = day ? [day] : [];
  if (!days.length) {
    const { data: dayRows } = await db
      .from("youtube_daily_plans")
      .select("day")
      .in("status", ["planned", "failed"])
      .order("day", { ascending: true });
    days.push(...new Set((dayRows ?? []).map((r) => r.day)));
  }

  let repaired = 0;
  let skipped = 0;

  for (const d of days) {
    const { data: failed } = await db
      .from("youtube_daily_plans")
      .select("*")
      .eq("day", d)
      .eq("status", "failed");

    for (const row of failed ?? []) {
      if (!REMIX_YOUTUBE_ACCOUNT_IDS.includes(row.account)) continue;

      if (!row.loop_id && row.format === "long") {
        const resolved = await remixLongPlanRow(db, d, row.account, row.slot_index);
        if (!resolved?.loop_id) continue;
        if (await trendRemixSlotPublished(db, d, row.account, row.slot_index)) {
          await markYoutubeDailyPlan(db, row.id, {
            status: "skipped",
            loop_id: resolved.loop_id,
            display_title: resolved.display_title,
            last_error: "already_published_via_trend_remix",
          });
          skipped += 1;
        } else {
          await markYoutubeDailyPlan(db, row.id, {
            status: "planned",
            loop_id: resolved.loop_id,
            display_title: resolved.display_title,
            last_error: null,
          });
          repaired += 1;
        }
        continue;
      }

      if (row.last_error === "loop_not_ready" && !row.loop_id) {
        await markYoutubeDailyPlan(db, row.id, {
          status: "skipped",
          last_error: "loop_not_ready_unrecoverable",
        });
        skipped += 1;
      }
    }

    const { data: plannedLong } = await db
      .from("youtube_daily_plans")
      .select("*")
      .eq("day", d)
      .eq("status", "planned")
      .eq("format", "long")
      .in("account", REMIX_YOUTUBE_ACCOUNT_IDS);

    for (const row of plannedLong ?? []) {
      if (!(await trendRemixSlotPublished(db, d, row.account, row.slot_index))) continue;
      await markYoutubeDailyPlan(db, row.id, {
        status: "skipped",
        last_error: "already_published_via_trend_remix",
      });
      skipped += 1;
    }

    const { data: allRemixLong } = await db
      .from("youtube_daily_plans")
      .select("id")
      .eq("day", d)
      .eq("status", "planned")
      .eq("format", "long")
      .in("account", REMIX_YOUTUBE_ACCOUNT_IDS);

    for (const row of allRemixLong ?? []) {
      await markYoutubeDailyPlan(db, row.id, {
        status: "skipped",
        last_error: "trend_remix_pipeline_handles_long",
      });
      skipped += 1;
    }
  }

  return { repaired, skipped, days: days.length };
}

export async function seedYoutubeDailyPlansForDay(db, day = dayKey()) {
  const { data: existing } = await db.from("youtube_daily_plans").select("account, slot_index").eq("day", day);
  const have = new Set((existing ?? []).map((r) => `${r.account}:${r.slot_index}`));
  const missing = [];

  for (const account of ALL_YOUTUBE_ACCOUNT_IDS) {
    for (let slot_index = 0; slot_index < VIDEOS_PER_ACCOUNT_PER_DAY; slot_index += 1) {
      if (!have.has(`${account}:${slot_index}`)) missing.push({ account, slot_index });
    }
  }
  if (!missing.length) return { seeded: 0, day };

  const candidates = await fetchCommunityLoopCandidates(db, { limit: 500 });
  const communityPlan = buildCommunityPreviewPlan(candidates, {
    accounts: COMMUNITY_YOUTUBE_ACCOUNT_IDS,
    perAccount: VIDEOS_PER_ACCOUNT_PER_DAY,
  });
  const communityMap = new Map(communityPlan.map((p) => [`${p.account}:${p.slot}`, p]));

  const rows = [];
  for (const { account, slot_index } of missing) {
    const format = slotKind(slot_index);
    let resolved = null;

    if (REMIX_YOUTUBE_ACCOUNT_IDS.includes(account) && format === "long") {
      rows.push({
        day,
        account,
        slot_index,
        format,
        content_source: "trend_remix",
        loop_id: null,
        display_title: "",
        cta: pickCommunityCta({ loopId: `${account}:${slot_index}`, account, kind: "song", slot: slot_index }),
        track_kind: "song",
        theme: "cinema",
        publish_variant: `${format}:${account}:${slot_index}`,
        status: "skipped",
        last_error: "trend_remix_pipeline_handles_long",
      });
      continue;
    }

    if (REMIX_YOUTUBE_ACCOUNT_IDS.includes(account)) {
      resolved = format === "long" ? await remixLongPlanRow(db, day, account, slot_index) : await remixShortPlanRow(db, day, account, slot_index);
    } else {
      const picked = communityMap.get(`${account}:${slot_index}`);
      if (picked?.loop) {
        resolved = {
          loop_id: picked.loop.id,
          display_title: picked.displayTitle,
          track_kind: picked.kind,
          theme: communityThemeForAccount(account),
          content_source: "community",
          cta: picked.cta,
        };
      }
    }

    const kind = resolved?.track_kind ?? "song";
    let status = resolved?.loop_id ? "planned" : "failed";
    let lastError = resolved?.loop_id ? null : "loop_not_ready";

    if (
      resolved?.loop_id &&
      REMIX_YOUTUBE_ACCOUNT_IDS.includes(account) &&
      format === "long" &&
      (await trendRemixSlotPublished(db, day, account, slot_index))
    ) {
      status = "skipped";
      lastError = "already_published_via_trend_remix";
    }

    rows.push({
      day,
      account,
      slot_index,
      format,
      content_source: resolved?.content_source ?? (REMIX_YOUTUBE_ACCOUNT_IDS.includes(account) ? "trend_remix" : "community"),
      loop_id: resolved?.loop_id ?? null,
      display_title: resolved?.display_title ?? "",
      cta:
        resolved?.cta ??
        pickCommunityCta({ loopId: resolved?.loop_id ?? `${account}:${slot_index}`, account, kind, slot: slot_index }),
      track_kind: kind,
      theme: resolved?.theme ?? communityThemeForAccount(account),
      publish_variant: `${format}:${account}:${slot_index}`,
      status,
      last_error: lastError,
    });
  }

  const { error } = await db.from("youtube_daily_plans").insert(rows);
  if (error) throw new Error(error.message);
  return { seeded: rows.length, day };
}

export async function getNextYoutubeDailyPlans(db, { limit = 3, day = null } = {}) {
  await seedYoutubeDailyPlansForDay(db, dayKey());
  await repairYoutubeDailyPlans(db);
  const pendingDay = day ?? (await findPendingPlanDay(db));
  const { data, error } = await db
    .from("youtube_daily_plans")
    .select("*, loops(*)")
    .eq("day", pendingDay)
    .eq("status", "planned")
    .not("loop_id", "is", null)
    .order("account")
    .order("slot_index")
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    ...row,
    loop: row.loops ?? null,
  }));
}

export async function markYoutubeDailyPlan(db, id, patch) {
  const { error } = await db
    .from("youtube_daily_plans")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(`plan_update_failed:${error.message}`);
}

export function planDisplayTitle(plan, loop) {
  if (plan.display_title) return plan.display_title;
  const tr = extractTrendRemixMeta(loop?.stems_url);
  if (tr?.displayTitle) return tr.displayTitle;
  const lyrics = extractAceLyrics(loop?.stems_url);
  return inventTitleFromLyrics(lyrics, { loopId: loop?.id, genre: loop?.genre, fallbackName: loop?.name });
}
