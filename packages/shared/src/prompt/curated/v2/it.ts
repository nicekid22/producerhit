import type { LocalePromptPools } from "../../localePools/types";

/** V2 IT — prompt display arricchiti : genere + atmosfera + uso. Italiano nativo. */
const SONG: readonly string[] = [
  // —— Decenni & retro ——
  "Canzone synthwave anni 80 — pad Juno analogici, rullante in gated reverb, autostrada al neon di notte. Stranger Things incontra Miami Vice: emotiva, cinematografica, mai kitsch.",
  "Canzone hip-hop boom bap anni 90 — sample polverosi, batteria tagliente, energia da storytelling. Tetto a New York d'estate, nostalgia del boombox con un mix moderno.",
  "Canzone pop-R&B glossy Y2K — synth lucidi, vocal chop stretti, sicurezza era fermagli a farfalla. Perfetta per un reel moda o un TikTok retrò.",
  "Canzone disco-funk revival — basso live, stabs di archi, gioia four-on-the-floor. Energia Studio 54 per una pista da ballo estiva.",
  "Canzone alt-rock grunge anni 90 — dinamiche loud-quiet, chitarre crude, angoscia sincera. Pioggia sul parabrezza, flanella e catarsi.",
  "Canzone soul vintage — organo Hammond, sezione fiati, swing Motown. Ritornello feel-good per spot di marca o montaggio familiare.",

  // —— Cinema & serie ——
  "Canzone horror cinematografica — archi dissonanti, pulse sub, coro sussurrato che cresce. Trailer thriller psicologico, tensione lenta senza jump scare cheap.",
  "Canzone sci-fi epica — tamburi imponenti, orchestra ibrida, ottoni e pad ampi. Trailer odyssey spaziale: meraviglia, pericolo, speranza nel finale.",
  "Canzone jazz film noir — bar fumoso, contrabbasso, batteria spazzolata, tromba smorzata. Lenta, seducente, misteriosa — montaggio detective bianco e nero.",
  "Canzone opening anime — ritornello J-rock esplosivo, chitarre pulite, batteria anthemica. Energia shonen: speranza dopo la battaglia più dura.",
  "Canzone western cinematografica — acustica polverosa, armonica, archi cinematici. Cavalcata outlaw al tramonto — vibe crediti serie Netflix.",
  "Canzone commedia romantica — pop acustico, applausi, ottimismo solare. Incontro in libreria, leggera senza essere infantile.",
  "Canzone blockbuster d'azione — percussioni aggressive, stabs di ottoni, ostinato di archi crescente. Energia inseguimento con hook melodico eroico.",
  "Canzone dramma indie A24 — piano sparso, voce intima, archi che crescono piano. Cuore spezzato silenzioso in cucina alle 2 di notte.",
  "Canzone colonna documentario — neutra ma emotiva, piano e pulse morbidi. Storie umane, archivi, dignità e rispetto.",
  "Canzone trailer supereroe — orchestra ibrida e batteria moderna, coro che sale, colpi d'impatto. Eroe oscuro che torna — brividi senza parodia.",

  // —— Generi profondi ——
  "Canzone neo-soul — Rhodes caldo, basso rotondo, groove rilassato. Onestà notturna, calore vinile, confessione morbida.",
  "Canzone flamenco fusion — palmas, chitarra nylon, hi-hat trap sotto. Passione, fuoco, rooftop Barcellona a mezzanotte.",
  "Canzone bossa nova — chitarra nylon, shaker leggeri, melodia ariosa. Tramonto a Ipanema, romance da caffè, eleganza gentile.",
  "Canzone metalcore — strofe urlate, ritornello melodico cantato, doppio pedale. Montaggio PR in palestra o hype esport — aggressività controllata.",
  "Canzone bluegrass — banjo, violino, energia stomp-clap. Road trip negli Appalachi, storytelling e velocità.",
  "Canzone reggae roots — groove one-drop, basso caldo, energia di testi consapevoli. Sole, resistenza, comunità — spirito Marley modernizzato.",
  "Canzone crossover opera-pop — linee soprano drammatiche su produzione moderna. Epica, lussuosa, finale da talent show.",
  "Canzone blues di Chicago — bend di chitarra, shuffle, grinta da bar. Pioggia fuori, whisky dentro, verità al microfono.",
  "Canzone ska-punk — chitarre upstroke, basso walking, colpi di sezione fiati. Energia video skate, veloce e divertente.",
  "Canzone afro-jazz — percussioni complesse, piano elettrico, libertà improvvisativa. Vernissage in galleria, cosmopolita e vivo.",

  // —— Gaming & digitale ——
  "Canzone montage gaming epico — ibrido orchestrale, struttura rise-and-drop, fanfara di vittoria. Clutch in ranked — hype senza caos meme.",
  "Canzone villaggio RPG lo-fi — campanelle morbide, arpa gentile, pad caldo. Punto di salvataggio sicuro — soundtrack cozy per studiare.",
  "Canzone club cyberpunk — basso distorto, vocal glitch, ansia al neon. Città di notte, cromo e pioggia — mood Edgerunners.",
  "Canzone chiptune arcade retro — lead 8-bit, sidechain moderno, melodia giocosa. Nostalgia schermo high score per trailer gioco indie.",

  // —— Momenti di vita ——
  "Canzone primo ballo matrimonio — slow R&B, piano intimo, archi nel ritornello finale. Amore vero, niente cliché da matrimonio generico.",
  "Inno da laurea — pop-rock uplifting, coro di massa sull'hook. Tocco di tocco in aria, genitori in lacrime, futuro aperto.",
  "Canzone dopo una rottura — parte triste al piano, cresce in ritornello pop empowered. Foto cancellate, taglio nuovo, si va avanti.",
  "Inno da road trip — finestre abbassate, strumming acustico che esplode in batteria. Cartelli autostradali, caffè in autogrill, amici che urlano l'hook.",
  "Canzone tributo funebre — rispettosa, piano e coro, zero melodramma. Celebrare una vita con grazia e calore.",
  "Ninna nanna per neonato — carillon e chitarra morbida, tenera e senza tempo. Luce notturna in cameretta, genitori che canticchiano.",

  // —— Creatore & industria ——
  "Canzone sessione in studio — creatività alle 3 di notte, caffè freddo, magia quando il beat finalmente scatta. Meta ma relatable per i producer.",
  "Canzone challenge virale — earworm da 15 secondi, sillabe catchy, pronta per TikTok. Pensata per loopare, impossibile da dimenticare.",
  "Canzone sync licensing — mood neutro, testi safe, arco commercial-friendly. Pronta per brand video: speranzosa, moderna, universale.",
  "Canzone vincitrice beat battle — swagger rap, beat switch minimale, energia folla. Un round, un knockout.",
  "Canzone sample flip narrativa — chop soul vintage, batteria moderna, strofe narrative. Scavo nei crate, onorare il passato.",

  // —— Stagioni & atmosfere ——
  "Canzone malinconia autunnale — chitarra acustica, mood foglie che cadono, archi morbidi. Tempo di maglioni, felpa dell'ex, tristezza gentile.",
  "Canzone festival estivo — crossover house-pop, hook da coro di folla. Tramonto main stage, glitter, euforia collettiva.",
  "Canzone baita invernale — texture camino che scoppietta, armonie folk, vibe coperta calda. Neve fuori, cioccolata dentro.",
  "Canzone rinascita primaverile — indie pop luminoso, sample di uccelli, energia fresh start. Pulizie in casa, nuova playlist.",
  "Canzone city pop di mezzanotte — accordi city pop giapponesi, basso funky, riflessi al neon. Tangenziale Tokyo, 1982 incontra il 2026.",

  // —— Ibridi & sorprese ——
  "Canzone drill orchestrale — archi e slide 808, contrasto e potenza. Fusione inaspettata ma voluta.",
  "Canzone gospel trap — hook da coro, stabs d'organo, 808 duro. Dalla panchina in chiesa alla pista — adrenalina spirituale.",
  "Canzone country trap — pizzicato di banjo con basso 808, storytelling rurale-urbano. Pickup, sogni di città.",
  "Canzone meditazione ambient — zero batteria, pad evolutivi, ritmo del respiro. App yoga, playlist sonno, focus calmo.",
  "Canzone latin jazz — congas, montuno al piano, colpi di ottoni. Club all'Avana, ballerini, calore e raffinatezza.",
  "Ballad K-pop — strofa emotiva, ritornello esplosivo, produzione lucida. Scena pioggia K-drama, ombrello condiviso.",
  "Canzone drill sinfonica — orchestra cinematografica su 808 scivolanti. Afterparty fashion week a Parigi — lusso e pericolo.",
  "Canzone piano rap — loop piano solo, rap intimo. Energia tiny desk, testi crudi, zero nascondigli.",
  "Canzone hyperpop d'amore — dolcezza glitchata, vocal pitchate, romance caotico. Crush era digitale, overload di emoji cuore.",
  "Canzone afro-house all'alba — log drum, accordi caldi, energia che cresce piano. Spiaggia al mattino dopo la notte migliore.",
];

