import { readFileSync } from "fs";

for (const line of readFileSync(".env", "utf8").split("\n")) {
  if (line.startsWith("DISCORD_BOT_TOKEN=")) process.env.DISCORD_BOT_TOKEN = line.slice(18).trim();
}

const token = process.env.DISCORD_BOT_TOKEN;
const res = await fetch("https://discord.com/api/v10/gateway/bot", {
  headers: { Authorization: `Bot ${token}` },
});
const { url } = await res.json();
const ws = new WebSocket(`${url}?v=10&encoding=json`);
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
    console.log("Bot ready:", msg.d.user.username);
    const guilds = msg.d.guilds ?? [];
    if (guilds.length === 0) {
      const appId = process.env.DISCORD_APPLICATION_ID ?? "1514605136259846154";
      console.log("\n❌ Aucun serveur — invite le bot :");
      console.log(`https://discord.com/oauth2/authorize?client_id=${appId}&permissions=8&scope=bot+applications.commands`);
    } else {
      for (const g of guilds) {
        console.log(`${g.name ?? "?"} | id=${g.id}`);
      }
    }
    ws.close();
    process.exit(guilds.length === 0 ? 2 : 0);
  }
});
ws.addEventListener("error", (e) => {
  console.error(e);
  process.exit(1);
});
setTimeout(() => {
  console.error("timeout");
  process.exit(1);
}, 15000);
