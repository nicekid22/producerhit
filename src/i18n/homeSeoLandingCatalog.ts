import type { AppLocale } from "./config";
import { L, pickL } from "./localized";
import type { SeoPageConfig } from "@/lib/seoPages";

const COPY = {
  fallbackH1: L({
    en: "AI Beat Generator", fr: "Générateur de beats IA", es: "Generador de beats IA", pt: "Gerador de beats IA", de: "KI-Beat-Generator", it: "Generatore beat IA", nl: "AI beat generator",
    ar: "مولّد beats IA", ja: "AIビートジェネレーター", ko: "AI 비트 생성기", tr: "AI beat üretici", hi: "AI beat जनरेटर", zh: "AI 节拍生成器", th: "ตัวสร้าง AI beat",
  }),
  fallbackLead: L({
    en: "Generate type beats and songs online with ProducerHit.",
    fr: "Génère des type beats et des chansons en ligne avec ProducerHit.",
    es: "Genera type beats y canciones online con ProducerHit.",
    pt: "Gere type beats e músicas online com ProducerHit.",
    de: "Erstelle Type Beats und Songs online mit ProducerHit.",
    it: "Genera type beat e brani online con ProducerHit.",
    nl: "Genereer type beats en songs online met ProducerHit.",
    ar: "أنشئ type beats وأغاني عبر الإنترنت مع ProducerHit.",
    ja: "ProducerHitでtype beatと曲をオンライン生成。",
    ko: "ProducerHit으로 type beat와 곡을 온라인에서 생성하세요.",
    tr: "ProducerHit ile type beat ve şarkıları çevrimiçi oluştur.",
    hi: "ProducerHit के साथ type beats और गाने ऑनलाइन बनाएँ।",
    zh: "使用 ProducerHit 在线生成 type beat 和歌曲。",
    th: "สร้าง type beat และเพลงออนไลน์ด้วย ProducerHit",
  }),
  fallbackBullet: L({
    en: "Fast AI music generation", fr: "Génération IA rapide", es: "Generación IA rápida", pt: "Geração IA rápida", de: "Schnelle KI-Musikgenerierung", it: "Generazione IA rapida", nl: "Snelle AI-muziekgeneratie",
    ar: "توليد موسيقى IA سريع", ja: "高速AI音楽生成", ko: "빠른 AI 음악 생성", tr: "Hızlı AI müzik üretimi", hi: "तेज़ AI संगीत जनration", zh: "快速 AI 音乐生成", th: "สร้างเพลง AI เร็ว",
  }),
  suggestedPrompt: L({
    en: "Suggested prompt", fr: "Prompt recommandé", es: "Prompt sugerido", pt: "Prompt sugerido", de: "Empfohlener Prompt", it: "Prompt consigliato", nl: "Aanbevolen prompt",
    ar: "موجه مقترح", ja: "おすすめプロンプト", ko: "추천 프롬프트", tr: "Önerilen prompt", hi: "सुझाया गया prompt", zh: "推荐提示词", th: "พรอมต์แนะนำ",
  }),
  tryNow: L({
    en: "Try it now — free", fr: "Essaye maintenant — gratuit", es: "Pruébalo ahora — gratis", pt: "Experimente agora — grátis", de: "Jetzt testen — kostenlos", it: "Provalo ora — gratis", nl: "Probeer nu — gratis",
    ar: "جرّب الآن — مجاناً", ja: "今すぐ試す — 無料", ko: "지금 무료로 체험", tr: "Hemen dene — ücretsiz", hi: "अभी आज़माएँ — मुफ़्त", zh: "立即免费试用", th: "ลองเลย — ฟรี",
  }),
  tryNowLead: L({
    en: "Start with a short generation, switch Versions=2, then click Variation on the best result.",
    fr: "Commence par une génération courte, active Versions=2, puis clique sur Variation sur le meilleur résultat.",
    es: "Empieza con una generación corta, activa Versions=2 y haz clic en Variation en el mejor resultado.",
    pt: "Comece com uma geração curta, ative Versions=2 e clique em Variation no melhor resultado.",
    de: "Starte mit einer kurzen Generierung, aktiviere Versions=2 und klicke Variation beim besten Ergebnis.",
    it: "Inizia con una generazione breve, attiva Versions=2 e clicca Variation sul miglior risultato.",
    nl: "Begin met een korte generatie, zet Versions=2 aan en klik Variation op het beste resultaat.",
    ar: "ابدأ بتوليد قصير، فعّل Versions=2 ثم انقر Variation على أفضل نتيجة.",
    ja: "短い生成から始め、Versions=2をオンにし、最高の結果でVariationをクリック。",
    ko: "짧은 생성으로 시작하고 Versions=2를 켠 뒤 최고 결과에서 Variation을 클릭하세요.",
    tr: "Kısa bir üretimle başla, Versions=2'yi aç ve en iyi sonuçta Variation'a tıkla.",
    hi: "छोटी generation से शुरू करें, Versions=2 चालू करें, फिर सर्वश्रेष्ठ पर Variation क्लिक करें।",
    zh: "先做短生成，开启 Versions=2，然后在最佳结果上点击 Variation。",
    th: "เริ่มด้วยการสร้างสั้น ๆ เปิด Versions=2 แล้วคลิก Variation บนผลลัพธ์ที่ดีที่สุด",
  }),
  openGenerator: L({
    en: "Open generator", fr: "Ouvrir le générateur", es: "Abrir generador", pt: "Abrir gerador", de: "Generator öffnen", it: "Apri generatore", nl: "Generator openen",
    ar: "فتح المولّد", ja: "ジェネレーターを開く", ko: "생성기 열기", tr: "Üreticiyi aç", hi: "जनरेटर खोलें", zh: "打开生成器", th: "เปิดตัวสร้าง",
  }),
  startFree: L({
    en: "Start free", fr: "Commencer gratuitement", es: "Empezar gratis", pt: "Começar grátis", de: "Kostenlos starten", it: "Inizia gratis", nl: "Gratis starten",
    ar: "ابدأ مجاناً", ja: "無料で始める", ko: "무료로 시작", tr: "Ücretsiz başla", hi: "मुफ़्त शुरू करें", zh: "免费开始", th: "เริ่มฟรี",
  }),
  viewPlans: L({
    en: "View plans", fr: "Voir les plans", es: "Ver planes", pt: "Ver planos", de: "Pläne ansehen", it: "Vedi piani", nl: "Bekijk plannen",
    ar: "عرض الخطط", ja: "プランを見る", ko: "플랜 보기", tr: "Planları gör", hi: "प्लान देखें", zh: "查看方案", th: "ดูแผน",
  }),
  exploreCommunity: L({
    en: "Explore community", fr: "Explorer la communauté", es: "Explorar comunidad", pt: "Explorar comunidade", de: "Community entdecken", it: "Esplora community", nl: "Community verkennen",
    ar: "استكشف المجتمع", ja: "コミュニティを探索", ko: "커뮤니티 탐색", tr: "Topluluğu keşfet", hi: "कम्युनिटी देखें", zh: "探索社区", th: "สำรวจชุมชน",
  }),
  moreGenerators: L({
    en: "More AI generators", fr: "Autres générateurs IA", es: "Más generadores IA", pt: "Mais geradores IA", de: "Weitere KI-Generatoren", it: "Altri generatori IA", nl: "Meer AI-generators",
    ar: "مزيد من مولّدات IA", ja: "その他のAIジェネレーター", ko: "더 많은 AI 생성기", tr: "Daha fazla AI üretici", hi: "और AI जनरेटर", zh: "更多 AI 生成器", th: "ตัวสร้าง AI เพิ่มเติม",
  }),
};

