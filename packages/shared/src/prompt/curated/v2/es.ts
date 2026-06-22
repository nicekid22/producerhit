import type { LocalePromptPools } from "../../localePools/types";

/** V2 ES — prompts enriquecidos: género + ambiente + uso. Punto medio pedagógico. */
const SONG: readonly string[] = [
  // —— Décadas y retro ——
  "Canción synthwave de los 80 — pads Juno analógicos, caja con reverb en compuerta, autopista de neón de noche. Stranger Things con Miami Vice: emotiva, cinematográfica, sin cursilería.",
  "Canción hip-hop boom bap de los 90 — samples polvorientos, batería nítida, energía de storytelling. Azotea de verano en Nueva York, nostalgia del boombox con mezcla moderna.",
  "Canción pop-R&B brillante Y2K — sintes relucientes, chops vocales ajustados, confianza de la era de las pinzas mariposa. Ideal para reel de moda o TikTok retro.",
  "Canción disco-funk revival — bajo en vivo, stabs de cuerdas, alegría four-on-the-floor. Energía Studio 54 para la pista de una boda de verano.",
  "Canción alt-rock grunge de los 90 — dinámica fuerte-suave, guitarras crudas, angustia honesta. Lluvia en el parabrisas, franela y catarsis.",
  "Canción soul vintage — órgano Hammond, sección de metales, swing Motown. Estribillo feel-good para spot de marca o montaje familiar.",

  // —— Cine y series ——
  "Canción de terror cinematográfico — cuerdas disonantes, pulsos de subgrave, coro susurrado que crea tensión. Tráiler de thriller psicológico, suspense lento sin sustos baratos.",
  "Canción sci-fi épica — baterías masivas, orquesta híbrida, metales y pads amplios. Tráiler de odisea espacial: asombro, peligro y esperanza en el estribillo final.",
  "Canción jazz de cine negro — bar humeante, contrabajo, batería con escobillas, trompeta sordina. Lenta, seductora y misteriosa — montaje de detective en blanco y negro.",
  "Canción de opening de anime — estribillo J-rock explosivo, guitarras limpias, batería anthemica. Energía shonen: esperanza tras la pelea más dura.",
  "Canción western cinematográfica — acústica polvorienta, armónica, cuerdas épicas. Cabalgata outlaw al atardecer — créditos de miniserie en Netflix.",
  "Canción de comedia romántica — pop acústico, palmas, optimismo soleado. Encuentro casual en una librería, ligera sin parecer infantil.",
  "Canción de blockbuster de acción — percusión agresiva, metales, ostinato de cuerdas ascendente. Energía de persecución con un gancho melódico heroico.",
  "Canción de drama indie A24 — piano escaso, voz íntima, cuerdas sutiles al final. Ruptura silenciosa en la cocina a las 2 de la madrugada.",
  "Canción para documental — neutra pero emotiva, piano y pulsos suaves. Historias humanas, archivo histórico, dignidad y respeto.",
  "Canción de tráiler de superhéroe — orquesta híbrida y batería moderna, coro ascendente, golpes de impacto. El héroe oscuro regresa — escalofríos sin parodia.",

  // —— Géneros profundos ——
  "Canción neo-soul — Rhodes cálido, bajo redondo, groove relajado. Honestidad nocturna, calidez de vinilo, confesión suave y elegante.",
  "Canción flamenco fusión — palmas, guitarra de nylon, hi-hats trap debajo. Pasión, fuego, azotea de Barcelona a medianoche.",
  "Canción bossa nova — guitarra de nylon, maracas suaves, melodía ligera. Atardecer en Ipanema, romance de cafetería, sofisticación gentil.",
  "Canción metalcore — versos gritados, estribillo melódico cantado, doble bombo. Montaje de gym o hype de esports — agresión controlada.",
  "Canción bluegrass — banjo, violín, energía de pisadas y palmas. Road trip por los Apalaches, narrativa y velocidad.",
  "Canción reggae roots — one-drop, bajo cálido, energía de letras conscientes. Sol, resistencia, comunidad — espíritu Marley modernizado.",
  "Canción ópera-pop — líneas de soprano dramáticas sobre producción moderna. Épica, lujosa, momento de final en talent show.",
  "Canción blues de Chicago — bends de guitarra eléctrica, shuffle, grano de bar. Lluvia afuera, whisky adentro, verdad en el micrófono.",
  "Canción ska-punk — guitarras en upstroke, bajo caminante, metales con punch. Energía de video de skate, rápida y divertida.",
  "Canción afro-jazz — percusión compleja, piano eléctrico, libertad improvisacional. Inauguración de galería, cosmopolita y viva.",

  // —— Gaming y digital ——
  "Canción de montaje gaming épico — híbrido orquestal, estructura subida-caída, fanfarria de victoria. Jugada clutch en ranked — hype sin caos meme.",
  "Canción de aldea RPG lo-fi — campanas suaves, arpa gentil, pad cálido. Punto de guardado seguro — banda sonora cozy para estudiar.",
  "Canción de club cyberpunk — bajo distorsionado, voces glitch, ansiedad de neón. Ciudad nocturna, cromo y lluvia — mood Edgerunners.",
  "Canción chiptune arcade retro — lead de 8 bits, sidechain moderno, melodía juguetona. Nostalgia de pantalla de récord para tráiler de indie game.",

  // —— Momentos de vida ——
  "Canción de primer baile de boda — R&B lento, piano íntimo, cuerdas en el estribillo final. Amor real, sin clichés genéricos de boda.",
  "Himno de graduación — pop-rock elevador, coros de grupo en el gancho. Birretes al aire, padres llorando, futuro abierto.",
  "Canción de ruptura y superación — empieza triste en piano, sube a estribillo pop empoderado. Fotos borradas, corte nuevo, seguir adelante.",
  "Himno de road trip — ventanas abajo, acústica que estalla en baterías grandes. Señales de carretera, café de gasolinera, amigos gritando el estribillo.",
  "Canción homenaje fúnebre — respetuosa, piano y coro, sin melodrama. Celebrar una vida con gracia y calidez.",
  "Canción de cuna para recién nacido — caja de música y guitarra suave, tierna y atemporal. Luz de noche en el cuarto, padres tarareando.",

  // —— Creador e industria ——
  "Canción de sesión de estudio — creatividad a las 3 de la mañana, café frío, magia cuando el beat por fin encaja. Meta pero cercana para productores.",
  "Canción de reto viral — earworm de 15 segundos, sílabas pegadizas, lista para TikTok. Diseñada para repetirse, imposible de olvidar.",
  "Canción para sync licensing — mood neutro, letras seguras, arco comercial. Lista para video de marca: esperanzadora, moderna, universal.",
  "Canción ganadora de beat battle — rap con swagger, cambio de beat mínimo, energía de reacción del público. Una ronda, un nocaut.",
  "Canción de sample flip narrativo — chop de soul viejo, batería moderna, versos con historia. Cavando en cajas, honrando el pasado.",

  // —— Ambientes y estaciones ——
  "Canción melancolía de otoño — guitarra acústica, mood de hojas cayendo, cuerdas suaves. Clima de suéter, sudadera del ex, tristeza gentil.",
  "Canción de festival de verano — crossover house-pop, estribillo para cantar en grupo. Atardecer en el escenario principal, purpurina, euforia colectiva.",
  "Canción de cabaña de invierno — textura de chimenea, armonías folk, vibe de manta caliente. Nieve afuera, chocolate caliente adentro.",
  "Canción de renovación primaveral — indie pop luminoso, samples de pájaros, energía de nuevo comienzo. Limpiar el piso, playlist nueva.",
  "Canción city pop de medianoche — acordes city pop japoneses, bajo funky, reflejos de neón. Autopista de Tokio, 1982 encuentra 2026.",

  // —— Híbridos y sorpresas ——
  "Canción drill orquestal — cuerdas y slides de 808, contraste y potencia. Fusión inesperada que suena intencional.",
  "Canción gospel trap — ganchos de coro, stabs de órgano, 808 duro. Del banco de iglesia a la pista — adrenalina espiritual.",
  "Canción country trap — pellizcos de banjo con bajo 808, narrativa rural-urbana. Camioneta, sueños de ciudad.",
  "Canción de meditación ambient — sin batería, pads evolutivos, ritmo de respiración. App de yoga, playlist de sueño, foco calmado.",
  "Canción latin jazz — congas, montuno de piano, metales con punch. Club de La Habana, bailarines, sofisticación y calor.",
  "Balada K-pop — verso emotivo, estribillo explosivo, producción pulida. Escena de lluvia en K-drama, paraguas compartido.",
  "Canción drill sinfónica — orquesta cinematográfica sobre 808 deslizantes. After de la semana de moda en París — lujo y peligro.",
  "Canción piano rap — loop de piano solo, rap íntimo. Energía Tiny Desk, letras crudas, sin esconderse.",
  "Canción hyperpop de amor — dulzura glitch, voces pitchadas, romance caótico. Crush de la era digital, sobrecarga de emojis.",
  "Canción afro-house al amanecer — log drums, acordes cálidos, subida gradual de energía. Playa por la mañana tras la mejor noche.",
];

