import type { AppLocale } from "@/i18n/config";

export type PromptMode = "beat" | "song";

/* ——— Chansons EN ——— */
const SONG_TRENDS_EN = [
  "TikTok-ready pop hook — 15-second chorus, Gen Z energy, viral potential",
  "Dark alt-pop like the moody hits dominating streaming right now",
  "Amapiano x house crossover — log drums, summer club energy",
  "Latin reggaeton banger — dembow, party at 2am, bilingual hooks",
  "Hyperpop glitch vocals — chaotic, colorful, internet-native",
  "Indie sleaze revival — gritty guitars, late-night downtown vibe",
] as const;

const SONG_AI_ARTIST_EN = [
  "Create an AI pop star anthem — glossy auto-tuned vocals, stadium energy",
  "Virtual R&B singer — silky runs, heartbreak at midnight, cinematic",
  "AI drill rapper persona — cold delivery, UK x NYC crossover",
  "Digital soul artist — neo-soul chords, futuristic production",
  "Synthetic hyperpop idol — cute-aggressive, anime energy, catchy hook",
] as const;

const SONG_PERSONAL_EN = [
  "Make an R&B song about quitting my job",
  "Write a pop song about me getting ghosted",
  "An emotional song about my long-distance love",
  "A melancholic trap about my rainy nights",
  "A lo-fi song for my all-night study sessions",
  "Make a house track about me finally moving on",
  "A neo soul song about me missing the train again",
  "Pop-punk anthem about burning out and starting over",
] as const;

const SONG_HIPHOP_CULTURE_EN = [
  "Melodic rap song — pain in the hook, flex in the verse, Metro-type energy",
  "Freestyle-ready track for my YouTube beat channel intro",
  "Type beat to song — Travis Scott spacey vibe with my own story",
  "Drill storytelling — street poetry, 140 BPM, cinematic strings",
  "Boom bap conscious rap — dusty samples, real talk, 90s soul",
  "Jersey club vocal flip — chopped hooks, bounce, club edit energy",
] as const;

/* ——— Chansons FR ——— */
const SONG_TRENDS_FR = [
  "Hook pop TikTok — refrain en 15 secondes, énergie Gen Z, potentiel viral",
  "Dark pop alternative — ambiance des hits moody du moment sur les plateformes",
  "Crossover amapiano x house — log drums, énergie club d'été",
  "Banger reggaeton — dembow, soirée à 2h, refrains bilingues",
  "Hyperpop glitch — voix saturées, chaos coloré, culture internet",
  "Indie sleaze revival — guitares crades, nuit en ville",
] as const;

const SONG_AI_ARTIST_FR = [
  "Anthem pop star IA — voix glossy auto-tune, énergie stade",
  "Chanteuse R&B virtuelle — runs soyeux, heartbreak à minuit, ciné",
  "Persona rappeur drill IA — delivery froid, crossover UK x NYC",
  "Artiste soul digital — accords neo-soul, prod futuriste",
  "Idole hyperpop synthétique — cute-agressive, énergie anime, hook catchy",
] as const;

const SONG_PERSONAL_FR = [
  "Fais un son R&B sur ma démission",
  "Une chanson pop sur mon ex qui ghost",
  "Une chanson émotionnelle sur mon amour à distance",
  "Une trap mélancolique sur mes nuits pluvieuses",
  "Un song lo-fi pour mes sessions d'étude nocturnes",
  "Un morceau house sur moi qui tourne enfin la page",
  "Une chanson neo soul sur mon train raté (encore)",
  "Anthem pop-punk — burn-out et nouveau départ",
] as const;

const SONG_HIPHOP_CULTURE_FR = [
  "Chanson rap mélodique — douleur au refrain, flex au couplet, vibe Metro",
  "Son prêt pour freestyle sur ma chaîne YouTube de beats",
  "Du type beat à la chanson — vibe Travis Scott avec mon histoire",
  "Storytelling drill — poésie de rue, 140 BPM, cordes ciné",
  "Rap conscious boom bap — samples dusty, vrai talk, soul 90s",
  "Flip vocal jersey club — hooks chopped, bounce, edit club",
] as const;

