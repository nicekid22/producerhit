/**
 * Diagnostic Discord ProducerHit — token, serveurs, config locale.
 * Usage: node scripts/discord-check.mjs
 */
import { existsSync, readFileSync } from "fs";

function loadDotEnv() {
  if (!existsSync(".env")) return;
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i <= 0) continue;
    const key = trimmed.slice(0, i).trim();
    let val = trimmed.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

loadDotEnv();

const token = (process.env.DISCORD_BOT_TOKEN ?? "").trim();
const appId = (process.env.DISCORD_APPLICATION_ID ?? "1514605136259846154").trim();
const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${appId}&permissions=8&scope=bot+applications.commands`;

const checks = [
  ["DISCORD_BOT_TOKEN", token],
  ["DISCORD_GUILD_ID", process.env.DISCORD_GUILD_ID ?? ""],
  ["DISCORD_CHANNEL_CHALLENGES", process.env.DISCORD_CHANNEL_CHALLENGES ?? ""],
  ["VITE_DISCORD_INVITE_URL", process.env.VITE_DISCORD_INVITE_URL ?? ""],
];

console.log("=== ProducerHit Discord — diagnostic ===\n");

for (const [key, val] of checks) {
  const ok = val.length > 0;
  console.log(`${ok ? "✓" : "○"} ${key}${ok ? "" : " (vide)"}`);
}

if (!token) {
  console.error("\n❌ DISCORD_BOT_TOKEN manquant dans .env");
  process.exit(1);
}

const meRes = await fetch("https://discord.com/api/v10/users/@me", {
  headers: { Authorization: `Bot ${token}` },
});
if (!meRes.ok) {
  console.error("\n❌ Token invalide:", meRes.status, await meRes.text());
  process.exit(1);
}
const me = await meRes.json();
console.log(`\nBot: ${me.username} (${me.id})`);

const guildsRes = await fetch("https://discord.com/api/v10/users/@me/guilds", {
  headers: { Authorization: `Bot ${token}` },
});
const guilds = await guildsRes.json();

if (!Array.isArray(guilds) || guilds.length === 0) {
  console.log("\n❌ Le bot n'est sur AUCUN serveur Discord.");
  console.log("\n→ Étape requise : ouvre ce lien et choisis ton serveur ProducerHit :\n");
  console.log(`   ${inviteUrl}\n`);
  console.log("Puis relance : node scripts/discord-setup-server.mjs --yes");
  process.exit(2);
}

console.log(`\n✓ Serveurs (${guilds.length}) :`);
for (const g of guilds) console.log(`  • ${g.name} — id=${g.id}`);

const targetGuild = (process.env.DISCORD_GUILD_ID ?? "").trim();
if (targetGuild && !guilds.some((g) => g.id === targetGuild)) {
  console.log(`\n❌ DISCORD_GUILD_ID=${targetGuild} — le bot n'est pas sur ce serveur.`);
  console.log(`\n→ Invite Nice Kids Bot sur le bon serveur :\n   ${inviteUrl}\n`);
  process.exit(3);
}

if (targetGuild) {
  console.log(`\n✓ Serveur cible OK : ${targetGuild}`);
}

const hasSetup = (process.env.DISCORD_CHANNEL_CHALLENGES ?? "").trim();
if (!hasSetup) {
  console.log("\n→ Prochaine étape : node scripts/discord-setup-server.mjs --yes");
} else {
  console.log("\n✓ Channels configurés localement — pense à sync les secrets Supabase (voir discord-env-output.json)");
}
