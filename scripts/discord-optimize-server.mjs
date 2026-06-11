/**
 * Nettoie les salons Nice Kids legacy, structure EN/US, messages conversion.
 * Usage: node scripts/discord-optimize-server.mjs --yes
 */
import { existsSync, readFileSync, writeFileSync } from "fs";

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
const dryRun = process.argv.includes("--dry-run");
const confirmed = process.argv.includes("--yes") || process.env.DISCORD_RESET_CONFIRM === "1";

if (!token || !guildId) {
  console.error("DISCORD_BOT_TOKEN + DISCORD_GUILD_ID requis");
  process.exit(1);
}
if (!dryRun && !confirmed) {
  console.error("Ajoute --yes pour confirmer la suppression des salons legacy.");
  process.exit(1);
}

const API = "https://discord.com/api/v10";
const SITE = "https://www.producerhit.com";
const COLOR = 0x7c3aed;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const KEEP_PREFIX = "ph-";
const KEEP_CAT = "PRODUCERHIT";

const RENAME_CHANNELS = {
  "ph-welcome": "welcome",
  "ph-rules": "rules",
  "ph-announcements": "announcements",
  "ph-general": "general",
  "ph-showcase": "showcase",
  "ph-challenges": "weekly-challenge",
  "ph-feedback": "feedback",
  "ph-tips-studio": "producer-tips",
  "ph-support": "support",
};

const RENAME_CATEGORIES = {
  "📢 PRODUCERHIT INFO": "📢 INFO",
  "🎵 PRODUCERHIT COMMU": "🎵 COMMUNITY",
  "💎 PRODUCERHIT STUDIO": "💎 STUDIO",
};

const ROLES_KEEP = new Set(["@everyone", "ADMIN", "Membre", "Member", "Pro", "Creator", "Nice Kids Bot"]);

async function discord(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
      ...(opts.headers ?? {}),
    },
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 300) };
  }
  if (!res.ok) {
    throw new Error(`${opts.method ?? "GET"} ${path} → ${res.status}: ${json?.message ?? text.slice(0, 120)}`);
  }
  return json;
}

function shouldKeepChannel(ch) {
  if (ch.name?.startsWith(KEEP_PREFIX)) return true;
  if (ch.name?.includes(KEEP_CAT)) return true;
  if (Object.values(RENAME_CHANNELS).includes(ch.name)) return true;
  if (Object.values(RENAME_CATEGORIES).includes(ch.name)) return true;
  return false;
}

async function deleteLegacyChannels(channels) {
  const legacy = channels.filter((c) => !shouldKeepChannel(c));
  console.log(`Suppression ${legacy.length} salons legacy…`);
  for (const ch of legacy) {
    if (dryRun) {
      console.log(`  [dry] #${ch.name}`);
      continue;
    }
    try {
      await discord(`/channels/${ch.id}`, { method: "DELETE" });
      console.log(`  ✓ #${ch.name}`);
    } catch (e) {
      console.warn(`  ⚠ #${ch.name}: ${e instanceof Error ? e.message : e}`);
    }
    await sleep(300);
  }
}

async function deleteLegacyRoles(roles) {
  const toDelete = roles.filter(
    (r) => r.name !== "@everyone" && !r.managed && !ROLES_KEEP.has(r.name) && r.id !== guildId,
  );
  console.log(`Suppression ${toDelete.length} rôles legacy…`);
  for (const role of toDelete.sort((a, b) => a.position - b.position)) {
    if (dryRun) {
      console.log(`  [dry] ${role.name}`);
      continue;
    }
    try {
      await discord(`/guilds/${guildId}/roles/${role.id}`, { method: "DELETE" });
      console.log(`  ✓ ${role.name}`);
    } catch (e) {
      console.warn(`  ⚠ ${role.name}: ${e instanceof Error ? e.message : e}`);
    }
    await sleep(250);
  }
}

async function ensureRole(name, color) {
  const roles = await discord(`/guilds/${guildId}/roles`);
  const existing = roles.find((r) => r.name === name);
  if (existing) return existing;
  if (dryRun) return { id: `dry-${name}`, name };
  return discord(`/guilds/${guildId}/roles`, {
    method: "POST",
    body: JSON.stringify({ name, color, hoist: false, mentionable: false }),
  });
}

async function patchGuild() {
  if (dryRun) return;
  await discord(`/guilds/${guildId}`, {
    method: "PATCH",
    body: JSON.stringify({
      name: "ProducerHit",
      description: "Official community — AI songs, type beats & remixes. Free to start → producerhit.com",
      preferred_locale: "en-US",
    }),
  });
  console.log("✓ Serveur → ProducerHit (en-US)");
}

async function renameStructure(channels) {
  for (const ch of channels) {
    const newCat = RENAME_CATEGORIES[ch.name];
    const newName = RENAME_CHANNELS[ch.name];
    const target = newCat ?? newName;
    if (!target || ch.name === target) continue;
    if (dryRun) {
      console.log(`  [dry] rename #${ch.name} → ${target}`);
      continue;
    }
    await discord(`/channels/${ch.id}`, {
      method: "PATCH",
      body: JSON.stringify({ name: target }),
    });
    console.log(`  ✓ #${ch.name} → ${target}`);
    await sleep(200);
  }
}

