import type { StructuredCoverPromptInput } from "./coverPrompt";
import { COVER_LIGHTING_PRESETS, COVER_STYLE_PRESETS } from "./coverPrompt";
import { LOOP_CARD_COVER_FUTUR_RETRO_ENABLED } from "./loopCardCoverFuturRetro";

/**
 * TEST MODE — tout pousser dans l'univers anime/manga/glitch.
 * Passer à `false` pour revenir au mix normal (sans supprimer la catégorie/library).
 * Pas de fichier séparé : un seul flag à toucher pour rollback.
 */
const LOOP_CARD_COVER_ANIME_MANGA_GLITCH_ENABLED = true;
/** 0-10 : agressivité du bias. 10 = quasi 100% anime. */
const ANIME_MANGA_GLITCH_BIAS = 10;

/** Expanded pools for surprise combinations (album-art oriented, not portrait-heavy). */
export const COVER_SURPRISE_LIGHTING = [
  ...COVER_LIGHTING_PRESETS,
  "golden hour glow",
  "hard flash editorial",
  "backlit silhouette",
  "colored gel wash",
  "overcast softbox",
  "underwater caustics",
  "hologram projection spill",
  "CRT scanline phosphor bloom",
  "analog light leak streak",
  // --- Premium cel-shaded/ink/glitch lighting additions (style only, no characters) ---
  "cel-shaded rim light glow",
  "ink wash cover album contrast lighting",
  "glitch scan flicker light",
  "cel-shade key light with hard shadow break",
  "neon backlight with chromatic bleed",
  "studio cel-shaded three-point lighting",
  "VHS tracking glow flicker",
  "datamosh light smear",
  "cel-shaded cover album rim light glow",
  "cel-shaded cover album cinematic key light",
  "cel-shaded cover album golden hour lighting",
  "cel-shaded moonlight ambience",
  "cel-shaded sunrise glow",
  "cel-shaded sunset backlight",
  "cel-shaded soft ambient light",
  "cel-shaded volumetric light rays",
  "cel-shaded dreamy bloom",
  "cel-shaded ethereal glow",
  "ink wash contrast lighting",
  "ink wash dramatic shadows",
  "ink wash noir lighting",
  "crosshatch ink shadows",
  "high contrast ink shading",
  "cel-shade key light with hard shadow break",
  "cel-shaded dramatic highlights",
  "cel-shaded soft bounce light",
  "stylized cel-shaded edge lighting",
  "stylized cinematic rim light",
  "neon backlight with chromatic bleed",
  "cyberpunk neon reflections",
  "electric blue neon glow",
  "purple neon edge lighting",
  "cyan magenta dual lighting",
  "Tokyo neon night lighting",
  "rain soaked neon reflections",
  "holographic iridescent lighting",
  "studio cel-shaded three-point lighting",
  "professional softbox lighting",
  "cinematic studio spotlight",
  "high-key cel-shaded lighting",
  "low-key cinematic lighting",
  "volumetric god rays",
  "volumetric fog lighting",
  "misty atmospheric lighting",
  "light scattering bloom",
  "lens bloom highlights",
  "glowing particle illumination",
  "ambient occlusion lighting",
  "glitch scan flicker light",
  "VHS tracking glow flicker",
  "datamosh light smear",
  "CRT phosphor glow",
  "analog light leak effect",
  "RGB split lighting",
  "chromatic aberration glow",
  "prism light refraction",
  "cinematic color grading",
  "IMAX cinematic illumination",
] as const;

export const COVER_SURPRISE_STYLES = [
  ...COVER_STYLE_PRESETS,
  "3D render octane",
  "risograph print texture",
  "collage mixed media",
  "infrared photography",
  "isometric illustration",
  "brutalist poster design",
  "vaporwave aesthetic",
  "ink wash illustration",
  "retro-future synthwave album art",
  "holographic foil with film grain",
  "CRT phosphor glow aesthetic",
  "degraded gradient mesh poster",
  "cel-shaded illustration with film grain",
  "halftone screentone poster",
  "glitch RGB split artwork",
  // --- Premium cel-shaded/ink/glitch style additions (no people, background/object art only) ---
  "premium cel-shaded key visual, no characters, ultra detailed linework",
  "graphic novel cover illustration, no characters, polished inking",
  "cel-shaded illustration, no people, studio production quality",
  "cel-shaded poster illustration, no characters, dramatic rim light, 4K detail",
  "screentone halftone, no characters, high contrast inking",
  "digital cel-shaded painting, no people, soft shading, crisp linework",
  "glitch-corrupted cel-shaded key visual, no characters, chromatic aberration",
  "databend ink panel art, no characters, premium finish",
  "retro cel-shaded VHS aesthetic, no people, high fidelity grain",
  "cyber-glitch graphic novel cover, no characters, neon accent linework",
  "cel-shaded novel cover album illustration, no people, refined detail",
  "ink wash illustration with digital glitch overlay, no characters",
] as const;

