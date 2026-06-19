import type { AppLocale } from "./config";
import { L, pickL } from "./localized";
import type { CommunityRailSort, CommunityVibeCategory } from "@/lib/communityHub";

function i(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(vars[key] ?? ""));
}

const COPY = {
  feedPulse: L({
    en: "Feed pulse", fr: "Actu du flux", es: "Pulso del feed", pt: "Pulso do feed", de: "Feed-Puls", it: "Pulse del feed", nl: "Feed-puls",
    ar: "نبض الفيد", ja: "フィードの動向", ko: "피드 동향", tr: "Akış nabzı", hi: "फ़ीड पल्स", zh: "动态脉搏", th: "ชีพจรฟีด",
  }),
  feedLiveChat: L({
    en: "Feed live chat", fr: "Chat live du flux", es: "Chat en vivo del feed", pt: "Chat ao vivo do feed", de: "Live-Chat im Feed", it: "Chat live del feed", nl: "Live chat feed",
    ar: "دردشة الفيد المباشرة", ja: "フィードライブチャット", ko: "피드 라이브 채팅", tr: "Akış canlı sohbet", hi: "फ़ीड लाइव चैट", zh: "动态直播聊天", th: "แชทสดฟีด",
  }),
  warmingUpChat: L({
    en: "Warming up the chat…", fr: "Le chat s'allume…", es: "Preparando el chat…", pt: "Aquecendo o chat…", de: "Chat startet…", it: "Avvio chat…", nl: "Chat opwarmen…",
    ar: "جارٍ تشغيل الدردشة…", ja: "チャット準備中…", ko: "채팅 준비 중…", tr: "Sohbet ısınıyor…", hi: "चैट शुरू हो रही है…", zh: "聊天加载中…", th: "กำลังเปิดแชท…",
  }),
  liveChat: L({
    en: "Live chat", fr: "Chat live", es: "Chat en vivo", pt: "Chat ao vivo", de: "Live-Chat", it: "Chat live", nl: "Live chat",
    ar: "دردشة مباشرة", ja: "ライブチャット", ko: "라이브 채팅", tr: "Canlı sohbet", hi: "लाइव चैट", zh: "直播聊天", th: "แชทสด",
  }),
  liveChatHint: L({
    en: "The community talks in real time — tap to reply on a track.",
    fr: "La commu parle en direct — tape pour répondre sur un son.",
    es: "La comunidad habla en directo — toca para responder en una pista.",
    pt: "A comunidade fala ao vivo — toque para responder numa faixa.",
    de: "Die Community chattet live — tippe, um auf einen Track zu antworten.",
    it: "La community parla in diretta — tocca per rispondere su una traccia.",
    nl: "De community praat live — tik om te reageren op een track.",
    ar: "المجتمع يتحدث مباشرة — اضغط للرد على مقطع.",
    ja: "コミュニティがリアルタイムで会話 — タップしてトラックに返信。",
    ko: "커뮤니티가 실시간으로 대화합니다 — 탭해서 트랙에 답글하세요.",
    tr: "Topluluk canlı konuşuyor — bir parçaya yanıt vermek için dokun.",
    hi: "कम्युनिटी लाइव बात कर रही है — ट्रैक पर जवाब देने के लिए टैप करें।",
    zh: "社区实时交流 — 点击在某曲目下回复。",
    th: "ชุมชนคุยสด — แตะเพื่อตอบบนแทร็ก",
  }),
  untitled: L({
    en: "Untitled", fr: "Sans titre", es: "Sin título", pt: "Sem título", de: "Ohne Titel", it: "Senza titolo", nl: "Naamloos",
    ar: "بدون عنوان", ja: "無題", ko: "제목 없음", tr: "Başlıksız", hi: "बिना शीर्षक", zh: "未命名", th: "ไม่มีชื่อ",
  }),
  joinConvo: L({
    en: "Join the convo", fr: "Rejoins la conv", es: "Únete a la conversación", pt: "Entrar na conversa", de: "Mitreden", it: "Unisciti alla chat", nl: "Doe mee",
    ar: "انضم للمحادثة", ja: "会話に参加", ko: "대화 참여", tr: "Sohbete katıl", hi: "बातचीत में शामिल हों", zh: "加入讨论", th: "เข้าร่วมบทสนทนา",
  }),
  searchPlaceholder: L({
    en: "Title, artist, vibe, genre…", fr: "Titre, artiste, vibe, genre…", es: "Título, artista, vibe, género…", pt: "Título, artista, vibe, gênero…", de: "Titel, Artist, Vibe, Genre…", it: "Titolo, artista, vibe, genere…", nl: "Titel, artiest, vibe, genre…",
    ar: "عنوان، فنان، vibe، نوع…", ja: "タイトル、アーティスト、vibe、ジャンル…", ko: "제목, 아티스트, vibe, 장르…", tr: "Başlık, sanatçı, vibe, tür…", hi: "शीर्षक, कलाकार, vibe, शैली…", zh: "标题、艺术家、氛围、流派…", th: "ชื่อ, ศิลปิน, vibe, แนว…",
  }),
  allVibes: L({
    en: "All vibes", fr: "Tout le flux", es: "Todas las vibes", pt: "Todas as vibes", de: "Alle Vibes", it: "Tutte le vibe", nl: "Alle vibes",
    ar: "كل الـ vibes", ja: "すべてのvibe", ko: "모든 vibe", tr: "Tüm vibe'lar", hi: "सभी vibes", zh: "全部氛围", th: "vibe ทั้งหมด",
  }),
  sort: L({
    en: "Sort", fr: "Tri", es: "Orden", pt: "Ordenar", de: "Sortieren", it: "Ordina", nl: "Sorteer",
    ar: "ترتيب", ja: "並べ替え", ko: "정렬", tr: "Sırala", hi: "क्रम", zh: "排序", th: "เรียง",
  }),
  sortNew: L({
    en: "New", fr: "Nouveaux", es: "Nuevos", pt: "Novos", de: "Neu", it: "Nuovi", nl: "Nieuw",
    ar: "جديد", ja: "新着", ko: "신규", tr: "Yeni", hi: "नए", zh: "最新", th: "ใหม่",
  }),
  sortRandom: L({
    en: "Random", fr: "Aléatoire", es: "Aleatorio", pt: "Aleatório", de: "Zufällig", it: "Casuale", nl: "Willekeurig",
    ar: "عشوائي", ja: "ランダム", ko: "무작위", tr: "Rastgele", hi: "रैंडम", zh: "随机", th: "สุ่ม",
  }),
  seeAll: L({
    en: "See all", fr: "Tout voir", es: "Ver todo", pt: "Ver tudo", de: "Alle anzeigen", it: "Vedi tutto", nl: "Alles bekijken",
    ar: "عرض الكل", ja: "すべて見る", ko: "전체 보기", tr: "Tümünü gör", hi: "सभी देखें", zh: "查看全部", th: "ดูทั้งหมด",
  }),
  comment: L({
    en: "Comment", fr: "Commenter", es: "Comentar", pt: "Comentar", de: "Kommentieren", it: "Commenta", nl: "Reageer",
    ar: "علّق", ja: "コメント", ko: "댓글", tr: "Yorum yap", hi: "कमेंट", zh: "评论", th: "คอมเมนต์",
  }),
  open: L({
    en: "Open", fr: "Ouvrir", es: "Abrir", pt: "Abrir", de: "Öffnen", it: "Apri", nl: "Openen",
    ar: "فتح", ja: "開く", ko: "열기", tr: "Aç", hi: "खोलें", zh: "打开", th: "เปิด",
  }),
  yours: L({
    en: "Yours", fr: "Ton son", es: "Tuyo", pt: "Seu", de: "Deiner", it: "Tuo", nl: "Van jou",
    ar: "ملكك", ja: "あなたの", ko: "내 것", tr: "Senin", hi: "आपका", zh: "你的", th: "ของคุณ",
  }),
  badgeNew: L({
    en: "New", fr: "Nouveau", es: "Nuevo", pt: "Novo", de: "Neu", it: "Nuovo", nl: "Nieuw",
    ar: "جديد", ja: "新着", ko: "신규", tr: "Yeni", hi: "नया", zh: "新", th: "ใหม่",
  }),
  ariaPlay: L({
    en: "Play {{name}}", fr: "Écouter {{name}}", es: "Reproducir {{name}}", pt: "Ouvir {{name}}", de: "{{name}} abspielen", it: "Ascolta {{name}}", nl: "Speel {{name}}",
    ar: "تشغيل {{name}}", ja: "{{name}} を再生", ko: "{{name}} 재생", tr: "{{name}} dinle", hi: "{{name}} चलाएँ", zh: "播放 {{name}}", th: "เล่น {{name}}",
  }),
  ariaPause: L({
    en: "Pause {{name}}", fr: "Pause {{name}}", es: "Pausar {{name}}", pt: "Pausar {{name}}", de: "{{name}} pausieren", it: "Pausa {{name}}", nl: "Pauzeer {{name}}",
    ar: "إيقاف {{name}}", ja: "{{name}} を一時停止", ko: "{{name}} 일시정지", tr: "{{name}} duraklat", hi: "{{name}} रोकें", zh: "暂停 {{name}}", th: "หยุด {{name}}",
  }),
  close: L({
    en: "Close", fr: "Fermer", es: "Cerrar", pt: "Fechar", de: "Schließen", it: "Chiudi", nl: "Sluiten",
    ar: "إغلاق", ja: "閉じる", ko: "닫기", tr: "Kapat", hi: "बंद", zh: "关闭", th: "ปิด",
  }),
  onFeed: L({
    en: "On the feed", fr: "Dans le flux", es: "En el feed", pt: "No feed", de: "Im Feed", it: "Nel feed", nl: "Op de feed",
    ar: "في الفيد", ja: "フィード上", ko: "피드에서", tr: "Akışta", hi: "फ़ीड पर", zh: "在动态中", th: "บนฟีด",
  }),
  beFirst: L({
    en: "Be the first", fr: "Sois le premier", es: "Sé el primero", pt: "Seja o primeiro", de: "Sei der Erste", it: "Sii il primo", nl: "Wees de eerste",
    ar: "كن الأول", ja: "最初の評価を", ko: "첫 번째로", tr: "İlk sen ol", hi: "पहले बनें", zh: "成为第一个", th: "เป็นคนแรก",
  }),
  fullPage: L({
    en: "Full page", fr: "Page complète", es: "Página completa", pt: "Página completa", de: "Vollständige Seite", it: "Pagina completa", nl: "Volledige pagina",
    ar: "الصفحة الكاملة", ja: "フルページ", ko: "전체 페이지", tr: "Tam sayfa", hi: "पूर्ण पृष्ठ", zh: "完整页面", th: "หน้าเต็ม",
  }),
  myTracksRail: L({
    en: "Your tracks on the feed", fr: "Tes créations sur le flux", es: "Tus tracks en el feed", pt: "Suas faixas no feed", de: "Deine Tracks im Feed", it: "Le tue tracce nel feed", nl: "Jouw tracks op de feed",
    ar: "مقاطعك على الفيد", ja: "フィード上のあなたのトラック", ko: "피드의 내 트랙", tr: "Akıştaki parçaların", hi: "फ़ीड पर आपके ट्रैक", zh: "你在动态上的曲目", th: "แทร็กของคุณบนฟีด",
  }),
  freshDrops: L({
    en: "Fresh drops", fr: "Fraîchement sortis", es: "Recién publicados", pt: "Lançamentos frescos", de: "Frische Drops", it: "Uscite fresche", nl: "Verse drops",
    ar: "إصدارات جديدة", ja: "新着ドロップ", ko: "신규 드롭", tr: "Yeni drop'lar", hi: "ताज़े ड्रॉप", zh: "新鲜发布", th: "เพลงใหม่ล่าสุด",
  }),
  mostLoved: L({
    en: "Most loved", fr: "Les plus kiffés", es: "Más queridos", pt: "Mais amados", de: "Am meisten geliebt", it: "Più amati", nl: "Meest geliefd",
    ar: "الأكثر إعجاباً", ja: "最も人気", ko: "가장 사랑받는", tr: "En sevilen", hi: "सबसे पसंदीदा", zh: "最受欢迎", th: "ได้รับความนิยมสูงสุด",
  }),
  discoveries: L({
    en: "Discoveries", fr: "Découvertes", es: "Descubrimientos", pt: "Descobertas", de: "Entdeckungen", it: "Scoperte", nl: "Ontdekkingen",
    ar: "اكتشافات", ja: "発見", ko: "발견", tr: "Keşifler", hi: "खोज", zh: "发现", th: "ค้นพบ",
  }),
  discoveriesSub: L({
    en: "Wildcard vibes — off-category, pure surprise",
    fr: "Vibes improbables — hors catégorie, 100% surprise",
    es: "Vibes sorpresa — fuera de categoría",
    pt: "Vibes surpresa — fora de categoria",
    de: "Wildcard-Vibes — überraschend",
    it: "Vibe a sorpresa — fuori categoria",
    nl: "Wildcard vibes — verrassend",
    ar: "vibes مفاجئة — خارج التصنيف",
    ja: "意外なvibe — カテゴリ外のサプライズ",
    ko: "뜻밖의 vibe — 카테고리 밖의 서프라이즈",
    tr: "Sürpriz vibe'lar — kategori dışı",
    hi: "अप्रत्याशित vibes — श्रेणी से बाहर",
    zh: "意外氛围 — 类别之外的惊喜",
    th: "vibe สุดเซอร์ไพรส์ — นอกหมวด",
  }),
  railFreshInVibe: L({
    en: "Fresh in this vibe", fr: "Nouveautés de la vibe", es: "Novedades en esta vibe", pt: "Novidades nesta vibe", de: "Neu in dieser Vibe", it: "Novità in questa vibe", nl: "Nieuw in deze vibe",
    ar: "جديد في هذه الـ vibe", ja: "このvibeの新着", ko: "이 vibe의 신규", tr: "Bu vibe'da yeniler", hi: "इस vibe में नए", zh: "此氛围的新作", th: "ใหม่ใน vibe นี้",
  }),
  railMostPlayed: L({
    en: "Most played", fr: "Les plus écoutés", es: "Más reproducidos", pt: "Mais ouvidos", de: "Meist gehört", it: "Più ascoltati", nl: "Meest afgespeeld",
    ar: "الأكثر استماعاً", ja: "最多再生", ko: "가장 많이 재생", tr: "En çok dinlenen", hi: "सबसे ज़्यादा सुने गए", zh: "播放最多", th: "ฟังมากที่สุด",
  }),
  railMostDiscussed: L({
    en: "Most discussed", fr: "Le plus de feedback", es: "Más comentados", pt: "Mais comentados", de: "Meist diskutiert", it: "Più discussi", nl: "Meest besproken",
    ar: "الأكثر نقاشاً", ja: "最多コメント", ko: "가장 많은 댓글", tr: "En çok yorumlanan", hi: "सबसे ज़्यादा चर्चा", zh: "讨论最多", th: "ถูกพูดถึงมากที่สุด",
  }),
  railDailyPicks: L({
    en: "Daily picks", fr: "Sélection du jour", es: "Selección del día", pt: "Seleção do dia", de: "Tagesauswahl", it: "Scelta del giorno", nl: "Dagselectie",
    ar: "اختيارات اليوم", ja: "本日のピック", ko: "오늘의 픽", tr: "Günün seçkisi", hi: "आज की पसंद", zh: "今日精选", th: "คัดสรรวันนี้",
  }),
  railTopLoved: L({
    en: "Top loved in vibe", fr: "Les plus kiffés de la vibe", es: "Top amados en la vibe", pt: "Top amados na vibe", de: "Top-Lieblinge der Vibe", it: "Top amati nella vibe", nl: "Top favorieten in vibe",
    ar: "الأكثر إعجاباً في الـ vibe", ja: "このvibeの人気トップ", ko: "이 vibe 인기 TOP", tr: "Bu vibe'ın favorileri", hi: "इस vibe के टॉप", zh: "此氛围最爱", th: "ยอดนิยมใน vibe นี้",
  }),
  feedTopPicks: L({
    en: "Feed top picks", fr: "Top du flux", es: "Top del feed", pt: "Top do feed", de: "Feed-Top", it: "Top del feed", nl: "Feed-top",
    ar: "أفضل الفيد", ja: "フィードTOP", ko: "피드 TOP", tr: "Akışın en iyileri", hi: "फ़ीड टॉप", zh: "动态精选", th: "ท็อปฟีด",
  }),
  randomPicks: L({
    en: "Random picks", fr: "Sélection aléatoire", es: "Selección aleatoria", pt: "Seleção aleatória", de: "Zufallsauswahl", it: "Scelta casuale", nl: "Willekeurige selectie",
    ar: "اختيارات عشوائية", ja: "ランダムピック", ko: "무작위 픽", tr: "Rastgele seçim", hi: "रैंडम चयन", zh: "随机精选", th: "สุ่มคัดเลือก",
  }),
  fullCatalog: L({
    en: "Full catalog", fr: "Tout le catalogue", es: "Catálogo completo", pt: "Catálogo completo", de: "Voller Katalog", it: "Catalogo completo", nl: "Volledige catalogus",
    ar: "الفهرس الكامل", ja: "全カタログ", ko: "전체 카탈로그", tr: "Tam katalog", hi: "पूरा कैटलॉग", zh: "完整目录", th: "แคตตาล็อกทั้งหมด",
  }),
  resultsOne: L({
    en: "{{count}} result", fr: "{{count}} résultat", es: "{{count}} resultado", pt: "{{count}} resultado", de: "{{count}} Ergebnis", it: "{{count}} risultato", nl: "{{count}} resultaat",
    ar: "{{count}} نتيجة", ja: "{{count}} 件", ko: "{{count}}개 결과", tr: "{{count}} sonuç", hi: "{{count}} परिणाम", zh: "{{count}} 个结果", th: "{{count}} ผลลัพธ์",
  }),
  resultsMany: L({
    en: "{{count}} results", fr: "{{count}} résultats", es: "{{count}} resultados", pt: "{{count}} resultados", de: "{{count}} Ergebnisse", it: "{{count}} risultati", nl: "{{count}} resultaten",
    ar: "{{count}} نتائج", ja: "{{count}} 件", ko: "{{count}}개 결과", tr: "{{count}} sonuç", hi: "{{count}} परिणाम", zh: "{{count}} 个结果", th: "{{count}} ผลลัพธ์",
  }),
  nothingHere: L({
    en: "Nothing here yet", fr: "Rien ici pour l'instant", es: "Nada aquí por ahora", pt: "Nada aqui ainda", de: "Noch nichts hier", it: "Ancora niente qui", nl: "Nog niets hier",
    ar: "لا شيء هنا بعد", ja: "まだ何もありません", ko: "아직 없습니다", tr: "Henüz burada bir şey yok", hi: "अभी यहाँ कुछ नहीं", zh: "这里还没有内容", th: "ยังไม่มีอะไรที่นี่",
  }),
  emptyVibe: L({
    en: "No public playable tracks in this vibe. Try another category or create the first one.",
    fr: "Aucune track avec audio public dans cette vibe. Essaie une autre catégorie ou crée le premier son.",
    es: "No hay pistas públicas reproducibles en esta vibe. Prueba otra categoría o crea la primera.",
    pt: "Nenhuma faixa pública reproduzível nesta vibe. Tente outra categoria ou crie a primeira.",
    de: "Keine öffentlich abspielbaren Tracks in dieser Vibe. Probiere eine andere Kategorie oder erstelle den ersten.",
    it: "Nessuna traccia pubblica riproducibile in questa vibe. Prova un'altra categoria o crea la prima.",
    nl: "Geen publiek afspeelbare tracks in deze vibe. Probeer een andere categorie of maak de eerste.",
    ar: "لا مقاطع عامة قابلة للتشغيل في هذه الـ vibe. جرّب فئة أخرى أو أنشئ الأول.",
    ja: "このvibeに公開再生可能なトラックがありません。別カテゴリを試すか、最初の1曲を作成してください。",
    ko: "이 vibe에 공개 재생 가능한 트랙이 없습니다. 다른 카테고리를 시도하거나 첫 트랙을 만드세요.",
    tr: "Bu vibe'da herkese açık çalınabilir parça yok. Başka kategori dene veya ilkini oluştur.",
    hi: "इस vibe में कोई सार्वजनिक playable ट्रैक नहीं। दूसरी श्रेणी आज़माएँ या पहला बनाएँ।",
    zh: "此氛围下没有可播放的公开曲目。试试其他分类或创建第一首。",
    th: "ไม่มีแทร็กสาธารณะที่เล่นได้ใน vibe นี้ ลองหมวดอื่นหรือสร้างแทร็กแรก",
  }),
  retry: L({
    en: "Retry", fr: "Réessayer", es: "Reintentar", pt: "Tentar de novo", de: "Erneut versuchen", it: "Riprova", nl: "Opnieuw",
    ar: "إعادة المحاولة", ja: "再試行", ko: "다시 시도", tr: "Tekrar dene", hi: "पुनः प्रयास", zh: "重试", th: "ลองอีกครั้ง",
  }),
  createTrack: L({
    en: "Create a track", fr: "Créer un track", es: "Crear una pista", pt: "Criar uma faixa", de: "Track erstellen", it: "Crea una traccia", nl: "Track maken",
    ar: "إنشاء مقطع", ja: "トラックを作成", ko: "트랙 만들기", tr: "Parça oluştur", hi: "ट्रैक बनाएँ", zh: "创建曲目", th: "สร้างแทร็ก",
  }),
  loading: L({
    en: "Loading…", fr: "Chargement…", es: "Cargando…", pt: "Carregando…", de: "Laden…", it: "Caricamento…", nl: "Laden…",
    ar: "جارٍ التحميل…", ja: "読み込み中…", ko: "로딩 중…", tr: "Yükleniyor…", hi: "लोड…", zh: "加载中…", th: "กำลังโหลด…",
  }),
  privateLibrary: L({
    en: "My private library →", fr: "Ma bibliothèque privée →", es: "Mi biblioteca privada →", pt: "Minha biblioteca privada →", de: "Meine private Bibliothek →", it: "La mia libreria privata →", nl: "Mijn privébibliotheek →",
    ar: "مكتبتي الخاصة →", ja: "プライベートライブラリ →", ko: "내 비공개 라이브러리 →", tr: "Özel kütüphanem →", hi: "मेरी निजी लाइbrary →", zh: "我的私人曲库 →", th: "ไลบรารีส่วนตัว →",
  }),
  loadTimeout: L({
    en: "Loading is taking too long. Try again.", fr: "Chargement trop long. Réessaie.", es: "La carga tarda demasiado. Reintenta.", pt: "Carregamento demorado. Tente de novo.", de: "Laden dauert zu lange. Erneut versuchen.", it: "Caricamento troppo lento. Riprova.", nl: "Laden duurt te lang. Probeer opnieuw.",
    ar: "التحميل يستغرق وقتاً طويلاً. أعد المحاولة.", ja: "読み込みに時間がかかっています。再試行してください。", ko: "로딩이 너무 오래 걸립니다. 다시 시도하세요.", tr: "Yükleme çok uzun sürüyor. Tekrar dene.", hi: "लोडिंग बहुत लंबी है। पुनः प्रयास करें।", zh: "加载时间过长，请重试。", th: "โหลดนานเกินไป ลองอีกครั้ง",
  }),
  loadFailed: L({
    en: "Failed to load the feed.", fr: "Impossible de charger le flux.", es: "No se pudo cargar el feed.", pt: "Falha ao carregar o feed.", de: "Feed konnte nicht geladen werden.", it: "Impossibile caricare il feed.", nl: "Feed laden mislukt.",
    ar: "تعذّر تحميل الفيد.", ja: "フィードの読み込みに失敗しました。", ko: "피드를 불러오지 못했습니다.", tr: "Akış yüklenemedi.", hi: "फ़ीड लोड नहीं हो सकी।", zh: "无法加载动态。", th: "โหลดฟีดไม่สำเร็จ",
  }),
  seoTrendingTitle: L({
    en: "Trending AI beats & remix 2026", fr: "Beats IA trending & remix 2026", es: "Beats IA trending y remix 2026", pt: "Beats IA trending e remix 2026", de: "Trending KI-Beats & Remix 2026", it: "Beat IA trending e remix 2026", nl: "Trending AI-beats & remix 2026",
    ar: "beats IA trending و remix 2026", ja: "トレンドAIビート & remix 2026", ko: "트렌딩 AI 비트 & 리믹스 2026", tr: "Trend AI beatler & remix 2026", hi: "ट्रेंडिंग AI beats & remix 2026", zh: "2026 热门 AI 节拍与混音", th: "AI beats trending & remix 2026",
  }),
  seoMoreVibes: L({
    en: "More {{title}} vibes & guides", fr: "Plus de vibes {{title}} & guides", es: "Más vibes {{title}} y guías", pt: "Mais vibes {{title}} e guias", de: "Mehr {{title}}-Vibes & Guides", it: "Altre vibe {{title}} e guide", nl: "Meer {{title}} vibes & gidsen",
    ar: "المزيد من vibes {{title}} ودلائل", ja: "もっと {{title}} vibe & ガイド", ko: "더 많은 {{title}} vibe & 가이드", tr: "Daha fazla {{title}} vibe ve rehber", hi: "और {{title}} vibes और गाइड", zh: "更多 {{title}} 氛围与指南", th: "vibe {{title}} และคู่มือเพิ่มเติม",
  }),
  seoDiscoverByVibe: L({
    en: "Discover AI beats by vibe", fr: "Découvrir beats IA par vibe", es: "Descubre beats IA por vibe", pt: "Descubra beats IA por vibe", de: "KI-Beats nach Vibe entdecken", it: "Scopri beat IA per vibe", nl: "Ontdek AI-beats per vibe",
    ar: "اكتشف beats IA حسب الـ vibe", ja: "vibe別にAIビートを発見", ko: "vibe별 AI 비트 탐색", tr: "Vibe'a göre AI beat keşfet", hi: "vibe के अनुसार AI beats खोजें", zh: "按氛围发现 AI 节拍", th: "ค้นหา AI beats ตาม vibe",
  }),
  seoTrendingBody: L({
    en: "ProducerHit combines a community feed (plays, ratings, comments) with an AI studio to remix hot vibes — an alternative to static « 9 best AI generators » listicles.",
    fr: "ProducerHit combine un flux communautaire (écoutes, notes, commentaires) et un studio IA pour remixer les vibes du moment — alternative aux listes statiques « 9 meilleurs générateurs IA ».",
    es: "ProducerHit combina un feed comunitario (reproducciones, valoraciones, comentarios) con un estudio IA para remixar vibes — alternativa a listas estáticas de « 9 mejores generadores IA ».",
    pt: "ProducerHit combina um feed comunitário (plays, notas, comentários) com um estúdio IA para remixar vibes — alternativa a listas estáticas de « 9 melhores geradores IA ».",
    de: "ProducerHit verbindet Community-Feed (Plays, Bewertungen, Kommentare) mit einem KI-Studio zum Remixen — Alternative zu statischen « 9 besten KI-Generatoren »-Listen.",
    it: "ProducerHit unisce un feed community (ascolti, voti, commenti) e uno studio IA per remixare le vibe — alternativa alle liste statiche « 9 migliori generatori IA ».",
    nl: "ProducerHit combineert een community-feed (plays, ratings, reacties) met een AI-studio om vibes te remixen — alternatief voor statische « 9 beste AI-generators »-lijsten.",
    ar: "ProducerHit يجمع فيد مجتمعي (استماع، تقييم، تعليقات) واستوديو ذكاء اصطناعي لـ remix — بديل لقوائم « 9 أفضل مولدات IA » الثابتة.",
    ja: "ProducerHitはコミュニティフィード（再生、評価、コメント）とAIスタジオでホットなvibeをリミックス — 静的な「9つの最高AIジェネレーター」リストの代替。",
    ko: "ProducerHit은 커뮤니티 피드(재생, 평점, 댓글)와 AI 스튜디오로 핫한 vibe를 리믹스 — 정적 « 9 best AI generators » 리스트의 대안.",
    tr: "ProducerHit topluluk akışını (dinleme, puan, yorum) AI stüdyosuyla birleştirir — statik « 9 en iyi AI üretici » listelerine alternatif.",
    hi: "ProducerHit कम्युनिटी फ़ीड (plays, ratings, comments) और AI स्टूडियो से hot vibes remix करता है — स्थिर « 9 best AI generators » सूचियों का विकल्प।",
    zh: "ProducerHit 将社区动态（播放、评分、评论）与 AI 工作室结合来 remix 热门氛围 — 替代静态的「9 大 AI 生成器」榜单。",
    th: "ProducerHit รวมฟีดชุมชน (เล่น, คะแนน, คอมเมนต์) กับสตูดิโอ AI เพื่อ remix vibe ฮอต — ทางเลือกแทนรายการ « 9 best AI generators » แบบนิ่ง",
  }),
  seoHubBody: L({
    en: "Each vibe has an indexable page with real public tracks. Remix a vibe, create your type beat, or compare ProducerHit to other AI music tools.",
    fr: "Chaque vibe a sa page indexable avec des tracks publics réels. Remixe une vibe, crée ton type beat, ou compare ProducerHit aux autres générateurs IA.",
    es: "Cada vibe tiene su página indexable con pistas públicas reales. Remixa una vibe, crea tu type beat o compara ProducerHit con otras herramientas IA.",
    pt: "Cada vibe tem sua página indexável com faixas públicas reais. Remixe uma vibe, crie seu type beat ou compare ProducerHit a outras ferramentas IA.",
    de: "Jede Vibe hat eine indexierbare Seite mit echten öffentlichen Tracks. Remixe eine Vibe, erstelle deinen Type Beat oder vergleiche ProducerHit mit anderen KI-Tools.",
    it: "Ogni vibe ha una pagina indicizzabile con tracce pubbliche reali. Remixa una vibe, crea il tuo type beat o confronta ProducerHit con altri tool IA.",
    nl: "Elke vibe heeft een indexeerbare pagina met echte publieke tracks. Remix een vibe, maak je type beat of vergelijk ProducerHit met andere AI-tools.",
    ar: "كل vibe لها صفحة قابلة للفهرسة بمقاطع عامة حقيقية. remix vibe، أنشئ type beat، أو قارن ProducerHit بأدوات IA أخرى.",
    ja: "各vibeに実際の公開トラックがあるインデックス可能ページ。vibeをリミックス、type beatを作成、またはProducerHitを他のAIツールと比較。",
    ko: "각 vibe는 실제 공개 트랙이 있는 인덱싱 가능 페이지를 갖습니다. vibe 리믹스, type beat 생성, 또는 ProducerHit을 다른 AI 도구와 비교하세요.",
    tr: "Her vibe'ın gerçek herkese açık parçalarla dizinlenebilir sayfası var. Bir vibe'ı remix et, type beat oluştur veya ProducerHit'i diğer AI araçlarıyla karşılaştır.",
    hi: "हर vibe की इंडेक्स योग्य पेज real public tracks के साथ। vibe remix करें, type beat बनाएँ, या ProducerHit की तुलना करें।",
    zh: "每个氛围都有可索引页面和真实公开曲目。混音某氛围、创作 type beat，或将 ProducerHit 与其他 AI 工具对比。",
    th: "แต่ละ vibe มีหน้าที่ index ได้พร้อมแทร็กสาธารณะจริง remix vibe สร้าง type beat หรือเปรียบเทียบ ProducerHit กับเครื่องมือ AI อื่น",
  }),
  seoFeedVibes: L({
    en: "Feed vibes", fr: "Vibes du flux", es: "Vibes del feed", pt: "Vibes do feed", de: "Feed-Vibes", it: "Vibe del feed", nl: "Feed vibes",
    ar: "vibes الفيد", ja: "フィードvibe", ko: "피드 vibe", tr: "Akış vibe'ları", hi: "फ़ीड vibes", zh: "动态氛围", th: "vibe ฟีด",
  }),
  seoAllFeed: L({
    en: "All feed", fr: "Tout le flux", es: "Todo el feed", pt: "Todo o feed", de: "Ganzer Feed", it: "Tutto il feed", nl: "Hele feed",
    ar: "كل الفيد", ja: "フィード全体", ko: "전체 피드", tr: "Tüm akış", hi: "पूरा फ़ीड", zh: "全部动态", th: "ฟีดทั้งหมด",
  }),
  seoGuides: L({
    en: "Guides & comparisons", fr: "Guides & comparatifs", es: "Guías y comparativas", pt: "Guias e comparativos", de: "Guides & Vergleiche", it: "Guide e confronti", nl: "Gidsen & vergelijkingen",
    ar: "أدلة ومقارنات", ja: "ガイド & 比較", ko: "가이드 & 비교", tr: "Rehberler ve karşılaştırmalar", hi: "गाइड और तुलना", zh: "指南与对比", th: "คู่มือและการเปรียบเทียบ",
  }),
  seoAiBeatsBlog: L({
    en: "AI beats blog", fr: "Blog beats IA", es: "Blog beats IA", pt: "Blog beats IA", de: "KI-Beats-Blog", it: "Blog beat IA", nl: "AI-beats blog",
    ar: "مدونة beats IA", ja: "AIビートブログ", ko: "AI 비트 블로그", tr: "AI beat blogu", hi: "AI beats ब्लॉग", zh: "AI 节拍博客", th: "บล็อก AI beats",
  }),
  seoCommunityVibes: L({
    en: "Community vibes", fr: "Vibes communauté", es: "Vibes comunidad", pt: "Vibes comunidade", de: "Community-Vibes", it: "Vibe community", nl: "Community vibes",
    ar: "vibes المجتمع", ja: "コミュニティvibe", ko: "커뮤니티 vibe", tr: "Topluluk vibe'ları", hi: "कम्युनिटी vibes", zh: "社区氛围", th: "vibe ชุมชน",
  }),
  seoGuidesNav: L({
    en: "SEO guides", fr: "Guides SEO", es: "Guías SEO", pt: "Guias SEO", de: "SEO-Guides", it: "Guide SEO", nl: "SEO-gidsen",
    ar: "أدلة SEO", ja: "SEOガイド", ko: "SEO 가이드", tr: "SEO rehberleri", hi: "SEO गाइड", zh: "SEO 指南", th: "คู่มือ SEO",
  }),
  vibeTitleMeta: L({
    en: "{{title}} — community AI beats | ProducerHit", fr: "{{title}} — beats IA communauté | ProducerHit", es: "{{title}} — beats IA comunidad | ProducerHit", pt: "{{title}} — beats IA comunidade | ProducerHit", de: "{{title}} — Community-KI-Beats | ProducerHit", it: "{{title}} — beat IA community | ProducerHit", nl: "{{title}} — community AI-beats | ProducerHit",
    ar: "{{title}} — beats IA مجتمع | ProducerHit", ja: "{{title}} — コミュニティAIビート | ProducerHit", ko: "{{title}} — 커뮤니티 AI 비트 | ProducerHit", tr: "{{title}} — topluluk AI beat | ProducerHit", hi: "{{title}} — कम्युनिटी AI beats | ProducerHit", zh: "{{title}} — 社区 AI 节拍 | ProducerHit", th: "{{title}} — AI beats ชุมชน | ProducerHit",
  }),
  vibeDescription: L({
    en: "Listen to {{title}} AI beats on ProducerHit: {{subtitle}}. Remix, comment, and create your own — free community feed.{{count}}",
    fr: "Écoute des beats IA {{title}} sur ProducerHit : {{subtitle}}. Remixe, commente et crée le tien — flux communautaire gratuit.{{count}}",
    es: "Escucha beats IA {{title}} en ProducerHit: {{subtitle}}. Remixa, comenta y crea el tuyo — feed comunitario gratis.{{count}}",
    pt: "Ouça beats IA {{title}} no ProducerHit: {{subtitle}}. Remixe, comente e crie o seu — feed comunitário grátis.{{count}}",
    de: "Hör {{title}} KI-Beats auf ProducerHit: {{subtitle}}. Remixe, kommentiere und erstelle deinen — kostenloser Community-Feed.{{count}}",
    it: "Ascolta beat IA {{title}} su ProducerHit: {{subtitle}}. Remixa, commenta e crea il tuo — feed community gratuito.{{count}}",
    nl: "Luister naar {{title}} AI-beats op ProducerHit: {{subtitle}}. Remix, reageer en maak de jouwe — gratis community-feed.{{count}}",
    ar: "استمع لـ beats IA {{title}} على ProducerHit: {{subtitle}}. remix، علّق وأنشئ مقطعك — فيد مجتمعي مجاني.{{count}}",
    ja: "ProducerHitで{{title}} AIビートを聴く: {{subtitle}}。リミックス、コメント、作成 — 無料コミュニティフィード。{{count}}",
    ko: "ProducerHit에서 {{title}} AI 비트 듣기: {{subtitle}}. 리믹스, 댓글, 생성 — 무료 커뮤니티 피드.{{count}}",
    tr: "ProducerHit'te {{title}} AI beat dinle: {{subtitle}}. Remix, yorum yap, kendi parçanı oluştur — ücretsiz topluluk akışı.{{count}}",
    hi: "ProducerHit पर {{title}} AI beats सुनें: {{subtitle}}. remix, comment करें, अपना बनाएँ — मुफ़्त community feed.{{count}}",
    zh: "在 ProducerHit 收听 {{title}} AI 节拍：{{subtitle}}。混音、评论、创作 — 免费社区动态。{{count}}",
    th: "ฟัง AI beats {{title}} บน ProducerHit: {{subtitle}}. remix คอมเมนต์ สร้างของคุณ — ฟีดชุมชนฟรี{{count}}",
  }),
  vibeKwBeat: L({
    en: "{{title}} AI beat", fr: "beat {{title}} IA", es: "beat {{title}} IA", pt: "beat {{title}} IA", de: "{{title}} KI-Beat", it: "beat {{title}} IA", nl: "{{title}} AI beat",
    ar: "beat {{title}} IA", ja: "{{title}} AIビート", ko: "{{title}} AI 비트", tr: "{{title}} AI beat", hi: "{{title}} AI beat", zh: "{{title}} AI 节拍", th: "{{title}} AI beat",
  }),
  vibeKwCommunity: L({
    en: "community AI beats", fr: "beats IA communauté", es: "beats IA comunidad", pt: "beats IA comunidade", de: "Community-KI-Beats", it: "beat IA community", nl: "community AI-beats",
    ar: "beats IA مجتمع", ja: "コミュニティAIビート", ko: "커뮤니티 AI 비트", tr: "topluluk AI beat", hi: "कम्युनिटी AI beats", zh: "社区 AI 节拍", th: "AI beats ชุมชน",
  }),
  vibeKwRemix: L({
    en: "AI beat remix", fr: "remix beat IA", es: "remix beat IA", pt: "remix beat IA", de: "KI-Beat-Remix", it: "remix beat IA", nl: "AI beat remix",
    ar: "remix beat IA", ja: "AIビートリミックス", ko: "AI 비트 리믹스", tr: "AI beat remix", hi: "AI beat remix", zh: "AI 节拍混音", th: "AI beat remix",
  }),
  vibeKwType: L({
    en: "AI type beat", fr: "type beat IA", es: "type beat IA", pt: "type beat IA", de: "KI type beat", it: "type beat IA", nl: "AI type beat",
    ar: "type beat IA", ja: "AI type beat", ko: "AI type beat", tr: "AI type beat", hi: "AI type beat", zh: "AI type beat", th: "AI type beat",
  }),
  vibeKwGenerator: L({
    en: "AI beat generator", fr: "générateur beats IA", es: "generador beats IA", pt: "gerador beats IA", de: "KI-Beat-Generator", it: "generatore beat IA", nl: "AI beat generator",
    ar: "مولّد beats IA", ja: "AIビートジェネレーター", ko: "AI 비트 생성기", tr: "AI beat üretici", hi: "AI beat जनरेटर", zh: "AI 节拍生成器", th: "ตัวสร้าง AI beat",
  }),
  trendingTitleMeta: L({
    en: "Trending AI beats 2026 — remix hot vibes | ProducerHit", fr: "Trending beats IA 2026 — remix & vibes du moment | ProducerHit", es: "Beats IA trending 2026 — remix | ProducerHit", pt: "Beats IA trending 2026 — remix | ProducerHit", de: "Trending KI-Beats 2026 — Remix | ProducerHit", it: "Beat IA trending 2026 — remix | ProducerHit", nl: "Trending AI-beats 2026 — remix | ProducerHit",
    ar: "beats IA trending 2026 — remix | ProducerHit", ja: "トレンドAIビート2026 — remix | ProducerHit", ko: "트렌딩 AI 비트 2026 — remix | ProducerHit", tr: "Trend AI beat 2026 — remix | ProducerHit", hi: "ट्रेंडिंग AI beats 2026 — remix | ProducerHit", zh: "2026 热门 AI 节拍 — 混音 | ProducerHit", th: "AI beats trending 2026 — remix | ProducerHit",
  }),
  trendingDescription: L({
    en: "Most-loved AI beats right now on ProducerHit. Stream TikTok-ready trending tracks, remix community vibes, and create your type beat in 30 seconds.",
    fr: "Les beats IA les plus kiffés du moment sur ProducerHit. Écoute le trending TikTok-ready, remixe les vibes du flux et crée ton type beat en 30 secondes.",
    es: "Los beats IA más queridos ahora en ProducerHit. Escucha trending TikTok-ready, remixa vibes y crea tu type beat en 30 segundos.",
    pt: "Os beats IA mais amados agora no ProducerHit. Ouça trending TikTok-ready, remixe vibes e crie seu type beat em 30 segundos.",
    de: "Die beliebtesten KI-Beats gerade auf ProducerHit. Stream trending TikTok-ready, remixe Vibes und erstelle deinen Type Beat in 30 Sekunden.",
    it: "I beat IA più amati ora su ProducerHit. Ascolta trending TikTok-ready, remixa le vibe e crea il tuo type beat in 30 secondi.",
    nl: "Meest geliefde AI-beats nu op ProducerHit. Stream trending TikTok-ready, remix vibes en maak je type beat in 30 seconden.",
    ar: "أكثر beats IA إعجاباً الآن على ProducerHit. استمع trending TikTok-ready، remix vibes وأنشئ type beat في 30 ثانية.",
    ja: "ProducerHitで今最も人気のAIビート。TikTok-ready trendingを聴き、vibeをリミックス、30秒でtype beatを作成。",
    ko: "ProducerHit에서 지금 가장 사랑받는 AI 비트. TikTok-ready trending을 듣고 vibe를 리믹스, 30초에 type beat 생성.",
    tr: "ProducerHit'te şu an en sevilen AI beatler. TikTok-ready trending dinle, vibe'ları remix et, 30 saniyede type beat oluştur.",
    hi: "ProducerHit पर अभी सबसे पसंदीदा AI beats। TikTok-ready trending सुनें, vibes remix करें, 30 सेकंड में type beat बनाएँ।",
    zh: "ProducerHit 上当前最受欢迎的 AI 节拍。收听 TikTok-ready trending，混音氛围，30 秒创作 type beat。",
    th: "AI beats ที่ชอบมากที่สุดตอนนี้บน ProducerHit ฟัง trending TikTok-ready remix vibe สร้าง type beat ใน 30 วินาที",
  }),
  trendingListName: L({
    en: "ProducerHit trending AI beats", fr: "Beats IA trending ProducerHit", es: "Beats IA trending ProducerHit", pt: "Beats IA trending ProducerHit", de: "ProducerHit trending KI-Beats", it: "Beat IA trending ProducerHit", nl: "ProducerHit trending AI-beats",
    ar: "beats IA trending ProducerHit", ja: "ProducerHitトレンドAIビート", ko: "ProducerHit 트렌딩 AI 비트", tr: "ProducerHit trend AI beat", hi: "ProducerHit trending AI beats", zh: "ProducerHit 热门 AI 节拍", th: "ProducerHit AI beats trending",
  }),
};

