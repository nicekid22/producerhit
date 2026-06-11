/** Poste les embeds de bienvenue dans ph-welcome et ph-rules (une fois). */
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
const COLOR = 0x7c3aed;

async function discord(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { Authorization: `Bot ${token}`, "Content-Type": "application/json", ...(opts.headers ?? {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path} → ${res.status}: ${json.message ?? JSON.stringify(json)}`);
  return json;
}

const channels = await discord(`/guilds/${guildId}/channels`);
const byName = (n) => channels.find((c) => c.name === n)?.id;
const welcomeId = byName("ph-welcome");
const rulesId = byName("ph-rules");
const generalId = byName("ph-general");
const challengesId = byName("ph-challenges");

if (!welcomeId || !rulesId) {
  console.error("Salons ph-welcome / ph-rules introuvables");
  process.exit(1);
}

const welcomeEmbed = {
  embeds: [
    {
      title: "Bienvenue sur ProducerHit 🎵",
      description:
        "Studio IA — chansons, type beats, remix sur [producerhit.com](https://www.producerhit.com).\n\n" +
        `1. Lis <#${rulesId}>\n` +
        `2. Présente-toi dans <#${generalId}>\n` +
        `3. Challenge hebdo dans <#${challengesId}>\n\n` +
        "Commandes : `/challenge` · `/rules` · `/link`",
      color: COLOR,
    },
  ],
};

const rulesEmbed = {
  embeds: [
    {
      title: "Règles",
      description:
        "• Respect entre producteurs\n" +
        "• Loops **publiques** ProducerHit dans #ph-showcase\n" +
        "• 1 soumission challenge / semaine\n" +
        "• [Licence commerciale](https://www.producerhit.com/legal#commercial-license)",
      color: COLOR,
    },
  ],
};

const wMsg = await discord(`/channels/${welcomeId}/messages`, { method: "POST", body: JSON.stringify(welcomeEmbed) });
await discord(`/channels/${welcomeId}/pins/${wMsg.id}`, { method: "PUT" });
const rMsg = await discord(`/channels/${rulesId}/messages`, { method: "POST", body: JSON.stringify(rulesEmbed) });
await discord(`/channels/${rulesId}/pins/${rMsg.id}`, { method: "PUT" });
console.log("✅ Messages welcome + rules postés et épinglés");
