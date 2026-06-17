/** Helpers partagés pour les callbacks OAuth admin (XSS + masquage secrets). */

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function oauthPage(title: string, body: string): string {
  const safeTitle = escapeHtml(title);
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"/><meta name="robots" content="noindex"/><title>${safeTitle}</title>
<style>body{font-family:system-ui,sans-serif;max-width:640px;margin:40px auto;padding:0 16px;line-height:1.5}code{background:#111;color:#0f0;padding:2px 6px;border-radius:4px;word-break:break-all}pre{background:#111;color:#eee;padding:12px;border-radius:8px;overflow:auto}</style></head><body>${body}</body></html>`;
}

/** Masque un secret long ; l’admin doit utiliser le CLI local pour la valeur complète. */
export function maskSecret(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 8) return "****";
  return `${trimmed.slice(0, 4)}…${trimmed.slice(-4)} (${trimmed.length} car.)`;
}

export function oauthSetupSecret(): string {
  return (process.env.OAUTH_SETUP_SECRET ?? "").trim();
}

/** Quand OAUTH_SETUP_SECRET est défini, le param `state` doit correspondre (anti-CSRF setup). */
export function verifyOAuthState(state: string | undefined): boolean {
  const secret = oauthSetupSecret();
  if (!secret) return true;
  return (state ?? "").trim() === secret;
}

export function oauthStateRejectedPage(): string {
  return oauthPage(
    "OAuth — refusé",
    "<h1>Setup OAuth refusé</h1><p>Paramètre <code>state</code> invalide ou absent. Relance le script CLI avec <code>OAUTH_SETUP_SECRET</code> configuré.</p>",
  );
}