/* ——— Beats EN ——— */
const BEAT_TYPE_BEAT_EN = [
  "Travis Scott type beat — spacey, hard, psychedelic 808s",
  "Drake x PARTYNEXTDOOR type beat — moody R&B trap, late night",
  "Playboi Carti rage type beat — distorted 808, chaotic energy",
  "Metro Boomin dark trap — cinematic strings, sliding 808s",
  "Central Cee x NYC drill type beat — cold, 142 BPM, minimal",
  "Future x Southside type beat — toxic melody, hard bounce",
  "21 Savage x London on da Track — sinister piano, 808 slides",
  "Lil Uzi vert melodic type beat — spacey plucks, emotional",
  "Bad Bunny reggaeton type beat — dembow, summer plucks",
  "Burna Boy afrobeat type beat — log drums, warm chords",
  "Skread type beat — icy French trap, hard 808 slides",
  "Kore type beat — sunny melodic trap, Marseille bounce",
  "DJ Weedim type beat — cloud trap, dreamy French rap",
  "Wondagurl type beat — dark minimal Travis energy",
  "J Dilla boom bap — soul sample chop, Dilla swing",
  "Zaytoven piano trap — Atlanta keys, bouncy 808",
  "M1OnTheBeat UK drill — cold piano, 140 BPM",
] as const;

const BEAT_HIPHOP_EN = [
  "Dark melodic trap, smooth 808s, emotional pads",
  "Hard hitting drill, sliding 808s, cold cinematic mood",
  "Lo-fi boom bap, dusty drums, warm vinyl texture",
  "Phonk drift, distorted 808, aggressive energy",
  "Jersey club flip, punchy kicks, hypnotic loop",
  "Neo soul groove, rhodes chords, laid-back swing",
  "UK drill beat — cold, cinematic, 140 BPM, for my freestyle",
  "Memphis phonk x trap — cowbell, dark cowboys energy",
  "West coast g-funk flip — talk box, funky bass, sunny haze",
  "East coast sample drill — chopped soul loop, hard drums",
] as const;

const BEAT_TRENDING_EN = [
  "TikTok cinematic trap — short loop, viral edit energy, 150 BPM",
  "Amapiano log drum beat — percussive, summer, dancefloor",
  "Afrobeats bounce, bright plucks, summer energy",
  "R&B slow jam instrumental, silky keys, late-night vibe",
  "Hyperpop trap hybrid — glitchy, colorful, internet sound",
  "Ambient drill — reverb-heavy, emotional, streaming-ready",
  "Beatstars lo-fi pack vibe — dusty, study beats, 85 BPM",
  "Club edit jersey x house — four-on-the-floor bounce",
] as const;

const BEAT_AI_CREATOR_EN = [
  "AI artist showcase beat — polished, radio-ready, unique signature",
  "Virtual singer demo instrumental — open verse space, big chorus lift",
  "YouTube beat channel intro — memorable motif, clean mix",
  "Sync-ready cinematic beat — tension build, drop at 0:45",
] as const;

/* ——— Beats FR ——— */
const BEAT_TYPE_BEAT_FR = [
  "Type beat Travis Scott — spatial, hard, 808s psychédéliques",
  "Type beat Drake x PARTYNEXTDOOR — trap R&B moody, fin de nuit",
  "Type beat Playboi Carti rage — 808 distordu, énergie chaotique",
  "Dark trap Metro Boomin — cordes ciné, 808s glissants",
  "Type beat Central Cee x drill NYC — froid, 142 BPM, minimal",
  "Type beat Future x Southside — mélodie toxique, bounce hard",
  "Type beat 21 Savage x London — piano sinistre, slides 808",
  "Type beat Lil Uzi mélodique — plucks spacey, émotionnel",
  "Type beat Bad Bunny reggaeton — dembow, plucks d'été",
  "Type beat Burna Boy afrobeat — log drums, accords chauds",
  "Type beat Skread — trap FR glacé, 808s hard",
  "Type beat Kore — mélodique ensoleillé, bounce Marseille",
  "Type beat DJ Weedim — cloud trap, rap FR dreamy",
  "Type beat Nyda — pop-trap Aya, dembow FR",
  "Type beat Hazey — trap dark, bounce agressif",
  "Type beat Bazzazian — trap mélodique émotionnel",
  "Type beat Le Motif — drill FR, piano froid",
  "Type beat Wondagurl — dark minimal Travis",
  "Type beat J Dilla — boom bap soul, swing Dilla",
  "Type beat M1OnTheBeat — drill UK, 140 BPM",
] as const;

