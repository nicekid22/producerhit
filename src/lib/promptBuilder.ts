export type GenerateParams = {
  genre: string;
  influence: string;
  key: string;
  scale: string;
  bpm: number;
  loopLengthBars: number;
  swing?: number;
  mood: string;
  energyLevel: string;
  reverb: string;
  prompt?: string;
};

const sonautoValidTags = new Set([
  "trap",
  "hip-hop/rap",
  "r&b/soul",
  "soul",
  "lo-fi",
  "house",
  "dance",
  "african",
  "latin",
  "melancholic",
  "dark",
  "aggressive",
  "smooth",
  "atmospheric",
  "rhythmic",
  "energetic",
  "melodic",
  "instrumental",
  "1990s",
  "2000s",
  "2010s",
  "2020s",
]);

const genreMap: Record<string, string> = {
  Trapsoul:
    "modern trapsoul R&B, emotional minor chords, dark atmospheric pads, smooth 808 bass, Bryson Tiller vibe",
  "Dark Trap":
    "dark hip hop rap trap, modern atlanta drum programming, sinister minor-key motif (piano/bells), heavy 808 glides, menacing cinematic atmosphere",
  "Melodic Trap":
    "melodic trap / pain rap (NBA YoungBoy atlanta hip hop rap type), emotional minor-key piano or guitar topline, airy pads, modern atlanta drums, crisp hats, punchy hard 808 glides",
  "Old School Hip-Hop":
    "old-school hip-hop / boom bap, sample-based chopped soul or jazz loop, dusty drums, MPC swing, vinyl texture, subtle scratches",
  Drill: "authentic drill music, sliding 808s, dark aggressive melody, fast hi-hat patterns",
  "UK Drill":
    "UK drill, dark sliding chromatic melody, cold London atmosphere, sliding 808 bass, aggressive street vibe",
  "NY Drill": "NY drill, aggressive dark melody, Brooklyn sound, heavy bass slides, high energy",
  "90s R&B": "classic 90s R&B, soulful melody, smooth groove, swing rhythm, New Jack Swing influence",
  "Neo Soul": "neo soul, organic instruments, soulful chords, jazzy Rhodes, laid-back D'Angelo feel",
  "Contemporary R&B": "modern R&B, polished production, lush chords and textures, 2024 radio-ready sound",
  "Lo-fi R&B": "lo-fi R&B, warm tape hiss, dusty samples, chill atmospheric chords, relaxed groove",
  Afrobeats:
    "modern afrobeats, infectious rhythmic guitar, warm percussion, West African uplifting groove, danceable vibe",
  Amapiano: "authentic amapiano, heavy log drum bass, South African deep house vibe, rhythmic shaker patterns, jazzy piano chords",
  Reggaeton: "reggaeton, dembow drum pattern, Latin urban melody, perreo energy, heavy bass",
  "Latin Trap": "Latin trap, Spanish urban vibe, melodic trap with reggaeton flavor",
  "Jersey Club":
    "Jersey club / Baltimore club, fast bouncy kick pattern, bed squeak, chopped vocal stabs, high energy club bounce",
  Pop: "modern pop production, catchy synth melody, radio-ready polished sound, upbeat commercial energy",
  "UK Garage": "UK garage, 2-step rhythm, swingy syncopated drums, soulful vocal chops, bouncy bassline",
  "Hyperpop": "hyperpop, glitchy synths, high energy, distorted bass, futuristic pop production",
  "Baile Funk": "baile funk, Brazilian funk rhythm, heavy percussion, Rio de Janeiro street energy",
  Afrotrap: "afrotrap, afrobeat percussion with heavy trap 808s, high energy, infectious percussive rhythm, talking drum, uplifting West African melody, danceable groove, warm bass guitar, Burna Boy Wizkid style energy",
  Dancehall: "dancehall, Jamaican dancehall riddim, rhythmic island groove, heavy sub bass, club party energy, Caribbean bounce, modern drum sound, heavy bass, club energy",
};

