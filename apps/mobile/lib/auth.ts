import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "./supabase";
import { getAuth as getFirebaseAuth } from "firebase/auth";

type Session = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  expires_at?: number;
  token_type?: string;
  user: {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown>;
    app_metadata?: Record<string, unknown>;
    aud?: string;
    created_at?: string;
  } | null;
} | null;

type User = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
  aud?: string;
  created_at?: string;
} | null;

WebBrowser.maybeCompleteAuthSession();

export const AUTH_CALLBACK_PATH = "auth/callback";

export function getAuthRedirectUri(): string {
  return Linking.createURL(AUTH_CALLBACK_PATH);
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
  return data;
}

export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { emailRedirectTo: getAuthRedirectUri() },
  });
  if (error) throw error;
  return data;
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: getAuthRedirectUri(),
  });
  if (error) throw error;
}

export async function signInWithGoogle() {
  const redirectTo = getAuthRedirectUri();

  // Try compatibility layer OAuth first
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, skipBrowserRedirect: true },
  });

  // If session returned directly (Firebase popup worked), use it
  if (data?.session) {
    return { session: data.session, user: data.session.user };
  }

  // If URL returned (Supabase OAuth flow), use WebBrowser
  if (data?.url) {
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== "success" || !result.url) {
      throw new Error("Google sign-in cancelled");
    }
    return parseAuthCallbackUrl(result.url);
  }

  // Firebase fallback: Google OAuth via WebBrowser
  return signInWithGoogleFirebase(redirectTo);
}

async function signInWithGoogleFirebase(redirectTo: string) {
  const googleClientId = process.env.EXPO_PUBLIC_FIREBASE_GOOGLE_CLIENT_ID;
  if (!googleClientId) {
    throw new Error("EXPO_PUBLIC_FIREBASE_GOOGLE_CLIENT_ID not configured");
  }

  const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&response_type=id_token&redirect_uri=${encodeURIComponent(redirectTo)}&scope=openid%20email%20profile`;

  const result = await WebBrowser.openAuthSessionAsync(oauthUrl, redirectTo);
  if (result.type !== "success" || !result.url) {
    throw new Error("Google sign-in cancelled");
  }

  const hash = result.url.split("#")[1] ?? "";
  const params = new URLSearchParams(hash);
  const idToken = params.get("id_token");
  if (!idToken) throw new Error("No id_token in Google callback");

  const { GoogleAuthProvider, signInWithCredential } = await import("firebase/auth");
  const auth = getFirebaseAuth();
  const credential = GoogleAuthProvider.credential(idToken);
  const authResult = await signInWithCredential(auth, credential);

  const { supabaseSessionFromFirebase } = await import("@/lib/firebaseAuth");
  const { session } = supabaseSessionFromFirebase(authResult.user);
  useAuthStore.getState().setSession(session);
  return { session, user: authResult.user };
}

export { signInWithApple, isAppleAuthAvailable } from "./appleAuth";

export async function parseAuthCallbackUrl(url: string): Promise<{ session: Session | null; user: User | null }> {
  const parsed = Linking.parse(url);
  const code = typeof parsed.queryParams?.code === "string" ? parsed.queryParams.code : null;

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return { session: data.session, user: data.user };
  }

  const hash = url.includes("#") ? url.split("#")[1] : "";
  const params = new URLSearchParams(hash);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (accessToken && refreshToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) throw error;
    return { session: data.session, user: data.user };
  }

  throw new Error("Invalid auth callback");
}

export async function signOut() {
  const { error } = await supabase.auth.signOut({ scope: "local" });
  if (error) throw error;
  await useAuthStore.getState().clearAuth();
}

export function onAuthStateChange(callback: (session: Session | null) => void) {
  return supabase.auth.onAuthStateChange((_event: string, session: unknown) => {
    callback(session as Session | null);
  });
}
