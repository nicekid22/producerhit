import type { AppLocale } from "@/i18n/config";
import { L, pickL } from "@/i18n/localized";
import { PLAN_MONTHLY_USD } from "@/lib/planPricing";
import { PLAN_LIMITS } from "@/lib/planLimits";

/** Prix public futur affiché (ancrage) — Stripe reste à PLAN_MONTHLY_USD.pro. */
export const LAUNCH_ANCHOR_USD = {
  pro: 12,
  studio: 32,
  plus: 59,
} as const;

/** Bonus crédits offerts (copy + webhook Stripe). */
export const LAUNCH_BONUS_CREDITS = {
  proFirstMonth: 20,
  checkoutRecovery: 5,
} as const;

/** Fin de la fenêtre « tarif lancement » (affichage urgence). */
export const LAUNCH_OFFER_END_ISO = "2026-07-31T23:59:59Z";

export type LaunchOfferCopy = {
  badge: string;
  headline: string;
  subline: string;
  founderLock: string;
  bonusLine: string;
  urgencyLine: string;
  ctaHint: string;
};

const LAUNCH_BADGE = L({
  en: "Launch pricing",
  fr: "Tarif lancement",
  es: "Precio de lanzamiento",
  de: "Startpreis",
  pt: "Preço de lançamento",
  it: "Prezzo lancio",
  nl: "Lanceringsprijs",
  ar: "سعر الإطلاق",
  ja: "ローンチ価格",
  ko: "런칭 가격",
  tr: "Lansman fiyatı",
  hi: "लॉन्च मूल्य",
  zh: "首发价格",
  th: "ราคาเปิดตัว",
});

const LAUNCH_CTA_BUTTON = L({
  en: "Get Pro — $8/mo",
  fr: "Passer Pro — 8 $/mois",
  es: "Pro — 8 $/mes",
  de: "Pro — 8 $/Monat",
  pt: "Pro — 8 $/mês",
  it: "Pro — 8 $/mese",
  nl: "Pro — $8/maand",
  ar: "Pro — 8$/شهر",
  ja: "Pro — $8/月",
  ko: "Pro — $8/월",
  tr: "Pro — 8$/ay",
  hi: "Pro — $8/माह",
  zh: "Pro — $8/月",
  th: "Pro — $8/เดือน",
});

const LAUNCH_CTA_HINT = L({
  en: "Cancel anytime · Secure Stripe checkout",
  fr: "Annulable à tout moment · Stripe sécurisé",
  es: "Cancela cuando quieras · Pago seguro Stripe",
  de: "Jederzeit kündbar · Sichere Stripe-Zahlung",
  pt: "Cancele quando quiser · Checkout Stripe seguro",
  it: "Annulla quando vuoi · Checkout Stripe sicuro",
  nl: "Altijd opzegbaar · Veilige Stripe-checkout",
  ar: "إلغاء في أي وقت · Stripe آمن",
  ja: "いつでも解約 · Stripe 安全決済",
  ko: "언제든 해지 · Stripe 안전 결제",
  tr: "İstediğin zaman iptal · Güvenli Stripe",
  hi: "कभी भी रद्द · सुरक्षित Stripe",
  zh: "随时取消 · Stripe 安全支付",
  th: "ยกเลิกได้ทุกเมื่อ · Stripe ปลอดภัย",
});

const LAUNCH_URGENCY_FINAL = L({
  en: "Final hours — launch pricing",
  fr: "Dernières heures tarif lancement",
  es: "Últimas horas — precio de lanzamiento",
  de: "Letzte Stunden — Startpreis",
  pt: "Últimas horas — preço de lançamento",
  it: "Ultime ore — prezzo lancio",
  nl: "Laatste uren — lanceringsprijs",
  ar: "الساعات الأخيرة — سعر الإطلاق",
  ja: "ラストチャンス — ローンチ価格",
  ko: "마감 임박 — 런칭 가격",
  tr: "Son saatler — lansman fiyatı",
  hi: "अंतिम घंटे — लॉन्च मूल्य",
  zh: "最后机会 — 首发价",
  th: "ชั่วโมงสุดท้าย — ราคาเปิดตัว",
});

