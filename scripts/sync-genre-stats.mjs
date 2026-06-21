/**
 * Sync genre stats snapshot depuis Supabase → src/lib/marketing/genreStatsSnapshot.ts
 *
 * Usage : npm run genre-stats:sync
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

function loadDotEnv() {
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i <= 0) continue;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!(k in process.env)) process.env[k] = v;
    }
  }
}

loadDotEnv();

const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("genre-stats:sync — missing VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
};

async function rpcCount() {
  const res = await fetch(`${url}/rest/v1/rpc/get_genre_stats_snapshot`, {
    method: "POST",
    headers,
    body: "{}",
  });
  if (res.ok) return res.json();
  return null;
}

async function fallbackQuery() {
  const genreRes = await fetch(
    `${url}/rest/v1/loops?select=genre&genre=not.is.null&limit=5000`,
    { headers: { ...headers, Prefer: "count=exact" } },
  );
  const totalHeader = genreRes.headers.get("content-range");
  const totalMatch = totalHeader?.match(/\/(\d+)/);
  const totalLoops = totalMatch ? Number(totalMatch[1]) : 0;

  const rows = await genreRes.json();
  const counts = new Map();
  for (const row of rows) {
    const g = String(row.genre ?? "").trim().toLowerCase();
    if (!g) continue;
    counts.set(g, (counts.get(g) ?? 0) + 1);
  }
  const topGenres = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([genre, count]) => ({
      genre: genre.replace(/\b\w/g, (c) => c.toUpperCase()),
      count,
      sharePct: totalLoops > 0 ? Math.round((count / totalLoops) * 1000) / 10 : 0,
    }));

  return { generatedAt: new Date().toISOString().slice(0, 10), totalLoops, publicLoops: totalLoops, topGenres };
}

const data = (await rpcCount()) ?? (await fallbackQuery());

const outPath = path.join(process.cwd(), "src", "lib", "marketing", "genreStatsSnapshot.ts");
const fileBody = `/** Snapshot agrégé depuis Supabase \`loops\` — regénérer via \`npm run genre-stats:sync\`. */

export type GenreStatRow = { genre: string; count: number; sharePct: number };

export type GenreStatsSnapshot = {
  generatedAt: string;
  totalLoops: number;
  publicLoops: number;
  topGenres: GenreStatRow[];
  insights: { en: string[]; fr: string[] };
};

export const GENRE_STATS_SNAPSHOT: GenreStatsSnapshot = ${JSON.stringify(
  {
    ...data,
    insights: {
      en: [
        "R&B and trap-adjacent genres lead — vocal-ready beats dominate.",
        "UK garage and drill show strong niche demand outside US trap defaults.",
        "Afro genres (afrotrap, amapiano) — growing long-tail for AI prompts.",
      ],
      fr: [
        "R&B et trap mélodique dominent — beats prêts pour voix.",
        "UK garage et drill : niches actives.",
        "Genres afro : long-tail en croissance.",
      ],
    },
  },
  null,
  2,
)};
`;

writeFileSync(outPath, fileBody, "utf8");
console.log(`genre-stats:sync → ${outPath} (${data.totalLoops} loops)`);
