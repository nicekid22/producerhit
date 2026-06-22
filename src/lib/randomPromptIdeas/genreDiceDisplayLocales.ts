import type { ThemeGroup } from "@/lib/randomPromptIdeas/genreDiceThemes/types";

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

export const ES_SONG_THEMES = theme(
  ["sobre un corazón roto en las afueras", "sobre recuperar la confianza", "sobre la ansiedad nocturna", "sobre un resurgir en la calle"],
  ["sobre una ruptura agridulce", "sobre un romance sensual", "sobre una confesión neo soul", "sobre un secreto después de medianoche"],
  ["sobre una fiesta bajo las palmeras", "sobre una noche de reggaetón", "sobre un amor afro-urbano", "sobre vibras de isla soleada"],
  ["sobre un estribillo que se queda en la cabeza", "sobre un momento pop viral", "sobre una noche de neón", "sobre un sueño bedroom pop"],
  ["sobre una rebelión de garaje", "sobre un grito de estadio", "sobre un desamor indie", "sobre una ruptura post-punk"],
  ["sobre un romance ahumado", "sobre una tragedia lírica", "sobre una confesión jazz", "sobre una promesa clásica"],
  ["sobre un viaje por el desierto", "sobre una noche en Tokio", "sobre un cuento andino", "sobre una fiesta balcánica"],
  ["sobre un ascenso heroico", "sobre una sombra de cine negro", "sobre una despedida épica", "sobre una tensión creciente"],
  ["sobre una noche liquid", "sobre una carrera jungle", "sobre una rabia controlada", "sobre un sueño atmosférico"],
  ["sobre una noche en warehouse", "sobre un build de festival", "sobre un groove de club", "sobre un trance techno"],
  ["sobre un futuro glitch", "sobre una historia de amor con IA", "sobre una fusión experimental", "sobre una órbita sci-fi"],
  ["sobre una historia nocturna", "sobre una emoción cruda", "sobre un momento de verdad", "sobre una vibra cinematográfica"],
);

export const ES_BEAT_THEMES = theme(
  ["para una noche lluviosa", "sobre confianza en la calle", "para celebrar una victoria en el Mundial", "sobre una sesión de estudio a las 3 a. m.", "para un edit de TikTok que debe explotar"],
  ["sobre una noche de desamor", "para un slow jam sensual", "sobre un ghosting tras tres citas perfectas", "sobre una confesión telefónica a medianoche"],
  ["sobre un atardecer de festival", "para un after de boda que se vuelve baile", "sobre una noche de reggaetón en Barcelona", "sobre energía afro-urbana de verano"],
  ["para un hook listo para radio", "sobre un momento viral de TikTok", "para un anuncio de zapatillas Gen Z", "sobre bedroom pop irónico"],
  ["sobre un ensayo de garaje", "para un himno de estadio", "sobre un burnout que termina en grito liberador", "sobre tensión post-punk nocturna"],
  ["sobre un set de jazz tardío", "para un tráiler indie", "sobre un lounge moderno", "sobre tensión clásica cinematográfica"],
  ["sobre una caravana en el desierto", "sobre una noche en Tokio", "para una boda balcánica de tres días", "sobre montañas andinas al amanecer"],
  ["para una subida de tráiler IMAX", "sobre un callejón de cine negro", "para un último stand heroico", "sobre suspense de combustión lenta"],
  ["sobre un roller liquid en warehouse", "para un rush jungle underground", "sobre tensión neurofunk", "sobre un drift atmosférico"],
  ["para un after en warehouse", "sobre un drop de festival", "para un groove tech-house al amanecer", "sobre techno peak de Berlín"],
  ["sobre un choque futurista glitch", "para un experimento AI-pop", "sobre una fusión sci-fi", "para un reel de productor insomne"],
  ["para escuchar tu tema en público por primera vez", "sobre una vibra nocturna creativa", "para un momento de verdad emocional", "sobre atmósfera cinematográfica sin cliché"],
);

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