/** SEO landing pages still store FR/EN body copy — map locale to the best available variant. */
export function seoContentLocale(locale: AppLocale): "fr" | "en" {
  return locale === "fr" ? "fr" : "en";
}

export function resolveSeoPageContent(seo: SeoPageConfig | null, locale: AppLocale) {
  const useFr = seoContentLocale(locale) === "fr";
  if (!seo) {
    return {
      h1: pickL(COPY.fallbackH1, locale),
      lead: pickL(COPY.fallbackLead, locale),
      bullets: [pickL(COPY.fallbackBullet, locale)],
      faq: [] as { q: string; a: string }[],
      promptHint: null as string | null,
    };
  }
  return {
    h1: useFr ? seo.h1Fr : seo.h1En,
    lead: useFr ? seo.leadFr : seo.leadEn,
    bullets: useFr ? seo.bulletsFr : seo.bulletsEn,
    faq: useFr ? seo.faqFr : seo.faqEn,
    promptHint: useFr ? (seo.promptHintFr ?? null) : (seo.promptHintEn ?? null),
  };
}

export function buildHomeSeoLandingCopy(locale: AppLocale) {
  const t = (key: keyof typeof COPY) => pickL(COPY[key], locale);
  return {
    suggestedPrompt: t("suggestedPrompt"),
    tryNow: t("tryNow"),
    tryNowLead: t("tryNowLead"),
    openGenerator: t("openGenerator"),
    startFree: t("startFree"),
    viewPlans: t("viewPlans"),
    exploreCommunity: t("exploreCommunity"),
    moreGenerators: t("moreGenerators"),
  };
}
