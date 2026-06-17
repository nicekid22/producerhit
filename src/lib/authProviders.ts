import type { User } from "@supabase/supabase-js";
import { extractErrorMessage } from "@/lib/profileBootstrap";

import type { AppLocale } from "@/i18n/config";
export type AuthProviderKind = "email" | "google" | "other";

export function getLinkedProviders(user: User | null | undefined): AuthProviderKind[] {
  const identities = user?.identities ?? [];
  const providers = new Set<AuthProviderKind>();

  for (const identity of identities) {
    const provider = String(identity.provider ?? "").toLowerCase();
    if (provider === "email") providers.add("email");
    else if (provider === "google") providers.add("google");
    else if (provider) providers.add("other");
  }

  if (providers.size === 0 && user?.email) {
    providers.add("email");
  }

  return [...providers];
}

export function hasEmailPassword(user: User | null | undefined): boolean {
  return getLinkedProviders(user).includes("email");
}

export function hasGoogleAuth(user: User | null | undefined): boolean {
  return getLinkedProviders(user).includes("google");
}

export function mapAuthError(
  error: unknown,
  locale: AppLocale,
  context: "login" | "signup" | "google" | "link" | "password",
): string {
  const raw = extractErrorMessage(error).toLowerCase();

  if (raw.includes("invalid login credentials") || raw.includes("invalid credentials")) {
    return locale === "fr"
      ? "Email ou mot de passe incorrect. Inscrit avec Google ? Utilise « Continuer avec Google » ou « Mot de passe oublié » pour en créer un."
      : "Invalid email or password. Signed up with Google? Use Continue with Google or Forgot password to set one.";
  }

  if (
    raw.includes("user already registered") ||
    raw.includes("already been registered") ||
    raw.includes("email address is already registered")
  ) {
    return locale === "fr"
      ? "Un compte existe déjà avec cet email. Connecte-toi, utilise Google, ou « Mot de passe oublié »."
      : "An account already exists with this email. Sign in, use Google, or Forgot password.";
  }

  if (raw.includes("email not confirmed")) {
    return locale === "fr"
      ? "Confirme ton email avant de te connecter (vérifie ta boîte mail)."
      : "Confirm your email before signing in (check your inbox).";
  }

  if (raw.includes("manual linking") || raw.includes("linking is disabled")) {
    return locale === "fr"
      ? "La liaison de comptes doit être activée dans Supabase Auth (Manual linking)."
      : "Account linking must be enabled in Supabase Auth (Manual linking).";
  }

  if (
    raw.includes("identity is already linked") ||
    raw.includes("already linked to another user") ||
    raw.includes("email already in use")
  ) {
    return locale === "fr"
      ? "Cet email Google est déjà lié à un autre compte. Connecte-toi avec ce compte ou utilise le même email partout."
      : "This Google email is already linked to another account. Sign in with that account or use the same email.";
  }

  if (raw.includes("oauth_session_missing") || raw.includes("session missing")) {
    return locale === "fr"
      ? "Session Google introuvable — réessaie ou vérifie l'URL de redirection /auth/callback dans Supabase."
      : "Google session missing — retry or add /auth/callback to Supabase redirect URLs.";
  }

  if (
    raw.includes("pkce") ||
    raw.includes("code verifier") ||
    raw.includes("verifier not found") ||
    raw.includes("non-empty")
  ) {
    return locale === "fr"
      ? "Connexion interrompue — réessaie depuis le même navigateur (pas de navigation privée)."
      : "Sign-in interrupted — retry from the same browser (not private browsing).";
  }

  if (raw.includes("invalid_grant") || raw.includes("invalid code") || raw.includes("expired")) {
    return locale === "fr"
      ? "Lien Google expiré ou déjà utilisé — relance « Continuer avec Google »."
      : "Google link expired or already used — tap Continue with Google again.";
  }

  if (
    raw.includes("database error saving new user") ||
    raw.includes("error saving new user") ||
    (raw.includes("unexpected_failure") && raw.includes("database"))
  ) {
    return locale === "fr"
      ? "Impossible de créer ton profil Studio — réessaie dans un instant. Si ça persiste, contacte le support (erreur base de données)."
      : "Could not create your Studio profile — try again shortly. If it persists, contact support (database error).";
  }

  if (raw.includes("server_error") || raw.includes("unexpected_failure")) {
    return locale === "fr"
      ? "Erreur serveur à l'inscription — réessaie ou utilise un autre email."
      : "Server error during sign-up — retry or use another email.";
  }

  if (context === "google") {
    return locale === "fr" ? "Connexion Google impossible. Réessaie." : "Google sign-in failed. Try again.";
  }

  if (context === "password") {
    return locale === "fr" ? "Impossible de mettre à jour le mot de passe." : "Could not update password.";
  }

  if (context === "link") {
    return locale === "fr" ? "Impossible de lier Google à ce compte." : "Could not link Google to this account.";
  }

  return extractErrorMessage(error) || (locale === "fr" ? "Authentification impossible." : "Authentication failed.");
}
