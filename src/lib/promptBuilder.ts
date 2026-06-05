import {
  extendedGenreAceTagMap,
  extendedGenreBpmMap,
  extendedGenrePromptMap,
  extendedGenreSonautoMap,
} from "@/lib/genres/extendedCatalog";
import { buildBeatAmbianceMoodMap } from "@/lib/beatAmbiance";
import { buildBeatInfluenceMap } from "@/lib/beatInfluence";

const influenceMap: Record<string, string> = buildBeatInfluenceMap();
const moodMap: Record<string, string> = buildBeatAmbianceMoodMap();

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
  "1960s",
  "1970s",
  "1980s",
  "jazz",
  "happy",
  "hypnotic",
  "experimental",
]);

const genreMap: Record<string, string> = {
  Trapsoul:
    "modern trapsoul R&B, emotional minor chords, dark atmospheric pads, smooth 808 bass, Bryson Tiller vibe",
  "Dark Trap":
    "dark hip hop rap trap, modern atlanta drum programming, sinister minor-key motif (piano/bells), heavy 808 glides, menacing cinematic atmosphere",
  "Lo-Fi Hip-Hop":
    "lo-fi hip hop, vintage dusty boom bap drums, emotional melodic chords, vinyl crackle and subtle scratches, rainy night city atmosphere, chill study music, warm tape saturation",
  "Melodic Trap":
    "melodic trap (hip-hop/rap, Atlanta style — not EDM trap), emotional minor-key piano or guitar topline, airy pads, modern rap drum programming, crisp hats, punchy 808 glides, space for melodic rap vocals",
  "Old School Hip-Hop":
    "old-school hip-hop / boom bap, sample-based chopped soul or jazz loop, dusty drums, MPC swing, vinyl texture, subtle scratches",
  Drill: "authentic drill music, sliding 808s, dark aggressive melody, fast hi-hat patterns",
  "UK Drill":
    "UK drill, dark sliding chromatic melody, cold London atmosphere, sliding 808 bass, aggressive street vibe",
  "NY Drill": "NY drill, aggressive dark melody, Brooklyn sound, heavy bass slides, high energy",
  "90s R&B": "classic 90s R&B, soulful melody, smooth groove, swing rhythm, New Jack Swing influence",
  "Neo Soul": "neo soul, organic instruments, soulful chords, jazzy Rhodes, laid-back D'Angelo feel",
  Soul: "soul music, warm gospel-influenced chord movement, expressive melodic hooks, live-feel drums, deep bass, tasteful horn or string accents",
  Funk: "funk, tight syncopated groove, slap or fingerstyle bass, rhythmic guitar stabs, crisp drum pocket, horn hits, danceable energy",
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
  "Speed Garage": "speed garage, UK garage-derived club sound with faster tempo (typically ~130–140 BPM), skippy drums, heavy bassline, time-stretched and pitched vocal chops",
  "Drum and Bass": "drum and bass (D&B), fast breakbeats and rolling drums (typically ~160–180 BPM), deep sub-bass, crisp snares, energetic rave atmosphere",
  "Jersey Drill":
    "Jersey drill, drill 808 slides + Jersey club kick clusters, dark sparse melody, aggressive bouncy pocket, stop/start breaks, club-ready energy",
  "Hyperpop": "hyperpop, kawaii and gaming-inspired pop-rap, bright glitchy synths, punchy drums, distorted bass, hyper-compressed modern mix",
  "Hyperpop (Hip-Hop/R&B)":
    "hyperpop fused with hip-hop and modern R&B, glitchy synths, distorted bass, punchy 808s, emotive emo-pop melodies, aggressive vocal chops, maximal modern mix",
  "R&B Alternative":
    "alternative R&B, moody minimal production, experimental textures, airy pads, unexpected drum pocket, emotive chords, modern underground vibe",
  "French Pop": "French pop (chanson-pop), catchy melodic toplines, polished radio-ready production, bright synths or guitars, modern pop groove",
  "Video Game":
    "video game soundtrack / gaming, catchy arpeggios, chiptune or modern synth leads, bright melodic motifs, clean punchy drums, loop-friendly and hooky",
  Electro:
    "modern electro / electro-pop, punchy synth bass, sidechained chords, crisp drums, club-ready energy, bright hooks, clean wide mix",
  Rock: "modern rock, driving live-style drums, distorted guitars, energetic chorus, tight arrangement, punchy mix",
  "Pop Rock": "pop rock, catchy guitar hook, uplifting chorus, bright drums, radio-ready modern pop-rock production",
  "Baile Funk":
    "baile funk / Brazilian funk (Funk Mandelão), aggressive distorted kick drum, sharp synthetic snare, raw sawtooth lead riff, deep sub bass, DJ drops and chopped vocal stabs, relentless dancefloor groove, Rio de Janeiro street energy",
  Afrotrap: "afrotrap, afrobeat percussion with heavy trap 808s, high energy, infectious percussive rhythm, talking drum, uplifting West African melody, danceable groove, warm bass guitar, Burna Boy Wizkid style energy",
  Dancehall: "dancehall, Jamaican dancehall riddim, rhythmic island groove, heavy sub bass, club party energy, Caribbean bounce, modern drum sound, heavy bass, club energy",
  PluggnB: "pluggnb, melodic rap + R&B fusion, bright airy synth plucks, soft but punchy trap drums, bouncy 808, emotional topline space, internet-era sheen",
  Rage: "rage rap, high-energy distorted synth lead, bouncy aggressive 808s, rapid hats, moshpit drops, futuristic trap sound, 2020s",
  Reggae: "reggae, laid-back skank guitar on offbeats, deep round bassline, one-drop groove, warm analog feel, sunny island vibe",
  "K-Pop": "K-pop, modern glossy pop production, bright layered synths, punchy drums, catchy hooks, clean wide mix, energetic",
  Opera: "opera-inspired, dramatic orchestral arrangement, cinematic strings and brass, powerful vocal lead space, grand hall reverb, classical dynamics",
  Oriental: "oriental / Middle Eastern inspired, Arabic or Turkish scales, oud/kanun textures, darbuka percussion, hypnotic melodic ornaments, cinematic ambience",
  Latin: "Latin pop / urbano, danceable groove, bright percussion, catchy melodic motif, warm bass, club-ready rhythm",
  VinaHouse: "VinaHouse (Vietnamese house), fast energetic house groove, bright synth leads, hard dance drums, festival energy, punchy modern mix",
  Jazz: "jazz, rich extended chords, swing or laid-back pocket, upright bass feel, live drums/brushes, expressive melodic improvisation",
  "New Jazz": "new jazz / jazztronica, modern jazzy chord voicings, tight hip-hop influenced pocket, clean drums, warm bass, contemporary textures",
  Classical: "classical / orchestral, expressive strings, piano motifs, dynamic arrangement, cinematic harmony, concert hall space",
  "Atmospheric Rap": "atmospheric rap, airy pads, wide space, minimal drums, hypnotic groove, emotional ambience, modern rap pocket",
  "Cloud Rap": "cloud rap, dreamy airy synth pads, washed reverb, light but bouncy drums, soft 808, floating melodic vibe",
  "Emo Rap": "emo rap, melancholic guitar or piano motif, emotional chords, modern trap drums, vulnerable mood, melodic hooks",
  "Sad Rap": "sad rap, emotional minor-key chords, soft but punchy drums, deep sub, intimate atmosphere, reflective vibe",
  "Experimental Trap": "experimental trap, unconventional sound design, glitchy textures, warped 808s, unexpected drum patterns, futuristic atmosphere",
  "Ambient Trap": "ambient trap, spacious pads, minimal trap drums, deep sub, slow evolving textures, hypnotic atmosphere",
  "Cinematic Trap": "cinematic trap, orchestral or film-score textures, dark dramatic harmony, huge drums, impactful transitions, trailer-like energy",
  "Sample Drill": "sample drill, dark chopped sample loop (soul/jazz), drill drums and 808 slides, gritty texture, modern UK/NY energy",
  "Melodic Drill": "melodic drill, emotional minor-key melody, sliding 808 bass, crisp drill drums, space for melodic rap hooks",
  "Afro R&B": "afro R&B, smooth R&B chords with afro percussion bounce, warm guitar licks, deep sub, sensual groove, modern mix",
  "Brazilian Phonk": "Brazilian phonk, aggressive distorted bass, punchy cowbell patterns, raw club energy, fast groove, hard-hitting drums",
  "Dark R&B": "dark R&B, moody pads, minor-key chords, sparse drums, deep sub, nocturnal vibe, emotional tension",
  "Future R&B": "future R&B, futuristic synth textures, glossy chords, tight drums, deep sub, modern vocal-friendly space",
  "Toxic R&B": "toxic R&B, dark sensual chords, cold pads, tight modern drums, deep sub, tense intimate mood",
  "Emotional Trap": "emotional trap, cinematic minor-key chords, melodic topline, modern trap drums, deep 808, heartfelt vibe",
  "Experimental Rage": "experimental rage, rage synth lead with glitchy sound design, aggressive drops, distorted bass, futuristic chaos energy",
  "Afro House": "afro house, deep house groove with afro percussion, hypnotic bassline, warm chords, club-ready energy, 2020s",
  EDM: "EDM, big synth chords, tight build-ups and drops, energetic drums, festival-ready mix, wide stereo",
  Chillstep: "chillstep, melodic atmospheric electronic, soft sidechained chords, smooth drums, deep sub, uplifting chill vibe",
  Dubstep: "dubstep, heavy wobbly bass design, half-time drums, aggressive drops, dark atmosphere, modern sound design",
  "Witch House": "witch house, dark atmospheric electronic, slow tempo, trap-influenced drums, occult vibe, hazy reverb, distorted synths",
  Glitchcore: "glitchcore, hyper-digital glitchy sound design, chopped drums, stutter edits, bright synths, chaotic modern energy",
  Digicore: "digicore, internet rap + hyperpop edge, bright synths, punchy 808s, glitchy drums, energetic hooks",
  "Study Beats": "study beats, lo-fi hip hop focus music, warm chords, soft dusty drums, vinyl texture, calm steady groove",
  "Viral TikTok": "viral TikTok-ready, short hook-focused direction, catchy motif, clean loud mix, instant earworm energy",
  "Viral TikTok Pop": "viral TikTok pop, bright catchy hook, punchy drums, glossy production, quick earworm melody, modern pop energy",
  "Indie Pop": "indie pop, warm guitars/synths, catchy but understated hook, organic drums, modern clean mix, dreamy vibe",
  "Dream Pop": "dream pop, lush reverb guitars or pads, hazy textures, soft drums, floating chord progression, airy atmosphere",
  "Dance Pop": "dance pop, upbeat groove, bright synth hook, punchy drums, radio-ready polish",
  Vaporwave: "vaporwave, nostalgic retro synth textures, slow dreamy groove, washed reverb, tape warmth, 80s/90s nostalgia aesthetic",
  Synthwave: "synthwave, retro-futuristic analog synths, driving drums, neon arps, cinematic nostalgia, glossy 80s-inspired tone",
  "Guitar Acoustic Live": "acoustic guitar live, natural room tone, fingerpicking or strumming, intimate performance feel, minimal processing",
  "Piano Acoustic Live": "acoustic piano live, natural room ambience, expressive dynamics, intimate performance feel, warm tone",
  "Rage + Ambient": "rage + ambient hybrid, high-energy rage synth lead layered with spacious ambient pads, aggressive drums with ethereal atmosphere",
  "Holographic R&B": "holographic R&B, futuristic glossy chords, shimmering synth textures, smooth drums, neon ambience, modern sensual vibe",
  "Futuristic Trap Soul": "futuristic trap soul, emotional R&B chords with modern trap drums, futuristic synth layers, deep sub, sleek mix",
  "Ambient Drill": "ambient drill, drill drums and 808 slides with spacious ambient pads, minimal melody, cold wide atmosphere",
  "Cinematic Afro Trap": "cinematic afro trap, afro percussion groove fused with trap drums and dramatic cinematic textures, big transitions",
  "AI-assisted Pop": "AI-assisted pop, modern catchy hook, futuristic clean synth textures, polished radio-ready mix, hook-forward",
  "Experimental Afro House": "experimental afro house, afro percussion + house groove with experimental sound design, hypnotic bass, futuristic textures",
  "Hyper Melodic Rap": "hyper melodic rap, strong catchy melodic toplines, emotional chords, modern drums, bright hooks, vocal-forward space",
  "Dark Atmospheric Pop": "dark atmospheric pop, moody pads, minor-key progression, punchy pop drums, cinematic tension, hooky topline space",
  "Y2K Futuristic Pop": "Y2K futuristic pop, 2000s-inspired glossy synths and drums, futuristic ear candy, catchy hook, bright polished mix",
  "Hybrid Electronic Rap": "hybrid electronic rap, modern rap drums fused with electronic synth bass and sound design, club energy, tight pocket",
  "Sci-Fi R&B": "sci-fi R&B, moody futuristic pads, deep sub, minimal drums, alien textures, wide space, nocturnal vibe",
  "Ethereal Trap": "ethereal trap, airy pads, shimmering plucks, minimal trap drums, deep 808, dreamy floating atmosphere",
  "Nostalgic Future Beats": "nostalgic future beats, retro melodic motifs with futuristic textures, warm chords, modern drums, shimmering nostalgia",
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

function limitChars(s: string, max: number) {
  const t = clean(s);
  if (t.length <= max) return t;
  return t.slice(0, max).replace(/[,\s]+$/g, "").trim();
}

function uniqTags(tags: string[]) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of tags) {
    const t = clean(raw);
    if (!t) continue;
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}

