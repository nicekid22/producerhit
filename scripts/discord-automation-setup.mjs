/**
 * Configure Discord guild for hands-free automation (welcome screen, community, bot role).
 * Usage: node scripts/discord-automation-setup.mjs
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
    if (!(k in process.env)) process.env[k] = t.slice(i + 1).trim();
  }
}

loadDotEnv();

const token = (process.env.DISCORD_BOT_TOKEN ?? "").trim();
const appId = (process.env.DISCORD_APPLICATION_ID ?? "").trim();
const guildId = (process.env.DISCORD_GUILD_ID ?? "").trim();
const botId = appId;
const SITE = "https://www.producerhit.com";
const API = "https://discord.com/api/v10";
const ADMIN = (1n << 0n).toString();
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

console.log("=== ProducerHit Discord — full automation setup ===\n");

const channels = await discord(`/guilds/${guildId}/channels`);
const byName = (n) => channels.find((c) => c.name === n && c.type === 0);
const ids = {
  welcome: byName("welcome")?.id,
  rules: byName("rules")?.id,
  general: byName("general")?.id,
  challenges: byName("weekly-challenge")?.id,
  showcase: byName("showcase")?.id,
  tips: byName("producer-tips")?.id,
};

// 1. Guild profile + system channels
try {
  await discord(`/guilds/${guildId}`, {
    method: "PATCH",
    body: JSON.stringify({
      description:
        "Official ProducerHit community 🌍 AI songs, type beats & remixes. English default · weekly challenges · global producers.",
      system_channel_id: ids.welcome ?? null,
      system_channel_flags: 13,
    }),
  });
  console.log("✓ Guild description + system welcome channel");
} catch (e) {
  console.warn("⚠ Guild patch:", e instanceof Error ? e.message : e);
}

// 2. Community welcome screen (shown to new members automatically)
if (ids.welcome && ids.rules && ids.general && ids.challenges) {
  try {
    await discord(`/guilds/${guildId}/welcome-screen`, {
      method: "PATCH",
      body: JSON.stringify({
        enabled: true,
        description:
          "Welcome to **ProducerHit Global** — create AI beats free, join weekly challenges, share public loops.",
        welcome_channels: [
          { channel_id: ids.rules, description: "Community rules & license", emoji_name: "📜" },
          { channel_id: ids.general, description: "Say hi — English default, all languages OK", emoji_name: "👋" },
          { channel_id: ids.challenges, description: "Weekly beat challenge + bonus credits", emoji_name: "🎯" },
          { channel_id: ids.showcase, description: "Share your public tracks", emoji_name: "🎵" },
        ],
      }),
    });
    console.log("✓ Welcome screen enabled (auto for new members)");
  } catch (e) {
    console.warn("⚠ Welcome screen:", e instanceof Error ? e.message : e);
  }
}

// 3. Bot role — Administrator at high position
try {
  const roles = await discord(`/guilds/${guildId}/roles`);
  const member = await discord(`/guilds/${guildId}/members/${botId}`);
  const botRole = roles.find((r) => member.roles.includes(r.id) && !r.managed && r.name !== "@everyone");
  const adminRole = roles.find((r) => r.name.toUpperCase() === "ADMIN");

  const target = botRole ?? adminRole;
  if (target) {
    await discord(`/guilds/${guildId}/roles/${target.id}`, {
      method: "PATCH",
      body: JSON.stringify({ permissions: ADMIN, hoist: true, name: "ProducerHit Bot" }),
    });
    const maxPos = Math.max(...roles.filter((r) => !r.managed && r.id !== guildId).map((r) => r.position), 1);
    if (target.position < maxPos) {
      await discord(`/guilds/${guildId}/roles/${target.id}`, {
        method: "PATCH",
        body: JSON.stringify({ position: maxPos }),
      });
    }
    console.log("✓ Bot role → Administrator + top position");
  }

  await discord(`/guilds/${guildId}/members/${botId}`, {
    method: "PATCH",
    body: JSON.stringify({ nick: "ProducerHit" }),
  });
  console.log("✓ Bot nickname → ProducerHit");
} catch (e) {
  console.warn("⚠ Bot role/nick:", e instanceof Error ? e.message : e);
}

// 4. Bot global username (Developer Portal sync)
try {
  await discord(`/users/@me`, {
    method: "PATCH",
    body: JSON.stringify({ username: "ProducerHit Bot" }),
  });
  console.log("✓ Bot username updated");
} catch (e) {
  console.warn("⚠ Bot username:", e instanceof Error ? e.message : e);
}

// 5. Slash commands
await discord(`/applications/${appId}/commands`, {
  method: "PUT",
  body: JSON.stringify([
    { name: "challenge", description: "Current weekly beat challenge" },
    { name: "rules", description: "Community rules & commercial license" },
    { name: "link", description: "ProducerHit links — create free or upgrade" },
    { name: "tip", description: "Random producer tip of the day" },
    { name: "spotlight", description: "Latest public track from the community" },
  ]),
});
console.log("✓ Slash commands (5)");

// 6. Trigger automations now (immediate life)
const secret = (process.env.DISCORD_CRON_SECRET ?? "").trim();
const supabaseUrl = (process.env.VITE_SUPABASE_URL ?? "").trim().replace(/\/$/, "");
if (secret && supabaseUrl) {
  const actions = ["daily_pulse", "daily_tip", "showcase_spotlight", "member_welcome"];
  for (const action of actions) {
    const res = await fetch(`${supabaseUrl}/functions/v1/discord-cron`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-discord-cron-secret": secret },
      body: JSON.stringify({ action }),
    });
    console.log(`✓ Cron ${action} → ${res.status}`, (await res.text()).slice(0, 80));
    await sleep(500);
  }
}

console.log("\n✅ Automation setup complete — server runs on Supabase pg_cron (no manual action needed)");
