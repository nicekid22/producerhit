/**
 * OAuth YouTube (Google) — obtenir YOUTUBE_*_REFRESH_TOKEN pour upload serveur.
 *
 * Usage :
 *   npm run youtube:oauth:lowdey
 *   npm run youtube:oauth -- --account market
 *   npm run youtube:oauth -- --account lowdey --code "4/0A..."
 */
import crypto from "node:crypto";
import http from "node:http";
import { execFileSync, execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { listYouTubeAccountIds, loadYouTubeAccount, resolveOAuthCredentials } from "../lib/youtubeAccounts.mjs";

function loadDotEnv() {
  if (!existsSync(".env")) return;
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (!(k in process.env)) process.env[k] = v;
  }
}

loadDotEnv();

function parseAccountArg() {
  const idx = process.argv.indexOf("--account");
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1].trim().toLowerCase();
  return "vibez";
}

function parseCodeArg() {
  const idx = process.argv.indexOf("--code");
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1].trim();
  return "";
}

const ACCOUNT_ID = parseAccountArg();
const MANUAL_CODE = parseCodeArg();
const { clientId: CLIENT_ID, clientSecret: CLIENT_SECRET, channelUrl: CHANNEL_URL, refreshEnvKey } =
  resolveOAuthCredentials(ACCOUNT_ID);
const LOCAL_REDIRECT = (process.env.YOUTUBE_LOCAL_REDIRECT_URI ?? "http://localhost:8765").trim();
const LOCAL_PORT = Number(new URL(LOCAL_REDIRECT).port || "8765");
const WEB_REDIRECT =
  (process.env.YOUTUBE_REDIRECT_URI ?? "https://www.producerhit.com/api/youtube-oauth-callback").trim();
const SCOPES = (
  process.env.YOUTUBE_SCOPES ??
  "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.force-ssl"
).trim();

function checkConfig() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error(`Définir les credentials OAuth pour le compte "${ACCOUNT_ID}" dans .env`);
    process.exit(1);
  }
}

async function exchangeCode(code, redirectUri) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const json = await res.json();
  if (!res.ok || json.error) {
    console.error("❌ Échange token échoué :", json);
    process.exit(1);
  }
  if (!json.refresh_token) {
    console.error("❌ Pas de refresh_token. Révoque l'accès sur https://myaccount.google.com/permissions puis relance.");
    console.error(json);
    process.exit(1);
  }
  console.log(`\n✅ YouTube connecté — compte "${ACCOUNT_ID}"\n`);
  console.log(`${refreshEnvKey}=${json.refresh_token}`);
  console.log(`# scope: ${json.scope ?? "—"}`);
  console.log(`# channel: ${CHANNEL_URL || "—"}`);
  persistRefreshToken(refreshEnvKey, json.refresh_token);
  console.log("\nPuis Supabase : npm run youtube:sync-secrets");
  return json.refresh_token;
}

