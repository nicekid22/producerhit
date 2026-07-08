/**
 * Alibaba DashScope Video Generator — ProducerHit
 *
 * Modèles: wan2.7-i2v (premium) + wan2.1-i2v-turbo (fallback)
 */

function getBaseUrl() {
  return (
    process.env.DASHSCOPE_BASE_URL ||
    "https://ws-pvflvhdk03o5bi2y.ap-southeast-1.maas.aliyuncs.com/api/v1"
  );
}

function getApiKey() {
  return process.env.DASHSCOPE_API_KEY || "";
}

function assertApiKey() {
  const key = getApiKey();
  if (!key) throw new Error("DASHSCOPE_API_KEY non configuré dans .env");
  return key;
}

const MODELS = {
  premium: "wan2.7-i2v-2026-04-25",
  fallback: "wan2.1-i2v-turbo",
};

export async function submitVideoGeneration(opts) {
  const apiKey = assertApiKey();
  const baseUrl = getBaseUrl();

  const {
    imageUrl,
    prompt = "",
    negativePrompt = "",
    duration = 5,
    resolution = "720P",
    promptExtend = true,
    model = MODELS.premium,
  } = opts;

  if (!imageUrl) throw new Error("imageUrl requis");

  let body;

  if (model === MODELS.premium) {
    body = {
      model: MODELS.premium,
      input: {
        prompt: prompt.slice(0, 5000),
        media: [{ type: "first_frame", url: imageUrl }],
      },
      parameters: {
        resolution,
        duration,
        prompt_extend: promptExtend,
        watermark: false,
      },
    };
    if (negativePrompt) {
      body.input.negative_prompt = negativePrompt.slice(0, 500);
    }
  } else {
    body = {
      model: MODELS.fallback,
      input: {
        img_url: imageUrl,
        prompt: prompt.slice(0, 800),
      },
      parameters: {
        resolution,
        duration,
        prompt_extend: promptExtend,
      },
    };
    if (negativePrompt) {
      body.input.negative_prompt = negativePrompt.slice(0, 500);
    }
  }

  console.log(`  [DashScope] Soumission du job...`);
  console.log(`  [DashScope] Modèle: ${body.model} | Durée: ${duration}s | Résolution: ${resolution}`);

  const res = await fetch(`${baseUrl}/services/aigc/video-generation/video-synthesis`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "X-DashScope-Async": "enable",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok || data.code) {
    const errMsg = data.message || data.msg || JSON.stringify(data);
    throw new Error(`DashScope erreur ${res.status}: ${errMsg}`);
  }

  const taskId = data.output?.task_id;
  if (!taskId) {
    throw new Error(`DashScope: pas de task_id: ${JSON.stringify(data)}`);
  }

  console.log(`  [DashScope] Job soumis: ${taskId}`);
  return { taskId, model: body.model };
}

export async function pollVideoStatus(taskId, opts = {}) {
  const apiKey = assertApiKey();
  const baseUrl = getBaseUrl();

  const { intervalMs = 10_000, maxWaitMs = 300_000 } = opts;
  const startTime = Date.now();

  console.log(`  [DashScope] Polling job ${taskId}...`);

  while (Date.now() - startTime < maxWaitMs) {
    const res = await fetch(`${baseUrl}/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(`DashScope poll erreur ${res.status}: ${JSON.stringify(data)}`);
    }

    const status = data.output?.task_status;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);

    if (status === "SUCCEEDED") {
      const videoUrl = data.output?.video_url;
      console.log(`  [DashScope] ✅ Terminé en ${elapsed}s`);
      return { status: "SUCCEEDED", videoUrl };
    }

    if (status === "FAILED") {
      const failReason = data.output?.code || data.output?.message || "unknown";
      console.log(`  [DashScope] ❌ Échec: ${failReason}`);
      return { status: "FAILED", failReason };
    }

    if (status === "CANCELED") {
      return { status: "CANCELED" };
    }

    console.log(`  [DashScope] ⏳ ${status || "PENDING"}... (${elapsed}s écoulées)`);
    await new Promise((r) => setTimeout(r, intervalMs));
  }

  throw new Error(`DashScope timeout: job ${taskId} non terminé après ${maxWaitMs / 1000}s`);
}

export async function generateVideoFromImage(opts) {
  const { useFallback = true, ...submitOpts } = opts;

  try {
    console.log(`\n  [DashScope] Tentative avec ${MODELS.premium}...`);
    const { taskId, model } = await submitVideoGeneration({
      ...submitOpts,
      model: MODELS.premium,
    });

    const result = await pollVideoStatus(taskId, {
      maxWaitMs: submitOpts.resolution === "1080P" ? 600_000 : 300_000,
    });

    if (result.status === "SUCCEEDED" && result.videoUrl) {
      return { videoUrl: result.videoUrl, taskId, model };
    }

    if (useFallback) {
      console.log(`  [DashScope] ⚠️ ${MODELS.premium} échoué, fallback vers ${MODELS.fallback}...`);
    } else {
      throw new Error(`Échec: ${result.failReason || result.status}`);
    }
  } catch (e) {
    if (!useFallback) throw e;
    console.log(`  [DashScope] ⚠️ ${MODELS.premium}: ${e.message}`);
    console.log(`  [DashScope] Fallback vers ${MODELS.fallback}...`);
  }

  const { taskId, model } = await submitVideoGeneration({
    ...submitOpts,
    model: MODELS.fallback,
  });

  const result = await pollVideoStatus(taskId);

  if (result.status !== "SUCCEEDED" || !result.videoUrl) {
    throw new Error(`Échec tous modèles: ${result.failReason || result.status}`);
  }

  return { videoUrl: result.videoUrl, taskId, model };
}

export async function downloadVideo(url) {
  console.log(`  [DashScope] Téléchargement vidéo...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Téléchargement échoué: HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  console.log(`  [DashScope] Vidéo téléchargée (${(buffer.byteLength / 1024 / 1024).toFixed(1)} MB)`);
  return buffer;
}

export async function generateMultipleVideos(scenes, opts = {}) {
  console.log(`\n🎬 Génération de ${scenes.length} vidéos...\n`);
  const results = [];
  for (const scene of scenes) {
    const result = await generateVideoFromImage({
      imageUrl: scene.imageUrl,
      prompt: scene.prompt,
      duration: scene.duration ?? opts.duration ?? 5,
      resolution: opts.resolution ?? "720P",
    });
    results.push({
      filename: scene.filename,
      videoUrl: result.videoUrl,
      taskId: result.taskId,
      model: result.model,
    });
    console.log(`  ✅ ${scene.filename} (${result.model})\n`);
  }
  return results;
}
