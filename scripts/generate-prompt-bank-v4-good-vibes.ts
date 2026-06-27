/**
 * Génère v4.json — 200 prompts chanson « good vibes » supplémentaires (100 EN + 100 FR).
 * IDs 2101–2300. Thème good_vibes (même format que v3).
 *
 * Usage: npx tsx scripts/generate-prompt-bank-v4-good-vibes.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildSingableLyricsFromBankEntry } from "../packages/shared/src/prompt/promptBank/buildBankLyrics";
import type { PromptBankEntry } from "../packages/shared/src/prompt/promptBank/types";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outPath = path.join(root, "packages/shared/data/prompt-bank/v4.json");

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

const GENRE_ROTATION: Omit<Spec, "hook">[] = [
  { genre: "dance pop", captionGenre: "dance pop", mood: "euphoric", instruments: "bright synths, punchy kick, claps, funky bass, glossy pads", bpm: 118 },
  { genre: "indie pop", captionGenre: "indie pop", mood: "joyful", instruments: "acoustic guitar, handclaps, warm bass, tambourine, sunny keys", bpm: 105 },
  { genre: "hip hop", captionGenre: "hip hop", mood: "celebratory", instruments: "bouncy 808, crisp snare, brass stabs, funky keys, crowd ad-libs", bpm: 98 },
  { genre: "pop R&B", captionGenre: "pop R&B", mood: "uplifting", instruments: "smooth piano, bright 808, trap hi-hats, horn section, feel-good pads", bpm: 112 },
  { genre: "neo soul", captionGenre: "neo soul", mood: "radiant", instruments: "Rhodes piano, round bass, brushed drums, soft guitar, warm choir", bpm: 90 },
  { genre: "afrobeat", captionGenre: "afrobeat", mood: "feel-good", instruments: "log drum, bright guitar, shakers, deep bass, joyful horns", bpm: 108 },
  { genre: "house", captionGenre: "house", mood: "sunny", instruments: "four-on-the-floor kick, piano chords, filtered bass, summer pads, vocal chops", bpm: 124 },
  { genre: "pop", captionGenre: "pop", mood: "inspiring", instruments: "uplifting synths, punchy drums, string stabs, handclaps, bright lead", bpm: 120 },
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
  { genre: "bedroom pop", captionGenre: "bedroom pop", mood: "soft glow", instruments: "dreamy synths, lo-fi drums, tape warmth, gentle guitar, airy vox", bpm: 88 },
  { genre: "trapsoul", captionGenre: "trapsoul", mood: "blissful", instruments: "soft piano, velvet 808, slow hi-hats, warm pads, intimate ad-libs", bpm: 82 },
  { genre: "tropical house", captionGenre: "tropical house", mood: "vacation", instruments: "marimba, four-on-the-floor, steel drum, summer plucks, ocean FX", bpm: 118 },
  { genre: "country pop", captionGenre: "country pop", mood: "nostalgic joy", instruments: "pedal steel, acoustic strum, kick brush, fiddle, family harmonies", bpm: 100 },
  { genre: "pluggnb", captionGenre: "pluggnb", mood: "floating happy", instruments: "bell plucks, soft 808, airy pads, reverb claps, sparkle leads", bpm: 145 },
  { genre: "cinematic pop", captionGenre: "cinematic pop", mood: "miracle", instruments: "orchestral strings, piano, timpani swell, choir, sunbreak synths", bpm: 84 },
  { genre: "anthem pop", captionGenre: "anthem pop", mood: "earned", instruments: "big toms, chant hook, brass, synth stack, stadium reverb", bpm: 124 },
];

const EN_HOOKS: string[] = [
  "Free upgrade to first class on a random Tuesday",
  "Neighbor brought homemade cookies just because",
  "Found your favorite snack back on the shelf",
  "Group chat hyping you up for no reason",
  "Sun broke through clouds right on cue",
  "Karaoke night and you actually nailed the high note",
  "Thrift store jacket that fits like it was tailored",
  "Boss said take the afternoon off — paid",
  "Rainbow after the storm on the commute home",
  "Your meme got reposted by someone you admire",
  "Cafe gave you a free pastry for being a regular",
  "Playlist shuffle landed the perfect song twice",
  "Kids drew you as a superhero on the fridge",
  "Parking spot opened up right in front",
  "Old photo album resurfaced with the best memories",
  "Stranger held the door and said you made their day",
  "First attempt at the recipe and it slaps",
  "Team let you leave early on a Friday",
  "Found money in the winter coat pocket",
  "Video call surprise with friends across time zones",
  "New plant sprouted a leaf overnight",
  "Compliment on your fit from someone whose taste you trust",
  "Busker playing your favorite song on the corner",
  "Workout PR when you almost skipped the gym",
  "Package arrived a day early with exactly what you needed",
  "Pet learned a new trick on the first try",
  "Clear night sky full of stars on a camping trip",
  "Free tickets to the show you wanted to see",
  "Homework help from a sibling who usually teases you",
  "Smooth commute — every light was green",
  "Ice cream truck on the hottest day of the year",
  "Your plant-based dish impressed the meat lovers",
  "Flash mob dance broke out and you joined in",
  "Saved a seat at the concert for your best friend",
  "Voice note from grandma full of laughter",
  "First snow day — hot cocoa and zero obligations",
  "Crush liked your story within minutes",
  "Garage sale score — vintage vinyl for two dollars",
  "Community garden harvest bigger than expected",
  "Wi-Fi fixed itself before the big meeting",
  "Surprise bonus in the paycheck",
  "Rollercoaster photo where everyone looks hilarious",
  "New haircut — barber understood the assignment",
  "Beach volleyball game with strangers who became friends",
  "Found the perfect gift on the first store",
  "Open mic host called you back for an encore",
  "Bike tire held up on the longest ride of the year",
  "Sunset paddleboard with dolphins nearby",
  "Roommate cleaned the kitchen without being asked",
  "Your joke landed in a room full of new people",
  "First date laughed at your worst pun",
  "Library book you wanted was just returned",
  "Smooth passport control — vacation mode activated",
  "Flash sale on the shoes you bookmarked",
  "Coach pulled you aside to say you're improving",
  "Homemade pizza night — dough rose perfectly",
  "Fireworks view from the rooftop you didn't know existed",
  "Podcast host answered your DM with kindness",
  "Snowball fight that ended in group hugs",
  "Yoga class ended with the instructor's favorite playlist",
  "Found a four-leaf clover on a walk",
  "Your art got featured on the community board",
  "Late-night diner with friends after the movie",
  "First time surfing and you stood up",
  "Volunteer shift felt shorter because of great company",
  "Surprise flowers at the office desk",
  "Your song came on at the wedding reception",
  "Smooth merge on the highway — tiny win",
  "Farmers market musician played your request",
  "New coworker turned out to be your vibe",
  "Photo booth strips that capture pure joy",
  "First frost and the world looks magical",
  "Compliment from the barista who never chats",
  "Game-winning shot in pickup basketball",
  "Found the missing sock in the dryer",
  "Bon voyage party with speeches that made you cry happy tears",
  "Your team clinched the playoff spot",
  "Smooth landing after turbulence — relief laugh",
  "Street artist let you keep the sketch",
  "Meditation app streak hit one hundred days",
  "Surprise visit from a friend who lives far away",
  "First bite of vacation food — worth the trip",
  "Your playlist became the road trip anthem",
  "Quiet morning with coffee and a good book",
  "Kids choir performance that melted hearts",
  "Thrift flip sold for triple what you paid",
  "Smooth presentation — client loved it",
  "Found a bench with the perfect view",
  "Your plant finally bloomed after patience",
  "Group hug at the reunion photo",
  "Free refills and great conversation",
  "First snow angel as an adult — why not",
  "Your team won trivia night by one point",
  "Smooth checkout — no line at all",
  "Surprise dessert on the house",
  "Golden hour photos that need no filter",
  "New favorite coffee shop discovered by accident",
  "Your recommendation became someone's new obsession",
  "First swim of summer — water perfect",
  "Compliment on your cooking from the picky eater",
  "Smooth bike commute with a tailwind",
  "Found the perfect playlist for the mood",
  "Your idea got picked in the brainstorm",
  "Surprise care package in the mail",
  "First time trying salsa and the room cheered",
  "Quiet victory dance in the kitchen",
];

const FR_HOOKS: string[] = [
  "Surclassement gratuit en première un mardi au hasard",
  "Le voisin apporte des cookies maison sans raison",
  "Ton snack préféré de retour en rayon",
  "Le groupe WhatsApp t'anime sans prévenir",
  "Le soleil perce les nuages pile au bon moment",
  "Soirée karaoké — tu tiens la note aiguë",
  "Veste vintage qui tombe juste parfaitement",
  "Le patron te dit de prendre l'après-midi — payé",
  "Arc-en-ciel après l'orage sur le trajet",
  "Ton mème repartagé par quelqu'un que tu admires",
  "Le café t'offre un gâteau parce que t'es client régulier",
  "La playlist tombe deux fois sur la chanson parfaite",
  "Tes enfants t'ont dessiné en super-héros sur le frigo",
  "Place de parking libre juste devant",
  "Album photo retrouvé avec les meilleurs souvenirs",
  "Un inconnu te tient la porte — tu as illuminé sa journée",
  "Première recette et c'est un chef-d'œuvre",
  "L'équipe te laisse partir tôt un vendredi",
  "Billets trouvés dans la poche du manteau",
  "Visio surprise avec des proches à l'autre bout du monde",
  "Nouvelle feuille sur la plante du matin au soir",
  "Compliment sur ta tenue par quelqu'un dont le style te plaît",
  "Musicien de rue joue ta chanson préférée",
  "Record perso en salle alors que tu voulais faire la grasse mat'",
  "Colis livré un jour avant avec exactement ce qu'il fallait",
  "Le chien apprend un tour du premier coup",
  "Ciel étoilé parfait en camping",
  "Places gratuites pour le concert que tu voulais voir",
  "Aide aux devoirs d'un frère qui te taquine d'habitude",
  "Trajet fluide — tous les feux au vert",
  "Camion de glaces le jour le plus chaud de l'année",
  "Plat végétarien qui impressionne les carnivores",
  "Flash mob dans la rue — tu te joins à la danse",
  "Place gardée au concert pour ton meilleur pote",
  "Message vocal de mamie plein de rires",
  "Premier jour de neige — chocolat chaud, zéro obligation",
  "Celle qui te plaît a réagi à ta story en deux minutes",
  "Vinyle vintage à deux euros en brocante",
  "Récolte généreuse au jardin partagé",
  "La connexion internet revient juste avant la grosse réunion",
  "Bonus surprise sur la fiche de paie",
  "Photo aux montagnes russes — tout le monde hilare",
  "Nouvelle coupe — le coiffeur a parfaitement compris",
  "Partie de beach-volley avec des inconnus devenus potes",
  "Cadeau parfait trouvé au premier magasin",
  "Scène ouverte — le présentateur te rappelle pour une bis",
  "Pneu de vélo tenu sur la plus longue sortie de l'année",
  "Paddle au coucher du soleil, dauphins pas loin",
  "Ton coloc a nettoyé la cuisine sans qu'on le demande",
  "Ta blague passe dans une salle de nouveaux",
  "Premier rendez-vous — il ou elle rit de ton pire jeu de mots",
  "Le livre que tu voulais vient d'être rendu à la bibliothèque",
  "Contrôle passeport sans stress — mode vacances activé",
  "Soldes sur les chaussures que tu avais mises de côté",
  "Le coach te dit que tu progresses",
  "Pizza maison — pâte parfaitement levée",
  "Feux d'artifice depuis un rooftop secret",
  "Le podcasteur répond gentiment à ton message privé",
  "Bataille de boules de neige finie en câlins",
  "Cours de yoga terminé sur la playlist du prof",
  "Trèfle à quatre feuilles trouvé en balade",
  "Ton art affiché sur le panneau du quartier",
  "Dîner tardif entre potes après le film",
  "Première vague debout en surf",
  "Bénévolat raccourci grâce à la bonne compagnie",
  "Fleurs surprise sur ton bureau",
  "Ta chanson passe à la réception du mariage",
  "Insertion fluide sur l'autoroute — petite victoire",
  "Musicien du marché joue ta demande",
  "Nouveau collègue — même énergie que toi",
  "Photos photomaton pleines de joie",
  "Premier gel — le monde semble magique",
  "Compliment du barista qui ne parle jamais",
  "Panier décisif au basket de rue",
  "Chaussette perdue retrouvée dans le sèche-linge",
  "Pot de départ avec discours qui font pleurer de joie",
  "L'équipe se qualifie pour les phases finales",
  "Atterrissage doux après turbulences — rire de soulagement",
  "Artiste de rue te laisse garder le croquis",
  "Cent jours de méditation d'affilée",
  "Visite surprise d'un pote qui habite loin",
  "Première bouchée des vacances — ça valait le voyage",
  "Ta playlist devient l'hymne du road trip",
  "Matin calme — café et bon livre",
  "Chœur d'enfants qui fond les cœurs",
  "Trouvaille en brocante revendue trois fois le prix payé",
  "Présentation fluide — le client adore",
  "Banc avec la vue parfaite",
  "La plante fleurit enfin après des mois de patience",
  "Câlin de groupe à la photo de retrouvailles",
  "Recharges gratuites et bonne conversation",
  "Premier bonhomme de neige adulte — pourquoi pas",
  "Soirée quiz remportée d'un seul point",
  "Caisse fluide — zéro file d'attente",
  "Dessert offert par la maison",
  "Photos à l'heure dorée sans filtre",
  "Nouveau café favori trouvé par hasard",
  "Ta recommandation devient l'obsession de quelqu'un",
  "Première baignade de l'été — eau parfaite",
  "Compliment sur ta cuisine de la part du difficile",
  "Trajet vélo avec le vent dans le dos",
  "Playlist parfaite pour l'humeur du moment",
  "Ton idée retenue en réunion créative",
  "Colis surprise dans la boîte aux lettres",
  "Première salsa — la salle applaudit",
  "Danse de victoire discrète dans la cuisine",
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

function specsFromHooks(hooks: string[], lang: "en" | "fr"): Spec[] {
  return hooks.map((hook, i) => ({
    hook,
    ...GENRE_ROTATION[i % GENRE_ROTATION.length]!,
    bpm: GENRE_ROTATION[i % GENRE_ROTATION.length]!.bpm + (i % 5) * 2,
  }));
}

const entries: PromptBankEntry[] = [];
let id = 2101;
for (const spec of specsFromHooks(EN_HOOKS, "en")) {
  entries.push(toEntry(id++, "en", spec));
}
for (const spec of specsFromHooks(FR_HOOKS, "fr")) {
  entries.push(toEntry(id++, "fr", spec));
}

fs.writeFileSync(outPath, `${JSON.stringify(entries, null, 2)}\n`, "utf8");
console.log(`Wrote ${entries.length} entries to ${outPath} (ids ${entries[0]?.id}–${entries[entries.length - 1]?.id})`);