const influenceMap: Record<string, string> = {
  Southside: "Southside production style, hard dark trap beats, heavy 808 slides",
  "OG Parker": "OG Parker style, melodic trapsoul, smooth emotional chords",
  "Tay Keith": "Tay Keith style, hard hitting drums, aggressive melodic trap",
  "Metro Boomin": "Metro Boomin style, dark atmospheric trap, cinematic melodies",
  "Murda Beatz": "Murda Beatz style, dancehall influenced trap, melodic hooks",
  Timbaland: "Timbaland production, rhythmic complexity, futuristic R&B sounds",
  Darkchild: "Darkchild style, classic R&B production, lush chords, soulful",
  "Rodney Jerkins": "Rodney Jerkins style, 90s 2000s R&B, polished production",
  P2J: "P2J style, UK Afrobeats, melodic smooth production",
  JAE5: "JAE5 style, Afroswing, London sound, melodic hooks",
  "Kanye West 808s": "Kanye West 808s Heartbreak era, auto-tune melody, emotional minimalist",
  "Kanye West (808s era)": "Kanye West 808s Heartbreak era, auto-tune melody, emotional minimalist",
  "Just Blaze": "Just Blaze style, soulful samples, boom bap energy, classic hip hop",
  "Pete Rock": "Pete Rock style, jazz influenced boom bap, dusty samples, classic",
  "No Influence": "",
};

const moodMap: Record<string, string> = {
  Dark: "dark brooding atmosphere, minor tonality, tense",
  Melancholic: "melancholic emotional, sad beauty, longing feeling",
  Euphoric: "euphoric uplifting, triumphant, emotional highs",
  Aggressive: "aggressive intense, high energy, powerful",
  Smooth: "smooth silky, relaxed groove, effortless flow",
  Dreamy: "dreamy atmospheric, ethereal, floating sensation",
  Hypnotic: "hypnotic repetitive, trance-like, mesmerizing",
  Chill: "chill relaxed mood, laid-back feel, easy groove",
  Happy: "happy uplifting mood, bright feel, positive vibe",
  Sad: "sad melancholic mood, emotional feel, vulnerable",
  Romantic: "romantic intimate mood, sensual feel, warm",
  Confident: "confident bold mood, swagger, self-assured",
  Nostalgic: "nostalgic warm mood, bittersweet, throwback",
  Hype: "hype energetic mood, high excitement, crowd-ready",
};

const energyMap: Record<string, string> = {
  Chill: "relaxed laid-back vibe, smooth easy flow, no rush",
  Happy: "uplifting joyful energy, bright melodic feel, positive vibes",
  Sad: "sad emotional depth, vulnerable feel, raw emotion",
  Romantic: "romantic intimate atmosphere, sensual smooth vibe, love energy",
  Aggressive: "aggressive hard-hitting energy, intense powerful, street edge",
  Confident: "confident bold swagger, self-assured groove, effortless cool",
  Nostalgic: "nostalgic warm feeling, throwback emotion, bittersweet memory",
  Hype: "high energy hype, club ready, adrenaline rush, crowd energy",
};

const reverbMap: Record<string, string> = {
  Dry: "dry close sound, minimal reverb",
  Subtle: "subtle room reverb, slight space",
  Medium: "medium reverb, warm spatial feel",
  Heavy: "heavy reverb, washed out, dreamy space",
};

function clean(s: string) {
  return s
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/,\s*,/g, ", ")
    .replace(/\s+\./g, ".")
    .replace(/,\s*$/g, "")
    .trim();
}

