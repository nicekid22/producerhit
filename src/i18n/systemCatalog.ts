import type { AppLocale } from "./config";
import { extractErrorMessage, isAuthNotReadyError, isBenignProfileSyncError } from "@/lib/errorMessage";
import { L, pickL, resolveSection } from "./localized";

const AUTH = {
  invalidCredentials: L({
    en: "Invalid email or password. Signed up with Google? Use Continue with Google or Forgot password to set one.",
    fr: "Email ou mot de passe incorrect. Inscrit avec Google ? Utilise « Continuer avec Google » ou « Mot de passe oublié » pour en créer un.",
    es: "Email o contraseña incorrectos. ¿Te registraste con Google? Usa Continuar con Google o Olvidé mi contraseña.",
    pt: "E-mail ou senha inválidos. Cadastrou-se com o Google? Use Continuar com o Google ou Esqueci a senha para definir uma.",
    de: "Ungültige E-Mail oder Passwort. Mit Google registriert? Nutze Weiter mit Google oder Passwort vergessen.",
    it: "Email o password non validi. Iscritto con Google? Usa Continua con Google o Password dimenticata per crearne una.",
    nl: "Ongeldig e-mailadres of wachtwoord. Aangemeld met Google? Gebruik Doorgaan met Google of Wachtwoord vergeten om er een in te stellen.",
    ar: "البريد الإلكتروني أو كلمة المرور غير صحيحة. سجّلت عبر Google؟ استخدم المتابعة مع Google أو نسيت كلمة المرور لإنشاء واحدة.",
    ja: "メールアドレスまたはパスワードが正しくありません。Googleで登録しましたか？「Googleで続行」または「パスワードを忘れた場合」をご利用ください。",
    ko: "이메일 또는 비밀번호가 올바르지 않습니다. Google로 가입하셨나요? Google로 계속하기 또는 비밀번호 찾기를 사용하세요.",
    tr: "Geçersiz e-posta veya şifre. Google ile kayıt oldunuz mu? Google ile devam et veya şifre oluşturmak için Şifremi unuttum'u kullanın.",
    hi: "अमान्य ईमेल या पासवर्ड। Google से साइन अप किया? Google के साथ जारी रखें या पासवर्ड सेट करने के लिए पासवर्ड भूल गए का उपयोग करें।",
    zh: "邮箱或密码无效。使用 Google 注册？请使用「通过 Google 继续」或「忘记密码」来设置密码。",
    th: "อีเมลหรือรหัสผ่านไม่ถูกต้อง สมัครด้วย Google หรือไม่? ใช้ดำเนินการต่อด้วย Google หรือลืมรหัสผ่านเพื่อตั้งรหัสใหม่",
  }),
  userAlreadyRegistered: L({
    en: "An account already exists with this email. Sign in, use Google, or Forgot password.",
    fr: "Un compte existe déjà avec cet email. Connecte-toi, utilise Google, ou « Mot de passe oublié ».",
    es: "Ya existe una cuenta con este email. Inicia sesión, usa Google u Olvidé mi contraseña.",
    pt: "Já existe uma conta com este e-mail. Entre, use o Google ou Esqueci a senha.",
    de: "Ein Konto mit dieser E-Mail existiert bereits. Melde dich an, nutze Google oder Passwort vergessen.",
    it: "Esiste già un account con questa email. Accedi, usa Google o Password dimenticata.",
    nl: "Er bestaat al een account met dit e-mailadres. Log in, gebruik Google of Wachtwoord vergeten.",
    ar: "يوجد حساب بهذا البريد الإلكتروني بالفعل. سجّل الدخول أو استخدم Google أو نسيت كلمة المرور.",
    ja: "このメールアドレスのアカウントは既に存在します。ログインするか、Googleを使うか、パスワードを忘れた場合をご利用ください。",
    ko: "이 이메일로 이미 계정이 있습니다. 로그인하거나 Google을 사용하거나 비밀번호 찾기를 이용하세요.",
    tr: "Bu e-posta ile zaten bir hesap var. Giriş yapın, Google kullanın veya Şifremi unuttum'u deneyin.",
    hi: "इस ईमेल से पहले से खाता मौजूद है। साइन इन करें, Google का उपयोग करें या पासवर्ड भूल गए।",
    zh: "该邮箱已有账户。请登录、使用 Google 或「忘记密码」。",
    th: "มีบัญชีด้วยอีเมลนี้อยู่แล้ว เข้าสู่ระบบ ใช้ Google หรือลืมรหัสผ่าน",
  }),
  emailNotConfirmed: L({
    en: "Confirm your email before signing in (check your inbox).",
    fr: "Confirme ton email avant de te connecter (vérifie ta boîte mail).",
    es: "Confirma tu email antes de iniciar sesión (revisa tu bandeja).",
    pt: "Confirme seu e-mail antes de entrar (verifique sua caixa de entrada).",
    de: "Bestätige deine E-Mail vor der Anmeldung (Posteingang prüfen).",
    it: "Conferma la tua email prima di accedere (controlla la posta in arrivo).",
    nl: "Bevestig je e-mail voordat je inlogt (controleer je inbox).",
    ar: "أكّد بريدك الإلكتروني قبل تسجيل الدخول (تحقق من صندوق الوارد).",
    ja: "ログイン前にメールアドレスを確認してください（受信トレイをご確認ください）。",
    ko: "로그인 전에 이메일을 확인하세요(받은편지함을 확인하세요).",
    tr: "Giriş yapmadan önce e-postanızı onaylayın (gelen kutunuzu kontrol edin).",
    hi: "साइन इन करने से पहले अपना ईमेल पुष्टि करें (अपना इनबॉक्स देखें)।",
    zh: "登录前请确认邮箱（请查收收件箱）。",
    th: "ยืนยันอีเมลก่อนเข้าสู่ระบบ (ตรวจสอบกล่องจดหมาย)",
  }),
  linkingDisabled: L({
    en: "Account linking must be enabled in Supabase Auth (Manual linking).",
    fr: "La liaison de comptes doit être activée dans Supabase Auth (Manual linking).",
    es: "La vinculación de cuentas debe estar activada en Supabase Auth (Manual linking).",
    pt: "A vinculação de contas deve estar ativada no Supabase Auth (Manual linking).",
    de: "Kontoverknüpfung muss in Supabase Auth aktiviert sein (Manual linking).",
    it: "Il collegamento degli account deve essere attivato in Supabase Auth (Manual linking).",
    nl: "Accountkoppeling moet zijn ingeschakeld in Supabase Auth (Manual linking).",
    ar: "يجب تفعيل ربط الحسابات في Supabase Auth (Manual linking).",
    ja: "Supabase Authでアカウント連携を有効にする必要があります（Manual linking）。",
    ko: "Supabase Auth에서 계정 연결(Manual linking)을 활성화해야 합니다.",
    tr: "Supabase Auth'ta hesap bağlama etkinleştirilmelidir (Manual linking).",
    hi: "Supabase Auth में खाता लिंकिंग सक्षम होनी चाहिए (Manual linking)।",
    zh: "必须在 Supabase Auth 中启用账户关联（Manual linking）。",
    th: "ต้องเปิดใช้การเชื่อมบัญชีใน Supabase Auth (Manual linking)",
  }),
  identityAlreadyLinked: L({
    en: "This Google email is already linked to another account. Sign in with that account or use the same email.",
    fr: "Cet email Google est déjà lié à un autre compte. Connecte-toi avec ce compte ou utilise le même email.",
    es: "Este email de Google ya está vinculado a otra cuenta. Inicia sesión con esa cuenta o usa el mismo email.",
    pt: "Este e-mail do Google já está vinculado a outra conta. Entre com essa conta ou use o mesmo e-mail.",
    de: "Diese Google-E-Mail ist bereits mit einem anderen Konto verknüpft. Melde dich mit diesem Konto an.",
    it: "Questa email Google è già collegata a un altro account. Accedi con quell'account o usa la stessa email.",
    nl: "Dit Google-e-mailadres is al gekoppeld aan een ander account. Log in met dat account of gebruik hetzelfde e-mailadres.",
    ar: "بريد Google هذا مرتبط بحساب آخر بالفعل. سجّل الدخول بذلك الحساب أو استخدم نفس البريد الإلكتروني.",
    ja: "このGoogleメールは既に別のアカウントに連携されています。そのアカウントでログインするか、同じメールアドレスを使用してください。",
    ko: "이 Google 이메일은 이미 다른 계정에 연결되어 있습니다. 해당 계정으로 로그인하거나 같은 이메일을 사용하세요.",
    tr: "Bu Google e-postası zaten başka bir hesaba bağlı. O hesapla giriş yapın veya aynı e-postayı kullanın.",
    hi: "यह Google ईमेल पहले से किसी अन्य खाते से जुड़ा है। उस खाते से साइन इन करें या वही ईमेल उपयोग करें।",
    zh: "此 Google 邮箱已关联到其他账户。请使用该账户登录或使用相同邮箱。",
    th: "อีเมล Google นี้เชื่อมกับบัญชีอื่นแล้ว เข้าสู่ระบบด้วยบัญชีนั้นหรือใช้อีเมลเดียวกัน",
  }),
  oauthSessionMissing: L({
    en: "Google session missing — retry or add /auth/callback to Supabase redirect URLs.",
    fr: "Session Google introuvable — réessaie ou vérifie l'URL de redirection /auth/callback dans Supabase.",
    es: "Sesión de Google no encontrada — reintenta o añade /auth/callback en Supabase.",
    pt: "Sessão do Google ausente — tente novamente ou adicione /auth/callback às URLs de redirecionamento do Supabase.",
    de: "Google-Sitzung fehlt — erneut versuchen oder /auth/callback in Supabase hinterlegen.",
    it: "Sessione Google mancante — riprova o aggiungi /auth/callback agli URL di reindirizzamento Supabase.",
    nl: "Google-sessie ontbreekt — probeer opnieuw of voeg /auth/callback toe aan Supabase-redirect-URL's.",
    ar: "جلسة Google مفقودة — أعد المحاولة أو أضف /auth/callback إلى عناوين إعادة التوجيه في Supabase.",
    ja: "Googleセッションが見つかりません — 再試行するか、SupabaseのリダイレクトURLに/auth/callbackを追加してください。",
    ko: "Google 세션이 없습니다 — 다시 시도하거나 Supabase 리디렉션 URL에 /auth/callback을 추가하세요.",
    tr: "Google oturumu eksik — tekrar deneyin veya Supabase yönlendirme URL'lerine /auth/callback ekleyin.",
    hi: "Google सत्र गायब है — पुनः प्रयास करें या Supabase रीडायरेक्ट URL में /auth/callback जोड़ें।",
    zh: "缺少 Google 会话 — 请重试或在 Supabase 重定向 URL 中添加 /auth/callback。",
    th: "ไม่พบเซสชัน Google — ลองอีกครั้งหรือเพิ่ม /auth/callback ใน URL เปลี่ยนเส้นทางของ Supabase",
  }),
  pkceInterrupted: L({
    en: "Sign-in interrupted — retry from the same browser (not private browsing).",
    fr: "Connexion interrompue — réessaie depuis le même navigateur (pas de navigation privée).",
    es: "Inicio de sesión interrumpido — reintenta en el mismo navegador (sin modo incógnito).",
    pt: "Login interrompido — tente novamente no mesmo navegador (sem navegação privada).",
    de: "Anmeldung unterbrochen — im gleichen Browser erneut versuchen (kein Privatmodus).",
    it: "Accesso interrotto — riprova dallo stesso browser (non in navigazione privata).",
    nl: "Aanmelding onderbroken — probeer opnieuw in dezelfde browser (geen privénavigatie).",
    ar: "تمت مقاطعة تسجيل الدخول — أعد المحاولة من نفس المتصفح (ليس التصفح الخاص).",
    ja: "サインインが中断されました — 同じブラウザで再試行してください（プライベートブラウジングは不可）。",
    ko: "로그인이 중단되었습니다 — 같은 브라우저에서 다시 시도하세요(시크릿 모드 제외).",
    tr: "Giriş kesildi — aynı tarayıcıdan tekrar deneyin (gizli gezinme değil).",
    hi: "साइन-इन बाधित — उसी ब्राउज़र से पुनः प्रयास करें (प्राइवेट ब्राउज़िंग नहीं)।",
    zh: "登录中断 — 请在同一浏览器中重试（勿使用无痕模式）。",
    th: "การเข้าสู่ระบบถูกขัดจังหวะ — ลองอีกครั้งในเบราว์เซอร์เดิม (ไม่ใช่โหมดไม่ระบุตัวตน)",
  }),
  invalidGrant: L({
    en: "Google link expired or already used — tap Continue with Google again.",
    fr: "Lien Google expiré ou déjà utilisé — relance « Continuer avec Google ».",
    es: "Enlace de Google caducado o ya usado — pulsa Continuar con Google de nuevo.",
    pt: "Link do Google expirado ou já usado — toque em Continuar com o Google novamente.",
    de: "Google-Link abgelaufen oder bereits genutzt — erneut Weiter mit Google.",
    it: "Link Google scaduto o già usato — tocca di nuovo Continua con Google.",
    nl: "Google-link verlopen of al gebruikt — tik opnieuw op Doorgaan met Google.",
    ar: "رابط Google منتهٍ أو مستخدم بالفعل — اضغط المتابعة مع Google مرة أخرى.",
    ja: "Googleリンクの有効期限切れまたは使用済み — もう一度「Googleで続行」をタップしてください。",
    ko: "Google 링크가 만료되었거나 이미 사용됨 — Google로 계속하기를 다시 누르세요.",
    tr: "Google bağlantısının süresi doldu veya zaten kullanıldı — Google ile devam et'e tekrar dokunun.",
    hi: "Google लिंक समाप्त या पहले से उपयोग किया गया — फिर से Google के साथ जारी रखें पर टैप करें।",
    zh: "Google 链接已过期或已使用 — 请再次点击「通过 Google 继续」。",
    th: "ลิงก์ Google หมดอายุหรือใช้แล้ว — แตะดำเนินการต่อด้วย Google อีกครั้ง",
  }),
  databaseErrorNewUser: L({
    en: "Could not create your Studio profile — try again shortly. If it persists, contact support (database error).",
    fr: "Impossible de créer ton profil Studio — réessaie dans un instant. Si ça persiste, contacte le support (erreur base de données).",
    es: "No se pudo crear tu perfil Studio — inténtalo en un momento. Si persiste, contacta soporte.",
    pt: "Não foi possível criar seu perfil Studio — tente novamente em instantes. Se persistir, contate o suporte (erro de banco de dados).",
    de: "Studio-Profil konnte nicht erstellt werden — kurz warten und erneut versuchen. Bei anhaltendem Fehler Support kontaktieren.",
    it: "Impossibile creare il tuo profilo Studio — riprova tra poco. Se persiste, contatta il supporto (errore database).",
    nl: "Kon je Studio-profiel niet aanmaken — probeer het zo opnieuw. Blijft het probleem? Neem contact op met support (databasefout).",
    ar: "تعذّر إنشاء ملف Studio الخاص بك — أعد المحاولة قريباً. إذا استمر، تواصل مع الدعم (خطأ قاعدة البيانات).",
    ja: "Studioプロフィールを作成できませんでした — しばらくして再試行してください。続く場合はサポートにお問い合わせください（データベースエラー）。",
    ko: "Studio 프로필을 만들 수 없습니다 — 잠시 후 다시 시도하세요. 계속되면 지원팀에 문의하세요(데이터베이스 오류).",
    tr: "Studio profiliniz oluşturulamadı — kısa süre sonra tekrar deneyin. Devam ederse destekle iletişime geçin (veritabanı hatası).",
    hi: "आपका Studio प्रोफ़ाइल नहीं बनाया जा सका — थोड़ी देर बाद पुनः प्रयास करें। बनी रहे तो सहायता से संपर्क करें (डेटाबेस त्रुटि)।",
    zh: "无法创建 Studio 个人资料 — 请稍后重试。若持续出现，请联系支持（数据库错误）。",
    th: "สร้างโปรไฟล์ Studio ไม่ได้ — ลองอีกครั้งในไม่ช้า หากยังเป็นอยู่ ติดต่อฝ่ายสนับสนุน (ข้อผิดพลาดฐานข้อมูล)",
  }),
  serverErrorSignup: L({
    en: "Server error during sign-up — retry or use another email.",
    fr: "Erreur serveur à l'inscription — réessaie ou utilise un autre email.",
    es: "Error del servidor al registrarse — reintenta u otro email.",
    pt: "Erro do servidor no cadastro — tente novamente ou use outro e-mail.",
    de: "Serverfehler bei der Registrierung — erneut versuchen oder andere E-Mail.",
    it: "Errore del server durante la registrazione — riprova o usa un'altra email.",
    nl: "Serverfout bij registratie — probeer opnieuw of gebruik een ander e-mailadres.",
    ar: "خطأ في الخادم أثناء التسجيل — أعد المحاولة أو استخدم بريداً إلكترونياً آخر.",
    ja: "登録中にサーバーエラーが発生しました — 再試行するか、別のメールアドレスを使用してください。",
    ko: "가입 중 서버 오류 — 다시 시도하거나 다른 이메일을 사용하세요.",
    tr: "Kayıt sırasında sunucu hatası — tekrar deneyin veya başka bir e-posta kullanın.",
    hi: "साइन-अप के दौरान सर्वर त्रुटि — पुनः प्रयास करें या दूसरा ईमेल उपयोग करें।",
    zh: "注册时服务器错误 — 请重试或使用其他邮箱。",
    th: "ข้อผิดพลาดเซิร์ฟเวอร์ระหว่างสมัคร — ลองอีกครั้งหรือใช้อีเมลอื่น",
  }),
  googleSignInFailed: L({
    en: "Google sign-in failed. Try again.",
    fr: "Connexion Google impossible. Réessaie.",
    es: "No se pudo iniciar sesión con Google. Inténtalo de nuevo.",
    pt: "Falha no login com o Google. Tente novamente.",
    de: "Google-Anmeldung fehlgeschlagen. Erneut versuchen.",
    it: "Accesso con Google non riuscito. Riprova.",
    nl: "Google-aanmelding mislukt. Probeer opnieuw.",
    ar: "فشل تسجيل الدخول عبر Google. أعد المحاولة.",
    ja: "Googleサインインに失敗しました。もう一度お試しください。",
    ko: "Google 로그인에 실패했습니다. 다시 시도하세요.",
    tr: "Google ile giriş başarısız. Tekrar deneyin.",
    hi: "Google साइन-इन विफल। पुनः प्रयास करें।",
    zh: "Google 登录失败。请重试。",
    th: "เข้าสู่ระบบด้วย Google ไม่สำเร็จ ลองอีกครั้ง",
  }),
  passwordUpdateFailed: L({
    en: "Could not update password.",
    fr: "Impossible de mettre à jour le mot de passe.",
    es: "No se pudo actualizar la contraseña.",
    pt: "Não foi possível atualizar a senha.",
    de: "Passwort konnte nicht aktualisiert werden.",
    it: "Impossibile aggiornare la password.",
    nl: "Wachtwoord kon niet worden bijgewerkt.",
    ar: "تعذّر تحديث كلمة المرور.",
    ja: "パスワードを更新できませんでした。",
    ko: "비밀번호를 업데이트할 수 없습니다.",
    tr: "Şifre güncellenemedi.",
    hi: "पासवर्ड अपडेट नहीं किया जा सका।",
    zh: "无法更新密码。",
    th: "อัปเดตรหัสผ่านไม่ได้",
  }),
  linkGoogleFailed: L({
    en: "Could not link Google to this account.",
    fr: "Impossible de lier Google à ce compte.",
    es: "No se pudo vincular Google a esta cuenta.",
    pt: "Não foi possível vincular o Google a esta conta.",
    de: "Google konnte nicht mit diesem Konto verknüpft werden.",
    it: "Impossibile collegare Google a questo account.",
    nl: "Google kon niet aan dit account worden gekoppeld.",
    ar: "تعذّر ربط Google بهذا الحساب.",
    ja: "このアカウントにGoogleを連携できませんでした。",
    ko: "이 계정에 Google을 연결할 수 없습니다.",
    tr: "Google bu hesaba bağlanamadı.",
    hi: "इस खाते से Google लिंक नहीं किया जा सका।",
    zh: "无法将 Google 关联到此账户。",
    th: "เชื่อม Google กับบัญชีนี้ไม่ได้",
  }),
  authFailed: L({
    en: "Authentication failed.",
    fr: "Authentification impossible.",
    es: "Autenticación fallida.",
    pt: "Falha na autenticação.",
    de: "Authentifizierung fehlgeschlagen.",
    it: "Autenticazione non riuscita.",
    nl: "Authenticatie mislukt.",
    ar: "فشلت المصادقة.",
    ja: "認証に失敗しました。",
    ko: "인증에 실패했습니다.",
    tr: "Kimlik doğrulama başarısız.",
    hi: "प्रमाणीकरण विफल।",
    zh: "身份验证失败。",
    th: "การยืนยันตัวตนล้มเหลว",
  }),
};

