#!/usr/bin/env node
/** Génère locales/pt.ts à partir de es.ts (thèmes PT). */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const esPath = path.join(__dirname, "../packages/shared/src/prompt/aceProse/locales/es.ts");
const ptPath = path.join(__dirname, "../packages/shared/src/prompt/aceProse/locales/pt.ts");

const es = fs.readFileSync(esPath, "utf8");
const themesMatch = es.match(/const THEMES = \[([\s\S]*?)\] as const;/);
if (!themesMatch) throw new Error("THEMES not found");

const esThemes = [...themesMatch[1]!.matchAll(/"([^"]+)"/g)].map((m) => m[1]!);

const PT_MOODS = [
  "Sombria",
  "Brilhante",
  "Fria",
  "Quente",
  "Crua",
  "Polido",
  "Cinematográfica",
  "Etérea",
  "Agressiva",
  "Melancólica",
  "Eufórica",
  "Hipnótica",
  "Íntima",
  "Épica",
  "Noturna",
  "Nostálgica",
  "Futurista",
  "Rebelde",
  "Sonhadora",
  "Tensa",
  "Sensual",
  "Triunfante",
  "Ansiosa",
  "Serena",
  "Agridoce",
];

const PT_MOODS_B = [
  "emocional",
  "atmosférica",
  "impactante",
  "noturna",
  "underground",
  "pronta para rádio",
  "catártica",
  "introspectiva",
  "dançante",
  "de rua",
  "luxuosa",
  "crua",
  "flutuante",
  "tóxica",
  "esperançosa",
  "vingativa",
  "confessional",
  "ensolarada",
  "invernal",
  "de néon",
];

/** Thèmes ES → PT (même ordre / seeds). */
const THEME_PT: Record<string, string> = {
  "la traición y la soledad": "a traição e a solidão",
  "un viaje nocturno bajo la lluvia": "uma viagem noturna na chuva",
  "renunciar a un trabajo tóxico sin plan B": "pedir demissão de um emprego tóxico sem plano B",
  "extrañar a alguien en otro huso horario": "sentir falta de alguém em outro fuso horário",
  "un primer beso en una azotea": "um primeiro beijo numa cobertura",
  "la ambición callejera tras un fracaso público": "a ambição de rua depois de um fracasso público",
  "un ghosting después de tres citas perfectas": "um ghosting depois de três encontros perfeitos",
  "sobrevivir a la semana de exámenes con café frío": "sobreviver à semana de provas com café frio",
  "un road trip en furgoneta por la costa": "uma road trip de van pela costa",
  "marcar el penal de la victoria en la prórroga": "marcar o pênalti da vitória na prorrogação",
  "tu gato caminando sobre el teclado MIDI": "teu gato andando no teclado MIDI",
  "escuchar tu canción en los auriculares de un desconocido": "ouvir tua música no fone de um desconhecido",
  "una propuesta de matrimonio bajo las luces de la ciudad": "um pedido de casamento sob as luzes da cidade",
  "un burnout que termina en «renuncio el lunes»": "um burnout que termina em «peço demissão segunda»",
  "dos mejores amigos que se alejan tras la universidad": "dois melhores amigos que se afastam depois da faculdade",
  "una terraza de verano que no quiere acabar": "uma varanda de verão que não quer acabar",
  "la venganza después de ser subestimado": "a vingança depois de ser subestimado",
  "el perdón tras una pelea brutal": "o perdão depois de uma briga brutal",
  "un amor a distancia que sigue sintiéndose cerca": "um amor à distância que ainda parece perto",
  "encontrar paz tras años de ruido": "encontrar paz depois de anos de barulho",
  "una fiesta warehouse a las 4am": "uma festa warehouse às 4h",
  "recuerdos de infancia en la cocina de la abuela": "memórias de infância na cozinha da avó",
  "una ruptura bajo lluvia y neones": "um término sob chuva e neon",
  "empezar de cero en un piso nuevo": "recomeçar do zero num apartamento novo",
  "la ansiedad antes de enviar un DM importante": "a ansiedade antes de mandar um DM importante",
  "tu primera venta en BeatStars a veintinueve dólares": "tua primeira venda no BeatStars por vinte e nove dólares",
  "un atardecer de festival que lo cambia todo": "um pôr do sol de festival que muda tudo",
  "una sesión de gym que salva tu salud mental": "um treino na academia que salva tua saúde mental",
  "una noche de estudio cuando el beat por fin encaja": "uma noite de estúdio quando o beat finalmente encaixa",
  "una reunión Zoom que debió ser un email": "uma reunião Zoom que devia ser um email",
  "una playlist de desamor en shuffle": "uma playlist de coração partido no shuffle",
  "enamorarte de la honestidad de tu mejor amigo": "se apaixonar pela honestidade do teu melhor amigo",
  "una mañana sin deudas tras años de estrés": "uma manhã sem dívidas depois de anos de estresse",
  "una manifestación que se vuelve esperanza": "um protesto que vira esperança",
  "un meme que te define por accidente": "um meme que te define por acidente",
  "un algoritmo que ya no te entiende": "um algoritmo que não te entende mais",
  "un hito de streams a las 3am": "uma meta de streams às 3h",
  "un hook escrito en la ducha": "um hook escrito no chuveiro",
  "una melodía tarareada en el bus": "uma melodia cantarolada no ônibus",
  "el día de lanzamiento indie y los nervios": "o dia de lançamento indie e os nervos",
  "un silbido de hook en el grupo de chat": "um assobio de hook no grupo do chat",
};

const ptThemes = esThemes.map((t) => THEME_PT[t] ?? t.replace(/^la /, "a ").replace(/^el /, "o ").replace(/^un /, "um ").replace(/^una /, "uma ").replace(/^tu /, "teu ").replace(/^dos /, "dois "));

const out = `import type { AceProseLocaleLexicon } from "./types";

const MOODS = ${JSON.stringify(PT_MOODS, null, 2)} as const;

const MOODS_B = ${JSON.stringify(PT_MOODS_B, null, 2)} as const;

const THEMES = ${JSON.stringify(ptThemes, null, 2)} as const;

export const PT_ACE_PROSE_LEXICON: AceProseLocaleLexicon = {
  moods: MOODS,
  moodsB: MOODS_B,
  themes: THEMES,
  buildOpener: ({ mode, moodA, moodB, genre, theme }) => {
    const kind = mode === "song" ? "música" : "beat";
    return \`\${moodA}, \${kind} \${genre} \${moodB} sobre \${theme}\`;
  },
};
`;

fs.writeFileSync(ptPath, out, "utf8");
console.log(`Wrote ${ptPath} (${ptThemes.length} themes)`);
