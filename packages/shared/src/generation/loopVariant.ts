import type { Loop } from "../index";
import type { GenerateLoopAceOptions, GenerateParams } from "./types";
import { loopLengthToBars } from "./generateBeat";
import { resolveSongVocalLanguage } from "../vocalLanguage";

export type LoopVariantKind = "variation" | "remix";

export function isSongLikeLoop(loop: Pick<Loop, "name" | "mood" | "loopLength">): boolean {
  return loop.name.includes("Song") || (!loop.mood && loop.loopLength === "16 bars");
}

export function nextVariantSeed(loop: Pick<Loop, "seed">): number {
  const base = typeof loop.seed === "number" && Number.isFinite(loop.seed) ? loop.seed : 0;
  return base + Math.floor(Math.random() * 100) + 1;
}

function variantDirection(kind: LoopVariantKind, isSongLike: boolean): string {
  if (kind === "remix") {
    return isSongLike
      ? "same song idea and vibe, new drums and arrangement, keep the hook feeling"
      : "remix: new drums and sound selection, keep the same genre and bounce";
  }
  return isSongLike
    ? "same song idea and vibe, new arrangement and instrumentation"
    : "fresh melody and drum details while keeping the same style and groove";
}

export function buildLoopVariantPrompt(args: {
  loop: Pick<Loop, "prompt">;
  kind: LoopVariantKind;
  isSongLike: boolean;
  styleTouch?: string;
  seedStamp?: number;
}): string {
  const now = args.seedStamp ?? Date.now();
  const tag = args.kind === "remix" ? "remix" : "variation";
  const direction = variantDirection(args.kind, args.isSongLike);
  const parts = args.isSongLike
    ? [
        args.loop.prompt?.trim() || "",
        tag,
        `seed:${now}`,
        direction,
        "keep the exact same lyrics provided (do not rewrite lyrics)",
      ]
    : [args.loop.prompt?.trim() || "", tag, `seed:${now}`, direction];
  const touch = (args.styleTouch || "").trim();
  if (touch) parts.push(touch);
  return parts.filter(Boolean).join(", ");
}

export function prepareLoopVariantGeneration(loop: Loop, kind: LoopVariantKind) {
  const isSongLike = isSongLikeLoop(loop);
  const nextSeed = nextVariantSeed(loop);
  const variantPrompt = buildLoopVariantPrompt({ loop, kind, isSongLike });
  const hasManualMeta = Boolean(loop.bpm > 0 && loop.key && loop.scale);
  const autoMeta = !hasManualMeta;

  const inputParams: GenerateParams = {
    genre: loop.genre,
    influence: loop.influence,
    key: loop.key,
    scale: loop.scale,
    bpm: loop.bpm,
    loopLengthBars: loopLengthToBars(loop.loopLength),
    swing: loop.swing,
    mood: loop.mood,
    energyLevel: loop.energyLevel,
    reverb: loop.reverb,
    prompt: variantPrompt,
  };

  const vocalLanguage = resolveSongVocalLanguage({
    mode: "auto",
    manualCode: "en",
    lyricsMode: "ai",
    lyrics: "",
    songDescription: loop.prompt,
  });

  const generateOptions: GenerateLoopAceOptions = isSongLike
    ? {
        instrumental: false,
        lyrics: "",
        vocalLanguage,
        isSong: true,
        autoMeta,
        useFormat: true,
        thinking: true,
        seed: nextSeed,
      }
    : {
        instrumental: true,
        lyrics: "",
        vocalLanguage: "en",
        isSong: false,
        autoMeta,
        seed: nextSeed,
      };

  return { inputParams, generateOptions, variantPrompt, nextSeed, isSongLike, autoMeta };
}

export function variantResultTitle(loop: Loop, kind: LoopVariantKind): string {
  const label = kind === "remix" ? "Remix" : "Variation";
  const keyPart = loop.key ? `${loop.key} ${loop.scale || ""}`.trim() : "Auto";
  return `${loop.genre} ${label} — ${keyPart}`;
}
