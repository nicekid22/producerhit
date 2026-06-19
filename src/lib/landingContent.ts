/** Assets & copy landing — remplace les partenaires par de vrais logos SVG quand disponibles. */

import type { AppLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/locales";
import {
  buildLandingMarketingSection,
  landingBenefitPillarsFromCatalog,
  landingCloudMoodsFromCatalog,
  landingFeatureCardsFromCatalog,
  landingSuitePoints,
  landingValueBlocksFromCatalog,
} from "@/i18n/landingMarketingCatalog";

function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(vars[key] ?? ""));
}
import { PLAN_LIMITS } from "@/lib/planLimits";
import { planPriceLabel } from "@/lib/planPricing";

export const LANDING_PARTNER_NAMES = [
  "Spotify",
  "YouTube",
  "TikTok",
  "BeatStars",
  "SoundCloud",
  "Apple Music",
  "Instagram",
  "DistroKid",
] as const;

/** Toutes les photos lifestyle du dossier public/img/img — ordre mélangé côté UI. */
export const LANDING_GALLERY_IMAGES = [
  "/img/img/0a83e344393ef9b5157fb8f2a59345b7.jpg",
  "/img/img/147bd4ef4f17d5c8642edb92bd0fc209.jpg",
  "/img/img/18edaaaf7139c526e6e3bc3783b7d7fe.jpg",
  "/img/img/2025773818c409f5f2796eaece00cadc.jpg",
  "/img/img/2040e667a040e822cba2523a3d7c3e09.jpg",
  "/img/img/249b94848491176ecd789debd23d30dd.jpg",
  "/img/img/2704b1f63943d5afd3ec47a8661154d7.jpg",
  "/img/img/28e276ba9c5a818304f2c90e66fef153.jpg",
  "/img/img/293b75cb01e0c747be01d9a6f74d197d.jpg",
  "/img/img/315040da285c6f82824ffb8a06203135.jpg",
  "/img/img/3557a5262b2a03cc2128b9bc9948a400.jpg",
  "/img/img/4360d8a0ccf0c129f6daf3f21419235d.jpg",
  "/img/img/4516e40cc5d158150e26b32b13a41c14.jpg",
  "/img/img/4702faeceebca679b726f30dfc8aecca.jpg",
  "/img/img/5324a6a6e010dc761c51822bda8d5074.jpg",
  "/img/img/588adb309bb96f455bd05430c31ff1b6.jpg",
  "/img/img/5a6bd346269d206d05575add2b7f3d98.jpg",
  "/img/img/5a9d56ba1fc42ee86242aa2bfec143a0.jpg",
  "/img/img/5b4516a4e1a692fc32547e34e66d2f7b.jpg",
  "/img/img/5f37c725a5df81b53d8bc6e652347998.jpg",
  "/img/img/631482d5abcbba88e03dba435c8081e6.jpg",
  "/img/img/643edbde720b0c5788d3b5b34f74e8a5.jpg",
  "/img/img/650e32b1b0cf4f96ff0661f903ef67d7.jpg",
  "/img/img/666af1ce36bf5abd9eec9cbd5f7c19be.jpg",
  "/img/img/6daa6fdcce8220901c6d335c182d138e.jpg",
  "/img/img/700c242e0fb87af72131c96a7aa545f3.jpg",
  "/img/img/7014ba887a6e68783500b3d15d87bc81.jpg",
  "/img/img/7015bd5f9c71bb3d26ee8683c808d064.jpg",
  "/img/img/737116b92ec96f8d08d284db337bfe87.jpg",
  "/img/img/752b9f6cc578dd53d030f7a9520d8870.jpg",
  "/img/img/7ac398f9999859951a49e7f6c3a41cc0.jpg",
  "/img/img/7f1e7639e563e7157cf3f4a5f7ba7505.jpg",
  "/img/img/89c25ff1c40f9e60fa050f9832fa0cae.jpg",
  "/img/img/8a37cd31c752207ea86868a5a626ddf7.jpg",
  "/img/img/921b96e860f021a15db7cafda25b093a.jpg",
  "/img/img/93976ed2bdf6c02f8b9de8d90cc2142c.jpg",
  "/img/img/953d6a018b1f86e86c27b7761c604c6a.jpg",
  "/img/img/9971a21ff80a5e20ed96906a7723d0df.jpg",
  "/img/img/99aa996209673c9a905aec5364399f77.jpg",
  "/img/img/9c504a0e1e6c2bdb3c9aa672fa5da415.jpg",
  "/img/img/9f86918c7c859c0306ed6fc65b5b61a1.jpg",
  "/img/img/9fe8284303b622dd741e082ae55592f4.jpg",
  "/img/img/a6aa65f87117482a0d7417c33b990e48.jpg",
  "/img/img/b10c988a8f7288faaa1ad92dabc2c040.jpg",
  "/img/img/b27fc16acca95d03da10d2d2a844842e.jpg",
  "/img/img/b4a48eeecf5c9f693fb5a28de15b1cb7.jpg",
  "/img/img/c1b5da44f733893a46ec51a69a49115c.jpg",
  "/img/img/c5746d545d33c80edb247a432dccec07.jpg",
  "/img/img/c6c91d85ad46b078c51e13d78cffa178.jpg",
  "/img/img/cab9d296efa50c804984c3b668d08305.jpg",
  "/img/img/d756171e1a2e1d4e05a62e112a8e5e35.jpg",
  "/img/img/d8a0d32f438e4f1dcd05686ed9c20dbf.jpg",
  "/img/img/d907425cc582fac61f208cc7d76ed91a.jpg",
  "/img/img/db03c3033c31d30da8c9c1ca57d73b26.jpg",
  "/img/img/dc642f2ddbb098d5ea94adb1cecd6529.jpg",
  "/img/img/de00c9129ffba36380641dfa716d9dbb.jpg",
  "/img/img/e3fbfaa78c67156a9e1c1a34fe593990.jpg",
  "/img/img/e457e5ee9f30b99d8a56851cfcdde71a.jpg",
  "/img/img/e4cce7d8cf95609269980d8e40f247c9.jpg",
  "/img/img/e78f23b7b55720cfbadfc569b3a54f00.jpg",
  "/img/img/ece5d3410c4ad4fbdca74a25910f4bb9.jpg",
  "/img/img/f00466385b4ca15acaac74f55254b67b.jpg",
  "/img/img/fce414a0ed7dd69b20f4810aa23efb09.jpg",
  "/img/img/fe3efb70b1b529c4f7843147bfb623c0.jpg",
] as const;

