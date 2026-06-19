import type { AppLocale } from "./config";
import { L, pickL } from "./localized";

function i(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(vars[key] ?? ""));
}

const COPY = {
  live: L({
    en: "Live", fr: "Live", es: "En vivo", pt: "Ao vivo", de: "Live", it: "Live", nl: "Live",
    ar: "مباشر", ja: "ライブ", ko: "라이브", tr: "Canlı", hi: "लाइव", zh: "直播", th: "สด",
  }),
  tracks: L({
    en: "tracks", fr: "tracks", es: "pistas", pt: "faixas", de: "Tracks", it: "tracce", nl: "tracks",
    ar: "مقاطع", ja: "トラック", ko: "트랙", tr: "parça", hi: "ट्रैक", zh: "曲目", th: "แทร็ก",
  }),
  shuffle: L({
    en: "Shuffle", fr: "Aléatoire", es: "Aleatorio", pt: "Aleatório", de: "Zufall", it: "Casuale", nl: "Shuffle",
    ar: "عشوائي", ja: "シャッフル", ko: "셔플", tr: "Karışık", hi: "शफ़ल", zh: "随机", th: "สุ่ม",
  }),
  fullCommunity: L({
    en: "Full community", fr: "Toute la communauté", es: "Toda la comunidad", pt: "Comunidade completa", de: "Ganze Community",
    it: "Tutta la community", nl: "Hele community", ar: "المجتمع كامل", ja: "コミュニティ全体", ko: "전체 커뮤니티",
    tr: "Tüm topluluk", hi: "पूरी कम्युनिटी", zh: "完整社区", th: "ชุมชนทั้งหมด",
  }),
  previous: L({
    en: "Previous", fr: "Précédent", es: "Anterior", pt: "Anterior", de: "Zurück", it: "Precedente", nl: "Vorige",
    ar: "السابق", ja: "前へ", ko: "이전", tr: "Önceki", hi: "पिछला", zh: "上一个", th: "ก่อนหน้า",
  }),
  next: L({
    en: "Next", fr: "Suivant", es: "Siguiente", pt: "Próximo", de: "Weiter", it: "Successivo", nl: "Volgende",
    ar: "التالي", ja: "次へ", ko: "다음", tr: "Sonraki", hi: "अगला", zh: "下一个", th: "ถัดไป",
  }),
  newBadge: L({
    en: "New", fr: "Nouveau", es: "Nuevo", pt: "Novo", de: "Neu", it: "Nuovo", nl: "Nieuw",
    ar: "جديد", ja: "新着", ko: "신규", tr: "Yeni", hi: "नया", zh: "新", th: "ใหม่",
  }),
  pause: L({
    en: "Pause", fr: "Pause", es: "Pausa", pt: "Pausar", de: "Pause", it: "Pausa", nl: "Pauze",
    ar: "إيقاف", ja: "一時停止", ko: "일시정지", tr: "Duraklat", hi: "रोकें", zh: "暂停", th: "หยุดชั่วคราว",
  }),
  listen: L({
    en: "Listen", fr: "Écouter", es: "Escuchar", pt: "Ouvir", de: "Anhören", it: "Ascolta", nl: "Luister",
    ar: "استمع", ja: "再生", ko: "듣기", tr: "Dinle", hi: "सुनें", zh: "收听", th: "ฟัง",
  }),
  remix: L({
    en: "Remix", fr: "Remixer", es: "Remix", pt: "Remix", de: "Remix", it: "Remix", nl: "Remix",
    ar: "ريمiks", ja: "リミックス", ko: "리믹스", tr: "Remix", hi: "रीमिक्स", zh: "混音", th: "รีมิกซ์",
  }),
  emptyTitle: L({
    en: "No audio previews right now", fr: "Aucun aperçu audio pour le moment", es: "Sin vistas previas de audio ahora",
    pt: "Sem prévias de áudio no momento", de: "Keine Audio-Vorschauen gerade", it: "Nessuna anteprima audio al momento",
    nl: "Geen audio-previews nu", ar: "لا معاينات صوتية حالياً", ja: "現在オーディオプレビューなし", ko: "지금 오디오 미리보기 없음",
    tr: "Şu an ses önizlemesi yok", hi: "अभी कोई ऑडियो प्रीव्यू नहीं", zh: "暂无音频预览", th: "ยังไม่มีตัวอย่างเสียง",
  }),
  emptyHint: L({
    en: "Public tracks show up here as soon as they're ready.",
    fr: "Les tracks publiques apparaissent ici dès qu'elles sont prêtes.",
    es: "Las pistas públicas aparecen aquí en cuanto estén listas.",
    pt: "Faixas públicas aparecem aqui assim que estiverem prontas.",
    de: "Öffentliche Tracks erscheinen hier, sobald sie bereit sind.",
    it: "Le tracce pubbliche compaiono qui appena pronte.",
    nl: "Publieke tracks verschijnen hier zodra ze klaar zijn.",
    ar: "المقاطع العامة تظهر هنا فور جاهزيتها.",
    ja: "公開トラックは準備でき次第ここに表示されます。",
    ko: "공개 트랙은 준비되면 여기에 표시됩니다.",
    tr: "Herkese açık parçalar hazır olunca burada görünür.",
    hi: "सार्वजनिक ट्रैक तैयार होते ही यहाँ दिखेंगे।",
    zh: "公开曲目就绪后会显示在这里。",
    th: "แทร็กสาธารณะจะแสดงที่นี่เมื่อพร้อม",
  }),
  refresh: L({
    en: "Refresh", fr: "Rafraîchir", es: "Actualizar", pt: "Atualizar", de: "Aktualisieren", it: "Aggiorna", nl: "Vernieuwen",
    ar: "تحديث", ja: "更新", ko: "새로고침", tr: "Yenile", hi: "रीफ़्रेश", zh: "刷新", th: "รีเฟรช",
  }),
  trackNavigation: L({
    en: "Track navigation", fr: "Navigation des tracks", es: "Navegación de pistas", pt: "Navegação de faixas",
    de: "Track-Navigation", it: "Navigazione tracce", nl: "Tracknavigatie", ar: "تنقل المقاطع", ja: "トラックナビ",
    ko: "트랙 탐색", tr: "Parça gezinme", hi: "ट्रैक नेविगेशन", zh: "曲目导航", th: "นำทางแทร็ก",
  }),
  scrollHint: L({
    en: "Keep scrolling — more tracks loading",
    fr: "Continue à défiler — d'autres tracks arrivent",
    es: "Sigue desplazando — cargando más pistas",
    pt: "Continue rolando — mais faixas carregando",
    de: "Weiterscrollen — weitere Tracks laden",
    it: "Continua a scorrere — altre tracce in arrivo",
    nl: "Blijf scrollen — meer tracks laden",
    ar: "تابع التمرير — المزيد من المقاطع قادمة",
    ja: "スクロールを続ける — さらにトラックを読み込み中",
    ko: "스크롤 계속 — 더 많은 트랙 로딩 중",
    tr: "Kaydırmaya devam et — daha fazla parça yükleniyor",
    hi: "स्क्रॉल जारी रखें — और ट्रैक लोड हो रहे हैं",
    zh: "继续滑动 — 加载更多曲目",
    th: "เลื่อนต่อ — กำลังโหลดแทร็กเพิ่ม",
  }),
  ariaPause: L({
    en: "Pause {{name}}", fr: "Pause {{name}}", es: "Pausar {{name}}", pt: "Pausar {{name}}", de: "{{name}} pausieren",
    it: "Pausa {{name}}", nl: "Pauzeer {{name}}", ar: "إيقاف {{name}}", ja: "{{name}} を一時停止", ko: "{{name}} 일시정지",
    tr: "{{name}} duraklat", hi: "{{name}} रोकें", zh: "暂停 {{name}}", th: "หยุด {{name}}",
  }),
  ariaPlay: L({
    en: "Play {{name}}", fr: "Écouter {{name}}", es: "Reproducir {{name}}", pt: "Ouvir {{name}}", de: "{{name}} abspielen",
    it: "Ascolta {{name}}", nl: "Speel {{name}}", ar: "تشغيل {{name}}", ja: "{{name}} を再生", ko: "{{name}} 재생",
    tr: "{{name}} dinle", hi: "{{name}} चलाएँ", zh: "播放 {{name}}", th: "เล่น {{name}}",
  }),
};

export function buildLandingCommunityRailCopy(locale: AppLocale) {
  const t = (key: keyof typeof COPY) => pickL(COPY[key], locale);
  return {
    live: t("live"),
    tracks: t("tracks"),
    shuffle: t("shuffle"),
    fullCommunity: t("fullCommunity"),
    previous: t("previous"),
    next: t("next"),
    newBadge: t("newBadge"),
    pause: t("pause"),
    listen: t("listen"),
    remix: t("remix"),
    emptyTitle: t("emptyTitle"),
    emptyHint: t("emptyHint"),
    refresh: t("refresh"),
    trackNavigation: t("trackNavigation"),
    scrollHint: t("scrollHint"),
    ariaPause: (name: string) => i(pickL(COPY.ariaPause, locale), { name }),
    ariaPlay: (name: string) => i(pickL(COPY.ariaPlay, locale), { name }),
  };
}