function extractVocalStyle(prompt: string) {
  const m = prompt.match(/vocal\s*style\s*:\s*([^,]+)(?:,|$)/i);
  if (!m) return { style: "", rest: prompt };
  const style = clean(m[1] || "");
  const rest = clean(prompt.replace(m[0], " "));
  return { style, rest };
}

function tempoHintFromBpm(bpm: number) {
  if (!Number.isFinite(bpm) || bpm <= 0) return "";
  if (bpm >= 165) return "very fast tempo";
  if (bpm >= 140) return "fast tempo";
  if (bpm >= 115) return "upbeat tempo";
  if (bpm >= 90) return "mid-tempo";
  return "slow tempo";
}

export function buildAceCaption(
  params: GenerateParams,
  options?: { isSong?: boolean; instrumental?: boolean; autoMeta?: boolean; vocalLanguage?: string },
) {
  const isSong = Boolean(options?.isSong);
  const instrumental = options?.instrumental ?? true;
  const autoMeta = options?.autoMeta ?? true;
  const vocalLanguage = (options?.vocalLanguage || "").trim();
  const genreKey = params.genre === "Auto" ? "" : params.genre;

  const defaultBpmByGenre: Record<string, number> = {
    "Melodic Trap": 140,
    "Dark Trap": 140,
    Trapsoul: 140,
    Drill: 145,
    "UK Drill": 145,
    "NY Drill": 145,
    "Baile Funk": 150,
    House: 128,
    "UK Garage": 132,
    "Jersey Club": 140,
    "Jersey Drill": 150,
    Reggaeton: 95,
    Afrobeats: 105,
    Amapiano: 112,
    Dancehall: 98,
    Hyperpop: 160,
    "Hyperpop (Hip-Hop/R&B)": 160,
    "R&B Alternative": 105,
    "Video Game": 140,
    Electro: 128,
    Rock: 140,
    "Pop Rock": 140,
    "Speed Garage": 138,
    "Drum and Bass": 174,
    "Old School Hip-Hop": 92,
    "Lo-Fi Hip-Hop": 86,
    "Contemporary Rap": 145,
    Pop: 120,
    "French Pop": 120,
    Soul: 96,
    Funk: 110,
    PluggnB: 150,
    Rage: 165,
    "Cloud Rap": 140,
    "Emo Rap": 150,
    "Sad Rap": 140,
    "Atmospheric Rap": 140,
    "Ambient Trap": 140,
    "Cinematic Trap": 145,
    "Sample Drill": 142,
    "Melodic Drill": 142,
    "Dark R&B": 105,
    "Future R&B": 110,
    "Afro R&B": 108,
    "Afro House": 124,
    VinaHouse: 132,
    EDM: 128,
    Chillstep: 140,
    Dubstep: 140,
    Reggae: 90,
    Latin: 100,
    "Rage + Ambient": 165,
    "Ambient Drill": 142,
    ...extendedGenreBpmMap(),
  };

  const bpmHint = (Number.isFinite(params.bpm) && params.bpm > 0 ? Math.round(params.bpm) : defaultBpmByGenre[genreKey]) || 0;

  const aceGenreTagsBeat: Record<string, string> = {
    Trapsoul: "trap soul, hip-hop/R&B, warm chords, smooth 808, late-night vibe",
    "Dark Trap": "dark trap, hip-hop/rap, sinister minor key, hard 808, tight modern drums",
    "Lo-Fi Hip-Hop": "lo-fi hip hop, boom bap, dusty drums, vinyl crackle, rainy night, nostalgic, study vibe",
    "Melodic Trap": "melodic trap, hip-hop/rap (Atlanta), emotional guitar or piano, airy pads, crisp trap drums, 808 glides",
    Drill: "Chicago drill, aggressive, sliding 808, dark piano motif, fast hats",
    "UK Drill": "UK drill, cold dark atmosphere, sliding 808, syncopated hats, sharp snare",
    "NY Drill": "NY drill, Brooklyn, aggressive, dark piano stabs, punchy drums, 808 slides",
    "Old School Hip-Hop": "boom bap, hip-hop, chopped soul/jazz sample, dusty drums, vinyl texture",
    "90s R&B": "90s R&B, new jack swing groove, Rhodes, bass guitar, smooth drums",
    "Neo Soul": "neo soul, jazzy Rhodes chords, live bass, laid-back pocket, organic drums",
    Soul: "soul, warm chords, expressive melody, live-feel drums, deep bass, tasteful horns",
    Funk: "funk, tight groove, syncopated guitar stabs, slap bass, crisp drums, horn hits",
    "Contemporary Rap": "modern rap, hard drums, clean 808/sub, minimal melodic motif, radio-ready mix",
    Afrobeats: "afrobeats, West African groove, percussion heavy, uplifting guitar, danceable",
    Amapiano: "amapiano, South African deep house, log drum bass, shakers, jazzy piano stabs",
    House: "house, four-on-the-floor kick, groovy bassline, bright chord stabs, deep/club house feel, not hip-hop",
    Reggaeton: "reggaeton, dembow rhythm, 85–100 BPM feel, Latin urban vibe, tight drums, perreo energy, clean sub bass",
    "Latin Trap": "latin trap, hip-hop/rap, Spanish urban vibe, 808, Latin percussion",
    "Jersey Club": "Jersey club, 140 BPM bounce, chopped vocal stabs, bed squeak, hard kicks",
    "Jersey Drill": "Jersey drill, 140–160 BPM energy, drill 808 slides + Jersey kick clusters, chopped vocal stabs, stop/start breaks, dark minimal melody",
    Pop: "modern pop, catchy synth topline, polished production, upbeat, bright",
    "UK Garage": "UK garage / 2-step, ~130 BPM, skippy swung drums, syncopated kicks, bouncy bassline, chord stabs, vocal chops, London underground",
    Hyperpop: "hyperpop, kawaii and gaming-inspired pop-rap, bright glitchy synths, punchy drums, distorted bass, hyper-compressed modern mix",
    "Hyperpop (Hip-Hop/R&B)": "hyperpop + hip-hop/R&B, glitchy synths, punchy 808s, distorted bass, emo-pop melodies, modern mix",
    "R&B Alternative": "alternative R&B, moody minimal, experimental textures, airy pads, off-kilter drum pocket, deep sub, modern underground",
    "Video Game": "video game soundtrack, catchy arps, chiptune or modern synth leads, bright motifs, clean drums, loop-friendly",
    Electro: "modern electro / electro-pop, punchy synth bass, sidechained chords, crisp drums, club-ready energy, bright hooks",
    Rock: "modern rock, driving live drums, distorted guitars, energetic chorus, punchy mix",
    "Pop Rock": "pop rock, catchy guitar hook, uplifting chorus, bright drums, radio-ready modern pop-rock",
    "Speed Garage": "speed garage, UKG-derived, ~130-140 BPM, skippy drums, heavy bassline, time-stretched vocal chops, club energy",
    "Drum and Bass": "drum and bass, ~160-180 BPM, breakbeats, rolling drums, deep sub-bass, energetic rave atmosphere",
    "French Pop": "French pop, catchy melodies, bright synths or guitars, radio-ready production, modern groove",
    "Baile Funk": "baile funk, Funk Mandelão, distorted kick, sharp snare, saw lead riff, DJ drops",
    Afrotrap: "afrotrap, afrobeats percussion, trap drums, heavy 808, high energy",
    Dancehall: "dancehall, Jamaican riddim, Caribbean bounce, heavy sub bass, club energy",
    Country: "modern country, acoustic guitar, live drums, warm bass, anthem vibe",
    PluggnB: "pluggnb, melodic rap + R&B, bright plucky synths, soft but punchy trap drums, bouncy 808, emotional vibe",
    Rage: "rage rap, distorted synth lead, aggressive 808s, high energy, modern moshpit drops, futuristic trap",
    Reggae: "reggae, offbeat skank guitar, deep bassline, one-drop groove, warm island vibe",
    Latin: "latin pop/urbano, danceable groove, bright percussion, warm bass, catchy motif",
    VinaHouse: "VinaHouse, energetic Vietnamese house, fast bouncy groove, bright synth lead, club energy",
    Jazz: "jazz-inspired, rich chords, live-feel drums, warm bass, expressive motifs",
    "New Jazz": "new jazz, modern jazzy chords with tight hip-hop pocket, clean drums, warm bass, contemporary textures",
    Classical: "classical/orchestral, expressive strings and piano motifs, cinematic harmony, concert hall space",
    Opera: "opera-inspired, dramatic orchestral arrangement, grand hall reverb, cinematic dynamics",
    Oriental: "Middle Eastern inspired, Arabic/Turkish scales, oud/kanun textures, darbuka percussion, hypnotic ornaments",
    "Atmospheric Rap": "atmospheric rap, airy pads, wide space, minimal drums, hypnotic modern pocket",
    "Cloud Rap": "cloud rap, dreamy washed pads, light drums, soft 808, floating vibe",
    "Emo Rap": "emo rap, melancholic guitar/piano motif, emotional chords, modern trap drums",
    "Sad Rap": "sad rap, emotional minor chords, intimate atmosphere, soft drums, deep sub",
    "Emotional Trap": "emotional trap, cinematic minor chords, melodic topline, modern trap drums, deep 808",
    "Ambient Trap": "ambient trap, spacious pads, minimal trap drums, deep sub, slow evolving textures",
    "Cinematic Trap": "cinematic trap, film-score textures, dramatic harmony, huge drums, impactful transitions",
    "Experimental Trap": "experimental trap, glitchy textures, warped 808s, unusual drum patterns, futuristic atmosphere",
    "Experimental Rage": "experimental rage, rage synth lead with glitchy sound design, distorted bass, chaotic energy",
    "Sample Drill": "sample drill, chopped sample loop + drill drums, sliding 808s, gritty texture, modern energy",
    "Melodic Drill": "melodic drill, emotional melody, sliding 808 bass, crisp drill drums, hooky vibe",
    "Afro R&B": "afro R&B, smooth R&B chords with afro percussion bounce, warm guitar, deep sub",
    "Afro House": "afro house, deep house groove with afro percussion, hypnotic bassline, club energy",
    "Dark R&B": "dark R&B, moody pads, minor-key chords, sparse drums, nocturnal vibe",
    "Future R&B": "future R&B, futuristic synth textures, glossy chords, tight drums, deep sub",
    "Toxic R&B": "toxic R&B, dark sensual chords, cold pads, tight modern drums, tense intimate mood",
    EDM: "EDM, big synth chords, energetic drums, build-ups and drops, festival-ready mix",
    Chillstep: "chillstep, melodic atmospheric electronic, sidechained chords, smooth drums, uplifting chill vibe",
    Dubstep: "dubstep, heavy bass sound design, half-time drums, aggressive drops, dark atmosphere",
    "Witch House": "witch house, dark atmospheric electronic, trap-influenced drums, hazy reverb, distorted synths",
    Glitchcore: "glitchcore, hyper-digital glitchy edits, chopped drums, stutter, bright synths, chaotic energy",
    Digicore: "digicore, internet rap + hyperpop edge, bright synths, punchy 808s, glitchy drums",
    "Study Beats": "study beats, lo-fi hip hop, warm chords, soft dusty drums, calm steady groove",
    Vaporwave: "vaporwave, retro nostalgic synth textures, hazy reverb, tape warmth, dreamy vibe",
    Synthwave: "synthwave, retro-futuristic analog synths, neon arps, driving drums, cinematic nostalgia",
    "Viral TikTok": "viral-ready, hook-focused, catchy motif, clean loud mix, instant earworm energy",
    "Viral TikTok Pop": "viral TikTok pop, catchy hook, glossy synths, punchy drums, modern pop polish",
    "Indie Pop": "indie pop, warm guitars/synths, organic drums, understated catchy hook, dreamy vibe",
    "Dream Pop": "dream pop, lush reverb guitars/pads, hazy textures, soft drums, airy atmosphere",
    "Dance Pop": "dance pop, upbeat groove, bright synth hook, punchy drums, radio-ready polish",
    "Rage + Ambient": "rage + ambient hybrid, rage synth lead layered with ambient pads, aggressive drums with ethereal atmosphere",
    "Holographic R&B": "holographic R&B, shimmering synth textures, glossy chords, smooth drums, neon ambience",
    "Futuristic Trap Soul": "futuristic trap soul, emotional R&B chords + modern trap drums, futuristic synth layers, sleek mix",
    "Ambient Drill": "ambient drill, drill drums + 808 slides with spacious ambient pads, cold wide atmosphere",
    "Cinematic Afro Trap": "cinematic afro trap, afro percussion + trap drums with cinematic textures, big transitions",
    "AI-assisted Pop": "AI-assisted pop, modern catchy hook, futuristic clean synth textures, polished mix",
    "Experimental Afro House": "experimental afro house, afro percussion + house groove with experimental sound design, hypnotic bass",
    "Hyper Melodic Rap": "hyper melodic rap, catchy melodic toplines, emotional chords, modern drums, hook-forward",
    "Dark Atmospheric Pop": "dark atmospheric pop, moody pads, minor-key progression, punchy pop drums, cinematic tension",
    "Y2K Futuristic Pop": "Y2K futuristic pop, 2000s-inspired glossy synths/drums, futuristic ear candy, catchy hook",
    "Hybrid Electronic Rap": "hybrid electronic rap, rap drums fused with electronic sound design, club energy, tight pocket",
    "Sci-Fi R&B": "sci-fi R&B, alien textures, moody futuristic pads, deep sub, minimal drums, wide space",
    "Ethereal Trap": "ethereal trap, airy pads, shimmering plucks, minimal trap drums, deep 808, dreamy atmosphere",
    "Nostalgic Future Beats": "nostalgic future beats, retro melodic motifs with futuristic textures, warm chords, modern drums",
    ...extendedGenreAceTagMap(),
  };

  const aceGenreTagsSong: Record<string, string> = {
    ...aceGenreTagsBeat,
    Pop: "pop song, catchy hook, modern radio production, bright synths, tight drums",
    Trapsoul: "trap soul song, R&B/hip-hop, emotional chords, smooth 808, intimate vibe",
    "Melodic Trap": "melodic rap song, hip-hop/rap (Atlanta), emotional guitar/piano, airy pads, 808 glides",
    "Baile Funk": "baile funk song, Funk Mandelão, distorted kick, sharp snare, saw lead riff, hyped vocals, DJ drops",
  };

  const genreTags = (isSong ? aceGenreTagsSong[genreKey] : aceGenreTagsBeat[genreKey]) || genreKey;
  const influence = influenceMap[params.influence] ?? params.influence;
  const mood = moodMap[params.mood] ?? params.mood;
  const energy = energyMap[params.energyLevel] ?? params.energyLevel;
  const reverb = reverbMap[params.reverb] ?? params.reverb;

  const extraRaw = (params.prompt || "").trim();
  const { style: vocalStyle, rest: extraRest } = extractVocalStyle(extraRaw);
  const extra = limitChars(extraRest, 140);

  const tags = uniqTags(
    [
      genreTags,
      params.influence && params.influence !== "No Influence" && influence ? influence : "",
      mood,
      energy,
      reverb,
      bpmHint > 0 ? `${bpmHint} BPM` : "",
      params.loopLengthBars > 0 ? `loopable ${params.loopLengthBars} bars` : "",
      autoMeta ? "" : params.key && params.scale ? `${params.key} ${params.scale}` : "",
      tempoHintFromBpm(params.bpm),
      instrumental ? "instrumental" : "vocals",
      instrumental && !isSong ? "no vocals" : "",
      instrumental && !isSong ? "no lyrics" : "",
      !instrumental && vocalStyle ? `vocal style ${vocalStyle}` : "",
      !instrumental && vocalLanguage ? `vocal language ${vocalLanguage}` : "",
      extra ? extra : "",
    ].filter(Boolean) as string[],
  );

  return limitChars(tags.join(", "), 512);
}