const MOODS = [
  "dreamy",
  "melancholic",
  "euphoric",
  "mysterious",
  "aggressive",
  "nostalgic",
  "ethereal",
  "raw",
  "playful",
  "cinematic",
  "lonely",
  "hypnotic",
  "rebellious",
  "serene",
  "chaotic",
] as const;

const PALETTES = [
  "deep orange and blue",
  "neon pink and black",
  "monochrome blue",
  "gold and charcoal",
  "teal and coral",
  "lavender and cream",
  "rust and sage",
  "electric cyan and magenta",
  "warm sepia and ivory",
  "slate grey and amber",
  "pastel mint and blush",
  "blood red and coal black",
  "sunset peach and violet",
  "forest green and copper",
  "ice blue and silver",
  "holographic cyan magenta shift",
  "laser amber on midnight purple",
  "iridescent oil slick on deep navy",
] as const;

type SurpriseCategory =
  | "abstract"
  | "nature"
  | "urban"
  | "objects"
  | "surreal"
  | "retro"
  | "digital"
  | "cosmic"
  | "minimal"
  | "texture"
  | "flora"
  | "architecture"
  | "aquatic"
  | "vehicles"
  | "futurRetro"
  | "animeMangaGlitch";

const CATEGORY_SUBJECTS: Record<SurpriseCategory, readonly string[]> = {
  abstract: [
    "floating chrome spheres in void",
    "liquid metal ripple surface",
    "bold color field gradient blocks",
    "intersecting geometric planes",
    "shattered glass kaleidoscope",
    "soft gradient orb halos",
    "twisted ribbon sculptural forms",
    "mosaic triangle tessellation",
    "ink drop diffusion in water",
    "chromatic aberration light bands",
    "honeycomb lattice glow",
    "paper cut layered shapes",
    "brushed aluminum texture field",
    "holographic foil folds",
    "minimal sine wave curves",
    "pixel sorting glitch bands",
    "molten wax color pooling",
    "smoky pigment clouds",
    "prismatic light refraction",
    "overlapping translucent discs",
  ],
  nature: [
    "lone pine on misty ridge",
    "dramatic storm cloud horizon",
    "bioluminescent forest path",
    "desert sand dune ridge at dusk",
    "frozen lake mirror reflection",
    "volcanic lava flow glow",
    "waterfall long exposure silk",
    "alpine peak above clouds",
    "wheat field golden hour",
    "mossy boulder in creek",
    "northern lights over still lake",
    "tropical leaf macro dewdrops",
    "red canyon rock layers",
    "foggy coastal cliffs",
    "cherry blossom petals falling",
    "lightning strike over prairie",
    "mangrove roots in calm water",
    "autumn maple canopy",
    "cactus silhouette at sunset",
    "ocean wave crest frozen splash",
  ],
  urban: [
    "rain-slick neon alley reflections",
    "brutalist concrete facade symmetry",
    "subway tunnel vanishing point",
    "rooftop city skyline at night",
    "abandoned warehouse interior",
    "flickering street lamp in fog",
    "graffiti texture wall abstract",
    "highway overpass at blue hour",
    "convenience store glow interior",
    "fire escape zigzag shadows",
    "parking garage concrete levels",
    "bridge cables against sky",
    "urban puddle mirror lights",
    "construction crane silhouette",
    "metro escalator motion blur",
    "corner shop fluorescent haze",
    "aerial city grid lights night",
    "steam vent on cobblestone",
    "chain link fence bokeh lights",
    "dilapidated cinema marquee glow",
  ],
  objects: [
    "vintage cassette tape stack",
    "worn leather jacket on chair",
    "studio microphone close-up",
    "cracked vinyl record macro",
    "analog synthesizer knobs",
    "boxing gloves on hook",
    "motorcycle helmet visor reflection",
    "crystal whisky glass low key",
    "wilting rose in glass bottle",
    "stack of empty polaroid frames",
    "diamond ring on velvet",
    "retro game cartridge pile",
    "cigarette smoke trail abstract",
    "coffee cup steam morning light",
    "basketball on cracked court",
    "sneakers on power line",
    "pearl necklace on marble",
    "melting candle wax drip",
    "old film camera on map",
    "gold chain on dark silk",
  ],
  surreal: [
    "staircase ascending into clouds",
    "giant moon over wheat field",
    "floating stone islands",
    "door frame standing in desert",
    "fish swimming through cloudy sky",
    "melting clock on tree branch",
    "hands reaching from still water",
    "infinite mirror corridor",
    "balloon lifting small house",
    "whale silhouette in cloudy sky",
    "upside down room interior",
    "crystal cluster growing from soil",
    "tree with galaxy canopy",
    "smoke figure dissolving in wind",
    "floating piano in ocean",
    "ladder to nowhere in fog",
    "umbrella with rain falling upward",
    "ceramic bust cracked with flowers",
    "sleeping giant as mountain ridge",
    "hourglass filled with ocean waves",
  ],
  retro: [
    "VHS static color bars",
    "80s sunset grid horizon",
    "faded polaroid color wash",
    "CRT screen glow abstract",
    "disco ball light spots",
    "rotary phone cord spiral",
    "neon palm retrowave scene",
    "vintage car dashboard lights",
    "washed film border light leak",
    "halftone dot pattern abstract",
    "ticket stub collage texture",
    "faded newspaper texture",
    "bowling alley lane glow",
    "roller rink floor reflection",
    "arcade cabinet silhouette row",
  ],
  digital: [
    "RGB split glitch silhouette",
    "datamosh color smear",
    "wireframe landscape grid",
    "low poly mountain sunset",
    "terminal green matrix rain",
    "network node constellation",
    "floating UI window stack",
    "abstract barcode pattern",
    "scanner laser beam stripe",
    "depth map gradient relief",
    "neural web node pattern",
    "voxel art city block",
    "ascii texture field",
    "hologram wire statue",
    "cyber grid floor infinity",
    "cel-shaded geometric symbol, no characters",
    "halftone screentone texture field, no characters",
    "glitch tear on retro pixel landscape",
  ],
  cosmic: [
    "spiral galaxy core vibrant",
    "astronaut glove reaching void",
    "planet rings close-up",
    "nebula cloud pillars",
    "asteroid belt sparkle",
    "lunar surface with earthrise",
    "solar flare eruption edge",
    "black hole accretion disk",
    "comet streak night sky",
    "satellite orbiting blue planet",
    "star field milky way band",
    "space station window view",
    "cosmic dust cloud pink",
    "eclipse corona glow",
    "meteor shower long exposure",
  ],
  minimal: [
    "single circle on flat color",
    "thin line drawing mountain",
    "bold abstract monogram shape",
    "negative space leaf cutout",
    "one red dot on grey field",
    "concentric ring target minimal",
    "torn paper edge reveal",
    "single vertical bar spotlight",
    "half sun circle on horizon",
    "drop shadow square stack",
    "wire arc on black void",
    "single brush stroke gesture",
    "folded corner white paper",
    "minimalist wave line art",
    "simple sculptural heart form",
  ],
  texture: [
    "cracked dry mud macro",
    "rust metal peeling layers",
    "marble vein swirl close-up",
    "bubble wrap light refraction",
    "sand ripple macro pattern",
    "oil on water rainbow film",
    "concrete aggregate macro",
    "velvet fabric fold shadow",
    "ice crystal frost macro",
    "cork texture warm brown",
    "snake skin scale pattern",
    "wood grain rings close-up",
    "terrazzo chip mosaic",
    "linen weave macro",
    "volcanic rock porous macro",
  ],
  flora: [
    "monstera leaf shadow on wall",
    "dried pampas grass bouquet",
    "sunflower field low angle",
    "orchid petal macro with dew",
    "ivy crawling brick wall",
    "lavender rows purple haze",
    "succulent arrangement top-down",
    "bamboo forest vertical lines",
    "fern frond unfurling spiral",
    "lotus floating on pond",
    "wildflower meadow soft blur",
    "bonsai tree on stone slab",
  ],
  architecture: [
    "gothic cathedral arch symmetry",
    "modern glass skyscraper angle",
    "japanese torii gate in mist",
    "spiral staircase looking up",
    "courtyard fountain geometric",
    "art deco lobby chandelier",
    "ancient ruin column golden",
    "mosque dome geometric tile",
    "brutalist bunker slit window",
    "wooden cabin in snow",
    "lighthouse beam through fog",
    "zen garden rake wave patterns",
  ],
  aquatic: [
    "jellyfish glow deep blue",
    "koi fish pond top view",
    "underwater sun ray caustics",
    "coral reef vibrant macro",
    "surfer inside wave barrel",
    "rain drops on lake surface",
    "iceberg tip arctic calm",
    "shipwreck silhouette in depth",
    "dolphin jump splash freeze",
    "tidal pool with starfish",
  ],
  vehicles: [
    "muscle car front grille chrome",
    "motorcycle speed motion blur",
    "skateboard deck worn graphic",
    "airplane contrail minimal sky",
    "sailboat white sails horizon",
    "train locomotive steam vintage",
    "bicycle wheel spin abstract",
    "hot rod flame paint close-up",
  ],
  futurRetro: [
    "holographic rain on wet asphalt",
    "chrome monolith in purple fog",
    "retro sunset grid horizon glow",
    "floating wireframe pyramid in void",
    "VHS static over neon city bokeh",
    "cassette futurism gradient bleed",
    "laser grid floor with low mist",
    "iridescent disc floating in darkness",
    "analog clock dial glitching glow",
    "CRT ghost image double exposure",
    "retro terminal green glow on concrete",
    "hologram statue dissolving into particles",
    "synthwave palm silhouette scanlines",
    "degraded mesh gradient portal shape",
    "film grain tunnel of neon arches",
    "retro joystick silhouette in fog",
    "prismatic light leak on black void",
    "orbiting rings around matte sphere",
    "broken mirror shards with cyan flare",
    "retro radar sweep on starfield",
    "ink speed lines burst on dark void, no characters",
    "cel-shaded moon over glitch horizon",
    "RGB split torii gate in neon rain, no characters",
    "cel-shaded sky gradient with datamosh tear",
    "screentone halftone on chrome orb",
    "glitch corrupted retro sunset grid",
    "cel-shaded floating crystals in fog",
    "ink panel frames collage abstract, no characters",
    "cel-shaded lens flare on wireframe pyramid",
    "pixel glitch halo over cassette stack",
    "datamosh smear on laser grid floor",
    "ink crosshatch on hologram rain, no characters",
  ],
  // NOTE: every entry below is background/object/landscape only — no people, no characters,
  // no faces, no figures, no silhouettes of a person. Style words are technique-based
  // (cel-shaded, ink, screentone, glitch) rather than the bare "anime"/"manga" tag to avoid
  // pulling character-heavy training data into generation.
  animeMangaGlitch: [
    "cel-shaded lo-fi city rooftops at night, empty streets, no people",
    "cel-shaded neon cityscape at night, empty streets, cinematic atmosphere, subtle RGB glitch, no people",
    "cel-shaded floating islands above glowing clouds, digital distortion, no characters",
    "cyberpunk alley with holographic signs, empty, datamosh glitch effects, no people",
    "cel-shaded Japanese shrine courtyard under cherry blossoms, empty, chromatic aberration, no people",
    "abandoned train station platform with neon reflections, no people, VHS glitch aesthetic",
    "dreamlike celestial temple floating in space, no characters, pixel corruption",
    "glowing torii gates disappearing into digital fog, empty path, cel-shaded lighting, no people",
    "crystal cave illuminated by holographic light, no characters, RGB split distortion",
    "cel-shaded skyline at sunset, empty horizon, databend effects, no people",
    "futuristic rooftop overlooking a neon metropolis, empty, subtle VHS artifacts, no people",
    "enchanted forest with glowing mushrooms and glitch particles, no characters",
    "floating monoliths surrounded by digital static and cosmic sky, no characters",
    "chrome katana resting on reflective stone, cel-shaded lighting, no characters, no hands",
    "ancient pagoda under a galaxy sky, empty, pixel-glitch atmosphere, no people",
    "retro arcade filled with neon lights and corrupted screens, empty, no people",
    "cyber shrine with holographic lanterns and digital rain, no characters",
    "moonlit bamboo forest with chromatic glitch trails, no people",
    "glowing koi pond with holographic water reflections, no people",
    "cel-shaded mountain landscape with aurora and RGB distortion, no characters",
    "floating crystal cathedral surrounded by digital clouds, no characters",
    "vinyl toy display shelf, cel-shaded lighting, dramatic speed lines, no characters, no faces",
    "cel-shaded ink horizon over empty landscape, no people",
    "cel-shaded cherry blossoms with RGB split glitch, no people",
    "ink panel collage with torn glitch edges, no characters",
    "glitch katana close-up reflection, cel-shaded chrome highlights, no characters, no hands",
    "cel-shaded sunset gradient art, no people",
    "cel-shaded geometric emblem, fully rendered, pixel-glitch overlay, no characters, no faces",
    "ink-style city skyline, no characters, no people",
    "cyberpunk cel-shaded alley, empty, glitch neon signage, no characters",
    "cel-shaded mecha armor plating fragment on display stand, glitch chrome details, no characters, no pilot",
    "screentone ink moon over corrupted skyline, no people",
    "empty rooftop water tank scene, cel-shaded lighting, glitch light leak, no characters",
    "databent ink cover art, premium linework intact, abstract symbol only, no characters",
    "cel-shaded flame motif dissolving into glitch particles, no characters, no figures",
    "ink volume spine art, glitch color separation, no characters",
    "cel-shaded music instrument close-up, fully detailed engraved surface, VHS tracking glitch, no characters",
    "cel-shaded rain umbrella close-up on empty street, no characters, chromatic glitch trails",
    "ink sumi-e brushwork landscape with digital corruption, no people",
    "cel-shaded galaxy backdrop, glitch starfield distortion, no characters",
  ],
};

