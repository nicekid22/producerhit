/**
 * Applique les migrations 067 + 068 (Voice Studio) via Supabase Management API.
 * Requiert SUPABASE_ACCESS_TOKEN (npx supabase login).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_REF = "pmfnzenqemnonpglmjqx";
const MIGRATIONS = ["067_voice_to_song", "068_voice_profiles"];

const token = (process.env.SUPABASE_ACCESS_TOKEN ?? "").trim();
if (!token) {
  console.error("SUPABASE_ACCESS_TOKEN manquant. Lance: npx supabase login");
  process.exit(1);
}

async function api(path, body, attempt = 1) {
  const maxAttempts = 5;
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  const msg = typeof data === "string" ? data : JSON.stringify(data ?? "");
  const timedOut =
    res.status === 544 ||
    msg.includes("connection timeout") ||
    msg.includes("Connection terminated") ||
    msg.includes("forcibly closed");
  if (!res.ok) {
    if (timedOut && attempt < maxAttempts) {
      const waitMs = attempt * 4000;
      console.warn(`Timeout DB (tentative ${attempt}/${maxAttempts}), nouvel essai dans ${waitMs / 1000}s…`);
      await new Promise((r) => setTimeout(r, waitMs));
      return api(path, body, attempt + 1);
    }
    throw new Error(`${res.status} ${res.statusText}: ${msg}`);
  }
  return data;
}

async function main() {
  for (const name of MIGRATIONS) {
    const sql = readFileSync(join(__dirname, "..", "supabase", "migrations", `${name}.sql`), "utf8");
    console.log(`Application de ${name}…`);
    await api("/database/migrations", { name, query: sql });
    console.log(`OK — ${name}`);
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
