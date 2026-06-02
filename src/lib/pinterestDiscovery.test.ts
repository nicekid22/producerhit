import { describe, expect, it } from "vitest";
import { discoverPinterestCoverTerms } from "@/lib/pinterestDiscovery";

const base = {
  id: "loop-test-1",
  name: "Test",
  influence: "",
  seed: 42,
  prompt: "",
};

describe("discoverPinterestCoverTerms", () => {
  it("maps Trap to streetwear / hip hop aesthetics", () => {
    const r = discoverPinterestCoverTerms(
      { ...base, genre: "Melodic Trap", mood: "Dark" },
      { template: "retro-futur" },
    );
    expect(r.genreBucket).toBe("trap");
    const queries = r.terms.map((t) => t.query).join(" ");
    expect(queries).toMatch(/streetwear|hip hop|rapper/i);
    expect(r.picked.length).toBeGreaterThan(2);
  });

  it("maps Lo-fi to anime room / cozy desk", () => {
    const r = discoverPinterestCoverTerms(
      { ...base, id: "loop-lofi", genre: "Lo-Fi Chill", mood: "Chill" },
      { template: "default" },
    );
    expect(r.genreBucket).toBe("lofi");
    const queries = r.terms.map((t) => t.query).join(" ");
    expect(queries).toMatch(/anime room|desk|rainy/i);
  });

  it("maps Phonk to drift / tokyo night", () => {
    const r = discoverPinterestCoverTerms(
      { ...base, id: "loop-phonk", genre: "Drift Phonk", mood: "Aggressive" },
      { template: "retro-futur" },
    );
    expect(r.genreBucket).toBe("phonk");
    const top = r.terms.slice(0, 8).map((t) => t.query).join(" ");
    expect(top).toMatch(/drift|tokyo|cyberpunk/i);
  });

  it("applies retro-futur template terms", () => {
    const r = discoverPinterestCoverTerms(
      { ...base, id: "loop-rf", genre: "House", mood: "Energetic" },
      { template: "retro-futur" },
    );
    const queries = r.terms.map((t) => t.query).join(" ");
    expect(queries).toMatch(/retro futurism|y2k|frutiger|vhs/i);
  });

  it("returns ranked terms descending by score", () => {
    const r = discoverPinterestCoverTerms(
      { ...base, genre: "R&B", mood: "Romantic", prompt: "90s soul keys warm" },
      { template: "retro-futur" },
    );
    for (let i = 1; i < r.terms.length; i++) {
      expect(r.terms[i - 1]!.score).toBeGreaterThanOrEqual(r.terms[i]!.score);
    }
  });

  it("stable pick for same loop id and seed", () => {
    const loop = { ...base, genre: "Trap", mood: "Hard" };
    const a = discoverPinterestCoverTerms(loop);
    const b = discoverPinterestCoverTerms(loop);
    expect(a.picked).toBe(b.picked);
  });

});
