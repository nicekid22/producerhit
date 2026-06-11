/**
 * Grow phase — app profile, bot nick, language lounges, kickstart posts.
 * Usage: node scripts/discord-grow-community.mjs
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
const appId = (process.env.DISCORD_APPLICATION_ID ?? "").trim();
const guildId = (process.env.DISCORD_GUILD_ID ?? "").trim();
const botId = appId;
const SITE = "https://www.producerhit.com";
const COLOR = 0x7c3aed;
const API = "https://discord.com/api/v10";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

console.log("=== ProducerHit Discord — grow phase ===\n");

// 1. App profile (Developer Portal sync via API)
try {
  await discord(`/applications/${appId}`, {
    method: "PATCH",
    body: JSON.stringify({
      description:
        "Official ProducerHit community — AI songs, type beats & remixes. Free to start · weekly challenges · global producers welcome.",
      tags: ["music", "producer", "ai", "beats", "hiphop"],
    }),
  });
  console.log("✓ App description + tags updated");
} catch (e) {
  console.warn("⚠ App profile:", e instanceof Error ? e.message : e);
}

// 2. Bot display name on server
try {
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
const catCommu = byName("🎵 COMMUNITY");

if (catCommu) {
  try {
    await discord(`/channels/${catCommu.id}`, {
      method: "PATCH",
      body: JSON.stringify({ name: "🌍 GLOBAL" }),
    });
    console.log("✓ Category → GLOBAL");
  } catch {
    /* ok */
  }
}

const LANGUAGE_LOUNGES = [
  { name: "french", topic: "Salon FR — bienvenue aux producteurs francophones · English in #general" },
  { name: "spanish", topic: "Sala ES — productores en español · English in #general" },
  { name: "portuguese", topic: "Sala PT — produtores lusófonos · English in #general" },
];

const createdLang = {};
for (const lounge of LANGUAGE_LOUNGES) {
  if (byName(lounge.name)) {
    createdLang[lounge.name] = byName(lounge.name).id;
    continue;
  }
  try {
    const ch = await discord(`/guilds/${guildId}/channels`, {
      method: "POST",
      body: JSON.stringify({
        name: lounge.name,
        type: 0,
        parent_id: catCommu?.id,
        topic: lounge.topic,
      }),
    });
    createdLang[lounge.name] = ch.id;
    console.log(`✓ Created #${lounge.name}`);
    await sleep(400);
  } catch (e) {
    console.warn(`⚠ #${lounge.name}:`, e instanceof Error ? e.message : e);
  }
}

const ids = {
  welcome: byName("welcome")?.id,
  general: byName("general")?.id,
  showcase: byName("showcase")?.id,
  challenges: byName("weekly-challenge")?.id,
  tips: byName("producer-tips")?.id,
  announcements: byName("announcements")?.id,
  rules: byName("rules")?.id,
};

// 3. Refresh welcome (international)
if (ids.welcome && ids.rules && ids.general && ids.challenges) {
  const fr = createdLang.french ? `<#${createdLang.french}>` : "#french";
  const es = createdLang.spanish ? `<#${createdLang.spanish}>` : "#spanish";
  await sendEmbed(ids.welcome, {
    title: "Welcome — ProducerHit Global Community 🌍",
    description:
      `**English by default** in <#${ids.general}> · All languages welcome.\n\n` +
      `**Start here:**\n` +
      `1. Read <#${ids.rules}>\n` +
      `2. Say hi in <#${ids.general}>\n` +
      `3. Weekly challenge → <#${ids.challenges}>\n` +
      `4. Share public tracks → <#${ids.showcase}>\n\n` +
      `**Language lounges:** ${fr} · ${es}\n\n` +
      `[Create free](${SITE}) · [Go Pro](${SITE}/pricing) · \`/challenge\` \`/rules\` \`/link\``,
  });
  console.log("✓ Welcome refreshed (international)");
}

// 4. Getting started (producer-tips) — pinned content
if (ids.tips) {
  await sendEmbed(ids.tips, {
    title: "Quick start — first beat in 2 minutes",
    description:
      `1. Open [producerhit.com](${SITE}) → pick a genre\n` +
      `2. Generate (free tier = 10 tracks/month)\n` +
      `3. Export 9:16 video → post on TikTok/Reels\n` +
      `4. Make track **public** → share in <#${ids.showcase ?? "showcase"}>\n` +
      `5. Join <#${ids.challenges ?? "weekly-challenge"}> for bonus credits\n\n` +
      `**Upgrade when you hit the limit:** [Pro / Studio](${SITE}/pricing) — no watermark, more gens, stems.`,
  });
  console.log("✓ Producer tips posted");
}

// 5. Kickstart #general (engagement)
if (ids.general) {
  await sendEmbed(
    ids.general,
    {
      title: "👋 Who's making beats today?",
      description:
        `Drop a **public loop link** from ProducerHit or say what genre you're cooking.\n\n` +
        `New here? [Generate free](${SITE}) — trap, R&B, drill, lofi, afrobeats & more.\n` +
        `Hit the free limit? [See Pro plans](${SITE}/pricing) — worth it if you're posting daily.`,
    },
    null,
  );
  console.log("✓ General kickstart posted");
}

// 6. Challenge bump
if (ids.challenges) {
  await sendEmbed(ids.challenges, {
    title: "How to enter the weekly challenge",
    description:
      `1. Generate a track on [ProducerHit](${SITE}) matching this week's theme\n` +
      `2. Set it **public** in your library\n` +
      `3. Post the link here + in <#${ids.showcase ?? "showcase"}>\n` +
      `4. Top 3 win **bonus generation credits** (participation = +3 credits)\n\n` +
      `Theme pinned above ↑ · [Join from the app](${SITE}/community)`,
  });
  console.log("✓ Challenge how-to posted");
}

// Save lounge IDs for future automations
const outPath = "scripts/discord-env-output.json";
let existing = {};
if (existsSync(outPath)) {
  try {
    existing = JSON.parse(readFileSync(outPath, "utf8"));
  } catch {
    existing = {};
  }
}
writeFileSync(
  outPath,
  JSON.stringify({ ...existing, languageLounges: createdLang, locale: "en-US-international" }, null, 2),
);
console.log("\n✅ Grow phase done");
