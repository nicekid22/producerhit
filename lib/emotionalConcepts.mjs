/**
 * Emotional Concepts Bank — ProducerHit
 * 
 * 8 concepts émotionnels pour contenu viral UGC.
 * Chaque concept inclut : hook, angle, public cible, Seedance prompts (2-3 scènes, 30s max).
 * 
 * Usage : viral-content-run, social posting, Seedance video generation.
 * Ne pas éditer à la main sans passer par le pipeline.
 */

export const EMOTIONAL_CONCEPTS = [
  {
    id: "demande_en_mariage",
    title: "La Chanson de Demande en Mariage",
    emoji: "🎤",
    hook: "Elle ne savait pas que la chanson était pour elle.",
    angle: "Un homme compose en secret une chanson personnalisée avec le prénom de sa copine, leurs souvenirs, et la joue au moment de la demande.",
    whyItWorks: "Tout le monde a vu une demande en mariage — mais une chanson unique, faite pour cette personne précise, c'est un niveau d'intentionnalité que les gens n'imaginent même pas accessible. Vend l'outil comme \"outil d'expression d'amour\", pas juste \"outil de prod\".",
    targetAudience: "Couples, 25-40 ans, pas necessarily musiciens",
    format: "UGC testominial / emotional reveal",
    seedance: {
      scene1: {
        timing: "0-8s",
        prompt: "A nervous young man sits alone in his bedroom late at night, laptop open, typing quietly on a music production website. Soft warm lamp light, focused concentrated expression, occasionally glancing at a photo of a couple on his desk. Handheld intimate camera feel, warm color grading."
      },
      scene2: {
        timing: "8-18s",
        prompt: "Close-up on his hands finishing the track, headphones on, a satisfied emotional smile as the beat plays. He closes the laptop gently, determined look on his face, stands up. Cut to him walking outside at golden hour, holding a small ring box, phone with the finished song ready to play."
      },
      scene3: {
        timing: "18-30s",
        prompt: "Wide shot at a scenic outdoor location (park or rooftop at sunset), he kneels down, phone playing the custom song softly in the background, a woman's hand covers her mouth in surprised joy. Warm cinematic golden hour lighting, soft depth of field, emotional authentic moment, slight camera shake for realism."
      },
      style: "cinematic UGC, warm golden tones, shallow depth of field, handheld authentic camera movement, emotional documentary feel, no text overlays needed, natural lighting throughout."
    },
    lyrics: "[verse]\nJ'ai pris ton prénom dans le silence\nEt je l'ai mis sur un tempo lent\nUn souvenir qu'on n'avait pas encore\nTransformé en note, lentement\n\n[pre-chorus]\nJ'aurais pu le dire\nJ'ai préféré le chanter\nPour que tu l'entendes comme il faut\n\n[chorus]\nEt cette chanson tu ne l'entendras jamais\nTrop beau pour être cassé\nTrop tard pour être vrai\nJe l'ai mise dans la tombe de nous deux"
  },
  {
    id: "berceuse_bebé",
    title: "La Berceuse pour le Bébé Qui Arrive",
    emoji: "👶",
    hook: "Elle a composé cette chanson avant même qu'il n'existe.",
    angle: "Une future maman compose une berceuse originale pendant la grossesse — on la voit la faire écouter à son ventre, puis flash-forward où elle la chante au bébé né.",
    whyItWorks: "Intergénérationnel, parle à un public large (pas que les 18-25 \"beatmakers\"), et le concept \"une chanson qui existe avant même que la personne existe\" est un hook émotionnel très fort — presque un objet de transmission familiale.",
    targetAudience: "Futurs parents, familles, 25-45 ans",
    format: "UGC / emotional timeline",
    seedance: {
      scene1: {
        timing: "0-10s",
        prompt: "A pregnant woman sits in a softly lit nursery room, pastel colors, gentle daylight through curtains, humming quietly while typing on a laptop with a music production interface visible. She places one hand on her belly, smiling softly, headphones resting around her neck."
      },
      scene2: {
        timing: "10-20s",
        prompt: "Time transition — soft fade or match cut — to the same room months later, now with a crib and baby items visible. She sits in a rocking chair, holding a newborn baby, phone propped nearby playing the same soft melody. The baby calms, eyes slowly closing."
      },
      scene3: {
        timing: "20-30s",
        prompt: "Close-up on the sleeping baby's peaceful face, mother gently kissing its forehead, soft warm lighting, the melody continuing softly in the background. Camera slowly pulls back to a wide, tender shot of the nursery."
      },
      style: "soft pastel color palette, warm intimate lighting, gentle slow camera movements, emotional and tender documentary feel, shallow depth of field, no fast cuts, natural authentic UGC aesthetic."
    },
    lyrics: "[verse]\nPetit être, tu n'es pas encore là\nMais j'ai déjà ta voix dans ma tête\nUn mélodie que j'ai construite pour toi\nAvant même que tu ne t'arrêtes\n\n[pre-chorus]\nTu vas entendre cette chanson\nDans le noir, quand le monde se tait\nC'est mon premier cadeau, mon premier don\n\n[chorus]\nBerce-toi sur cette note tendre\nAvant que le monde ne te prenne\nJe t'ai écrit une chanson\nAvant que tu ne commences à chanter"
  },
  {
    id: "chanson_hommage",
    title: "La Chanson Hommage",
    emoji: "🕊️",
    hook: "Il a gardé le son de sa voix sur le répondeur. Il l'a mis dans le beat.",
    angle: "Quelqu'un compose une chanson en mémoire d'un proche décédé — grand-père, ami, animal — avec des sons qui rappellent cette personne.",
    whyItWorks: "Le concept le plus fort émotionnellement — la musique comme deuil actif. DOIT rester authentique, presque documentaire, sinon ça sonne faux et peut choquer. Traité avec sobriété, jamais de ton \"vendeur\".",
    targetAudience: "Adultes 25-55, touches un public qui ne se considère pas comme musicien",
    format: "Documentary / tribute / sobriety",
    warnings: "NE PAS utiliser de ton commercial. Contenu authentique, pas de CTA agressif. Respect.",
    seedance: {
      scene1: {
        timing: "0-10s",
        prompt: "A person sits at a desk looking at an old phone, scrolling to a voicemail. Close-up on their face as they press play, listening to a voice message from someone who has passed away. Soft melancholy lighting, intimate handheld camera, warm but somber tones."
      },
      scene2: {
        timing: "10-20s",
        prompt: "Same person now working on a laptop with a music production interface, headphones on, occasionally pausing to listen to the voicemail again, transferring sounds from the old phone to the beat. Emotional focused expression, tears forming but determined."
      },
      scene3: {
        timing: "20-30s",
        prompt: "Wide shot at a meaningful location — a park bench, a kitchen table, a garden — the person sits alone playing the finished song on their phone, looking at the sky or a photo, peaceful acceptance mixed with grief. Natural lighting, slow camera movement, documentary realism."
      },
      style: "documentary realism, warm melancholy color grading, natural lighting, slow steady camera movements, no fast cuts, no flashy effects, respectful and intimate tone throughout."
    },
    lyrics: "[verse]\nTu n'es plus là pour entendre\nMais ta voix vit encore dans mes notes\nUn refrain que je t'offre en silence\nUn écho qui ne s'arrête pas\n\n[pre-chorus]\nJ'ai gardé ton rire dans le répondeur\nJ'ai mis ton souffle dans la mélodie\nC'est ma façon de ne pas te perdre\n\n[chorus]\nEt cette chanson tu ne l'entendras jamais\nTrop beau pour être cassé\nTrop tard pour être vrai\nJe l'ai mise dans la tombe de nous deux"
  },
  {
    id: "hymne_promo",
    title: "L'Hymne de Promo",
    emoji: "🎓",
    hook: "Ils allaient tous s'en souvenir. Ils ont voulu la chanson pour être sûrs.",
    angle: "Un groupe d'amis en dernière année crée LEUR chanson de promo ensemble — celle qu'ils vont tous associer à cette période pour toujours.",
    whyItWorks: "Nostalgie anticipée — les gens savent en le vivant que \"ce moment, on va s'en souvenir\". Se prête à du contenu générationnel très partageable (chaque promo veut SA chanson).",
    targetAudience: "Lycéens, étudiants, 16-22 ans",
    format: "UGC group / nostalgic / celebratory",
    seedance: {
      scene1: {
        timing: "0-10s",
        prompt: "A group of friends huddled around a laptop in a dorm room or classroom, laughing and arguing about what the song should sound like, one person typing on a music creation app while others suggest ideas. Energetic youthful atmosphere, warm afternoon light."
      },
      scene2: {
        timing: "10-20s",
        prompt: "Quick cuts montage: the group in different school locations (hallway, gym, courtyard) each recording their part or reacting to the beat, genuine laughter and camaraderie. Energetic handheld camera movement, bright natural lighting."
      },
      scene3: {
        timing: "20-30s",
        prompt: "Graduation scene — the group in caps and gowns, one person holds up a phone playing the finished song, they all react with joy and nostalgia, some wiping tears, group hug. Golden hour lighting, celebratory but emotional atmosphere."
      },
      style: "bright youthful energy, natural school/college lighting, handheld dynamic camera, quick cuts for energy, warm color grading, authentic friendship reactions."
    },
    lyrics: "[verse]\nOn s'est rencontrés sans savoir\nQue c'était le début de tout\nDes corridors, des rires, deserreurs\nOn n'aurait pas pu savoir\n\n[pre-chorus]\nCette année on va s'en souvenir\nCette chanson on va la garder\nPour ne jamais oublier\n\n[chorus]\nC'est notre hymne, notre histoire\nAvant que le temps ne nous sépare\nÉcris ton nom sur ma mélodie\nPour que cette nuit ne finisse pas"
  },
  {
    id: "chanson_motivation",
    title: "La Chanson de Motivation Personnelle",
    emoji: "💪",
    hook: "Avant chaque combat, il joue cette chanson. Personne ne sait qu'il l'a faite lui-même.",
    angle: "Un athlète amateur, quelqu'un qui passe un entretien, une épreuve difficile — se crée SA chanson d'entrée, celle qui le fait se sentir invincible avant le moment clé.",
    whyItWorks: "Connecte à l'usage réel que les gens font déjà de la musique (playlist de motivation) mais pousse plus loin — \"et si cette chanson était faite POUR toi, sur mesure\".",
    targetAudience: "Sportifs, étudiants, professionnels, 18-40 ans",
    format: "UGC testimonial / empowerment",
    seedance: {
      scene1: {
        timing: "0-10s",
        prompt: "A young athlete sits in a locker room before a competition, headphones on, eyes closed, listening to something on their phone. Close-up on their focused determined face, deep breathing, psyching themselves up. Dramatic low lighting, tension building."
      },
      scene2: {
        timing: "10-20s",
        prompt: "Flashback montage: same person the night before, working on a laptop creating a custom beat, testing different sounds, nodding with satisfaction. Warm lamp light, intimate creative process, genuine emotion."
      },
      scene3: {
        timing: "20-30s",
        prompt: "Back to present — the athlete stands up, walks out of the tunnel into bright light of the arena/field/court, phone in hand, the custom song playing. Slow motion, confident stride, ready for battle. Dramatic lighting contrast, powerful cinematic feel."
      },
      style: "dramatic sports cinematography, contrasting lighting (dark tunnel to bright arena), slow motion for impact, handheld intimate close-ups mixed with wide shots, motivational energy."
    },
    lyrics: "[verse]\nIls ne savent pas ce que j'ai dans les écouteurs\nUne chanson que j'ai faite pour moi\nPersonne ne l'entend, personne ne la connaît\nMais elle me rend invincible\n\n[pre-chorus]\nQuand le doute arrive\nJe joue cette chanson\nEt le monde s'arrête\n\n[chorus]\nC'est mon hymne, c'est mon bouclier\nC'est la chanson que j'ai composé\nPersonne ne peut me l'enlever\nC'est fait pour moi, c'est fait pour gagner"
  },
  {
    id: "chanson_rupture",
    title: "La Chanson de Rupture Libératrice",
    emoji: "💔",
    hook: "Elle pensait que j'allais pleurer. J'ai fait un beat à la place.",
    angle: "Quelqu'un transforme sa colère/tristesse en beat énergique et libérateur plutôt qu'une ballade triste — twist inattendu, ton confiant.",
    whyItWorks: "Casse le cliché de la chanson de rupture larmoyante, tape dans l'émotion \"empowerment\" très partagée sur TikTok. Le twist émotionnel crée du partage.",
    targetAudience: "Jeunes adultes, 18-30 ans, public TikTok naturel",
    format: "UGC / empowerment / twist émotionnel",
    seedance: {
      scene1: {
        timing: "0-8s",
        prompt: "A person sits alone on a couch looking at their phone, reading a breakup message, devastated expression. They put the phone down, stare at the ceiling, then something shifts in their eyes — determination replaces sadness. Moody indoor lighting."
      },
      scene2: {
        timing: "8-18s",
        prompt: "Same person now at a laptop, creating an energetic beat, head bobbing, getting into the zone. Quick cuts between their hands on the keyboard, their face showing growing confidence, the music building. Warm creative lighting, dynamic camera movement."
      },
      scene3: {
        timing: "18-30s",
        prompt: "The person dancing alone in their room to their own creation, free and unselfconscious, smiling, empowered. Final shot: they pick up their phone, type a message, then delete it — choosing themselves instead. Bright uplifting lighting, freedom energy."
      },
      style: "transformation arc, moody to bright lighting shift, dynamic camera movement matching energy, authentic empowerment, no text needed — the emotion tells the story."
    },
    lyrics: "[verse]\nTu pensais que j'allais m'effondrer\nM'asseoir dans le coin et pleurer\nMais j'ai ouvert mon logiciel\nEt j'ai transformé ta douleur\n\n[pre-chorus]\nJe ne suis plus celui qui attend\nJe suis celui qui crée\nTa perte est mon meilleur beat\n\n[chorus]\nEt cette chanson tu ne l'entendras jamais\nTrop beau pour être cassé\nTrop tard pour être vrai\nJe l'ai mise dans la tombe de nous deux"
  },
  {
    id: "chanson_animal",
    title: "La Chanson pour le Chien/Chat",
    emoji: "🐾",
    hook: "Mon chien mérite plus qu'une playlist. Il mérite sa propre chanson.",
    angle: "Quelqu'un fait une chanson dédiée à son animal de compagnie, presque en mode blague affectueuse — contenu très léger, humoristique, ultra partageable en famille.",
    whyItWorks: "Contenu \"safe et fun\" — facile à faire consommer en masse, bon contraste après un contenu plus lourd. Très partageable car tout le monde a un animal ou connaît quelqu'un qui en a un.",
    targetAudience: "Propriétaires d'animaux, familles, tous âges",
    format: "UGC humoristique / feel-good / shareable",
    seedance: {
      scene1: {
        timing: "0-10s",
        prompt: "A person sitting on the floor with their dog/cat nearby, laptop open, laughing while creating a song, looking at their pet for inspiration, the pet looking back confused. Bright warm home lighting, cozy atmosphere."
      },
      scene2: {
        timing: "10-20s",
        prompt: "The person playing the finished song on their phone, the dog tilting its head or the cat looking unimpressed, the person laughing and trying to get the pet to react. Genuine humorous pet interaction, natural home setting."
      },
      scene3: {
        timing: "20-30s",
        prompt: "Montage of the song being played in different settings — the pet sleeping through it, the pet howling along, the pet ignoring it completely. End with the person shrugging at the camera with a smile. Fun upbeat energy, natural lighting."
      },
      style: "bright warm home lighting, casual authentic feel, quick cuts for humor, genuine pet reactions, lighthearted energy throughout, no fancy effects needed."
    },
    lyrics: "[verse]\nTu dors 16 heures par jour\nTu manges mes chaussures le soir\nTu aboies quand le facteur arrive\nMais tu es le meilleur ami que j'ai\n\n[pre-chorus]\nJ'aurais pu t'acheter un jouet\nMais non, j'ai fait ta chanson\nPour que le monde sache\n\n[chorus]\nC'est la chanson du chien royal\nLe chat qui règne sur le canapé\nLe meilleur morceau de l'année\nPour celui qui me fait le plus rire"
  },
  {
    id: "chanson_anniversaire_parent",
    title: "La Chanson d'Anniversaire pour un Parent",
    emoji: "🎂",
    hook: "Elle pensait que c'était un gâteau. C'était une chanson.",
    angle: "Un enfant crée une chanson d'anniversaire personnalisée pour un parent qui a tout donné — surprise filmée au moment où on lui fait écouter.",
    whyItWorks: "Format \"surprise émotionnelle filmée\" qui marche très bien en UGC/testimonial, proche du contenu \"reaction\" qui cartonne sur les réseaux. Touchant sans être larmoyant.",
    targetAudience: "Jeunes adultes, familles, 18-35 ans",
    format: "UGC surprise / family emotional / reaction",
    seedance: {
      scene1: {
        timing: "0-8s",
        prompt: "A young adult at their desk, working on a laptop, emotional focused expression, looking at old family photos pinned on the wall. Warm afternoon light through window, intimate handheld camera feel."
      },
      scene2: {
        timing: "8-18s",
        prompt: "Cut to a small family gathering in a cozy living room, birthday cake with candles on table. The young adult holds up their phone, nervous but excited, about to press play. Close-up on their finger tapping the screen."
      },
      scene3: {
        timing: "18-30s",
        prompt: "The custom song begins playing. Close-up on the parent's face — surprise turning into tears of joy, hand covering their mouth. Wide shot of family gathering closer for warm group hug, emotional authentic reactions, soft natural lighting."
      },
      style: "warm cinematic UGC style, natural home lighting, authentic emotional reactions, handheld camera with slight movement, documentary realism, no forced staging, genuine warmth throughout."
    },
    lyrics: "[verse]\nTu m'as donné tout ce que tu avais\nMême quand tu n'avais plus rien\nTu as travaillé sans te plaindre\nPour que j'aie mieux que toi\n\n[pre-chorus]\nAujourd'hui c'est ton jour\nEt je n'ai pas de grand cadeau\nAlors j'ai fait cette chanson\nPour te dire merci\n\n[chorus]\nJoyeux anniversaire, maman/papa\nCette chanson c'est tout ce que j'ai\nMais elle est faite pour toi\nComme tout ce que tu as fait pour moi"
  }
];

/**
 * Récupérer un concept par son ID
 */
export function getConceptById(id) {
  return EMOTIONAL_CONCEPTS.find(c => c.id === id);
}

/**
 * Récupérer tous les concepts avec leur Seedance prompts formatés
 */
export function getConceptsWithPrompts() {
  return EMOTIONAL_CONCEPTS.map(c => ({
    id: c.id,
    title: c.title,
    emoji: c.emoji,
    hook: c.hook,
    seedance: c.seedance
  }));
}

/**
 * Récupérer les hooks pour le scroll-stopping
 */
export function getConceptHooks() {
  return EMOTIONAL_CONCEPTS.map(c => ({
    id: c.id,
    hook: c.hook,
    title: c.title,
    emoji: c.emoji
  }));
}

/**
 * Concepts par audience cible
 */
export function getConceptsByAudience(audience) {
  return EMOTIONAL_CONCEPTS.filter(c => 
    c.targetAudience.toLowerCase().includes(audience.toLowerCase())
  );
}
