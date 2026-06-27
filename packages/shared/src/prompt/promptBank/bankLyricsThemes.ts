export type BankLyricsTheme =
  | "love"
  | "loss"
  | "hustle"
  | "party"
  | "heartbreak"
  | "nostalgia"
  | "identity"
  | "night"
  | "good_vibes"
  | "street";

const THEMES = new Set<string>([
  "love",
  "loss",
  "hustle",
  "party",
  "heartbreak",
  "nostalgia",
  "identity",
  "night",
  "good_vibes",
  "street",
]);

/** Thèmes v2 banque → pools lyrics v1. */
const THEME_ALIASES: Record<string, BankLyricsTheme> = {
  street: "street",
  freedom: "hustle",
  rage: "hustle",
  family: "love",
  introspection: "night",
  spiritual: "identity",
  summer: "good_vibes",
};

export function normalizeBankTheme(theme: string): BankLyricsTheme {
  const key = theme.trim().toLowerCase();
  if (THEME_ALIASES[key]) return THEME_ALIASES[key];
  if (THEMES.has(key)) return key as BankLyricsTheme;
  return "hustle";
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
  good_vibes: [
    ["Sun on my skin today", "Smile I can't erase", "Good news on my phone", "Life feels wide open"],
    ["Laughing with my crew", "Golden hour mood", "Nothing left to prove", "Today belongs to us"],
  ],
  street: [
    ["They sell the dream online", "Ignore the real cost", "Blocks remember every name", "Truth inside each bar"],
    ["Same corners, heavy eyes", "Glory on a screen", "We pay in blood and time", "Speak it out loud"],
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
  good_vibes: [
    ["Soleil sur ma peau aujourd'hui", "Sourire impossible à cacher", "Bonnes nouvelles au téléphone", "La vie s'ouvre devant moi"],
    ["On rigole entre potes", "Ambiance heure dorée", "Plus rien à prouver", "Aujourd'hui c'est pour nous"],
  ],
  street: [
    ["Ils vendent le faux rêve", "Ignorent le vrai prix", "Le bloc garde les noms", "La vérité dans le flow"],
    ["Mêmes coins, yeux lourds", "Gloire sur un écran", "On paie en sang et temps", "Dis-le à voix haute"],
  ],
};

const CHORUS_EN: ThemeLinePools = {
  love: [
    ["Stay with me tonight", "You feel so right"],
    ["Heartbeats sync as one", "This has just begun"],
  ],
  loss: [
    ["You're gone but not forgotten", "Memories stay broken"],
    ["Empty where you were", "Silence is my curse"],
  ],
  hustle: [
    ["Grind until I win", "Never giving in"],
    ["Built from dust to gold", "Story still untold"],
  ],
  party: [
    ["Hands up feel alive", "Dance until sunrise"],
    ["Turn the night up loud", "Own the whole crowd"],
  ],
  heartbreak: [
    ["Love turned into dust", "Trust was never enough"],
    ["Tears fall like rain", "Nothing left to save"],
  ],
  nostalgia: [
    ["Take me back in time", "Those days felt so right"],
    ["Golden hour again", "Wish we could rewind"],
  ],
  identity: [
    ["This is who I am", "No more hiding out"],
    ["Finally breaking free", "Just the real me"],
  ],
  night: [
    ["City never sleeps", "Secrets in the dark"],
    ["Neon on my face", "Midnight is my place"],
  ],
  good_vibes: [
    ["Good vibes all night long", "Feel the joy in every song"],
    ["We glow when we're together", "Sunshine lasts forever"],
  ],
  street: [
    ["Speak the truth out loud", "They can't mute the block"],
    ["Real cost, real pain", "Still standing on the block"],
  ],
};

const CHORUS_FR: ThemeLinePools = {
  love: [
    ["Reste avec moi ce soir", "Avec toi je vais bien"],
    ["Nos cœurs battent à l'unisson", "Ça commence pour nous"],
  ],
  loss: [
    ["Tu es parti loin", "Les souvenirs restent"],
    ["Silence où tu étais", "Rien à retenir"],
  ],
  hustle: [
    ["Je grind jusqu'au bout", "Jamais je plie"],
    ["Du sol vers l'or", "L'histoire continue"],
  ],
  party: [
    ["Les mains en l'air ce soir", "On danse jusqu'au jour"],
    ["Monte le son plus fort", "On vit chaque accord"],
  ],
  heartbreak: [
    ["L'amour en poussière", "La confiance brisée"],
    ["Les larmes comme pluie", "Rien à sauver"],
  ],
  nostalgia: [
    ["Ramène-moi dans le temps", "Ces jours étaient si beaux"],
    ["Heure dorée encore", "J'aimerais rembobiner"],
  ],
  identity: [
    ["Voilà qui je suis", "Fini de me cacher"],
    ["Je me libère enfin", "Le vrai moi"],
  ],
  night: [
    ["La ville ne dort pas", "Secrets dans le noir"],
    ["Néon sur ma peau", "Minuit m'appartient"],
  ],
  good_vibes: [
    ["Bonnes ondes toute la nuit", "La joie dans chaque refrain"],
    ["On brille ensemble", "Le soleil dure toujours"],
  ],
  street: [
    ["Dis la vérité fort", "Ils peuvent pas taire le bloc"],
    ["Vrai prix, vraie douleur", "Toujours debout ici"],
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
  good_vibes: [
    ["Hands up, feel the joy", "Every worry destroyed"],
    ["Sunshine in my chest", "This day is the best"],
  ],
  street: [
    ["No filter on the truth", "Pressure on the youth"],
    ["Cold world, steady breath", "Bars cut like a blade"],
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
  good_vibes: [
    ["Les mains en l'air, joie", "Chaque souci s'efface"],
    ["Soleil dans ma poitrine", "Ce jour est le nôtre"],
  ],
  street: [
    ["Pas de filtre sur le vrai", "Pression sur la jeunesse"],
    ["Monde froid, souffle stable", "Les bars tranchent net"],
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
  good_vibes: [
    ["We made it through the week", "Dance like we are free"],
    ["Hold this golden light", "Everything feels right"],
  ],
  street: [
    ["Seen too much too young", "Still here, still strong"],
    ["They watch from far away", "We live it every day"],
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
  good_vibes: [
    ["On a survécu la semaine", "Danse comme on est libres"],
    ["Garde cette lumière dorée", "Tout semble aligné"],
  ],
  street: [
    ["Trop vu trop jeune", "Toujours là, debout"],
    ["Ils regardent de loin", "On vit ça chaque jour"],
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
  good_vibes: ["Keep the good vibes close", "Let the joy stay loud"],
  street: ["Truth echo in the block", "Don't forget the cost"],
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
  good_vibes: ["Garde les bonnes ondes", "La joie reste forte"],
  street: ["La vérité résonne", "N'oublie pas le prix"],
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

export function themeChorusLines(lang: "en" | "fr", theme: BankLyricsTheme, rng: () => number): string[] {
  return pickThemeLines(lang === "fr" ? CHORUS_FR : CHORUS_EN, theme, rng);
}

export function themeBridgeLines(lang: "en" | "fr", theme: BankLyricsTheme, rng: () => number): string[] {
  return pickThemeLines(lang === "fr" ? BRIDGE_FR : BRIDGE_EN, theme, rng);
}

export function themeOutroLines(lang: "en" | "fr", theme: BankLyricsTheme): string[] {
  const pool = lang === "fr" ? OUTRO_FR : OUTRO_EN;
  return pool[theme];
}
