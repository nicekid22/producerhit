import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AppShell } from "@/components/AppShell";
import { Dropdown, type DropdownOption } from "@/components/ui/Dropdown";
import { Slider } from "@/components/ui/Slider";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/EmptyState";
import { useGeneratorStore } from "@/stores/generatorStore";
import { useLoopsStore } from "@/stores/loopsStore";
import type { Loop, LoopLength } from "@/types/loop";
import { usePlayerStore } from "@/stores/playerStore";
import { LoopCardItem } from "@/components/LoopCardItem";
import { LoopCardSkeleton } from "@/components/LoopCardSkeleton";
import { AlertTriangle, AudioWaveform, Clock, Copy, Gauge, Info, KeyRound, Loader2, Search, Sigma, X } from "lucide-react";
import { supabase, trackClientEvent } from "@/lib/supabaseClient";
import { useAuthStore } from "@/stores/authStore";
import { useLocaleStore } from "@/stores/localeStore";
import { getRemainingBeats, PLAN_LIMITS } from "@/lib/planLimits";
import { generateBeat } from "@/lib/audioApi";
import { buildAceCaption, type GenerateParams } from "@/lib/promptBuilder";
import { coverGradient, coverImageUrl } from "@/lib/utils";
import { BrandLogo } from "@/components/landing/BrandLogo";

function formatTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

const genreOptions: DropdownOption[] = [
  { value: "Auto", label: "Auto" },
  { group: "Trap / Hip-Hop", value: "Contemporary Rap", label: "Contemporary Rap" },
  { group: "Trap / Hip-Hop", value: "Dark Trap", label: "Dark Trap" },
  { group: "Trap / Hip-Hop", value: "Melodic Trap", label: "Melodic Trap" },
  { group: "Trap / Hip-Hop", value: "PluggnB", label: "PluggnB" },
  { group: "Trap / Hip-Hop", value: "Rage", label: "Rage" },
  { group: "Trap / Hip-Hop", value: "Cloud Rap", label: "Cloud Rap" },
  { group: "Trap / Hip-Hop", value: "Emo Rap", label: "Emo Rap" },
  { group: "Trap / Hip-Hop", value: "Sad Rap", label: "Sad Rap" },
  { group: "Trap / Hip-Hop", value: "Atmospheric Rap", label: "Atmospheric Rap" },
  { group: "Trap / Hip-Hop", value: "Emotional Trap", label: "Emotional Trap" },
  { group: "Trap / Hip-Hop", value: "Ambient Trap", label: "Ambient Trap" },
  { group: "Trap / Hip-Hop", value: "Cinematic Trap", label: "Cinematic Trap" },
  { group: "Trap / Hip-Hop", value: "Experimental Trap", label: "Experimental Trap" },
  { group: "Trap / Hip-Hop", value: "Old School Hip-Hop", label: "Old School (Boom Bap)" },
  { group: "Trap / Hip-Hop", value: "Drill", label: "Drill" },
  { group: "Trap / Hip-Hop", value: "Jersey Drill", label: "Jersey Drill" },
  { group: "Trap / Hip-Hop", value: "Afrotrap", label: "Afrotrap" },
  { group: "Trap / Hip-Hop", value: "Sample Drill", label: "Sample Drill" },
  { group: "Trap / Hip-Hop", value: "Melodic Drill", label: "Melodic Drill" },
  { group: "Trap / Hip-Hop", value: "Lo-Fi Hip-Hop", label: "Lo‑Fi (Hip Hop)" },
  { group: "R&B / Soul", value: "Trapsoul", label: "Trap Soul" },
  { group: "R&B / Soul", value: "90s R&B", label: "90s R&B" },
  { group: "R&B / Soul", value: "Contemporary R&B", label: "Contemporary R&B" },
  { group: "R&B / Soul", value: "R&B Alternative", label: "R&B Alternative" },
  { group: "R&B / Soul", value: "Dark R&B", label: "Dark R&B" },
  { group: "R&B / Soul", value: "Future R&B", label: "Future R&B" },
  { group: "R&B / Soul", value: "Afro R&B", label: "Afro R&B" },
  { group: "R&B / Soul", value: "Toxic R&B", label: "Toxic R&B" },
  { group: "R&B / Soul", value: "Neo Soul", label: "Neo Soul" },
  { group: "R&B / Soul", value: "Soul", label: "Soul" },
  { group: "R&B / Soul", value: "Funk", label: "Funk" },
  { group: "R&B / Soul", value: "Lo-fi R&B", label: "Lo‑Fi R&B" },
  { group: "Afro / Latin / Island", value: "Afrobeats", label: "Afrobeats" },
  { group: "Afro / Latin / Island", value: "Amapiano", label: "Amapiano" },
  { group: "Afro / Latin / Island", value: "Afro House", label: "Afro House" },
  { group: "Afro / Latin / Island", value: "Latin", label: "Latin" },
  { group: "Afro / Latin / Island", value: "Reggaeton", label: "Reggaeton" },
  { group: "Afro / Latin / Island", value: "Baile Funk", label: "Baile Funk" },
  { group: "Afro / Latin / Island", value: "Dancehall", label: "Dancehall" },
  { group: "Afro / Latin / Island", value: "Reggae", label: "Reggae" },
  { group: "Electronic / Pop", value: "House", label: "House" },
  { group: "Electronic / Pop", value: "Pop", label: "Pop" },
  { group: "Electronic / Pop", value: "K-Pop", label: "K‑Pop" },
  { group: "Electronic / Pop", value: "Indie Pop", label: "Indie Pop" },
  { group: "Electronic / Pop", value: "Dream Pop", label: "Dream Pop" },
  { group: "Electronic / Pop", value: "Dance Pop", label: "Dance Pop" },
  { group: "Electronic / Pop", value: "Viral TikTok", label: "Viral TikTok" },
  { group: "Electronic / Pop", value: "Viral TikTok Pop", label: "Viral TikTok Pop" },
  { group: "Electronic / Pop", value: "French Pop", label: "French Pop" },
  { group: "Electronic / Pop", value: "UK Garage", label: "UK Garage" },
  { group: "Electronic / Pop", value: "Speed Garage", label: "Speed Garage" },
  { group: "Electronic / Pop", value: "Drum and Bass", label: "Drum & Bass" },
  { group: "Electronic / Pop", value: "Jersey Club", label: "Jersey Club" },
  { group: "Electronic / Pop", value: "Electro", label: "Electro" },
  { group: "Electronic / Pop", value: "Video Game", label: "Video Game" },
  { group: "Electronic / Pop", value: "Hyperpop", label: "Hyperpop" },
  { group: "Electronic / Pop", value: "Hyperpop (Hip-Hop/R&B)", label: "Hyperpop (Hip-Hop/R&B)" },
  { group: "Electronic / Pop", value: "EDM", label: "EDM" },
  { group: "Electronic / Pop", value: "Chillstep", label: "Chillstep" },
  { group: "Electronic / Pop", value: "Dubstep", label: "Dubstep" },
  { group: "Electronic / Pop", value: "Vaporwave", label: "Vaporwave" },
  { group: "Electronic / Pop", value: "Synthwave", label: "SynthWave" },
  { group: "Electronic / Pop", value: "Witch House", label: "Witch House" },
  { group: "Electronic / Pop", value: "Glitchcore", label: "Glitchcore" },
  { group: "Electronic / Pop", value: "Digicore", label: "Digicore" },
  { group: "Electronic / Pop", value: "Brazilian Phonk", label: "Brazilian Phonk" },
  { group: "Electronic / Pop", value: "VinaHouse", label: "VinaHouse (VN House)" },
  { group: "Electronic / Pop", value: "Study Beats", label: "Study Beats" },
  { group: "Rock", value: "Pop Rock", label: "Pop Rock" },
  { group: "Rock", value: "Rock", label: "Rock" },
  { group: "Other", value: "Jazz", label: "Jazz" },
  { group: "Other", value: "New Jazz", label: "New Jazz" },
  { group: "Other", value: "Classical", label: "Musique Classique" },
  { group: "Other", value: "Opera", label: "Opera" },
  { group: "Other", value: "Oriental", label: "Oriental" },
  { group: "Other", value: "Guitar Acoustic Live", label: "Guitar Acoustic Live" },
  { group: "Other", value: "Piano Acoustic Live", label: "Piano Acoustic Live" },
  { group: "Other", value: "Country", label: "Country" },
  { group: "LAB (Futur)", value: "Rage + Ambient", label: "Rage + Ambient" },
  { group: "LAB (Futur)", value: "Holographic R&B", label: "Holographic R&B" },
  { group: "LAB (Futur)", value: "Futuristic Trap Soul", label: "Futuristic Trap Soul" },
  { group: "LAB (Futur)", value: "Ambient Drill", label: "Ambient Drill" },
  { group: "LAB (Futur)", value: "Cinematic Afro Trap", label: "Cinematic Afro Trap" },
  { group: "LAB (Futur)", value: "AI-assisted Pop", label: "AI‑assisted Pop" },
  { group: "LAB (Futur)", value: "Experimental Afro House", label: "Experimental Afro House" },
  { group: "LAB (Futur)", value: "Hyper Melodic Rap", label: "Hyper Melodic Rap" },
  { group: "LAB (Futur)", value: "Dark Atmospheric Pop", label: "Dark Atmospheric Pop" },
  { group: "LAB (Futur)", value: "Y2K Futuristic Pop", label: "Y2K Futuristic Pop" },
  { group: "LAB (Futur)", value: "Hybrid Electronic Rap", label: "Hybrid Electronic Rap" },
  { group: "LAB (Futur)", value: "Sci-Fi R&B", label: "Sci‑Fi R&B" },
  { group: "LAB (Futur)", value: "Ethereal Trap", label: "Ethereal Trap" },
  { group: "LAB (Futur)", value: "Nostalgic Future Beats", label: "Nostalgic Future Beats" },
];

const influenceOptions: DropdownOption[] = [
  { group: "Modern Trap", value: "Metro Boomin", label: "Metro Boomin" },
  { group: "Modern Trap", value: "Southside", label: "Southside" },
  { group: "Modern Trap", value: "Wheezy", label: "Wheezy" },
  { group: "Modern Trap", value: "Tay Keith", label: "Tay Keith" },
  { group: "Modern Trap", value: "Murda Beatz", label: "Murda Beatz" },
  { group: "Modern Trap", value: "Mike Will Made-It", label: "Mike Will Made-It" },
  { group: "Hip-Hop / Samples", value: "Hit-Boy", label: "Hit-Boy" },
  { group: "Hip-Hop / Samples", value: "Boi-1da", label: "Boi-1da" },
  { group: "Hip-Hop / Samples", value: "The Alchemist", label: "The Alchemist" },
  { group: "Hip-Hop / Samples", value: "DJ Premier", label: "DJ Premier" },
  { group: "Hip-Hop / Samples", value: "Just Blaze", label: "Just Blaze" },
  { group: "Hip-Hop / Samples", value: "Pete Rock", label: "Pete Rock" },
  { group: "Classic / Pop", value: "Dr. Dre", label: "Dr. Dre" },
  { group: "Classic / Pop", value: "Pharrell", label: "Pharrell" },
  { group: "R&B / Pop", value: "Timbaland", label: "Timbaland" },
  { group: "R&B / Pop", value: "Darkchild", label: "Darkchild" },
  { group: "R&B / Pop", value: "Rodney Jerkins", label: "Rodney Jerkins" },
  { group: "R&B / Pop", value: "40", label: "40" },
  { group: "R&B / Pop", value: "Kaytranada", label: "Kaytranada" },
  { group: "UK / Afro", value: "P2J", label: "P2J" },
  { group: "UK / Afro", value: "JAE5", label: "JAE5" },
  { group: "Classic", value: "Kanye West (808s era)", label: "Kanye West (808s era)" },
  { group: "Melodic / R&B", value: "OG Parker", label: "OG Parker" },
  { value: "No Influence", label: "No Influence" },
];

const keyOptions = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const scaleOptions: DropdownOption[] = [
  { value: "Major", label: "Major" },
  { value: "Minor", label: "Minor" },
  { value: "Diminished", label: "Diminished" },
  { value: "Pentatonic", label: "Pentatonic" },
];
const reverbOptions: DropdownOption[] = [
  { value: "Dry", label: "Dry" },
  { value: "Subtle", label: "Subtle" },
  { value: "Medium", label: "Medium" },
  { value: "Heavy", label: "Heavy" },
];
const moodOptions = ["Dark", "Melancholic", "Euphoric", "Aggressive", "Smooth", "Dreamy", "Hypnotic"];
const lengths: LoopLength[] = ["2 bars", "4 bars", "8 bars", "16 bars"];

const bpmPresets = [
  { label: "Chill", value: 110 },
  { label: "Mid", value: 140 },
  { label: "Fast", value: 170 },
] as const;
const songDurationPresets = [15, 30, 45] as const;
const timeSignatureOptions = ["2/4", "3/4", "4/4", "6/8"] as const;
const vocalLanguageOptions: DropdownOption[] = [
  { value: "en", label: "🇺🇸 English" },
  { value: "fr", label: "🇫🇷 French" },
  { value: "es", label: "🇪🇸 Spanish" },
  { value: "pt", label: "🇵🇹 Portuguese" },
  { value: "it", label: "🇮🇹 Italian" },
  { value: "de", label: "🇩🇪 German" },
  { value: "ja", label: "🇯🇵 Japanese" },
  { value: "zh", label: "🇨🇳 Chinese" },
];

const vocalStyleOptions = [
  { value: "Singer", label: "🎤 Singer" },
  { value: "Rapper", label: "🎙️ Rapper" },
  { value: "Singer-Rapper", label: "🎶 Hybrid" },
  { value: "Choir", label: "🧑‍🤝‍🧑 Vocal" },
] as const;