/** Galerie landing lite — 8 visuels lifestyle (pas de mosaic 30+ tuiles). */
export const LANDING_GALLERY_FEATURED: readonly string[] = [
  "/img/img/0a83e344393ef9b5157fb8f2a59345b7.jpg",
  "/img/img/293b75cb01e0c747be01d9a6f74d197d.jpg",
  "/img/img/5324a6a6e010dc761c51822bda8d5074.jpg",
  "/img/img/7ac398f9999859951a49e7f6c3a41cc0.jpg",
  "/img/img/921b96e860f021a15db7cafda25b093a.jpg",
  "/img/img/c1b5da44f733893a46ec51a69a49115c.jpg",
  "/img/img/e78f23b7b55720cfbadfc569b3a54f00.jpg",
  "/img/img/fe3efb70b1b529c4f7843147bfb623c0.jpg",
] as const;

/** @deprecated Ancien mosaic — conservé pour rollback git / tests. */
export const LANDING_GALLERY_MAX_TILES = 30;

export function pickLandingGalleryImages(
  images: readonly string[],
  max = LANDING_GALLERY_MAX_TILES,
): string[] {
  if (images.length <= max) return [...images];
  const out: string[] = [];
  const step = images.length / max;
  for (let i = 0; i < max; i++) {
    out.push(images[Math.floor(i * step)] ?? images[0]!);
  }
  return out;
}

type Locale = AppLocale;

export type LandingTestimonial = {
  id: string;
  q: string;
  who: string;
};

const TESTIMONIALS_EN: LandingTestimonial[] = [
  { id: "en-1", q: "Found my bounce in 3 generations. Seeds make variations actually usable.", who: "Trap producer · NYC" },
  { id: "en-2", q: "Song Mode gave me a hook I kept — finished the track the same night.", who: "Indie artist · LA" },
  { id: "en-3", q: "Type Beat + variations = a solid catalog in one session.", who: "Beatmaker · London" },
  { id: "en-4", q: "Community remix surfaced directions I would never have tried solo.", who: "R&B producer · Toronto" },
  { id: "en-5", q: "WAV export straight into my DAW — two-click workflow.", who: "Mix engineer · Atlanta" },
  { id: "en-6", q: "Hook ideas finally leave as clean demos, not fuzzy sketches.", who: "Vocalist · Chicago" },
  { id: "en-7", q: "Locked BPM in Type Beat Mode — perfect for cohesive pack drops.", who: "Drill producer · Manchester" },
  { id: "en-8", q: "Auto covers give a visual identity before release day.", who: "Pop artist · Miami" },
  { id: "en-9", q: "Seed variations let me A/B ideas for clients — huge time saver.", who: "Producer for hire · Austin" },
  { id: "en-10", q: "First public track in an hour. Community even rated the bounce.", who: "TikTok creator · Berlin" },
  { id: "en-11", q: "Song Mode vocals actually hold structure — rare for AI tools.", who: "Rapper · Houston" },
  { id: "en-12", q: "My Afrobeats loops became sellable instrumentals on BeatStars.", who: "Afrobeats prod · Lagos" },
  { id: "en-13", q: "I share the public link to validate a concept before studio time.", who: "Artist manager · NYC" },
  { id: "en-14", q: "Beat mode locked a dark vibe without an all-nighter on 808s.", who: "Producer · Seattle" },
  { id: "en-15", q: "Clean library, targeted regen — I keep 1 in 4 takes and that's plenty.", who: "Beatmaker · Dublin" },
  { id: "en-16", q: "Students learn hit structure by generating then breaking tracks down.", who: "Music teacher · Boston" },
  { id: "en-17", q: "Metallic cover + track = Insta posts that pop without a designer.", who: "Content creator · Paris" },
  { id: "en-18", q: "Shipped a sketch EP in a week — all from simple prompts.", who: "Lo-fi artist · Portland" },
  { id: "en-19", q: "Free tier is enough to test ideas before Pro for WAV export.", who: "New beatmaker · Phoenix" },
  { id: "en-20", q: "Remixing a public track = instant inspiration when I'm stuck.", who: "House producer · Amsterdam" },
  { id: "en-21", q: "Collabs start with a ProducerHit link — no more rough voice memos.", who: "Artist · Johannesburg" },
  { id: "en-22", q: "x2 variations on the same seed — best take picked in five minutes.", who: "Pop producer · Sydney" },
  { id: "en-23", q: "Clean UI, zero friction — I stay locked on vibe, not menus.", who: "Producer · Tokyo" },
];

