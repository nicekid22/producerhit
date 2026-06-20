/** Headlines landing — conversion émotionnelle (rêveur, « tout est possible »). */

import type { AppLocale } from "@/i18n/config";



type DreamCopy = {

  headlines: readonly string[];

  subline: string;

  seoTitle: string;

};



const LANDING_HERO_DREAM_FR = [

  "Ta prochaine chanson existe déjà quelque part en toi.",

  "Un beat. Une voix. Un monde. Le tien.",

  "Pas de studio. Pas de limites. Juste l'envie.",

  "De l'idée au morceau avant que la magie s'éteigne.",

  "Imagine. Décris. Écoute-toi exister.",

  "Donne un nom à une émotion. Écoute ce qu'elle devient.",

  "Avant d'être un morceau, c'était un sentiment.",

  "Entre ton imagination et la musique, il n'y a plus qu'un clic.",

  "Transforme un instant en quelque chose que tu peux rejouer pour toujours.",

  "Chaque grande chanson commence par l'indicible.",

  "Capture l'étincelle avant que le réel ne rattrape le rêve.",

  "Et si ta chanson préférée n'avait pas encore été écrite ?",

  "Un souvenir. Une émotion. Une chanson.",

  "Entends la version de toi que les mots ne savent pas décrire.",

] as const;



const LANDING_HERO_DREAM_EN = [

  "Your next song already exists somewhere in you.",

  "One beat. One voice. One world. Yours.",

  "No studio. No limits. Just the spark.",

  "From idea to track before the magic fades.",

  "Imagine it. Name it. Hear yourself come alive.",

  "Give an emotion a name. Hear what it becomes.",

  "Before it was a track, it was a feeling.",

  "The distance between imagination and music is now one click.",

  "Turn a moment into something you can replay forever.",

  "Every great song starts as something impossible to explain.",

  "Capture the spark before reality catches up.",

  "What if your favorite song hasn't been written yet?",

  "A memory. A feeling. A song.",

  "Hear the version of yourself words can't describe."

] as const;



const LANDING_HERO_DREAM_JA = [

  "次の曲は、すでにあなたの中にある。",

  "一つのビート。一つの声。一つの世界。あなただけの。",

  "スタジオ不要。限界なし。ただ、衝動だけ。",

  "アイデアから曲へ — 魔法が消える前に。",

  "想像して。言葉にして。自分が生きる音を聴こう。",

] as const;



const LANDING_HERO_DREAM_KO = [

  "다음 노래는 이미 당신 안에 있어요.",

  "비트 하나. 목소리 하나. 세계 하나. 당신 것.",

  "스튜디오 없이. 한계 없이. 그냥 불꽃만.",

  "아이디어에서 트랙까지 — 마법이 사라지기 전에.",

  "상상하고. 이름 붙이고. 살아 있는 자신을 들어보세요.",

] as const;



const LANDING_HERO_DREAM_ZH = [

  "你的下一首歌，早已在你心里。",

  "一个节拍。一个声音。一个世界。属于你。",

  "无需录音棚。没有限制。只有灵感。",

  "从想法到成品 — 在魔法消失之前。",

  "想象它。描述它。听见自己活过来。",

] as const;



const LANDING_HERO_DREAM_TH = [

  "เพลงถัดไปของคุณมีอยู่แล้ว — อยู่ในตัวคุณ",

  "บีทเดียว เสียงเดียว โลกเดียว ของคุณ",

  "ไม่ต้องมีสตูดิโอ ไม่มีขีดจำกัด แค่ไฟในตัว",

  "จากไอเดียสู่แทร็ก — ก่อนเวทมนตร์จางหาย",

  "จินตนาการ ตั้งชื่อ แล้วฟังตัวเองมีชีวิต",

] as const;

