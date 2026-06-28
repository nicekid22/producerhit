import { describe, expect, it } from "vitest";
import { buildAceChatCompletionsParts, buildAceSampleModeUserMessage } from "./aceChatCompletions";

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
    expect(parts.join("\n")).toContain("written entirely in French");
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

  it("genre-only song (empty lyrics) adds AI compose rules, not skeleton expansion", () => {
    const parts = buildAceChatCompletionsParts({
      ...base,
      instrumental: false,
      baseCaption: "Y2K futuristic pop, glossy synths, catchy hook, clean studio vocal, 120 BPM",
      lyrics: "",
      vocalLanguage: "fr",
      vocalStyle: "Singer",
    });
    const joined = parts.join("\n");
    expect(joined).toContain("lead singer");
    expect(joined).toContain("Vocal language: fr");
    expect(joined).toContain("written entirely in French");
    expect(joined).toContain("Vocal delivery style: Singer");
    expect(joined).not.toContain("expand every section");
    expect(joined).not.toContain("vocal style Singer");
  });

  it("drill genre adds anti dance-pop guard", () => {
    const parts = buildAceChatCompletionsParts({
      ...base,
      instrumental: false,
      genre: "Drill",
      baseCaption: "conscious drill, sliding 808, dark strings, 142 bpm",
      lyrics: "[verse]\nBlock remembers names",
      vocalLanguage: "fr",
    });
    const joined = parts.join("\n");
    expect(joined).toMatch(/NOT dance-pop|sliding 808/);
    expect(joined).toContain("Target BPM: 142");
  });

  it("trapsoul genre adds anti pop-ballad guard", () => {
    const parts = buildAceChatCompletionsParts({
      ...base,
      instrumental: false,
      genre: "Trapsoul",
      baseCaption: "trapsoul, 808 bass, trap hi-hats, 95 bpm",
      lyrics: "[verse]\nFeel the night alive",
      vocalLanguage: "fr",
    });
    const joined = parts.join("\n");
    expect(joined).toMatch(/NOT acoustic pop ballad|trap soul/);
    expect(joined).toContain("Target BPM: 95");
  });

  it("sample_mode message appends catalog tags and French lyrics rule without duplicating idea", () => {
    const message = buildAceSampleModeUserMessage({
      sampleQuery: "Une chanson opium style sur des retrouvailles, Opium Style song, Singer vocal style",
      captionOverride: "opium style, dark synths, sliding 808, 140 bpm, clean studio vocal, vocal language fr",
      vocalLanguage: "fr",
    });
    expect(message).toContain("retrouvailles");
    expect(message).toContain("Production style tags");
    expect(message).toContain("opium style, dark synths");
    expect(message).toContain("written entirely in French");
  });
});
