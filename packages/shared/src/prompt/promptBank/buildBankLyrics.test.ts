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
    expect(lyrics.toLowerCase()).not.toContain("you fell asleep");
  });

  it("does not sing the display hook verbatim in verses or chorus", () => {
    const display = "Sens la vague sens l'amour — tropical house, 126 bpm";
    const hook = extractHookFromDisplay(display);
    const lyrics = buildSingableLyricsFromBankEntry({
      ...sample,
      lang: "fr",
      theme: "good_vibes",
      display,
      id: 2396,
    });
    expect(lyrics.toLowerCase()).not.toContain(hook.toLowerCase());
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
    expect(fr.toLowerCase()).not.toMatch(/tomber amoureux|ville étrangère/);
    expect(fr.toLowerCase()).toMatch(/cœur|poitrine|reste|nuit/);
  });

  it("street theme drill FR — no romantic love lines", () => {
    const display = "Ils glorifient la vie et ignorent le coût — drill conscient, 142 bpm";
    const lyrics = buildSingableLyricsFromBankEntry({
      ...sample,
      lang: "fr",
      theme: "street",
      display,
      id: 1662,
    });
    const lower = lyrics.toLowerCase();
    expect(lower).not.toMatch(/tes yeux|dans tes bras|cœur s'emballe|mon cœur bat|reste encore un peu/);
    expect(lower).toMatch(/bloc|vérité|coût|prix|rue|flow|dream|cost|block|truth/);
    expect(lyrics).toContain("[fr]");
  });

  it("does not repeat the same verse line four times for short hooks", () => {
    const lyrics = buildSingableLyricsFromBankEntry({
      ...sample,
      display: "Midnight drive — trap, 140 bpm",
      id: 42,
    });
    const verseBlock = lyrics.split("[verse]")[1]?.split("[pre-chorus]")[0] ?? "";
    const lines = verseBlock
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("["));
    const unique = new Set(lines);
    expect(unique.size).toBeGreaterThan(1);
  });

  it("uses theme-specific pre-chorus for hustle vs party", () => {
    const hustle = buildSingableLyricsFromBankEntry({
      ...sample,
      theme: "hustle",
      display: "Never sleep on the grind — trap, 140 bpm",
      id: 3001,
    });
    const party = buildSingableLyricsFromBankEntry({
      ...sample,
      theme: "party",
      display: "Never sleep on the grind — trap, 140 bpm",
      id: 3001,
    });
    expect(hustle).not.toBe(party);
    expect(hustle.toLowerCase()).toMatch(/grind|climb|victory|pressure/);
    expect(party.toLowerCase()).toMatch(/hands|sound|dance|town/);
  });

  it("covers all bank themes without placeholders", () => {
    for (const theme of [
      "love",
      "loss",
      "hustle",
      "party",
      "heartbreak",
      "nostalgia",
      "identity",
      "night",
      "good_vibes",
      "street",
    ]) {
      const lyrics = buildSingableLyricsFromBankEntry({
        ...sample,
        theme,
        id: 5000 + theme.length,
      });
      expect(hasPlaceholderBankLyrics(lyrics)).toBe(false);
      expect(lyrics).toContain("[chorus]");
    }
  });
});
