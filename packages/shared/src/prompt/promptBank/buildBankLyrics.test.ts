import { describe, expect, it } from "vitest";
import {
  buildSingableLyricsFromBankEntry,
  extractHookFromDisplay,
  hasPlaceholderBankLyrics,
  resolveBankLyrics,
} from "./buildBankLyrics";

describe("buildBankLyrics", () => {
  const sample = {
    display: "You fell asleep on my shoulder on a train to nowhere — neo soul, 76 bpm",
    lyrics_structure: `[Verse 1]
(storytelling — you fell asleep on my shoulder on a train to nowhere)

[Chorus]
(peak moment, memorable hook)`,
    lang: "en" as const,
    theme: "love",
    id: 1001,
  };

  it("detects placeholder lyrics", () => {
    expect(hasPlaceholderBankLyrics(sample.lyrics_structure)).toBe(true);
    expect(hasPlaceholderBankLyrics("[verse]\nYou fell asleep tonight\nOn my shoulder low")).toBe(false);
  });

  it("extracts hook from display", () => {
    expect(extractHookFromDisplay(sample.display)).toBe(
      "You fell asleep on my shoulder on a train to nowhere",
    );
  });

  it("builds singable structure without parentheses", () => {
    const lyrics = buildSingableLyricsFromBankEntry(sample);
    expect(lyrics).toContain("[verse]");
    expect(lyrics).toContain("[chorus]");
    expect(lyrics).toContain("[en]");
    expect(lyrics).not.toMatch(/\(storytelling/i);
    expect(lyrics.toLowerCase()).toContain("you fell asleep");
  });

  it("is deterministic per bank id", () => {
    const a = buildSingableLyricsFromBankEntry(sample);
    const b = buildSingableLyricsFromBankEntry(sample);
    expect(a).toBe(b);
  });

  it("resolveBankLyrics keeps custom lyrics", () => {
    const custom = "[verse]\nCustom line one\nCustom line two";
    expect(
      resolveBankLyrics({
        ...sample,
        lyrics_structure: custom,
      }),
    ).toBe(custom);
  });

  it("builds French lines when lang is fr", () => {
    const fr = buildSingableLyricsFromBankEntry({
      ...sample,
      lang: "fr",
      display: "Tomber amoureux dans une ville étrangère — neo soul, 85 bpm",
      id: 2002,
    });
    expect(fr).toContain("[fr]");
    expect(fr).toMatch(/tomber amoureux|ville étrangère/i);
  });
});
