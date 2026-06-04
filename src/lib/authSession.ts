import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

const SESSION_WAIT_MS = 10_000;
const EXCHANGE_RETRY_MS = 280;

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
  return (
    raw.includes("pkce") ||
    raw.includes("code verifier") ||
    raw.includes("codeverifier") ||
    raw.includes("verifier not found")
  );
}

/** Erreurs fréquentes quand le code OAuth est déjà échangé ou le verifier manque (mobile / double mount). */
function isRecoverableExchangeError(message: string): boolean {
  const raw = message.toLowerCase();
  return (
    isPkceExchangeError(raw) ||
    raw.includes("invalid_grant") ||
    raw.includes("invalid code") ||
    raw.includes("code not valid") ||
    raw.includes("already been used") ||
    raw.includes("expired") ||
    raw.includes("unauthorized_client") ||
    raw.includes("non-empty")
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

async function tryExchangeCode(code: string, url: URL): Promise<Session | null> {
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (!error && data.session) {
    cleanAuthCodeFromUrl(url);
    return data.session;
  }

  const existing = await readActiveSession();
  if (existing) {
    cleanAuthCodeFromUrl(url);
    return existing;
  }

  if (!error) return null;
  if (!isRecoverableExchangeError(error.message)) throw error;

  await sleep(EXCHANGE_RETRY_MS);
  let afterWait = await readActiveSession();
  if (afterWait) {
    cleanAuthCodeFromUrl(url);
    return afterWait;
  }

  const errMsg = error.message.toLowerCase();
  const canRetryExchange =
    isPkceExchangeError(errMsg) || errMsg.includes("non-empty") || errMsg.includes("verifier");

  if (canRetryExchange) {
    const retry = await supabase.auth.exchangeCodeForSession(code);
    if (!retry.error && retry.data.session) {
      cleanAuthCodeFromUrl(url);
      return retry.data.session;
    }
    afterWait = await readActiveSession();
    if (afterWait) {
      cleanAuthCodeFromUrl(url);
      return afterWait;
    }
    if (retry.error && !isRecoverableExchangeError(retry.error.message)) throw retry.error;
  }

  return null;
}

async function waitForSessionViaPolling(): Promise<Session | null> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const session = await readActiveSession();
    if (session) return session;
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

/** Resolve session after OAuth / magic-link redirect (PKCE code + hash fallback). */
export async function resolveAuthCallbackSession(searchParams: URLSearchParams): Promise<Session> {
  const url = new URL(window.location.href);
  const authError = parseAuthCallbackError(url, searchParams);
  if (authError) throw new Error(authError);

  const existing = await readActiveSession();
  if (existing) return existing;

  const code = searchParams.get("code");
  if (code) {
    const exchanged = await tryExchangeCode(code, url);
    if (exchanged) return exchanged;
  }

  const polled = await waitForSessionViaPolling();
  if (polled) return polled;

  return await waitForSessionViaListener();
}
