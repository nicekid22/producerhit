/**
 * Sync Supabase (+ optional Stripe) metrics → Hermes project metrics/latest.md
 * Bridge: Hermes agents read files, never Supabase directly.
 *
 * Usage:
 *   npm run hermes:metrics:sync
 *   npm run hermes:metrics:sync -- --days 14
 *
 * Env: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Optional: STRIPE_SECRET_KEY for live MRR cross-check
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const PLAN_MONTHLY_USD = { pro: 8, studio: 24, plus: 47 };

function loadDotEnv() {
  if (!existsSync(".env")) return;
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (!(k in process.env)) process.env[k] = v;
  }
}

loadDotEnv();

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "").trim();
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
const STRIPE_KEY = (process.env.STRIPE_SECRET_KEY ?? "").trim();

const daysArg = process.argv.find((a) => a.startsWith("--days="));
const days = daysArg ? Number.parseInt(daysArg.split("=")[1], 10) : 30;

const hermesProject = join(
  process.env.LOCALAPPDATA ?? join(homedir(), "AppData", "Local"),
  "hermes",
  "projects",
  "producerhit",
);
const metricsDir = join(hermesProject, "metrics");
const repoMetricsDir = join("reports", "hermes-metrics");

function centsToUsd(cents) {
  if (typeof cents !== "number" || !Number.isFinite(cents)) return "unknown";
  return `$${(cents / 100).toFixed(2)}`;
}

async function stripeMrrCheck() {
  if (!STRIPE_KEY) return null;
  const res = await fetch("https://api.stripe.com/v1/subscriptions?status=active&limit=100", {
    headers: { Authorization: `Bearer ${STRIPE_KEY}` },
  });
  if (!res.ok) return { error: `Stripe HTTP ${res.status}` };
  const body = await res.json();
  let mrrCents = 0;
  let count = 0;
  for (const sub of body.data ?? []) {
    const item = sub.items?.data?.[0];
    const unit = item?.price?.unit_amount;
    const interval = item?.price?.recurring?.interval;
    if (typeof unit === "number" && interval === "month") {
      mrrCents += unit;
      count += 1;
    }
  }
  return { mrr_cents: mrrCents, active_subscriptions: count };
}

function formatMarkdown(data, stripeCheck) {
  const rev = data.revenue ?? {};
  const funnel = data.funnel ?? {};
  const users = data.users ?? {};
  const channels = Array.isArray(data.channels) ? data.channels : [];
  const topChannel = channels[0]?.source ?? "unknown";

  const lines = [];
  lines.push("# ProducerHit — Execution Metrics");
  lines.push(`Generated: ${data.generated_at ?? new Date().toISOString()}`);
  lines.push(`Window: ${data.days ?? days} days`);
  lines.push("");
  lines.push("## CEO Dashboard (read this first)");
  lines.push(`- **MRR (estimate):** ${centsToUsd(rev.mrr_cents_estimate)}`);
  lines.push(`- **ARR (estimate):** ${centsToUsd(rev.arr_cents_estimate)}`);
  lines.push(`- **Growth rate (signups 7d):** ${users.signups_7d ?? 0}`);
  lines.push(`- **Churn (7d events):** ${rev.churn_rate_7d_pct ?? 0}%`);
  lines.push(`- **Top channel:** ${topChannel}`);
  lines.push(`- **Free→paid (7d):** ${rev.free_to_paid_pct_7d ?? 0}%`);
  lines.push("");
  lines.push("## Funnel");
  lines.push(`- Sessions: ${funnel.sessions ?? 0}`);
  lines.push(`- Signups: ${funnel.signups ?? 0} | Generations: ${funnel.generations ?? 0}`);
  lines.push(`- Checkouts: ${funnel.checkouts ?? 0} | Subscriptions: ${funnel.subscriptions ?? 0}`);
  lines.push(`- Signup→Gen: ${funnel.signup_to_gen_pct ?? 0}%`);
  lines.push(`- Gen→Checkout: ${funnel.gen_to_checkout_pct ?? 0}%`);
  lines.push(`- Checkout→Paid: ${funnel.checkout_to_paid_pct ?? 0}%`);
  lines.push("");
  lines.push("## Users");
  lines.push(`- Total: ${users.total ?? 0} | Paid subs: ${users.paid_subscriptions ?? 0}`);
  lines.push(`- Signups 24h: ${users.signups_24h ?? 0} | Active 7d: ${users.active_7d ?? 0}`);
  lines.push(`- By plan: ${JSON.stringify(users.by_plan ?? {})}`);
  lines.push("");
  lines.push("## Retention (proxy)");
  lines.push(`- D1: ${data.retention?.d1_pct ?? "unknown"}%`);
  lines.push(`- D7: ${data.retention?.d7_pct ?? "unknown"}%`);
  lines.push("");
  lines.push("## Channels (UTM)");
  for (const ch of channels.slice(0, 8)) {
    lines.push(`- ${ch.source}: ${ch.count}`);
  }
  lines.push("");
  lines.push("## Revenue events (7d)");
  lines.push(`- Activations: ${rev.activations_7d ?? 0}`);
  lines.push(`- Cancellations: ${rev.cancellations_7d ?? 0}`);
  lines.push(`- Invoice paid: ${centsToUsd(rev.invoice_paid_cents_7d)}`);
  lines.push("");
  lines.push("## Plan prices (reference)");
  lines.push(`- Pro $${PLAN_MONTHLY_USD.pro}/mo | Studio $${PLAN_MONTHLY_USD.studio}/mo | Plus $${PLAN_MONTHLY_USD.plus}/mo`);
  if (stripeCheck) {
    lines.push("");
    lines.push("## Stripe live cross-check");
    if (stripeCheck.error) lines.push(`- Error: ${stripeCheck.error}`);
    else {
      lines.push(`- Active subs: ${stripeCheck.active_subscriptions}`);
      lines.push(`- MRR: ${centsToUsd(stripeCheck.mrr_cents)}`);
    }
  }
  lines.push("");
  lines.push("---");
  lines.push("_Source: `npm run hermes:metrics:sync` → `get_hermes_execution_metrics` RPC_");
  lines.push("_Hermes agents: read `metrics/latest.md` — never query Supabase directly._");
  return lines.join("\n");
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error("Missing VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
  }

  let data;
  try {
    const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
    const res = await db.rpc("get_hermes_execution_metrics", { p_days: days });
    if (res.error) {
      console.error("RPC get_hermes_execution_metrics failed:", res.error.message);
      console.error("Apply migration 077_hermes_execution_metrics.sql first.");
      process.exit(1);
    }
    data = res.data;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const cause = e instanceof Error && e.cause instanceof Error ? e.cause.message : "";
    console.error("Supabase connection failed:", msg, cause ? `(${cause})` : "");
    console.error("Check .env keys and network. Try: node --use-system-ca scripts/hermes/sync-execution-metrics.mjs");
    process.exit(1);
  }

  const stripeCheck = await stripeMrrCheck();
  const md = formatMarkdown(data, stripeCheck);
  const json = JSON.stringify({ ...data, stripe_cross_check: stripeCheck }, null, 2);
  const day = new Date().toISOString().slice(0, 10);

  for (const dir of [metricsDir, repoMetricsDir]) {
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "latest.md"), md, "utf8");
    writeFileSync(join(dir, "latest.json"), json, "utf8");
    writeFileSync(join(dir, `metrics-${day}.md`), md, "utf8");
  }

  console.log(md);
  console.log(`\n✅ Written: ${join(metricsDir, "latest.md")}`);
  console.log(`✅ Written: ${join(repoMetricsDir, "latest.md")}`);
}

main().catch((e) => {
  console.error("❌", e instanceof Error ? e.message : e);
  process.exit(1);
});
