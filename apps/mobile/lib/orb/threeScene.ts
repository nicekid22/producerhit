import type { ExpoWebGLRenderingContext } from "expo-gl";
import * as THREE from "three";
import type { AudioLevels } from "./audioLevels";
import { smoothAudioLevels } from "./audioLevels";
import { isExpoGo } from "@/lib/expoRuntime";
import { dustyOrbPalette, type OrbPalette } from "./orbPalette";

export type OrbQuality = "small" | "medium" | "large";

export type AudioOrbScene = {
  render: (levels: AudioLevels, frame: number) => void;
  dispose: () => void;
  setSize: (width: number, height: number) => void;
};

type SceneConfig = {
  particleCount: number;
  ringCount: number;
  icoDetail: number;
  innerSegments: number;
  pointSize: number;
};

function qualityConfig(quality: OrbQuality): SceneConfig {
  if (quality === "small") {
    return { particleCount: 1400, ringCount: 360, icoDetail: 16, innerSegments: 48, pointSize: 2.4 };
  }
  if (quality === "medium") {
    return { particleCount: 1400, ringCount: 360, icoDetail: 16, innerSegments: 48, pointSize: 2.6 };
  }
  /** Aligné producerhit_orb_3d_audio.html — 3000 surface + 800 anneau. */
  return { particleCount: 3000, ringCount: 800, icoDetail: 32, innerSegments: 64, pointSize: 3 };
}

function orbQualityForSize(size: number): OrbQuality {
  if (size <= 48) return "small";
  if (isExpoGo()) {
    if (size <= 88) return "small";
    return "medium";
  }
  if (size <= 100) return "medium";
  return "large";
}

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

