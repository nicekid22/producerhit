import { describe, expect, it } from "vitest";
import { detectVocalLanguageFromText, resolveSongVocalLanguage } from "@/lib/vocalLanguages";

describe("detectVocalLanguageFromText", () => {
  it("detects Italian prompts", () => {
    expect(detectVocalLanguageFromText("Una canzone deep focus su una storia notturna")).toBe("it");
    expect(detectVocalLanguageFromText("Un R&B sulle mie dimissioni")).toBe("it");
  });

  it("detects English curated prompts", () => {
    expect(detectVocalLanguageFromText("Funny song about a collaborator who uses the same hi-hat on everything")).toBe(
      "en",
    );
  });
});

describe("resolveSongVocalLanguage", () => {
  it("uses UI locale when prompt is English and auto mode", () => {
    expect(
      resolveSongVocalLanguage({
        mode: "auto",
        manualCode: "en",
        lyricsMode: "ai",
        lyrics: "",
        songDescription: "Funny song about your Spotify algorithm",
        uiLocale: "it",
      }),
    ).toBe("it");
  });
});
