import { Skia } from "@shopify/react-native-skia";

/** Bruit film grain procédural — pas de texture PNG, scale native par pixel. */
const SPECTRUM_BACKGROUND_SKSL = `
uniform float2 u_resolution;
uniform float u_grain;
uniform float u_density;
uniform half3 u_top;
uniform half3 u_mid;
uniform half3 u_bottom;

float hash21(float2 p) {
  return fract(sin(dot(p, float2(127.1, 311.7))) * 43758.5453123);
}

float filmGrain(float2 p) {
  float2 f = p * 0.92 * u_density;
  float n = hash21(floor(f));
  n += hash21(floor(f * 2.07) + 19.0) * 0.52;
  n += hash21(floor(f * 4.11) + 41.0) * 0.26;
  return n / 1.78;
}

half4 main(float2 xy) {
  float2 uv = xy / u_resolution;
  float t = uv.y;
  half3 col = mix(u_top, u_mid, smoothstep(0.0, 0.52, t));
  col = mix(col, u_bottom, smoothstep(0.48, 1.0, t));
  float g = filmGrain(xy);
  col += half((g - 0.5) * u_grain);
  return half4(col, 1.0);
}
`;

export const spectrumBackgroundEffect = Skia.RuntimeEffect.Make(SPECTRUM_BACKGROUND_SKSL);

export function hexToRgbUnit(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const r = Number.parseInt(h.slice(0, 2), 16) / 255;
  const g = Number.parseInt(h.slice(2, 4), 16) / 255;
  const b = Number.parseInt(h.slice(4, 6), 16) / 255;
  return [r, g, b];
}
