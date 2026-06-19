import type { AppLocale } from "./config";
import { L, pickL } from "./localized";
import type { CreatorType } from "@/lib/creatorProfile";

function i(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(vars[key] ?? ""));
}

const S = {
  loadingProfile: L({ en: "Loading profile…", fr: "Chargement du profil…", es: "Cargando perfil…", pt: "Carregando perfil…", de: "Profil wird geladen…", it: "Caricamento profilo…", nl: "Profiel laden…", ar: "جارٍ تحميل الملف…", ja: "プロフィール読み込み中…", ko: "프로필 로딩 중…", tr: "Profil yükleniyor…", hi: "प्रोफ़ाइल लोड…", zh: "加载个人资料…", th: "กำลังโหลดโปรไฟล์…" }),
  navProfile: L({ en: "Profile", fr: "Profil", es: "Perfil", pt: "Perfil", de: "Profil", it: "Profilo", nl: "Profiel", ar: "الملف", ja: "プロフィール", ko: "프로필", tr: "Profil", hi: "प्रोफ़ाइल", zh: "资料", th: "โปรไฟล์" }),
  navProgress: L({ en: "Progress", fr: "Progression", es: "Progreso", pt: "Progresso", de: "Fortschritt", it: "Progressi", nl: "Voortgang", ar: "التقدم", ja: "進捗", ko: "진행", tr: "İlerleme", hi: "प्रगति", zh: "进度", th: "ความคืบหน้า" }),
  navReferral: L({ en: "Referral", fr: "Parrainage", es: "Referidos", pt: "Indicação", de: "Empfehlung", it: "Referral", nl: "Verwijzing", ar: "الإحالة", ja: "紹介", ko: "추천", tr: "Referans", hi: "रेफ़रल", zh: "推荐", th: "แนะนำเพื่อน" }),
  navPlan: L({ en: "Plan", fr: "Plan", es: "Plan", pt: "Plano", de: "Plan", it: "Piano", nl: "Plan", ar: "الخطة", ja: "プラン", ko: "플랜", tr: "Plan", hi: "प्लान", zh: "方案", th: "แพ็กเกจ" }),
  navSecurity: L({ en: "Security", fr: "Sécurité", es: "Seguridad", pt: "Segurança", de: "Sicherheit", it: "Sicurezza", nl: "Beveiliging", ar: "الأمان", ja: "セキュリティ", ko: "보안", tr: "Güvenlik", hi: "सुरक्षा", zh: "安全", th: "ความปลอดภัย" }),
  studioIdentity: L({ en: "Your studio identity", fr: "Identité publique du studio", es: "Tu identidad de estudio", pt: "Sua identidade de estúdio", de: "Deine Studio-Identität", it: "La tua identità studio", nl: "Je studio-identiteit", ar: "هوية الاستوديو العامة", ja: "スタジオの公開アイデンティティ", ko: "스튜디오 공개 아이덴티티", tr: "Stüdyo kimliğin", hi: "आपकी स्टूडियो पहचान", zh: "你的工作室公开身份", th: "ตัวตนสตูดิโอสาธารณะ" }),
  publicUsername: L({ en: "Public username", fr: "Username public", es: "Usuario público", pt: "Usuário público", de: "Öffentlicher Username", it: "Username pubblico", nl: "Openbare gebruikersnaam", ar: "اسم المستخدم العام", ja: "公開ユーザー名", ko: "공개 사용자명", tr: "Herkese açık kullanıcı adı", hi: "सार्वजनिक यूज़रनेम", zh: "公开用户名", th: "ชื่อผู้ใช้สาธารณะ" }),
  usernamePlaceholder: L({ en: "your_handle", fr: "ton_pseudo", es: "tu_usuario", pt: "seu_usuario", de: "dein_name", it: "tuo_nome", nl: "jouw_naam", ar: "اسمك", ja: "your_handle", ko: "your_handle", tr: "kullanici_adin", hi: "your_handle", zh: "your_handle", th: "your_handle" }),
  usernameHint: L({ en: "3–24 chars · letters, numbers, _ · shown on your public tracks", fr: "3–24 caractères · lettres, chiffres, _ · visible sur tes tracks publics", es: "3–24 caracteres · letras, números, _ · visible en tus tracks públicos", pt: "3–24 caracteres · letras, números, _ · visível nas suas faixas públicas", de: "3–24 Zeichen · Buchstaben, Zahlen, _ · auf öffentlichen Tracks sichtbar", it: "3–24 caratteri · lettere, numeri, _ · visibile sulle tue tracce pubbliche", nl: "3–24 tekens · letters, cijfers, _ · zichtbaar op je publieke tracks", ar: "3–24 حرفاً · أحرف وأرقام و_ · يظهر على مقاطعك العامة", ja: "3–24文字 · 英数字と_ · 公開トラックに表示", ko: "3–24자 · 영문, 숫자, _ · 공개 트랙에 표시", tr: "3–24 karakter · harf, rakam, _ · herkese açık parçalarda görünür", hi: "3–24 अक्षर · अक्षर, संख्या, _ · सार्वजनिक ट्रैक पर दिखेगा", zh: "3–24 字符 · 字母、数字、_ · 显示在公开曲目上", th: "3–24 ตัว · ตัวอักษร ตัวเลข _ · แสดงบนแทร็กสาธารณะ" }),
  viewPublicProfile: L({ en: "View public profile →", fr: "Voir mon profil public →", es: "Ver perfil público →", pt: "Ver perfil público →", de: "Öffentliches Profil →", it: "Vedi profilo pubblico →", nl: "Openbaar profiel →", ar: "عرض الملف العام →", ja: "公開プロフィール →", ko: "공개 프로필 →", tr: "Herkese açık profil →", hi: "सार्वजनिक प्रोफ़ाइल →", zh: "查看公开资料 →", th: "ดูโปรไฟล์สาธารณะ →" }),
  legalNameTitle: L({ en: "Legal name (commercial license)", fr: "Nom légal (licence commerciale)", es: "Nombre legal (licencia comercial)", pt: "Nome legal (licença comercial)", de: "Rechtlicher Name (kommerzielle Lizenz)", it: "Nome legale (licenza commerciale)", nl: "Juridische naam (commerciële licentie)", ar: "الاسم القانوني (ترخيص تجاري)", ja: "法的氏名（商用ライセンス）", ko: "법적 이름(상업적 라이선스)", tr: "Yasal ad (ticari lisans)", hi: "कानूनी नाम (व्यावसायिक लाइसेंस)", zh: "法定姓名（商业授权）", th: "ชื่อตามกฎหมาย (ใบอนุญาตเชิงพาณิชย์)" }),
  legalNameHint: L({ en: "Private — used on your per-track unique certificates (Pro+). Not shown on your public profile.", fr: "Privé — utilisé sur tes certificats uniques par titre (Pro+). Non visible sur ton profil public.", es: "Privado — usado en certificados únicos por pista (Pro+). No visible en tu perfil público.", pt: "Privado — usado nos certificados únicos por faixa (Pro+). Não visível no perfil público.", de: "Privat — für einzigartige Zertifikate pro Track (Pro+). Nicht im öffentlichen Profil.", it: "Privato — usato sui certificati unici per traccia (Pro+). Non sul profilo pubblico.", nl: "Privé — voor unieke certificaten per track (Pro+). Niet op openbaar profiel.", ar: "خاص — يُستخدم على شهادات فريدة لكل مقطع (Pro+). غير ظاهر على ملفك العام.", ja: "非公開 — トラックごとの証明書（Pro+）に使用。公開プロフィールには表示されません。", ko: "비공개 — 트랙별 고유 인증서(Pro+)에 사용. 공개 프로필에 표시되지 않습니다.", tr: "Gizli — parça başına benzersiz sertifikalarda (Pro+) kullanılır. Herkese açık profilde görünmez.", hi: "निजी — प्रति-ट्रैक प्रमाणपत्र (Pro+) पर। सार्वजनिक प्रोफ़ाइल पर नहीं।", zh: "私密 — 用于每首曲目的唯一证书（Pro+）。不会显示在公开资料上。", th: "ส่วนตัว — ใช้กับใบรับรองต่อเพลง (Pro+) ไม่แสดงบนโปรไฟล์สาธารณะ" }),
  firstName: L({ en: "First name", fr: "Prénom", es: "Nombre", pt: "Nome", de: "Vorname", it: "Nome", nl: "Voornaam", ar: "الاسم الأول", ja: "名", ko: "이름", tr: "Ad", hi: "पहला नाम", zh: "名", th: "ชื่อ" }),
  lastName: L({ en: "Last name", fr: "Nom", es: "Apellido", pt: "Sobrenome", de: "Nachname", it: "Cognome", nl: "Achternaam", ar: "اسم العائلة", ja: "姓", ko: "성", tr: "Soyad", hi: "उपनाम", zh: "姓", th: "นามสกุล" }),
  creatorType: L({ en: "Creator type", fr: "Type de créateur", es: "Tipo de creador", pt: "Tipo de criador", de: "Creator-Typ", it: "Tipo di creator", nl: "Creator-type", ar: "نوع المنشئ", ja: "クリエイタータイプ", ko: "크리에이터 유형", tr: "İçerik üretici türü", hi: "क्रिएटर प्रकार", zh: "创作者类型", th: "ประเภทครีเอเตอร์" }),
  choose: L({ en: "Choose…", fr: "Choisir…", es: "Elegir…", pt: "Escolher…", de: "Wählen…", it: "Scegli…", nl: "Kies…", ar: "اختر…", ja: "選択…", ko: "선택…", tr: "Seç…", hi: "चुनें…", zh: "选择…", th: "เลือก…" }),
  bioPlaceholder: L({ en: "Beatmaker, artist, TikTok…", fr: "Beatmaker, artiste, TikTok…", es: "Beatmaker, artista, TikTok…", pt: "Beatmaker, artista, TikTok…", de: "Beatmaker, Künstler, TikTok…", it: "Beatmaker, artista, TikTok…", nl: "Beatmaker, artiest, TikTok…", ar: "Beatmaker، فنان، TikTok…", ja: "Beatmaker、アーティスト、TikTok…", ko: "비트메이커, 아티스트, TikTok…", tr: "Beatmaker, sanatçı, TikTok…", hi: "Beatmaker, कलाकार, TikTok…", zh: "Beatmaker、艺人、TikTok…", th: "Beatmaker, ศิลปิน, TikTok…" }),
  website: L({ en: "Website", fr: "Site web", es: "Sitio web", pt: "Site", de: "Website", it: "Sito web", nl: "Website", ar: "الموقع", ja: "ウェブサイト", ko: "웹사이트", tr: "Web sitesi", hi: "वेबसाइट", zh: "网站", th: "เว็บไซต์" }),
  invalidLegalName: L({ en: "Invalid legal name", fr: "Nom légal invalide", es: "Nombre legal inválido", pt: "Nome legal inválido", de: "Ungültiger rechtlicher Name", it: "Nome legale non valido", nl: "Ongeldige juridische naam", ar: "اسم قانوني غير صالح", ja: "無効な法的氏名", ko: "잘못된 법적 이름", tr: "Geçersiz yasal ad", hi: "अमान्य कानूनी नाम", zh: "法定姓名无效", th: "ชื่อตามกฎหมายไม่ถูกต้อง" }),
  profileSaved: L({ en: "Profile saved", fr: "Profil sauvegardé", es: "Perfil guardado", pt: "Perfil salvo", de: "Profil gespeichert", it: "Profilo salvato", nl: "Profiel opgeslagen", ar: "تم حفظ الملف", ja: "プロフィールを保存しました", ko: "프로필 저장됨", tr: "Profil kaydedildi", hi: "प्रोफ़ाइल सहेजी गई", zh: "资料已保存", th: "บันทึกโปรไฟล์แล้ว" }),
  saveProfile: L({ en: "Save profile", fr: "Sauvegarder le profil", es: "Guardar perfil", pt: "Salvar perfil", de: "Profil speichern", it: "Salva profilo", nl: "Profiel opslaan", ar: "حفظ الملف", ja: "プロフィールを保存", ko: "프로필 저장", tr: "Profili kaydet", hi: "प्रोफ़ाइल सहेजें", zh: "保存资料", th: "บันทึกโปรไฟล์" }),
  appearance: L({ en: "Appearance", fr: "Apparence", es: "Apariencia", pt: "Aparência", de: "Erscheinungsbild", it: "Aspetto", nl: "Weergave", ar: "المظهر", ja: "外観", ko: "모양", tr: "Görünüm", hi: "दिखावट", zh: "外观", th: "ลักษณะ" }),
  studioTheme: L({ en: "Studio theme", fr: "Thème studio", es: "Tema del estudio", pt: "Tema do estúdio", de: "Studio-Theme", it: "Tema studio", nl: "Studio-thema", ar: "سمة الاستوديو", ja: "スタジオテーマ", ko: "스튜디오 테마", tr: "Stüdyo teması", hi: "स्टूडियो थीम", zh: "工作室主题", th: "ธีมสตูดิโอ" }),
  subscription: L({ en: "Subscription", fr: "Abonnement", es: "Suscripción", pt: "Assinatura", de: "Abonnement", it: "Abbonamento", nl: "Abonnement", ar: "الاشتراك", ja: "サブスクリプション", ko: "구독", tr: "Abonelik", hi: "सब्सक्रिप्शन", zh: "订阅", th: "การสมัคร" }),
  planBilling: L({ en: "Plan & billing", fr: "Plan & facturation", es: "Plan y facturación", pt: "Plano e cobrança", de: "Plan & Abrechnung", it: "Piano e fatturazione", nl: "Plan & facturering", ar: "الخطة والفوترة", ja: "プランと請求", ko: "플랜 및 결제", tr: "Plan ve faturalama", hi: "प्लान और बिलिंग", zh: "方案与账单", th: "แพ็กเกจและการเรียกเก็บ" }),
  hdExports: L({ en: "HD exports", fr: "Exports HD", es: "Exportaciones HD", pt: "Exports HD", de: "HD-Exports", it: "Export HD", nl: "HD-export", ar: "تصدير HD", ja: "HDエクスポート", ko: "HD 익스포트", tr: "HD export", hi: "HD एक्सपोर्ट", zh: "HD 导出", th: "ส่งออก HD" }),
  cloud: L({ en: "Cloud", fr: "Cloud", es: "Nube", pt: "Nuvem", de: "Cloud", it: "Cloud", nl: "Cloud", ar: "السحابة", ja: "クラウド", ko: "클라우드", tr: "Bulut", hi: "क्लाउड", zh: "云", th: "คลาวด์" }),
  community: L({ en: "Community", fr: "Communauté", es: "Comunidad", pt: "Comunidade", de: "Community", it: "Community", nl: "Community", ar: "المجتمع", ja: "コミュニティ", ko: "커뮤니티", tr: "Topluluk", hi: "कम्युनिटी", zh: "社区", th: "ชุมชน" }),
  upgrade: L({ en: "Upgrade", fr: "Upgrade", es: "Mejorar", pt: "Upgrade", de: "Upgrade", it: "Upgrade", nl: "Upgrade", ar: "ترقية", ja: "アップグレード", ko: "업그레이드", tr: "Yükselt", hi: "अपग्रेड", zh: "升级", th: "อัปเกรด" }),
  loading: L({ en: "Loading…", fr: "Chargement…", es: "Cargando…", pt: "Carregando…", de: "Laden…", it: "Caricamento…", nl: "Laden…", ar: "جارٍ التحميل…", ja: "読み込み中…", ko: "로딩 중…", tr: "Yükleniyor…", hi: "लोड…", zh: "加载中…", th: "กำลังโหลด…" }),
  manage: L({ en: "Manage", fr: "Gérer", es: "Gestionar", pt: "Gerir", de: "Verwalten", it: "Gestisci", nl: "Beheren", ar: "إدارة", ja: "管理", ko: "관리", tr: "Yönet", hi: "प्रबंधित करें", zh: "管理", th: "จัดการ" }),
  referralProgram: L({ en: "Referral program", fr: "Parrainage", es: "Programa de referidos", pt: "Programa de indicação", de: "Empfehlungsprogramm", it: "Programma referral", nl: "Verwijzingsprogramma", ar: "برنامج الإحالة", ja: "紹介プログラム", ko: "추천 프로그램", tr: "Referans programı", hi: "रेफ़रल प्रोग्राम", zh: "推荐计划", th: "โปรแกรมแนะนำ" }),
  referralSubtitle: L({ en: "+{{referrerBonus}} for you · {{refereeTotal}} for them", fr: "+{{referrerBonus}} gen pour toi · {{refereeTotal}} gen pour eux", es: "+{{referrerBonus}} para ti · {{refereeTotal}} para ellos", pt: "+{{referrerBonus}} para você · {{refereeTotal}} para eles", de: "+{{referrerBonus}} für dich · {{refereeTotal}} für sie", it: "+{{referrerBonus}} per te · {{refereeTotal}} per loro", nl: "+{{referrerBonus}} voor jou · {{refereeTotal}} voor hen", ar: "+{{referrerBonus}} لك · {{refereeTotal}} لهم", ja: "あなた+{{referrerBonus}} · 相手{{refereeTotal}}", ko: "당신 +{{referrerBonus}} · 상대 {{refereeTotal}}", tr: "Sen +{{referrerBonus}} · onlar {{refereeTotal}}", hi: "आप +{{referrerBonus}} · उन्हें {{refereeTotal}}", zh: "你 +{{referrerBonus}} · 对方 {{refereeTotal}}", th: "คุณ +{{referrerBonus}} · พวกเขา {{refereeTotal}}" }),
  howItWorks: L({ en: "How it works", fr: "Comment ça marche", es: "Cómo funciona", pt: "Como funciona", de: "So funktioniert's", it: "Come funziona", nl: "Hoe het werkt", ar: "كيف يعمل", ja: "仕組み", ko: "작동 방식", tr: "Nasıl çalışır", hi: "कैसे काम करता है", zh: "如何运作", th: "วิธีการทำงาน" }),
  referralStep1: L({ en: "Share your link — {{refereeTotal}} generations on signup.", fr: "Envoie ton lien — {{refereeTotal}} générations dès l'inscription.", es: "Comparte tu enlace — {{refereeTotal}} generaciones al registrarse.", pt: "Compartilhe seu link — {{refereeTotal}} gerações no cadastro.", de: "Link teilen — {{refereeTotal}} Generierungen bei Anmeldung.", it: "Condividi il link — {{refereeTotal}} generazioni all'iscrizione.", nl: "Deel je link — {{refereeTotal}} generaties bij aanmelding.", ar: "شارك رابطك — {{refereeTotal}} توليدات عند التسجيل.", ja: "リンクを共有 — 登録で{{refereeTotal}}回。", ko: "링크 공유 — 가입 시 {{refereeTotal}}회.", tr: "Linkini paylaş — kayıtta {{refereeTotal}} üretim.", hi: "लिंक शेयर करें — साइनअप पर {{refereeTotal}} जनरेशन।", zh: "分享链接 — 注册即得 {{refereeTotal}} 次。", th: "แชร์ลิงก์ — สมัครแล้วได้ {{refereeTotal}} ครั้ง" }),
  referralStep2: L({ en: "You get +{{referrerBonus}} gen per signup.", fr: "Tu reçois +{{referrerBonus}} gen par filleul inscrit.", es: "Recibes +{{referrerBonus}} gen por cada registro.", pt: "Você recebe +{{referrerBonus}} gen por cadastro.", de: "Du erhältst +{{referrerBonus}} Gen pro Anmeldung.", it: "Ricevi +{{referrerBonus}} gen per iscrizione.", nl: "Je krijgt +{{referrerBonus}} gen per aanmelding.", ar: "تحصل على +{{referrerBonus}} لكل تسجيل.", ja: "登録1件ごとに+{{referrerBonus}}。", ko: "가입당 +{{referrerBonus}}.", tr: "Kayıt başına +{{referrerBonus}} alırsın.", hi: "प्रति साइनअप +{{referrerBonus}}।", zh: "每成功推荐 +{{referrerBonus}}。", th: "ได้ +{{referrerBonus}} ต่อการสมัคร" }),
  referralBonus: L({ en: "Referral +{{n}}", fr: "Parrainage +{{n}}", es: "Referido +{{n}}", pt: "Indicação +{{n}}", de: "Empfehlung +{{n}}", it: "Referral +{{n}}", nl: "Verwijzing +{{n}}", ar: "إحالة +{{n}}", ja: "紹介 +{{n}}", ko: "추천 +{{n}}", tr: "Referans +{{n}}", hi: "रेफ़रल +{{n}}", zh: "推荐 +{{n}}", th: "แนะนำ +{{n}}" }),
  levelsBonus: L({ en: "Levels +{{n}}", fr: "Niveaux +{{n}}", es: "Niveles +{{n}}", pt: "Níveis +{{n}}", de: "Level +{{n}}", it: "Livelli +{{n}}", nl: "Levels +{{n}}", ar: "المستويات +{{n}}", ja: "レベル +{{n}}", ko: "레벨 +{{n}}", tr: "Seviye +{{n}}", hi: "लेवल +{{n}}", zh: "等级 +{{n}}", th: "เลเวล +{{n}}" }),
  dailyBonus: L({ en: "Daily +{{n}}", fr: "Daily +{{n}}", es: "Diario +{{n}}", pt: "Diário +{{n}}", de: "Täglich +{{n}}", it: "Giornaliero +{{n}}", nl: "Dagelijks +{{n}}", ar: "يومي +{{n}}", ja: "デイリー +{{n}}", ko: "일일 +{{n}}", tr: "Günlük +{{n}}", hi: "दैनिक +{{n}}", zh: "每日 +{{n}}", th: "รายวัน +{{n}}" }),
  inviteLink: L({ en: "Invite link", fr: "Lien d'invitation", es: "Enlace de invitación", pt: "Link de convite", de: "Einladungslink", it: "Link invito", nl: "Uitnodigingslink", ar: "رابط الدعوة", ja: "招待リンク", ko: "초대 링크", tr: "Davet linki", hi: "आमंत्रण लिंक", zh: "邀请链接", th: "ลิงก์เชิญ" }),
  generating: L({ en: "Generating…", fr: "Génération…", es: "Generando…", pt: "Gerando…", de: "Wird generiert…", it: "Generazione…", nl: "Genereren…", ar: "جارٍ الإنشاء…", ja: "生成中…", ko: "생성 중…", tr: "Oluşturuluyor…", hi: "जनरेट…", zh: "生成中…", th: "กำลังสร้าง…" }),
  linkCopied: L({ en: "Link copied", fr: "Lien copié", es: "Enlace copiado", pt: "Link copiado", de: "Link kopiert", it: "Link copiato", nl: "Link gekopieerd", ar: "تم نسخ الرابط", ja: "リンクをコピーしました", ko: "링크 복사됨", tr: "Link kopyalandı", hi: "लिंक कॉपी", zh: "链接已复制", th: "คัดลอกลิงก์แล้ว" }),
  copy: L({ en: "Copy", fr: "Copier", es: "Copiar", pt: "Copiar", de: "Kopieren", it: "Copia", nl: "Kopiëren", ar: "نسخ", ja: "コピー", ko: "복사", tr: "Kopyala", hi: "कॉपी", zh: "复制", th: "คัดลอก" }),
  code: L({ en: "Code", fr: "Code", es: "Código", pt: "Código", de: "Code", it: "Codice", nl: "Code", ar: "الرمز", ja: "コード", ko: "코드", tr: "Kod", hi: "कोड", zh: "代码", th: "โค้ด" }),
  share: L({ en: "Share", fr: "Partager", es: "Compartir", pt: "Compartilhar", de: "Teilen", it: "Condividi", nl: "Delen", ar: "مشاركة", ja: "共有", ko: "공유", tr: "Paylaş", hi: "शेयर", zh: "分享", th: "แชร์" }),
  discordHint: L({ en: "Challenges · bonus credits · FR/ES/PT lounges", fr: "Challenges · crédits bonus · salons FR/ES/PT", es: "Retos · créditos bonus · salas FR/ES/PT", pt: "Desafios · créditos bônus · salas FR/ES/PT", de: "Challenges · Bonus-Credits · FR/ES/PT-Lounges", it: "Challenge · crediti bonus · lounge FR/ES/PT", nl: "Challenges · bonuscredits · FR/ES/PT-lounges", ar: "تحديات · رصيد إضافي · صالات FR/ES/PT", ja: "チャレンジ · ボーナスクレジット · FR/ES/PTラウンジ", ko: "챌린지 · 보너스 크레dit · FR/ES/PT 라운지", tr: "Meydan okumalar · bonus kredi · FR/ES/PT salonları", hi: "चैलेंज · बोनस क्रेडिट · FR/ES/PT लाउंज", zh: "挑战 · 奖励额度 · FR/ES/PT 社群", th: "ชาllenge · เครดิตโบนัส · ห้อง FR/ES/PT" }),
  join: L({ en: "Join", fr: "Rejoindre", es: "Unirse", pt: "Entrar", de: "Beitreten", it: "Unisciti", nl: "Deelnemen", ar: "انضم", ja: "参加", ko: "참여", tr: "Katıl", hi: "जुड़ें", zh: "加入", th: "เข้าร่วม" }),
  hub: L({ en: "Hub", fr: "Hub", es: "Hub", pt: "Hub", de: "Hub", it: "Hub", nl: "Hub", ar: "المركز", ja: "ハブ", ko: "허브", tr: "Hub", hi: "हब", zh: "中心", th: "ฮับ" }),
  accountSecurity: L({ en: "Account & security", fr: "Compte & sécurité", es: "Cuenta y seguridad", pt: "Conta e segurança", de: "Konto & Sicherheit", it: "Account e sicurezza", nl: "Account & beveiliging", ar: "الحساب والأمان", ja: "アカウントとセキュリティ", ko: "계정 및 보안", tr: "Hesap ve güvenlik", hi: "खाता और सुरक्षा", zh: "账户与安全", th: "บัญชีและความปลอดภัย" }),
  signInSession: L({ en: "Sign-in, password, session", fr: "Connexion, mot de passe, session", es: "Inicio de sesión, contraseña, sesión", pt: "Login, senha, sessão", de: "Anmeldung, Passwort, Sitzung", it: "Accesso, password, sessione", nl: "Inloggen, wachtwoord, sessie", ar: "تسجيل الدخول وكلمة المرور والجلسة", ja: "サインイン、パスワード、セッション", ko: "로그인, 비밀번호, 세션", tr: "Giriş, şifre, oturum", hi: "साइन-इन, पासवर्ड, सत्र", zh: "登录、密码、会话", th: "เข้าสู่ระบบ รหัสผ่าน เซสชัน" }),
  email: L({ en: "Email", fr: "Email", es: "Email", pt: "Email", de: "E-Mail", it: "Email", nl: "E-mail", ar: "البريد", ja: "メール", ko: "이메일", tr: "E-posta", hi: "ईमेल", zh: "邮箱", th: "อีเมล" }),
  redirecting: L({ en: "Redirecting…", fr: "Redirection…", es: "Redirigiendo…", pt: "Redirecionando…", de: "Weiterleitung…", it: "Reindirizzamento…", nl: "Doorverwijzen…", ar: "جارٍ إعادة التوجيه…", ja: "リダイレクト中…", ko: "리디렉션 중…", tr: "Yönlendiriliyor…", hi: "रीडायरेक्ट…", zh: "正在跳转…", th: "กำลังเปลี่ยนเส้นทาง…" }),
  linkGoogle: L({ en: "Link Google", fr: "Lier Google", es: "Vincular Google", pt: "Vincular Google", de: "Google verknüpfen", it: "Collega Google", nl: "Google koppelen", ar: "ربط Google", ja: "Googleを連携", ko: "Google 연결", tr: "Google bağla", hi: "Google लिंक", zh: "关联 Google", th: "เชื่อม Google" }),
  setPasswordHint: L({ en: "Set a password to sign in without Google.", fr: "Définis un mot de passe pour te connecter sans Google.", es: "Define una contraseña para iniciar sesión sin Google.", pt: "Defina uma senha para entrar sem Google.", de: "Passwort festlegen, um ohne Google anzumelden.", it: "Imposta una password per accedere senza Google.", nl: "Stel een wachtwoord in om in te loggen zonder Google.", ar: "عيّن كلمة مرور لتسجيل الدخول بدون Google.", ja: "Googleなしでログインするパスワードを設定。", ko: "Google 없이 로그인할 비밀번호를 설정하세요.", tr: "Google olmadan giriş için şifre belirle.", hi: "Google के बिना साइन इन के लिए पासवर्ड सेट करें।", zh: "设置密码以便不使用 Google 登录。", th: "ตั้งรหัสผ่านเพื่อเข้าสู่ระบบโดยไม่ใช้ Google" }),
  passwordPlaceholder: L({ en: "Password (6+ chars)", fr: "Mot de passe (6+ car.)", es: "Contraseña (6+ car.)", pt: "Senha (6+ car.)", de: "Passwort (6+ Zeichen)", it: "Password (6+ car.)", nl: "Wachtwoord (6+ tekens)", ar: "كلمة المرور (6+ أحرف)", ja: "パスワード（6文字以上）", ko: "비밀번호(6자 이상)", tr: "Şifre (6+ karakter)", hi: "पासवर्ड (6+ अक्षर)", zh: "密码（6 位以上）", th: "รหัสผ่าน (6+ ตัว)" }),
  passwordSaved: L({ en: "Password saved", fr: "Mot de passe enregistré", es: "Contraseña guardada", pt: "Senha salva", de: "Passwort gespeichert", it: "Password salvata", nl: "Wachtwoord opgeslagen", ar: "تم حفظ كلمة المرور", ja: "パスワードを保存しました", ko: "비밀번호 저장됨", tr: "Şifre kaydedildi", hi: "पासवर्ड सहेजा", zh: "密码已保存", th: "บันทึกรหัสผ่านแล้ว" }),
  saving: L({ en: "Saving…", fr: "Enregistrement…", es: "Guardando…", pt: "Salvando…", de: "Speichern…", it: "Salvataggio…", nl: "Opslaan…", ar: "جارٍ الحفظ…", ja: "保存中…", ko: "저장 중…", tr: "Kaydediliyor…", hi: "सहेज रहे…", zh: "保存中…", th: "กำลังบันทึก…" }),
  setPassword: L({ en: "Set password", fr: "Créer mot de passe", es: "Crear contraseña", pt: "Criar senha", de: "Passwort erstellen", it: "Crea password", nl: "Wachtwoord instellen", ar: "إنشاء كلمة مرور", ja: "パスワードを作成", ko: "비밀번호 설정", tr: "Şifre oluştur", hi: "पासवर्ड सेट करें", zh: "设置密码", th: "ตั้งรหัสผ่าน" }),
  emailSent: L({ en: "Email sent", fr: "Email envoyé", es: "Email enviado", pt: "Email enviado", de: "E-Mail gesendet", it: "Email inviata", nl: "E-mail verzonden", ar: "تم إرسال البريد", ja: "メールを送信しました", ko: "이메일 전송됨", tr: "E-posta gönderildi", hi: "ईमेल भेजा", zh: "邮件已发送", th: "ส่งอีเมลแล้ว" }),
  changePassword: L({ en: "Change password", fr: "Changer mot de passe", es: "Cambiar contraseña", pt: "Alterar senha", de: "Passwort ändern", it: "Cambia password", nl: "Wachtwoord wijzigen", ar: "تغيير كلمة المرور", ja: "パスワードを変更", ko: "비밀번호 변경", tr: "Şifreyi değiştir", hi: "पासवर्ड बदलें", zh: "更改密码", th: "เปลี่ยนรหัสผ่าน" }),
  deleteAccount: L({ en: "Delete account", fr: "Supprimer compte", es: "Eliminar cuenta", pt: "Excluir conta", de: "Konto löschen", it: "Elimina account", nl: "Account verwijderen", ar: "حذف الحساب", ja: "アカウントを削除", ko: "계정 삭제", tr: "Hesabı sil", hi: "खाता हटाएँ", zh: "删除账户", th: "ลบบัญชี" }),
  signedOut: L({ en: "Signed out", fr: "Déconnecté", es: "Sesión cerrada", pt: "Desconectado", de: "Abgemeldet", it: "Disconnesso", nl: "Uitgelogd", ar: "تم تسجيل الخروج", ja: "サインアウトしました", ko: "로그아웃됨", tr: "Çıkış yapıldı", hi: "साइन आउट", zh: "已退出", th: "ออกจากระบบแล้ว" }),
  signOut: L({ en: "Sign out", fr: "Déconnexion", es: "Cerrar sesión", pt: "Sair", de: "Abmelden", it: "Esci", nl: "Uitloggen", ar: "تسجيل الخروج", ja: "サインアウト", ko: "로그아웃", tr: "Çıkış yap", hi: "साइन आउट", zh: "退出登录", th: "ออกจากระบบ" }),
  deleteManual: L({ en: "Account deletion is manual (MVP).", fr: "Suppression de compte gérée manuellement (MVP).", es: "Eliminación de cuenta manual (MVP).", pt: "Exclusão de conta manual (MVP).", de: "Kontolöschung manuell (MVP).", it: "Eliminazione account manuale (MVP).", nl: "Accountverwijdering handmatig (MVP).", ar: "حذف الحساب يدوي (MVP).", ja: "アカウント削除は手動（MVP）。", ko: "계정 삭제는 수동(MVP)입니다.", tr: "Hesap silme manuel (MVP).", hi: "खाता हटाना मैन्युअल (MVP)।", zh: "账户删除为人工处理（MVP）。", th: "การลบบัญชีทำด้วยตนเอง (MVP)" }),
  personalSpace: L({ en: "Personal space", fr: "Espace personnel", es: "Espacio personal", pt: "Espaço pessoal", de: "Persönlicher Bereich", it: "Spazio personale", nl: "Persoonlijke ruimte", ar: "مساحة شخصية", ja: "パーソナルスペース", ko: "개인 공간", tr: "Kişisel alan", hi: "व्यक्तिगत स्थान", zh: "个人空间", th: "พื้นที่ส่วนตัว" }),
  publicProfileShort: L({ en: "Public profile →", fr: "Profil public →", es: "Perfil público →", pt: "Perfil público →", de: "Öffentliches Profil →", it: "Profilo pubblico →", nl: "Openbaar profiel →", ar: "الملف العام →", ja: "公開プロフィール →", ko: "공개 프로필 →", tr: "Herkese açık profil →", hi: "सार्वजनिक प्रोफ़ाइल →", zh: "公开资料 →", th: "โปรไฟล์สาธารณะ →" }),
  quotaLeft: L({ en: "left", fr: "restants", es: "restantes", pt: "restantes", de: "übrig", it: "rimasti", nl: "over", ar: "متبقية", ja: "残り", ko: "남음", tr: "kaldı", hi: "बचे", zh: "剩余", th: "เหลือ" }),
  thisMonth: L({ en: "this month", fr: "ce mois", es: "este mes", pt: "este mês", de: "diesen Monat", it: "questo mese", nl: "deze maand", ar: "هذا الشهر", ja: "今月", ko: "이번 달", tr: "bu ay", hi: "इस महीने", zh: "本月", th: "เดือนนี้" }),
  settingsSections: L({ en: "Settings sections", fr: "Sections paramètres", es: "Secciones de ajustes", pt: "Seções de configurações", de: "Einstellungsbereiche", it: "Sezioni impostazioni", nl: "Instellingen secties", ar: "أقسام الإعدادات", ja: "設定セクション", ko: "설정 섹션", tr: "Ayar bölümleri", hi: "सेटिंग्स अनुभाग", zh: "设置分区", th: "ส่วนการตั้งค่า" }),
  quotaAria: L({ en: "{{remaining}} generations left of {{limit}}", fr: "{{remaining}} générations restantes sur {{limit}}", es: "{{remaining}} generaciones restantes de {{limit}}", pt: "{{remaining}} gerações restantes de {{limit}}", de: "{{remaining}} Generierungen übrig von {{limit}}", it: "{{remaining}} generazioni rimaste su {{limit}}", nl: "{{remaining}} generaties over van {{limit}}", ar: "{{remaining}} توليدات متبقية من {{limit}}", ja: "残り{{remaining}}/{{limit}}回", ko: "{{limit}} 중 {{remaining}}회 남음", tr: "{{limit}} içinden {{remaining}} kaldı", hi: "{{limit}} में से {{remaining}} बचे", zh: "剩余 {{remaining}}/{{limit}} 次", th: "เหลือ {{remaining}} จาก {{limit}}" }),
  referralShareText: L({ en: "I make beats with ProducerHit — try with my link", fr: "Je crée mes beats avec ProducerHit — essaie avec mon lien", es: "Creo beats con ProducerHit — prueba con mi enlace", pt: "Faço beats com ProducerHit — teste com meu link", de: "Ich mache Beats mit ProducerHit — probier meinen Link", it: "Creo beat con ProducerHit — prova con il mio link", nl: "Ik maak beats met ProducerHit — probeer mijn link", ar: "أصنع beats مع ProducerHit — جرّب برابطي", ja: "ProducerHitでビート制作 — リンクから試して", ko: "ProducerHit로 비트 제작 — 내 링크로 시도", tr: "ProducerHit ile beat yapıyorum — linkimle dene", hi: "ProducerHit से beats बनाता हूँ — मेरे लिंक से आज़माएँ", zh: "我用 ProducerHit 做节拍 — 用我的链接试试", th: "ฉันทำบีทกับ ProducerHit — ลองผ่านลิงก์ของฉัน" }),
};

