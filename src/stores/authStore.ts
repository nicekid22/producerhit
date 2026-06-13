import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import {
  clearProfileLoadCache,
  extractErrorMessage,
  loadUserProfileWithRetry,
  readProfileCache,
  type UserProfileRow,
} from "@/lib/profileBootstrap";
import { clearReferralBonusTracking, notifyReferrerReferralBonusIfIncreased } from "@/lib/referralReferrerLoot";
import { resetClientSessionStores } from "@/lib/resetClientSession";
import { useLocaleStore } from "@/stores/localeStore";
import { sanitizePostAuthPath } from "@/lib/postAuthRedirect";

type AuthStatus = "idle" | "loading" | "ready";

type AuthState = {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  profile: UserProfileRow | null;
  lastError: string | null;
  profileReady: boolean;
  init: () => Promise<void>;
  refreshProfile: () => Promise<UserProfileRow | null>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, redirectPath?: string) => Promise<{ needsEmailConfirm: boolean }>;
  signInWithGoogle: (emailHint?: string, nextPath?: string) => Promise<void>;
  linkGoogle: (nextPath?: string) => Promise<void>;
  setPassword: (password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Après OAuth Google / liaison — session + sync profil garanti (évite quota bloqué). */
  completeAuthCallbackSession: (session: Session) => Promise<UserProfileRow | null>;
};

let authUnsub: (() => void) | null = null;
let profileSyncToken = 0;
let authInitDone = false;
const PROFILE_SYNC_TIMEOUT_MS = 12_000;

function authUserId(): string | null {
  return useAuthStore.getState().user?.id ?? null;
}

function isSessionStillActive(session: Session | null): boolean {
  const uid = session?.user?.id;
  if (!uid) return false;
  return authUserId() === uid;
}

function abortStaleProfileSync(token: number): boolean {
  if (token === profileSyncToken) return false;
  if (!authUserId()) {
    useAuthStore.setState({ profileReady: true, profile: null, lastError: null });
  }
  return true;
}

