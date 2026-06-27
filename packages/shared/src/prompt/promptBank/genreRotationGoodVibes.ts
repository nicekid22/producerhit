/** Rotation genre / caption / mood pour les banques good_vibes (v3 + v4). */

export type GoodVibesGenreSpec = {
  genre: string;
  captionGenre: string;
  mood: string;
  instruments: string;
  bpm: number;
};

export const GOOD_VIBES_GENRE_ROTATION: readonly GoodVibesGenreSpec[] = [
  { genre: "dance pop", captionGenre: "dance pop", mood: "euphoric", instruments: "bright synths, punchy kick, claps, funky bass, glossy pads", bpm: 118 },
  { genre: "indie pop", captionGenre: "indie pop", mood: "joyful", instruments: "acoustic guitar, handclaps, warm bass, tambourine, sunny keys", bpm: 105 },
  { genre: "hip hop", captionGenre: "hip hop", mood: "celebratory", instruments: "bouncy 808, crisp snare, brass stabs, funky keys, crowd ad-libs", bpm: 98 },
  { genre: "pop R&B", captionGenre: "pop R&B", mood: "uplifting", instruments: "smooth piano, bright 808, trap hi-hats, horn section, feel-good pads", bpm: 112 },
  { genre: "neo soul", captionGenre: "neo soul", mood: "radiant", instruments: "Rhodes piano, round bass, brushed drums, soft guitar, warm choir", bpm: 90 },
  { genre: "pop rock", captionGenre: "pop rock", mood: "carefree", instruments: "driving guitars, steady drums, anthemic bass, gang vocals, open-air reverb", bpm: 128 },
  { genre: "afrobeat", captionGenre: "afrobeat", mood: "feel-good", instruments: "log drum, bright guitar, shakers, deep bass, joyful horns", bpm: 108 },
  { genre: "house", captionGenre: "house", mood: "sunny", instruments: "four-on-the-floor kick, piano chords, filtered bass, summer pads, vocal chops", bpm: 124 },
  { genre: "pop", captionGenre: "pop", mood: "inspiring", instruments: "uplifting synths, punchy drums, string stabs, handclaps, bright lead", bpm: 120 },
  { genre: "bedroom pop", captionGenre: "bedroom pop", mood: "soft glow", instruments: "dreamy synths, lo-fi drums, tape warmth, gentle guitar, airy vox", bpm: 88 },
  { genre: "reggaeton", captionGenre: "reggaeton", mood: "vibrant", instruments: "dembow rhythm, bright plucks, warm bass, summer brass, party ad-libs", bpm: 96 },
  { genre: "funk pop", captionGenre: "funk pop", mood: "grinning", instruments: "slap bass, wah guitar, tight drums, horn section, clavinet", bpm: 110 },
  { genre: "electro pop", captionGenre: "electro pop", mood: "victorious", instruments: "sidechain synths, tight kick, arpeggios, celebratory lead, risers", bpm: 122 },
  { genre: "afropop", captionGenre: "afropop", mood: "euphoric", instruments: "talking drum, bright keys, bouncy bass, call-and-response, shakers", bpm: 110 },
  { genre: "lo-fi pop", captionGenre: "lo-fi hip hop", mood: "optimistic", instruments: "lo-fi keys, soft boom bap kick, warm bass, birds sample, gentle swing", bpm: 84 },
  { genre: "disco pop", captionGenre: "disco pop", mood: "retro fun", instruments: "four-on-the-floor, funky bass, string hits, talk box, handclaps", bpm: 116 },
  { genre: "EDM pop", captionGenre: "EDM", mood: "euphoric", instruments: "supersaw lead, festival kick, sidechain bass, crowd FX, drop risers", bpm: 128 },
  { genre: "amapiano", captionGenre: "amapiano", mood: "relieved", instruments: "log drum, jazzy keys, deep bass, shaker groove, log melody", bpm: 114 },
  { genre: "soul pop", captionGenre: "soul", mood: "warm", instruments: "live bass, funky drums, horn section, organ stabs, soulful backing", bpm: 100 },
  { genre: "jazz pop", captionGenre: "jazz pop", mood: "lightbulb", instruments: "walking bass, brushed snare, piano comping, trumpet accents, scat hums", bpm: 118 },
  { genre: "trapsoul", captionGenre: "trapsoul", mood: "blissful", instruments: "soft piano, velvet 808, slow hi-hats, warm pads, intimate ad-libs", bpm: 82 },
  { genre: "tropical house", captionGenre: "tropical house", mood: "vacation", instruments: "marimba, four-on-the-floor, steel drum, summer plucks, ocean FX", bpm: 118 },
  { genre: "country pop", captionGenre: "country pop", mood: "nostalgic joy", instruments: "pedal steel, acoustic strum, kick brush, fiddle, family harmonies", bpm: 100 },
  { genre: "pluggnb", captionGenre: "pluggnb", mood: "floating happy", instruments: "bell plucks, soft 808, airy pads, reverb claps, sparkle leads", bpm: 145 },
  { genre: "cinematic pop", captionGenre: "cinematic pop", mood: "miracle", instruments: "orchestral strings, piano, timpani swell, choir, sunbreak synths", bpm: 84 },
  { genre: "anthem pop", captionGenre: "anthem pop", mood: "earned", instruments: "big toms, chant hook, brass, synth stack, stadium reverb", bpm: 124 },
];

export function goodVibesSpecFromHook(hook: string, index: number): GoodVibesGenreSpec & { hook: string } {
  const base = GOOD_VIBES_GENRE_ROTATION[index % GOOD_VIBES_GENRE_ROTATION.length]!;
  return {
    hook,
    ...base,
    bpm: base.bpm + (index % 5) * 2,
  };
}
