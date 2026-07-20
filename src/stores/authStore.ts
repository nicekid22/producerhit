import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import {
  fbSignInWithPassword, fbSignUp, fbSignOut, fbResetPassword,
  fbUpdatePassword, fbSignInWithGoogle, fbSignInWithApple, fbOnAuthStateChange, fbGetSession,
  fbSendVerificationEmail,
} from "@/lib/firebaseAuth";
import {
  clearProfileLoadCache, extractErrorMessage,
  loadUserProfileWithRetry, readProfileCache, type UserProfileRow,
} from "@/lib/profileBootstrap";
import { clearReferralBonusTracking, notifyReferrerReferralBonusIfIncreased } from "@/lib/referralReferrerLoot";
import { cacheAuthSession, clearCachedAuth } from "@/lib/offlineAuth";
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
  resendSignupConfirmation: (email: string, redirectPath?: string) => Promise<void>;
  signInWithGoogle: (emailHint?: string, nextPath?: string) => Promise<void>;
  signInWithApple: (nextPath?: string) => Promise<void>;
  linkGoogle: (nextPath?: string) => Promise<void>;
  setPassword: (password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
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
    raw.includes("not authenticated") || raw.includes("jwt") ||
    raw.includes("auth session missing") || raw.includes("profile not found")
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
    useAuthStore.setState({ lastError: null });
  } else if (readProfileCache(session.user.id)) {
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
      session.user.id, previousBonus, row.referral_bonus,
      useLocaleStore.getState().locale,
    );
    cacheAuthSession(session.user, row);
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
        useAuthStore.setState({ profileReady: true, lastError: retryMessage });
        return null;
      }
    }

    useAuthStore.setState({ profileReady: true, lastError: message });
    return null;
  }
}

function clearAuthState(): void {
  profileSyncToken += 1;
  clearProfileLoadCache();
  clearCachedAuth();
  const userId = useAuthStore.getState().user?.id;
  useAuthStore.setState({
    session: null, user: null, profile: null, profileReady: true, lastError: null,
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
    set({ session: data.session as Session, user: data.session.user as User });
    return syncProfileForSession(data.session as Session, { soft: true });
  },
  init: async () => {
    if (authInitDone) return;
    authInitDone = true;
    if (get().status !== "idle") return;
    set({ status: "loading" });

    const { data: sub } = fbOnAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        clearAuthState();
        return;
      }
      if (!session) return;
      set({ session: session as unknown as Session, user: session.user as User });
      scheduleProfileSync(session as unknown as Session);
    });
    authUnsub = () => sub.subscription.unsubscribe();

    const { data } = await fbGetSession();
    if (data.session) {
      set({ session: data.session as unknown as Session, user: data.session.user as User });
      scheduleProfileSync(data.session as unknown as Session);
    }

    set({ status: "ready" });
  },
  signInWithPassword: async (email, password) => {
    set({ lastError: null });
    const fbResult = await fbSignInWithPassword(email, password);
    if (fbResult.error) {
      set({ lastError: fbResult.error.message });
      throw new Error(fbResult.error.message);
    }
    if (fbResult.data?.session) {
      set({ session: fbResult.data.session as unknown as Session, user: fbResult.data.user as User });
      scheduleProfileSync(fbResult.data.session as unknown as Session);
    }
  },
  signUp: async (email, password) => {
    set({ lastError: null });
    const fbResult = await fbSignUp(email, password);
    if (fbResult.error) {
      set({ lastError: fbResult.error.message });
      throw new Error(fbResult.error.message);
    }
    if (fbResult.data?.session) {
      set({ session: fbResult.data.session as unknown as Session, user: fbResult.data.user as User });
      scheduleProfileSync(fbResult.data.session as unknown as Session);
    }
    return { needsEmailConfirm: false };
  },
  resendSignupConfirmation: async (_email) => {
    set({ lastError: null });
    const { error } = await fbSendVerificationEmail();
    if (error) {
      set({ lastError: error.message });
      throw new Error(error.message);
    }
  },
  signInWithGoogle: async (_emailHint, _nextPath) => {
    set({ lastError: null });
    const fbResult = await fbSignInWithGoogle();
    if (fbResult.error) {
      set({ lastError: fbResult.error.message });
      throw new Error(fbResult.error.message);
    }
    if (fbResult.data?.session) {
      set({ session: fbResult.data.session as unknown as Session, user: fbResult.data.user as User });
      scheduleProfileSync(fbResult.data.session as unknown as Session);
    }
  },
  signInWithApple: async () => {
    set({ lastError: null });
    const fbResult = await fbSignInWithApple();
    if (fbResult.error) {
      set({ lastError: fbResult.error.message });
      throw new Error(fbResult.error.message);
    }
    if (fbResult.data?.session) {
      set({ session: fbResult.data.session as unknown as Session, user: fbResult.data.user as User });
      scheduleProfileSync(fbResult.data.session as unknown as Session);
    }
  },
  linkGoogle: async () => {
    set({ lastError: null });
    const fbResult = await fbSignInWithGoogle();
    if (fbResult.error) {
      set({ lastError: fbResult.error.message });
      throw new Error(fbResult.error.message);
    }
  },
  setPassword: async (password) => {
    set({ lastError: null });
    const { error } = await fbUpdatePassword(password);
    if (error) {
      set({ lastError: error.message });
      throw new Error(error.message);
    }
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      await syncProfileForSession(data.session as unknown as Session);
    }
  },
  resetPassword: async (email) => {
    set({ lastError: null });
    const result = await fbResetPassword(email);
    if (result.error) {
      set({ lastError: result.error.message });
      throw new Error(result.error.message);
    }
  },
  signOut: async () => {
    clearAuthState();
    await resetClientSessionStores();
    try { await fbSignOut(); } catch { /* ignore */ }
  },
  completeAuthCallbackSession: async (session) => {
    set({ session, user: session.user, lastError: null });
    return syncProfileForSession(session);
  },
}));
