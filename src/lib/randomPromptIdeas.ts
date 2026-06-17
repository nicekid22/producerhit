import type { AppLocale } from "@/i18n/config";

export type PromptMode = "beat" | "song";

/**
 * ACE Step 1.5 XL Turbo — random dice captions.
 *
 * Official ACE 1.5 guidance (caption / tags field):
 * - Comma-separated keywords (≈5–12), not Suno-style prose
 * - Genre or subgenre first, then mood, 2–3 named instruments, timbre, production
 * - Specific instruments beat adjectives ("rhodes piano" > "sad")
 * - Avoid BPM/key here — ProducerHit sends those via autoMeta params
 * - Avoid "instrumental / no vocals" on beats — buildAceCaption adds them
 * - No conflicting pairs (lo-fi + hi-fi, aggressive + serene)
 *
 * These strings feed `params.prompt` → merged into buildAceCaption (140 char extra cap).
 */
export const ACE_DICE_CAPTION_MAX = 140;

export function formatAceDiceCaption(raw: string): string {
  const t = raw
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .replace(/,\s*,+/g, ", ")
    .replace(/,\s*$/g, "")
    .trim();
  if (t.length <= ACE_DICE_CAPTION_MAX) return t;
  return t.slice(0, ACE_DICE_CAPTION_MAX).replace(/[,\s]+$/g, "").trim();
}

/* ——— Songs EN (ACE caption tags — theme as mood, not prose) ——— */
const SONG_TRENDS_EN = [
  "hyperpop, glitchy synth lead, distorted 808, bright female vocal, catchy hook, punchy drums, maximal mix",
  "dark alt-pop, moody pads, minor-key progression, breathy female vocal, cinematic tension, polished radio mix",
  "amapiano, log drum bass, jazzy piano stabs, shaker groove, male vocal, summer club energy, warm mix",
  "reggaeton, dembow rhythm, bright pluck melody, Spanish male vocal, perreo bounce, heavy sub, club-ready",
  "indie sleaze, gritty electric guitar, live drums, raspy female vocal, late-night downtown vibe, raw mix",
  "TikTok pop, short catchy chorus hook, glossy synths, Gen Z female vocal, punchy drums, wide stereo",
] as const;

const SONG_AI_ARTIST_EN = [
  "modern pop, stacked female harmonies, supersaw chorus, auto-tuned lead, stadium energy, hi-fi polish",
  "contemporary R&B, silky male vocal runs, rhodes chords, warm sub, heartbreak mood, cinematic mix",
  "UK drill, cold male rap delivery, sliding 808, sparse piano, 140 BPM feel, dark cinematic strings",
  "neo soul, smooth female vocal, jazzy rhodes, live bass pocket, futuristic synth layers, intimate mix",
  "hyperpop, cute-aggressive female vocal, anime energy, glitchy drums, bright leads, compressed modern mix",
  "melodic rap, emotional male vocal, minor-key guitar, airy pads, sliding 808, hook-forward space",
] as const;

const SONG_PERSONAL_EN = [
  "contemporary R&B, breathy female vocal, rhodes piano, heartbreak theme, ghosted ex mood, soft drums, warm mix",
  "melodic trap, introspective male vocal, rainy night mood, minor piano, sliding 808, emotional hook space",
  "lo-fi R&B, dusty drums, vinyl crackle, study-night theme, mellow male vocal, warm tape saturation",
  "house pop, four-on-the-floor kick, moving-on theme, uplifting female vocal, bright plucks, summer energy",
  "neo soul, confident female vocal, funky bass groove, new chapter theme, rhodes chords, cathartic chorus",
  "pop-punk, distorted guitars, burnout theme, shouted group vocals, fast drums, raw energetic mix",
  "trap soul, vulnerable male vocal, long-distance love theme, smooth 808, atmospheric pads, late-night vibe",
  "dance pop, catchy topline, resilience theme, bright female vocal, punchy kick, polished radio mix",
] as const;

