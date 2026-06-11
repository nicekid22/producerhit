/**
 * Reset complet du serveur Discord + structure ProducerHit.
 * Usage: node scripts/discord-setup-server.mjs [--dry-run]
 */
import { readFileSync, existsSync, writeFileSync } from "fs";

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
const guildIdEnv = (process.env.DISCORD_GUILD_ID ?? "").trim();
const dryRun = process.argv.includes("--dry-run");

if (!token) {
  console.error("Missing DISCORD_BOT_TOKEN in .env");
  process.exit(1);
}

const API = "https://discord.com/api/v10";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
    json = { raw: text.slice(0, 400) };
  }
  if (!res.ok) {
    const msg = json?.message ?? text.slice(0, 200);
    throw new Error(`Discord ${opts.method ?? "GET"} ${path} → ${res.status}: ${msg}`);
  }
  return json;
}

async function discoverGuildIdViaGateway() {
  const res = await fetch(`${API}/gateway/bot`, { headers: { Authorization: `Bot ${token}` } });
  const { url } = await res.json();
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${url}?v=10&encoding=json`);
    const timer = setTimeout(() => {
      ws.close();
      reject(
        new Error(
          "Bot sur aucun serveur — invite-le avec l’URL OAuth dans .env (DISCORD_APPLICATION_ID), puis relance le script.",
        ),
      );
    }, 15_000);
    ws.addEventListener("message", (ev) => {
      const msg = JSON.parse(String(ev.data));
      if (msg.op === 10) {
        ws.send(
          JSON.stringify({
            op: 2,
            d: {
              token,
              intents: 1 << 0,
              properties: { os: "linux", browser: "producerhit", device: "producerhit" },
            },
          }),
        );
      }
      if (msg.t === "READY") {
        clearTimeout(timer);
        ws.close();
        const guilds = msg.d.guilds ?? [];
        if (guilds.length === 1) resolve(guilds[0].id);
        else if (guilds.length > 1) {
          console.log("Plusieurs serveurs — définis DISCORD_GUILD_ID :");
          for (const g of guilds) console.log(`  ${g.name ?? g.id}: ${g.id}`);
          reject(new Error("DISCORD_GUILD_ID requis"));
        } else {
          reject(
            new Error(
              "Bot sur aucun serveur — ouvre l’URL d’invitation OAuth (client_id=1514605136259846154) puis relance.",
            ),
          );
        }
      }
    });
    ws.addEventListener("error", reject);
  });
}

async function assertBotInGuild(guildId) {
  try {
    const guild = await discord(`/guilds/${guildId}`);
    return guild;
  } catch (e) {
    const appId = (process.env.DISCORD_APPLICATION_ID ?? "").trim() || "953663856583008368";
    throw new Error(
      `Le bot n'a pas accès au serveur ${guildId} (404).\n` +
        `Invite-le sur CE serveur puis relance :\n` +
        `https://discord.com/oauth2/authorize?client_id=${appId}&permissions=8&scope=bot+applications.commands`,
    );
  }
}

async function findGuildId() {
  if (guildIdEnv) {
    console.log(`Serveur cible (DISCORD_GUILD_ID) : ${guildIdEnv}`);
    await assertBotInGuild(guildIdEnv);
    return guildIdEnv;
  }
  try {
    return await discoverGuildIdViaGateway();
  } catch (e) {
    throw e;
  }
}

async function deleteAllChannels(guildId) {
  const channels = await discord(`/guilds/${guildId}/channels`);
  console.log(`Suppression de ${channels.length} salons…`);
  for (const ch of channels) {
    if (dryRun) {
      console.log(`  [dry] delete #${ch.name} (${ch.id})`);
      continue;
    }
    try {
      await discord(`/channels/${ch.id}`, { method: "DELETE" });
      console.log(`  ✓ supprimé #${ch.name}`);
    } catch (e) {
      console.warn(`  ⚠ ${ch.name}: ${e.message}`);
    }
    await sleep(350);
  }
}

async function deleteCustomRoles(guildId) {
  const roles = await discord(`/guilds/${guildId}/roles`);
  const toDelete = roles.filter((r) => r.name !== "@everyone" && !r.managed && r.id !== guildId);
  console.log(`Suppression de ${toDelete.length} rôles custom…`);
  for (const role of toDelete.sort((a, b) => a.position - b.position)) {
    if (dryRun) {
      console.log(`  [dry] delete role ${role.name}`);
      continue;
    }
    try {
      await discord(`/guilds/${guildId}/roles/${role.id}`, { method: "DELETE" });
      console.log(`  ✓ rôle ${role.name}`);
    } catch (e) {
      console.warn(`  ⚠ rôle ${role.name}: ${e.message}`);
    }
    await sleep(350);
  }
}

