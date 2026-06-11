/** Masque salons legacy Community + purge rôles NFT restants. */
import { existsSync, readFileSync } from "fs";

function loadDotEnv() {
  if (!existsSync(".env")) return;
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (!(k in process.env)) process.env[k] = v;
  }
}

loadDotEnv();

const token = (process.env.DISCORD_BOT_TOKEN ?? "").trim();
const guildId = (process.env.DISCORD_GUILD_ID ?? "").trim();
const API = "https://discord.com/api/v10";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const KEEP_ROLES = new Set([
  "@everyone",
  "ADMIN",
  "admin",
  "Membre",
  "Member",
  "Pro",
  "Creator",
  "Nice Kids Bot",
  "Server Booster",
]);

const HIDE_CHANNELS = ["📖┃rules", "💬┃staff-general"];

async function discord(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json", ...(opts.headers ?? {}) },
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = {};
  }
  if (!res.ok) throw new Error(`${path} → ${res.status}: ${json?.message ?? text.slice(0, 100)}`);
  return json;
}

const channels = await discord(`/guilds/${guildId}/channels`);
for (const name of HIDE_CHANNELS) {
  const ch = channels.find((c) => c.name === name);
  if (!ch) continue;
  try {
    await discord(`/channels/${ch.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: name.includes("rules") ? "archive-rules" : "archive-staff",
        topic: "Archived — use #rules in INFO category",
        permission_overwrites: [{ id: guildId, type: 0, allow: "0", deny: "1024" }],
      }),
    });
    console.log(`✓ Hidden #${name}`);
  } catch (e) {
    console.warn(`⚠ #${name}:`, e.message);
  }
}

const roles = await discord(`/guilds/${guildId}/roles`);
const legacy = roles.filter((r) => !r.managed && !KEEP_ROLES.has(r.name) && r.id !== guildId);
console.log(`Deleting ${legacy.length} legacy roles…`);
for (const role of legacy.sort((a, b) => a.position - b.position)) {
  try {
    await discord(`/guilds/${guildId}/roles/${role.id}`, { method: "DELETE" });
    console.log(`  ✓ ${role.name}`);
  } catch (e) {
    console.warn(`  ⚠ ${role.name}`);
  }
  await sleep(1100);
}

// EN slash commands
const appId = process.env.DISCORD_APPLICATION_ID;
await discord(`/applications/${appId}/commands`, {
  method: "PUT",
  body: JSON.stringify([
    { name: "challenge", description: "Current weekly beat challenge" },
    { name: "rules", description: "Community rules & commercial license" },
    { name: "link", description: "ProducerHit links — create free or upgrade" },
  ]),
});
console.log("✓ Slash commands (EN)");