export function buildRichPrompt(params: GenerateParams, isSong: boolean = false) {
  const songGenreMap: Record<string, string> = {
    Trapsoul: "modern trapsoul R&B, emotional chords, smooth 808 bass, atmospheric pads",
    "Dark Trap": "dark trap, sinister minor-key motif, hard 808s, crisp modern drums, cinematic atmosphere",
    "Melodic Trap": "melodic trap, emotional piano or guitar motif, airy pads, modern atlanta drums, punchy 808 slides",
    "Old School Hip-Hop": "old-school hip-hop / boom bap, sample-based chopped loop, dusty drums, MPC swing, vinyl texture",
    Drill: "drill, dark aggressive melody, sliding 808s, modern percussion",
    "UK Drill": "UK drill, cold dark atmosphere, sliding 808 bass, aggressive energy",
    "NY Drill": "NY drill, dark aggressive melody, heavy bass slides, high energy",
    Afrobeats: "modern afrobeats, uplifting groove, rhythmic percussion, melodic guitar",
    Amapiano: "amapiano, rolling log drum bass, jazzy piano chords, shaker groove, deep house influence",
    Reggaeton: "reggaeton, dembow rhythm, Latin urban melody, perreo energy, heavy bass",
    "Latin Trap": "latin trap, spanish urban vibe, melodic trap drums, modern low end",
    "Jersey Club": "Jersey club, fast bouncy kick pattern, chopped vocal stabs, energetic club bounce",
    Pop: "modern pop, catchy topline, bright synths, radio-ready polished production",
    "UK Garage": "UK garage, 2-step rhythm, swingy syncopated drums, bouncy bassline, vocal chops",
    "Hyperpop": "hyperpop, glitchy synths, high energy, distorted bass, futuristic production",
    "Baile Funk": "baile funk, Brazilian funk rhythm, heavy percussion, energetic club groove",
    Afrotrap: "afrotrap, afro percussion bounce with trap drums and 808s, high energy, melodic motifs",
    Dancehall: "dancehall, Jamaican riddim groove, Caribbean bounce, heavy sub bass, modern drums",
  };

  const beatGenreMap: Record<string, string> = {
    Trapsoul:
      "A smooth, emotional trap soul instrumental built around a soft melodic piano loop with warm reverb. The 808 bass slides gently beneath atmospheric synth pads, while crisp hi-hats and a laid-back trap drum pattern create a dark romantic groove. The production is polished and cinematic, evoking late-night introspection.",
    "Dark Trap":
      "A menacing dark trap instrumental driven by a heavy distorted 808 sub bass that shakes the low end. A sinister minor key synth stab cuts through over aggressive layered snares and fast trap hi-hat patterns. The atmosphere is cold and cinematic, with dark pads building tension throughout. No vocals, pure instrumental.",
    "Melodic Trap":
      "A euphoric melodic trap instrumental centered around a bright, emotional synth lead melody layered over stacked atmospheric pads. The production features punchy trap drums with rolling hi-hats and a clean chord progression that builds energy. The sound is modern and uplifting, designed for melodic rap production",
    Drill:
      "An authentic Chicago USA drill instrumental featuring fast triplet hi-hat patterns over a deep sliding 808 bass. A dark minor key piano melody runs throughout, supported by crisp snare hits and a cold, aggressive drum pattern. The energy is intense and street-level, with a menacing low-end presence.",
    "UK Drill":
      "A cold UK drill instrumental built around a dark chromatic piano melody that slides through minor intervals. The heavy 808 bass hits hard on each drop while crisp snare hits and fast hi-hats maintain the aggressive London street energy. The production is minimal and threatening throughout.",
    "NY Drill":
      "A hard New York drill instrumental driven by an aggressive dark piano stab loop. Heavy 808 bass drops punctuate the beat while a punchy snare and sharp hi-hats maintain the high energy Brooklyn drill sound. The atmosphere is cold and unrelenting from start to finish. No vocals.",
    "90s R&B":
      "A classic 90s R&B instrumental built around warm Rhodes electric piano chords with a smooth bass guitar groove underneath. The drum pattern draws from New Jack Swing with a swinging rhythm section, creating a soulful and nostalgic production feel. The arrangement breathes and flows naturally throughout. No vocals.",
    "Neo Soul":
      "An organic neo soul instrumental featuring a live Rhodes electric piano with warm, jazz-influenced chord voicings. A warm upright bass provides the groove beneath brushed jazz drums playing with a laid-back feel. The texture is natural and earthy, evoking classic D'Angelo and Erykah Badu era production. No vocals.",
    "Contemporary R&B":
      "A polished modern R&B instrumental built around warm synth pad chords and a clean 808 bass. Crisp hi-hats and a melodic piano line run throughout the arrangement, supported by subtle atmospheric layers. The production is refined and radio-ready with a cinematic quality. No vocals.",
    "Lo-fi R&B":
      "A cozy lo-fi R&B instrumental with warm vinyl crackle texture running throughout. A dusty sampled drum loop provides the relaxed groove beneath mellow jazz piano chords and a soft bass. The bedroom production aesthetic creates a nostalgic and intimate atmosphere perfect for late night listening. No vocals.",
    Afrobeats:
      "A vibrant afrobeats instrumental driven by a percussion-heavy rhythm section featuring talking drum patterns, shakers, and congas. An uplifting melodic guitar line carries the main theme over a warm bass guitar groove. The energy is infectious and danceable throughout, drawing from West African musical traditions. No vocals.",
    Amapiano:
      "A deep South African amapiano instrumental anchored by a resonant log drum bassline that defines the low end. Jazzy piano chord stabs accent the groove while rhythmic shaker patterns and a deep house drum pattern create the characteristic amapiano bounce. The atmosphere is soulful and hypnotic. No vocals.",
    Reggaeton:
      "A modern reggaeton instrumental built on the classic dembow kick and snare pattern with a heavy sub bass underneath. A melodic synth line carries the main theme over the Latin urban rhythm section, creating high energy perfect for perreo. The production is polished and club-ready throughout.",
    "Latin Trap":
      "A Latin trap instrumental combining heavy 808 bass drops with a melodic synth lead over a trap drum pattern accented with Latin percussion. The sound merges street trap aggression with urban Latin flavor, creating a bilingual crossover energy throughout the arrangement.",
    "Jersey Club":
      "A high energy Jersey club instrumental running at fast 140 BPM with a bouncy four-on-the-floor kick pattern. Syncopated snare hits and a pitched vocal chop sample accent the groove while the rhythm maintains constant club bounce energy. The production is tight and relentless from start to finish.",
    Pop:
      "A polished modern pop instrumental built around a catchy synth lead melody over a punchy drum machine beat. A bright chord progression drives the arrangement forward with a commercial radio-ready sound. The production is clean and energetic, designed for maximum mainstream appeal. No vocals.",
    "UK Garage":
      "A classic UK garage instrumental featuring a 2-step swingy drum pattern with a deep bouncy bassline underneath. Pitched chord stabs accent the syncopated groove while the overall arrangement captures the authentic London underground sound. The energy swings naturally throughout with a soulful feel.",
    Hyperpop:
      "A chaotic hyperpop instrumental driven by glitchy distorted synth bass and pitched percussion hits. Rapid hi-hat patterns and hyper-compressed production elements create a futuristic digital soundscape with maximum energy. The arrangement is dense and unpredictable, drawing from PC Music aesthetics.",
    "Baile Funk":
      "A heavy Brazilian baile funk instrumental built around a Miami bass-influenced kick drum pattern. Fast percussive breaks and an aggressive synth riff drive the energy while the rhythm section captures the raw street power of Rio de Janeiro favela sound. The production is uncompromising and physical.",
    Afrotrap:
      "A fusion afrotrap instrumental combining afrobeats talking drum and shaker grooves with heavy trap 808 bass drops. A melodic West African-influenced synth lead carries the main theme while trap drums and African percussion create a high energy cross-cultural sound throughout.",
    Dancehall:
      "A rhythmic Jamaican dancehall instrumental built around a bouncy Caribbean riddim pattern with a heavy sub bass foundation. A melodic synth stab accents the groove while the island rhythm section creates authentic sound system energy throughout the arrangement.",
    "Old School Hip-Hop":
      "A classic boom bap instrumental built around chopped soul or jazz samples with warm vinyl texture. Dusty but punchy drums swing with an MPC-style groove, supported by a thick bassline and subtle scratches. Keep it raw and musical with tasteful sample flips. No vocals.",
    "Contemporary Rap":
      "A modern contemporary rap instrumental with hard punchy drums, clean sub/808 low end, and a minimal melodic motif that leaves space for an artist. Use crisp hi-hats, tight snare hits, and subtle ear-candy transitions for a radio-ready 2026 sound. No vocals.",
    Country:
      "A modern country instrumental built around bright acoustic guitar strumming and melodic lead guitar lines, with a warm bass and live-sounding drums. Add tasteful pedal steel or fiddle textures for emotion, keeping the groove steady and anthemic. No vocals.",
    House:
      "A modern house instrumental built on a steady four-on-the-floor kick with a groovy bassline and bright chord stabs. Add crisp hi-hats, subtle percussion, and uplifting synth layers for a club-ready feel with clean modern production. No vocals.",
  };

  const genre = (isSong ? songGenreMap[params.genre] : beatGenreMap[params.genre] ?? genreMap[params.genre]) ?? params.genre;
  const influence = influenceMap[params.influence] ?? params.influence;
  const mood = moodMap[params.mood] ?? params.mood;
  const energy = energyMap[params.energyLevel] ?? params.energyLevel;
  const reverb = reverbMap[params.reverb] ?? params.reverb;
  
  const fingerprintByGenre: Record<string, string> = {
    "90s R&B": "soulful chords, classic R&B groove",
    Trapsoul: "smooth 808s, atmospheric trap soul vibe",
    "Neo Soul": "jazzy chords, organic feel",
    Drill: "sliding 808s, dark drill energy",
    Afrobeats: "rhythmic percussion, uplifting afro groove",
    Amapiano: "authentic amapiano, heavy log drum, shaker patterns, deep South African house",
    "Dark Trap": "dark cinematic textures, minimal haunting motif, hard 808s with slides, crisp modern atlanta drums",
    "Melodic Trap": "emotional minor-key piano or guitar motif, airy pads, modern atlanta trap bounce, 808 glides, space for melodic flows",
    Reggaeton: "dembow rhythm, Latin urban vibe",
    Pop: "modern pop production, catchy synth melody, radio-ready polished sound",
    "UK Garage": "UK garage, 2-step rhythm, swingy syncopated drums, soulful vocal chops",
    "Hyperpop": "hyperpop, glitchy synths, high energy, distorted bass",
    "Baile Funk": "baile funk, Brazilian funk rhythm, heavy percussion",
    "Afrotrap": "afrotrap hybrid bounce, afro percussion layers with modern trap drums and heavy 808s",
    "Dancehall": "dancehall riddim groove, syncopated drums, skank-friendly pocket, heavy bass, club energy",
    "Jersey Club": "Jersey club bounce, rapid kick pattern, bed squeak, chopped vocal stabs, high energy",
  };
  const fingerprint = fingerprintByGenre[params.genre] ?? "";
  
  const swing = typeof params.swing === "number" && Number.isFinite(params.swing) ? Math.max(0, Math.min(100, params.swing)) : null;
  const swingDesc =
    swing == null || swing < 10
      ? ""
      : swing < 40
        ? "subtle bounce"
        : "bouncy rhythm";

  if (!isSong) {
    const extra = params.prompt?.trim();
    const description = beatGenreMap[params.genre] ?? `A modern ${params.genre} instrumental.`;

    const moodEnergyText =
      params.mood || params.energyLevel ? `Vibe: ${[params.mood || "", params.energyLevel || ""].filter(Boolean).join(" / ")}.` : "";
    const bpmText = params.bpm > 0 ? `Tempo around ${params.bpm} BPM.` : "";
    const keyText = params.key && params.scale ? `Key center: ${params.key} ${params.scale}.` : "";
    const feelText = swingDesc ? `Rhythm feel: ${swingDesc}.` : "";
    const loopText =
      params.loopLengthBars > 0
        ? `Make it seamlessly loopable over ${params.loopLengthBars} bars with subtle A/B variations and small fills.`
        : "";
    const influenceText =
      params.influence && params.influence !== "No Influence" ? `In the style of ${params.influence}.` : "";
    const reverbText = params.reverb ? `Space: ${params.reverb}.` : "";
    const extraText = extra ? `Extra direction: ${extra}.` : "";

    return clean(
      [
        description,
        moodEnergyText,
        bpmText,
        keyText,
        feelText,
        loopText,
        influenceText,
        reverbText,
        extraText,
      ]
        .filter(Boolean)
        .join(" "),
    );
  }

  const parts = [
    isSong ? "Full song with vocals, release-ready, modern mix" : "Instrumental beat",
    genre,
    fingerprint,
    params.bpm > 0 ? `${params.bpm} BPM` : "",
    params.key && params.scale ? `key ${params.key} ${params.scale}` : "",
    swingDesc,
    mood,
    energy,
    reverb,
    influence,
  ].filter(Boolean);

  const base = clean(parts.join(", "));
  const extra = params.prompt?.trim();
  if (extra) return clean(`${base}, ${extra}`);
  return base;
}