const genreInspirationChips: Record<string, readonly string[]> = {
  "Contemporary Rap": ["Hard Drums", "808/Sub", "Minimal Melody", "Bouncy Hats", "Ear Candy", "Modern"],
  "Lo-Fi Hip-Hop": ["Vintage", "Sad", "Vinyl", "Rain", "Night City", "Study"],
  "90s R&B": ["Live Keys", "Rhodes", "Soulful Chords", "Swinging Drums", "Warm Tape", "Smooth Groove"],
  Trapsoul: ["Smooth 808", "Half-time", "Dark Pads", "Tight Hats", "Woozy Melody", "Emotional"],
  "Melodic Trap": ["Hip-Hop Trap", "Atlanta", "Emotional Guitar", "Airy Pads", "808 Glides", "Space For Vocals"],
  "Jersey Drill": ["Kick Clusters", "Stop/Start", "808 Slides", "Dark Motif", "Bouncy Pocket", "Hype"],
  "Contemporary R&B": ["Polished", "Lush Chords", "Clean Drums", "Modern", "Sub Bass", "Hooky"],
  "R&B Alternative": ["Moody", "Minimal", "Texture", "Off-Kilter Drums", "Airy Pads", "Deep"],
  "Lo-fi R&B": ["Warm Tape", "Dusty", "Chill", "Soft Drums", "Late Night", "Vinyl"],
  "Neo Soul": ["Jazzy Chords", "Organic Feel", "Laid-back", "Live Bass", "Soulful", "Warm"],
  "Old School Hip-Hop": ["Boom Bap", "Chopped Samples", "Vinyl Dust", "MPC Swing", "Scratches", "Jazz/Soul"],
  "UK Drill": ["Dark Melody", "Sliding 808", "Off-beat Hats", "Aggressive", "Minor Key", "Street"],
  Afrobeats: ["Percussion Heavy", "Bright Guitar", "Danceable", "West African", "Rhythmic", "Uplifting"],
  Amapiano: ["Log Drum", "Deep Bass", "Piano Keys", "Shuffle", "South African", "Smooth", "Shakers"],
  House: ["4-on-the-floor", "Groovy Bass", "Chord Stabs", "Hi-hats", "Uplifting", "Club"],
  Pop: ["Catchy", "Bright", "Commercial", "Modern", "Upbeat", "Radio-ready"],
  "UK Garage": ["2-Step", "Syncopated", "Bouncy Bass", "Swing", "Vocal Chops", "London Vibe"],
  "Jersey Club": ["Fast Kicks", "Club Bounce", "Chopped Vocals", "Bed Squeak", "High Energy"],
  Electro: ["Punchy Bass", "Sidechain", "Bright Synths", "Club", "Clean Mix", "Energy"],
  "Video Game": ["Arps", "Chiptune", "Loopable", "Bright Motif", "SFX", "Bouncy"],
  "Pop Rock": ["Guitar Hook", "Big Chorus", "Live Drums", "Bright", "Uplifting", "Radio"],
  Rock: ["Distorted Guitars", "Driving Drums", "Energy", "Anthem", "Riffs", "Punchy"],
  Hyperpop: ["Kawaii", "Gaming", "Glitchy", "Distorted", "Fast", "Maximal"],
  "Baile Funk": ["Funk Mandelão", "Distorted Kick", "Sharp Snare", "Saw Lead", "DJ Drops", "Favela Energy"],
  Afrotrap: ["Hybrid Drums", "Aggressive Afro", "Heavy 808", "Rhythmic", "High Energy"],
  Dancehall: ["Island Vibe", "Club Energy", "Heavy Bass", "Rhythmic", "Tropical", "Summer"],
  Country: ["Acoustic Guitar", "Live Drums", "Warm Bass", "Lead Guitar", "Anthemic", "Emotional"],
  PluggnB: ["Plucky Synths", "Bouncy 808", "Soft Drums", "Airy", "Melodic", "Internet"],
  Rage: ["Distorted Lead", "Hype", "Aggressive", "Fast Hats", "Big Drops", "Energy"],
  "Cloud Rap": ["Dreamy", "Washed Reverb", "Airy Pads", "Soft 808", "Float", "Wide"],
  "Emo Rap": ["Sad Guitar", "Emotional", "Melodic", "Trap Drums", "Vulnerable", "Minor"],
  "Sad Rap": ["Melancholic", "Minor Chords", "Soft Drums", "Deep Sub", "Late Night", "Vibes"],
  "Atmospheric Rap": ["Airy Pads", "Minimal Drums", "Wide Space", "Moody", "Hypnotic", "Modern"],
  "Emotional Trap": ["Cinematic Chords", "Melodic", "Deep 808", "Emotional", "Modern Drums", "Space"],
  "Ambient Trap": ["Spacious Pads", "Minimal", "Deep Sub", "Hypnotic", "Texture", "Airy"],
  "Cinematic Trap": ["Cinematic", "Big Drums", "Dark", "Trailer", "Impacts", "Transitions"],
  "Experimental Trap": ["Glitchy", "Weird Textures", "Warped 808", "Unusual", "Futuristic", "Surprise"],
  "Sample Drill": ["Chopped Sample", "Gritty", "808 Slides", "Dark", "Drill Drums", "Underground"],
  "Melodic Drill": ["Emotional Melody", "808 Slides", "Dark", "Hooky", "Crisp Drums", "Street"],
  "Dark R&B": ["Moody", "Sparse", "Deep Sub", "Minor Chords", "Nocturnal", "Tension"],
  "Future R&B": ["Futuristic", "Glossy", "Airy", "Clean Drums", "Deep Sub", "Space"],
  "Afro R&B": ["Smooth", "Afro Perc", "Warm Guitar", "Sensual", "Modern", "Groove"],
  "Toxic R&B": ["Dark", "Sensual", "Cold Pads", "Tension", "Deep Sub", "Modern"],
  "Afro House": ["Afro Perc", "House Groove", "Hypnotic", "Club", "Warm Chords", "Deep Bass"],
  Latin: ["Latin Perc", "Danceable", "Catchy", "Warm Bass", "Club", "Bright"],
  Reggae: ["Skank Guitar", "Deep Bass", "One Drop", "Warm", "Sunny", "Laid-back"],
  "K-Pop": ["Glossy", "Catchy", "Bright", "Punchy Drums", "Modern", "Hook"],
  "Indie Pop": ["Warm", "Dreamy", "Guitars", "Soft Drums", "Understated", "Hooky"],
  "Dream Pop": ["Hazy", "Reverb", "Soft Drums", "Airy", "Lush", "Float"],
  "Dance Pop": ["Upbeat", "Bright Hook", "Punchy Drums", "Club", "Clean", "Radio"],
  "Viral TikTok": ["Hook First", "Catchy", "Short", "Memorable", "Clean Mix", "Earworm"],
  "Viral TikTok Pop": ["Catchy Hook", "Bright", "Punchy", "Glossy", "Earworm", "Pop"],
  EDM: ["Build-up", "Drop", "Big Synths", "Festival", "Energy", "Wide"],
  Chillstep: ["Chill", "Uplifting", "Atmospheric", "Sidechain", "Smooth", "Melodic"],
  Dubstep: ["Heavy Bass", "Half-time", "Aggressive", "Dark", "Drops", "Sound Design"],
  Vaporwave: ["Nostalgic", "Hazy", "Tape", "Retro", "Dreamy", "Soft"],
  Synthwave: ["Retro Synths", "Neon", "Arps", "Driving", "Cinematic", "Nostalgia"],
  "Witch House": ["Dark", "Hazy", "Occult", "Slow", "Distorted", "Atmospheric"],
  Glitchcore: ["Glitch", "Stutter", "Chaotic", "Digital", "Fast", "Edits"],
  Digicore: ["Internet", "Bright Synths", "Glitchy", "808s", "Energetic", "Hooks"],
  "Brazilian Phonk": ["Cowbell", "Aggressive", "Club", "Distorted Bass", "Fast", "Raw"],
  VinaHouse: ["Fast", "Bouncy", "Festival", "Bright Lead", "Hard Drums", "Energy"],
  "Study Beats": ["Lo-fi", "Warm Chords", "Soft Drums", "Calm", "Focus", "Vinyl"],
  Jazz: ["Live Feel", "Rich Chords", "Swing", "Warm", "Bass", "Expressive"],
  "New Jazz": ["Jazzy Chords", "Modern", "Tight Pocket", "Clean", "Warm Bass", "Texture"],
  Classical: ["Orchestral", "Strings", "Piano", "Dynamics", "Cinematic", "Hall"],
  Opera: ["Dramatic", "Orchestral", "Grand", "Hall Reverb", "Power", "Theme"],
  Oriental: ["Scales", "Oud", "Darbuka", "Ornaments", "Cinematic", "Hypnotic"],
  "Guitar Acoustic Live": ["Live", "Acoustic", "Natural Room", "Fingerpicking", "Intimate", "Warm"],
  "Piano Acoustic Live": ["Live", "Piano", "Natural Room", "Dynamics", "Intimate", "Warm"],
  "Rage + Ambient": ["Rage Lead", "Ambient Pads", "Ethereal", "Big Drops", "Wide", "Hype"],
  "Holographic R&B": ["Shimmer", "Glossy Chords", "Neon", "Smooth Drums", "Future", "Sensual"],
  "Futuristic Trap Soul": ["Trap Soul", "Futuristic", "Emotional", "808", "Clean Drums", "Airy"],
  "Ambient Drill": ["Drill Drums", "Ambient Pads", "Cold", "Wide", "Minimal", "808 Slides"],
  "Cinematic Afro Trap": ["Afro Perc", "Trap Drums", "Cinematic", "Big Transitions", "Energy", "Hybrid"],
  "AI-assisted Pop": ["Modern Pop", "Futuristic", "Catchy Hook", "Clean", "Polished", "Earworm"],
  "Experimental Afro House": ["Afro House", "Experimental", "Futuristic", "Hypnotic", "Textures", "Club"],
  "Hyper Melodic Rap": ["Hooky", "Melodic", "Emotional", "Modern Drums", "Bright", "Vocal Space"],
  "Dark Atmospheric Pop": ["Moody", "Cinematic", "Pop Drums", "Dark", "Hooky", "Wide"],
  "Y2K Futuristic Pop": ["Y2K", "Glossy", "2000s", "Future", "Catchy", "Ear Candy"],
  "Hybrid Electronic Rap": ["Rap Drums", "Electronic", "Club", "Sound Design", "Tight", "Energy"],
  "Sci-Fi R&B": ["Alien Textures", "Moody", "Wide", "Deep Sub", "Minimal", "Future"],
  "Ethereal Trap": ["Airy", "Shimmer", "Dreamy", "Minimal Drums", "Deep 808", "Float"],
  "Nostalgic Future Beats": ["Nostalgic", "Future", "Warm Chords", "Shimmer", "Modern Drums", "Retro"],
};

const defaultInspirationChips = ["Dark", "Melodic", "Emotional", "Hard", "Smooth", "Atmospheric"] as const;

function getInspirationChipsForGenre(genre: string) {
  return (genreInspirationChips[genre] ?? defaultInspirationChips) as readonly string[];
}

function detectLanguage(text: string): string {
  if (!text || text.trim().length < 3) return "en";
  const frPattern = /\b(je|tu|il|elle|nous|vous|ils|elles|le|la|les|un|une|des|et|est|pas|que|qui|dans|sur|avec|pour|mon|ton|son|ma|ta|sa)\b/i;
  const esPattern = /\b(yo|tú|él|ella|nosotros|los|las|una|del|por|para|con|que|como|pero|este|esta|muy|más)\b/i;
  const ptPattern = /\b(eu|você|ele|ela|nós|os|as|um|uma|do|da|por|para|com|que|como|mas|este|essa|muito)\b/i;
  if (frPattern.test(text)) return "fr";
  if (esPattern.test(text)) return "es";
  if (ptPattern.test(text)) return "pt";
  return "en";
}

function parseKeyScale(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { key: "", scale: "" };
  if (parts.length === 1) return { key: parts[0], scale: "" };
  return { key: parts[0], scale: parts.slice(1).join(" ") };
}

const presets = [
  {
    name: "Trapsoul — OG Parker",
    genre: "Trapsoul",
    influence: "OG Parker",
    bpm: 140,
    mood: "Melancholic",
    energyLevel: "Medium",
    loopLength: "8 bars" as LoopLength,
    prompt: "dark melodic trap, smooth 808s, emotional",
    key: "F#",
    scale: "Minor",
  },
  {
    name: "Drill — Aggressive",
    genre: "Drill",
    influence: "Southside",
    bpm: 150,
    mood: "Aggressive",
    energyLevel: "High",
    loopLength: "8 bars" as LoopLength,
    prompt: "hard hitting drums, sliding 808s, dark synth stabs",
    key: "G",
    scale: "Minor",
  },
  {
    name: "Melodic Trap — Dreamy",
    genre: "Melodic Trap",
    influence: "Metro Boomin",
    bpm: 140,
    mood: "Dreamy",
    energyLevel: "Medium",
    loopLength: "16 bars" as LoopLength,
    prompt: "hip-hop trap (Atlanta), emotional guitar/piano motif, airy pads, crisp hats, 808 glides, space for melodic rap",
    key: "A",
    scale: "Minor",
  },
  {
    name: "Old School — Boom Bap",
    genre: "Old School Hip-Hop",
    influence: "Pete Rock",
    bpm: 92,
    mood: "Nostalgic",
    energyLevel: "Chill",
    loopLength: "8 bars" as LoopLength,
    prompt: "chopped soul/jazz sample, dusty drums, MPC swing, subtle scratches",
    key: "F",
    scale: "Minor",
  },
  ] as const;

function barsFromLoopLength(loopLength: LoopLength) {
  const n = Number(loopLength.split(" ")[0]);
  return Number.isFinite(n) && n > 0 ? n : 4;
}

