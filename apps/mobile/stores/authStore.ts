import { create } from "zustand";
import type { Session } from "@supabase/supabase-js";
import type { UserProfile } from "@producerhit/shared";
import { fetchProfile } from "@/lib/loopsApi";

type AuthState = {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  onboardingDone: boolean;
  setSession: (session: Session | null) => void;
  refreshProfile: () => Promise<void>;
  setOnboardingDone: (done: boolean) => void;
  setLoading: (loading: boolean) => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  loading: true,
  onboardingDone: false,
  setSession: (session) => set({ session }),
  refreshProfile: async () => {
    const userId = get().session?.user?.id;
    if (!userId) {
      set({ profile: null });
      return;
    }
    const profile = await fetchProfile(userId);
    set({ profile });
  },
  setOnboardingDone: (onboardingDone) => set({ onboardingDone }),
  setLoading: (loading) => set({ loading }),
}));