export function buildRichPrompt(params: GenerateParams, isSong: boolean = false) {
  const genreKey = params.genre === "Auto" ? "" : params.genre;
  const songGenreMap: Record<string, string> = {
    Trapsoul: "modern trapsoul R&B, emotional chords, smooth 808 bass, atmospheric pads",
    "Dark Trap": "dark trap, sinister minor-key motif, hard 808s, crisp modern drums, cinematic atmosphere",
    "Lo-Fi Hip-Hop": "lo-fi hip hop, vintage dusty drums, emotional melodic chords, vinyl crackle, rainy night city atmosphere",
    "Melodic Trap":
      "melodic trap (hip-hop/rap, Atlanta style — not EDM trap), emotional minor-key piano or guitar motif, airy pads, modern rap drums, punchy 808 slides",
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
    "Hyperpop (Hip-Hop/R&B)": "hyperpop fused with hip-hop and modern R&B, glitchy synths, punchy 808s, distorted bass, emotive melodies",
    "Speed Garage": "speed garage, skippy UKG drums, heavy bassline, time-stretched vocal chops, energetic club bounce",
    "Drum and Bass": "drum and bass, fast breakbeats, rolling drums, deep sub bass, high energy, modern rave feel",
    "French Pop": "French pop (chanson-pop), catchy melodies, modern radio production, bright synths or guitars",
    "Baile Funk":
      "baile funk / Brazilian funk (Funk Mandelão), aggressive distorted kick and sharp synthetic snare, raw sawtooth lead riff, deep sub bass, hyped shouted male vocals with reverb/delay, DJ drops and vocal samples, relentless dancefloor groove",
    Afrotrap: "afrotrap, afro percussion bounce with trap drums and 808s, high energy, melodic motifs",
    Dancehall: "dancehall, Jamaican riddim groove, Caribbean bounce, heavy sub bass, modern drums",
  };

  const beatGenreMap: Record<string, string> = {
    Trapsoul:
      "A smooth, emotional trap soul instrumental built around a soft melodic piano loop with warm reverb. The 808 bass slides gently beneath atmospheric synth pads, while crisp hi-hats and a laid-back trap drum pattern create a dark romantic groove. The production is polished and cinematic, evoking late-night introspection.",
    "Dark Trap":
      "A menacing dark trap instrumental driven by a heavy distorted 808 sub bass that shakes the low end. A sinister minor key synth stab cuts through over aggressive layered snares and fast trap hi-hat patterns. The atmosphere is cold and cinematic, with dark pads building tension throughout. No vocals, pure instrumental.",
    "Lo-Fi Hip-Hop":
      "A vintage lo-fi hip hop instrumental built around emotional melodic chords with vinyl crackle, subtle scratches, and warm tape saturation. Use dusty boom bap drums with a relaxed swing, mellow bass, and a rainy night city atmosphere — perfect for study music. No vocals.",
    "Melodic Trap":
      "A modern melodic trap instrumental for hip-hop/rap (Atlanta style — not EDM trap), built around an emotional minor-key guitar or piano motif with airy pads. Use punchy rap drums with crisp rolling hi-hats, tight snare/clap, and clean 808 glides. Keep space for melodic rap vocals with a glossy, radio-ready mix. No full vocals.",
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
    "Hyperpop (Hip-Hop/R&B)":
      "A hyperpop-influenced hip-hop/R&B instrumental built around punchy 808s, glitchy synth layers, and a distorted but clean low end. Use energetic drums with crisp hats, modern trap percussion, and an emotive emo-pop melodic motif. Keep it maximal and futuristic, with space for melodic rap or R&B vocals. No full vocals.",
    "Speed Garage":
      "A modern speed garage instrumental with skippy UKG drums and a driving club bounce at around 130–140 BPM. Use heavy bassline movement, shuffled percussion, and time-stretched/pitched vocal chops as one-shots (no full vocals). Keep it energetic and club-ready with clean modern mix and strong groove.",
    "Drum and Bass":
      "A high-energy drum and bass instrumental built on fast breakbeats (around 160–180 BPM) with rolling drums, crisp snares, and deep sub-bass. Add energetic synth stabs, atmospheric pads, and tight transitions. Keep it modern and punchy, no full vocals.",
    "French Pop":
      "A modern French pop instrumental with a catchy melodic topline, bright synths or clean guitars, and a polished radio-ready groove. Use tight drums, warm bass, and uplifting chord movement. No vocals.",
    Soul:
      "A soulful instrumental built around warm gospel-influenced chords (Rhodes/piano) with a deep bassline and expressive melodic hooks. Use live-feel drums and tasteful horn or string accents for emotion. Keep it musical and smooth. No vocals.",
    Funk:
      "A funk instrumental focused on a tight syncopated groove: rhythmic guitar stabs, slap or fingerstyle bass, crisp drums, and horn hits. Keep it danceable, energetic, and locked-in with a strong pocket. No vocals.",
    "Baile Funk":
      "A heavy Brazilian baile funk instrumental (Funk Mandelão) driven by a pounding distorted kick and sharp synthetic snare over a deep sub bass foundation. A raw sawtooth synth lead plays a catchy, repetitive riff with fast percussive breaks. Add DJ drops and short chopped vocal stabs as one-shots (no full vocals). Build intense rises and filtered breakdowns, keeping a relentless dancefloor groove with raw Rio street energy.",
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

  const genre = (isSong ? songGenreMap[genreKey] ?? genreMap[genreKey] : beatGenreMap[genreKey] ?? genreMap[genreKey]) ?? genreKey;
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
    "Lo-Fi Hip-Hop": "lo-fi hip hop, vinyl crackle, rainy night, nostalgic warmth, dusty drums",
    "Melodic Trap": "hip-hop/rap melodic trap (Atlanta), emotional minor-key motif, airy pads, crisp modern rap drums, 808 glides, space for melodic flows",
    Reggaeton: "dembow rhythm, Latin urban vibe",
    Pop: "modern pop production, catchy synth melody, radio-ready polished sound",
    "UK Garage": "UK garage, 2-step rhythm, swingy syncopated drums, soulful vocal chops",
    "Hyperpop": "hyperpop, glitchy synths, high energy, distorted bass",
    "Hyperpop (Hip-Hop/R&B)": "hyperpop + hip-hop/R&B, glitchy synths, punchy 808s, distorted bass, emotive melodies",
    "Speed Garage": "speed garage, UKG-derived skippy drums, heavy bassline, time-stretched vocal chops, club bounce",
    "Drum and Bass": "drum and bass, fast breakbeats, rolling drums, deep sub-bass, energetic rave feel",
    "French Pop": "French pop, catchy melodies, polished radio-ready pop production",
    Soul: "soul, warm chords, expressive melody, live-feel groove",
    Funk: "funk, tight syncopated groove, slap bass, rhythmic guitar stabs, horn hits",
    "Baile Funk": "baile funk / Funk Mandelão, distorted kick, sharp snare, raw sawtooth lead riff, relentless groove",
    "Afrotrap": "afrotrap hybrid bounce, afro percussion layers with modern trap drums and heavy 808s",
    "Dancehall": "dancehall riddim groove, syncopated drums, skank-friendly pocket, heavy bass, club energy",
    "Jersey Club": "Jersey club bounce, rapid kick pattern, bed squeak, chopped vocal stabs, high energy",
  };
  const fingerprint = fingerprintByGenre[genreKey] ?? "";
  
  const swing = typeof params.swing === "number" && Number.isFinite(params.swing) ? Math.max(0, Math.min(100, params.swing)) : null;
  const swingDesc =
    swing == null || swing < 10
      ? ""
      : swing < 40
        ? "subtle bounce"
        : "bouncy rhythm";

  if (!isSong) {
    const extra = params.prompt?.trim();
    const description = beatGenreMap[genreKey] ?? (genreKey ? `A modern ${genreKey} instrumental.` : "A modern instrumental.");

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
  const genreKey = params.genre === "Auto" ? "" : params.genre;
  const byGenre: Record<string, string[]> = {
    Trapsoul: ["r&b/soul", "trap", "melodic", "2020s"],
    "Dark Trap": ["trap", "dark", "2020s"],
    "Lo-Fi Hip-Hop": ["lo-fi", "hip-hop/rap", "melancholic"],
    "Melodic Trap": ["hip-hop/rap", "trap", "melodic", "2020s"],
    "Contemporary Rap": ["hip-hop/rap", "rhythmic", "2020s"],
    "Old School Hip-Hop": ["hip-hop/rap", "rhythmic", "1990s"],
    Drill: ["hip-hop/rap", "aggressive", "dark", "2020s"],
    "UK Drill": ["hip-hop/rap", "dark", "2020s"],
    "NY Drill": ["hip-hop/rap", "aggressive", "2020s"],
    "90s R&B": ["r&b/soul", "1990s"],
    "Neo Soul": ["soul", "r&b/soul", "2000s"],
    Soul: ["soul", "r&b/soul", "2000s"],
    Funk: ["dance", "rhythmic", "2000s"],
    "Contemporary R&B": ["r&b/soul", "2020s"],
    "Lo-fi R&B": ["lo-fi", "r&b/soul", "melancholic"],
    Afrobeats: ["african", "dance", "2020s"],
    "Afro-drill": ["african", "hip-hop/rap", "dark", "2020s"],
    Amapiano: ["african", "house", "2020s"],
    House: ["house", "dance", "2020s"],
    Reggaeton: ["latin", "dance", "2020s"],
    "Latin Trap": ["latin", "trap", "2020s"],
    "Jersey Club": ["dance", "energetic", "2020s"],
    "Speed Garage": ["dance", "energetic", "2020s"],
    "Drum and Bass": ["dance", "energetic", "2020s"],
    "French Pop": ["melodic", "2020s"],
    "Hyperpop (Hip-Hop/R&B)": ["energetic", "melodic", "2020s"],
    PluggnB: ["hip-hop/rap", "r&b/soul", "melodic", "2020s"],
    Rage: ["hip-hop/rap", "energetic", "aggressive", "2020s"],
    "Atmospheric Rap": ["hip-hop/rap", "atmospheric", "2020s"],
    "Cloud Rap": ["hip-hop/rap", "atmospheric", "melodic", "2010s"],
    "Emo Rap": ["hip-hop/rap", "melancholic", "melodic", "2010s"],
    "Sad Rap": ["hip-hop/rap", "melancholic", "2010s"],
    "Emotional Trap": ["trap", "melodic", "melancholic", "2020s"],
    "Ambient Trap": ["trap", "atmospheric", "2020s"],
    "Cinematic Trap": ["trap", "dark", "2020s"],
    "Experimental Trap": ["trap", "dark", "atmospheric", "2020s"],
    "Sample Drill": ["hip-hop/rap", "dark", "rhythmic", "2020s"],
    "Melodic Drill": ["hip-hop/rap", "dark", "melodic", "2020s"],
    "Dark R&B": ["r&b/soul", "dark", "2020s"],
    "Future R&B": ["r&b/soul", "atmospheric", "2020s"],
    "Toxic R&B": ["r&b/soul", "dark", "2020s"],
    "Afro R&B": ["r&b/soul", "african", "smooth", "2020s"],
    "Afro House": ["african", "house", "dance", "2020s"],
    Latin: ["latin", "dance", "2020s"],
    Reggae: ["dance", "rhythmic", "2000s"],
    EDM: ["dance", "energetic", "2020s"],
    Chillstep: ["dance", "smooth", "atmospheric", "2020s"],
    Dubstep: ["dance", "aggressive", "dark", "2020s"],
    "Study Beats": ["lo-fi", "hip-hop/rap", "melancholic"],
    "Rage + Ambient": ["hip-hop/rap", "energetic", "atmospheric", "2020s"],
    "Ambient Drill": ["hip-hop/rap", "dark", "atmospheric", "2020s"],
    ...extendedGenreSonautoMap(),
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
    ...(byGenre[genreKey] ?? []),
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

