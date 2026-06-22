import type { LocalePromptPools } from "../../localePools/types";

/** V2 — prompts display enrichis : genre + ambiance + usage. Juste milieu pédagogique. */
const SONG: readonly string[] = [
  // —— Décennies & rétro ——
  "80s synthwave song — analog Juno pads, gated reverb snare, neon highway at night. Stranger Things meets Miami Vice: emotional, cinematic, not cheesy.",
  "90s boom bap hip-hop song — dusty samples, crisp drums, storytelling flow energy. NYC rooftop summer, boombox nostalgia with a modern mix.",
  "Y2K glossy pop-R&B song — shiny synths, tight vocal chops, butterfly-clip era confidence. Perfect for a fashion reel or throwback TikTok.",
  "Disco-funk revival song — live bass, string stabs, four-on-the-floor joy. Studio 54 energy for a summer wedding dance floor.",
  "Grunge 90s alt-rock song — loud-quiet dynamics, raw guitars, honest angst. Rain on a windshield, flannel and catharsis.",
  "Vintage soul song — Hammond organ, horn section, Motown swing. Uplifting chorus for a feel-good brand film or family montage.",

  // —— Cinéma & séries ——
  "Cinematic horror song — dissonant strings, sub pulses, whispered choir building dread. Psychological thriller trailer, slow tension not cheap jumps.",
  "Epic sci-fi film song — massive drums, hybrid orchestra, brass hits and wide pads. Space odyssey trailer: awe, danger, hope in the final chorus.",
  "Film-noir jazz song — smoky bar, upright bass, brushed drums, muted trumpet. Slow, seductive, mysterious — black-and-white detective montage.",
  "Anime opening song — explosive J-rock chorus, clean guitars, anthemic drums. Shonen battle energy: hope after the hardest fight.",
  "Western cinematic song — dusty acoustic, harmonica, cinematic strings. Golden-hour outlaw ride — Netflix limited series credits vibe.",
  "Rom-com movie song — acoustic pop, handclaps, sunny optimism. Meet-cute in a bookstore, lighthearted without being childish.",
  "Action blockbuster song — aggressive percussion, brass stabs, rising string ostinato. Chase scene energy with a heroic melodic hook.",
  "Indie A24 drama song — sparse piano, intimate vocals, subtle strings swell. Quiet heartbreak in a kitchen at 2am.",
  "Documentary score song — neutral but emotional, piano and soft pulses. Human stories, archival footage, dignity and respect.",
  "Superhero trailer song — hybrid orchestra plus modern drums, choir rise, impact hits. Dark hero returns — goosebumps without parody.",

  // —— Genres profonds ——
  "Neo-soul song — warm Rhodes, round bass, laid-back groove. Late-night honesty, vinyl warmth, confessional but smooth.",
  "Flamenco fusion song — palmas, nylon guitar, modern trap hi-hats underneath. Passion, fire, Barcelona rooftop at midnight.",
  "Bossa nova song — nylon guitar, soft shakers, breezy melody. Ipanema sunset, coffee shop romance, gentle sophistication.",
  "Metalcore song — screamed verses, melodic sung chorus, double-kick drive. Gym PR montage or esports hype — controlled aggression.",
  "Bluegrass song — banjo, fiddle, stomp-clap energy. Road trip through Appalachia, storytelling and speed.",
  "Reggae roots song — one-drop groove, warm bass, conscious lyrics energy. Sun, resistance, community — Bob Marley spirit modernized.",
  "Opera-pop crossover song — dramatic soprano lines over modern production. Epic, luxurious, talent-show finale moment.",
  "Chicago blues song — electric guitar bends, shuffle drums, barroom grit. Rain outside, whiskey inside, truth on the mic.",
  "Ska-punk song — upstroke guitars, walking bass, horn section punches. Skate video energy, fast and fun.",
  "Afro-jazz song — complex percussion, electric piano, improvisational freedom. Art gallery opening, cosmopolitan and alive.",

  // —— Gaming & digital ——
  "Epic gaming montage song — orchestral hybrid, rise-and-drop structure, victory fanfare. Ranked clutch play — hype without meme chaos.",
  "Lo-fi RPG village song — soft bells, gentle harp, warm pad. Safe save point — cozy game soundtrack for studying.",
  "Cyberpunk club song — distorted bass, glitch vocals, neon anxiety. Night city, chrome and rain — Edgerunners mood.",
  "Retro arcade chiptune song — 8-bit lead, modern sidechain, playful melody. High score screen nostalgia for a indie game trailer.",

  // —— Moments de vie ——
  "Wedding first-dance song — slow R&B, intimate piano, strings on the final chorus. Real love, not generic wedding clichés.",
  "Graduation anthem song — uplifting pop-rock, gang vocals on the hook. Caps in the air, parents crying, future wide open.",
  "Breakup recovery song — starts sad on piano, builds to empowered pop chorus. Deleted photos, new haircut, moving on.",
  "Road-trip anthem song — windows down, acoustic strums into big drums. Highway signs, gas station coffee, friends screaming the hook.",
  "Funeral tribute song — respectful, piano and choir, no melodrama. Celebrating a life with grace and warmth.",
  "New baby lullaby song — music box and soft guitar, tender and timeless. Nursery night light, parents humming along.",

  // —— Créateur & industrie ——
  "Studio session song — 3am creativity, coffee cold, magic when the beat finally clicks. Meta but relatable for producers.",
  "Viral hook challenge song — 15-second earworm, catchy nonsense syllables, TikTok-ready. Designed to loop, impossible to forget.",
  "Sync licensing song — neutral mood, no offensive lyrics, commercial-friendly arc. Brand video ready: hopeful, modern, universal.",
  "Beat battle winner song — swagger rap, minimal beat switch, crowd reaction energy. One round, one knockout.",
  "Sample flip storytelling song — old soul chop, modern drums, narrative verses. Digging in crates, honoring the past.",

  // —— Ambiances & saisons ——
  "Autumn melancholy song — acoustic guitar, falling leaves mood, soft strings. Sweater weather, ex's hoodie, gentle sadness.",
  "Summer festival song — house-pop crossover, crowd singalong hook. Main stage sunset, glitter, collective euphoria.",
  "Winter cabin song — fireplace crackle texture, folk harmonies, warm blanket vibe. Snow outside, cocoa inside.",
  "Spring renewal song — bright indie pop, birdsong samples, fresh start energy. Cleaning the apartment, new playlist.",
  "Midnight city pop song — Japanese city pop chords, funky bass, neon reflections. Tokyo expressway, 1982 meets 2026.",

  // —— Hybrides & surprises ——
  "Orchestral drill song — strings and 808 slides, contrast and power. Unexpected fusion that still feels intentional.",
  "Gospel trap song — choir hooks, organ stabs, hard 808. Church pew to club floor — spiritual adrenaline.",
  "Country trap song — banjo plucks with 808 bass, rural-meets-urban storytelling. Pickup truck, city dreams.",
  "Ambient meditation song — no drums, evolving pads, breath-paced. Yoga app, sleep playlist, calm focus.",
  "Latin jazz song — congas, piano montuno, brass shots. Havana club, dancers, sophistication and heat.",
  "K-pop ballad song — emotional verse, explosive chorus, polished production. K-drama rain scene, umbrella sharing.",
  "Drill symphonique song — cinematic orchestra over sliding 808s. Paris fashion week afterparty — luxe and danger.",
  "Piano rap song — solo piano loop, intimate rap delivery. Tiny desk energy, raw lyrics, no hiding.",
  "Hyperpop love song — glitchy sweetness, pitched vocals, chaotic romance. Digital age crush, heart emoji overload.",
  "Afro-house sunrise song — log drums, warm chords, gradual energy build. Beach morning after the best night ever.",
];

