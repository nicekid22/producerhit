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
    expect(ctx.melodyComposition).toBe(false);
    expect(ctx.lyricsStructure).toContain("[fr]");
    expect(ctx.lyricsStructure?.toLowerCase()).not.toMatch(/danser lentement/i);
    const caption = ctx.captionOverride ?? "";
    expect(caption).not.toMatch(/danser lentement/i);
    expect(caption).toMatch(/kitchen|midnight|intimate/i);
    expect((caption.match(/,/g) ?? []).length).toBeGreaterThanOrEqual(7);
  });

  it("rebuilds caption when baked JSON genre mismatches display (club trap vs afroswing)", () => {
    const display = "Gagner se sent tellement mieux à voix haute — club trap, 130 bpm";
    const mismatchedBaked =
      "afroswing, victorious, steel pan, brass horns, dancehall kick, reggae bass, 130 bpm, polished studio mix";
    const enriched = enrichBankAceCaption({
      display,
      aceCaption: mismatchedBaked,
      locale: "fr",
      mode: "song",
      genre: "Dark Trap",
    });
    expect(enriched.toLowerCase()).toContain("club trap");
    expect(enriched.toLowerCase()).toContain("130 bpm");
    expect(enriched.toLowerCase()).not.toContain("afroswing");
    expect(enriched.toLowerCase()).not.toContain("dancehall");
    expect(enriched.toLowerCase()).not.toMatch(/four-on-the-floor|dance pop/i);
  });

  it("resolveGenerationCaptionContext uses trap caption for FR club trap bank entry", () => {
    const ctx = resolveGenerationCaptionContext({
      displayIdea: "Gagner se sent tellement mieux à voix haute — club trap, 130 bpm",
      formGenre: "Dark Trap",
      mode: "song",
      uiLocale: "fr",
    });
    expect(ctx.bankGenre).toBe("Dark Trap");
    const caption = (ctx.captionOverride ?? "").toLowerCase();
    expect(caption).toContain("club trap");
    expect(caption).toContain("130 bpm");
    expect(caption).not.toContain("afroswing");
    expect(caption).not.toMatch(/dance pop|four-on-the-floor/);
  });

  it("drill conscient FR — English caption tags and no dance-pop drift", () => {
    const display = "Ils glorifient la vie et ignorent le coût — drill conscient, 142 bpm";
    const baked =
      "drill conscient, introspective, cordes sombres, 808 glissant, synthés froids, trap tranchant, 142 bpm, polished studio mix";
    const enriched = enrichBankAceCaption({
      display,
      aceCaption: baked,
      locale: "fr",
      mode: "song",
      genre: "Melodic Drill",
    });
    const lower = enriched.toLowerCase();
    expect(lower).toContain("142 bpm");
    expect(lower).toMatch(/drill|808|sliding|dark strings|cold synths/);
    expect(lower).not.toMatch(/dance pop|four-on-the-floor|french pop/);
    expect(enriched).not.toMatch(/cordes sombres|808 glissant/);
  });

  it("resolveGenerationCaptionContext drill street lyrics are not romantic", () => {
    const ctx = resolveGenerationCaptionContext({
      displayIdea: "Ils glorifient la vie et ignorent le coût — drill conscient, 142 bpm",
      formGenre: "Drill",
      mode: "song",
      uiLocale: "fr",
    });
    expect(ctx.bankGenre).toMatch(/drill/i);
    const lyrics = (ctx.lyricsStructure ?? "").toLowerCase();
    expect(lyrics).not.toMatch(/tes yeux|dans tes bras|cœur s'emballe/);
    const caption = (ctx.captionOverride ?? "").toLowerCase();
    expect(caption).toContain("142 bpm");
    expect(caption).toMatch(/drill|808/);
    expect(caption).not.toMatch(/dance pop|four-on-the-floor/);
  });

  it("trapsoul FR Accro — rejects pop rnb baked caption, keeps 95 bpm", () => {
    const display = "Accro à ton énergie — trapsoul, 95 bpm";
    const baked =
      "pop rnb, tender, acoustic guitar, upright bass, brushed drums, velvet keys, 95 bpm, polished studio mix";
    const enriched = enrichBankAceCaption({
      display,
      aceCaption: baked,
      locale: "fr",
      mode: "song",
      genre: "Trapsoul",
    });
    const lower = enriched.toLowerCase();
    expect(lower).toContain("95 bpm");
    expect(lower).toMatch(/trapsoul|808|trap hi-hats|trap soul/);
    expect(lower).not.toMatch(/pop rnb|acoustic guitar|upright bass|brushed drums|music-box/);
  });

  it("resolveGenerationCaptionContext trapsoul uses energy lyrics not romantic hook", () => {
    const ctx = resolveGenerationCaptionContext({
      displayIdea: "Accro à ton énergie — trapsoul, 95 bpm",
      formGenre: "Trapsoul",
      mode: "song",
      uiLocale: "fr",
    });
    expect(ctx.bankGenre).toBe("Trapsoul");
    const lyrics = (ctx.lyricsStructure ?? "").toLowerCase();
    expect(lyrics).not.toMatch(/accro à ton énergie|tes yeux|dans tes bras|cœur s'emballe/);
    expect(lyrics).toMatch(/soleil|vibe|pot|énergie|crew|dorée/);
    const caption = (ctx.captionOverride ?? "").toLowerCase();
    expect(caption).toContain("95 bpm");
    expect(caption).not.toContain("pop rnb");
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
