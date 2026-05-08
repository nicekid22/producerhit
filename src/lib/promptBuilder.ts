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
      "Trapsoul instrumental beat: soft melodic piano loop, warm R&B chords, smooth 808 bass slides, atmospheric reverb pads, crisp hats with gentle rolls, dark romantic trap-soul production. No vocals.",
    "Dark Trap":
      "Dark trap instrumental: heavy distorted 808 sub-bass, sinister minor-key synth/piano stabs, aggressive layered snare/clap, fast trap hi-hat patterns, dark cinematic pads and risers. No vocals.",
    "Melodic Trap":
      "Melodic trap instrumental beat: emotional chord progression, bright euphoric lead synth or piano melody, stacked atmospheric pads, punchy trap drums, rolling hi-hats, clean 808 movement. No vocals.",
    "Old School Hip-Hop":
      "A classic old-school hip-hop / boom bap instrumental built around a chopped sample loop. Use dusty but punchy drums with swing, subtle scratches, and a warm bassline that follows the sample movement.",
    Drill:
      "Chicago drill instrumental beat: dark minor-key piano melody, deep sliding 808 bass, crisp snare, fast triplet hi-hats, cold aggressive energy, gritty modern sound design. No vocals.",
    "UK Drill":
      "UK drill instrumental beat: dark chromatic sliding piano motif, heavy cold 808 bass, crisp snare hits, fast hi-hats, tight London street drill groove. No vocals.",
    "NY Drill":
      "New York drill instrumental beat: aggressive dark piano stab loop, heavy 808 bass drops, punchy snare, high energy Brooklyn drill sound with tight transitions. No vocals.",
    "90s R&B":
      "Classic 90s R&B instrumental beat: warm Rhodes electric piano chords, smooth bass guitar groove, New Jack Swing drum pattern, soulful nostalgic production. No vocals.",
    "Neo Soul":
      "Neo soul instrumental beat: live Rhodes electric piano, warm upright bass groove, brushed jazz drums, jazzy chord voicings, organic soulful texture. No vocals.",
    "Contemporary R&B":
      "Modern R&B instrumental beat: polished synth pad chords, warm melodic piano, clean 808 bass, crisp hi-hats, cinematic modern production. No vocals.",
    "Lo-fi R&B":
      "Lo-fi R&B instrumental beat: warm vinyl crackle, dusty sampled drum loop, mellow jazz piano chords, soft bass, cozy relaxed bedroom sound. No vocals.",
    Afrobeats:
      "Afrobeats instrumental beat: percussion-driven rhythm, talking drum patterns, shakers and congas, uplifting guitar or synth melody, warm bass guitar, West African groove. No vocals.",
    Amapiano:
      "Amapiano instrumental beat: deep resonant log drum bassline, jazzy piano chord stabs, rhythmic shaker patterns, deep house groove, South African sound. No vocals.",
    Reggaeton:
      "Reggaeton instrumental beat: dembow kick and snare pattern, heavy sub bass, catchy synth melody, Latin urban rhythm section, perreo club energy. No vocals.",
    "Latin Trap":
      "Latin trap instrumental beat: heavy 808 bass, melodic synth lead, trap drum pattern with Latin percussion accents, urban Latin street sound. No vocals.",
    "Jersey Club":
      "Jersey club instrumental beat: fast ~140 BPM bouncy groove, rolling kick repeats, syncopated snare/clap, pitched vocal chop stabs, high-energy club bounce. No vocals.",
    Pop: "A modern pop instrumental: bright synths, clean drums, catchy melodic hook, and polished radio-ready mix. Keep it energetic and uplifting.",
    "UK Garage":
      "UK garage instrumental beat: 2-step swingy drum pattern, deep bouncy bassline, pitched chord stabs, syncopated groove, London underground sound. No vocals.",
    "Hyperpop":
      "Hyperpop instrumental beat: glitchy distorted synth bass, pitched percussion, chaotic hi-hat patterns, hyper-compressed production, futuristic digital sound. No vocals.",
    "Baile Funk":
      "Baile funk instrumental beat: heavy Miami bass kick, fast percussive breaks, short synth riff, favela Rio street energy, aggressive rhythm section. No vocals.",
    Afrotrap:
      "Afrotrap instrumental beat: afrobeats talking drum and shaker groove, heavy trap 808 bass, melodic West African synth lead, fusion bounce and energy. No vocals.",
    Dancehall:
      "Dancehall instrumental riddim: bouncy Caribbean rhythm pattern, heavy sub bass, melodic synth stabs, island groove, Jamaican sound system energy with clean modern drums. No vocals.",
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
    const isOldSchool = params.genre === "Old School Hip-Hop";
    const isTrapFamily =
      /trap/i.test(params.genre) || /drill/i.test(params.genre) || params.genre === "Afrotrap" || params.genre === "Trapsoul";

    const extra = params.prompt?.trim();
    const description = beatGenreMap[params.genre]
      ? beatGenreMap[params.genre]
      : isOldSchool
        ? "A classic old-school hip-hop / boom bap instrumental built around a chopped sample loop. Use dusty but punchy drums with swing, subtle scratches, and a warm bassline that follows the sample movement."
        : isTrapFamily
          ? "A modern trap instrumental with a sparse minor-key motif, heavy 808 movement, and crisp modern drums. Keep it hypnotic with small drum variations and clean space for an artist."
          : fingerprint
            ? `A modern ${params.genre} instrumental. Include these defining elements: ${fingerprint}.`
            : `A modern ${params.genre} instrumental.`;

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

    const constraints = isOldSchool
      ? "No intelligible lyrics or spoken words. Scratches and chopped vocal one-shots are OK."
      : "No full rapped verses or lead singing. Keep it instrumental; vocal chops are OK.";

    return clean(
      [
        `Modern 2026 ${params.genre} instrumental type beat.`,
        description,
        moodEnergyText,
        bpmText,
        keyText,
        feelText,
        loopText,
        influenceText,
        reverbText,
        extraText,
        constraints,
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
    "Dark Trap hip hop": ["trap", "dark", "2020s"],
    "Melodic Trap": ["trap", "melodic", "energetic", "2020s"],
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

