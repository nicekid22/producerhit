import { describe, expect, it } from "vitest";
import { buildAudioRetentionModalCopy } from "@/i18n/audioRetentionModalCatalog";

describe("buildAudioRetentionModalCopy", () => {
  it("formats expired count in French title", () => {
    const copy = buildAudioRetentionModalCopy("fr", 3, "pro");
    expect(copy.title).toContain("3");
    expect(copy.title).toMatch(/hors ligne/i);
    expect(copy.eyebrow).toMatch(/plan Plus/i);
    expect(copy.lead).toMatch(/Plus/i);
    expect(copy.bullets).toHaveLength(4);
    expect(copy.ctaPlus).toMatch(/catalogue/i);
  });

  it("uses free retention days in lead for free plan", () => {
    const copy = buildAudioRetentionModalCopy("en", 1, "free");
    expect(copy.lead).toMatch(/1 day/i);
    expect(copy.bullets[0]).toMatch(/expire/i);
  });
});
