import type { AppLocale } from "./config";
import { L, pickL } from "./localized";
import {
  LOOP_AUDIO_RETENTION_DAYS_FREE,
  LOOP_AUDIO_RETENTION_DAYS_PRO,
  LOOP_AUDIO_RETENTION_DAYS_STUDIO,
} from "@/lib/loopAudioRetention";
import { normalizePlanId } from "@/lib/planEntitlements";

const COPY = {
  eyebrow: L({
    en: "Upgrade to Plus",
    fr: "Passe au plan Plus",
    es: "Pasa al plan Plus",
    pt: "Mude para o plano Plus",
    de: "Upgrade auf Plus",
    it: "Passa al piano Plus",
    nl: "Upgrade naar Plus",
    ar: "الترقية إلى Plus",
    ja: "Plusプランにアップグレード",
    ko: "Plus 플랜으로 업그레이드",
    tr: "Plus planına geç",
    hi: "Plus प्लान पर अपग्रेड करें",
    zh: "升级至 Plus 方案",
    th: "อัปเกรดเป็นแพ็ก Plus",
  }),
  title: L({
    en: "{{count}} track{{plural}} went offline",
    fr: "{{count}} création{{plural}} hors ligne",
    es: "{{count}} creación{{plural}} fuera de línea",
    pt: "{{count}} criação{{plural}} offline",
    de: "{{count}} Track{{plural}} offline",
    it: "{{count}} creazione{{plural}} offline",
    nl: "{{count}} track{{plural}} offline",
    ar: "{{count}} إبداع/إبداعات غير متاح",
    ja: "ホスト済み{{count}}件がオフライン",
    ko: "호스팅 {{count}}개 오프라인",
    tr: "{{count}} parça çevrimdışı",
    hi: "{{count}} ट्रैक ऑफ़लाइन",
    zh: "{{count}} 条作品已下线",
    th: "งาน {{count}} รายการออฟไลน์แล้ว",
  }),
  leadFree: L({
    en: "On Free, hosted audio lasts {{days}} day — then it vanishes. Plus keeps your full catalog online so you can just generate and never think about expiry again.",
    fr: "En Free, tes sons restent {{days}} jour en ligne, puis disparaissent. Avec Plus, tout ton catalogue reste hébergé : tu génères, on s'occupe du reste.",
    es: "En Free, el audio dura {{days}} día y desaparece. Con Plus, todo tu catálogo sigue en línea: creas y nosotros nos encargamos del resto.",
    pt: "No Free, o áudio dura {{days}} dia e some. Com Plus, todo o catálogo fica online: você cria e nós cuidamos do resto.",
    de: "Bei Free bleibt Audio {{days}} Tag online — dann weg. Mit Plus bleibt dein Katalog online: du produzierst, wir kümmern uns um den Rest.",
    it: "Su Free l'audio resta {{days}} giorno, poi sparisce. Con Plus tutto il catalogo resta online: crei e al resto pensiamo noi.",
    nl: "Op Free blijft audio {{days}} dag online — daarna weg. Met Plus blijft je hele catalogus online: jij maakt, wij regelen de rest.",
    ar: "في Free يبقى الصوت {{days}} يومًا ثم يختفي. مع Plus يبقى كامل الكتالوج متاحًا: أنت تُنتج ونحن نتولى الباقي.",
    ja: "Freeでは{{days}}日で消えます。Plusならカタログ全体を常時オンライン：作るだけでOK。",
    ko: "Free는 {{days}}일 후 사라집니다. Plus는 전체 카탈로그를 온라인에 유지합니다. 만들기만 하세요.",
    tr: "Free'de ses {{days}} gün kalır, sonra gider. Plus ile tüm katalog çevrimiçi kalır: üret, gerisini biz hallederiz.",
    hi: "Free पर ऑडियो {{days}} दिन रहता है, फिर गायब। Plus पर पूरा कैटलॉग ऑनलाइन — बस जनरेट करें।",
    zh: "Free 仅保留 {{days}} 天。Plus 让你的全部作品常驻在线：只管创作即可。",
    th: "Free เก็บ {{days}} วันแล้วหาย Plus ให้คatalog ทั้งหมดออนไลน์ — แค่สร้างต่อได้",
  }),
  leadPro: L({
    en: "On Pro, hosting lasts {{days}} days. Plus is permanent cloud storage for producers — every track stays playable in Library, stems included.",
    fr: "En Pro, l'hébergement expire au bout de {{days}} jours. Plus, c'est le cloud permanent : chaque son reste jouable dans ta Library, stems inclus.",
    es: "En Pro, el alojamiento dura {{days}} días. Plus es almacenamiento permanente: cada pista sigue en Library, stems incluidos.",
    pt: "No Pro, a hospedagem dura {{days}} dias. Plus é nuvem permanente: cada faixa fica na Library, com stems.",
    de: "Bei Pro läuft Hosting nach {{days}} Tagen ab. Plus ist permanente Cloud: jeder Track bleibt in der Library, inkl. Stems.",
    it: "Su Pro l'hosting dura {{days}} giorni. Plus è cloud permanente: ogni traccia resta in Library, stems inclusi.",
    nl: "Op Pro verloopt hosting na {{days}} dagen. Plus is permanente cloud: elke track blijft in Library, incl. stems.",
    ar: "في Pro تنتهي الاستضافة بعد {{days}} يومًا. Plus سحابة دائمة: كل مقطع يبقى في Library مع الـ stems.",
    ja: "Proは{{days}}日で期限切れ。Plusは永久クラウド：全トラックがLibraryに、ステム込み。",
    ko: "Pro는 {{days}}일 후 만료. Plus는 영구 클라우드: 모든 트랙이 Library에, 스템 포함.",
    tr: "Pro'da barındırma {{days}} gün. Plus kalıcı bulut: her parça Library'de, stem dahil.",
    hi: "Pro पर {{days}} दिन होस्टिंग। Plus स्थायी क्लाउड: हर ट्रैक Library में, stems सहित।",
    zh: "Pro 托管 {{days}} 天。Plus 为永久云空间：所有作品保留在曲库，含分轨。",
    th: "Pro โฮสต์ {{days}} วัน Plus คือคลาวด์ถาวร: ทุกแทร็กอยู่ใน Library พร้อม stems",
  }),
  leadStudio: L({
    en: "On Studio, hosting expires after {{days}} days. Plus removes the countdown — generate freely, your catalog stays online forever (while subscribed).",
    fr: "En Studio, tes sons expirent après {{days}} jours. Avec Plus, fini le compte à rebours : tu génères librement, ton catalogue reste en ligne sans limite.",
    es: "En Studio, el audio caduca a los {{days}} días. Con Plus, sin cuenta atrás: creas libremente y tu catálogo permanece en línea.",
    pt: "No Studio, o áudio expira em {{days}} dias. Com Plus, sem contagem regressiva: crie à vontade, catálogo sempre online.",
    de: "Bei Studio läuft Audio nach {{days}} Tagen ab. Mit Plus kein Countdown mehr: frei produzieren, Katalog dauerhaft online.",
    it: "Su Studio l'audio scade dopo {{days}} giorni. Con Plus niente countdown: crei liberamente, catalogo sempre online.",
    nl: "Op Studio verloopt audio na {{days}} dagen. Met Plus geen countdown: vrij maken, catalogus blijft online.",
    ar: "في Studio ينتهي الصوت بعد {{days}} يومًا. مع Plus لا عدّ تنازلي: أنتج بحرية ويبقى كتالوجك متاحًا.",
    ja: "Studioは{{days}}日で期限切れ。Plusでカウントダウンなし：自由に生成、カタログは常時オンライン。",
    ko: "Studio는 {{days}}일 후 만료. Plus는 카운트다운 없음: 자유롭게 생성, 카탈로그 상시 온라인.",
    tr: "Studio'da ses {{days}} gün sonra biter. Plus ile geri sayım yok: özgürce üret, katalog hep çevrimiçi.",
    hi: "Studio पर {{days}} दिन बाद समाप्त। Plus पर कोई काउंटडाउन नहीं: आज़ादी से जनरेट करें, कैटलॉग ऑनलाइन रहे।",
    zh: "Studio {{days}} 天后过期。Plus 取消倒计时：自由创作，曲库持续在线。",
    th: "Studio หมดอายุ {{days}} วัน Plus ไม่มีนับถอยหลัง: สร้างได้เต็มที่ คatalog ออนไลน์เสมอ",
  }),
  bulletCloud: L({
    en: "Generate without wondering if it'll expire",
    fr: "Génère sans te demander si ça va expirer",
    es: "Crea sin preguntarte si caducará",
    pt: "Crie sem pensar em expiração",
    de: "Produzieren ohne Ablauf-Stress",
    it: "Crea senza pensare alla scadenza",
    nl: "Maken zonder expiratie-stress",
    ar: "أنتج دون القلق من انتهاء الصلاحية",
    ja: "期限を気にせず生成",
    ko: "만료 걱정 없이 생성",
    tr: "Süre dolacak mı diye düşünmeden üret",
    hi: "एक्सपायरी की चिंता किए बिना जनरेट करें",
    zh: "无需担心过期，只管创作",
    th: "สร้างได้โดยไม่ต้องกังวลเรื่องหมดอายุ",
  }),
  bulletKeepAll: L({
    en: "Your full Library stays playable",
    fr: "Toute ta Library reste jouable",
    es: "Toda tu Library sigue reproducible",
    pt: "Toda a Library continua tocável",
    de: "Deine Library bleibt voll abspielbar",
    it: "Tutta la Library resta riproducibile",
    nl: "Je hele Library blijft afspeelbaar",
    ar: "مكتبتك كاملة تبقى قابلة للتشغيل",
    ja: "Library全体がずっと再生可能",
    ko: "Library 전체가 계속 재생 가능",
    tr: "Tüm Library çalınabilir kalır",
    hi: "पूरी Library चलती रहती है",
    zh: "曲库全部作品始终可播放",
    th: "ไลบรารีทั้งหมดเล่นได้เสมอ",
  }),
  bulletPermanent: L({
    en: "Permanent hosted links while on Plus",
    fr: "Liens audio stables tant que tu es sur Plus",
    es: "Enlaces estables mientras estés en Plus",
    pt: "Links estáveis enquanto estiver no Plus",
    de: "Stabile Links mit Plus-Abo",
    it: "Link stabili con abbonamento Plus",
    nl: "Stabiele links zolang je Plus hebt",
    ar: "روابط ثابتة طالما أنت على Plus",
    ja: "Plus加入中は安定ホストリンク",
    ko: "Plus 구독 중 안정적인 호스팅 링크",
    tr: "Plus'tayken kalıcı barındırma linkleri",
    hi: "Plus पर स्थायी होस्टेड लिंक",
    zh: "订阅 Plus 期间链接稳定可用",
    th: "ลิงก์โฮสต์คงที่ตราบใดที่สมัคร Plus",
  }),
  bulletStems: L({
    en: "Stems ZIP + studio mastering included",
    fr: "Stems ZIP + mastering studio inclus",
    es: "Stems ZIP + mastering de estudio incluidos",
    pt: "Stems ZIP + mastering de estúdio inclusos",
    de: "Stems-ZIP + Studio-Mastering inklusive",
    it: "Stems ZIP + mastering studio inclusi",
    nl: "Stems ZIP + studio-mastering inbegrepen",
    ar: "Stems ZIP وماسترينغ استوديو مشمول",
    ja: "Stems ZIP + スタジオマスタリング込み",
    ko: "Stems ZIP + 스튜디오 마스터링 포함",
    tr: "Stems ZIP + stüdyo mastering dahil",
    hi: "Stems ZIP + स्टूडियो मास्टरिंग शामिल",
    zh: "含 Stems ZIP 与工作室母带",
    th: "รวม Stems ZIP และสตูดิโอมาสเตอร์",
  }),
  ctaPlus: L({
    en: "Keep my catalog online",
    fr: "Garder mon catalogue en ligne",
    es: "Mantener mi catálogo en línea",
    pt: "Manter meu catálogo online",
    de: "Katalog dauerhaft online halten",
    it: "Tieni il catalogo online",
    nl: "Catalogus online houden",
    ar: "إبقاء كتالوجي متاحًا",
    ja: "カタログを常時オンラインに",
    ko: "카탈로그 온라인 유지",
    tr: "Kataloğumu çevrimiçi tut",
    hi: "मेरा कैटलॉग ऑनलाइन रखें",
    zh: "让我的曲库常驻在线",
    th: "เก็บคatalog ออนไลน์",
  }),
  ctaLibrary: L({
    en: "See what expired",
    fr: "Voir ce qui a expiré",
    es: "Ver lo caducado",
    pt: "Ver o que expirou",
    de: "Abgelaufenes ansehen",
    it: "Vedi cosa è scaduto",
    nl: "Bekijk wat verlopen is",
    ar: "عرض ما انتهى",
    ja: "期限切れを確認",
    ko: "만료된 항목 보기",
    tr: "Süresi dolanları gör",
    hi: "एक्सपायर हुआ देखें",
    zh: "查看已过期作品",
    th: "ดูรายการที่หมดอายุ",
  }),
  dismiss: L({
    en: "I'll risk losing tracks",
    fr: "Je prends le risque",
    es: "Asumo el riesgo",
    pt: "Assumo o risco",
    de: "Ich riskiere es",
    it: "Accetto il rischio",
    nl: "Ik neem het risico",
    ar: "أتحمل المخاطرة",
    ja: "リスクを受け入れる",
    ko: "위험을 감수할게요",
    tr: "Riski kabul ediyorum",
    hi: "जोखिम उठाता हूँ",
    zh: "我愿意承担风险",
    th: "ยอมรับความเสี่ยง",
  }),
  close: L({
    en: "Close",
    fr: "Fermer",
    es: "Cerrar",
    pt: "Fechar",
    de: "Schließen",
    it: "Chiudi",
    nl: "Sluiten",
    ar: "إغلاق",
    ja: "閉じる",
    ko: "닫기",
    tr: "Kapat",
    hi: "बंद करें",
    zh: "关闭",
    th: "ปิด",
  }),
  stripeFooter: L({
    en: "Secure checkout · cancel anytime",
    fr: "Paiement sécurisé · annulable à tout moment",
    es: "Pago seguro · cancela cuando quieras",
    pt: "Pagamento seguro · cancele quando quiser",
    de: "Sicherer Checkout · jederzeit kündbar",
    it: "Checkout sicuro · annulla quando vuoi",
    nl: "Veilige checkout · altijd opzegbaar",
    ar: "دفع آمن · إلغاء في أي وقت",
    ja: "安全な決済 · いつでも解約",
    ko: "안전한 결제 · 언제든 해지",
    tr: "Güvenli ödeme · istediğin zaman iptal",
    hi: "सुरक्षित चेकआउट · कभी भी रद्द",
    zh: "安全结账 · 随时取消",
    th: "ชำระเงินปลอดภัย · ยกเลิกได้ทุกเมื่อ",
  }),
  openingCheckout: L({
    en: "Opening checkout…",
    fr: "Ouverture du paiement…",
    es: "Abriendo pago…",
    pt: "Abrindo pagamento…",
    de: "Checkout wird geöffnet…",
    it: "Apertura checkout…",
    nl: "Checkout openen…",
    ar: "جارٍ فتح الدفع…",
    ja: "決済を開いています…",
    ko: "결제 여는 중…",
    tr: "Ödeme açılıyor…",
    hi: "चेकआउट खुल रहा है…",
    zh: "正在打开结账…",
    th: "กำลังเปิดชำระเงิน…",
  }),
} as const;

