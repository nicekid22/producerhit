/** Assets & copy landing — remplace les partenaires par de vrais logos SVG quand disponibles. */

import { PLAN_LIMITS } from "@/lib/planLimits";

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

type Locale = "en" | "fr";

export type LandingTestimonial = {
  id: string;
  q: string;
  who: string;
};

export function landingTestimonials(locale: Locale): LandingTestimonial[] {
  const isFr = locale === "fr";
  if (isFr) {
    return [
      { id: "fr-1", q: "J’ai trouvé mon bounce en 3 générations. Le seed change tout pour les variations.", who: "Producteur trap · Paris" },
      { id: "fr-2", q: "Song Mode m’a sorti un hook utilisable — j’ai fini le track le soir même.", who: "Artiste indie · Montréal" },
      { id: "fr-3", q: "Type Beat + variations = un catalogue solide en une session.", who: "Beatmaker · Lyon" },
      { id: "fr-4", q: "Le remix communauté m’a fait découvrir des directions que je n’aurais jamais testées seul.", who: "Producteur R&B · Bruxelles" },
      { id: "fr-5", q: "Export WAV direct, import FL en deux clics — workflow nickel.", who: "Ingé son · Marseille" },
      { id: "fr-6", q: "Mes idées de hooks partent enfin en démo propre, pas en sketch flou.", who: "Chanteuse · Toulouse" },
      { id: "fr-7", q: "Type Beat Mode avec BPM verrouillé : parfait pour enchaîner des packs cohérents.", who: "Beatmaker drill · Lille" },
      { id: "fr-8", q: "La cover auto donne une identité visuelle même avant la sortie.", who: "Artiste pop · Genève" },
      { id: "fr-9", q: "J’utilise les variations seed pour A/B test mes clients — gain de temps énorme.", who: "Prod pour artistes · Bordeaux" },
      { id: "fr-10", q: "Premier track public en une heure. La communauté m’a même noté le bounce.", who: "Créateur TikTok · Nantes" },
      { id: "fr-11", q: "Song Mode en français : les couplets tiennent la route, rare pour de l’IA.", who: "Rappeur · Strasbourg" },
      { id: "fr-12", q: "Mes loops Afrobeats sont devenues des instrumentales vendables sur BeatStars.", who: "Prod Afrobeats · Abidjan" },
      { id: "fr-13", q: "Je partage le lien public pour valider un concept avant d’aller en studio.", who: "Manager artiste · Paris" },
      { id: "fr-14", q: "Le mode beat m’a aidé à verrouiller une vibe dark sans passer la nuit sur les 808.", who: "Producteur · Rennes" },
      { id: "fr-15", q: "Bibliothèque claire, regen ciblée — je garde 1 take sur 4, c’est déjà énorme.", who: "Beatmaker · Nice" },
      { id: "fr-16", q: "Mes élèves comprennent la structure d’un hit en générant puis en décomposant.", who: "Prof MAO · Liège" },
      { id: "fr-17", q: "Cover métallique + track = posts Insta qui performent sans designer.", who: "Créatrice contenu · Lyon" },
      { id: "fr-18", q: "J’ai sorti un EP de sketches en une semaine — tous partis de prompts simples.", who: "Artiste lo-fi · Lausanne" },
      { id: "fr-19", q: "Le plan free suffit pour tester des idées avant de passer Pro pour l’export WAV.", who: "Beatmaker débutant · Orléans" },
      { id: "fr-20", q: "Remix d’un track public = inspiration instantanée quand je suis bloqué.", who: "Producteur house · Montpellier" },
      { id: "fr-21", q: "Mes collabs commencent par un lien ProducerHit, plus besoin d’envoyer des maquettes moches.", who: "Artiste · Dakar" },
      { id: "fr-22", q: "Variations x2 sur le même seed : je choisis la meilleure prise en 5 minutes.", who: "Prod pop · Québec" },
      { id: "fr-23", q: "Interface épurée, zéro friction — je reste focus sur le vibe, pas sur les menus.", who: "Producteur · Berlin" },
    ];
  }
  return [
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
    { id: "en-15", q: "Clean library, targeted regen — I keep 1 in 4 takes and that’s plenty.", who: "Beatmaker · Dublin" },
    { id: "en-16", q: "Students learn hit structure by generating then breaking tracks down.", who: "Music teacher · Boston" },
    { id: "en-17", q: "Metallic cover + track = Insta posts that pop without a designer.", who: "Content creator · Paris" },
    { id: "en-18", q: "Shipped a sketch EP in a week — all from simple prompts.", who: "Lo-fi artist · Portland" },
    { id: "en-19", q: "Free tier is enough to test ideas before Pro for WAV export.", who: "New beatmaker · Phoenix" },
    { id: "en-20", q: "Remixing a public track = instant inspiration when I’m stuck.", who: "House producer · Amsterdam" },
    { id: "en-21", q: "Collabs start with a ProducerHit link — no more rough voice memos.", who: "Artist · Johannesburg" },
    { id: "en-22", q: "x2 variations on the same seed — best take picked in five minutes.", who: "Pop producer · Sydney" },
    { id: "en-23", q: "Clean UI, zero friction — I stay locked on vibe, not menus.", who: "Producer · Tokyo" },
  ];
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
  const isFr = locale === "fr";
  return {
    heroTagline: isFr
      ? "Créateur de chansons IA · Type beats · Royalty-free"
      : "AI Song Creator · Type Beats · Royalty-Free",
    heroLead: isFr
      ? "Song Mode · Type Beat · Remix — royalty-free, Spotify Ready."
      : "Song Mode · Type Beat · Remix — royalty-free, Spotify Ready.",
    heroScrollCue: isFr ? "Essayer le générateur" : "Try the generator",
    heroCtaPrimary: isFr ? "Essayer ProducerHit" : "Try ProducerHit",
    heroCtaDashboard: isFr ? "Ouvrir mon studio →" : "Open my studio →",

    trustEyebrow: isFr ? "Adopté par les meilleurs créateurs" : "Trusted by the creators",
    trustTitle: isFr ? "Une suite complète pour produire, remixer et publier" : "A complete suite to produce, remix, and publish",
    trustLead: isFr
      ? "Producteurs, artistes indépendants et passionnés utilisent ProducerHit pour passer du prompt au morceau fini — sans studio physique ni workflow fragmenté."
      : "Producers, indie artists, and hobbyists use ProducerHit to go from prompt to finished track — no physical studio or fragmented workflow required.",

    suiteTitle: isFr ? "Donne vie à tes idées en quelques secondes." : "Bring your creativity to life.",
    suiteLead: isFr
      ? "De la génération IA de chansons aux covers audio, en passant par l’export vidéo vertical et le mastering intégré : tout est réuni pour passer de l’idée à une release royalty-free."
      : "From AI song generation to ACE audio covers, vertical video export, and built-in mastering — everything you need to move from idea to royalty-free release in one place.",
    suitePoints: isFr
      ? ["Song Mode & Type Beat Mode", "Remix — covers IA depuis ton audio", "Export vidéo, MP3/WAV & mastering", "Usage commercial royalty-free"]
      : ["Song Mode & Type Beat Mode", "Remix — AI covers from your audio", "Video export, MP3/WAV & mastering", "Royalty-free commercial use"],

    dreamTitle: isFr ? "Imagine. Décris. Écoute." : "Imagine. Describe. Listen.",
    dreamLead: isFr
      ? "La musique n’a pas de frontières — crée, écoute et partage depuis n’importe quel appareil. Liens publics, bibliothèque perso, export vers ton DAW : ton workflow reste fluide, où que tu sois."
      : "Music has no boundaries — create, listen, and share from any device. Public links, personal library, DAW export: your workflow stays smooth wherever you are.",

    qualityTitle: isFr ? "Qualité studio, pas des maquettes floues" : "Studio-grade quality, not fuzzy demos",
    qualityLead: isFr
      ? "Tu as une mélodie en tête, des paroles notées ou juste une émotion à traduire — ProducerHit génère des chansons structurées et des type beats royalty-free, avec mix propre et itérations rapides via seed."
      : "You have a melody in mind, written lyrics, or just a feeling to capture — ProducerHit generates structured songs and royalty-free type beats with clean mixes and fast seed-based iterations.",

    featuresTitle: isFr ? "Tout ce qu’il faut pour créer et sortir un morceau" : "Everything you need to create and release music",
    featuresLead: isFr
      ? "Générateur de musique IA pensé pour 2026 : Song Mode, Type Beat, Remix, variations seed, export vidéo et fichiers royalty-free — un seul studio en ligne."
      : "An AI music generator built for 2026: Song Mode, Type Beat,Remix, seed variations, video export, and royalty-free files — one online studio.",

    howTitle: isFr ? "3 étapes. Workflow pro." : "Three steps. Pro workflow.",
    howLead: isFr
      ? "De la première idée à l’export Spotify Ready : prompt, génération, itération, mastering et publication — sans quitter le navigateur."
      : "From first idea to Spotify Ready export: prompt, generate, iterate, master, and publish — without leaving your browser.",

    communityTitle: isFr ? "Écoute la communauté en direct" : "Hear the community live",
    communityLead: isFr
      ? "Tracks publics royalty-free, covers uniques et remix communautaire — découvre, note et relance une vibe en Remix Studio."
      : "Royalty-free public tracks, unique covers, and community remix — discover, rate, and relaunch a vibe in Remix Studio.",

    partnersLabel: isFr ? "Compatible avec tes plateformes" : "Works with your platforms",

    socialEyebrow: isFr ? "Réseaux sociaux" : "Social",
    socialTitle: isFr ? "Suis ProducerHit sur Instagram & TikTok" : "Follow ProducerHit on Instagram & TikTok",
    socialLead: isFr
      ? "Workflows producteur, extraits de morceaux, tutos Versions×2 et coulisses du studio — le feed défile, les liens sont en bio."
      : "Producer workflows, track snippets, Versions×2 tips, and studio BTS — scroll the feed, links in bio.",

    footerSocialLabel: isFr ? "Réseaux" : "Social",

    testimonialsTitle: isFr ? "Ils produisent avec ProducerHit" : "They produce with ProducerHit",
    testimonialsHeadline: isFr ? "Retours de producteurs et artistes" : "Feedback from producers and artists",
    testimonialsLead: isFr
      ? "Song Mode, Type Beat, Remix ACE, export MP3/WAV — des workflows concrets, pas des promesses marketing."
      : "Song Mode, Type Beat, Remix, MP3/WAV export — real workflows, not marketing fluff.",

    ctaTitle: isFr ? "Prêt à lancer ta prochaine release ?" : "Ready to ship your next release?",
    ctaLead: isFr
      ? "Commence gratuitement — 10 générations par mois, exports MP3 royalty-free. Passe Pro pour le WAV, Studio pour le mastering complet."
      : "Start free — 10 generations per month, royalty-free MP3 exports. Go Pro for WAV, Studio for full mastering.",
    ctaButton: isFr ? "Essayer ProducerHit gratuitement →" : "Try ProducerHit free →",

    freeSpotlightTitle: isFr
      ? `${PLAN_LIMITS.free} générations gratuites, chaque mois`
      : `${PLAN_LIMITS.free} free generations, every month`,
    freeSpotlightLead: isFr
      ? "Transforme un moment, une blague ou une humeur en morceau personnalisé — même quand les mots ne suffisent pas. Commence sans carte bancaire, upgrade seulement si tu en as besoin."
      : "Turn a moment, an inside joke, or a mood into a custom track — even when words aren't enough. Start without a credit card; upgrade only when you need more.",

    exploreCtaTitle: isFr ? "Explore et laisse-toi inspirer" : "Explore and get inspired",
    exploreCtaLead: isFr
      ? `Rejoins le feed communauté : remix, prompts publics, type beats et covers — ${PLAN_LIMITS.free} générations offertes chaque mois pour lancer ta prochaine idée.`
      : `Join the community feed: remix, public prompts, type beats, and covers — ${PLAN_LIMITS.free} free generations every month to kick off your next idea.`,
    exploreCtaButton: isFr ? "Découvrir la communauté" : "Explore community",
  };
}

