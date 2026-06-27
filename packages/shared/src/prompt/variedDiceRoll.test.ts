import { describe, expect, it } from "vitest";
import { GENRE_CATALOG_COUNT } from "../genres/genreMenu";
import { getGenreDiceAllDisplayPrompts } from "./genreDicePool";
import { pickVariedDiceRoll, buildUnifiedDisplayPool } from "./variedDiceRoll";
import { buildDiceAceCaptionFromDisplay } from "./inspirationAndDice";

describe("variedDiceRoll", () => {
  it("genre dice pool covers the full catalog", () => {
    const displays = getGenreDiceAllDisplayPrompts("song", "fr");
    expect(displays.length).toBeGreaterThan(GENRE_CATALOG_COUNT);
  });

  it("unified display pool interleaves genres for song FR (not bank-only)", () => {
    const pool = buildUnifiedDisplayPool("fr", "song");
    const genrePhrase = pool.find((p) => /^Une chanson /i.test(p));
    const bankPhrase = pool.find((p) => /bpm/i.test(p));
    expect(pool.length).toBeGreaterThan(100);
    expect(genrePhrase).toBeTruthy();
    expect(bankPhrase).toBeTruthy();
  });

  it("FR song dice rolls diversify genres across catalog", { timeout: 15000 }, () => {
    const genres = new Set<string>();
    for (let i = 0; i < 120; i += 1) {
      const roll = pickVariedDiceRoll("fr", "song", buildDiceAceCaptionFromDisplay);
      genres.add(roll.genre);
    }
    expect(genres.size).toBeGreaterThan(25);
  });

  it("song FR bank dice rolls include good vibes bank entries", () => {
    let bankHits = 0;
    for (let i = 0; i < 80; i += 1) {
      const roll = pickVariedDiceRoll("fr", "song", buildDiceAceCaptionFromDisplay);
      if (roll.promptBankId != null && roll.promptBankId >= 2001) bankHits += 1;
    }
    expect(bankHits).toBeGreaterThan(15);
  });

  it("prompt bank dice roll uses rich ACE caption not baked aceCaption", () => {
    let bankRoll: ReturnType<typeof pickVariedDiceRoll> | null = null;
    for (let i = 0; i < 120; i += 1) {
      const roll = pickVariedDiceRoll("fr", "song", buildDiceAceCaptionFromDisplay);
      if (roll.promptBankId != null) {
        bankRoll = roll;
        break;
      }
    }
    expect(bankRoll).not.toBeNull();
    expect(bankRoll!.lyricsStructure).toBeUndefined();
    expect(bankRoll!.acePrompt.trim().length).toBeGreaterThan(20);
    expect(bankRoll!.acePrompt).toContain(",");
  });
});
