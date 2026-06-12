/**
 * Manual trigger — process social publish queue (local / CI).
 * Requires SOCIAL_PUBLISH_CRON_SECRET in env.
 */
const PROJECT = "pmfnzenqemnonpglmjqx";
const secret = process.env.SOCIAL_PUBLISH_CRON_SECRET ?? "";
const loopId = process.argv[2]?.trim();

if (!secret) {
  console.error("Missing SOCIAL_PUBLISH_CRON_SECRET");
  process.exit(1);
}

const body = loopId ? { action: "process_loop", loop_id: loopId } : { action: "process_queue", limit: 10 };

const res = await fetch(`https://${PROJECT}.supabase.co/functions/v1/social-publish-cron`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-social-cron-secret": secret,
  },
  body: JSON.stringify(body),
});

const text = await res.text();
console.log(res.status, text);