const CREATOR_TYPES: Record<CreatorType, ReturnType<typeof L>> = {
  beatmaker: L({ en: "Beatmaker", fr: "Beatmaker", es: "Beatmaker", pt: "Beatmaker", de: "Beatmaker", it: "Beatmaker", nl: "Beatmaker", ar: "Beatmaker", ja: "Beatmaker", ko: "Beatmaker", tr: "Beatmaker", hi: "Beatmaker", zh: "Beatmaker", th: "Beatmaker" }),
  producer: L({ en: "Producer", fr: "Producteur", es: "Productor", pt: "Produtor", de: "Producer", it: "Producer", nl: "Producer", ar: "منتج", ja: "プロデューサー", ko: "프로듀서", tr: "Prodüktör", hi: "प्रोड्यूसर", zh: "制作人", th: "โปรดิวเซอร์" }),
  artist: L({ en: "Artist", fr: "Artiste", es: "Artista", pt: "Artista", de: "Künstler", it: "Artista", nl: "Artiest", ar: "فنان", ja: "アーティスト", ko: "아티스트", tr: "Sanatçı", hi: "कलाकार", zh: "艺人", th: "ศิลปิน" }),
  singer: L({ en: "Singer", fr: "Chanteur·se", es: "Cantante", pt: "Cantor(a)", de: "Sänger/in", it: "Cantante", nl: "Zanger(es)", ar: "مغني", ja: "シンガー", ko: "가수", tr: "Şarkıcı", hi: "गायक", zh: "歌手", th: "นักร้อง" }),
  youtuber: L({ en: "YouTuber", fr: "YouTuber", es: "YouTuber", pt: "YouTuber", de: "YouTuber", it: "YouTuber", nl: "YouTuber", ar: "YouTuber", ja: "YouTuber", ko: "YouTuber", tr: "YouTuber", hi: "YouTuber", zh: "YouTuber", th: "YouTuber" }),
  content_creator: L({ en: "Content creator", fr: "Créateur de contenu", es: "Creador de contenido", pt: "Criador de conteúdo", de: "Content Creator", it: "Content creator", nl: "Content creator", ar: "صانع محتوى", ja: "コンテンツクリエイター", ko: "콘텐츠 크리에이터", tr: "İçerik üreticisi", hi: "कंटेंट क्रिएटर", zh: "内容创作者", th: "ครีเอเตอร์คอนเทนต์" }),
  dj: L({ en: "DJ", fr: "DJ", es: "DJ", pt: "DJ", de: "DJ", it: "DJ", nl: "DJ", ar: "DJ", ja: "DJ", ko: "DJ", tr: "DJ", hi: "DJ", zh: "DJ", th: "DJ" }),
  other: L({ en: "Other", fr: "Autre", es: "Otro", pt: "Outro", de: "Andere", it: "Altro", nl: "Anders", ar: "أخرى", ja: "その他", ko: "기타", tr: "Diğer", hi: "अन्य", zh: "其他", th: "อื่นๆ" }),
};