export function vibeCategoryTitle(category: CommunityVibeCategory, locale: AppLocale): string {
  return locale === "fr" ? category.title.fr : category.title.en;
}

export function vibeCategorySubtitle(category: CommunityVibeCategory, locale: AppLocale): string {
  return locale === "fr" ? category.subtitle.fr : category.subtitle.en;
}

export function buildCommunityHubUiCopy(locale: AppLocale) {
  const t = (key: keyof typeof COPY) => pickL(COPY[key], locale);

  return {
    feedPulse: t("feedPulse"),
    feedLiveChat: t("feedLiveChat"),
    warmingUpChat: t("warmingUpChat"),
    liveChat: t("liveChat"),
    liveChatHint: t("liveChatHint"),
    untitled: t("untitled"),
    joinConvo: t("joinConvo"),
    searchPlaceholder: t("searchPlaceholder"),
    allVibes: t("allVibes"),
    sort: t("sort"),
    sortNew: t("sortNew"),
    sortRandom: t("sortRandom"),
    seeAll: t("seeAll"),
    comment: t("comment"),
    open: t("open"),
    yours: t("yours"),
    badgeNew: t("badgeNew"),
    ariaPlay: (name: string) => i(pickL(COPY.ariaPlay, locale), { name }),
    ariaPause: (name: string) => i(pickL(COPY.ariaPause, locale), { name }),
    close: t("close"),
    onFeed: t("onFeed"),
    beFirst: t("beFirst"),
    fullPage: t("fullPage"),
    myTracksRail: t("myTracksRail"),
    freshDrops: t("freshDrops"),
    mostLoved: t("mostLoved"),
    discoveries: t("discoveries"),
    discoveriesSub: t("discoveriesSub"),
    feedTopPicks: t("feedTopPicks"),
    randomPicks: t("randomPicks"),
    fullCatalog: t("fullCatalog"),
    nothingHere: t("nothingHere"),
    emptyVibe: t("emptyVibe"),
    retry: t("retry"),
    createTrack: t("createTrack"),
    loading: t("loading"),
    privateLibrary: t("privateLibrary"),
    loadTimeout: t("loadTimeout"),
    loadFailed: t("loadFailed"),
    categoryTitle: (category: CommunityVibeCategory) => vibeCategoryTitle(category, locale),
    categorySubtitle: (category: CommunityVibeCategory) => vibeCategorySubtitle(category, locale),
    categoryRailSubtitle: (sort: CommunityRailSort) => {
      switch (sort) {
        case "newest":
          return t("railFreshInVibe");
        case "plays":
          return t("railMostPlayed");
        case "comments":
          return t("railMostDiscussed");
        case "shuffle":
          return t("railDailyPicks");
        default:
          return t("railTopLoved");
      }
    },
    catalogTitle: (opts: {
      activeCategory: CommunityVibeCategory | null;
      sort: "new" | "top" | "random";
      hasActiveFilters: boolean;
      count: number;
    }) => {
      const { activeCategory, sort, hasActiveFilters, count } = opts;
      if (activeCategory) return vibeCategoryTitle(activeCategory, locale);
      if (sort === "top") return t("feedTopPicks");
      if (sort === "random") return t("randomPicks");
      if (hasActiveFilters) {
        const tpl = count === 1 ? pickL(COPY.resultsOne, locale) : pickL(COPY.resultsMany, locale);
        return i(tpl, { count });
      }
      return t("fullCatalog");
    },
    seoFooter: {
      trendingTitle: t("seoTrendingTitle"),
      moreVibes: (title: string) => i(pickL(COPY.seoMoreVibes, locale), { title }),
      discoverByVibe: t("seoDiscoverByVibe"),
      trendingBody: t("seoTrendingBody"),
      hubBody: t("seoHubBody"),
      feedVibes: t("seoFeedVibes"),
      allFeed: t("seoAllFeed"),
      guides: t("seoGuides"),
      aiBeatsBlog: t("seoAiBeatsBlog"),
      communityVibes: t("seoCommunityVibes"),
      guidesNav: t("seoGuidesNav"),
    },
  };
}