const PROFILE = {
  sessionExpired: L({
    en: "Session expired — sign in again.",
    fr: "Session expirée — reconnecte-toi.",
    es: "Sesión caducada — inicia sesión de nuevo.",
    pt: "Sessão expirada — entre novamente.",
    de: "Sitzung abgelaufen — erneut anmelden.",
    it: "Sessione scaduta — accedi di nuovo.",
    nl: "Sessie verlopen — log opnieuw in.",
    ar: "انتهت الجلسة — سجّل الدخول مرة أخرى.",
    ja: "セッションの有効期限が切れました — 再度サインインしてください。",
    ko: "세션이 만료되었습니다 — 다시 로그인하세요.",
    tr: "Oturum süresi doldu — tekrar giriş yapın.",
    hi: "सत्र समाप्त — फिर से साइन इन करें।",
    zh: "会话已过期 — 请重新登录。",
    th: "เซสชันหมดอายุ — เข้าสู่ระบบอีกครั้ง",
  }),
  profileNotFound: L({
    en: "Profile not found — check that your account has a row in profiles.",
    fr: "Profil introuvable — vérifie que ton compte a une ligne dans profiles.",
    es: "Perfil no encontrado — comprueba que tu cuenta existe en profiles.",
    pt: "Perfil não encontrado — verifique se sua conta tem uma linha em profiles.",
    de: "Profil nicht gefunden — prüfe, ob dein Konto in profiles existiert.",
    it: "Profilo non trovato — verifica che il tuo account abbia una riga in profiles.",
    nl: "Profiel niet gevonden — controleer of je account een rij in profiles heeft.",
    ar: "الملف الشخصي غير موجود — تحقق من وجود صف لحسابك في profiles.",
    ja: "プロフィールが見つかりません — アカウントがprofilesに行を持っているか確認してください。",
    ko: "프로필을 찾을 수 없습니다 — 계정이 profiles에 행이 있는지 확인하세요.",
    tr: "Profil bulunamadı — hesabınızın profiles tablosunda bir satırı olduğunu kontrol edin.",
    hi: "प्रोफ़ाइल नहीं मिली — जाँचें कि आपके खाते की profiles में पंक्ति है।",
    zh: "未找到个人资料 — 请确认您的账户在 profiles 中有记录。",
    th: "ไม่พบโปรไฟล์ — ตรวจสอบว่าบัญชีของคุณมีแถวใน profiles",
  }),
  sqlFunctionMissing: L({
    en: "Missing SQL function — run migrations 022–027 in Supabase.",
    fr: "Fonction SQL manquante — exécute les migrations 022–027 dans Supabase.",
    es: "Función SQL faltante — ejecuta las migraciones 022–027 en Supabase.",
    pt: "Função SQL ausente — execute as migrações 022–027 no Supabase.",
    de: "SQL-Funktion fehlt — Migrationen 022–027 in Supabase ausführen.",
    it: "Funzione SQL mancante — esegui le migrazioni 022–027 in Supabase.",
    nl: "SQL-functie ontbreekt — voer migraties 022–027 uit in Supabase.",
    ar: "دالة SQL مفقودة — نفّذ الترحيلات 022–027 في Supabase.",
    ja: "SQL関数が見つかりません — Supabaseでマイグレーション022–027を実行してください。",
    ko: "SQL 함수가 없습니다 — Supabase에서 마이그레이션 022–027을 실행하세요.",
    tr: "SQL işlevi eksik — Supabase'de 022–027 migrasyonlarını çalıştırın.",
    hi: "SQL फ़ंक्शन गायब — Supabase में माइग्रेशन 022–027 चलाएँ।",
    zh: "缺少 SQL 函数 — 请在 Supabase 中运行迁移 022–027。",
    th: "ไม่พบฟังก์ชัน SQL — รันการย้ายข้อมูล 022–027 ใน Supabase",
  }),
  rlsDenied: L({
    en: "Profile access denied (RLS) — sign in again.",
    fr: "Accès profil refusé (RLS) — reconnecte-toi.",
    es: "Acceso al perfil denegado (RLS) — inicia sesión de nuevo.",
    pt: "Acesso ao perfil negado (RLS) — entre novamente.",
    de: "Profilzugriff verweigert (RLS) — erneut anmelden.",
    it: "Accesso al profilo negato (RLS) — accedi di nuovo.",
    nl: "Profieltoegang geweigerd (RLS) — log opnieuw in.",
    ar: "تم رفض الوصول إلى الملف الشخصي (RLS) — سجّل الدخول مرة أخرى.",
    ja: "プロフィールへのアクセスが拒否されました（RLS） — 再度サインインしてください。",
    ko: "프로필 접근이 거부되었습니다(RLS) — 다시 로그인하세요.",
    tr: "Profil erişimi reddedildi (RLS) — tekrar giriş yapın.",
    hi: "प्रोफ़ाइल एक्सेस अस्वीकृत (RLS) — फिर से साइन इन करें।",
    zh: "个人资料访问被拒绝（RLS）— 请重新登录。",
    th: "ปฏิเสธการเข้าถึงโปรไฟล์ (RLS) — เข้าสู่ระบบอีกครั้ง",
  }),
  signingIn: L({
    en: "Signing in… try again in a moment.",
    fr: "Connexion en cours… réessaie dans un instant.",
    es: "Iniciando sesión… inténtalo en un momento.",
    pt: "Entrando… tente novamente em instantes.",
    de: "Anmeldung läuft… gleich erneut versuchen.",
    it: "Accesso in corso… riprova tra un attimo.",
    nl: "Bezig met inloggen… probeer het zo opnieuw.",
    ar: "جارٍ تسجيل الدخول… أعد المحاولة بعد لحظة.",
    ja: "サインイン中… しばらくして再試行してください。",
    ko: "로그인 중… 잠시 후 다시 시도하세요.",
    tr: "Giriş yapılıyor… biraz sonra tekrar deneyin.",
    hi: "साइन इन हो रहा है… थोड़ी देर बाद पुनः प्रयास करें।",
    zh: "正在登录… 请稍后重试。",
    th: "กำลังเข้าสู่ระบบ… ลองอีกครั้งในไม่ช้า",
  }),
  loadFailedWithDetail: L({
    en: "Failed to load profile: ",
    fr: "Impossible de charger le profil : ",
    es: "No se pudo cargar el perfil: ",
    pt: "Falha ao carregar o perfil: ",
    de: "Profil konnte nicht geladen werden: ",
    it: "Impossibile caricare il profilo: ",
    nl: "Profiel laden mislukt: ",
    ar: "تعذّر تحميل الملف الشخصي: ",
    ja: "プロフィールの読み込みに失敗しました: ",
    ko: "프로필을 불러오지 못했습니다: ",
    tr: "Profil yüklenemedi: ",
    hi: "प्रोफ़ाइल लोड करने में विफल: ",
    zh: "加载个人资料失败：",
    th: "โหลดโปรไฟล์ไม่สำเร็จ: ",
  }),
  loadFailed: L({
    en: "Failed to load profile.",
    fr: "Impossible de charger le profil.",
    es: "No se pudo cargar el perfil.",
    pt: "Falha ao carregar o perfil.",
    de: "Profil konnte nicht geladen werden.",
    it: "Impossibile caricare il profilo.",
    nl: "Profiel laden mislukt.",
    ar: "تعذّر تحميل الملف الشخصي.",
    ja: "プロフィールの読み込みに失敗しました。",
    ko: "프로필을 불러오지 못했습니다.",
    tr: "Profil yüklenemedi.",
    hi: "प्रोफ़ाइल लोड करने में विफल।",
    zh: "加载个人资料失败。",
    th: "โหลดโปรไฟล์ไม่สำเร็จ",
  }),
};

