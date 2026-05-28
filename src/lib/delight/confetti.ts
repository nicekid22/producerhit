const COLORS = ["#ff4fd8", "#67c3ff", "#a78bfa", "#22d3ee", "#a3ff12", "#ffd700", "#ff6b6b"];

type BurstOptions = {
  count?: number;
  originX?: number;
  originY?: number;
  duration?: number;
};

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function burstConfetti(options: BurstOptions = {}) {
  if (typeof window === "undefined" || prefersReducedMotion()) return;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:9998";
  document.body.appendChild(canvas);

  const count = options.count ?? 90;
  const originX = options.originX ?? 0.5;
  const originY = options.originY ?? 0.45;
  const maxFrames = options.duration ?? 110;

  type Particle = {
    x: number;
    y: number;
    vx: number;
    vy: number;
    w: number;
    h: number;
    color: string;
    rot: number;
    vr: number;
    life: number;
  };

  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: canvas.width * originX + (Math.random() - 0.5) * 80,
      y: canvas.height * originY,
      vx: (Math.random() - 0.5) * 14,
      vy: -(Math.random() * 16 + 5),
      w: Math.random() * 9 + 3,
      h: Math.random() * 7 + 2,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]!,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.35,
      life: 1,
    });
  }

  let frame = 0;
  const tick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = 0;
    for (const p of particles) {
      p.vy += 0.32;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life -= 1 / maxFrames;
      if (p.life <= 0) continue;
      alive++;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    frame++;
    if (frame < maxFrames && alive > 0) requestAnimationFrame(tick);
    else canvas.remove();
  };
  requestAnimationFrame(tick);
}

export function floatEmojis(emojis: string[], count = 12) {
  if (typeof window === "undefined" || prefersReducedMotion()) return;

  const root = document.createElement("div");
  root.className = "pk-emoji-rain";
  root.setAttribute("aria-hidden", "true");
  document.body.appendChild(root);

  for (let i = 0; i < count; i++) {
    const el = document.createElement("span");
    el.className = "pk-emoji-rain__item";
    el.textContent = emojis[i % emojis.length] ?? "✨";
    el.style.left = `${8 + Math.random() * 84}%`;
    el.style.animationDelay = `${Math.random() * 0.6}s`;
    el.style.animationDuration = `${1.8 + Math.random() * 1.2}s`;
    root.appendChild(el);
  }

  window.setTimeout(() => root.remove(), 3200);
}

export function screenFlash(variant: "violet" | "cyan" | "gold" = "violet") {
  if (typeof window === "undefined" || prefersReducedMotion()) return;

  const el = document.createElement("div");
  el.className = `pk-screen-flash pk-screen-flash--${variant}`;
  el.setAttribute("aria-hidden", "true");
  document.body.appendChild(el);
  window.setTimeout(() => el.remove(), 700);
}