const LAUNCH_MICRO_LOCKED = L({
  en: "$8 locked",
  fr: "8 $ verrouillés",
  es: "8 $ bloqueados",
  de: "8 $ gesperrt",
  pt: "8 $ bloqueados",
  it: "8 $ bloccati",
  nl: "$8 vastgezet",
  ar: "8$ مقفلة",
  ja: "$8 固定",
  ko: "$8 고정",
  tr: "8$ kilitli",
  hi: "$8 लॉक",
  zh: "$8 锁定",
  th: "$8 ล็อก",
});

const LAUNCH_MICRO_FUTURE = L({
  en: "$12 soon",
  fr: "12 $ bientôt",
  es: "12 $ pronto",
  de: "12 $ bald",
  pt: "12 $ em breve",
  it: "12 $ presto",
  nl: "$12 binnenkort",
  ar: "12$ قريباً",
  ja: "まもなく $12",
  ko: "곧 $12",
  tr: "yakında 12$",
  hi: "जल्द $12",
  zh: "即将 $12",
  th: "เร็วๆ นี้ $12",
});

const LAUNCH_MICRO_BONUS_TRACKS = L({
  en: `+${LAUNCH_BONUS_CREDITS.proFirstMonth} tracks`,
  fr: `+${LAUNCH_BONUS_CREDITS.proFirstMonth} gen`,
  es: `+${LAUNCH_BONUS_CREDITS.proFirstMonth} pistas`,
  de: `+${LAUNCH_BONUS_CREDITS.proFirstMonth} Tracks`,
  pt: `+${LAUNCH_BONUS_CREDITS.proFirstMonth} faixas`,
  it: `+${LAUNCH_BONUS_CREDITS.proFirstMonth} tracce`,
  nl: `+${LAUNCH_BONUS_CREDITS.proFirstMonth} tracks`,
  ar: `+${LAUNCH_BONUS_CREDITS.proFirstMonth} مقاطع`,
  ja: `+${LAUNCH_BONUS_CREDITS.proFirstMonth} 曲`,
  ko: `+${LAUNCH_BONUS_CREDITS.proFirstMonth} 트랙`,
  tr: `+${LAUNCH_BONUS_CREDITS.proFirstMonth} parça`,
  hi: `+${LAUNCH_BONUS_CREDITS.proFirstMonth} ट्रैक`,
  zh: `+${LAUNCH_BONUS_CREDITS.proFirstMonth} 首`,
  th: `+${LAUNCH_BONUS_CREDITS.proFirstMonth} แทร็ก`,
});

function i(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(vars[key] ?? ""));
}

const LAUNCH_HEADLINE = L({
  en: "Pro at ${{proNow}}/mo — founder rate locked in",
  fr: "Pro à {{proNow}} $/mois — prix fondateur verrouillé",
  es: "Pro a {{proNow}} $/mes — tarifa fundador bloqueada",
  pt: "Pro por ${{proNow}}/mês — tarifa fundador bloqueada",
  de: "Pro für {{proNow}} $/Monat — Gründerpreis gesperrt",
  it: "Pro a ${{proNow}}/mese — tariffa founder bloccata",
  nl: "Pro voor ${{proNow}}/mnd — founder-tarief vastgezet",
  ar: "Pro بـ {{proNow}}$/شهر — سعر المؤسس مقفل",
  ja: "Pro ${{proNow}}/月 — ファウンダー価格固定",
  ko: "Pro ${{proNow}}/월 — 창립 요금 고정",
  tr: "Pro {{proNow}} $/ay — kurucu fiyatı kilitli",
  hi: "Pro ${{proNow}}/mo — founder दर लॉक",
  zh: "Pro ${{proNow}}/月 — 创始价锁定",
  th: "Pro ${{proNow}}/เดือน — ราคาผู้ก่อตั้งล็อก",
});

