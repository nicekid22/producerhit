import { extractErrorMessage, isBenignProfileSyncError } from "@/lib/errorMessage";
import { isFirebaseReady, getFirebaseApp } from "@/lib/firebaseSupabaseClient";
import { getAuth } from "firebase/auth";

type ReconcileResult = {
  ok?: boolean;
  status?: string;
  error?: string;
  email?: string;
  plan?: string;
};

export type UserProfileRow = {
  username: string | null;
  legal_first_name: string | null;
  legal_last_name: string | null;
  plan: string;
  loops_used_this_month: number;
  referral_bonus: number;
  purchased_bonus: number;
  referral_code: string | null;
  level_bonus: number;
  daily_bonus_month: number;
  avatar_id: number;
  bio: string | null;
  creator_type: string | null;
  social: Record<string, string>;
  voice_to_song_used_this_month: number;
  voice_clone_used_this_month: number;
  hosted_audio_expires_at: string | null;
};

export type ProfileBootstrapResult = {
  ok: boolean;
  merged?: boolean;
  skipped?: boolean;
  status?: string;
  error?: string;
};

export type ProfileCacheSnapshot = {
  plan: string;
  usedThisMonth: number;
  referralBonus: number;
  purchasedBonus: number;
  levelBonus: number;
  dailyBonusMonth: number;
};

const PROFILE_CACHE_USER_KEY = "producerhit_profile_cache_user";
const PROFILE_CACHE_REFERRAL_KEY = "producerhit_referral_bonus";
const PROFILE_CACHE_PURCHASED_KEY = "producerhit_purchased_bonus";
const PROFILE_CACHE_LEVEL_KEY = "producerhit_level_bonus";
const PROFILE_CACHE_DAILY_KEY = "producerhit_daily_bonus_month";

function readCachedNumber(key: string): number {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null || !Number.isFinite(Number(raw))) return 0;
    return Math.max(0, Number(raw));
  } catch {
    return 0;
  }
}

export function readProfileCache(userId: string): ProfileCacheSnapshot | null {
  if (!userId) return null;
  try {
    const cachedUser = window.localStorage.getItem(PROFILE_CACHE_USER_KEY);
    if (cachedUser !== userId) return null;
    const plan = window.localStorage.getItem("producerhit_plan");
    if (!plan) return null;
    const usedRaw = window.localStorage.getItem("producerhit_used_this_month");
    const usedThisMonth = usedRaw && Number.isFinite(Number(usedRaw)) ? Number(usedRaw) : 0;
    return {
      plan,
      usedThisMonth,
      referralBonus: readCachedNumber(PROFILE_CACHE_REFERRAL_KEY),
      purchasedBonus: readCachedNumber(PROFILE_CACHE_PURCHASED_KEY),
      levelBonus: readCachedNumber(PROFILE_CACHE_LEVEL_KEY),
      dailyBonusMonth: readCachedNumber(PROFILE_CACHE_DAILY_KEY),
    };
  } catch {
    return null;
  }
}

export { extractErrorMessage } from "@/lib/errorMessage";

function parseSocialField(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object") return {};
  const obj = raw as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const key of ["ig", "tt", "yt", "x", "web"]) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) out[key] = value.trim();
  }
  return out;
}

function normalizeProfileRow(data: Record<string, unknown> | null): UserProfileRow | null {
  if (!data) return null;
  return {
    username: typeof data.username === "string" ? data.username : null,
    legal_first_name: typeof data.legal_first_name === "string" ? data.legal_first_name : null,
    legal_last_name: typeof data.legal_last_name === "string" ? data.legal_last_name : null,
    plan: typeof data.plan === "string" ? data.plan : "free",
    loops_used_this_month: typeof data.loops_used_this_month === "number" ? data.loops_used_this_month : 0,
    voice_to_song_used_this_month:
      typeof data.voice_to_song_used_this_month === "number" ? data.voice_to_song_used_this_month : 0,
    voice_clone_used_this_month:
      typeof data.voice_clone_used_this_month === "number" ? data.voice_clone_used_this_month : 0,
    referral_bonus: typeof data.referral_bonus === "number" ? data.referral_bonus : 0,
    purchased_bonus: typeof data.purchased_bonus === "number" ? data.purchased_bonus : 0,
    referral_code: typeof data.referral_code === "string" ? data.referral_code : null,
    level_bonus: typeof data.level_bonus === "number" ? data.level_bonus : 0,
    daily_bonus_month: typeof data.daily_bonus_month === "number" ? data.daily_bonus_month : 0,
    avatar_id: typeof data.avatar_id === "number" ? data.avatar_id : 1,
    bio: typeof data.bio === "string" ? data.bio : null,
    creator_type: typeof data.creator_type === "string" ? data.creator_type : null,
    social: parseSocialField(data.social),
    hosted_audio_expires_at:
      typeof data.hosted_audio_expires_at === "string" ? data.hosted_audio_expires_at : null,
  };
}