const TESTIMONIALS_FR: LandingTestimonial[] = [
  { id: "fr-1", q: "J'ai trouvé mon bounce en 3 générations. Le seed change tout pour les variations.", who: "Producteur trap · Paris" },
  { id: "fr-2", q: "Song Mode m'a sorti un hook utilisable — j'ai fini le track le soir même.", who: "Artiste indie · Montréal" },
  { id: "fr-3", q: "Type Beat + variations = un catalogue solide en une session.", who: "Beatmaker · Lyon" },
  { id: "fr-4", q: "Le remix communauté m'a fait découvrir des directions que je n'aurais jamais testées seul.", who: "Producteur R&B · Bruxelles" },
  { id: "fr-5", q: "Export WAV direct, import FL en deux clics — workflow nickel.", who: "Ingé son · Marseille" },
  { id: "fr-6", q: "Mes idées de hooks partent enfin en démo propre, pas en sketch flou.", who: "Chanteuse · Toulouse" },
  { id: "fr-7", q: "Type Beat Mode avec BPM verrouillé : parfait pour enchaîner des packs cohérents.", who: "Beatmaker drill · Lille" },
  { id: "fr-8", q: "La cover auto donne une identité visuelle même avant la sortie.", who: "Artiste pop · Genève" },
  { id: "fr-9", q: "J'utilise les variations seed pour A/B test mes clients — gain de temps énorme.", who: "Prod pour artistes · Bordeaux" },
  { id: "fr-10", q: "Premier track public en une heure. La communauté m'a même noté le bounce.", who: "Créateur TikTok · Nantes" },
  { id: "fr-11", q: "Song Mode en français : les couplets tiennent la route, rare pour de l'IA.", who: "Rappeur · Strasbourg" },
  { id: "fr-12", q: "Mes loops Afrobeats sont devenues des instrumentales vendables sur BeatStars.", who: "Prod Afrobeats · Abidjan" },
  { id: "fr-13", q: "Je partage le lien public pour valider un concept avant d'aller en studio.", who: "Manager artiste · Paris" },
  { id: "fr-14", q: "Le mode beat m'a aidé à verrouiller une vibe dark sans passer la nuit sur les 808.", who: "Producteur · Rennes" },
  { id: "fr-15", q: "Bibliothèque claire, regen ciblée — je garde 1 take sur 4, c'est déjà énorme.", who: "Beatmaker · Nice" },
  { id: "fr-16", q: "Mes élèves comprennent la structure d'un hit en générant puis en décomposant.", who: "Prof MAO · Liège" },
  { id: "fr-17", q: "Cover métallique + track = posts Insta qui performent sans designer.", who: "Créatrice contenu · Lyon" },
  { id: "fr-18", q: "J'ai sorti un EP de sketches en une semaine — tous partis de prompts simples.", who: "Artiste lo-fi · Lausanne" },
  { id: "fr-19", q: "Le plan free suffit pour tester des idées avant de passer Pro pour l'export WAV.", who: "Beatmaker débutant · Orléans" },
  { id: "fr-20", q: "Remix d'un track public = inspiration instantanée quand je suis bloqué.", who: "Producteur house · Montpellier" },
  { id: "fr-21", q: "Mes collabs commencent par un lien ProducerHit, plus besoin d'envoyer des maquettes moches.", who: "Artiste · Dakar" },
  { id: "fr-22", q: "Variations x2 sur le même seed : je choisis la meilleure prise en 5 minutes.", who: "Prod pop · Québec" },
  { id: "fr-23", q: "Interface épurée, zéro friction — je reste focus sur le vibe, pas sur les menus.", who: "Producteur · Berlin" },
];

