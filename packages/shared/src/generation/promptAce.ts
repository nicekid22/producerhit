import type { GenerateParams } from './types';
import { BASE_INFLUENCE_MAP, BASE_MOOD_MAP, ENERGY_MAP, REVERB_MAP } from './catalogMaps';
import { getExtendedAceTagMap, getExtendedBpmMap, getInfluenceMap, getMoodMap } from './extendedRegistry';

function resolveMoodMap(): Record<string, string> {
  return { ...BASE_MOOD_MAP, ...getMoodMap() };
}

function resolveInfluenceMap(): Record<string, string> {
  return { ...BASE_INFLUENCE_MAP, ...getInfluenceMap() };
}
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
    "Contemporary R&B": 105,
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
    ...getExtendedBpmMap(),
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
    "Contemporary R&B": "modern R&B, polished production, lush chords and textures, radio-ready mix",
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
    "Brazilian Phonk": "brazilian phonk, aggressive distorted bass, punchy cowbell patterns, raw club energy, fast groove, hard-hitting drums",
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
    ...getExtendedAceTagMap(),
  };

  const aceGenreTagsSong: Record<string, string> = {
    ...aceGenreTagsBeat,
    Pop: "pop song, catchy hook, modern radio production, bright synths, tight drums",
    Trapsoul: "trap soul song, R&B/hip-hop, emotional chords, smooth 808, intimate vibe",
    "Melodic Trap": "melodic rap song, hip-hop/rap (Atlanta), emotional guitar/piano, airy pads, 808 glides",
    "Baile Funk": "baile funk song, Funk Mandelão, distorted kick, sharp snare, saw lead riff, hyped vocals, DJ drops",
    Bachata: "bachata song, romantic nylon guitar, bongo and guira, Dominican slow dance, Spanish vocals",
    "Bachata Sensual": "bachata sensual song, legato guitar, sensual slow pulse, intimate partner dance, Spanish vocals",
    Salsa: "salsa song, clave montuno piano, congas timbales brass, high-energy dance, Spanish vocals",
    Kizomba: "kizomba song, slow sensual pulse, romantic chords, close-embrace sway, Portuguese vocals",
    "Zouk Love": "zouk love song, Caribbean romantic bounce, synth brass, intimate French-Creole vocal space",
    Dembow: "dembow song, Dominican riddim, perreo 808 bounce, club party energy, Spanish vocals",
    Cumbia: "cumbia song, shuffle groove guiro tambora, accordion hook, festive Latin dance, Spanish vocals",
    "Latin Pop": "latin pop song, bilingual catchy chorus, urbano crossover hooks, Spanish-English vocals",
    Merengue: "merengue song, fast tambora guira, accordion lead, Dominican party, Spanish vocals",
    "Worship Pop": "worship pop song, uplifting anthemic chorus, spiritual hopeful energy, congregational hooks",
    "Country Pop": "country pop song, acoustic storytelling, Nashville crossover chorus, English vocals",
    "Contemporary Country": "contemporary country song, Nashville pop-country production, storytelling English vocals",
    Bluegrass: "bluegrass song, banjo fiddle mandolin, fast Appalachian drive, vocal harmony space",
    Bollywood: "bollywood song, Hindi filmi orchestration, tabla sitar, cinematic strings, Hindi vocals",
    Bhangra: "bhangra song, dhol drums, Punjabi wedding bounce, Punjabi vocal hooks",
    Khaleeji: "khaleeji, Gulf Arabic pop groove, oud melody, darbuka riq, romantic Arabic vocals",
    "Arabic Pop": "arabic pop, quarter-tone melodic hooks, synth brass, Arabic melismatic vocals",
    Mahraganat: "mahraganat, Egyptian electro-shaabi, distorted synth stabs, auto-tune Arabic chants",
    Dabke: "dabke, Levantine wedding dance groove, mijwiz reed, darbuka stomp-clap pulse",
    "K-Pop Idol": "K-pop idol, stacked vocal harmonies, trap-pop drums, supersaw chorus drops, Korean hooks",
    Anison: "anison, anime opening energy, heroic chorus lift, fast drums, Japanese vocal belt",
    Metalcore: "metalcore song, screamed verses melodic chorus, breakdown drops, aggressive vocals",
    Ranchera: "ranchera song, mariachi trumpet, emotional Mexican serenade, Spanish vocals",
  };

  const genreTags = (isSong ? aceGenreTagsSong[genreKey] : aceGenreTagsBeat[genreKey]) || genreKey;
  const influence = resolveInfluenceMap()[params.influence] ?? params.influence;
  const mood = resolveMoodMap()[params.mood] ?? params.mood;
  const energy = ENERGY_MAP[params.energyLevel] ?? params.energyLevel;
  const reverb = REVERB_MAP[params.reverb] ?? params.reverb;

  const extraRaw = (params.prompt || "").trim();
  const { style: vocalStyle, rest: extraRest } = extractVocalStyle(extraRaw);
  const extra = limitChars(extraRest, 220);

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

