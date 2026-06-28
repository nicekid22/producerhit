import { describe, expect, it } from "vitest";
import { buildAceRequestBody } from "./aceRequest";
import { buildAceCaption } from "./promptAce";
import { normalizeAceGenerationPayload } from "../prompt/acePromptContract";
import { resolveGenerationCaptionContext } from "../prompt/captionContext";
import { defaultVocalLanguagePreference, resolveSongVocalLanguage } from "../vocalLanguage";
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
    expect(body.sampleMode).toBe(false);
    expect(body.useFormat).toBe(true);
    expect(String(body.caption).toLowerCase()).toContain("instrumental");
    expect(String(body.caption).length).toBeGreaterThan(20);
  });

  it("beat with user idea captionOverride stays on tag+LM path (no sample_mode)", () => {
    const ctx = resolveGenerationCaptionContext({
      displayIdea: "Un beat lo-fi melodic trap sur un passage de train la nuit",
      formGenre: "Lo-Fi Hip-Hop",
      mode: "beat",
      uiLocale: "fr",
    });
    expect(ctx.captionOverride).toBeDefined();

    const body = buildAceRequestBody(
      {
        ...BASE_PARAMS,
        genre: "Lo-Fi Hip-Hop",
        prompt: "Un beat lo-fi melodic trap sur un passage de train la nuit",
        bpm: 0,
        key: "",
        scale: "",
        mood: "Chill",
        energyLevel: "Low",
      },
      {
        isSong: false,
        instrumental: true,
        captionOverride: ctx.captionOverride,
        melodyComposition: ctx.melodyComposition,
        autoMeta: true,
      },
    );
    expect(body.sampleMode).toBe(false);
    expect(body.useFormat).toBe(true);
    expect(body.instrumental).toBe(true);
    expect(body.isSong).toBe(false);
    expect(String(body.caption)).toContain(ctx.captionOverride!);
    expect(body.lyrics).toBe("[Instrumental]");
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
    expect(body.captionOverride).toBe("trap, dark piano, 140 bpm");
  });

  it("idée utilisateur + paroles vides sans captionOverride → sample_mode ACE", () => {
    const body = buildAceRequestBody(
      {
        ...BASE_PARAMS,
        genre: "Neo Soul",
        prompt: "Learning to live in a world without you — neo soul, 70 bpm",
        bpm: 0,
        key: "",
        scale: "",
        mood: "",
        energyLevel: "",
      },
      {
        isSong: true,
        instrumental: false,
        vocalLanguage: "en",
        autoMeta: true,
        lyrics: "",
        vocalStyle: "Singer",
      },
    );
    expect(body.sampleMode).toBe(true);
    expect(body.useFormat).toBe(false);
    expect(body.caption).toBe("");
    expect(String(body.sampleQuery).toLowerCase()).toContain("learning to live");
  });

  it("catalog song + captionOverride from context → sample_mode with style tags (not tag-only LM path)", () => {
    const ctx = resolveGenerationCaptionContext({
      displayIdea: "Une chanson opium style sur des retrouvailles qui font du bien",
      formGenre: "Opium Style",
      mode: "song",
      uiLocale: "fr",
    });
    expect(ctx.captionOverride).toBeDefined();

    const vocalPref = defaultVocalLanguagePreference("fr");
    expect(
      resolveSongVocalLanguage({
        mode: vocalPref.mode,
        manualCode: vocalPref.manualCode,
        lyricsMode: "ai",
        lyrics: "",
        songDescription: "Une chanson opium style sur des retrouvailles qui font du bien",
        uiLocale: "fr",
      }),
    ).toBe("fr");

    const body = buildAceRequestBody(
      {
        ...BASE_PARAMS,
        genre: "Opium Style",
        prompt: "Une chanson opium style sur des retrouvailles qui font du bien",
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
        lyrics: "",
        captionOverride: ctx.captionOverride,
        melodyComposition: ctx.melodyComposition,
      },
    );
    expect(body.sampleMode).toBe(true);
    expect(body.useFormat).toBe(false);
    expect(body.caption).toBe("");
    expect(body.captionOverride).toBeDefined();
    expect(String(body.sampleQuery).toLowerCase()).toContain("retrouvailles");
  });

  it("idée vide + genre catalogue → sample_mode ACE (description naturelle, pas tags LM)", () => {
    const ctx = resolveGenerationCaptionContext({
      displayIdea: "",
      formGenre: "Luxury Hotel R&B",
      mode: "song",
      uiLocale: "en",
    });
    expect(ctx).toEqual({ melodyComposition: false });

    const body = buildAceRequestBody(
      {
        ...BASE_PARAMS,
        genre: "Luxury Hotel R&B",
        prompt: "",
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
        lyrics: "",
      },
    );
    expect(body.sampleMode).toBe(true);
    expect(body.useFormat).toBe(false);
    expect(body.caption).toBe("");
    expect(String(body.sampleQuery).toLowerCase()).toContain("luxury hotel r&b");
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

  it("autoMeta + bank captionOverride still sends BPM from caption tags", () => {
    const ctx = resolveGenerationCaptionContext({
      displayIdea: "Accro à ton énergie — trapsoul, 95 bpm",
      formGenre: "Trapsoul",
      mode: "song",
      uiLocale: "fr",
    });
    const body = buildAceRequestBody(
      { ...BASE_PARAMS, genre: "Trapsoul", bpm: 0, prompt: "Accro à ton énergie — trapsoul, 95 bpm" },
      {
        isSong: true,
        instrumental: false,
        autoMeta: true,
        captionOverride: ctx.captionOverride,
        lyrics: ctx.lyricsStructure,
        vocalLanguage: "fr",
      },
    );
    expect(body.autoMeta).toBe(true);
    expect(body.bpm).toBe(95);
    expect(body.sampleMode).toBe(false);
    expect(String(body.caption).toLowerCase()).not.toContain("pop rnb");
  });
});