const TESTIMONIALS_ES: LandingTestimonial[] = [
  { id: "es-1", q: "Encontré mi bounce en 3 generaciones. Los seeds hacen las variaciones realmente útiles.", who: "Productor trap · Madrid" },
  { id: "es-2", q: "Song Mode me dio un hook que guardé — terminé la pista esa misma noche.", who: "Artista indie · Barcelona" },
  { id: "es-3", q: "Type Beat + variaciones = un catálogo sólido en una sesión.", who: "Beatmaker · Valencia" },
  { id: "es-4", q: "El remix de la comunidad me mostró direcciones que nunca habría probado solo.", who: "Productor R&B · México DF" },
  { id: "es-5", q: "Exportación WAV directa a mi DAW — flujo en dos clics.", who: "Ingeniero de mezcla · Bogotá" },
  { id: "es-6", q: "Las ideas de hooks salen como demos limpias, no bocetos borrosos.", who: "Vocalista · Sevilla" },
  { id: "es-7", q: "BPM bloqueado en Type Beat Mode — perfecto para packs coherentes.", who: "Productor drill · Buenos Aires" },
  { id: "es-8", q: "Las covers automáticas dan identidad visual antes del lanzamiento.", who: "Artista pop · Lima" },
  { id: "es-9", q: "Variaciones seed para A/B con clientes — ahorro de tiempo enorme.", who: "Productor freelance · Santiago" },
  { id: "es-10", q: "Primera pista pública en una hora. La comunidad incluso valoró el bounce.", who: "Creador TikTok · Medellín" },
  { id: "es-11", q: "Las voces de Song Mode mantienen estructura — raro en herramientas IA.", who: "Rapper · Miami" },
  { id: "es-12", q: "Mis loops Afrobeats se volvieron instrumentales vendibles en BeatStars.", who: "Prod Afrobeats · Lagos" },
  { id: "es-13", q: "Comparto el enlace público para validar un concepto antes del estudio.", who: "Manager de artistas · NYC" },
  { id: "es-14", q: "Beat mode fijó una vibe oscura sin pasar la noche en los 808.", who: "Productor · Seattle" },
  { id: "es-15", q: "Biblioteca clara, regen dirigida — guardo 1 de cada 4 takes y basta.", who: "Beatmaker · Dublín" },
  { id: "es-16", q: "Mis alumnos aprenden la estructura de un hit generando y descomponiendo.", who: "Profesor de música · Boston" },
  { id: "es-17", q: "Cover metálica + track = posts de Insta que destacan sin diseñador.", who: "Creadora de contenido · París" },
  { id: "es-18", q: "Lancé un EP de bocetos en una semana — todo desde prompts simples.", who: "Artista lo-fi · Portland" },
  { id: "es-19", q: "El plan free basta para probar ideas antes de Pro para exportar WAV.", who: "Beatmaker novato · Phoenix" },
  { id: "es-20", q: "Remezclar una pista pública = inspiración instantánea cuando estoy bloqueado.", who: "Productor house · Ámsterdam" },
  { id: "es-21", q: "Las colabs empiezan con un enlace ProducerHit — sin más notas de voz feas.", who: "Artista · Johannesburgo" },
  { id: "es-22", q: "Variaciones x2 en el mismo seed — mejor take elegida en cinco minutos.", who: "Productor pop · Sídney" },
  { id: "es-23", q: "UI limpia, cero fricción — me quedo en el vibe, no en los menús.", who: "Productor · Tokio" },
];