export function buildCommunityVibeSeoMeta(
  locale: AppLocale,
  opts: { title: string; subtitle: string; trackCount?: number },
) {
  const titleLower = opts.title.toLowerCase();
  const subtitle = opts.subtitle;
  const countHint =
    opts.trackCount && opts.trackCount > 0
      ? locale === "fr"
        ? ` ${opts.trackCount} tracks publics.`
        : ` ${opts.trackCount} public tracks.`
      : "";
  const t = (key: keyof typeof COPY) => pickL(COPY[key], locale);
  return {
    titleMeta: i(pickL(COPY.vibeTitleMeta, locale), { title: opts.title }),
    description: i(pickL(COPY.vibeDescription, locale), {
      title: titleLower,
      subtitle,
      count: countHint,
    }),
    keywords: [
      i(pickL(COPY.vibeKwBeat, locale), { title: titleLower }),
      t("vibeKwCommunity"),
      t("vibeKwRemix"),
      t("vibeKwType"),
      t("vibeKwGenerator"),
      subtitle,
      "ProducerHit",
    ],
  };
}

export function buildTrendingSeoMeta(locale: AppLocale) {
  const t = (key: keyof typeof COPY) => pickL(COPY[key], locale);
  return {
    titleMeta: t("trendingTitleMeta"),
    description: t("trendingDescription"),
    listName: t("trendingListName"),
    keywords: [
      locale === "fr" ? "trending beats IA" : "trending AI beats",
      locale === "fr" ? "beat viral TikTok IA" : "viral TikTok AI beat",
      t("vibeKwRemix"),
      t("vibeKwGenerator"),
      t("vibeKwType"),
      "ProducerHit trending",
    ],
  };
}
