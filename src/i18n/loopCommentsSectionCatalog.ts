import type { AppLocale } from "./config";
import { L, pickL } from "./localized";

function i(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(vars[key] ?? ""));
}

const COPY = {
  loginToComment: L({
    en: "Login to comment", fr: "Connecte-toi pour commenter", es: "Inicia sesión para comentar", pt: "Entre para comentar",
    de: "Anmelden zum Kommentieren", it: "Accedi per commentare", nl: "Log in om te reageren", ar: "سجّل الدخول للتعليق",
    ja: "コメントするにはログイン", ko: "댓글을 달려면 로그인", tr: "Yorum için giriş yap", hi: "कमेंट के लिए लॉगिन", zh: "登录后评论", th: "เข้าสู่ระบบเพื่อแสดงความคิดเห็น",
  }),
  commentPosted: L({
    en: "Comment posted", fr: "Commentaire publié", es: "Comentario publicado", pt: "Comentário publicado", de: "Kommentar veröffentlicht",
    it: "Commento pubblicato", nl: "Reactie geplaatst", ar: "تم نشر التعليق", ja: "コメントを投稿しました", ko: "댓글 게시됨",
    tr: "Yorum yayınlandı", hi: "कमेंट पोस्ट", zh: "评论已发布", th: "โพสต์ความคิดเห็นแล้ว",
  }),
  couldNotPost: L({
    en: "Could not post", fr: "Impossible de publier", es: "No se pudo publicar", pt: "Não foi possível publicar", de: "Veröffentlichen fehlgeschlagen",
    it: "Impossibile pubblicare", nl: "Plaatsen mislukt", ar: "تعذّر النشر", ja: "投稿できませんでした", ko: "게시 실패",
    tr: "Yayınlanamadı", hi: "पोस्ट नहीं हो सका", zh: "无法发布", th: "โพสต์ไม่สำเร็จ",
  }),
  actionFailed: L({
    en: "Action failed", fr: "Action impossible", es: "Acción fallida", pt: "Ação falhou", de: "Aktion fehlgeschlagen",
    it: "Azione fallita", nl: "Actie mislukt", ar: "فشل الإجراء", ja: "操作に失敗", ko: "작업 실패", tr: "İşlem başarısız", hi: "कार्रवाई विफल", zh: "操作失败", th: "ดำเนินการไม่สำเร็จ",
  }),
  comment: L({
    en: "Comment", fr: "Commenter", es: "Comentar", pt: "Comentar", de: "Kommentieren", it: "Commenta", nl: "Reageer",
    ar: "علّق", ja: "コメント", ko: "댓글", tr: "Yorum yap", hi: "कमेंट", zh: "评论", th: "แสดงความคิดเห็น",
  }),
  commentsCount: L({
    en: "{{count}} comment", fr: "{{count}} commentaire", es: "{{count}} comentario", pt: "{{count}} comentário", de: "{{count}} Kommentar",
    it: "{{count}} commento", nl: "{{count}} reactie", ar: "{{count}} تعليق", ja: "コメント {{count}}件", ko: "댓글 {{count}}개",
    tr: "{{count}} yorum", hi: "{{count}} कमेंट", zh: "{{count}} 条评论", th: "{{count}} ความคิดเห็น",
  }),
  commentsCountPlural: L({
    en: "{{count}} comments", fr: "{{count}} commentaires", es: "{{count}} comentarios", pt: "{{count}} comentários", de: "{{count}} Kommentare",
    it: "{{count}} commenti", nl: "{{count}} reacties", ar: "{{count}} تعليقات", ja: "コメント {{count}}件", ko: "댓글 {{count}}개",
    tr: "{{count}} yorum", hi: "{{count}} कमेंट", zh: "{{count}} 条评论", th: "{{count}} ความคิดเห็น",
  }),
  liveComments: L({
    en: "Live comments", fr: "Commentaires live", es: "Comentarios en vivo", pt: "Comentários ao vivo", de: "Live-Kommentare",
    it: "Commenti live", nl: "Live reacties", ar: "تعليقات مباشرة", ja: "ライブコメント", ko: "실시간 댓글", tr: "Canlı yorumlar", hi: "लाइव कमेंट", zh: "实时评论", th: "ความคิดเห็นสด",
  }),
  feedHint: L({
    en: "Join the convo — react, challenge, remix.", fr: "Rejoins la conv — réagis, challenge, remixe.",
    es: "Únete — reacciona, reta, remixea.", pt: "Entre na conversa — reaja, desafie, remixe.", de: "Mach mit — reagieren, challengen, remixen.",
    it: "Unisciti — reagisci, sfida, remix.", nl: "Doe mee — reageer, daag uit, remix.", ar: "انضم — تفاعل، تحدّ، remix.",
    ja: "参加して — 反応、チャレンジ、リミックス。", ko: "참여하세요 — 반응, 도전, 리믹스.", tr: "Katıl — tepki ver, meydan oku, remixle.",
    hi: "जुड़ें — प्रतिक्रिया, चुनौती, रीमिक्स।", zh: "加入讨论 — 反应、挑战、混音。", th: "เข้าร่วม — ตอบโต้ ท้าทาย รีมิกซ์",
  }),
  yourComment: L({
    en: "Your comment", fr: "Ton commentaire", es: "Tu comentario", pt: "Seu comentário", de: "Dein Kommentar", it: "Il tuo commento", nl: "Je reactie",
    ar: "تعليقك", ja: "あなたのコメント", ko: "내 댓글", tr: "Yorumun", hi: "आपकी टिप्पणी", zh: "你的评论", th: "ความคิดเห็นของคุณ",
  }),
  placeholder: L({
    en: "Share feedback on this beat… (280 chars max)", fr: "Dis ce que tu ressens sur ce beat… (280 car. max)",
    es: "Comparte tu opinión sobre este beat… (280 car. máx.)", pt: "Diga o que acha deste beat… (280 car. máx.)", de: "Feedback zu diesem Beat… (max. 280 Zeichen)",
    it: "Condividi feedback su questo beat… (max 280 car.)", nl: "Deel feedback over deze beat… (max 280 tekens)", ar: "شارك رأيك في هذا الbeat… (280 حرفاً كحد أقصى)",
    ja: "このビートへのフィードバック…（最大280文字）", ko: "이 비트에 대한 피드백… (최대 280자)", tr: "Bu beat hakkında düşünceni paylaş… (280 karakter)",
    hi: "इस बीट पर फीडबैक… (280 अक्षर)", zh: "分享对这首节拍的反馈…（最多280字）", th: "แบ่งปันความคิดเห็นเกี่ยวกับบีตนี้… (280 ตัวอักษร)",
  }),
  post: L({
    en: "Post", fr: "Publier", es: "Publicar", pt: "Publicar", de: "Posten", it: "Pubblica", nl: "Plaatsen", ar: "نشر", ja: "投稿", ko: "게시", tr: "Yayınla", hi: "पोस्ट", zh: "发布", th: "โพสต์",
  }),
  loading: L({
    en: "Loading…", fr: "Chargement…", es: "Cargando…", pt: "Carregando…", de: "Laden…", it: "Caricamento…", nl: "Laden…",
    ar: "جارٍ التحميل…", ja: "読み込み中…", ko: "로딩 중…", tr: "Yükleniyor…", hi: "लोड…", zh: "加载中…", th: "กำลังโหลด…",
  }),
  firstComment: L({
    en: "Be the first to leave feedback on this beat.", fr: "Sois le premier à laisser un avis sur ce beat.",
    es: "Sé el primero en dejar feedback sobre este beat.", pt: "Seja o primeiro a deixar feedback neste beat.", de: "Sei der Erste mit Feedback zu diesem Beat.",
    it: "Sii il primo a lasciare feedback su questo beat.", nl: "Wees de eerste met feedback op deze beat.", ar: "كن أول من يترك رأياً في هذا الbeat.",
    ja: "このビートに最初のフィードバックを。", ko: "이 비트에 첫 피드백을 날기세요.", tr: "Bu beat hakkında ilk yorumu sen bırak.", hi: "इस बीट पर पहली प्रतिक्रिया दें।", zh: "成为第一个留下反馈的人。", th: "เป็นคนแรกที่แสดงความคิดเห็น",
  }),
  delete: L({
    en: "Delete", fr: "Supprimer", es: "Eliminar", pt: "Excluir", de: "Löschen", it: "Elimina", nl: "Verwijderen", ar: "حذف", ja: "削除", ko: "삭제", tr: "Sil", hi: "हटाएँ", zh: "删除", th: "ลบ",
  }),
  hide: L({
    en: "Hide", fr: "Masquer", es: "Ocultar", pt: "Ocultar", de: "Ausblenden", it: "Nascondi", nl: "Verbergen", ar: "إخفاء", ja: "非表示", ko: "숨기기", tr: "Gizle", hi: "छुपाएँ", zh: "隐藏", th: "ซ่อน",
  }),
};

