import type { PromptMode } from "@/lib/randomPromptIdeas";

/** Narrative + mood pools for ACE-Step 1.5 dice captions (comma tags, not prose). */
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

const BEAT_NARRATIVE: Record<ThemeGroup, readonly string[]> = {
  trap: [
    "3am rainy drive introspection, minor piano motif, sliding 808 sub, sparse hi-hat rolls, cold wide mix",
    "confident street swagger, bell melody stabs, punchy kick transients, crisp trap hats, hook headroom",
    "cinematic tension build, dark string stabs, 808 glides, rolling hats, trailer-ready impact hits",
    "late-night studio focus, dusty rhodes loop, soft 808 thump, minimal percussion, warm tape glue",
  ],
  rnb: [
    "nocturnal heartbreak pocket, rhodes minor voicings, round 808 sub, brushed trap hats, satin reverb tails",
    "slow-jam sensual groove, warm electric piano, muted kick, soft claps, intimate close-mic warmth",
    "neo-soul live pocket, jazzy rhodes comping, upright bass feel, loose rimshots, vinyl dust texture",
    "after-midnight confession, muted guitar chords, deep sub warmth, sparse rim clicks, smoky room tone",
  ],
  afro_latin: [
    "sunset festival bounce, percussive shaker layers, talking drum accents, bright guitar licks, warm sub drive",
    "late-night perreo energy, dembow kick pattern, pluck melody stabs, heavy sub weight, club-ready punch",
    "accra-to-london crossover, highlife guitar riff, conga layers, log-drum sub feel, dancefloor lift",
    "caribbean block party, offbeat skank guitar, one-drop kick pocket, round bass glue, sunny analog warmth",
  ],
  electronic_pop: [
    "radio hook loop, bright supersaw stabs, sidechain pump groove, crisp clap stack, polished 2026 loudness",
    "TikTok earworm pocket, catchy pluck motif, tight punchy drums, glossy synth sheen, wide stereo image",
    "retro neon drive, gated snare snap, arp synth lead, driving four-on-floor kick, 80s hall reverb",
    "bedroom producer vibe, soft synth pads, lo-fi drum texture, warm chord stacks, dreamy saturation",
  ],
  rock: [
    "garage rehearsal rawness, crunchy power chords, live room drums, amp grit, punchy mid-forward mix",
    "arena anthem build, palm-muted riffs, tom-driven fills, distorted lead space, crowd-energy lift",
    "indie basement grit, chorus guitar wash, loose live kit, tape-saturated warmth, urgent momentum",
    "post-punk tension, melodic bass line, chorus guitar shimmer, tight dry drums, cold wave atmosphere",
  ],
  jazz_classical: [
    "smoky late-set improvisation, upright bass walk, brush snare swing, piano comp voicings, hall ambience",
    "chamber drama arc, solo violin lead, string ensemble swells, soft timpani rolls, concert hall space",
    "modern jazz lounge, rhodes extended chords, muted trumpet accents, upright bass, vinyl room tone",
    "minimal classical tension, sparse piano motifs, cello drone support, gradual dynamic swell, reverent space",
  ],
  world: [
    "desert caravan pulse, oud pluck ornaments, darbuka patterns, modal melody hooks, wide desert reverb",
    "tokyo night market, koto pluck textures, taiko accents, pentatonic lead motif, neon shimmer mix",
    "andes mountain echo, pan flute lead, charango rhythm, bombo pulse, high-altitude airiness",
    "balkan wedding frenzy, accordion stabs, brass fanfare hits, odd-meter groove, festive room energy",
  ],
  cinematic: [
    "trailer rise sequence, low brass hits, taiko percussion, string ostinato, sub-impact drops",
    "noir mystery alley, upright bass walk, muted trumpet, rain ambience bed, smoky reverb tail",
    "heroic final stand, choir pad swells, orchestral percussion, brass fanfare, IMAX-width mix",
    "slow-burn suspense, dissonant string clusters, heartbeat sub pulse, sparse piano, tightening tension",
  ],
  dnb: [
    "liquid roller groove, warm reese bass slides, crisp break chops, airy pad stacks, flowing 174 energy",
    "jungle warehouse rush, chopped amen breaks, ragga vocal chop texture, heavy sub pressure, raw UK vibe",
    "neurofunk tension, reese bass modulations, tight snare transients, industrial FX hits, dark club drive",
    "atmospheric dnb drift, soft break texture, sub drone glide, distant pad wash, hypnotic repeat loop",
  ],
  electronic_club: [
    "warehouse afterhours hypnosis, rolling bass groove, minimal hat ticks, filter sweep tension, Berlin pulse",
    "festival mainstage drop, supersaw chord stab, riser build, sidechain pump kick, crowd-lift energy",
    "tech-house groove pocket, driving four-on-floor kick, shuffled hats, percussive FX layers, club glue",
    "hard techno peak, distorted kick thump, industrial noise bursts, acid line stabs, relentless forward drive",
  ],
  lab: [
    "futuristic hybrid clash, glitch synth bursts, experimental bass design, irregular bar edits, sci-fi tension",
    "AI-pop sheen experiment, glossy digital chords, hyper-compressed drums, ear-candy FX, maximal modern mix",
    "ambient rage contrast, soft pad wash vs distorted lead hits, dynamic push-pull, wide stereo contrast",
    "holographic texture study, shimmering synth layers, deep sub drones, sparse rhythmic clicks, neon nocturne",
  ],
  default: [
    "memorable hook motif, punchy clean drums, warm bass glue, tasteful dynamics, mix-ready headroom",
    "loop-friendly arrangement, crisp transient drums, balanced low end, wide polish, producer-grade clarity",
    "emotional minor-key lift, melodic topline space, controlled saturation, airy reverb tails, modern sheen",
    "night-drive focus energy, steady groove pocket, subtle modulation, clean stereo image, repeat-friendly flow",
  ],
};