/** Genre keywords → preferred surprise categories (still mixes in others sometimes). */
const GENRE_CATEGORY_BOOST: Record<string, SurpriseCategory[]> = {
  trap: ["urban", "futurRetro", "animeMangaGlitch", "objects", "digital", "texture"],
  drill: ["urban", "futurRetro", "animeMangaGlitch", "texture", "objects", "vehicles"],
  "hip hop": ["urban", "futurRetro", "objects", "retro", "texture"],
  "hip-hop": ["urban", "futurRetro", "objects", "retro", "texture"],
  rap: ["urban", "futurRetro", "objects", "texture", "vehicles"],
  "lo-fi": ["retro", "futurRetro", "objects", "minimal", "aquatic", "nature"],
  lofi: ["retro", "futurRetro", "objects", "minimal", "aquatic", "nature"],
  "lo fi": ["retro", "futurRetro", "objects", "minimal", "aquatic"],
  ambient: ["cosmic", "futurRetro", "nature", "minimal", "abstract", "aquatic"],
  house: ["digital", "futurRetro", "abstract", "retro", "urban"],
  techno: ["digital", "futurRetro", "abstract", "urban", "texture"],
  edm: ["digital", "futurRetro", "abstract", "cosmic", "retro"],
  jazz: ["objects", "minimal", "architecture", "texture"],
  rock: ["objects", "nature", "vehicles", "texture"],
  metal: ["texture", "surreal", "architecture", "cosmic"],
  pop: ["flora", "abstract", "retro", "minimal"],
  rnb: ["objects", "minimal", "architecture", "flora"],
  "r&b": ["objects", "minimal", "architecture", "flora"],
  soul: ["objects", "retro", "minimal", "architecture"],
  classical: ["architecture", "minimal", "nature", "texture"],
  country: ["nature", "vehicles", "objects", "architecture"],
  folk: ["nature", "minimal", "architecture", "flora"],
  reggae: ["nature", "flora", "retro", "aquatic"],
  latin: ["flora", "urban", "objects", "retro"],
  afro: ["texture", "flora", "abstract", "urban"],
  punk: ["urban", "texture", "objects", "surreal"],
  emo: ["surreal", "urban", "nature", "texture", "animeMangaGlitch"],
  indie: ["nature", "retro", "minimal", "flora"],
  phonk: ["vehicles", "urban", "futurRetro", "animeMangaGlitch", "retro", "texture"],
  wave: ["cosmic", "futurRetro", "animeMangaGlitch", "digital", "surreal", "abstract"],
  synth: ["retro", "futurRetro", "animeMangaGlitch", "digital", "cosmic", "abstract"],
  trapsoul: ["futurRetro", "animeMangaGlitch", "abstract", "retro", "minimal", "objects"],
  amapiano: ["futurRetro", "abstract", "flora", "texture", "retro"],
  anime: ["animeMangaGlitch", "futurRetro", "digital"],
  manga: ["animeMangaGlitch", "futurRetro", "digital"],
  glitch: ["animeMangaGlitch", "digital", "futurRetro"],
  cyberpunk: ["animeMangaGlitch", "futurRetro", "digital", "urban"],
  vocaloid: ["animeMangaGlitch", "digital", "futurRetro"],
  hyperpop: ["animeMangaGlitch", "digital", "futurRetro", "abstract"],
};

