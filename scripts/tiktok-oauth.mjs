/**
 * OAuth TikTok Login Kit Web — obtenir TIKTOK_REFRESH_TOKEN.
 *
 * Doc officielle : https://developers.tiktok.com/doc/login-kit-web
 * Web = PAS de PKCE (code_verifier réservé mobile/desktop).
 *
 * Usage :
 *   npm run tiktok:oauth
 *   npm run tiktok:oauth:check
 *   npm run tiktok:oauth:minimal
 */
import crypto from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { URL } from "node:url";

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

const SANDBOX = (process.env.TIKTOK_SANDBOX ?? "").trim() === "1" || process.argv.includes("--sandbox");
const CLIENT_KEY = SANDBOX
  ? (process.env.TIKTOK_CLIENT_KEY_SANDBOX ?? process.env.TIKTOK_CLIENT_KEY ?? process.env.TIKTOK_CLIENT_ID ?? "").trim()
  : (process.env.TIKTOK_CLIENT_KEY ?? process.env.TIKTOK_CLIENT_ID ?? "").trim();
const CLIENT_SECRET = SANDBOX
  ? (process.env.TIKTOK_CLIENT_SECRET_SANDBOX ?? process.env.TIKTOK_CLIENT_SECRET ?? "").trim()
  : (process.env.TIKTOK_CLIENT_SECRET ?? "").trim();
/** TikTok exige souvent le slash final (sinon erreur trompeuse « client_key »). */
function normalizeRedirectUri(uri) {
  const u = uri.trim();
  if (!u) return "https://www.producerhit.com/api/tiktok-oauth-callback/";
  return u.endsWith("/") ? u : `${u}/`;
}

const REDIRECT_URI = normalizeRedirectUri(
  process.env.TIKTOK_REDIRECT_URI ?? "https://www.producerhit.com/api/tiktok-oauth-callback/",
);
const SCOPES = (process.env.TIKTOK_SCOPES ?? (SANDBOX ? "user.info.basic" : "user.info.basic,video.upload")).trim();
const SCOPES_FULL = "user.info.basic,video.upload,video.publish";

function randomState() {
  return crypto.randomBytes(24).toString("hex");
}

async function checkCredentials() {
  const body = new URLSearchParams({
    client_key: CLIENT_KEY,
    client_secret: CLIENT_SECRET,
    grant_type: "client_credentials",
  });
  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = await res.json();
  if (!res.ok || json.error) {
    console.error("client_key / client_secret invalides:", json);
    process.exit(1);
  }
  console.log("client_key + client_secret OK (API TikTok).");
}

async function exchangeCode(code) {
  const body = new URLSearchParams({
    client_key: CLIENT_KEY,
    client_secret: CLIENT_SECRET,
    code,
    grant_type: "authorization_code",
    redirect_uri: REDIRECT_URI,
  });
  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = await res.json();
  if (!res.ok || json.error_code || json.error) {
    console.error("Token exchange failed:", json);
    process.exit(1);
  }
  console.log("\nTokens obtenus:\n");
  console.log(`TIKTOK_REFRESH_TOKEN=${json.refresh_token}`);
  console.log(`# open_id=${json.open_id}`);
}

function printChecklist(redirectUri, scopes) {
  console.log("\n=== CHECKLIST (erreur « client_key » = redirect URI ou sandbox, pas la cle) ===\n");
  console.log("1. Toggle SANDBOX (pas Production) — config Login Kit dans le SANDBOX actif");
  console.log("2. Products > Login Kit > Web > Redirect URI EXACTE (avec slash final) :");
  console.log(`   ${redirectUri}`);
  console.log("3. App details > Web URL : https://www.producerhit.com");
  console.log("4. Sandbox settings > Target users > ajouter @producerhit.com (login TikTok requis)");
  console.log("5. Apply changes puis attendre 5 min");
  console.log("6. Vercel : TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, TIKTOK_REDIRECT_URI (meme URI)");
  console.log(`7. Scopes URL : ${scopes}`);
  if (SANDBOX) {
    console.log("8. Sandbox : scope user.info.basic seul d'abord (video.upload = apres review prod)");
  }
  console.log("\nDoc: https://developers.tiktok.com/doc/login-kit-web\n");
}

async function main() {
  if (!CLIENT_KEY || !CLIENT_SECRET) {
    console.error("Definir TIKTOK_CLIENT_KEY et TIKTOK_CLIENT_SECRET dans .env");
    process.exit(1);
  }

  if (process.argv.includes("--check")) {
    await checkCredentials();
    return;
  }

  if (!REDIRECT_URI.startsWith("https://")) {
    console.error("Redirect URI HTTPS requise.");
    process.exit(1);
  }

  const minimal = process.argv.includes("--minimal");
  const full = process.argv.includes("--full");
  const scopes = minimal ? "user.info.basic" : full ? SCOPES_FULL : SCOPES;

  const codeArg = process.argv.find((a) => a.startsWith("--code="))?.split("=")[1];
  if (codeArg) {
    await exchangeCode(decodeURIComponent(codeArg));
    return;
  }

  const state = (process.env.OAUTH_SETUP_SECRET ?? "").trim() || randomState();
  const authUrl = new URL("https://www.tiktok.com/v2/auth/authorize/");
  authUrl.searchParams.set("client_key", CLIENT_KEY);
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("state", state);

  await checkCredentials();
  printChecklist(REDIRECT_URI, scopes);

  const url = authUrl.toString();
  console.log("Ouvre cette URL avec le compte sandbox @producerhit.com :\n");
  console.log("  https://www.tiktok.com/@producerhit.com\n");
  console.log(url);
  console.log("\nPas de PKCE. Redirect URI avec slash final.\n");

  if (process.argv.includes("--open")) {
    const { execSync } = await import("node:child_process");
    execSync(`start "" "${url}"`, { shell: true, stdio: "ignore" });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
