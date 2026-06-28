/** Restaure ACE_STEP_API_KEYS depuis .env local → Supabase secrets */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

function loadDotEnv() {
  if (!existsSync(".env")) throw new Error("Missing .env");
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    process.env[k] = v;
  }
}

loadDotEnv();

function splitKeys(raw) {
  if (!raw?.trim()) return [];
  return raw.split(/[,;\s]+/).map((k) => k.trim()).filter((k) => k.length >= 8);
}

const merged = [];
for (const k of splitKeys(process.env.ACE_STEP_API_KEYS ?? "")) {
  if (!merged.includes(k)) merged.push(k);
}
const k1 = (process.env.ACE_STEP_API_KEY ?? "").trim();
if (k1 && !merged.includes(k1)) merged.push(k1);

if (!merged.length) {
  console.error("No ACE keys in .env");
  process.exit(1);
}

const ref = "pmfnzenqemnonpglmjqx";
execFileSync("supabase", ["secrets", "set", `ACE_STEP_API_KEYS=${merged.join(",")}`, "--project-ref", ref], {
  stdio: "inherit",
});
execFileSync("supabase", ["secrets", "set", `ACE_STEP_API_KEY=${merged[0]}`, "--project-ref", ref], {
  stdio: "inherit",
});
console.log(`✓ Restored ${merged.length} ACE key(s) on Supabase.`);
