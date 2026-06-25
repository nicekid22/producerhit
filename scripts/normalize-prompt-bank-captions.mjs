#!/usr/bin/env node
/**
 * Dedupe redundant production tags in prompt-bank ACE captions.
 * Usage: node scripts/normalize-prompt-bank-captions.mjs [--write]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const write = process.argv.includes("--write");

const REDUNDANT = [
  "hi-fi",
  "emotionally resonant",
  "professional production",
  "dynamic arrangement",
  "studio quality",
];

const REPLACEMENT = "polished studio mix";

function normalizeCaption(caption) {
  const tags = caption
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const out = [];
  const seen = new Set();
  let replaced = false;

  for (const tag of tags) {
    const key = tag.toLowerCase();
    if (REDUNDANT.includes(key)) {
      if (!replaced) {
        out.push(REPLACEMENT);
        replaced = true;
      }
      continue;
    }
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
  }

  if (!replaced && !seen.has(REPLACEMENT)) {
    out.push(REPLACEMENT);
  }

  return out.join(", ");
}

for (const file of ["v1.json", "v2.json"]) {
  const filePath = path.join(root, "packages/shared/data/prompt-bank", file);
  const data = JSON.parse(readFileSync(filePath, "utf8"));
  let changed = 0;

  for (const entry of data) {
    const before = entry.acestep.caption;
    const after = normalizeCaption(before);
    if (after !== before) {
      entry.acestep.caption = after;
      changed += 1;
    }
  }

  console.log(`${file}: ${changed}/${data.length} captions updated`);
  if (write && changed > 0) {
    writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  }
}

if (!write) {
  console.log("Dry run — pass --write to save files.");
}