const LAUNCH_SUBLINE = L({
  en: "Public price planned: ${{proFuture}}/mo for new signups later.",
  fr: "Prix public prévu : {{proFuture}} $/mois pour les nouveaux inscrits.",
  es: "Precio público previsto: {{proFuture}} $/mes para nuevos usuarios.",
  pt: "Preço público previsto: ${{proFuture}}/mês para novos cadastros.",
  de: "Geplanter öffentlicher Preis: {{proFuture}} $/Monat für neue Nutzer.",
  it: "Prezzo pubblico previsto: ${{proFuture}}/mese per i nuovi iscritti.",
  nl: "Geplande publieke prijs: ${{proFuture}}/mnd voor nieuwe aanmeldingen.",
  ar: "السعر العام المخطط: {{proFuture}}$/شهر للمشتركين الجدد لاحقاً.",
  ja: "公開予定価格: 新規は ${{proFuture}}/月。",
  ko: "공개 예정 가격: 신규 가입 ${{proFuture}}/월.",
  tr: "Planlanan halka açık fiyat: yeni kayıtlar {{proFuture}} $/ay.",
  hi: "सार्वजनिक कीमत: नए साइनअप ${{proFuture}}/mo.",
  zh: "计划公开价：新用户 ${{proFuture}}/月。",
  th: "ราคาสาธารณะที่วางแผน: สมัครใหม่ ${{proFuture}}/เดือน",
});

const LAUNCH_FOUNDER_LOCK = L({
  en: "Subscribe now → your rate stays $8 as long as you stay subscribed.",
  fr: "Abonne-toi maintenant → ton tarif reste à 8 $ tant que tu restes abonné.",
  es: "Suscríbete ahora → tu tarifa se mantiene en 8 $ mientras sigas suscrito.",
  pt: "Assine agora → sua tarifa permanece $8 enquanto estiver inscrito.",
  de: "Jetzt abonnieren → dein Preis bleibt 8 $, solange du abonniert bleibst.",
  it: "Abbonati ora → la tariffa resta $8 finché resti abbonato.",
  nl: "Abonneer nu → je tarief blijft $8 zolang je geabonneerd bent.",
  ar: "اشترك الآن → سعرك يبقى 8$ طالما أنت مشترك.",
  ja: "今すぐ登録 → 継続中は $8 のまま。",
  ko: "지금 구독 → 구독 유지 시 $8 고정.",
  tr: "Şimdi abone ol → abonelik süresince 8$ kalır.",
  hi: "अभी सब्सक्राइब करें → जब तक सब्सक्राइब रहें $8।",
  zh: "立即订阅 → 订阅期间保持 $8。",
  th: "สมัครตอนนี้ → ราคา $8 ตราบใดที่ยังสมัครอยู่",
});

const LAUNCH_BONUS_LINE = L({
  en: "+{{bonus}} bonus generations on your first Pro month",
  fr: "+{{bonus}} générations bonus offertes le 1er mois Pro",
  es: "+{{bonus}} generaciones bonus en tu primer mes Pro",
  pt: "+{{bonus}} gerações bônus no primeiro mês Pro",
  de: "+{{bonus}} Bonus-Generierungen im ersten Pro-Monat",
  it: "+{{bonus}} generazioni bonus nel primo mese Pro",
  nl: "+{{bonus}} bonusgeneraties in je eerste Pro-maand",
  ar: "+{{bonus}} توليدات إضافية في أول شهر Pro",
  ja: "初月Proで +{{bonus}} ボーナス生成",
  ko: "첫 Pro 달 +{{bonus}} 보너스 생성",
  tr: "İlk Pro ayında +{{bonus}} bonus üretim",
  hi: "पहले Pro महीने +{{bonus}} बोनस जनरेशन",
  zh: "首个 Pro 月 +{{bonus}} 次额外生成",
  th: "+{{bonus}} การสร้างโบนัสในเดือน Pro แรก",
});

const LAUNCH_URGENCY_ONE = L({
  en: "Launch window: {{days}} day left",
  fr: "Fenêtre lancement : encore {{days}} jour",
  es: "Ventana de lanzamiento: {{days}} día restante",
  pt: "Janela de lançamento: {{days}} dia restante",
  de: "Launch-Fenster: noch {{days}} Tag",
  it: "Finestra lancio: {{days}} giorno rimasto",
  nl: "Lanceringsvenster: nog {{days}} dag",
  ar: "نافذة الإطلاق: {{days}} يوم متبقٍ",
  ja: "ローンチ期間: 残り{{days}}日",
  ko: "런칭 기간: {{days}}일 남음",
  tr: "Lansman penceresi: {{days}} gün kaldı",
  hi: "लॉन्च विंडो: {{days}} दिन बचा",
  zh: "首发窗口：还剩 {{days}} 天",
  th: "ช่วงเปิดตัว: เหลือ {{days}} วัน",
});

