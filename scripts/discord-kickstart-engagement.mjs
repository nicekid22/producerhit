/**
 * Quick engagement — bot nick, pin essentials, launch announcement, slash cmds, cron.
 * Usage: node scripts/discord-kickstart-engagement.mjs
 */
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
const appId = (process.env.DISCORD_APPLICATION_ID ?? "").trim();
const guildId = (process.env.DISCORD_GUILD_ID ?? "").trim();
const botId = appId;
const SITE = "https://www.producerhit.com";
const COLOR = 0x7c3aed;
const API = "https://discord.com/api/v10";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MANAGE_NICKNAMES = 1n << 27n;

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
    json = { raw: text.slice(0, 300) };
  }
  if (!res.ok) throw new Error(`${opts.method ?? "GET"} ${path} → ${res.status}: ${json?.message ?? text.slice(0, 120)}`);
  return json;
}

async function sendEmbed(channelId, embed, content) {
  return discord(`/channels/${channelId}/messages`, {
    method: "POST",
    body: JSON.stringify({ ...(content ? { content } : {}), embeds: [{ color: COLOR, ...embed }] }),
  });
}

async function pinLatestBotEmbed(channelId, label) {
  const msgs = await discord(`/channels/${channelId}/messages?limit=15`);
  const hit = msgs.find((m) => m.author?.id === botId && m.embeds?.length);
  if (!hit) {
    console.warn(`⚠ No bot embed to pin in ${label}`);
    return;
  }
  await discord(`/channels/${channelId}/pins/${hit.id}`, { method: "PUT" });
  console.log(`✓ Pinned ${label}`);
  await sleep(350);
}

console.log("=== ProducerHit Discord — kickstart engagement ===\n");

// 1. Bot role — ensure Manage Nicknames, then set nick
try {
  const member = await discord(`/guilds/${guildId}/members/${botId}`);
  const roles = await discord(`/guilds/${guildId}/roles`);
  const botRole = roles.find((r) => member.roles.includes(r.id) && r.name.toLowerCase().includes("producerhit"));
  const adminRole = roles.find((r) => r.name.toUpperCase() === "ADMIN" && member.roles.includes(r.id));
  const targetRole = botRole ?? adminRole;

  if (targetRole) {
    const perms = BigInt(targetRole.permissions);
    if ((perms & MANAGE_NICKNAMES) === 0n) {
      await discord(`/guilds/${guildId}/roles/${targetRole.id}`, {
        method: "PATCH",
        body: JSON.stringify({ permissions: (perms | MANAGE_NICKNAMES).toString() }),
      });
      console.log(`✓ Added Manage Nicknames → ${targetRole.name}`);
      await sleep(400);
    }
  }

  await discord(`/guilds/${guildId}/members/${botId}`, {
    method: "PATCH",
    body: JSON.stringify({ nick: "ProducerHit" }),
  });
  console.log("✓ Bot nickname → ProducerHit");
} catch (e) {
  console.warn("⚠ Bot nick:", e instanceof Error ? e.message : e);
}

const channels = await discord(`/guilds/${guildId}/channels`);
const byName = (n) => channels.find((c) => c.name === n);
const ids = {
  welcome: byName("welcome")?.id,
  rules: byName("rules")?.id,
  general: byName("general")?.id,
  challenges: byName("weekly-challenge")?.id,
  tips: byName("producer-tips")?.id,
  announcements: byName("announcements")?.id,
  french: byName("french")?.id,
  spanish: byName("spanish")?.id,
};

// 2. Rules refresh (international)
if (ids.rules && ids.general && ids.challenges) {
  await sendEmbed(ids.rules, {
    title: "Community rules",
    description:
      `**Be cool** — respect all producers worldwide.\n\n` +
      `**Channels**\n` +
      `• <#${ids.general}> — English default, all topics\n` +
      `• <#${ids.french ?? "french"}> · <#${ids.spanish ?? "spanish"}> — language lounges\n` +
      `• <#${ids.challenges}> — weekly challenge entries\n` +
      `• Showcase — public loops only\n\n` +
      `**Challenge:** 1 entry/week · public track required\n` +
      `**License:** [Commercial terms](${SITE}/legal#commercial-license)\n` +
      `**Free tier:** 10 gens/mo → [Pro](${SITE}/pricing) for daily posting`,
  });
  console.log("✓ Rules refreshed");
}

// 3. Launch announcement
if (ids.announcements && ids.general && ids.challenges) {
  await sendEmbed(
    ids.announcements,
    {
      title: "🌍 ProducerHit Discord is live",
      description:
        `Official **global** community — English by default, all languages welcome.\n\n` +
        `**Start:** <#${ids.welcome ?? "welcome"}> → say hi in <#${ids.general}>\n` +
        `**Weekly challenge:** <#${ids.challenges}> — bonus credits for top 3\n` +
        `**Create free:** [producerhit.com](${SITE}) · **Upgrade:** [Pricing](${SITE}/pricing)\n\n` +
        `Commands: \`/challenge\` \`/rules\` \`/link\``,
    },
    "@everyone",
  );
  console.log("✓ Launch announcement posted");
}

// 4. Pin key messages
for (const [label, id] of [
  ["welcome", ids.welcome],
  ["producer-tips", ids.tips],
  ["weekly-challenge", ids.challenges],
  ["general", ids.general],
  ["rules", ids.rules],
]) {
  if (id) await pinLatestBotEmbed(id, label);
}

// 5. Slash commands (EN)
await discord(`/applications/${appId}/commands`, {
  method: "PUT",
  body: JSON.stringify([
    { name: "challenge", description: "Current weekly beat challenge" },
    { name: "rules", description: "Community rules & commercial license" },
    { name: "link", description: "ProducerHit links — create free or upgrade" },
  ]),
});
console.log("✓ Slash commands synced");

// 6. Trigger weekly challenge cron
const secret = (process.env.DISCORD_CRON_SECRET ?? "").trim();
const supabaseUrl = (process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "").trim().replace(/\/$/, "");
if (secret && supabaseUrl) {
  const res = await fetch(`${supabaseUrl}/functions/v1/discord-cron`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-discord-cron-secret": secret },
    body: JSON.stringify({ action: "start_weekly" }),
  });
  console.log(`✓ Cron start_weekly → ${res.status}`, (await res.text()).slice(0, 120));
} else {
  console.warn("⚠ Skip cron — missing DISCORD_CRON_SECRET or SUPABASE_URL");
}

console.log("\n✅ Kickstart done");
