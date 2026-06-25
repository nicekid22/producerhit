export type BankLyricsTheme =
  | "love"
  | "loss"
  | "hustle"
  | "party"
  | "heartbreak"
  | "nostalgia"
  | "identity"
  | "night";

const THEMES = new Set<string>([
  "love",
  "loss",
  "hustle",
  "party",
  "heartbreak",
  "nostalgia",
  "identity",
  "night",
]);

export function normalizeBankTheme(theme: string): BankLyricsTheme {
  const key = theme.trim().toLowerCase();
  return THEMES.has(key) ? (key as BankLyricsTheme) : "love";
}

type ThemeLinePools = Record<BankLyricsTheme, string[][]>;

const VERSE_FILLERS_EN: ThemeLinePools = {
  love: [
    ["Your eyes pull me closer", "I don't want to leave", "Every breath feels warmer", "Stay a little longer"],
    ["Heartbeat syncs with yours", "Lost inside this moment", "Nothing else exists now", "Hold me through the night"],
  ],
  loss: [
    ["Empty room, your ghost", "Photos on the floor", "Silence where you were", "I still call your name"],
    ["Winter in my chest", "Can't rewind the tape", "Goodbye still echoes", "Missing what we had"],
  ],
  hustle: [
    ["Grind until it pays", "No sleep, just focus", "Built this from the ground", "Eyes on the prize"],
    ["Late nights, early wins", "Pressure makes diamonds", "Stack it, never fold", "Run the marathon"],
  ],
  party: [
    ["Bass hits in my bones", "Lights blur into gold", "We don't need tomorrow", "Dance until sunrise"],
    ["Cup raised to the sky", "Everybody feel alive", "No rules on this floor", "Turn the night up loud"],
  ],
  heartbreak: [
    ["Tears on the pillow", "You said you'd stay", "Pieces on the ground", "Love turned into dust"],
    ["Cold where you slept", "Texts I'll never send", "Scars under my skin", "Can't unfeel your touch"],
  ],
  nostalgia: [
    ["Old tapes in the attic", "Summer on replay", "Polaroids fading slow", "Wish I could go back"],
    ["Cassette in my car", "Friends we used to be", "Same street, different me", "Golden hour again"],
  ],
  identity: [
    ["Finding who I am", "Mirror, tell the truth", "Breaking every mold", "Finally feel alive"],
    ["No mask, just my skin", "Voice I kept inside", "Step into the light", "Own my every scar"],
  ],
  night: [
    ["Neon on my face", "City never sleeps", "Moon on the rooftop", "Secrets in the dark"],
    ["3 AM on my mind", "Streetlights guide me home", "Shadows know my name", "Stars above the noise"],
  ],
};

const VERSE_FILLERS_FR: ThemeLinePools = {
  love: [
    ["Tes yeux me rapprochent", "Je ne veux pas partir", "Chaque souffle plus chaud", "Reste encore un peu"],
    ["Mon cœur bat avec toi", "Perdu dans l'instant", "Rien d'autre n'existe", "Garde-moi cette nuit"],
  ],
  loss: [
    ["Chambre vide, ton ombre", "Photos sur le sol", "Silence où tu étais", "J'appelle encore ton nom"],
    ["Hiver dans ma poitrine", "Impossible de rembobiner", "Adieu qui résonne encore", "Tu me manques toujours"],
  ],
  hustle: [
    ["Je grind jusqu'au bout", "Pas de sommeil, focus", "Construit depuis le sol", "Les yeux sur le prix"],
    ["Nuits tard, victoires tôt", "La pression forge l'or", "On empile, on plie pas", "Marathon sans fin"],
  ],
  party: [
    ["La basse dans mes os", "Les lumières en or", "On n'a pas besoin de demain", "Danse jusqu'au jour"],
    ["Verre levé vers le ciel", "Tout le monde vit fort", "Pas de règles ce soir", "Monte le son encore"],
  ],
  heartbreak: [
    ["Larmes sur l'oreiller", "Tu disais rester", "Morceaux par terre", "L'amour en poussière"],
    ["Froid là où tu dormais", "SMS j'enverrai pas", "Cicatrices sous la peau", "Impossible d'oublier"],
  ],
  nostalgia: [
    ["Vieilles cassettes au grenier", "Été en boucle", "Polaroïds qui pâlissent", "Revenir en arrière"],
    ["K7 dans la voiture", "Amis qu'on était", "Même rue, autre moi", "Heure dorée encore"],
  ],
  identity: [
    ["Je cherche qui je suis", "Miroir, dis la vérité", "Je casse chaque moule", "Enfin je me sens vivant"],
    ["Pas de masque, ma peau", "Voix que je cachais", "Je marche vers la lumière", "J'assume chaque cicatrice"],
  ],
  night: [
    ["Néon sur mon visage", "La ville ne dort pas", "Lune sur le toit", "Secrets dans le noir"],
    ["Trois heures dans ma tête", "Réverbères me guident", "Les ombres me connaissent", "Étoiles au-dessus du bruit"],
  ],
};

