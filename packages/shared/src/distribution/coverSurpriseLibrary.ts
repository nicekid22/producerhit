import type { StructuredCoverPromptInput } from "./coverPrompt";
import { COVER_LIGHTING_PRESETS, COVER_STYLE_PRESETS } from "./coverPrompt";

/** Expanded pools for surprise combinations (album-art oriented, not portrait-heavy). */
export const COVER_SURPRISE_LIGHTING = [
  ...COVER_LIGHTING_PRESETS,
  "golden hour glow",
  "hard flash editorial",
  "backlit silhouette",
  "colored gel wash",
  "overcast softbox",
  "underwater caustics",
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
  | "vehicles";

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
};

/** Genre keywords → preferred surprise categories (still mixes in others sometimes). */
const GENRE_CATEGORY_BOOST: Record<string, SurpriseCategory[]> = {
  trap: ["urban", "objects", "digital", "texture"],
  drill: ["urban", "texture", "objects", "vehicles"],
  "hip hop": ["urban", "objects", "retro", "texture"],
  "hip-hop": ["urban", "objects", "retro", "texture"],
  rap: ["urban", "objects", "texture", "vehicles"],
  "lo-fi": ["retro", "objects", "minimal", "aquatic", "nature"],
  lofi: ["retro", "objects", "minimal", "aquatic", "nature"],
  "lo fi": ["retro", "objects", "minimal", "aquatic"],
  ambient: ["cosmic", "nature", "minimal", "abstract", "aquatic"],
  house: ["digital", "abstract", "retro", "urban"],
  techno: ["digital", "abstract", "urban", "texture"],
  edm: ["digital", "abstract", "cosmic", "retro"],
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
  emo: ["surreal", "urban", "nature", "texture"],
  indie: ["nature", "retro", "minimal", "flora"],
  phonk: ["vehicles", "urban", "retro", "texture"],
  wave: ["cosmic", "digital", "surreal", "abstract"],
  synth: ["retro", "digital", "cosmic", "abstract"],
  trapsoul: ["abstract", "retro", "minimal", "objects"],
  amapiano: ["abstract", "flora", "texture", "retro"],
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
      pool = biased;
    }
  }

  const pick = pool[hashPick(seed, pool.length)]!;
  const { category: _c, ...structured } = pick;
  return structured;
}