const TESTIMONIALS_PT: LandingTestimonial[] = [
  { id: "pt-1", q: "Achei meu bounce em 3 gerações. Seeds tornam as variações realmente úteis.", who: "Produtor trap · São Paulo" },
  { id: "pt-2", q: "Song Mode me deu um hook que mantive — finalizei a faixa na mesma noite.", who: "Artista indie · Rio" },
  { id: "pt-3", q: "Type Beat + variações = catálogo sólido em uma sessão.", who: "Beatmaker · Lisboa" },
  { id: "pt-4", q: "Remix da comunidade mostrou direções que eu nunca testaria sozinho.", who: "Produtor R&B · Toronto" },
  { id: "pt-5", q: "Exportação WAV direto para o DAW — fluxo em dois cliques.", who: "Engenheiro de mixagem · Atlanta" },
  { id: "pt-6", q: "Ideias de hook saem como demos limpas, não rascunhos embaçados.", who: "Vocalista · Chicago" },
  { id: "pt-7", q: "BPM travado no Type Beat Mode — perfeito para packs coerentes.", who: "Produtor drill · Manchester" },
  { id: "pt-8", q: "Covers automáticas dão identidade visual antes do lançamento.", who: "Artista pop · Miami" },
  { id: "pt-9", q: "Variações seed para A/B com clientes — economia de tempo enorme.", who: "Produtor freelancer · Austin" },
  { id: "pt-10", q: "Primeira faixa pública em uma hora. A comunidade até avaliou o bounce.", who: "Criador TikTok · Berlim" },
  { id: "pt-11", q: "Vocais do Song Mode mantêm estrutura — raro em ferramentas de IA.", who: "Rapper · Houston" },
  { id: "pt-12", q: "Meus loops Afrobeats viraram instrumentais vendáveis no BeatStars.", who: "Prod Afrobeats · Lagos" },
  { id: "pt-13", q: "Compartilho o link público para validar um conceito antes do estúdio.", who: "Manager de artistas · NYC" },
  { id: "pt-14", q: "Beat mode travou uma vibe dark sem virar a noite nos 808.", who: "Produtor · Seattle" },
  { id: "pt-15", q: "Biblioteca limpa, regen direcionada — guardo 1 em 4 takes e já basta.", who: "Beatmaker · Dublin" },
  { id: "pt-16", q: "Alunos aprendem estrutura de hit gerando e decompondo faixas.", who: "Professor de música · Boston" },
  { id: "pt-17", q: "Cover metálica + faixa = posts no Insta que destacam sem designer.", who: "Criadora de conteúdo · Paris" },
  { id: "pt-18", q: "Lancei um EP de rascunhos em uma semana — tudo de prompts simples.", who: "Artista lo-fi · Portland" },
  { id: "pt-19", q: "O plano free basta para testar ideias antes do Pro para exportar WAV.", who: "Beatmaker iniciante · Phoenix" },
  { id: "pt-20", q: "Remixar uma faixa pública = inspiração instantânea quando estou travado.", who: "Produtor house · Amsterdã" },
  { id: "pt-21", q: "Colabs começam com um link ProducerHit — sem mais áudios feios.", who: "Artista · Joanesburgo" },
  { id: "pt-22", q: "Variações x2 no mesmo seed — melhor take escolhida em cinco minutos.", who: "Produtor pop · Sydney" },
  { id: "pt-23", q: "UI limpa, zero atrito — fico no vibe, não nos menus.", who: "Produtor · Tóquio" },
];

const TESTIMONIALS_DE: LandingTestimonial[] = [
  { id: "de-1", q: "Meinen Bounce in 3 Generierungen gefunden. Seeds machen Variationen wirklich nutzbar.", who: "Trap-Produzent · Berlin" },
  { id: "de-2", q: "Song Mode lieferte einen Hook, den ich behalten habe — Track noch am selben Abend fertig.", who: "Indie-Künstler · Hamburg" },
  { id: "de-3", q: "Type Beat + Variationen = solider Katalog in einer Session.", who: "Beatmaker · München" },
  { id: "de-4", q: "Community-Remix zeigte Richtungen, die ich allein nie probiert hätte.", who: "R&B-Produzent · Köln" },
  { id: "de-5", q: "WAV-Export direkt ins DAW — Zwei-Klick-Workflow.", who: "Mix-Engineer · Frankfurt" },
  { id: "de-6", q: "Hook-Ideen werden endlich saubere Demos, keine unscharfen Skizzen.", who: "Sängerin · Stuttgart" },
  { id: "de-7", q: "Fixiertes BPM im Type Beat Mode — perfekt für kohärente Pack-Drops.", who: "Drill-Produzent · Leipzig" },
  { id: "de-8", q: "Auto-Covers geben visuelle Identität vor dem Release.", who: "Pop-Künstlerin · Wien" },
  { id: "de-9", q: "Seed-Variationen für A/B mit Kunden — riesige Zeitersparnis.", who: "Produzent für Hire · Zürich" },
  { id: "de-10", q: "Erster öffentlicher Track in einer Stunde. Community bewertete sogar den Bounce.", who: "TikTok-Creator · Düsseldorf" },
  { id: "de-11", q: "Song Mode Vocals halten Struktur — selten bei KI-Tools.", who: "Rapper · Bremen" },
  { id: "de-12", q: "Meine Afrobeats-Loops wurden verkaufbare Instrumentals auf BeatStars.", who: "Afrobeats-Prod · Lagos" },
  { id: "de-13", q: "Ich teile den öffentlichen Link, um ein Konzept vor Studiozeit zu validieren.", who: "Artist Manager · NYC" },
  { id: "de-14", q: "Beat Mode fixierte eine dunkle Vibe ohne Allnighter an den 808s.", who: "Produzent · Seattle" },
  { id: "de-15", q: "Saubere Bibliothek, gezielte Regen — ich behalte 1 von 4 Takes, das reicht.", who: "Beatmaker · Dublin" },
  { id: "de-16", q: "Schüler lernen Hit-Struktur durch Generieren und Zerlegen.", who: "Musiklehrer · Boston" },
  { id: "de-17", q: "Metallic Cover + Track = Insta-Posts, die ohne Designer auffallen.", who: "Content Creator · Paris" },
  { id: "de-18", q: "Sketch-EP in einer Woche veröffentlicht — alles aus einfachen Prompts.", who: "Lo-fi-Künstler · Portland" },
  { id: "de-19", q: "Free-Tier reicht zum Testen, bevor Pro für WAV-Export.", who: "Neuer Beatmaker · Phoenix" },
  { id: "de-20", q: "Remix eines öffentlichen Tracks = sofortige Inspiration bei Blockade.", who: "House-Produzent · Amsterdam" },
  { id: "de-21", q: "Collabs starten mit einem ProducerHit-Link — keine hässlichen Sprachmemos mehr.", who: "Künstler · Johannesburg" },
  { id: "de-22", q: "x2 Variationen auf demselben Seed — beste Take in fünf Minuten gewählt.", who: "Pop-Produzent · Sydney" },
  { id: "de-23", q: "Saubere UI, null Reibung — Fokus auf Vibe, nicht Menüs.", who: "Produzent · Tokio" },
];