const LANDING_HERO_DREAM_ES = [
  "Tu próxima canción ya existe en algún lugar dentro de ti.",
  "Un beat. Una voz. Un mundo. El tuyo.",
  "Sin estudio. Sin límites. Solo las ganas.",
  "De la idea a la pista antes de que se apague la magia.",
  "Imagínalo. Descríbelo. Escúchate cobrar vida.",
] as const;

const LANDING_HERO_DREAM_PT = [
  "A sua próxima música já existe em algum lugar dentro de você.",
  "Um beat. Uma voz. Um mundo. O seu.",
  "Sem estúdio. Sem limites. Só a vontade.",
  "Da ideia à faixa antes que a magia desapareça.",
  "Imagine. Descreva. Ouça-se ganhar vida.",
] as const;

const LANDING_HERO_DREAM_DE = [
  "Dein nächster Song existiert schon irgendwo in dir.",
  "Ein Beat. Eine Stimme. Eine Welt. Deine.",
  "Kein Studio. Keine Grenzen. Nur der Funke.",
  "Von der Idee zum Track, bevor die Magie verblasst.",
  "Stell es dir vor. Beschreib es. Hör dich lebendig werden.",
] as const;

const LANDING_HERO_DREAM_IT = [
  "La tua prossima canzone esiste già da qualche parte in te.",
  "Un beat. Una voce. Un mondo. Il tuo.",
  "Niente studio. Nessun limite. Solo la scintilla.",
  "Dall'idea alla traccia prima che la magia svanisca.",
  "Immaginalo. Descrivilo. Sentiti prendere vita.",
] as const;

const LANDING_HERO_DREAM_NL = [
  "Je volgende nummer bestaat al ergens in jou.",
  "Eén beat. Eén stem. Eén wereld. Die van jou.",
  "Geen studio. Geen grenzen. Alleen de vonk.",
  "Van idee naar track voordat de magie vervaagt.",
  "Stel je voor. Beschrijf het. Hoor jezelf tot leven komen.",
] as const;

const LANDING_HERO_DREAM_AR = [
  "أغنيتك القادمة موجودة بالفعل في مكان ما بداخلك.",
  "إيقاع. صوت. عالم. عالمك.",
  "بلا استوديو. بلا حدود. فقط الشرارة.",
  "من الفكرة إلى المقطع قبل أن تختفي السحر.",
  "تخيّلها. صفها. اسمع نفسك تنبض بالحياة.",
] as const;

const LANDING_HERO_DREAM_TR = [
  "Bir sonraki şarkın zaten içinde bir yerde var.",
  "Bir beat. Bir ses. Bir dünya. Senin.",
  "Stüdyo yok. Sınır yok. Sadece kıvılcım.",
  "Sihir solmadan fikirden parçaya.",
  "Hayal et. Tarif et. Kendini canlanırken dinle.",
] as const;

const LANDING_HERO_DREAM_HI = [
  "आपका अगला गाना पहले से आपके अंदर कहीं मौजूद है।",
  "एक बीट। एक आवाज़। एक दुनिया। आपकी।",
  "कोई स्टूडियो नहीं। कोई सीमा नहीं। बस जुनून।",
  "जादू फीके पड़ने से पहले आइडिया से ट्रैक तक।",
  "कल्पना करें। बताएं। खुद को जीवंत सुनें।",
] as const;

