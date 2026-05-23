import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase env: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

type ClientEventPayload = {
  name: string;
  ts: number;
  path?: string;
  props?: Record<string, unknown>;
};

const EVENT_QUEUE_KEY = "producerhit_event_queue_v1";

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

export function trackClientEvent(name: string, props?: Record<string, unknown>) {
  const payload: ClientEventPayload = {
    name,
    ts: Date.now(),
    path: typeof window !== "undefined" ? window.location.pathname + window.location.search : undefined,
    props,
  };
  const q = readQueue();
  q.push(payload);
  writeQueue(q);
}

export async function flushClientEvents(userId: string) {
  const q = readQueue();
  if (!q.length) return;

  const batch = q.slice(0, 30);
  try {
    const { error } = await supabase.from("client_events").insert(
      batch.map((e) => ({
        user_id: userId,
        name: e.name,
        props: e.props ?? null,
        path: e.path ?? null,
        client_ts: new Date(e.ts).toISOString(),
      })),
    );
    if (error) return;
    writeQueue(q.slice(batch.length));
  } catch {
    return;
  }
}
