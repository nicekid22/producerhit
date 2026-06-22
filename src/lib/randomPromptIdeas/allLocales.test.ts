import { describe, expect, it } from "vitest";
import { UI_LOCALES } from "@/i18n/config";
import { getLocaleIdeaFallback } from "@/lib/randomPromptIdeas/localeIdeaFallback";
import {
  getLandingDisplayPromptPool,
  pickRandomGenreMenuDiceRoll,
  prepareRotatingPromptPlaceholders,
} from "@/lib/randomPromptIdeas";
import { resolveGenerationCaptionContext } from "@/lib/promptEnhancer";
import { resolveRandomPromptLocale } from "@/lib/resolveRandomPromptLocale";
import { resolveSongVocalLanguage } from "@/lib/vocalLanguages";
import { getDisplayPromptPool } from "@producerhit/shared";
import { uiLocaleToAceVocalLanguage } from "@producerhit/shared";

const NON_EN_FR = UI_LOCALES.filter((l) => l !== "en" && l !== "fr");
const ROMANCE_DICE_LOCALES = ["es", "pt", "de", "it", "nl"] as const;
const CURATED_EN_SAMPLE = "Funny song about a collaborator who uses the same hi-hat on everything";

describe("all 14 UI locales — prompts", () => {
  it.each(UI_LOCALES)("landing song pool for %s is large and readable", (locale) => {
    const pool = getLandingDisplayPromptPool(locale, "song");
    expect(pool.length).toBeGreaterThanOrEqual(40);
    expect(pool.every((p) => p.trim().length > 10)).toBe(true);
    expect(pool.some((p) => (p.match(/,/g) || []).length >= 3)).toBe(false);
  });

  it.each(UI_LOCALES)("rotating placeholder prepares for %s", (locale) => {
    const { pool, startIndex } = prepareRotatingPromptPlaceholders(locale, "song");
    expect(pool.length).toBeGreaterThanOrEqual(40);
    expect(startIndex).toBeGreaterThanOrEqual(0);
    expect(startIndex).toBeLessThan(pool.length);
  });

  it.each(NON_EN_FR)("%s uses English curated pool (not full foreign sentences)", (locale) => {
    const pool = getLandingDisplayPromptPool(locale, "song");
    expect(pool.some((p) => /World Cup|TikTok|Funny song|BeatStars/i.test(p))).toBe(true);
    expect(pool.some((p) => /^Una canción |^Uma música |^Ein .*-Song /i.test(p))).toBe(false);
  });

  it("fr uses French curated pool", () => {
    const pool = getLandingDisplayPromptPool("fr", "song");
    expect(pool.some((p) => /^Chanson |^Hymne |^Ballade /i.test(p))).toBe(true);
    expect(pool.some((p) => /^Funny song /i.test(p))).toBe(false);
  });

  it.each(UI_LOCALES)("idea fallback for %s is non-empty", (locale) => {
    expect(getLocaleIdeaFallback(locale, "song").trim().length).toBeGreaterThan(10);
    expect(getLocaleIdeaFallback(locale, "beat").trim().length).toBeGreaterThan(10);
  });

  it.each(UI_LOCALES)("mobile display pool for %s", (locale) => {
    const pool = getDisplayPromptPool(locale, "song");
    expect(pool.length).toBeGreaterThanOrEqual(40);
  });
});

describe("all 14 UI locales — dice", () => {
  it.each(UI_LOCALES)("dice roll song for %s", (locale) => {
    const roll = pickRandomGenreMenuDiceRoll(locale, "song");
    expect(roll.genre).toBeTruthy();
    expect(roll.displayPrompt.trim().length).toBeGreaterThan(12);
    expect(roll.acePrompt.includes(",")).toBe(true);
    expect(roll.acePrompt.length).toBeGreaterThan(roll.displayPrompt.length);
    if (locale === "fr") {
      expect(roll.displayPrompt).toMatch(/^Une chanson /i);
    } else {
      expect(roll.displayPrompt).toMatch(/^A [a-z0-9]/i);
    }
  });

  it.each([...ROMANCE_DICE_LOCALES])("%s dice uses localized theme fragment", (locale) => {
    let foundLocalized = false;
    for (let i = 0; i < 24; i += 1) {
      const roll = pickRandomGenreMenuDiceRoll(locale, "song");
      if (/ su | sobre | über | su un | per una | over een /i.test(roll.displayPrompt)) {
        foundLocalized = true;
        break;
      }
    }
    expect(foundLocalized).toBe(true);
  });
});

describe("all 14 UI locales — prompt locale resolution", () => {
  it.each(UI_LOCALES)("resolveRandomPromptLocale landing %s", (locale) => {
    expect(resolveRandomPromptLocale({ surface: "landing", uiLocale: locale })).toBe(locale);
  });

  it.each(UI_LOCALES)("resolveRandomPromptLocale dashboard song auto %s", (locale) => {
    expect(
      resolveRandomPromptLocale({
        surface: "dashboard-song",
        uiLocale: locale,
        vocalLanguageMode: "auto",
        manualVocalLanguage: "en",
      }),
    ).toBe(locale);
  });

  it.each(UI_LOCALES)("dashboard beat uses UI locale %s", (locale) => {
    expect(resolveRandomPromptLocale({ surface: "dashboard-beat", uiLocale: locale })).toBe(locale);
  });
});

describe("all 14 UI locales — vocal language", () => {
  it.each(UI_LOCALES)("uiLocaleToAceVocalLanguage(%s) is ACE-supported", (locale) => {
    const code = uiLocaleToAceVocalLanguage(locale);
    expect(["en", "fr", "es", "pt", "it", "de", "ja", "zh", "ko", "ar", "ru"]).toContain(code);
  });

  it.each(["nl", "tr", "hi", "th"] as const)("UI-only locale %s falls back to English vocals", (locale) => {
    expect(uiLocaleToAceVocalLanguage(locale)).toBe("en");
  });

  it.each(["es", "de", "it", "ja", "ko", "zh", "ar", "pt"] as const)(
    "curated EN prompt + UI %s → matching vocals in auto mode",
    (locale) => {
      expect(
        resolveSongVocalLanguage({
          mode: "auto",
          manualCode: "en",
          lyricsMode: "ai",
          lyrics: "",
          songDescription: CURATED_EN_SAMPLE,
          uiLocale: locale,
        }),
      ).toBe(uiLocaleToAceVocalLanguage(locale));
    },
  );
});

describe("all 14 UI locales — generation caption", () => {
  it.each(UI_LOCALES)("curated prompt does not force melodyComposition for %s", (locale) => {
    const sample =
      locale === "fr"
        ? "Chanson drôle sur ton collègue qui met le même hi-hat sur tous ses sons"
        : CURATED_EN_SAMPLE;
    const ctx = resolveGenerationCaptionContext({
      displayIdea: sample,
      formGenre: "Pop",
      mode: "song",
    });
    expect(ctx.melodyComposition).toBe(false);
    expect(ctx.captionOverride).toBeUndefined();
  });

  it.each(UI_LOCALES)("dice override enables melodyComposition for %s", (locale) => {
    const roll = pickRandomGenreMenuDiceRoll(locale, "song");
    const ctx = resolveGenerationCaptionContext({
      diceAceOverride: roll.acePrompt,
      displayIdea: roll.displayPrompt,
      formGenre: roll.genre,
      mode: "song",
    });
    expect(ctx.melodyComposition).toBe(true);
    expect(ctx.captionOverride).toBe(roll.acePrompt);
  });
});
