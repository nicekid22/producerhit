import type { AppLocale } from "./config";
import { L, pickL } from "./localized";

function i(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(vars[key] ?? ""));
}

const COPY = {
  home: L({
    en: "Home", fr: "Accueil", es: "Inicio", pt: "Início", de: "Start", it: "Home", nl: "Home",
    ar: "الرئيسية", ja: "ホーム", ko: "홈", tr: "Ana sayfa", hi: "होम", zh: "首页", th: "หน้าแรก",
  }),
  community: L({
    en: "Community", fr: "Communauté", es: "Comunidad", pt: "Comunidade", de: "Community", it: "Community", nl: "Community",
    ar: "المجتمع", ja: "コミュニティ", ko: "커뮤니티", tr: "Topluluk", hi: "कम्युनिटी", zh: "社区", th: "ชุมชน",
  }),
  defaultDescription: L({
    en: "Public AI track on ProducerHit", fr: "Track IA public sur ProducerHit", es: "Pista IA pública en ProducerHit", pt: "Faixa IA pública no ProducerHit", de: "Öffentlicher KI-Track auf ProducerHit", it: "Traccia IA pubblica su ProducerHit", nl: "Publieke AI-track op ProducerHit",
    ar: "مقطع IA عام على ProducerHit", ja: "ProducerHitの公開AIトラック", ko: "ProducerHit 공개 AI 트랙", tr: "ProducerHit'te herkese açık AI parça", hi: "ProducerHit पर सार्वजनिक AI ट्रैक", zh: "ProducerHit 上的公开 AI 曲目", th: "แทร็ก AI สาธารณะบน ProducerHit",
  }),
  ogPitch: L({
    en: "Listen to this AI beat, remix the vibe, and create your own free on ProducerHit.",
    fr: "Écoute ce beat IA, remixe la vibe et crée le tien gratuitement sur ProducerHit.",
    es: "Escucha este beat IA, remixa la vibe y crea el tuyo gratis en ProducerHit.",
    pt: "Ouça este beat IA, remixe a vibe e crie o seu grátis no ProducerHit.",
    de: "Hör diesen KI-Beat, remixe die Vibe und erstelle deinen kostenlos auf ProducerHit.",
    it: "Ascolta questo beat IA, remixa la vibe e crea il tuo gratis su ProducerHit.",
    nl: "Luister naar deze AI-beat, remix de vibe en maak de jouwe gratis op ProducerHit.",
    ar: "استمع لهذا beat IA، remix الـ vibe وأنشئ مقطعك مجاناً على ProducerHit.",
    ja: "このAIビートを聴いて、vibeをリミックスし、ProducerHitで無料で自分のを作成。",
    ko: "이 AI 비트를 듣고 vibe를 리믹스한 뒤 ProducerHit에서 무료로 만드세요.",
    tr: "Bu AI beat'i dinle, vibe'ı remix et ve ProducerHit'te kendi parçanı ücretsiz oluştur.",
    hi: "यह AI beat सुनें, vibe remix करें और ProducerHit पर मुफ़्त में अपना बनाएँ।",
    zh: "收听这首 AI 节拍，混音氛围，在 ProducerHit 免费创作你的作品。",
    th: "ฟัง AI beat นี้ remix vibe และสร้างของคุณฟรีบน ProducerHit",
  }),
  titleWithGenre: L({
    en: "{{name}} — {{genre}} AI | ProducerHit", fr: "{{name}} — {{genre}} IA | ProducerHit", es: "{{name}} — {{genre}} IA | ProducerHit", pt: "{{name}} — {{genre}} IA | ProducerHit", de: "{{name}} — {{genre}} KI | ProducerHit", it: "{{name}} — {{genre}} IA | ProducerHit", nl: "{{name}} — {{genre}} AI | ProducerHit",
    ar: "{{name}} — {{genre}} IA | ProducerHit", ja: "{{name}} — {{genre}} AI | ProducerHit", ko: "{{name}} — {{genre}} AI | ProducerHit", tr: "{{name}} — {{genre}} AI | ProducerHit", hi: "{{name}} — {{genre}} AI | ProducerHit", zh: "{{name}} — {{genre}} AI | ProducerHit", th: "{{name}} — {{genre}} AI | ProducerHit",
  }),
  titleNoGenre: L({
    en: "{{name}} — AI Track | ProducerHit", fr: "{{name}} — Track IA | ProducerHit", es: "{{name}} — Pista IA | ProducerHit", pt: "{{name}} — Faixa IA | ProducerHit", de: "{{name}} — KI-Track | ProducerHit", it: "{{name}} — Traccia IA | ProducerHit", nl: "{{name}} — AI Track | ProducerHit",
    ar: "{{name}} — مقطع IA | ProducerHit", ja: "{{name}} — AIトラック | ProducerHit", ko: "{{name}} — AI 트랙 | ProducerHit", tr: "{{name}} — AI Parça | ProducerHit", hi: "{{name}} — AI ट्रैक | ProducerHit", zh: "{{name}} — AI 曲目 | ProducerHit", th: "{{name}} — แทร็ก AI | ProducerHit",
  }),
  kwAiBeat: L({
    en: "AI beat", fr: "beat IA", es: "beat IA", pt: "beat IA", de: "KI-Beat", it: "beat IA", nl: "AI beat",
    ar: "beat IA", ja: "AIビート", ko: "AI 비트", tr: "AI beat", hi: "AI beat", zh: "AI 节拍", th: "AI beat",
  }),
  kwTypeBeat: L({
    en: "AI type beat", fr: "type beat IA", es: "type beat IA", pt: "type beat IA", de: "KI type beat", it: "type beat IA", nl: "AI type beat",
    ar: "type beat IA", ja: "AI type beat", ko: "AI type beat", tr: "AI type beat", hi: "AI type beat", zh: "AI type beat", th: "AI type beat",
  }),
  kwGenerator: L({
    en: "AI beat generator", fr: "générateur beats IA", es: "generador beats IA", pt: "gerador beats IA", de: "KI-Beat-Generator", it: "generatore beat IA", nl: "AI beat generator",
    ar: "مولّد beats IA", ja: "AIビートジェネレーター", ko: "AI 비트 생성기", tr: "AI beat üretici", hi: "AI beat जनरेटर", zh: "AI 节拍生成器", th: "ตัวสร้าง AI beat",
  }),
  kwGenreBeat: L({
    en: "{{genre}} AI beat", fr: "beat {{genre}} IA", es: "beat {{genre}} IA", pt: "beat {{genre}} IA", de: "{{genre}} KI-Beat", it: "beat {{genre}} IA", nl: "{{genre}} AI beat",
    ar: "beat {{genre}} IA", ja: "{{genre}} AIビート", ko: "{{genre}} AI 비트", tr: "{{genre}} AI beat", hi: "{{genre}} AI beat", zh: "{{genre}} AI 节拍", th: "{{genre}} AI beat",
  }),
  kwMoodBeat: L({
    en: "{{mood}} beat", fr: "beat {{mood}}", es: "beat {{mood}}", pt: "beat {{mood}}", de: "{{mood}} Beat", it: "beat {{mood}}", nl: "{{mood}} beat",
    ar: "beat {{mood}}", ja: "{{mood}}ビート", ko: "{{mood}} 비트", tr: "{{mood}} beat", hi: "{{mood}} beat", zh: "{{mood}} 节拍", th: "{{mood}} beat",
  }),
  kwRemix: L({
    en: "AI remix", fr: "remix IA", es: "remix IA", pt: "remix IA", de: "KI-Remix", it: "remix IA", nl: "AI remix",
    ar: "remix IA", ja: "AIリミックス", ko: "AI 리믹스", tr: "AI remix", hi: "AI remix", zh: "AI 混音", th: "AI remix",
  }),
};