const GENERATION = {
  genericFailed: L({
    en: "Generation failed — try again shortly",
    fr: "Génération échouée — réessaie dans un instant",
    es: "Generación fallida — inténtalo en un momento",
    pt: "Geração falhou — tente novamente em instantes",
    de: "Generierung fehlgeschlagen — gleich erneut versuchen",
    it: "Generazione non riuscita — riprova tra poco",
    nl: "Generatie mislukt — probeer het zo opnieuw",
    ar: "فشل التوليد — أعد المحاولة قريباً",
    ja: "生成に失敗しました — しばらくして再試行してください",
    ko: "생성 실패 — 잠시 후 다시 시도하세요",
    tr: "Oluşturma başarısız — kısa süre sonra tekrar deneyin",
    hi: "जनरेशन विफल — थोड़ी देर बाद पुनः प्रयास करें",
    zh: "生成失败 — 请稍后重试",
    th: "การสร้างล้มเหลว — ลองอีกครั้งในไม่ช้า",
  }),
  monthlyLimit: L({
    en: "Monthly limit reached",
    fr: "Limite mensuelle atteinte",
    es: "Límite mensual alcanzado",
    pt: "Limite mensal atingido",
    de: "Monatslimit erreicht",
    it: "Limite mensile raggiunto",
    nl: "Maandlimiet bereikt",
    ar: "تم الوصول إلى الحد الشهري",
    ja: "月間上限に達しました",
    ko: "월간 한도에 도달했습니다",
    tr: "Aylık limit doldu",
    hi: "मासिक सीमा पूरी हो गई",
    zh: "已达月度上限",
    th: "ถึงขีดจำกัดรายเดือนแล้ว",
  }),
  rateLimit429: L({
    en: "Lots of people generating right now — wait 30–60s and retry (or try 1 version).",
    fr: "Beaucoup de monde génère en ce moment — patiente 30–60 s et relance (ou 1 version).",
    es: "Mucha gente generando ahora — espera 30–60 s y reintenta (o 1 versión).",
    pt: "Muita gente gerando agora — aguarde 30–60 s e tente novamente (ou 1 versão).",
    de: "Viele generieren gerade — 30–60 s warten und erneut versuchen (oder 1 Version).",
    it: "Molti stanno generando ora — attendi 30–60 s e riprova (o 1 versione).",
    nl: "Veel mensen genereren nu — wacht 30–60 s en probeer opnieuw (of 1 versie).",
    ar: "الكثيرون يولّدون الآن — انتظر 30–60 ثانية وأعد المحاولة (أو نسخة واحدة).",
    ja: "現在多くの人が生成中です — 30〜60秒待って再試行してください（または1バージョン）。",
    ko: "지금 많은 사람이 생성 중입니다 — 30–60초 기다린 후 다시 시도하세요(또는 1개 버전).",
    tr: "Şu anda çok kişi oluşturuyor — 30–60 sn bekleyip tekrar deneyin (veya 1 sürüm).",
    hi: "अभी बहुत लोग जनरेट कर रहे हैं — 30–60 सेकंड प्रतीक्षा करें और पुनः प्रयास करें (या 1 संस्करण)।",
    zh: "当前生成人数较多 — 请等待 30–60 秒后重试（或尝试 1 个版本）。",
    th: "มีคนกำลังสร้างจำนวนมาก — รอ 30–60 วินาทีแล้วลองอีกครั้ง (หรือ 1 เวอร์ชัน)",
  }),
  capacityFree: L({
    en: "The network is a bit busy right now — try again in a few minutes. Pro skips ahead in the queue.",
    fr: "Le réseau est un peu chargé en ce moment — reprends dans quelques minutes. Sur Pro, tu passes en priorité dans la file.",
    es: "La red está algo saturada — reintenta en unos minutos. Pro tiene prioridad en la cola.",
    pt: "A rede está um pouco ocupada — tente novamente em alguns minutos. No Pro, você passa na frente na fila.",
    de: "Das Netzwerk ist etwas ausgelastet — in ein paar Minuten erneut versuchen. Pro hat Vorrang.",
    it: "La rete è un po' occupata — riprova tra qualche minuto. Con Pro salti la coda.",
    nl: "Het netwerk is nu wat druk — probeer het over een paar minuten opnieuw. Met Pro ga je voor in de rij.",
    ar: "الشبكة مشغولة قليلاً — أعد المحاولة بعد دقائق. Pro يتقدّم في الطابور.",
    ja: "ネットワークが少し混雑しています — 数分後に再試行してください。Proはキューを優先されます。",
    ko: "네트워크가 다소 혼잡합니다 — 몇 분 후 다시 시도하세요. Pro는 대기열에서 우선 처리됩니다.",
    tr: "Ağ şu an biraz yoğun — birkaç dakika sonra tekrar deneyin. Pro kuyrukta öne geçer.",
    hi: "नेटवर्क अभी थोड़ा व्यस्त है — कुछ मिनट बाद पुनः प्रयास करें। Pro कतार में आगे जाता है।",
    zh: "网络目前有些繁忙 — 请几分钟后再试。Pro 可优先排队。",
    th: "เครือข่ายค่อนข้างยุ่ง — ลองอีกครั้งในไม่กี่นาที Pro ข้ามคิวได้",
  }),
  capacityPaid: L({
    en: "The network is a bit busy — try again in a few minutes and let it finish.",
    fr: "Le réseau est un peu chargé — reprends dans quelques minutes, ton morceau finira de se générer.",
    es: "La red está algo saturada — reintenta en unos minutos y deja que termine.",
    pt: "A rede está um pouco ocupada — tente novamente em alguns minutos e deixe terminar.",
    de: "Netzwerk etwas ausgelastet — in ein paar Minuten erneut versuchen und fertig werden lassen.",
    it: "La rete è un po' occupata — riprova tra qualche minuto e lascia che finisca.",
    nl: "Het netwerk is wat druk — probeer het over een paar minuten opnieuw en laat het afronden.",
    ar: "الشبكة مشغولة قليلاً — أعد المحاولة بعد دقائق واتركه يكتمل.",
    ja: "ネットワークが少し混雑しています — 数分後に再試行し、完了までお待ちください。",
    ko: "네트워크가 다소 혼잡합니다 — 몇 분 후 다시 시도하고 완료될 때까지 기다리세요.",
    tr: "Ağ biraz yoğun — birkaç dakika sonra tekrar deneyin ve bitmesini bekleyin.",
    hi: "नेटवर्क थोड़ा व्यस्त है — कुछ मिनट बाद पुनः प्रयास करें और पूरा होने दें।",
    zh: "网络有些繁忙 — 请几分钟后再试并等待完成。",
    th: "เครือข่ายค่อนข้างยุ่ง — ลองอีกครั้งในไม่กี่นาทีและรอให้เสร็จ",
  }),
  serverUnavailable: L({
    en: "Server temporarily unavailable — try again shortly",
    fr: "Serveur temporairement indisponible — réessaie dans un instant",
    es: "Servidor temporalmente no disponible — inténtalo pronto",
    pt: "Servidor temporariamente indisponível — tente novamente em instantes",
    de: "Server vorübergehend nicht verfügbar — gleich erneut versuchen",
    it: "Server temporaneamente non disponibile — riprova tra poco",
    nl: "Server tijdelijk niet beschikbaar — probeer het zo opnieuw",
    ar: "الخادم غير متاح مؤقتاً — أعد المحاولة قريباً",
    ja: "サーバーが一時的に利用できません — しばらくして再試行してください",
    ko: "서버를 일시적으로 사용할 수 없습니다 — 잠시 후 다시 시도하세요",
    tr: "Sunucu geçici olarak kullanılamıyor — kısa süre sonra tekrar deneyin",
    hi: "सर्वर अस्थायी रूप से अनुपलब्ध — थोड़ी देर बाद पुनः प्रयास करें",
    zh: "服务器暂时不可用 — 请稍后重试",
    th: "เซิร์ฟเวอร์ไม่พร้อมใช้งานชั่วคราว — ลองอีกครั้งในไม่ช้า",
  }),
  aceHiccup: L({
    en: "Quick ACE hiccup — retry, it's usually temporary",
    fr: "Petit couac côté ACE — réessaie, c'est souvent passager",
    es: "Pequeño fallo de ACE — reintenta, suele ser temporal",
    pt: "Pequena falha no ACE — tente novamente, geralmente é temporário",
    de: "Kurzer ACE-Aussetzer — erneut versuchen, meist vorübergehend",
    it: "Piccolo intoppo ACE — riprova, di solito è temporaneo",
    nl: "Korte ACE-storing — probeer opnieuw, meestal tijdelijk",
    ar: "عطل بسيط في ACE — أعد المحاولة، عادةً مؤقت",
    ja: "ACEの一時的な不具合 — 再試行してください。通常は一時的です",
    ko: "ACE 일시적 오류 — 다시 시도하세요. 보통 일시적입니다",
    tr: "Kısa ACE aksaklığı — tekrar deneyin, genelde geçicidir",
    hi: "ACE में छोटी खराबी — पुनः प्रयास करें, आमतौर पर अस्थायी होती है",
    zh: "ACE 短暂故障 — 请重试，通常为临时问题",
    th: "ACE ขัดข้องชั่วคราว — ลองอีกครั้ง มักเป็นเรื่องชั่วคราว",
  }),
  noAudio: L({
    en: "ACE returned no audio — try again",
    fr: "ACE n'a pas renvoyé d'audio — relance la génération",
    es: "ACE no devolvió audio — reintenta la generación",
    pt: "O ACE não retornou áudio — tente gerar novamente",
    de: "ACE lieferte kein Audio — Generierung erneut starten",
    it: "ACE non ha restituito audio — riprova la generazione",
    nl: "ACE leverde geen audio — probeer opnieuw te genereren",
    ar: "لم يُرجع ACE أي صوت — أعد المحاولة",
    ja: "ACEがオーディオを返しませんでした — 再試行してください",
    ko: "ACE가 오디오를 반환하지 않았습니다 — 다시 시도하세요",
    tr: "ACE ses döndürmedi — tekrar deneyin",
    hi: "ACE ने कोई ऑडियो नहीं लौटाया — पुनः प्रयास करें",
    zh: "ACE 未返回音频 — 请重试",
    th: "ACE ไม่ส่งเสียงกลับมา — ลองอีกครั้ง",
  }),
};

