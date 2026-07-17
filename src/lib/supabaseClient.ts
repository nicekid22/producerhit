import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { mirrorEventToAdPixels, shouldMirrorToServer } from "@/lib/adPixels";
import { sendServerConversion } from "@/lib/conversionApi";
import { supabaseAuthStorage } from "@/lib/authStorage";
import { getAttributionProps } from "@/lib/attribution";
import { getOrCreateSessionId } from "@/lib/sessionId";
import { startHealthCheck, getSupabaseHealth } from "@/lib/supabaseHealth";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const backupUrl = import.meta.env.VITE_SUPABASE_BACKUP_URL as string | undefined;
const backupAnonKey = import.meta.env.VITE_SUPABASE_BACKUP_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase env: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
}

function createSupabaseClient(url: string, key: string): SupabaseClient {
  return createClient(url, key, {
    auth: {
      detectSessionInUrl: false,
      persistSession: true,
      autoRefreshToken: true,
      flowType: "pkce",
      storage: supabaseAuthStorage,
    },
  });
}

// Primary client — mutable so we can swap on outage.
export let supabase: SupabaseClient = createSupabaseClient(supabaseUrl, supabaseAnonKey);

// Backup client — lazy-created only when backup env vars are configured.
let backupClient: SupabaseClient | null = null;
function getBackupClient(): SupabaseClient | null {
  if (!backupUrl || !backupAnonKey) return null;
  if (!backupClient) {
    backupClient = createSupabaseClient(backupUrl, backupAnonKey);
  }
  return backupClient;
}

/** True when currently using the backup Supabase project. */
let _usingBackup = false;
export function isUsingBackup(): boolean {
  return _usingBackup;
}

/**
 * Switch the active Supabase client to the backup project.
 * Called automatically when health check detects primary is down.
 */
export function switchToBackup(): void {
  if (_usingBackup) return;
  const backup = getBackupClient();
  if (!backup) return;
  supabase = backup;
  _usingBackup = true;
  console.warn("[supabaseClient] ⚠️ Switched to backup Supabase project");
}

/**
 * Switch back to the primary Supabase project.
 * Called automatically when health check detects primary is back.
 */
export function switchToPrimary(): void {
  if (!_usingBackup) return;
  supabase = createSupabaseClient(supabaseUrl!, supabaseAnonKey!);
  _usingBackup = false;
  console.info("[supabaseClient] ✅ Switched back to primary Supabase project");
}

// ---------------------------------------------------------------------------
// Health check — démarré dès la création du client.
// ---------------------------------------------------------------------------

if (typeof window !== "undefined") {
  startHealthCheck();
}

export { getSupabaseHealth };

type ClientEventPayload = {
  name: string;
  ts: number;
  path?: string;
  props?: Record<string, unknown>;
};

const EVENT_QUEUE_KEY = "producerhit_event_queue_v1";
const FLUSH_BATCH_SIZE = 8;
const FLUSH_MIN_INTERVAL_MS = 120_000;
let lastFlushAt = 0;

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function readQueue(): ClientEventPayload[] {
  try {
    const raw = window.localStorage.getItem(EVENT_QUEUE_KEY);
    if (!raw) return [];
    const parsed = safeJsonParse(raw);
    return Array.isArray(parsed) ? (parsed as ClientEventPayload[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(events: ClientEventPayload[]) {
  try {
    window.localStorage.setItem(EVENT_QUEUE_KEY, JSON.stringify(events.slice(-200)));
  } catch {
    return;
  }
}

/** Enqueue + mirror pixels ads + CAPI pour les events clés. */
export function trackClientEvent(name: string, props?: Record<string, unknown>) {
  const attribution = getAttributionProps();
  const mergedProps = { ...attribution, ...props };
  const payload: ClientEventPayload = {
    name,
    ts: Date.now(),
    path: typeof window !== "undefined" ? window.location.pathname + window.location.search : undefined,
    props: mergedProps,
  };
  const q = readQueue();
  q.push(payload);
  writeQueue(q);

  const eventId = mirrorEventToAdPixels(name, mergedProps);
  if (eventId && shouldMirrorToServer(name)) {
    sendServerConversion(name, eventId, mergedProps);
  }
}

/** Vide la file d'events vers growth_events (anonyme ou connecté). */
export async function flushEventQueue(): Promise<void> {
  if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
  const now = Date.now();
  if (now - lastFlushAt < FLUSH_MIN_INTERVAL_MS) return;

  const q = readQueue();
  if (!q.length) return;

  lastFlushAt = now;
  const batch = q.slice(0, FLUSH_BATCH_SIZE);
  let sent = 0;
  for (const event of batch) {
    const { error } = await supabase.rpc("log_growth_event", {
      p_session_id: getOrCreateSessionId(),
      p_name: event.name,
      p_props: event.props ?? null,
      p_path: event.path ?? null,
      p_client_ts: new Date(event.ts).toISOString(),
    });
    if (error) break;
    sent += 1;
  }
  if (sent > 0) writeQueue(q.slice(sent));
}

/** @deprecated Utiliser flushEventQueue — conservé pour compat. */
export async function flushClientEvents(_userId: string) {
  await flushEventQueue();
}
