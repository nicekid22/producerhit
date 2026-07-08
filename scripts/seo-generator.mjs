#!/usr/bin/env node
/**
 * MODULE SEO GENERATOR — Générateur de contenu optimisé
 * 
 * Génère pour chaque vidéo :
 * - Titre optimisé (max 100 caractères TikTok, 100 YouTube)
 * - Description avec mots-clés
 * - 30 hashtags pertinents
 * - Mots-clés pour la recherche
 * - Adaptation automatique FR/EN
 * 
 * Usage : node scripts/seo-generator.mjs [video_id] [langue]
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "test-output-hit-v6");
const SEO_DIR = join(OUT, "seo");

// ─── BASE DE DONNÉES SEO ─────────────────────────────────────────────
const SEO_DATABASE = {
  // Titres par catégorie (FR)
  titlesFr: {
    time: [
      "{time} — La grind ne s'arrête jamais 🔥",
      "{time} — Quand tout le dort, on crée",
      "{time} — Le son qui manquait au monde",
      "{time} — On ne dort pas, on produit",
      "{time} — L'heure des légendes",
    ],
    action: [
      "{text} — Fais ton hit maintenant",
      "{text} — Pas d'excuses, que de la musique",
      "{text} — Le grind ne s'arrête jamais",
      "{text} — Créé ton son, change le monde",
      "{text} — La seule façon de gagner",
    ],
    emotion: [
      "{text} — Sens-le dans ta poitrine",
      "{text} — Cette énergie, c'est toi",
      "{text} — Le son qui te manquait",
      "{text} — Musique brute, émotion pure",
      "{text} — Le beat qui change tout",
    ],
    result: [
      "{text} — Le hit est arrivé",
      "{text} — La foule en folie",
      "{text} — Ton moment est arrivé",
      "{text} — Le son qui fait bouger",
      "{text} — Le hit de l'année",
    ],
    brand: [
      "ProducerHit — Crée tes hits",
      "ProducerHit — Le son qui manquait",
      "ProducerHit — Tes hits commencent ici",
      "ProducerHit — Musique qui convertit",
      "ProducerHit — Rejoins la révolution",
    ],
  },
  
  // Titres par catégorie (EN)
  titlesEn: {
    time: [
      "{time} — The grind never stops 🔥",
      "{time} — While everyone sleeps, we create",
      "{time} — The sound the world needed",
      "{time} — We don't sleep, we produce",
      "{time} — Legends are made at {time}",
    ],
    action: [
      "{text} — Make your hit now",
      "{text} — No excuses, just music",
      "{text} — The grind never stops",
      "{text} — Create your sound, change the world",
      "{text} — The only way to win",
    ],
    emotion: [
      "{text} — Feel it in your chest",
      "{text} — This energy is you",
      "{text} — The sound you've been missing",
      "{text} — Raw music, pure emotion",
      "{text} — The beat that changes everything",
    ],
    result: [
      "{text} — The hit has arrived",
      "{text} — The crowd goes crazy",
      "{text} — This is your moment",
      "{text} — The sound that moves",
      "{text} — The hit of the year",
    ],
    brand: [
      "ProducerHit — Make your hits",
      "ProducerHit — The sound you've been missing",
      "ProducerHit — Your hits start here",
      "ProducerHit — Music that converts",
      "ProducerHit — Join the revolution",
    ],
  },
  
  // Descriptions (FR)
  descriptionsFr: [
    "Quand tout le dort, on crée. {time} et on produit les futurs hits. 🎵\n\nRejoins ProducerHit et crée tes propres hits : {link}\n\n#musicproducer #beats #studio",
    "Le grind ne s'arrête jamais. {text} et on pousse les limites. 🔥\n\nApprends à produire comme un pro : {link}\n\n#producteur #musique #hit",
    "Ce moment où le beat tombe et que tout s'éclate. 💥\n\nCrée tes propres sons avec ProducerHit : {link}\n\n#beatmaker #production #viral",
    "3:47 AM. Tous dorment. Nous on produit. 🌙\n\nLa prochaine session, c'est toi qui décides : {link}\n\n#nightowl #musiclife #producer",
    "La foule en folie. Le son qui claque. Le hit qui reste. 🎤\n\nDeviens le pro que tu es : {link}\n\n#live #concert #music",
  ],
  
  // Descriptions (EN)
  descriptionsEn: [
    "While everyone sleeps, we create. {time} and we're producing future hits. 🎵\n\nJoin ProducerHit and make your own hits: {link}\n\n#musicproducer #beats #studio",
    "The grind never stops. {text} and we push the limits. 🔥\n\nLearn to produce like a pro: {link}\n\n#beatmaker #production #viral",
    "That moment when the beat drops and everything explodes. 💥\n\nCreate your own sounds with ProducerHit: {link}\n\n#music #hit #creative",
    "3:47 AM. Everyone sleeps. We produce. 🌙\n\nThe next session, you decide: {link}\n\n#nightowl #musiclife #producer",
    "The crowd goes crazy. The beat hits hard. The hit stays. 🎤\n\nBecome the pro you are: {link}\n\n#live #concert #music",
  ],
  
  // Hashtags FR
  hashtagsFr: [
    // Musique (10)
    "#musique", "#beat", "#studio", "#producteur", "#hiphop",
    "#rap", "#trap", "#lofi", "#electro", "#techno",
    // Production (10)
    "#musicproducer", "#beatmaker", "#flstudio", "#ableton", "#logicpro",
    "#productionmusicale", "#studioession", "#mixage", "#mastering", "#composition",
    // Engagement (10)
    "#viral", "#trending", "#fyp", "#pourtoi", "#actu",
    "#creative", "#inspiration", "#motivation", "#grind", "#hustle",
    // Spécifique (5)
    "#producerhit", "#makehits", "#3amgrind", "#nightproducer", "#hitmaker",
  ],
  
  // Hashtags EN
  hashtagsEn: [
    // Music (10)
    "#music", "#beats", "#studio", "#producer", "#hiphop",
    "#rap", "#trap", "#lofi", "#electronic", "#techno",
    // Production (10)
    "#musicproducer", "#beatmaker", "#flstudio", "#ableton", "#logicpro",
    "#musicproduction", "#studiosession", "#mixing", "#mastering", "#songwriting",
    // Engagement (10)
    "#viral", "#trending", "#fyp", "#explorepage", "#creative",
    "#inspiration", "#motivation", "#grind", "#hustle", "#success",
    // Specific (5)
    "#producerhit", "#makehits", "#3amgrind", "#nightproducer", "#hitmaker",
  ],
  
  // Mots-clés FR
  keywordsFr: [
    "producteur musical", "beatmaker", "studio d'enregistrement",
    "FL Studio", "musique hip hop", "création musicale",
    "mixage audio", "composition beat", "studio maison",
    "musique nocturne", "grind", "producteur débutant",
    "comment produire", "tutoriel musique", "logiciel musique",
  ],
  
  // Mots-clés EN
  keywordsEn: [
    "music producer", "beat maker", "recording studio",
    "FL Studio", "hip hop music", "music creation",
    "audio mixing", "beat composition", "home studio",
    "night producer", "grind", "beginner producer",
    "how to produce", "music tutorial", "music software",
  ],
};

// ─── TEMPLATES DE CONTENU ────────────────────────────────────────────
const CONTENT_TEMPLATES = {
  // Templates pour les titres
  title: {
    tiktok: {
      maxLength: 100,
      style: "emoji_heavy",
      includeHashtags: false,
    },
    youtube: {
      maxLength: 100,
      style: "keyword_first",
      includeHashtags: false,
    },
  },
  
  // Templates pour les descriptions
  description: {
    tiktok: {
      maxLength: 2200,
      includeLink: true,
      includeHashtags: true,
      hashtagCount: 30,
    },
    youtube: {
      maxLength: 5000,
      includeLink: true,
      includeHashtags: true,
      hashtagCount: 15,
      includeChapters: true,
    },
  },
};

// ─── FONCTIONS UTILITAIRES ───────────────────────────────────────────
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function selectRandom(array, count = 1) {
  const shuffled = shuffleArray(array);
  return shuffled.slice(0, count);
}

function generateTitle(scene, lang = "fr") {
  const titles = SEO_DATABASE[`titles${lang.charAt(0).toUpperCase() + lang.slice(1)}`];
  const category = scene.category || "action";
  const categoryTitles = titles[category] || titles.action;
  
  // Choisir un titre aléatoire
  let title = selectRandom(categoryTitles, 1)[0];
  
  // Remplacer les variables
  title = title.replace("{time}", scene.text || "3:47 AM");
  title = title.replace("{text}", scene.text || "THE GRIND");
  
  return title;
}

function generateDescription(scene, lang = "fr", link = "https://producerhit.com") {
  const descriptions = SEO_DATABASE[`descriptions${lang.charAt(0).toUpperCase() + lang.slice(1)}`];
  
  // Choisir une description aléatoire
  let description = selectRandom(descriptions, 1)[0];
  
  // Remplacer les variables
  description = description.replace("{time}", scene.text || "3:47 AM");
  description = description.replace("{text}", scene.text || "THE GRIND");
  description = description.replace("{link}", link);
  
  return description;
}

function generateHashtags(lang = "fr", count = 30) {
  const hashtags = SEO_DATABASE[`hashtags${lang.charAt(0).toUpperCase() + lang.slice(1)}`];
  
  // Mélanger et sélectionner
  const shuffled = shuffleArray(hashtags);
  return shuffled.slice(0, count);
}

function generateKeywords(lang = "fr", count = 10) {
  const keywords = SEO_DATABASE[`keywords${lang.charAt(0).toUpperCase() + lang.slice(1)}`];
  return selectRandom(keywords, count);
}

// ─── GÉNÉRATEUR PRINCIPAL ────────────────────────────────────────────
export function generateSEO(scene, options = {}) {
  const {
    lang = "fr",
    platform = "tiktok",
    link = "https://producerhit.com",
    videoId = `v${Date.now()}`,
  } = options;
  
  // Générer le titre
  const title = generateTitle(scene, lang);
  
  // Générer la description
  const description = generateDescription(scene, lang, link);
  
  // Générer les hashtags
  const hashtagCount = platform === "youtube" ? 15 : 30;
  const hashtags = generateHashtags(lang, hashtagCount);
  
  // Générer les mots-clés
  const keywords = generateKeywords(lang, 10);
  
  // Assembler le package SEO
  const seoPackage = {
    videoId,
    platform,
    language: lang,
    title,
    description,
    hashtags,
    keywords,
    metadata: {
      generatedAt: new Date().toISOString(),
      sceneId: scene.id,
      sceneQuery: scene.query,
      sceneText: scene.text,
      category: scene.category,
    },
  };
  
  return seoPackage;
}

// ─── FORMATAGE POUR CHAQUE PLATEFORME ────────────────────────────────
export function formatForTikTok(seoPackage) {
  return {
    title: seoPackage.title,
    description: [
      seoPackage.description,
      "",
      seoPackage.hashtags.join(" "),
    ].join("\n"),
    hashtags: seoPackage.hashtags,
  };
}

export function formatForYouTube(seoPackage) {
  return {
    title: seoPackage.title,
    description: [
      seoPackage.description,
      "",
      "─" .repeat(20),
      "",
      "🎵 ProducerHit — Where hits are born",
      "🔗 " + (seoPackage.metadata.link || "https://producerhit.com"),
      "",
      "Subscribe for more beats and production tips!",
      "",
      seoPackage.hashtags.join(" "),
    ].join("\n"),
    tags: seoPackage.keywords,
    categoryId: "10", // Music
  };
}

// ─── SAUVEGARDE ───────────────────────────────────────────────────────
async function saveSEO(seoPackage, videoId) {
  await mkdir(SEO_DIR, { recursive: true });
  
  // Sauvegarder le package complet
  const seoPath = join(SEO_DIR, `${videoId}-seo.json`);
  await writeFile(seoPath, JSON.stringify(seoPackage, null, 2));
  
  // Sauvegarder les formats spécifiques
  const tiktokPath = join(SEO_DIR, `${videoId}-tiktok.json`);
  const youtubePath = join(SEO_DIR, `${videoId}-youtube.json`);
  
  await writeFile(tiktokPath, JSON.stringify(formatForTikTok(seoPackage), null, 2));
  await writeFile(youtubePath, JSON.stringify(formatForYouTube(seoPackage), null, 2));
  
  console.log(`  ✅ SEO saved: ${videoId}`);
  return { seoPath, tiktokPath, youtubePath };
}

// ─── MAIN ────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const videoId = args[0] || `v${Date.now()}`;
  const lang = args[1] || "fr";
  
  console.log("╔" + "═".repeat(58) + "╗");
  console.log("║  📝 SEO GENERATOR — Générateur de contenu optimisé     ║");
  console.log("╚" + "═".repeat(58) + "╝");
  console.log(`\n  📊 Video ID: ${videoId} | Langue: ${lang}`);
  
  // Scène de test
  const testScene = {
    id: "s1",
    query: "music producer bedroom late night tired",
    text: "3:47 AM",
    vo: "Three forty-seven AM. Tired. Still grinding.",
    yp: 0.25,
    size: 100,
    color: "#FFD700",
    category: "time",
  };
  
  // Générer pour TikTok
  console.log("\n  📱 Génération pour TikTok...");
  const tiktokSEO = generateSEO(testScene, { lang, platform: "tiktok", videoId });
  console.log(`     Titre: ${tiktokSEO.title}`);
  console.log(`     Hashtags: ${tiktokSEO.hashtags.length}`);
  
  // Générer pour YouTube
  console.log("\n  📺 Génération pour YouTube...");
  const youtubeSEO = generateSEO(testScene, { lang, platform: "youtube", videoId });
  console.log(`     Titre: ${youtubeSEO.title}`);
  console.log(`     Tags: ${youtubeSEO.keywords.length}`);
  
  // Sauvegarder
  await saveSEO(tiktokSEO, `${videoId}-tiktok`);
  await saveSEO(youtubeSEO, `${videoId}-youtube`);
  
  console.log("\n  ✅ SEO généré avec succès !");
}

// Exporter pour utilisation dans d'autres modules
export default generateSEO;

// Exécuter si lancé directement
if (process.argv[1] && process.argv[1].includes("seo-generator")) {
  main().catch(console.error);
}
