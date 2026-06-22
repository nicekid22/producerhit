import type { LocalePromptPools } from "../../localePools/types";

/** V2 DE — reichhaltige Display-Prompts: Genre + Atmosphäre + Einsatz. Mittleres Komplexitätsniveau. */
const SONG: readonly string[] = [
  // —— Jahrzehnte & Retro ——
  "80er-Synthwave-Song — analoge Juno-Pads, Gated-Reverb-Snare, Neon-Autobahn bei Nacht. Stranger Things trifft Miami Vice: emotional, cineastisch, nicht kitschig.",
  "90er-Boom-Bap-Hip-Hop-Song — staubige Samples, knackige Drums, Storytelling-Flow-Energie. NYC-Dach im Sommer, Boombox-Nostalgie mit modernem Mix.",
  "Y2K-glänzender Pop-R&B-Song — schimmernde Synths, enge Vocal-Chops, Schmetterlingsclip-Ära-Confidence. Perfekt für Fashion-Reel oder Throwback-TikTok.",
  "Disco-Funk-Revival-Song — Live-Bass, Streicher-Stabs, Four-on-the-Floor-Freude. Studio-54-Energie für die Sommerhochzeits-Tanzfläche.",
  "90er-Grunge-Alt-Rock-Song — Loud-Quiet-Dynamik, rohe Gitarren, ehrliche Angst. Regen auf der Windschutzscheibe, Flanell und Katharsis.",
  "Vintage-Soul-Song — Hammond-Orgel, Bläsersektion, Motown-Swing. Mitreißender Refrain für Feel-good-Markenfilm oder Familienmontage.",

  // —— Kino & Serien ——
  "Cineastischer Horror-Song — dissonante Streicher, Sub-Pulses, flüsternder Chor baut Dread auf. Psychothriller-Trailer, langsame Spannung statt billiger Jump-Scares.",
  "Epischer Sci-Fi-Film-Song — massive Drums, Hybrid-Orchester, Blech-Hits und weite Pads. Space-Odyssey-Trailer: Ehrfurcht, Gefahr, Hoffnung im finalen Refrain.",
  "Film-Noir-Jazz-Song — rauchige Bar, Kontrabass, gebürstete Drums, gedämpfte Trompete. Langsam, verführerisch, mysteriös — Schwarz-Weiß-Detektiv-Montage.",
  "Anime-Opening-Song — explosiver J-Rock-Refrain, cleane Gitarren, hymnische Drums. Shonen-Kampfenergie: Hoffnung nach dem härtesten Fight.",
  "Western-Cine-Song — staubige Akustik, Mundharmonika, cineastische Streicher. Outlaw-Fahrt in der goldenen Stunde — Netflix-Limited-Series-Credits-Vibe.",
  "Rom-Com-Film-Song — Akustik-Pop, Handclaps, sonniger Optimismus. Meet-cute in der Buchhandlung, leichtfüßig ohne kindisch zu wirken.",
  "Action-Blockbuster-Song — aggressive Percussion, Blech-Stabs, steigendes Streicher-Ostinato. Verfolgungsjagd-Energie mit heroischem Melodie-Hook.",
  "Indie-A24-Drama-Song — sparsames Piano, intime Vocals, subtiler Streicher-Swell. Leises Herzweh in der Küche um 2 Uhr nachts.",
  "Dokumentar-Score-Song — neutral aber emotional, Piano und sanfte Pulses. Menschliche Geschichten, Archivmaterial, Würde und Respekt.",
  "Superhelden-Trailer-Song — Hybrid-Orchester plus moderne Drums, Chor-Anstieg, Impact-Hits. Dunkler Held kehrt zurück — Gänsehaut ohne Parodie.",

  // —— Tiefe Genres ——
  "Neo-Soul-Song — warmer Rhodes, runder Bass, entspannter Groove. Ehrlichkeit in der Nacht, Vinyl-Wärme, geständnisvoll aber smooth.",
  "Flamenco-Fusion-Song — Palmas, Nylongitarre, moderne Trap-Hi-Hats darunter. Leidenschaft, Feuer, Barcelona-Dach um Mitternacht.",
  "Bossa-Nova-Song — Nylongitarre, sanfte Shaker, luftige Melodie. Ipanema-Sonnenuntergang, Café-Romanze, leichte Eleganz.",
  "Metalcore-Song — geschreiene Strophen, melodisch gesungener Refrain, Double-Kick-Drive. Gym-PR-Montage oder Esports-Hype — kontrollierte Aggression.",
  "Bluegrass-Song — Banjo, Fiddle, Stomp-Clap-Energie. Roadtrip durch die Appalachians, Storytelling und Tempo.",
  "Reggae-Roots-Song — One-Drop-Groove, warmer Bass, bewusste Lyrics-Energie. Sonne, Widerstand, Gemeinschaft — Bob-Marley-Spirit modernisiert.",
  "Oper-Pop-Crossover-Song — dramatische Sopran-Linien über moderner Produktion. Episch, luxuriös, Talent-Show-Finale.",
  "Chicago-Blues-Song — E-Gitarren-Bends, Shuffle-Drums, Barroom-Grit. Regen draußen, Whiskey drinnen, Wahrheit am Mikro.",
  "Ska-Punk-Song — Upstroke-Gitarren, Walking-Bass, Bläser-Punches. Skate-Video-Energie, schnell und fun.",
  "Afro-Jazz-Song — komplexe Percussion, E-Piano, improvisatorische Freiheit. Galerie-Eröffnung, kosmopolitisch und lebendig.",

  // —— Gaming & Digital ——
  "Epischer Gaming-Montage-Song — orchestraler Hybrid, Rise-and-Drop-Struktur, Siegesfanfare. Ranked-Clutch-Play — Hype ohne Meme-Chaos.",
  "Lo-Fi-RPG-Dorf-Song — sanfte Glocken, zarte Harfe, warmer Pad. Sicherer Speicherpunkt — cozy Game-Soundtrack zum Lernen.",
  "Cyberpunk-Club-Song — verzerrter Bass, Glitch-Vocals, Neon-Angst. Night City, Chrom und Regen — Edgerunners-Stimmung.",
  "Retro-Arcade-Chiptune-Song — 8-Bit-Lead, moderner Sidechain, verspielte Melodie. High-Score-Nostalgie für Indie-Game-Trailer.",

  // —— Lebensmomente ——
  "Hochzeits-Eröffnungstanz-Song — langsamer R&B, intimes Piano, Streicher im finalen Refrain. Echte Liebe, keine generischen Hochzeits-Klischees.",
  "Abschluss-Hymne-Song — mitreißender Pop-Rock, Gang-Vocals im Hook. Mützen in der Luft, weinende Eltern, offene Zukunft.",
  "Trennungs-Aufbau-Song — startet traurig am Piano, baut zum empowernden Pop-Refrain auf. Gelöschte Fotos, neuer Haarschnitt, weitergehen.",
  "Roadtrip-Hymne-Song — Fenster runter, Akustik-Strums in große Drums. Autobahnschilder, Tankstellenkaffee, Freunde schreien den Hook.",
  "Trauer-Hommage-Song — respektvoll, Piano und Chor, kein Melodrama. Ein Leben feiern mit Anstand und Wärme.",
  "Neugeborenen-Wiegenlied-Song — Spieluhr und sanfte Gitarre, zart und zeitlos. Nachtlicht im Kinderzimmer, Eltern summen mit.",

  // —— Creator & Industrie ——
  "Studio-Session-Song — 3-Uhr-morgens-Kreativität, kalter Kaffee, Magie wenn der Beat endlich klickt. Meta aber relatable für Producer.",
  "Viraler-Hook-Challenge-Song — 15-Sekunden-Ohrwurm, catchy Nonsens-Silben, TikTok-ready. Zum Loopen gemacht, unmöglich zu vergessen.",
  "Sync-Licensing-Song — neutrale Stimmung, keine anstößigen Lyrics, commercial-friendly Arc. Markenvideo-ready: hoffnungsvoll, modern, universell.",
  "Beat-Battle-Gewinner-Song — Swagger-Rap, minimaler Beat-Switch, Crowd-Reaction-Energie. Eine Runde, ein Knockout.",
  "Sample-Flip-Storytelling-Song — alter Soul-Chop, moderne Drums, narrative Strophen. Kisten durchstöbern, die Vergangenheit ehren.",

  // —— Stimmungen & Jahreszeiten ——
  "Herbst-Melancholie-Song — Akustikgitarre, fallende-Blätter-Stimmung, sanfte Streicher. Pulli-Wetter, Ex-Hoodie, leichte Traurigkeit.",
  "Sommer-Festival-Song — House-Pop-Crossover, Crowd-Mitsing-Hook. Mainstage-Sonnenuntergang, Glitzer, kollektive Euphorie.",
  "Winter-Hütten-Song — Kamin-Knistern-Textur, Folk-Harmonien, warme-Decke-Vibe. Schnee draußen, Kakao drinnen.",
  "Frühlings-Erneuerung-Song — heller Indie-Pop, Vogelgezwitscher-Samples, Neuanfang-Energie. Wohnung aufräumen, neue Playlist.",
  "Mitternachts-City-Pop-Song — japanische City-Pop-Akkorde, funky Bass, Neon-Reflexionen. Tokyo-Autobahn, 1982 trifft 2026.",

  // —— Hybride & Überraschungen ——
  "Orchestraler-Drill-Song — Streicher und 808-Slides, Kontrast und Power. Unerwartete Fusion, die trotzdem bewusst wirkt.",
  "Gospel-Trap-Song — Chor-Hooks, Orgel-Stabs, harte 808. Kirchenbank bis Clubfloor — spirituelles Adrenalin.",
  "Country-Trap-Song — Banjo-Plucks mit 808-Bass, ländlich-trifft-städtisch Storytelling. Pickup-Truck, Stadtträume.",
  "Ambient-Meditations-Song — keine Drums, sich entwickelnde Pads, atemgetaktet. Yoga-App, Sleep-Playlist, ruhiger Fokus.",
  "Latin-Jazz-Song — Congas, Piano-Montuno, Blech-Shots. Havanna-Club, Tänzer, Eleganz und Hitze.",
  "K-Pop-Ballade-Song — emotionale Strophe, explosiver Refrain, polierte Produktion. K-Drama-Regenszene, Regenschirm teilen.",
  "Symphonischer-Drill-Song — cineastisches Orchester über gleitenden 808s. Paris Fashion Week Afterparty — Luxus und Gefahr.",
  "Piano-Rap-Song — Solo-Piano-Loop, intime Rap-Delivery. Tiny-Desk-Energie, rohe Lyrics, kein Verstecken.",
  "Hyperpop-Liebes-Song — glitchige Süße, gepitchte Vocals, chaotische Romanze. Digitaler Crush, Herz-Emoji-Overload.",
  "Afro-House-Sonnenaufgang-Song — Log-Drums, warme Akkorde, gradueller Energieaufbau. Strandmorgen nach der besten Nacht ever.",
];