const TESTIMONIALS_JA: LandingTestimonial[] = [
  { id: "ja-1", q: "3回の生成でバウンスが見つかった。seedでバリエーションが本当に使える。", who: "トラッププロデューサー · 東京" },
  { id: "ja-2", q: "Song Modeで残せるフックが出た — その夜に曲を仕上げた。", who: "インディーアーティスト · 大阪" },
  { id: "ja-3", q: "Type Beat + バリエーション = 1セッションで堅いカタログ。", who: "ビートメーカー · ロンドン" },
  { id: "ja-4", q: "コミュニティリミックスで、一人では試さない方向が見えた。", who: "R&Bプロデューサー · トロント" },
  { id: "ja-5", q: "WAVをDAWに直行 — 2クリックのワークフロー。", who: "ミックスエンジニア · アトランタ" },
  { id: "ja-6", q: "フックのアイデアがぼやけたスケッチではなく、きれいなデモになる。", who: "ボーカリスト · シカゴ" },
  { id: "ja-7", q: "Type Beat ModeでBPM固定 — まとまったパックに最適。", who: "ドリルプロデューサー · マンチェスター" },
  { id: "ja-8", q: "自動カバーでリリース前からビジュアルアイデンティティ。", who: "ポップアーティスト · マイアミ" },
  { id: "ja-9", q: "seedバリエーションでクライアント向けA/B — 時間の節約が巨大。", who: "受託プロデューサー · オースティン" },
  { id: "ja-10", q: "1時間で初の公開トラック。コミュニティがバウンスまで評価。", who: "TikTokクリエイター · ベルリン" },
  { id: "ja-11", q: "Song Modeのボーカルは構造を保つ — AIツールでは珍しい。", who: "ラッパー · ヒューストン" },
  { id: "ja-12", q: "アフロビーツのループがBeatStarsで売れるインストに。", who: "アフロビーツProd · ラゴス" },
  { id: "ja-13", q: "スタジオ前にコンセプトを検証するため公開リンクを共有。", who: "アーティストマネージャー · NYC" },
  { id: "ja-14", q: "ビートモードで808に徹夜せずダークな雰囲気を固定。", who: "プロデューサー · シアトル" },
  { id: "ja-15", q: "きれいなライブラリ、狙った再生成 — 4テイクに1つ残せば十分。", who: "ビートメーカー · ダブリン" },
  { id: "ja-16", q: "生成して分解することでヒット構造を学ぶ生徒たち。", who: "音楽教師 · ボストン" },
  { id: "ja-17", q: "メタリックカバー + トラック = デザイナー不要で目立つInsta投稿。", who: "コンテンツクリエイター · パリ" },
  { id: "ja-18", q: "1週間でスケッチEPをリリース — すべてシンプルなプロンプトから。", who: "ローファイアーティスト · ポートランド" },
  { id: "ja-19", q: "Freeでアイデアを試し、WAVはProで — それで十分。", who: "新米ビートメーカー · フェニックス" },
  { id: "ja-20", q: "公開トラックのリミックス = 行き詰まったときの即インスピレーション。", who: "ハウスプロデューサー · アムステルダム" },
  { id: "ja-21", q: "コラボはProducerHitリンクから — 粗いボイスメモはもう不要。", who: "アーティスト · ヨハネスブルグ" },
  { id: "ja-22", q: "同じseedでx2バリエーション — 5分でベストテイクを選ぶ。", who: "ポッププロデューサー · シドニー" },
  { id: "ja-23", q: "すっきりしたUI、摩擦ゼロ — メニューではなくヴァイブに集中。", who: "プロデューサー · 東京" },
];