export function buildSonautoTags(params: GenerateParams) {
  const byGenre: Record<string, string[]> = {
    Trapsoul: ["r&b/soul", "trap", "melodic", "2020s"],
    "Dark Trap": ["trap", "dark", "2020s"],
    "Melodic Trap": ["trap", "melodic", "energetic", "2020s"],
    "Contemporary Rap": ["hip-hop/rap", "rhythmic", "2020s"],
    "Old School Hip-Hop": ["hip-hop/rap", "rhythmic", "1990s"],
    Drill: ["hip-hop/rap", "aggressive", "dark", "2020s"],
    "UK Drill": ["hip-hop/rap", "dark", "2020s"],
    "NY Drill": ["hip-hop/rap", "aggressive", "2020s"],
    "90s R&B": ["r&b/soul", "1990s"],
    "Neo Soul": ["soul", "r&b/soul", "2000s"],
    "Contemporary R&B": ["r&b/soul", "2020s"],
    "Lo-fi R&B": ["lo-fi", "r&b/soul", "melancholic"],
    Afrobeats: ["african", "dance", "2020s"],
    "Afro-drill": ["african", "hip-hop/rap", "dark", "2020s"],
    Amapiano: ["african", "house", "2020s"],
    House: ["house", "dance", "2020s"],
    Reggaeton: ["latin", "dance", "2020s"],
    "Latin Trap": ["latin", "trap", "2020s"],
    "Jersey Club": ["dance", "energetic", "2020s"],
  };

  const byMood: Record<string, string> = {
    Dark: "dark",
    Melancholic: "melancholic",
    Euphoric: "energetic",
    Aggressive: "aggressive",
    Smooth: "smooth",
    Dreamy: "atmospheric",
    Hypnotic: "rhythmic",
  };

  const byVibe: Record<string, string> = {
    Chill: "smooth",
    Happy: "energetic",
    Sad: "melancholic",
    Romantic: "smooth",
    Aggressive: "aggressive",
    Confident: "energetic",
    Nostalgic: "melancholic",
    Hype: "energetic",
  };

  const raw = [
    ...(byGenre[params.genre] ?? []),
    byMood[params.mood] ?? "",
    byVibe[params.energyLevel] ?? "",
    "instrumental",
  ].filter(Boolean);

  const uniq = Array.from(new Set(raw));
  const valid = uniq.filter((t) => sonautoValidTags.has(t));
  const invalid = uniq.filter((t) => !sonautoValidTags.has(t));
  if (invalid.length) {
    throw new Error(`Unsupported Sonauto tags requested: ${invalid.join(", ")}`);
  }
  return valid.slice(0, 6);
}