const SONG_HIPHOP_CULTURE_EN = [
  "melodic rap, pain in the hook, flex in the verse, minor-key piano, sliding 808, Metro-style strings",
  "boom bap, dusty sample chop, conscious rap theme, male spoken-word vocal, MPC swing, vinyl texture",
  "melodic trap, Travis Scott style, spacey synth plucks, psychedelic 808, reverb-heavy, autotuned hook vocal",
  "UK drill, storytelling rap, cold male delivery, cinematic strings, sliding 808, 140 BPM feel, dark mood",
  "jersey club, chopped vocal hooks, punchy kicks, bounce energy, hype male vocal, club edit feel",
  "cloud rap, dreamy washed pads, soft 808, floating male vocal, minimal drums, ethereal wide mix",
] as const;

/* ——— Songs FR (tags ACE en anglais — meilleure adhérence modèle ; noms FR conservés) ——— */
const SONG_TRENDS_FR = [
  "hyperpop, glitchy synth lead, distorted 808, bright female vocal, catchy hook, punchy drums, maximal mix",
  "dark alt-pop, moody pads, minor-key progression, breathy female vocal, cinematic tension, polished mix",
  "amapiano, log drum bass, jazzy piano stabs, shaker groove, male vocal, summer club energy, warm mix",
  "reggaeton, dembow rhythm, bright plucks, Spanish male vocal, perreo bounce, heavy sub, club-ready",
  "indie sleaze, gritty electric guitar, live drums, raspy female vocal, late-night vibe, raw mix",
  "TikTok pop, short catchy chorus, glossy synths, Gen Z female vocal, punchy drums, wide stereo",
] as const;

const SONG_AI_ARTIST_FR = [
  "modern pop, stacked female harmonies, supersaw chorus, auto-tuned lead, stadium energy, hi-fi polish",
  "contemporary R&B, silky male vocal runs, rhodes chords, warm sub, heartbreak mood, cinematic mix",
  "UK drill, cold male rap delivery, sliding 808, sparse piano, dark cinematic strings, aggressive pocket",
  "neo soul, smooth female vocal, jazzy rhodes, live bass, futuristic synth layers, intimate mix",
  "hyperpop, cute-aggressive female vocal, anime energy, glitchy drums, bright leads, compressed mix",
  "melodic rap, emotional male vocal, minor guitar, airy pads, sliding 808, hook-forward space",
] as const;

const SONG_PERSONAL_FR = [
  "contemporary R&B, breathy female vocal, rhodes piano, heartbreak theme, ghost mood, soft drums, warm mix",
  "melodic trap, introspective male vocal, rainy night mood, minor piano, sliding 808, emotional hooks",
  "lo-fi R&B, dusty drums, vinyl crackle, study-night theme, mellow male vocal, tape saturation",
  "house pop, four-on-the-floor kick, moving-on theme, uplifting female vocal, bright plucks, summer bounce",
  "neo soul, confident female vocal, funky bass, new chapter theme, rhodes chords, cathartic chorus",
  "pop-punk, distorted guitars, burnout theme, shouted vocals, fast drums, raw energetic mix",
  "trap soul, vulnerable male vocal, long-distance theme, smooth 808, atmospheric pads, late-night vibe",
  "dance pop, catchy topline, resilience theme, bright female vocal, punchy kick, polished radio mix",
] as const;

const SONG_HIPHOP_CULTURE_FR = [
  "melodic rap, pain in hook, flex in verse, minor piano, sliding 808, Metro-style cinematic strings",
  "boom bap, dusty sample chop, conscious theme, male spoken-word vocal, MPC swing, vinyl texture",
  "melodic trap, Travis Scott style, spacey plucks, psychedelic 808, reverb-heavy, autotuned hook vocal",
  "UK drill, storytelling rap, cold male delivery, cinematic strings, sliding 808, dark mood",
  "jersey club, chopped vocal hooks, punchy kicks, bounce energy, hype male vocal, club edit",
  "cloud rap, dreamy pads, soft 808, floating male vocal, minimal drums, ethereal wide mix",
] as const;