const USERNAME = {
  required: L({ en: "Username required", fr: "Username requis", es: "Usuario requerido", pt: "Usuário obrigatório", de: "Username erforderlich", it: "Username richiesto", nl: "Gebruikersnaam verplicht", ar: "اسم المستخدم مطلوب", ja: "ユーザー名が必要", ko: "사용자명 필요", tr: "Kullanıcı adı gerekli", hi: "यूज़रनेम आवश्यक", zh: "需要用户名", th: "ต้องมีชื่อผู้ใช้" }),
  length: L({ en: "3 to 24 characters", fr: "3 à 24 caractères", es: "3 a 24 caracteres", pt: "3 a 24 caracteres", de: "3 bis 24 Zeichen", it: "3–24 caratteri", nl: "3 tot 24 tekens", ar: "3 إلى 24 حرفاً", ja: "3〜24文字", ko: "3~24자", tr: "3–24 karakter", hi: "3 से 24 अक्षर", zh: "3–24 个字符", th: "3–24 ตัวอักษร" }),
  format: L({ en: "Letters, numbers and _ only", fr: "Lettres, chiffres et _ uniquement", es: "Solo letras, números y _", pt: "Apenas letras, números e _", de: "Nur Buchstaben, Zahlen und _", it: "Solo lettere, numeri e _", nl: "Alleen letters, cijfers en _", ar: "أحرف وأرقام و_ فقط", ja: "英数字と_のみ", ko: "영문, 숫자, _만", tr: "Yalnızca harf, rakam ve _", hi: "केवल अक्षर, संख्या और _", zh: "仅限字母、数字和 _", th: "ตัวอักษร ตัวเลข และ _ เท่านั้น" }),
};

