export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return String(error ?? "unknown_error");
}

export function isAuthNotReadyError(message: string): boolean {
  const msg = message.toLowerCase();
  return msg.includes("not authenticated") || msg.includes("jwt") || msg.includes("auth session missing");
}

export function isBenignProfileSyncError(message: string): boolean {
  const raw = message.toLowerCase();
  return (
    isAuthNotReadyError(raw) ||
    raw.includes("pkce") ||
    raw.includes("code verifier") ||
    raw.includes("oauth_session_missing")
  );
}