export const PT_SONG_THEMES = ES_SONG_THEMES;
export const PT_BEAT_THEMES = ES_BEAT_THEMES;
export const PT_GENRE_LABELS: Partial<Record<string, string>> = {
  ...ES_GENRE_LABELS,
  Reggaeton: "reggaeton",
};

export const IT_SONG_THEMES = theme(
  ["su un cuore spezzato in periferia", "su ritrovare la fiducia", "sull'ansia notturna", "su una rinascita di strada"],
  ["su una rottura agrodolce", "su un romance sensuale", "su una confessione neo soul", "su un segreto dopo mezzanotte"],
  ["su una festa sotto le palme", "su una notte reggaeton", "su una love story afro-urbana", "su vibrazioni da isola"],
  ["su un ritornello che resta in testa", "su un momento pop virale", "su una notte al neon", "su un sogno bedroom pop"],
  ["su una ribellione in garage", "su un urlo da stadio", "su un dolore indie", "su una rottura post-punk"],
  ["su un romance fumoso", "su una tragedia lirica", "su una confessione jazz", "su una promessa classica"],
  ["su un viaggio nel deserto", "su una notte a Tokyo", "su un racconto andino", "su una festa balcanica"],
  ["su un'ascesa eroica", "su un'ombra noir", "su un addio epico", "su una tensione crescente"],
  ["su una notte liquid", "su una corsa jungle", "su una rabbia controllata", "su un sogno atmosferico"],
  ["su una notte in warehouse", "su un build da festival", "su un groove da club", "su un trance techno"],
  ["su un futuro glitch", "su una love story con IA", "su una fusione sperimentale", "su un'orbita sci-fi"],
  ["su una storia notturna", "su un'emozione cruda", "su un momento di verità", "su un'atmosfera cinematografica"],
);

export const IT_BEAT_THEMES = theme(
  ["per una notte di pioggia", "sulla fiducia in strada", "per festeggiare una vittoria ai Mondiali", "su una sessione in studio alle 3 del mattino", "per un edit TikTok che deve spaccare"],
  ["su una notte di cuore spezzato", "per un slow jam sensuale", "su un ghosting dopo tre appuntamenti perfetti", "su una confessione a mezzanotte al telefono"],
  ["su un tramonto da festival", "per un after di matrimonio che diventa ballo", "su una notte reggaeton a Barcellona", "su energia afro-urbana estiva"],
  ["per un hook radiofonico", "su un momento virale su TikTok", "per uno spot sneakers Gen Z", "su bedroom pop ironico"],
  ["su una prova in garage", "per un inno da stadio", "su un burnout che finisce in urlo liberatorio", "su tensione post-punk notturna"],
  ["su un set jazz tardivo", "per un trailer indie", "su un lounge moderno", "su tensione classica cinematografica"],
  ["su una carovana nel deserto", "su una notte a Tokyo", "per un matrimonio balcanico di tre giorni", "su montagne andine all'alba"],
  ["per un crescendo da trailer IMAX", "su un vicolo noir", "per un ultimo stand eroico", "su suspense slow-burn"],
  ["su un roller liquid in warehouse", "per un rush jungle underground", "su tensione neurofunk", "su un drift atmosferico"],
  ["per un after in warehouse", "su un drop da festival", "per un groove tech-house all'alba", "su techno peak berlinese"],
  ["su uno scontro futuristico glitch", "per un esperimento AI-pop", "su una fusione sci-fi", "per un reel da producer insonne"],
  ["per sentire il tuo brano in pubblico per la prima volta", "su una vibe notturna creativa", "per un momento di verità emotiva", "su atmosfera cinematografica senza cliché"],
);

export const IT_GENRE_LABELS: Partial<Record<string, string>> = {
  "Melodic Trap": "trap melodico",
  Pop: "pop",
  House: "house",
  Drill: "drill",
  Afrobeats: "afrobeats",
  Reggaeton: "reggaeton",
};

