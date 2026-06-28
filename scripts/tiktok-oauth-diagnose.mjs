/**
 * Diagnostic TikTok Login Kit — erreur « client_key » sur /v2/auth/authorize/
 *
 * Usage: npm run tiktok:oauth:diagnose
 */
import { existsSync, readFileSync } from "node:fs";

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

const CLIENT_KEY = (process.env.TIKTOK_CLIENT_KEY ?? process.env.TIKTOK_CLIENT_ID ?? "").trim();
const CLIENT_SECRET = (process.env.TIKTOK_CLIENT_SECRET ?? "").trim();
const REDIRECT = (() => {
  const u = (process.env.TIKTOK_REDIRECT_URI ?? "https://www.producerhit.com/api/tiktok-oauth-callback/").trim();
  return u.endsWith("/") ? u : `${u}/`;
})();
const SCOPES = (process.env.TIKTOK_SCOPES ?? "user.info.basic").trim();
const SANDBOX = process.env.TIKTOK_SANDBOX === "1";
const OAUTH_SECRET = (process.env.OAUTH_SETUP_SECRET ?? "").trim();

async function testClientCredentials() {
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
  return { ok: res.ok && !json.error, json };
}

async function probeCallback() {
  const url = `${REDIRECT}?error=diagnose&error_description=probe`;
  try {
    const res = await fetch(url, { redirect: "follow" });
    const text = await res.text();
    const crashed = text.includes("FUNCTION_INVOCATION_FAILED") || text.includes("INTERNAL_SERVER_ERROR");
    return { status: res.status, crashed, snippet: text.slice(0, 200).replace(/\s+/g, " ") };
  } catch (e) {
    return { status: 0, crashed: true, snippet: e instanceof Error ? e.message : String(e) };
  }
}

function authUrl() {
  const u = new URL("https://www.tiktok.com/v2/auth/authorize/");
  u.searchParams.set("client_key", CLIENT_KEY);
  u.searchParams.set("scope", SCOPES);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("redirect_uri", REDIRECT);
  u.searchParams.set("state", OAUTH_SECRET || "diagnose");
  return u.toString();
}

async function main() {
  console.log("\n=== TikTok OAuth Diagnostic — ProducerHit ===\n");

  if (!CLIENT_KEY || !CLIENT_SECRET) {
    console.error("❌ TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET manquants dans .env");
    process.exit(1);
  }

  console.log(`client_key     : ${CLIENT_KEY.slice(0, 4)}… (${CLIENT_KEY.length} chars)`);
  console.log(`redirect_uri   : ${REDIRECT}`);
  console.log(`scopes         : ${SCOPES}`);
  console.log(`sandbox (.env)   : ${SANDBOX ? "yes (TIKTOK_SANDBOX=1)" : "no"}`);
  console.log(`OAUTH_SETUP_SECRET: ${OAUTH_SECRET ? "set (must match Vercel)" : "not set (OK for first test)"}`);

  const cred = await testClientCredentials();
  console.log(`\nAPI client_credentials : ${cred.ok ? "✅ OK" : "❌ FAIL"}`);
  if (!cred.ok) console.log("  ", cred.json);

  const cb = await probeCallback();
  console.log(`\nVercel callback probe   : HTTP ${cb.status}${cb.crashed ? " ❌ CRASH" : " ✅ responds"}`);
  if (cb.crashed) {
    console.log("  → Le callback prod plante. OAuth web bloqué même si TikTok autorise.");
    console.log("  → Fix: npm run vercel:sync-tiktok-env puis redeploy prod.");
  }

  console.log("\n--- Pourquoi TikTok affiche « client_key » alors que l'API OK ? ---");
  console.log("TikTok ment souvent : la vraie cause est presque toujours le portail dev, PAS la clé .env.\n");

  console.log("CHECKLIST portail https://developers.tiktok.com/app/ (mode SANDBOX activé en haut) :\n");
  console.log("  1. Products → Login Kit → ADD si absent");
  console.log("  2. Login Kit → Web → Redirect URI EXACTE (copier-coller) :");
  console.log(`     ${REDIRECT}`);
  console.log("     ⚠ slash final obligatoire — sans slash = erreur client_key");
  console.log("  3. App details → Website URL : https://www.producerhit.com");
  console.log("  4. Sandbox settings → Target users → ADD ACCOUNT");
  console.log("     → connecte le MÊME compte TikTok (@producerhit.com — https://www.tiktok.com/@producerhit.com)");
  console.log("  5. Apply changes → attendre 5 min");
  console.log("  6. Vercel prod : TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, TIKTOK_REDIRECT_URI identiques");
  if (OAUTH_SECRET) {
    console.log("  7. Vercel prod : OAUTH_SETUP_SECRET identique au .env local");
  }

  console.log("\n--- URL authorize (ouvre avec le compte target user) ---\n");
  console.log(authUrl());
  console.log("\nAprès OK TikTok → npm run tiktok:oauth -- --code=CODE_DANS_URL\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
