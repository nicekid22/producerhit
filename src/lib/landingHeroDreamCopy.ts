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
  "De l'idée au morceau — avant que la magie s'éteigne.",
  "Imagine. Décris. Écoute-toi exister.",
] as const;

const LANDING_HERO_DREAM_EN = [
  "Your next song already exists — somewhere in you.",
  "One beat. One voice. One world. Yours.",
  "No studio. No limits. Just the spark.",
  "From idea to track — before the magic fades.",
  "Imagine it. Name it. Hear yourself come alive.",
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

const DREAM_BY_LOCALE: Partial<Record<AppLocale, DreamCopy>> = {
  fr: {
    headlines: LANDING_HERO_DREAM_FR,
    subline: "Choisis ton mood — le morceau suit.",
    seoTitle: "Créateur de chansons IA — type beats, Song Mode, export royalty-free",
  },
  en: {
    headlines: LANDING_HERO_DREAM_EN,
    subline: "Pick your mood — the track follows.",
    seoTitle: "AI song creator — type beats, Song Mode, royalty-free export",
  },
  ja: {
    headlines: LANDING_HERO_DREAM_JA,
    subline: "ムードを選ぶ — 曲がついてくる。",
    seoTitle: "AI楽曲クリエイター — タイプビート、Song Mode、ロイヤリティフリー",
  },
  ko: {
    headlines: LANDING_HERO_DREAM_KO,
    subline: "무드를 고르세요 — 트랙이 따라옵니다.",
    seoTitle: "AI 노래 제작 — 타입 비트, Song Mode, 로열티 프리",
  },
  zh: {
    headlines: LANDING_HERO_DREAM_ZH,
    subline: "选择氛围 — 曲目随之而来。",
    seoTitle: "AI 歌曲创作 — Type Beat、Song Mode、免版税导出",
  },
  th: {
    headlines: LANDING_HERO_DREAM_TH,
    subline: "เลือก vibe — แทร็กจะตามมา",
    seoTitle: "สร้างเพลง AI — type beat, Song Mode, ไร้ค่าลิขสิทธิ์",
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
