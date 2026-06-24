import { describe, expect, it } from "vitest";
import {
  getCoverSurpriseIdeasCount,
  getCoverSurpriseLibrary,
  pickCoverSurpriseSuggestion,
} from "./coverSurpriseLibrary";
import { buildStructuredCoverPrompt, COVER_PROMPT_MAX_LENGTH } from "./coverPrompt";

describe("coverSurpriseLibrary", () => {
  it("exposes 200+ curated ideas", () => {
    expect(getCoverSurpriseIdeasCount()).toBeGreaterThanOrEqual(200);
    expect(getCoverSurpriseLibrary().length).toBe(getCoverSurpriseIdeasCount());
  });

  it("avoids portrait-heavy subjects", () => {
    const library = getCoverSurpriseLibrary();
    const portraitish = library.filter((e) => /\bportrait\b/i.test(e.subject));
    expect(portraitish.length).toBeLessThan(library.length * 0.05);
  });

  it("builds valid prompts under max length", () => {
    const sample = getCoverSurpriseLibrary().slice(0, 40);
    for (const idea of sample) {
      const prompt = buildStructuredCoverPrompt(idea);
      expect(prompt.length).toBeGreaterThan(10);
      expect(prompt.length).toBeLessThanOrEqual(COVER_PROMPT_MAX_LENGTH);
      expect(prompt).toContain("album cover");
    }
  });

  it("biases trap-like genres toward urban categories", () => {
    const urbanish = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const pick = pickCoverSurpriseSuggestion(
        { genre: "Emo Trap", mood: "dark" },
        { seed: 10_000 + i, favorGenre: true },
      );
      urbanish.add(pick.subject);
    }
    expect(urbanish.size).toBeGreaterThan(8);
  });

  it("is deterministic with the same seed", () => {
    const a = pickCoverSurpriseSuggestion({ genre: "lo-fi" }, { seed: 42 });
    const b = pickCoverSurpriseSuggestion({ genre: "lo-fi" }, { seed: 42 });
    expect(a).toEqual(b);
  });
});
