/**
 * Génère v3.json — 100 prompts chanson « good vibes » (50 EN + 50 FR).
 * Format ACE : display (sujet — genre, bpm) + caption tags + paroles chantables.
 *
 * Usage: npx tsx scripts/generate-prompt-bank-v3-good-vibes.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSingableLyricsFromBankEntry } from "../packages/shared/src/prompt/promptBank/buildBankLyrics";
import type { PromptBankEntry } from "../packages/shared/src/prompt/promptBank/types";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outPath = path.join(root, "packages/shared/data/prompt-bank/v3.json");

const THEME = "good_vibes";
const THEME_LABEL_EN = "Good Vibes & Happy Moments";
const THEME_LABEL_FR = "Bonnes ondes & moments heureux";

type Spec = {
  hook: string;
  genre: string;
  captionGenre: string;
  mood: string;
  instruments: string;
  bpm: number;
};

const EN_SPECS: Spec[] = [
  { hook: "First day of summer with nowhere to be", genre: "dance pop", captionGenre: "dance pop", mood: "euphoric", instruments: "bright synths, punchy kick, claps, funky bass, glossy pads", bpm: 118 },
  { hook: "Best friends laughing until the streetlights come on", genre: "indie pop", captionGenre: "indie pop", mood: "joyful", instruments: "acoustic guitar, handclaps, warm bass, tambourine, sunny keys", bpm: 105 },
  { hook: "Payday hit and we're eating like royalty tonight", genre: "hip hop", captionGenre: "hip hop", mood: "celebratory", instruments: "bouncy 808, crisp snare, brass stabs, funky keys, crowd ad-libs", bpm: 98 },
  { hook: "Surprise party when they thought nobody remembered", genre: "pop R&B", captionGenre: "pop R&B", mood: "uplifting", instruments: "smooth piano, bright 808, trap hi-hats, horn section, feel-good pads", bpm: 112 },
  { hook: "Dancing barefoot in the kitchen at sunrise", genre: "neo soul", captionGenre: "neo soul", mood: "radiant", instruments: "Rhodes piano, round bass, brushed drums, soft guitar, warm choir", bpm: 90 },
  { hook: "Road trip windows down, playlist on shuffle", genre: "pop rock", captionGenre: "pop rock", mood: "carefree", instruments: "driving guitars, steady drums, anthemic bass, gang vocals, open-air reverb", bpm: 128 },
  { hook: "Got the promotion and called the whole crew", genre: "motivational trap", captionGenre: "motivational trap", mood: "triumphant", instruments: "hard 808, crisp hi-hats, brass hits, piano stabs, crowd energy", bpm: 138 },
  { hook: "Sunday brunch with everyone you love around the table", genre: "afrobeat", captionGenre: "afrobeat", mood: "feel-good", instruments: "log drum, bright guitar, shakers, deep bass, joyful horns", bpm: 108 },
  { hook: "First warm night on the balcony with cold drinks", genre: "house", captionGenre: "house", mood: "sunny", instruments: "four-on-the-floor kick, piano chords, filtered bass, summer pads, vocal chops", bpm: 124 },
  { hook: "Graduation day — cap in the air, future wide open", genre: "pop", captionGenre: "pop", mood: "inspiring", instruments: "uplifting synths, punchy drums, string stabs, handclaps, bright lead", bpm: 120 },
  { hook: "Kids asleep and we finally got the house to ourselves", genre: "contemporary R&B", captionGenre: "contemporary R&B", mood: "playful", instruments: "soft keys, groovy 808, rim shots, silky pads, flirtatious bass", bpm: 94 },
  { hook: "Beach day — sand, sunscreen, and zero deadlines", genre: "reggaeton", captionGenre: "reggaeton", mood: "vibrant", instruments: "dembow rhythm, bright plucks, warm bass, summer brass, party ad-libs", bpm: 96 },
  { hook: "Reconnected with an old friend and picked up right where we left off", genre: "acoustic pop", captionGenre: "acoustic pop", mood: "heartwarming", instruments: "fingerpicked guitar, light percussion, upright bass, harmonica, group hums", bpm: 88 },
  { hook: "Lottery didn't win big but found twenty in an old jacket", genre: "funk pop", captionGenre: "funk pop", mood: "grinning", instruments: "slap bass, wah guitar, tight drums, horn section, clavinet", bpm: 110 },
  { hook: "Team won the championship and the whole city sang", genre: "stadium pop", captionGenre: "pop", mood: "anthemic", instruments: "big drums, chant vocals, brass fanfare, synth rise, crowd stomps", bpm: 126 },
  { hook: "New apartment keys in hand — blank walls, big dreams", genre: "indie R&B", captionGenre: "indie R&B", mood: "hopeful", instruments: "dreamy guitar, soft 808, vinyl texture, warm keys, airy vocals", bpm: 86 },
  { hook: "Picnic in the park with homemade sandwiches and bad jokes", genre: "ukulele pop", captionGenre: "pop", mood: "wholesome", instruments: "ukulele, light kick, hand percussion, whistling melody, sunny strings", bpm: 102 },
  { hook: "Finally finished the project that kept us up for weeks", genre: "electro pop", captionGenre: "electro pop", mood: "victorious", instruments: "sidechain synths, tight kick, arpeggios, celebratory lead, risers", bpm: 122 },
  { hook: "Cousin's wedding — dance floor packed, shoes off", genre: "afropop", captionGenre: "afropop", mood: "euphoric", instruments: "talking drum, bright keys, bouncy bass, call-and-response, shakers", bpm: 110 },
  { hook: "Morning run when the air smells like rain and possibility", genre: "lo-fi pop", captionGenre: "lo-fi hip hop", mood: "optimistic", instruments: "lo-fi keys, soft boom bap kick, warm bass, birds sample, gentle swing", bpm: 84 },
  { hook: "Bonfire on the lake — stars, marshmallows, and stories", genre: "folk pop", captionGenre: "folk pop", mood: "cozy", instruments: "acoustic strum, kick brush, mandolin, group vocals, fire crackle texture", bpm: 92 },
  { hook: "Got verified on the app you've been grinding on for years", genre: "hyperpop", captionGenre: "hyperpop", mood: "ecstatic", instruments: "glitchy synths, distorted 808, pitched vocals, laser leads, confetti FX", bpm: 155 },
  { hook: "Parents proud at dinner — passed the exam, kept the faith", genre: "gospel pop", captionGenre: "gospel influenced", mood: "grateful", instruments: "organ, choir claps, live drums, bass walk, brass swells", bpm: 104 },
  { hook: "Roller rink date — neon, disco ball, no phones", genre: "disco pop", captionGenre: "disco pop", mood: "retro fun", instruments: "four-on-the-floor, funky bass, string hits, talk box, handclaps", bpm: 116 },
  { hook: "Baby's first steps and the whole room cheered", genre: "soft pop", captionGenre: "pop", mood: "tender joy", instruments: "music box keys, soft drums, glockenspiel, warm strings, gentle hums", bpm: 80 },
  { hook: "Farmers market haul — flowers, peaches, and a perfect latte", genre: "bossa nova pop", captionGenre: "bossa nova pop", mood: "breezy", instruments: "nylon guitar, soft brush drums, upright bass, light percussion, flute", bpm: 112 },
  { hook: "Festival sunset set — crowd jumping, arms linked", genre: "EDM pop", captionGenre: "EDM", mood: "euphoric", instruments: "supersaw lead, festival kick, sidechain bass, crowd FX, drop risers", bpm: 128 },
  { hook: "Paid off the last bill — breathe out, plan the trip", genre: "amapiano", captionGenre: "amapiano", mood: "relieved", instruments: "log drum, jazzy keys, deep bass, shaker groove, log melody", bpm: 114 },
  { hook: "Dog wagging tail when you walk through the door", genre: "indie folk", captionGenre: "indie folk", mood: "pure joy", instruments: "banjo plucks, kick stomp, handclaps, whistling hook, upright bass", bpm: 98 },
  { hook: "Block party — grill smoke, speakers on the stoop", genre: "boom bap", captionGenre: "boom bap", mood: "community", instruments: "jazz sample chop, boom bap drums, warm bass, horn loop, block party ad-libs", bpm: 92 },
  { hook: "First kiss under fireworks on the fourth of July", genre: "pop ballad", captionGenre: "pop ballad", mood: "sparkling", instruments: "piano, string swell, soft kick, glitter synths, firework FX", bpm: 76 },
  { hook: "Siblings reunion after years apart — same chaos, same love", genre: "soul pop", captionGenre: "soul", mood: "warm", instruments: "live bass, funky drums, horn section, organ stabs, soulful backing", bpm: 100 },
  { hook: "Creative breakthrough at 2 PM on a random Tuesday", genre: "jazz pop", captionGenre: "jazz pop", mood: "lightbulb", instruments: "walking bass, brushed snare, piano comping, trumpet accents, scat hums", bpm: 118 },
  { hook: "Bike ride through the city when everything feels new", genre: "French touch pop", captionGenre: "French touch", mood: "stylish fun", instruments: "filtered disco bass, vocoder hook, tight drums, talkbox, chic strings", bpm: 120 },
  { hook: "Compliment from a stranger that fixed the whole week", genre: "bedroom pop", captionGenre: "bedroom pop", mood: "soft glow", instruments: "dreamy synths, lo-fi drums, tape warmth, gentle guitar, airy vox", bpm: 88 },
  { hook: "Game night — board games, inside jokes, nobody checking the time", genre: "chipmunk pop", captionGenre: "pop", mood: "silly happy", instruments: "bouncy keys, cartoon bass, playful drums, toy sounds, group chants", bpm: 130 },
  { hook: "Honeymoon phase still going strong three years in", genre: "trapsoul", captionGenre: "trapsoul", mood: "blissful", instruments: "soft piano, velvet 808, slow hi-hats, warm pads, intimate ad-libs", bpm: 82 },
  { hook: "Open mic went better than anyone expected", genre: "singer-songwriter pop", captionGenre: "singer-songwriter", mood: "proud", instruments: "acoustic guitar, cajon, light strings, foot stomps, room applause", bpm: 96 },
  { hook: "Garden finally bloomed after months of patience", genre: "ambient pop", captionGenre: "ambient pop", mood: "peaceful joy", instruments: "soft pads, plucked synth, gentle kick, nature textures, harp", bpm: 72 },
  { hook: "Road trip playlist — singing wrong lyrics at full volume", genre: "power pop", captionGenre: "power pop", mood: "unfiltered fun", instruments: "crunchy guitars, driving drums, gang vocals, octave leads, handclaps", bpm: 134 },
  { hook: "Neighborhood block cleaned up — kids painting murals", genre: "conscious pop", captionGenre: "conscious pop", mood: "unity", instruments: "live drums, warm bass, choir hums, acoustic guitar, hopeful horns", bpm: 94 },
  { hook: "First day at the dream job — badge photo, big smile", genre: "motivational pop", captionGenre: "motivational pop", mood: "ready", instruments: "uplifting piano, punchy drums, string rise, brass, confident bass", bpm: 116 },
  { hook: "Pool party — cannonballs, sunscreen, and loud laughter", genre: "tropical house", captionGenre: "tropical house", mood: "vacation", instruments: "marimba, four-on-the-floor, steel drum, summer plucks, ocean FX", bpm: 118 },
  { hook: "Made the flight with one minute to spare — adventure starts now", genre: "world pop", captionGenre: "world pop", mood: "lucky", instruments: "percussion ensemble, acoustic guitar, flute, hand drums, joyful chants", bpm: 106 },
  { hook: "Grandma's recipe finally tastes just like hers", genre: "country pop", captionGenre: "country pop", mood: "nostalgic joy", instruments: "pedal steel, acoustic strum, kick brush, fiddle, family harmonies", bpm: 100 },
  { hook: "Team project shipped — champagne emoji in the group chat", genre: "pluggnb", captionGenre: "pluggnb", mood: "floating happy", instruments: "bell plucks, soft 808, airy pads, reverb claps, sparkle leads", bpm: 145 },
  { hook: "Skate park with the crew — new trick landed clean", genre: "pop punk", captionGenre: "pop punk", mood: "youthful rush", instruments: "power chords, fast drums, shouted hook, bass drive, crowd woah", bpm: 168 },
  { hook: "Rain stopped right when the outdoor wedding started", genre: "cinematic pop", captionGenre: "cinematic pop", mood: "miracle", instruments: "orchestral strings, piano, timpani swell, choir, sunbreak synths", bpm: 84 },
  { hook: "Staycation deluxe — robe, room service, zero guilt", genre: "luxury R&B", captionGenre: "luxury R&B", mood: "indulgent", instruments: "smooth keys, deep 808, silk pads, muted trumpet, champagne FX", bpm: 88 },
  { hook: "Charity run finish line — medals, hugs, tears of joy", genre: "anthem pop", captionGenre: "anthem pop", mood: "earned", instruments: "big toms, chant hook, brass, synth stack, stadium reverb", bpm: 124 },
];

const FR_SPECS: Spec[] = [
  { hook: "Premier jour d'été sans rien de prévu", genre: "pop dance", captionGenre: "dance pop", mood: "euphorique", instruments: "synthés brillants, kick punchy, claps, basse funky, pads glossy", bpm: 118 },
  { hook: "Les potes qui rient jusqu'aux réverbères", genre: "pop indie", captionGenre: "indie pop", mood: "joyeux", instruments: "guitare acoustique, claps, basse chaude, tambourin, clés ensoleillées", bpm: 105 },
  { hook: "Paye tombée — on mange comme des rois ce soir", genre: "hip hop", captionGenre: "hip hop", mood: "festif", instruments: "808 rebondissant, caisse claire nette, cuivres, clés funky, ad-libs foule", bpm: 98 },
  { hook: "Surprise party alors qu'ils pensaient être oubliés", genre: "pop R&B", captionGenre: "pop R&B", mood: "uplifting", instruments: "piano smooth, 808 bright, hi-hats trap, cuivres, pads feel-good", bpm: 112 },
  { hook: "Danse pieds nus dans la cuisine au lever du soleil", genre: "neo soul", captionGenre: "neo soul", mood: "radieux", instruments: "Rhodes, basse ronde, batterie brushée, guitare douce, chœur chaud", bpm: 90 },
  { hook: "Road trip vitres ouvertes, playlist en shuffle", genre: "pop rock", captionGenre: "pop rock", mood: "insouciant", instruments: "guitares driving, batterie steady, basse anthemique, chœurs gang, reverb open-air", bpm: 128 },
  { hook: "Promotion obtenue — appel à toute la team", genre: "trap motivante", captionGenre: "motivational trap", mood: "triomphant", instruments: "808 hard, hi-hats crisp, cuivres, stabs piano, énergie foule", bpm: 138 },
  { hook: "Brunch du dimanche avec tous ceux qu'on aime", genre: "afrobeat", captionGenre: "afrobeat", mood: "feel-good", instruments: "log drum, guitare bright, shakers, basse profonde, cuivres joyeux", bpm: 108 },
  { hook: "Première nuit chaude sur le balcon, verres froids", genre: "house", captionGenre: "house", mood: "ensoleillé", instruments: "kick four-on-the-floor, accords piano, basse filtrée, pads été, vocal chops", bpm: 124 },
  { hook: "Remise des diplômes — toque en l'air, avenir ouvert", genre: "pop", captionGenre: "pop", mood: "inspirant", instruments: "synthés uplifting, drums punchy, cordes, claps, lead bright", bpm: 120 },
  { hook: "Enfants endormis — enfin la maison à nous", genre: "R&B contemporain", captionGenre: "contemporary R&B", mood: "playful", instruments: "clés soft, 808 groovy, rim shots, pads soyeux, basse flirt", bpm: 94 },
  { hook: "Journée plage — sable, crème solaire, zéro deadline", genre: "reggaeton", captionGenre: "reggaeton", mood: "vibrant", instruments: "rythme dembow, plucks bright, basse chaude, cuivres été, ad-libs party", bpm: 96 },
  { hook: "Retrouvailles avec un vieil ami — on reprend comme avant", genre: "pop acoustique", captionGenre: "acoustic pop", mood: "réconfortant", instruments: "guitare fingerpick, percussions légères, basse upright, harmonica, hums", bpm: 88 },
  { hook: "Pas gagné au loto mais vingt euros dans une vieille veste", genre: "funk pop", captionGenre: "funk pop", mood: "sourire", instruments: "slap bass, wah guitar, drums tight, section cuivres, clavinet", bpm: 110 },
  { hook: "L'équipe a gagné le titre — toute la ville chante", genre: "pop stade", captionGenre: "pop", mood: "hymne", instruments: "grosses caisses, chants, fanfare cuivres, montée synth, stomps foule", bpm: 126 },
  { hook: "Clés du nouvel appart — murs vides, grands rêves", genre: "R&B indie", captionGenre: "indie R&B", mood: "plein d'espoir", instruments: "guitare dreamy, 808 soft, texture vinyl, clés chaudes, voix airy", bpm: 86 },
  { hook: "Pique-nique au parc — sandwiches maison et blagues nulles", genre: "pop ukulele", captionGenre: "pop", mood: "wholesome", instruments: "ukulele, kick léger, percussions main, sifflement, cordes sunny", bpm: 102 },
  { hook: "Projet enfin terminé après des semaines sans sommeil", genre: "electro pop", captionGenre: "electro pop", mood: "victorieux", instruments: "synthés sidechain, kick tight, arpèges, lead célébration, risers", bpm: 122 },
  { hook: "Mariage du cousin — piste pleine, chaussures enlevées", genre: "afropop", captionGenre: "afropop", mood: "euphorique", instruments: "talking drum, clés bright, basse bouncy, call-and-response, shakers", bpm: 110 },
  { hook: "Course matinale — air de pluie et de possibilités", genre: "lo-fi pop", captionGenre: "lo-fi hip hop", mood: "optimiste", instruments: "clés lo-fi, kick boom bap soft, basse chaude, sample oiseaux, swing léger", bpm: 84 },
  { hook: "Feu de camp au lac — étoiles, guimauves, histoires", genre: "folk pop", captionGenre: "folk pop", mood: "cosy", instruments: "strum acoustique, kick brush, mandoline, voix groupe, crackle feu", bpm: 92 },
  { hook: "Badge vérifié sur l'app où tu grind depuis des années", genre: "hyperpop", captionGenre: "hyperpop", mood: "extatique", instruments: "synthés glitch, 808 distordu, voix pitchées, leads laser, FX confettis", bpm: 155 },
  { hook: "Dîner en famille — exam réussi, fierté au menu", genre: "gospel pop", captionGenre: "gospel influenced", mood: "reconnaissant", instruments: "orgue, claps chœur, batterie live, basse walk, swells cuivres", bpm: 104 },
  { hook: "Date patinoire — néons, boule disco, pas de téléphone", genre: "disco pop", captionGenre: "disco pop", mood: "fun rétro", instruments: "four-on-the-floor, basse funky, cordes, talk box, claps", bpm: 116 },
  { hook: "Premiers pas du bébé — toute la pièce applaudit", genre: "pop douce", captionGenre: "pop", mood: "joie tendre", instruments: "boîte à musique, drums soft, glockenspiel, cordes chaudes, hums", bpm: 80 },
  { hook: "Marché du dimanche — fleurs, pêches, latte parfait", genre: "bossa nova pop", captionGenre: "bossa nova pop", mood: "breeze", instruments: "guitare nylon, brush drums, basse upright, percussions légères, flûte", bpm: 112 },
  { hook: "Sunset au festival — foule qui saute, bras liés", genre: "EDM pop", captionGenre: "EDM", mood: "euphorique", instruments: "lead supersaw, kick festival, basse sidechain, FX foule, risers drop", bpm: 128 },
  { hook: "Dernière facture payée — on respire, on planifie le voyage", genre: "amapiano", captionGenre: "amapiano", mood: "soulagé", instruments: "log drum, clés jazz, basse profonde, groove shaker, mélodie log", bpm: 114 },
  { hook: "Le chien qui remue la queue quand tu rentres", genre: "folk indie", captionGenre: "indie folk", mood: "joie pure", instruments: "banjo, stomp kick, claps, sifflement hook, basse upright", bpm: 98 },
  { hook: "Block party — grill, enceintes sur le perron", genre: "boom bap", captionGenre: "boom bap", mood: "communauté", instruments: "chop jazz sample, drums boom bap, basse chaude, loop cuivres, ad-libs block", bpm: 92 },
  { hook: "Premier baiser sous les feux d'artifice du 14 juillet", genre: "ballade pop", captionGenre: "pop ballad", mood: "étincelant", instruments: "piano, swell cordes, kick soft, synthés glitter, FX feux", bpm: 76 },
  { hook: "Retrouvailles fraternelles — même chaos, même amour", genre: "soul pop", captionGenre: "soul", mood: "chaleureux", instruments: "basse live, drums funky, cuivres, stabs orgue, backing soulful", bpm: 100 },
  { hook: "Percée créative un mardi à 14h sans prévenir", genre: "jazz pop", captionGenre: "jazz pop", mood: "illumination", instruments: "basse walking, snare brushée, piano comping, accents trompette, scat", bpm: 118 },
  { hook: "Balade vélo en ville — tout semble neuf", genre: "French touch pop", captionGenre: "French touch", mood: "fun stylé", instruments: "basse disco filtrée, hook vocoder, drums tight, talkbox, cordes chic", bpm: 120 },
  { hook: "Compliment d'un inconnu qui sauve la semaine", genre: "bedroom pop", captionGenre: "bedroom pop", mood: "lueur douce", instruments: "synthés dreamy, drums lo-fi, chaleur tape, guitare gentle, vox airy", bpm: 88 },
  { hook: "Soirée jeux de société — blagues, personne ne regarde l'heure", genre: "pop chipmunk", captionGenre: "pop", mood: "happy bête", instruments: "clés rebondissantes, basse cartoon, drums playful, sons jouets, chants groupe", bpm: 130 },
  { hook: "Lune de miel toujours là trois ans après", genre: "trapsoul", captionGenre: "trapsoul", mood: "bliss", instruments: "piano soft, 808 velvet, hi-hats lents, pads chauds, ad-libs intimes", bpm: 82 },
  { hook: "Open mic mieux que prévu — salle debout", genre: "pop auteur", captionGenre: "singer-songwriter", mood: "fierté", instruments: "guitare acoustique, cajon, cordes légères, stomps, applaudissements", bpm: 96 },
  { hook: "Le jardin fleurit enfin après des mois d'attente", genre: "pop ambient", captionGenre: "ambient pop", mood: "joie paisible", instruments: "pads soft, synth pluck, kick gentle, textures nature, harpe", bpm: 72 },
  { hook: "Playlist road trip — fausses paroles à plein volume", genre: "power pop", captionGenre: "power pop", mood: "fun total", instruments: "guitares crunch, drums driving, voix gang, leads octave, claps", bpm: 134 },
  { hook: "Quartier nettoyé — enfants qui peignent des fresques", genre: "pop conscious", captionGenre: "conscious pop", mood: "unité", instruments: "drums live, basse chaude, hums chœur, guitare acoustique, cuivres hope", bpm: 94 },
  { hook: "Premier jour au job de rêve — badge photo, grand sourire", genre: "pop motivante", captionGenre: "motivational pop", mood: "prêt", instruments: "piano uplifting, drums punchy, montée cordes, cuivres, basse confiante", bpm: 116 },
  { hook: "Pool party — bombes, crème solaire, rires forts", genre: "tropical house", captionGenre: "tropical house", mood: "vacances", instruments: "marimba, four-on-the-floor, steel drum, plucks été, FX océan", bpm: 118 },
  { hook: "Avion attrapé à la dernière minute — l'aventure commence", genre: "world pop", captionGenre: "world pop", mood: "chanceux", instruments: "percussions ensemble, guitare acoustique, flûte, hand drums, chants joyeux", bpm: 106 },
  { hook: "La recette de mamie enfin identique à la sienne", genre: "country pop", captionGenre: "country pop", mood: "joie nostalgique", instruments: "pedal steel, strum acoustique, kick brush, fiddle, harmonies familiales", bpm: 100 },
  { hook: "Projet livré — emoji champagne dans le groupe", genre: "pluggnb", captionGenre: "pluggnb", mood: "happy flottant", instruments: "bell plucks, 808 soft, pads airy, claps reverb, leads sparkle", bpm: 145 },
  { hook: "Skate park avec la team — nouveau trick clean", genre: "pop punk", captionGenre: "pop punk", mood: "rush jeunesse", instruments: "power chords, drums rapides, hook shouté, basse drive, woah foule", bpm: 168 },
  { hook: "La pluie s'arrête pile au début du mariage dehors", genre: "pop ciné", captionGenre: "cinematic pop", mood: "miracle", instruments: "cordes orchestral, piano, swell timbales, chœur, synthés sunbreak", bpm: 84 },
  { hook: "Staycation deluxe — peignoir, room service, zéro culpabilité", genre: "R&B luxury", captionGenre: "luxury R&B", mood: "indulgent", instruments: "clés smooth, 808 deep, pads soie, trompette muted, FX champagne", bpm: 88 },
  { hook: "Course caritative — médailles, câlins, larmes de joie", genre: "pop hymne", captionGenre: "anthem pop", mood: "mérité", instruments: "gros toms, hook chant, cuivres, stack synth, reverb stade", bpm: 124 },
];

function buildCaption(spec: Spec): string {
  return `${spec.captionGenre}, ${spec.mood}, ${spec.instruments}, ${spec.bpm} bpm, hi-fi, uplifting energy, polished studio mix`;
}

function buildDisplay(spec: Spec): string {
  return `${spec.hook} — ${spec.genre}, ${spec.bpm} bpm`;
}

function toEntry(id: number, lang: "en" | "fr", spec: Spec): PromptBankEntry {
  const display = buildDisplay(spec);
  const caption = buildCaption(spec);
  const lyrics_structure = buildSingableLyricsFromBankEntry({
    display,
    lyrics_structure: "",
    lang,
    theme: THEME,
    id,
  });
  return {
    id,
    theme: THEME,
    theme_label_en: THEME_LABEL_EN,
    theme_label_fr: THEME_LABEL_FR,
    lang,
    display,
    acestep: { caption, lyrics_structure },
  };
}

const entries: PromptBankEntry[] = [];
let id = 2001;
for (const spec of EN_SPECS) {
  entries.push(toEntry(id++, "en", spec));
}
for (const spec of FR_SPECS) {
  entries.push(toEntry(id++, "fr", spec));
}

fs.writeFileSync(outPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
console.log(`Wrote ${entries.length} entries to ${outPath} (ids ${entries[0]?.id}–${entries[entries.length - 1]?.id})`);
