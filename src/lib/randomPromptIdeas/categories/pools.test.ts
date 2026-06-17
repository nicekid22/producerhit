import { describe, expect, it } from "vitest";
import { CATEGORIZED_EN, CATEGORIZED_FR, flattenCategories } from "./index";

describe("random prompt pools", () => {
  it("FR/EN song pools have hundreds of unique prompts", () => {
    const frSong = flattenCategories(CATEGORIZED_FR.song);
    const enSong = flattenCategories(CATEGORIZED_EN.song);
    expect(frSong.length).toBeGreaterThanOrEqual(180);
    expect(enSong.length).toBeGreaterThanOrEqual(180);
    expect(new Set(frSong).size).toBe(frSong.length);
    expect(new Set(enSong).size).toBe(enSong.length);
  });

  it("FR/EN beat pools are large and unique", () => {
    const frBeat = flattenCategories(CATEGORIZED_FR.beat);
    const enBeat = flattenCategories(CATEGORIZED_EN.beat);
    expect(frBeat.length).toBeGreaterThanOrEqual(110);
    expect(enBeat.length).toBeGreaterThanOrEqual(110);
    expect(new Set(frBeat).size).toBe(frBeat.length);
  });

  it("natural category includes conversational French", () => {
    const natural = CATEGORIZED_FR.song.find((c) => c.id === "natural");
    expect(natural?.prompts.some((p) => p.includes("vacances d'été en Italie"))).toBe(true);
  });
});
