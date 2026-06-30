/**
 * musicPromptFallback.ts — ProducerHit
 * Fallback 100% local, zéro API, zéro latence.
 *
 * Fonctionnement :
 *  1. Scanne les mots du prompt utilisateur
 *  2. Score chaque genre selon les mots-clés matchés
 *  3. Sélectionne le genre gagnant (ou aléatoire parmi les ex-aequo)
 *  4. Construit un caption ACE-Step enrichi + paroles structurées basiques
 *
 * Utilisé automatiquement si tous les providers API échouent.
 */

import type { AceStepPrompt } from './musicPromptEngine';

// ─── Base de données genre ────────────────────────────────────────────────────

interface GenreProfile {
  name: string;
  bpmRange: [number, number];
  keys: string[];
  captionTags: string[];
  /** Mots-clés (FR + EN) qui font scorer ce genre */
  keywords: string[];
  /** Templates de paroles par section */
  lyricTemplates: Record<string, string[]>;
}

const GENRE_PROFILES: GenreProfile[] = [
  {
    name: 'Hip-Hop / Trap',
    bpmRange: [90, 145],
    keys: ['F Minor', 'C Minor', 'G Minor', 'D Minor', 'A Minor'],
    captionTags: [
      'modern hip-hop', 'trap influence', 'punchy 808 bass', 'crisp trap hi-hats',
      'melodic hooks', 'confident male vocals', 'adlibs', 'atmospheric synths',
      'warm electric piano', 'cinematic transitions', 'radio-ready production',
      'wide stereo mix', 'punchy kick drum', 'premium commercial sound',
    ],
    keywords: [
      // lieux / culture urbaine
      'vegas', 'las vegas', 'club', 'nightclub', 'rue', 'street', 'hood', 'block', 'city',
      'downtown', 'trap', 'rap', 'hip-hop', 'hiphop', 'banger', 'drill',
      // lifestyle
      'money', 'argent', 'cash', 'rich', 'riche', 'gold', 'or', 'diamond', 'diamant',
      'flex', 'swag', 'drip', 'ice', 'chain', 'chaîne', 'grind', 'hustle',
      // fête / soirée
      'party', 'fête', 'soirée', 'nuit', 'night', 'danse', 'dance', 'crowd',
      // vacances luxe
      'vacances', 'vacation', 'holiday', 'summer', 'été', 'plage', 'beach', 'pool',
      'piscine', 'soleil', 'sun', 'yacht', 'vip',
      // émotions rap
      'swagger', 'boss', 'king', 'reine', 'queen', 'winner', 'champion',
    ],
    lyricTemplates: {
      '[Intro]': [
        'Yeah, {theme}, let\'s go',
        'Uh, {theme} vibes, pour la nuit',
      ],
      '[Verse 1]': [
        'On roule dans {theme}, les lumières brillent fort',
        'Chaque nuit comme la dernière, on vit sans remords',
        'Les billets volent haut, le monde à nos pieds',
        'On a travaillé dur pour arriver à ce palier',
      ],
      '[Pre-Chorus]': [
        'Et maintenant c\'est notre moment',
        'On profite de chaque instant',
      ],
      '[Chorus]': [
        '{theme} dans le sang, on est au sommet',
        'Rien peut nous arrêter, le flow est parfait',
        'La nuit nous appartient, la ville nous salue',
        'On a tout mérité, personne nous déçu',
      ],
      '[Verse 2]': [
        'Les haters regardent de loin, on s\'en fout vraiment',
        'Notre story c\'est du cinéma, du pur divertissement',
        'Chaque bar qu\'on pose, c\'est une page d\'histoire',
        'On construit notre empire, jour après jour, notre gloire',
      ],
      '[Bridge]': [
        'Souviens-toi d\'où on vient',
        'Tout ce chemin parcouru',
        'Maintenant on tient le frein',
        'De la vie qu\'on a choisie',
      ],
      '[Outro]': [
        'Yeah, {theme}, c\'est notre terrain',
        'On reste debout jusqu\'à demain matin',
      ],
    },
  },

  {
    name: 'R&B / Soul',
    bpmRange: [70, 95],
    keys: ['D Major', 'G Major', 'A Major', 'E Minor', 'B Minor'],
    captionTags: [
      'smooth R&B', 'soulful vocals', 'warm bass groove', 'live-feel drums',
      'vintage electric piano', 'lush string pads', 'falsetto harmonies',
      'intimate production', 'bedroom pop elements', 'velvety mix',
      'emotional depth', 'neo-soul influence', 'silky textures',
    ],
    keywords: [
      'amour', 'love', 'cœur', 'heart', 'soul', 'âme', 'sentiment', 'feeling',
      'romance', 'romantique', 'romantic', 'couple', 'relation', 'relationship',
      'nuit', 'night', 'lune', 'moon', 'étoile', 'star', 'ciel', 'sky',
      'tendresse', 'tender', 'doux', 'soft', 'smooth', 'sensuel', 'sensual',
      'manque', 'miss', 'attendre', 'wait', 'espoir', 'hope', 'rêve', 'dream',
      'corps', 'body', 'peau', 'skin', 'baiser', 'kiss', 'toucher', 'touch',
      'r&b', 'rnb', 'soul', 'blues',
    ],
    lyricTemplates: {
      '[Intro]': [
        'Mmh... {theme}...',
        'Baby, chaque fois que tu es là...',
      ],
      '[Verse 1]': [
        'Quand tu es près de moi le monde s\'efface',
        'Ton sourire illumine chaque espace',
        'Je cherche les mots mais ils s\'envolent',
        'Tu es ma mélodie, ma note qui contrôle',
      ],
      '[Pre-Chorus]': [
        'Et je sais que c\'est vrai',
        'Ce que je ressens pour toi ne partira jamais',
      ],
      '[Chorus]': [
        'Tu es {theme} dans ma vie',
        'La raison pour laquelle je respire la nuit',
        'Sans toi le silence est trop grand',
        'Reste avec moi jusqu\'à la fin du temps',
      ],
      '[Verse 2]': [
        'Nos souvenirs tissés comme une toile de soie',
        'Chaque moment avec toi a changé ma voie',
        'Je me perds dans tes yeux comme dans un rêve',
        'Mon cœur bat fort dès que le jour se lève',
      ],
      '[Bridge]': [
        'Dis-moi que tu resteras',
        'Promets-moi que ça durera',
        'Je t\'offre tout ce que j\'ai',
        'Mon âme, ma voix, ma foi',
      ],
      '[Outro]': [
        'Mmh, {theme}...',
        'Pour toi, toujours pour toi...',
      ],
    },
  },

  {
    name: 'Pop',
    bpmRange: [100, 128],
    keys: ['C Major', 'G Major', 'A Major', 'D Major', 'E Major'],
    captionTags: [
      'upbeat pop', 'polished production', 'catchy topline melody', 'vocal harmonies',
      'punchy pop drums', 'bright synth pads', 'infectious chorus', 'radio anthem',
      'euphoric energy', 'wide mix', 'summer pop feel', 'commercial hook',
      'sparkly production', 'uplifting vibe', 'feel-good energy',
    ],
    keywords: [
      'pop', 'été', 'summer', 'bonheur', 'happy', 'heureux', 'joie', 'joy',
      'fun', 'amusant', 'danser', 'dance', 'sourire', 'smile', 'soleil', 'sun',
      'vacances', 'vacation', 'plage', 'beach', 'fête', 'party', 'célébrer',
      'celebrate', 'liberté', 'freedom', 'insouciant', 'carefree', 'léger', 'light',
      'positif', 'positive', 'énergie', 'energy', 'anthem', 'chant', 'sing',
      'radio', 'hit', 'catchy', 'bonne humeur',
    ],
    lyricTemplates: {
      '[Intro]': [
        'Hey, {theme}!',
        'Feel the energy tonight...',
      ],
      '[Verse 1]': [
        'On s\'envole vers {theme} sans regarder derrière',
        'Le vent dans les cheveux, la vie est légère',
        'Chaque seconde compte, chaque instant est précieux',
        'On danse sous les étoiles, les bras vers les cieux',
      ],
      '[Pre-Chorus]': [
        'Et on oublie tout le reste',
        'Ce moment est céleste',
      ],
      '[Chorus]': [
        '{theme} dans le cœur, on s\'envole haut',
        'La vie est belle quand on la vit à fond',
        'Lève les mains, crie avec moi ce soir',
        'Rien ne peut arrêter notre joie de vivre',
      ],
      '[Verse 2]': [
        'Les problèmes d\'hier semblent si loin maintenant',
        'On vit dans l\'instant, pleinement, vraiment',
        'Ta main dans la mienne, on court vers demain',
        'Ensemble on est forts, ensemble c\'est divin',
      ],
      '[Bridge]': [
        'Oh oh oh, laisse-toi aller',
        'Oh oh oh, il faut profiter',
        'Ce moment est à nous',
        'Rendons-le inoubliable',
      ],
      '[Outro]': [
        'Oh, {theme}...',
        'Pour toujours dans nos cœurs',
      ],
    },
  },

  {
    name: 'EDM / House',
    bpmRange: [124, 135],
    keys: ['A Minor', 'C Major', 'F Major', 'G Major', 'D Minor'],
    captionTags: [
      'progressive house', 'festival EDM', 'epic drop', 'massive build-up',
      'euphoric risers', 'sidechain compression', 'supersaw synth leads',
      'punchy kick drum', 'atmospheric breakdown', 'crowd energy',
      'wide stereo field', 'club-ready mix', 'emotional melody', 'anthemic drop',
    ],
    keywords: [
      'edm', 'house', 'techno', 'electronic', 'électronique', 'rave', 'festival',
      'dj', 'club', 'dance', 'danse', 'drop', 'bass', 'basse', 'beat',
      'nuit', 'night', 'dancefloor', 'piste', 'euphorie', 'euphoria',
      'energie', 'energy', 'explosion', 'explode', 'trance', 'ibiza',
      'underground', 'groove', 'synth', 'électro', 'electro',
    ],
    lyricTemplates: {
      '[Intro]': [
        'Feel it... {theme}...',
        'Let the music take control...',
      ],
      '[Verse 1]': [
        'Le son nous envahit, on perd la notion du temps',
        'La basse vibre fort, le crowd est frénétique',
        'Lumières stroboscopiques, le monde devient magique',
        'Chaque note nous transporte vers un état mystique',
      ],
      '[Build-Up]': [
        'Monte, monte, monte...',
        'Sens l\'énergie monter en toi',
        'Le drop arrive, prépare-toi',
        'Tout s\'arrête... puis ça explose',
      ],
      '[Chorus/Drop]': [
        '{theme} nous transporte cette nuit',
        'La musique est notre seule vérité',
        'On danse jusqu\'à l\'aube ensemble',
        'Le drop nous libère, corps et âme réunis',
      ],
      '[Verse 2]': [
        'Le DJ maître du temps et de l\'espace',
        'Chaque track nous emmène dans un autre place',
        'Le public en transe, mille corps qui bougent à l\'unisson',
        'Cette nuit restera gravée comme une belle chanson',
      ],
      '[Bridge]': [
        'Laisse la musique te guider',
        'Oublie tout et laisse-toi porter',
        'Cette nuit ne finira jamais',
        'Dans ce temple de son on est libres à jamais',
      ],
      '[Outro]': [
        'The night is ours... {theme}...',
        'Until next time...',
      ],
    },
  },

  {
    name: 'Lo-fi / Chill',
    bpmRange: [70, 88],
    keys: ['D Major', 'G Major', 'C Major', 'A Minor', 'E Minor'],
    captionTags: [
      'lo-fi hip hop', 'chill beats', 'vinyl crackle texture', 'dusty tape saturation',
      'warm Fender Rhodes piano', 'soft brush drums', 'mellow bass', 'rain ambiance',
      'nostalgic mood', 'study music vibe', 'relaxed energy', 'bedroom producer',
      'hazy reverb', 'chopped samples', 'introspective feel',
    ],
    keywords: [
      'lofi', 'lo-fi', 'chill', 'relax', 'calme', 'calm', 'détente', 'relaxation',
      'étude', 'study', 'travailler', 'work', 'café', 'coffee', 'pluie', 'rain',
      'automne', 'autumn', 'fall', 'nostalgie', 'nostalgia', 'souvenir', 'memory',
      'nuit', 'night', 'seul', 'alone', 'solitude', 'introspection', 'réflexion',
      'rêverie', 'daydream', 'doux', 'soft', 'ambient', 'ambiant',
    ],
    lyricTemplates: {
      '[Intro]': [
        'Mmh... {theme}...',
        'La pluie tombe doucement sur la fenêtre...',
      ],
      '[Verse 1]': [
        'La pluie dessine des chemins sur ma fenêtre froide',
        'Mes pensées voyagent loin, mon esprit se déploie',
        'Une tasse de café, la nuit est encore longue',
        'Le temps s\'étire doucement, ma mémoire plonge',
      ],
      '[Chorus]': [
        '{theme} dans les pensées qui s\'évadent',
        'Le temps suspendu dans cette douce ballade',
        'Rien ne presse, le monde peut attendre',
        'Je me perds dans ce moment à travers',
      ],
      '[Verse 2]': [
        'Les vieilles photos jaunies racontent des histoires',
        'Des visages souriants, des fragments de mémoire',
        'Le vinyle tourne encore, cette mélodie m\'habite',
        'Dans ce cocon de sons le temps bascule vite',
      ],
      '[Bridge]': [
        'Reste encore un peu dans ce silence',
        'Laisse le beat te bercer doucement',
        'Chaque note est une évidence',
        'Que la beauté se cache dans les petits moments',
      ],
      '[Outro]': [
        'Mmh... {theme}...',
        'La nuit continue son chemin...',
      ],
    },
  },

  {
    name: 'Afrobeats / Dancehall',
    bpmRange: [95, 115],
    keys: ['C Major', 'F Major', 'G Major', 'A Major', 'D Major'],
    captionTags: [
      'afrobeats', 'afropop', 'tropical groove', 'percussive rhythm', 'talking drum',
      'steel pan melody', 'warm bass guitar', 'call and response vocals',
      'celebratory energy', 'island vibes', 'multilingual wordplay',
      'dancehall influence', 'summer anthem', 'vibrant mix', 'euphoric feel',
    ],
    keywords: [
      'afrobeats', 'afro', 'africain', 'african', 'dancehall', 'reggae', 'tropical',
      'caraïbes', 'caribbean', 'île', 'island', 'soleil', 'sun', 'chaud', 'hot',
      'warm', 'danser', 'dance', 'fête', 'party', 'célébrer', 'celebrate',
      'joie', 'joy', 'amour', 'love', 'together', 'ensemble', 'vibes',
      'groove', 'rhythm', 'rythme', 'beat', 'soca', 'calypso',
    ],
    lyricTemplates: {
      '[Intro]': [
        'Hey! {theme}, make some noise!',
        'Aye, on est là pour la fête...',
      ],
      '[Verse 1]': [
        'Under {theme} sun, we move together',
        'Le rythme dans nos âmes, peu importe le weather',
        'Hips don\'t lie when the groove is right',
        'On célèbre la vie chaque jour et chaque nuit',
      ],
      '[Pre-Chorus]': [
        'Everybody put your hands up',
        'On est ensemble, c\'est tout ce qu\'il nous faut',
      ],
      '[Chorus]': [
        '{theme} making us feel alive tonight',
        'Le rythme tribal qui unit toutes nos vies',
        'Dance with me, danse avec moi',
        'Ce moment est à nous, à toi et à moi',
      ],
      '[Verse 2]': [
        'Le tamtam parle, nos corps répondent',
        'From Lagos to Paris, the rhythm abounds',
        'Chaque culture mélangée dans ce son pur',
        'One world, one vibe, aucune fracture',
      ],
      '[Bridge]': [
        'Oh ye ye, together we rise',
        'Oh ye ye, sous les mêmes skies',
        'La musique unit ce que les frontières divisent',
        'On danse notre liberté, c\'est ça qui nous baptise',
      ],
      '[Outro]': [
        'Aye, {theme}...',
        'We go again... one more time...',
      ],
    },
  },

  {
    name: 'Rock',
    bpmRange: [120, 160],
    keys: ['E Minor', 'A Minor', 'D Minor', 'G Major', 'B Minor'],
    captionTags: [
      'alternative rock', 'electric guitar riff', 'overdriven distortion',
      'live drum kit', 'punchy snare', 'driving bass guitar', 'raw energy',
      'anthemic chorus', 'dynamic verse', 'stadium sound', 'powerful vocals',
      'guitar solo', 'layered guitars', 'massive wall of sound',
    ],
    keywords: [
      'rock', 'guitare', 'guitar', 'metal', 'punk', 'grunge', 'alternative',
      'rebelle', 'rebel', 'liberté', 'freedom', 'rage', 'colère', 'anger',
      'puissance', 'power', 'force', 'strong', 'fort', 'crier', 'scream',
      'résister', 'resist', 'fight', 'battle', 'guerre', 'war', 'survie',
      'survive', 'briser', 'break', 'free', 'libre', 'indépendance',
    ],
    lyricTemplates: {
      '[Intro]': [
        'One, two, three, four!',
        '{theme}... Here we go!',
      ],
      '[Verse 1]': [
        'On brise les chaînes qui nous retiennent au sol',
        'Le son des guitares nous donne des ailes, on s\'envole',
        'Rien ne nous arrête, on est nés pour résister',
        'La nuit est jeune, le volume à fond, on va tout casser',
      ],
      '[Pre-Chorus]': [
        'Et on crie ensemble',
        'Ce soir tout tremble',
      ],
      '[Chorus]': [
        '{theme} dans le sang, on ne s\'arrête jamais',
        'La distorsion dans les veines, c\'est notre vérité',
        'Lève le poing, crie ton nom dans la nuit',
        'Le rock est vivant, et cette nuit il rugit',
      ],
      '[Verse 2]': [
        'Les scènes brûlées, les amps poussés au maximum',
        'Chaque riff est une prière, chaque solo un opéum',
        'On joue pour les oubliés, pour ceux qui n\'ont pas de voix',
        'La musique est notre arme, notre seule et unique loi',
      ],
      '[Bridge]': [
        'Solo de guitare...',
        'Ce moment de grâce électrique',
        'Où tout disparaît sauf le son',
        'Et on existe enfin pour de bon',
      ],
      '[Outro]': [
        '{theme}! Yeah!',
        'Rock never dies...',
      ],
    },
  },
];

