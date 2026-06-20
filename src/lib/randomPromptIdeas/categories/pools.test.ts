import { describe, expect, it } from "vitest";
import { CATEGORIZED_EN, CATEGORIZED_FR, flattenCategories } from "./index";
import { getGenreMenuPromptCount, pickRandomGenreMenuDice } from "@/lib/randomPromptIdeas/genreMenuPrompts";
import { pickRandomGenreMenuDiceRoll, getLandingDisplayPromptPool } from "@/lib/randomPromptIdeas";
import { GENRE_COUNT } from "@/lib/genres";
describe("random prompt pools", () => {
  it("FR/EN song pools have hundreds of unique prompts", () => {
    const frSong = flattenCategories(CATEGORIZED_FR.song);
    const enSong = flattenCategories(CATEGORIZED_EN.song);
    expect(frSong.length).toBeGreaterThanOrEqual(180);
    expect(enSong.length).toBeGreaterThanOrEqual(180);
    expect(new Set(frSong).size).toBe(frSong.length);
    expect(new Set(enSong).size).toBe(enSong.length);
  });

  it("FR/EN beat pools are large and unique", () => {
    const frBeat = flattenCategories(CATEGORIZED_FR.beat);
    const enBeat = flattenCategories(CATEGORIZED_EN.beat);
    expect(frBeat.length).toBeGreaterThanOrEqual(110);
    expect(enBeat.length).toBeGreaterThanOrEqual(110);
    expect(new Set(frBeat).size).toBe(frBeat.length);
  });

  it("genre_menu FR ace prompts mix French mood with English ACE tags", () => {
    const sample = pickRandomGenreMenuDice("song", "fr").acePrompt;
    expect(sample).toMatch(/\b(voix|vocal|nuit|été|heartbreak|mix|chorus|808|rhodes|trap|groove|hooks)\b/i);
    expect(/^(fais|une chanson|make me|song about)/i.test(sample)).toBe(false);
  });

  it("dice roll shows simple display prompt to users", () => {
    const fr = pickRandomGenreMenuDiceRoll("fr", "song");
    expect(fr.displayPrompt).toMatch(/^Une chanson /i);
    expect(fr.acePrompt.length).toBeGreaterThan(fr.displayPrompt.length);
    expect(fr.acePrompt).not.toBe(fr.displayPrompt);
  });

  it("dice roll respects prompt locale for song", () => {
    const fr = pickRandomGenreMenuDiceRoll("fr", "song");
    const en = pickRandomGenreMenuDiceRoll("en", "song");
    expect(fr.genre).toBeTruthy();
    expect(en.genre).toBeTruthy();
    expect(fr.displayPrompt).not.toEqual(en.displayPrompt);
  });

  it("genre_menu prompts use ACE tag format (no conversational prose)", () => {
    const genreMenuSong = CATEGORIZED_FR.song.find((c) => c.id === "genre_menu");
    const badProse =
      /^(fais|une chanson|un son|tu peux|peux-tu|j'ai besoin|chanson sur|make me|can you|i need|song about|a song)/i;
    const weakTheme = /\bth[eè]me\s*:/i;
    for (const p of genreMenuSong?.prompts ?? []) {
      expect(badProse.test(p)).toBe(false);
      expect(weakTheme.test(p)).toBe(false);
      expect(p.includes(",")).toBe(true);
    }
  });

  it("genre_menu covers every catalog genre with detailed prompts", () => {
    const genreMenuSong = CATEGORIZED_FR.song.find((c) => c.id === "genre_menu");
    const genreMenuBeat = CATEGORIZED_FR.beat.find((c) => c.id === "genre_menu");
    expect(genreMenuSong).toBeDefined();
    expect(genreMenuBeat).toBeDefined();
    expect(getGenreMenuPromptCount("song")).toBeGreaterThanOrEqual(GENRE_COUNT);
    expect(getGenreMenuPromptCount("beat")).toBeGreaterThanOrEqual(GENRE_COUNT);
    expect(genreMenuSong?.prompts[0]?.length ?? 0).toBeGreaterThan(80);
  });

  it("landing display pool uses readable phrases not ACE tags", () => {
    const frSong = getLandingDisplayPromptPool("fr", "song");
    const frBeat = getLandingDisplayPromptPool("fr", "beat");
    expect(frSong.length).toBeGreaterThanOrEqual(8);
    expect(frBeat.length).toBeGreaterThanOrEqual(8);
    expect(frSong[0]).toMatch(/^Une chanson /i);
    expect(frBeat[0]).toMatch(/^Un beat /i);
    expect(frSong.some((p) => p.includes("808"))).toBe(false);
  });

  it("natural category includes conversational French", () => {
    const natural = CATEGORIZED_FR.song.find((c) => c.id === "natural");
    expect(natural?.prompts.some((p) => p.includes("vacances d'été en Italie"))).toBe(true);
  });
});
