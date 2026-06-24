/** Seed unique par prompt + tentative — évite la même image quand le prompt change. */
export function buildCoverGenerationSeed(
  prompt: string,
  loopId: string,
  loopSeed: number | null | undefined,
  attempt: number,
): number {
  const base =
    typeof loopSeed === "number" && Number.isFinite(loopSeed) ? Math.floor(loopSeed) : hashString(loopId);
  const trimmed = prompt.trim();
  return (hashString(`${loopId}:${trimmed}:${attempt}`) ^ base) >>> 0;
}

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h;
}

export function withCoverCacheBust(url: string, bust: number): string {
  const u = url.trim();
  if (!u.startsWith("http")) return u;
  try {
    const parsed = new URL(u);
    parsed.searchParams.set("v", String(bust));
    return parsed.toString();
  } catch {
    const sep = u.includes("?") ? "&" : "?";
    return `${u}${sep}v=${bust}`;
  }
}