// ─── Détection de genre par scoring ──────────────────────────────────────────

interface GenreScore {
  profile: GenreProfile;
  score: number;
  matchedKeywords: string[];
}

function detectGenre(userIdea: string): GenreScore {
  const lower = userIdea.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // supprime les accents pour matcher

  const scores: GenreScore[] = GENRE_PROFILES.map((profile) => {
    const matchedKeywords: string[] = [];
    let score = 0;

    for (const kw of profile.keywords) {
      const kwNorm = kw.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      if (lower.includes(kwNorm)) {
        matchedKeywords.push(kw);
        // Les mots plus longs comptent plus (évite les faux positifs sur 2 lettres)
        score += Math.max(1, kwNorm.length / 4);
      }
    }

    return { profile, score, matchedKeywords };
  });

  // Trie par score décroissant
  scores.sort((a, b) => b.score - a.score);

  // Si ex-aequo dans le top, choisit aléatoirement parmi les meilleurs
  const topScore = scores[0].score;
  if (topScore === 0) {
    // Aucun mot-clé trouvé → genre aléatoire complet
    const random = GENRE_PROFILES[Math.floor(Math.random() * GENRE_PROFILES.length)];
    return { profile: random, score: 0, matchedKeywords: [] };
  }

  const topTied = scores.filter(s => s.score >= topScore * 0.85);
  const winner = topTied[Math.floor(Math.random() * topTied.length)];
  return winner;
}

