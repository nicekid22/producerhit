import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { fbGetSession } from "@/lib/firebaseAuth";

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

function cleanAuthCodeFromUrl(url: URL): void {
  url.searchParams.delete("code");
  const cleaned = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, document.title, cleaned);
}

async function readActiveSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session ?? null;
}

async function waitForSessionViaPolling(): Promise<Session | null> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const { data } = await fbGetSession();
    if (data.session) return data.session as unknown as Session;
    await sleep(200);
  }
  return null;
}

async function waitForSessionViaListener(): Promise<Session> {
  return await new Promise<Session>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      subscription.unsubscribe();
      reject(new Error("oauth_session_missing"));
    }, SESSION_WAIT_MS);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) return;
      window.clearTimeout(timeout);
      subscription.unsubscribe();
      resolve(session as unknown as Session);
    });
  });
}

export async function resolveAuthCallbackSession(searchParams: URLSearchParams): Promise<Session> {
  const url = new URL(window.location.href);
  const authError = parseAuthCallbackError(url, searchParams);
  if (authError) throw new Error(authError);

  const existing = await readActiveSession();
  if (existing) {
    cleanAuthCodeFromUrl(url);
    return existing;
  }

  const polled = await waitForSessionViaPolling();
  if (polled) {
    cleanAuthCodeFromUrl(url);
    return polled;
  }

  return await waitForSessionViaListener();
}
