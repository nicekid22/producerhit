import { describe, expect, it } from "vitest";
import {
  bankCaptionAlignsWithDisplay,
  buildDisplayGenreCaptionSeed,
  englishAceCaptionFromBank,
  extractGenreFromBankDisplay,
  guessGenreFromPromptBank,
} from "./genreFromCaption";

describe("genreFromCaption", () => {
  const CLUB_TRAP_DISPLAY = "Gagner se sent tellement mieux à voix haute — club trap, 130 bpm";
  const CLUB_TRAP_BAKED =
    "afroswing, victorious, steel pan, brass horns, dancehall kick, reggae bass, 130 bpm, polished studio mix";

  it("extracts genre tail from bank display", () => {
    expect(extractGenreFromBankDisplay(CLUB_TRAP_DISPLAY)).toBe("club trap");
  });

  it("detects mismatched baked caption", () => {
    expect(bankCaptionAlignsWithDisplay(CLUB_TRAP_DISPLAY, CLUB_TRAP_BAKED)).toBe(false);
  });

  it("builds trap seed from display genre", () => {
    const seed = buildDisplayGenreCaptionSeed(CLUB_TRAP_DISPLAY);
    expect(seed.toLowerCase()).toContain("club trap");
    expect(seed).toContain("130 bpm");
    expect(seed.toLowerCase()).toContain("808");
  });

  it("guessGenreFromPromptBank prefers display genre over baked caption", () => {
    expect(guessGenreFromPromptBank(CLUB_TRAP_DISPLAY, CLUB_TRAP_BAKED)).toBe("Dark Trap");
  });

  it("pop rnb baked caption does not align with trapsoul display", () => {
    const display = "Accro à ton énergie — trapsoul, 95 bpm";
    const baked =
      "pop rnb, tender, acoustic guitar, upright bass, brushed drums, velvet keys, 95 bpm, polished studio mix";
    expect(bankCaptionAlignsWithDisplay(display, baked)).toBe(false);
  });

  it("trapsoul display seed uses trap production not ballad", () => {
    const seed = buildDisplayGenreCaptionSeed("Accro à ton énergie — trapsoul, 95 bpm");
    expect(seed.toLowerCase()).toContain("trapsoul");
    expect(seed).toContain("95 bpm");
    expect(seed.toLowerCase()).toMatch(/808|trap hi-hats|trap soul/);
    expect(seed.toLowerCase()).not.toMatch(/acoustic guitar|upright bass|brushed drums/);
  });

  it("translates FR drill caption tags to English for ACE", () => {
    const display = "Ils glorifient la vie et ignorent le coût — drill conscient, 142 bpm";
    const frCaption =
      "drill conscient, introspective, cordes sombres, 808 glissant, synthés froids, trap tranchant, 142 bpm";
    const en = englishAceCaptionFromBank(display, frCaption, "Drill");
    expect(en.toLowerCase()).toContain("conscious drill");
    expect(en.toLowerCase()).toContain("dark strings");
    expect(en.toLowerCase()).toContain("sliding 808");
    expect(en).toContain("142 bpm");
    expect(en).not.toMatch(/cordes sombres|808 glissant/);
  });
});