/* ——— Beats EN ——— */
const BEAT_TYPE_BEAT_EN = [
  "melodic trap, Travis Scott style, spacey synth plucks, psychedelic 808 glides, hard trap drums, wide reverb",
  "trap soul, Drake x PARTYNEXTDOOR style, moody rhodes, smooth 808, tight hi-hats, late-night R&B trap",
  "rage trap, Playboi Carti style, distorted 808, chaotic synth lead, aggressive hats, moshpit energy",
  "dark trap, Metro Boomin style, cinematic strings, sliding 808 bass, crisp snare, minor-key piano",
  "UK drill, Central Cee style, cold sparse piano, sliding 808, syncopated hats, 140 BPM feel, minimal mix",
  "melodic trap, Future x Southside style, toxic minor melody, hard bounce 808, punchy drums, dark mood",
  "dark trap, 21 Savage style, sinister piano stabs, 808 slides, hard drums, menacing low end",
  "melodic trap, Lil Uzi style, spacey bell plucks, emotional minor chords, bouncy 808, airy pads",
  "reggaeton, Bad Bunny style, dembow kick pattern, bright pluck lead, warm sub, summer club bounce",
  "afrobeats, Burna Boy style, log drum groove, rhythmic guitar, warm chords, danceable percussion",
  "French trap, Skread style, icy minor melody, hard 808 slides, crisp hats, cold Parisian mood",
  "melodic trap, Kore style, sunny guitar pluck, bouncy 808, Marseille bounce, warm polished mix",
  "cloud trap, DJ Weedim style, dreamy washed pads, soft 808, minimal drums, floating French rap vibe",
  "dark trap, Wondagurl style, minimal Travis energy, reverb-heavy plucks, hard 808, sparse arrangement",
  "boom bap, J Dilla style, chopped soul sample, dusty drums, MPC swing, warm vinyl texture",
  "piano trap, Zaytoven style, Atlanta keys riff, bouncy 808, crisp snare, melodic bounce",
  "UK drill, M1OnTheBeat style, cold piano motif, sliding 808, sharp snare, 140 BPM feel",
  "pop-trap, Nyda style, dembow-influenced bounce, bright plucks, French Aya-type energy, glossy mix",
  "dark trap, Hazey style, aggressive 808, dark synth stab, hard drums, street energy",
  "melodic trap, Bazzazian style, emotional piano, smooth 808 glides, crisp hats, heartfelt mood",
  "French drill, Le Motif style, cold piano, sliding 808, drill hats, cinematic tension",
] as const;

const BEAT_HIPHOP_EN = [
  "melodic trap, emotional minor piano, sliding 808 bass, crisp hi-hats, airy pads, hook space, polished mix",
  "UK drill, dark chromatic piano, sliding 808, syncopated hats, cold atmosphere, hard snare, minimal mix",
  "boom bap, chopped soul sample, dusty kick-snare, vinyl crackle, warm bass, Dilla swing, lo-fi texture",
  "phonk, distorted 808, cowbell pattern, dark synth lead, aggressive energy, raw compressed mix",
  "jersey club, bed-squeak sample, punchy kick clusters, chopped vocal one-shots, bounce groove, club energy",
  "neo soul, rhodes chords, live bass pocket, brushed drums, laid-back swing, warm analog feel",
  "Memphis phonk, cowbell hook, dark trap drums, distorted bass, gritty tape saturation, aggressive mood",
  "g-funk, talk box lead, funky synth bass, crisp drums, west coast sunny haze, polished mix",
  "sample drill, chopped soul loop, drill 808 slides, hard snare, gritty texture, dark cinematic mood",
  "cloud rap, washed reverb pads, soft 808, minimal trap drums, dreamy plucks, wide stereo space",
] as const;