const DREAM_BY_LOCALE: Partial<Record<AppLocale, DreamCopy>> = {

  fr: {

    headlines: LANDING_HERO_DREAM_FR,

    subline: "Décris ta vibe — On s'occupe du reste. Gratuit. Aucune carte requise.",

    seoTitle: "Créateur de chansons IA — type beats, Song Mode, export royalty-free",

  },

  en: {

    headlines: LANDING_HERO_DREAM_EN,

    subline: "Describe your vibe — We'll do the rest. No credit card required.",

    seoTitle: "AI song creator — type beats, Song Mode, royalty-free export",

  },

  ja: {

    headlines: LANDING_HERO_DREAM_JA,

    subline: "ムードを書く — 約60秒で最初の曲。無料、カード不要。",

    seoTitle: "AI楽曲クリエイター — タイプビート、Song Mode、ロイヤリティフリー",

  },

  ko: {

    headlines: LANDING_HERO_DREAM_KO,

    subline: "무드를 적어 보세요 — 약 60초 만에 첫 트랙. 무료, 카드 불필요.",

    seoTitle: "AI 노래 제작 — 타입 비트, Song Mode, 로열티 프리",

  },

  zh: {

    headlines: LANDING_HERO_DREAM_ZH,

    subline: "描述你的氛围 — 约 60 秒出首曲。免费，无需绑卡。",

    seoTitle: "AI 歌曲创作 — Type Beat、Song Mode、免版税导出",

  },

  th: {
    headlines: LANDING_HERO_DREAM_TH,
    subline: "บรรยาย vibe — แทร็กแรกใน ~60 วินาที ฟรี ไม่ต้องใส่บัตร",
    seoTitle: "สร้างเพลง AI — type beat, Song Mode, ไร้ค่าลิขสิทธิ์",
  },
  es: {
    headlines: LANDING_HERO_DREAM_ES,
    subline: "Describe tu vibe — primera pista en ~60 s. Gratis, sin tarjeta.",
    seoTitle: "Creador de canciones IA — type beats, Song Mode, libre de regalías",
  },
  pt: {
    headlines: LANDING_HERO_DREAM_PT,
    subline: "Descreva sua vibe — primeira faixa em ~60 s. Grátis, sem cartão.",
    seoTitle: "Criador de músicas IA — type beats, Song Mode, livre de royalties",
  },
  de: {
    headlines: LANDING_HERO_DREAM_DE,
    subline: "Beschreib deine Vibe — erster Track in ~60 Sek. Kostenlos, keine Karte.",
    seoTitle: "KI-Song-Ersteller — Type Beats, Song Mode, lizenzfreier Export",
  },
  it: {
    headlines: LANDING_HERO_DREAM_IT,
    subline: "Descrivi la tua vibe — prima traccia in ~60 s. Gratis, senza carta.",
    seoTitle: "Creatore di canzoni IA — type beat, Song Mode, export royalty-free",
  },
  nl: {
    headlines: LANDING_HERO_DREAM_NL,
    subline: "Beschrijf je vibe — eerste track in ~60 sec. Gratis, geen kaart.",
    seoTitle: "AI-songmaker — type beats, Song Mode, royaltyvrije export",
  },
  ar: {
    headlines: LANDING_HERO_DREAM_AR,
    subline: "صف أجواءك — أول مقطع في ~60 ثانية. مجاناً، بدون بطاقة.",
    seoTitle: "منشئ أغاني بالذكاء الاصطناعي — type beats، Song Mode، تصدير خالٍ من حقوق الملكية",
  },
  tr: {
    headlines: LANDING_HERO_DREAM_TR,
    subline: "Vibe'ını yaz — ilk parça ~60 sn'de. Ücretsiz, kart yok.",
    seoTitle: "Yapay zeka şarkı oluşturucu — type beat, Song Mode, telifsiz dışa aktarma",
  },
  hi: {
    headlines: LANDING_HERO_DREAM_HI,
    subline: "अपनी vibe लिखें — ~60 सेकंड में पहला ट्रैक। मुफ़्त, बिना कार्ड।",
    seoTitle: "AI गाना निर्माता — type beats, Song Mode, royalty-free एक्सपोर्ट",
  },
};



export function landingHeroDreamCopy(locale: AppLocale): DreamCopy {

  return DREAM_BY_LOCALE[locale] ?? DREAM_BY_LOCALE.en!;

}



export function pickNextDreamHeadlineIndex(pool: readonly string[], current: number): number {

  if (pool.length <= 1) return 0;

  let next = current;

  while (next === current) {

    next = Math.floor(Math.random() * pool.length);

  }

  return next;

}