export function buildLoopCommentsSectionCopy(locale: AppLocale) {
  const t = (key: keyof typeof COPY) => pickL(COPY[key], locale);
  return {
    loginToComment: t("loginToComment"),
    commentPosted: t("commentPosted"),
    couldNotPost: t("couldNotPost"),
    actionFailed: t("actionFailed"),
    comment: t("comment"),
    commentsLabel: (count: number) =>
      i(pickL(count === 1 ? COPY.commentsCount : COPY.commentsCountPlural, locale), { count }),
    liveComments: t("liveComments"),
    feedHint: t("feedHint"),
    yourComment: t("yourComment"),
    placeholder: t("placeholder"),
    post: t("post"),
    loading: t("loading"),
    firstComment: t("firstComment"),
    delete: t("delete"),
    hide: t("hide"),
  };
}

const AGE = {
  justNow: L({
    en: "just now", fr: "à l'instant", es: "ahora", pt: "agora", de: "gerade eben", it: "adesso", nl: "zojuist",
    ar: "الآن", ja: "たった今", ko: "방금", tr: "az önce", hi: "अभी", zh: "刚刚", th: "เมื่อกี้",
  }),
  minsAgo: L({
    en: "{{mins}}m ago", fr: "il y a {{mins}} min", es: "hace {{mins}} min", pt: "há {{mins}} min", de: "vor {{mins}} Min.",
    it: "{{mins}} min fa", nl: "{{mins}} min geleden", ar: "منذ {{mins}} د", ja: "{{mins}}分前", ko: "{{mins}}분 전", tr: "{{mins}} dk önce", hi: "{{mins}} मि. पहले", zh: "{{mins}} 分钟前", th: "{{mins}} นาทีที่แล้ว",
  }),
  hoursAgo: L({
    en: "{{hours}}h ago", fr: "il y a {{hours}} h", es: "hace {{hours}} h", pt: "há {{hours}} h", de: "vor {{hours}} Std.", it: "{{hours}} h fa", nl: "{{hours}} u geleden",
    ar: "منذ {{hours}} س", ja: "{{hours}}時間前", ko: "{{hours}}시간 전", tr: "{{hours}} sa önce", hi: "{{hours}} घं. पहले", zh: "{{hours}} 小时前", th: "{{hours}} ชม.ที่แล้ว",
  }),
  daysAgo: L({
    en: "{{days}}d ago", fr: "il y a {{days}} j", es: "hace {{days}} d", pt: "há {{days}} d", de: "vor {{days}} T.", it: "{{days}} g fa", nl: "{{days}} d geleden",
    ar: "منذ {{days}} ي", ja: "{{days}}日前", ko: "{{days}}일 전", tr: "{{days}} g önce", hi: "{{days}} दि. पहले", zh: "{{days}} 天前", th: "{{days}} วันที่แล้ว",
  }),
};

function ageI(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(vars[key] ?? ""));
}

export function formatCommentAgeI18n(iso: string, locale: AppLocale): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 2) return pickL(AGE.justNow, locale);
  if (mins < 60) return ageI(pickL(AGE.minsAgo, locale), { mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return ageI(pickL(AGE.hoursAgo, locale), { hours });
  const days = Math.floor(hours / 24);
  if (days < 14) return ageI(pickL(AGE.daysAgo, locale), { days });
  const dateLocale = locale === "fr" ? "fr-FR" : locale === "de" ? "de-DE" : locale === "es" ? "es-ES" : "en-US";
  return new Date(iso).toLocaleDateString(dateLocale, { month: "short", day: "numeric" });
}
