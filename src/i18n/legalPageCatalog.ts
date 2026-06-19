import type { AppLocale } from "./config";
import { L, pickL } from "./localized";

const LABELS = {
  pageTitle: L({
    en: "Legal & Policies",
    fr: "Mentions légales & politiques",
    es: "Legal y políticas",
    pt: "Legal e políticas",
    de: "Rechtliches & Richtlinien",
    it: "Note legali e policy",
    nl: "Juridisch & beleid",
    ar: "القانون والسياسات",
    ja: "法的情報とポリシー",
    ko: "법적 고지 및 정책",
    tr: "Yasal ve politikalar",
    hi: "कानूनी और नीतियाँ",
    zh: "法律与政策",
    th: "กฎหมายและนโยบาย",
  }),
  toc: L({
    en: "Quick links", fr: "Accès rapide", es: "Acceso rápido", pt: "Acesso rápido", de: "Schnellzugriff", it: "Link rapidi", nl: "Snelle links",
    ar: "روابط سريعة", ja: "クイックリンク", ko: "빠른 링크", tr: "Hızlı bağlantılar", hi: "त्वरित लिंक", zh: "快速链接", th: "ลิงก์ด่วน",
  }),
  updatedAt: L({
    en: "Last updated", fr: "Dernière mise à jour", es: "Última actualización", pt: "Última atualização", de: "Zuletzt aktualisiert",
    it: "Ultimo aggiornamento", nl: "Laatst bijgewerkt", ar: "آخر تحديث", ja: "最終更新", ko: "최종 업데이트", tr: "Son güncelleme", hi: "अंतिम अपडेट", zh: "最后更新", th: "อัปเดตล่าสุด",
  }),
  privacy: L({
    en: "Privacy Policy", fr: "Politique de confidentialité", es: "Política de privacidad", pt: "Política de privacidade", de: "Datenschutz",
    it: "Privacy policy", nl: "Privacybeleid", ar: "سياسة الخصوصية", ja: "プライバシーポリシー", ko: "개인정보 처리방침", tr: "Gizlilik politikası", hi: "गोपनीयता नीति", zh: "隐私政策", th: "นโยบายความเป็นส่วนตัว",
  }),
  terms: L({
    en: "Terms of Service", fr: "Conditions d'utilisation", es: "Términos de servicio", pt: "Termos de uso", de: "Nutzungsbedingungen",
    it: "Termini di servizio", nl: "Gebruiksvoorwaarden", ar: "شروط الاستخدام", ja: "利用規約", ko: "이용약관", tr: "Hizmet şartları", hi: "सेवा की शर्तें", zh: "服务条款", th: "ข้อกำหนดการใช้งาน",
  }),
  commercialLicense: L({
    en: "Commercial license & rights", fr: "Licence commerciale & droits", es: "Licencia comercial y derechos", pt: "Licença comercial e direitos",
    de: "Kommerzielle Lizenz & Rechte", it: "Licenza commerciale e diritti", nl: "Commerciële licentie & rechten", ar: "الترخيص التجاري والحقوق",
    ja: "商用ライセンスと権利", ko: "상업적 라이선스 및 권리", tr: "Ticari lisans ve haklar", hi: "व्यावसायिक लाइसेंस और अधिकार", zh: "商业授权与权利", th: "ใบอนุญาตเชิงพาณิชย์และสิทธิ์",
  }),
  cookies: L({
    en: "Cookie Policy", fr: "Politique cookies", es: "Política de cookies", pt: "Política de cookies", de: "Cookie-Richtlinie",
    it: "Policy cookie", nl: "Cookiebeleid", ar: "سياسة ملفات تعريف الارتباط", ja: "Cookieポリシー", ko: "쿠키 정책", tr: "Çerez politikası", hi: "कुकी नीति", zh: "Cookie 政策", th: "นโยบายคุกกี้",
  }),
  refunds: L({
    en: "Payments & Refunds", fr: "Paiements & remboursements", es: "Pagos y reembolsos", pt: "Pagamentos e reembolsos", de: "Zahlungen & Erstattungen",
    it: "Pagamenti e rimborsi", nl: "Betalingen & terugbetalingen", ar: "المدفوعات والاسترداد", ja: "支払いと返金", ko: "결제 및 환불", tr: "Ödemeler ve iadeler", hi: "भुगतान और रिफंड", zh: "付款与退款", th: "การชำระเงินและการคืนเงิน",
  }),
  acceptableUse: L({
    en: "Acceptable Use", fr: "Règles d'usage (Acceptable Use)", es: "Uso aceptable", pt: "Uso aceitável", de: "Akzeptable Nutzung",
    it: "Uso accettabile", nl: "Acceptabel gebruik", ar: "الاستخدام المقبول", ja: "利用規定", ko: "허용 가능한 사용", tr: "Kabul edilebilir kullanım", hi: "स्वीकार्य उपयोग", zh: "可接受使用", th: "การใช้งานที่ยอมรับได้",
  }),
  dmca: L({
    en: "Copyright / DMCA", fr: "Signalement / droits d'auteur (DMCA)", es: "Copyright / DMCA", pt: "Copyright / DMCA", de: "Urheberrecht / DMCA",
    it: "Copyright / DMCA", nl: "Auteursrecht / DMCA", ar: "حقوق النشر / DMCA", ja: "著作権 / DMCA", ko: "저작권 / DMCA", tr: "Telif / DMCA", hi: "कॉपीराइट / DMCA", zh: "版权 / DMCA", th: "ลิขสิทธิ์ / DMCA",
  }),
  contact: L({
    en: "Support / Contact", fr: "Support / Contact", es: "Soporte / Contacto", pt: "Suporte / Contato", de: "Support / Kontakt",
    it: "Supporto / Contatto", nl: "Support / Contact", ar: "الدعم / التواصل", ja: "サポート / お問い合わせ", ko: "지원 / 문의", tr: "Destek / İletişim", hi: "सहायता / संपर्क", zh: "支持 / 联系", th: "สนับสนุน / ติดต่อ",
  }),
};

export function buildLegalPageLabels(locale: AppLocale) {
  return {
    pageTitle: pickL(LABELS.pageTitle, locale),
    toc: pickL(LABELS.toc, locale),
    updatedAt: pickL(LABELS.updatedAt, locale),
    privacy: pickL(LABELS.privacy, locale),
    terms: pickL(LABELS.terms, locale),
    commercialLicense: pickL(LABELS.commercialLicense, locale),
    cookies: pickL(LABELS.cookies, locale),
    refunds: pickL(LABELS.refunds, locale),
    acceptableUse: pickL(LABELS.acceptableUse, locale),
    dmca: pickL(LABELS.dmca, locale),
    contact: pickL(LABELS.contact, locale),
  };
}

/** Legal body content: full FR translation; all other locales use EN until localized. */
export function legalContentLocale(locale: AppLocale): "fr" | "en" {
  return locale === "fr" ? "fr" : "en";
}
