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

  it("FR song dice rolls diversify genres across catalog", () => {
    const genres = new Set<string>();
    for (let i = 0; i < 120; i += 1) {
      const roll = pickVariedDiceRoll("fr", "song", buildDiceAceCaptionFromDisplay);
      genres.add(roll.genre);
    }
    expect(genres.size).toBeGreaterThan(25);
  });
});