const SONG_NARRATIVE: Record<ThemeGroup, readonly string[]> = {
  trap: [
    "melodic rap heartbreak arc, autotune male lead, minor guitar loop, sliding 808, hook-forward chorus lift",
    "drill storytelling coldness, detached male flow space, sparse piano stabs, 808 slides, icy reverb tail",
    "emo-rap vulnerability, cracked male vocal, clean palm-muted guitar, heavy 808, anxious late-night mood",
    "confidence comeback anthem, bold male rap lead, brass sample stabs, bouncy 808, stacked ad-lib hooks",
  ],
  rnb: [
    "ghosted-at-midnight heartbreak, breathy female lead, rhodes warm voicings, soft trap pocket, tearful chorus",
    "slow-dance reconciliation glow, silky male vocal runs, lush pad stacks, round sub glue, intimate mix",
    "90s slow-jam nostalgia, smooth male lead, new jack swing brass, warm bass, stacked background harmonies",
    "toxic-love tension, grave female vocal, minor pad drones, soft 808, nocturnal bedroom atmosphere",
  ],
  afro_latin: [
    "summer rooftop romance, male afro vocal hooks, shaker groove, bright guitar licks, sunset festival lift",
    "reggaeton perreo night, male latin lead, dembow bounce, pluck melody, heavy sub, club sweat energy",
    "amapiano deep-club intimacy, female vocal chants, log drum bass, jazzy piano stabs, pretoria afterhours",
    "dancehall block party, patois-style male lead, riddim bounce, sub weight, island sunshine energy",
  ],
  electronic_pop: [
    "TikTok chorus earworm, bright female pop lead, catchy synth hook, punchy drums, glossy radio polish",
    "euphoric dancefloor lift, stacked female harmonies, supersaw chorus, four-on-floor kick, festival energy",
    "bedroom pop introspection, whisper female vocal, clean guitar arp, soft lo-fi drums, rainy window mood",
    "K-pop shine moment, female lead with stacked doubles, orchestral string lift, dramatic chorus swell, wide mix",
  ],
  rock: [
    "suburban angst release, raw male rock vocal, delay guitar lead, driving live drums, shouted chorus lift",
    "pop-punk burnout scream, shouted male vocal, fast power chords, explosive drum fills, raw garage mix",
    "stadium singalong climax, male anthem vocal, big guitar riff, tom-heavy kit, crowd-chant chorus space",
    "shoegaze dream haze, buried female vocal, wall-of-guitar wash, distant drums, dense reverb bloom",
  ],
  jazz_classical: [
    "jazz lounge confession, smoky female vocal, rhodes comp, upright bass, brushed snare, vinyl warmth",
    "operatic drama peak, powerful soprano lead space, orchestral strings, timpani swells, grand hall reverb",
    "neo-classical heartbreak, fragile female vocal, solo piano, legato strings, cathartic final crescendo",
    "bossa intimate evening, whispered female vocal, nylon guitar, soft hand percussion, warm close mix",
  ],
  world: [
    "rai pop night romance, melismatic male vocal, oriental synth lead, darbuka groove, maghrebin neon mood",
    "bollywood drama climax, female lead with melisma, sitar accents, tabla drive, festive orchestral swell",
    "bachata slow dance, romantic male spanish vocal, nylon guitar arp, bongo pattern, close couple intimacy",
    "highlife celebration, male vocal call-response, horn section stabs, guitar highlife riff, accra joy energy",
  ],
  cinematic: [
    "epic trailer vow, powerful male choir lead, orchestral hits, taiko drive, heroic final chorus lift",
    "film noir heartbreak, smoky male vocal, jazz piano, muted trumpet, rain-on-glass atmosphere",
    "anime opening surge, energetic male vocal, J-rock band drive, melodic guitar lead, dramatic chorus rise",
    "pixar-family tears, naive piano motif, soft string swell, tender female vocal, controlled emotional lift",
  ],
  dnb: [
    "liquid dnb vocal lift, ethereal female lead, rolling breaks, warm sub glide, euphoric chorus release",
    "jungle MC energy, ragga-style male vocal chops, amen break rush, heavy sub, warehouse rave tension",
    "neurofunk aggression, gritty male vocal stabs, reese bass mod, tight snare, dark club forward drive",
    "atmospheric dnb drift song, breathy female vocal, soft break texture, sub drone, hypnotic repeat hook",
  ],
  electronic_club: [
    "house vocal summer terrace, uplifting female lead, piano chord stabs, four-on-floor kick, sunset warmth",
    "trance anthem ascent, female lead on supersaw drop, long build tension, euphoric release, festival hands-up",
    "techno warehouse mantra, spoken female phrases, acid line pulse, hard kick, afterhours hypnosis",
    "future bass emotional drop, female lead, chord stab lift, wobble bass motion, bittersweet chorus hook",
  ],
  lab: [
    "hyperpop glitch confession, bright female vocal, distorted 808, arcade synth leads, maximal compressed mix",
    "sci-fi R&B romance, processed female vocal, holographic pads, deep sub, cyber nocturne atmosphere",
    "hybrid rap-electronic clash, male vocal with FX, experimental bass, irregular edits, futuristic tension",
    "ambient rage contrast song, soft verse vocal vs distorted chorus scream, dynamic push-pull, wide stereo",
  ],
  default: [
    "memorable chorus hook, expressive lead vocal, warm chord bed, tight rhythm section, radio-ready polish",
    "storytelling verse lift, emotional lead delivery, stacked harmonies, crisp vocal chain, modern wide mix",
    "intimate verse to anthem chorus, vulnerable lead vocal, dynamic arrangement swell, glossy 2026 production",
    "singalong earworm energy, catchy topline melody, bright production sheen, punchy drums, hook-first layout",
  ],
};

