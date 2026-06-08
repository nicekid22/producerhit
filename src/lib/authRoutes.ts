import { buildDashboardUrlFromLandingPending } from "@/lib/landingPendingGeneration";
import { sanitizePostAuthPath } from "@/lib/postAuthRedirect";

export type AuthMode = "login" | "signup";

/** Onglet auth par défaut : signup (CTAs « essai gratuit »). `?mode=login` pour connexion explicite. */
export function resolveAuthModeFromSearch(search: string): AuthMode {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const mode = params.get("mode")?.toLowerCase();
  if (mode === "login") return "login";
  if (mode === "signup" || params.get("signup") === "1") return "signup";
  return "signup";
}

export function buildAuthUrl(options?: { mode?: AuthMode; next?: string | null }): string {
  const params = new URLSearchParams();
  const mode = options?.mode ?? "signup";
  if (mode === "login") params.set("mode", "login");
  else params.set("signup", "1");
  const next = options?.next?.trim();
  if (next && next.startsWith("/")) params.set("next", next);
  return `/auth?${params.toString()}`;
}

/** Priorité : destination explicite (`?next=`, checkout…) > prompt landing > dashboard. */
export function resolvePostAuthRedirect(explicitNext: string | null | undefined): string {
  const safe = sanitizePostAuthPath(explicitNext);
  const isBareDashboard = safe === "/dashboard";
  if (!isBareDashboard) return safe;

  const fromLanding = buildDashboardUrlFromLandingPending();
  if (fromLanding) return fromLanding;
  return safe;
}

export function isFreshOAuthSignup(user: { created_at?: string; last_sign_in_at?: string | null }): boolean {
  const created = Date.parse(user.created_at ?? "");
  const lastSignIn = Date.parse(user.last_sign_in_at ?? user.created_at ?? "");
  if (!Number.isFinite(created) || !Number.isFinite(lastSignIn)) return false;
  return lastSignIn - created < 120_000;
}
