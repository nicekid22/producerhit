import { describe, expect, it } from "vitest";
import { countLyricsLines, parseAceLyricsForDisplay } from "./formatAceLyrics";

describe("formatAceLyrics", () => {
  it("parses section markers and lines", () => {
    const blocks = parseAceLyricsForDisplay("[Verse]\nNeon lights\n\n[Chorus]\nWe rise up");
    expect(blocks).toEqual([
      { kind: "section", label: "Verse" },
      { kind: "line", text: "Neon lights" },
      { kind: "section", label: "Chorus" },
      { kind: "line", text: "We rise up" },
    ]);
  });

  it("counts singable lines only", () => {
    expect(countLyricsLines("[Verse]\nHello world\n[Chorus]\nHook line")).toBe(2);
    expect(countLyricsLines("")).toBe(0);
  });
});