function logProfileDebug(
  userId: string,
  email: string | null | undefined,
  reconcile: ReconcileResult | undefined,
  plan: string,
) {
  const debug =
    import.meta.env.DEV ||
    (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debug") === "1");
  if (!debug) return;
  console.info("[profileBootstrap]", { userId, email, reconcile, plan });
}

/**
 * Invoke the `ensure-profile` Edge Function to create/sync the profile in
 * Firestore. Uses the live Firebase ID token for authentication.
 * Throttled to once per 2 minutes per user.
 */
let _lastEnsureProfileUid: string | null = null;
let _lastEnsureProfileAt = 0;
export async function ensureSupabaseProfileForFirebaseUser(userId: string, email: string | null): Promise<void> {
  // Throttle: don't call more than once per 2 minutes per user.
  if (_lastEnsureProfileUid === userId && Date.now() - _lastEnsureProfileAt < 120_000) return;

  const app = getFirebaseApp();
  if (!app) return;
  const auth = getAuth(app);
  const user = auth.currentUser;
  if (!user || user.uid !== userId) return;

  const idToken = await user.getIdToken().catch(() => null);
  if (!idToken) return;

  try {
    // Dynamic import to avoid circular deps
    const { firebaseFunctionsInvoke } = await import("@/lib/firebaseSupabaseClient");
    await firebaseFunctionsInvoke("ensure-profile", {
      headers: { Authorization: `Bearer ${idToken}` },
      body: { email: email ?? null },
    });
  } catch {
    // best-effort
  }

  _lastEnsureProfileUid = userId;
  _lastEnsureProfileAt = Date.now();
}

/**
 * Load profile from Firestore via the firebaseFallback module.
 * This is the primary code path — no Supabase PostgREST involved.
 */
export async function fetchUserProfile(userId: string, email?: string | null): Promise<UserProfileRow> {
  const { loadFirebaseProfile } = await import("@/lib/firebaseFallback");
  const fbProfile = await loadFirebaseProfile(userId, email ?? null);
  if (fbProfile) {
    return normalizeProfileRow({
      plan: fbProfile.plan,
      username: fbProfile.username,
      loops_used_this_month: fbProfile.loops_used_this_month,
      referral_bonus: fbProfile.referral_bonus,
      purchased_bonus: fbProfile.purchased_bonus,
      referral_code: fbProfile.referral_code,
      level_bonus: fbProfile.level_bonus,
      daily_bonus_month: fbProfile.daily_bonus_month,
      avatar_id: fbProfile.avatar_id,
      bio: fbProfile.bio,
      creator_type: fbProfile.creator_type,
      social: fbProfile.social,
      voice_to_song_used_this_month: fbProfile.voice_to_song_used_this_month,
      voice_clone_used_this_month: fbProfile.voice_clone_used_this_month,
      hosted_audio_expires_at: fbProfile.hosted_audio_expires_at,
    }) as UserProfileRow;
  }
  throw new Error("profile_not_found");
}

export async function resetProfileUsageIfNeeded(): Promise<void> {
  // Monthly reset is handled server-side in Firestore (fbResetUsageIfNeeded).
  // No-op on the client.
}

export async function bootstrapUserProfile(userId: string, email?: string | null): Promise<ProfileBootstrapResult> {
  // Ensure profile exists in Firestore via Edge Function
  await ensureSupabaseProfileForFirebaseUser(userId, email ?? null);
  return {
    ok: true,
    status: "firestore_ensured",
  };
}

export async function loadUserProfile(userId: string, email?: string | null): Promise<UserProfileRow> {
  // Ensure profile exists in Firestore (throttled)
  if (isFirebaseReady()) {
    try {
      await ensureSupabaseProfileForFirebaseUser(userId, email ?? null);
    } catch {
      // best-effort — Firestore fallback below will still work
    }
  }

  // Read profile from Firestore
  const row = await fetchUserProfile(userId, email);
  return row;
}

let inflightProfileKey: string | null = null;
let inflightProfilePromise: Promise<UserProfileRow> | null = null;

/** Dedupes concurrent profile loads for the same user. */
export async function loadUserProfileOnce(userId: string, email?: string | null): Promise<UserProfileRow> {
  const key = `${userId}:${email ?? ""}`;
  if (inflightProfilePromise && inflightProfileKey === key) {
    return inflightProfilePromise;
  }
  inflightProfileKey = key;
  inflightProfilePromise = loadUserProfile(userId, email).finally(() => {
    if (inflightProfileKey === key) {
      inflightProfileKey = null;
      inflightProfilePromise = null;
    }
  });
  return inflightProfilePromise;
}

export function clearProfileLoadCache(): void {
  inflightProfileKey = null;
  inflightProfilePromise = null;
}

export async function loadUserProfileWithRetry(
  userId: string,
  email?: string | null,
  attempts = 3,
): Promise<UserProfileRow> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await loadUserProfileOnce(userId, email);
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) {
        await new Promise((r) => window.setTimeout(r, 350 * (i + 1)));
      }
    }
  }
  throw lastError ?? new Error("profile_load_failed");
}

export function syncProfileCache(
  plan: string,
  usedThisMonth: number,
  userId?: string,
  extras?: Pick<UserProfileRow, "referral_bonus" | "level_bonus" | "daily_bonus_month"> & {
    purchased_bonus?: number;
  },
): void {
  try {
    window.localStorage.setItem("producerhit_plan", plan);
    window.localStorage.setItem("producerhit_used_this_month", String(usedThisMonth));
    if (userId) window.localStorage.setItem(PROFILE_CACHE_USER_KEY, userId);
    if (extras) {
      window.localStorage.setItem(PROFILE_CACHE_REFERRAL_KEY, String(extras.referral_bonus ?? 0));
      window.localStorage.setItem(PROFILE_CACHE_PURCHASED_KEY, String(extras.purchased_bonus ?? 0));
      window.localStorage.setItem(PROFILE_CACHE_LEVEL_KEY, String(extras.level_bonus ?? 0));
      window.localStorage.setItem(PROFILE_CACHE_DAILY_KEY, String(extras.daily_bonus_month ?? 0));
    }
  } catch {
    // ignore
  }
}

export { profileLoadErrorMessage } from "@/i18n/systemCatalog";

export function shouldShowProfileLoadToast(error: unknown): boolean {
  return !isBenignProfileSyncError(extractErrorMessage(error));
}
