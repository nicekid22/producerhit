import type { AppLocale } from "@/i18n/config";
import { L, pickL } from "@/i18n/localized";

export const CREDIT_PACKS = {
  credit_pack_50: {
    id: "credit_pack_50" as const,
    credits: 50,
    usd: 9,
  },
} as const;

export type CreditPackId = keyof typeof CREDIT_PACKS;

export function getCreditPack(id: CreditPackId) {
  return CREDIT_PACKS[id];
}

const PACK_CTA = L({
  en: "+50 generations — $9",
  fr: "+50 gen — 9 $",
  es: "+50 gen — 9 $",
  de: "+50 Gen — 9 $",
  pt: "+50 gen — $9",
  it: "+50 gen — $9",
  nl: "+50 gen — $9",
  ar: "+50 gen — 9$",
  ja: "+50曲 — $9",
  ko: "+50 생성 — $9",
  tr: "+50 gen — $9",
  hi: "+50 gen — $9",
  zh: "+50 次 — $9",
  th: "+50 gen — $9",
});

const PACK_TITLE = L({
  en: "Need more without upgrading?",
  fr: "Besoin de plus sans changer de plan ?",
  es: "¿Necesitas más sin cambiar de plan?",
  de: "Mehr ohne Planwechsel?",
  pt: "Precisa de mais sem mudar de plano?",
  it: "Serve di più senza cambiare piano?",
  nl: "Meer nodig zonder planwissel?",
  ar: "تحتاج المزيد دون ترقية؟",
  ja: "プラン変更なしでもっと作る？",
  ko: "업그레이드 없이 더 필요해요?",
  tr: "Yükseltmeden daha fazla mı?",
  hi: "अपग्रेड के बिना और चाहिए?",
  zh: "不想升级但需要更多额度？",
  th: "ต้องการเพิ่มโดยไม่อัปเกรด?",
});

const PACK_LEAD = L({
  en: "One-time pack · credits never expire · instant activation",
  fr: "Pack unique · crédits sans expiration · activation immédiate",
  es: "Pack único · créditos sin caducidad · activación al instante",
  de: "Einmaliges Paket · Credits verfallen nicht · sofort aktiv",
  pt: "Pacote único · créditos não expiram · ativação instantânea",
  it: "Pacchetto una tantum · crediti senza scadenza · attivazione immediata",
  nl: "Eenmalig pakket · credits verlopen niet · direct actief",
  ar: "حزمة لمرة واحدة · رصيد لا ينتهي · تفعيل فوري",
  ja: "買い切り · クレジット無期限 · 即時反映",
  ko: "일회성 팩 · 크레dit 만료 없음 · 즉시 활성화",
  tr: "Tek seferlik paket · krediler süresiz · anında aktif",
  hi: "वन-टाइम पैक · क्रेडिट समाप्त नहीं · तुरंत सक्रिय",
  zh: "一次性包 · 额度不过期 · 即时生效",
  th: "แพ็กครั้งเดียว · เครดิตไม่หมดอายุ · เปิดใช้ทันที",
});

export function getCreditPackCtaLabel(locale: AppLocale, packId: CreditPackId = "credit_pack_50"): string {
  const pack = getCreditPack(packId);
  const tpl = pickL(PACK_CTA, locale);
  return tpl.replace("50", String(pack.credits)).replace("9", String(pack.usd));
}

export function getCreditPackSectionCopy(locale: AppLocale): { title: string; lead: string; cta: string } {
  return {
    title: pickL(PACK_TITLE, locale),
    lead: pickL(PACK_LEAD, locale),
    cta: getCreditPackCtaLabel(locale),
  };
}