const BILLING = {
  stripeComingSoon: L({
    en: "Stripe coming soon — contact support.",
    fr: "Stripe arrive bientôt — contacte le support.",
    es: "Stripe llegará pronto — contacta soporte.",
    pt: "Stripe em breve — contate o suporte.",
    de: "Stripe kommt bald — Support kontaktieren.",
    it: "Stripe in arrivo — contatta il supporto.",
    nl: "Stripe komt binnenkort — neem contact op met support.",
    ar: "Stripe قريباً — تواصل مع الدعم.",
    ja: "Stripeは近日対応予定 — サポートにお問い合わせください。",
    ko: "Stripe 곧 지원 예정 — 지원팀에 문의하세요.",
    tr: "Stripe yakında — destekle iletişime geçin.",
    hi: "Stripe जल्द आ रहा है — सहायता से संपर्क करें।",
    zh: "Stripe 即将上线 — 请联系支持。",
    th: "Stripe เร็วๆ นี้ — ติดต่อฝ่ายสนับสนุน",
  }),
  missingPublishableKey: L({
    en: "Missing Stripe publishable key (VITE_STRIPE_PUBLISHABLE_KEY).",
    fr: "Clé Stripe publishable manquante (VITE_STRIPE_PUBLISHABLE_KEY).",
    es: "Falta la clave publicable de Stripe (VITE_STRIPE_PUBLISHABLE_KEY).",
    pt: "Chave publicável do Stripe ausente (VITE_STRIPE_PUBLISHABLE_KEY).",
    de: "Stripe Publishable Key fehlt (VITE_STRIPE_PUBLISHABLE_KEY).",
    it: "Chiave pubblicabile Stripe mancante (VITE_STRIPE_PUBLISHABLE_KEY).",
    nl: "Stripe publishable key ontbreekt (VITE_STRIPE_PUBLISHABLE_KEY).",
    ar: "مفتاح Stripe القابل للنشر مفقود (VITE_STRIPE_PUBLISHABLE_KEY).",
    ja: "Stripe公開可能キーがありません（VITE_STRIPE_PUBLISHABLE_KEY）。",
    ko: "Stripe publishable 키가 없습니다(VITE_STRIPE_PUBLISHABLE_KEY).",
    tr: "Stripe publishable anahtarı eksik (VITE_STRIPE_PUBLISHABLE_KEY).",
    hi: "Stripe publishable कुंजी गायब है (VITE_STRIPE_PUBLISHABLE_KEY)।",
    zh: "缺少 Stripe 可发布密钥（VITE_STRIPE_PUBLISHABLE_KEY）。",
    th: "ไม่มี Stripe publishable key (VITE_STRIPE_PUBLISHABLE_KEY)",
  }),
  checkoutFallback: L({
    en: "Opening Stripe checkout (fallback mode).",
    fr: "Ouverture du paiement Stripe (mode secours).",
    es: "Abriendo pago Stripe (modo alternativo).",
    pt: "Abrindo checkout Stripe (modo alternativo).",
    de: "Stripe-Checkout wird geöffnet (Fallback-Modus).",
    it: "Apertura checkout Stripe (modalità alternativa).",
    nl: "Stripe-checkout openen (fallback-modus).",
    ar: "فتح دفع Stripe (وضع احتياطي).",
    ja: "Stripeチェックアウトを開いています（フォールバックモード）。",
    ko: "Stripe 결제를 엽니다(대체 모드).",
    tr: "Stripe ödeme açılıyor (yedek mod).",
    hi: "Stripe चेकआउट खोला जा रहा है (फ़ॉलबैक मोड)।",
    zh: "正在打开 Stripe 结账（备用模式）。",
    th: "กำลังเปิด Stripe checkout (โหมดสำรอง)",
  }),
  signInToUpgrade: L({
    en: "Sign in to upgrade",
    fr: "Connecte-toi pour upgrader",
    es: "Inicia sesión para mejorar tu plan",
    pt: "Entre para fazer upgrade",
    de: "Anmelden zum Upgrade",
    it: "Accedi per fare l'upgrade",
    nl: "Log in om te upgraden",
    ar: "سجّل الدخول للترقية",
    ja: "アップグレードするにはサインインしてください",
    ko: "업그레이드하려면 로그인하세요",
    tr: "Yükseltmek için giriş yapın",
    hi: "अपग्रेड के लिए साइन इन करें",
    zh: "登录以升级",
    th: "เข้าสู่ระบบเพื่ออัปเกรด",
  }),
  useBillingPortal: L({
    en: "Use the billing portal to change your plan.",
    fr: "Utilise le portail de facturation pour changer de plan.",
    es: "Usa el portal de facturación para cambiar de plan.",
    pt: "Use o portal de cobrança para mudar de plano.",
    de: "Nutze das Abrechnungsportal, um den Plan zu wechseln.",
    it: "Usa il portale di fatturazione per cambiare piano.",
    nl: "Gebruik het facturatieportaal om je abonnement te wijzigen.",
    ar: "استخدم بوابة الفوترة لتغيير خطتك.",
    ja: "プランを変更するには請求ポータルをご利用ください。",
    ko: "요금제를 변경하려면 결제 포털을 사용하세요.",
    tr: "Planınızı değiştirmek için faturalandırma portalını kullanın.",
    hi: "अपना प्लान बदलने के लिए बिलिंग पोर्टल का उपयोग करें।",
    zh: "请使用账单门户更改套餐。",
    th: "ใช้พอร์ทัลการเรียกเก็บเงินเพื่อเปลี่ยนแผน",
  }),
  checkoutStartFailed: L({
    en: "Could not start checkout",
    fr: "Impossible de démarrer le paiement",
    es: "No se pudo iniciar el pago",
    pt: "Não foi possível iniciar o checkout",
    de: "Checkout konnte nicht gestartet werden",
    it: "Impossibile avviare il checkout",
    nl: "Checkout kon niet worden gestart",
    ar: "تعذّر بدء الدفع",
    ja: "チェックアウトを開始できませんでした",
    ko: "결제를 시작할 수 없습니다",
    tr: "Ödeme başlatılamadı",
    hi: "चेकआउट शुरू नहीं किया जा सका",
    zh: "无法启动结账",
    th: "เริ่ม checkout ไม่ได้",
  }),
  portalUnavailable: L({
    en: "Portal unavailable",
    fr: "Portail indisponible",
    es: "Portal no disponible",
    pt: "Portal indisponível",
    de: "Portal nicht verfügbar",
    it: "Portale non disponibile",
    nl: "Portaal niet beschikbaar",
    ar: "البوابة غير متاحة",
    ja: "ポータルは利用できません",
    ko: "포털을 사용할 수 없습니다",
    tr: "Portal kullanılamıyor",
    hi: "पोर्टल उपलब्ध नहीं",
    zh: "门户不可用",
    th: "พอร์ทัลไม่พร้อมใช้งาน",
  }),
  currentPlan: L({
    en: "Current plan",
    fr: "Plan actuel",
    es: "Plan actual",
    pt: "Plano atual",
    de: "Aktueller Plan",
    it: "Piano attuale",
    nl: "Huidig abonnement",
    ar: "الخطة الحالية",
    ja: "現在のプラン",
    ko: "현재 요금제",
    tr: "Mevcut plan",
    hi: "वर्तमान प्लान",
    zh: "当前套餐",
    th: "แผนปัจจุบัน",
  }),
  startFree: L({
    en: "Start free",
    fr: "Commencer gratuit",
    es: "Empezar gratis",
    pt: "Começar grátis",
    de: "Kostenlos starten",
    it: "Inizia gratis",
    nl: "Gratis beginnen",
    ar: "ابدأ مجاناً",
    ja: "無料で始める",
    ko: "무료로 시작",
    tr: "Ücretsiz başla",
    hi: "मुफ़्त शुरू करें",
    zh: "免费开始",
    th: "เริ่มฟรี",
  }),
  includedInPlan: L({
    en: "Included in your plan",
    fr: "Inclus dans ton plan",
    es: "Incluido en tu plan",
    pt: "Incluído no seu plano",
    de: "In deinem Plan enthalten",
    it: "Incluso nel tuo piano",
    nl: "Inbegrepen in je abonnement",
    ar: "مشمول في خطتك",
    ja: "プランに含まれています",
    ko: "요금제에 포함됨",
    tr: "Planınıza dahil",
    hi: "आपके प्लान में शामिल",
    zh: "已包含在您的套餐中",
    th: "รวมในแผนของคุณ",
  }),
  upgradeTo: L({
    en: "Upgrade to ",
    fr: "Passer ",
    es: "Mejorar a ",
    pt: "Fazer upgrade para ",
    de: "Upgrade auf ",
    it: "Passa a ",
    nl: "Upgraden naar ",
    ar: "الترقية إلى ",
    ja: "アップグレード: ",
    ko: "업그레이드: ",
    tr: "Yükselt: ",
    hi: "अपग्रेड करें: ",
    zh: "升级至 ",
    th: "อัปเกรดเป็น ",
  }),
};

