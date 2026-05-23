import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Loop } from "@/types/loop"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function hashString(input: string) {
  let h = 0
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) >>> 0
  return h
}

export function coverGradient(loop: Loop) {
  const seed = hashString(`${loop.id}:${loop.genre}:${loop.mood}:${loop.bpm}`)
  const h1 = seed % 360
  const h2 = (h1 + 35 + ((seed >>> 8) % 40)) % 360
  const h3 = (h2 + 35 + ((seed >>> 16) % 40)) % 360
  const a = 0.92
  return `linear-gradient(135deg, hsla(${h1}, 88%, 62%, ${a}) 0%, hsla(${h2}, 90%, 58%, ${a}) 42%, hsla(${h3}, 85%, 55%, ${a}) 100%)`
}

export function coverImageUrl(loop: Loop) {
  const basePrompt = `${loop.genre || ""} ${loop.mood || ""} ${loop.influence || ""}`.trim()
  const trimmed = basePrompt.length > 160 ? basePrompt.slice(0, 160) : basePrompt
  const seed = typeof loop.seed === "number" && Number.isFinite(loop.seed) ? loop.seed : hashString(loop.id)
  const size = 512
  const prompt = `${trimmed}, hip hop style anime kawaii style kaws plastic figurine art in paper or modeling paste, purple blue gradient grey color, futuristic reflect gradient aesthetic, glossy and transparent materials, floating 3D shapes, cinematic lighting, ultra clean modern composition, reflective surfaces, holographic color and details, depth and atmosphere, soft glow, futuristic vibe, high contrast, hyper detailed, premium visual identity, ultra realistic render, without people, no character, no text, no logo`
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${size}&height=${size}&seed=${seed}&nologo=true`
}
