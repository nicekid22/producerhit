/**

 * Stratégies de génération ×2 / clés ACE — opt-in via VITE_* (défaut = parallel adaptatif).

 * Voir ACE_DUAL_GENERATION.md

 */



import { nextAceKeyPreferIndex } from "@/lib/aceKeyRotation";

import { aceKeyIndexForGenerationSlot } from "@/lib/aceBrowserKeys";



/** Comment enchaîner v1 et v2 quand Versions = 2. */

export type DualGenerationMode = "sequential" | "parallel" | "batch";



/** Comment choisir la clé ACE entre les appels. */

export type AceKeyStrategy = "auto" | "slot" | "rotate";



function dualModeEnvRaw(): string | undefined {

  return (import.meta.env.VITE_ACE_DUAL_MODE as string | undefined)?.trim().toLowerCase();

}



/** `VITE_ACE_DUAL_MODE` défini explicitement → pas de chemin adaptatif par défaut. */

export function dualGenerationModeEnvLocked(): boolean {

  const raw = import.meta.env.VITE_ACE_DUAL_MODE as string | undefined;

  return raw !== undefined && raw !== null && String(raw).trim() !== "";

}



export function dualGenerationMode(): DualGenerationMode {

  const raw = dualModeEnvRaw();

  if (raw === "sequential") return "sequential";

  if (raw === "batch") return "batch";

  if (raw === "parallel") return "parallel";

  return "parallel";

}



/**

 * Chemin rapide quand le mode adaptatif est actif (pas de VITE_ACE_DUAL_MODE forcé).

 * `VITE_ACE_DUAL_FAST_PATH=batch` pour tenter 1 seul appel Edge (2 audios).

 */

export function dualGenerationFastPath(): DualGenerationMode {

  const raw = (import.meta.env.VITE_ACE_DUAL_FAST_PATH as string | undefined)?.trim().toLowerCase();

  if (raw === "batch") return "batch";

  if (raw === "sequential") return "sequential";

  if (import.meta.env.VITE_ACE_DUAL_BATCH_PROD === "1") return "batch";

  return "parallel";

}



/** Analytics / monitoring batch ×2 en prod. */

export function dualBatchProdMonitoringEnabled(): boolean {

  return import.meta.env.VITE_ACE_DUAL_BATCH_PROD === "1" || dualGenerationFastPath() === "batch";

}



/** Mode réellement utilisé pour le 1er essai (rapide si adaptatif, sinon env verrouillé). */

export function dualGenerationEffectiveMode(): DualGenerationMode {

  if (dualGenerationModeEnvLocked()) return dualGenerationMode();

  return dualGenerationFastPath();

}



/**

 * Après échec timeout / surcharge en mode rapide, relancer les slots manquants en séquentiel.

 * Rollback : `VITE_ACE_DUAL_NO_FALLBACK=1` ou `VITE_ACE_DUAL_ADAPTIVE=0`

 */

export function dualAdaptiveFallbackEnabled(): boolean {

  if (import.meta.env.VITE_ACE_DUAL_NO_FALLBACK === "1") return false;

  if (import.meta.env.VITE_ACE_DUAL_ADAPTIVE === "0") return false;

  if (dualGenerationModeEnvLocked() && dualGenerationMode() === "sequential") return false;

  return true;

}



export function aceKeyStrategy(): AceKeyStrategy {

  const raw = (import.meta.env.VITE_ACE_KEY_STRATEGY as string | undefined)?.trim().toLowerCase();

  if (raw === "slot") return "slot";

  if (raw === "rotate") return "rotate";

  return "auto";

}



/** Index ACE à envoyer à l'Edge (undefined = laisser audioApi / Edge décider). */

export function aceKeyPreferIndexForSlot(slotIdx?: 1 | 2, versions: 1 | 2 = 1): number | undefined {

  const strategy = aceKeyStrategy();

  if (strategy === "rotate") return nextAceKeyPreferIndex();

  if (strategy === "slot" && versions === 2 && (slotIdx === 1 || slotIdx === 2)) {

    return aceKeyIndexForGenerationSlot(slotIdx);

  }

  if (strategy === "auto" && versions === 2 && (slotIdx === 1 || slotIdx === 2)) {

    return aceKeyIndexForGenerationSlot(slotIdx);

  }

  return undefined;

}



/** Résumé pour logs / analytics (sans secrets). */

export function generationStrategySnapshot(versions: 1 | 2): Record<string, string | number> {

  const effective = versions === 2 ? dualGenerationEffectiveMode() : "single";

  return {

    versions,

    dual_mode: effective,

    dual_env_locked: dualGenerationModeEnvLocked() ? 1 : 0,

    dual_adaptive_fallback: versions === 2 && dualAdaptiveFallbackEnabled() ? 1 : 0,

    ace_key_strategy: aceKeyStrategy(),

    edge_timeout_ms: "off",

    v2_stagger_ms: dualGenerationStaggerMs(),

    parallel_stagger_ms: dualParallelStaggerMs(),

  };

}



/** Pause entre fin v1 et début v2 (ms) — mode sequential uniquement. */

export function dualGenerationStaggerMs(): number {

  const raw = import.meta.env.VITE_ACE_V2_STAGGER_MS;

  if (raw === "" || raw == null) return 2_500;

  const n = Number(raw);

  return Number.isFinite(n) && n >= 0 ? Math.min(n, 15_000) : 2_500;

}



/** Délai avant le démarrage de v2 en mode parallel (comme V4 OK). */

export function dualParallelStaggerMs(): number {

  const raw = import.meta.env.VITE_ACE_V2_PARALLEL_STAGGER_MS;

  if (raw === "" || raw == null) return 500;

  const n = Number(raw);

  return Number.isFinite(n) && n >= 0 ? Math.min(n, 15_000) : 500;

}



/**

 * Timeout client Edge — retiré : on laisse ACE / l'Edge finir (messages user via generationErrors).

 * @deprecated Toujours off.

 */

export function aceEdgeInvokeTimeoutMs(): undefined {

  return undefined;

}



/** @deprecated Préférer dualGenerationMode() === "batch" */

export function shouldTryAceDualBatch(): boolean {

  return dualGenerationMode() === "batch" || import.meta.env.VITE_ACE_DUAL_BATCH === "1";

}


