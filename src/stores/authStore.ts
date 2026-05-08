import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

type AuthStatus = "idle" | "loading" | "ready";

type AuthState = {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  lastError: string | null;
  init: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ needsEmailConfirm: boolean }>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

let authUnsub: (() => void) | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  status: "idle",
  session: null,
  user: null,
  lastError: null,
  init: async () => {
    if (get().status !== "idle") return;
    set({ status: "loading" });

    const { data } = await supabase.auth.getSession();
    set({ session: data.session, user: data.session?.user ?? null });

    if (!authUnsub) {
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        set({ session, user: session?.user ?? null });
      });
      authUnsub = () => sub.subscription.unsubscribe();
    }

    set({ status: "ready" });
  },
  signInWithPassword: async (email, password) => {
    set({ lastError: null });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ lastError: error.message });
      throw error;
    }
  },
  signUp: async (email, password) => {
    set({ lastError: null });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) {
      set({ lastError: error.message });
      throw error;
    }
    const needsEmailConfirm = !data.session;
    return { needsEmailConfirm };
  },
  signInWithGoogle: async () => {
    set({ lastError: null });
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) {
      set({ lastError: error.message });
      throw error;
    }
  },
  resetPassword: async (email) => {
    set({ lastError: null });
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    if (error) {
      set({ lastError: error.message });
      throw error;
    }
  },
  signOut: async () => {
    set({ lastError: null });
    const { error } = await supabase.auth.signOut();
    if (error) {
      set({ lastError: error.message });
      throw error;
    }
  },
}));

