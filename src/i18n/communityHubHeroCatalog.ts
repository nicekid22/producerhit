import type { AppLocale } from "./config";
import { L, pickL } from "./localized";
import type { CommunityVibeCategory } from "@/lib/communityHub";

function i(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(vars[key] ?? ""));
}

const HUB = {
  title: L({
    en: "The Feed", fr: "Le Flux", es: "El Feed", pt: "O Feed", de: "Der Feed", it: "Il Feed", nl: "De Feed",
    ar: "الفيد", ja: "フィード", ko: "피드", tr: "Akış", hi: "फ़ीड", zh: "动态", th: "ฟีด",
  }),
  hook: L({
    en: "AI streaming by the people, for the people.",
    fr: "Streaming IA par le peuple, pour le peuple.",
    es: "Streaming IA del pueblo, para el pueblo.", pt: "Streaming IA do povo, para o povo.", de: "KI-Streaming von den Leuten, für die Leute.",
    it: "Streaming IA dal popolo, per il popolo.", nl: "AI-streaming door het volk, voor het volk.", ar: "بث ذكاء اصطناعي من الناس، للناس.",
    ja: "人々による、人々のためのAIストリーミング。", ko: "사람들에 의한, 사람들을 위한 AI 스트리밍.", tr: "Halktan halka yapay zeka yayını.",
    hi: "लोगों द्वारा, लोगों के लिए AI स्ट्रीमिंग।", zh: "人民创造、人民享用的 AI 流媒体。", th: "สตรีม AI โดยคน สำหรับคน",
  }),
  tagline: L({
    en: "Beats dropped by the community. Listen, comment, remix — your turn. Not corporate fluff: a feed that actually moves.",
    fr: "Des beats drop par la commu. Écoute, commente, remix — c'est ton tour. Pas une app corporate : un flux qui vit.",
    es: "Beats de la comunidad. Escucha, comenta, remix — te toca. No es corporativo: un feed que vive.", pt: "Beats da comunidade. Ouça, comente, remix — sua vez. Sem corporate: um feed que pulsa.",
    de: "Beats von der Community. Hören, kommentieren, remixen — du bist dran. Kein Corporate-Fluff: ein Feed, der lebt.",
    it: "Beat dalla community. Ascolta, commenta, remix — tocca a te. Niente corporate: un feed che vive.", nl: "Beats van de community. Luister, reageer, remix — jij bent aan de beurt. Geen corporate fluff: een feed die leeft.",
    ar: "beats من المجتمع. استمع، علّق، remix — دورك. ليس تطبيقاً مؤسسياً: فيد حي.", ja: "コミュニティがdropしたビート。聴いて、コメント、リミックス — あなたの番。コーポレートじゃない、生きたフィード。",
    ko: "커뮤니티가 drop한 비트. 듣고, 댓글, 리믹스 — 당신 차례. 기업용이 아닌 살아있는 피드.", tr: "Topluluktan beatler. Dinle, yorum yap, remix — sıra sende. Kurumsal değil: canlı bir akış.",
    hi: "कम्युनिटी के beats। सुनें, कमेंट, remix — आपकी बारी। कॉर्पोरेट नहीं: जीवंत फ़ीड।", zh: "社区 drop 的节拍。收听、评论、混音 — 轮到你了。不是企业套话：真正活跃的动态。", th: "บีตจากชุมชน ฟัง คอมเมนต์ รีมิกซ์ — ถึงคุณแล้ว ไม่ใช่แอปองกรณ์: ฟีดที่มีชีวิต",
  }),
  ctaPrimary: L({
    en: "Drop your track", fr: "Drop ton son", es: "Drop tu track", pt: "Drop sua faixa", de: "Drop deinen Track", it: "Drop la tua traccia", nl: "Drop je track",
    ar: "أطلق مقطعك", ja: "トラックをdrop", ko: "트랙 drop", tr: "Parçanı drop et", hi: "अपना ट्रैक drop करें", zh: "Drop 你的曲目", th: "drop เพลงของคุณ",
  }),
  ctaShuffle: L({
    en: "Surprise me", fr: "Surprends-moi", es: "Sorpréndeme", pt: "Me surpreenda", de: "Überrasch mich", it: "Sorprendimi", nl: "Verras me",
    ar: "فاجئني", ja: "おまかせ", ko: "깜짝 추천", tr: "Şaşırt beni", hi: "सरप्राइज़ करें", zh: "随机惊喜", th: "เซอร์ไพรส์ฉัน",
  }),
};

