/** HTTP URL for downloadable stems ZIP — empty if none. */
export function resolveStemsDownloadUrl(stemsUrl: unknown): string {
  if (!stemsUrl) return "";
  if (typeof stemsUrl === "string") {
    const s = stemsUrl.trim();
    return s.startsWith("http://") || s.startsWith("https://") ? s : "";
  }
  if (typeof stemsUrl !== "object") return "";

  const obj = stemsUrl as Record<string, unknown>;
  const ace = obj.ace && typeof obj.ace === "object" ? (obj.ace as Record<string, unknown>) : null;
  const candidates: unknown[] = [
    obj.stemsZipUrl,
    obj.stems_zip_url,
    obj.zipUrl,
    obj.zip_url,
    ace?.stemsZipUrl,
    ace?.stems_zip_url,
    ace?.zipUrl,
    ace?.zip_url,
    ace?.stemsUrl,
    ace?.stems_url,
  ];

  for (const c of candidates) {
    if (typeof c !== "string") continue;
    const s = c.trim();
    if (s.startsWith("http://") || s.startsWith("https://")) return s;
  }
  return "";
}
