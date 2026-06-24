import type { ExpoWebGLRenderingContext } from "expo-gl";
import * as THREE from "three";
import type { AudioLevels } from "./audioLevels";
import { smoothAudioLevels } from "./audioLevels";
import { dustyOrbPalette, type OrbPalette } from "./orbPalette";

export type AudioBannerScene = {
  render: (levels: AudioLevels, frame: number) => void;
  dispose: () => void;
  setSize: (width: number, height: number) => void;
};

function createGlRenderer(gl: ExpoWebGLRenderingContext) {
  const renderer = new THREE.WebGLRenderer({
    canvas: {
      width: gl.drawingBufferWidth,
      height: gl.drawingBufferHeight,
      style: {},
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      clientHeight: gl.drawingBufferHeight,
      clientWidth: gl.drawingBufferWidth,
    } as unknown as HTMLCanvasElement,
    context: gl as unknown as WebGLRenderingContext,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(1);
  renderer.setClearColor(0x000000, 0);
  return renderer;
}

/** Bannière horizontale — flux neuronal / onde audio-réactive (studio hero). */
export function createAudioBannerScene(
  gl: ExpoWebGLRenderingContext,
  width: number,
  height: number,
  palette: OrbPalette = dustyOrbPalette(),
): AudioBannerScene {
  const renderer = createGlRenderer(gl);
  renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);

  const scene = new THREE.Scene();
  let aspect = Math.max(width / Math.max(height, 1), 2);
  const halfH = 1.05;
  let halfW = halfH * aspect;
  const camera = new THREE.OrthographicCamera(-halfW, halfW, halfH, -halfH, 0.1, 20);
  camera.position.z = 6;

  const RIBBON = 880;
  const DUST = 220;
  const worldW = halfW * 2;

  function buildRibbon(count: number, spread: number) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const phase = new Float32Array(count);
    const layer = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      const t = i / Math.max(count - 1, 1);
      const x = (t - 0.5) * worldW;
      pos[i * 3] = x;
      pos[i * 3 + 1] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.12;
      phase[i] = Math.random() * Math.PI * 2;
      layer[i] = t;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    geo.setAttribute("aLayer", new THREE.BufferAttribute(layer, 1));
    return geo;
  }

  const ribbonGeo = buildRibbon(RIBBON, 0.04);
  const ribbonMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      time: { value: 0 },
      bass: { value: 0 },
      mid: { value: 0 },
      high: { value: 0 },
      think: { value: 0 },
      colorA: { value: palette.colorA.clone() },
      colorB: { value: palette.colorB.clone() },
      colorC: { value: palette.colorC.clone() },
      pointScale: { value: Math.max(1.8, height / 36) },
    },
    vertexShader: `
      attribute float aPhase;
      attribute float aLayer;
      uniform float time;
      uniform float bass;
      uniform float mid;
      uniform float high;
      uniform float think;
      uniform float pointScale;
      varying vec3 vCol;
      varying float vAlpha;
      void main() {
        float x = position.x;
        float pulse = think * sin(time * 3.2 + aPhase * 2.0) * 0.12;
        float w1 = sin(x * 1.35 + time * 2.1 + aPhase) * (0.18 + bass * 0.42);
        float w2 = sin(x * 2.8 - time * 1.65 + aPhase * 0.5) * (0.09 + mid * 0.28);
        float w3 = cos(x * 4.2 + time * 3.4 + aLayer * 6.28) * (0.05 + high * 0.22);
        float y = w1 + w2 + w3 + pulse;
        float z = sin(aLayer * 9.0 + time * 1.2) * 0.06;
        vec3 p = vec3(x, y, z);
        float layer = aLayer;
        if (layer < 0.33) vCol = mix(vec3(0.55, 0.25, 0.45), vec3(1.0), bass * 0.5);
        else if (layer < 0.66) vCol = mix(vec3(0.45, 0.32, 0.62), vec3(1.0), mid * 0.45);
        else vCol = mix(vec3(0.65, 0.5, 0.82), vec3(1.0), high * 0.4);
        vAlpha = 0.45 + 0.55 * (sin(aPhase + time * 1.6) * 0.5 + 0.5) + bass * 0.35;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = pointScale * (0.7 + bass * 1.8 + mid * 1.1 + think * 0.6);
      }
    `,
    fragmentShader: `
      varying vec3 vCol;
      varying float vAlpha;
      uniform vec3 colorA;
      uniform vec3 colorB;
      uniform vec3 colorC;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        if (d > 0.5) discard;
        float core = 1.0 - smoothstep(0.0, 0.5, d);
        vec3 col = mix(colorA, colorB, vCol.r) * vCol;
        col = mix(col, colorC, vCol.b * 0.35);
        gl_FragColor = vec4(col, core * vAlpha * 0.92);
      }
    `,
  });
  const ribbon = new THREE.Points(ribbonGeo, ribbonMat);
  scene.add(ribbon);

  const dustGeo = buildRibbon(DUST, 0.55);
  const dustMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      time: { value: 0 },
      bass: { value: 0 },
      think: { value: 0 },
      colorB: { value: palette.colorB.clone() },
      pointScale: { value: Math.max(1.2, height / 48) },
    },
    vertexShader: `
      attribute float aPhase;
      attribute float aLayer;
      uniform float time;
      uniform float bass;
      uniform float think;
      uniform float pointScale;
      varying float vA;
      void main() {
        float x = position.x + sin(time * 0.4 + aPhase) * 0.08;
        float y = position.y + cos(time * 0.55 + aLayer * 8.0) * (0.15 + think * 0.1);
        vA = 0.12 + 0.2 * bass + think * 0.08;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(x, y, position.z, 1.0);
        gl_PointSize = pointScale * 0.65;
      }
    `,
    fragmentShader: `
      varying float vA;
      uniform vec3 colorB;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        if (d > 0.5) discard;
        float a = (1.0 - d * 2.0) * vA;
        gl_FragColor = vec4(colorB, a);
      }
    `,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  const glowGeo = new THREE.PlaneGeometry(worldW * 0.92, 0.35, 1, 1);
  const glowMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      time: { value: 0 },
      bass: { value: 0 },
      mid: { value: 0 },
      think: { value: 0 },
      colorA: { value: palette.colorA.clone() },
      colorC: { value: palette.colorC.clone() },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float time;
      uniform float bass;
      uniform float mid;
      uniform float think;
      uniform vec3 colorA;
      uniform vec3 colorC;
      void main() {
        float cx = abs(vUv.x - 0.5) * 2.0;
        float scan = sin(vUv.x * 24.0 - time * 4.0) * 0.5 + 0.5;
        float band = exp(-cx * cx * (1.8 - bass * 0.6));
        float yFade = 1.0 - abs(vUv.y - 0.5) * 2.0;
        vec3 col = mix(colorA, colorC, scan * 0.35 + mid * 0.25 + think * 0.2);
        float alpha = band * yFade * (0.08 + bass * 0.18 + think * 0.12);
        gl_FragColor = vec4(col, alpha);
      }
    `,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.y = -0.05;
  scene.add(glow);

  let smooth: AudioLevels = { bass: 0, mid: 0, high: 0, overall: 0 };
  let thinkTarget = 0;
  let thinkSmooth = 0;

  return {
    setSize(w: number, h: number) {
      aspect = Math.max(w / Math.max(h, 1), 2);
      halfW = halfH * aspect;
      camera.left = -halfW;
      camera.right = halfW;
      camera.updateProjectionMatrix();
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      ribbonMat.uniforms.pointScale.value = Math.max(1.8, h / 36);
      dustMat.uniforms.pointScale.value = Math.max(1.2, h / 48);
      glow.scale.x = (halfW * 2 * 0.92) / worldW;
    },
    render(levels: AudioLevels, frame: number) {
      const t = frame * 0.016;
      smooth = smoothAudioLevels(smooth, levels, 0.1);
      thinkTarget = levels.overall > 0.2 ? 1 : 0.35;
      thinkSmooth += (thinkTarget - thinkSmooth) * 0.06;

      ribbonMat.uniforms.time.value = t;
      ribbonMat.uniforms.bass.value = smooth.bass;
      ribbonMat.uniforms.mid.value = smooth.mid;
      ribbonMat.uniforms.high.value = smooth.high;
      ribbonMat.uniforms.think.value = thinkSmooth;

      dustMat.uniforms.time.value = t;
      dustMat.uniforms.bass.value = smooth.bass;
      dustMat.uniforms.think.value = thinkSmooth;

      glowMat.uniforms.time.value = t;
      glowMat.uniforms.bass.value = smooth.bass;
      glowMat.uniforms.mid.value = smooth.mid;
      glowMat.uniforms.think.value = thinkSmooth;

      ribbon.rotation.z = Math.sin(t * 0.15) * 0.02;
      dust.rotation.z = Math.sin(t * 0.1) * 0.03;

      renderer.render(scene, camera);
      gl.endFrameEXP();
    },
    dispose() {
      ribbonGeo.dispose();
      ribbonMat.dispose();
      dustGeo.dispose();
      dustMat.dispose();
      glowGeo.dispose();
      glowMat.dispose();
      renderer.dispose();
    },
  };
}
