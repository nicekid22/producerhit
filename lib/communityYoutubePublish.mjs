/**
 * Publish community YouTube plan — account + format forcés.
 */
export async function publishCommunityYoutubePlan(db, plan, { supabaseUrl, cronSecret }) {
  const secret = String(cronSecret ?? process.env.SOCIAL_PUBLISH_CRON_SECRET ?? "").trim();
  if (!secret) throw new Error("missing_SOCIAL_PUBLISH_CRON_SECRET");
  if (!plan?.loop_id) throw new Error("plan_missing_loop");

  const publishVariant = `${plan.format}:${plan.account}:${plan.slot_index}`;

  await db.from("loops").update({ is_public: true }).eq("id", plan.loop_id);

  await db.from("social_publish_log").delete().eq("loop_id", plan.loop_id).eq("platform", "youtube").eq("publish_variant", publishVariant);

  const acePatch = {
    youtubePublish: {
      account: plan.account,
      format: plan.format,
      displayTitle: plan.display_title,
      cta: plan.cta,
      theme: plan.theme,
      trackKind: plan.track_kind,
      planId: plan.id,
      storagePath: plan.storage_path ?? null,
    },
  };

  const { data: loopRow } = await db.from("loops").select("stems_url").eq("id", plan.loop_id).maybeSingle();
  const stems = loopRow?.stems_url && typeof loopRow.stems_url === "object" ? { ...loopRow.stems_url } : {};
  const ace = stems.ace && typeof stems.ace === "object" ? { ...stems.ace, ...acePatch } : acePatch;
  await db.from("loops").update({ stems_url: { ...stems, ace } }).eq("id", plan.loop_id);

  await db.from("social_publish_queue").upsert(
    {
      loop_id: plan.loop_id,
      status: "pending",
      attempts: 0,
      last_error: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "loop_id" },
  );

  const res = await fetch(`${supabaseUrl}/functions/v1/social-publish-cron`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-social-cron-secret": secret },
    body: JSON.stringify({
      action: "process_loop",
      loop_id: plan.loop_id,
      youtube_account: plan.account,
      youtube_format: plan.format,
      publish_variant: publishVariant,
      storage_path: plan.storage_path ?? null,
      display_title: plan.display_title ?? null,
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`youtube_publish_${res.status}:${text.slice(0, 400)}`);
  return { status: res.status, body: text, publishVariant };
}
