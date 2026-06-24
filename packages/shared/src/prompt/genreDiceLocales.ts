import type { AppLocale } from "../i18n/locales";

export type ThemeGroup =
  | "trap"
  | "rnb"
  | "afro_latin"
  | "electronic_pop"
  | "rock"
  | "jazz_classical"
  | "world"
  | "cinematic"
  | "dnb"
  | "electronic_club"
  | "lab"
  | "default";

export type LocalizedThemePools = Record<ThemeGroup, readonly string[]>;

const theme = (
  trap: string[],
  rnb: string[],
  afro_latin: string[],
  electronic_pop: string[],
  rock: string[],
  jazz_classical: string[],
  world: string[],
  cinematic: string[],
  dnb: string[],
  electronic_club: string[],
  lab: string[],
  fallback: string[],
): LocalizedThemePools => ({
  trap,
  rnb,
  afro_latin,
  electronic_pop,
  rock,
  jazz_classical,
  world,
  cinematic,
  dnb,
  electronic_club,
  lab,
  default: fallback,
});

export const FR_BEAT_THEMES = theme(
  ["sur une nuit pluvieuse", "sur la confiance en rue", "pour un edit TikTok qui doit percer"],
  ["sur un texto qu'on relit sans l'envoyer", "pour une slow-jam sensuelle", "sur une confession après minuit"],
  ["sur un sunset en festival", "pour un after mariage", "sur une nuit reggaeton"],
  ["pour un hook radio accrocheur", "sur une vibe TikTok virale", "sur une prod bedroom pop"],
  ["sur une répétition garage", "pour un anthem de stade", "sur une tension post-punk"],
  ["sur un set jazz tardif", "pour une bande-annonce indie", "sur un lounge moderne"],
  ["sur une caravane dans le désert", "sur une nuit à Tokyo", "pour un mariage balkan"],
  ["pour une montée de trailer", "sur une allée film noir", "pour un dernier stand héroïque"],
  ["sur un roller liquid en warehouse", "pour un rush jungle", "sur une tension neurofunk"],
  ["pour une after warehouse", "sur un drop festival", "pour une groove tech-house"],
  ["sur un clash futuriste glitch", "pour une expérience AI-pop", "sur une fusion sci-fi"],
  ["pour un reel où le hook tombe du premier coup", "sur la fierté après ton premier son bouclé", "pour un pote qui débarque au studio avec des chips"],
);

export const FR_SONG_THEMES = theme(
  ["sur la panique avant ton premier live", "sur la confiance retrouvée", "sur l'angoisse du dimanche soir"],
  ["sur une rupture douce-amère", "sur une romance sensuelle", "sur une âme neo-soul"],
  ["sur une fête sous les palmiers", "sur une nuit reggaeton", "sur une love story afro-urban"],
  ["sur un hook qui reste en tête", "sur une chanson virale", "sur une nuit néon"],
  ["sur une rébellion garage", "sur un cri de stade", "sur une peine indie"],
  ["sur une romance fumée", "sur une tragédie lyrique", "sur une confidence jazz"],
  ["sur un voyage dans le désert", "sur une nuit à Tokyo", "sur un conte andin"],
  ["sur une montée héroïque", "sur une ombre de film noir", "sur un adieu épique"],
  ["sur une nuit liquid", "sur une ruée jungle", "sur une rage contrôlée"],
  ["sur une nuit warehouse", "sur une montée festival", "sur une groove club"],
  ["sur un futur glitché", "sur une love story AI", "sur une fusion expérimentale"],
  ["sur un dimanche sans alarme", "sur avoir dit non au patron", "sur retrouver ton groupe de potes après des années"],
);

