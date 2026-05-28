import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

const SESSION_WAIT_MS = 10_000;

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function parseAuthCallbackError(url: URL, searchParams: URLSearchParams): string | null {
  const hash = url.hash.startsWith("#") ? url.hash.slice(1) : "";
  const hashParams = new URLSearchParams(hash);
  return (
    searchParams.get("error_description") ||
    searchParams.get("error") ||
    hashParams.get("error_description") ||
    hashParams.get("error")
  );
}

function isPkceExchangeError(message: string): boolean {
  const raw = message.toLowerCase();
  return raw.includes("pkce") || raw.includes("code verifier");
}

/** Resolve session after OAuth / magic-link redirect (PKCE code + hash fallback). */
export async function resolveAuthCallbackSession(searchParams: URLSearchParams): Promise<Session> {
  const url = new URL(window.location.href);
  const authError = parseAuthCallbackError(url, searchParams);
  if (authError) throw new Error(authError);

  const existing = await supabase.auth.getSession();
  if (existing.error) throw existing.error;
  if (existing.data.session) return existing.data.session;

  const code = searchParams.get("code");
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.session) return data.session;
    if (error && !isPkceExchangeError(error.message)) throw error;
  }

  for (let attempt = 0; attempt < 30; attempt += 1) {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (data.session) return data.session;
    await sleep(200);
  }

  return await new Promise<Session>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      subscription.unsubscribe();
      reject(new Error("oauth_session_missing"));
    }, SESSION_WAIT_MS);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) return;
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") {
        window.clearTimeout(timeout);
        subscription.unsubscribe();
        resolve(session);
      }
    });
  });
}
