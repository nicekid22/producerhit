import { describe, expect, it } from "vitest";
import {
  ACE_BEAT_INSTRUMENTAL_TAGS,
  ACE_SONG_VOCAL_STABILITY_TAGS,
  normalizeAceCaption,
  normalizeAceGenerationPayload,
  normalizeAceLyrics,
} from "./acePromptContract";

describe("normalizeAceCaption", () => {
  it("adds vocal stability tags for songs", () => {
    const { caption } = normalizeAceCaption("melodic trap, dark piano, 140 bpm", {
      mode: "song",
      instrumental: false,
      bpm: 140,
    });
    expect(caption).toContain("clean studio vocal");
    expect(caption).toContain("controlled delivery");
    expect(caption).not.toContain("no vocals");
  });

  it("forces instrumental tags for beats and strips vocals", () => {
    const { caption } = normalizeAceCaption(
      "dark trap, deep male vocal, harmonies, 140 bpm, vocals",
      { mode: "beat", instrumental: true, bpm: 140 },
    );
    for (const tag of ACE_BEAT_INSTRUMENTAL_TAGS) {
      expect(caption.toLowerCase()).toContain(tag);
    }
    expect(caption.toLowerCase()).not.toContain("male vocal");
    expect(caption.toLowerCase()).not.toContain("harmonies");
  });

  it("aligns BPM tag with param and drops tempo hint duplicate", () => {
    const { caption, warnings } = normalizeAceCaption(
      "house, four-on-the-floor, 128 bpm, mid-tempo",
      { mode: "beat", instrumental: true, bpm: 140 },
    );
    expect(caption).toMatch(/140 bpm/i);
    expect(caption.toLowerCase()).not.toContain("mid-tempo");
    expect(warnings.some((w) => w.includes("aligned"))).toBe(true);
  });

  it("dedupes tags and respects max tag count while keeping beat instrumental tags", () => {
    const many = Array.from({ length: 20 }, (_, i) => `tag${i}`).join(", ");
    const { caption, warnings } = normalizeAceCaption(many, {
      mode: "beat",
      instrumental: true,
    });
    const tagCount = caption.split(",").length;
    expect(tagCount).toBeLessThanOrEqual(14);
    expect(caption.toLowerCase()).toContain("instrumental");
    expect(warnings.some((w) => w.includes("trimmed"))).toBe(true);
  });

  it("keeps vocal stability tags when trimming long song captions", () => {
    const many = Array.from({ length: 20 }, (_, i) => `tag${i}`).join(", ");
    const { caption } = normalizeAceCaption(many, {
      mode: "song",
      instrumental: false,
      bpm: 140,
    });
    expect(caption).toContain("clean studio vocal");
    expect(caption).toContain("controlled delivery");
    expect(caption.split(",").length).toBeLessThanOrEqual(14);
  });
});

describe("normalizeAceLyrics", () => {
  it("returns instrumental marker for beats", () => {
    expect(normalizeAceLyrics("anything", { instrumental: true }).lyrics).toBe("[Instrumental]");
  });

  it("strips parenthetical placeholder lines from bank structure", () => {
    const raw = `[Verse 1]
(storytelling — you fell asleep on my shoulder)
Real line one here
Another short line`;

    const { lyrics, warnings } = normalizeAceLyrics(raw, { instrumental: false });
    expect(lyrics).not.toContain("storytelling");
    expect(lyrics).toContain("Real line one here");
    expect(warnings.length).toBeGreaterThan(0);
  });

  it("trims very long lines", () => {
    const long = "word ".repeat(20).trim();
    const { lyrics, warnings } = normalizeAceLyrics(long, { instrumental: false });
    expect(lyrics.split(/\s+/).length).toBeLessThanOrEqual(12);
    expect(warnings.some((w) => w.includes("trimmed"))).toBe(true);
  });
});

describe("normalizeAceGenerationPayload", () => {
  it("normalizes song caption and lyrics together", () => {
    const result = normalizeAceGenerationPayload({
      mode: "song",
      caption: "pop, bright synths, 120 bpm",
      lyrics: "[Chorus]\n(hook moment)\nWe rise up high",
      instrumental: false,
      bpm: 120,
      vocalLanguage: "en",
    });
    for (const tag of ACE_SONG_VOCAL_STABILITY_TAGS) {
      expect(result.caption).toContain(tag);
    }
    expect(result.lyrics).toContain("We rise up high");
    expect(result.lyrics).not.toContain("(hook moment)");
  });
});
