/**
 * Pollinations Image Generator — ProducerHit
 *
 * Génère des images fixes via l'API gratuite de Pollinations.
 * Utilisé pour créer les frames des storyboards avant animation vidéo.
 *
 * Usage: node scripts/test-alibaba-pipeline.mjs
 */

const POLLINATIONS_IMAGE_URL = "https://image.pollinations.ai/prompt";

/**
 * Génère une image via Pollinations
 * @param {string} prompt - Description de l'image
 * @param {object} opts
 * @param {number} [opts.width=1080] - Largeur en pixels
 * @param {number} [opts.height=1920] - Hauteur en pixels (9:16 par défaut)
 * @param {number} [opts.seed=42] - Seed pour reproductibilité
 * @param {boolean} [opts.nologo=true] - Masquer le logo Pollinations
 * @returns {Promise<Buffer>} Buffer de l'image JPEG/PNG
 */
export async function generatePollinationsImage(prompt, opts = {}) {
  const {
    width = 1080,
    height = 1920,
    seed = Math.floor(Math.random() * 999999),
    nologo = true,
  } = opts;

  const encodedPrompt = encodeURIComponent(prompt);
  const params = new URLSearchParams({
    width: String(width),
    height: String(height),
    seed: String(seed),
    nologo: String(nologo),
  });

  const url = `${POLLINATIONS_IMAGE_URL}/${encodedPrompt}?${params.toString()}`;

  console.log(`  [Pollinations] Génération image...`);
  console.log(`  [Pollinations] Prompt: ${prompt.slice(0, 80)}...`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);

  try {
    const res = await fetch(url, { signal: controller.signal });

    if (!res.ok) {
      throw new Error(`Pollinations HTTP ${res.status}: ${await res.text().catch(() => "")}`);
    }

    const contentType = (res.headers.get("content-type") ?? "").toLowerCase();
    if (!contentType.includes("image")) {
      throw new Error(`Pollinations a retourné ${contentType} au lieu d'une image`);
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.byteLength < 1000) {
      throw new Error(`Image trop petite (${buffer.byteLength} bytes)`);
    }

    console.log(`  [Pollinations] Image générée (${(buffer.byteLength / 1024).toFixed(0)} KB)`);
    return buffer;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("abort")) {
      throw new Error("Pollinations timeout (60s dépassé)");
    }
    throw new Error(`Pollinations erreur: ${msg}`);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Génère plusieurs images en parallèle
 * @param {Array<{prompt: string, filename: string, seed?: number}>} scenes
 * @param {object} opts - Options communes (width, height)
 * @returns {Promise<Array<{filename: string, buffer: Buffer}>>}
 */
export async function generateMultipleImages(scenes, opts = {}) {
  console.log(`\n📸 Génération de ${scenes.length} images via Pollinations...\n`);

  const results = await Promise.all(
    scenes.map(async (scene) => {
      const buffer = await generatePollinationsImage(scene.prompt, {
        ...opts,
        seed: scene.seed ?? 42,
      });
      return { filename: scene.filename, buffer };
    })
  );

  console.log(`\n✅ ${results.length} images générées avec succès\n`);
  return results;
}