export const DE_SONG_THEMES = theme(
  ["über ein gebrochenes Herz am Stadtrand", "über neues Selbstvertrauen", "über nächtliche Angst", "über ein Comeback auf der Straße"],
  ["über eine bittersüße Trennung", "über eine sinnliche Romanze", "über ein Neo-Soul-Geständnis", "über ein Geheimnis nach Mitternacht"],
  ["über eine Party unter Palmen", "über eine Reggaeton-Nacht", "über eine Afro-Urban-Lovestory", "über sonnige Inselvibes"],
  ["über einen Ohrwurm", "über einen viralen Pop-Moment", "über eine Neon-Nacht", "über einen Bedroom-Pop-Traum"],
  ["über Garage-Rebellion", "über einen Stadion-Schrei", "über Indie-Herzschmerz", "über eine Post-Punk-Trennung"],
  ["über eine rauchige Romanze", "über eine lyrische Tragödie", "über ein Jazz-Geständnis", "über ein klassisches Versprechen"],
  ["über eine Wüstenreise", "über eine Nacht in Tokio", "über eine Anden-Geschichte", "über eine Balkan-Feier"],
  ["über einen heroischen Aufstieg", "über einen Film-noir-Schatten", "über einen epischen Abschied", "über wachsende Spannung"],
  ["über eine Liquid-Nacht", "über einen Jungle-Rush", "über kontrollierte Wut", "über einen atmosphärischen Traum"],
  ["über eine Warehouse-Nacht", "über einen Festival-Build", "über einen Club-Groove", "über eine Techno-Trance"],
  ["über eine glitchige Zukunft", "über eine KI-Liebesgeschichte", "über eine experimentelle Fusion", "über eine Sci-Fi-Umlaufbahn"],
  ["über eine nächtliche Geschichte", "über rohe Emotion", "über einen Moment der Wahrheit", "über eine filmische Stimmung"],
);

export const DE_BEAT_THEMES = theme(
  ["für eine regnerische Nacht", "über Straßen-Selbstvertrauen", "um einen WM-Sieg zu feiern", "über eine Studio-Session um 3 Uhr morgens", "für einen TikTok-Edit, der durchstarten muss"],
  ["über eine Herzschmerz-Nacht", "für einen sinnlichen Slow Jam", "über Ghosting nach drei perfekten Dates", "über ein Mitternachts-Telefongeständnis"],
  ["über einen Festival-Sunset", "für eine Hochzeits-Afterparty", "über eine Reggaeton-Nacht in Barcelona", "über sommerliche Afro-Urban-Energie"],
  ["für einen radiofertigen Hook", "über einen viralen TikTok-Moment", "für eine Gen-Z-Sneaker-Anzeige", "über ironischen Bedroom Pop"],
  ["über eine Garage-Probe", "für eine Stadium-Hymne", "über Burnout, der in einen Schrei endet", "über nächtliche Post-Punk-Spannung"],
  ["über ein verrauchtes Jazz-Set", "für einen Indie-Trailer", "über eine moderne Lounge", "über klassische Filmspannung"],
  ["über eine Wüstenkarawane", "über einen Tokio-Nachtmarkt", "für eine dreitägige Balkan-Hochzeit", "über Anden-Sonnenaufgang"],
  ["für einen IMAX-Trailer-Anstieg", "über eine Film-noir-Gasse", "für einen heroischen Last Stand", "über Slow-Burn-Suspense"],
  ["über einen Liquid-Warehouse-Roller", "für einen Underground-Jungle-Rush", "über Neurofunk-Spannung", "über atmosphärischen Drift"],
  ["für ein Warehouse-Afterhours", "über einen Festival-Mainstage-Drop", "für einen Sunrise-Tech-House-Groove", "über Berlin-Peak-Techno"],
  ["über einen futuristischen Glitch-Clash", "für ein AI-Pop-Experiment", "über Sci-Fi-Fusion", "für ein Insomniac-Producer-Reel"],
  ["wenn du deinen Track zum ersten Mal in der Öffentlichkeit hörst", "über eine kreative Nachtstimmung", "für einen emotionalen Wahrheitsmoment", "über filmische Atmosphäre ohne Klischee"],
);