const BEAT: readonly string[] = [
  // —— Jahrzehnte & Retro ——
  "80er-Synthwave-Type-Beat — analoger Bass, arpeggierter Juno, Retro-Snare. Nachtfahrt-Montage oder VHS-Horror-Titelkarte.",
  "90er-East-Coast-Boom-Bap-Beat — staubiger Sample-Flip, harte Drums, Head-Nod-Groove. Freestyle-Cypher oder Lyric-Video.",
  "Y2K-R&B-Instrumental — glänzende Keys, enge 2-Step-Drums, Vocal-Space. Throwback-Slow-Jam oder Fashion-Lookbook.",
  "Disco-House-Loop — Live-Bass, Streicher-Stabs, Four-on-the-Floor. Rollschuh-Disco-Revival oder Sommer-Marken-Spot.",
  "Grunge-Alt-Rock-Instrumental — Loud-Quiet-Gitarren-Layer, Live-Drum-Energie. Skate-Edit oder Indie-Game-Trailer.",

  // —— Kino ——
  "Cineastischer-Horror-Underscore-Beat — atonale Streicher, Sub-Drones, keine billigen Stinger. Spannungsaufbau für Thriller-B-Roll.",
  "Epischer-Trailer-Hybrid-Beat — Braams, Percussion-Rises, orchestrale Hits. Blockbuster-Teaser oder Sports-Hype-Paket.",
  "Film-Noir-Jazz-Loop — Kontrabass, gebürstetes Kit, rauchige Trompeten-Samples. Detektiv-Monolog oder Barszene.",
  "Anime-Battle-Instrumental — schnelle Drums, verzerrte Gitarren, heroische Melodie. AMV-Edit oder Fighting-Game-Menü.",
  "Western-Cine-Loop — Akustikgitarre, Mundharmonika, sparsame Percussion. Wüsten-Showdown oder Reise-Doku.",

  // —— Genres ——
  "Neo-Soul-Instrumental — Rhodes-Akkorde, runder Bass, entspannter Pocket. Podcast-Intro oder Café-Playlist.",
  "Flamenco-Trap-Beat — Nylongitarre, Palmas, moderne 808. Latin-Fusion-Reel oder Dance-Challenge.",
  "Bossa-Nova-Lo-Fi-Beat — sanfte Gitarre, Vinyl-Textur, leichter Swing. Study-Stream oder Boutique-Hotel-Lobby.",
  "Metalcore-Instrumental — Double-Kick, Breakdown-Riff, melodische Bridge. Gym-PR oder Esports-Highlight.",
  "Reggae-Dub-Beat — schwerer Delay, One-Drop, Bass als Melodie. Beach-Chill oder bewusstes Spoken-Word-Bed.",
  "Chicago-Blues-Jam-Beat — Shuffle-Drums, Gitarren-Raum, Orgel-Stabs. Bar-Band-Energie instrumental.",
  "Afro-Jazz-Fusion-Loop — Live-Percussion, E-Piano, improvisatorischer Raum. Galerie-Event oder Kultur-Doku.",

  // —— Gaming & Digital ——
  "Epischer-Gaming-Montage-Beat — Rise, Drop, Siegesmotiv. Clutch-Plays und Turnier-Recaps.",
  "Chiptune-Hyperpop-Beat — 8-Bit-Lead, moderner Sidechain, verspieltes Chaos. Retro-Game-Devlog oder Meme-Edit.",
  "Cyberpunk-Club-Beat — verzerrter Bass, industrielle Hats, Neon-Stimmung. Night-City-B-Roll oder Tech-Marke.",

  // —— Professioneller Einsatz ——
  "Sync-freundliches-Pop-Instrumental — upbeat, keine dunklen Kanten, 60–90s-Arc. Corporate-Video oder App-Onboarding.",
  "Podcast-Theme-Beat — einprägsames 8-Takt-Motiv, cleaner Mix, nicht ablenkend. True-Crime- oder Kultur-Show-Intro.",
  "Workout-Trap-Beat — aggressive 808, minimale Melodie, unerbittliche Energie. HIIT-Kurs oder Lauf-Playlist.",
  "Study-Lo-Fi-Beat — Regen-Textur, mellow Chords, 85 BPM Ruhe. 3-Stunden-Fokus-Stream-Loop.",
  "Luxus-Marken-Beat — minimal, teuer klingend, subtile Streicher. Fashion-Runway oder Auto-Reveal.",

  // —— Hybride ——
  "Orchestraler-Drill-Type-Beat — Staccato-Streicher über gleitenden 808. High-Fashion-Streetwear-Kampagne.",
  "Gospel-Trap-Instrumental — Chor-Stabs, Orgel, harte Drums. Sonntags-Energie trifft Clubnacht.",
  "Country-Trap-Beat — Banjo-Hook, 808-Sub, ländlich-städtischer Clash. TikTok-Storytelling oder Truck-Werbung.",
  "Ambient-Cine-Pad-Loop — sich entwickelnde Texturen, keine Drums. Meditations-App oder Natur-Doku.",
  "Latin-Jazz-House-Beat — Congas, Piano-Stabs, Club-Groove. Rooftop-Party oder Cocktail-Menü-Reel.",
  "Symphonischer-Drill-Beat — Orchester-Hits, dunkle Melodie, 808-Slides. Europäische Luxusmarke mit Edge.",
  "Phonk-Western-Fusion — Cowbell, Wüsten-Gitarre, Memphis-Phonk-Drums. Cowboy-Drift-Edit oder ironisches Meme.",
  "UK-Garage-2-Step-Vocal-Chop-Beat — geschuffelte Drums, gechoppte Soul-Samples, Bounce. London-Nacht-Montage.",
  "Brazilian-Funk-Mandelão-Beat — schwerer Kick, Tamborzão-Groove, Baile-Energie. Dance-Challenge oder Party-Clip.",
  "Afro-House-Log-Drum-Beat — warme Akkorde, Percussion-Layer, Sonnenaufgangs-Build. Festival-Morgenset oder Travel-Vlog.",
  "Melodic-Jersey-Club-Beat — Bett-Quietsch, Kick-Patterns, emotionaler Lead. TikTok-Dance oder emotionaler Edit.",
  "Experimenteller-AI-Producer-Beat — Glitch-Texturen, unerwartete Drops, Meta-Energie. Tech-Demo oder Creator-Humor-Reel.",
  "Peak-Time-Techno-Beat — treibender Kick, Acid-Line, Warehouse-Afterhours. Club-Footage oder Rave-Nostalgie.",
  "Akustik-Trap-Hybrid — fingergepickter Gitarren-Loop, Trap-Drums, emotionaler Raum. Singer-Songwriter trifft modernes R&B.",
  "Cineastischer-Afro-Trap-Beat — Afro-Percussion, Trap-Hats, Trailer-Blech. Sport-Doku oder Marken-Manifest.",
];

export const CURATED_V2_DE: LocalePromptPools = { song: SONG, beat: BEAT, hero: [] };