export type LandingValueBlock = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
};

export function landingValueBlocks(locale: Locale): LandingValueBlock[] {
  const isFr = locale === "fr";
  const free = PLAN_LIMITS.free;
  const pro = PLAN_LIMITS.pro;
  const studio = PLAN_LIMITS.studio;

  if (isFr) {
    return [
      {
        id: "generator",
        eyebrow: "Générateur IA gratuit",
        title: "Découvre ce que la création ouverte permet",
        body: "Song Mode, type beats, covers remix et feed communautaire — génère, écoute, itère et exporte sans quitter ton navigateur.",
      },
      {
        id: "share",
        eyebrow: "Partage au monde",
        title: "De la chambre au feed",
        body: "Crée des morceaux qui comptent pour toi, puis partage-les : liens publics, export vidéo 9:16, captions auto — de tes proches à une audience plus large.",
      },
      {
        id: "rights",
        eyebrow: "Droits commerciaux",
        title: "Tes exports, tes règles (plans payants)",
        body: "Les abonnés Pro et Studio bénéficient d'exports MP3/WAV royalty-free pour un usage commercial — vidéos, BeatStars, streaming — selon les conditions plateforme et provider.",
      },
      {
        id: "workspace",
        eyebrow: "Studio créatif en ligne",
        title: "Un workspace complet, sans DAW lourd",
        body: "Contrôles producteur + génération IA : bibliothèque, mastering, Remix Studio et export — le workflow d'un studio moderne, directement dans le navigateur.",
      },
      {
        id: "maker",
        eyebrow: "Song maker moderne",
        title: "Crée, remixe, affine",
        body: "Upload audio pour un cover ACE, variations seed, bascule Song ↔ Type Beat, mastering intégré — repars de ta meilleure prise et pousse-la plus loin.",
      },
      {
        id: "volume",
        eyebrow: "Crée chaque mois. Garde tout.",
        title: `Jusqu'à ${studio} générations / mois`,
        body: `Free : ${free}/mois · Pro : ${pro}/mois · Studio : ${studio}/mois. Bibliothèque perso, exports royalty-free sur plans payants — construis un catalogue sans friction.`,
      },
    ];
  }

  return [
    {
      id: "generator",
      eyebrow: "Free AI music generator",
      title: "Discover what open creation unlocks",
      body: "Song Mode, type beats, Remix covers, and a community feed — generate, listen, iterate, and export without leaving your browser.",
    },
    {
      id: "share",
      eyebrow: "Share with the world",
      title: "From your room to the feed",
      body: "Make tracks that matter to you, then share them — public links, 9:16 video export, auto captions — from close friends to a wider audience.",
    },
    {
      id: "rights",
      eyebrow: "Commercial rights",
      title: "Your exports, your rules (paid plans)",
      body: "Pro and Studio subscribers get royalty-free MP3/WAV exports for commercial use — videos, BeatStars, streaming — subject to platform and provider terms.",
    },
    {
      id: "workspace",
      eyebrow: "Online creative studio",
      title: "A complete workspace, no heavy DAW",
      body: "Producer controls plus AI generation: library, mastering, Remix Studio, and export — a modern studio workflow, right in the browser.",
    },
    {
      id: "maker",
      eyebrow: "Modern song maker",
      title: "Create, remix, refine",
      body: "Upload audio for remix/covers, seed variations, switch Song ↔ Type Beat, built-in mastering — start from your best take and push it further.",
    },
    {
      id: "volume",
      eyebrow: "Create every month. Keep it all.",
      title: `Up to ${studio} generations / month`,
      body: `Free: ${free}/mo · Pro: ${pro}/mo · Studio: ${studio}/mo. Personal library, royalty-free exports on paid plans — build a catalog without friction.`,
    },
  ];
}