export const EN_BEAT_THEMES = theme(
  ["about a rainy late-night drive", "about street confidence", "for a TikTok edit that needs to pop"],
  ["about a text you keep re-reading but never send", "for a sensual slow jam", "about a midnight phone confession"],
  ["about a festival sunset", "for a wedding after-party", "about a reggaeton night out"],
  ["for a radio-ready hook", "about a viral TikTok moment", "about ironic bedroom pop"],
  ["about a garage rehearsal", "for a stadium anthem", "about late-night post-punk tension"],
  ["about a smoky late jazz set", "for an indie trailer", "about a modern lounge"],
  ["about a desert caravan", "about a Tokyo night market", "for a Balkan wedding"],
  ["for a trailer rise", "about a film-noir alley", "for a heroic last stand"],
  ["about a liquid warehouse roller", "for an underground jungle rush", "about neurofunk tension"],
  ["for a warehouse afterhours", "about a festival mainstage drop", "for a sunrise tech-house groove"],
  ["about a glitch futuristic clash", "for an AI-pop experiment", "about sci-fi fusion"],
  ["for a reel where the hook lands on the first bar", "about finishing your first beat you're proud of", "for a friend who shows up to the session with snacks"],
);

export const EN_SONG_THEMES = theme(
  ["about pre-show nerves before your first gig", "about finding confidence again", "about Sunday-night dread"],
  ["about a bittersweet breakup", "about a sensual romance", "about a neo-soul confession"],
  ["about a party under palm trees", "about a reggaeton night out", "about an afro-urban love story"],
  ["about a catchy hook", "about a viral pop moment", "about a neon night"],
  ["about garage rebellion", "about a stadium cry", "about indie heartache"],
  ["about a smoky romance", "about a lyrical tragedy", "about a jazz confession"],
  ["about a desert journey", "about a Tokyo night", "about an Andean tale"],
  ["about a heroic rise", "about a film-noir shadow", "about an epic goodbye"],
  ["about a liquid night", "about a jungle rush", "about controlled rage"],
  ["about a warehouse night", "about a festival build", "about a club groove"],
  ["about a glitched future", "about an AI love story", "about an experimental fusion"],
  ["about a lazy Sunday with no alarm", "about saying no to your boss for once", "about reuniting with old friends"],
);

export const ES_SONG_THEMES = theme(
  ["sobre un texto que relees pero no envías", "sobre recuperar la confianza", "sobre la ansiedad del domingo por la noche"],
  ["sobre una ruptura agridulce", "sobre un romance sensual", "sobre una confesión neo soul"],
  ["sobre una fiesta bajo las palmeras", "sobre una noche de reggaetón", "sobre un amor afro-urbano"],
  ["sobre un estribillo que se queda en la cabeza", "sobre un momento pop viral", "sobre una noche de neón"],
  ["sobre una rebelión de garaje", "sobre un grito de estadio", "sobre un desamor indie"],
  ["sobre un romance ahumado", "sobre una tragedia lírica", "sobre una confesión jazz"],
  ["sobre un viaje por el desierto", "sobre una noche en Tokio", "sobre un cuento andino"],
  ["sobre un ascenso heroico", "sobre una sombra de cine negro", "sobre una despedida épica"],
  ["sobre una noche liquid", "sobre una carrera jungle", "sobre una rabia controlada"],
  ["sobre una noche en warehouse", "sobre un build de festival", "sobre un groove de club"],
  ["sobre un futuro glitch", "sobre una historia de amor con IA", "sobre una fusión experimental"],
  ["sobre un domingo sin despertador", "sobre decirle que no al jefe por primera vez", "sobre reencontrarte con viejos amigos"],
);

export const ES_BEAT_THEMES = theme(
  ["para una noche lluviosa", "sobre confianza en la calle", "para un edit de TikTok que debe explotar"],
  ["sobre una noche de desamor", "para un slow jam sensual", "sobre una confesión a medianoche"],
  ["sobre un atardecer de festival", "para un after de boda", "sobre una noche de reggaetón"],
  ["para un hook listo para radio", "sobre un momento viral de TikTok", "sobre bedroom pop irónico"],
  ["sobre un ensayo de garaje", "para un himno de estadio", "sobre tensión post-punk nocturna"],
  ["sobre un set de jazz tardío", "para un tráiler indie", "sobre un lounge moderno"],
  ["sobre una caravana en el desierto", "sobre una noche en Tokio", "para una boda balcánica"],
  ["para una subida de tráiler", "sobre un callejón de cine negro", "para un último stand heroico"],
  ["sobre un roller liquid en warehouse", "para un rush jungle", "sobre tensión neurofunk"],
  ["para un after en warehouse", "sobre un drop de festival", "para un groove tech-house al amanecer"],
  ["sobre un choque futurista glitch", "para un experimento AI-pop", "sobre una fusión sci-fi"],
  ["para un reel donde el hook cae a la primera", "sobre terminar tu primer beat del que estás orgulloso", "para el colega que llega al estudio con snacks"],
);

