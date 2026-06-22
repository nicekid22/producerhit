import type { LocalePromptPools } from "../../localePools/types";

/** V2 PT-BR — prompts display enriquecidos: gênero + clima + uso. Português brasileiro nativo. */
const SONG: readonly string[] = [
  // —— Décadas & retrô ——
  "Música synthwave anos 80 — pads Juno analógicos, caixa com gated reverb, rodovia neon à noite. Stranger Things encontra Miami Vice: emocional, cinematográfica, nada cafona.",
  "Música hip-hop boom bap anos 90 — samples dusty, bateria crisp, energia de storytelling. Terraço em NYC no verão, nostalgia de boombox com mix moderno.",
  "Música pop-R&B glossy Y2K — synths brilhantes, vocal chops apertados, confiança da era dos presilhas de borboleta. Perfeita pra reel de moda ou TikTok retrô.",
  "Música disco-funk revival — baixo ao vivo, stabs de cordas, alegria four-on-the-floor. Energia Studio 54 numa pista de casamento de verão.",
  "Música alt-rock grunge anos 90 — dinâmica loud-quiet, guitarras cruas, angústia honesta. Chuva no para-brisa, flanela e catarse.",
  "Música soul vintage — órgão Hammond, seção de metais, swing Motown. Refrão feel-good pra filme de marca ou montagem de família.",

  // —— Cinema & séries ——
  "Música horror cinematográfica — cordas dissonantes, pulses de sub, coral sussurrado crescendo. Trailer de thriller psicológico, tensão lenta sem jump scare barato.",
  "Música sci-fi épica — tambores massivos, orquestra híbrida, metais e pads amplos. Trailer de odisséia espacial: admiração, perigo, esperança no final.",
  "Música jazz film noir — bar enfumaçado, contrabaixo, bateria com vassourinhas, trompete abafado. Lenta, sedutora, misteriosa — montagem de detetive preto e branco.",
  "Música de abertura anime — refrão J-rock explosivo, guitarras limpas, bateria anthemica. Energia shonen: esperança depois da luta mais difícil.",
  "Música western cinematográfica — violão empoeirado, gaita, cordas épicas. Cavalgada de outlaw no golden hour — vibe de créditos de série Netflix.",
  "Música comédia romântica — pop acústico, palmas, otimismo ensolarado. Encontro numa livraria, leve sem ser infantil.",
  "Música blockbuster de ação — percussão agressiva, stabs de metais, ostinato de cordas subindo. Energia de perseguição com hook melódico heroico.",
  "Música drama indie A24 — piano sparse, vocal íntimo, cordas crescendo devagar. Coração partido silencioso na cozinha às 2 da manhã.",
  "Música trilha documentário — neutra mas emocional, piano e pulses suaves. Histórias humanas, arquivo, dignidade e respeito.",
  "Música trailer super-herói — orquestra híbrida e bateria moderna, coral subindo, impact hits. Herói sombrio de volta — arrepios sem paródia.",

  // —— Gêneros profundos ——
  "Música neo-soul — Rhodes quente, baixo redondo, groove de boa. Honestidade de madrugada, calor de vinil, confissão suave.",
  "Música flamenco fusion — palmas, violão nylon, hi-hats trap por baixo. Paixão, fogo, rooftop em Barcelona à meia-noite.",
  "Música bossa nova — violão nylon, shakers leves, melodia arejada. Pôr do sol no Ipanema, romance de cafeteria, sofisticação leve.",
  "Música metalcore — versos gritados, refrão melódico cantado, double kick. Montagem de PR na academia ou hype de esports — agressão controlada.",
  "Música bluegrass — banjo, fiddle, energia stomp-clap. Road trip pelos Apalaches, storytelling e velocidade.",
  "Música reggae roots — groove one-drop, baixo quente, energia de letra consciente. Sol, resistência, comunidade — espírito Marley modernizado.",
  "Música crossover opera-pop — linhas soprano dramáticas sobre produção moderna. Épica, luxuosa, momento de final de talent show.",
  "Música blues de Chicago — bends de guitarra, shuffle, sujeira de bar. Chuva lá fora, whisky aqui dentro, verdade no microfone.",
  "Música ska-punk — guitarras upstroke, baixo walking, socos de metais. Energia de vídeo de skate, rápida e divertida.",
  "Música afro-jazz — percussão complexa, piano elétrico, liberdade improvisada. Vernissage de galeria, cosmopolita e viva.",

  // —— Gaming & digital ——
  "Música montagem gaming épica — híbrido orquestral, estrutura rise-and-drop, fanfarra de vitória. Clutch no ranked — hype sem caos meme.",
  "Música vila RPG lo-fi — sinos suaves, harpa gentil, pad quente. Save point seguro — trilha cozy pra estudar.",
  "Música club cyberpunk — baixo distorcido, vocal glitch, ansiedade neon. Cidade à noite, cromo e chuva — mood Edgerunners.",
  "Música chiptune arcade retrô — lead 8-bit, sidechain moderno, melodia brincalhona. Nostalgia de tela de high score pra trailer de jogo indie.",

  // —— Momentos de vida ——
  "Música primeira dança de casamento — slow R&B, piano íntimo, cordas no refrão final. Amor de verdade, zero clichê genérico de casamento.",
  "Hino de formatura — pop-rock uplifting, coro de massa no hook. Capelo no ar, pais chorando, futuro aberto.",
  "Música pós-término — começa triste no piano, cresce em refrão pop empoderado. Fotos apagadas, corte novo, seguindo em frente.",
  "Hino de road trip — janelas abertas, violão acústico virando bateria grande. Placas na estrada, café de posto, amigos gritando o hook.",
  "Música tributo fúnebre — respeitosa, piano e coral, zero melodrama. Celebrar uma vida com graça e calor.",
  "Canção de ninar pro bebê — caixinha de música e violão suave, terna e atemporal. Luz noturna no quarto, pais cantarolando.",

  // —— Criador & indústria ——
  "Música sessão de estúdio — criatividade às 3 da manhã, café frio, magia quando o beat finalmente encaixa. Meta mas relatable pros producers.",
  "Música challenge viral — earworm de 15 segundos, sílabas grudadas, pronta pro TikTok. Feita pra loopar, impossível esquecer.",
  "Música sync licensing — mood neutro, letra safe, arco commercial-friendly. Pronta pra vídeo de marca: esperançosa, moderna, universal.",
  "Música vencedora de beat battle — swagger rap, beat switch minimal, energia de plateia. Um round, um knockout.",
  "Música sample flip narrativa — chop soul vintage, bateria moderna, versos narrativos. Cavando nos crates, honrando o passado.",

  // —— Estações & climas ——
  "Música melancolia de outono — violão acústico, clima de folhas caindo, cordas suaves. Tempo de moletom, casaco do ex, tristeza gentil.",
  "Música festival de verão — crossover house-pop, hook de coro de multidão. Pôr do sol no palco principal, glitter, euforia coletiva.",
  "Música cabana de inverno — textura de lareira crepitando, harmonias folk, vibe cobertor quente. Neve lá fora, chocolate quente aqui dentro.",
  "Música renascimento de primavera — indie pop luminoso, samples de pássaros, energia fresh start. Faxina no apê, playlist nova.",
  "Música city pop de meia-noite — acordes city pop japoneses, baixo funky, reflexos neon. Via expressa de Tóquio, 1982 encontra 2026.",

  // —— Híbridos & surpresas ——
  "Música drill orquestral — cordas e slides de 808, contraste e potência. Fusão inesperada mas intencional.",
  "Música gospel trap — hooks de coral, stabs de órgão, 808 pesado. Do banco da igreja pro club — adrenalina espiritual.",
  "Música country trap — dedilhado de banjo com baixo 808, storytelling rural-urbano. Pickup, sonhos de cidade grande.",
  "Música meditação ambient — zero bateria, pads evolutivos, ritmo da respiração. App de yoga, playlist de sono, foco calmo.",
  "Música latin jazz — congas, montuno no piano, tiros de metais. Clube em Havana, dançarinos, calor e sofisticação.",
  "Balada K-pop — verso emocional, refrão explosivo, produção polida. Cena de chuva de K-drama, guarda-chuva compartilhado.",
  "Música drill sinfônica — orquestra cinematográfica sobre 808 deslizantes. Afterparty da fashion week em Paris — luxo e perigo.",
  "Música piano rap — loop de piano solo, rap íntimo. Energia tiny desk, letra crua, zero esconderijo.",
  "Música hyperpop de amor — doçura glitchada, vocais pitchados, romance caótico. Crush da era digital, overload de emoji de coração.",
  "Música afro-house ao nascer do sol — log drums, acordes quentes, energia subindo devagar. Praia de manhã depois da melhor noite.",
];

