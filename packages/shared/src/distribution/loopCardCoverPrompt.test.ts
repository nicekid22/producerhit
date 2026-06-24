import { describe, expect, it } from "vitest";
import { buildLoopCardCoverPrompt } from "./loopCardCoverPrompt";

describe("buildLoopCardCoverPrompt", () => {
  it("includes guardrails and genre mood", () => {
    const prompt = buildLoopCardCoverPrompt(
      { id: "loop-1", genre: "lo-fi", mood: "dreamy", seed: 42 },
      { seed: 42 },
    );
    expect(prompt.toLowerCase()).toContain("no faces");
    expect(prompt.toLowerCase()).toContain("no text");
    expect(prompt.toLowerCase()).toContain("lo-fi");
    expect(prompt.toLowerCase()).toContain("dreamy");
  });

  it("is stable for same seed", () => {
    const loop = { id: "x", genre: "trap", mood: "dark", seed: 99 };
    const a = buildLoopCardCoverPrompt(loop, { seed: 99 });
    const b = buildLoopCardCoverPrompt(loop, { seed: 99 });
    expect(a).toBe(b);
  });

  it("avoids portrait-heavy subjects in output", () => {
    for (let i = 0; i < 20; i++) {
      const prompt = buildLoopCardCoverPrompt({ id: `t-${i}`, genre: "house", mood: "euphoric" }, { seed: i });
      expect(prompt.toLowerCase()).not.toMatch(/\bportrait\b/);
      expect(prompt.toLowerCase()).not.toMatch(/\bface\b/);
    }
  });
});