const BEAT_TRENDING_EN = [
  "cinematic trap, short viral loop hook, hard 808, crisp hats, tension build, TikTok edit energy",
  "amapiano, log drum bass, percussive shakers, jazzy piano stabs, deep house groove, summer dancefloor",
  "afrobeats, bright guitar licks, talking drum percussion, warm sub, uplifting bounce, festival energy",
  "R&B slow jam, silky rhodes, soft kick, warm bass, late-night mood, smooth polished mix",
  "hyperpop trap, glitchy synth stabs, distorted 808, colorful leads, internet-native sound design",
  "ambient drill, reverb-heavy pads, sparse drill drums, emotional minor melody, streaming-ready polish",
  "lo-fi hip-hop, dusty drums, jazz sample chop, vinyl crackle, mellow chords, study beat groove",
  "jersey club x house, four-on-the-floor kick, chopped stabs, club bounce, edit-ready energy",
] as const;

const BEAT_AI_CREATOR_EN = [
  "modern pop-trap, radio-ready polish, unique signature synth, tight drums, catchy motif, wide clean mix",
  "contemporary R&B instrumental, open verse space, big chorus lift chords, smooth 808, vocal-ready mix",
  "type beat intro, memorable motif hook, clean punchy drums, minimal arrangement, YouTube-ready polish",
  "cinematic trap, tension riser, orchestral hit, hard drop 808, sync-ready arrangement, trailer energy",
] as const;

/* ——— Beats FR (mêmes tags ACE + refs producteurs FR) ——— */
const BEAT_TYPE_BEAT_FR = [
  "melodic trap, Travis Scott style, spacey plucks, psychedelic 808, hard trap drums, wide reverb",
  "trap soul, Drake x PARTYNEXTDOOR style, moody rhodes, smooth 808, tight hi-hats, late-night vibe",
  "rage trap, Playboi Carti style, distorted 808, chaotic synth, aggressive hats, moshpit energy",
  "dark trap, Metro Boomin style, cinematic strings, sliding 808, crisp snare, minor-key piano",
  "UK drill, Central Cee style, cold sparse piano, sliding 808, syncopated hats, minimal cold mix",
  "melodic trap, Future style, toxic minor melody, hard bounce 808, punchy drums, dark mood",
  "dark trap, 21 Savage style, sinister piano, 808 slides, hard drums, menacing low end",
  "melodic trap, Lil Uzi style, spacey bell plucks, emotional minor chords, bouncy 808, airy pads",
  "reggaeton, Bad Bunny style, dembow pattern, bright plucks, warm sub, summer club bounce",
  "afrobeats, Burna Boy style, log drum groove, rhythmic guitar, warm chords, danceable percussion",
  "French trap, Skread style, icy minor melody, hard 808 slides, crisp hats, cold Paris mood",
  "melodic trap, Kore style, sunny guitar pluck, bouncy 808, Marseille bounce, warm polished mix",
  "cloud trap, DJ Weedim style, dreamy pads, soft 808, minimal drums, floating French rap vibe",
  "pop-trap, Nyda style, dembow bounce, bright plucks, French urban pop-trap, glossy mix",
  "dark trap, Hazey style, aggressive 808, dark synth stab, hard drums, street energy",
  "melodic trap, Bazzazian style, emotional piano, smooth 808 glides, crisp hats, heartfelt mood",
  "French drill, Le Motif style, cold piano, sliding 808, drill hats, cinematic tension",
  "boom bap, J Dilla style, chopped soul sample, dusty drums, MPC swing, vinyl texture",
  "UK drill, M1OnTheBeat style, cold piano, sliding 808, 140 BPM feel, sharp snare",
  "dark trap, Wondagurl style, minimal Travis energy, reverb plucks, hard 808, sparse mix",
] as const;

const BEAT_HIPHOP_FR = [
  "melodic trap, emotional minor piano, sliding 808, crisp hi-hats, airy pads, hook space, polished mix",
  "UK drill, dark chromatic piano, sliding 808, syncopated hats, cold atmosphere, hard snare",
  "boom bap, chopped soul sample, dusty drums, vinyl crackle, warm bass, Dilla swing",
  "phonk, distorted 808, cowbell pattern, dark synth lead, aggressive energy, raw mix",
  "jersey club, bed-squeak, punchy kicks, chopped vocal one-shots, bounce groove, club energy",
  "neo soul, rhodes chords, live bass pocket, brushed drums, laid-back swing, warm analog",
  "Memphis phonk, cowbell hook, dark trap drums, distorted bass, gritty tape saturation",
  "g-funk, talk box lead, funky synth bass, crisp drums, west coast haze, polished mix",
  "sample drill, chopped soul loop, drill 808 slides, hard snare, gritty dark mood",
  "cloud rap, washed pads, soft 808, minimal drums, dreamy plucks, wide stereo",
] as const;

