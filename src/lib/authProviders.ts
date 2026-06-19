import type { User } from "@supabase/supabase-js";

export type AuthProviderKind = "email" | "google" | "other";

export { mapAuthError } from "@/i18n/systemCatalog";

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
