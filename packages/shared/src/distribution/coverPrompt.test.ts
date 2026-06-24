import { describe, expect, it } from "vitest";
import {
  buildStructuredCoverPrompt,
  canAccessDistributionAcademy,
  COVER_PROMPT_MAX_LENGTH,
} from "./coverPrompt";

describe("buildStructuredCoverPrompt", () => {
  it("assembles subject mood palette lighting style", () => {
    const prompt = buildStructuredCoverPrompt({
      subject: "solo guitarist silhouette",
      mood: "lonely",
      palette: "deep orange and blue",
      lighting: "cinematic lighting",
      style: "minimal album artwork",
    });
    expect(prompt).toContain("solo guitarist silhouette");
    expect(prompt).toContain("album cover");
    expect(prompt.length).toBeLessThanOrEqual(COVER_PROMPT_MAX_LENGTH);
  });
});

describe("canAccessDistributionAcademy", () => {
  it("allows studio and plus only", () => {
    expect(canAccessDistributionAcademy("studio")).toBe(true);
    expect(canAccessDistributionAcademy("plus")).toBe(true);
    expect(canAccessDistributionAcademy("pro")).toBe(false);
    expect(canAccessDistributionAcademy("free")).toBe(false);
  });
});
