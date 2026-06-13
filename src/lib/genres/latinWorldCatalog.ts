/** Latin, Caribbean, Lusophone, world regional & high-growth SEO genres — ACE-Step XL 1.5 prompts. */
import type { ExtendedGenreDef } from "@/lib/genres/extendedCatalog";

function g(
  value: string,
  group: string,
  prompt: string,
  aceTags: string,
  bpm: number,
  sonautoTags: string[] = ["2020s", "latin"],
): ExtendedGenreDef {
  return { value, group, prompt, aceTags, bpm, sonautoTags };
}

export const LATIN_WORLD_GENRES: ExtendedGenreDef[] = [

  // ── Latin / Caribbean / Lusophone (Tier 1 SEO) ──
  g(
    "Bachata",
    "Latin / Caribbean / Lusophone",
    "bachata, requinto nylon guitar arpeggios in eighth-note syncopation, bongo tumbao pattern, güira scrape rhythm, warm round bass, romantic minor-key melody, Dominican dance pocket, intimate Spanish vocal space",
    "bachata, requinto guitar, bongo, guira, romantic minor melody, Dominican groove",
    130,
    ["latin", "melodic", "smooth", "2020s"],
  ),
  g(
    "Bachata Sensual",
    "Latin / Caribbean / Lusophone",
    "bachata sensual, legato electric guitar lead with long reverb tails, soft bongo accents, body-wave friendly slow pulse, warm sub bass, sensual minor-ninth chords, close-partner dance tension, breathy Spanish vocal phrasing",
    "bachata sensual, legato guitar, soft bongo, slow pulse, sensual minor chords",
    125,
    ["latin", "melodic", "smooth", "2020s"],
  ),
  g(
    "Salsa",
    "Latin / Caribbean / Lusophone",
    "salsa, clave-driven montuno piano tumbao, conga slap and tumbao patterns, timbale cascara and mambo bell hits, brass section fanfare stabs, walking bass tumbao, high-energy Cuban-Puerto Rican dancefloor lift",
    "salsa, clave, montuno piano, congas, timbales, brass stabs, montuno bass",
    180,
    ["latin", "dance", "energetic", "2020s"],
  ),
  g(
    "Kizomba",
    "Latin / Caribbean / Lusophone",
    "kizomba, slow sensual four-four pulse, soft R&B-influenced chord voicings, round sub bass heartbeat, brushed rimshot groove, airy pad swells, Angolan-Portuguese romantic flow, close-embrace dance sway, Portuguese vocal space",
    "kizomba, slow pulse, R&B chords, round sub, brushed rims, sensual sway",
    95,
    ["latin", "smooth", "melodic", "2020s"],
  ),
  g(
    "Zouk Love",
    "Latin / Caribbean / Lusophone",
    "zouk love, French Caribbean slow bounce, bright digital synth brass stabs, rolling tom fills, warm bass guitar slides, romantic major-seventh chord stacks, intimate call-response vocal hooks, Martinique-Guadeloupe night-club sway",
    "zouk love, Caribbean bounce, synth brass, tom fills, romantic seventh chords",
    90,
    ["latin", "smooth", "melodic", "2020s"],
  ),
  g(
    "Dembow",
    "Latin / Caribbean / Lusophone",
    "dembow, Dominican dembow kick-snare riddim pattern at perreo tempo, punchy 808 sub slides, syncopated open hi-hats, minimal dark synth stab loop, raw street-party energy, Spanish chant and ad-lib vocal space",
    "dembow, Dominican riddim, 808 sub, syncopated hats, dark synth stab, perreo",
    103,
    ["latin", "dance", "aggressive", "2020s"],
  ),
  g(
    "Cumbia",
    "Latin / Caribbean / Lusophone",
    "cumbia, cumbia two-four shuffle groove, güiro scrape and tambora drum accents, accordion or synth lead melody, warm bass tumbao, Colombian coastal swing, festive hand-clap pocket, Spanish vocal hook space",
    "cumbia, shuffle groove, guiro, tambora, accordion lead, Colombian swing",
    110,
    ["latin", "dance", "rhythmic", "2020s"],
  ),
  g(
    "Latin Pop",
    "Latin / Caribbean / Lusophone",
    "latin pop, bilingual catchy chorus hook, bright synth brass and guitar layers, dembow-influenced or four-four pop drums, warm bass groove, glossy ear-candy arps, crossover urbano-radio topline energy",
    "latin pop, catchy chorus, synth brass, pop drums, bilingual hook, urbano crossover",
    105,
    ["latin", "melodic", "energetic", "2020s"],
  ),
  g(
    "Merengue",
    "Latin / Caribbean / Lusophone",
    "merengue, fast two-step tambora and güira drive, accordion or sax melody lead, walking bass tumbao, Dominican party pulse at high tempo, brass shout accents, festive Spanish vocal chant hooks",
    "merengue, tambora, guira, accordion lead, fast two-step, Dominican party",
    135,
    ["latin", "dance", "energetic", "2020s"],
  ),
  g(
    "Perreo",
    "Latin / Caribbean / Lusophone",
    "perreo, low-end heavy dembow bounce, trunk-rattling 808 sub, minimal dark synth loop, sweaty club perreo pocket, reggaeton kick pattern with extra swing, Spanish explicit party vocal ad-libs",
    "perreo, dembow bounce, heavy 808, dark synth loop, club perreo pocket",
    92,
    ["latin", "dance", "aggressive", "2020s"],
  ),

  // ── Latin / Caribbean / Lusophone (Regional) ──
  g(
    "Regional Mexican",
    "Latin / Caribbean / Lusophone",
    "regional mexican, bajo sexto or nylon string arpeggios, tuba or tololoche bass line, polka-influenced snare pattern, accordion melodic hooks, norteño banda pocket, Spanish storytelling vocal space",
    "regional mexican, bajo sexto, tuba bass, accordion, norteño snare, banda pocket",
    110,
    ["latin", "melodic", "2020s"],
  ),
  g(
    "Corridos",
    "Latin / Caribbean / Lusophone",
    "corridos, nylon-string guitar arpeggio storytelling loop, tuba bass octaves, traditional corrido snare march, minor-key narrative melody, norteño accordion accents optional, Mexican regional vocal narrative space",
    "corridos, nylon guitar, tuba bass, corrido snare, narrative minor melody",
    120,
    ["latin", "melancholic", "2020s"],
  ),
  g(
    "Mariachi",
    "Latin / Caribbean / Lusophone",
    "mariachi, trumpets in unison fanfare lines, vihuela strum rhythm, guitarrón bass plucks, folk waltz or ranchera pulse, violin counter-melodies, celebratory Mexican ensemble lift, Spanish vocal chorus space",
    "mariachi, trumpets, vihuela, guitarron, violin, ranchera pulse, ensemble lift",
    100,
    ["latin", "melodic", "energetic", "2020s"],
  ),
  g(
    "Samba",
    "Latin / Caribbean / Lusophone",
    "samba, surdo bass drum pulse, pandeiro rim patterns, cavaquinho chord stabs, syncopated Brazilian swing, batucada percussion layers, carnival parade energy, Portuguese or Spanish vocal call space",
    "samba, surdo pulse, pandeiro, cavaquinho, batucada layers, carnival swing",
    100,
    ["latin", "dance", "energetic", "2020s"],
  ),
  g(
    "Forró",
    "Latin / Caribbean / Lusophone",
    "forró, accordion lead melody over zabumba bass drum and triangle tick, Northeast Brazil dance groove, syncopated forró pé-de-serra pocket, warm acoustic bass line, couples-dance two-step bounce, Portuguese vocal space",
    "forro, accordion lead, zabumba, triangle, pe-de-serra pocket, couples dance",
    110,
    ["latin", "dance", "rhythmic", "2020s"],
  ),
  g(
    "Sertanejo",
    "Latin / Caribbean / Lusophone",
    "sertanejo, Brazilian country-pop fusion, acoustic guitar strum with electric lead fills, cajón or pop drum groove, accordion or synth hook, warm bass, romantic Portuguese duet vocal space, rodeo-party energy",
    "sertanejo, acoustic guitar, accordion hook, pop drums, Portuguese duet, rodeo energy",
    95,
    ["latin", "melodic", "2020s"],
  ),
  g(
    "Champeta",
    "Latin / Caribbean / Lusophone",
    "champeta, Afro-Colombian coastal groove, chopped guitar or synth riff, heavy dembow-meets-cumbia kick pattern, Caribbean percussion layers, Cartagena street-party bounce, Spanish chant vocal hooks",
    "champeta, Afro-Colombian groove, chopped riff, coastal percussion, Cartagena bounce",
    105,
    ["latin", "dance", "energetic", "2020s"],
  ),
  g(
    "Guaracha",
    "Latin / Caribbean / Lusophone",
    "guaracha, fast four-on-the-floor kick with Latin percussion stacks, bright synth stab hooks, reggaeton-meets-electro club bounce, Colombian guaracha electrónica energy, shout vocal sample drops",
    "guaracha, four-on-floor, Latin percussion, synth stabs, electro club bounce",
    128,
    ["latin", "dance", "energetic", "2020s"],
  ),
  g(
    "Bolero",
    "Latin / Caribbean / Lusophone",
    "bolero, slow romantic ballad pulse, nylon guitar arpeggios with tremolo, soft brushed snare, string pad swells, Cuban bolero chord progression, intimate Spanish crooner vocal space",
    "bolero, slow ballad, nylon guitar tremolo, brushed snare, string pads, crooner vocal",
    72,
    ["latin", "smooth", "melancholic", "2020s"],
  ),
  g(
    "Latin Jazz",
    "Latin / Caribbean / Lusophone",
    "latin jazz, montuno piano tumbao over jazz swing ride cymbal, conga and bongo percussion solos, walking upright bass, brass horn lines with jazz voicings, smoky club improvisation space",
    "latin jazz, montuno piano, congas, jazz swing, upright bass, horn lines",
    120,
    ["latin", "jazz", "smooth", "2020s"],
  ),
  g(
    "Son Cubano",
    "Latin / Caribbean / Lusophone",
    "son cubano, tres guitar syncopated pattern, clave backbone, bongo martillo rhythm, call-response coro hooks, warm acoustic bass, Havana traditional dance pulse, Spanish vocal duet space",
    "son cubano, tres guitar, clave, bongo martillo, coro hooks, Havana pulse",
    110,
    ["latin", "rhythmic", "2020s"],
  ),
  g(
    "Vallenato",
    "Latin / Caribbean / Lusophone",
    "vallenato, accordion lead melody with caja vallenata snare and guacharaca scrape, Colombian coastal folk groove, narrative storytelling mood, warm bass, Spanish vocal corrido-style phrasing",
    "vallenato, accordion lead, caja snare, guacharaca, Colombian folk narrative",
    105,
    ["latin", "melodic", "2020s"],
  ),
  g(
    "Kompa",
    "Latin / Caribbean / Lusophone",
    "kompa, Haitian konpa direk groove, bright horn section hits, driving snare backbeat, syncopated guitar skank, warm bass tumbao, carnival dancefloor lift, Haitian Creole and French vocal space",
    "kompa, konpa direk, horn hits, snare backbeat, guitar skank, carnival lift",
    110,
    ["latin", "dance", "energetic", "2020s"],
  ),
  g(
    "Soca",
    "Latin / Caribbean / Lusophone",
    "soca, Trinidad carnival pulse, fast four-on-the-floor kick with steelpan-inspired synth leads, punchy snare accents, brass stab hooks, sweaty road-march energy, call-response vocal chants",
    "soca, carnival pulse, steelpan synth, brass stabs, road-march energy, vocal chants",
    120,
    ["latin", "dance", "energetic", "2020s"],
  ),
  g(
    "Flamenco",
    "Latin / Caribbean / Lusophone",
    "flamenco, nylon guitar rasgueo strumming, palmas handclap accents, cajón percussion hits, Phrygian dominant melodic ornaments, passionate cante jondo vocal cry space, Andalusian dramatic tension",
    "flamenco, rasgueo guitar, palmas claps, cajon, Phrygian ornaments, cante jondo",
    120,
    ["latin", "aggressive", "melodic", "2020s"],
  ),
  g(
    "Tango",
    "Latin / Caribbean / Lusophone",
    "tango, bandoneón lead melody with dramatic rubato swells, staccato string stabs, upright bass walk, crisp snare rim accents, Buenos Aires melancholic minor progression, passionate Spanish vocal narrative",
    "tango, bandoneon lead, staccato strings, upright bass, melancholic minor, rubato",
    120,
    ["latin", "melancholic", "melodic", "2020s"],
  ),
  g(
    "Semba",
    "Latin / Caribbean / Lusophone",
    "semba, Angolan semba guitar pick pattern, light percussion shuffle, warm bass groove, upbeat danceable swing, roots of kizomba energy, Portuguese vocal call-response hooks",
    "semba, Angolan guitar pick, percussion shuffle, warm bass, upbeat dance swing",
    95,
    ["latin", "african", "dance", "2020s"],
  ),
  g(
    "Kuduro",
    "Latin / Caribbean / Lusophone",
    "kuduro, Angolan kuduro four-on-the-floor kick with syncopated percussion bursts, abrasive synth stab hooks, rapid-fire vocal chant space, high-energy Luanda club bounce, distorted bass hits",
    "kuduro, four-on-floor kick, syncopated percussion, synth stabs, Luanda club bounce",
    140,
    ["latin", "african", "aggressive", "2020s"],
  ),

  // ── Faith / Americana (US growth genres) ──
  g(
    "Worship Pop",
    "Faith / Americana",
    "worship pop, uplifting major-key chord stacks, wide pad swells, steady kick-snare build arcs, anthemic chorus lift space, electric guitar delay trails, congregational call-response vocal hooks, spiritual hopeful energy",
    "worship pop, major chords, pad swells, anthemic chorus, congregational hooks",
    75,
    ["melodic", "energetic", "2020s"],
  ),
  g(
    "Gospel Worship",
    "Faith / Americana",
    "gospel worship, Hammond organ chord swells, driving gospel kick-snare pocket, choir stack harmony space, handclap breakdown accents, church tambourine shimmer, powerful spiritual crescendo lifts",
    "gospel worship, Hammond organ, gospel drums, choir stacks, handclap breakdowns",
    85,
    ["soul", "energetic", "2020s"],
  ),
  g(
    "Country Pop",
    "Faith / Americana",
    "country pop, bright acoustic guitar strum with electric lead licks, steady kick-snare groove, pedal steel or fiddle accent hooks, warm bass, Nashville crossover chorus lift, storytelling English vocal space",
    "country pop, acoustic guitar, pedal steel, Nashville groove, crossover chorus",
    110,
    ["melodic", "2020s"],
  ),
  g(
    "Outlaw Country",
    "Faith / Americana",
    "outlaw country, raw acoustic guitar fingerpicking, brushed snare and kick thump, honky-tonk piano accents, pedal steel cry lines, gritty bar-room narrative mood, rebellious storytelling vocal space",
    "outlaw country, fingerpick guitar, brushed snare, honky-tonk piano, pedal steel",
    95,
    ["melancholic", "2020s"],
  ),

  // ── Global / Rising (phonk, rock revival, afro) ──
  g(
    "Memphis Phonk",
    "Global / Rising",
    "Memphis phonk, dusty lo-fi drum breaks, pitched-down vocal chop samples, cowbell hook stabs, distorted 808 sub slides, tape-saturated Memphis rap sample texture, dark trunk-rattle groove",
    "Memphis phonk, lo-fi breaks, vocal chops, cowbell, distorted 808, tape saturation",
    140,
    ["aggressive", "hip-hop/rap", "2020s"],
  ),
  g(
    "Nu-Metal",
    "Global / Rising",
    "nu-metal, downtuned distorted guitar power chords, punchy hip-hop influenced kick-snare, DJ scratch or sample layer accents, aggressive half-time breakdown drops, rap-rock vocal shout space, Y2K revival mosh energy",
    "nu-metal, downtuned guitars, hip-hop drums, breakdown drops, rap-rock vocals",
    130,
    ["rock", "aggressive", "2000s"],
  ),
  g(
    "Afro-Pop",
    "Global / Rising",
    "afro-pop, bright West African guitar licks, percussive talking drum layers, danceable four-four kick, catchy pidgin or English chorus hooks, warm sub bass, Lagos-Accra radio crossover energy",
    "afro-pop, West African guitar, talking drums, catchy chorus, Lagos crossover",
    105,
    ["african", "melodic", "energetic", "2020s"],
  ),
  g(
    "Gqom",
    "Global / Rising",
    "gqom, South African minimal house pulse, hard kick thump with sparse percussion ticks, dark sub bass drones, Durban club hypnotic repetition, Zulu chant vocal sample space, raw warehouse tension",
    "gqom, minimal house pulse, hard kick, sub drones, Durban club, Zulu chants",
    125,
    ["african", "dance", "dark", "2020s"],
  ),
  g(
    "Fado",
    "World / Regional",
    "fado, Portuguese fado guitar arpeggios with mournful rubato, classical guitar accompaniment, sparse brushed percussion, melancholic minor-key progression, saudade emotional vocal cry space, Lisbon tavern intimacy",
    "fado, fado guitar, classical guitar, minor progression, saudade vocal, Lisbon mood",
    80,
    ["melancholic", "smooth", "2020s"],
  ),
  g(
    "Raï",
    "World / Regional",
    "raï, North African raï groove, accordion or synth lead over darbuka and bendir percussion, Arabic scale melodic ornaments, Oran-Algeria dance pulse, French-Arabic bilingual vocal hooks",
    "rai, darbuka, accordion lead, Arabic ornaments, Oran dance pulse, bilingual vocal",
    110,
    ["rhythmic", "melodic", "2020s"],
  ),
  g(
    "Cumbia Sonidera",
    "World / Regional",
    "cumbia sonidera, Mexican sonidero cumbia shuffle, deep reverb synth organ stabs, loudspeaker-party bass weight, guiro and tambora drive, Mexico City-Colombia diaspora dance pulse, Spanish shout vocal drops",
    "cumbia sonidera, sonidero shuffle, reverb organ, party bass, guiro tambora",
    108,
    ["latin", "dance", "2020s"],
  ),
  g(
    "Pagode",
    "World / Regional",
    "pagode, Brazilian pagode samba groove, cavaquinho chord comping, tan-tan and pandeiro layers, intimate roda de samba circle feel, warm acoustic bass, Portuguese group vocal coro space",
    "pagode, cavaquinho, pandeiro, roda de samba, acoustic bass, group coro",
    98,
    ["latin", "dance", "smooth", "2020s"],
  ),
  g(
    "Banda",
    "World / Regional",
    "banda, Mexican banda sinaloense brass section power, tuba bass foundation, polka-influenced snare drive, clarinet and trumpet melodic hooks, norteño party shout energy, Spanish vocal chorus space",
    "banda, brass section, tuba bass, polka snare, clarinet trumpet, party energy",
    112,
    ["latin", "energetic", "2020s"],
  ),
  g(
    "Mambo",
    "World / Regional",
    "mambo, big-band mambo brass fanfare, timbale bell and cascara patterns, conga tumbao, upright bass walk, high-energy Latin ballroom pulse, horn mambo shout accents, Spanish vocal exclamations",
    "mambo, big-band brass, timbales, congas, ballroom pulse, horn shouts",
    170,
    ["latin", "dance", "energetic", "2020s"],
  ),
];

export function latinWorldGenrePromptMap(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const item of LATIN_WORLD_GENRES) out[item.value] = item.prompt;
  return out;
}

export function latinWorldGenreAceTagMap(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const item of LATIN_WORLD_GENRES) out[item.value] = item.aceTags;
  return out;
}

export function latinWorldGenreBpmMap(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const item of LATIN_WORLD_GENRES) out[item.value] = item.bpm;
  return out;
}

export function latinWorldGenreSonautoMap(): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const item of LATIN_WORLD_GENRES) out[item.value] = item.sonautoTags;
  return out;
}
