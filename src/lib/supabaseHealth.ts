/**
 * Supabase health check — ping régulier + localStorage persistence.
 * Si Supabase est down, le système émet des custom events pour que
 * les composants réagissent (banner, offline auth, etc.).
 *
 * NOTE: On lazy-importe supabaseClient pour éviter un circular import
 * car supabaseClient.ts importe ce module.
 */

let supabaseClient: Awaited<typeof import("@/lib/supabaseClient")> | null = null;

async function getSupabase() {
  if (!supabaseClient) {
    supabaseClient = await import("@/lib/supabaseClient");
  }
  return supabaseClient.supabase;
}

const HEALTH_STORAGE_KEY = "producerhit_supabase_health_v1";
const PING_INTERVAL_MS = 300_000; // 5 min — 5x moins de requêtes qu'avant (60s)
const FAILURES_BEFORE_DOWN = 3;

export type HealthStatus = "up" | "down" | "unknown";

interface StoredHealth {
  status: HealthStatus;
  consecutiveFailures: number;
  lastCheck: number;
}

let currentStatus: HealthStatus = "unknown";
let consecutiveFailures = 0;
let intervalId: ReturnType<typeof setInterval> | null = null;

// ---------------------------------------------------------------------------
// Persistence helpers
// ---------------------------------------------------------------------------

function safeJsonParse(raw: string): StoredHealth | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "status" in parsed) return parsed as StoredHealth;
    return null;
  } catch {
    return null;
  }
}

function loadStoredHealth(): StoredHealth | null {
  try {
    const raw = window.localStorage.getItem(HEALTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = safeJsonParse(raw);
    // If stored status is "down" and last check was > 24h ago, reset to unknown.
    if (parsed && parsed.status === "down" && Date.now() - parsed.lastCheck > 86_400_000) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function persistHealth(): void {
  try {
    const data: StoredHealth = {
      status: currentStatus,
      consecutiveFailures,
      lastCheck: Date.now(),
    };
    window.localStorage.setItem(HEALTH_STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota errors */
  }
}

// ---------------------------------------------------------------------------
// Status transitions
// ---------------------------------------------------------------------------

function setStatus(next: HealthStatus): void {
  if (currentStatus === next) return;
  const prev = currentStatus;
  currentStatus = next;
  persistHealth();
  try {
    window.dispatchEvent(
      new CustomEvent(next === "up" ? "supabase:up" : "supabase:down", { detail: { prev } }),
    );
  } catch {
    /* SSR / non-browser */
  }
  // Auto-switch Supabase client on status change
  if (next === "down" && prev !== "down") {
    // Lazy import to avoid circular dependency
    import("@/lib/supabaseClient").then((m) => m.switchToBackup()).catch(() => {});
  } else if (next === "up" && prev === "down") {
    import("@/lib/supabaseClient").then((m) => m.switchToPrimary()).catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Ping
// ---------------------------------------------------------------------------

async function ping(): Promise<void> {
  // Skip ping when tab is hidden — no point wasting DB cycles on background tabs.
  if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
  try {
    const supabase = await getSupabase();
    const { error } = await supabase.from("profiles").select("id").limit(1);
    if (error) throw error;
    consecutiveFailures = 0;
    // If we were in Firebase fallback, at least one Supabase is back.
    const client = await import("@/lib/supabaseClient");
    if (client.isUsingFirebase()) {
      client.exitFirebaseFallback();
    }
    setStatus("up");
  } catch {
    consecutiveFailures += 1;
    persistHealth();
    if (consecutiveFailures >= FAILURES_BEFORE_DOWN) {
      setStatus("down");
      // After switching to backup (in setStatus), check if backup is also down.
      // The next ping will hit the backup. If it also fails, we enter Firebase mode.
      // We detect this by checking if we're already on backup + still failing.
      const client = await import("@/lib/supabaseClient");
      if (client.isUsingBackup() && consecutiveFailures >= FAILURES_BEFORE_DOWN * 2) {
        client.switchToFirebase();
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Whether Supabase is considered down. */
export function isSupabaseDown(): boolean {
  return currentStatus === "down";
}

/** Returns the current health status + metadata. */
export function getSupabaseHealth(): {
  status: HealthStatus;
  consecutiveFailures: number;
  lastCheck: number;
} {
  return {
    status: currentStatus,
    consecutiveFailures,
    lastCheck: Date.now(),
  };
}

/** Start periodic health pinging (safe to call multiple times). */
export function startHealthCheck(): void {
  if (intervalId) return;

  // Hydrate from localStorage on first start.
  if (currentStatus === "unknown") {
    const stored = loadStoredHealth();
    if (stored) {
      currentStatus = stored.status;
      consecutiveFailures = stored.consecutiveFailures;
    }
  }

  // Immediate first ping, then every PING_INTERVAL_MS.
  void ping();
  intervalId = setInterval(() => void ping(), PING_INTERVAL_MS);

  // Re-ping immediately when tab becomes visible (skipped pings during hidden).
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") void ping();
    });
  }
}

/** Stop periodic health pinging. */
export function stopHealthCheck(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
