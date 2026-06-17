import type { AppLocale } from "../config";
import { de } from "./de";
import { en } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { it } from "./it";
import { pt } from "./pt";
import type { MessageCatalog } from "../types";

const CATALOG: Record<AppLocale, MessageCatalog> = {
  en,
  fr,
  es,
  pt,
  de,
  it,
};

export function getMessages(locale: AppLocale): MessageCatalog {
  return CATALOG[locale] ?? CATALOG.en;
}

export { en, fr, es, pt, de, it };
