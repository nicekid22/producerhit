import { describe, expect, it } from "vitest";
import { buildAceRequestBody } from "./aceRequest";
import { buildAceCaption } from "./promptAce";
import { normalizeAceGenerationPayload } from "../prompt/acePromptContract";
import { resolveGenerationCaptionContext } from "../prompt/captionContext";
import type { GenerateParams } from "./types";

const BASE_PARAMS: GenerateParams = {
  genre: "Melodic Trap",
  influence: "None",
  key: "C",
  scale: "Minor",
  bpm: 140,
  loopLengthBars: 8,
  swing: 0,
  mood: "Dark",
  energyLevel: "Medium",
  reverb: "Low",
  prompt: "emotional piano, late night drive",
};

const BANK_DISPLAY =
  "Working at 3am when everyone is asleep — dark trap, 140 bpm";

describe("buildAceRequestBody", () => {
  it("catalog song applies vocal stability tags when lyrics are provided", () => {
    const body = buildAceRequestBody(BASE_PARAMS, {
      isSong: true,
      instrumental: false,
      vocalLanguage: "en",
      lyrics: "[verse]\nLate night on my mind\nCity lights shine",
      sampleMode: false,
    });
    expect(String(body.caption)).toContain("clean studio vocal");
    expect(String(body.caption)).toContain("controlled delivery");
    expect(body.instrumental).toBe(false);
    expect(body.sampleMode).toBe(false);
  });

  it("catalog beat sets instrumental flag and lyrics marker", () => {
    const body = buildAceRequestBody(BASE_PARAMS, {
      instrumental: true,
      vocalLanguage: "en",
      sampleMode: false,
    });
    expect(body.lyrics).toBe("[Instrumental]");
    expect(body.instrumental).toBe(true);
    expect(String(body.caption).length).toBeGreaterThan(20);
  });

  it("melody composition mode uses melody contract path", () => {
    const body = buildAceRequestBody(BASE_PARAMS, {
      isSong: true,
      instrumental: false,
      melodyComposition: true,
      captionOverride: "trap, dark piano, 140 bpm",
      vocalLanguage: "en",
    });
    expect(body.sampleMode).toBe(false);
    expect(String(body.caption)).toContain("trap");
  });

  it("idée vide + genre catalogue envoie le prompt genre (pas sample_mode)", () => {
    const body = buildAceRequestBody(
      {
        ...BASE_PARAMS,
        genre: "Luxury Hotel R&B",
        prompt: "Luxury Hotel R&B",
        bpm: 0,
        key: "",
        scale: "",
        mood: "",
        energyLevel: "",
      },
      {
        isSong: true,
        instrumental: false,
        vocalLanguage: "fr",
        autoMeta: true,
      },
    );
    expect(body.sampleMode).toBe(false);
    expect(body.useFormat).toBe(true);
    expect(String(body.caption).length).toBeGreaterThan(30);
    expect(String(body.caption).toLowerCase()).toMatch(/luxury|r&b|rhodes|vocal/);
  });

  it("flows bank caption and lyrics from caption context", () => {
    const ctx = resolveGenerationCaptionContext({
      displayIdea: BANK_DISPLAY,
      formGenre: "Trap",
      mode: "song",
      uiLocale: "en",
    });
    expect(ctx.captionOverride).toBeDefined();
    expect(ctx.lyricsStructure).toBeDefined();

    const body = buildAceRequestBody(
      { ...BASE_PARAMS, genre: "Trap", bpm: 140 },
      {
        isSong: true,
        instrumental: false,
        captionOverride: ctx.captionOverride,
        melodyComposition: ctx.melodyComposition,
        lyrics: ctx.lyricsStructure,
        vocalLanguage: "en",
      },
    );

    expect(body.sampleMode).toBe(false);
    expect(String(body.lyrics)).toContain("[chorus]");
    expect(String(body.lyrics)).not.toMatch(/storytelling/i);
    expect(String(body.caption)).toContain("clean studio vocal");
  });

  it("aligns buildAceCaption output through normalizeAceGenerationPayload", () => {
    const raw = buildAceCaption(BASE_PARAMS, {
      isSong: true,
      instrumental: false,
      autoMeta: false,
      vocalLanguage: "en",
    });
    const normalized = normalizeAceGenerationPayload({
      mode: "song",
      caption: raw,
      lyrics: "",
      instrumental: false,
      bpm: 140,
      key: "C",
      scale: "Minor",
      vocalLanguage: "en",
      source: "catalog",
    });
    expect(normalized.caption).toContain("clean studio vocal");
    expect(normalized.caption.split(",").length).toBeLessThanOrEqual(14);
    expect(normalized.caption.toLowerCase()).toMatch(/140 bpm|melodic/);
  });
});
