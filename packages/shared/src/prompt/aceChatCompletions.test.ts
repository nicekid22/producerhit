import { describe, expect, it } from "vitest";
import { buildAceChatCompletionsParts } from "./aceChatCompletions";

describe("buildAceChatCompletionsParts", () => {
  const base = {
    seedKey: "test",
    baseCaption: "melodic trap, dark piano, 140 bpm, instrumental, no vocals, no lyrics",
    prompt: "",
    lyrics: "",
    genre: "Melodic Trap",
    mood: "Dark",
    energyLevel: "Medium",
    autoMeta: true,
    bpm: null,
    key: "",
    scale: "",
    timeSignature: "",
  };

  it("beat path uses caption + beat rules without duplicate prose opener", () => {
    const parts = buildAceChatCompletionsParts({ ...base, instrumental: true });
    expect(parts[0]).toContain("melodic trap");
    expect(parts.join("\n")).toContain("Instrumental beat only");
    expect(parts.join("\n")).not.toContain("Create a modern 2026");
  });

  it("song path adds syllable rules and vocal language", () => {
    const parts = buildAceChatCompletionsParts({
      ...base,
      instrumental: false,
      baseCaption: "pop, bright synths, clean studio vocal, 120 bpm",
      lyrics: "[Chorus]\nWe rise up high",
      vocalLanguage: "fr",
    });
    expect(parts.join("\n")).toContain("4-8 syllables");
    expect(parts.join("\n")).toContain("Vocal language: fr");
    expect(parts.join("\n")).toContain("Lyrics:\n[Chorus]");
  });

  it("expands bank placeholder lyrics for LM", () => {
    const structure = `[Verse 1]
(storytelling — you fell asleep on my shoulder)

[Chorus]
(peak moment, memorable hook)`;
    const parts = buildAceChatCompletionsParts({
      ...base,
      instrumental: false,
      baseCaption: "neo soul, warm guitar, 76 bpm",
      lyrics: structure,
      vocalLanguage: "en",
    });
    expect(parts.join("\n")).toContain("expand every section");
    expect(parts.join("\n")).toContain(structure);
  });
});