async function createRole(guildId, name, color) {
  if (dryRun) return { id: `dry-${name}`, name };
  try {
    return await discord(`/guilds/${guildId}/roles`, {
      method: "POST",
      body: JSON.stringify({ name, color, hoist: true, mentionable: false }),
    });
  } catch (e) {
    console.warn(`  ⚠ rôle ${name} ignoré: ${e instanceof Error ? e.message : e}`);
    return { id: null, name };
  }
}

async function createChannel(guildId, data) {
  if (dryRun) return { id: `dry-${data.name}`, name: data.name };
  try {
    return await discord(`/guilds/${guildId}/channels`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  } catch (e) {
    throw new Error(`Salon ${data.name}: ${e instanceof Error ? e.message : e}`);
  }
}

async function sendMessage(channelId, payload) {
  if (dryRun) return null;
  return discord(`/channels/${channelId}/messages`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function createPermanentInvite(guildId, channelId) {
  if (dryRun) return "https://discord.gg/dry-run";
  const inv = await discord(`/channels/${channelId}/invites`, {
    method: "POST",
    body: JSON.stringify({
      max_age: 0,
      max_uses: 0,
      unique: true,
    }),
  });
  return `https://discord.gg/${inv.code}`;
}

async function pinMessage(channelId, messageId) {
  if (dryRun) return;
  await discord(`/channels/${channelId}/pins/${messageId}`, { method: "PUT" });
}

const PRODUCERHIT_EMBED_COLOR = 0x7c3aed;

async function setupStructure(guildId, options = {}) {
  const additive = options.additive === true;
  if (!dryRun && !additive) {
    try {
      await discord(`/guilds/${guildId}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: "ProducerHit",
        description: "Official community — AI songs, type beats & remixes. Free to start → producerhit.com",
        preferred_locale: "en-US",
        }),
      });
    } catch (e) {
      console.warn(`⚠ Renommage serveur ignoré: ${e instanceof Error ? e.message : e}`);
    }
  } else if (additive) {
    console.log("Mode additive — salons existants conservés");
  }

  const ch = (base) => (additive ? `ph-${base}` : base);

  const roleMembre = await createRole(guildId, "Membre", 0x5865f2);
  const rolePro = await createRole(guildId, "Pro", 0x22c55e);
  const roleStudio = await createRole(guildId, "Studio", 0x06b6d4);
  const rolePlus = await createRole(guildId, "Plus", 0xa855f7);

  const catInfo = await createChannel(guildId, { name: additive ? "📢 PRODUCERHIT INFO" : "📢 INFORMATIONS", type: 4 });
  const catCommu = await createChannel(guildId, { name: additive ? "🎵 PRODUCERHIT COMMU" : "🎵 COMMUNAUTÉ", type: 4 });
  const catStudio = await createChannel(guildId, { name: additive ? "💎 PRODUCERHIT STUDIO" : "💎 PRODUCTEURHIT", type: 4 });

  const permsEveryoneRead = [{ id: guildId, type: 0, allow: "1024", deny: "2048" }];
  const permsEveryoneTalk = [{ id: guildId, type: 0, allow: "3072", deny: "0" }];
  const permsBotOnly = [
    { id: guildId, type: 0, allow: "1024", deny: "2048" },
  ];

  const rules = await createChannel(guildId, {
    name: ch("rules"),
    type: 0,
    parent_id: catInfo.id,
    topic: "Règles ProducerHit — respect, pas de spam, contenu légal",
    permission_overwrites: permsEveryoneRead,
  });
  const announcements = await createChannel(guildId, {
    name: ch("announcements"),
    type: 0,
    parent_id: catInfo.id,
    topic: "Annonces produit & gagnants challenges",
    permission_overwrites: permsEveryoneRead,
  });
  const welcome = await createChannel(guildId, {
    name: ch("welcome"),
    type: 0,
    parent_id: catInfo.id,
    topic: "Bienvenue — lis #rules puis présente-toi dans #general",
    permission_overwrites: permsBotOnly,
  });

  const general = await createChannel(guildId, {
    name: ch("general"),
    type: 0,
    parent_id: catCommu.id,
    topic: "Discussion libre entre producteurs",
    permission_overwrites: permsEveryoneTalk,
  });
  const showcase = await createChannel(guildId, {
    name: ch("showcase"),
    type: 0,
    parent_id: catCommu.id,
    topic: "Partage tes loops publics ProducerHit",
    permission_overwrites: permsEveryoneTalk,
  });
  const challenges = await createChannel(guildId, {
    name: ch("challenges"),
    type: 0,
    parent_id: catCommu.id,
    topic: "Challenge hebdo — thème du lundi au dimanche",
    permission_overwrites: permsEveryoneRead,
  });
  const feedback = await createChannel(guildId, {
    name: ch("feedback"),
    type: 0,
    parent_id: catCommu.id,
    topic: "Idées & bugs ProducerHit",
    permission_overwrites: permsEveryoneTalk,
  });

  const tips = await createChannel(guildId, {
    name: ch("tips-studio"),
    type: 0,
    parent_id: catStudio.id,
    topic: "Astuces Song Mode, Type Beat, Remix",
    permission_overwrites: permsEveryoneTalk,
  });
  const support = await createChannel(guildId, {
    name: ch("support"),
    type: 0,
    parent_id: catStudio.id,
    topic: "Aide compte / billing — info.producermarket@gmail.com",
    permission_overwrites: permsEveryoneTalk,
  });

  const welcomeEmbed = {
    embeds: [
      {
        title: "Bienvenue sur ProducerHit 🎵",
        description:
          "Communauté officielle du studio IA — crée des chansons, type beats et remix depuis [producerhit.com](https://www.producerhit.com).\n\n" +
          "**Pour commencer :**\n" +
          "1. Lis <#" + rules.id + ">\n" +
          "2. Présente-toi dans <#" + general.id + ">\n" +
          "3. Participe au challenge dans <#" + challenges.id + ">\n\n" +
          "Commandes : `/challenge` · `/rules` · `/link`",
        color: PRODUCERHIT_EMBED_COLOR,
      },
    ],
  };

  const rulesEmbed = {
    embeds: [
      {
        title: "Règles de la communauté",
        description:
          "• Respect & entraide entre producteurs\n" +
          "• Pas de contenu illégal, haineux ou spam\n" +
          "• Showcase : loops **publiques** ProducerHit uniquement\n" +
          "• Challenge : 1 soumission / semaine / personne\n" +
          "• Droits commerciaux : [Licence](https://www.producerhit.com/legal#commercial-license)\n" +
          "• Support : info.producermarket@gmail.com",
        color: PRODUCERHIT_EMBED_COLOR,
      },
    ],
  };

  if (!dryRun) {
    const wMsg = await sendMessage(welcome.id, welcomeEmbed);
    if (wMsg?.id) await pinMessage(welcome.id, wMsg.id);
    const rMsg = await sendMessage(rules.id, rulesEmbed);
    if (rMsg?.id) await pinMessage(rules.id, rMsg.id);
    await sendMessage(announcements.id, {
      content: "@everyone",
      embeds: [
        {
          title: "ProducerHit — nouveau départ 🚀",
          description:
            "Le serveur a été remis à zéro pour la communauté **ProducerHit**.\n" +
            "Génère sur [producerhit.com](https://www.producerhit.com) · Challenge chaque lundi dans <#" +
            challenges.id +
            ">",
          color: PRODUCERHIT_EMBED_COLOR,
        },
      ],
    });
  }

  const inviteUrl = await createPermanentInvite(guildId, general.id);

  return {
    guildId,
    inviteUrl,
    roles: { membre: roleMembre.id, pro: rolePro.id, studio: roleStudio.id, plus: rolePlus.id },
    channels: {
      rules: rules.id,
      announcements: announcements.id,
      welcome: welcome.id,
      general: general.id,
      showcase: showcase.id,
      challenges: challenges.id,
      feedback: feedback.id,
      tips: tips.id,
      support: support.id,
    },
  };
}

async function registerSlashCommands(appId) {
  const commands = [
    {
      name: "challenge",
      description: "Affiche le challenge hebdo ProducerHit",
    },
    {
      name: "rules",
      description: "Règles & licence commerciale",
    },
    {
      name: "link",
      description: "Lier ton compte ProducerHit (bientôt)",
    },
  ];
  if (dryRun) {
    console.log("[dry] register slash commands", commands.map((c) => c.name));
    return;
  }
  await discord(`/applications/${appId}/commands`, {
    method: "PUT",
    body: JSON.stringify(commands),
  });
  console.log("Slash commands globales enregistrées");
}

async function registerInteractionsEndpoint(appId) {
  const supabaseUrl = (process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "").trim().replace(/\/$/, "");
  if (!supabaseUrl) {
    console.warn("SUPABASE_URL manquant — interactions endpoint non configuré");
    return;
  }
  const endpoint = `${supabaseUrl}/functions/v1/discord-interactions`;
  if (dryRun) {
    console.log("[dry] interactions endpoint", endpoint);
    return;
  }
  try {
    await discord(`/applications/${appId}`, {
      method: "PATCH",
      body: JSON.stringify({ interactions_endpoint_url: endpoint }),
    });
    console.log("Interactions endpoint:", endpoint);
  } catch (e) {
    console.warn(`⚠ Endpoint interactions — configure manuellement dans le portail Discord :`);
    console.warn(`  ${endpoint}`);
    console.warn(`  (${e instanceof Error ? e.message : e})`);
  }
}

async function fetchApplicationPublicKey(appId) {
  if (dryRun) return null;
  try {
    const app = await discord(`/applications/${appId}`);
    return app.public_key ?? null;
  } catch {
    return null;
  }
}

function patchDotEnv(updates) {
  if (dryRun || !existsSync(".env")) return;
  let content = readFileSync(".env", "utf8");
  for (const [key, value] of Object.entries(updates)) {
    if (!value) continue;
    const line = `${key}=${value}`;
    const re = new RegExp(`^${key}=.*$`, "m");
    content = re.test(content) ? content.replace(re, line) : `${content.trimEnd()}\n${line}\n`;
  }
  writeFileSync(".env", content.endsWith("\n") ? content : `${content}\n`);
  console.log("✓ .env mis à jour");
}

function printSupabaseSecrets(setup, publicKey) {
  const cronSecret = (process.env.DISCORD_CRON_SECRET ?? "").trim() || crypto.randomUUID().replace(/-/g, "");
  console.log("\nSecrets Supabase (Dashboard → Edge Functions → Secrets, ou CLI) :");
  console.log(`  DISCORD_BOT_TOKEN=<déjà dans .env>`);
  console.log(`  DISCORD_GUILD_ID=${setup.guildId}`);
  console.log(`  DISCORD_CHANNEL_WELCOME=${setup.channels.welcome}`);
  console.log(`  DISCORD_CHANNEL_ANNOUNCEMENTS=${setup.channels.announcements}`);
  console.log(`  DISCORD_CHANNEL_CHALLENGES=${setup.channels.challenges}`);
  console.log(`  DISCORD_CHANNEL_SHOWCASE=${setup.channels.showcase}`);
  console.log(`  DISCORD_CRON_SECRET=${cronSecret}`);
  if (publicKey) console.log(`  DISCORD_PUBLIC_KEY=${publicKey}`);
  console.log("\nCLI exemple :");
  console.log(`  supabase secrets set DISCORD_GUILD_ID=${setup.guildId} --project-ref pmfnzenqemnonpglmjqx`);
}

async function main() {
  const me = await discord("/users/@me");
  const guildId = await findGuildId();
  const guild = await discord(`/guilds/${guildId}`);
  const additive = process.argv.includes("--additive");
  console.log(`Serveur: ${guild.name} (${guild.member_count ?? "?"} membres)${additive ? " [additive]" : ""}`);

  if (!dryRun && !additive) {
    const ok = process.argv.includes("--yes") || process.env.DISCORD_RESET_CONFIRM === "1";
    if (!ok) {
      console.error("Ajoute --yes ou DISCORD_RESET_CONFIRM=1 pour confirmer la suppression de tout le contenu.");
      console.error("Ou utilise --additive pour créer sans supprimer.");
      process.exit(1);
    }
    await deleteAllChannels(guildId);
    await deleteCustomRoles(guildId);
  } else if (additive) {
    console.log("→ Création de la structure ProducerHit sans toucher aux salons existants");
  }

  const setup = await setupStructure(guildId, { additive });
  const appId = (process.env.DISCORD_APPLICATION_ID ?? "").trim() || me.id;
  await registerSlashCommands(appId);
  await registerInteractionsEndpoint(appId);
  const publicKey = await fetchApplicationPublicKey(appId);

  const outPath = "scripts/discord-env-output.json";
  writeFileSync(outPath, JSON.stringify({ ...setup, publicKey }, null, 2));
  console.log("\n✅ Setup terminé. IDs sauvegardés dans", outPath);

  patchDotEnv({
    DISCORD_GUILD_ID: setup.guildId,
    DISCORD_CHANNEL_WELCOME: setup.channels.welcome,
    DISCORD_CHANNEL_ANNOUNCEMENTS: setup.channels.announcements,
    DISCORD_CHANNEL_CHALLENGES: setup.channels.challenges,
    DISCORD_CHANNEL_SHOWCASE: setup.channels.showcase,
    DISCORD_ROLE_MEMBRE: setup.roles.membre,
    DISCORD_APPLICATION_ID: me.id,
    VITE_DISCORD_INVITE_URL: setup.inviteUrl,
    ...(publicKey ? { DISCORD_PUBLIC_KEY: publicKey } : {}),
  });

  printSupabaseSecrets(setup, publicKey);
  console.log("\nPremier challenge manuel :");
  console.log(
    '  curl -X POST "https://pmfnzenqemnonpglmjqx.supabase.co/functions/v1/discord-cron" \\',
  );
  console.log('    -H "Content-Type: application/json" \\');
  console.log('    -H "x-discord-cron-secret: <DISCORD_CRON_SECRET>" \\');
  console.log('    -d "{\\"action\\":\\"start_weekly\\"}"');
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});