const LAUNCH_URGENCY_MANY = L({
  en: "Launch window: {{days}} days left",
  fr: "Fenêtre lancement : encore {{days}} jours",
  es: "Ventana de lanzamiento: {{days}} días restantes",
  pt: "Janela de lançamento: {{days}} dias restantes",
  de: "Launch-Fenster: noch {{days}} Tage",
  it: "Finestra lancio: {{days}} giorni rimasti",
  nl: "Lanceringsvenster: nog {{days}} dagen",
  ar: "نافذة الإطلاق: {{days}} أيام متبقية",
  ja: "ローンチ期間: 残り{{days}}日",
  ko: "런칭 기간: {{days}}일 남음",
  tr: "Lansman penceresi: {{days}} gün kaldı",
  hi: "लॉन्च विंडो: {{days}} दिन बचे",
  zh: "首发窗口：还剩 {{days}} 天",
  th: "ช่วงเปิดตัว: เหลือ {{days}} วัน",
});

const CHECKOUT_RECOVERY_BODY = L({
  en: "Resume in one click. Instant activation + {{bonus}} bonus credits if you finish today.",
  fr: "Reprends en 1 clic. Activation instantanée + {{bonus}} crédits bonus si tu finalises aujourd'hui.",
  es: "Retoma en 1 clic. Activación instantánea + {{bonus}} créditos bonus si finalizas hoy.",
  pt: "Retome em 1 clique. Ativação instantânea + {{bonus}} créditos bônus se finalizar hoje.",
  de: "In 1 Klick fortsetzen. Sofortige Aktivierung + {{bonus}} Bonus-Credits bei Abschluss heute.",
  it: "Riprendi in 1 clic. Attivazione istantanea + {{bonus}} crediti bonus se completi oggi.",
  nl: "Hervat in 1 klik. Directe activatie + {{bonus}} bonuscredits als je vandaag afrondt.",
  ar: "استأنف بنقرة. تفعيل فوري + {{bonus}} رصيد إضافي إذا أنهيت اليوم.",
  ja: "1クリックで再開。今日完了で即時有効化 + {{bonus}} ボーナスクレジット。",
  ko: "한 번의 클릭으로 재개. 오늘 완료 시 즉시 활성화 + {{bonus}} 보너스 크레디트.",
  tr: "Tek tıkla devam. Bugün bitirirsen anında aktivasyon + {{bonus}} bonus kredi.",
  hi: "एक क्लिक में फिर से शुरू। आज पूरा करें तो तुरंत + {{bonus}} बोनस क्रेडिट.",
  zh: "一键继续。今天完成即激活 + {{bonus}} 奖励积分。",
  th: "ดำเนินการต่อในคลิกเดียว เปิดใช้ทันที + {{bonus}} เครดิตโบนัสถ้าเสร็จวันนี้",
});

function daysUntilLaunchEnd(now = Date.now()): number {
  const end = new Date(LAUNCH_OFFER_END_ISO).getTime();
  return Math.max(0, Math.ceil((end - now) / (24 * 60 * 60 * 1000)));
}

export function isLaunchOfferActive(now = Date.now()): boolean {
  return now < new Date(LAUNCH_OFFER_END_ISO).getTime();
}

function launchUrgencyLine(locale: AppLocale, days: number): string {
  if (days <= 0) return pickL(LAUNCH_URGENCY_FINAL, locale);
  const tpl = pickL(days === 1 ? LAUNCH_URGENCY_ONE : LAUNCH_URGENCY_MANY, locale);
  return i(tpl, { days });
}

export function getLaunchOfferCtaButton(locale: AppLocale): string {
  return pickL(LAUNCH_CTA_BUTTON, locale);
}

/** Sticky mobile CTA for logged-in free users during launch window. */
export function getLaunchOfferStickyCta(locale: AppLocale): { title: string; sub: string; button: string } {
  const copy = getLaunchOfferCopy(locale);
  return {
    title: copy.headline,
    sub: copy.bonusLine,
    button: getLaunchOfferCtaButton(locale),
  };
}

