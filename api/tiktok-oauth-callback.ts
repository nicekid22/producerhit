import {
  escapeHtml,
  maskSecret,
  oauthPage,
  oauthStateRejectedPage,
  verifyOAuthState,
} from "./lib/oauthPage";

function normalizeRedirectUri(uri: string) {
  const u = uri.trim();
  if (!u) return "https://www.producerhit.com/api/tiktok-oauth-callback/";
  return u.endsWith("/") ? u : `${u}/`;
}

const REDIRECT_URI = normalizeRedirectUri(
  process.env.TIKTOK_REDIRECT_URI ?? "https://www.producerhit.com/api/tiktok-oauth-callback/",
);

export default async function handler(
  req: { query?: Record<string, string | string[] | undefined>; method?: string },
  res: {
    setHeader: (key: string, value: string) => void;
    status: (code: number) => { send: (body: string) => void };
  },
) {
  try {
    return await handleTikTokOAuthCallback(req, res);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(500).send(
      oauthPage(
        "TikTok OAuth — erreur serveur",
        `<h1>Erreur callback</h1><p><code>${escapeHtml(msg)}</code></p>
<p>Vérifie les logs Vercel et <code>npm run vercel:sync-tiktok-env</code>.</p>`,
      ),
    );
  }
}

async function handleTikTokOAuthCallback(
  req: { query?: Record<string, string | string[] | undefined>; method?: string },
  res: {
    setHeader: (key: string, value: string) => void;
    status: (code: number) => { send: (body: string) => void };
  },
) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method && req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).send("Method not allowed");
  }

  const q = req.query ?? {};
  const state = String(q.state ?? "");
  if (!verifyOAuthState(state)) {
    return res.status(403).send(oauthStateRejectedPage());
  }

  const error = String(q.error ?? "");
  const errorDesc = String(q.error_description ?? "");
  if (error) {
    const hint =
      error === "access_denied"
        ? "<p>Ajoute <strong>@producerhit.com</strong> en target user Sandbox (https://www.tiktok.com/@producerhit.com) + autorise Login Kit.</p>"
        : "<p>Redirect URI Login Kit doit matcher exactement (toggle SANDBOX, pas Production). Voir login-kit-web doc.</p>";
    return res.status(400).send(
      oauthPage(
        "TikTok OAuth — erreur",
        `<h1>Erreur TikTok</h1><p><code>${escapeHtml(error)}</code> ${escapeHtml(errorDesc)}</p>${hint}`,
      ),
    );
  }

  const code = String(q.code ?? "");
  if (!code) {
    return res.status(400).send(oauthPage("TikTok OAuth", "<p>Parametre <code>code</code> manquant.</p>"));
  }

  const clientKey = (process.env.TIKTOK_CLIENT_KEY ?? process.env.TIKTOK_CLIENT_ID ?? "").trim();
  const clientSecret = (process.env.TIKTOK_CLIENT_SECRET ?? "").trim();
  if (!clientKey || !clientSecret) {
    return res.status(500).send(
      oauthPage(
        "TikTok OAuth",
        "<p>Secrets manquants sur Vercel. Ajoute <code>TIKTOK_CLIENT_KEY</code> et <code>TIKTOK_CLIENT_SECRET</code>, puis redeploy.</p>",
      ),
    );
  }

  const body = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: REDIRECT_URI,
  });

  const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = (await tokenRes.json()) as {
    access_token?: string;
    refresh_token?: string;
    open_id?: string;
    error_code?: number;
    error_description?: string;
    message?: string;
    error?: string;
  };

  if (!tokenRes.ok || json.error_code || json.error || !json.refresh_token) {
    const safeJson = escapeHtml(JSON.stringify(json, null, 2));
    return res.status(400).send(
      oauthPage(
        "TikTok OAuth — echec token",
        `<h1>Echange token echoue</h1><pre>${safeJson}</pre>
<p>redirect_uri utilise: <code>${escapeHtml(REDIRECT_URI)}</code></p>
<p>Pour la valeur complete du token, utilise: <code>npm run tiktok:oauth -- --code=VOTRE_CODE</code></p>`,
      ),
    );
  }

  const maskedRefresh = maskSecret(json.refresh_token);
  const openId = escapeHtml(json.open_id ?? "—");

  return res.status(200).send(
    oauthPage(
      "TikTok OAuth — OK",
      `<h1>TikTok connecte</h1>
<p>Refresh token obtenu (masque): <code>${escapeHtml(maskedRefresh)}</code></p>
<p>Recupere la valeur complete en local :</p>
<pre>npm run tiktok:oauth -- --code=${escapeHtml(code)}</pre>
<p>Puis configure Supabase :</p>
<pre>supabase secrets set TIKTOK_REFRESH_TOKEN=...
supabase secrets set SOCIAL_PUBLISH_PLATFORMS=indexnow,youtube,tiktok</pre>
<p>open_id: <code>${openId}</code></p>`,
    ),
  );
}
