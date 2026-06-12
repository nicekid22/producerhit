/** Deterministic A/B bucket from loop id + experiment name. */

export function hashSeed(input: string): number {
  let h = 2166136261;
  const s = String(input ?? "x");
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pickAbVariant<T extends { id: string }>(
  seed: string,
  experiment: string,
  variants: T[],
): T {
  if (!variants.length) throw new Error("ab_no_variants");
  const idx = hashSeed(`${seed}:${experiment}`) % variants.length;
  return variants[idx]!;
}

export function fillTemplate(
  template: string,
  vars: Record<string, string | number | null | undefined>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const v = vars[key];
    if (v === null || v === undefined || v === "") return "";
    return String(v);
  }).replace(/\s+/g, " ").trim();
}
