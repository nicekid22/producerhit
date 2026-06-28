import { describe, expect, it } from "vitest";
import { resolveLoopDisplayLyrics } from "./resolveLoopDisplayLyrics";

const SAMPLE = `[Verse 1]
Neon lights on the boulevard
We don't need a reason

[Chorus]
We rise up tonight`;

describe("resolveLoopDisplayLyrics", () => {
  it("reads lyrics from stems ace", () => {
    expect(
      resolveLoopDisplayLyrics({
        prompt: "synth pop",
        stemsUrl: { ace: { lyrics: SAMPLE, caption: "synth pop, 120 bpm" } },
      }),
    ).toContain("Neon lights");
  });

  it("prefers userLyrics over empty filtered ace lyrics", () => {
    expect(
      resolveLoopDisplayLyrics({
        prompt: "pop song",
        stemsUrl: {
          ace: {
            lyrics: "",
            userLyrics: SAMPLE,
            caption: "pop, vocal song",
          },
        },
      }),
    ).toContain("We rise up");
  });

  it("uses parsedLyrics when lyrics field was cleared at save", () => {
    expect(
      resolveLoopDisplayLyrics({
        prompt: "trap beat",
        stemsUrl: {
          ace: {
            lyrics: "",
            parsedLyrics: SAMPLE,
            caption: "trap, 140 bpm",
          },
        },
      }),
    ).toContain("Neon lights");
  });

  it("falls back to details.lyrics for optimistic local loops", () => {
    expect(
      resolveLoopDisplayLyrics({
        prompt: "idea",
        details: { lyrics: SAMPLE, caption: "idea" },
        stemsUrl: { ace: { taskId: "t1" } },
      }),
    ).toContain("We rise up");
  });

  it("returns empty for instrumental markers", () => {
    expect(
      resolveLoopDisplayLyrics({
        stemsUrl: { ace: { lyrics: "[Instrumental]", caption: "beat" } },
      }),
    ).toBe("");
  });
});
