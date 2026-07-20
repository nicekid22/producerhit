export type HealthStatus = "up" | "down" | "unknown";

export function isSupabaseDown(): boolean {
  return false;
}

export function getSupabaseHealth(): { status: HealthStatus; consecutiveFailures: number; lastCheck: number } {
  return { status: "up", consecutiveFailures: 0, lastCheck: Date.now() };
}

export function startHealthCheck(): void {
  /* no-op — Firebase is always "up" */
}

export function stopHealthCheck(): void {
  /* no-op */
}
