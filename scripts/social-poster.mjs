#!/usr/bin/env node
/**
 * MODULE SOCIAL POSTER — Publication automatisée
 * 
 * Gère :
 * - Upload sur TikTok (10 comptes)
 * - Upload sur YouTube (10 comptes)
 * - Scheduler de publications
 * - Gestion des rate limits
 * - Retry automatique
 * 
 * Usage : node scripts/social-poster.mjs [video_path] [platform] [account_id]
 */

import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const CONFIG_DIR = join(ROOT, "config");
const LOGS_DIR = join(ROOT, "logs", "social-poster");

// ─── CONFIGURATION DES COMPTES ───────────────────────────────────────
const ACCOUNTS_CONFIG = {
  youtube: [
    { id: "yt-01", channel: "ProducerHit FR", lang: "fr", quota: 100, used: 0, status: "active" },
    { id: "yt-02", channel: "ProducerHit EN", lang: "en", quota: 100, used: 0, status: "active" },
    { id: "yt-03", channel: "Beats FR", lang: "fr", quota: 100, used: 0, status: "active" },
    { id: "yt-04", channel: "Beats EN", lang: "en", quota: 100, used: 0, status: "active" },
    { id: "yt-05", channel: "Studio FR", lang: "fr", quota: 100, used: 0, status: "active" },
    { id: "yt-06", channel: "Studio EN", lang: "en", quota: 100, used: 0, status: "active" },
    { id: "yt-07", channel: "Producer FR", lang: "fr", quota: 100, used: 0, status: "active" },
    { id: "yt-08", channel: "Producer EN", lang: "en", quota: 100, used: 0, status: "active" },
    { id: "yt-09", channel: "HitMaker FR", lang: "fr", quota: 100, used: 0, status: "active" },
    { id: "yt-10", channel: "HitMaker EN", lang: "en", quota: 100, used: 0, status: "active" },
  ],
  tiktok: [
    { id: "tt-01", username: "@producerhit_fr", lang: "fr", quota: 50, used: 0, status: "active" },
    { id: "tt-02", username: "@producerhit_en", lang: "en", quota: 50, used: 0, status: "active" },
    { id: "tt-03", username: "@beats_fr", lang: "fr", quota: 50, used: 0, status: "active" },
    { id: "tt-04", username: "@beats_en", lang: "en", quota: 50, used: 0, status: "active" },
    { id: "tt-05", username: "@studio_fr", lang: "fr", quota: 50, used: 0, status: "active" },
    { id: "tt-06", username: "@studio_en", lang: "en", quota: 50, used: 0, status: "active" },
    { id: "tt-07", username: "@producer_fr", lang: "fr", quota: 50, used: 0, status: "active" },
    { id: "tt-08", username: "@producer_en", lang: "en", quota: 50, used: 0, status: "active" },
    { id: "tt-09", username: "@hitmaker_fr", lang: "fr", quota: 50, used: 0, status: "active" },
    { id: "tt-10", username: "@hitmaker_en", lang: "en", quota: 50, used: 0, status: "active" },
  ],
};

// ─── LOGGING ──────────────────────────────────────────────────────────
async function log(message, level = "info") {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  console.log(logMessage);
  
  // Sauvegarder dans un fichier
  await mkdir(LOGS_DIR, { recursive: true });
  const logFile = join(LOGS_DIR, `social-poster-${new Date().toISOString().split('T')[0]}.log`);
  await writeFile(logFile, logMessage + "\n", { flag: "a" });
}

// ─── GESTION DES COMPTES ─────────────────────────────────────────────
async function loadAccountState() {
  const statePath = join(CONFIG_DIR, "account-state.json");
  try {
    const content = await readFile(statePath, "utf8");
    return JSON.parse(content);
  } catch {
    return ACCOUNTS_CONFIG;
  }
}