const LEGAL = {
  min: L({ en: "At least 2 characters", fr: "Minimum 2 caractères", es: "Mínimo 2 caracteres", pt: "Mínimo 2 caracteres", de: "Mindestens 2 Zeichen", it: "Minimo 2 caratteri", nl: "Minimaal 2 tekens", ar: "حرفان على الأقل", ja: "2文字以上", ko: "최소 2자", tr: "En az 2 karakter", hi: "कम से कम 2 अक्षर", zh: "至少 2 个字符", th: "อย่างน้อย 2 ตัว" }),
  max: L({ en: "Maximum 60 characters", fr: "Maximum 60 caractères", es: "Máximo 60 caracteres", pt: "Máximo 60 caracteres", de: "Maximal 60 Zeichen", it: "Massimo 60 caratteri", nl: "Maximaal 60 tekens", ar: "60 حرفاً كحد أقصى", ja: "最大60文字", ko: "최대 60자", tr: "En fazla 60 karakter", hi: "अधिकतम 60 अक्षर", zh: "最多 60 个字符", th: "สูงสุด 60 ตัว" }),
  invalid: L({ en: "Invalid characters", fr: "Caractères invalides", es: "Caracteres inválidos", pt: "Caracteres inválidos", de: "Ungültige Zeichen", it: "Caratteri non validi", nl: "Ongeldige tekens", ar: "أحرف غير صالحة", ja: "無効な文字", ko: "잘못된 문자", tr: "Geçersiz karakterler", hi: "अमान्य अक्षर", zh: "无效字符", th: "อักขระไม่ถูกต้อง" }),
};

