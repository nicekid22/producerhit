/** Chemins sûrs après connexion — évite de renvoyer sur la landing par erreur. */
export function sanitizePostAuthPath(path: string | null | undefined): string {
  const raw = (path ?? "").trim();
  if (!raw.startsWith("/")) return "/dashboard";
  if (raw === "/" || raw === "/home") return "/dashboard";
  if (raw.startsWith("/auth")) return "/dashboard";
  return raw;
}

const JUST_AUTHED_KEY = "producerhit_just_authed";

export function markJustAuthenticated(): void {
  try {
    sessionStorage.setItem(JUST_AUTHED_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function consumeJustAuthenticated(): boolean {
  try {
    if (sessionStorage.getItem(JUST_AUTHED_KEY) === "1") {
      sessionStorage.removeItem(JUST_AUTHED_KEY);
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

export function hasOAuthCallbackParams(): boolean {
  if (typeof window === "undefined") return false;
  const search = window.location.search;
  const hash = window.location.hash;
  return (
    search.includes("code=") ||
    hash.includes("access_token") ||
    hash.includes("type=magiclink") ||
    hash.includes("type=recovery")
  );
}
