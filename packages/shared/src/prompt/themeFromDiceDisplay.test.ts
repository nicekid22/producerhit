import { describe, expect, it } from "vitest";
import {
  extractDiceThemePhrase,
  isNonEnglishCaptionTag,
  stripNonEnglishCaptionTags,
  themeAceTagsFromDiceDisplay,
} from "./themeFromDiceDisplay";
import { buildRichAceCaption } from "./richDisplayAce";
import { resolveGenerationCaptionContext } from "./captionContext";

const NEO_SOUL_DICE =
  "Une chanson neo soul future sur un matin lent sans urgence";

describe("themeFromDiceDisplay", () => {
  it("extracts theme phrase after sur", () => {
    expect(extractDiceThemePhrase(NEO_SOUL_DICE)).toBe("un matin lent sans urgence");
  });

  it("maps dice theme to EN mood tags", () => {
    const tags = themeAceTagsFromDiceDisplay(NEO_SOUL_DICE, "fr");
    expect(tags).toMatch(/slow morning|unhurried/i);
    expect(tags).not.toMatch(/matin lent|une chanson/i);
  });

  it("flags French prose as non-English caption tag", () => {
    expect(
      isNonEnglishCaptionTag("Une chanson neo soul future sur un dimanche sans alarme"),
    ).toBe(true);
    expect(isNonEnglishCaptionTag("slow sunday morning, unhurried mood")).toBe(false);
  });

  it("strips French sentences from caption", () => {
    const dirty =
      "neo soul future, FM bells, Une chanson neo soul future sur un dimanche sans alarme, clean studio vocal";
    const clean = stripNonEnglishCaptionTags(dirty);
    expect(clean).not.toMatch(/une chanson|dimanche/i);
    expect(clean).toContain("neo soul future");
  });
});

describe("ACE dice caption quality", () => {
  it("buildRichAceCaption never embeds raw French display", () => {
    const ace = buildRichAceCaption({
      display: "Une chanson flint rap sur retrouver ton groupe de potes après des années",
      locale: "fr",
      mode: "song",
      formGenre: "Flint Rap",
    });
    expect(ace).not.toMatch(/une chanson|retrouver ton groupe|après des années/i);
    expect(ace).toMatch(/reunion|nostalgic|friends|flint|rap/i);
    expect((ace.match(/,/g) ?? []).length).toBeGreaterThanOrEqual(4);
  });

  it("resolveGenerationCaptionContext for neo soul dice + catalog genre → tag caption", () => {
    const ctx = resolveGenerationCaptionContext({
      displayIdea: NEO_SOUL_DICE,
      formGenre: "Neo Soul Future",
      mode: "song",
      uiLocale: "fr",
    });
    expect(ctx.captionOverride).toBeDefined();
    expect(ctx.captionOverride!.toLowerCase()).toMatch(/neo soul/);
    expect(ctx.lyricsStructure).toBeUndefined();
  });
});