export function getLaunchOfferCopy(locale: AppLocale): LaunchOfferCopy {
  const proNow = PLAN_MONTHLY_USD.pro;
  const proFuture = LAUNCH_ANCHOR_USD.pro;
  const bonus = LAUNCH_BONUS_CREDITS.proFirstMonth;
  const days = daysUntilLaunchEnd();

  return {
    badge: pickL(LAUNCH_BADGE, locale),
    headline: i(pickL(LAUNCH_HEADLINE, locale), { proNow }),
    subline: i(pickL(LAUNCH_SUBLINE, locale), { proFuture }),
    founderLock: pickL(LAUNCH_FOUNDER_LOCK, locale),
    bonusLine: i(pickL(LAUNCH_BONUS_LINE, locale), { bonus }),
    urgencyLine: launchUrgencyLine(locale, days),
    ctaHint: pickL(LAUNCH_CTA_HINT, locale),
  };
}

export type LaunchOfferMicro = {
  locked: string;
  bonus: string;
  future: string;
  urgency: string;
};

export function getLaunchOfferMicro(locale: AppLocale): LaunchOfferMicro {
  const bonus = LAUNCH_BONUS_CREDITS.proFirstMonth;
  const days = daysUntilLaunchEnd();
  const urgency = days > 0 ? `${days}${pickL(LAUNCH_MICRO_URGENCY_SUFFIX, locale)}` : "24h";
  return {
    locked: pickL(LAUNCH_MICRO_LOCKED, locale),
    bonus: pickL(LAUNCH_MICRO_BONUS_TRACKS, locale),
    future: pickL(LAUNCH_MICRO_FUTURE, locale),
    urgency,
  };
}

export function launchPerTrackUsd(): number {
  return PLAN_MONTHLY_USD.pro / PLAN_LIMITS.pro;
}

export function launchPriceAnchor(
  tier: keyof typeof PLAN_MONTHLY_USD,
): { current: number; anchor: number } {
  return {
    current: PLAN_MONTHLY_USD[tier],
    anchor: LAUNCH_ANCHOR_USD[tier],
  };
}

const CHECKOUT_RECOVERY_TITLE = L({
  en: "Checkout paused —",
  fr: "Paiement interrompu — plan",
  es: "Pago interrumpido — plan",
  de: "Zahlung pausiert — Plan",
  pt: "Pagamento pausado — plano",
  it: "Pagamento in pausa — piano",
  nl: "Betaling gepauzeerd — plan",
  ar: "تم إيقاف الدفع — الخطة",
  ja: "決済が中断されました —",
  ko: "결제가 중단됨 —",
  tr: "Ödeme duraklatıldı — plan",
  hi: "चेकआउट रुका —",
  zh: "结账已暂停 —",
  th: "ชำระเงินค้างไว้ —",
});

const LAUNCH_MICRO_URGENCY_SUFFIX = L({
  en: "d", fr: "j", es: "d", pt: "d", de: "T", it: "g", nl: "d", ar: "ي", ja: "日", ko: "일", tr: "g", hi: "d", zh: "天", th: "ว",
});

const CHECKOUT_RECOVERY_RESUME = L({
  en: "Resume",
  fr: "Reprendre",
  es: "Reanudar",
  de: "Fortsetzen",
  pt: "Retomar",
  it: "Riprendi",
  nl: "Hervatten",
  ar: "استئناف",
  ja: "再開",
  ko: "재개",
  tr: "Devam et",
  hi: "फिर से शुरू",
  zh: "继续",
  th: "ดำเนินการต่อ",
});

const CHECKOUT_RECOVERY_LATER = L({
  en: "Later",
  fr: "Plus tard",
  es: "Más tarde",
  de: "Später",
  pt: "Depois",
  it: "Più tardi",
  nl: "Later",
  ar: "لاحقاً",
  ja: "後で",
  ko: "나중에",
  tr: "Sonra",
  hi: "बाद में",
  zh: "稍后",
  th: "ภายหลัง",
});

