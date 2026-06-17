import { describe, expect, it, vi, afterEach } from "vitest";
import {
  getBrowserAppLocale,
  resolveRandomPromptLocale,
  vocalCodeToPromptLocale,
} from "@/lib/resolveRandomPromptLocale";

describe("resolveRandomPromptLocale", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("landing uses UI locale", () => {
    expect(resolveRandomPromptLocale({ surface: "landing", uiLocale: "ja" })).toBe("ja");
    expect(resolveRandomPromptLocale({ surface: "landing", uiLocale: "fr" })).toBe("fr");
  });

  it("dashboard beat uses UI locale", () => {
    expect(resolveRandomPromptLocale({ surface: "dashboard-beat", uiLocale: "de" })).toBe("de");
  });

  it("dashboard song manual uses selected vocal language", () => {
    expect(
      resolveRandomPromptLocale({
        surface: "dashboard-song",
        uiLocale: "en",
        vocalLanguageMode: "manual",
        manualVocalLanguage: "ja",
      }),
    ).toBe("ja");
  });

  it("dashboard song auto uses browser locale", () => {
    vi.stubGlobal("navigator", { language: "fr-FR" });
    expect(
      resolveRandomPromptLocale({
        surface: "dashboard-song",
        uiLocale: "en",
        vocalLanguageMode: "auto",
        manualVocalLanguage: "en",
      }),
    ).toBe("fr");
  });

  it("maps unsupported vocal codes to English pools", () => {
    expect(vocalCodeToPromptLocale("ru")).toBe("en");
    expect(vocalCodeToPromptLocale("ja")).toBe("ja");
  });
});

describe("getBrowserAppLocale", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("normalizes navigator.language", () => {
    vi.stubGlobal("navigator", { language: "ja-JP" });
    expect(getBrowserAppLocale()).toBe("ja");
  });
});
