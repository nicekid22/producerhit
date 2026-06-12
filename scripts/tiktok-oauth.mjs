/**
 * OAuth TikTok (PKCE) — une fois pour obtenir TIKTOK_REFRESH_TOKEN.
 *
 * TikTok Login Kit exige :
 * - Redirect URI **HTTPS** (pas localhost:8788)
 * - Login Kit activé sur l'app + URI enregistrée (caractère par caractère)
 * - Ton **vrai compte TikTok** ajouté en target user (Sandbox) — pas le handle marketing du site
 *
 * Usage :
 *   npm run tiktok:oauth           # ouvre l'URL OAuth
 *   npm run tiktok:oauth -- --check   # vérifie client_key/secret
 *   npm run tiktok:oauth -- --minimal # scope user.info.basic seulement (debug Login Kit)
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
    console.error("❌ client_key / client_secret invalides côté API TikTok :", json);
    console.error("\n→ Vérifie Credentials dans developers.tiktok.com (pas TIKTOK_APP_ID).");
    process.exit(1);
  }
  console.log("✅ client_key + client_secret OK (API TikTok les accepte).");
  console.log("   Si l'écran TikTok affiche quand même « client_key », ce n'est PAS un typo :");
  console.log("   1) Redirect URI Login Kit ≠ celle du script (souvent seulement https://www.producerhit.com/)");
  console.log("   2) Compte TikTok utilisé à la connexion absent des target users Sandbox");
  console.log("   3) Login Kit ou scopes (video.upload…) non activés sur l'app Sandbox\n");
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

  if (process.argv.includes("--check")) {
    await checkCredentials();
    return;
  }

  if (!REDIRECT_URI.startsWith("https://")) {
    console.error("TikTok exige une redirect URI HTTPS. Défaut : https://www.producerhit.com/api/tiktok-oauth-callback");
    process.exit(1);
  }

  const minimal = process.argv.includes("--minimal");
  const scopes = minimal ? "user.info.basic" : SCOPES;
  const codeArg = process.argv.find((a) => a.startsWith("--code="))?.split("=")[1];
  const { verifier, challenge } = pkcePair();

  if (codeArg) {
    await exchangeCode(codeArg, process.env.TIKTOK_CODE_VERIFIER ?? verifier);
    return;
  }

  const state = encodeState(verifier);
  const authUrl = new URL("https://www.tiktok.com/v2/auth/authorize/");
  authUrl.searchParams.set("client_key", CLIENT_KEY);
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("code_challenge", challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");

  await checkCredentials();

  console.log("Checklist TikTok Developers (developers.tiktok.com) :\n");
  console.log("  1. Mode Sandbox activé + produit « Login Kit » sur cette sandbox");
  console.log(`  2. Login Kit → Redirect URI **exacte** (copier-coller) :\n     ${REDIRECT_URI}`);
  console.log("     ⚠ Pas https://www.producerhit.com/ seul — il faut le chemin /api/tiktok-oauth-callback");
  console.log("  3. Sandbox settings → Target users → ajouter le compte avec lequel tu te connectes");
  console.log("     (handle marketing @producerhit ≠ ton compte perso si ce n'est pas le même)");
  console.log("  4. Scopes : user.info.basic + video.upload + video.publish (Content Posting API)");
  console.log("  5. Vercel : TIKTOK_CLIENT_KEY + TIKTOK_CLIENT_SECRET puis redeploy\n");
  if (minimal) {
    console.log("Mode --minimal : scope user.info.basic uniquement (test Login Kit).\n");
  }
  console.log("Ouvre cette URL avec le compte ajouté en target user :\n");
  console.log(authUrl.toString());
  console.log("\nAprès autorisation, la page producerhit.com affichera TIKTOK_REFRESH_TOKEN.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
