import type { DropdownOption } from "@/components/ui/Dropdown";

import type { AppLocale } from "@/i18n/config";
export type BeatInfluenceEntry = {
  value: string;
  groupEn: string;
  groupFr: string;
  acePrompt: string;
};

export const BEAT_INFLUENCE_CATALOG: BeatInfluenceEntry[] = [
  { value: "No Influence", groupEn: "None", groupFr: "Aucune", acePrompt: "" },

  // Modern Trap
  {
    value: "Metro Boomin",
    groupEn: "Modern Trap",
    groupFr: "Trap moderne",
    acePrompt:
      "dark cinematic trap, eerie pad layers, minor-key bell or string motifs, clean hard-hitting drums, tight arrangement, modern bounce, strong drop transitions",
  },
  {
    value: "Southside",
    groupEn: "Modern Trap",
    groupFr: "Trap moderne",
    acePrompt:
      "hard dark trap, relentless drum pressure, heavy 808 slides, minimal ominous melody, aggressive pocket, street club energy",
  },
  {
    value: "Wheezy",
    groupEn: "Modern Trap",
    groupFr: "Trap moderne",
    acePrompt:
      "spacey melodic trap, airy pad wash, bouncing triplet hi-hats, clean 808 glides, simple emotional topline space, Atlanta swing",
  },
  {
    value: "Tay Keith",
    groupEn: "Modern Trap",
    groupFr: "Trap moderne",
    acePrompt:
      "hard-hitting Memphis-style drums, loud punchy kick and snare, minimal melody, aggressive forward energy, heavy 808 impact",
  },
  {
    value: "Murda Beatz",
    groupEn: "Modern Trap",
    groupFr: "Trap moderne",
    acePrompt:
      "bouncy modern trap, catchy melodic hook motif, clean punchy drums, easy-to-rap pocket, bright ear-candy transitions",
  },
  {
    value: "Mike Will Made-It",
    groupEn: "Modern Trap",
    groupFr: "Trap moderne",
    acePrompt:
      "anthemic trap hip-hop, big drum impact, simple memorable synth motif, strong low-end, clean modern radio mix",
  },
  {
    value: "London on da Track",
    groupEn: "Modern Trap",
    groupFr: "Trap moderne",
    acePrompt:
      "Atlanta trap bounce, layered claps and snares, catchy minor-key motif, crisp hat rolls, club-ready energy, polished low-end",
  },
  {
    value: "Pierre Bourne",
    groupEn: "Modern Trap",
    groupFr: "Trap moderne",
    acePrompt:
      "dreamy melodic trap, arpeggiated bell or key motif, soft 808 tone, floating atmosphere, psychedelic ear candy, spacey mix",
  },
  {
    value: "Nick Mira",
    groupEn: "Modern Trap",
    groupFr: "Trap moderne",
    acePrompt:
      "emotional guitar-driven trap, nostalgic melodic loop, crisp trap drums, warm saturation, internet-era melodic rap pocket",
  },
  {
    value: "Cubeatz",
    groupEn: "Modern Trap",
    groupFr: "Trap moderne",
    acePrompt:
      "cinematic trap orchestra hybrid, wide string or brass stabs, hard 808 foundation, dramatic build energy, premium polish",
  },
  {
    value: "Cardo",
    groupEn: "Modern Trap",
    groupFr: "Trap moderne",
    acePrompt:
      "warm sample-flip trap, soulful chopped loop texture, laid-back swing drums, deep 808, smoked-out late-night groove",
  },
  {
    value: "Ronny J",
    groupEn: "Modern Trap",
    groupFr: "Trap moderne",
    acePrompt:
      "distorted rage-trap texture, blown-out 808 saturation, chaotic hi-hat bursts, punk-trap aggression, raw energy",
  },
  {
    value: "Kenny Beats",
    groupEn: "Modern Trap",
    groupFr: "Trap moderne",
    acePrompt:
      "genre-blending hip-hop, punchy drums with experimental layers, catchy but weird motifs, competitive energy, tight mix",
  },

  // Hip-Hop / Samples
  {
    value: "Hit-Boy",
    groupEn: "Hip-Hop / Samples",
    groupFr: "Hip-Hop / Samples",
    acePrompt:
      "modern hip-hop, crisp drums, soulful but contemporary keys or samples, big chorus energy, strong bass, premium mix",
  },
  {
    value: "Boi-1da",
    groupEn: "Hip-Hop / Samples",
    groupFr: "Hip-Hop / Samples",
    acePrompt:
      "hip-hop R&B crossover, tasteful drums, clean bounce, restrained melody, polished mix, catchy minimal groove",
  },
  {
    value: "The Alchemist",
    groupEn: "Hip-Hop / Samples",
    groupFr: "Hip-Hop / Samples",
    acePrompt:
      "dark dusty sample hip-hop, gritty loop texture, chopped soul or jazz fragments, minimal drums, raw underground swing",
  },
  {
    value: "DJ Premier",
    groupEn: "Hip-Hop / Samples",
    groupFr: "Hip-Hop / Samples",
    acePrompt:
      "boom bap classic, hard snare crack, MPC swing, scratched vinyl texture, chopped jazz or soul samples, east coast feel",
  },
  {
    value: "Just Blaze",
    groupEn: "Hip-Hop / Samples",
    groupFr: "Hip-Hop / Samples",
    acePrompt:
      "big soulful sample hip-hop, energetic boom bap drums, stadium-ready stabs, dramatic arrangement lifts",
  },
  {
    value: "Pete Rock",
    groupEn: "Hip-Hop / Samples",
    groupFr: "Hip-Hop / Samples",
    acePrompt:
      "jazzy boom bap, warm Rhodes chords, dusty sample loops, laid-back swing, smooth bass, classic golden-era tone",
  },

  // R&B / Pop
  {
    value: "Timbaland",
    groupEn: "R&B / Pop",
    groupFr: "R&B / Pop",
    acePrompt:
      "percussive rhythmic complexity, syncopated drum programming, quirky swing, futuristic R&B textures, punchy minimal bass",
  },
  {
    value: "Pharrell",
    groupEn: "R&B / Pop",
    groupFr: "R&B / Pop",
    acePrompt:
      "minimal infectious groove, clean dry drums, funky syncopation, bright chord stabs, playful melodic motif, punchy mix",
  },
  {
    value: "Dr. Dre",
    groupEn: "R&B / Pop",
    groupFr: "R&B / Pop",
    acePrompt:
      "west coast hip-hop, tight live-feel drums, funky bassline, clean synth leads, cinematic arrangement, punchy mix",
  },
  {
    value: "Darkchild",
    groupEn: "R&B / Pop",
    groupFr: "R&B / Pop",
    acePrompt:
      "late 90s 2000s R&B, thick drum programming, stuttered rhythms, lush chord stacks, big hook arrangement, glossy mix",
  },
  {
    value: "Rodney Jerkins",
    groupEn: "R&B / Pop",
    groupFr: "R&B / Pop",
    acePrompt:
      "90s 2000s R&B pop, polished drums, big chord progressions, clean bass, hook-forward radio arrangement",
  },
  {
    value: "Kaytranada",
    groupEn: "R&B / Pop",
    groupFr: "R&B / Pop",
    acePrompt:
      "housey R&B groove, swung drums, funky bass line, warm chord voicings, tasteful percussion, clean vibey mix",
  },
  {
    value: "OG Parker",
    groupEn: "R&B / Pop",
    groupFr: "R&B / Pop",
    acePrompt:
      "melodic trapsoul R&B, smooth emotional chord progressions, airy pad layers, clean modern drums, late-night intimacy",
  },
  {
    value: "40",
    groupEn: "R&B / Pop",
    groupFr: "R&B / Pop",
    acePrompt:
      "moody minimal R&B rap, deep sub foundation, sparse drums, airy pads, wide nocturnal space, emotional ambience",
  },
  {
    value: "Kanye West (808s era)",
    groupEn: "R&B / Pop",
    groupFr: "R&B / Pop",
    acePrompt:
      "808s-era emotional hip-hop, minimal drum programming, cold synth palette, autotune-friendly melody space, big 808 tone, dramatic ambience",
  },
  {
    value: "Tainy",
    groupEn: "R&B / Pop",
    groupFr: "R&B / Pop",
    acePrompt:
      "modern Latin pop trap, dembow-influenced bounce, glossy synth leads, reggaeton-trap hybrid drums, global radio polish",
  },
  {
    value: "BNYX",
    groupEn: "R&B / Pop",
    groupFr: "R&B / Pop",
    acePrompt:
      "minimal R&B trap, sparse percussion, deep sub glide, airy keys, Toronto nocturnal mood, space for vocal performance",
  },

  // EDM / Dance Mainstage
  {
    value: "David Guetta",
    groupEn: "EDM / Mainstage",
    groupFr: "EDM / Mainstage",
    acePrompt:
      "festival mainstage house, punchy four-on-the-floor kick, supersaw chord stacks, sidechain pump groove, anthemic build-drop arc, hands-up euphoria, radio-ready polish",
  },
  {
    value: "DJ Snake",
    groupEn: "EDM / Mainstage",
    groupFr: "EDM / Mainstage",
    acePrompt:
      "hybrid trap-EDM crossover, gritty reese bass, crisp snare-clap, halftime-to-drop switch, Middle Eastern melodic motifs, festival impact, tight sidechain",
  },
  {
    value: "Martin Garrix",
    groupEn: "EDM / Mainstage",
    groupFr: "EDM / Mainstage",
    acePrompt:
      "big-room progressive energy, supersaw lead melody, uplifting chord lift, punchy kick, emotional festival build-drop, wide stereo euphoria",
  },
  {
    value: "Tiësto",
    groupEn: "EDM / Mainstage",
    groupFr: "EDM / Mainstage",
    acePrompt:
      "modern festival trance-house, driving four-on-the-floor, bright pluck or supersaw topline, long build tension, peak-time drop release",
  },
  {
    value: "Calvin Harris",
    groupEn: "EDM / Mainstage",
    groupFr: "EDM / Mainstage",
    acePrompt:
      "commercial dance-pop, bright hooky synths, four-on-the-floor groove, polished summer energy, radio arrangement, clean punchy mix",
  },
  {
    value: "Fred again..",
    groupEn: "EDM / Mainstage",
    groupFr: "EDM / Mainstage",
    acePrompt:
      "UK garage-influenced house, chopped soulful vocal samples, swung shuffle drums, warm analog texture, intimate club human feel",
  },
  {
    value: "Disclosure",
    groupEn: "EDM / Mainstage",
    groupFr: "EDM / Mainstage",
    acePrompt:
      "UK garage house, shuffle hi-hats, warm bass groove, soulful chord stabs, pitched vocal chops, clean modern mix",
  },
  {
    value: "Skrillex",
    groupEn: "EDM / Mainstage",
    groupFr: "EDM / Mainstage",
    acePrompt:
      "aggressive bass music, sharp transient design, distorted synth bass, half-time to double-time switch, high-impact drops, cybernetic texture",
  },
  {
    value: "Marshmello",
    groupEn: "EDM / Mainstage",
    groupFr: "EDM / Mainstage",
    acePrompt:
      "melodic future bass EDM, bright supersaw chords, sidechain pump, catchy topline hook, festival drop lift, clean commercial mix",
  },
  {
    value: "Zedd",
    groupEn: "EDM / Mainstage",
    groupFr: "EDM / Mainstage",
    acePrompt:
      "precision electro-house, tight four-on-the-floor, bright arpeggiated synths, classical-influenced chord lift, crisp high-end, pop crossover polish",
  },
  {
    value: "Major Lazer",
    groupEn: "EDM / Mainstage",
    groupFr: "EDM / Mainstage",
    acePrompt:
      "global bass dancehall-EDM fusion, tropical percussion layers, dembow-influenced bounce, catchy horn or synth stabs, party energy",
  },

  // UK / Afro
  {
    value: "P2J",
    groupEn: "UK / Afro",
    groupFr: "UK / Afro",
    acePrompt:
      "UK afrobeats afroswing, melodic guitar riffs, clean percussion, warm bounce, smooth modern mix, catchy hooks",
  },
  {
    value: "JAE5",
    groupEn: "UK / Afro",
    groupFr: "UK / Afro",
    acePrompt:
      "afroswing UK groove, rhythmic guitar patterns, bouncy drums, melodic hooks, modern London dance feel",
  },
  {
    value: "Rexxie",
    groupEn: "UK / Afro",
    groupFr: "UK / Afro",
    acePrompt:
      "Nigerian afrobeats, percussive talking-drum layers, log-drum sub bounce, bright guitar motifs, high-energy dance groove",
  },
  {
    value: "Tempoe",
    groupEn: "UK / Afro",
    groupFr: "UK / Afro",
    acePrompt:
      "modern afrobeats pop, smooth chord stacks, crisp percussion grid, melodic ear-candy, Afropop radio polish",
  },
  {
    value: "Skepta (Grime)",
    groupEn: "UK / Afro",
    groupFr: "UK / Afro",
    acePrompt:
      "UK grime instrumental, sparse dark synth motif, sub-heavy 808, minimal cold drums, icy London street tension",
  },

  // France / Belgique — beatmakers & producteurs reconnus (SEO type beat FR)
  {
    value: "Skread",
    groupEn: "France / Belgium",
    groupFr: "France / Belgique",
    acePrompt:
      "French trap instrumental, icy minor synth stabs, hard sliding 808, cold cinematic tension, Paris street energy, crisp hat rolls, dark melodic hook space",
  },
  {
    value: "Kore",
    groupEn: "France / Belgium",
    groupFr: "France / Belgique",
    acePrompt:
      "French melodic trap, sunny catchy topline motif, bouncy 808 groove, polished radio bounce, summer Marseille energy, clean modern mix",
  },
  {
    value: "DJ Weedim",
    groupEn: "France / Belgium",
    groupFr: "France / Belgique",
    acePrompt:
      "French cloud trap, airy pad wash, soft 808 tone, dreamy melodic loop, YouTube-era beatmaker polish, emotional rap pocket",
  },
  {
    value: "Nyda",
    groupEn: "France / Belgium",
    groupFr: "France / Belgique",
    acePrompt:
      "French pop-trap, dembow-influenced bounce, glossy synth plucks, catchy radio hook space, Afropop crossover polish, danceable groove",
  },
  {
    value: "Hazey",
    groupEn: "France / Belgium",
    groupFr: "France / Belgique",
    acePrompt:
      "modern French trap, dark minor chords, hard 808 impact, aggressive hat patterns, street club bounce, cold nocturnal mood",
  },
  {
    value: "Bazzazian",
    groupEn: "France / Belgium",
    groupFr: "France / Belgique",
    acePrompt:
      "French-Belgian melodic trap, emotional chord stacks, smooth 808 glide, intimate late-night R&B crossover, polished ear candy",
  },
  {
    value: "Myth Syzer",
    groupEn: "France / Belgium",
    groupFr: "France / Belgique",
    acePrompt:
      "French cloud rap instrumental, hazy atmospheric pads, soft percussion, floating melodic motif, smoked-out introspective groove",
  },
  {
    value: "Stwo",
    groupEn: "France / Belgium",
    groupFr: "France / Belgique",
    acePrompt:
      "French R&B instrumental, silky chord voicings, minimal drum programming, warm sub bass, sensual nocturnal ambience, vocal-forward space",
  },
  {
    value: "Mani Deïz",
    groupEn: "France / Belgium",
    groupFr: "France / Belgique",
    acePrompt:
      "French boom bap soul, dusty sample texture, swung MPC drums, warm Rhodes chords, golden-era hip-hop swing, lyrical pocket",
  },
  {
    value: "Ghost Killer Track",
    groupEn: "France / Belgium",
    groupFr: "France / Belgique",
    acePrompt:
      "hard French trap, distorted 808 saturation, menacing synth motif, aggressive drum pressure, dark street energy, punchy mix",
  },
  {
    value: "Le Motif",
    groupEn: "France / Belgium",
    groupFr: "France / Belgique",
    acePrompt:
      "French drill instrumental, cold eerie piano or bell motif, sliding sub bass, sparse hard drums, icy tension, 140 BPM pocket",
  },
  {
    value: "20syl",
    groupEn: "France / Belgium",
    groupFr: "France / Belgique",
    acePrompt:
      "French sample-chop hip-hop, precise loop edits, funky bass groove, crisp syncopated drums, C2C-style musicality, vinyl warmth",
  },
  {
    value: "DJ Mehdi",
    groupEn: "France / Belgium",
    groupFr: "France / Belgique",
    acePrompt:
      "French touch hip-hop electro, funky filtered disco samples, punchy electronic drums, warm analog synth stabs, Paris club heritage energy",
  },
  {
    value: "Seebu",
    groupEn: "France / Belgium",
    groupFr: "France / Belgique",
    acePrompt:
      "French street trap, dark melodic motif, hard 808 foundation, bouncy hat rolls, aggressive but catchy hook space, modern Paris rap energy",
  },
  {
    value: "Katel",
    groupEn: "France / Belgium",
    groupFr: "France / Belgique",
    acePrompt:
      "French drill, sinister synth layers, sub-heavy 808 slides, minimal cold drums, cinematic street tension, 140-142 BPM groove",
  },
  {
    value: "Chrystal",
    groupEn: "France / Belgium",
    groupFr: "France / Belgique",
    acePrompt:
      "French pop-rap instrumental, bright catchy synth motif, clean four-on-the-floor bounce, radio-ready arrangement, summer festival energy",
  },

  // US Classics & modern icons
  {
    value: "Wondagurl",
    groupEn: "US Producers",
    groupFr: "Producteurs US",
    acePrompt:
      "dark minimal trap, eerie bell or key motif, hard 808 slides, sparse drums, Travis Scott-era space, cinematic tension",
  },
  {
    value: "DJ Mustard",
    groupEn: "US Producers",
    groupFr: "Producteurs US",
    acePrompt:
      "West Coast ratchet bounce, clap-heavy drums, catchy synth lead, club-ready pocket, DJ Mustard signature snap groove",
  },
  {
    value: "Zaytoven",
    groupEn: "US Producers",
    groupFr: "Producteurs US",
    acePrompt:
      "Atlanta piano trap, bright melodic keys, bouncy 808 pattern, playful ear candy, Zaytoven swing, street gospel energy",
  },
  {
    value: "Lex Luger",
    groupEn: "US Producers",
    groupFr: "Producteurs US",
    acePrompt:
      "classic trap brass stabs, hard 808 rolls, anthemic minor-key motif, aggressive hat bursts, early Atlanta trap energy",
  },
  {
    value: "J Dilla",
    groupEn: "US Producers",
    groupFr: "Producteurs US",
    acePrompt:
      "Dilla swing boom bap, off-grid drum feel, warm soul sample chop, dusty vinyl texture, human groove, golden-era hip-hop soul",
  },
  {
    value: "Mike Dean",
    groupEn: "US Producers",
    groupFr: "Producteurs US",
    acePrompt:
      "cinematic synth hip-hop, wide analog pad layers, hard-hitting drums, psychedelic ear candy, Travis-era space, premium mix width",
  },
  {
    value: "OZ",
    groupEn: "US Producers",
    groupFr: "Producteurs US",
    acePrompt:
      "Toronto dark trap, cold minor motif, deep sub glide, sparse hard drums, moody nocturnal ambience, Drake-era pocket",
  },
  {
    value: "Vinylz",
    groupEn: "US Producers",
    groupFr: "Producteurs US",
    acePrompt:
      "modern hip-hop trap soul, polished drum programming, catchy melodic hook, clean 808 tone, radio-ready bounce",
  },
  {
    value: "TM88",
    groupEn: "US Producers",
    groupFr: "Producteurs US",
    acePrompt:
      "dark rage trap, blown-out 808 distortion, chaotic hi-hat bursts, minimal eerie melody, aggressive punk-trap energy",
  },
  {
    value: "Sonny Digital",
    groupEn: "US Producers",
    groupFr: "Producteurs US",
    acePrompt:
      "hard trap bounce, loud drum impact, catchy synth stab motif, club-ready energy, Atlanta street aggression",
  },
  {
    value: "Scott Storch",
    groupEn: "US Producers",
    groupFr: "Producteurs US",
    acePrompt:
      "luxury hip-hop, orchestral stabs, dramatic chord lifts, crisp drums, Scott Storch signature epic bounce, 2000s premium polish",
  },
  {
    value: "Mannie Fresh",
    groupEn: "US Producers",
    groupFr: "Producteurs US",
    acePrompt:
      "New Orleans bounce hip-hop, syncopated drum pattern, funky bass groove, call-and-response energy, Southern club bounce",
  },
  {
    value: "Swizz Beatz",
    groupEn: "US Producers",
    groupFr: "Producteurs US",
    acePrompt:
      "hard East Coast hip-hop, aggressive drum stabs, bold synth riffs, anthemic energy, punchy minimal arrangement",
  },
  {
    value: "T-Minus",
    groupEn: "US Producers",
    groupFr: "Producteurs US",
    acePrompt:
      "cinematic hip-hop trap, dramatic string or brass layers, hard 808 foundation, emotional build energy, premium polish",
  },
  {
    value: "Frank Dukes",
    groupEn: "US Producers",
    groupFr: "Producteurs US",
    acePrompt:
      "sample-flip hip-hop, warm chopped loop texture, crisp modern drums, soulful nostalgia, tasteful arrangement lifts",
  },

  // Latin & Caribbean
  {
    value: "Sky Rompiendo",
    groupEn: "Latin / Caribbean",
    groupFr: "Latin / Caraïbes",
    acePrompt:
      "reggaeton trap hybrid, dembow percussion grid, glossy synth leads, Latin pop radio polish, summer dance energy",
  },
  {
    value: "Lunay",
    groupEn: "Latin / Caribbean",
    groupFr: "Latin / Caraïbes",
    acePrompt:
      "modern reggaeton, dembow bounce, melodic guitar or synth motif, warm sub bass, Puerto Rican club energy",
  },
  {
    value: "Rvssian",
    groupEn: "Latin / Caribbean",
    groupFr: "Latin / Caraïbes",
    acePrompt:
      "dancehall reggae fusion, offbeat skank groove, heavy sub bass, catchy horn or synth stabs, Caribbean party bounce",
  },
  {
    value: "El Guincho",
    groupEn: "Latin / Caribbean",
    groupFr: "Latin / Caraïbes",
    acePrompt:
      "experimental Latin electronic, chopped vocal textures, tropical percussion layers, avant-pop groove, Barcelona-global fusion",
  },

  // UK producers
  {
    value: "M1OnTheBeat",
    groupEn: "UK Producers",
    groupFr: "Producteurs UK",
    acePrompt:
      "UK drill instrumental, cold piano or bell motif, sliding 808 bass, sparse hard drums, 140 BPM icy tension",
  },
  {
    value: "Nineteen85",
    groupEn: "UK Producers",
    groupFr: "Producteurs UK",
    acePrompt:
      "Toronto OVO-style R&B trap, moody minor chords, deep sub glide, minimal drums, nocturnal emotional ambience",
  },
  {
    value: "A808",
    groupEn: "UK Producers",
    groupFr: "Producteurs UK",
    acePrompt:
      "UK drill, eerie synth layers, hard 808 slides, tight percussion, dark street energy, 142 BPM pocket",
  },

  // Africa
  {
    value: "Sarz",
    groupEn: "Africa",
    groupFr: "Afrique",
    acePrompt:
      "Nigerian afrobeats, percussive talking-drum layers, log-drum sub bounce, bright guitar motifs, Afropop dance groove",
  },
  {
    value: "Spyro",
    groupEn: "Africa",
    groupFr: "Afrique",
    acePrompt:
      "Nigerian afrobeats pop, crisp percussion grid, catchy melodic hook, warm chord stacks, high-energy dancefloor bounce",
  },
  {
    value: "Young John",
    groupEn: "Africa",
    groupFr: "Afrique",
    acePrompt:
      "afrobeats street bounce, percussive drum layers, catchy synth or guitar riff, log-drum foundation, Lagos club energy",
  },

  // Global electronic
  {
    value: "Flume",
    groupEn: "Global Electronic",
    groupFr: "Électro mondiale",
    acePrompt:
      "future bass electronic, chopped vocal texture, wide synth chords, intricate percussion, emotional drop lift, Australian experimental polish",
  },
  {
    value: "Diplo",
    groupEn: "Global Electronic",
    groupFr: "Électro mondiale",
    acePrompt:
      "global bass club fusion, tropical percussion, catchy horn or synth stabs, festival bounce, cross-genre party energy",
  },
  {
    value: "Axwell",
    groupEn: "Global Electronic",
    groupFr: "Électro mondiale",
    acePrompt:
      "progressive house anthem, supersaw chord stacks, driving four-on-the-floor, emotional build-drop arc, festival mainstage energy",
  },
];

export function buildBeatInfluenceMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const entry of BEAT_INFLUENCE_CATALOG) {
    map[entry.value] = entry.acePrompt;
  }
  return map;
}

/** Nom producteur affichable sur les cartes (null si « No Influence » ou vide). */
export function displayProducerInfluence(influence?: string | null): string | null {
  const value = (influence ?? "").trim();
  if (!value || value === "No Influence") return null;
  return value;
}

export function beatInfluenceDropdownOptions(locale: AppLocale): DropdownOption[] {
  const fr = locale === "fr";
  return BEAT_INFLUENCE_CATALOG.filter((entry) => entry.value !== "No Influence").map((entry) => ({
    value: entry.value,
    label: entry.value,
    group: fr ? entry.groupFr : entry.groupEn,
  })).concat([
    {
      value: "No Influence",
      label: fr ? "Aucune influence" : "No Influence",
      group: fr ? "Aucune" : "None",
    },
  ]);
}
