import { describe, expect, it } from "vitest";
import { generateAceProsePrompt, looksLikeAceProsePrompt } from "./aceProse";
import { resolveGenerationCaptionContext } from "./captionContext";
import { pickPromptBankRoll } from "./promptBank";

const BANK_HUSTLE_DISPLAY =
  "Working at 3am when everyone is asleep — dark trap, 140 bpm";

const BANK_FR_DISPLAY =
  "Te voir pour la première fois de l'autre côté de la pièce — R&B romantique, 80 bpm";

const CURATED_EN_SAMPLE =
  "Funny song about a collaborator who uses the same hi-hat on everything";

describe("resolveGenerationCaptionContext", () => {
  it("prioritizes dice override over bank display match", () => {
    const ctx = resolveGenerationCaptionContext({
      diceAceOverride: "dark trap, icy pads, hard 808, 140 bpm",
      displayIdea: BANK_HUSTLE_DISPLAY,
      formGenre: "Dark Trap",
      mode: "song",
      uiLocale: "en",
    });
    expect(ctx.captionOverride).toContain("140 bpm");
    expect(ctx.captionOverride).toContain("clean studio vocal");
    expect(ctx.lyricsStructure).toBeUndefined();
    expect(ctx.melodyComposition).toBe(true);
  });

  it("prioritizes landing override over bank", () => {
    const ctx = resolveGenerationCaptionContext({
      landingAceOverride: "house, four-on-the-floor, 128 bpm",
      displayIdea: BANK_HUSTLE_DISPLAY,
      formGenre: "House",
      mode: "beat",
      uiLocale: "en",
    });
    expect(ctx.captionOverride).toContain("128 bpm");
    expect(ctx.captionOverride).toContain("instrumental");
    expect(ctx.melodyComposition).toBe(false);
  });

  it("resolves English prompt bank with baked singable lyrics", () => {
    const ctx = resolveGenerationCaptionContext({
      displayIdea: BANK_HUSTLE_DISPLAY,
      formGenre: "Trap",
      mode: "song",
      uiLocale: "en",
    });
    expect(ctx.melodyComposition).toBe(true);
    expect(ctx.captionOverride).toContain("clean studio vocal");
    expect(ctx.captionOverride).toContain("140 bpm");
    expect(ctx.lyricsStructure).toContain("[verse]");
    expect(ctx.lyricsStructure).toContain("[chorus]");
    expect(ctx.lyricsStructure).not.toMatch(/storytelling/i);
    expect(ctx.lyricsStructure?.toLowerCase()).toContain("working at 3am");
  });

  it("resolves French prompt bank entry with [fr] marker", () => {
    const ctx = resolveGenerationCaptionContext({
      displayIdea: BANK_FR_DISPLAY,
      formGenre: "R&B",
      mode: "song",
      uiLocale: "fr",
    });
    expect(ctx.melodyComposition).toBe(true);
    expect(ctx.lyricsStructure).toContain("[fr]");
    expect(ctx.lyricsStructure?.toLowerCase()).toContain("te voir");
  });

  it("pickPromptBankRoll matches findPromptBankByDisplay path", () => {
    const roll = pickPromptBankRoll("en", 250);
    const ctx = resolveGenerationCaptionContext({
      displayIdea: roll.display,
      formGenre: roll.genre,
      mode: "song",
      uiLocale: "en",
    });
    expect(ctx.captionOverride).toBeDefined();
    expect(ctx.lyricsStructure).toBeDefined();
    expect(ctx.melodyComposition).toBe(true);
  });

  it("converts ACE prose beat display to instrumental tag caption", () => {
    const prose = generateAceProsePrompt("beat", 9001, "en");
    expect(looksLikeAceProsePrompt(prose)).toBe(true);
    const ctx = resolveGenerationCaptionContext({
      displayIdea: prose,
      formGenre: "Trap",
      mode: "beat",
      uiLocale: "en",
    });
    expect(ctx.melodyComposition).toBe(false);
    expect(ctx.captionOverride).toContain(",");
    expect(ctx.captionOverride).not.toMatch(/\b(male|female) vocal\b/i);
  });

  it("converts ACE prose song display to tag caption with melody flag", () => {
    const prose = generateAceProsePrompt("song", 4242, "en");
    const ctx = resolveGenerationCaptionContext({
      displayIdea: prose,
      formGenre: "Melodic Trap",
      mode: "song",
      uiLocale: "en",
    });
    expect(ctx.melodyComposition).toBe(true);
    expect(ctx.captionOverride).toContain(",");
    expect(ctx.captionOverride?.toLowerCase()).toMatch(/vocal|mix/);
  });

  it("returns empty context when display idea is blank", () => {
    expect(
      resolveGenerationCaptionContext({
        displayIdea: "",
        formGenre: "Trap",
        mode: "song",
        uiLocale: "en",
      }),
    ).toEqual({ melodyComposition: false });
  });

  it("empty idea with catalog genre does not use bank lyrics", () => {
    const ctx = resolveGenerationCaptionContext({
      displayIdea: "",
      formGenre: "Melodic Trap",
      mode: "song",
      uiLocale: "en",
    });
    expect(ctx).toEqual({ melodyComposition: false });
    expect(ctx.lyricsStructure).toBeUndefined();
  });

  it("enriches short curated display with rich ACE tags", () => {
    const ctx = resolveGenerationCaptionContext({
      displayIdea: CURATED_EN_SAMPLE,
      formGenre: "Orchestral Drill",
      mode: "song",
      uiLocale: "en",
    });
    expect(ctx.captionOverride).toBeDefined();
    expect(ctx.captionOverride!.length).toBeGreaterThan(80);
    expect((ctx.captionOverride!.match(/,/g) ?? []).length).toBeGreaterThanOrEqual(4);
    expect(ctx.melodyComposition).toBe(true);
  });
});