// ─── Construction des paroles ─────────────────────────────────────────────────

function buildLyrics(
  profile: GenreProfile,
  theme: string
): string {
  const sections = Object.entries(profile.lyricTemplates);
  const lines: string[] = [];

  for (const [sectionName, templates] of sections) {
    lines.push(sectionName);
    for (const line of templates) {
      lines.push(line.replace(/\{theme\}/g, theme));
    }
    lines.push('');
  }

  return lines.join('\n').trim();
}

// ─── Extraction du thème principal ───────────────────────────────────────────

function extractTheme(userIdea: string): string {
  // Supprime les mots génériques et garde le sujet principal
  const stopWords = [
    'une', 'un', 'des', 'les', 'la', 'le', 'de', 'du', 'sur', 'pour', 'avec',
    'a', 'an', 'the', 'on', 'about', 'for', 'with', 'in', 'at',
    'chanson', 'song', 'musique', 'music', 'track', 'beat',
  ];

  const words = userIdea
    .toLowerCase()
    .split(/\s+/)
    .filter(w => !stopWords.includes(w) && w.length > 2);

  // Préfère les noms propres ou les groupes de mots significatifs
  return words.slice(0, 3).join(' ') || userIdea.slice(0, 30);
}

// ─── Génération BPM aléatoire dans la plage du genre ─────────────────────────