const COPY = {
  tracksLive: L({
    en: "tracks live", fr: "sons live", es: "pistas en vivo", pt: "faixas ao vivo", de: "Tracks live", it: "tracce live", nl: "tracks live",
    ar: "مقاطع مباشرة", ja: "ライブトラック", ko: "라이브 트랙", tr: "canlı parça", hi: "लाइव ट्रैक", zh: "首直播", th: "แทร็กสด",
  }),
  today: L({
    en: "today", fr: "aujourd'hui", es: "hoy", pt: "hoje", de: "heute", it: "oggi", nl: "vandaag", ar: "اليوم", ja: "今日", ko: "오늘", tr: "bugün", hi: "आज", zh: "今日", th: "วันนี้",
  }),
  comments: L({
    en: "comments", fr: "coms", es: "comentarios", pt: "comentários", de: "Kommentare", it: "commenti", nl: "reacties", ar: "تعليقات", ja: "コメント", ko: "댓글", tr: "yorum", hi: "कमेंट", zh: "评论", th: "ความคิดเห็น",
  }),
  joinChat: L({
    en: "Join the chat", fr: "Rejoins le chat", es: "Únete al chat", pt: "Entrar no chat", de: "Chat beitreten", it: "Unisciti alla chat", nl: "Join de chat",
    ar: "انضم للدردشة", ja: "チャットに参加", ko: "채팅 참여", tr: "Sohbete katıl", hi: "चैट में शामिल हों", zh: "加入聊天", th: "เข้าร่วมแชท",
  }),
  whatsFeed: L({
    en: "What's the Feed?", fr: "C'est quoi le Flux ?", es: "¿Qué es el Feed?", pt: "O que é o Feed?", de: "Was ist der Feed?", it: "Cos'è il Feed?", nl: "Wat is de Feed?",
    ar: "ما هو الفيد؟", ja: "フィードとは？", ko: "피드란?", tr: "Akış nedir?", hi: "फ़ीड क्या है?", zh: "什么是动态？", th: "ฟีดคืออะไร?",
  }),
  spotlight: L({
    en: "🔥 Community spotlight", fr: "🔥 Spotlight commu", es: "🔥 Spotlight comunidad", pt: "🔥 Spotlight comunidade", de: "🔥 Community-Spotlight", it: "🔥 Spotlight community", nl: "🔥 Community spotlight",
    ar: "🔥 spotlight المجتمع", ja: "🔥 コミュニティスポットライト", ko: "🔥 커뮤니티 스포트라이트", tr: "🔥 Topluluk spotlight", hi: "🔥 कम्युनिटी स्पॉटलाइट", zh: "🔥 社区焦点", th: "🔥 ไฮไลท์ชุมชน",
  }),
  play: L({
    en: "Play", fr: "Écouter", es: "Reproducir", pt: "Ouvir", de: "Abspielen", it: "Ascolta", nl: "Afspelen", ar: "تشغيل", ja: "再生", ko: "재생", tr: "Dinle", hi: "चलाएँ", zh: "播放", th: "เล่น",
  }),
  ariaPlay: L({
    en: "Play {{name}}", fr: "Écouter {{name}}", es: "Reproducir {{name}}", pt: "Ouvir {{name}}", de: "{{name}} abspielen", it: "Ascolta {{name}}", nl: "Speel {{name}}",
    ar: "تشغيل {{name}}", ja: "{{name}} を再生", ko: "{{name}} 재생", tr: "{{name}} dinle", hi: "{{name}} चलाएँ", zh: "播放 {{name}}", th: "เล่น {{name}}",
  }),
  loadingFeed: L({
    en: "Loading the feed…", fr: "Le flux charge…", es: "Cargando el feed…", pt: "Carregando o feed…", de: "Feed lädt…", it: "Caricamento feed…", nl: "Feed laden…",
    ar: "جارٍ تحميل الفيد…", ja: "フィード読み込み中…", ko: "피드 로딩 중…", tr: "Akış yükleniyor…", hi: "फ़ीड लोड…", zh: "加载动态…", th: "กำลังโหลดฟีด…",
  }),
  firstDrop: L({
    en: "Be today's first drop 👀", fr: "Sois le premier drop du jour 👀", es: "Sé el primer drop del día 👀", pt: "Seja o primeiro drop do dia 👀", de: "Sei der erste Drop heute 👀",
    it: "Sii il primo drop di oggi 👀", nl: "Wees de eerste drop vandaag 👀", ar: "كن أول drop اليوم 👀", ja: "今日最初のdropに 👀", ko: "오늘 첫 drop이 되세요 👀",
    tr: "Bugünün ilk drop'u ol 👀", hi: "आज का पहला drop बनें 👀", zh: "成为今日首个 drop 👀", th: "เป็น drop แรกวันนี้ 👀",
  }),
  liveCount: L({
    en: "{{count}} tracks live", fr: "{{count}} sons live", es: "{{count}} pistas en vivo", pt: "{{count}} faixas ao vivo", de: "{{count}} Tracks live", it: "{{count}} tracce live", nl: "{{count}} tracks live",
    ar: "{{count}} مقاطع مباشرة", ja: "ライブ {{count}}曲", ko: "라이브 {{count}}트랙", tr: "{{count}} canlı parça", hi: "{{count}} लाइव ट्रैक", zh: "{{count}} 首直播", th: "{{count}} แทร็กสด",
  }),
};

export function buildCommunityHubHeroCopy(locale: AppLocale) {
  const t = (key: keyof typeof COPY) => pickL(COPY[key], locale);
  return {
    title: pickL(HUB.title, locale),
    hook: pickL(HUB.hook, locale),
    tagline: pickL(HUB.tagline, locale),
    ctaPrimary: pickL(HUB.ctaPrimary, locale),
    ctaShuffle: pickL(HUB.ctaShuffle, locale),
    tracksLive: t("tracksLive"),
    today: t("today"),
    comments: t("comments"),
    joinChat: t("joinChat"),
    whatsFeed: t("whatsFeed"),
    spotlight: t("spotlight"),
    play: t("play"),
    ariaPlay: (name: string) => i(pickL(COPY.ariaPlay, locale), { name }),
    loadingFeed: t("loadingFeed"),
    firstDrop: t("firstDrop"),
    liveCount: (count: number) => i(pickL(COPY.liveCount, locale), { count }),
    categoryTitle: (category: CommunityVibeCategory) =>
      locale === "fr" ? category.title.fr : category.title.en,
    categorySubtitle: (category: CommunityVibeCategory) =>
      locale === "fr" ? category.subtitle.fr : category.subtitle.en,
  };
}
