import { describe, expect, it } from "vitest";
import { UI_LOCALES } from "./i18n/locales";
import { defaultVocalLanguagePreference } from "./vocalLanguage";

const ACE_UI_LOCALES = ["en", "fr", "es", "pt", "de", "it", "ar", "ja", "ko", "zh"] as const;
const AUTO_ONLY_UI_LOCALES = ["nl", "tr", "hi", "th"] as const;

describe("defaultVocalLanguagePreference", () => {
  it.each(ACE_UI_LOCALES)("%s → manual with matching code", (locale) => {
    expect(defaultVocalLanguagePreference(locale)).toEqual({
      mode: "manual",
      manualCode: locale,
    });
  });

  it.each(AUTO_ONLY_UI_LOCALES)("%s → auto (no direct ACE vocal)", (locale) => {
    expect(defaultVocalLanguagePreference(locale)).toEqual({
      mode: "auto",
      manualCode: "en",
    });
  });

  it("covers all 14 UI locales", () => {
    for (const locale of UI_LOCALES) {
      const pref = defaultVocalLanguagePreference(locale);
      expect(pref.mode === "auto" || pref.mode === "manual").toBe(true);
      expect(pref.manualCode.length).toBeGreaterThan(0);
    }
  });
});
