import type { AppLocale } from "./config";
import { L, type LocalizedString } from "./localized";

/** Complète une entrée en/fr/es/de avec les marchés restants (pt←es, it←es, nl←de si absent). */
export function L14(
  base: LocalizedString & { en: string; fr: string; es: string; de: string },
): Record<AppLocale, string> {
  const pt = base.pt ?? base.es;
  const it = base.it ?? base.es;
  const nl = base.nl ?? base.de;
  const ar = base.ar ?? base.en;
  const ja = base.ja ?? base.en;
  const ko = base.ko ?? base.en;
  const tr = base.tr ?? base.en;
  const hi = base.hi ?? base.en;
  const zh = base.zh ?? base.en;
  const th = base.th ?? base.en;
  return L({ ...base, pt, it, nl, ar, ja, ko, tr, hi, zh, th });
}
