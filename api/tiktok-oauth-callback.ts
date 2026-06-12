const REDIRECT_URI = "https://www.producerhit.com/api/tiktok-oauth-callback";

function decodeState(state: string): string | null {
  try {
    const padded = state.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(padded, "base64").toString("utf8");
    const parsed = JSON.parse(json) as { v?: string };
    return typeof parsed.v === "string" && parsed.v.length >= 20 ? parsed.v : null;
  } catch {
    return null;
  }
}

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
    const hint =
      error === "access_denied"
        ? "<p>Ajoute le compte TikTok comme <strong>utilisateur test</strong> (Sandbox) dans TikTok Developers.</p>"
        : "<p>Vérifie Login Kit → Redirect URI HTTPS exacte, et que Login Kit est activé sur l'app.</p>";
    return res
      .status(400)
      .send(page("TikTok OAuth — erreur", `<h1>Erreur TikTok</h1><p><code>${error}</code> ${errorDesc}</p>${hint}`));
  }

  const code = String(q.code ?? "");
  const state = String(q.state ?? "");
  if (!code || !state) {
    return res.status(400).send(page("TikTok OAuth", "<p>Paramètres <code>code</code> ou <code>state</code> manquants.</p>"));
  }

  const verifier = decodeState(state);
  if (!verifier) {
    return res.status(400).send(page("TikTok OAuth", "<p>State OAuth invalide — relance <code>npm run tiktok:oauth</code>.</p>"));
  }

  const clientKey = (process.env.TIKTOK_CLIENT_KEY ?? process.env.TIKTOK_CLIENT_ID ?? "").trim();
  const clientSecret = (process.env.TIKTOK_CLIENT_SECRET ?? "").trim();
  if (!clientKey || !clientSecret) {
    return res
      .status(500)
      .send(
        page(
          "TikTok OAuth",
          "<p>Secrets manquants sur Vercel. Ajoute <code>TIKTOK_CLIENT_KEY</code> et <code>TIKTOK_CLIENT_SECRET</code>, puis redéploie.</p>",
        ),
      );
  }

  const body = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier,
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
  };

  if (!tokenRes.ok || json.error_code || !json.refresh_token) {
    return res.status(400).send(
      page(
        "TikTok OAuth — échec token",
        `<h1>Échange token échoué</h1><pre>${JSON.stringify(json, null, 2)}</pre>`,
      ),
    );
  }

  res.setHeader("Cache-Control", "no-store");
  return res.status(200).send(
    page(
      "TikTok OAuth — OK",
      `<h1>✅ TikTok connecté</h1>
<p>Ajoute ce refresh token dans <strong>.env</strong> et Supabase secrets :</p>
<pre>TIKTOK_REFRESH_TOKEN=${json.refresh_token}</pre>
<p>Puis :</p>
<pre>supabase secrets set TIKTOK_REFRESH_TOKEN=...
supabase secrets set SOCIAL_PUBLISH_PLATFORMS=webhook,twitter,indexnow,tiktok</pre>
<p>open_id: <code>${json.open_id ?? "—"}</code></p>`,
    ),
  );
}
