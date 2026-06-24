import { describe, expect, it } from "vitest";
import { buildCoverGenerationSeed } from "./coverGenerationSeed";

describe("buildCoverGenerationSeed", () => {
  it("changes when prompt changes", () => {
    const a = buildCoverGenerationSeed("lighthouse in fog", "loop-1", 42, 1);
    const b = buildCoverGenerationSeed("old film camera on map", "loop-1", 42, 1);
    expect(a).not.toBe(b);
  });

  it("changes when attempt increments", () => {
    const a = buildCoverGenerationSeed("same prompt", "loop-1", 42, 1);
    const b = buildCoverGenerationSeed("same prompt", "loop-1", 42, 2);
    expect(a).not.toBe(b);
  });
});
