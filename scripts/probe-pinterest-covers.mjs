/**
 * Vérifie la chaîne covers Pinterest (Edge + DB + Storage).
 * Usage: node scripts/probe-pinterest-covers.mjs
 */
import { readFileSync, existsSync } from "fs";

function loadDotEnv() {
  const path = ".env";
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i <= 0) continue;
    const key = trimmed.slice(0, i).trim();
    let val = trimmed.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadDotEnv();

const supabaseUrl = (process.env.VITE_SUPABASE_URL ?? "").replace(/\/$/, "");
const anonKey = process.env.VITE_SUPABASE_ANON_KEY ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

function mask(s) {
  if (!s || s.length < 12) return "(missing)";
  return `${s.slice(0, 8)}…${s.slice(-4)}`;
}

async function probeFunction(name) {
  const url = `${supabaseUrl}/functions/v1/${name}`;
  try {
    const opt = await fetch(url, { method: "OPTIONS", signal: AbortSignal.timeout(12_000) });
    const post = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ loopId: "00000000-0000-0000-0000-000000000000", query: "streetwear", seed: 1 }),
      signal: AbortSignal.timeout(15_000),
    });
    const text = await post.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text.slice(0, 200) };
    }
    return {
      name,
      optionsStatus: opt.status,
      postStatus: post.status,
      body: json,
      deployed: post.status !== 404,
    };
  } catch (e) {
    return { name, error: String(e?.message ?? e), deployed: false };
  }
}

async function probePinterestSearch() {
  const q = "streetwear aesthetic";
  const sourcePath = `/search/pins/?q=${encodeURIComponent(q)}`;
  const data = JSON.stringify({
    options: { query: q, scope: "pins", page_size: 10, bookmarks: [null] },
    context: {},
  });
  const url = `https://www.pinterest.com/resource/BaseSearchResource/get/?source_url=${encodeURIComponent(sourcePath)}&data=${encodeURIComponent(data)}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    signal: AbortSignal.timeout(12_000),
  });
  const html = res.ok ? null : await res.text().catch(() => "");
  const json = res.ok ? await res.json() : null;
  const results = json?.resource_response?.data?.results ?? [];
  const pinCount = results.length;
  return { ok: res.ok, status: res.status, pinCount, htmlSnippet: html?.slice(0, 120) };
}

async function probeRecentLoops() {
  if (!serviceKey) {
    return { skipped: true, reason: "SUPABASE_SERVICE_ROLE_KEY missing in .env" };
  }
  const res = await fetch(
    `${supabaseUrl}/rest/v1/loops?select=id,name,is_public,stems_url&is_public=eq.true&order=created_at.desc&limit=5`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      signal: AbortSignal.timeout(12_000),
    },
  );
  if (!res.ok) {
    return { error: await res.text() };
  }
  const rows = await res.json();
  return rows.map((r) => {
    const stems = r.stems_url && typeof r.stems_url === "object" ? r.stems_url : null;
    const ace = stems?.ace && typeof stems.ace === "object" ? stems.ace : null;
    const coverUrl = typeof ace?.coverUrl === "string" ? ace.coverUrl : null;
    const kind = coverUrl?.includes("loop-covers")
      ? "storage"
      : coverUrl?.includes("pinimg")
        ? "pinimg"
        : coverUrl?.includes("pollinations")
          ? "pollinations"
          : coverUrl
            ? "other"
            : "none";
    return {
      id: r.id,
      public: r.is_public === true,
      name: (r.name ?? "").slice(0, 40),
      coverKind: kind,
      coverUrl: coverUrl ? `${coverUrl.slice(0, 72)}…` : null,
    };
  });
}

async function probeStorageBucket() {
  if (!serviceKey) return { skipped: true };
  const res = await fetch(`${supabaseUrl}/storage/v1/bucket/loop-covers`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) return { error: res.status, text: (await res.text()).slice(0, 200) };
  return await res.json();
}

console.log("=== ProducerHit — probe Pinterest covers ===\n");
console.log("Supabase URL:", supabaseUrl || "(missing)");
console.log("Anon key:", mask(anonKey));
console.log("Service role:", serviceKey ? mask(serviceKey) : "(missing — audit loops limité)");

console.log("\n--- Pinterest API (direct) ---");
const pin = await probePinterestSearch();
console.log(JSON.stringify(pin, null, 2));

console.log("\n--- Edge functions ---");
for (const name of ["persist-pinterest-cover", "fetch-pinterest-cover"]) {
  const r = await probeFunction(name);
  console.log(JSON.stringify(r, null, 2));
}

console.log("\n--- Bucket loop-covers ---");
console.log(JSON.stringify(await probeStorageBucket(), null, 2));

console.log("\n--- Derniers loops (cover dans stems_url.ace) ---");
console.log(JSON.stringify(await probeRecentLoops(), null, 2));

console.log("\n=== Interprétation ===");
console.log("- postStatus 404 → fonction NON déployée (supabase functions deploy …)");
console.log("- postStatus 401/404 loop → fonction OK, auth/loop attendu");
console.log("- coverKind 'none' sur tous les morceaux → persist jamais exécuté ou en échec");
console.log("- pinCount 0 → Pinterest bloque les requêtes serveur (rare en local)");
