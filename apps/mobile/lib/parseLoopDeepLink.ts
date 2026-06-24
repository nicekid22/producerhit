/** Extract loop id from producerhit://loop/{id} or https://www.producerhit.com/loop/{id} */
export function parseLoopIdFromUrl(url: string): string | null {
  return matchLoopPath(url, "loop");
}

/** Extract loop id from producerhit://play/{id} */
export function parsePlayLoopIdFromUrl(url: string): string | null {
  return matchLoopPath(url, "play");
}

function matchLoopPath(url: string, segment: "loop" | "play"): string | null {
  if (!url.trim()) return null;

  try {
    const normalized = url.trim();

    const custom = new RegExp(`^producerhit://${segment}/([^?#/]+)`, "i").exec(normalized);
    if (custom?.[1]) return decodeURIComponent(custom[1]);

    if (segment === "loop") {
      const web = normalized.match(/producerhit\.com\/loop\/([^?#/]+)/i);
      if (web?.[1]) return decodeURIComponent(web[1]);
    }

    const pathOnly = new RegExp(`^/${segment}/([^?#/]+)`, "i").exec(normalized);
    if (pathOnly?.[1]) return decodeURIComponent(pathOnly[1]);
  } catch {
    return null;
  }

  return null;
}