function randomBpm(range: [number, number]): number {
  return Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];
}

// ─── Détection de langue ──────────────────────────────────────────────────────

function detectLanguage(userIdea: string): string {
  const lower = userIdea.toLowerCase();

  const frenchMarkers = [
    'une', 'sur', 'pour', 'avec', 'des', 'les', 'dans', 'vacances',
    'chanson', 'musique', 'nuit', 'amour', 'fête',
  ];
  const frCount = frenchMarkers.filter(m => lower.includes(m)).length;

  return frCount >= 2 ? 'French' : 'English';
}

// ─── Fonction principale export ───────────────────────────────────────────────

export function buildFallbackPrompt(
  userIdea: string,
  duration = 180
): AceStepPrompt {
  const { profile, matchedKeywords } = detectGenre(userIdea);
  const theme = extractTheme(userIdea);
  const language = detectLanguage(userIdea);
  const bpm = randomBpm(profile.bpmRange);
  const key = profile.keys[Math.floor(Math.random() * profile.keys.length)];

  // Caption enrichi = tags genre + thème + mots-clés matchés
  const extraTags = matchedKeywords.length > 0
    ? matchedKeywords.slice(0, 5).join(', ')
    : theme;

  const caption = [
    ...profile.captionTags,
    extraTags,
    language === 'French' ? 'French lyrics' : 'English lyrics',
    `${bpm} BPM`, key,
  ].join(', ');

  const lyrics = buildLyrics(profile, theme);

  return {
    caption,
    lyrics,
    bpm,
    key,
    duration,
    language,
    _provider: `Fallback (${profile.name})`,
  };
}

// ─── Export du nom de genre détecté (utile pour logs/debug) ──────────────────
export { detectGenre, GENRE_PROFILES };
