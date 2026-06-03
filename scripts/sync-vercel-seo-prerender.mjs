import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const manifestFile = path.join(repoRoot, "public", "seo-prerender.json");
const vercelFile = path.join(repoRoot, "vercel.json");

const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
const segments = Object.keys(manifest.pages ?? {})
  .map((p) => p.replace(/^\//, ""))
  .sort((a, b) => b.length - a.length);

const pattern = segments.join("|");
const vercel = JSON.parse(readFileSync(vercelFile, "utf8"));

const botUa = ".*(Googlebot|googlebot|Google-InspectionTool|bingbot|Bingbot|DuckDuckBot|Baiduspider|YandexBot|Slurp|facebot|Twitterbot|LinkedInBot).*";
const newSource = `/:seoPath(${pattern})`;

let updated = false;
for (const rw of vercel.rewrites ?? []) {
  if (rw.destination?.includes("/api/seo-prerender")) {
    rw.source = newSource;
    rw.has = [{ type: "header", key: "user-agent", value: botUa }];
    updated = true;
    break;
  }
}

if (!updated) {
  vercel.rewrites = vercel.rewrites ?? [];
  vercel.rewrites.splice(1, 0, {
    source: newSource,
    has: [{ type: "header", key: "user-agent", value: botUa }],
    destination: "/api/seo-prerender?path=/:seoPath",
  });
}

writeFileSync(vercelFile, `${JSON.stringify(vercel, null, 2)}\n`, "utf8");
console.log(`sync-vercel-seo-prerender: ${segments.length} paths in bot rewrite`);