export function createAudioOrbScene(
  gl: ExpoWebGLRenderingContext,
  width: number,
  height: number,
  size: number,
  palette: OrbPalette = dustyOrbPalette(),
): AudioOrbScene {
  const quality = qualityConfig(orbQualityForSize(size));
  const renderer = createGlRenderer(gl);
  renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
  camera.position.z = 2.8;

  const geo = new THREE.IcosahedronGeometry(1, quality.icoDetail);
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
    transparent: true,
    opacity: 0.06,
  });
  const wireMesh = new THREE.Mesh(geo, wireMat);
  scene.add(wireMesh);

  const innerGeo = new THREE.SphereGeometry(0.82, quality.innerSegments, quality.innerSegments);
  const innerMat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: {
      time: { value: 0 },
      bass: { value: 0 },
      mid: { value: 0 },
      high: { value: 0 },
      colorA: { value: palette.colorA.clone() },
      colorB: { value: palette.colorB.clone() },
      colorC: { value: palette.colorC.clone() },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vPos;
      uniform float time;
      uniform float bass;
      uniform float mid;
      void main() {
        vNormal = normal;
        vec3 displaced = position;
        float disp = bass * 0.18 + mid * 0.08;
        float noise = sin(position.x * 4.0 + time * 2.0) * cos(position.y * 3.5 + time * 1.5) * sin(position.z * 4.2 + time * 1.8);
        displaced += normal * noise * disp;
        vPos = displaced;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vPos;
      uniform float time;
      uniform float bass;
      uniform float mid;
      uniform float high;
      uniform vec3 colorA;
      uniform vec3 colorB;
      uniform vec3 colorC;
      void main() {
        vec3 n = normalize(vNormal);
        float fresnel = pow(1.0 - abs(dot(n, vec3(0.0, 0.0, 1.0))), 3.0);
        float t1 = sin(vPos.x * 3.0 + time) * 0.5 + 0.5;
        float t2 = cos(vPos.y * 2.5 + time * 0.8) * 0.5 + 0.5;
        vec3 col = mix(colorA, colorB, t1);
        col = mix(col, colorC, t2 * high);
        col += colorB * bass * 0.4;
        col += colorC * mid * 0.3;
        float alpha = (0.35 + fresnel * 0.55 + bass * 0.15) * (0.6 + mid * 0.4);
        gl_FragColor = vec4(col * (0.8 + bass * 0.5 + mid * 0.3), alpha);
      }
    `,
  });
  const innerMesh = new THREE.Mesh(innerGeo, innerMat);
  scene.add(innerMesh);

  const PARTS = quality.particleCount;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(PARTS * 3);
  const pNorm = new Float32Array(PARTS * 3);
  const pPhase = new Float32Array(PARTS);
  const pLayer = new Float32Array(PARTS);

  for (let i = 0; i < PARTS; i += 1) {
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = Math.random() * Math.PI * 2;
    const rad = 1.05 + Math.random() * 0.08;
    pPos[i * 3] = rad * Math.sin(phi) * Math.cos(theta);
    pPos[i * 3 + 1] = rad * Math.sin(phi) * Math.sin(theta);
    pPos[i * 3 + 2] = rad * Math.cos(phi);
    pNorm[i * 3] = Math.sin(phi) * Math.cos(theta);
    pNorm[i * 3 + 1] = Math.sin(phi) * Math.sin(theta);
    pNorm[i * 3 + 2] = Math.cos(phi);
    pPhase[i] = Math.random() * Math.PI * 2;
    pLayer[i] = Math.random();
  }
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  pGeo.setAttribute("aNorm", new THREE.BufferAttribute(pNorm, 3));
  pGeo.setAttribute("aPhase", new THREE.BufferAttribute(pPhase, 1));
  pGeo.setAttribute("aLayer", new THREE.BufferAttribute(pLayer, 1));

  const pMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      time: { value: 0 },
      bass: { value: 0 },
      mid: { value: 0 },
      high: { value: 0 },
      size: { value: quality.pointSize },
      colorA: { value: palette.colorA.clone() },
      colorB: { value: palette.colorB.clone() },
      colorC: { value: palette.colorC.clone() },
    },
    vertexShader: `
      attribute vec3 aNorm;
      attribute float aPhase;
      attribute float aLayer;
      uniform float time;
      uniform float bass;
      uniform float mid;
      uniform float high;
      uniform float size;
      uniform vec3 colorA;
      uniform vec3 colorB;
      uniform vec3 colorC;
      varying float vBright;
      varying vec3 vCol;
      void main() {
        float pulse = bass * 0.22 + mid * 0.1;
        float wave = sin(aPhase + time * 2.0 + aLayer * 6.28) * (0.04 + pulse * 0.12);
        vec3 pos = position + aNorm * wave;
        float layer = aLayer;
        if (layer < 0.33) vCol = colorA * (0.85 + bass * 0.5);
        else if (layer < 0.66) vCol = colorB * (0.85 + mid * 0.5);
        else vCol = colorC * (0.85 + high * 0.4);
        vBright = 0.4 + 0.6 * (sin(aPhase + time * 1.5) * 0.5 + 0.5) + bass * 0.4 + mid * 0.2;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = size * (1.0 + bass * 1.5 + mid * 0.8) * (0.5 + aLayer * 0.8);
      }
    `,
    fragmentShader: `
      varying float vBright;
      varying vec3 vCol;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        if (d > 0.5) discard;
        float alpha = (1.0 - d * 2.0) * vBright;
        gl_FragColor = vec4(vCol * vBright, alpha);
      }
    `,
  });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  const RING = quality.ringCount;
  const rGeo = new THREE.BufferGeometry();
  const rPos = new Float32Array(RING * 3);
  const rPhase = new Float32Array(RING);
  for (let i = 0; i < RING; i += 1) {
    const t = (i / RING) * Math.PI * 2;
    const rad = 1.25 + Math.random() * 0.3;
    const tilt = (Math.random() - 0.5) * 0.4;
    rPos[i * 3] = rad * Math.cos(t);
    rPos[i * 3 + 1] = rad * Math.sin(t) * Math.cos(0.4) + tilt;
    rPos[i * 3 + 2] = rad * Math.sin(t) * Math.sin(0.4);
    rPhase[i] = Math.random() * Math.PI * 2;
  }
  rGeo.setAttribute("position", new THREE.BufferAttribute(rPos, 3));
  rGeo.setAttribute("aPhase", new THREE.BufferAttribute(rPhase, 1));
  const rMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      time: { value: 0 },
      bass: { value: 0 },
      mid: { value: 0 },
      high: { value: 0 },
      size: { value: quality.pointSize * 0.85 },
      ringColor: { value: palette.colorB.clone() },
      ringAccent: { value: palette.colorC.clone() },
    },
    vertexShader: `
      attribute float aPhase;
      uniform float time;
      uniform float bass;
      uniform float mid;
      uniform float high;
      uniform float size;
      varying float vA;
      void main() {
        float r = 1.25 + bass * 0.15 + mid * 0.08 + sin(aPhase + time * 3.0) * 0.06;
        float theta = atan(position.y, position.x) + time * 0.12;
        float phi = atan(position.z, length(position.xy));
        vec3 pos = vec3(r * cos(theta) * cos(phi), r * sin(theta) * cos(phi), r * sin(phi));
        vA = 0.3 + 0.7 * (sin(aPhase + time * 2.0) * 0.5 + 0.5) + bass * 0.5;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = size * (1.0 + bass * 2.0 + mid);
      }
    `,
    fragmentShader: `
      uniform vec3 ringColor;
      uniform vec3 ringAccent;
      varying float vA;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        if (d > 0.5) discard;
        vec3 col = mix(ringColor, ringAccent, vA);
        gl_FragColor = vec4(col, (1.0 - d * 2.0) * vA * 0.75);
      }
    `,
  });
  const ringParts = new THREE.Points(rGeo, rMat);
  scene.add(ringParts);

  scene.add(new THREE.AmbientLight(palette.ambient, 0.55));
  const light1 = new THREE.PointLight(palette.light1.getHex(), 3, 10);
  light1.position.set(2, 2, 2);
  scene.add(light1);
  const light2 = new THREE.PointLight(palette.light2.getHex(), 2, 10);
  light2.position.set(-2, -1, 1);
  scene.add(light2);
  const light3 = new THREE.PointLight(palette.light3.getHex(), 1.5, 10);
  light3.position.set(0, 2, -2);
  scene.add(light3);

  let smooth: AudioLevels = { bass: 0, mid: 0, high: 0, overall: 0 };
  let tiltY = 0;
  let tiltX = 0;

  return {
    setSize(w: number, h: number) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
    },
    render(levels: AudioLevels, frame: number) {
      const t = frame * 0.016;
      smooth = smoothAudioLevels(smooth, levels, 0.08);
      const sB = smooth.bass;
      const sM = smooth.mid;
      const sH = smooth.high;

      const targetX = Math.sin(t * 0.22) * 0.12;
      const targetY = t * 0.08 + Math.cos(t * 0.17) * 0.08;
      tiltX += (targetX - tiltX) * 0.04;
      tiltY += (targetY - tiltY) * 0.04;

      innerMesh.rotation.x = tiltX;
      innerMesh.rotation.y = tiltY;
      wireMesh.rotation.x = tiltX;
      wireMesh.rotation.y = tiltY;
      particles.rotation.x = tiltX * 0.5;
      particles.rotation.y = tiltY;
      ringParts.rotation.y = t * 0.05;
      ringParts.rotation.x = Math.sin(t * 0.3) * 0.15;

      innerMat.uniforms.time.value = t;
      innerMat.uniforms.bass.value = sB;
      innerMat.uniforms.mid.value = sM;
      innerMat.uniforms.high.value = sH;

      pMat.uniforms.time.value = t;
      pMat.uniforms.bass.value = sB;
      pMat.uniforms.mid.value = sM;
      pMat.uniforms.high.value = sH;

      rMat.uniforms.time.value = t;
      rMat.uniforms.bass.value = sB;
      rMat.uniforms.mid.value = sM;
      rMat.uniforms.high.value = sH;

      light1.intensity = 2.5 + sB * 3;
      light1.position.x = Math.cos(t * 0.7) * 2.5;
      light1.position.z = Math.sin(t * 0.7) * 2.5;
      light2.intensity = 1.5 + sM * 2;
      light2.position.y = Math.sin(t * 0.5) * 2;
      light3.intensity = 1.0 + sH * 1.5;

      const hB = sB * 0.35;
      const hM = sM * 0.25;
      const colorA = innerMat.uniforms.colorA.value as THREE.Color;
      const colorB = innerMat.uniforms.colorB.value as THREE.Color;
      const colorC = innerMat.uniforms.colorC.value as THREE.Color;
      colorA.copy(palette.colorA).offsetHSL(hB * 0.08, 0.05, hB * 0.12);
      colorB.copy(palette.colorB).offsetHSL(hM * 0.06, 0.04, hM * 0.1);
      colorC.copy(palette.colorC).offsetHSL(-hB * 0.05, 0.03, hB * 0.08);

      renderer.render(scene, camera);
      gl.endFrameEXP();
    },
    dispose() {
      geo.dispose();
      wireMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      pGeo.dispose();
      pMat.dispose();
      rGeo.dispose();
      rMat.dispose();
      renderer.dispose();
    },
  };
}
