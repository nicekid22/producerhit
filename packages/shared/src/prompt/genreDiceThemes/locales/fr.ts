import type { LocaleThemeLayers } from "../types";

/** Couches FR — tags genre/instruments en anglais technique ACE ; mood/thème en français. */
export const FR_THEME_LAYERS: LocaleThemeLayers = {
  beatProduction: [
    "drums punchy transients, sub clean, mix 2026 large, headroom pour voix",
    "structure loopable, glue sidechain serrée, loudness club polie, espace hook-ready",
    "drums dry-close, pocket trap moderne, rolls hi-hats crisp, low end mix-ready",
    "dynamiques ciné, percussion layered, saturation contrôlée, stéréo producer-grade",
  ],
  songProduction: [
    "hook chorus accrocheur, harmonies empilées, delivery émotionnelle, mix radio-ready 2026",
    "contraste verse-chorus, layers ad-lib vocaux, production glossy moderne, stéréo large",
    "verse intime, lift chorus puissant, saturation chaleureuse, polish commercial-ready",
    "focus topline mélodique, chaîne vocale crisp, profondeur immersive, arrangement hook-first",
  ],
  beatNarrative: {
    trap: [
      "introspection drive 3h du matin sous pluie, motif piano mineur, sub 808 glissante, rolls hi-hats sparse, mix froid large",
      "swagger rue confiant, stabs cloche mélodique, transients kick punchy, hats trap crisp, headroom hook",
      "montée tension ciné, stabs cordes sombres, glides 808, hats rolling, hits impact trailer-ready",
      "focus studio nuit tard, loop rhodes dusty, thump 808 soft, percussion minimale, glue tape chaude",
    ],
    rnb: [
      "pocket heartbreak nocturne, voicings rhodes mineur, sub 808 round, hats trap brushed, tails reverb satin",
      "groove slow-jam sensuel, electric piano chaud, kick muted, claps soft, chaleur close-mic intime",
      "pocket neo-soul live, comping rhodes jazzy, feel basse upright, rimshots loose, texture dust vinyle",
      "confession après minuit, accords guitare muted, chaleur sub profonde, rim clicks sparse, tone room smoky",
    ],
    afro_latin: [
      "bounce festival sunset, layers shaker percussifs, accents talking drum, licks guitare bright, drive sub chaud",
      "énergie perreo nuit tard, pattern kick dembow, stabs mélodie pluck, poids sub lourd, punch club-ready",
      "crossover accra-london, riff guitare highlife, layers conga, feel sub log-drum, lift dancefloor",
      "block party caribéen, guitare skank offbeat, pocket kick one-drop, glue basse round, chaleur analog sunny",
    ],
    electronic_pop: [
      "loop hook radio, stabs supersaw bright, groove pump sidechain, stack claps crisp, loudness 2026 polie",
      "pocket earworm TikTok, motif pluck catchy, drums punchy serrés, sheen synth glossy, image stéréo large",
      "drive néon retro, snap snare gated, lead synth arp, kick four-on-floor driving, reverb hall 80s",
      "vibe bedroom producer, pads synth soft, texture drums lo-fi, stacks accords chauds, saturation dreamy",
    ],
    rock: [
      "rawness répétition garage, power chords crunchy, drums room live, grit ampli, mix mid-forward punchy",
      "build anthem arena, riffs palm-muted, fills toms driving, espace lead distordu, lift énergie crowd",
      "grit basement indie, wash guitare chorus, kit live loose, chaleur tape-saturated, momentum urgent",
      "tension post-punk, ligne basse mélodique, shimmer guitare chorus, drums dry serrés, atmosphère cold wave",
    ],
    jazz_classical: [
      "impro set tard fumé, walk basse upright, swing snare brush, voicings piano comp, ambience hall",
      "arc drame chambre, lead violon solo, swells ensemble cordes, rolls timbales soft, espace concert hall",
      "lounge jazz moderne, accords rhodes extended, accents trompette muted, basse upright, tone room vinyle",
      "tension classique minimale, motifs piano sparse, support drone cello, swell dynamique graduel, espace reverent",
    ],
    world: [
      "pulse caravane désert, ornements pluck oud, patterns darbuka, hooks mélodie modale, reverb désert large",
      "marché nuit tokyo, textures pluck koto, accents taiko, motif lead pentatonique, mix shimmer néon",
      "echo montagne andes, lead flûte pan, rythme charango, pulse bombo, airiness haute altitude",
      "frénésie mariage balkan, stabs accordéon, hits fanfare cuivres, groove odd-meter, énergie room festive",
    ],
    cinematic: [
      "séquence rise trailer, hits cuivres graves, percussion taiko, ostinato cordes, drops impact sub",
      "allée mystery noir, walk basse upright, trompette muted, bed ambience pluie, tail reverb smoky",
      "dernier stand héroïque, swells pad chœur, percussion orchestrale, fanfare cuivres, mix IMAX-width",
      "suspense slow-burn, clusters cordes dissonants, pulse sub heartbeat, piano sparse, tension qui serre",
    ],
    dnb: [
      "groove roller liquid, slides basse reese chaude, chops breaks crisp, stacks pads airy, énergie 174 flowing",
      "rush warehouse jungle, amen breaks chopped, texture chop vocal ragga, pression sub lourde, vibe UK raw",
      "tension neurofunk, modulations basse reese, transients snare serrés, hits FX industrial, drive club dark",
      "drift dnb atmosphérique, texture break soft, glide drone sub, wash pad distant, loop repeat hypnotique",
    ],
    electronic_club: [
      "hypnose afterhours warehouse, groove basse rolling, ticks hats minimaux, tension sweep filter, pulse Berlin",
      "drop mainstage festival, stab accord supersaw, build riser, kick pump sidechain, énergie crowd-lift",
      "pocket groove tech-house, kick four-on-floor driving, hats shuffled, layers FX percussifs, glue club",
      "peak hard techno, thump kick distordu, bursts bruit industrial, stabs line acid, drive forward relentless",
    ],
    lab: [
      "clash hybrid futuriste, bursts synth glitch, design basse experimental, edits bar irrégulières, tension sci-fi",
      "expérience sheen AI-pop, accords digital glossy, drums hyper-compressed, FX ear-candy, mix modern maximal",
      "contraste rage ambient, wash pad soft vs hits lead distordu, push-pull dynamique, contraste stéréo large",
      "étude texture holographique, layers synth shimmering, drones sub profonds, clicks rythmiques sparse, nocturne néon",
    ],
    default: [
      "motif hook mémorable, drums clean punchy, glue basse chaude, dynamiques tasteful, headroom mix-ready",
      "arrangement loop-friendly, drums transients crisp, low end équilibré, polish large, clarté producer-grade",
      "lift mineur émotionnel, espace topline mélodique, saturation contrôlée, tails reverb airy, sheen moderne",
      "énergie focus night-drive, pocket groove steady, modulation subtile, image stéréo clean, flow repeat-friendly",
    ],
  },
  songNarrative: {
    trap: [
      "arc heartbreak rap mélodique, lead male autotune, loop guitare mineure, 808 glissante, lift chorus hook-forward",
      "storytelling drill froid, espace flow male détaché, stabs piano sparse, slides 808, tail reverb glacée",
      "vulnérabilité emo-rap, voix male cracked, guitare palm-muted clean, 808 lourde, mood anxiété nuit tard",
      "hymne comeback confiance, lead rap male bold, stabs sample cuivres, 808 bounce, hooks ad-lib empilés",
    ],
    rnb: [
      "heartbreak ghosté minuit, lead féminin breathy, voicings rhodes chauds, pocket trap soft, chorus larmoyant",
      "glow réconciliation slow-dance, runs vocaux masculins soyeux, stacks pads lush, glue sub round, mix intime",
      "nostalgie slow-jam 90s, lead masculin smooth, cuivres new jack swing, basse chaude, harmonies fond empilées",
      "tension toxic love, voix féminine grave, drones pads mineurs, 808 soft, atmosphère chambre nocturne",
    ],
    afro_latin: [
      "romance rooftop été, hooks vocaux afro masculins, groove shaker, licks guitare bright, lift festival sunset",
      "nuit perreo reggaeton, lead latin masculin, bounce dembow, mélodie pluck, sub lourd, énergie sueur club",
      "intimité deep-club amapiano, chants vocaux féminins, basse log drum, stabs piano jazzy, afterhours pretoria",
      "block party dancehall, lead male style patois, bounce riddim, poids sub, énergie sunshine island",
    ],
    electronic_pop: [
      "earworm chorus TikTok, lead pop féminin bright, hook synth catchy, drums punchy, polish radio glossy",
      "lift dancefloor euphorique, harmonies féminines empilées, chorus supersaw, kick four-on-floor, énergie festival",
      "introspection bedroom pop, voix féminine whisper, arp guitare clean, drums lo-fi soft, mood fenêtre pluvieuse",
      "moment shine K-pop, lead féminin doubles empilés, lift cordes orchestrales, swell chorus dramatique, mix large",
    ],
    rock: [
      "release angst banlieue, voix rock male raw, lead guitare delay, drums live driving, lift chorus shouté",
      "scream burnout pop-punk, voix male shoutée, power chords rapides, fills drums explosifs, mix garage raw",
      "climax singalong stade, voix anthem male, riff guitare big, kit tom-heavy, espace chorus crowd-chant",
      "haze dream shoegaze, voix féminine buried, wash wall-of-guitar, drums distant, bloom reverb dense",
    ],
    jazz_classical: [
      "confession lounge jazz, voix féminine smoky, comp rhodes, basse upright, snare brushed, chaleur vinyle",
      "peak drame opéra, espace lead soprano puissant, cordes orchestrales, swells timbales, reverb hall grand",
      "heartbreak néo-classique, voix féminine fragile, piano solo, cordes legato, crescendo final cathartique",
      "soirée intime bossa, voix féminine chuchotée, guitare nylon, percussion main soft, mix close chaud",
    ],
    world: [
      "romance nuit rai pop, voix male melismatic, lead synth oriental, groove darbuka, mood néon maghrébin",
      "climax drame bollywood, lead féminin melisma, accents sitar, drive tabla, swell orchestral festif",
      "slow dance bachata, voix espagnole romantique male, arp guitare nylon, pattern bongo, intimité couple proche",
      "célébration highlife, call-response vocal male, stabs section cuivres, riff guitare highlife, joie accra",
    ],
    cinematic: [
      "vœu trailer épique, lead chœur male puissant, hits orchestraux, drive taiko, lift chorus final héroïque",
      "heartbreak film noir, voix male smoky, piano jazz, trompette muted, atmosphère pluie sur vitre",
      "surge opening anime, voix male énergique, drive band J-rock, lead guitare mélodique, rise chorus dramatique",
      "larmes pixar-famille, motif piano naïf, swell cordes soft, voix féminine tendre, lift émotionnel contrôlé",
    ],
    dnb: [
      "lift vocal liquid dnb, lead féminin éthéré, breaks rolling, glide sub chaud, release chorus euphorique",
      "énergie MC jungle, chops vocaux male ragga-style, rush amen break, sub lourd, tension rave warehouse",
      "agression neurofunk, stabs vocaux male gritty, mod basse reese, snare serrée, drive club dark forward",
      "drift song dnb atmosphérique, voix féminine breathy, texture break soft, drone sub, hook repeat hypnotique",
    ],
    electronic_club: [
      "terrasse été house vocale, lead féminin uplifting, stabs accords piano, kick four-on-floor, chaleur sunset",
      "ascension anthem trance, lead féminin sur drop supersaw, tension build longue, release euphorique, mains en l'air festival",
      "mantra warehouse techno, phrases féminines spoken, pulse line acid, kick hard, hypnose afterhours",
      "drop future bass émotionnel, lead féminin, lift stab accords, motion basse wobble, hook chorus bittersweet",
    ],
    lab: [
      "confession glitch hyperpop, voix féminine bright, 808 distordue, leads synth arcade, mix compressed maximal",
      "romance sci-fi R&B, voix féminine processed, pads holographiques, sub profond, atmosphère nocturne cyber",
      "clash rap-électro hybrid, voix male avec FX, basse experimental, edits irrégulières, tension futuriste",
      "contraste rage ambient song, voix verse soft vs scream chorus distordu, push-pull dynamique, stéréo large",
    ],
    default: [
      "hook chorus mémorable, lead vocal expressif, bed accords chaud, section rythmique serrée, polish radio-ready",
      "lift verse storytelling, delivery lead émotionnelle, harmonies empilées, chaîne vocale crisp, mix wide moderne",
      "verse intime vers chorus anthem, lead vocal vulnérable, swell arrangement dynamique, production glossy 2026",
      "énergie earworm singalong, mélodie topline catchy, sheen production bright, drums punchy, layout hook-first",
    ],
  },
  songVocal: {
    trap: [
      "voix rap male mélodique, sheen autotune léger, espace stack ad-lib",
      "delivery flow drill froid, layers vocaux minimaux, emphasis bar hook",
    ],
    rnb: [
      "lead vocal féminin breathy, embellissements runs smooth, harmonies chorus empilées",
      "voix R&B male soyeuse, moments lift falsetto, doubles chauds sur hook",
    ],
    afro_latin: [
      "hooks vocaux afro masculins, chants call-and-response, phrasing percussif",
      "lead vocal latin masculin, cadence espagnole mélodique, espace ad-lib club",
    ],
    electronic_pop: [
      "lead pop féminin bright, harmonies hook empilées, chaîne vocale clean",
      "topline féminine catchy, doubles glossy, repeats phrase earworm court",
    ],
    rock: [
      "voix rock male raw, lift chorus shouté, énergie room live",
      "lead rock féminin puissant, chorus belt gritty, stack vocal gang",
    ],
    jazz_classical: [
      "voix jazz smoky, vibrato soft, proximité mic intime",
      "espace lead vocal opéra, swells dynamiques dramatiques, projection classique",
    ],
    world: [
      "voix world melismatic, phrasing ornamental, couleur accent régional",
      "lead folk passionné, phrasing narratif, tone room acoustique",
    ],
    cinematic: [
      "lead vocal ciné, support chœur epic, dynamiques scale trailer",
      "voix film éthérée, longue tail reverb, blend bed orchestral",
    ],
    dnb: [
      "voix dnb éthérée, top line breathy, syncopation breakbeat",
      "chops vocaux style ragga, énergie MC, alignement drop sub-heavy",
    ],
    electronic_club: [
      "voix club féminine, espace duck sidechain, structure repeat hook",
      "lead vocal trance, notes longues sustained, alignement build-to-drop",
    ],
    lab: [
      "voix experimental processed, espace chop glitch, sheen hyper-modern",
      "voix R&B futuriste, texture formant-shift, reverb holographique",
    ],
    default: [
      "lead vocal expressif, hook chorus mémorable, harmonies empilées",
      "delivery vocale émotionnelle, arrangement hook-forward, chaîne polish",
    ],
  },
};
