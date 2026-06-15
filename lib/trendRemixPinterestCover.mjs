/**
 * Pinterest cover for trend remix loops (same pipeline as dashboard cards).
 */
function hashSeed(input) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function buildTrendRemixPinterestQuery(catalog, loopMeta = {}) {
  const genre = String(catalog?.remix_genre ?? loopMeta.genre ?? "music").trim();
  const mood = String(catalog?.mood ?? "aesthetic").trim();
  const artist = String(catalog?.original_artist ?? "").trim();
  const title = String(catalog?.original_title ?? "").trim();
  const kw = (catalog?.trend_keywords ?? [])[0] ?? "";
  const parts = [
    `${genre} aesthetic portrait`,
    mood,
    artist ? `${artist} vibe` : "",
    title ? `${title} mood` : "",
    kw,
    "pinterest editorial",
  ].filter(Boolean);
  return parts.join(" ").slice(0, 100);
}

async function invokeEdge(name, body, { supabaseUrl, anonKey, accessToken }) {
  const res = await fetch(`${supabaseUrl.replace(/\/$/, "")}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45_000),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { ok: res.ok, status: res.status, json };
}

export async function assignTrendRemixPinterestCover(db, { loopId, catalog, supabaseUrl, anonKey, accessToken }) {
  const query = buildTrendRemixPinterestQuery(catalog);
  const seed = hashSeed(loopId) % 997;

  const persisted = await invokeEdge(
    "persist-pinterest-cover",
    { loopId, query, seed },
    { supabaseUrl, anonKey, accessToken },
  );

  if (persisted.ok && persisted.json?.coverUrl) {
    return { coverUrl: persisted.json.coverUrl, query, source: "pinterest-storage" };
  }

  const fetched = await invokeEdge(
    "fetch-pinterest-cover",
    { loopId, query, seed, count: 1 },
    { supabaseUrl, anonKey, accessToken },
  );

  const pinUrl = fetched.json?.imageUrl ?? fetched.json?.imageUrls?.[0];
  if (fetched.ok && pinUrl) {
    await db.from("loops").update({ cover_url: pinUrl }).eq("id", loopId);
    return { coverUrl: pinUrl, query, source: "pinterest-pinimg" };
  }

  return {
    coverUrl: null,
    query,
    source: "failed",
    error: persisted.json?.error ?? fetched.json?.error ?? "pinterest_unavailable",
  };
}

export function resolveCoverUrlFromLoop(loop) {
  const col = typeof loop?.cover_url === "string" ? loop.cover_url.trim() : "";
  const ace =
    loop?.stems_url?.ace && typeof loop.stems_url.ace === "object"
      ? String(loop.stems_url.ace.coverUrl ?? "").trim()
      : "";
  if (ace && !ace.includes("pollinations.ai")) return ace;
  if (col && !col.includes("pollinations.ai")) return col;
  if (ace) return ace;
  return col || null;
}
