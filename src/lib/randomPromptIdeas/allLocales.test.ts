import { describe, expect, it } from "vitest";
import { UI_LOCALES } from "@/i18n/config";
import { getLocaleIdeaFallback } from "@/lib/randomPromptIdeas/localeIdeaFallback";
import {
  getLandingDisplayPromptPool,
  pickRandomGenreMenuDiceRoll,
  prepareRotatingPromptPlaceholders,
} from "@/lib/randomPromptIdeas";
import { getUnifiedUserPromptPool } from "@/lib/randomPromptIdeas/unifiedDisplayPool";
import { looksLikeAceTechnicalPrompt, resolveGenerationCaptionContext } from "@/lib/promptEnhancer";
import { resolveRandomPromptLocale } from "@/lib/resolveRandomPromptLocale";
import { resolveSongVocalLanguage } from "@/lib/vocalLanguages";
import { getCuratedDisplayPromptPool, getDisplayPromptPool, looksLikeAceProsePrompt, resolveCuratedPromptLocale } from "@producerhit/shared";
import { uiLocaleToAceVocalLanguage } from "@producerhit/shared";

const NON_EN_FR = UI_LOCALES.filter((l) => l !== "en" && l !== "fr");
const ROMANCE_DICE_LOCALES = ["es", "pt", "de", "it", "nl"] as const;
const CURATED_EN_SAMPLE = "Funny song about a collaborator who uses the same hi-hat on everything";

