import { describe, expect, it } from "vitest";
import { looksLikeAceProsePrompt, optimizeAceProsePrompt, pickUnifiedDiceRoll, generateAceProsePrompt } from "@producerhit/shared";
import {
  enhanceNaturalIdeaToAce,
  looksLikeAceTechnicalPrompt,
  looksLikeCuratedDisplayPrompt,
  looksLikeNaturalUserIdea,
  resolveCaptionOverrideForGeneration,
  resolveGenerationCaptionContext,
} from "@/lib/promptEnhancer";
import { pickRandomGenreMenuDiceRoll } from "@/lib/randomPromptIdeas";
import { pickRandomGenreMenuDice } from "@/lib/randomPromptIdeas/genreMenuPrompts";
import { pickRandomUnifiedDiceRoll } from "@/lib/randomPromptIdeas/unifiedDisplayPool";

describe("promptEnhancer", () => {
  it("detects ACE technical prompts", () => {
    const ace =
      "melodic trap, emotional minor piano, airy pads, crisp hats, punchy 808 glides, introspection drive, mix 2026";
    expect(looksLikeAceTechnicalPrompt(ace)).toBe(true);
    expect(looksLikeNaturalUserIdea(ace)).toBe(false);
  });

  it("detects natural French ideas", () => {
    expect(looksLikeNaturalUserIdea("une chanson hip hop sur des vacances au bord de la mer")).toBe(true);
  });

  it("curated song display uses sample_mode (no captionOverride at context)", () => {
    const curated = "Funny song about a collaborator who uses the same hi-hat on everything";
    expect(looksLikeCuratedDisplayPrompt(curated)).toBe(true);
    expect(looksLikeNaturalUserIdea(curated)).toBe(false);
    const ctx = resolveGenerationCaptionContext({
      displayIdea: curated,
      formGenre: "Orchestral Drill",
      mode: "song",
      uiLocale: "en",
    });
    expect(ctx.captionOverride).toBeUndefined();
    expect(ctx.melodyComposition).toBe(false);
  });

  it("v2 rich song display uses sample_mode not tag captionOverride", () => {
    const v2 =
      "80s synthwave song — analog Juno pads, gated reverb snare, neon highway at night. Stranger Things meets Miami Vice: emotional, cinematic, not cheesy.";
    expect(looksLikeAceTechnicalPrompt(v2)).toBe(false);
    expect(looksLikeCuratedDisplayPrompt(v2)).toBe(true);
    const ctx = resolveGenerationCaptionContext({
      displayIdea: v2,
      formGenre: "Synthwave",
      mode: "song",
      uiLocale: "en",
    });
    expect(ctx.melodyComposition).toBe(false);
    expect(ctx.captionOverride).toBeUndefined();
  });

  it("legacy IT song dice shell uses sample_mode", () => {
    const legacy = "Una canzone deep focus su una storia notturna";
    expect(looksLikeCuratedDisplayPrompt(legacy)).toBe(true);
    expect(looksLikeNaturalUserIdea(legacy)).toBe(false);
    const ctx = resolveGenerationCaptionContext({
      displayIdea: legacy,
      formGenre: "Deep Focus",
      mode: "song",
      uiLocale: "it",
    });
    expect(ctx.melodyComposition).toBe(false);
    expect(ctx.captionOverride).toBeUndefined();
  });

  it("genre dice song display uses sample_mode when ace override absent", () => {
    let roll = pickRandomGenreMenuDiceRoll("it", "song");
    for (let i = 0; i < 40 && !roll.acePrompt.trim(); i += 1) {
      roll = pickRandomGenreMenuDiceRoll("it", "song");
    }
    expect(roll.acePrompt.trim().length).toBeGreaterThan(0);
    const ctx = resolveGenerationCaptionContext({
      displayIdea: roll.displayPrompt,
      formGenre: roll.genre,
      mode: "song",
      uiLocale: "it",
      skipPromptBankPipeline: roll.promptBankId != null,
    });
    expect(ctx.melodyComposition).toBe(false);
    expect(ctx.captionOverride).toBeUndefined();
  });

  it("song dice ace override does not set captionOverride (sample_mode at edge)", () => {
    let dice = pickRandomGenreMenuDiceRoll("fr", "song");
    for (let i = 0; i < 40 && !dice.acePrompt.trim(); i += 1) {
      dice = pickRandomGenreMenuDiceRoll("fr", "song");
    }
    expect(dice.acePrompt.trim().length).toBeGreaterThan(0);
    const ctx = resolveGenerationCaptionContext({
      diceAceOverride: dice.acePrompt,
      displayIdea: dice.displayPrompt,
      formGenre: dice.genre,
      mode: "song",
      skipPromptBankPipeline: dice.promptBankId != null,
    });
    expect(ctx.captionOverride).toBeUndefined();
    expect(ctx.melodyComposition).toBe(false);
  });

  it("beat mode disables melody composition for dice ACE prose", () => {
    const prose = generateAceProsePrompt("beat", 9001, "en");
    expect(looksLikeAceProsePrompt(prose)).toBe(true);
    const roll = {
      displayPrompt: prose,
      acePrompt: optimizeAceProsePrompt(prose, { mode: "beat" }),
      genre: "Melodic Trap",
    };
    expect(roll.acePrompt).not.toMatch(/\b(male|female) vocal\b/i);
    const ctx = resolveGenerationCaptionContext({
      diceAceOverride: roll.acePrompt,
      displayIdea: roll.displayPrompt,
      formGenre: roll.genre,
      mode: "beat",
    });
    expect(ctx.melodyComposition).toBe(false);
    expect(ctx.captionOverride).not.toMatch(/\b(male|female) vocal\b/i);
  });

  it("shared mobile beat dice roll stays instrumental", () => {
    let roll = pickUnifiedDiceRoll("fr", "beat");
    for (let i = 0; i < 60 && !looksLikeAceProsePrompt(roll.displayPrompt); i += 1) {
      roll = pickUnifiedDiceRoll("fr", "beat");
    }
    const ctx = resolveGenerationCaptionContext({
      diceAceOverride: roll.acePrompt,
      displayIdea: roll.displayPrompt,
      formGenre: roll.genre,
      mode: "beat",
    });
    expect(ctx.melodyComposition).toBe(false);
  });

  it("enhances natural ideas to ACE tags", () => {
    const ace = enhanceNaturalIdeaToAce(
      "une chanson hip hop sur des vacances au bord de la mer",
      "Auto",
      "song",
      "fr",
    );
    expect(ace).toMatch(/hip|rap|trap/i);
    expect(ace).toMatch(/beach|vacation|seaside|summer/i);
    expect(ace.includes(",")).toBe(true);
    expect(ace).toMatch(/\bvocal\b/i);
    expect(ace).not.toMatch(/theme:|accrocheur|français/i);
  });

  it("resolves prompt bank through shared caption context with lyrics", () => {
    const display = "Working at 3am when everyone is asleep — dark trap, 140 bpm";
    const ctx = resolveGenerationCaptionContext({
      displayIdea: display,
      formGenre: "Trap",
      mode: "song",
      uiLocale: "en",
    });
    expect(ctx.melodyComposition).toBe(false);
    expect(ctx.lyricsStructure).toContain("[chorus]");
    expect(ctx.captionOverride).toContain("clean studio vocal");
  });

  it("prefers dice ace override for beats only (song uses sample_mode)", () => {
    let dice = pickRandomGenreMenuDiceRoll("fr", "beat");
    for (let i = 0; i < 40 && !dice.acePrompt.trim(); i += 1) {
      dice = pickRandomGenreMenuDiceRoll("fr", "beat");
    }
    expect(dice.acePrompt.trim().length).toBeGreaterThan(0);
    const caption = resolveCaptionOverrideForGeneration({
      diceAceOverride: dice.acePrompt,
      displayIdea: dice.displayPrompt,
      formGenre: dice.genre,
      mode: "beat",
    });
    expect(caption).toBeDefined();
    expect(caption!.length).toBeGreaterThan(10);
  });
});

describe("genre dice display split", () => {
  it("returns readable display + technical ace", () => {
    const item = pickRandomGenreMenuDice("song", "fr");
    expect(item.displayPrompt.length).toBeLessThan(item.acePrompt.length);
    expect(item.displayPrompt).toMatch(/^Une chanson /i);
    expect(item.acePrompt.includes(",")).toBe(true);
    expect(/^(fais|une chanson sur les tags)/i.test(item.displayPrompt)).toBe(false);
  });

  it("unified dice roll keeps French in display only, not ace caption", () => {
    let roll = pickRandomUnifiedDiceRoll("fr", "song");
    for (let i = 0; i < 40 && !roll.acePrompt.trim(); i += 1) {
      roll = pickRandomUnifiedDiceRoll("fr", "song");
    }
    expect(roll.acePrompt.trim().length).toBeGreaterThan(40);
    expect(roll.acePrompt).not.toMatch(/\bune chanson\b/i);
    expect(roll.displayPrompt.trim().length).toBeGreaterThan(10);
  });
});