const PROFILE_ERRORS: Record<string, ReturnType<typeof L>> = {
  username_taken: L({ en: "Username already taken", fr: "Ce username est déjà pris", es: "Usuario ya en uso", pt: "Usuário já em uso", de: "Username bereits vergeben", it: "Username già in uso", nl: "Gebruikersnaam bezet", ar: "اسم المستخدم مستخدم", ja: "ユーザー名は使用中", ko: "사용자명 사용 중", tr: "Kullanıcı adı alınmış", hi: "यूज़रनेम लिया गया", zh: "用户名已被占用", th: "ชื่อผู้ใช้ถูกใช้แล้ว" }),
  profile_not_found: L({ en: "Profile not found — sign in again.", fr: "Profil introuvable — reconnecte-toi.", es: "Perfil no encontrado — inicia sesión.", pt: "Perfil não encontrado — entre novamente.", de: "Profil nicht gefunden — erneut anmelden.", it: "Profilo non trovato — accedi di nuovo.", nl: "Profiel niet gevonden — opnieuw inloggen.", ar: "الملف غير موجود — سجّل الدخول.", ja: "プロフィールが見つかりません — 再ログイン。", ko: "프로필 없음 — 다시 로그인.", tr: "Profil bulunamadı — tekrar giriş yap.", hi: "प्रोफ़ाइल नहीं मिली — फिर साइन इन।", zh: "未找到资料 — 请重新登录。", th: "ไม่พบโปรไฟล์ — เข้าสู่ระบบอีกครั้ง" }),
  not_authenticated: L({ en: "Sign in to continue", fr: "Connecte-toi pour continuer", es: "Inicia sesión para continuar", pt: "Entre para continuar", de: "Anmelden zum Fortfahren", it: "Accedi per continuare", nl: "Log in om door te gaan", ar: "سجّل الدخول للمتابعة", ja: "続行するにはサインイン", ko: "계속하려면 로그인", tr: "Devam etmek için giriş yap", hi: "जारी रखने के लिए साइन इन", zh: "请登录以继续", th: "เข้าสู่ระบบเพื่อดำเนินการต่อ" }),
  save_failed: L({ en: "Could not save", fr: "Impossible de sauvegarder", es: "No se pudo guardar", pt: "Não foi possível salvar", de: "Speichern fehlgeschlagen", it: "Impossibile salvare", nl: "Opslaan mislukt", ar: "تعذّر الحفظ", ja: "保存できませんでした", ko: "저장 실패", tr: "Kaydedilemedi", hi: "सहेज नहीं सके", zh: "无法保存", th: "บันทึกไม่สำเร็จ" }),
};

