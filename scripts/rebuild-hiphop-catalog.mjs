import fs from "fs";
import path from "path";

import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CATALOG = path.join(ROOT, "src/lib/genres/hipHopSoulCatalog.ts");

const BATCH_FILES = [
  "scripts/prompts-trap-drill.json",
  "scripts/prompts-oldschool-regional.json",
  "scripts/prompts-soundcloud-emotional.json",
  "scripts/prompts-tiktok-aesthetic.json",
  "scripts/prompts-rnb-classic.json",
  "scripts/ace-soul-genre-prompts.json",
];

const BANNED = /modern underground pocket|clean mix|polished mix|radio-ready polish|authentic production|modern production/gi;

function parseCatalog(text) {
  const re =
    /g\(\s*\n\s*"([^"]+)",\s*\n\s*"([^"]+)",\s*\n\s*"((?:[^"\\]|\\.)*)",\s*\n\s*"((?:[^"\\]|\\.)*)",\s*\n\s*(\d+),\s*\n\s*(\[[^\]]*\]),?\s*\n\s*\)/gs;
  const out = [];
  let m;
  while ((m = re.exec(text))) {
    out.push({
      value: m[1],
      group: m[2],
      bpm: Number(m[5]),
      sonautoTags: m[6],
    });
  }
  return out;
}

function escapeTs(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function loadPrompts() {
  const merged = {};
  for (const f of BATCH_FILES) {
    const p = path.join(ROOT, f);
    if (!fs.existsSync(p)) {
      console.error("Missing batch file:", f);
      process.exit(1);
    }
    Object.assign(merged, JSON.parse(fs.readFileSync(p, "utf8")));
  }
  return merged;
}

function fixSoundCloudSlug(value, prompt) {
  const slug = value.toLowerCase().replace(/&/g, "&");
  if (prompt.toLowerCase().startsWith(slug.split(" ")[0])) return prompt;
  return `${slug}, ${prompt.charAt(0).toLowerCase()}${prompt.slice(1)}`;
}

const header = `/** Hip-hop, trap, drill, and R&B/soul microgenres — ACE-Step XL 1.5 prompts (musicological). */
import type { ExtendedGenreDef } from "@/lib/genres/extendedCatalog";

function g(
  value: string,
  group: string,
  prompt: string,
  aceTags: string,
  bpm: number,
  sonautoTags: string[] = ["2020s"],
): ExtendedGenreDef {
  return { value, group, prompt, aceTags, bpm, sonautoTags };
}

export const HIP_HOP_SOUL_GENRES: ExtendedGenreDef[] = [
`;

const footer = `];
`;

const prompts = loadPrompts();
const original = fs.readFileSync(CATALOG, "utf8");
const entries = parseCatalog(original);

if (entries.length !== 266) {
  console.error("Expected 266 entries, got", entries.length);
  process.exit(1);
}

const keys = Object.keys(prompts);
if (keys.length < 266) {
  console.error("Prompt map size", keys.length, "< 266");
  process.exit(1);
}

let bad = 0;
const lines = [header];

for (const e of entries) {
  const p = prompts[e.value];
  if (!p?.prompt || !p?.aceTags) {
    console.error("Missing prompt for:", e.value);
    process.exit(1);
  }
  let prompt = p.prompt.trim();
  if (e.group === "SoundCloud / Underground") {
    prompt = fixSoundCloudSlug(e.value, prompt);
  }
  if (BANNED.test(prompt) || BANNED.test(p.aceTags)) {
    console.warn("Banned phrase in:", e.value);
    bad++;
  }
  const words = prompt.split(/\s+/).length;
  if (words < 15 || words > 45) {
    console.warn(`Word count ${words} for ${e.value}`);
  }
  lines.push(
    `  g(\n    "${e.value}",\n    "${e.group}",\n    "${escapeTs(prompt)}",\n    "${escapeTs(p.aceTags.trim())}",\n    ${e.bpm},\n    ${e.sonautoTags},\n  ),`,
  );
}

lines.push(footer);
fs.writeFileSync(CATALOG, lines.join("\n"));
console.log("Wrote", entries.length, "genres,", bad, "banned warnings");