export const PT_SONG_THEMES = ES_SONG_THEMES;
export const PT_BEAT_THEMES = ES_BEAT_THEMES;

export const IT_SONG_THEMES = theme(
  ["su un cuore spezzato in periferia", "su ritrovare la fiducia", "sull'ansia notturna"],
  ["su una rottura agrodolce", "su un romance sensuale", "su una confessione neo soul"],
  ["su una festa sotto le palme", "su una notte reggaeton", "su una love story afro-urbana"],
  ["su un ritornello che resta in testa", "su un momento pop virale", "su una notte al neon"],
  ["su una ribellione in garage", "su un urlo da stadio", "su un dolore indie"],
  ["su un romance fumoso", "su una tragedia lirica", "su una confessione jazz"],
  ["su un viaggio nel deserto", "su una notte a Tokyo", "su un racconto andino"],
  ["su un'ascesa eroica", "su un'ombra noir", "su un addio epico"],
  ["su una notte liquid", "su una corsa jungle", "su una rabbia controllata"],
  ["su una notte in warehouse", "su un build da festival", "su un groove da club"],
  ["su un futuro glitch", "su una love story con IA", "su una fusione sperimentale"],
  ["su una storia notturna", "su un'emozione cruda", "su un momento di verità"],
);

export const IT_BEAT_THEMES = theme(
  ["per una notte di pioggia", "sulla fiducia in strada", "per un edit TikTok che deve spaccare"],
  ["su una notte di cuore spezzato", "per un slow jam sensuale", "su una confessione a mezzanotte"],
  ["su un tramonto da festival", "per un after di matrimonio", "su una notte reggaeton"],
  ["per un hook radiofonico", "su un momento virale su TikTok", "su bedroom pop ironico"],
  ["su una prova in garage", "per un inno da stadio", "su tensione post-punk notturna"],
  ["su un set jazz tardivo", "per un trailer indie", "su un lounge moderno"],
  ["su una carovana nel deserto", "su una notte a Tokyo", "per un matrimonio balcanico"],
  ["per un crescendo da trailer", "su un vicolo noir", "per un ultimo stand eroico"],
  ["su un roller liquid in warehouse", "per un rush jungle", "su tensione neurofunk"],
  ["per un after in warehouse", "su un drop da festival", "per un groove tech-house all'alba"],
  ["su uno scontro futuristico glitch", "per un esperimento AI-pop", "su una fusione sci-fi"],
  ["per una vibe notturna creativa", "per un momento di verità emotiva", "su atmosfera cinematografica"],
);

export const DE_SONG_THEMES = theme(
  ["über ein gebrochenes Herz am Stadtrand", "über neues Selbstvertrauen", "über nächtliche Angst"],
  ["über eine bittersüße Trennung", "über eine sinnliche Romanze", "über ein Neo-Soul-Geständnis"],
  ["über eine Party unter Palmen", "über eine Reggaeton-Nacht", "über eine Afro-Urban-Lovestory"],
  ["über einen Ohrwurm", "über einen viralen Pop-Moment", "über eine Neon-Nacht"],
  ["über Garage-Rebellion", "über einen Stadion-Schrei", "über Indie-Herzschmerz"],
  ["über eine rauchige Romanze", "über eine lyrische Tragödie", "über ein Jazz-Geständnis"],
  ["über eine Wüstenreise", "über eine Nacht in Tokio", "über eine Anden-Geschichte"],
  ["über einen heroischen Aufstieg", "über einen Film-noir-Schatten", "über einen epischen Abschied"],
  ["über eine Liquid-Nacht", "über einen Jungle-Rush", "über kontrollierte Wut"],
  ["über eine Warehouse-Nacht", "über einen Festival-Build", "über einen Club-Groove"],
  ["über eine glitchige Zukunft", "über eine KI-Liebesgeschichte", "über eine experimentelle Fusion"],
  ["über eine nächtliche Geschichte", "über rohe Emotion", "über einen Moment der Wahrheit"],
);