export type LandingFeatureCard = {
  title: string;
  description: string;
};

export function landingFeatureCards(locale: Locale): LandingFeatureCard[] {
  const isFr = locale === "fr";
  if (isFr) {
    return [
      {
        title: "Song Mode",
        description: "Chansons complètes avec voix, couplets et hooks — structure pro, prête à itérer ou publier en royalty-free.",
      },
      {
        title: "Type Beat Mode",
        description: "Instrumentales IA pour producteurs : BPM, mood, tags — bounce propre en quelques clics, usage commercial inclus.",
      },
      {
        title: "Remix & covers IA",
        description: "Importe ton audio, obtiens un cover ou remix IA — workflow cover studio sans quitter ProducerHit.",
      },
      {
        title: "Export vidéo & partage",
        description: "Clips 9:16, captions auto et liens publics — prêt pour les réseaux et la promo de ta release.",
      },
      {
        title: "Variations seed",
        description: "Versions x2 et regen ciblée — garde la meilleure prise, explore des directions sans brûler ton quota.",
      },
      {
        title: "Mastering & export",
        description: "MP3/WAV, mastering intégré, bibliothèque cloud — Spotify Ready, BeatStars et import DAW direct.",
      },
    ];
  }
  return [
    {
      title: "Song Mode",
      description: "Full songs with vocals, verses, and hooks — pro structure, ready to iterate or publish royalty-free.",
    },
    {
      title: "Type Beat Mode",
      description: "AI instrumentals for producers: BPM, mood, tags — clean bounce in clicks, commercial use included.",
    },
    {
      title: "Remix & AI covers",
      description: "Upload your audio, get an AI cover or remix — studio cover workflow without leaving ProducerHit.",
    },
    {
      title: "Video export & sharing",
      description: "9:16 clips, auto captions, and public links — ready for social promo and your next release.",
    },
    {
      title: "Seed variations",
      description: "Versions x2 and targeted regen — keep the best take, explore directions without burning credits.",
    },
    {
      title: "Mastering & export",
      description: "MP3/WAV, built-in mastering, cloud library — Spotify Ready, BeatStars, and direct DAW import.",
    },
  ];
}
