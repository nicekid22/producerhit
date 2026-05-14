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