async function loadProfileWithTimeout(session: Session): Promise<UserProfileRow> {
  const userId = session.user.id;
  const email = session.user.email ?? null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      loadUserProfileWithRetry(userId, email),
      new Promise<UserProfileRow>((_, reject) => {
        timer = setTimeout(() => reject(new Error("profile_load_timeout")), PROFILE_SYNC_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function authCallbackUrl(nextPath = "/dashboard"): string {
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(sanitizePostAuthPath(nextPath))}`;
}

/** Never call supabase.auth.* synchronously inside onAuthStateChange — defer to avoid deadlocks. */
function scheduleProfileSync(session: Session): void {
  const userId = session.user.id;
  const hasProfile = !!useAuthStore.getState().profile && useAuthStore.getState().user?.id === userId;
  window.setTimeout(() => {
    if (authUserId() !== userId) return;
    void syncProfileForSession(session, { soft: hasProfile });
  }, 0);
}

function isBenignProfileSyncError(message: string): boolean {
  const raw = message.toLowerCase();
  return (
    raw.includes("not authenticated") ||
    raw.includes("jwt") ||
    raw.includes("auth session missing") ||
    raw.includes("pkce") ||
    raw.includes("code verifier") ||
    raw.includes("oauth_session_missing")
  );
}

async function syncProfileForSession(
  session: Session | null,
  options?: { soft?: boolean },
): Promise<UserProfileRow | null> {
  if (!session?.user) {
    useAuthStore.setState({ profileReady: true, profile: null, lastError: null });
    return null;
  }
  if (!isSessionStillActive(session)) return null;

  const token = ++profileSyncToken;
  const hasProfile = !!useAuthStore.getState().profile;
  if (options?.soft && hasProfile) {
    useAuthStore.setState({ lastError: null });
  } else if (hasProfile && authUserId() === session.user.id) {
    // Refresh en arrière-plan — ne pas masquer le quota / settings déjà affichés.
    useAuthStore.setState({ lastError: null });
  } else if (readProfileCache(session.user.id)) {
    // Quota en cache local — évite le flash « Chargement du quota… » au refresh.
    useAuthStore.setState({ lastError: null });
  } else if (isSessionStillActive(session)) {
    useAuthStore.setState({ profileReady: false, lastError: null });
  }

  const commitProfile = (row: UserProfileRow): UserProfileRow | null => {
    if (abortStaleProfileSync(token)) return row;
    if (!isSessionStillActive(session)) return null;
    const previousBonus = useAuthStore.getState().profile?.referral_bonus;
    useAuthStore.setState({ profile: row, profileReady: true, lastError: null });
    notifyReferrerReferralBonusIfIncreased(
      session.user.id,
      previousBonus,
      row.referral_bonus,
      useLocaleStore.getState().locale,
    );
    return row;
  };

  try {
    const row = await loadProfileWithTimeout(session);
    return commitProfile(row);
  } catch (err) {
    const message = extractErrorMessage(err);
    if (abortStaleProfileSync(token)) return null;
    if (!isSessionStillActive(session)) return null;

    if (isBenignProfileSyncError(message) || message === "profile_load_timeout") {
      await new Promise((r) => window.setTimeout(r, 700));
      if (abortStaleProfileSync(token)) return null;
      if (!isSessionStillActive(session)) return null;
      try {
        const row = await loadProfileWithTimeout(session);
        return commitProfile(row);
      } catch (retryErr) {
        if (abortStaleProfileSync(token)) return null;
        if (!isSessionStillActive(session)) return null;
        const retryMessage = extractErrorMessage(retryErr);
        if (isBenignProfileSyncError(retryMessage) || retryMessage === "profile_load_timeout") {
          useAuthStore.setState({ profileReady: true, lastError: null });
          return null;
        }
        useAuthStore.setState({
          profileReady: true,
          lastError: retryMessage,
        });
        return null;
      }
    }

    useAuthStore.setState({
      profileReady: true,
      lastError: message,
    });
    return null;
  }
}

function clearAuthState(): void {
  profileSyncToken += 1;
  clearProfileLoadCache();
  const userId = useAuthStore.getState().user?.id;
  useAuthStore.setState({
    session: null,
    user: null,
    profile: null,
    profileReady: true,
    lastError: null,
  });
  if (userId) clearReferralBonusTracking(userId);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: "idle",
  session: null,
  user: null,
  profile: null,
  lastError: null,
  profileReady: true,
  refreshProfile: async () => {
    const user = get().user;
    if (!user) return null;
    const { data } = await supabase.auth.getSession();
    if (!data.session?.access_token) return null;
    if (get().user?.id !== user.id) return null;
    set({ session: data.session, user: data.session.user });
    return syncProfileForSession(data.session, { soft: true });
  },
  init: async () => {
    if (authInitDone) return;
    authInitDone = true;
    if (get().status !== "idle") return;
    set({ status: "loading" });

    if (!authUnsub) {
      const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "TOKEN_REFRESHED" && session) {
          if (authUserId()) set({ session });
          return;
        }
        if (event === "SIGNED_OUT") {
          clearAuthState();
          return;
        }
        if (!session?.user) return;
        set({ session, user: session.user });
        if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "USER_UPDATED") {
          scheduleProfileSync(session);
        }
      });
      authUnsub = () => sub.subscription.unsubscribe();
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    set({ session, user: session?.user ?? null });
    if (session?.user) {
      scheduleProfileSync(session);
    }

    set({ status: "ready" });
  },
  signInWithPassword: async (email, password) => {
    set({ lastError: null });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ lastError: error.message });
      throw error;
    }
    if (data.session) {
      set({ session: data.session, user: data.session.user });
      scheduleProfileSync(data.session);
    }
  },
  signUp: async (email, password, redirectPath = "/dashboard") => {
    set({ lastError: null });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: authCallbackUrl(redirectPath),
      },
    });
    if (error) {
      set({ lastError: error.message });
      throw error;
    }
    const needsEmailConfirm = !data.session;
    if (data.session) {
      set({ session: data.session, user: data.session.user });
      scheduleProfileSync(data.session);
    }
    return { needsEmailConfirm };
  },
  signInWithGoogle: async (emailHint, nextPath = "/dashboard") => {
    set({ lastError: null });
    const queryParams: Record<string, string> = {
      prompt: "select_account",
    };
    if (emailHint?.trim()) {
      queryParams.login_hint = emailHint.trim();
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: authCallbackUrl(nextPath),
        queryParams,
      },
    });
    if (error) {
      set({ lastError: error.message });
      throw error;
    }
  },
  linkGoogle: async (nextPath = "/settings") => {
    set({ lastError: null });
    const { error } = await supabase.auth.linkIdentity({
      provider: "google",
      options: {
        redirectTo: authCallbackUrl(nextPath),
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) {
      set({ lastError: error.message });
      throw error;
    }
  },
  setPassword: async (password) => {
    set({ lastError: null });
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) {
      set({ lastError: error.message });
      throw error;
    }
    if (data.user) {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        await syncProfileForSession(sessionData.session);
      }
    }
  },
  resetPassword: async (email) => {
    set({ lastError: null });
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset`,
    });
    if (error) {
      set({ lastError: error.message });
      throw error;
    }
  },
  signOut: async () => {
    clearAuthState();
    await resetClientSessionStores();
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) {
      set({ lastError: error.message });
      throw error;
    }
  },
  completeAuthCallbackSession: async (session) => {
    set({ session, user: session.user, lastError: null });
    return syncProfileForSession(session);
  },
}));