function pick(map: Record<string, ReturnType<typeof L>>, key: string, locale: AppLocale): string {
  return pickL(map[key] ?? map.save_failed!, locale);
}

export function buildSettingsSection(locale: AppLocale) {
  const t = (key: keyof typeof S) => pickL(S[key], locale);
  return {
    loadingProfile: t("loadingProfile"),
    navProfile: t("navProfile"),
    navProgress: t("navProgress"),
    navReferral: t("navReferral"),
    navPlan: t("navPlan"),
    navSecurity: t("navSecurity"),
    studioIdentity: t("studioIdentity"),
    publicUsername: t("publicUsername"),
    usernamePlaceholder: t("usernamePlaceholder"),
    usernameHint: t("usernameHint"),
    viewPublicProfile: t("viewPublicProfile"),
    legalNameTitle: t("legalNameTitle"),
    legalNameHint: t("legalNameHint"),
    firstName: t("firstName"),
    lastName: t("lastName"),
    creatorType: t("creatorType"),
    choose: t("choose"),
    bioPlaceholder: t("bioPlaceholder"),
    website: t("website"),
    invalidLegalName: t("invalidLegalName"),
    profileSaved: t("profileSaved"),
    saveProfile: t("saveProfile"),
    appearance: t("appearance"),
    studioTheme: t("studioTheme"),
    subscription: t("subscription"),
    planBilling: t("planBilling"),
    hdExports: t("hdExports"),
    cloud: t("cloud"),
    community: t("community"),
    upgrade: t("upgrade"),
    loading: t("loading"),
    manage: t("manage"),
    referralProgram: t("referralProgram"),
    howItWorks: t("howItWorks"),
    inviteLink: t("inviteLink"),
    generating: t("generating"),
    linkCopied: t("linkCopied"),
    copy: t("copy"),
    code: t("code"),
    share: t("share"),
    discordHint: t("discordHint"),
    join: t("join"),
    hub: t("hub"),
    accountSecurity: t("accountSecurity"),
    signInSession: t("signInSession"),
    email: t("email"),
    redirecting: t("redirecting"),
    linkGoogle: t("linkGoogle"),
    setPasswordHint: t("setPasswordHint"),
    passwordPlaceholder: t("passwordPlaceholder"),
    passwordSaved: t("passwordSaved"),
    saving: t("saving"),
    setPassword: t("setPassword"),
    emailSent: t("emailSent"),
    changePassword: t("changePassword"),
    deleteAccount: t("deleteAccount"),
    signedOut: t("signedOut"),
    signOut: t("signOut"),
    deleteManual: t("deleteManual"),
    personalSpace: t("personalSpace"),
    publicProfileShort: t("publicProfileShort"),
    quotaLeft: t("quotaLeft"),
    thisMonth: t("thisMonth"),
    settingsSections: t("settingsSections"),
    referralSubtitle: (referrerBonus: number, refereeTotal: number) =>
      i(pickL(S.referralSubtitle, locale), { referrerBonus, refereeTotal }),
    referralStep1: (refereeTotal: number) => i(pickL(S.referralStep1, locale), { refereeTotal }),
    referralStep2: (referrerBonus: number) => i(pickL(S.referralStep2, locale), { referrerBonus }),
    referralBonusLabel: (n: number) => i(pickL(S.referralBonus, locale), { n }),
    levelsBonusLabel: (n: number) => i(pickL(S.levelsBonus, locale), { n }),
    dailyBonusLabel: (n: number) => i(pickL(S.dailyBonus, locale), { n }),
    quotaAria: (remaining: number, limit: number) =>
      i(pickL(S.quotaAria, locale), { remaining, limit }),
    referralShareText: t("referralShareText"),
  };
}

