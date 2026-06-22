let extendedAceTags: Record<string, string> = {};
let extendedBpm: Record<string, number> = {};
let extraMoodMap: Record<string, string> = {};
let extraInfluenceMap: Record<string, string> = {};

export function registerGenerationCatalogExtensions(opts: {
  aceTags?: Record<string, string>;
  bpm?: Record<string, number>;
  moodMap?: Record<string, string>;
  influenceMap?: Record<string, string>;
}): void {
  if (opts.aceTags) extendedAceTags = { ...opts.aceTags };
  if (opts.bpm) extendedBpm = { ...opts.bpm };
  if (opts.moodMap) extraMoodMap = { ...opts.moodMap };
  if (opts.influenceMap) extraInfluenceMap = { ...opts.influenceMap };
}

export function getExtendedAceTagMap(): Record<string, string> {
  return extendedAceTags;
}

export function getExtendedBpmMap(): Record<string, number> {
  return extendedBpm;
}

export function getMoodMap(): Record<string, string> {
  return extraMoodMap;
}

export function getInfluenceMap(): Record<string, string> {
  return extraInfluenceMap;
}