const BEAT: readonly string[] = [
  // —— Decenni & retro ——
  "Type beat synthwave anni 80 — basso analogico, Juno arpeggiato, rullante retro. Montaggio night drive o titolo VHS horror.",
  "Type beat boom bap East Coast anni 90 — sample flip polveroso, drums duri, groove head-nod. Cypher freestyle o lyric video.",
  "Instrumental R&B Y2K — keys lucide, drums 2-step, spazio per la voce. Slow jam retrò o lookbook moda.",
  "Loop disco house — basso live, stabs di archi, four-on-the-floor. Revival roller rink o spot estivo.",
  "Instrumental alt-rock grunge — strati chitarra loud-quiet, energia batteria live. Edit skate o trailer gioco indie.",

  // —— Cinema ——
  "Beat underscore horror cinematografico — archi atonali, drone sub, zero stinger cheap. Tensione crescente per B-roll thriller.",
  "Beat trailer ibrido epico — braams, rise percussive, colpi orchestrali. Teaser blockbuster o pacchetto hype sportivo.",
  "Loop jazz film noir — contrabbasso, kit spazzolato, sample tromba fumosa. Monologo detective o scena al bar.",
  "Instrumental battle anime — batteria veloce, chitarre distorte, melodia eroica. Edit AMV o menu fighting game.",
  "Loop western cinematografico — chitarra acustica, armonica, percussioni sparse. Duello nel deserto o documentario di viaggio.",

  // —— Generi ——
  "Instrumental neo-soul — accordi Rhodes, basso rotondo, pocket rilassato. Intro podcast o playlist da caffè.",
  "Beat flamenco trap — chitarra nylon, palmas, 808 moderno. Reel fusion latina o dance challenge.",
  "Beat bossa lo-fi — chitarra morbida, texture vinile, swing leggero. Study stream o lobby hotel boutique.",
  "Instrumental metalcore — doppio pedale, riff breakdown, ponte melodico. PR in palestra o highlight esport.",
  "Beat reggae dub — delay pesante, one-drop, basso come melodia. Chill in spiaggia o base spoken-word.",
  "Beat blues Chicago jam — shuffle, room chitarra, stabs d'organo. Energia band da bar strumentale.",
  "Loop afro-jazz fusion — percussioni live, piano elettrico, spazio improvvisativo. Evento galleria o doc cultura.",

  // —— Gaming & digitale ——
  "Beat montage gaming epico — rise, drop, motivo vittoria. Clutch play e recap torneo.",
  "Beat hyperpop chiptune — lead 8-bit, sidechain moderno, caos giocoso. Devlog gioco retro o edit meme.",
  "Beat club cyberpunk — basso distorto, hi-hat industriali, mood neon. B-roll città notturna o brand tech.",

  // —— Uso professionale ——
  "Instrumental pop sync-friendly — upbeat, zero angoli dark, arco 60–90 secondi. Video corporate o onboarding app.",
  "Tema podcast — motivo 8 battute memorabile, mix pulito, non invadente. Intro true crime o show cultura.",
  "Beat workout trap — 808 aggressivo, melodia minima, energia implacabile. Classe HIIT o playlist running.",
  "Beat study lo-fi — texture pioggia, accordi mellow, 85 BPM calmi. Loop focus da 3 ore.",
  "Beat brand luxury — minimal, suono costoso, archi sottili. Sfilata moda o reveal auto.",

  // —— Ibridi ——
  "Type beat drill orchestrale — archi staccato su 808 scivolanti. Campagna streetwear haute couture.",
  "Instrumental gospel trap — stabs coro, organo, drums duri. Energia domenica incontra club night.",
  "Beat country trap — hook banjo, sub 808, clash rurale-urbano. Storytelling TikTok o spot pickup.",
  "Loop ambient cinematografico — texture evolutive, zero batteria. App meditazione o doc natura.",
  "Beat latin jazz house — congas, stabs piano, groove club. Rooftop party o reel menu cocktail.",
  "Beat drill sinfonico — colpi orchestra, melodia dark, slide 808. Edge brand luxury europeo.",
  "Fusion phonk western — cowbell, chitarra desertica, drums memphis phonk. Edit cowboy drift o meme ironico.",
  "Beat UK garage 2-step — drums shuffle, soul chopped, bounce. Montaggio notte londinese.",
  "Beat funk mandelão brasiliano — kick pesante, groove tamborzão, energia baile. Dance challenge o clip festa.",
  "Beat afro-house log drum — accordi caldi, strati percussivi, build all'alba. Set festival mattutino o vlog viaggio.",
  "Beat jersey club melodico — bed squeak, pattern kick, lead emotivo. Dance TikTok o edit emotivo.",
  "Beat sperimentale producer IA — texture glitch, drop inaspettati, energia meta. Demo tech o reel umoristico creator.",
  "Beat techno peak-time — kick driving, linea acida, after warehouse. Footage club o nostalgia rave.",
  "Ibrido acoustic trap — loop chitarra fingerpick, drums trap, spazio emotivo. Singer-songwriter incontra R&B moderno.",
  "Beat afro trap cinematografico — percussioni afro, hi-hat trap, ottoni da trailer. Doc sportivo o manifesto brand.",
];

export const CURATED_V2_IT: LocalePromptPools = { song: SONG, beat: BEAT, hero: [] };
