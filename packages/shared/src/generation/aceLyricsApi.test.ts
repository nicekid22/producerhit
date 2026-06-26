import { describe, expect, it } from "vitest";
import {
  looksLikeAceCaptionEchoLyrics,
  resolveAceLyricsApiField,
  resolveAceLyricsForMeta,
} from "./aceLyricsApi";

describe("aceLyricsApi", () => {
  it("sends compose placeholder to ACE when user lyrics empty", () => {
    expect(resolveAceLyricsApiField({ instrumental: false, lyricsTrimmed: "" })).toBe("[Verse]\n(lyrics)");
    expect(resolveAceLyricsApiField({ instrumental: true, lyricsTrimmed: "" })).toBe("[instrumental]");
  });

  it("filters genre caption echo from stored lyrics", () => {
    const caption =
      "contemporary country, nashville pop-country production, storytelling english vocals, vocal style singer, vocal language fr, 88 bpm";
    const echoed = `[Verse 1]\n${caption}`;
    expect(looksLikeAceCaptionEchoLyrics(echoed, caption)).toBe(true);
    expect(
      resolveAceLyricsForMeta({ parsedLyrics: echoed, userLyrics: "", caption }),
    ).toBe("");
  });

  it("keeps real ACE lyrics", () => {
    const parsed = "[Verse]\nNeon lights on my mind\nCity never sleeps tonight";
    expect(looksLikeAceCaptionEchoLyrics(parsed, "trap, dark piano")).toBe(false);
    expect(resolveAceLyricsForMeta({ parsedLyrics: parsed, userLyrics: "", caption: "trap" })).toBe(parsed);
  });
});
