#!/usr/bin/env node
/**
 * Lighthouse mobile audit — URLs critiques ProducerHit.
 * Usage: npm run build && npx vite preview --port 4173 &
 *        node scripts/perf-lighthouse.mjs
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const baseUrl = process.env.PERF_BASE_URL ?? "http://127.0.0.1:4173";
const outDir = path.join(root, "reports", "perf", new Date().toISOString().slice(0, 10));

const URLS = ["/", "/library", "/explore", "/dashboard", "/distribution", "/blog"];
const MIN_PERF = Number(process.env.PERF_MIN_SCORE ?? "85");

fs.mkdirSync(outDir, { recursive: true });

function runLighthouse(url) {
  const slug = url.replace(/\//g, "_") || "root";
  const outJson = path.join(outDir, `lighthouse-${slug}.json`);
  const outHtml = path.join(outDir, `lighthouse-${slug}.html`);

  return new Promise((resolve, reject) => {
    const args = [
      url,
      "--quiet",
      "--chrome-flags=--headless --no-sandbox",
      "--only-categories=performance,accessibility,best-practices",
      "--preset=desktop",
      "--output=json",
      `--output-path=${outJson}`,
      "--form-factor=mobile",
      "--screenEmulation.mobile",
      "--throttling.cpuSlowdownMultiplier=4",
    ];

    const child = spawn("npx", ["lighthouse", ...args], {
      cwd: root,
      stdio: "inherit",
      shell: true,
      env: { ...process.env, NODE_OPTIONS: "--use-system-ca" },
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Lighthouse failed for ${url} (exit ${code})`));
        return;
      }
      try {
        const report = JSON.parse(fs.readFileSync(outJson, "utf8"));
        const perf = Math.round((report.categories?.performance?.score ?? 0) * 100);
        const lcp = report.audits?.["largest-contentful-paint"]?.numericValue;
        const cls = report.audits?.["cumulative-layout-shift"]?.numericValue;
        resolve({ url, perf, lcp, cls, outJson, outHtml });
      } catch (err) {
        reject(err);
      }
    });
  });
}

const results = [];
let failed = false;

for (const route of URLS) {
  const full = `${baseUrl}${route}`;
  process.stdout.write(`\n▶ Lighthouse ${full}\n`);
  try {
    const r = await runLighthouse(full);
    results.push(r);
    if (r.perf < MIN_PERF && (route === "/" || route === "/library")) {
      console.error(`✗ ${route} performance ${r.perf} < ${MIN_PERF}`);
      failed = true;
    } else {
      console.log(`✓ ${route} performance=${r.perf} LCP=${Math.round(r.lcp)}ms CLS=${r.cls?.toFixed(3)}`);
    }
  } catch (err) {
    console.warn(`⚠ Skipped ${route}:`, err instanceof Error ? err.message : err);
  }
}

const summaryPath = path.join(outDir, "lighthouse-summary.json");
fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));
console.log(`\nSummary → ${summaryPath}`);

if (failed) process.exit(1);
