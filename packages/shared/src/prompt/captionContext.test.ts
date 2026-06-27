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
  it("prioritizes dice override over bank display match (beat only)", () => {
    const ctx = resolveGenerationCaptionContext({
      diceAceOverride: "dark trap, icy pads, hard 808, 140 bpm",
      displayIdea: BANK_HUSTLE_DISPLAY,
      formGenre: "Dark Trap",
      mode: "beat",
      uiLocale: "en",
    });
    expect(ctx.captionOverride).toContain("140 bpm");
    expect(ctx.captionOverride).toContain("instrumental");
    expect(ctx.lyricsStructure).toBeUndefined();
    expect(ctx.melodyComposition).toBe(false);
  });

  it("song dice override does not block sample_mode (no captionOverride)", () => {
    const ctx = resolveGenerationCaptionContext({
      diceAceOverride: "neo soul, electric piano, 70 bpm, clean studio vocal",
      displayIdea: "A totally custom song about coffee on Tuesday — indie pop, 88 bpm",
      formGenre: "Indie Pop",
      mode: "song",
      uiLocale: "en",
    });
    expect(ctx.captionOverride).toBeUndefined();
    expect(ctx.lyricsStructure).toBeUndefined();
    expect(ctx.melodyComposition).toBe(false);
  });

  it("prompt bank dice with skipPromptBankPipeline uses sample_mode (no bank injection)", () => {
    const ctx = resolveGenerationCaptionContext({
      diceAceOverride: "melodic trap, raw, Rhodes piano, 70 bpm",
      displayIdea: "Learning to live in a world without you — neo soul, 70 bpm",
      formGenre: "Neo Soul",
      mode: "song",
      uiLocale: "en",
      skipPromptBankPipeline: true,
    });
    expect(ctx.captionOverride).toBeUndefined();
    expect(ctx.lyricsStructure).toBeUndefined();
    expect(ctx.bankGenre).toBeUndefined();
    expect(ctx.melodyComposition).toBe(false);
  });

  it("FR bank dice skip keeps Style genre (Trapsoul) without love lyrics", () => {
    const ctx = resolveGenerationCaptionContext({
      displayIdea: "Accro à ton énergie — trapsoul, 95 bpm",
      formGenre: "Trapsoul",
      mode: "song",
      uiLocale: "fr",
      skipPromptBankPipeline: true,
    });
    expect(ctx.captionOverride).toBeUndefined();
    expect(ctx.lyricsStructure).toBeUndefined();
    expect(ctx.bankGenre).toBeUndefined();
    expect(ctx.melodyComposition).toBe(false);
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
    expect(ctx.melodyComposition).toBe(false);
    expect(ctx.captionOverride).toContain("clean studio vocal");
    expect(ctx.captionOverride).toContain("140 bpm");
    expect(ctx.lyricsStructure).toContain("[verse]");
    expect(ctx.lyricsStructure).toContain("[chorus]");
    expect(ctx.lyricsStructure).not.toMatch(/storytelling/i);
    expect(ctx.lyricsStructure?.toLowerCase()).not.toContain("working at 3am");
    expect(ctx.bankGenre).toBe("Dark Trap");
  });

  it("resolves French prompt bank entry with [fr] marker", () => {
    const ctx = resolveGenerationCaptionContext({
      displayIdea: BANK_FR_DISPLAY,
      formGenre: "R&B",
      mode: "song",
      uiLocale: "fr",
    });
    expect(ctx.melodyComposition).toBe(false);
    expect(ctx.lyricsStructure).toContain("[fr]");
    expect(ctx.lyricsStructure?.toLowerCase()).not.toContain("te voir");
    expect(ctx.bankGenre).toBeDefined();
  });

  it("pickPromptBankRoll FR never returns EN entry", { timeout: 15000 }, () => {
    for (let i = 0; i < 80; i++) {
      const roll = pickPromptBankRoll("fr", i * 17 + 3);
      expect(roll.lang).toBe("fr");
    }
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
    expect(ctx.melodyComposition).toBe(false);
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

  it("ACE prose song display → sample_mode path (no tag captionOverride)", () => {
    const prose = generateAceProsePrompt("song", 4242, "en");
    const ctx = resolveGenerationCaptionContext({
      displayIdea: prose,
      formGenre: "Melodic Trap",
      mode: "song",
      uiLocale: "en",
    });
    expect(ctx.melodyComposition).toBe(false);
    expect(ctx.captionOverride).toBeUndefined();
  });

  it("returns empty context when display idea is blank and genre is Auto", () => {
    expect(
      resolveGenerationCaptionContext({
        displayIdea: "",
        formGenre: "Auto",
        mode: "song",
        uiLocale: "en",
      }),
    ).toEqual({ melodyComposition: false });
  });

  it("empty idea with catalog genre → no captionOverride (buildAceCaption at call site)", () => {
    const ctx = resolveGenerationCaptionContext({
      displayIdea: "",
      formGenre: "Melodic Trap",
      mode: "song",
      uiLocale: "en",
    });
    expect(ctx).toEqual({ melodyComposition: false });
    expect(ctx.captionOverride).toBeUndefined();
    expect(ctx.lyricsStructure).toBeUndefined();
  });

  it("user idea / dice display → sample_mode (no captionOverride)", () => {
    const ctx = resolveGenerationCaptionContext({
      displayIdea: CURATED_EN_SAMPLE,
      formGenre: "Orchestral Drill",
      mode: "song",
      uiLocale: "en",
    });
    expect(ctx.captionOverride).toBeUndefined();
    expect(ctx.melodyComposition).toBe(false);
  });

  it("beat user idea → rich captionOverride with instrumental tags (not sample_mode)", () => {
    const ctx = resolveGenerationCaptionContext({
      displayIdea: "Un beat chrome soul sur un cœur brisé nocturne",
      formGenre: "Dark R&B",
      mode: "beat",
      uiLocale: "fr",
    });
    expect(ctx.captionOverride).toBeDefined();
    expect(ctx.captionOverride!.toLowerCase()).toContain("instrumental");
    expect(ctx.captionOverride!.toLowerCase()).toMatch(/no vocals|no lyrics/);
    expect(ctx.lyricsStructure).toBeUndefined();
    expect(ctx.melodyComposition).toBe(false);
  });

  it("beat empty idea + catalog genre → no captionOverride (catalog tags at call site)", () => {
    const ctx = resolveGenerationCaptionContext({
      displayIdea: "",
      formGenre: "Melodic Trap",
      mode: "beat",
      uiLocale: "en",
    });
    expect(ctx).toEqual({ melodyComposition: false });
    expect(ctx.captionOverride).toBeUndefined();
  });

  it("good vibes bank entry resolves captionOverride and singable lyrics", () => {
    const display = "Remember last summer nights — dance pop, 118 bpm";
    const ctx = resolveGenerationCaptionContext({
      displayIdea: display,
      formGenre: "Dance Pop",
      mode: "song",
      uiLocale: "en",
    });
    expect(ctx.captionOverride).toBeDefined();
    expect(ctx.captionOverride!.toLowerCase()).toContain("euphoric");
    expect(ctx.lyricsStructure).toContain("[chorus]");
    expect(ctx.lyricsStructure?.toLowerCase()).not.toContain("remember last summer nights");
    expect(ctx.bankGenre).toBe("Dance Pop");
    expect(ctx.melodyComposition).toBe(false);
  });
});
