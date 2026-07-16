import type { User } from "@supabase/supabase-js";
import { isSupabaseDown } from "@/lib/supabaseHealth";
import type { UserProfileRow } from "@/lib/profileBootstrap";

/**
 * Offline auth fallback — en cas d'indisponibilité Supabase, permet
 * d'afficher le profil utilisateur en cache (localStorage) au lieu
 * d'un écran d'erreur. NE CONCÈDE AUCUNE PERMISSION — c'est purement
 * cosmétique pour ne pas paralyser l'app.
 */

const CACHE_KEY = "producerhit_offline_user_v1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 h

interface CachedAuth {
  userId: string;
  email: string | null;
  plan: string | null;
  createdAt: string; // ISO timestamp
  cachedAt: number; // epoch ms
  profile: {
    username: string | null;
    plan: string;
    avatar_id: number;
    creator_type: string | null;
    bio: string | null;
  } | null;
}

// ---------------------------------------------------------------------------
// Cache read / write
// ---------------------------------------------------------------------------

function safeJsonParse(raw: string): CachedAuth | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "userId" in parsed && "cachedAt" in parsed) {
      return parsed as CachedAuth;
    }
    return null;
  } catch {
    return null;
  }
}

function readCache(): CachedAuth | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = safeJsonParse(raw);
    if (!parsed) return null;
    // Expire after 24 h.
    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Call this every time a Supabase auth succeeds + profile loads.
 * Stores the essential user data in localStorage for offline fallback.
 */
export function cacheAuthSession(user: User, profile: UserProfileRow | null): void {
  try {
    const data: CachedAuth = {
      userId: user.id,
      email: user.email ?? null,
      plan: profile?.plan ?? null,
      createdAt: user.created_at,
      cachedAt: Date.now(),
      profile: profile
        ? {
            username: profile.username,
            plan: profile.plan,
            avatar_id: profile.avatar_id,
            creator_type: profile.creator_type,
            bio: profile.bio,
          }
        : null,
    };
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota errors */
  }
}

/**
 * Clears the cached auth (e.g. on explicit sign-out).
 */
export function clearCachedAuth(): void {
  try {
    window.localStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Returns the cached user profile if:
 *  - Supabase is currently detected as down
 *  - A cached session exists and is < 24 h old
 *
 * Otherwise returns null.
 */
export function getCachedUser(): CachedAuth | null {
  if (!isSupabaseDown()) return null;
  return readCache();
}

/**
 * Returns a minimal "User"-like object from cache for display purposes.
 * Does NOT grant any actual auth permissions.
 */
export function getOfflineUser(): User | null {
  const cached = getCachedUser();
  if (!cached) return null;
  return {
    id: cached.userId,
    email: cached.email,
    created_at: cached.createdAt,
    aud: "authenticated",
    role: "authenticated",
  } as unknown as User;
}

/**
 * Returns the cached profile row for offline display.
 */
export function getOfflineProfile(): UserProfileRow | null {
  const cached = readCache();
  if (!cached?.profile || !isSupabaseDown()) return null;
  const p = cached.profile;
  return {
    username: p.username,
    plan: p.plan,
    avatar_id: p.avatar_id,
    creator_type: p.creator_type,
    bio: p.bio,
    legal_first_name: null,
    legal_last_name: null,
    loops_used_this_month: 0,
    referral_bonus: 0,
    purchased_bonus: 0,
    referral_code: null,
    level_bonus: 0,
    daily_bonus_month: 0,
    social: {},
    voice_to_song_used_this_month: 0,
    voice_clone_used_this_month: 0,
    hosted_audio_expires_at: null,
  };
}

/**
 * Simple check — is the app currently in offline / degraded mode?
 */
export function isOfflineMode(): boolean {
  return isSupabaseDown() && readCache() !== null;
}
