import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CATALOG = path.join(ROOT, "src/lib/genres/extendedCatalog.ts");
const PROMPTS_FILE = path.join(ROOT, "scripts/prompts-extended-all.json");

const BANNED =
  /modern underground pocket|clean mix|polished mix|radio-ready polish|authentic production|modern production|festival polish|clean modern mix|polished modern mix|wide mix$/i;

const SECTION_COMMENTS = {
  "Liquid DnB": "// ── DnB / Breaks ──",
  "Future Bass": "// ── Electronic / Club ──",
  "Cyberpunk": "// ── Pop / Rock / Indie ──",
  "Cinematic Ambient": "// ── Ambient / Cinematic ──",
  "Jazzhop": "// ── Jazz / World / Funk ──",
  HexD: "// ── Internet / Aesthetic ──",
  "Luxury Lounge": "// ── Lifestyle / Vibe ──",
  "Hyperpop 2.0": "// ── Internet / Gen Z / Underground ──",
  "Drift Phonk": "// ── TikTok / Viral / Edit ──",
  "Drum & Bass Revival": "// ── Global / Rising ──",
  "Nostalgic Future": "// ── Aesthetic / Mood ──",
  "Sleep Ambient": "// ── Creator / Playlist ──",
  Opium: "// ── Underground Artist 2026 ──",
};

const FOOTER = `  ...HIP_HOP_SOUL_GENRES,
];

export const EXTENDED_GENRE_VALUES = new Set(EXTENDED_GENRES.map((x) => x.value));

export function extendedGenrePromptMap(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const item of EXTENDED_GENRES) out[item.value] = item.prompt;
  return out;
}

export function extendedGenreAceTagMap(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const item of EXTENDED_GENRES) out[item.value] = item.aceTags;
  return out;
}

export function extendedGenreBpmMap(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const item of EXTENDED_GENRES) out[item.value] = item.bpm;
  return out;
}

export function extendedGenreSonautoMap(): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const item of EXTENDED_GENRES) out[item.value] = item.sonautoTags;
  return out;
}

export function extendedGenreDropdownOptions(): { group: string; value: string; label: string }[] {
  return EXTENDED_GENRES.map((item) => ({
    group: item.group,
    value: item.value,
    label: item.label ?? item.value,
  }));
}
`;

function parseCatalog(text) {
  const re =
    /g\(\s*\n\s*"([^"]+)",\s*\n\s*"([^"]+)",\s*\n\s*"((?:[^"\\]|\\.)*)",\s*\n\s*"((?:[^"\\]|\\.)*)",\s*\n\s*(\d+),\s*\n\s*(\[[^\]]*\]),?\s*\n\s*\)/gs;
  const out = [];
  let m;
  while ((m = re.exec(text))) {
    if (m[1].startsWith("preview-")) continue;
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
  if (!fs.existsSync(PROMPTS_FILE)) {
    console.error("Missing:", PROMPTS_FILE, "— run: node scripts/merge-ext-json.mjs");
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(PROMPTS_FILE, "utf8"));
}

const prompts = loadPrompts();
const original = fs.readFileSync(CATALOG, "utf8");
const entries = parseCatalog(original).filter((e) => !e.value.startsWith("local-"));

if (entries.length !== 182) {
  console.error("Expected 182 entries, got", entries.length);
  process.exit(1);
}

const keys = Object.keys(prompts);
if (keys.length !== 182) {
  console.error("Prompt keys", keys.length, "expected 182");
  const missing = entries.filter((e) => !prompts[e.value]).map((e) => e.value);
  const extra = keys.filter((k) => !entries.find((e) => e.value === k));
  if (missing.length) console.error("Missing:", missing.join(", "));
  if (extra.length) console.error("Extra:", extra.join(", "));
  process.exit(1);
}

const header = `/** Extended genre catalog — ACE-Step XL 1.5 prompts (musicological). */
import { HIP_HOP_SOUL_GENRES } from "@/lib/genres/hipHopSoulCatalog";

export type ExtendedGenreDef = {
  value: string;
  label?: string;
  group: string;
  prompt: string;
  aceTags: string;
  bpm: number;
  sonautoTags: string[];
};

function g(
  value: string,
  group: string,
  prompt: string,
  aceTags: string,
  bpm: number,
  sonautoTags: string[] = ["2020s", "instrumental"],
): ExtendedGenreDef {
  return { value, group, prompt, aceTags, bpm, sonautoTags };
}

export const EXTENDED_GENRES: ExtendedGenreDef[] = [
`;

let bad = 0;
const lines = [header];

for (const e of entries) {
  const p = prompts[e.value];
  if (!p?.prompt || !p?.aceTags) {
    console.error("Missing prompt for:", e.value);
    process.exit(1);
  }
  const comment = SECTION_COMMENTS[e.value];
  if (comment) {
    lines.push("");
    lines.push(`  ${comment}`);
  }
  if (BANNED.test(p.prompt) || BANNED.test(p.aceTags)) {
    console.warn("Banned:", e.value);
    bad++;
  }
  lines.push(
    `  g(\n    "${e.value}",\n    "${e.group}",\n    "${escapeTs(p.prompt.trim())}",\n    "${escapeTs(p.aceTags.trim())}",\n    ${e.bpm},\n    ${e.sonautoTags},\n  ),`,
  );
}

lines.push(FOOTER);

fs.writeFileSync(CATALOG, lines.join("\n"));
console.log("Wrote", entries.length, "genres, banned warnings:", bad);