const BEAT: readonly string[] = [
  // —— Décennies & rétro ——
  "80s synthwave type beat — analog bass, arpeggiated Juno, retro snare. Night drive montage or VHS horror title card.",
  "90s East Coast boom bap beat — dusty sample flip, hard drums, head-nod groove. Freestyle cypher or lyric video.",
  "Y2K R&B instrumental — glossy keys, tight 2-step drums, vocal space. Throwback slow jam or fashion lookbook.",
  "Disco house loop — live bass, string stabs, four-on-the-floor. Roller rink revival or summer brand ad.",
  "Grunge alt-rock instrumental — loud-quiet guitar layers, live drum energy. Skate edit or indie game trailer.",

  // —— Cinéma ——
  "Cinematic horror underscore beat — atonal strings, sub drones, no cheap stingers. Tension build for thriller B-roll.",
  "Epic trailer hybrid beat — braams, percussion rises, orchestral hits. Blockbuster teaser or sports hype package.",
  "Film-noir jazz loop — upright bass, brushed kit, smoky trumpet samples. Detective monologue or bar scene.",
  "Anime battle instrumental — fast drums, distorted guitars, heroic melody. AMV edit or fighting game menu.",
  "Western cinematic loop — acoustic guitar, harmonica, sparse percussion. Desert standoff or travel documentary.",

  // —— Genres ——
  "Neo-soul instrumental — Rhodes chords, round bass, laid-back pocket. Podcast intro or coffee shop playlist.",
  "Flamenco trap beat — nylon guitar, palmas, modern 808. Latin fusion reel or dance challenge.",
  "Bossa nova lo-fi beat — soft guitar, vinyl texture, gentle swing. Study stream or boutique hotel lobby.",
  "Metalcore instrumental — double kick, breakdown riff, melodic bridge. Gym PR or esports highlight.",
  "Reggae dub beat — heavy delay, one-drop, bass as melody. Beach chill or conscious spoken-word bed.",
  "Chicago blues jam beat — shuffle drums, guitar room, organ stabs. Bar band energy instrumental.",
  "Afro-jazz fusion loop — live percussion, electric piano, improvisational space. Gallery event or culture doc.",

  // —— Gaming & digital ——
  "Epic gaming montage beat — rise, drop, victory motif. Clutch plays and tournament recaps.",
  "Chiptune hyperpop beat — 8-bit lead, modern sidechain, playful chaos. Retro game devlog or meme edit.",
  "Cyberpunk club beat — distorted bass, industrial hats, neon mood. Night city B-roll or tech brand.",

  // —— Usage pro ——
  "Sync-friendly pop instrumental — upbeat, no dark edges, 60–90s arc. Corporate video or app onboarding.",
  "Podcast theme beat — memorable 8-bar motif, clean mix, not distracting. True crime or culture show intro.",
  "Workout trap beat — aggressive 808, minimal melody, relentless energy. HIIT class or running playlist.",
  "Study lo-fi beat — rain texture, mellow chords, 85 BPM calm. 3-hour focus stream loop.",
  "Luxury brand beat — minimal, expensive-sounding, subtle strings. Fashion runway or car reveal.",

  // —— Hybrides ——
  "Orchestral drill type beat — strings staccato over sliding 808. High-fashion streetwear campaign.",
  "Gospel trap instrumental — choir stabs, organ, hard drums. Sunday energy meets club night.",
  "Country trap beat — banjo hook, 808 sub, rural-urban clash. TikTok storytelling or truck ad.",
  "Ambient cinematic pad loop — evolving textures, no drums. Meditation app or nature documentary.",
  "Latin jazz house beat — congas, piano stabs, club groove. Rooftop party or cocktail menu reel.",
  "Drill symphonique beat — orchestra hits, dark melody, 808 slides. European luxury brand edge.",
  "Phonk western fusion — cowbell, desert guitar, memphis phonk drums. Cowboy drift edit or ironic meme.",
  "UK garage 2-step vocal chop beat — shuffled drums, chopped soul, bounce. London night out montage.",
  "Brazilian funk mandelão beat — heavy kick, tamborzão groove, baile energy. Dance challenge or party clip.",
  "Afro-house log drum beat — warm chords, percussion layers, sunrise build. Festival morning set or travel vlog.",
  "Melodic jersey club beat — bed squeak, kick patterns, emotional lead. TikTok dance or emotional edit.",
  "Experimental AI producer beat — glitch textures, unexpected drops, meta energy. Tech demo or creator humor reel.",
  "Peak-time techno beat — driving kick, acid line, warehouse afterhours. Club footage or rave nostalgia.",
  "Acoustic trap hybrid — fingerpicked guitar loop, trap drums, emotional space. Singer-songwriter meets modern R&B.",
  "Cinematic afro trap beat — afro percussion, trap hats, trailer brass. Sports documentary or brand manifesto.",
];

export const CURATED_V2_EN: LocalePromptPools = { song: SONG, beat: BEAT, hero: [] };
