/**
 * Sync missing Stripe prices (credit pack + annual plans) from .env STRIPE_SECRET_KEY.
 * Usage: node --use-system-ca scripts/sync-stripe-prices.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const envPath = path.join(repoRoot, ".env");

function loadEnv() {
  if (!existsSync(envPath)) throw new Error(".env not found");
  const env = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return env;
}

function upsertEnvLine(key, value) {
  const raw = readFileSync(envPath, "utf8");
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(raw)) {
    writeFileSync(envPath, raw.replace(re, line), "utf8");
  } else {
    const marker = "# --- Stripe price IDs";
    if (raw.includes(marker)) {
      writeFileSync(envPath, raw.replace(marker, `${line}\n${marker}`), "utf8");
    } else {
      writeFileSync(envPath, `${raw.trimEnd()}\n${line}\n`, "utf8");
    }
  }
}

async function stripe(key, method, endpoint, body) {
  const res = await fetch(`https://api.stripe.com/v1${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body ? new URLSearchParams(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? `Stripe ${endpoint} failed`);
  return json;
}

async function getPrice(key, priceId) {
  return stripe(key, "GET", `/prices/${priceId}?expand[]=product`, null);
}

async function findOneTimePrice(key, { amountCents, currency, nameHint }) {
  const list = await stripe(key, "GET", "/prices?limit=100&active=true&expand[]=data.product", null);
  for (const p of list.data ?? []) {
    if (p.type !== "one_time") continue;
    if (p.unit_amount !== amountCents) continue;
    if (p.currency !== currency) continue;
    const pname = (p.product?.name ?? p.nickname ?? "").toLowerCase();
    if (nameHint && !pname.includes(nameHint.toLowerCase())) continue;
    return p.id;
  }
  return null;
}

async function findAnnualPrice(key, productId, amountCents) {
  const list = await stripe(key, "GET", `/prices?limit=100&active=true&product=${productId}`, null);
  for (const p of list.data ?? []) {
    if (p.recurring?.interval === "year" && p.unit_amount === amountCents && p.currency === "usd") {
      return p.id;
    }
  }
  return null;
}

async function createAnnualPrice(key, productId, amountCents, nickname) {
  return stripe(key, "POST", "/prices", {
    product: productId,
    unit_amount: String(amountCents),
    currency: "usd",
    "recurring[interval]": "year",
    nickname,
  });
}

async function createCreditPackProduct(key) {
  const product = await stripe(key, "POST", "/products", {
    name: "ProducerHit — 50 generations (one-time)",
    description: "50 bonus generation credits. One-time purchase, credits never expire.",
    "metadata[pack_id]": "credit_pack_50",
    "metadata[credits]": "50",
  });
  const price = await stripe(key, "POST", "/prices", {
    product: product.id,
    unit_amount: "900",
    currency: "usd",
    nickname: "Credit Pack 50 — $9",
    "metadata[pack_id]": "credit_pack_50",
    "metadata[credits]": "50",
  });
  return price.id;
}

const ANNUAL = {
  STRIPE_PRICE_ID_PRO_ANNUAL: { from: "STRIPE_PRICE_ID_PRO", cents: 7700, nick: "Pro Annual — $77/yr" },
  STRIPE_PRICE_ID_STUDIO_ANNUAL: { from: "STRIPE_PRICE_ID_STUDIO", cents: 23000, nick: "Studio Annual — $230/yr" },
  STRIPE_PRICE_ID_PLUS_ANNUAL: { from: "STRIPE_PRICE_ID_PLUS", cents: 45100, nick: "Plus Annual — $451/yr" },
};

async function main() {
  const env = loadEnv();
  const key = env.STRIPE_SECRET_KEY;
  if (!key?.startsWith("sk_")) throw new Error("STRIPE_SECRET_KEY missing in .env");

  const created = {};

  // Credit pack $9 USD
  if (!env.STRIPE_PRICE_ID_CREDIT_PACK_50) {
    let id = await findOneTimePrice(key, { amountCents: 900, currency: "usd", nameHint: "50" });
    if (!id) id = await createCreditPackProduct(key);
    created.STRIPE_PRICE_ID_CREDIT_PACK_50 = id;
    console.log(`credit_pack_50: ${id}`);
  } else {
    console.log(`credit_pack_50: already set`);
  }

  for (const [envKey, cfg] of Object.entries(ANNUAL)) {
    if (env[envKey]) {
      console.log(`${envKey}: already set`);
      continue;
    }
    const monthlyId = env[cfg.from];
    if (!monthlyId) {
      console.warn(`skip ${envKey} — ${cfg.from} missing`);
      continue;
    }
    const monthly = await getPrice(key, monthlyId);
    const productId = typeof monthly.product === "string" ? monthly.product : monthly.product?.id;
    if (!productId) throw new Error(`No product for ${cfg.from}`);

    let id = await findAnnualPrice(key, productId, cfg.cents);
    if (!id) {
      const price = await createAnnualPrice(key, productId, cfg.cents, cfg.nick);
      id = price.id;
    }
    created[envKey] = id;
    console.log(`${envKey}: ${id} ($${cfg.cents / 100}/yr)`);
  }

  for (const [k, v] of Object.entries(created)) {
    upsertEnvLine(k, v);
  }

  if (Object.keys(created).length) {
    console.log("\nUpdated .env with new price IDs.");
    console.log("Next: set Supabase edge secrets (create-checkout, stripe-webhook, confirm-checkout):");
    for (const [k, v] of Object.entries(created)) {
      console.log(`  ${k}=${v}`);
    }
  } else {
    console.log("\nNothing to create — all price IDs present.");
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
