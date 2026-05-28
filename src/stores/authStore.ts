import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import {
  clearProfileLoadCache,
  extractErrorMessage,
  loadUserProfileWithRetry,
  type UserProfileRow,
} from "@/lib/profileBootstrap";
import { clearReferralBonusTracking, notifyReferrerReferralBonusIfIncreased } from "@/lib/referralReferrerLoot";
import { useLocaleStore } from "@/stores/localeStore";

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
  signUp: (email: string, password: string) => Promise<{ needsEmailConfirm: boolean }>;
  signInWithGoogle: (emailHint?: string, nextPath?: string) => Promise<void>;
  linkGoogle: (nextPath?: string) => Promise<void>;
  setPassword: (password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

let authUnsub: (() => void) | null = null;
let profileSyncToken = 0;
let authInitDone = false;

function authCallbackUrl(nextPath = "/dashboard"): string {
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
}

/** Never call supabase.auth.* synchronously inside onAuthStateChange — defer to avoid deadlocks. */
function scheduleProfileSync(session: Session): void {
  window.setTimeout(() => {
    void syncProfileForSession(session);
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

  const token = ++profileSyncToken;
  const hasProfile = !!useAuthStore.getState().profile;
  if (options?.soft && hasProfile) {
    useAuthStore.setState({ lastError: null });
  } else {
    useAuthStore.setState({ profileReady: false, lastError: null });
  }

  const load = () => loadUserProfileWithRetry(session.user.id, session.user.email ?? null);

  const commitProfile = (row: UserProfileRow): UserProfileRow | null => {
    if (token !== profileSyncToken) return row;
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
    const row = await load();
    return commitProfile(row);
  } catch (err) {
    const message = extractErrorMessage(err);
    if (token !== profileSyncToken) return null;

    if (isBenignProfileSyncError(message)) {
      await new Promise((r) => window.setTimeout(r, 700));
      if (token !== profileSyncToken) return null;
      try {
        const row = await load();
        return commitProfile(row);
      } catch (retryErr) {
        if (token !== profileSyncToken) return null;
        const retryMessage = extractErrorMessage(retryErr);
        if (isBenignProfileSyncError(retryMessage)) {
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
          set({ session });
          return;
        }
        set({ session, user: session?.user ?? null });
        if (event === "SIGNED_OUT") {
          clearAuthState();
          return;
        }
        if (!session?.user) return;
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
      await syncProfileForSession(data.session);
    }
  },
  signUp: async (email, password) => {
    set({ lastError: null });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: authCallbackUrl("/dashboard"),
      },
    });
    if (error) {
      set({ lastError: error.message });
      throw error;
    }
    const needsEmailConfirm = !data.session;
    if (data.session) {
      set({ session: data.session, user: data.session.user });
      await syncProfileForSession(data.session);
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
    const { error } = await supabase.auth.signOut();
    if (error) {
      set({ lastError: error.message });
      throw error;
    }
  },
}));