type TaggedSurprise = StructuredCoverPromptInput & { category: SurpriseCategory };

let cachedLibrary: TaggedSurprise[] | null = null;

function hashPick(seed: number, length: number): number {
  let t = (seed >>> 0) + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) % Math.max(1, length);
}

function buildTaggedLibrary(): TaggedSurprise[] {
  const entries: TaggedSurprise[] = [];
  const categories = Object.keys(CATEGORY_SUBJECTS) as SurpriseCategory[];

  for (const category of categories) {
    const subjects = CATEGORY_SUBJECTS[category];
    subjects.forEach((subject, i) => {
      entries.push({
        category,
        subject,
        mood: MOODS[(i + categories.indexOf(category)) % MOODS.length]!,
        palette: PALETTES[(i * 3 + categories.indexOf(category)) % PALETTES.length]!,
        lighting: COVER_SURPRISE_LIGHTING[(i + category.length) % COVER_SURPRISE_LIGHTING.length]!,
        style: COVER_SURPRISE_STYLES[(i * 2) % COVER_SURPRISE_STYLES.length]!,
      });
    });
  }

  return entries;
}

export function getCoverSurpriseLibrary(): readonly StructuredCoverPromptInput[] {
  if (!cachedLibrary) cachedLibrary = buildTaggedLibrary();
  return cachedLibrary;
}