const PRE_CHORUS_EN: ThemeLinePools = {
  love: [
    ["It's rising in my chest", "I can't catch my breath"],
    ["Every beat pulls me in", "Let the feeling begin"],
  ],
  loss: [
    ["Something broke inside", "Can't bring you back"],
    ["The silence hurts the most", "I'm still not over you"],
  ],
  hustle: [
    ["No time to look down", "Keep climbing, don't stop"],
    ["Pressure on my shoulders", "Victory getting closer"],
  ],
  party: [
    ["Hands up, feel the sound", "Feet leave the ground"],
    ["Turn it up, don't slow down", "Own the whole town"],
  ],
  heartbreak: [
    ["Tears fall like rain", "Love was just a game"],
    ["You left without a word", "Nothing left to save"],
  ],
  nostalgia: [
    ["Take me back in time", "Those days felt so right"],
    ["Memory on repeat", "Wish you were still here"],
  ],
  identity: [
    ["I'm finally breaking free", "This is who I'll be"],
    ["No more hiding out", "Shout it without doubt"],
  ],
  night: [
    ["City lights on my skin", "Let the night begin"],
    ["We move under the moon", "Midnight coming soon"],
  ],
};

const PRE_CHORUS_FR: ThemeLinePools = {
  love: [
    ["Ça monte dans ma poitrine", "Je perds mon équilibre"],
    ["Chaque souffle me rapproche", "Le cœur s'emballe encore"],
  ],
  loss: [
    ["Quelque chose s'est brisé", "Impossible de revenir"],
    ["Le silence fait mal", "Je n'ai pas digéré"],
  ],
  hustle: [
    ["Pas le temps de baisser", "On grimpe sans s'arrêter"],
    ["La pression sur mes épaules", "La victoire se rapproche"],
  ],
  party: [
    ["Les mains en l'air ce soir", "On danse jusqu'au jour"],
    ["Monte le son, plus fort", "On vit chaque accord"],
  ],
  heartbreak: [
    ["Les larmes tombent comme pluie", "L'amour n'était qu'un jeu"],
    ["Tu es parti sans un mot", "Rien à sauver encore"],
  ],
  nostalgia: [
    ["Ramène-moi dans le temps", "Ces jours étaient si beaux"],
    ["Souvenir en boucle", "J'aimerais que tu sois là"],
  ],
  identity: [
    ["Je me libère enfin", "Voilà qui je serai"],
    ["Fini de me cacher", "Je crie sans hésiter"],
  ],
  night: [
    ["Les néons sur ma peau", "Que la nuit commence"],
    ["On avance sous la lune", "Minuit arrive bientôt"],
  ],
};

const BRIDGE_EN: ThemeLinePools = {
  love: [
    ["Maybe we don't need a map", "Just your heart on my lap"],
    ["If this is all we get tonight", "Hold me till the light"],
  ],
  loss: [
    ["I still hear your laugh", "But you're never coming back"],
    ["Let the memories fade slow", "Time is all I know"],
  ],
  hustle: [
    ["Sleepless nights will pay off", "They doubted, now they watch"],
    ["Built from dust to gold", "Story still untold"],
  ],
  party: [
    ["One more song, don't stop", "Feel it at the top"],
    ["We won't remember names", "Just the fire, just the flames"],
  ],
  heartbreak: [
    ["I gave you all of me", "You threw it to the sea"],
    ["Healing takes its time", "But I'll be fine"],
  ],
  nostalgia: [
    ["Same corner, different face", "Youth was not a waste"],
    ["Polaroid in my hand", "Wish you understand"],
  ],
  identity: [
    ["I was lost, now I'm found", "Finally standing ground"],
    ["No permission needed now", "I define myself somehow"],
  ],
  night: [
    ["3 AM thoughts collide", "City on my side"],
    ["Darkness feels like home", "Never sleep alone"],
  ],
};

