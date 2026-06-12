/**
 * Probe production youtube-render API (no upload).
 * Usage: npm run youtube:probe-render -- [loopId]
 */
import { existsSync, readFileSync, promises as fs } from "node:fs";
import { join } from "node:path";

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

const LOOP_ID = (process.argv[2] ?? "1bca92cd-8c6f-454c-b532-693063de8231").trim();
const secret = (process.env.SOCIAL_PUBLISH_CRON_SECRET ?? "").trim();
const base = (process.env.YOUTUBE_RENDER_URL ?? "https://www.producerhit.com/api/youtube-render").trim();

if (!secret) {
  console.error("Missing SOCIAL_PUBLISH_CRON_SECRET");
  process.exit(1);
}

const url = `${base}?loopId=${encodeURIComponent(LOOP_ID)}`;
console.log(`\n🔍 Probe render API\n${url}\n`);

const t0 = Date.now();
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 150_000);
let res;
try {
  res = await fetch(url, { headers: { "x-social-cron-secret": secret }, signal: controller.signal });
} finally {
  clearTimeout(timer);
}
const ms = Date.now() - t0;
const ct = res.headers.get("content-type") ?? "";

if (!res.ok) {
  console.error(`❌ HTTP ${res.status} (${ms}ms)`);
  console.error(await res.text());
  process.exit(1);
}

if (!ct.includes("video") && !ct.includes("octet-stream")) {
  console.error(`❌ Unexpected content-type: ${ct}`);
  console.error((await res.text()).slice(0, 300));
  process.exit(1);
}

const buf = Buffer.from(await res.arrayBuffer());
const out = join(process.cwd(), "tmp-youtube-probe-render.mp4");
await fs.writeFile(out, buf);

console.log(`✅ ${res.status} · ${(buf.byteLength / 1024 / 1024).toFixed(2)} MB · ${ms}ms`);
console.log(`   Saved: ${out}\n`);
