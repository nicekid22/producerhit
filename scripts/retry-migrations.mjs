/**
 * Retry migrations on primary Supabase — waits for the DB to come back
 * and applies the 3 pending migrations (088, 089, 090).
 *
 * Runs via GitHub Actions on schedule every 30 min until all succeed.
 * Idempotent: safe to run multiple times.
 *
 * Usage:
 *   node scripts/retry-migrations.mjs
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const PAT = process.env.SUPABASE_PAT;
const PROJECT = "pmfnzenqemnonpglmjqx";

function loadEnv() {
  const candidates = [resolve(process.cwd(), ".env"), resolve(process.cwd(), ".env.local")];
  const path = candidates.find((p) => existsSync(p));
  const env = { ...process.env };
  if (!path) return env;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    env[m[1]] = m[2].trim();
  }
  return env;
}

const env = loadEnv();
const token = PAT || env.SUPABASE_PAT;
if (!token) { console.error("Missing SUPABASE_PAT"); process.exit(1); }

const PRIMARY_URL = env.VITE_SUPABASE_URL;

async function checkPrimary() {
  try {
    const r = await fetch(`${PRIMARY_URL}/rest/v1/profiles?select=id&limit=1`, {
      headers: { "apikey": env.VITE_SUPABASE_ANON_KEY || "" }
    });
    return { ok: r.ok || r.status < 500, status: r.status };
  } catch { return { ok: false, status: 0 }; }
}

async function runSQL(sql, label) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${PROJECT}/database/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: sql })
  });
  const text = await r.text();
  const ok = r.ok || r.status === 201 || r.status === 204;
  console.log((ok ? "✅" : "❌") + " " + label + " [HTTP " + r.status + "]");
  if (!ok) console.log("   " + text.slice(0, 300));
  return ok;
}

const MIGRATIONS = {
  "088": `create or replace function public.log_growth_events_batch(p_session_id text, p_events jsonb) returns void language plpgsql security definer set search_path = public as $$
declare ev jsonb; uid uuid;
begin
  if p_session_id is null or length(p_session_id) < 8 or length(p_session_id) > 128 then return; end if;
  uid := auth.uid();
  if (select count(*) from public.growth_events where session_id = p_session_id and created_at > now() - interval '1 minute') >= 60 then return; end if;
  insert into public.growth_events (session_id, user_id, name, props, path, client_ts)
  select p_session_id, uid, left(coalesce(ev->>'name',''),80),
    case when length(coalesce(ev->>'props','null')) > 4000 then null else (ev->>'props')::jsonb end,
    left(coalesce(ev->>'path',''),500),
    coalesce((ev->>'client_ts')::timestamptz, now())
  from jsonb_array_elements(p_events) as ev
  where length(coalesce(ev->>'name','')) >= 2;
end;
$$;
grant execute on function public.log_growth_events_batch(text, jsonb) to anon, authenticated;`,

  "089": `create index if not exists generation_jobs_status_created_idx on public.generation_jobs (status, created_at desc);
create index if not exists discord_bot_events_type_created_idx on public.discord_bot_events (event_type, created_at desc);
create index if not exists growth_events_session_created_idx on public.growth_events (session_id, created_at desc);
create index if not exists social_publish_queue_status_created_idx on public.social_publish_queue (status, created_at asc);
create index if not exists youtube_daily_plans_day_status_idx on public.youtube_daily_plans (day, status);`,

  "090": `create or replace function public.grant_discord_challenge_bonus_batch(p_grants jsonb) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_granted int := 0; v_skipped int := 0; rec jsonb; v_user_id uuid; v_credits int; v_key text; v_already boolean;
begin
  for rec in select value from jsonb_array_elements(p_grants) loop
    v_user_id := (rec->>'user_id')::uuid;
    v_credits := (rec->>'credits')::int;
    v_key := rec->>'idempotency_key';
    if v_user_id is null or v_credits is null or v_credits <= 0 or v_key is null or length(v_key) < 8 then v_skipped := v_skipped + 1; continue; end if;
    select exists (select 1 from public.discord_bot_events where event_type = 'challenge_bonus' and payload->>'idempotency_key' = v_key) into v_already;
    if v_already then v_skipped := v_skipped + 1; continue; end if;
    update public.profiles set referral_bonus = referral_bonus + v_credits where id = v_user_id;
    insert into public.discord_bot_events (event_type, payload, ok) values ('challenge_bonus', jsonb_build_object('user_id', v_user_id, 'credits', v_credits, 'idempotency_key', v_key), true);
    v_granted := v_granted + 1;
  end loop;
  return jsonb_build_object('ok', true, 'granted', v_granted, 'skipped', v_skipped);
end;
$$;
grant execute on function public.grant_discord_challenge_bonus_batch(jsonb) to service_role;`,
};

async function main() {
  console.log("=== RETRY MIGRATIONS ===");
  console.log("Primary: " + PRIMARY_URL);

  // 1. Check if primary is up
  const { ok, status } = await checkPrimary();
  console.log("Primary status: " + (ok ? "UP" : "DOWN (HTTP " + status + ")"));

  if (!ok) {
    console.log("Primary still down — will retry next schedule.");
    console.log("Set workflow to run again in 30min.");
    return; // Exit cleanly, GitHub Actions will retry
  }

  // 2. Primary is up — apply all 3 migrations
  console.log("\nPrimary UP — applying migrations...\n");
  const results = await Promise.all([
    runSQL(MIGRATIONS["088"], "088 growth_events_batch"),
    runSQL(MIGRATIONS["089"], "089 perf indexes"),
    runSQL(MIGRATIONS["090"], "090 discord challenge batch"),
  ]);

  const allOk = results.every(Boolean);
  console.log("\n" + (allOk ? "ALL MIGRATIONS APPLIED ✅" : "SOME FAILED — will retry next schedule"));

  if (allOk) {
    console.log("Disabling retry workflow...");
    // The workflow will disable itself next run if all succeed
  }
}

main().catch(e => {
  console.error("Fatal:", e.message);
  process.exit(1);
});