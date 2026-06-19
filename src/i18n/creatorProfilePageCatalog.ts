import type { AppLocale } from "./config";
import { L, pickL } from "./localized";

const COPY = {
  community: L({
    en: "Community", fr: "Communauté", es: "Comunidad", pt: "Comunidade", de: "Community", it: "Community", nl: "Community",
    ar: "المجتمع", ja: "コミュニティ", ko: "커뮤니티", tr: "Topluluk", hi: "कम्युनिटी", zh: "社区", th: "ชุมชน",
  }),
  website: L({
    en: "Website", fr: "Site web", es: "Sitio web", pt: "Site", de: "Website", it: "Sito web", nl: "Website",
    ar: "الموقع", ja: "ウェブサイト", ko: "웹사이트", tr: "Web sitesi", hi: "वेबसाइट", zh: "网站", th: "เว็บไซต์",
  }),
  loadingProfile: L({
    en: "Loading profile…", fr: "Chargement du profil…", es: "Cargando perfil…", pt: "Carregando perfil…", de: "Profil wird geladen…",
    it: "Caricamento profilo…", nl: "Profiel laden…", ar: "جارٍ تحميل الملف…", ja: "プロフィール読み込み中…", ko: "프로필 로딩 중…",
    tr: "Profil yükleniyor…", hi: "प्रोफ़ाइल लोड…", zh: "加载个人资料…", th: "กำลังโหลดโปรไฟล์…",
  }),
  profileNotFound: L({
    en: "Profile not found", fr: "Profil introuvable", es: "Perfil no encontrado", pt: "Perfil não encontrado", de: "Profil nicht gefunden",
    it: "Profilo non trovato", nl: "Profiel niet gevonden", ar: "الملف غير موجود", ja: "プロフィールが見つかりません", ko: "프로필 없음",
    tr: "Profil bulunamadı", hi: "प्रोफ़ाइल नहीं मिली", zh: "未找到资料", th: "ไม่พบโปรไฟล์",
  }),
  profileNotFoundHint: L({
    en: "This username does not exist or has not been set up yet.",
    fr: "Ce username n'existe pas ou n'a pas encore été configuré.",
    es: "Este usuario no existe o aún no está configurado.",
    pt: "Este usuário não existe ou ainda não foi configurado.",
    de: "Dieser Username existiert nicht oder ist noch nicht eingerichtet.",
    it: "Questo username non esiste o non è ancora configurato.",
    nl: "Deze gebruikersnaam bestaat niet of is nog niet ingesteld.",
    ar: "اسم المستخدم غير موجود أو لم يُعد بعد.",
    ja: "このユーザー名は存在しないか、まだ設定されていません。",
    ko: "사용자명이 없거나 아직 설정되지 않았습니다.",
    tr: "Bu kullanıcı adı yok veya henüz ayarlanmadı.",
    hi: "यह यूज़रनेम मौजूद नहीं या अभी सेट नहीं हुआ।",
    zh: "该用户名不存在或尚未设置。",
    th: "ชื่อผู้ใช้นี้ไม่มีอยู่หรือยังไม่ได้ตั้งค่า",
  }),
  exploreCommunity: L({
    en: "Explore community", fr: "Explorer la communauté", es: "Explorar comunidad", pt: "Explorar comunidade", de: "Community entdecken",
    it: "Esplora community", nl: "Community verkennen", ar: "استكشف المجتمع", ja: "コミュニティを見る", ko: "커뮤니티 둘러보기",
    tr: "Topluluğu keşfet", hi: "कम्युनिटी देखें", zh: "探索社区", th: "สำรวจชุมชน",
  }),
  followers: L({
    en: "followers", fr: "abonnés", es: "seguidores", pt: "seguidores", de: "Follower", it: "follower", nl: "volgers",
    ar: "متابعين", ja: "フォロワー", ko: "팔로워", tr: "takipçi", hi: "फ़ॉलोअर्स", zh: "粉丝", th: "ผู้ติดตาม",
  }),
  publicTracks: L({
    en: "public tracks", fr: "tracks publiques", es: "pistas públicas", pt: "faixas públicas", de: "öffentliche Tracks",
    it: "tracce pubbliche", nl: "publieke tracks", ar: "مقاطع عامة", ja: "公開トラック", ko: "공개 트랙",
    tr: "herkese açık parça", hi: "सार्वजनिक ट्रैक", zh: "公开曲目", th: "แทร็กสาธารณะ",
  }),
  following: L({
    en: "Following", fr: "Abonné", es: "Siguiendo", pt: "Seguindo", de: "Abonniert", it: "Seguito", nl: "Volgend",
    ar: "متابَع", ja: "フォロー中", ko: "팔로잉", tr: "Takip ediliyor", hi: "फ़ॉलो किया", zh: "已关注", th: "กำลังติดตาม",
  }),
  follow: L({
    en: "Follow", fr: "S'abonner", es: "Seguir", pt: "Seguir", de: "Folgen", it: "Segui", nl: "Volgen",
    ar: "متابعة", ja: "フォロー", ko: "팔로우", tr: "Takip et", hi: "फ़ॉलो", zh: "关注", th: "ติดตาม",
  }),
  followActivated: L({
    en: "Following", fr: "Abonnement activé", es: "Siguiendo", pt: "Seguindo", de: "Abonniert", it: "Seguito", nl: "Volgend",
    ar: "تمت المتابعة", ja: "フォローしました", ko: "팔로우함", tr: "Takip edildi", hi: "फ़ॉलो किया", zh: "已关注", th: "ติดตามแล้ว",
  }),
  unfollowed: L({
    en: "Unfollowed", fr: "Abonnement retiré", es: "Dejaste de seguir", pt: "Deixou de seguir", de: "Entfolgt", it: "Non segui più",
    nl: "Ontvolgd", ar: "ألغيت المتابعة", ja: "フォロー解除", ko: "언팔로우", tr: "Takip bırakıldı", hi: "अनफ़ॉलो", zh: "已取消关注", th: "เลิกติดตามแล้ว",
  }),
  editProfile: L({
    en: "Edit profile", fr: "Modifier mon profil", es: "Editar perfil", pt: "Editar perfil", de: "Profil bearbeiten", it: "Modifica profilo",
    nl: "Profiel bewerken", ar: "تعديل الملف", ja: "プロフィール編集", ko: "프로필 수정", tr: "Profili düzenle", hi: "प्रोफ़ाइल संपादित करें", zh: "编辑资料", th: "แก้ไขโปรไฟล์",
  }),
  publicTracksTitle: L({
    en: "Public tracks", fr: "Tracks publiques", es: "Pistas públicas", pt: "Faixas públicas", de: "Öffentliche Tracks",
    it: "Tracce pubbliche", nl: "Publieke tracks", ar: "مقاطع عامة", ja: "公開トラック", ko: "공개 트랙", tr: "Herkese açık parçalar",
    hi: "सार्वजनिक ट्रैक", zh: "公开曲目", th: "แทร็กสาธารณะ",
  }),
  noPublicTracks: L({
    en: "No public tracks yet.", fr: "Aucune track publique pour l'instant.", es: "Aún no hay pistas públicas.", pt: "Nenhuma faixa pública ainda.",
    de: "Noch keine öffentlichen Tracks.", it: "Nessuna traccia pubblica per ora.", nl: "Nog geen publieke tracks.",
    ar: "لا مقاطع عامة بعد.", ja: "公開トラックはまだありません。", ko: "아직 공개 트랙이 없습니다.", tr: "Henüz herkese açık parça yok.",
    hi: "अभी कोई सार्वजनिक ट्रैक नहीं।", zh: "暂无公开曲目。", th: "ยังไม่มีแทร็กสาธารณะ",
  }),
};

export function buildCreatorProfilePageCopy(locale: AppLocale) {
  const t = (key: keyof typeof COPY) => pickL(COPY[key], locale);
  return {
    community: t("community"),
    website: t("website"),
    loadingProfile: t("loadingProfile"),
    profileNotFound: t("profileNotFound"),
    profileNotFoundHint: t("profileNotFoundHint"),
    exploreCommunity: t("exploreCommunity"),
    followers: t("followers"),
    publicTracks: t("publicTracks"),
    following: t("following"),
    follow: t("follow"),
    followActivated: t("followActivated"),
    unfollowed: t("unfollowed"),
    editProfile: t("editProfile"),
    publicTracksTitle: t("publicTracksTitle"),
    noPublicTracks: t("noPublicTracks"),
  };
}