const BRIDGE_FR: ThemeLinePools = {
  love: [
    ["Peut-être qu'on n'a besoin de rien", "Juste ce moment à deux"],
    ["Si c'est tout ce qu'on a ce soir", "Garde-moi contre toi"],
  ],
  loss: [
    ["J'entends encore ton rire", "Mais tu ne reviendras pas"],
    ["Laisse les souvenirs filer", "Le temps est mon seul repère"],
  ],
  hustle: [
    ["Les nuits blanches paieront", "Ils doutaient, ils regardent"],
    ["Du sol vers l'or construit", "L'histoire n'est pas finie"],
  ],
  party: [
    ["Encore un son, arrête pas", "Sens-le au sommet"],
    ["On oubliera les noms", "Juste le feu, les flammes"],
  ],
  heartbreak: [
    ["Je t'ai donné tout de moi", "Tu l'as jeté à la mer"],
    ["Guérir prend du temps", "Mais j'irai bien"],
  ],
  nostalgia: [
    ["Même coin, autre visage", "La jeunesse n'était pas vaine"],
    ["Polaroïd dans ma main", "J'aimerais que tu comprennes"],
  ],
  identity: [
    ["J'étais perdu, je suis là", "Enfin sur mes pieds"],
    ["Plus besoin de permission", "Je me définis seul"],
  ],
  night: [
    ["Pensées de trois heures", "La ville avec moi"],
    ["Le noir me ressemble", "Jamais seul la nuit"],
  ],
};

type ThemeOutroPools = Record<BankLyricsTheme, string[]>;

const OUTRO_EN: ThemeOutroPools = {
  love: ["Fade into your arms", "Hold the moment tight"],
  loss: ["Let the rain fall down", "You're not around"],
  hustle: ["Back to the grind", "Winning in my mind"],
  party: ["Lights go dim slow", "Last song, don't go"],
  heartbreak: ["Door closes soft", "Love was not enough"],
  nostalgia: ["Tape stops spinning", "Memories thinning"],
  identity: ["I know who I am", "Here I stand"],
  night: ["City fades away", "Till another day"],
};

const OUTRO_FR: ThemeOutroPools = {
  love: ["On s'éteint doucement", "Dans tes bras ce soir"],
  loss: ["La pluie tombe encore", "Tu n'es plus là"],
  hustle: ["Retour au grind", "Victoire dans ma tête"],
  party: ["Les lumières s'éteignent", "Dernier son, reste"],
  heartbreak: ["La porte se ferme", "Pas assez d'amour"],
  nostalgia: ["La cassette s'arrête", "Souvenirs qui s'effacent"],
  identity: ["Je sais qui je suis", "Me voici debout"],
  night: ["La ville s'éloigne", "Jusqu'à demain"],
};

export function pickThemeLines(
  pools: ThemeLinePools,
  theme: BankLyricsTheme,
  rng: () => number,
): string[] {
  const pool = pools[theme];
  return pool[Math.floor(rng() * pool.length)]!;
}

export function themeVerseFillers(lang: "en" | "fr", theme: BankLyricsTheme, rng: () => number): string[] {
  return pickThemeLines(lang === "fr" ? VERSE_FILLERS_FR : VERSE_FILLERS_EN, theme, rng);
}

export function themePreChorusLines(lang: "en" | "fr", theme: BankLyricsTheme, rng: () => number): string[] {
  return pickThemeLines(lang === "fr" ? PRE_CHORUS_FR : PRE_CHORUS_EN, theme, rng);
}

export function themeBridgeLines(lang: "en" | "fr", theme: BankLyricsTheme, rng: () => number): string[] {
  return pickThemeLines(lang === "fr" ? BRIDGE_FR : BRIDGE_EN, theme, rng);
}

export function themeOutroLines(lang: "en" | "fr", theme: BankLyricsTheme): string[] {
  const pool = lang === "fr" ? OUTRO_FR : OUTRO_EN;
  return pool[theme];
}
