import fs from "fs";

const ext = fs.readFileSync("src/lib/genres/extendedCatalog.ts", "utf8");
const core = fs.readFileSync("src/lib/genres/index.ts", "utf8");
const existing = new Set();
for (const m of ext.matchAll(/g\(\s*\n\s*"([^"]+)"/g)) existing.add(m[1]);
for (const m of core.matchAll(/value: "([^"]+)"/g)) existing.add(m[1]);

const aliases = {
  Pluggnb: "PluggnB",
  "Trap Soul": "Trapsoul",
  "Lo-Fi R&B": "Lo-fi R&B",
  "Alternative R&B": "R&B Alternative",
};

const sections = {
  "Trap / Modern": [
    "Rage Trap", "Emo Trap", "Cloud Trap", "Drill Trap", "Space Trap", "Gothic Trap", "Sad Trap",
    "Horror Trap", "Glitch Trap", "Neo Trap", "Lo-Fi Trap", "Jazz Trap", "Hyper Trap",
    "Underground Trap", "Alien Trap", "Trap&B", "Orchestral Trap",
  ],
  "SoundCloud / Underground": [
    "SoundCloud Rap", "Plugg", "Vaportrap", "Internet Rap", "Tumblr Rap", "Blog Era Rap",
    "Alternative Hip Hop", "Abstract Hip Hop", "Experimental Rap", "Industrial Hip Hop", "Art Rap",
    "Dream Rap", "Psychedelic Rap", "Witch Rap", "Sigilkore Rap", "Hyperpop Rap", "Digicore Rap",
    "Glitchcore Rap", "HexD Rap", "Drain Gang Style", "Opium Style",
  ],
  "Old School / Classic": [
    "Boom Bap", "Jazz Rap", "Conscious Rap", "Political Hip Hop", "G-Funk", "Mafioso Rap",
    "East Coast Rap", "West Coast Rap", "Southern Hip Hop", "Dirty South", "Memphis Rap", "Crunk",
    "Snap Music", "Hyphy", "Horrorcore", "Hardcore Rap", "Backpack Rap", "Golden Era Hip Hop",
    "Freestyle Rap", "Old School Party Rap", "Turntablism", "Gangsta Rap", "Underground Boom Bap",
    "Lo-Fi Boom Bap", "Neo Boom Bap",
  ],
  "Drill / Aggressive": [
    "UK Drill", "NY Drill", "Dark Drill", "Cinematic Drill", "Rage Drill", "Horror Drill",
    "Melo Drill", "Hyper Drill", "Trap Drill", "Orchestral Drill", "Experimental Drill",
  ],
  "Regional / Internet": [
    "Detroit Rap", "Flint Rap", "Michigan Trap", "Jersey Club Rap", "Philly Club Rap", "Bay Area Rap",
    "Chopped & Screwed", "Houston Slowed", "Memphis Revival", "Cali Bounce", "DMV Flow", "UK Rap",
    "Grime Rap", "Afro Trap", "French Trap", "Brazilian Trap", "Japanese Trap", "Korean Hip Hop",
  ],
  "Emotional / Atmospheric": [
    "Sadboy Rap", "Emotional Rap", "Melancholic Hip Hop", "Dreamy Hip Hop", "Rainy Night Rap",
    "Midnight Rap", "Liminal Hip Hop", "Ethereal Rap", "Space Rap", "Spiritual Hip Hop",
    "Luxury Melancholy", "Nostalgic Rap", "VHS Rap", "Y2K Rap", "Digital Nostalgia Rap",
  ],
  "TikTok / Viral Era": [
    "Edit Audio Rap", "Sigma Rap", "Drift Rap", "Gym Rap", "Anime Trap", "Viral Trap",
    "Bass Boosted Rap", "Nightcore Rap", "Slowed + Reverb Rap", "Hyper Edit Rap", "Cinematic Edit Rap",
    "AMV Rap", "Phonk Rap", "Rage Edit Music",
  ],
  "Luxury / Fashion / Aesthetic": [
    "Runway Rap", "Fashion Week Rap", "Designer Trap", "Luxury Rap", "Avant-Garde Hip Hop",
    "Art Gallery Rap", "Cyber Luxury Trap", "Chrome Trap", "Neo Fashion Rap", "Futuristic Hip Hop",
    "Editorial Rap", "Minimal Trap", "Opulent Trap", "Dark Luxury Trap",
  ],
  "Internet Aesthetics Rap": [
    "Frutiger Aero Rap", "Dreamcore Hip Hop", "Weirdcore Rap", "Webcore Rap", "Mallsoft Hip Hop",
    "Analog Horror Rap", "VHS Trap", "MP3 Era Rap", "Browsercore Rap", "Retro Internet Trap",
    "Neo Y2K Rap", "Playstation 2 Rap", "Midnight Browser Rap", "Digital Dream Rap",
    "Artificial Nostalgia Rap",
  ],
  "R&B / Soul": [
    "Ambient R&B", "Contemporary Soul", "Psychedelic Soul", "Bedroom R&B", "Indie R&B", "Emotional R&B",
    "Dreamy R&B", "Midnight R&B", "Late Night Soul", "Rainy Night R&B", "Ethereal R&B", "Experimental R&B",
    "Chill R&B", "Velvet Soul", "Smooth Soul", "Soft Soul", "Minimal Soul", "Luxury Soul", "Fashion R&B",
    "Cinematic R&B", "Jazzy R&B", "Acoustic R&B", "Piano Soul", "Vinyl Soul", "Retro Soul", "Y2K R&B",
    "2000s R&B", "90s Slow Jam", "Slow Jamz", "Quiet Storm", "Alternative Soul", "Cloud R&B", "Space Soul",
    "Cosmic R&B", "Dream Soul", "Melancholic Soul", "Spiritual Soul", "Vulnerable R&B", "Romantic R&B",
    "Intimate R&B", "Seductive R&B", "Soft Girl R&B", "Digital Soul", "Internet Soul", "Tumblr Era R&B",
    "Blog Era Soul", "Cassette Soul", "VHS Soul", "Chrome Soul", "Holographic Soul", "Synthetic Soul",
    "Analog Soul", "Neo Lounge Soul", "Chillwave R&B", "Vapor Soul", "Future Soul", "Afro Soul", "UK Soul",
    "Soul Pop", "Soulwave", "Dreamwave R&B", "Soultronica", "Electro Soul", "Deep Soul", "Velvet Nights",
    "Sunset Soul", "Ocean Soul", "Moonlight R&B", "Neon Soul", "Liquid Soul", "Floating Soul",
    "Digital Romance", "Heartbreak Soul", "After Hours R&B", "Lounge R&B", "Late Drive Soul", "Motel Soul",
    "Luxury Hotel R&B", "Paris Night Soul", "Tokyo Soul", "Seoul Midnight R&B", "Miami Sunset Soul",
    "Cigarette Break Soul", "Bedroom Confession R&B", "Slow Motion Soul", "Emotional Luxury", "Soft Chaos Soul",
    "Introspective R&B", "Vulnerable Nights", "Crying in Designer Clothes", "Nostalgic Romance",
    "Rain on Windows R&B", "Floating Memories Soul", "Dream Apartment R&B", "Silk Soul", "Satin R&B",
    "Velvet Rain", "Chrome Tears", "Neon Heartbreak", "Emotional Futurism", "Artificial Romance",
    "Digital Heartbreak", "Midnight Confessions", "Purple Lights R&B", "Soft Neon Soul", "Late Text Message Soul",
  ],
  "Trap Soul / Hybrid": [
    "Emotional Trap Soul", "Ambient Trap Soul", "Dark Trap Soul", "Neo Trap Soul", "Atmospheric Trap Soul",
    "Sad Trap Soul", "Luxury Trap Soul", "Lo-Fi Trap Soul", "Midnight Trap Soul", "Rainy Trap Soul",
  ],
};

function defaultBpm(name, group) {
  const n = name.toLowerCase();
  if (group.includes("Drill") || n.includes("drill")) return 142;
  if (n.includes("boom bap") || n.includes("golden era") || n.includes("turntablism")) return 92;
  if (n.includes("slowed") || n.includes("slow jam") || n.includes("quiet storm")) return 72;
  if (n.includes("nightcore") || n.includes("hyper")) return 155;
  if (n.includes("phonk") || n.includes("drift") || n.includes("gym")) return 135;
  if (group.includes("R&B") || group.includes("Soul") || n.includes("soul") || n.includes("r&b")) return 88;
  if (n.includes("jersey") || n.includes("club")) return 138;
  if (n.includes("grime") || n.includes("uk drill")) return 140;
  if (n.includes("chopped") || n.includes("screwed") || n.includes("houston")) return 68;
  if (n.includes("lo-fi") || n.includes("bedroom") || n.includes("cassette") || n.includes("vhs")) return 82;
  return 130;
}

function sonautoTags(name, group) {
  const n = name.toLowerCase();
  const tags = new Set(["2020s"]);
  if (group.includes("Old School") || n.includes("boom bap") || n.includes("golden era")) tags.add("1990s");
  if (n.includes("90s") || n.includes("2000s") || n.includes("y2k")) tags.add("2000s");
  if (n.includes("trap") || group.includes("Trap")) tags.add("trap");
  if (n.includes("drill")) tags.add("aggressive");
  if (n.includes("soul") || n.includes("r&b")) tags.add("r&b/soul");
  if (n.includes("sad") || n.includes("melanchol") || n.includes("heartbreak") || n.includes("rain")) tags.add("melancholic");
  if (n.includes("luxury") || n.includes("fashion") || n.includes("designer")) tags.add("smooth");
  if (n.includes("rage") || n.includes("horror") || n.includes("hardcore")) tags.add("aggressive");
  if (n.includes("ambient") || n.includes("ethereal") || n.includes("dream") || n.includes("space")) tags.add("atmospheric");
  if (n.includes("lo-fi") || n.includes("bedroom")) tags.add("lo-fi");
  if (n.includes("experimental") || n.includes("abstract") || n.includes("avant")) tags.add("experimental");
  return [...tags];
}

function buildPrompt(name, group) {
  const key = name.toLowerCase();
  const mood =
    key.includes("sad") || key.includes("heartbreak") || key.includes("melanchol") || key.includes("rain") || key.includes("crying")
      ? "melancholic emotional atmosphere"
      : key.includes("luxury") || key.includes("fashion") || key.includes("designer") || key.includes("runway")
        ? "polished upscale nightlife energy"
        : key.includes("rage") || key.includes("horror") || key.includes("moshpit") || key.includes("hardcore")
          ? "aggressive high-intensity energy"
          : key.includes("dream") || key.includes("ethereal") || key.includes("ambient") || key.includes("space")
            ? "spacious atmospheric depth"
            : key.includes("lo-fi") || key.includes("vhs") || key.includes("cassette") || key.includes("vinyl")
              ? "warm nostalgic texture"
              : key.includes("drill")
                ? "dark sliding bass and rapid hi-hats"
                : key.includes("soul") || key.includes("r&b")
                  ? "smooth heartfelt chord movement and intimate groove"
                  : "modern underground pocket and clean mix";
  return `${key}, ${mood}, authentic ${group.toLowerCase()} production, radio-ready polish`;
}

function buildAceTags(name, group) {
  const key = name.toLowerCase();
  return `${key}, ${group.toLowerCase()}, modern production, polished mix`;
}

const entries = [];
for (const [group, names] of Object.entries(sections)) {
  for (const name of names) {
    if (existing.has(name)) continue;
    const alias = aliases[name];
    if (alias && existing.has(alias)) continue;
    entries.push({ name, group });
  }
}

const lines = entries.map(({ name, group }) => {
  const prompt = buildPrompt(name, group);
  const ace = buildAceTags(name, group);
  const bpm = defaultBpm(name, group);
  const tags = sonautoTags(name, group);
  const esc = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `  g(
    "${esc(name)}",
    "${esc(group)}",
    "${esc(prompt)}",
    "${esc(ace)}",
    ${bpm},
    ${JSON.stringify(tags)},
  ),`;
});

const out = `/** Hip-hop, trap, drill, and R&B/soul microgenres — auto-expanded catalog batch. */
import type { ExtendedGenreDef } from "@/lib/genres/extendedCatalog";

function g(
  value: string,
  group: string,
  prompt: string,
  aceTags: string,
  bpm: number,
  sonautoTags: string[] = ["2020s"],
): ExtendedGenreDef {
  return { value, group, prompt, aceTags, bpm, sonautoTags };
}

export const HIP_HOP_SOUL_GENRES: ExtendedGenreDef[] = [
${lines.join("\n")}
];
`;

fs.writeFileSync("src/lib/genres/hipHopSoulCatalog.ts", out);
console.log("Wrote", entries.length, "genres to hipHopSoulCatalog.ts");
