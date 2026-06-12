const REDIRECT_URI = "https://www.producerhit.com/api/youtube-oauth-callback";

function page(title: string, body: string) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"/><meta name="robots" content="noindex"/><title>${title}</title>
<style>body{font-family:system-ui,sans-serif;max-width:640px;margin:40px auto;padding:0 16px;line-height:1.5}code{background:#111;color:#0f0;padding:2px 6px;border-radius:4px;word-break:break-all}pre{background:#111;color:#eee;padding:12px;border-radius:8px;overflow:auto}</style></head><body>${body}</body></html>`;
}

export default async function handler(
  req: { query?: Record<string, string | string[] | undefined>; method?: string },
  res: {
    setHeader: (key: string, value: string) => void;
    status: (code: number) => { send: (body: string) => void };
  },
) {
  if (req.method && req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).send("Method not allowed");
  }

  const q = req.query ?? {};
  const error = String(q.error ?? "");
  const errorDesc = String(q.error_description ?? "");
  if (error) {
    return res.status(400).send(
      page(
        "YouTube OAuth — erreur",
        `<h1>Erreur Google OAuth</h1><p><code>${error}</code> ${errorDesc}</p>
<p>Vérifie la redirect URI dans Google Cloud Console et que YouTube Data API v3 est activée.</p>`,
      ),
    );
  }

  const code = String(q.code ?? "");
  if (!code) {
    return res.status(400).send(page("YouTube OAuth", "<p>Paramètre <code>code</code> manquant.</p>"));
  }

  const clientId = (process.env.YOUTUBE_CLIENT_ID ?? "").trim();
  const clientSecret = (process.env.YOUTUBE_CLIENT_SECRET ?? "").trim();
  if (!clientId || !clientSecret) {
    return res.status(500).send(
      page(
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
    return res.status(400).send(
      page("YouTube OAuth — échec token", `<h1>Échange token échoué</h1><pre>${JSON.stringify(json, null, 2)}</pre>`),
    );
  }

  if (!json.refresh_token) {
    return res.status(400).send(
      page(
        "YouTube OAuth",
        `<h1>Refresh token absent</h1>
<p>Relance <code>npm run youtube:oauth</code> — Google ne renvoie le refresh token qu'une fois.</p>
<p>Révoque l'accès dans <a href="https://myaccount.google.com/permissions">myaccount.google.com/permissions</a> puis réessaie avec <code>prompt=consent</code>.</p>
<pre>${JSON.stringify({ scope: json.scope, expires_in: json.expires_in }, null, 2)}</pre>`,
      ),
    );
  }

  res.setHeader("Cache-Control", "no-store");
  return res.status(200).send(
    page(
      "YouTube OAuth — OK",
      `<h1>✅ YouTube connecté</h1>
<p>Ajoute dans <strong>.env</strong> et Supabase secrets :</p>
<pre>YOUTUBE_REFRESH_TOKEN=${json.refresh_token}</pre>
<p>Puis :</p>
<pre>supabase secrets set YOUTUBE_CLIENT_ID=... YOUTUBE_CLIENT_SECRET=... YOUTUBE_REFRESH_TOKEN=...
supabase secrets set SOCIAL_PUBLISH_PLATFORMS=webhook,twitter,indexnow,youtube</pre>
<p>Scopes : <code>${json.scope ?? "—"}</code></p>`,
    ),
  );
}
