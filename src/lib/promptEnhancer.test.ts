import { describe, expect, it } from "vitest";
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

  it("skips enhancement for curated display prompts", () => {
    const curated = "Funny song about a collaborator who uses the same hi-hat on everything";
    expect(looksLikeCuratedDisplayPrompt(curated)).toBe(true);
    expect(looksLikeNaturalUserIdea(curated)).toBe(false);
    const ctx = resolveGenerationCaptionContext({
      displayIdea: curated,
      formGenre: "Orchestral Drill",
      mode: "song",
    });
    expect(ctx.captionOverride).toBeUndefined();
    expect(ctx.melodyComposition).toBe(false);
  });

  it("dice override enables melody composition", () => {
    const dice = pickRandomGenreMenuDiceRoll("fr", "song");
    const ctx = resolveGenerationCaptionContext({
      diceAceOverride: dice.acePrompt,
      displayIdea: dice.displayPrompt,
      formGenre: dice.genre,
      mode: "song",
    });
    expect(ctx.captionOverride).toBe(dice.acePrompt);
    expect(ctx.melodyComposition).toBe(true);
  });

  it("enhances natural ideas to ACE tags", () => {
    const ace = enhanceNaturalIdeaToAce(
      "une chanson hip hop sur des vacances au bord de la mer",
      "Auto",
      "song",
    );
    expect(ace).toMatch(/hip|rap|trap/i);
    expect(ace).toMatch(/beach|vacation|seaside|summer/i);
    expect(ace.includes(",")).toBe(true);
  });

  it("prefers dice ace override over natural enhancement", () => {
    const dice = pickRandomGenreMenuDiceRoll("fr", "song");
    const caption = resolveCaptionOverrideForGeneration({
      diceAceOverride: dice.acePrompt,
      displayIdea: dice.displayPrompt,
      formGenre: dice.genre,
      mode: "song",
    });
    expect(caption).toBe(dice.acePrompt);
    expect(caption).not.toBe(dice.displayPrompt);
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
});
