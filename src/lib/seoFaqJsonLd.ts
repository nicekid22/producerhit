import type { AppLocale } from "@/i18n/config";
import { landingCoreFaqs } from "@/i18n/landingFaqCatalog";
import { croLandingFaqs } from "@/lib/croTrustCopy";

/** FAQ alignées sur la landing — utilisées pour JSON-LD home / pricing. */
export function getHomeFaqsForJsonLd(locale: AppLocale): { q: string; a: string }[] {
  return [...landingCoreFaqs(locale), ...croLandingFaqs(locale)];
}