export function loopPageInLanguage(locale: AppLocale): string {
  return locale;
}

export function buildLoopPageSeoCopy(locale: AppLocale) {
  const t = (key: keyof typeof COPY) => pickL(COPY[key], locale);

  return {
    home: t("home"),
    community: t("community"),
    defaultDescription: t("defaultDescription"),
    ogPitch: t("ogPitch"),
    pageTitle: (name: string, genre?: string) => {
      const genreLabel = (genre ?? "").trim();
      if (genreLabel) return i(pickL(COPY.titleWithGenre, locale), { name, genre: genreLabel });
      return i(pickL(COPY.titleNoGenre, locale), { name });
    },
    keywords: (opts: { name: string; genre?: string; mood?: string; bpm?: number | null }) => {
      const genre = (opts.genre ?? "").trim();
      const mood = (opts.mood ?? "").trim();
      const name = (opts.name ?? "").trim();
      const bpm = typeof opts.bpm === "number" && opts.bpm > 0 ? `${opts.bpm} BPM` : "";
      return [
        t("kwAiBeat"),
        t("kwTypeBeat"),
        t("kwGenerator"),
        genre ? i(pickL(COPY.kwGenreBeat, locale), { genre }) : "",
        mood ? i(pickL(COPY.kwMoodBeat, locale), { mood }) : "",
        name,
        bpm,
        "ProducerHit",
        t("kwRemix"),
      ].filter(Boolean);
    },
    inLanguage: loopPageInLanguage(locale),
  };
}
