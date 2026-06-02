import type { Loop } from "@/types/loop";

export type CoverKind = "video" | "image";

export function isCoverVideo(loop: Pick<Loop, "details">, coverUrl?: string | null): boolean {
  if (loop.details?.coverKind === "video") return true;
  const url = (coverUrl ?? loop.details?.coverUrl ?? "").toLowerCase();
  return url.includes("/loop-covers/") && url.endsWith(".mp4");
}

export function resolveCoverKind(loop: Pick<Loop, "details">, coverUrl?: string | null): CoverKind {
  return isCoverVideo(loop, coverUrl) ? "video" : "image";
}
