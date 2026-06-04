import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Loop } from "@/types/loop"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Fisher–Yates shuffle (mutates copy). */
export function shuffleArray<T>(items: readonly T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function hashString(input: string) {
  let h = 0
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0
  return h
}

/** Snapshot cover prompt when a track is created (uses live prompt once). */
export function buildCoverPromptSnapshot(loop: Pick<Loop, "prompt" | "genre" | "mood" | "influence">): string {
  const fromPrompt = (loop.prompt || "").trim()
  const base = fromPrompt || `${loop.genre || ""} ${loop.mood || ""} ${loop.influence || ""}`.trim()
  const trimmed = base.length > 160 ? base.slice(0, 160) : base
  return trimmed || "dreamy beat"
}

/** Stable cover text for an existing track — ignores later prompt edits unless coverPrompt was set at creation. */
export function resolveCoverArtPrompt(loop: Loop): string {
  const frozen = loop.details?.coverPrompt?.trim()
  if (frozen) return frozen.length > 160 ? frozen.slice(0, 160) : frozen
  const legacy = `${loop.genre || ""} ${loop.mood || ""} ${loop.influence || ""}`.trim()
  const trimmed = legacy.length > 160 ? legacy.slice(0, 160) : legacy
  return trimmed || "dreamy beat"
}

export function coverImageSeed(loop: Loop): number {
  return typeof loop.seed === "number" && Number.isFinite(loop.seed) ? loop.seed : hashString(loop.id)
}

/** Stable React key for cover <img> — avoids remount when unrelated loop fields change. */
export function coverImageKey(loop: Loop): string {
  return `${loop.id}:${coverImageSeed(loop)}:${hashString(resolveCoverArtPrompt(loop))}`
}

/** Classe CSS — fond placeholder adapté Prism / Warm Glass (voir cover-surface.css). */
export const COVER_SURFACE_CLASS = "pk-cover-surface";

/** @deprecated Préférer COVER_SURFACE_CLASS */
export const COVER_PLACEHOLDER_BG = COVER_SURFACE_CLASS;

/** @deprecated Préférer COVER_SURFACE_CLASS */
export const COVER_SURFACE_DARK = COVER_SURFACE_CLASS;
