import { describe, expect, it } from "vitest";
import {
  looksLikeAceCaptionEchoLyrics,
  looksLikeAceStructuralLyrics,
  resolveAceLyricsApiField,
  resolveAceLyricsForMeta,
} from "./aceLyricsApi";

describe("aceLyricsApi", () => {
  it("sends empty lyrics to ACE when user lyrics empty (compose via messages)", () => {
    expect(resolveAceLyricsApiField({ instrumental: false, lyricsTrimmed: "" })).toBe("");
    expect(resolveAceLyricsApiField({ instrumental: true, lyricsTrimmed: "" })).toBe("[instrumental]");
    expect(resolveAceLyricsApiField({ instrumental: false, lyricsTrimmed: "my verse" })).toBe("my verse");
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

  it("filters ACE structural arrangement from stored lyrics", () => {
    const structural = `[0:00] [Instrumental Intro - Driving Guitars and Drums]
[0:20] [Melodic Guitar Section 1]`;
    expect(looksLikeAceStructuralLyrics(structural)).toBe(true);
    expect(
      resolveAceLyricsForMeta({ parsedLyrics: structural, userLyrics: "", caption: "rock, 120 bpm" }),
    ).toBe("");
  });

  it("does not persist placeholder skeleton as user lyrics", () => {
    const skeleton = `[intro]
(atmospheric intro)
[verse]
(storytelling — mood and theme from the genre)`;
    expect(
      resolveAceLyricsForMeta({ parsedLyrics: "", userLyrics: skeleton, caption: "pop, vocal song" }),
    ).toBe("");
  });

  it("keeps real singable ACE lyrics when idée remplie", () => {
    const structural = `[0:00] [Instrumental Intro - Driving Guitars and Drums]
[0:20] [Melodic Guitar Section 1]`;
    expect(
      resolveAceLyricsForMeta({ parsedLyrics: structural, userLyrics: "", caption: "rock, 120 bpm" }),
    ).toBe("");
    const parsed = "[Verse]\nNeon lights on my mind\nCity never sleeps tonight";
    expect(resolveAceLyricsForMeta({ parsedLyrics: parsed, userLyrics: "", caption: "trap" })).toBe(parsed);
  });

  it("persists ACE vocal phonetic caption when lyrics field is empty", () => {
    const phonetic = "(spokenZNptazard,rap tamil,idhi,ukkoli,ukkoli,ukkoli.";
    expect(
      resolveAceLyricsForMeta({ parsedLyrics: "", userLyrics: "", caption: phonetic }),
    ).toBe(phonetic);
  });
});
