// env.ts — Safe environment variable reader
// Firebase secrets often contain trailing newlines; this trims them automatically.

export function env(key: string): string {
  return (process.env[key] ?? "").trim();
}

export function envOptional(key: string): string | undefined {
  const v = process.env[key]?.trim();
  return v || undefined;
}
