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

const COVER_ART_STYLE_SUFFIX =
  "A single, abstract object with a glass surface floating against a solid black background. It looks like a random lifestyle retro object but the form is irregular and organic rather than perfectly geometric. Form: The object has distorted shape. Its edges are rounded and uneven, giving it the appearance of a substance that is either melting or has been hand-molded. Surface & Texture: The most striking feature is its glass-like finish. The surface is incredibly smooth and refracts its environment, resulting in a few high-contrast highlights with soft halation and deep shadows. Reflections: You can see just enough highlights to describe the form and warped, dark shapes that suggest a surrounding studio lighting setup being reflected on the curves. Color Palette: The image is essentially colorless and transparent, highlights pop with colorful prismatic light leaks, against the dark void of the background. Overall, the image has a clean, modern aesthetic, blending a cold hard material with a fluid, almost liquid-like shape"

/** Snapshot Pollinations prompt when a track is created (uses live prompt once). */
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

/** Prism-themed metallic gradients for cover frames (violet / cyan / chrome — no flashy orange). */
const PRISM_COVER_GRADIENTS = [
  "linear-gradient(135deg, #e2e8f0 0%, #67c3ff 30%, #9d7cff 62%, #6366f1 100%)",
  "linear-gradient(145deg, #cbd5e1 0%, #7c3aed 36%, #67c3ff 70%, #a78bfa 100%)",
  "linear-gradient(125deg, #94a3b8 0%, #6366f1 26%, #67c3ff 54%, #9d7cff 100%)",
  "linear-gradient(160deg, #67c3ff 0%, #9d7cff 42%, #7c3aed 76%, #e2e8f0 100%)",
  "linear-gradient(130deg, #c084fc 0%, #67c3ff 38%, #818cf8 100%)",
  "linear-gradient(150deg, #e2e8f0 0%, #818cf8 34%, #67c3ff 64%, #9d7cff 100%)",
] as const;

export function coverGradient(loop: Loop) {
  const seed = hashString(`${loop.id}:${loop.genre}:${loop.mood}:${loop.bpm}`);
  return PRISM_COVER_GRADIENTS[seed % PRISM_COVER_GRADIENTS.length];
}

export function coverImageUrl(loop: Loop, size = 512) {
  const trimmed = resolveCoverArtPrompt(loop)
  const seed = coverImageSeed(loop)
  const prompt = `${trimmed} ${COVER_ART_STYLE_SUFFIX}`
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${size}&height=${size}&seed=${seed}&nologo=true`
}
