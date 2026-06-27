import { describe, expect, it } from "vitest";
import v3 from "../../../data/prompt-bank/v3.json";
import v4 from "../../../data/prompt-bank/v4.json";
import { extractHookFromDisplay } from "./buildBankLyrics";
import { isSingableLyricHook } from "./singableHookLint";
import type { PromptBankEntry } from "./types";

function hooksFromBank(entries: PromptBankEntry[], lang: "en" | "fr"): string[] {
  return entries
    .filter((e) => e.lang === lang && e.theme === "good_vibes")
    .map((e) => extractHookFromDisplay(e.display));
}

describe("singableHookLint — good_vibes banks", () => {
  it("v3 FR/EN hooks are lyric-first not scene prompts", () => {
    for (const hook of [...hooksFromBank(v3 as PromptBankEntry[], "en"), ...hooksFromBank(v3 as PromptBankEntry[], "fr")]) {
      expect(isSingableLyricHook(hook), `bad hook: ${hook}`).toBe(true);
    }
  });

  it("v4 FR/EN hooks are lyric-first not scene prompts", () => {
    for (const hook of [...hooksFromBank(v4 as PromptBankEntry[], "en"), ...hooksFromBank(v4 as PromptBankEntry[], "fr")]) {
      expect(isSingableLyricHook(hook), `bad hook: ${hook}`).toBe(true);
    }
  });

  it("rejects old narrative-style hooks", () => {
    expect(isSingableLyricHook("Billets trouvés dans la poche du manteau")).toBe(false);
    expect(isSingableLyricHook("Premier rendez-vous — il ou elle rit de ton pire jeu de mots")).toBe(false);
    expect(isSingableLyricHook("Trajet en bagnole, vitres ouvertes, playlist au hasard")).toBe(false);
    expect(isSingableLyricHook("Souviens-toi de l'été dernier")).toBe(true);
    expect(isSingableLyricHook("Dance if you're feeling free")).toBe(true);
  });
});
