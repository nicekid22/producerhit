import { supabase } from "@/lib/supabaseClient";
import { extractErrorMessage, isBenignProfileSyncError } from "@/lib/errorMessage";
import { isFirebaseReady } from "@/lib/firebaseSupabaseClient";
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

const PROFILE_SELECT_FULL =
  "username, legal_first_name, legal_last_name, plan, loops_used_this_month, voice_to_song_used_this_month, voice_clone_used_this_month, referral_bonus, purchased_bonus, referral_code, level_bonus, daily_bonus_month, avatar_id, bio, creator_type, social, hosted_audio_expires_at";

const PROFILE_SELECT_CREATOR =
  "username, legal_first_name, legal_last_name, plan, loops_used_this_month, level_bonus, daily_bonus_month, avatar_id, bio, creator_type, social";

const PROFILE_SELECT_BASE = "username, plan, loops_used_this_month";

const PROFILE_SELECT_MIN = "plan, loops_used_this_month";

function isMissingRpcError(message: string): boolean {
  const msg = message.toLowerCase();
  return msg.includes("could not find the function") || msg.includes("schema cache");
}

function isBenignProfileWriteError(message: string): boolean {
  const msg = message.toLowerCase();
  return msg.includes("duplicate") || msg.includes("conflict") || msg.includes("already exists");
}

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

async function waitForAuthSession(maxAttempts = 3): Promise<void> {
  // In Firebase mode, auth is synchronous (auth.currentUser) — no polling needed
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) return;

  // Fallback: brief polling for edge cases (redirect returning)
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    await new Promise((resolve) => window.setTimeout(resolve, 100 * (attempt + 1)));
    const { data: { session: s } } = await supabase.auth.getSession();
    if (s?.access_token) return;
  }
  throw new Error("not_authenticated");
}

async function runOptionalRpc(
  name: "ensure_profile" | "reconcile_profile_by_email" | "load_session_profile" | "repair_missing_profile",
): Promise<ReconcileResult | null> {
  const { data, error } = await supabase.rpc(name);
  if (error) {
    if (!isMissingRpcError(error.message) && import.meta.env.DEV) {
      console.warn(`[profileBootstrap] ${name}:`, error.message);
    }
    return null;
  }
  if (data && typeof data === "object") {
    return data as ReconcileResult;
  }
  return { ok: true, status: name };
}

async function ensureProfileRow(userId: string, email?: string | null): Promise<void> {
  await runOptionalRpc("repair_missing_profile");
  await runOptionalRpc("ensure_profile");

  const { data: existing } = await supabase.from("profiles").select("id").eq("id", userId).maybeSingle();
  if (existing?.id) return;

  const payload: Record<string, unknown> = { id: userId };
  if (email) payload.email = email;

  const { error: insertError } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
  if (!insertError || isBenignProfileWriteError(insertError.message)) return;

  if (/column/i.test(insertError.message) && email) {
    const { error: retryError } = await supabase.from("profiles").upsert({ id: userId }, { onConflict: "id" });
    if (!retryError || isBenignProfileWriteError(retryError.message)) return;
  }
}

async function selectProfileRow(userId: string, columns: string): Promise<UserProfileRow | null> {
  const { data, error } = await supabase.from("profiles").select(columns).eq("id", userId).maybeSingle();
  if (error) throw error;
  if (!data || typeof data !== "object") return null;
  return normalizeProfileRow(data as unknown as Record<string, unknown>);
}

export async function fetchUserProfile(userId: string, email?: string | null): Promise<UserProfileRow> {
  try {
    const full = await selectProfileRow(userId, PROFILE_SELECT_FULL);
    if (full) return full;
  } catch (err) {
    const message = extractErrorMessage(err);
    if (!/column/i.test(message)) throw err;
  }

  try {
    const creator = await selectProfileRow(userId, PROFILE_SELECT_CREATOR);
    if (creator) return creator;
  } catch (err) {
    const message = extractErrorMessage(err);
    if (!/column/i.test(message)) throw err;
  }

  try {
    const base = await selectProfileRow(userId, PROFILE_SELECT_BASE);
    if (base) return base;
  } catch (err) {
    const message = extractErrorMessage(err);
    if (!/column/i.test(message)) throw err;
  }

  try {
    const minimal = await selectProfileRow(userId, PROFILE_SELECT_MIN);
    if (minimal) return minimal;
  } catch (err) {
    const message = extractErrorMessage(err);
    if (!/column/i.test(message)) throw err;
  }

  await ensureProfileRow(userId, email);

  const created = await selectProfileRow(userId, PROFILE_SELECT_BASE);
  if (created) return created;

  const minimal = await selectProfileRow(userId, PROFILE_SELECT_MIN);
  if (minimal) return minimal;

  throw new Error("PGRST116 profile missing");
}

export async function resetProfileUsageIfNeeded(): Promise<void> {
  const { error } = await supabase.rpc("reset_loops_usage_if_needed");
  if (!error) return;
  if (isMissingRpcError(error.message)) return;
}

export async function bootstrapUserProfile(userId: string, email?: string | null): Promise<ProfileBootstrapResult> {
  await waitForAuthSession();
  const reconcile = (await runOptionalRpc("load_session_profile")) ?? (await runOptionalRpc("reconcile_profile_by_email"));
  await ensureProfileRow(userId, email);
  return {
    ok: true,
    merged: reconcile?.status === "merged",
    status: reconcile?.status ?? "direct_fetch",
  };
}

export async function loadUserProfile(userId: string, email?: string | null): Promise<UserProfileRow> {
  await waitForAuthSession();

  // In Firebase mode, all RPCs are no-ops — skip them entirely for speed
  if (!isFirebaseReady()) {
    await runOptionalRpc("repair_missing_profile");

    let reconcile: ReconcileResult | null = null;
    try {
      reconcile = await runOptionalRpc("load_session_profile");
      if (reconcile?.ok === false && reconcile.error) {
        if (import.meta.env.DEV) console.warn("[profileBootstrap] load_session_profile:", reconcile.error);
        reconcile = await runOptionalRpc("reconcile_profile_by_email");
      }
    } catch {
      reconcile = await runOptionalRpc("reconcile_profile_by_email");
    }

    if (!reconcile) {
      await runOptionalRpc("ensure_profile");
      reconcile = await runOptionalRpc("reconcile_profile_by_email");
    }

    await resetProfileUsageIfNeeded().catch(() => undefined);
  }

  const row = await fetchUserProfile(userId, email);
  return row;
}

let inflightProfileKey: string | null = null;
let inflightProfilePromise: Promise<UserProfileRow> | null = null;

/** Dedupes concurrent profile loads for the same user (avoids RPC races on login). */
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
  // Try Supabase first
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

  // Supabase failed — try Firebase Firestore as fallback
  // (Firebase Auth users get their profile created on first login)
  try {
    const { loadFirebaseProfile } = await import("@/lib/firebaseFallback");
    const fbProfile = await loadFirebaseProfile(userId, email ?? null);
    if (fbProfile) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return fbProfile as unknown as UserProfileRow;
    }
  } catch {
    // Firebase also failed
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
