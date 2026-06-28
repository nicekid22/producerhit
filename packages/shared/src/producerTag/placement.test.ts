import { describe, expect, it } from "vitest";
import { computeTagOffsetSec } from "./placement";

describe("computeTagOffsetSec", () => {
  it("places intro at 0", () => {
    expect(
      computeTagOffsetSec({ bpm: 140, durationSec: 120, tagDurationSec: 2, placement: "intro" }),
    ).toBe(0);
  });

  it("places outro near end", () => {
    const off = computeTagOffsetSec({
      bpm: 90,
      durationSec: 60,
      tagDurationSec: 2,
      placement: "outro",
    });
    expect(off).toBeCloseTo(57.75, 1);
  });

  it("places bar_16 from bpm", () => {
    const off = computeTagOffsetSec({
      bpm: 120,
      durationSec: 120,
      tagDurationSec: 2,
      placement: "bar_16",
    });
    expect(off).toBeCloseTo(32, 0);
  });

  it("random_bars is deterministic with seed", () => {
    const a = computeTagOffsetSec({
      bpm: 120,
      durationSec: 180,
      tagDurationSec: 2,
      placement: "random_bars",
      randomSeed: 42,
    });
    const b = computeTagOffsetSec({
      bpm: 120,
      durationSec: 180,
      tagDurationSec: 2,
      placement: "random_bars",
      randomSeed: 42,
    });
    expect(a).toBe(b);
  });
});
