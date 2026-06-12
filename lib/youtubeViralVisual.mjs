/**
 * Viral Shorts background — cover art (default) or stock footage (Pexels).
 */
import { resolveLoopCoverPath } from "./youtubeCoverResolve.mjs";
import { fetchViralStockVideo } from "./viralStockFootage.mjs";

export function viralVisualMode() {
  const raw = (process.env.YOUTUBE_VIRAL_VISUAL ?? "cover").trim().toLowerCase();
  if (raw === "stock" || raw === "pexels" || raw === "video") return "stock";
  return "cover";
}

/** Resolve viral B-roll: cover image (default) or optional stock clip. */
export async function resolveViralVisualAssets({ loop, workDir, series, loopId }) {
  if (viralVisualMode() === "stock") {
    const stockVideoPath = await fetchViralStockVideo({ series, loopId, workDir });
    return { coverPath: null, stockVideoPath, mode: "stock" };
  }
  const coverPath = await resolveLoopCoverPath(loop, workDir);
  return { coverPath, stockVideoPath: null, mode: "cover" };
}
