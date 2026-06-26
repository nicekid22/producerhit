import { describe, expect, it } from "vitest";
import { enrichBankAceCaption, isThinAceCaption } from "./enrichBankCaption";
import { resolveGenerationCaptionContext } from "../captionContext";
import { extractPromptBankSubject, themeAceTagsFromPromptBankDisplay } from "../themeFromDiceDisplay";

const KITCHEN_SOUL_DISPLAY =
  "Danser lentement dans la cuisine à 2h du matin — soul ballade, 65 bpm";

const KITCHEN_SOUL_THIN_CAPTION =
  "contemporary rnb, intimate, acoustic guitar, upright bass, brushed drums, velvet keys, 65 bpm, polished studio mix";

describe("enrichBankAceCaption", () => {
  it("detects thin bank captions without mood tags", () => {
    expect(isThinAceCaption("trap, 808, hi-hats, dark, 140 bpm")).toBe(true);
    expect(
      isThinAceCaption(
        "contemporary rnb, intimate, after-midnight hush, slow kitchen dance, acoustic guitar, upright bass, brushed drums, velvet keys, warm neo-soul pocket, 65 bpm",
      ),
    ).toBe(false);
  });

  it("enriches thin bank caption with mood and production layers", () => {
    const enriched = enrichBankAceCaption({
      display: KITCHEN_SOUL_DISPLAY,
      aceCaption: KITCHEN_SOUL_THIN_CAPTION,
      locale: "fr",
      mode: "song",
      genre: "Contemporary R&B",
    });
    expect(enriched).toContain("acoustic guitar");
    expect(enriched).not.toMatch(/danser lentement|cuisine à 2h/i);
    expect(enriched).toMatch(/kitchen|midnight|dance|intimate|hush|slow-dance/i);
    expect((enriched.match(/,/g) ?? []).length).toBeGreaterThanOrEqual(7);
    expect(enriched).toMatch(/vocal|mix/i);
  });

  it("resolveGenerationCaptionContext enriches prompt bank display match", () => {
    const ctx = resolveGenerationCaptionContext({
      displayIdea: KITCHEN_SOUL_DISPLAY,
      formGenre: "Contemporary R&B",
      mode: "song",
      uiLocale: "fr",
    });
    expect(ctx.melodyComposition).toBe(true);
    expect(ctx.lyricsStructure).toContain("Danser lentement");
    const caption = ctx.captionOverride ?? "";
    expect(caption).not.toMatch(/danser lentement/i);
    expect(caption).toMatch(/kitchen|midnight|intimate/i);
    expect((caption.match(/,/g) ?? []).length).toBeGreaterThanOrEqual(7);
  });
});

describe("prompt bank subject theme", () => {
  it("extracts subject before em dash", () => {
    expect(extractPromptBankSubject(KITCHEN_SOUL_DISPLAY)).toBe(
      "Danser lentement dans la cuisine à 2h du matin",
    );
  });

  it("maps bank subject to EN mood tags", () => {
    const tags = themeAceTagsFromPromptBankDisplay(KITCHEN_SOUL_DISPLAY, "fr");
    expect(tags).toMatch(/kitchen|midnight|dance|intimate/i);
  });
});
