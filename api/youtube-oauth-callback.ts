import {
  escapeHtml,
  maskSecret,
  oauthPage,
  oauthStateRejectedPage,
  verifyOAuthState,
} from "./lib/oauthPage";

const REDIRECT_URI = "https://www.producerhit.com/api/youtube-oauth-callback";

export default async function handler(
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
    return res.status(400).send(
      oauthPage(
        "YouTube OAuth — erreur",
        `<h1>Erreur Google OAuth</h1><p><code>${escapeHtml(error)}</code> ${escapeHtml(errorDesc)}</p>
<p>Vérifie la redirect URI dans Google Cloud Console et que YouTube Data API v3 est activée.</p>`,
      ),
    );
  }

  const code = String(q.code ?? "");
  if (!code) {
    return res.status(400).send(oauthPage("YouTube OAuth", "<p>Paramètre <code>code</code> manquant.</p>"));
  }

  const clientId = (process.env.YOUTUBE_CLIENT_ID ?? "").trim();
  const clientSecret = (process.env.YOUTUBE_CLIENT_SECRET ?? "").trim();
  if (!clientId || !clientSecret) {
    return res.status(500).send(
      oauthPage(
        "YouTube OAuth",
        "<p>Secrets manquants sur Vercel. Ajoute <code>YOUTUBE_CLIENT_ID</code> et <code>YOUTUBE_CLIENT_SECRET</code>, puis redéploie.</p>",
      ),
    );
  }

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: REDIRECT_URI,
    grant_type: "authorization_code",
  });

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = (await tokenRes.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    error?: string;
    error_description?: string;
  };

  if (!tokenRes.ok || json.error || !json.access_token) {
    const safeJson = escapeHtml(JSON.stringify(json, null, 2));
    return res.status(400).send(
      oauthPage("YouTube OAuth — échec token", `<h1>Échange token échoué</h1><pre>${safeJson}</pre>`),
    );
  }

  if (!json.refresh_token) {
    const safeMeta = escapeHtml(JSON.stringify({ scope: json.scope, expires_in: json.expires_in }, null, 2));
    return res.status(400).send(
      oauthPage(
        "YouTube OAuth",
        `<h1>Refresh token absent</h1>
<p>Relance <code>npm run youtube:oauth</code> — Google ne renvoie le refresh token qu'une fois.</p>
<p>Révoque l'accès dans <a href="https://myaccount.google.com/permissions">myaccount.google.com/permissions</a> puis réessaie avec <code>prompt=consent</code>.</p>
<pre>${safeMeta}</pre>`,
      ),
    );
  }

  const maskedRefresh = maskSecret(json.refresh_token);
  const scope = escapeHtml(json.scope ?? "—");

  return res.status(200).send(
    oauthPage(
      "YouTube OAuth — OK",
      `<h1>✅ YouTube connecté</h1>
<p>Refresh token obtenu (masqué): <code>${escapeHtml(maskedRefresh)}</code></p>
<p>Récupère la valeur complète en local :</p>
<pre>npm run youtube:oauth -- --web --code=${escapeHtml(code)}</pre>
<p>Puis :</p>
<pre>supabase secrets set YOUTUBE_CLIENT_ID=... YOUTUBE_CLIENT_SECRET=... YOUTUBE_REFRESH_TOKEN=...
supabase secrets set SOCIAL_PUBLISH_PLATFORMS=webhook,twitter,indexnow,youtube</pre>
<p>Scopes : <code>${scope}</code></p>`,
    ),
  );
}