export const DE_BEAT_THEMES = theme(
  ["für eine regnerische Nacht", "über Straßen-Selbstvertrauen", "für einen TikTok-Edit, der durchstarten muss"],
  ["über eine Herzschmerz-Nacht", "für einen sinnlichen Slow Jam", "über ein Mitternachts-Geständnis"],
  ["über einen Festival-Sunset", "für eine Hochzeits-Afterparty", "über eine Reggaeton-Nacht"],
  ["für einen radiofertigen Hook", "über einen viralen TikTok-Moment", "über ironischen Bedroom Pop"],
  ["über eine Garage-Probe", "für eine Stadium-Hymne", "über nächtliche Post-Punk-Spannung"],
  ["über ein verrauchtes Jazz-Set", "für einen Indie-Trailer", "über eine moderne Lounge"],
  ["über eine Wüstenkarawane", "über einen Tokio-Nachtmarkt", "für eine Balkan-Hochzeit"],
  ["für einen Trailer-Anstieg", "über eine Film-noir-Gasse", "für einen heroischen Last Stand"],
  ["über einen Liquid-Warehouse-Roller", "für einen Underground-Jungle-Rush", "über Neurofunk-Spannung"],
  ["für ein Warehouse-Afterhours", "über einen Festival-Drop", "für einen Sunrise-Tech-House-Groove"],
  ["über einen futuristischen Glitch-Clash", "für ein AI-Pop-Experiment", "über Sci-Fi-Fusion"],
  ["über eine kreative Nachtstimmung", "für einen emotionalen Wahrheitsmoment", "über filmische Atmosphäre"],
);

export const NL_SONG_THEMES = theme(
  ["over een gebroken hart in de buitenwijk", "over zelfvertrouwen terugvinden", "over nachtelijke angst"],
  ["over een bitterzoete breuk", "over een sensuele romance", "over een neo-soul-bekentenis"],
  ["over een feest onder palmbomen", "over een reggaeton-nacht", "over een afro-urban liefdesverhaal"],
  ["over een catchy hook", "over een viraal popmoment", "over een neonnacht"],
  ["over garage-rebellie", "over een stadionschreeuw", "over indie-verscheurd hart"],
  ["over een rokerige romance", "over een lyrische tragedie", "over een jazz-bekentenis"],
  ["over een woestijntrip", "over een nacht in Tokio", "over een Andes-verhaal"],
  ["over een heroïsche opkomst", "over een film-noir-schaduw", "over een episch afscheid"],
  ["over een liquid nacht", "over een jungle-rush", "over gecontroleerde woede"],
  ["over een warehouse-nacht", "over een festival-build", "over een clubgroove"],
  ["over een glitched toekomst", "over een AI-liefdesverhaal", "over een experimentele fusie"],
  ["over een nachtelijk verhaal", "over rauwe emotie", "over een moment van waarheid"],
);

export const NL_BEAT_THEMES = theme(
  ["voor een regenachtige nacht", "over straatvertrouwen", "voor een TikTok-edit die moet knallen"],
  ["over een heartbreak-nacht", "voor een sensuele slow jam", "over een middernachts telefoonbekentenis"],
  ["over een festivalsunset", "voor een bruilofts-after", "over een reggaeton-nacht"],
  ["voor een radio-klare hook", "over een viraal TikTok-moment", "over ironische bedroom pop"],
  ["over een garage-repetitie", "voor een stadionhymne", "over late post-punk spanning"],
  ["over een rokerige jazzset", "voor een indie-trailer", "over een moderne lounge"],
  ["over een woestijnkaravaan", "over een Tokio-nacht", "voor een Balkan-bruiloft"],
  ["voor een trailer-opbouw", "over een film-noir-steeg", "voor een heroïsche last stand"],
  ["over een liquid warehouse roller", "voor een underground jungle rush", "over neurofunk spanning"],
  ["voor een warehouse-after", "over een festival-drop", "voor een sunrise tech-house groove"],
  ["over een futuristische glitch clash", "voor een AI-pop experiment", "over sci-fi fusie"],
  ["over een creatieve nachtelijke vibe", "voor een rauw emotioneel moment", "over cinematische sfeer"],
);

