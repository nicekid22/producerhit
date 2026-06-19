/**
 * OAuth Reddit — obtenir REDDIT_REFRESH_TOKEN (app script perso sur reddit.com/prefs/apps).
 *
 * Si « create app » est bloqué : posts manuels via npm run reddit:agent -- --open
 *
 * Usage :
 *   npm run reddit:oauth -- --open
 *   npm run reddit:oauth:check
 */
import crypto from "node:crypto";
import http from "node:http";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { redditUserAgent } from "./lib/redditClient.mjs";

function loadDotEnv() {
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i <= 0) continue;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!(k in process.env)) process.env[k] = v;
    }
  }
}

loadDotEnv();

const CLIENT_ID = (process.env.REDDIT_CLIENT_ID ?? "").trim();
const CLIENT_SECRET = (process.env.REDDIT_CLIENT_SECRET ?? "").trim();
const LOCAL_REDIRECT = (process.env.REDDIT_LOCAL_REDIRECT_URI ?? "http://localhost:8787").trim();
const LOCAL_PORT = Number(new URL(LOCAL_REDIRECT).port || "8787");
const SCOPES = (process.env.REDDIT_SCOPES ?? "identity read submit edit history").trim();
const UA = redditUserAgent();

function openUrl(url) {
  if (process.platform === "win32") {
    execFileSync("powershell", ["-NoProfile", "-Command", `Start-Process ${JSON.stringify(url)}`], {
      stdio: "ignore",
    });
    return;
  }
  execFileSync("open", [url], { stdio: "ignore" });
}

function persistEnv(key, value) {
  const file = existsSync(".env") ? ".env" : ".env.local";
  const raw = existsSync(file) ? readFileSync(file, "utf8") : "";
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  const next = re.test(raw) ? raw.replace(re, line) : `${raw.replace(/\s*$/, "")}\n${line}\n`;
  writeFileSync(file, next, "utf8");
  console.log(`\n📝 ${file} mis à jour (${key})`);
}

async function exchangeCode(code) {
  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": UA,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: LOCAL_REDIRECT,
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.refresh_token) {
    console.error("❌ Échange token échoué :", json);
    process.exit(1);
  }
  console.log("\n✅ Reddit connecté\n");
  console.log(`REDDIT_REFRESH_TOKEN=${json.refresh_token}`);
  persistEnv("REDDIT_REFRESH_TOKEN", json.refresh_token);
  console.log("\nPuis : supabase secrets set REDDIT_REFRESH_TOKEN=... (prod) ou npm run reddit:agent");
}

async function checkCredentials() {
  const refresh = (process.env.REDDIT_REFRESH_TOKEN ?? "").trim();
  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error("Définir REDDIT_CLIENT_ID et REDDIT_CLIENT_SECRET dans .env");
    console.error("Créer une app « script » sur https://www.reddit.com/prefs/apps (redirect http://localhost:8787)");
    process.exit(1);
  }
  if (!refresh) {
    console.log("REDDIT_CLIENT_ID + SECRET OK (pas de refresh token — lance npm run reddit:oauth -- --open)");
    return;
  }
  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": UA,
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refresh }),
  });
  const json = await res.json();
  if (!res.ok || !json.access_token) {
    console.error("Refresh token invalide :", json);
    process.exit(1);
  }
  console.log("✅ Reddit OAuth OK — token rafraîchi");
}

function startLocalServer(state) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const u = new URL(req.url ?? "/", LOCAL_REDIRECT);
        if (u.pathname !== "/" && u.pathname !== "/callback") {
          res.writeHead(404);
          res.end("Not found");
          return;
        }
        const err = u.searchParams.get("error");
        if (err) {
          res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
          res.end(`Erreur OAuth: ${err}`);
          server.close();
          reject(new Error(err));
          return;
        }
        const code = u.searchParams.get("code");
        const gotState = u.searchParams.get("state");
        if (!code || gotState !== state) {
          res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
          res.end("Code ou state invalide");
          return;
        }
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end("<h1>Reddit connecté</h1><p>Tu peux fermer cet onglet et revenir au terminal.</p>");
        server.close();
        resolve(code);
      } catch (e) {
        server.close();
        reject(e);
      }
    });
    server.listen(LOCAL_PORT, "127.0.0.1", () => {
      console.log(`Serveur OAuth local : ${LOCAL_REDIRECT}`);
    });
    server.on("error", reject);
  });
}

async function main() {
  if (process.argv.includes("--check")) {
    await checkCredentials();
    return;
  }

  const codeArg = process.argv.find((a) => a.startsWith("--code="))?.split("=")[1];
  if (codeArg) {
    if (!CLIENT_ID || !CLIENT_SECRET) {
      console.error("REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET requis");
      process.exit(1);
    }
    await exchangeCode(decodeURIComponent(codeArg));
    return;
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.log(`
=== Reddit OAuth ===

1. Va sur https://www.reddit.com/prefs/apps (connecté dans le navigateur)
2. Si « create app » est disponible : type « script », redirect uri = ${LOCAL_REDIRECT}
3. Copie client_id (sous le nom) + secret dans .env :
   REDDIT_CLIENT_ID=
   REDDIT_CLIENT_SECRET=
4. Relance : npm run reddit:oauth -- --open

Si create app est bloqué → utilise npm run reddit:agent -- --open (posts manuels assistés).
`);
    process.exit(1);
  }

  const state = crypto.randomBytes(16).toString("hex");
  const authUrl = new URL("https://www.reddit.com/api/v1/authorize");
  authUrl.searchParams.set("client_id", CLIENT_ID);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("redirect_uri", LOCAL_REDIRECT);
  authUrl.searchParams.set("duration", "permanent");
  authUrl.searchParams.set("scope", SCOPES);

  console.log("Connecte-toi avec le compte Reddit que tu veux utiliser pour poster.\n");
  console.log(authUrl.toString());

  const waitCode = startLocalServer(state);
  if (process.argv.includes("--open")) openUrl(authUrl.toString());
  const code = await waitCode;
  await exchangeCode(code);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
