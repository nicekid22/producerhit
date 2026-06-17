#!/usr/bin/env node
/**
 * Vérifie que toutes les locales UI ont un catalogue de base complet
 * et que extraCatalog couvre common/blog/cro/footer pour 14 langues.
 */
import { UI_LOCALES } from "../src/i18n/config.ts";
import { en } from "../src/i18n/locales/en.ts";
import { getMessages } from "../src/i18n/locales/index.ts";

function keysOf(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      return keysOf(v as Record<string, unknown>, path);
    }
    return [path];
  });
}

const baseKeys = keysOf(en as unknown as Record<string, unknown>);
let failed = false;

for (const locale of UI_LOCALES) {
  const m = getMessages(locale);
  const allKeys = keysOf(m as unknown as Record<string, unknown>);
  const missing = baseKeys.filter((k) => !allKeys.includes(k));
  const extraSections = ["common", "blog", "cro", "footer"];
  for (const section of extraSections) {
    if (!(section in m)) {
      console.error(`[${locale}] missing section: ${section}`);
      failed = true;
    }
  }
  if (missing.length) {
    console.error(`[${locale}] missing keys:`, missing.join(", "));
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log(`i18n OK — ${UI_LOCALES.length} locales, ${keysOf(getMessages("en") as unknown as Record<string, unknown>).length} keys each`);