const COMMON = {
  error: L({
    en: "Error",
    fr: "Erreur",
    es: "Error",
    pt: "Erro",
    de: "Fehler",
    it: "Errore",
    nl: "Fout",
    ar: "خطأ",
    ja: "エラー",
    ko: "오류",
    tr: "Hata",
    hi: "त्रुटि",
    zh: "错误",
    th: "ข้อผิดพลาด",
  }),
  retry: L({
    en: "Retry",
    fr: "Réessayer",
    es: "Reintentar",
    pt: "Tentar novamente",
    de: "Erneut versuchen",
    it: "Riprova",
    nl: "Opnieuw proberen",
    ar: "إعادة المحاولة",
    ja: "再試行",
    ko: "다시 시도",
    tr: "Tekrar dene",
    hi: "पुनः प्रयास करें",
    zh: "重试",
    th: "ลองอีกครั้ง",
  }),
  reloadPage: L({
    en: "Reload page",
    fr: "Recharger la page",
    es: "Recargar página",
    pt: "Recarregar página",
    de: "Seite neu laden",
    it: "Ricarica pagina",
    nl: "Pagina herladen",
    ar: "إعادة تحميل الصفحة",
    ja: "ページを再読み込み",
    ko: "페이지 새로고침",
    tr: "Sayfayı yenile",
    hi: "पेज पुनः लोड करें",
    zh: "重新加载页面",
    th: "โหลดหน้าใหม่",
  }),
  previewComingSoon: L({
    en: "Preview coming soon",
    fr: "Aperçu bientôt disponible",
    es: "Vista previa próximamente",
    pt: "Prévia em breve",
    de: "Vorschau demnächst",
    it: "Anteprima in arrivo",
    nl: "Voorbeeld binnenkort",
    ar: "المعاينة قريباً",
    ja: "プレビューは近日公開",
    ko: "미리보기 곧 제공",
    tr: "Önizleme yakında",
    hi: "पूर्वावलोकन जल्द",
    zh: "预览即将推出",
    th: "ตัวอย่างเร็วๆ นี้",
  }),
  audioUnavailable: L({
    en: "Audio unavailable",
    fr: "Audio indisponible",
    es: "Audio no disponible",
    pt: "Áudio indisponível",
    de: "Audio nicht verfügbar",
    it: "Audio non disponibile",
    nl: "Audio niet beschikbaar",
    ar: "الصوت غير متاح",
    ja: "オーディオは利用できません",
    ko: "오디오를 사용할 수 없습니다",
    tr: "Ses kullanılamıyor",
    hi: "ऑडियो उपलब्ध नहीं",
    zh: "音频不可用",
    th: "เสียงไม่พร้อมใช้งาน",
  }),
  beatDownloaded: L({
    en: "Beat downloaded!",
    fr: "Beat téléchargé !",
    es: "¡Beat descargado!",
    pt: "Beat baixado!",
    de: "Beat heruntergeladen!",
    it: "Beat scaricato!",
    nl: "Beat gedownload!",
    ar: "تم تنزيل البيت!",
    ja: "ビートをダウンロードしました！",
    ko: "비트 다운로드 완료!",
    tr: "Beat indirildi!",
    hi: "बीट डाउनलोड हो गया!",
    zh: "节拍已下载！",
    th: "ดาวน์โหลดบีทแล้ว!",
  }),
  downloadFailed: L({
    en: "Download failed — try again",
    fr: "Échec du téléchargement — réessaie",
    es: "Descarga fallida — inténtalo de nuevo",
    pt: "Falha no download — tente novamente",
    de: "Download fehlgeschlagen — erneut versuchen",
    it: "Download non riuscito — riprova",
    nl: "Download mislukt — probeer opnieuw",
    ar: "فشل التنزيل — أعد المحاولة",
    ja: "ダウンロードに失敗しました — 再試行してください",
    ko: "다운로드 실패 — 다시 시도하세요",
    tr: "İndirme başarısız — tekrar deneyin",
    hi: "डाउनलोड विफल — पुनः प्रयास करें",
    zh: "下载失败 — 请重试",
    th: "ดาวน์โหลดล้มเหลว — ลองอีกครั้ง",
  }),
  titleUpdated: L({
    en: "Title updated",
    fr: "Titre mis à jour",
    es: "Título actualizado",
    pt: "Título atualizado",
    de: "Titel aktualisiert",
    it: "Titolo aggiornato",
    nl: "Titel bijgewerkt",
    ar: "تم تحديث العنوان",
    ja: "タイトルを更新しました",
    ko: "제목이 업데이트되었습니다",
    tr: "Başlık güncellendi",
    hi: "शीर्षक अपडेट किया गया",
    zh: "标题已更新",
    th: "อัปเดตชื่อแล้ว",
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
};

export type AuthMessages = ReturnType<typeof buildAuthSection>;
export type ProfileMessages = ReturnType<typeof buildProfileSection>;
export type GenerationMessages = ReturnType<typeof buildGenerationSection>;
export type BillingMessages = ReturnType<typeof buildBillingSection>;
export type CommonMessages = ReturnType<typeof buildCommonSection>;

export function buildAuthSection(locale: AppLocale) {
  return resolveSection(AUTH, locale);
}

export function buildProfileSection(locale: AppLocale) {
  return resolveSection(PROFILE, locale);
}

export function buildGenerationSection(locale: AppLocale) {
  return resolveSection(GENERATION, locale);
}

export function buildBillingSection(locale: AppLocale) {
  return resolveSection(BILLING, locale);
}

export function buildCommonSection(locale: AppLocale) {
  return resolveSection(COMMON, locale);
}

export function mapAuthError(
  error: unknown,
  locale: AppLocale,
  context: "login" | "signup" | "google" | "link" | "password",
): string {
  const s = buildAuthSection(locale);
  const raw = extractErrorMessage(error).toLowerCase();

  if (raw.includes("invalid login credentials") || raw.includes("invalid credentials")) return s.invalidCredentials;
  if (
    raw.includes("user already registered") ||
    raw.includes("already been registered") ||
    raw.includes("email address is already registered")
  ) {
    return s.userAlreadyRegistered;
  }
  if (raw.includes("email not confirmed")) return s.emailNotConfirmed;
  if (raw.includes("manual linking") || raw.includes("linking is disabled")) return s.linkingDisabled;
  if (
    raw.includes("identity is already linked") ||
    raw.includes("already linked to another user") ||
    raw.includes("email already in use")
  ) {
    return s.identityAlreadyLinked;
  }
  if (raw.includes("oauth_session_missing") || raw.includes("session missing")) return s.oauthSessionMissing;
  if (
    raw.includes("pkce") ||
    raw.includes("code verifier") ||
    raw.includes("verifier not found") ||
    raw.includes("non-empty")
  ) {
    return s.pkceInterrupted;
  }
  if (raw.includes("invalid_grant") || raw.includes("invalid code") || raw.includes("expired")) return s.invalidGrant;
  if (
    raw.includes("database error saving new user") ||
    raw.includes("error saving new user") ||
    (raw.includes("unexpected_failure") && raw.includes("database"))
  ) {
    return s.databaseErrorNewUser;
  }
  if (raw.includes("server_error") || raw.includes("unexpected_failure")) return s.serverErrorSignup;
  if (context === "google") return s.googleSignInFailed;
  if (context === "password") return s.passwordUpdateFailed;
  if (context === "link") return s.linkGoogleFailed;

  return extractErrorMessage(error) || s.authFailed;
}

export function profileLoadErrorMessage(error: unknown, locale: AppLocale): string {
  const s = buildProfileSection(locale);
  const detail = extractErrorMessage(error);
  const raw = detail.toLowerCase();

  if (isAuthNotReadyError(raw)) return s.sessionExpired;
  if (raw.includes("pgrst116") || raw.includes("0 rows") || raw.includes("profile missing") || raw.includes("profile_not_found")) {
    return s.profileNotFound;
  }
  if (raw.includes("could not find the function") || raw.includes("schema cache")) return s.sqlFunctionMissing;
  if (raw.includes("permission denied") || raw.includes("row-level security")) return s.rlsDenied;
  if (isBenignProfileSyncError(raw)) return s.signingIn;

  const debug =
    import.meta.env.DEV ||
    (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debug") === "1");

  if (debug && detail && detail !== "unknown_error") {
    return `${s.loadFailedWithDetail}${detail}`;
  }

  return s.loadFailed;
}

export function formatGenerationErrorMessage(
  raw: string,
  locale: AppLocale,
  options?: { plan?: string | null },
): string {
  const s = buildGenerationSection(locale);
  const msg = raw.trim();
  if (!msg) return s.genericFailed;

  const lower = msg.toLowerCase();
  const plan = options?.plan;
  const isFree = !plan || plan === "free";

  if (lower.includes("limit reached") || lower.includes("monthly limit") || lower.includes("limite mensuelle")) {
    return s.monthlyLimit;
  }
  if (lower.includes("429") || lower.includes("too many requests") || lower.includes("rate limit")) {
    return s.rateLimit429;
  }
  if (
    lower.includes("timeout") ||
    lower.includes("timed out") ||
    lower.includes("504") ||
    lower.includes("546") ||
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("load failed") ||
    lower.includes("non-2xx") ||
    lower.includes("génération interrompue") ||
    lower.includes("edge function error") ||
    lower.includes("réseau est") ||
    lower.includes("network is a bit busy") ||
    lower.includes("network is busy")
  ) {
    return isFree ? s.capacityFree : s.capacityPaid;
  }
  if (lower.includes("cors") || lower.includes("502") || lower.includes("503")) return s.serverUnavailable;
  if (lower.includes("ace api") || lower.includes("chat/completions") || lower.includes("acemusic")) return s.aceHiccup;
  if (lower.includes("no audio") || lower.includes("audio manquant") || lower.includes("missing audio")) return s.noAudio;

  return msg.length > 220 ? `${msg.slice(0, 220)}…` : msg;
}
