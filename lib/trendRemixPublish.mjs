/**
 * Queue + trigger YouTube publish for a trend remix loop.
 */
export async function publishTrendRemixLoop(db, { loopId, supabaseUrl, cronSecret }) {
  const secret = String(cronSecret ?? process.env.SOCIAL_PUBLISH_CRON_SECRET ?? "").trim();
  if (!secret) throw new Error("missing_SOCIAL_PUBLISH_CRON_SECRET");

  await db.from("loops").update({ is_public: true }).eq("id", loopId);
  await db.from("social_publish_log").delete().eq("loop_id", loopId).eq("platform", "youtube");
  await db
    .from("social_publish_queue")
    .upsert(
      {
        loop_id: loopId,
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
    body: JSON.stringify({ action: "process_loop", loop_id: loopId }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`youtube_publish_${res.status}:${text.slice(0, 400)}`);
  return { status: res.status, body: text };
}