const BEAT_TRENDING_FR = [
  "cinematic trap, viral loop hook, hard 808, crisp hats, TikTok edit energy, tension build",
  "amapiano, log drum bass, shakers, jazzy piano stabs, deep house groove, summer dancefloor",
  "afrobeats, bright guitar, talking drum, warm sub, uplifting bounce, festival energy",
  "R&B slow jam, silky rhodes, soft kick, warm bass, late-night mood, smooth polish",
  "hyperpop trap, glitchy synths, distorted 808, colorful leads, internet sound design",
  "ambient drill, reverb pads, sparse drill drums, emotional melody, streaming polish",
  "lo-fi hip-hop, dusty drums, jazz sample, vinyl crackle, mellow chords, study groove",
  "jersey club x house, four-on-the-floor kick, chopped stabs, club bounce, edit energy",
] as const;

const BEAT_AI_CREATOR_FR = [
  "modern pop-trap, radio-ready polish, signature synth, tight drums, catchy motif, clean mix",
  "contemporary R&B instrumental, open verse space, chorus lift chords, smooth 808, vocal-ready",
  "type beat intro, memorable motif, punchy drums, minimal arrangement, YouTube-ready polish",
  "cinematic trap, tension riser, orchestral hit, hard drop 808, sync-ready, trailer energy",
] as const;

/** Hero landing typewriter — phrases courtes lisibles (marketing), pas le format dice ACE. */
export const LANDING_HERO_PROMPTS_EN = [
  "R&B about quitting my job",
  "Pop song about getting ghosted",
  "Melancholic trap for rainy nights",
  "House track about moving on",
  "Neo soul about missing the train",
] as const;

export const LANDING_HERO_PROMPTS_FR = [
  "Un R&B sur ma démission",
  "Une pop sur mon ex qui ghost",
  "Une trap mélancolique pour la pluie",
  "Une house pour tourner la page",
  "Une neo soul sur le train raté",
] as const;

function songPool(locale: AppLocale): readonly string[] {
  if (locale === "fr") {
    return [...SONG_TRENDS_FR, ...SONG_AI_ARTIST_FR, ...SONG_PERSONAL_FR, ...SONG_HIPHOP_CULTURE_FR];
  }
  return [...SONG_TRENDS_EN, ...SONG_AI_ARTIST_EN, ...SONG_PERSONAL_EN, ...SONG_HIPHOP_CULTURE_EN];
}

function beatPool(locale: AppLocale): readonly string[] {
  if (locale === "fr") {
    return [...BEAT_TYPE_BEAT_FR, ...BEAT_HIPHOP_FR, ...BEAT_TRENDING_FR, ...BEAT_AI_CREATOR_FR];
  }
  return [...BEAT_TYPE_BEAT_EN, ...BEAT_HIPHOP_EN, ...BEAT_TRENDING_EN, ...BEAT_AI_CREATOR_EN];
}

export function getRandomPromptPool(locale: AppLocale, mode: PromptMode): readonly string[] {
  return mode === "song" ? songPool(locale) : beatPool(locale);
}

export function pickRandomPrompt(locale: AppLocale, mode: PromptMode): string {
  const pool = getRandomPromptPool(locale, mode);
  if (pool.length === 0) return "";
  const raw = pool[Math.floor(Math.random() * pool.length)] ?? pool[0]!;
  return formatAceDiceCaption(raw);
}

export function pickNextHeroPromptIndex(pool: readonly string[], current: number): number {
  if (pool.length <= 1) return 0;
  let next = current;
  while (next === current) {
    next = Math.floor(Math.random() * pool.length);
  }
  return next;
}