const TESTIMONIALS_KO: LandingTestimonial[] = [
  { id: "ko-1", q: "3번 생성 만에 바운스를 찾았어요. seed로 변형이 진짜 쓸 만해집니다.", who: "트랩 프로듀서 · 서울" },
  { id: "ko-2", q: "Song Mode에서 훅이 나왔고 그대로 썼어요 — 같은 밤에 트랙을 마쳤습니다.", who: "인디 아티스트 · 부산" },
  { id: "ko-3", q: "Type Beat + 변형 = 한 세션에 탄탄한 카탈로그.", who: "비트메이커 · 런던" },
  { id: "ko-4", q: "커뮤니티 리믹스가 혼자서는 못 해볼 방향을 보여줬어요.", who: "R&B 프로듀서 · 토론토" },
  { id: "ko-5", q: "WAV를 DAW로 바로 — 두 번 클릭 워크플로.", who: "믹스 엔지니어 · 애틀랜타" },
  { id: "ko-6", q: "훅 아이디어가 흐릿한 스케치가 아니라 깔끔한 데모로 나갑니다.", who: "보컬리스트 · 시카고" },
  { id: "ko-7", q: "Type Beat Mode에서 BPM 고정 — 일관된 팩 드롭에 딱.", who: "드릴 프로듀서 · 맨체스터" },
  { id: "ko-8", q: "자동 커버가 발매 전 비주얼 아이덴티티를 줍니다.", who: "팝 아티스트 · 마이애미" },
  { id: "ko-9", q: "seed 변형으로 클라이언트 A/B — 시간 절약이 엄청나요.", who: "외주 프로듀서 · 오스틴" },
  { id: "ko-10", q: "한 시간 만에 첫 공개 트랙. 커뮤니티가 바운스까지 평가했어요.", who: "틱톡 크리에이터 · 베를린" },
  { id: "ko-11", q: "Song Mode 보컬이 구조를 유지해요 — AI 도구에서는 드뭅니다.", who: "래퍼 · 휴스턴" },
  { id: "ko-12", q: "아프로비츠 루프가 BeatStars에서 팔리는 인스트가 됐어요.", who: "아프로비츠 Prod · 라고스" },
  { id: "ko-13", q: "스튜디오 전에 컨셉 검증하려고 공개 링크를 공유합니다.", who: "아티스트 매니저 · NYC" },
  { id: "ko-14", q: "비트 모드로 808 밤샘 없이 다크 바이브를 잡았어요.", who: "프로듀서 · 시애틀" },
  { id: "ko-15", q: "깔끔한 라이브러리, 타겟 재생성 — 4테이크 중 1개면 충분해요.", who: "비트메이커 · 더블린" },
  { id: "ko-16", q: "학생들이 생성 후 분해하며 히트 구조를 배웁니다.", who: "음악 교사 · 보스턴" },
  { id: "ko-17", q: "메탈릭 커버 + 트랙 = 디자이너 없이 눈에 띄는 인스타 포스트.", who: "콘텐츠 크리에이터 · 파리" },
  { id: "ko-18", q: "일주일 만에 스케치 EP 발매 — 모두 간단한 프롬프트에서.", who: "로파이 아티스트 · 포틀랜드" },
  { id: "ko-19", q: "Free로 아이디어 테스트, WAV는 Pro — 그걸로 충분해요.", who: "신입 비트메이커 · 피닉스" },
  { id: "ko-20", q: "공개 트랙 리믹스 = 막혔을 때 즉각 영감.", who: "하우스 프로듀서 · 암스테르담" },
  { id: "ko-21", q: "콜라보는 ProducerHit 링크로 시작 — 지저분한 보이스 메모 끝.", who: "아티스트 · 요하네스버그" },
  { id: "ko-22", q: "같은 seed로 x2 변형 — 5분 만에 베스트 테이크 선택.", who: "팝 프로듀서 · 시드니" },
  { id: "ko-23", q: "깔끔한 UI, 마찰 제로 — 메뉴가 아니라 바이브에 집중.", who: "프로듀서 · 도쿄" },
];

export const TESTIMONIALS_BY_LOCALE: Partial<Record<Locale, LandingTestimonial[]>> = {
  en: TESTIMONIALS_EN,
  fr: TESTIMONIALS_FR,
  es: TESTIMONIALS_ES,
  pt: TESTIMONIALS_PT,
  de: TESTIMONIALS_DE,
  ja: TESTIMONIALS_JA,
  ko: TESTIMONIALS_KO,
};

