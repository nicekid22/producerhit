/**
 * OAuth TikTok (PKCE) — une fois pour obtenir TIKTOK_REFRESH_TOKEN.
 *
 * Prérequis app TikTok Developers :
 * - Redirect URI : http://localhost:8788/callback (ou celle configurée dans l'app)
 * - Scopes : video.upload,video.publish,user.info.basic
 * - Vérifier le domaine producerhit.com pour PULL_FROM_URL (Content Posting → URL ownership)
 *
 * Usage :
 *   node scripts/tiktok-oauth.mjs
 *   # Ouvre l'URL affichée, connecte @producerhit, copie le ?code= de la redirect
 *   node scripts/tiktok-oauth.mjs --code=XXXX
 */
import crypto from "node:crypto";
import http from "node:http";
import { URL } from "node:url";

const CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY ?? process.env.TIKTOK_CLIENT_ID ?? "";
const CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET ?? "";
const REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI ?? "http://localhost:8788/callback";
const SCOPES = (process.env.TIKTOK_SCOPES ?? "video.upload,video.publish,user.info.basic").trim();

function base64Url(buf) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pkcePair() {
  const verifier = base64Url(crypto.randomBytes(32));
  const challenge = base64Url(crypto.createHash("sha256").update(verifier).digest());
  return { verifier, challenge };
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
  console.log("\n✅ Tokens obtenus — ajoute dans Supabase secrets + .env local :\n");
  console.log(`TIKTOK_REFRESH_TOKEN=${json.refresh_token}`);
  console.log(`# open_id=${json.open_id}`);
  console.log(`# access_token (24h)=${json.access_token?.slice(0, 12)}...`);
  console.log("\nPuis :");
  console.log("supabase secrets set TIKTOK_CLIENT_KEY=... TIKTOK_CLIENT_SECRET=... TIKTOK_REFRESH_TOKEN=...");
  console.log("SOCIAL_PUBLISH_PLATFORMS=webhook,twitter,indexnow,tiktok");
}

async function main() {
  if (!CLIENT_KEY || !CLIENT_SECRET) {
    console.error("Définir TIKTOK_CLIENT_KEY et TIKTOK_CLIENT_SECRET dans .env");
    process.exit(1);
  }

  const codeArg = process.argv.find((a) => a.startsWith("--code="))?.split("=")[1];
  const { verifier, challenge } = pkcePair();

  if (codeArg) {
    await exchangeCode(codeArg, process.env.TIKTOK_CODE_VERIFIER ?? verifier);
    return;
  }

  const state = base64Url(crypto.randomBytes(16));
  const authUrl = new URL("https://www.tiktok.com/v2/auth/authorize/");
  authUrl.searchParams.set("client_key", CLIENT_KEY);
  authUrl.searchParams.set("scope", SCOPES);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  console.log("1) Sauvegarde ce code_verifier (session OAuth) :");
  console.log(`TIKTOK_CODE_VERIFIER=${verifier}\n`);
  console.log("2) Ouvre cette URL et autorise le compte @producerhit :\n");
  console.log(authUrl.toString());
  console.log("\n3) Serveur local en écoute sur http://localhost:8788/callback …\n");

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost:8788");
    if (url.pathname !== "/callback") {
      res.writeHead(404);
      res.end("not found");
      return;
    }
    const code = url.searchParams.get("code");
    if (!code) {
      res.writeHead(400);
      res.end("missing code");
      return;
    }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<h1>OK — retourne au terminal</h1>");
    server.close();
    await exchangeCode(code, verifier);
  });

  server.listen(8788, () => {
    console.log("En attente du callback OAuth…");
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
