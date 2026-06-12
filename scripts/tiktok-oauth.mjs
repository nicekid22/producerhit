/**
 * OAuth TikTok (PKCE) — une fois pour obtenir TIKTOK_REFRESH_TOKEN.
 *
 * TikTok Login Kit exige :
 * - Redirect URI **HTTPS** (pas localhost:8788)
 * - Login Kit activé sur l'app + URI enregistrée
 * - Compte @producerhit ajouté en **utilisateur test** (Sandbox) si app non Live
 *
 * Usage : npm run tiktok:oauth
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

const CLIENT_KEY = (process.env.TIKTOK_CLIENT_KEY ?? process.env.TIKTOK_CLIENT_ID ?? "").trim();
const CLIENT_SECRET = (process.env.TIKTOK_CLIENT_SECRET ?? "").trim();
const REDIRECT_URI =
  (process.env.TIKTOK_REDIRECT_URI ?? "https://www.producerhit.com/api/tiktok-oauth-callback").trim();
const SCOPES = (process.env.TIKTOK_SCOPES ?? "video.upload,video.publish,user.info.basic").trim();

function base64Url(buf) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pkcePair() {
  const verifier = base64Url(crypto.randomBytes(32));
  const challenge = base64Url(crypto.createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
}

function encodeState(verifier) {
  return base64Url(Buffer.from(JSON.stringify({ v: verifier, n: crypto.randomBytes(8).toString("hex") })));
}

async function exchangeCode(code, verifier) {
  const body = new URLSearchParams({
    client_key: CLIENT_KEY,
    client_secret: CLIENT_SECRET,
    code,
    grant_type: "authorization_code",
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier,
  });
  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = await res.json();
  if (!res.ok || json.error_code) {
    console.error("Token exchange failed:", json);
    process.exit(1);
  }
  console.log("\n✅ Tokens obtenus :\n");
  console.log(`TIKTOK_REFRESH_TOKEN=${json.refresh_token}`);
  console.log(`# open_id=${json.open_id}`);
}

async function main() {
  if (!CLIENT_KEY || !CLIENT_SECRET) {
    console.error("Définir TIKTOK_CLIENT_KEY et TIKTOK_CLIENT_SECRET dans .env");
    process.exit(1);
  }

  if (!REDIRECT_URI.startsWith("https://")) {
    console.error("TikTok exige une redirect URI HTTPS. Défaut : https://www.producerhit.com/api/tiktok-oauth-callback");
    process.exit(1);
  }

  const codeArg = process.argv.find((a) => a.startsWith("--code="))?.split("=")[1];
  const { verifier, challenge } = pkcePair();

  if (codeArg) {
    await exchangeCode(codeArg, process.env.TIKTOK_CODE_VERIFIER ?? verifier);
    return;
  }

  const state = encodeState(verifier);
  const authUrl = new URL("https://www.tiktok.com/v2/auth/authorize/");
  authUrl.searchParams.set("client_key", CLIENT_KEY);
  authUrl.searchParams.set("scope", SCOPES);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  console.log("Checklist TikTok Developers (developers.tiktok.com) :\n");
  console.log("  1. Produit « Login Kit » activé sur l'app");
  console.log(`  2. Redirect URI enregistrée : ${REDIRECT_URI}`);
  console.log("  3. Sandbox → ajouter @producerhit comme utilisateur test");
  console.log("  4. Vercel : TIKTOK_CLIENT_KEY + TIKTOK_CLIENT_SECRET (pour le callback)\n");
  console.log("Ouvre cette URL (compte @producerhit) :\n");
  console.log(authUrl.toString());
  console.log("\nAprès autorisation, la page producerhit.com affichera TIKTOK_REFRESH_TOKEN.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