function loopTitleBase(name: string) {
  return name.replace(/\s*#\d+\s*$/, "").trim();
}

function loopTitleNum(name: string) {
  const m = name.match(/#(\d+)\s*$/);
  const n = m ? Number(m[1]) : NaN;
  return Number.isFinite(n) ? n : null;
}

function compareWorkspaceLoops(a: Loop, b: Loop) {
  const baseA = loopTitleBase(a.name);
  const baseB = loopTitleBase(b.name);
  const numA = loopTitleNum(a.name);
  const numB = loopTitleNum(b.name);
  if (baseA === baseB && numA !== null && numB !== null && numA !== numB) {
    return numB - numA;
  }
  return Date.parse(b.createdAt ?? "") - Date.parse(a.createdAt ?? "");
}

export default function Dashboard() {
  type GenerationSlot = {
    idx: 1 | 2;
    status: "generating" | "error";
    errorText?: string;
    seed?: number;
    title: string;
    visible: boolean;
    previewReady?: boolean;
    previewLoopId?: string;
    generationKey?: string;
  };

  const navigate = useNavigate();
  const form = useGeneratorStore((s) => s.form);
  const setField = useGeneratorStore((s) => s.setField);
  const setBpm = useGeneratorStore((s) => s.setBpm);
  const setLoopLength = useGeneratorStore((s) => s.setLoopLength);
  const loops = useLoopsStore((s) => s.loops);
  const loopsLoading = useLoopsStore((s) => s.loading);
  const loopsSyncError = useLoopsStore((s) => s.lastSyncError);
  const loadMyLoops = useLoopsStore((s) => s.loadMyLoops);
  const durationsSecById = useLoopsStore((s) => s.durationsSecById);
  const createLoop = useLoopsStore((s) => s.createLoop);
  const upsertLoop = useLoopsStore((s) => s.upsertLoop);
  const enqueuePendingSave = useLoopsStore((s) => s.enqueuePendingSave);
  const removeLoop = useLoopsStore((s) => s.removeLoop);
  const primeAudioCache = useLoopsStore((s) => s.primeAudioCache);
  const migrateAudioCache = useLoopsStore((s) => s.migrateAudioCache);
  const renameLoopRemote = useLoopsStore((s) => s.renameLoopRemote);
  const setCurrent = usePlayerStore((s) => s.setCurrent);
  const user = useAuthStore((s) => s.user);
  const authStatus = useAuthStore((s) => s.status);
  const locale = useLocaleStore((s) => s.locale);
  const [generating, setGenerating] = useState(false);
  const [generationSlots, setGenerationSlots] = useState<GenerationSlot[] | null>(null);
  const [workspaceJobs, setWorkspaceJobs] = useState<Array<{ id: string; title: string; sub: string }>>([]);
  const [versions, setVersions] = useState<1 | 2>(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("producerhit_versions") : null;
    return saved === "1" ? 1 : 2;
  });
  const [plan, setPlan] = useState(() => {
    try {
      const raw = window.localStorage.getItem("producerhit_plan");
      return raw === "pro" || raw === "studio" || raw === "free" ? raw : "free";
    } catch {
      return "free";
    }
  });
  const [usedThisMonth, setUsedThisMonth] = useState(() => {
    try {
      const raw = window.localStorage.getItem("producerhit_used_this_month");
      const n = raw ? Number(raw) : 0;
      return Number.isFinite(n) && n >= 0 ? n : 0;
    } catch {
      return 0;
    }
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [entrySource, setEntrySource] = useState<string>("unknown");
  const [audioFormat, setAudioFormat] = useState<"mp3" | "wav">("mp3");
  const audioFormatTouchedRef = useRef(false);
  const setAudioFormatPref = (fmt: "mp3" | "wav") => {
    audioFormatTouchedRef.current = true;
    setAudioFormat(fmt);
  };
  const [query, setQuery] = useState("");
  const [savedOnly, setSavedOnly] = useState(false);
  const [requestedTitle, setRequestedTitle] = useState(() => {
    try {
      return window.localStorage.getItem("producerhit_requested_title") || "";
    } catch {
      return "";
    }
  });
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [mode, setMode] = useState<"beat" | "song">(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("producerhit_mode") : null;
    return saved === "beat" ? "beat" : "song";
  });
  const [advancedOpen, setAdvancedOpen] = useState<boolean>(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("producerhit_advanced") : null;
    return saved === "true";
  });
  const engine = "ace-step" as const;
  const [lyricsMode, setLyricsMode] = useState<"ai" | "manual">("manual");
  const [songUiMode, setSongUiMode] = useState<"simple" | "custom">("simple");
  const [lyrics, setLyrics] = useState("");
  const [songDescription, setSongDescription] = useState("");
  const [songVocalStyle, setSongVocalStyle] = useState<(typeof vocalStyleOptions)[number]["value"]>("Singer");
  const [songTempoMode, setSongTempoMode] = useState<"auto" | "manual">("auto");
  const [songKeyMode, setSongKeyMode] = useState<"auto" | "manual">("auto");
  const [beatTempoMode, setBeatTempoMode] = useState<"auto" | "manual">("auto");
  const [beatKeyMode, setBeatKeyMode] = useState<"auto" | "manual">("auto");
  const [songDurationMode, setSongDurationMode] = useState<"auto" | "manual">("auto");
  const [songTimeSignatureMode, setSongTimeSignatureMode] = useState<"auto" | "manual">("auto");
  const [songVocalLanguageMode, setSongVocalLanguageMode] = useState<"auto" | "manual">("auto");
  const [manualVocalLanguage, setManualVocalLanguage] = useState("en");
  const [songDurationSec, setSongDurationSec] = useState(30);
  const [songTimeSignature, setSongTimeSignature] = useState<(typeof timeSignatureOptions)[number]>("4/4");
  const [beatInstrumental] = useState(true);
  const [activeChips, setActiveChips] = useState<string[]>([]);
  const [autoGeneratePending, setAutoGeneratePending] = useState(false);
  const [pendingLandingPrompt, setPendingLandingPrompt] = useState<string | null>(null);
  const [externalSeed, setExternalSeed] = useState<number | null>(null);
  const autoLandingGenerateRef = useRef(false);
  const debugEnabled = useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get("debug") === "1";
    } catch {
      return false;
    }
  }, []);

  const refreshProfile = useMemo(() => {
    return async () => {
      if (!user) return;
      setProfileLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error("Not authenticated");
        await supabase.rpc("reset_loops_usage_if_needed");
        const { data, error } = await supabase
          .from("profiles")
          .select("plan, loops_used_this_month")
          .eq("id", user.id)
          .single();
        if (error) throw error;
        const nextPlan = typeof data?.plan === "string" ? data.plan : "free";
        const nextUsed = typeof data?.loops_used_this_month === "number" ? data.loops_used_this_month : 0;
        setPlan(nextPlan);
        setUsedThisMonth(nextUsed);
        try {
          window.localStorage.setItem("producerhit_plan", nextPlan);
          window.localStorage.setItem("producerhit_used_this_month", String(nextUsed));
        } catch {
          // ignore
        }
        return nextPlan;
      } catch {
        return plan;
      } finally {
        setProfileLoading(false);
      }
    };
  }, [plan, user]);

  const detailsLoop = useMemo(() => {
    if (!detailsId) return null;
    return loops.find((l) => l.id === detailsId) ?? null;
  }, [detailsId, loops]);

  const [detailsTitle, setDetailsTitle] = useState("");
  const [savingDetailsTitle, setSavingDetailsTitle] = useState(false);
  useEffect(() => {
    setDetailsTitle(detailsLoop?.name ?? "");
  }, [detailsLoop?.id, detailsLoop?.name]);

  useEffect(() => {
    const hasActiveGeneration =
      generating || (generationSlots?.some((s) => s.visible && s.status === "generating") ?? false);
    if (!hasActiveGeneration) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [generating, generationSlots]);

  useEffect(() => {
    if (authStatus !== "ready") return;
    if (!user) return;
    void refreshProfile();
  }, [authStatus, refreshProfile, user]);

  useEffect(() => {
    if (authStatus !== "ready") return;
    if (!user) return;
    if (loopsLoading) return;
    if (loops.length > 0) return;
    const t = window.setTimeout(() => {
      if (!useAuthStore.getState().user) return;
      if (useLoopsStore.getState().loading) return;
      if (useLoopsStore.getState().loops.length > 0) return;
      void useLoopsStore.getState().loadMyLoops();
    }, 450);
    return () => window.clearTimeout(t);
  }, [authStatus, loops.length, loopsLoading, user]);

  useEffect(() => {
    if (plan === "free") {
      if (audioFormat !== "mp3") setAudioFormat("mp3");
      return;
    }
    if (!audioFormatTouchedRef.current) setAudioFormat("wav");
  }, [audioFormat, plan]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "true") {
      toast.success(locale === "fr" ? "🎉 Paiement reçu. Activation de ton plan…" : "🎉 Payment received. Activating your plan…");
      window.history.replaceState({}, "", "/dashboard");
      void (async () => {
        for (let i = 0; i < 8; i++) {
          const nextPlan = await refreshProfile();
          if (nextPlan && nextPlan !== "free") {
            toast.success(locale === "fr" ? `Plan activé : ${nextPlan}` : `Plan activated: ${nextPlan}`);
            return;
          }
          await new Promise((r) => setTimeout(r, 1200));
        }
      })();
    }
  }, [locale, refreshProfile]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlPrompt = params.get("prompt");
    const urlSeedRaw = params.get("seed");
    const urlSeed = urlSeedRaw && /^\d+$/.test(urlSeedRaw) ? Number(urlSeedRaw) : null;
    const localPrompt = window.localStorage.getItem("producerhit_pending_prompt");
    const pendingPrompt = urlPrompt || localPrompt;
    if (!pendingPrompt && urlSeed === null) return;

    let decoded = pendingPrompt;
    try {
      decoded = decodeURIComponent(pendingPrompt);
    } catch {
      decoded = pendingPrompt;
    }

    if (pendingPrompt) setPendingLandingPrompt(decoded);
    if (urlSeed !== null && Number.isFinite(urlSeed)) setExternalSeed(urlSeed);
    window.localStorage.removeItem("producerhit_pending_prompt");
    try {
      const src = window.localStorage.getItem("producerhit_pending_source");
      if (src) {
        setEntrySource(src);
        window.localStorage.removeItem("producerhit_pending_source");
      }
    } catch {
      void 0;
    }
    if (urlPrompt) window.history.replaceState({}, "", "/dashboard");
  }, []);

  useEffect(() => {
    trackClientEvent("dashboard_view", { source: entrySource });
  }, [entrySource]);

  useEffect(() => {
    window.localStorage.setItem("producerhit_mode", mode);
  }, [mode]);

  useEffect(() => {
    try {
      window.localStorage.setItem("producerhit_requested_title", requestedTitle);
    } catch {
      // ignore
    }
  }, [requestedTitle]);

  useEffect(() => {
    window.localStorage.setItem("producerhit_advanced", advancedOpen ? "true" : "false");
  }, [advancedOpen]);

  useEffect(() => {
    setActiveChips([]);
  }, [form.genre]);

  useEffect(() => {
    if (!form.genre) setField("genre", "Auto");
  }, [form.genre, setField]);

  const remaining = getRemainingBeats(plan, usedThisMonth);
  const remainingAfterGenerate = Math.max(0, remaining - versions);
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("producerhit_versions", String(versions));
  }, [versions]);

  useEffect(() => {
    if (versions === 2 && remaining < 2) setVersions(1);
  }, [remaining, versions]);
  const consumeCredit = useCallback(() => {
    setUsedThisMonth((v) => v + 1);
    if (user) void refreshProfile();
  }, [refreshProfile, user]);
  const inferGenreFromPrompt = useCallback((p: string) => {
    const s = p.toLowerCase();
    if (s.includes("pluggnb") || s.includes("pluggn")) return "PluggnB";
    if (s.includes("rage + ambient") || s.includes("rage ambient")) return "Rage + Ambient";
    if (s.includes("experimental rage")) return "Experimental Rage";
    if (s.includes("rage")) return "Rage";
    if (s.includes("vinahouse")) return "VinaHouse";
    if (s.includes("k-pop") || s.includes("kpop")) return "K-Pop";
    if (s.includes("vaporwave")) return "Vaporwave";
    if (s.includes("synthwave") || s.includes("synth wave")) return "Synthwave";
    if (s.includes("witch house")) return "Witch House";
    if (s.includes("glitchcore")) return "Glitchcore";
    if (s.includes("digicore")) return "Digicore";
    if (s.includes("dubstep")) return "Dubstep";
    if (s.includes("chillstep")) return "Chillstep";
    if (s.includes("edm")) return "EDM";
    if (s.includes("brazilian phonk") || (s.includes("phonk") && !s.includes("drift"))) return "Brazilian Phonk";
    if (s.includes("study beats") || s.includes("study beat")) return "Study Beats";
    if (s.includes("dark r&b") || s.includes("dark rnb")) return "Dark R&B";
    if (s.includes("future r&b") || s.includes("future rnb")) return "Future R&B";
    if (s.includes("toxic r&b") || s.includes("toxic rnb")) return "Toxic R&B";
    if (s.includes("afro r&b") || s.includes("afro rnb")) return "Afro R&B";
    if (s.includes("afro house")) return "Afro House";
    if (s.includes("reggae") || s.includes("raggae")) return "Reggae";
    if (s.includes("latin")) return "Latin";
    if (s.includes("cloud rap")) return "Cloud Rap";
    if (s.includes("emo rap")) return "Emo Rap";
    if (s.includes("sad rap")) return "Sad Rap";
    if (s.includes("atmospheric rap")) return "Atmospheric Rap";
    if (s.includes("ambient drill")) return "Ambient Drill";
    if (s.includes("sample drill")) return "Sample Drill";
    if (s.includes("melodic drill")) return "Melodic Drill";
    if (s.includes("ambient trap")) return "Ambient Trap";
    if (s.includes("cinematic trap")) return "Cinematic Trap";
    if (s.includes("experimental trap")) return "Experimental Trap";
    if (s.includes("emotional trap")) return "Emotional Trap";
    if (s.includes("holographic r&b") || s.includes("holographic rnb")) return "Holographic R&B";
    if (s.includes("futuristic trap soul")) return "Futuristic Trap Soul";
    if (s.includes("cinematic afro trap")) return "Cinematic Afro Trap";
    if (s.includes("ai-assisted pop") || s.includes("ai assisted pop")) return "AI-assisted Pop";
    if (s.includes("experimental afro house")) return "Experimental Afro House";
    if (s.includes("hyper melodic rap")) return "Hyper Melodic Rap";
    if (s.includes("dark atmospheric pop")) return "Dark Atmospheric Pop";
    if (s.includes("y2k") && s.includes("pop")) return "Y2K Futuristic Pop";
    if (s.includes("hybrid electronic rap")) return "Hybrid Electronic Rap";
    if (s.includes("sci-fi r&b") || s.includes("sci fi r&b") || s.includes("sci-fi rnb") || s.includes("sci fi rnb")) return "Sci-Fi R&B";
    if (s.includes("ethereal trap")) return "Ethereal Trap";
    if (s.includes("nostalgic future")) return "Nostalgic Future Beats";
    if (s.includes("afrobeats") || s.includes("afro")) return "Afrobeats";
    if (s.includes("jersey drill")) return "Jersey Drill";
    if (s.includes("uk drill")) return "UK Drill";
    if (s.includes("ny drill")) return "NY Drill";
    if (s.includes("drill")) return "Drill";
    if (s.includes("trapsoul") || s.includes("trap soul")) return "Trapsoul";
    if (s.includes("r&b") || s.includes("rnb")) return "90s R&B";
    if (s.includes("boom bap") || s.includes("boombap") || s.includes("old school") || s.includes("old-school")) return "Old School Hip-Hop";
    if (s.includes("uk garage") || s.includes("2-step")) return "UK Garage";
    if (s.includes("pop")) return "Pop";
    if (s.includes("trap")) return "Dark Trap";
    return "Pop";
  }, []);
  const displayedLoops = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = loops.filter((l) => {
      if (savedOnly && !l.isSaved) return false;
      if (!normalized) return true;
      const hay = `${l.name} ${l.genre} ${l.mood} ${l.key} ${l.scale}`.toLowerCase();
      return hay.includes(normalized);
    });
    return filtered
      .slice()
      .sort(compareWorkspaceLoops)
      .filter((l, i, arr) => arr.findIndex((x) => x.id === l.id) === i)
      .slice(0, 30);
  }, [loops, query, savedOnly]);
  const generationBatchLoopIds = useMemo(() => {
    if (!generationSlots?.length) return new Set<string>();
    const ids = new Set<string>();
    for (const slot of generationSlots) {
      if (slot.previewLoopId) {
        const preview = loops.find((l) => l.id === slot.previewLoopId);
        if (preview) {
          ids.add(preview.id);
          continue;
        }
      }
      const saved = loops
        .filter((l) => l.name === slot.title && !l.id.startsWith("preview-"))
        .sort((a, b) => Date.parse(b.createdAt ?? "") - Date.parse(a.createdAt ?? ""))[0];
      if (saved) ids.add(saved.id);
    }
    return ids;
  }, [generationSlots, loops]);
  const workspaceDisplayedLoops = useMemo(() => {
    if (!generationBatchLoopIds.size) return displayedLoops;
    return displayedLoops.filter((l) => !generationBatchLoopIds.has(l.id));
  }, [displayedLoops, generationBatchLoopIds]);
  const totalMatches = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return loops.filter((l) => {
      if (savedOnly && !l.isSaved) return false;
      if (!normalized) return true;
      const hay = `${l.name} ${l.genre} ${l.mood} ${l.key} ${l.scale}`.toLowerCase();
      return hay.includes(normalized);
    }).length;
  }, [loops, query, savedOnly]);

  const startWorkspaceJob = useCallback(
    (title: string, sub: string) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `job-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setWorkspaceJobs((prev) => [{ id, title, sub }, ...prev]);
      return () => setWorkspaceJobs((prev) => prev.filter((j) => j.id !== id));
    },
    [setWorkspaceJobs],
  );

  const bars = barsFromLoopLength(form.loopLength);
  const isSong = mode === "song";
  const effectiveEngine = isSong ? "ace-step" : engine;
  const songIsCustom = isSong && songUiMode === "custom";
  const effectiveAudioFormat = plan === "free" ? "mp3" : audioFormat;

  const effectiveBpm = isSong 
    ? (songIsCustom && songTempoMode === "manual" ? form.bpm : 0)
    : (advancedOpen && beatTempoMode === "manual" ? form.bpm : 0);
    
  const effectiveKey = isSong
    ? (songIsCustom && songKeyMode === "manual" ? form.key : "")
    : (advancedOpen && beatKeyMode === "manual" ? form.key : "");

  const effectiveScale = isSong
    ? (songIsCustom && songKeyMode === "manual" ? form.scale : "")
    : (advancedOpen && beatKeyMode === "manual" ? form.scale : "");

  const autoMetaEnabled = isSong 
    ? !songIsCustom || (songTempoMode === "auto" && songKeyMode === "auto")
    : !advancedOpen || (beatTempoMode === "auto" && beatKeyMode === "auto");

  const detectedLang = isSong ? (songVocalLanguageMode === "manual" ? manualVocalLanguage : (lyricsMode === "manual" ? detectLanguage(lyrics) : "en")) : "en";
  const songLyrics = isSong ? (lyricsMode === "manual" ? lyrics : "") : "";
  const songDurationMax = 240;
  const manualSongDurationRaw = songIsCustom && songDurationMode === "manual" ? songDurationSec : undefined;
  const manualSongDuration = typeof manualSongDurationRaw === "number" ? Math.min(manualSongDurationRaw, songDurationMax) : undefined;
  const manualSongTimeSignature = songIsCustom && songTimeSignatureMode === "manual" ? songTimeSignature : "";
  const chipExtra = !isSong ? activeChips.join(", ") : "";
  const uiPrompt = isSong
    ? [
        form.genre && form.genre !== "Auto" ? `${form.genre}` : "",
        songDescription.trim(),
        songVocalStyle ? `vocal style: ${songVocalStyle}` : "",
      ]
        .filter(Boolean)
        .join(", ")
    : [form.prompt?.trim() ?? "", chipExtra].filter((s) => s.length > 0).join(", ");

  const aceDebugParams = useMemo<GenerateParams>(() => {
    return {
      genre: form.genre,
      influence: form.influence,
      key: effectiveKey,
      scale: effectiveScale,
      bpm: effectiveBpm,
      loopLengthBars: bars,
      swing: form.swing,
      mood: isSong ? "" : form.mood,
      energyLevel: isSong ? "" : form.energyLevel,
      reverb: form.reverb,
      prompt: uiPrompt,
    };
  }, [
    bars,
    effectiveBpm,
    effectiveKey,
    effectiveScale,
    form.energyLevel,
    form.genre,
    form.influence,
    form.mood,
    form.reverb,
    form.swing,
    isSong,
    uiPrompt,
  ]);

  const handleGenerate = useCallback(async () => {
    if (remaining < versions) return;
    if (generating) return;
    setGenerating(true);
    const titleCase = (s: string) =>
      s
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

    const compactWords = (text: string) => {
      const cleaned = text
        .replace(/[\u2018\u2019\u201C\u201D]/g, "'")
        .replace(/[^a-zA-Z0-9À-ÿ' -]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (!cleaned) return [];
      const stop = new Set([
        "a",
        "an",
        "the",
        "and",
        "or",
        "to",
        "of",
        "in",
        "on",
        "for",
        "with",
        "without",
        "my",
        "your",
        "our",
        "me",
        "you",
        "we",
        "i",
        "je",
        "tu",
        "il",
        "elle",
        "nous",
        "vous",
        "ils",
        "elles",
        "le",
        "la",
        "les",
        "un",
        "une",
        "des",
        "de",
        "du",
        "dans",
        "sur",
        "avec",
        "pour",
        "sans",
      ]);
      return cleaned
        .split(" ")
        .map((w) => w.trim())
        .filter((w) => w.length >= 3 && !stop.has(w.toLowerCase()))
        .slice(0, 6);
    };

    const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const normalizeTitle = (s: string) =>
      s
        .trim()
        .replace(/\s+/g, " ")
        .replace(/[<>]/g, "")
        .slice(0, 72);

    const normalizedGenreForPrompt = form.genre === "Auto" ? "" : form.genre;
    const source = (isSong ? songDescription : form.prompt || uiPrompt || normalizedGenreForPrompt).trim();
    const inferredWords = compactWords(source);
    const defaultBase = inferredWords.length
      ? titleCase(inferredWords.join(" "))
      : titleCase(form.genre === "Auto" ? "Auto" : form.genre);
    const baseTitle = normalizeTitle(requestedTitle) || defaultBase;

    const titleIndexStart = (() => {
      const re = new RegExp(`^${escapeRegExp(baseTitle)}\\s+#(\\d+)\\b`);
      let max = 0;
      for (const l of loops) {
        const m = l.name.match(re);
        if (!m) continue;
        const n = Number(m[1]);
        if (Number.isFinite(n) && n > max) max = n;
      }
      return max + 1;
    })();

    const makeTitle = (idx: 1 | 2) => {
      const n = titleIndexStart + (idx - 1);
      return `${baseTitle} #${String(n).padStart(2, "0")}`;
    };

    const randInt = (maxExclusive: number) => {
      if (maxExclusive <= 1) return 0;
      try {
        const a = new Uint32Array(1);
        crypto.getRandomValues(a);
        return a[0] % maxExclusive;
      } catch {
        return Math.floor(Math.random() * maxExclusive);
      }
    };

    const seed1 = externalSeed ?? randInt(999999);
    const seed2 = seed1 + 12345;
    const slots: GenerationSlot[] =
      versions === 2
        ? [
            { idx: 1, status: "generating", title: makeTitle(1), seed: seed1, visible: true, previewReady: false },
            { idx: 2, status: "generating", title: makeTitle(2), seed: seed2, visible: true, previewReady: false },
          ]
        : [{ idx: 1, status: "generating", title: makeTitle(1), seed: seed1, visible: true, previewReady: false }];
    setGenerationSlots(slots);

    let didGenerate = false;
    try {
      trackClientEvent("generate_start", { mode, versions, plan, source: entrySource });
      const prompt = isSong ? uiPrompt : [form.prompt?.trim() ?? "", chipExtra].filter((s) => s.length > 0).join(", ");

      const inputParams = {
        genre: normalizedGenreForPrompt,
        influence: form.influence,
        key: effectiveKey,
        scale: effectiveScale,
        bpm: effectiveBpm,
        loopLengthBars: bars,
        swing: form.swing,
        mood: isSong ? "" : form.mood,
        energyLevel: isSong ? "" : form.energyLevel,
        reverb: form.reverb,
        prompt: uiPrompt,
      };

      const buildOptions = (seed?: number) =>
        isSong
          ? {
              instrumental: false,
              lyrics: songLyrics,
              vocalLanguage: detectedLang,
              autoMeta: autoMetaEnabled,
              duration: manualSongDuration,
              timeSignature: manualSongTimeSignature || undefined,
              isSong: true,
              audioFormat: effectiveAudioFormat,
              seed,
            }
          : {
              instrumental: beatInstrumental,
              lyrics: "",
              vocalLanguage: "en",
              isSong: false,
              autoMeta: autoMetaEnabled,
              audioFormat: effectiveAudioFormat,
              seed,
            };

      if (debugEnabled) {
        try {
          const previewCaption = buildAceCaption(
            autoMetaEnabled ? { ...inputParams, bpm: 0, key: "", scale: "" } : inputParams,
            { isSong, instrumental: isSong ? false : beatInstrumental, autoMeta: autoMetaEnabled, vocalLanguage: detectedLang },
          );
          console.log("[GEN UI]", {
            mode,
            songUiMode,
            lyricsMode,
            detectedLang,
            params: inputParams,
            aceCaption: previewCaption,
            options: buildOptions(seed1),
          });
        } catch {
          // ignore
        }
      }

      const storedPrompt = prompt;

      const buildDraft = (result: Awaited<ReturnType<typeof generateBeat>>, audioUrl: string) => {
        const generatedKeyScale = parseKeyScale(result.meta?.keyScale ?? "");
        const realBpm = result.meta?.bpm && result.meta.bpm > 0 ? result.meta.bpm : 0;
        const realKey = generatedKeyScale.key || "";
        const realScale = generatedKeyScale.scale || "";

        const usedBpm = autoMetaEnabled ? realBpm : effectiveBpm || form.bpm;
        const usedKey = autoMetaEnabled ? realKey : effectiveKey || form.key;
        const usedScale = autoMetaEnabled ? realScale : effectiveScale || form.scale;

        const draft: Omit<Loop, "id" | "createdAt" | "userId"> = {
          engine: result.engine,
          name: "",
          genre: form.genre,
          influence: form.influence,
          key: usedKey,
          scale: usedScale,
          bpm: usedBpm,
          loopLength: form.loopLength,
          swing: form.swing,
          mood: isSong ? "" : form.mood,
          energyLevel: isSong ? "" : form.energyLevel,
          reverb: form.reverb,
          prompt: storedPrompt,
          audioUrl: audioUrl ?? null,
          seed: typeof result.meta?.seed === "number" && Number.isFinite(result.meta.seed) ? result.meta.seed : null,
          details: result.meta
            ? {
                caption: result.meta.prompt ?? storedPrompt,
                lyrics: result.meta.lyrics ?? "",
                bpm: result.meta.bpm ?? null,
                duration: result.meta.duration ?? null,
                keyScale: result.meta.keyScale ?? "",
                timeSignature: result.meta.timeSignature ?? "",
                audioFormat: result.meta.audioFormat ?? effectiveAudioFormat,
              }
            : null,
          stemsUrl: (() => {
            const taskId =
              (typeof result.meta?.taskId === "string" && result.meta.taskId.trim()) ||
              (typeof result.meta?.task_id === "string" && result.meta.task_id.trim()) ||
              "";
            if (!taskId && !result.meta) return null;
            return {
              ace: {
                ...(taskId ? { taskId } : {}),
                ...(typeof result.meta?.stemsZipUrl === "string" && result.meta.stemsZipUrl.trim().length > 0
                  ? { stemsZipUrl: result.meta.stemsZipUrl.trim() }
                  : {}),
              },
            } as Record<string, unknown>;
          })(),
          isSaved: false,
          isPublic: true,
        };
        return { draft, usedBpm, usedKey, usedScale };
      };

      const persistDraft = async (
        draft: Omit<Loop, "id" | "createdAt" | "userId">,
        audioUrl: string,
        engineLabel: string,
        replaceLoopId?: string,
      ): Promise<Loop> => {
        try {
          const loop = await createLoop(draft, replaceLoopId ? { replaceLoopId } : undefined);
          return loop;
        } catch (err) {
          const message = err instanceof Error ? err.message : "Saving failed";
          const id =
            typeof crypto !== "undefined" && "randomUUID" in crypto ? `local-${crypto.randomUUID()}` : `local-${Date.now()}`;
          const createdAt = new Date().toISOString();
          const temp: Loop = {
            id,
            engine: engineLabel,
            name: draft.name,
            genre: draft.genre,
            influence: draft.influence,
            key: draft.key,
            scale: draft.scale,
            bpm: draft.bpm,
            loopLength: draft.loopLength,
            swing: draft.swing,
            mood: draft.mood,
            energyLevel: draft.energyLevel,
            reverb: draft.reverb,
            prompt: draft.prompt,
            audioUrl,
            seed: draft.seed ?? null,
            details: draft.details ?? null,
            stemsUrl: draft.stemsUrl,
            isSaved: false,
            isPublic: true,
            createdAt,
          };
          upsertLoop(temp);
          enqueuePendingSave(draft, id, createdAt);
          toast.error(
            locale === "fr"
              ? `Généré, mais l’enregistrement a échoué : ${message}`
              : `Generated, but saving to your library failed: ${message}`,
          );
          return temp;
        }
      };

      const created: Loop[] = [];

      const setSlot = (idx: 1 | 2, next: Partial<GenerationSlot>) => {
        setGenerationSlots((prev) => {
          if (!prev) return prev;
          return prev.map((it) => (it.idx === idx ? { ...it, ...next } : it));
        });
      };

      const startOne = async (idx: 1 | 2, seed: number, title: string) => {
        const generationKey =
          typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `gen-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        let previewId: string | null = null;
        setSlot(idx, {
          status: "generating",
          seed,
          title,
          visible: true,
          previewReady: false,
          generationKey,
        });

        const userNetworkErrorText =
          locale === "fr"
            ? "Réseau chargé — réessaie dans quelques secondes. Upgrade pour avoir la priorité."
            : "Network busy — try again in a few seconds. Upgrade to get priority.";

        try {
          const isRetryable = (msg: string) => {
            const s = msg.toLowerCase();
            return (
              s.includes("too many requests") ||
              s.includes("429") ||
              s.includes("failed to fetch") ||
              s.includes("network") ||
              s.includes("timeout") ||
              s.includes("timed out") ||
              s.includes("502") ||
              s.includes("503") ||
              s.includes("504") ||
              s.includes("cors")
            );
          };

          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              const value = await generateBeat(inputParams, effectiveEngine, { ...buildOptions(seed), generationKey });
              const audioUrl = value.audioUrl;
              if (!audioUrl) throw new Error(locale === "fr" ? "Audio manquant" : "Missing audio");
              didGenerate = true;
              const { draft } = buildDraft(value, audioUrl);
              draft.name = title;

              previewId = `preview-${generationKey}`;
              const previewLoop: Loop = {
                id: previewId,
                userId: user?.id,
                createdAt: new Date().toISOString(),
                engine: draft.engine,
                name: title,
                genre: draft.genre,
                influence: draft.influence,
                key: draft.key,
                scale: draft.scale,
                bpm: draft.bpm,
                loopLength: draft.loopLength,
                swing: draft.swing,
                mood: draft.mood,
                energyLevel: draft.energyLevel,
                reverb: draft.reverb,
                prompt: draft.prompt,
                audioUrl,
                seed: draft.seed ?? null,
                details: draft.details ?? null,
                stemsUrl: draft.stemsUrl ?? null,
                isSaved: false,
                isPublic: draft.isPublic,
              };
              upsertLoop(previewLoop);
              setSlot(idx, { visible: false, previewLoopId: previewId, previewReady: true });
              primeAudioCache(previewId, audioUrl);

              const loop = await persistDraft(draft, audioUrl, value.engine, previewId);
              await migrateAudioCache(previewId, loop.id);
              created.push(loop);
              trackClientEvent("generate_success", { loop_id: loop.id, mode, versions, plan, source: entrySource });
              consumeCredit();
              previewId = null;
              break;
            } catch (e) {
              const msg = e instanceof Error ? e.message : String(e);
              if (!isRetryable(msg) || attempt === 1) throw e;
              await new Promise((r) => setTimeout(r, 1600));
            }
          }
        } catch (err) {
          const rawMessage = err instanceof Error ? err.message : String(err);
          const lower = rawMessage.toLowerCase();
          const isTemporaryNetwork =
            lower.includes("failed to fetch") ||
            lower.includes("networkerror") ||
            lower.includes("load resource") ||
            lower.includes("net::err_failed") ||
            lower.includes("cors") ||
            lower.includes("timeout") ||
            lower.includes("timed out") ||
            lower.includes("502") ||
            lower.includes("503") ||
            lower.includes("504") ||
            lower.includes("429") ||
            lower.includes("too many requests");
          const errorText = isTemporaryNetwork ? userNetworkErrorText : rawMessage || (locale === "fr" ? "Erreur" : "Error");
          if (previewId) {
            removeLoop(previewId);
            previewId = null;
          }
          setSlot(idx, { status: "error", errorText, visible: true });
        }
      };

      if (versions !== 2) {
        await startOne(1, seed1, makeTitle(1));
      } else {
        await Promise.all([
          startOne(1, seed1, makeTitle(1)),
          (async () => {
            await new Promise((r) => setTimeout(r, 700));
            await startOne(2, seed2, makeTitle(2));
          })(),
        ]);
      }

      if (!created.length) throw new Error(locale === "fr" ? "Échec de génération — réessaie" : "Generation failed — please try again");

      setExternalSeed(null);
      const successCount = created.length;
      if (versions === 2) {
        toast.success(
          successCount === 2
            ? locale === "fr"
              ? "2 versions générées — choisis la meilleure !"
              : "2 versions generated — pick the best one!"
            : locale === "fr"
              ? "1 version sur 2 générée — l’autre a échoué."
              : "1 of 2 versions generated — the other failed.",
        );
      } else {
        toast.success(locale === "fr" ? "Beat généré !" : "Beat generated!");
      }
    } catch (err) {
      const anyErr = err as unknown as { limitReached?: boolean };
      if (anyErr?.limitReached) {
        toast.error(locale === "fr" ? "Limite mensuelle atteinte — upgrade ton plan" : "Monthly limit reached — upgrade your plan");
        navigate(user ? "/pricing?plan=pro&checkout=1" : "/pricing");
        return;
      }
      const rawMessage = err instanceof Error ? err.message : "";
      const lower = rawMessage.toLowerCase();
      const isTemporaryNetwork =
        lower.includes("failed to fetch") ||
        lower.includes("networkerror") ||
        lower.includes("load resource") ||
        lower.includes("net::err_failed") ||
        lower.includes("cors") ||
        lower.includes("timeout") ||
        lower.includes("timed out") ||
        lower.includes("502") ||
        lower.includes("503") ||
        lower.includes("504");

      if (isTemporaryNetwork) {
        toast.error(
          locale === "fr"
            ? "Réseau chargé — réessaie dans quelques secondes. Upgrade pour avoir la priorité."
            : "Network busy — try again in a few seconds. Upgrade to get priority.",
        );
      } else {
        const message = rawMessage || (locale === "fr" ? "Échec de génération — réessaie" : "Generation failed — please try again");
        toast.error(message);
      }
    } finally {
      setGenerating(false);
      setGenerationSlots((prev) => {
        if (!prev) return null;
        const remaining = prev.filter((s) => s.visible);
        return remaining.length > 0 ? remaining : null;
      });
      if (didGenerate && user) void refreshProfile();
      if (didGenerate && plan === "free") {
        try {
          const key = "producerhit_upgrade_prompt_ts";
          const lastRaw = window.localStorage.getItem(key);
          const last = lastRaw ? Number(lastRaw) : 0;
          const now = Date.now();
          if (!Number.isFinite(last) || now - last > 6 * 60 * 60 * 1000) {
            window.localStorage.setItem(key, String(now));
            setUpgradeOpen(true);
            trackClientEvent("upgrade_prompt_shown", { source: entrySource });
          }
        } catch {
          void 0;
        }
      }
    }
  }, [
    autoMetaEnabled,
    bars,
    beatInstrumental,
    chipExtra,
    createLoop,
    removeLoop,
    primeAudioCache,
    migrateAudioCache,
    upsertLoop,
    detectedLang,
    effectiveBpm,
    effectiveAudioFormat,
    effectiveEngine,
    effectiveKey,
    effectiveScale,
    externalSeed,
    form.bpm,
    form.energyLevel,
    form.genre,
    form.influence,
    form.key,
    form.loopLength,
    form.mood,
    form.prompt,
    form.reverb,
    form.scale,
    form.swing,
    generating,
    debugEnabled,
    isSong,
    locale,
    consumeCredit,
    lyricsMode,
    loops,
    requestedTitle,
    manualSongDuration,
    manualSongTimeSignature,
    mode,
    songUiMode,
    navigate,
    remaining,
    versions,
    setCurrent,
    songDescription,
    songLyrics,
    songVocalStyle,
    uiPrompt,
    refreshProfile,
    user,
  ]);

  useEffect(() => {
    if (!pendingLandingPrompt) return;
    if (autoLandingGenerateRef.current) return;
    if (profileLoading) return;

    if (remaining === 0) {
      toast.error(locale === "fr" ? "Plus de crédits — upgrade ton plan" : "No credits remaining — upgrade your plan");
      navigate("/pricing");
      setPendingLandingPrompt(null);
      return;
    }

    autoLandingGenerateRef.current = true;
    setMode("song");
    setSongUiMode("simple");
    setLyricsMode("ai");
    setSongDescription(pendingLandingPrompt);
    setField("prompt", pendingLandingPrompt);
    if (!form.genre) setField("genre", inferGenreFromPrompt(pendingLandingPrompt));

    const timer = window.setTimeout(() => {
      void handleGenerate();
    }, 800);

    return () => window.clearTimeout(timer);
  }, [
    form.genre,
    handleGenerate,
    inferGenreFromPrompt,
    locale,
    navigate,
    pendingLandingPrompt,
    profileLoading,
    remaining,
    setField,
    setLyricsMode,
    setMode,
    setSongDescription,
    setSongUiMode,
  ]);

  useEffect(() => {
    if (!user) return;
    const raw = window.localStorage.getItem("producerhit_pending_generation");
    if (!raw) return;
    window.localStorage.removeItem("producerhit_pending_generation");
    try {
      const pending = JSON.parse(raw) as {
        mode?: "beat" | "song";
        engine?: "sonauto" | "ace-step";
        form?: Partial<{
          genre: string;
          influence: string;
          key: string;
          scale: string;
          bpm: number;
          loopLength: string;
          swing: number;
          mood: string;
          energyLevel: string;
          reverb: string;
          prompt: string;
        }>;
        lyricsMode?: "ai" | "manual";
        lyrics?: string;
        songUiMode?: "simple" | "custom";
        songDescription?: string;
        songVocalStyle?: string;
      };
      if (pending.mode) setMode(pending.mode);
      const nextForm = pending.form ?? {};
      if (typeof nextForm.genre === "string") setField("genre", nextForm.genre);
      if (typeof nextForm.influence === "string") setField("influence", nextForm.influence);
      if (typeof nextForm.prompt === "string") setField("prompt", nextForm.prompt);
      if (typeof nextForm.key === "string") setField("key", nextForm.key);
      if (typeof nextForm.scale === "string") setField("scale", nextForm.scale);
      if (typeof nextForm.bpm === "number") setBpm(nextForm.bpm);
      if (typeof nextForm.loopLength === "string") setLoopLength(nextForm.loopLength as LoopLength);
      if (typeof nextForm.swing === "number") setField("swing", nextForm.swing);
      if (typeof nextForm.mood === "string") setField("mood", nextForm.mood);
      if (typeof nextForm.energyLevel === "string") setField("energyLevel", nextForm.energyLevel);
      if (typeof nextForm.reverb === "string") setField("reverb", nextForm.reverb);

      if (pending.lyricsMode) setLyricsMode(pending.lyricsMode);
      if (typeof pending.lyrics === "string") setLyrics(pending.lyrics);
      if (pending.songUiMode) setSongUiMode(pending.songUiMode);
      if (typeof pending.songDescription === "string") setSongDescription(pending.songDescription);
      if (typeof pending.songVocalStyle === "string") {
        const allowed = vocalStyleOptions.some((v) => v.value === pending.songVocalStyle);
        setSongVocalStyle(allowed ? (pending.songVocalStyle as (typeof vocalStyleOptions)[number]["value"]) : "Singer");
      }
      setAutoGeneratePending(true);
    } catch {
      setAutoGeneratePending(false);
    }
  }, [setBpm, setField, setLoopLength, setLyrics, setLyricsMode, setMode, setSongDescription, setSongUiMode, setSongVocalStyle, user]);

  useEffect(() => {
    if (!autoGeneratePending) return;
    if (!user) return;
    if (generating || profileLoading) return;
    if (!form.genre) return;
    setAutoGeneratePending(false);
    void handleGenerate();
  }, [autoGeneratePending, form.genre, generating, handleGenerate, profileLoading, user]);

  return (
    <AppShell
      theme="prism"
      left={
        <div className="flex h-full flex-col overflow-hidden">
          <div className="border-b border-white/10 px-4 pb-3 pt-4">
            <BrandLogo />
          </div>
          <div className="border-b border-pk-border p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMode("song")}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    mode === "song" ? "pk-prism-pill-active" : "bg-white/5 text-white/50 hover:text-white"
                  }`}
                >
                  {locale === "fr" ? "Chanson" : "Song"}
                </button>
                <button
                  type="button"
                  onClick={() => setMode("beat")}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    mode === "beat" ? "pk-prism-pill-active" : "bg-white/5 text-white/50 hover:text-white"
                  }`}
                >
                  Beat
                </button>
              </div>
              {mode === "song" ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSongUiMode("simple")}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      songUiMode === "simple" ? "pk-prism-pill-active" : "bg-white/5 text-white/50 hover:text-white"
                    }`}
                  >
                    Simple
                  </button>
                  <button
                    type="button"
                    onClick={() => setSongUiMode("custom")}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      songUiMode === "custom" ? "pk-prism-pill-active" : "bg-white/5 text-white/50 hover:text-white"
                    }`}
                  >
                    {locale === "fr" ? "Perso" : "Custom"}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAdvancedOpen((v) => !v)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    advancedOpen ? "bg-white/10 text-pk-text" : "bg-white/5 text-pk-muted hover:text-pk-text"
                  }`}
                >
                  {locale === "fr" ? "Avancé" : "Advanced"}
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {mode === "beat" ? (
              <>
                <div className="border-b border-pk-border p-4">
                  <div className="text-sm font-semibold">{locale === "fr" ? "Style & Vibe" : "Style & Vibe"}</div>
                  <div className="mt-4 grid gap-4">
                    <Dropdown
                      label={locale === "fr" ? "Genre" : "Genre"}
                      value={form.genre}
                      onChange={(v) => setField("genre", v)}
                      options={genreOptions}
                      placeholder={locale === "fr" ? "Sélectionner…" : "Select…"}
                    />
                    
                    <div>
                      <div className="text-xs text-pk-muted">{locale === "fr" ? "Ambiance" : "Mood"}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {moodOptions.map((m) => {
                          const active = form.mood === m;
                          return (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setField("mood", m)}
                              className={
                                active
                                  ? "rounded-full border border-pk-accent/40 bg-pk-accent/15 px-3 py-1 text-xs font-semibold text-pk-accent"
                                  : "rounded-full border border-pk-border bg-pk-bg px-3 py-1 text-xs text-pk-muted hover:bg-white/5 hover:text-pk-text"
                              }
                            >
                              {m}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {advancedOpen && (
                      <Dropdown
                        label={locale === "fr" ? "Influence" : "Influence"}
                        value={form.influence}
                        onChange={(v) => setField("influence", v)}
                        options={influenceOptions}
                      />
                    )}
                  </div>
                </div>

                <div className="border-b border-pk-border p-4">
                  <div className="text-sm font-semibold">{locale === "fr" ? "L’idée" : "The Idea"}</div>
                  <div className="mt-2 text-xs text-pk-muted">
                    {locale === "fr" ? "Décris le son, ou utilise les chips." : "Describe the sound or use chips."}
                  </div>
                  
                  <input
                    value={form.prompt}
                    onChange={(e) => setField("prompt", e.target.value)}
                    className="mt-3 w-full rounded-pk border border-pk-border bg-pk-input px-3 py-2 text-sm outline-none placeholder:text-pk-muted focus:border-pk-accent"
                    placeholder={locale === "fr" ? "ex: dark melodic, smooth 808s" : "e.g. dark melodic, smooth 808s"}
                  />
                  
                  <div className="mt-3 flex flex-wrap gap-2">
                    {getInspirationChipsForGenre(form.genre).map((chip) => {
                      const on = activeChips.includes(chip);
                      return (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => {
                            setActiveChips((prev) => (prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip]));
                          }}
                          className={
                            on
                              ? "rounded-full border border-pk-accent/40 bg-pk-accent/15 px-3 py-1 text-[11px] font-semibold text-pk-accent"
                              : "rounded-full border border-pk-border bg-pk-bg px-3 py-1 text-[11px] text-pk-muted hover:bg-white/5 hover:text-pk-text"
                          }
                        >
                          {chip}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-b border-pk-border p-4">
                  <div className="text-sm font-semibold">{locale === "fr" ? "Titre du son" : "Sound Title"}</div>
                  <div className="mt-2 text-xs text-pk-muted">
                    {locale === "fr" ? "Choisis un titre (optionnel)." : "Choose a title (optional)."}
                  </div>
                  <input
                    value={requestedTitle}
                    onChange={(e) => setRequestedTitle(e.target.value)}
                    className="mt-3 w-full rounded-pk border border-pk-border bg-pk-input px-3 py-2 text-sm outline-none placeholder:text-pk-muted focus:border-pk-accent"
                    placeholder={locale === "fr" ? "ex: Pluie sur la ville" : "e.g. Rainy city nights"}
                  />
                </div>

                {advancedOpen && debugEnabled ? (
                  <div className="border-b border-pk-border p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold">ACE Debug</div>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="px-2 py-1 text-[11px]"
                        onClick={() => {
                          const instrumental = true;
                          const promptParams = autoMetaEnabled ? { ...aceDebugParams, bpm: 0, key: "", scale: "" } : aceDebugParams;
                          const caption = buildAceCaption(promptParams, { isSong: false, instrumental, autoMeta: autoMetaEnabled, vocalLanguage: "en" });
                          const payload = {
                            caption,
                            instrumental,
                            vocalLanguage: "en",
                            sampleMode: false,
                            useFormat: true,
                            loopLengthBars: bars,
                            duration: undefined,
                            bpm: autoMetaEnabled ? undefined : aceDebugParams.bpm || undefined,
                            keyScale: autoMetaEnabled ? undefined : aceDebugParams.key && aceDebugParams.scale ? `${aceDebugParams.key} ${aceDebugParams.scale}` : undefined,
                          };
                          void (async () => {
                            try {
                              await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
                              toast.success(locale === "fr" ? "Copié" : "Copied");
                            } catch {
                              toast.error(locale === "fr" ? "Copie impossible" : "Copy failed");
                            }
                          })();
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-2 rounded-pk border border-pk-border bg-white/5 p-3 text-[11px] text-pk-text whitespace-pre-wrap break-words">
                      {(() => {
                        const instrumental = true;
                        const promptParams = autoMetaEnabled ? { ...aceDebugParams, bpm: 0, key: "", scale: "" } : aceDebugParams;
                        const caption = buildAceCaption(promptParams, { isSong: false, instrumental, autoMeta: autoMetaEnabled, vocalLanguage: "en" });
                        const payload = {
                          caption,
                          instrumental,
                          vocalLanguage: "en",
                          sampleMode: false,
                          useFormat: true,
                          loopLengthBars: bars,
                          bpm: autoMetaEnabled ? undefined : aceDebugParams.bpm || undefined,
                          keyScale: autoMetaEnabled ? undefined : aceDebugParams.key && aceDebugParams.scale ? `${aceDebugParams.key} ${aceDebugParams.scale}` : undefined,
                        };
                        return JSON.stringify(payload, null, 2);
                      })()}
                    </div>
                  </div>
                ) : null}

                {advancedOpen && (
                  <div className="border-b border-pk-border p-4">
                    <div className="text-sm font-semibold">{locale === "fr" ? "Tempo & Tonalité" : "Tempo & Key"}</div>

                    <div className="mt-4 grid gap-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs text-pk-muted">BPM</div>
                          <div className="flex bg-pk-bg rounded-full p-0.5 border border-pk-border">
                            <button
                              type="button"
                              onClick={() => setBeatTempoMode("auto")}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                beatTempoMode === "auto" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              Auto
                            </button>
                            <button
                              type="button"
                              onClick={() => setBeatTempoMode("manual")}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                beatTempoMode === "manual" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              Man
                            </button>
                          </div>
                        </div>
                        {beatTempoMode === "manual" ? (
                          <>
                            <div className="flex items-center justify-between">
                              <div className="text-[11px] text-pk-muted">{locale === "fr" ? "BPM manuel" : "Manual BPM"}</div>
                              <input
                                type="number"
                                min={60}
                                max={200}
                                value={form.bpm}
                                onChange={(e) => setBpm(Math.max(60, Math.min(200, Number(e.target.value))))}
                                className="w-16 bg-transparent text-right text-sm font-semibold text-pk-text outline-none"
                              />
                            </div>
                            <div className="mt-3 flex gap-2">
                              {bpmPresets.map((p) => (
                                <button
                                  key={p.label}
                                  type="button"
                                  onClick={() => setBpm(p.value)}
                                  className={`flex-1 rounded-pk border py-1.5 text-[11px] transition-colors ${
                                    form.bpm === p.value
                                      ? "border-pk-accent/40 bg-pk-accent/15 text-pk-accent"
                                      : "border-pk-border bg-pk-bg text-pk-muted hover:text-pk-text"
                                  }`}
                                >
                                  {p.value}
                                </button>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="text-[10px] text-pk-muted italic">
                            {locale === "fr" ? "L’IA choisit le meilleur BPM pour ton style." : "The AI will decide the best BPM for your style."}
                          </div>
                        )}
                      </div>

                      <div className="grid gap-3">
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-pk-muted">{locale === "fr" ? "Tonalité" : "Musical Key"}</div>
                          <div className="flex bg-pk-bg rounded-full p-0.5 border border-pk-border">
                            <button
                              type="button"
                              onClick={() => setBeatKeyMode("auto")}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                beatKeyMode === "auto" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              Auto
                            </button>
                            <button
                              type="button"
                              onClick={() => setBeatKeyMode("manual")}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                beatKeyMode === "manual" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              Man
                            </button>
                          </div>
                        </div>

                        {beatKeyMode === "manual" ? (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Dropdown
                                label=""
                                value={form.key}
                                onChange={(v) => setField("key", v)}
                                options={keyOptions.map((k) => ({ value: k, label: k }))}
                              />
                            </div>
                            <div>
                              <Dropdown
                                label=""
                                value={form.scale}
                                onChange={(v) => setField("scale", v)}
                                options={scaleOptions}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="text-[10px] text-pk-muted italic">
                            {locale === "fr" ? "L’IA choisit la meilleure tonalité/gamme." : "The AI will pick the best key/scale."}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {advancedOpen && (
                  <div className="border-b border-pk-border p-4 bg-pk-bg/30">
                    <div className="text-sm font-semibold">{locale === "fr" ? "Avancé" : "Advanced"}</div>
                    <div className="mt-4 grid gap-4">
                      <div>
                        <div className="text-xs text-pk-muted mb-2">{locale === "fr" ? "Longueur" : "Length"}</div>
                        <div className="grid grid-cols-4 gap-2">
                          {lengths.map((l) => {
                            const active = form.loopLength === l;
                            return (
                              <button
                                key={l}
                                type="button"
                                onClick={() => setLoopLength(l)}
                                className={
                                  active
                                    ? "rounded-pk border border-pk-accent/40 bg-pk-accent/15 py-2 text-[11px] font-semibold text-pk-accent"
                                    : "rounded-pk border border-pk-border bg-pk-bg py-2 text-[11px] text-pk-muted hover:bg-white/5 hover:text-pk-text"
                                }
                              >
                                {l.replace(" bars", "")}b
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <Slider
                        label="Swing"
                        value={form.swing}
                        min={0}
                        max={100}
                        onChange={(v) => setField("swing", v)}
                        rightLabel={`${form.swing}%`}
                      />

                      <Dropdown
                        label="Reverb"
                        value={form.reverb}
                        onChange={(v) => setField("reverb", v)}
                        options={reverbOptions}
                      />

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs text-pk-muted">{locale === "fr" ? "Format audio" : "Audio Format"}</div>
                          <div className="flex bg-pk-bg rounded-full p-0.5 border border-pk-border">
                            <button
                              type="button"
                              onClick={() => setAudioFormatPref("mp3")}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                effectiveAudioFormat === "mp3" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              MP3
                            </button>
                            <button
                              type="button"
                              onClick={() => setAudioFormatPref("wav")}
                              disabled={plan === "free"}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                effectiveAudioFormat === "wav" ? "bg-pk-accent text-white" : "text-pk-muted"
                              } ${plan === "free" ? "opacity-50" : ""}`}
                            >
                              WAV
                            </button>
                          </div>
                        </div>
                        {plan === "free" ? (
                          <div className="text-[10px] text-pk-muted italic">
                            {locale === "fr" ? "WAV est disponible sur Pro/Studio." : "WAV is available on Pro/Studio."}
                          </div>
                        ) : (
                          <div className="text-[10px] text-pk-muted italic">
                            {locale === "fr" ? "Pro/Studio : WAV par défaut." : "Pro/Studio: WAV by default."}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                )}

                <div className="p-4">
                  <details className="group">
                    <summary className="cursor-pointer select-none text-xs font-semibold text-pk-muted hover:text-pk-text flex items-center gap-1">
                      <Search className="h-3 w-3" />
                      <span>{locale === "fr" ? "Préréglages" : "Quick Presets"}</span>
                    </summary>
                    <div className="mt-3 grid gap-2">
                      {presets.map((p) => (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => {
                            setField("genre", p.genre);
                            setField("influence", p.influence);
                            setBpm(p.bpm);
                            setField("mood", p.mood);
                            setField("energyLevel", p.energyLevel);
                            setLoopLength(p.loopLength);
                            setField("prompt", p.prompt);
                            setField("key", p.key);
                            setField("scale", p.scale);
                          }}
                          className="flex items-center justify-between rounded-pk border border-pk-border bg-pk-bg px-3 py-2 text-left text-[11px] text-pk-text hover:bg-white/5"
                        >
                          <span className="font-semibold">{p.name}</span>
                          <span className="text-pk-muted">{p.bpm} BPM</span>
                        </button>
                      ))}
                    </div>
                  </details>
                </div>
              </>
            ) : null}

            {mode === "song" ? (
              <>
                <div className="border-b border-pk-border p-4">
                  <div className="text-sm font-semibold">{locale === "fr" ? "Style & Vibe" : "Style & Vibe"}</div>
                  <div className="mt-4 grid gap-4">
                    <Dropdown
                      label={locale === "fr" ? "Genre" : "Genre"}
                      value={form.genre}
                      onChange={(v) => setField("genre", v)}
                      options={genreOptions}
                      placeholder={locale === "fr" ? "Sélectionner…" : "Select…"}
                    />

                    <Dropdown
                      label={locale === "fr" ? "Langue" : "Vocal Language"}
                      value={songVocalLanguageMode === "auto" ? "auto" : manualVocalLanguage}
                      onChange={(v) => {
                        if (v === "auto") {
                          setSongVocalLanguageMode("auto");
                        } else {
                          setSongVocalLanguageMode("manual");
                          setManualVocalLanguage(v);
                        }
                      }}
                      options={[{ value: "auto", label: "🌐 Auto" }, ...vocalLanguageOptions]}
                    />

                    <div>
                      <div className="text-xs text-pk-muted">{locale === "fr" ? "Style vocal" : "Vocal Style"}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {vocalStyleOptions.map((v) => {
                          const active = songVocalStyle === v.value;
                          return (
                            <button
                              key={v.value}
                              type="button"
                              onClick={() => setSongVocalStyle(v.value)}
                              className={
                                active
                                  ? "rounded-full border border-pk-accent/40 bg-pk-accent/15 px-3 py-1 text-xs font-semibold text-pk-accent"
                                  : "rounded-full border border-pk-border bg-pk-bg px-3 py-1 text-xs text-pk-muted hover:bg-white/5 hover:text-pk-text"
                              }
                            >
                              {v.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-b border-pk-border p-4">
                  <div className="text-sm font-semibold">{locale === "fr" ? "L’idée" : "The Idea"}</div>
                  <div className="mt-2 text-xs text-pk-muted">
                    {locale === "fr" ? "Décris ton idée de chanson, ou utilise les chips." : "Describe your song idea or use chips."}
                  </div>
                  
                  <input
                    value={songDescription}
                    onChange={(e) => setSongDescription(e.target.value)}
                    className="mt-3 w-full rounded-pk border border-pk-border bg-pk-input px-3 py-2 text-sm outline-none placeholder:text-pk-muted focus:border-pk-accent"
                    placeholder={locale === "fr" ? "ex: refrain émotionnel, pop radio-ready" : "e.g. emotional hook, radio-ready pop sound"}
                  />
                  
                  <div className="mt-3 flex flex-wrap gap-2">
                    {getInspirationChipsForGenre(form.genre).map((chip) => {
                      const on = songDescription.includes(chip);
                      return (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => {
                            const current = songDescription.trim();
                            if (on) {
                              setSongDescription(current.split(",").map(s => s.trim()).filter(s => s !== chip).join(", "));
                            } else {
                              setSongDescription(current ? `${current}, ${chip}` : chip);
                            }
                          }}
                          className={
                            on
                              ? "rounded-full border border-pk-accent/40 bg-pk-accent/15 px-3 py-1 text-[11px] font-semibold text-pk-accent"
                              : "rounded-full border border-pk-border bg-pk-bg px-3 py-1 text-[11px] text-pk-muted hover:bg-white/5 hover:text-pk-text"
                          }
                        >
                          {chip}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-b border-pk-border p-4">
                  <div className="text-sm font-semibold">{locale === "fr" ? "Paroles" : "The Lyrics"}</div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setLyricsMode("manual")}
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                        lyricsMode === "manual" ? "pk-prism-pill-active" : "bg-white/5 text-white/50 hover:text-white"
                      }`}
                    >
                      {locale === "fr" ? "✏️ J’écris" : "✏️ I write"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setLyricsMode("ai")}
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                        lyricsMode === "ai" ? "pk-prism-pill-active" : "bg-white/5 text-white/50 hover:text-white"
                      }`}
                    >
                      {locale === "fr" ? "✨ IA écrit" : "✨ AI writes"}
                    </button>
                  </div>
                  {lyricsMode === "manual" ? (
                    <textarea
                      value={lyrics}
                      onChange={(e) => setLyrics(e.target.value)}
                      className="mt-3 min-h-[160px] w-full resize-none rounded-pk border border-pk-border bg-pk-input px-3 py-2 text-sm outline-none placeholder:text-pk-muted focus:border-pk-accent"
                      placeholder={
                        locale === "fr"
                          ? "[Couplet]\nÉcris tes paroles ici...\n\n[Refrain]\nÉcris ton hook ici..."
                          : "[Verse]\nWrite your lyrics here...\n\n[Chorus]\nWrite your hook here..."
                      }
                    />
                  ) : (
                    <div className="mt-3 rounded-pk border border-pk-border bg-pk-bg p-4 text-center">
                      <p className="text-[11px] italic text-pk-muted leading-relaxed">
                        {locale === "fr"
                          ? "✨ L’IA écrira des paroles originales selon ton genre et ton idée — tu les entendras dans la chanson générée."
                          : "✨ AI will write original lyrics based on your genre and idea — you'll hear them in the generated song."}
                      </p>
                    </div>
                  )}
                </div>

                <div className="border-b border-pk-border p-4">
                  <div className="text-sm font-semibold">{locale === "fr" ? "Titre de la chanson" : "Song Title"}</div>
                  <div className="mt-2 text-xs text-pk-muted">
                    {locale === "fr" ? "Choisis un titre (optionnel)." : "Choose a title (optional)."}
                  </div>
                  <input
                    value={requestedTitle}
                    onChange={(e) => setRequestedTitle(e.target.value)}
                    className="mt-3 w-full rounded-pk border border-pk-border bg-pk-input px-3 py-2 text-sm outline-none placeholder:text-pk-muted focus:border-pk-accent"
                    placeholder={locale === "fr" ? "ex: Pluie sur la ville" : "e.g. Rainy city nights"}
                  />
                </div>

                {songIsCustom && (
                  <div className="border-b border-pk-border p-4 bg-pk-bg/30">
                    <div className="text-sm font-semibold">{locale === "fr" ? "Réglages chanson" : "Song Customization"}</div>
                    <div className="mt-4 grid gap-4">
                      <Dropdown
                        label={locale === "fr" ? "Influence" : "Influence"}
                        value={form.influence}
                        onChange={(v) => setField("influence", v)}
                        options={influenceOptions}
                      />
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs text-pk-muted">Tempo</div>
                          <div className="flex bg-pk-bg rounded-full p-0.5 border border-pk-border">
                            <button
                              type="button"
                              onClick={() => setSongTempoMode("auto")}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                songTempoMode === "auto" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              Auto
                            </button>
                            <button
                              type="button"
                              onClick={() => setSongTempoMode("manual")}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                songTempoMode === "manual" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              Man
                            </button>
                          </div>
                        </div>
                        {songTempoMode === "manual" ? (
                          <>
                            <div className="flex items-center justify-between">
                              <div className="text-[11px] text-pk-muted">BPM</div>
                              <input
                                type="number"
                                min={60}
                                max={200}
                                value={form.bpm}
                                onChange={(e) => setBpm(Math.max(60, Math.min(200, Number(e.target.value))))}
                                className="w-12 bg-transparent text-right text-[11px] font-semibold text-pk-text outline-none"
                              />
                            </div>
                            <div className="mt-2 flex gap-1.5">
                              {[90, 120, 140].map((v) => (
                                <button
                                  key={v}
                                  type="button"
                                  onClick={() => setBpm(v)}
                                  className={`flex-1 rounded-pk border py-1 text-[10px] transition-colors ${
                                    form.bpm === v 
                                      ? "border-pk-accent/40 bg-pk-accent/15 text-pk-accent" 
                                      : "border-pk-border bg-pk-bg text-pk-muted hover:text-pk-text"
                                  }`}
                                >
                                  {v}
                                </button>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="text-[10px] text-pk-muted italic">
                            {locale === "fr" ? "L’IA choisit le meilleur tempo." : "The AI picks the best tempo."}
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs text-pk-muted">{locale === "fr" ? "Durée" : "Duration"}</div>
                          <div className="flex bg-pk-bg rounded-full p-0.5 border border-pk-border">
                            <button
                              type="button"
                              onClick={() => setSongDurationMode("auto")}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                songDurationMode === "auto" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              Auto
                            </button>
                            <button
                              type="button"
                              onClick={() => setSongDurationMode("manual")}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                songDurationMode === "manual" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              Man
                            </button>
                          </div>
                        </div>
                        {songDurationMode === "manual" ? (
                          <>
                            <div className="flex items-center justify-between">
                              <div className="text-[11px] text-pk-muted">{locale === "fr" ? "Secondes" : "Seconds"}</div>
                              <input
                                type="number"
                                min={10}
                                max={songDurationMax}
                                value={songDurationSec}
                                onChange={(e) => setSongDurationSec(Math.max(10, Math.min(songDurationMax, Number(e.target.value) || 30)))}
                                className="w-12 bg-transparent text-right text-[11px] font-semibold text-pk-text outline-none"
                              />
                            </div>
                            <div className="mt-2 flex gap-1.5">
                              {songDurationPresets.filter((p) => p <= songDurationMax).map((p) => (
                                <button
                                  key={p}
                                  type="button"
                                  onClick={() => setSongDurationSec(p)}
                                  className={`flex-1 rounded-pk border py-1 text-[10px] transition-colors ${
                                    songDurationSec === p 
                                      ? "border-pk-accent/40 bg-pk-accent/15 text-pk-accent" 
                                      : "border-pk-border bg-pk-bg text-pk-muted hover:text-pk-text"
                                  }`}
                                >
                                  {p}s
                                </button>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="text-[10px] text-pk-muted italic">
                            {locale === "fr" ? "L’IA choisit la durée." : "The AI picks the duration."}
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs text-pk-muted">{locale === "fr" ? "Format audio" : "Audio Format"}</div>
                          <div className="flex bg-pk-bg rounded-full p-0.5 border border-pk-border">
                            <button
                              type="button"
                              onClick={() => setAudioFormatPref("mp3")}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                effectiveAudioFormat === "mp3" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              MP3
                            </button>
                            <button
                              type="button"
                              onClick={() => setAudioFormatPref("wav")}
                              disabled={plan === "free"}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                effectiveAudioFormat === "wav" ? "bg-pk-accent text-white" : "text-pk-muted"
                              } ${plan === "free" ? "opacity-50" : ""}`}
                            >
                              WAV
                            </button>
                          </div>
                        </div>
                        {plan === "free" ? (
                          <div className="text-[10px] text-pk-muted italic">
                            {locale === "fr" ? "WAV est disponible sur Pro/Studio." : "WAV is available on Pro/Studio."}
                          </div>
                        ) : (
                          <div className="text-[10px] text-pk-muted italic">
                            {locale === "fr" ? "Pro/Studio : WAV par défaut." : "Pro/Studio: WAV by default."}
                          </div>
                        )}
                      </div>

                      <div className="bg-pk-bg/50 rounded-pk p-3 border border-pk-border/30">
                        <div className="text-xs text-pk-muted mb-2">
                          {locale === "fr" ? "Contexte & inspiration (chips)" : "Context & Inspiration (Chips)"}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {getInspirationChipsForGenre(form.genre).map((chip) => {
                            const on = songDescription.includes(chip);
                            return (
                              <button
                                key={chip}
                                type="button"
                                onClick={() => {
                                  const current = songDescription.trim();
                                  if (on) {
                                    setSongDescription(current.split(",").map(s => s.trim()).filter(s => s !== chip).join(", "));
                                  } else {
                                    setSongDescription(current ? `${current}, ${chip}` : chip);
                                  }
                                }}
                                className={
                                  on
                                    ? "rounded-full border border-pk-accent/40 bg-pk-accent/15 px-2 py-0.5 text-[10px] font-semibold text-pk-accent"
                                    : "rounded-full border border-pk-border bg-pk-bg px-2 py-0.5 text-[10px] text-pk-muted hover:bg-white/5 hover:text-pk-text"
                                }
                              >
                                {chip}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs text-pk-muted">{locale === "fr" ? "Tonalité" : "Musical Key"}</div>
                          <div className="flex bg-pk-bg rounded-full p-0.5 border border-pk-border">
                            <button
                              type="button"
                              onClick={() => setSongKeyMode("auto")}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                songKeyMode === "auto" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              Auto
                            </button>
                            <button
                              type="button"
                              onClick={() => setSongKeyMode("manual")}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                songKeyMode === "manual" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              Man
                            </button>
                          </div>
                        </div>
                        {songKeyMode === "manual" ? (
                          <div className="grid gap-2">
                            <div className="grid grid-cols-6 gap-1">
                              {keyOptions.map((k) => {
                                const active = form.key === k;
                                return (
                                  <button
                                    key={k}
                                    type="button"
                                    onClick={() => setField("key", k)}
                                    className={
                                      active
                                        ? "rounded-pk border border-pk-accent/40 bg-pk-accent/15 py-1 text-[10px] font-semibold text-pk-accent"
                                        : "rounded-pk border border-pk-border bg-pk-bg py-1 text-[10px] text-pk-muted hover:bg-white/5 hover:text-pk-text"
                                    }
                                  >
                                    {k}
                                  </button>
                                );
                              })}
                            </div>
                            <Dropdown
                              label=""
                              value={form.scale}
                              onChange={(v) => setField("scale", v)}
                              options={scaleOptions}
                            />
                          </div>
                        ) : (
                          <div className="text-[10px] text-pk-muted italic">
                            {locale === "fr" ? "L’IA choisit la tonalité & la gamme." : "The AI picks key & scale."}
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs text-pk-muted">{locale === "fr" ? "Signature rythmique" : "Time Signature"}</div>
                          <div className="flex bg-pk-bg rounded-full p-0.5 border border-pk-border">
                            <button
                              type="button"
                              onClick={() => setSongTimeSignatureMode("auto")}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                songTimeSignatureMode === "auto" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              Auto
                            </button>
                            <button
                              type="button"
                              onClick={() => setSongTimeSignatureMode("manual")}
                              className={`rounded-full px-2 py-0.5 text-[10px] transition-colors ${
                                songTimeSignatureMode === "manual" ? "bg-pk-accent text-white" : "text-pk-muted"
                              }`}
                            >
                              Man
                            </button>
                          </div>
                        </div>
                        {songTimeSignatureMode === "manual" ? (
                          <div className="grid grid-cols-4 gap-1.5">
                            {timeSignatureOptions.map((sig) => (
                              <button
                                key={sig}
                                type="button"
                                onClick={() => setSongTimeSignature(sig)}
                                className={`rounded-pk border py-1 text-[10px] transition-colors ${
                                  songTimeSignature === sig 
                                    ? "border-pk-accent/40 bg-pk-accent/15 text-pk-accent" 
                                    : "border-pk-border bg-pk-bg text-pk-muted hover:text-pk-text"
                                }`}
                              >
                                {sig}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[10px] text-pk-muted italic">
                            {locale === "fr" ? "L’IA choisit la signature." : "The AI picks the signature."}
                          </div>
                        )}
                      </div>

                      <Slider
                        label="Reverb"
                        value={form.reverb === "Dry" ? 0 : form.reverb === "Subtle" ? 25 : form.reverb === "Medium" ? 50 : 80}
                        min={0}
                        max={100}
                        onChange={(v) => {
                          const label = v < 15 ? "Dry" : v < 40 ? "Subtle" : v < 70 ? "Medium" : "Heavy";
                          setField("reverb", label);
                        }}
                        rightLabel={form.reverb}
                      />
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>

          <div className="border-t border-pk-border p-4 flex-shrink-0">
            <div className="mb-3 flex items-center justify-between text-xs">
              <span className="text-gray-500">{locale === "fr" ? "Versions" : "Versions"}</span>
              <div className="flex items-center gap-1 rounded-full bg-white/5 p-1">
                <button
                  type="button"
                  onClick={() => setVersions(1)}
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                    versions === 1 ? "pk-prism-pill-active" : "text-white/50 hover:text-white"
                  }`}
                >
                  1
                </button>
                <button
                  type="button"
                  onClick={() => setVersions(2)}
                  disabled={remaining < 2}
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
                    versions === 2 ? "pk-prism-pill-active" : "text-white/50 hover:text-white"
                  } ${remaining < 2 ? "opacity-50" : ""}`}
                >
                  2
                </button>
              </div>
            </div>
            <Button
              variant="primary"
              className="w-full"
              disabled={!form.genre || generating || profileLoading || remaining < versions}
              onClick={async () => {
                if (remaining < versions) return;
                if (generating) return;
                if (!user) {
                  window.localStorage.setItem(
                    "producerhit_pending_generation",
                    JSON.stringify({
                      mode,
                      engine,
                      form,
                      lyricsMode,
                      lyrics,
                      songUiMode,
                      songDescription,
                      songVocalStyle,
                    }),
                  );
                  navigate("/auth", { state: { from: "/dashboard" } });
                  return;
                }
                await handleGenerate();
              }}
            >
              <span className="inline-flex items-center gap-2">
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <AudioWaveform className="h-4 w-4" />}
                {generating
                  ? locale === "fr"
                    ? "Génération…"
                    : "Generating..."
                  : mode === "song"
                    ? locale === "fr"
                      ? "Générer une chanson"
                      : "Generate Song"
                    : locale === "fr"
                      ? "Générer un beat"
                      : "Generate Beat"}
              </span>
            </Button>
            {generating ? (
              <div className="mt-2 text-[11px] text-gray-500">
                {locale === "fr"
                  ? "Génération en cours — tu peux préparer la suivante, puis générer dès qu’une version est terminée."
                  : "Generation in progress — you can prepare the next one, then generate as soon as a version finishes."}
              </div>
            ) : null}

            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-gray-500">
                {locale === "fr"
                  ? `${remainingAfterGenerate} génération${remainingAfterGenerate !== 1 ? "s" : ""} restante${remainingAfterGenerate !== 1 ? "s" : ""} ce mois-ci`
                  : `${remainingAfterGenerate} generation${remainingAfterGenerate !== 1 ? "s" : ""} remaining this month`}
              </span>
              <span className="text-gray-600">{locale === "fr" ? `Plan ${plan}` : `${plan} plan`}</span>
            </div>
            {plan === "free" && remaining > 0 && remaining <= 2 ? (
              <div className="mt-2 flex flex-col gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/90">
                <span>
                  {locale === "fr"
                    ? `Plus que ${remaining} génération${remaining !== 1 ? "s" : ""} ce mois-ci — passe Pro pour 75 tracks, priorité et export WAV.`
                    : `Only ${remaining} generation${remaining !== 1 ? "s" : ""} left this month — go Pro for 75 tracks, priority, and WAV export.`}
                </span>
                <Link to="/pricing" className="font-semibold text-amber-200 hover:text-white">
                  {locale === "fr" ? "Voir Pro — 10€/mo" : "See Pro — $10/mo"}
                </Link>
              </div>
            ) : null}
            {remainingAfterGenerate === 0 ? (
              <div className="mt-2 flex flex-col gap-2 text-xs text-gray-500">
                {plan === "free"
                  ? locale === "fr"
                    ? `Tu as utilisé tes ${PLAN_LIMITS.free} générations gratuites ce mois-ci`
                    : `You've used all ${PLAN_LIMITS.free} free generations this month`
                  : locale === "fr"
                    ? "Plus de crédits — upgrade ton plan"
                    : "No credits remaining — upgrade your plan"}
                <Link to="/pricing" className="pk-prism-holo-text hover:opacity-90">
                  {plan === "free"
                    ? locale === "fr"
                      ? "Passer Pro — 10€/mo"
                      : "Upgrade to Pro — $10/mo"
                    : locale === "fr"
                      ? "Voir les tarifs"
                      : "View pricing"}
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      }
    >
      <div className="mx-auto w-full max-w-[1120px] px-4 pb-32 pt-6 md:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-lg font-semibold">{locale === "fr" ? "Mon espace" : "My Workspace"}</div>
            <div className="mt-1 text-sm text-pk-muted">
              {locale === "fr"
                ? `Affichage ${Math.min(30, totalMatches)} sur ${totalMatches}`
                : `Showing ${Math.min(30, totalMatches)} of ${totalMatches}`}
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-80">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-pk-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={locale === "fr" ? "Rechercher…" : "Search your creations..."}
                className="w-full rounded-pk border border-pk-border bg-pk-panel px-9 py-2 text-sm outline-none placeholder:text-pk-muted focus:border-pk-accent"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSavedOnly(false)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  !savedOnly ? "pk-prism-pill-active" : "bg-white/5 text-white/50 hover:text-white"
                }`}
              >
                {locale === "fr" ? "Tout" : "All"}
              </button>
              <button
                type="button"
                onClick={() => setSavedOnly(true)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  savedOnly ? "pk-prism-pill-active" : "bg-white/5 text-white/50 hover:text-white"
                }`}
              >
                {locale === "fr" ? "Sauvegardés" : "Saved"}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {workspaceJobs.length ? (
            <div className="space-y-2">
              {workspaceJobs.map((j) => (
                <LoopCardSkeleton key={j.id} title={j.title} sub={j.sub} />
              ))}
            </div>
          ) : null}
          {generationSlots?.length ? (
            <div className="space-y-2">
              {generationSlots
                .slice()
                .sort((a, b) => b.idx - a.idx)
                .map((slot) => {
                  if (slot.visible && slot.status === "generating") {
                    return (
                      <LoopCardSkeleton
                        key={slot.idx}
                        title={slot.title}
                        sub={locale === "fr" ? "Création en cours…" : "Generating..."}
                      />
                    );
                  }
                  if (slot.visible && slot.status === "error") {
                    return (
                      <div key={slot.idx} className="flex items-center gap-3 rounded-pk border border-rose-500/25 bg-pk-panel p-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/25">
                          <AlertTriangle className="h-4 w-4 text-rose-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-pk-text">{slot.title}</div>
                          <div className="mt-0.5 truncate text-xs text-pk-muted">
                            {slot.errorText || (locale === "fr" ? "Échec de génération" : "Generation failed")}
                          </div>
                        </div>
                      </div>
                    );
                  }
                  const batchLoop =
                    (slot.previewLoopId ? loops.find((l) => l.id === slot.previewLoopId) : null) ??
                    loops
                      .filter((l) => l.name === slot.title && !l.id.startsWith("preview-"))
                      .sort((a, b) => Date.parse(b.createdAt ?? "") - Date.parse(a.createdAt ?? ""))[0] ??
                    null;
                  if (!batchLoop) return null;
                  return (
                    <div key={slot.idx}>
                      <LoopCardItem
                        loop={batchLoop}
                        onOpenDetails={(loop) => setDetailsId((prev) => (prev === loop.id ? null : loop.id))}
                        onGenerationUsed={consumeCredit}
                        onStartWorkspaceJob={(title, sub) => startWorkspaceJob(title, sub)}
                      />
                    </div>
                  );
                })}
            </div>
          ) : null}
          {workspaceDisplayedLoops.length === 0 && loopsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <LoopCardSkeleton
                  key={i}
                  title={locale === "fr" ? "Chargement de tes créations…" : "Loading your creations..."}
                  sub={locale === "fr" ? "Récupération depuis ton compte" : "Fetching from your account"}
                />
              ))}
            </div>
          ) : workspaceDisplayedLoops.length === 0 ? (
            loopsSyncError ? (
              <div className="rounded-pk bg-gradient-to-br from-[rgba(157,124,255,0.22)] via-transparent to-[rgba(103,195,255,0.08)] p-[1px] shadow-[0_0_0_1px_rgba(157,124,255,0.08),0_0_24px_rgba(157,124,255,0.10)]">
                <div className="flex flex-col items-center justify-center rounded-pk border border-dashed border-pk-border bg-pk-panel p-10 text-center">
                  <div className="mt-2 text-sm font-semibold text-pk-text">
                    {locale === "fr" ? "Impossible de charger tes créations" : "Failed to load your creations"}
                  </div>
                  <div className="mt-1 text-sm text-pk-muted">
                    {locale === "fr"
                      ? "Ton compte est bien connecté, mais la récupération depuis la base de données a échoué. Clique sur Réessayer."
                      : "You're logged in, but fetching from the database failed. Click Retry."}
                  </div>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    <Button
                      variant="primary"
                      onClick={() => {
                        void loadMyLoops();
                      }}
                    >
                      {locale === "fr" ? "Réessayer" : "Retry"}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        window.location.reload();
                      }}
                    >
                      {locale === "fr" ? "Recharger" : "Reload"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState
                title={locale === "fr" ? "Tes créations apparaîtront ici" : "Your creations will appear here"}
                description={
                  locale === "fr"
                    ? `Configure ton son et clique sur ${mode === "song" ? "Générer une chanson" : "Générer un beat"}.`
                    : `Configure your sound and hit ${mode === "song" ? "Generate Song" : "Generate Beat"}.`
                }
                accent
              />
            )
          ) : (
            detailsLoop ? (
              <div className="md:grid md:grid-cols-[minmax(0,1fr)_420px] md:gap-4">
              <div className="space-y-4">
                {workspaceDisplayedLoops.map((l) => (
                  <div key={l.id}>
                    <LoopCardItem
                      loop={l}
                      onOpenDetails={(loop) => setDetailsId((prev) => (prev === loop.id ? null : loop.id))}
                      onGenerationUsed={consumeCredit}
                      onStartWorkspaceJob={(title, sub) => startWorkspaceJob(title, sub)}
                    />
                  </div>
                ))}

                {detailsLoop ? (
                  <div className="md:hidden">
                    <div className="relative overflow-hidden rounded-2xl border border-pk-border bg-pk-panel/70 p-5 backdrop-blur md:border-pk-border/70">
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[rgba(157,124,255,0.16)] to-transparent" />
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-pk-text">{detailsLoop.name}</div>
                          <div className="mt-1 text-xs text-pk-muted">{detailsLoop.genre}</div>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setDetailsId(null)}
                          aria-label={locale === "fr" ? "Fermer" : "Close"}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="mt-4 overflow-hidden rounded-pk border border-pk-border bg-white/5">
                        <div className="relative aspect-square w-full bg-center bg-cover" style={{ backgroundImage: coverGradient(detailsLoop) }} aria-hidden>
                          <img
                            key={coverImageUrl(detailsLoop)}
                            src={coverImageUrl(detailsLoop)}
                            alt=""
                            className="absolute inset-0 h-full w-full object-contain"
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            style={{ display: "block", opacity: 0 }}
                            onLoad={(e) => {
                              e.currentTarget.style.display = "block";
                              e.currentTarget.style.opacity = "1";
                              e.currentTarget.dataset.retry = "0";
                            }}
                            onError={(e) => {
                              const img = e.currentTarget;
                              img.style.opacity = "0";
                              const retry = Number(img.dataset.retry ?? "0");
                              if (retry < 4) {
                                img.dataset.retry = String(retry + 1);
                                const url = coverImageUrl(detailsLoop);
                                window.setTimeout(() => {
                                  img.style.display = "block";
                                  img.style.opacity = "0";
                                  img.src = "";
                                  img.src = url;
                                }, 900 * (retry + 1));
                                return;
                              }
                              img.style.display = "none";
                            }}
                          />
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-pk border border-pk-border bg-white/5 p-2">
                          <div className="flex items-center gap-1 text-pk-muted">
                            <Gauge className="h-3.5 w-3.5" />
                            BPM
                          </div>
                          <div className="mt-1 font-semibold text-pk-text">
                            {typeof detailsLoop.details?.bpm === "number" && detailsLoop.details.bpm > 0 ? detailsLoop.details.bpm : "—"}
                          </div>
                        </div>
                        <div className="rounded-pk border border-pk-border bg-white/5 p-2">
                          <div className="flex items-center gap-1 text-pk-muted">
                            <Clock className="h-3.5 w-3.5" />
                            {locale === "fr" ? "Durée" : "Duration"}
                          </div>
                          <div className="mt-1 font-semibold text-pk-text">
                            {(() => {
                              const dur = (detailsLoop.details?.duration ?? durationsSecById[detailsLoop.id]) as number | null | undefined;
                              return typeof dur === "number" && isFinite(dur) && dur > 0 ? formatTime(dur) : "—";
                            })()}
                          </div>
                        </div>
                        <div className="rounded-pk border border-pk-border bg-white/5 p-2">
                          <div className="flex items-center gap-1 text-pk-muted">
                            <KeyRound className="h-3.5 w-3.5" />
                            {locale === "fr" ? "Tonalité" : "Key"}
                          </div>
                          <div className="mt-1 font-semibold text-pk-text">{detailsLoop.details?.keyScale || "—"}</div>
                        </div>
                        <div className="rounded-pk border border-pk-border bg-white/5 p-2">
                          <div className="flex items-center gap-1 text-pk-muted">
                            <Sigma className="h-3.5 w-3.5" />
                            {locale === "fr" ? "Signature" : "Time Sig"}
                          </div>
                          <div className="mt-1 font-semibold text-pk-text">{detailsLoop.details?.timeSignature || "—"}</div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center gap-2 text-xs font-semibold text-pk-text">
                          <Info className="h-4 w-4 text-pk-muted" />
                          {locale === "fr" ? "Détails" : "Details"}
                        </div>
                        <div className="mt-2 rounded-pk border border-pk-border bg-white/5 p-3 text-xs text-pk-text">
                          {detailsLoop.details?.caption || detailsLoop.prompt || "—"}
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs font-semibold text-pk-text">{locale === "fr" ? "Paroles" : "Lyrics"}</div>
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={!detailsLoop.details?.lyrics?.trim()}
                            onClick={() => {
                              const text = detailsLoop.details?.lyrics?.trim() ?? "";
                              if (!text) return;
                              void (async () => {
                                try {
                                  await navigator.clipboard.writeText(text);
                                  toast.success(locale === "fr" ? "Paroles copiées" : "Lyrics copied");
                                } catch {
                                  toast.error(locale === "fr" ? "Copie impossible" : "Copy failed");
                                }
                              })();
                            }}
                            aria-label={locale === "fr" ? "Copier les paroles" : "Copy lyrics"}
                            title={locale === "fr" ? "Copier les paroles" : "Copy lyrics"}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <pre className="mt-2 whitespace-pre-wrap rounded-pk border border-pk-border bg-white/5 p-3 text-xs text-pk-text">
                          {detailsLoop.details?.lyrics?.trim() ? detailsLoop.details.lyrics.trim() : "—"}
                        </pre>
                      </div>

                      <div className="mt-4">
                        <div className="text-xs font-semibold text-pk-text">{locale === "fr" ? "Titre" : "Title"}</div>
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            value={detailsTitle}
                            onChange={(e) => setDetailsTitle(e.target.value)}
                            className="w-full rounded-pk border border-pk-border bg-pk-input px-3 py-2 text-sm font-semibold text-pk-text outline-none placeholder:text-pk-muted focus:border-pk-accent"
                            placeholder={locale === "fr" ? "Titre…" : "Title…"}
                          />
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={savingDetailsTitle || detailsTitle.trim().length === 0 || detailsTitle.trim() === detailsLoop.name}
                            onClick={() => {
                              const next = detailsTitle.trim();
                              if (!next || next === detailsLoop.name) return;
                              void (async () => {
                                setSavingDetailsTitle(true);
                                try {
                                  await renameLoopRemote(detailsLoop.id, next);
                                  toast.success(locale === "fr" ? "Titre mis à jour" : "Title updated");
                                } catch (err) {
                                  const message = err instanceof Error ? err.message : locale === "fr" ? "Erreur" : "Error";
                                  toast.error(message);
                                } finally {
                                  setSavingDetailsTitle(false);
                                }
                              })();
                            }}
                          >
                            {savingDetailsTitle ? <Loader2 className="h-4 w-4 animate-spin" /> : locale === "fr" ? "OK" : "Save"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="hidden md:block">
                <div className="sticky top-6 max-h-[calc(100vh-32px)] overflow-y-auto">
                  {detailsLoop ? (
                    <div className="relative overflow-hidden rounded-2xl border border-pk-border bg-pk-panel/70 p-5 backdrop-blur md:border-pk-border/70">
                      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[rgba(157,124,255,0.16)] to-transparent" />
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-semibold text-pk-text">{detailsLoop.name}</div>
                          <div className="mt-1 text-xs text-pk-muted">{detailsLoop.genre}</div>
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setDetailsId(null)}
                          aria-label={locale === "fr" ? "Fermer" : "Close"}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="mt-4 overflow-hidden rounded-pk border border-pk-border bg-white/5">
                        <div className="relative aspect-square w-full bg-center bg-cover" style={{ backgroundImage: coverGradient(detailsLoop) }} aria-hidden>
                          <img
                            key={coverImageUrl(detailsLoop)}
                            src={coverImageUrl(detailsLoop)}
                            alt=""
                            className="absolute inset-0 h-full w-full object-contain"
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            style={{ display: "block", opacity: 0 }}
                            onLoad={(e) => {
                              e.currentTarget.style.display = "block";
                              e.currentTarget.style.opacity = "1";
                              e.currentTarget.dataset.retry = "0";
                            }}
                            onError={(e) => {
                              const img = e.currentTarget;
                              img.style.opacity = "0";
                              const retry = Number(img.dataset.retry ?? "0");
                              if (retry < 4) {
                                img.dataset.retry = String(retry + 1);
                                const url = coverImageUrl(detailsLoop);
                                window.setTimeout(() => {
                                  img.style.display = "block";
                                  img.style.opacity = "0";
                                  img.src = "";
                                  img.src = url;
                                }, 900 * (retry + 1));
                                return;
                              }
                              img.style.display = "none";
                            }}
                          />
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-pk border border-pk-border bg-white/5 p-2">
                          <div className="flex items-center gap-1 text-pk-muted">
                            <Gauge className="h-3.5 w-3.5" />
                            BPM
                          </div>
                          <div className="mt-1 font-semibold text-pk-text">
                            {typeof detailsLoop.details?.bpm === "number" && detailsLoop.details.bpm > 0 ? detailsLoop.details.bpm : "—"}
                          </div>
                        </div>
                        <div className="rounded-pk border border-pk-border bg-white/5 p-2">
                          <div className="flex items-center gap-1 text-pk-muted">
                            <Clock className="h-3.5 w-3.5" />
                            {locale === "fr" ? "Durée" : "Duration"}
                          </div>
                          <div className="mt-1 font-semibold text-pk-text">
                            {(() => {
                              const dur = (detailsLoop.details?.duration ?? durationsSecById[detailsLoop.id]) as number | null | undefined;
                              return typeof dur === "number" && isFinite(dur) && dur > 0 ? formatTime(dur) : "—";
                            })()}
                          </div>
                        </div>
                        <div className="rounded-pk border border-pk-border bg-white/5 p-2">
                          <div className="flex items-center gap-1 text-pk-muted">
                            <KeyRound className="h-3.5 w-3.5" />
                            {locale === "fr" ? "Tonalité" : "Key"}
                          </div>
                          <div className="mt-1 font-semibold text-pk-text">{detailsLoop.details?.keyScale || "—"}</div>
                        </div>
                        <div className="rounded-pk border border-pk-border bg-white/5 p-2">
                          <div className="flex items-center gap-1 text-pk-muted">
                            <Sigma className="h-3.5 w-3.5" />
                            {locale === "fr" ? "Signature" : "Time Sig"}
                          </div>
                          <div className="mt-1 font-semibold text-pk-text">{detailsLoop.details?.timeSignature || "—"}</div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center gap-2 text-xs font-semibold text-pk-text">
                          <Info className="h-4 w-4 text-pk-muted" />
                          {locale === "fr" ? "Détails" : "Details"}
                        </div>
                        <div className="mt-2 rounded-pk border border-pk-border bg-white/5 p-3 text-xs text-pk-text">
                          {detailsLoop.details?.caption || detailsLoop.prompt || "—"}
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs font-semibold text-pk-text">{locale === "fr" ? "Paroles" : "Lyrics"}</div>
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={!detailsLoop.details?.lyrics?.trim()}
                            onClick={() => {
                              const text = detailsLoop.details?.lyrics?.trim() ?? "";
                              if (!text) return;
                              void (async () => {
                                try {
                                  await navigator.clipboard.writeText(text);
                                  toast.success(locale === "fr" ? "Paroles copiées" : "Lyrics copied");
                                } catch {
                                  toast.error(locale === "fr" ? "Copie impossible" : "Copy failed");
                                }
                              })();
                            }}
                            aria-label={locale === "fr" ? "Copier les paroles" : "Copy lyrics"}
                            title={locale === "fr" ? "Copier les paroles" : "Copy lyrics"}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <pre className="mt-2 whitespace-pre-wrap rounded-pk border border-pk-border bg-white/5 p-3 text-xs text-pk-text">
                          {detailsLoop.details?.lyrics?.trim() ? detailsLoop.details.lyrics.trim() : "—"}
                        </pre>
                      </div>

                      <div className="mt-4">
                        <div className="text-xs font-semibold text-pk-text">{locale === "fr" ? "Titre" : "Title"}</div>
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            value={detailsTitle}
                            onChange={(e) => setDetailsTitle(e.target.value)}
                            className="w-full rounded-pk border border-pk-border bg-pk-input px-3 py-2 text-sm font-semibold text-pk-text outline-none placeholder:text-pk-muted focus:border-pk-accent"
                            placeholder={locale === "fr" ? "Titre…" : "Title…"}
                          />
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={savingDetailsTitle || detailsTitle.trim().length === 0 || detailsTitle.trim() === detailsLoop.name}
                            onClick={() => {
                              const next = detailsTitle.trim();
                              if (!next || next === detailsLoop.name) return;
                              void (async () => {
                                setSavingDetailsTitle(true);
                                try {
                                  await renameLoopRemote(detailsLoop.id, next);
                                  toast.success(locale === "fr" ? "Titre mis à jour" : "Title updated");
                                } catch (err) {
                                  const message = err instanceof Error ? err.message : locale === "fr" ? "Erreur" : "Error";
                                  toast.error(message);
                                } finally {
                                  setSavingDetailsTitle(false);
                                }
                              })();
                            }}
                          >
                            {savingDetailsTitle ? <Loader2 className="h-4 w-4 animate-spin" /> : locale === "fr" ? "OK" : "Save"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-pk-border bg-pk-panel/40 p-5 text-sm text-pk-muted backdrop-blur">
                      {locale === "fr" ? "Clique sur une carte pour voir les infos ici." : "Click a card to see details here."}
                    </div>
                  )}
                </div>
              </div>
            </div>
            ) : (
              <div className="space-y-4">
                {workspaceDisplayedLoops.map((l) => (
                  <div key={l.id}>
                    <LoopCardItem
                      loop={l}
                      onOpenDetails={(loop) => setDetailsId(loop.id)}
                      onGenerationUsed={consumeCredit}
                      onStartWorkspaceJob={(title, sub) => startWorkspaceJob(title, sub)}
                    />
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
      <Modal
        open={upgradeOpen}
        title={locale === "fr" ? "Upgrade pour générer sans limite" : "Upgrade to generate more"}
        description={
          locale === "fr"
            ? `Tu es sur Free (${PLAN_LIMITS.free} générations/mois). Passe Pro pour plus de crédits, la priorité génération, et l’export WAV.`
            : `You're on Free (${PLAN_LIMITS.free} generations/month). Go Pro for more credits, priority generation, and WAV export.`
        }
        confirmText={locale === "fr" ? "Passer Pro" : "Go Pro"}
        onClose={() => {
          setUpgradeOpen(false);
          trackClientEvent("upgrade_prompt_dismissed", { source: entrySource });
        }}
        onConfirm={() => {
          setUpgradeOpen(false);
          trackClientEvent("upgrade_click", { source: entrySource, location: "dashboard_modal", plan: "pro" });
          navigate("/pricing?plan=pro&checkout=1");
        }}
      />
    </AppShell>
  );
}