export const FR_GENRE_LABELS: Partial<Record<string, string>> = {
  "Melodic Trap": "melodic trap",
  "Contemporary Rap": "hip-hop",
  "Dark Trap": "dark trap",
  "Contemporary R&B": "R&B",
  "90s R&B": "R&B des années 90",
  Afrobeats: "afrobeats",
  Reggaeton: "reggaetón",
  Pop: "pop",
  House: "house",
  "Lo-Fi Hip-Hop": "lo-fi hip-hop",
  Drill: "drill",
  Trapsoul: "trap soul",
  Amapiano: "amapiano",
  Hyperpop: "hyperpop",
  Synthwave: "synthwave",
  "Brazilian Phonk": "phonk brésilien",
  "K-Pop": "k-pop",
  "J-Pop": "j-pop",
  Bachata: "bachata",
  Salsa: "salsa",
  Kizomba: "kizomba",
  Dembow: "dembow",
  "Latin Pop": "latin pop",
};

export const ES_GENRE_LABELS: Partial<Record<string, string>> = {
  "Melodic Trap": "trap melódico",
  "Contemporary Rap": "hip-hop",
  "Dark Trap": "dark trap",
  "Contemporary R&B": "R&B",
  Afrobeats: "afrobeats",
  Reggaeton: "reggaetón",
  Pop: "pop",
  House: "house",
  "Lo-Fi Hip-Hop": "lo-fi hip-hop",
  Drill: "drill",
};

export const PT_GENRE_LABELS: Partial<Record<string, string>> = {
  ...ES_GENRE_LABELS,
  Reggaeton: "reggaeton",
};

export const IT_GENRE_LABELS: Partial<Record<string, string>> = {
  "Melodic Trap": "trap melodico",
  Pop: "pop",
  House: "house",
  Drill: "drill",
  Afrobeats: "afrobeats",
  Reggaeton: "reggaeton",
};

export const DE_GENRE_LABELS: Partial<Record<string, string>> = {
  "Melodic Trap": "melodischer Trap",
  Pop: "Pop",
  House: "House",
  Drill: "Drill",
};

export const NL_GENRE_LABELS: Partial<Record<string, string>> = {
  "Melodic Trap": "melodische trap",
  Pop: "pop",
  House: "house",
  Drill: "drill",
};

type LocaleDiceConfig = {
  song: (genre: string, theme: string) => string;
  beat: (genre: string, theme: string) => string;
  songThemes: LocalizedThemePools;
  beatThemes: LocalizedThemePools;
  genreLabels?: Partial<Record<string, string>>;
};

export const LOCALE_DICE_CONFIG: Partial<Record<AppLocale, LocaleDiceConfig>> = {
  es: {
    song: (g, t) => `Una canción ${g} ${t}`,
    beat: (g, t) => `Un beat ${g} ${t}`,
    songThemes: ES_SONG_THEMES,
    beatThemes: ES_BEAT_THEMES,
    genreLabels: ES_GENRE_LABELS,
  },
  pt: {
    song: (g, t) => `Uma música ${g} ${t}`,
    beat: (g, t) => `Um beat ${g} ${t}`,
    songThemes: PT_SONG_THEMES,
    beatThemes: PT_BEAT_THEMES,
    genreLabels: PT_GENRE_LABELS,
  },
  it: {
    song: (g, t) => `Una canzone ${g} ${t}`,
    beat: (g, t) => `Un beat ${g} ${t}`,
    songThemes: IT_SONG_THEMES,
    beatThemes: IT_BEAT_THEMES,
    genreLabels: IT_GENRE_LABELS,
  },
  de: {
    song: (g, t) => `Ein ${g}-Song ${t}`,
    beat: (g, t) => `Ein ${g}-Beat ${t}`,
    songThemes: DE_SONG_THEMES,
    beatThemes: DE_BEAT_THEMES,
    genreLabels: DE_GENRE_LABELS,
  },
  nl: {
    song: (g, t) => `Een ${g}-song ${t}`,
    beat: (g, t) => `Een ${g}-beat ${t}`,
    songThemes: NL_SONG_THEMES,
    beatThemes: NL_BEAT_THEMES,
    genreLabels: NL_GENRE_LABELS,
  },
};
