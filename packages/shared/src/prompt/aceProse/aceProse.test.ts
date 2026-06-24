import { describe, expect, it } from "vitest";
import {
  generateAceProsePrompt,
  generateUniqueAceProsePool,
  getAceProseCuratedPool,
  getAceProsePoolStats,
  looksLikeAceProsePrompt,
  optimizeAceProsePrompt,
  pickAceProsePrompt,
} from "./index";

describe("aceProse", () => {
  it("curated pool has 500 prompts for EN", () => {
    const stats = getAceProsePoolStats("en");
    expect(stats.song).toBe(250);
    expect(stats.beat).toBe(250);
    expect(stats.total).toBe(500);
    expect(stats.locale).toBe("en");
  });

  it("generates French opener with English production tail", () => {
    const fr = generateAceProsePrompt("song", 999, "fr");
    expect(fr).toMatch(/\bchanson\b/i);
    expect(fr).toMatch(/\bsur\b/i);
    expect(fr).toMatch(/\b(808|vocal|drums|rhodes|piano)\b/i);
    expect(looksLikeAceProsePrompt(fr)).toBe(true);
  });

  it("FR curated pool has 250 song prompts", () => {
    const pool = getAceProseCuratedPool("song", "fr");
    expect(pool.length).toBe(250);
    expect(pool[0]).toMatch(/\b(sur|chanson)\b/i);
  });

  it.each(["es", "de", "ja", "ar", "pt"] as const)("%s curated pool has 250 song + beat", (locale) => {
    const stats = getAceProsePoolStats(locale);
    expect(stats.song).toBe(250);
    expect(stats.beat).toBe(250);
    expect(stats.locale).toBe(locale);
    const sample = getAceProseCuratedPool("song", locale)[0] ?? "";
    expect(looksLikeAceProsePrompt(sample)).toBe(true);
  });

  it("generates valid ACE prose format in EN", () => {
    const song = generateAceProsePrompt("song", 12345);
    expect(looksLikeAceProsePrompt(song)).toBe(true);
    expect(song).toMatch(/\bsong about\b/i);
    expect(song).toMatch(/\bvocal\b/i);
    const beat = generateAceProsePrompt("beat", 67890);
    expect(looksLikeAceProsePrompt(beat)).toBe(true);
    expect(beat).toMatch(/\bbeat about\b/i);
    expect(beat).not.toMatch(/\bmale vocal\b/i);
  });

  it("optimizer preserves example structure", () => {
    const raw =
      "dark emotional trap song about betrayal and loneliness. heavy 808, cinematic atmosphere, deep male vocal";
    const out = optimizeAceProsePrompt(raw);
    expect(out).toMatch(/^Dark emotional trap song about betrayal and loneliness\./i);
    expect(out.toLowerCase()).toContain("heavy 808");
    expect(out.toLowerCase()).toContain("deep male vocal");
  });

  it("beat mode forces instrumental tail without vocals", () => {
    const frBeat = getAceProseCuratedPool("beat", "fr")[0] ?? "";
    const out = optimizeAceProsePrompt(frBeat, { mode: "beat" });
    expect(out).not.toMatch(/\b(male|female) vocal\b/i);
    expect(out).not.toMatch(/\bharmonies\b/i);
  });

  it("AR beat opener is classified as beat not song", () => {
    const arBeat = getAceProseCuratedPool("beat", "ar")[0] ?? "";
    expect(arBeat).toMatch(/\bbeat\b/i);
    expect(arBeat).toMatch(/عن/);
    const out = optimizeAceProsePrompt(arBeat, { mode: "beat" });
    expect(out).not.toMatch(/\b(male|female) vocal\b/i);
  });

  it("dynamic generator produces unique prompts in batch", () => {
    const batch = generateUniqueAceProsePool("song", 50, 1000);
    expect(batch.length).toBe(50);
    expect(new Set(batch).size).toBe(50);
    for (const p of batch) {
      expect(looksLikeAceProsePrompt(p)).toBe(true);
    }
  });

  it("pickAceProsePrompt returns optimized curated or dynamic", () => {
    const a = pickAceProsePrompt("song", { seed: 42, dynamicRatio: 0 });
    const b = pickAceProsePrompt("song", { seed: 42, dynamicRatio: 0 });
    expect(a).toBe(b);
    expect(getAceProseCuratedPool("song")).toContain(a);
  });
});