const BEAT_HIPHOP_FR = [
  "Trap mélodique sombre, 808s smooth, pads émotionnels",
  "Drill hard, 808s glissants, ambiance froide et ciné",
  "Boom bap lo-fi, drums dusty, texture vinyle chaude",
  "Phonk drift, 808 distordu, énergie agressive",
  "Flip jersey club, kicks punchy, loop hypnotique",
  "Groove neo soul, accords rhodes, swing détendu",
  "Beat drill UK — froid, ciné, 140 BPM, pour mon freestyle",
  "Phonk Memphis x trap — cowbell, énergie dark",
  "Flip g-funk west coast — talk box, basse funky",
  "Sample drill east coast — soul loop chopped, drums hard",
] as const;

const BEAT_TRENDING_FR = [
  "Trap ciné TikTok — loop court, énergie edit viral, 150 BPM",
  "Beat amapiano log drums — percussif, été, dancefloor",
  "Afrobeats bounce, plucks lumineux, énergie d'été",
  "Instrumental slow jam R&B, keys soyeuses, vibe nocturne",
  "Hybrid hyperpop trap — glitchy, coloré, son internet",
  "Drill ambient — reverb, émotionnel, prêt streaming",
  "Vibe pack lo-fi Beatstars — dusty, study beats, 85 BPM",
  "Edit club jersey x house — bounce four-on-the-floor",
] as const;

const BEAT_AI_CREATOR_FR = [
  "Beat showcase artiste IA — polish radio, signature unique",
  "Instrumental démo chanteur virtuel — espace couplet, lift refrain",
  "Intro chaîne YouTube beats — motif mémorable, mix clean",
  "Beat ciné sync-ready — montée tension, drop à 0:45",
] as const;

function songPool(locale: AppLocale): readonly string[] {
  if (locale === "fr") {
    return [...SONG_TRENDS_FR, ...SONG_AI_ARTIST_FR, ...SONG_PERSONAL_FR, ...SONG_HIPHOP_CULTURE_FR];
  }
  return [...SONG_TRENDS_EN, ...SONG_AI_ARTIST_EN, ...SONG_PERSONAL_EN, ...SONG_HIPHOP_CULTURE_EN];
}

function beatPool(locale: AppLocale): readonly string[] {
  if (locale === "fr") {
    return [...BEAT_TYPE_BEAT_FR, ...BEAT_HIPHOP_FR, ...BEAT_TRENDING_FR, ...BEAT_AI_CREATOR_FR];
  }
  return [...BEAT_TYPE_BEAT_EN, ...BEAT_HIPHOP_EN, ...BEAT_TRENDING_EN, ...BEAT_AI_CREATOR_EN];
}

export function getRandomPromptPool(locale: AppLocale, mode: PromptMode): readonly string[] {
  return mode === "song" ? songPool(locale) : beatPool(locale);
}

export function pickRandomPrompt(locale: AppLocale, mode: PromptMode): string {
  const pool = getRandomPromptPool(locale, mode);
  if (pool.length === 0) return "";
  return pool[Math.floor(Math.random() * pool.length)] ?? pool[0]!;
}

/** Pool hero landing (typewriter) — extrait des chansons les plus accrocheuses */
export const LANDING_HERO_PROMPTS_EN = SONG_PERSONAL_EN;
export const LANDING_HERO_PROMPTS_FR = SONG_PERSONAL_FR;

export function pickNextHeroPromptIndex(pool: readonly string[], current: number): number {
  if (pool.length <= 1) return 0;
  let next = current;
  while (next === current) {
    next = Math.floor(Math.random() * pool.length);
  }
  return next;
}
