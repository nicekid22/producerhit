import type { AppLocale } from "../config";
import { de } from "./de";
import { en } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { it } from "./it";
import { ja } from "./ja";
import { ko } from "./ko";
import { pt } from "./pt";
import { th } from "./th";
import { zh } from "./zh";
import type { MessageCatalog } from "../types";

const CATALOG: Record<AppLocale, MessageCatalog> = {
  en,
  fr,
  es,
  pt,
  de,
  it,
  ja,
  ko,
  zh,
  th,
};

export function getMessages(locale: AppLocale): MessageCatalog {
  return CATALOG[locale] ?? CATALOG.en;
}

export { en, fr, es, pt, de, it, ja, ko, zh, th };
