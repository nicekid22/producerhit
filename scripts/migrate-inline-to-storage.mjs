/**
 * Migre provider_audio_inline → loop-audio Storage (réduit IO Postgres).
 * Usage: node scripts/migrate-inline-to-storage.mjs [--dry-run] [--limit=20]
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

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

const dryRun = process.argv.includes("--dry-run");
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : 30;

const env = loadEnv();
const url = env.VITE_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, serviceKey, { auth: { persistSession: false } });
const BUCKET = "loop-audio";

function decodeDataUrl(dataUrl) {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!m) return null;
  return { mime: m[1], bytes: Buffer.from(m[2], "base64") };
}

function extFromMime(mime) {
  if (mime.includes("wav")) return "wav";
  if (mime.includes("ogg")) return "ogg";
  if (mime.includes("webm")) return "webm";
  if (mime.includes("mp4") || mime.includes("aac")) return "m4a";
  return "mp3";
}

let rows = null;
let error = null;
for (let attempt = 1; attempt <= 3; attempt++) {
  const res = await sb
    .from("loops")
    .select("id, user_id, provider_audio_inline, stems_url")
    .not("provider_audio_inline", "is", null)
    .order("created_at", { ascending: true })
    .limit(Math.min(Number.isFinite(limit) ? limit : 30, 10));
  rows = res.data;
  error = res.error;
  if (!error) break;
  if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 3000));
}

if (error) {
  console.error(error.message);
  process.exit(1);
}

console.log(`${dryRun ? "DRY RUN" : "LIVE"} — ${rows?.length ?? 0} row(s) with inline audio`);

let ok = 0;
for (const row of rows ?? []) {
  const inline = typeof row.provider_audio_inline === "string" ? row.provider_audio_inline.trim() : "";
  if (!inline.startsWith("data:audio/")) continue;

  const decoded = decodeDataUrl(inline);
  if (!decoded?.bytes.byteLength) {
    console.warn(`Skip ${row.id}: invalid data URL`);
    continue;
  }

  const ext = extFromMime(decoded.mime);
  const path = `${row.user_id}/${row.id}.${ext}`;
  const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(path);
  const publicUrl = pub.publicUrl?.trim() ?? "";

  console.log(`→ ${row.id} → ${path}`);

  if (dryRun) {
    ok += 1;
    continue;
  }

  const { error: upErr } = await sb.storage.from(BUCKET).upload(path, decoded.bytes, {
    upsert: true,
    contentType: decoded.mime,
    cacheControl: "public, max-age=604800",
  });
  if (upErr) {
    console.warn(`Upload failed ${row.id}:`, upErr.message);
    continue;
  }

  const stems =
    row.stems_url && typeof row.stems_url === "object" ? { ...row.stems_url } : {};
  const ace = stems.ace && typeof stems.ace === "object" ? { ...stems.ace } : {};
  delete ace.providerDataUrl;
  ace.publicPlayback = "supabase-storage";

  const { error: dbErr } = await sb
    .from("loops")
    .update({
      audio_url: publicUrl,
      provider_audio_inline: null,
      stems_url: { ...stems, ace },
    })
    .eq("id", row.id);

  if (dbErr) {
    console.warn(`DB update failed ${row.id}:`, dbErr.message);
    continue;
  }
  ok += 1;
}

console.log(`Done: ${ok}/${rows?.length ?? 0} migrated`);