const BEAT: readonly string[] = [
  // —— Décadas y retro ——
  "Type beat synthwave 80s — bajo analógico, Juno arpegiado, caja retro. Montaje de night drive o título VHS de terror.",
  "Type beat boom bap East Coast 90s — sample flip polvoriento, batería dura, groove de asentimiento. Cypher freestyle o lyric video.",
  "Instrumental R&B Y2K — teclas brillantes, batería 2-step ajustada, espacio vocal. Slow jam retro o lookbook de moda.",
  "Loop disco house — bajo en vivo, stabs de cuerdas, four-on-the-floor. Revival de patinaje o anuncio de verano.",
  "Instrumental alt-rock grunge — capas de guitarra fuerte-suave, energía de batería en vivo. Edit de skate o tráiler de indie game.",

  // —— Cine ——
  "Beat underscore de terror cinematográfico — cuerdas atonales, drones de subgrave, sin stingers baratos. Tensión para B-roll de thriller.",
  "Beat híbrido de tráiler épico — braams, subidas de percusión, golpes orquestales. Teaser blockbuster o paquete de hype deportivo.",
  "Loop jazz de cine negro — contrabajo, kit con escobillas, samples de trompeta humeante. Monólogo de detective o escena de bar.",
  "Instrumental de batalla anime — batería rápida, guitarras distorsionadas, melodía heroica. AMV o menú de fighting game.",
  "Loop western cinematográfico — guitarra acústica, armónica, percusión escasa. Duelo en el desierto o documental de viaje.",

  // —— Géneros ——
  "Instrumental neo-soul — acordes de Rhodes, bajo redondo, pocket relajado. Intro de podcast o playlist de cafetería.",
  "Beat flamenco trap — guitarra de nylon, palmas, 808 moderno. Reel de fusión latina o reto de baile.",
  "Beat bossa lo-fi — guitarra suave, textura de vinilo, swing gentil. Stream de estudio o lobby de hotel boutique.",
  "Instrumental metalcore — doble bombo, riff de breakdown, puente melódico. PR de gym o highlight de esports.",
  "Beat reggae dub — delay pesado, one-drop, bajo como melodía. Chill de playa o base para spoken-word consciente.",
  "Beat jam blues de Chicago — shuffle, room de guitarra, stabs de órgano. Energía instrumental de bar band.",
  "Loop afro-jazz fusión — percusión en vivo, piano eléctrico, espacio improvisacional. Evento de galería o doc cultural.",

  // —— Gaming y digital ——
  "Beat de montaje gaming épico — subida, drop, motivo de victoria. Jugadas clutch y resúmenes de torneo.",
  "Beat hyperpop chiptune — lead de 8 bits, sidechain moderno, caos juguetón. Devlog de juego retro o edit meme.",
  "Beat de club cyberpunk — bajo distorsionado, hi-hats industriales, mood de neón. B-roll de ciudad nocturna o marca tech.",

  // —— Uso profesional ——
  "Instrumental pop sync-friendly — upbeat, sin bordes oscuros, arco de 60–90 segundos. Video corporativo o onboarding de app.",
  "Tema de podcast — motivo memorable de 8 compases, mezcla limpia, sin distraer. Intro de true crime o programa cultural.",
  "Beat trap de entrenamiento — 808 agresivo, melodía mínima, energía implacable. Clase HIIT o playlist para correr.",
  "Beat lo-fi de estudio — textura de lluvia, acordes suaves, 85 BPM calmado. Loop de foco de 3 horas.",
  "Beat de marca de lujo — minimal, sonido caro, cuerdas sutiles. Pasarela de moda o reveal de coche.",

  // —— Híbridos ——
  "Type beat drill orquestal — cuerdas staccato sobre 808 deslizantes. Campaña streetwear de alta costura.",
  "Instrumental gospel trap — stabs de coro, órgano, batería dura. Energía de domingo que llega al club.",
  "Beat country trap — gancho de banjo, sub 808, choque rural-urbano. Storytelling de TikTok o anuncio de camioneta.",
  "Loop ambient cinematográfico — texturas evolutivas, sin batería. App de meditación o documental de naturaleza.",
  "Beat latin jazz house — congas, stabs de piano, groove de club. Fiesta en azotea o reel de carta de cócteles.",
  "Beat drill sinfónico — golpes de orquesta, melodía oscura, slides de 808. Edge de marca de lujo europea.",
  "Fusión phonk western — cowbell, guitarra de desierto, batería memphis phonk. Edit cowboy drift o meme irónico.",
  "Beat UK garage 2-step — batería shuffle, soul cortado, bounce. Montaje de noche en Londres.",
  "Beat funk mandelão brasileño — kick pesado, groove de tamborzão, energía de baile. Reto de baile o clip de fiesta.",
  "Beat afro-house log drum — acordes cálidos, capas de percusión, build de amanecer. Set matutino de festival o vlog de viaje.",
  "Beat jersey club melódico — bed squeak, patrones de kick, lead emotivo. Baile de TikTok o edit emocional.",
  "Beat experimental de productor IA — texturas glitch, drops inesperados, energía meta. Demo tech o reel de humor de creador.",
  "Beat techno peak-time — kick impulsor, línea ácida, after de warehouse. Footage de club o nostalgia rave.",
  "Híbrido acoustic trap — loop de guitarra fingerpick, batería trap, espacio emocional. Singer-songwriter encuentra R&B moderno.",
  "Beat afro trap cinematográfico — percusión afro, hi-hats trap, metales de tráiler. Documental deportivo o manifiesto de marca.",
];

export const CURATED_V2_ES: LocalePromptPools = { song: SONG, beat: BEAT, hero: [] };
