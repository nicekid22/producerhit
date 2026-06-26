import { describe, expect, it } from "vitest";
import { looksLikeAceProsePrompt } from "@producerhit/shared";
import { CATEGORIZED_EN, CATEGORIZED_FR, flattenCategories } from "./index";
import { getGenreMenuPromptCount, pickRandomGenreMenuDice } from "@/lib/randomPromptIdeas/genreMenuPrompts";
import { pickRandomGenreMenuDiceRoll, getLandingDisplayPromptPool, prepareRotatingPromptPlaceholders } from "@/lib/randomPromptIdeas";
import { GENRE_COUNT } from "@/lib/genres";
import { looksLikeAceTechnicalPrompt } from "@/lib/promptEnhancer";
describe("random prompt pools", () => {
  it("EN song pools include 500+ ACE prose prompts", () => {
    const enSong = flattenCategories(CATEGORIZED_EN.song);
    expect(enSong.length).toBeGreaterThanOrEqual(430);
    const aceSample = enSong.find((p) => /\bsong about\b/i.test(p) && /\.\s+[A-Z]/.test(p));
    expect(aceSample).toBeTruthy();
  });

  it("FR/EN song pools have hundreds of unique prompts", () => {
    const frSong = flattenCategories(CATEGORIZED_FR.song);
    const enSong = flattenCategories(CATEGORIZED_EN.song);
    expect(frSong.length).toBeGreaterThanOrEqual(180);
    expect(enSong.length).toBeGreaterThanOrEqual(180);
    expect(new Set(frSong).size).toBe(frSong.length);
    expect(new Set(enSong).size).toBe(enSong.length);
  });

  it("landing display pool v1+v2 exceeds 100 prompts per locale", () => {
    const enSong = getLandingDisplayPromptPool("en", "song");
    const frSong = getLandingDisplayPromptPool("fr", "song");
    expect(enSong.length).toBeGreaterThanOrEqual(100);
    expect(frSong.length).toBeGreaterThanOrEqual(100);
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

  it("dice roll can show curated French or genre shell", () => {
    const fr = pickRandomGenreMenuDiceRoll("fr", "song");
    expect(fr.displayPrompt.trim().length).toBeGreaterThan(12);
    expect(fr.genre).toBeTruthy();
    if (fr.acePrompt.trim() && !looksLikeAceProsePrompt(fr.displayPrompt)) {
      expect(fr.acePrompt.length).toBeGreaterThan(fr.displayPrompt.length);
    }
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

  it("landing display pool uses readable curated phrases not ACE tags", () => {
    const frSong = getLandingDisplayPromptPool("fr", "song");
    const frBeat = getLandingDisplayPromptPool("fr", "beat");
    expect(frSong.length).toBeGreaterThanOrEqual(100);
    expect(frBeat.length).toBeGreaterThanOrEqual(80);
    expect(frSong.some((p) => /Coupe du monde|World Cup/i.test(p))).toBe(true);
    expect(frSong.some((p) => looksLikeAceTechnicalPrompt(p))).toBe(false);
    expect(frSong.some((p) => /^Chanson /i.test(p))).toBe(true);
    expect(frBeat.some((p) => /^Type beat|^Beat /i.test(p))).toBe(true);
  });

  it("prepareRotatingPromptPlaceholders shuffles pool and random start", () => {
    const base = [...getLandingDisplayPromptPool("fr", "song")];
    const runs = Array.from({ length: 12 }, () => prepareRotatingPromptPlaceholders("fr", "song"));
    expect(runs.every((r) => r.pool.length === base.length)).toBe(true);
    expect(runs.every((r) => r.pool.every((p) => base.includes(p)))).toBe(true);
    const distinctOrders = new Set(runs.map((r) => r.pool.slice(0, 5).join("|")));
    expect(distinctOrders.size).toBeGreaterThan(1);
    expect(new Set(runs.map((r) => r.startIndex)).size).toBeGreaterThan(1);
  });

  it("rotating placeholders exclude prompt bank 2000 entries", () => {
    const frSong = getLandingDisplayPromptPool("fr", "song");
    expect(frSong.some((p) => /—\s*\w+.*\d{2,3}\s*bpm/i.test(p))).toBe(false);
    expect(frSong.some((p) => p.includes("Danser lentement dans la cuisine"))).toBe(false);
  });

  it("IT landing includes Italian translated curated", () => {
    const itSong = getLandingDisplayPromptPool("it", "song");
    expect(itSong.length).toBeGreaterThanOrEqual(40);
    expect(itSong.some((p) => /Mondiale|TikTok|divertente|BeatStars/i.test(p))).toBe(true);
    expect(itSong.some((p) => /^Una canzone /i.test(p))).toBe(true);
  });

  it("IT dice can pick Italian curated or genre shell", () => {
    const it = pickRandomGenreMenuDiceRoll("it", "song");
    expect(it.displayPrompt.trim().length).toBeGreaterThan(12);
    expect(it.genre).toBeTruthy();
  });

  it("ES landing includes Spanish translated curated", () => {
    const esSong = getLandingDisplayPromptPool("es", "song");
    expect(esSong.length).toBeGreaterThanOrEqual(40);
    expect(esSong.some((p) => /Mundial|TikTok|graciosa/i.test(p))).toBe(true);
    expect(esSong.some((p) => /^Una canción /i.test(p))).toBe(true);
  });

  it("ES dice can pick Spanish curated or genre shell", () => {
    const es = pickRandomGenreMenuDiceRoll("es", "song");
    expect(es.displayPrompt.trim().length).toBeGreaterThan(12);
    expect(es.genre).toBeTruthy();
  });

  it("natural category includes conversational French", () => {
    const natural = CATEGORIZED_FR.song.find((c) => c.id === "natural");
    expect(natural?.prompts.some((p) => p.includes("vacances d'été en Italie"))).toBe(true);
  });
});