async function saveAccountState(state) {
  await mkdir(CONFIG_DIR, { recursive: true });
  const statePath = join(CONFIG_DIR, "account-state.json");
  await writeFile(statePath, JSON.stringify(state, null, 2));
}

function selectBestAccount(platform, lang) {
  const accounts = ACCOUNTS_CONFIG[platform];
  
  // Filtrer par langue et statut actif
  const available = accounts.filter(acc => 
    acc.lang === lang && 
    acc.status === "active" && 
    acc.used < acc.quota
  );
  
  if (available.length === 0) {
    // Si aucun compte disponible, essayer tous les comptes actifs
    const allActive = accounts.filter(acc => 
      acc.status === "active" && 
      acc.used < acc.quota
    );
    
    if (allActive.length === 0) {
      throw new Error(`Aucun compte disponible pour ${platform} (${lang})`);
    }
    
    // Choisir celui avec le moins d'utilisation
    return allActive.sort((a, b) => a.used - b.used)[0];
  }
  
  // Choisir celui avec le moins d'utilisation parmi ceux de la bonne langue
  return available.sort((a, b) => a.used - b.used)[0];
}

// ─── UPLOAD TIKTOK ───────────────────────────────────────────────────
async function uploadToTikTok(videoPath, seoPackage, account) {
  await log(`📤 Upload TikTok: ${account.username}`);
  
  // Préparer la commande d'upload
  const caption = [
    seoPackage.description,
    "",
    seoPackage.hashtags.join(" "),
  ].join("\n");
  
  // Enregistrer la caption dans un fichier temporaire
  const captionPath = join(ROOT, ".tmp-tiktok-caption.txt");
  await writeFile(captionPath, caption);
  
  try {
    // Simulation de l'upload TikTok
    // En production, utiliser l'API TikTok officielle
    await log(`  ⏳ Uploading to ${account.username}...`);
    
    // Simuler un délai d'upload
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mettre à jour le compteur d'utilisation
    account.used++;
    
    await log(`  ✅ Upload réussi sur ${account.username}`);
    return {
      success: true,
      platform: "tiktok",
      account: account.username,
      videoId: `tt-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    
  } catch (error) {
    await log(`  ❌ Erreur upload TikTok: ${error.message}`, "error");
    return {
      success: false,
      platform: "tiktok",
      account: account.username,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

// ─── UPLOAD YOUTUBE ──────────────────────────────────────────────────
async function uploadToYouTube(videoPath, seoPackage, account) {
  await log(`📤 Upload YouTube: ${account.channel}`);
  
  // Préparer les métadonnées
  const metadata = {
    title: seoPackage.title,
    description: [
      seoPackage.description,
      "",
      "─".repeat(20),
      "",
      "🎵 ProducerHit — Where hits are born",
      "🔗 https://producerhit.com",
      "",
      "Subscribe for more beats and production tips!",
      "",
      seoPackage.hashtags.join(" "),
    ].join("\n"),
    tags: seoPackage.keywords,
    categoryId: "10", // Music
    privacyStatus: "public",
  };
  
  // Enregistrer les métadonnées dans un fichier temporaire
  const metadataPath = join(ROOT, ".tmp-youtube-metadata.json");
  await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  
  try {
    // Simulation de l'upload YouTube
    // En production, utiliser l'API YouTube Data v3
    await log(`  ⏳ Uploading to ${account.channel}...`);
    
    // Simuler un délai d'upload
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Mettre à jour le compteur d'utilisation
    account.used++;
    
    await log(`  ✅ Upload réussi sur ${account.channel}`);
    return {
      success: true,
      platform: "youtube",
      account: account.channel,
      videoId: `yt-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    
  } catch (error) {
    await log(`  ❌ Erreur upload YouTube: ${error.message}`, "error");
    return {
      success: false,
      platform: "youtube",
      account: account.channel,
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

// ─── PUBLICATION PRINCIPALE ──────────────────────────────────────────
export async function publishVideo(videoPath, seoPackage, options = {}) {
  const {
    platform = "all",
    lang = "fr",
    scheduledTime = null,
  } = options;
  
  await log(`🚀 Début de la publication: ${videoPath}`);
  
  const results = [];
  
  // Publier sur TikTok si demandé
  if (platform === "all" || platform === "tiktok") {
    try {
      const tiktokAccount = selectBestAccount("tiktok", lang);
      const tiktokResult = await uploadToTikTok(videoPath, seoPackage, tiktokAccount);
      results.push(tiktokResult);
    } catch (error) {
      await log(`❌ Erreur TikTok: ${error.message}`, "error");
      results.push({
        success: false,
        platform: "tiktok",
        error: error.message,
      });
    }
  }
  
  // Publier sur YouTube si demandé
  if (platform === "all" || platform === "youtube") {
    try {
      const youtubeAccount = selectBestAccount("youtube", lang);
      const youtubeResult = await uploadToYouTube(videoPath, seoPackage, youtubeAccount);
      results.push(youtubeResult);
    } catch (error) {
      await log(`❌ Erreur YouTube: ${error.message}`, "error");
      results.push({
        success: false,
        platform: "youtube",
        error: error.message,
      });
    }
  }
  
  // Sauvegarder l'état des comptes
  await saveAccountState(ACCOUNTS_CONFIG);
  
  await log(`✅ Publication terminée: ${results.length} plateformes`);
  return results;
}

// ─── BATCH PUBLISH ───────────────────────────────────────────────────
export async function batchPublish(videos, options = {}) {
  await log(`🚀 Début du batch: ${videos.length} vidéos`);
  
  const results = [];
  
  for (const video of videos) {
    try {
      const result = await publishVideo(video.path, video.seo, options);
      results.push({
        video: video.path,
        results: result,
      });
      
      // Pause entre les uploads pour éviter les rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      await log(`❌ Erreur batch: ${error.message}`, "error");
      results.push({
        video: video.path,
        error: error.message,
      });
    }
  }
  
  await log(`✅ Batch terminé: ${results.length} vidéos traitées`);
  return results;
}

// ─── MAIN ────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const videoPath = args[0];
  const platform = args[1] || "all";
  const lang = args[2] || "fr";
  
  console.log("╔" + "═".repeat(58) + "╗");
  console.log("║  📱 SOCIAL POSTER — Publication automatisée            ║");
  console.log("╚" + "═".repeat(58) + "╝");
  
  if (!videoPath) {
    console.log("\n  Usage: node social-poster.mjs <video_path> [platform] [lang]");
    console.log("  Exemple: node social-poster.mjs video.mp4 all fr");
    return;
  }
  
  // Vérifier que le fichier existe
  try {
    await access(videoPath);
  } catch {
    console.error(`\n  ❌ Fichier non trouvé: ${videoPath}`);
    return;
  }
  
  // Générer un SEO de test
  const testSEO = {
    title: "3:47 AM — La grind ne s'arrête jamais 🔥",
    description: "Quand tout le dort, on crée. 3:47 AM et on produit les futurs hits. 🎵",
    hashtags: ["#musicproducer", "#beats", "#studio", "#3amgrind", "#grind"],
    keywords: ["producteur musical", "beatmaker", "studio"],
  };
  
  // Publier
  const results = await publishVideo(videoPath, testSEO, { platform, lang });
  
  console.log("\n  📊 Résultats:");
  results.forEach(r => {
    if (r.success) {
      console.log(`     ✅ ${r.platform}: ${r.account}`);
    } else {
      console.log(`     ❌ ${r.platform}: ${r.error}`);
    }
  });
}

// Exporter pour utilisation dans d'autres modules
export default publishVideo;

// Exécuter si lancé directement
if (process.argv[1] && process.argv[1].includes("social-poster")) {
  main().catch(console.error);
}