function i(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), String(value)),
    template,
  );
}

export type AudioRetentionModalCopy = {
  eyebrow: string;
  title: string;
  lead: string;
  bullets: string[];
  ctaPlus: string;
  ctaLibrary: string;
  dismiss: string;
  close: string;
  stripeFooter: string;
  openingCheckout: string;
};

export function buildAudioRetentionModalCopy(
  locale: AppLocale,
  expiredCount: number,
  plan: string,
): AudioRetentionModalCopy {
  const cur = normalizePlanId(plan);
  const plural = expiredCount > 1 ? "s" : "";
  const title = i(pickL(COPY.title, locale), { count: expiredCount, plural });

  const leadKey =
    cur === "free" ? COPY.leadFree : cur === "pro" ? COPY.leadPro : COPY.leadStudio;
  const leadDays =
    cur === "free"
      ? LOOP_AUDIO_RETENTION_DAYS_FREE
      : cur === "pro"
        ? LOOP_AUDIO_RETENTION_DAYS_PRO
        : LOOP_AUDIO_RETENTION_DAYS_STUDIO;
  const lead = i(pickL(leadKey, locale), { days: leadDays });

  return {
    eyebrow: pickL(COPY.eyebrow, locale),
    title,
    lead,
    bullets: [
      pickL(COPY.bulletCloud, locale),
      pickL(COPY.bulletKeepAll, locale),
      pickL(COPY.bulletPermanent, locale),
      pickL(COPY.bulletStems, locale),
    ],
    ctaPlus: pickL(COPY.ctaPlus, locale),
    ctaLibrary: pickL(COPY.ctaLibrary, locale),
    dismiss: pickL(COPY.dismiss, locale),
    close: pickL(COPY.close, locale),
    stripeFooter: pickL(COPY.stripeFooter, locale),
    openingCheckout: pickL(COPY.openingCheckout, locale),
  };
}
