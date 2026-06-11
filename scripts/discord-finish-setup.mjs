/**
 * Finalise .env + discord-env-output.json après création des salons ph-*.
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { randomUUID } from "crypto";

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
if (!token || !guildId) {
  console.error("DISCORD_BOT_TOKEN et DISCORD_GUILD_ID requis");
  process.exit(1);
}

const API = "https://discord.com/api/v10";
const h = { Authorization: `Bot ${token}`, "Content-Type": "application/json" };

const channels = await fetch(`${API}/guilds/${guildId}/channels`, { headers: h }).then((r) => r.json());
const byName = (n) => channels.find((c) => c.name === n)?.id;

const ids = {
  welcome: byName("ph-welcome"),
  announcements: byName("ph-announcements"),
  challenges: byName("ph-challenges"),
  showcase: byName("ph-showcase"),
};

for (const [k, v] of Object.entries(ids)) {
  if (!v) {
    console.error(`Salon ph-${k === "welcome" ? "welcome" : k} introuvable — relance discord-setup-server.mjs --additive`);
    process.exit(1);
  }
}

const generalId = byName("ph-general");
const inv = await fetch(`${API}/channels/${generalId}/invites`, {
  method: "POST",
  headers: h,
  body: JSON.stringify({ max_age: 0, max_uses: 0, unique: true }),
}).then((r) => r.json());

if (!inv.code) {
  console.error("Invite failed:", inv);
  process.exit(1);
}

const inviteUrl = `https://discord.gg/${inv.code}`;
const cronSecret = (process.env.DISCORD_CRON_SECRET ?? "").trim() || randomUUID().replace(/-/g, "");

const setup = { guildId, inviteUrl, channels: ids, cronSecret };
writeFileSync("scripts/discord-env-output.json", JSON.stringify(setup, null, 2));

const updates = {
  DISCORD_GUILD_ID: guildId,
  DISCORD_CHANNEL_WELCOME: ids.welcome,
  DISCORD_CHANNEL_ANNOUNCEMENTS: ids.announcements,
  DISCORD_CHANNEL_CHALLENGES: ids.challenges,
  DISCORD_CHANNEL_SHOWCASE: ids.showcase,
  VITE_DISCORD_INVITE_URL: inviteUrl,
  DISCORD_CRON_SECRET: cronSecret,
};

let content = readFileSync(".env", "utf8");
for (const [key, val] of Object.entries(updates)) {
  const line = `${key}=${val}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  content = re.test(content) ? content.replace(re, line) : `${content.trimEnd()}\n${line}\n`;
}
writeFileSync(".env", content.endsWith("\n") ? content : `${content}\n`);

console.log("✅ .env + discord-env-output.json mis à jour");
console.log("Invite:", inviteUrl);
console.log("Challenges channel:", ids.challenges);
console.log("DISCORD_CRON_SECRET (ajoute aussi dans Supabase secrets):", cronSecret);
