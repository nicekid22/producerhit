export type DistributionAcademyActionItem = {
  id: string;
  labelEn: string;
  labelFr: string;
  hintEn?: string;
  hintFr?: string;
  /** Web in-app route (React Router). */
  href?: string;
  /** Expo Router path on mobile. */
  mobileHref?: string;
  /** Opens in browser (web + mobile). */
  externalUrl?: string;
  requiresAuth?: boolean;
};

export type DistributionAcademyModule = {
  id: string;
  titleEn: string;
  titleFr: string;
  durationMin: number;
  public: boolean;
  summaryEn: string;
  summaryFr: string;
  sectionsEn: string[];
  sectionsFr: string[];
  actionItems: DistributionAcademyActionItem[];
};

export const DISTRIBUTION_ACADEMY_MODULES: DistributionAcademyModule[] = [
  {
    id: "release-mindset",
    titleEn: "Release mindset & AI rights",
    titleFr: "État d'esprit release & droits IA",
    durationMin: 8,
    public: true,
    summaryEn: "Commercial license, declaring AI use to streaming platforms, and a legal checklist before your first upload.",
    summaryFr: "Licence commerciale, déclarer ton usage IA aux plateformes de streaming, et checklist légale avant ton premier upload.",
    sectionsEn: [
      "ProducerHit Pro+ tracks ship with a per-track commercial license in the distribution pack.",
      "Major distributors accept AI-assisted music when you own the rights and disclose AI where required.",
      "Never use uncleared samples, artist names, or trademarked artwork in prompts or titles.",
    ],
    sectionsFr: [
      "Les titres Pro+ incluent une licence commerciale par morceau dans le pack distribution.",
      "Les distributeurs acceptent la musique assistée par IA si tu détiens les droits et déclares l'IA si besoin.",
      "N'utilise jamais d'échantillons non autorisés, de noms d'artistes ou d'œuvres protégées dans tes prompts.",
    ],
    actionItems: [
      {
        id: "download-license-txt",
        labelFr: "Télécharge le license.txt d'un de tes morceaux IA",
        labelEn: "Download license.txt from one of your AI tracks",
        href: "/library",
        mobileHref: "/(tabs)/library",
        requiresAuth: true,
        hintFr:
          "Bibliothèque → ouvre un morceau → Pack distribution → exporte le ZIP. Le fichier license.txt est dedans. Pas encore de morceau ? Crée-en un dans le Studio.",
        hintEn:
          "Library → open a track → Distribution pack → export the ZIP. license.txt is inside. No track yet? Create one in the Studio.",
      },
      {
        id: "artist-name-spotify",
        labelFr: "Note ton nom d'artiste exactement comme sur Spotify",
        labelEn: "Set your artist name exactly as on Spotify",
        href: "/settings#pk-settings-profile",
        externalUrl: "https://www.producerhit.com/settings#pk-settings-profile",
        requiresAuth: true,
        hintFr:
          "Réglages → Profil : ton pseudo public (nom sur Spotify) et ton prénom/nom — ils apparaîtront sur tes futures licences commerciales.",
        hintEn:
          "Settings → Profile: your public username (Spotify name) and first/last name — they appear on your future commercial licenses.",
      },
      {
        id: "distributor-ai-policy",
        labelFr: "Vérifie la politique IA de ton distributeur",
        labelEn: "Check your distributor's AI policy",
        hintFr:
          "Sur le site de DistroKid, TuneCore ou CD Baby, cherche leur page sur la musique générée par IA avant d'uploader.",
        hintEn:
          "On DistroKid, TuneCore, or CD Baby, find their page about AI-generated music before you upload.",
      },
    ],
  },
  {
    id: "prepare-release",
    titleEn: "Prepare your release",
    titleFr: "Préparer ta sortie",
    durationMin: 6,
    public: false,
    summaryEn: "Metadata, release date, explicit flag, and genre mapping for streaming platforms.",
    summaryFr: "Métadonnées, date de sortie, flag explicite et choix du genre pour les plateformes de streaming.",
    sectionsEn: [
      "Use a unique title — avoid generic names that collide in search.",
      "Pick the primary genre your distributor expects; subgenres can be secondary tags.",
      "Schedule releases 2–4 weeks ahead for playlist pitching.",
    ],
    sectionsFr: [
      "Choisis un titre unique — évite les noms génériques en collision.",
      "Sélectionne le genre principal attendu par ton distributeur.",
      "Programme tes sorties 2–4 semaines à l'avance pour le pitching playlists.",
    ],
    actionItems: [
      {
        id: "fill-metadata-wizard",
        labelFr: "Remplis les métadonnées dans le wizard",
        labelEn: "Fill metadata in the distribution wizard",
        href: "/library",
        mobileHref: "/(tabs)/library",
        requiresAuth: true,
        hintFr: "Bibliothèque → ouvre un morceau → Pack distribution → étape Métadonnées.",
        hintEn: "Library → open a track → Distribution pack → Metadata step.",
      },
      {
        id: "explicit-flag",
        labelFr: "Coche explicite si les paroles sont grossières",
        labelEn: "Set explicit if lyrics contain profanity",
        hintFr: "Dans le wizard, active le flag « explicite » si ton titre contient des paroles adultes.",
        hintEn: "In the wizard, turn on the explicit flag if your track has adult lyrics.",
      },
    ],
  },
  {
    id: "official-ai-cover",
    titleEn: "Official AI cover art",
    titleFr: "Cover officielle IA",
    durationMin: 7,
    public: false,
    summaryEn: "Pollinations playbook: short prompts, no text, 64px thumbnail test, validate before export.",
    summaryFr: "Playbook Pollinations : prompts courts, sans texte, test vignette 64px, valider avant export.",
    sectionsEn: [
      "Pinterest covers are inspiration only — generate an official 1400×1400 AI cover in Cover Studio.",
      "Prompt formula: subject + mood + 2 colors + lighting + style (≤150 chars).",
      "Validate only when the 64px tile reads clearly on mobile.",
    ],
    sectionsFr: [
      "Les covers Pinterest inspirent seulement — génère une cover IA 1400×1400 dans Cover Studio.",
      "Formule : sujet + mood + 2 couleurs + éclairage + style (≤150 car.).",
      "Valide seulement si la vignette 64px reste lisible sur mobile.",
    ],
    actionItems: [
      {
        id: "generate-covers",
        labelFr: "Génère 2 covers et choisis la meilleure vignette",
        labelEn: "Generate 2 covers and pick the best thumbnail",
        href: "/library",
        mobileHref: "/(tabs)/library",
        requiresAuth: true,
        hintFr: "Pack distribution → Cover Studio : teste la vignette 64 px avant de valider.",
        hintEn: "Distribution pack → Cover Studio: check the 64px thumbnail before validating.",
      },
      {
        id: "approve-cover",
        labelFr: "Valide la cover avant l'export ZIP",
        labelEn: "Approve cover before ZIP export",
        hintFr: "Clique « Valider la cover » dans Cover Studio — sinon l'export affichera un avertissement.",
        hintEn: "Click « Validate cover » in Cover Studio — otherwise export shows a warning.",
      },
    ],
  },
  {
    id: "producerhit-pack",
    titleEn: "ProducerHit distribution pack",
    titleFr: "Pack distribution ProducerHit",
    durationMin: 5,
    public: false,
    summaryEn: "ZIP walkthrough: audio, cover, metadata.json, license, README.",
    summaryFr: "Walkthrough ZIP : audio, cover, metadata.json, licence, README.",
    sectionsEn: [
      "Open Library → track detail → Pack distribution.",
      "Studio: 2 packs/month · Plus: 5 packs/month.",
      "Upload audio + cover manually to DistroKid, TuneCore, or CD Baby.",
    ],
    sectionsFr: [
      "Bibliothèque → détail morceau → Pack distribution.",
      "Studio : 2 packs/mois · Plus : 5 packs/mois.",
      "Upload audio + cover manuellement sur DistroKid, TuneCore ou CD Baby.",
    ],
    actionItems: [
      {
        id: "export-first-pack",
        labelFr: "Exporte ton premier pack cette semaine",
        labelEn: "Export your first pack this week",
        href: "/library",
        mobileHref: "/(tabs)/library",
        requiresAuth: true,
        hintFr: "Ouvre un morceau Pro+ → Pack distribution → suis les 4 étapes → télécharge le ZIP.",
        hintEn: "Open a Pro+ track → Distribution pack → follow the 4 steps → download the ZIP.",
      },
    ],
  },
  {
    id: "choose-distributor",
    titleEn: "Choose your distributor",
    titleFr: "Choisir ton distributeur",
    durationMin: 6,
    public: false,
    summaryEn: "DistroKid vs TuneCore vs CD Baby for manual AI music uploads.",
    summaryFr: "DistroKid vs TuneCore vs CD Baby pour uploads manuels musique IA.",
    sectionsEn: [
      "DistroKid: fast, annual fee, good for volume.",
      "TuneCore: per-release option, strong for singles.",
      "CD Baby: one-time per release, good for occasional drops.",
    ],
    sectionsFr: [
      "DistroKid : rapide, abonnement annuel, bon pour le volume.",
      "TuneCore : option par sortie, solide pour les singles.",
      "CD Baby : paiement unique par sortie, idéal pour sorties occasionnelles.",
    ],
    actionItems: [
      {
        id: "pick-distributor",
        labelFr: "Choisis un distributeur et crée ton compte",
        labelEn: "Pick one distributor and create account",
        hintFr: "Commence par DistroKid ou TuneCore si tu sors souvent des singles IA.",
        hintEn: "Start with DistroKid or TuneCore if you release AI singles often.",
      },
    ],
  },
  {
    id: "upload-step-by-step",
    titleEn: "Upload step by step",
    titleFr: "Upload pas à pas",
    durationMin: 8,
    public: false,
    summaryEn: "Common upload errors and how to fix rejected metadata.",
    summaryFr: "Erreurs d'upload fréquentes et métadonnées rejetées.",
    sectionsEn: [
      "Match WAV/MP3 bitrate to distributor requirements.",
      "Cover must be square JPG/PNG, min 1400×1400, no explicit imagery against policy.",
      "Double-check featured artists — list only real collaborators.",
    ],
    sectionsFr: [
      "Respecte le bitrate WAV/MP3 du distributeur.",
      "Cover carrée JPG/PNG, min 1400×1400, sans contenu interdit.",
      "Vérifie les artistes invités — uniquement de vrais collaborateurs.",
    ],
    actionItems: [
      {
        id: "upload-single",
        labelFr: "Upload un single avec les fichiers du ZIP",
        labelEn: "Upload one single using your ZIP assets",
        hintFr: "Utilise audio/, cover.jpg et metadata.json de ton pack ProducerHit.",
        hintEn: "Use audio/, cover.jpg, and metadata.json from your ProducerHit pack.",
      },
    ],
  },
  {
    id: "post-release",
    titleEn: "Post-release growth",
    titleFr: "Après la sortie",
    durationMin: 7,
    public: false,
    summaryEn: "Playlists, TikTok→Spotify funnel, Content ID basics.",
    summaryFr: "Playlists, funnel TikTok→Spotify, bases Content ID.",
    sectionsEn: [
      "Pitch Spotify editorial 7 days before release.",
      "Clip 15–30s hooks on TikTok with link-in-bio to Spotify.",
      "Register Content ID only if your distributor offers it and you own 100% rights.",
    ],
    sectionsFr: [
      "Pitch Spotify éditorial 7 jours avant la sortie.",
      "Clips 15–30s sur TikTok avec lien Spotify en bio.",
      "Content ID seulement si ton distributeur le propose et tu détiens 100 % des droits.",
    ],
    actionItems: [
      {
        id: "schedule-tiktok",
        labelFr: "Planifie 3 TikTok pour la semaine de sortie",
        labelEn: "Schedule 3 TikTok posts for release week",
        hintFr: "Prépare des extraits de 15–30 s avec un hook clair et un lien vers Spotify.",
        hintEn: "Prepare 15–30s clips with a clear hook and a link to Spotify.",
      },
    ],
  },
  {
    id: "monetize-catalog",
    titleEn: "Monetize your catalog",
    titleFr: "Monétiser le catalogue",
    durationMin: 6,
    public: false,
    summaryEn: "BeatStars in parallel, sync, and scaling your AI catalog.",
    summaryFr: "BeatStars en parallèle, sync et scaling du catalogue IA.",
    sectionsEn: [
      "Streaming builds long-tail income; BeatStars captures beat buyers.",
      "Reuse stems for sync pitches — same track, multiple revenue lanes.",
      "See Monetization Academy hub for 12-week scaling playbooks.",
    ],
    sectionsFr: [
      "Le streaming construit un revenu long terme ; BeatStars capte les acheteurs de beats.",
      "Réutilise les stems pour le sync — même titre, plusieurs flux.",
      "Voir le hub Monetization Academy pour les plans 12 semaines.",
    ],
    actionItems: [
      {
        id: "list-beatstars",
        labelFr: "Liste un instrumental sur BeatStars",
        labelEn: "List one instrumental on BeatStars",
        hintFr: "En parallèle du streaming : même beat, deux sources de revenus.",
        hintEn: "Alongside streaming: same beat, two income streams.",
      },
      {
        id: "read-monetization-hub",
        labelFr: "Lis le hub monétisation",
        labelEn: "Read monetization hub",
        href: "/blog/monetization-academy-free-hub-all-guides-2026",
        externalUrl: "https://www.producerhit.com/blog/monetization-academy-free-hub-all-guides-2026",
        hintFr: "Guides gratuits pour scaler ton catalogue sur 12 semaines.",
        hintEn: "Free guides to scale your catalog over 12 weeks.",
      },
    ],
  },
];

export const DISTRIBUTION_ACADEMY_VALUE_USD = 497;