const CHECKOUT_RECOVERY_DISMISS = L({
  en: "OK — back to creating",
  fr: "OK — on te laisse créer",
  es: "OK — vuelve a crear",
  de: "OK — zurück zum Erstellen",
  pt: "OK — volte a criar",
  it: "OK — torna a creare",
  nl: "OK — terug naar maken",
  ar: "حسناً — عد للإنشاء",
  ja: "OK — 作成に戻る",
  ko: "OK — 제작으로 돌아가기",
  tr: "Tamam — oluşturmaya dön",
  hi: "ठीक — वापस बनाएँ",
  zh: "好的 — 继续创作",
  th: "ตกลง — กลับไปสร้าง",
});

const CHECKOUT_RECOVERY_EMAIL_HINT = L({
  en: "Get a reminder + launch bonus by email",
  fr: "Reçois un rappel + bonus lancement par email",
  es: "Recibe un recordatorio y bonus por email",
  de: "Erinnerung + Launch-Bonus per E-Mail",
  pt: "Recebe lembrete + bónus por email",
  it: "Promemoria + bonus lancio via email",
  nl: "Herinnering + launch bonus per e-mail",
  ar: "تذكير + مكافأة عبر البريد",
  ja: "メールでリマインド＋ボーナス",
  ko: "이메일로 알림 + 보너스",
  tr: "E-posta ile hatırlatma + bonus",
  hi: "ईमेल पर रिमाइंड + बोनस",
  zh: "邮件提醒 + 启动奖励",
  th: "รับเตือนทางอีเมล + โบนัส",
});

const CHECKOUT_RECOVERY_EMAIL_PLACEHOLDER = L({
  en: "you@email.com",
  fr: "ton@email.com",
  es: "tu@email.com",
  de: "du@email.de",
  pt: "tu@email.com",
  it: "tu@email.com",
  nl: "jij@email.nl",
  ar: "you@email.com",
  ja: "you@email.com",
  ko: "you@email.com",
  tr: "you@email.com",
  hi: "you@email.com",
  zh: "you@email.com",
  th: "you@email.com",
});

const CHECKOUT_RECOVERY_EMAIL_SUBMIT = L({
  en: "Remind me",
  fr: "Me rappeler",
  es: "Recordarme",
  de: "Erinnern",
  pt: "Lembrar",
  it: "Ricordami",
  nl: "Herinner mij",
  ar: "ذكّرني",
  ja: "リマインド",
  ko: "알림 받기",
  tr: "Hatırlat",
  hi: "याद दिलाएँ",
  zh: "提醒我",
  th: "เตือนฉัน",
});

const CHECKOUT_RECOVERY_LOADING = L({
  en: "Loading…",
  fr: "Chargement…",
  es: "Cargando…",
  de: "Laden…",
  pt: "Carregando…",
  it: "Caricamento…",
  nl: "Laden…",
  ar: "جارٍ التحميل…",
  ja: "読み込み中…",
  ko: "로딩 중…",
  tr: "Yükleniyor…",
  hi: "लोड हो रहा है…",
  zh: "加载中…",
  th: "กำลังโหลด…",
});

export type CheckoutRecoveryCopy = {
  titlePrefix: string;
  body: string;
  resume: string;
  later: string;
  dismissToast: string;
  loading: string;
  emailHint: string;
  emailPlaceholder: string;
  emailSubmit: string;
};

export function getCheckoutRecoveryCopy(locale: AppLocale): CheckoutRecoveryCopy {
  return {
    titlePrefix: pickL(CHECKOUT_RECOVERY_TITLE, locale),
    body: i(pickL(CHECKOUT_RECOVERY_BODY, locale), { bonus: LAUNCH_BONUS_CREDITS.checkoutRecovery }),
    resume: pickL(CHECKOUT_RECOVERY_RESUME, locale),
    later: pickL(CHECKOUT_RECOVERY_LATER, locale),
    dismissToast: pickL(CHECKOUT_RECOVERY_DISMISS, locale),
    loading: pickL(CHECKOUT_RECOVERY_LOADING, locale),
    emailHint: pickL(CHECKOUT_RECOVERY_EMAIL_HINT, locale),
    emailPlaceholder: pickL(CHECKOUT_RECOVERY_EMAIL_PLACEHOLDER, locale),
    emailSubmit: pickL(CHECKOUT_RECOVERY_EMAIL_SUBMIT, locale),
  };
}
