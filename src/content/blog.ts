export type BlogBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] };

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  publishedAt: string;
  updatedAt: string;
  blocks: BlogBlock[];
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "drum-and-bass-beat-generator-prompt-template",
    title: "Drum & Bass beat generator: prompt template for clean DnB (160–180 BPM)",
    description: "A practical DnB prompt template: breakbeats, rolling drums, clean sub, and how to iterate with seed variations for consistent drum & bass.",
    keywords: ["drum and bass", "AI beat generator", "DnB beat", "prompt template", "generate beats online"],
    publishedAt: "2026-05-19",
    updatedAt: "2026-05-19",
    blocks: [
      { type: "p", text: "Drum & Bass can sound incredible with AI, but it can also fall apart fast: messy transients, weak sub, or a groove that doesn’t lock. The fix is a structured prompt and a repeatable iteration loop." },
      { type: "h2", text: "What makes DnB hard (and how to fix it)" },
      { type: "ul", items: ["Fast tempo needs tight drums (crisp snare, controlled hats)", "Sub-bass must be clean and stable", "Small fills help—but too many create chaos"] },
      { type: "h2", text: "Prompt template (copy/paste)" },
      {
        type: "ul",
        items: [
          "Drum & bass (DnB), 174 BPM, modern clean mix",
          "Rolling breakbeats, crisp snare, tight hats, controlled transients",
          "Deep clean sub-bass, no distortion unless specified",
          "Atmospheric pads + subtle synth stabs, energetic but not noisy",
          "Structure: 16 bars loopable, A/B variation, minimal fills",
        ],
      },
      { type: "h2", text: "How to iterate without losing the vibe" },
      { type: "p", text: "Generate two candidates, pick the cleanest drum pocket, then use seed-based variations. Keep the prompt stable and only change one constraint per variation (e.g., ‘more atmospheric’, ‘harder snare’, ‘lighter hats’)." },
      { type: "h2", text: "Two safe directions that work well" },
      { type: "ul", items: ["Liquid DnB: warmer chords, smoother drums, softer hats", "Neuro/tech DnB: darker synth stabs, tighter drums, more aggressive bass"] },
      { type: "p", text: "If the result feels ‘busy’, reduce layers: keep the break, snare, sub, and one main texture. Clean beats win in DnB." },
    ],
  },
  {
    slug: "speed-garage-prompts-skippy-drums",
    title: "Speed Garage prompts: skippy UKG drums, heavy bassline, club-ready bounce",
    description: "Speed Garage prompt examples to get the skippy drums + bassline bounce right, plus a clean workflow using two versions and variations.",
    keywords: ["speed garage", "UK garage", "AI beat generator", "prompt examples", "club beat"],
    publishedAt: "2026-05-19",
    updatedAt: "2026-05-19",
    blocks: [
      { type: "p", text: "Speed Garage is all about groove: skippy drums, heavy bassline, and vocal chops as texture. If your result sounds like generic house, your prompt needs stronger UKG/garage constraints." },
      { type: "h2", text: "Core ingredients" },
      { type: "ul", items: ["Tempo around 138–140 BPM", "Skippy drums with swing, offbeat hats, garage-style snare", "Heavy moving bassline (ree/bassline feel)", "Vocal chops as one-shots (no full vocals)"] },
      { type: "h2", text: "Prompt examples (copy/paste)" },
      {
        type: "ul",
        items: [
          "Speed garage, 138 BPM, skippy UKG drums, heavy bassline movement, vocal chops as stabs, modern clean mix, club-ready bounce, 16 bars loopable",
          "Speed garage / bassline, 140 BPM, shuffled drums, tight snare, deep sub, short pitched vocal hits, minimal melody, energetic and clean master",
        ],
      },
      { type: "h2", text: "Consistency hack: lock the groove, then vary only one thing" },
      { type: "p", text: "Once you find a groove that bounces, keep the seed and only change one element per variation: ‘darker bass’, ‘more swing’, or ‘brighter vocal chops’. This keeps the output coherent." },
      { type: "h2", text: "Avoid these common failures" },
      { type: "ul", items: ["Too much reverb (kills the bounce)", "Overly melodic leads (moves away from garage)", "No swing / straight drums (feels like house)"] },
    ],
  },
  {
    slug: "hyperpop-hiphop-rnb-prompts",
    title: "Hyperpop (Hip-Hop/R&B) prompts: emo-pop melodies + punchy 808s (clean mix)",
    description: "Prompt templates for hyperpop fused with hip-hop/R&B: glitchy synths, emotive toplines, punchy 808s, and controlled chaos.",
    keywords: ["hyperpop", "AI music generator", "AI beat generator", "emo pop", "R&B"],
    publishedAt: "2026-05-19",
    updatedAt: "2026-05-19",
    blocks: [
      { type: "p", text: "Hyperpop works when it’s maximal but controlled. If the output turns into noise, your prompt needs constraints: clean low end, fewer layers, and a clear melodic role." },
      { type: "h2", text: "Prompt template (copy/paste)" },
      {
        type: "ul",
        items: [
          "Hyperpop fused with hip-hop/R&B, 160 BPM, modern clean mix",
          "Punchy 808s + crisp trap hats, tight snare/clap",
          "Glitchy synth textures, bright but not harsh, controlled distortion",
          "Emotive emo-pop melody motif, space for melodic rap/R&B vocals",
          "Loopable 16 bars with subtle A/B variation, minimal fills",
        ],
      },
      { type: "h2", text: "Two variations that keep it musical" },
      { type: "ul", items: ["More R&B: smoother chords + softer drums", "More hyperpop: brighter synths + sharper drums + tighter arrangement"] },
      { type: "h2", text: "Keep the low end clean" },
      { type: "p", text: "The easiest way to ruin hyperpop is muddy bass. Ask for ‘clean sub/808’ and avoid stacking too many bass layers." },
      { type: "h2", text: "Iteration workflow" },
      { type: "p", text: "Generate two versions, pick the best pocket, then use seed variations. Avoid rewriting your whole prompt—edit one line at a time." },
    ],
  },
  {
    slug: "soul-funk-ai-beats-chords",
    title: "Soul & Funk with AI: chord progressions and groove prompts that work",
    description: "How to get soulful, musical beats from AI: warm chord movement, live-feel drums, funk pocket, and prompt structure for clean results.",
    keywords: ["soul", "funk", "AI beat generator", "chord progressions", "groove"],
    publishedAt: "2026-05-19",
    updatedAt: "2026-05-19",
    blocks: [
      { type: "p", text: "Soul and funk are ‘feel’ genres. The best results happen when you describe pocket, instrumentation, and how tight the groove should be." },
      { type: "h2", text: "Soul prompt template" },
      { type: "ul", items: ["Soul instrumental, warm Rhodes/piano chords, expressive melody, live-feel drums, deep bass, tasteful horns, clean mix, minimal autotune artifacts"] },
      { type: "h2", text: "Funk prompt template" },
      { type: "ul", items: ["Funk instrumental, tight syncopated guitar stabs, slap/finger bass, crisp drums, horn hits, danceable groove, dry punchy mix, strong pocket"] },
      { type: "h2", text: "Make it sound ‘played’, not programmed" },
      { type: "p", text: "Ask for ‘live-feel drums’, ‘tight pocket’, and ‘human groove’. For funk, emphasize syncopation and rhythmic guitar." },
      { type: "h2", text: "Variation workflow" },
      { type: "p", text: "Once you get a groove you like, lock the seed and create variations focusing on just one axis: ‘more horns’, ‘tighter drums’, or ‘warmer chords’." },
    ],
  },
  {
    slug: "seed-variations-remix-workflow",
    title: "Seed variations & remix workflow: how to get consistent results fast",
    description: "A producer-friendly method to turn 1 good generation into 5 usable options: save a seed, vary one constraint, and keep prompts stable.",
    keywords: ["seed", "variation", "remix", "AI beat generator", "workflow"],
    publishedAt: "2026-05-19",
    updatedAt: "2026-05-19",
    blocks: [
      { type: "p", text: "If you treat generation as a one-shot gamble, it’ll feel random. If you treat it like a workflow—seed → variations—you can build a pack of consistent options quickly." },
      { type: "h2", text: "The rule: change one thing at a time" },
      { type: "ul", items: ["Keep the same genre and tempo", "Vary only one constraint: drums OR melody OR texture", "Do 3–5 variations, then pick the winner"] },
      { type: "h2", text: "Variation prompts that work" },
      {
        type: "ul",
        items: [
          "Keep the same vibe, slightly tighter drums, less reverb",
          "Keep the same groove, swap the main melodic motif",
          "Keep the same arrangement, make the bassline more simple and clean",
        ],
      },
      { type: "h2", text: "Two versions first, then remix" },
      { type: "p", text: "Generate two candidates first. Pick the cleaner one, then run remix/variation from that. This increases hit rate without burning too many credits." },
      { type: "h2", text: "When to restart from scratch" },
      { type: "p", text: "If the groove itself is wrong (pocket, swing, tempo feel), restart with a clearer prompt. Variations work best when the foundation is already good." },
    ],
  },
  {
    slug: "ai-beat-generator-better-results",
    title: "AI Beat Generator: How to get better results (without wasting credits)",
    description:
      "A practical workflow for getting higher-quality beats from an AI beat generator: short generations, two versions, seed variations, and prompt structure.",
    keywords: ["AI beat generator", "type beat", "generate beats online", "prompt"],
    publishedAt: "2026-05-14",
    updatedAt: "2026-05-14",
    blocks: [
      { type: "p", text: "Most AI beat generators can produce great ideas, but the hit rate can feel random. The best way to improve consistency is to treat generation like a fast iteration loop rather than a one-shot request." },
      { type: "h2", text: "1) Start short (then extend)" },
      { type: "p", text: "Short generations reduce artifacts and help you quickly identify a clean direction. Once you find a vibe that works, then you can iterate or extend." },
      { type: "h2", text: "2) Generate two candidates" },
      { type: "p", text: "Two versions immediately doubles your chance of getting a clean take. Pick the best and move forward—don’t overthink the first prompt." },
      { type: "h2", text: "3) Use seed-based variations" },
      { type: "p", text: "When the seed is saved, you can create coherent variations (same vibe, different details). This is the fastest path to a ‘producer-ready’ result." },
      { type: "h2", text: "4) A prompt template that works" },
      {
        type: "ul",
        items: [
          "Genre + subgenre (e.g., trap / melodic trap / drill)",
          "Tempo range (BPM) and swing feel",
          "Mood + energy (dark, euphoric, aggressive, minimal)",
          "Sound palette (808 style, hats, synth texture, piano, pads)",
          "Mix direction (clean, punchy drums, wide stereo, dry vs spacious)",
        ],
      },
      { type: "p", text: "If you keep your prompt structured, you’ll get fewer weird outputs and better consistency across variations." },
    ],
  },
  {
    slug: "type-beat-generator-ai-prompt-examples",
    title: "Type Beat Generator AI: prompt examples for trap, drill, R&B, afrobeats",
    description:
      "Copy/paste prompt examples for a type beat generator AI, plus the key ingredients that keep outputs clean and consistent.",
    keywords: ["type beat generator AI", "AI beat generator", "trap beat", "drill beat", "R&B beat", "afrobeats beat"],
    publishedAt: "2026-05-14",
    updatedAt: "2026-05-14",
    blocks: [
      { type: "p", text: "If you want a ‘type beat’ sound, your prompt needs more than just the genre. The trick is describing the drum pocket, texture, and mix target." },
      { type: "h2", text: "Trap (modern, punchy)" },
      {
        type: "ul",
        items: [
          "Modern trap type beat, 140 BPM, tight 808 slides, crisp hats with rolls, sparse dark melody, punchy kick, clean mix, wide stereo, minimal reverb",
          "Melodic trap, 150 BPM, emotional piano + airy pad, bouncy 808, snappy clap, bright hat patterns, modern glossy mix",
        ],
      },
      { type: "h2", text: "Drill (aggressive, sliding 808)" },
      {
        type: "ul",
        items: [
          "UK drill type beat, 142 BPM, sliding 808, dark minor melody, gritty texture, sharp snare, tight drum pocket, loud drums, clean master",
          "NY drill type beat, 145 BPM, urgent stabs, drill snare, heavy 808 movement, energetic, punchy mix",
        ],
      },
      { type: "h2", text: "R&B (smooth, lush)" },
      {
        type: "ul",
        items: [
          "90s R&B vibe, 95 BPM, warm chords, smooth bass, tight rimshot, subtle swing, lush reverb, clean mix, soft tape warmth",
          "Contemporary R&B, 88 BPM, minimal drums, silky synth pad, deep sub, spacious vocals-ready arrangement, polished mix",
        ],
      },
      { type: "h2", text: "Afrobeats (groove, bounce)" },
      {
        type: "ul",
        items: [
          "Afrobeats type beat, 105 BPM, bouncy percussion, bright guitar plucks, warm bassline, upbeat feel, clean mix, airy top end",
          "Amapiano-inspired, 112 BPM, log drum groove, shakers, soft chords, wide stereo, clean master",
        ],
      },
      { type: "p", text: "After you get a good first take, use seed-based variations to stay close while exploring alternative melodies or drum grooves." },
    ],
  },
  {
    slug: "generate-beats-online-free-guide",
    title: "Generate beats online free: the producer workflow",
    description:
      "How to generate beats online for free and actually end up with a usable instrumental: short clips, pick the best take, then export and iterate.",
    keywords: ["generate beats online free", "online beat maker", "AI beat generator", "free beat maker"],
    publishedAt: "2026-05-14",
    updatedAt: "2026-05-14",
    blocks: [
      { type: "p", text: "Generating beats online for free is easy. Getting a beat you’d actually use in a session requires a simple workflow." },
      { type: "h2", text: "Step 1 — Generate a short clip" },
      { type: "p", text: "Start short. It’s faster, cleaner, and helps you lock in the right direction." },
      { type: "h2", text: "Step 2 — Generate two versions and pick one" },
      { type: "p", text: "Two candidates saves you time. Pick the cleanest bounce and move forward." },
      { type: "h2", text: "Step 3 — Variation (same vibe, new details)" },
      { type: "p", text: "Use variations to keep the same sound while exploring different melodies or drum details." },
      { type: "h2", text: "Step 4 — Export and organize" },
      { type: "p", text: "Download the MP3 for quick sharing, and use WAV exports when you’re ready to bring it into your DAW." },
    ],
  },
  {
    slug: "ai-music-generator-vs-agent",
    title: "AI music generator vs AI agent: why results can feel random",
    description:
      "Why open generation can produce bad outputs, and the producer-friendly tactics that increase hit rate: short lengths, multiple candidates, and controlled variation.",
    keywords: ["AI music generator", "AI beat generator", "type beat generator AI"],
    publishedAt: "2026-05-14",
    updatedAt: "2026-05-14",
    blocks: [
      { type: "p", text: "Some platforms hide the ugly generations and only show you the best results. When you generate more directly, you see everything—good, bad, and ugly." },
      { type: "h2", text: "Why long generations fail more often" },
      { type: "p", text: "Long renders amplify small issues: tuning drift, artifacts, arrangement instability. Short clips reduce that surface area and speed up iteration." },
      { type: "h2", text: "How to increase hit rate" },
      {
        type: "ul",
        items: [
          "Generate short by default",
          "Generate multiple candidates (Versions=2)",
          "Save seeds and use variations for controlled iteration",
          "Keep prompts structured and consistent",
        ],
      },
      { type: "p", text: "The goal is less random clicking and more repeatable iteration—like producing with an instrument." },
    ],
  },
];

export function getBlogPostBySlug(slug: string): BlogPost | null {
  return BLOG_POSTS.find((p) => p.slug === slug) ?? null;
}
