import { describe, expect, it } from "vitest";
import {
  buildCoverPromptSuggestionsFromLoop,
  buildStructuredCoverPrompt,
  canAccessDistributionAcademy,
  COVER_PROMPT_MAX_LENGTH,
  extractCoverVisualIdeaFromPrompt,
} from "./coverPrompt";

describe("extractCoverVisualIdeaFromPrompt", () => {
  it("extracts prompt bank idea before em dash", () => {
    expect(
      extractCoverVisualIdeaFromPrompt("Monte le son ouvre ton cœur — afrobeat, 110 bpm"),
    ).toBe("Monte le son ouvre ton cœur");
    expect(
      extractCoverVisualIdeaFromPrompt("Remember last summer nights — dance pop, 118 bpm"),
    ).toBe("Remember last summer nights");
  });

  it("extracts genre dice theme after sur/about", () => {
    expect(
      extractCoverVisualIdeaFromPrompt("Une chanson dark trap sur un cœur brisé nocturne"),
    ).toBe("un cœur brisé nocturne");
    expect(
      extractCoverVisualIdeaFromPrompt("A dark trap song about a broken heart in the suburbs"),
    ).toBe("a broken heart in the suburbs");
  });

  it("ignores ACE tag captions", () => {
    expect(
      extractCoverVisualIdeaFromPrompt(
        "dark trap, cinematic, dark piano, soft 808, slow hi-hats, distant pads, 82 bpm",
      ),
    ).toBe("");
  });
});

describe("buildCoverPromptSuggestionsFromLoop", () => {
  it("uses visual idea as cover subject", () => {
    const [first] = buildCoverPromptSuggestionsFromLoop({
      prompt: "Parti rien maintenant regardent tous — dark trap, 88 bpm",
      genre: "Dark Trap",
      mood: "",
      name: "Test",
    });
    expect(first?.subject).toBe("Parti rien maintenant regardent tous");
    expect(first?.subject).not.toContain("bpm");
    expect(first?.subject).not.toContain("dark trap");
  });
});

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
