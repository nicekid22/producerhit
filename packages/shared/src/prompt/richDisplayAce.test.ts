import { describe, expect, it } from "vitest";
import { buildRichAceCaption, dedupeGenreInCaption } from "./richDisplayAce";

describe("buildRichAceCaption", () => {
  it("returns prebuilt ACE when provided", () => {
    const prebuilt = "melodic trap, icy pads, hard 808, punchy drums, mix 2026";
    const ace = buildRichAceCaption({
      display: "Une chanson trap mélodique",
      locale: "fr",
      mode: "beat",
      formGenre: "Melodic Trap",
      preferPrebuiltAce: prebuilt,
    });
    expect(ace).toContain("808");
  });

  it("enriches short French curated shell", () => {
    const ace = buildRichAceCaption({
      display: "Un beat trap mélodique sur une nuit pluvieuse",
      locale: "fr",
      mode: "beat",
      formGenre: "Melodic Trap",
    });
    expect(ace.length).toBeGreaterThan(80);
    expect(ace).toMatch(/trap|melodic/i);
    expect(ace).toMatch(/rain|pluv|nocturnal/i);
  });

  it("enriches natural French vacation idea with catalog tags", () => {
    const ace = buildRichAceCaption({
      display: "une chanson hip hop sur des vacances au bord de la mer",
      locale: "fr",
      mode: "song",
      formGenre: "Auto",
    });
    expect(ace).toMatch(/hip|rap|trap/i);
    expect(ace).toMatch(/beach|vacation|seaside|summer/i);
    expect(ace.includes(",")).toBe(true);
  });

  it("parses v2 display production hints", () => {
    const ace = buildRichAceCaption({
      display:
        "Chanson synthwave 80s — pads Juno analogiques, gated reverb snare, autoroute néon la nuit",
      locale: "fr",
      mode: "song",
      formGenre: "Synthwave",
    });
    expect(ace.length).toBeGreaterThan(100);
    expect(ace).toMatch(/synthwave|retro|neon/i);
  });
});

describe("dedupeGenreInCaption", () => {
  it("keeps non-redundant tags when display repeats genre", () => {
    const raw =
      "melodic trap, emotional guitar, airy pads, rainy atmospheric mood, punchy drums";
    const out = dedupeGenreInCaption(raw, "Melodic Trap", "trap mélodique triste sous la pluie");
    expect(out).toMatch(/rain|rainy/i);
  });
});