export function getCoverSurpriseIdeasCount(): number {
  return getCoverSurpriseLibrary().length;
}

function resolveBoostedCategories(loop?: {
  genre?: string;
  mood?: string;
  influence?: string;
}): SurpriseCategory[] | null {
  const haystack = [loop?.genre, loop?.mood, loop?.influence]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (!haystack.trim()) return null;

  const matched = new Set<SurpriseCategory>();
  for (const [keyword, cats] of Object.entries(GENRE_CATEGORY_BOOST)) {
    if (haystack.includes(keyword)) {
      for (const c of cats) matched.add(c);
    }
  }
  return matched.size > 0 ? [...matched] : null;
}

export function pickCoverSurpriseSuggestion(
  loop?: {
    genre?: string;
    mood?: string;
    influence?: string;
    name?: string;
  },
  options?: { seed?: number; favorGenre?: boolean },
): StructuredCoverPromptInput {
  if (!cachedLibrary) cachedLibrary = buildTaggedLibrary();

  const seed = options?.seed ?? Date.now();
  const favorGenre = options?.favorGenre !== false;
  const boosted = favorGenre ? resolveBoostedCategories(loop) : null;

  let pool: TaggedSurprise[] = cachedLibrary;
  if (boosted && boosted.length > 0) {
    const biased = cachedLibrary.filter((e) => boosted.includes(e.category));
    if (biased.length >= 24) {
      // ~70% genre-aligned, ~30% wildcard for discovery
      pool = hashPick(seed, 10) < 7 ? biased : cachedLibrary;
    }
  }

  if (LOOP_CARD_COVER_FUTUR_RETRO_ENABLED && hashPick(seed + 13, 10) < 8) {
    const retroPool = cachedLibrary.filter((e) => e.category === "futurRetro");
    if (retroPool.length > 0) {
      pool = hashPick(seed + 17, 10) < 6 ? retroPool : pool;
    }
  }

  if (LOOP_CARD_COVER_ANIME_MANGA_GLITCH_ENABLED && hashPick(seed + 29, 10) < ANIME_MANGA_GLITCH_BIAS) {
    const animePool = cachedLibrary.filter((e) => e.category === "animeMangaGlitch");
    if (animePool.length > 0) {
      pool = hashPick(seed + 31, 10) < ANIME_MANGA_GLITCH_BIAS ? animePool : pool;
    }
  }

  const pick = pool[hashPick(seed, pool.length)]!;
  const { category: _c, ...structured } = pick;
  return structured;
}