const SONG_VOCAL: Record<ThemeGroup, readonly string[]> = {
  trap: [
    "melodic male rap vocal, light autotune sheen, ad-lib stack space",
    "cold drill flow delivery, minimal vocal layers, hook bar emphasis",
  ],
  rnb: [
    "breathy female lead vocal, smooth run embellishments, stacked chorus harmonies",
    "silky male R&B vocal, falsetto lift moments, warm doubles on hook",
  ],
  afro_latin: [
    "male afro vocal hooks, call-and-response chants, percussive phrasing",
    "latin male lead vocal, melodic spanish cadence, club ad-lib space",
  ],
  electronic_pop: [
    "bright female pop lead, stacked hook harmonies, clean vocal chain",
    "catchy female topline, glossy doubles, short earworm phrase repeats",
  ],
  rock: [
    "raw male rock vocal, shouted chorus lift, live room energy",
    "powerful female rock lead, gritty belt chorus, gang vocal stack",
  ],
  jazz_classical: [
    "smoky jazz vocal, soft vibrato, intimate mic proximity",
    "operatic lead vocal space, dramatic dynamic swells, classical projection",
  ],
  world: [
    "melismatic world vocal, ornamental phrasing, regional accent color",
    "passionate folk lead vocal, narrative phrasing, acoustic room tone",
  ],
  cinematic: [
    "cinematic vocal lead, epic choir support, trailer-scale dynamics",
    "ethereal film vocal, long reverb tail, orchestral bed blend",
  ],
  dnb: [
    "ethereal dnb vocal, breathy top line, breakbeat syncopation",
    "ragga-style vocal chops, MC energy, sub-heavy drop alignment",
  ],
  electronic_club: [
    "club female vocal, sidechain duck space, hook repeat structure",
    "trance vocal lead, long sustained notes, build-to-drop alignment",
  ],
  lab: [
    "processed experimental vocal, glitch chop space, hyper-modern sheen",
    "futuristic R&B vocal, formant-shift texture, holographic reverb",
  ],
  default: [
    "expressive lead vocal, memorable chorus hook, stacked harmonies",
    "emotional vocal delivery, hook-forward arrangement, polished chain",
  ],
};

export function resolveThemeGroup(group: string | undefined): ThemeGroup {
  const g = (group ?? "").toLowerCase();
  if (g.includes("trap") || g.includes("hip-hop")) return "trap";
  if (g.includes("r&b") || g.includes("soul")) return "rnb";
  if (g.includes("afro") || g.includes("latin") || g.includes("island")) return "afro_latin";
  if (g.includes("electronic / pop") || g === "electronic / pop") return "electronic_pop";
  if (g.includes("rock")) return "rock";
  if (g.includes("jazz") || g.includes("classical") || g.includes("opera")) return "jazz_classical";
  if (g.includes("world") || g.includes("regional") || g.includes("oriental")) return "world";
  if (g.includes("cinematic") || g.includes("score") || g.includes("film")) return "cinematic";
  if (g.includes("dnb") || g.includes("breaks")) return "dnb";
  if (g.includes("electronic / club") || g.includes("club")) return "electronic_club";
  if (g.includes("lab") || g.includes("futur")) return "lab";
  return "default";
}

export function pickGenreDiceNarrative(group: ThemeGroup, mode: PromptMode, variant: number): string {
  const pool = mode === "song" ? SONG_NARRATIVE[group] : BEAT_NARRATIVE[group];
  return pool[variant % pool.length] ?? pool[0] ?? "";
}

export function pickGenreDiceVocal(group: ThemeGroup, variant: number): string {
  const pool = SONG_VOCAL[group];
  return pool[variant % pool.length] ?? pool[0] ?? "";
}
