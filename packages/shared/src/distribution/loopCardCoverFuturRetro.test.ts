import { describe, expect, it } from "vitest";
import {
  LOOP_CARD_COVER_FUTUR_RETRO_ENABLED,
  enrichLoopCardCoverForFuturRetro,
  pickFuturRetroFinish,
} from "./loopCardCoverFuturRetro";
import { buildLoopCardCoverPrompt } from "./loopCardCoverPrompt";

describe("loopCardCoverFuturRetro", () => {
  it("adds grain or holographic finish when enabled", () => {
    if (!LOOP_CARD_COVER_FUTUR_RETRO_ENABLED) return;

    const base = {
      subject: "floating chrome spheres in void",
      mood: "playful",
      palette: "teal and coral",
      lighting: "cinematic lighting",
      style: "minimal album artwork",
    };

    const enriched = enrichLoopCardCoverForFuturRetro(base, 4242);
    const haystack = `${enriched.style} ${enriched.palette} ${enriched.lighting}`.toLowerCase();
    expect(haystack).toMatch(
      /grain|holographic|vhs|gradient|hologram|scanline|iridescent|glow|mesh|retro-future|glitch|manga|cel-shad|screentone|datamosh|anime/,
    );
  });

  it("pickFuturRetroFinish is deterministic", () => {
    expect(pickFuturRetroFinish(7)).toBe(pickFuturRetroFinish(7));
  });

  it("buildLoopCardCoverPrompt reflects futur retro when enabled", () => {
    if (!LOOP_CARD_COVER_FUTUR_RETRO_ENABLED) return;

    const prompt = buildLoopCardCoverPrompt(
      { id: "futur-1", genre: "trapsoul", mood: "mysterious", seed: 777 },
      { seed: 777 },
    ).toLowerCase();

    expect(prompt).toMatch(
      /grain|holographic|hologram|scanline|iridescent|gradient|retro-future|vhs|phosphor|laser|chrome|neon|glitch|manga|cel-shad|screentone|datamosh|anime/,
    );
  });
});