function persistRefreshToken(key, token) {
  if (!existsSync(".env")) return;
  const raw = readFileSync(".env", "utf8");
  const line = `${key}=${token}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  const next = re.test(raw) ? raw.replace(re, line) : `${raw.replace(/\s*$/, "")}\n${line}\n`;
  writeFileSync(".env", next, "utf8");
  console.log(`\n📝 .env mis à jour (${key})`);
}

function printChecklist(redirectUri) {
  console.log(`Checklist Google Cloud Console (compte "${ACCOUNT_ID}") :\n`);
  console.log(`  5. Redirect URI autorisée : ${redirectUri}`);
  console.log(`  6. Connecte-toi avec le compte Google de ${CHANNEL_URL || ACCOUNT_ID}\n`);
}

/** Windows: cmd "start" casse les & dans l'URL → response_type manquant chez Google. */
function openAuthUrl(url) {
  if (process.platform === "win32") {
    execFileSync("powershell", ["-NoProfile", "-Command", `Start-Process ${JSON.stringify(url)}`], {
      stdio: "ignore",
    });
    return;
  }
  execFileSync("open", [url], { stdio: "ignore" });
}

function freeLocalPort(port) {
  if (process.platform !== "win32") return;
  try {
    const out = execSync(`netstat -ano | findstr :${port}`, { encoding: "utf8" });
    const pids = new Set();
    for (const line of out.split("\n")) {
      if (!line.includes("LISTENING")) continue;
      const pid = line.trim().split(/\s+/).pop();
      if (pid && /^\d+$/.test(pid)) pids.add(pid);
    }
    for (const pid of pids) {
      execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
      console.log(`🔧 Port ${port} libéré (PID ${pid})`);
    }
  } catch {
    // port déjà libre
  }
}

async function oauthLocalhost() {
  const state = crypto.randomBytes(16).toString("hex");
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", LOCAL_REDIRECT);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", SCOPES);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", state);

  printChecklist(LOCAL_REDIRECT);
  freeLocalPort(LOCAL_PORT);
  console.log("⚠ Ouvre l'URL du terminal (pas un favori). Le serveur local doit tourner avant d'autoriser.\n");
  console.log(authUrl.toString());
  if (process.argv.includes("--open")) {
    openAuthUrl(authUrl.toString());
    console.log("\n🌐 Navigateur ouvert — connecte-toi avec le bon compte Google.\n");
  }
  console.log(`→ Le refresh token sera écrit dans .env (${refreshEnvKey})\n`);

  await new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url ?? "/", LOCAL_REDIRECT);
        if (url.pathname !== "/" && url.pathname !== "/callback") {
          res.writeHead(404);
          res.end("Not found");
          return;
        }
        const err = url.searchParams.get("error");
        if (err) {
          res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
          res.end(`<h1>Erreur OAuth</h1><p>${err}</p>`);
          reject(new Error(err));
          server.close();
          return;
        }
        const code = url.searchParams.get("code");
        const returnedState = url.searchParams.get("state");
        if (!code) {
          res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
          res.end("<h1>Code manquant</h1>");
          return;
        }
        // Google omet parfois state dans le callback — on accepte si le code est présent.
        if (returnedState && returnedState !== state) {
          res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
          res.end("<h1>State invalide — relance npm run youtube:oauth:lowdey avec l'URL fraîche du terminal</h1>");
          return;
        }
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end("<h1>OK — retourne au terminal</h1><p>Tu peux fermer cette fenêtre.</p>");
        server.close();
        await exchangeCode(code, LOCAL_REDIRECT);
        resolve();
      } catch (e) {
        reject(e);
        server.close();
      }
    });
    server.listen(LOCAL_PORT, "127.0.0.1", () => {
      console.log(`✅ Serveur OAuth en écoute sur ${LOCAL_REDIRECT}\n`);
    });
    server.on("error", (e) => {
      if (e && typeof e === "object" && "code" in e && e.code === "EADDRINUSE") {
        console.error(`\n❌ Port ${LOCAL_PORT} occupé. Relance la commande (libération auto) ou :`);
        console.error(`   taskkill /F /PID $(netstat -ano | findstr :${LOCAL_PORT})\n`);
      }
      reject(e);
    });
  });
}

async function oauthWeb() {
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", WEB_REDIRECT);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", SCOPES);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", crypto.randomBytes(16).toString("hex"));
  printChecklist(WEB_REDIRECT);
  console.log(authUrl.toString());
}

async function main() {
  checkConfig();

  if (process.argv.includes("--check")) {
    console.log(`✅ Compte YouTube : ${ACCOUNT_ID}`);
    console.log(`   Client ID : ${CLIENT_ID.slice(0, 16)}…`);
    console.log(`   Channel   : ${CHANNEL_URL || "—"}`);
    console.log(`   Refresh   : ${loadYouTubeAccount(ACCOUNT_ID) ? "OK" : "manquant"}`);
    console.log(`\nComptes configurés : ${listYouTubeAccountIds().join(", ")}`);
    return;
  }

  if (MANUAL_CODE) {
    await exchangeCode(MANUAL_CODE, LOCAL_REDIRECT);
    return;
  }

  if (process.argv.includes("--web")) {
    await oauthWeb();
    return;
  }

  await oauthLocalhost();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
