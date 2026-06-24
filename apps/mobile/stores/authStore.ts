import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import type { UserProfile } from "@producerhit/shared";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fetchProfile } from "@/lib/loopsApi";
import { clearProfileCache, loadProfileCache, saveProfileCache } from "@/lib/profileCache";

const ONBOARDING_KEY = "producerhit_mobile_onboarding_v1";
type AuthState = {
  session: Session | null;
  profile: UserProfile | null;
  profileRefreshing: boolean;
  loading: boolean;
  onboardingDone: boolean;
  onboardingHydrated: boolean;
  setSession: (session: Session | null) => void;
  hydrateProfileCache: (userId: string) => Promise<void>;
  hydrateOnboarding: () => Promise<void>;
  refreshProfile: (opts?: { silent?: boolean; force?: boolean }) => Promise<void>;
  /** After generation — optimistic bump + retries until server counter catches up. */
  refreshProfileAfterGeneration: () => Promise<void>;
  clearAuth: () => Promise<void>;
  setOnboardingDone: (done: boolean) => void;
  setLoading: (loading: boolean) => void;
};

let refreshInflight: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  profileRefreshing: false,
  loading: true,
  onboardingDone: false,
  onboardingHydrated: false,
  setSession: (session) => set({ session }),
  hydrateOnboarding: async () => {
    if (get().onboardingHydrated) return;
    const raw = await AsyncStorage.getItem(ONBOARDING_KEY);
    set({ onboardingDone: raw === "1", onboardingHydrated: true });
  },
  hydrateProfileCache: async (userId) => {
    const cached = await loadProfileCache(userId);
    if (cached) set({ profile: cached });
  },
  refreshProfile: async (opts) => {
    const force = opts?.force ?? false;
    if (refreshInflight && !force) return refreshInflight;
    if (refreshInflight && force) {
      try {
        await refreshInflight;
      } finally {
        refreshInflight = null;
      }
    }

    const silent = opts?.silent ?? false;
    const showSpinner = !silent || !get().profile;

    refreshInflight = (async () => {
      const userId = get().session?.user?.id;
      if (!userId) return;

      if (showSpinner) set({ profileRefreshing: true });
      try {
        const cached = await loadProfileCache(userId);
        if (cached && get().profile?.id !== cached.id) {
          set({ profile: cached });
        }

        const profile = await fetchProfile(userId);
        if (profile) {
          const localUsed = get().profile?.loopsUsedThisMonth ?? 0;
          const merged =
            localUsed > profile.loopsUsedThisMonth
              ? { ...profile, loopsUsedThisMonth: localUsed }
              : profile;
          await saveProfileCache(userId, merged);
          set({ profile: merged });
        }
      } finally {
        if (showSpinner) set({ profileRefreshing: false });
      }
    })();

    try {
      await refreshInflight;
    } finally {
      refreshInflight = null;
    }
  },
  refreshProfileAfterGeneration: async () => {
    const userId = get().session?.user?.id;
    if (!userId) return;

    const before = get().profile?.loopsUsedThisMonth ?? 0;
    const current = get().profile;
    if (current) {
      const optimistic = { ...current, loopsUsedThisMonth: before + 1 };
      set({ profile: optimistic });
      await saveProfileCache(userId, optimistic);
    }

    const delays = [400, 700, 1200, 2000];
    for (const delayMs of delays) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      await get().refreshProfile({ force: true, silent: true });
      const after = get().profile?.loopsUsedThisMonth ?? 0;
      if (after > before) return;
    }
  },
  clearAuth: async () => {
    const userId = get().session?.user?.id;
    refreshInflight = null;
    set({ session: null, profile: null, profileRefreshing: false });
    await clearProfileCache(userId);
  },
  setOnboardingDone: (onboardingDone) => set({ onboardingDone }),
  setLoading: (loading) => set({ loading }),
}));

/** Email / plan for UI — session first, then cached profile. */
export function resolveAccountIdentity(
  session: Session | null,
  profile: UserProfile | null,
): { email: string | null; plan: string } {
  const email =
    session?.user?.email?.trim() ||
    (typeof session?.user?.user_metadata?.email === "string"
      ? session.user.user_metadata.email.trim()
      : "") ||
    profile?.email?.trim() ||
    null;
  const plan = profile?.plan ?? "free";
  return { email, plan };
}
