import type { AppLocale } from "../config";
import { de } from "./de";
import { en } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { it } from "./it";
import { ja } from "./ja";
import { ko } from "./ko";
import { nl } from "./nl";
import { ar } from "./ar";
import { tr } from "./tr";
import { hi } from "./hi";
import { pt } from "./pt";
import { th } from "./th";
import { zh } from "./zh";
import { buildExtraSections } from "../extraCatalog";
import type { BaseMessageCatalog, MessageCatalog } from "../types";

const BASE: Record<AppLocale, BaseMessageCatalog> = {
  en,
  fr,
  es,
  pt,
  de,
  it,
  nl,
  ar,
  ja,
  ko,
  tr,
  hi,
  zh,
  th,
};

export function getMessages(locale: AppLocale): MessageCatalog {
  const base = BASE[locale] ?? BASE.en;
  return { ...base, ...buildExtraSections(locale) };
}

export { en, fr, es, pt, de, it, nl, ar, ja, ko, tr, hi, zh, th };