const BEAT: readonly string[] = [
  // —— Décadas & retrô ——
  "Type beat synthwave anos 80 — baixo analógico, Juno arpejado, caixa retrô. Montagem night drive ou card de título VHS horror.",
  "Type beat boom bap East Coast anos 90 — sample flip dusty, drums hard, groove head-nod. Cypher freestyle ou lyric video.",
  "Instrumental R&B Y2K — keys glossy, drums 2-step, espaço pro vocal. Slow jam retrô ou lookbook de moda.",
  "Loop disco house — baixo ao vivo, stabs de cordas, four-on-the-floor. Revival de roller rink ou spot de verão.",
  "Instrumental alt-rock grunge — camadas de guitarra loud-quiet, energia de bateria ao vivo. Edit de skate ou trailer de jogo indie.",

  // —— Cinema ——
  "Beat underscore horror cinematográfico — cordas atonais, drone de sub, zero stinger barato. Tensão crescente pra B-roll de thriller.",
  "Beat trailer híbrido épico — braams, rises percussivos, hits orquestrais. Teaser blockbuster ou pacote hype esportivo.",
  "Loop jazz film noir — contrabaixo, kit com vassourinhas, sample de trompete fumacento. Monólogo de detetive ou cena de bar.",
  "Instrumental battle anime — bateria rápida, guitarras distorcidas, melodia heroica. Edit AMV ou menu de fighting game.",
  "Loop western cinematográfico — violão acústico, gaita, percussão sparse. Duelo no deserto ou documentário de viagem.",

  // —— Gêneros ——
  "Instrumental neo-soul — acordes Rhodes, baixo redondo, pocket relaxado. Intro de podcast ou playlist de cafeteria.",
  "Beat flamenco trap — violão nylon, palmas, 808 moderno. Reel de fusão latina ou dance challenge.",
  "Beat bossa lo-fi — violão suave, textura de vinil, swing leve. Study stream ou lobby de hotel boutique.",
  "Instrumental metalcore — double kick, riff de breakdown, ponte melódica. PR na academia ou highlight de esports.",
  "Beat reggae dub — delay pesado, one-drop, baixo como melodia. Chill na praia ou base de spoken-word.",
  "Beat blues Chicago jam — shuffle, room de guitarra, stabs de órgão. Energia de banda de bar instrumental.",
  "Loop afro-jazz fusion — percussão ao vivo, piano elétrico, espaço improvisado. Evento de galeria ou doc de cultura.",

  // —— Gaming & digital ——
  "Beat montagem gaming épica — rise, drop, motivo de vitória. Clutch play e recap de torneio.",
  "Beat hyperpop chiptune — lead 8-bit, sidechain moderno, caos brincalhão. Devlog de jogo retrô ou edit meme.",
  "Beat club cyberpunk — baixo distorcido, hi-hats industriais, mood neon. B-roll de cidade à noite ou brand tech.",

  // —— Uso profissional ——
  "Instrumental pop sync-friendly — upbeat, zero cantos dark, arco de 60–90 segundos. Vídeo corporativo ou onboarding de app.",
  "Tema de podcast — motivo de 8 compassos memorável, mix limpo, nada invasivo. Intro de true crime ou show de cultura.",
  "Beat workout trap — 808 agressivo, melodia mínima, energia implacável. Aula de HIIT ou playlist de corrida.",
  "Beat study lo-fi — textura de chuva, acordes mellow, 85 BPM calmos. Loop de foco de 3 horas.",
  "Beat brand luxury — minimal, som caro, cordas sutis. Desfile de moda ou reveal de carro.",

  // —— Híbridos ——
  "Type beat drill orquestral — cordas staccato sobre 808 deslizantes. Campanha streetwear haute couture.",
  "Instrumental gospel trap — stabs de coral, órgão, drums hard. Energia de domingo encontra club night.",
  "Beat country trap — hook de banjo, sub 808, clash rural-urbano. Storytelling TikTok ou spot de pickup.",
  "Loop ambient cinematográfico — texturas evolutivas, zero bateria. App de meditação ou doc de natureza.",
  "Beat latin jazz house — congas, stabs de piano, groove de club. Rooftop party ou reel de menu de drinks.",
  "Beat drill sinfônico — hits de orquestra, melodia dark, slides de 808. Edge de brand luxury europeu.",
  "Fusão phonk western — cowbell, violão do deserto, drums memphis phonk. Edit cowboy drift ou meme irônico.",
  "Beat UK garage 2-step — drums shuffle, soul chopped, bounce. Montagem de noite londrina.",
  "Beat funk mandelão brasileiro — kick pesado, groove tamborzão, energia baile. Dance challenge ou clip de festa.",
  "Beat afro-house log drum — acordes quentes, camadas percussivas, build ao nascer do sol. Set matinal de festival ou vlog de viagem.",
  "Beat jersey club melódico — bed squeak, patterns de kick, lead emocional. Dance TikTok ou edit emocional.",
  "Beat experimental producer IA — texturas glitch, drops inesperados, energia meta. Demo tech ou reel humorístico de creator.",
  "Beat techno peak-time — kick driving, linha ácida, after de warehouse. Footage de club ou nostalgia rave.",
  "Híbrido acoustic trap — loop de violão fingerpick, drums trap, espaço emocional. Singer-songwriter encontra R&B moderno.",
  "Beat afro trap cinematográfico — percussão afro, hi-hats trap, metais de trailer. Doc esportivo ou manifesto de brand.",
];

export const CURATED_V2_PT: LocalePromptPools = { song: SONG, beat: BEAT, hero: [] };
