import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const manifestFile = path.join(repoRoot, "public", "seo-prerender.json");
const vercelFile = path.join(repoRoot, "vercel.json");

/** Vercel caps rewrite `source` at 4096 chars — chunk SEO slugs across multiple rules. */
const MAX_SOURCE_LEN = 3900;

const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
const segments = Object.keys(manifest.pages ?? {})
  .map((p) => p.replace(/^\//, ""))
  .sort((a, b) => b.length - a.length);

const botUa =
  ".*(Googlebot|googlebot|Google-InspectionTool|bingbot|Bingbot|DuckDuckBot|Baiduspider|YandexBot|Slurp|facebot|Twitterbot|LinkedInBot).*";

function chunkSegments(slugs) {
  const chunks = [];
  let current = [];

  for (const slug of slugs) {
    const candidate = [...current, slug];
    const source = `/:seoPath(${candidate.join("|")})`;
    if (source.length > MAX_SOURCE_LEN && current.length > 0) {
      chunks.push(current);
      current = [slug];
    } else {
      current = candidate;
    }
  }

  if (current.length > 0) chunks.push(current);
  return chunks;
}

function buildSeoRewrites(slugs) {
  return chunkSegments(slugs).map((chunk) => ({
    source: `/:seoPath(${chunk.join("|")})`,
    has: [{ type: "header", key: "user-agent", value: botUa }],
    destination: "/api/seo-prerender?path=/:seoPath",
  }));
}

const vercel = JSON.parse(readFileSync(vercelFile, "utf8"));
vercel.rewrites = (vercel.rewrites ?? []).filter((rw) => !rw.destination?.includes("/api/seo-prerender"));

const catchAllIdx = vercel.rewrites.findIndex((rw) => rw.destination === "/index.html");
const insertAt = catchAllIdx >= 0 ? catchAllIdx : vercel.rewrites.length;
const seoRewrites = buildSeoRewrites(segments);

for (const rw of seoRewrites) {
  if (rw.source.length > 4096) {
    throw new Error(`SEO rewrite source still too long (${rw.source.length} chars)`);
  }
}

vercel.rewrites.splice(insertAt, 0, ...seoRewrites);

writeFileSync(vercelFile, `${JSON.stringify(vercel, null, 2)}\n`, "utf8");
console.log(
  `sync-vercel-seo-prerender: ${segments.length} paths in ${seoRewrites.length} bot rewrite(s)`,
);