export const DE_GENRE_LABELS: Partial<Record<string, string>> = {
  "Melodic Trap": "melodischer Trap",
  Pop: "Pop",
  House: "House",
  Drill: "Drill",
};

export const NL_SONG_THEMES = theme(
  ["over een gebroken hart in de buitenwijk", "over zelfvertrouwen terugvinden", "over nachtelijke angst", "over een comeback op straat"],
  ["over een bitterzoete breuk", "over een sensuele romance", "over een neo-soul-bekentenis", "over een geheim na middernacht"],
  ["over een feest onder palmbomen", "over een reggaeton-nacht", "over een afro-urban liefdesverhaal", "over zonnige eilandvibes"],
  ["over een catchy hook", "over een viraal popmoment", "over een neonnacht", "over een bedroom-popdroom"],
  ["over garage-rebellie", "over een stadionschreeuw", "over indie-verscheurd hart", "over een post-punk-breakup"],
  ["over een rokerige romance", "over een lyrische tragedie", "over een jazz-bekentenis", "over een klassieke belofte"],
  ["over een woestijntrip", "over een nacht in Tokio", "over een Andes-verhaal", "over een Balkan-feest"],
  ["over een heroïsche opkomst", "over een film-noir-schaduw", "over een episch afscheid", "over oplopende spanning"],
  ["over een liquid nacht", "over een jungle-rush", "over gecontroleerde woede", "over een atmospherische droom"],
  ["over een warehouse-nacht", "over een festival-build", "over een clubgroove", "over een techno-trance"],
  ["over een glitched toekomst", "over een AI-liefdesverhaal", "over een experimentele fusie", "over een sci-fi-orbit"],
  ["over een nachtelijk verhaal", "over rauwe emotie", "over een moment van waarheid", "over een cinematische vibe"],
);

export const NL_BEAT_THEMES = theme(
  ["voor een regenachtige nacht", "over straatvertrouwen", "om een WK-overwinning te vieren", "over een studiosessie om 3 uur 's nachts", "voor een TikTok-edit die moet knallen"],
  ["over een heartbreak-nacht", "voor een sensuele slow jam", "over ghosting na drie perfecte dates", "over een middernachts telefoonbekentenis"],
  ["over een festivalsunset", "voor een bruilofts-after die uit de hand loopt", "over een reggaeton-nacht in Barcelona", "over zomerse afro-urban energie"],
  ["voor een radio-klare hook", "over een viraal TikTok-moment", "voor een Gen-Z-sneaker-ad", "over ironische bedroom pop"],
  ["over een garage-repetitie", "voor een stadionhymne", "over burnout die eindigt in een bevrijdende schreeuw", "over late post-punk spanning"],
  ["over een rokerige jazzset", "voor een indie-trailer", "over een moderne lounge", "over cinematische klassieke spanning"],
  ["over een woestijnkaravaan", "over een Tokio-nacht", "voor een driedaagse Balkan-bruiloft", "over Andes-zonsopgang"],
  ["voor een IMAX-trailer-opbouw", "over een film-noir-steeg", "voor een heroïsche last stand", "over slow-burn suspense"],
  ["over een liquid warehouse roller", "voor een underground jungle rush", "over neurofunk spanning", "over atmosferische drift"],
  ["voor een warehouse-after", "over een festival-mainstage-drop", "voor een sunrise tech-house groove", "over Berlijn peak techno"],
  ["over een futuristische glitch clash", "voor een AI-pop experiment", "over sci-fi fusie", "voor een slapeloze producer reel"],
  ["over je track voor het eerst in het openbaar horen", "over een creatieve nachtelijke vibe", "voor een rauw emotioneel moment", "over cinematische sfeer zonder cliché"],
);

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

export const LOCALE_DICE_CONFIG: Partial<Record<string, LocaleDiceConfig>> = {
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