describe("all 14 UI locales — prompts", () => {
  it.each(UI_LOCALES)("landing song pool for %s is large and readable", (locale) => {
    const pool = getLandingDisplayPromptPool(locale, "song");
    expect(pool.length).toBeGreaterThanOrEqual(80);
    expect(pool.every((p) => p.trim().length > 10)).toBe(true);
    expect(pool.some((p) => looksLikeAceTechnicalPrompt(p))).toBe(false);
  });

  it.each(UI_LOCALES)("rotating placeholder prepares for %s", (locale) => {
    const { pool, startIndex } = prepareRotatingPromptPlaceholders(locale, "song");
    expect(pool.length).toBeGreaterThanOrEqual(80);
    expect(startIndex).toBeGreaterThanOrEqual(0);
    expect(startIndex).toBeLessThan(pool.length);
  });

  it("en v2 pool includes rich cinematic and retro prompts", () => {
    const pool = getLandingDisplayPromptPool("en", "song");
    expect(pool.some((p) => /synthwave|film noir|anime opening|80s/i.test(p))).toBe(true);
    expect(pool.some((p) => p.length >= 100)).toBe(true);
  });

  it("fr v2 pool includes rich cinematic and retro prompts", () => {
    const pool = getLandingDisplayPromptPool("fr", "song");
    expect(pool.some((p) => /synthwave|film noir|anime|80s/i.test(p))).toBe(true);
    expect(pool.some((p) => p.length >= 100)).toBe(true);
  });

  it.each(["es", "it", "de", "pt"] as const)("%s landing uses translated curated (not English shell)", (locale) => {
    const pool = getLandingDisplayPromptPool(locale, "song");
    const curated = getCuratedDisplayPromptPool(resolveCuratedPromptLocale(locale), "song");
    expect(pool.some((p) => curated.includes(p))).toBe(true);
    if (locale === "es") {
      expect(pool.some((p) => /graciosa|colaborador|hi-hat/i.test(p))).toBe(true);
    }
    if (locale === "it") {
      expect(pool.some((p) => /divertente|collega|hi-hat/i.test(p))).toBe(true);
    }
  });

  it.each(["nl", "tr", "hi", "th"] as const)("%s uses English curated (no ACE voice)", (locale) => {
    const pool = getLandingDisplayPromptPool(locale, "song");
    expect(pool.some((p) => /World Cup|TikTok|Funny song|BeatStars/i.test(p))).toBe(true);
  });

  it.each(NON_EN_FR.filter((l) => !["nl", "tr", "hi", "th"].includes(l)))(
    "%s pool includes funny curated and genre dice options",
    (locale) => {
      const pool = getLandingDisplayPromptPool(locale, "song");
      expect(pool.some((p) => /TikTok|BeatStars|hi-hat|Coupe du monde|World Cup|Mundial/i.test(p))).toBe(true);
      expect(pool.some((p) => /^A [a-z0-9].* song /i.test(p))).toBe(true);
    },
  );

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
    if (roll.acePrompt.trim() && !looksLikeAceProsePrompt(roll.displayPrompt)) {
      expect(roll.acePrompt.includes(",")).toBe(true);
      expect(roll.acePrompt.length).toBeGreaterThan(roll.displayPrompt.length);
    }
  });

  it.each(["es", "de", "it", "ja", "ko", "zh", "ar", "pt"] as const)(
    "%s unified pool includes localized ACE prose",
    (locale) => {
      const pool = getUnifiedUserPromptPool(locale, "song");
      const ace = pool.filter((p) => looksLikeAceProsePrompt(p));
      expect(ace.length).toBeGreaterThanOrEqual(200);
    },
  );

  it("dice pool includes translated curated funny prompts (same as placeholder)", () => {
    const pool = getUnifiedUserPromptPool("es", "song");
    const funny = pool.find((p) => /graciosa|colaborador|hi-hat/i.test(p));
    expect(funny).toBeTruthy();
    const curated = getCuratedDisplayPromptPool(resolveCuratedPromptLocale("es"), "song");
    expect(curated).toContain(funny);
    const roll = pickRandomGenreMenuDiceRoll("es", "song");
    expect(roll.displayPrompt.trim().length).toBeGreaterThan(12);
    if (/graciosa|colaborador|hi-hat/i.test(roll.displayPrompt)) {
      expect(roll.acePrompt).toBe("");
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

  it("legacy IT dice shell + UI fr → French vocals after site locale switch", () => {
    expect(
      resolveSongVocalLanguage({
        mode: "auto",
        manualCode: "en",
        lyricsMode: "ai",
        lyrics: "",
        songDescription: "Una canzone deep focus su una storia notturna",
        uiLocale: "fr",
      }),
    ).toBe("fr");
  });

  it("non-structured Italian leftover + UI fr → French vocals", () => {
    expect(
      resolveSongVocalLanguage({
        mode: "auto",
        manualCode: "en",
        lyricsMode: "ai",
        lyrics: "",
        songDescription: "Pop ironico sulle riunioni Zoom che potevano essere un'email",
        uiLocale: "fr",
      }),
    ).toBe("fr");
  });

  it("legacy IT dice shell + UI it → Italian vocals not French", () => {
    expect(
      resolveSongVocalLanguage({
        mode: "auto",
        manualCode: "en",
        lyricsMode: "ai",
        lyrics: "",
        songDescription: "Una canzone deep focus su una storia notturna",
        uiLocale: "it",
      }),
    ).toBe("it");
  });

  it("EN dice shell + UI th → English vocals", () => {
    expect(
      resolveSongVocalLanguage({
        mode: "auto",
        manualCode: "en",
        lyricsMode: "ai",
        lyrics: "",
        songDescription: "A digicore song about a viral pop moment",
        uiLocale: "th",
      }),
    ).toBe("en");
  });
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
      uiLocale: locale,
    });
    expect(ctx.melodyComposition).toBe(false);
    expect(ctx.captionOverride).toBeUndefined();
  });

  it.each(UI_LOCALES)("dice override enables melodyComposition for %s", (locale) => {
    let roll = pickRandomGenreMenuDiceRoll(locale, "song");
    for (let i = 0; i < 60 && !roll.acePrompt.trim(); i += 1) {
      roll = pickRandomGenreMenuDiceRoll(locale, "song");
    }
    expect(roll.acePrompt.trim().length).toBeGreaterThan(0);
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
