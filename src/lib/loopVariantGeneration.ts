import type { Loop } from "@/types/loop";
import type { GenerateParams } from "@/lib/promptBuilder";
import { isSongLoop, extractLoopVocalLanguage } from "@/lib/vocalLanguages";

export type LoopVariantKind = "variation" | "remix";

export function barsFromLoopLength(loopLength: string): number {
  const m = loopLength.match(/(\d+)/);
  const n = m ? Number(m[1]) : 8;
  return Number.isFinite(n) && n > 0 ? n : 4;
}

export function nextVariantSeed(loop: Loop): number {
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

/** Même logique que le bouton Remix/Variation des cartes loop. */
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

export function prepareLoopVariantGeneration(
  loop: Loop,
  kind: LoopVariantKind,
  options?: { styleTouch?: string; forceInstrumental?: boolean },
) {
  const isSongLike = options?.forceInstrumental === true ? false : options?.forceInstrumental === false ? true : isSongLoop(loop);
  const parentVocalLang = extractLoopVocalLanguage(loop) ?? "en";
  const barsCount = barsFromLoopLength(loop.loopLength);
  const nextSeed = nextVariantSeed(loop);
  const variantPrompt = buildLoopVariantPrompt({
    loop,
    kind,
    isSongLike,
    styleTouch: options?.styleTouch,
  });
  const hasManualMeta = Boolean(loop.bpm > 0 && loop.key && loop.scale);
  const autoMeta = !hasManualMeta;
  const engine = loop.engine?.startsWith("sonauto") ? ("sonauto" as const) : ("ace-step" as const);

  const inputParams: GenerateParams = {
    genre: loop.genre,
    influence: loop.influence,
    key: loop.key,
    scale: loop.scale,
    bpm: loop.bpm,
    loopLengthBars: barsCount,
    swing: loop.swing,
    mood: loop.mood,
    energyLevel: loop.energyLevel,
    reverb: loop.reverb,
    prompt: variantPrompt,
  };

  const generateOptions = isSongLike
    ? {
        instrumental: false as const,
        lyrics: loop.details?.lyrics || "",
        vocalLanguage: parentVocalLang,
        isSong: true as const,
        autoMeta,
        duration: typeof loop.details?.duration === "number" ? loop.details.duration : undefined,
        timeSignature: loop.details?.timeSignature || undefined,
        audioFormat: loop.details?.audioFormat || "mp3",
        seed: nextSeed,
      }
    : {
        instrumental: true as const,
        lyrics: "" as const,
        vocalLanguage: "en" as const,
        isSong: false as const,
        autoMeta,
        audioFormat: loop.details?.audioFormat || "mp3",
        seed: nextSeed,
      };

  return {
    inputParams,
    generateOptions,
    variantPrompt,
    nextSeed,
    isSongLike,
    engine,
    autoMeta,
  };
}

export function variantResultTitle(loop: Loop, kind: LoopVariantKind): string {
  return `${loop.genre} ${kind === "remix" ? "Remix" : "Variation"} — ${loop.key || "Auto"} ${loop.scale || ""}`.trim();
}