export function landingTestimonials(locale: Locale): LandingTestimonial[] {
  return TESTIMONIALS_BY_LOCALE[locale] ?? TESTIMONIALS_EN;
}

export function landingSectionClass(extra?: string): string {
  return ["pk-landing-section mx-auto max-w-6xl px-4 py-12 sm:px-5 sm:py-14 lg:px-6 lg:py-[4.5rem]", extra].filter(Boolean).join(" ");
}

/** Hero + generator flow — room for fixed nav, tight handoff to create block. */
export function landingFlowSectionClass(extra?: string): string {
  return [
    "pk-landing-flow pk-landing-section mx-auto max-w-7xl px-4 pb-10 sm:px-5 sm:pb-12 lg:px-6 lg:pb-14",
    "pt-[calc(4.75rem+env(safe-area-inset-top,0px))] sm:pt-[calc(5.25rem+env(safe-area-inset-top,0px))]",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

export function landingCopy(locale: Locale) {
  const landing = getMessages(locale).landing;
  const m = buildLandingMarketingSection(locale);
  const proPrice = planPriceLabel("pro", locale, { suffix: true });
  const free = PLAN_LIMITS.free;
  return {
    heroTagline: landing.heroTagline,
    heroLead: landing.heroLead,
    heroReassurance: landing.heroReassurance,
    heroScrollCue: landing.heroScrollCue,
    heroCtaPrimary: landing.heroCtaPrimary,
    heroCtaDashboard: landing.heroCtaDashboard,

    trustEyebrow: m.trustEyebrow,
    trustTitle: m.trustTitle,
    trustLead: m.trustLead,

    suiteTitle: m.suiteTitle,
    suiteLead: m.suiteLead,
    suitePoints: landingSuitePoints(locale),

    dreamTitle: m.dreamTitle,
    dreamLead: m.dreamLead,

    qualityTitle: m.qualityTitle,
    qualityLead: m.qualityLead,

    featuresTitle: m.featuresTitle,
    featuresLead: m.featuresLead,

    howTitle: m.howTitle,
    howLead: m.howLead,

    communityTitle: m.communityTitle,
    communityLead: m.communityLead,

    partnersLabel: m.partnersLabel,

    socialEyebrow: m.socialEyebrow,
    socialTitle: m.socialTitle,
    socialLead: m.socialLead,

    footerSocialLabel: m.footerSocialLabel,

    testimonialsTitle: m.testimonialsTitle,
    testimonialsHeadline: m.testimonialsHeadline,
    testimonialsLead: m.testimonialsLead,

    ctaTitle: landing.ctaTitle,
    ctaLead: interpolate(landing.ctaLead, { free: PLAN_LIMITS.free, proPrice }),
    ctaButton: landing.ctaButton,

    freeSpotlightTitle: interpolate(m.freeSpotlightTitle, { free }),
    freeSpotlightLead: m.freeSpotlightLead,

    exploreCtaTitle: m.exploreCtaTitle,
    exploreCtaLead: interpolate(m.exploreCtaLead, { free }),
    exploreCtaButton: m.exploreCtaButton,
  };
}

export type LandingBenefitPillar = {
  id: string;
  title: string;
  body: string;
  points: string[];
};

export function landingBenefitPillars(locale: Locale): LandingBenefitPillar[] {
  return landingBenefitPillarsFromCatalog(locale);
}

export type LandingValueBlock = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
};

export function landingValueBlocks(locale: Locale): LandingValueBlock[] {
  return landingValueBlocksFromCatalog(locale);
}

export type LandingFeatureCard = {
  title: string;
  description: string;
};

export function landingFeatureCards(locale: Locale): LandingFeatureCard[] {
  return landingFeatureCardsFromCatalog(locale);
}

export type LandingCloudMoodCard = {
  id: "transparent" | "green" | "red" | "blue";
  element: "air" | "earth" | "fire" | "water";
  label: string;
  tag: string;
  moment: string;
  unlock: string;
  toast: string;
};

export function landingCloudMoodsCopy(locale: Locale) {
  return landingCloudMoodsFromCatalog(locale);
}

export function landingGeneratorBottomCopy(locale: Locale) {
  const m = buildLandingMarketingSection(locale);
  const free = PLAN_LIMITS.free;
  return {
    title: m.genBottomTitle,
    modes: ["Song", "Type Beat", "Remix"],
    steps: [
      { title: m.genBottomStep1Title, hint: m.genBottomStep1Hint },
      { title: m.genBottomStep2Title, hint: m.genBottomStep2Hint },
      { title: m.genBottomStep3Title, hint: m.genBottomStep3Hint },
    ],
    ctaPrimary: m.genBottomCtaPrimary,
    ctaStudio: m.genBottomCtaStudio,
    note: interpolate(m.genBottomNote, { free }),
    pricingLink: m.genBottomPricingLink,
  };
}
