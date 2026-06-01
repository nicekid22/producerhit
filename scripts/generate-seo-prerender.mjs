import { buildSync } from "esbuild";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = process.cwd();
const outDir = path.join(repoRoot, ".tmp");
const outFile = path.join(outDir, "seo-prerender-bundle.cjs");
const manifestFile = path.join(repoRoot, "public", "seo-prerender.json");

mkdirSync(outDir, { recursive: true });

buildSync({
  entryPoints: [path.join(repoRoot, "scripts", "seo-prerender-entry.ts")],
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile: outFile,
  logLevel: "silent",
});

const mod = await import(pathToFileURL(outFile).href);
const pages = mod.COMPARISON_PAGES ?? [];

const record = {};
for (const page of pages) {
  for (const [p, locale] of [
    [page.path, "en"],
    [page.pathFr, "fr"],
  ]) {
    record[p] = {
      locale,
      pair: locale === "en" ? page.pathFr : page.path,
      slugKey: page.slugKey,
      title: locale === "fr" ? page.titleFr : page.titleEn,
      description: locale === "fr" ? page.descriptionFr : page.descriptionEn,
      h1: locale === "fr" ? page.h1Fr : page.h1En,
      verdict: locale === "fr" ? page.verdictFr : page.verdictEn,
      updatedAt: page.updatedAt,
      keywords: page.keywords,
      matrix: page.matrix.map((row) => ({
        label: locale === "fr" ? row.labelFr : row.labelEn,
        values: page.columns.map((col) => ({
          name: locale === "fr" ? col.labelFr : col.labelEn,
          value: row.values[col.id] ?? "—",
          highlight: Boolean(col.highlight),
        })),
      })),
      faq: (locale === "fr" ? page.faqFr : page.faqEn).map((f) => ({ q: f.q, a: f.a })),
    };
  }
}

writeFileSync(manifestFile, `${JSON.stringify({ generatedAt: new Date().toISOString(), pages: record }, null, 2)}\n`, "utf8");
console.log(`generate-seo-prerender: ${Object.keys(record).length} URLs → public/seo-prerender.json`);