export function creatorTypeLabelI18n(type: CreatorType | null | undefined, locale: AppLocale): string {
  if (!type) return "";
  return pickL(CREATOR_TYPES[type], locale);
}

export function validateUsernameI18n(username: string, locale: AppLocale, required = false): string | null {
  const trimmed = username.trim();
  if (!trimmed) return required ? pickL(USERNAME.required, locale) : null;
  if (trimmed.length < 3 || trimmed.length > 24) return pickL(USERNAME.length, locale);
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) return pickL(USERNAME.format, locale);
  return null;
}

export function validateLegalNameI18n(value: string, locale: AppLocale): string | null {
  const trimmed = value.trim();
  if (trimmed.length < 2) return pickL(LEGAL.min, locale);
  if (trimmed.length > 60) return pickL(LEGAL.max, locale);
  if (/[0-9@#$%^&*()+={}\[\]|\\;:"<>?/`~]/.test(trimmed)) return pickL(LEGAL.invalid, locale);
  return null;
}

export function creatorProfileErrorMessageI18n(code: string, locale: AppLocale): string {
  if (code === "username_taken" || /username.*taken/i.test(code)) return pickL(PROFILE_ERRORS.username_taken, locale);
  if (code === "profile_not_found") return pickL(PROFILE_ERRORS.profile_not_found, locale);
  if (code === "not_authenticated") return pickL(PROFILE_ERRORS.not_authenticated, locale);
  if (/username.*3.*24/i.test(code)) return pickL(USERNAME.length, locale);
  if (/format|invalid.*username/i.test(code)) return pickL(USERNAME.format, locale);
  if (code && code !== "save_failed") return `${pickL(PROFILE_ERRORS.save_failed, locale)}: ${code}`;
  return pickL(PROFILE_ERRORS.save_failed, locale);
}

export function creatorTypeOptionsI18n(locale: AppLocale) {
  return (Object.keys(CREATOR_TYPES) as CreatorType[]).map((value) => ({
    value,
    label: pickL(CREATOR_TYPES[value], locale),
  }));
}