async function sendEmbed(channelId, embed, content) {
  if (dryRun) return null;
  return discord(`/channels/${channelId}/messages`, {
    method: "POST",
    body: JSON.stringify({
      ...(content ? { content } : {}),
      embeds: [{ color: COLOR, ...embed }],
    }),
  });
}

async function pin(channelId, messageId) {
  if (dryRun || !messageId) return;
  await discord(`/channels/${channelId}/pins/${messageId}`, { method: "PUT" });
}

async function postConversionContent(ids) {
  const { welcome, rules, announcements, general, challenges, showcase } = ids;

  const welcomeMsg = await sendEmbed(
    welcome,
    {
      title: "Welcome to ProducerHit 🎵",
      description:
        `**Make beats & songs with AI — free to start.**\n\n` +
        `→ [Create your first track](${SITE})\n` +
        `→ [See plans (Pro / Studio)](${SITE}/pricing)\n\n` +
        `**Start here:**\n` +
        `1. Read <#${rules}>\n` +
        `2. Say hi in <#${general}>\n` +
        `3. Join the weekly challenge in <#${challenges}>\n` +
        `4. Share public loops in <#${showcase}>\n\n` +
        `Commands: \`/challenge\` · \`/rules\` · \`/link\``,
    },
    null,
  );
  await pin(welcome, welcomeMsg?.id);

  const rulesMsg = await sendEmbed(rules, {
    title: "Community rules",
    description:
      `• Be respectful — help each other grow\n` +
      `• **#showcase** = public ProducerHit loops only\n` +
      `• 1 challenge entry per week\n` +
      `• Commercial use: [license](${SITE}/legal#commercial-license)\n` +
      `• Support: info.producermarket@gmail.com`,
  });
  await pin(rules, rulesMsg?.id);

  await sendEmbed(
    announcements,
    {
      title: "ProducerHit Discord is live 🚀",
      description:
        `This server is now the **official ProducerHit community** (US / global producers).\n\n` +
        `**Free tier:** 10 AI generations/month — [start free](${SITE})\n` +
        `**Pro:** more gens, no watermark, stems — [pricing](${SITE}/pricing)\n\n` +
        `Weekly beat challenges with **bonus credits** for winners. First challenge in <#${challenges}>.`,
    },
    "@everyone",
  );

  console.log("✓ Messages welcome / rules / launch postés");
}

async function createInvite(generalId) {
  if (dryRun) return "https://discord.gg/dry-run";
  const inv = await discord(`/channels/${generalId}/invites`, {
    method: "POST",
    body: JSON.stringify({ max_age: 0, max_uses: 0, unique: true }),
  });
  return `https://discord.gg/${inv.code}`;
}

function patchDotEnv(updates) {
  if (dryRun) return;
  let content = readFileSync(".env", "utf8");
  for (const [key, value] of Object.entries(updates)) {
    if (!value) continue;
    const line = `${key}=${value}`;
    const re = new RegExp(`^${key}=.*$`, "m");
    content = re.test(content) ? content.replace(re, line) : `${content.trimEnd()}\n${line}\n`;
  }
  writeFileSync(".env", content.endsWith("\n") ? content : `${content}\n`);
}

async function main() {
  console.log(`Optimisation serveur ${guildId}${dryRun ? " [dry-run]" : ""}\n`);

  let channels = await discord(`/guilds/${guildId}/channels`);
  await deleteLegacyChannels(channels);
  channels = await discord(`/guilds/${guildId}/channels`);

  const roles = await discord(`/guilds/${guildId}/roles`);
  await deleteLegacyRoles(roles);

  await patchGuild();
  await renameStructure(channels);
  channels = await discord(`/guilds/${guildId}/channels`);

  await ensureRole("Member", 0x5865f2);
  await ensureRole("Pro", 0x22c55e);
  await ensureRole("Creator", 0xa855f7);

  const byName = (n) => channels.find((c) => c.name === n)?.id;
  const ids = {
    welcome: byName("welcome"),
    rules: byName("rules"),
    announcements: byName("announcements"),
    general: byName("general"),
    challenges: byName("weekly-challenge"),
    showcase: byName("showcase"),
  };

  for (const [k, v] of Object.entries(ids)) {
    if (!v) {
      console.error(`Salon manquant après rename: ${k}`);
      process.exit(1);
    }
  }

  await postConversionContent(ids);
  const inviteUrl = await createInvite(ids.general);

  const setup = { guildId, inviteUrl, channels: ids, locale: "en-US" };
  writeFileSync("scripts/discord-env-output.json", JSON.stringify(setup, null, 2));

  patchDotEnv({
    DISCORD_CHANNEL_WELCOME: ids.welcome,
    DISCORD_CHANNEL_ANNOUNCEMENTS: ids.announcements,
    DISCORD_CHANNEL_CHALLENGES: ids.challenges,
    DISCORD_CHANNEL_SHOWCASE: ids.showcase,
    VITE_DISCORD_INVITE_URL: inviteUrl,
  });

  console.log("\n✅ Optimisation terminée");
  console.log("Invite:", inviteUrl);
  console.log("Channels:", ids);
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
