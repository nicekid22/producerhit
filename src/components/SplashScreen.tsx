import { useEffect, useRef, useState } from "react";

const SPLASH_MIN_MS = 1400;
const SPLASH_MAX_MS = 2800;
const FADE_MS = 400;

/**
 * Minimal splash screen shown once per session on first visit.
 * Plays a soft chime via Web Audio API and fades out after content loads.
 */
export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const dismissed = useRef(false);

  useEffect(() => {
    // Only show once per session
    if (sessionStorage.getItem("pk-splash-seen")) {
      setVisible(false);
      return;
    }

    // Play the chime
    playChime();

    // Start fade after min display time + when window is loaded
    const minTimer = setTimeout(() => {
      if (document.readyState === "complete") {
        startFade();
      }
    }, SPLASH_MIN_MS);

    // Fallback: force dismiss after max
    const maxTimer = setTimeout(() => {
      startFade();
    }, SPLASH_MAX_MS);

    // Also listen for full load
    const onLoad = () => {
      if (Date.now() - performance.timing.navigationStart > SPLASH_MIN_MS) {
        startFade();
      }
    };
    window.addEventListener("load", onLoad);

    function startFade() {
      if (dismissed.current) return;
      dismissed.current = true;
      setFading(true);
      setTimeout(() => {
        setVisible(false);
        sessionStorage.setItem("pk-splash-seen", "1");
      }, FADE_MS);
    }

    return () => {
      clearTimeout(minTimer);
      clearTimeout(maxTimer);
      window.removeEventListener("load", onLoad);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="pk-splash fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: "radial-gradient(ellipse at 50% 40%, #0d0b14 0%, #08070e 100%)",
        opacity: fading ? 0 : 1,
        transition: `opacity ${FADE_MS}ms ease-out`,
        pointerEvents: fading ? "none" : "auto",
      }}
      aria-hidden="true"
    >
      <div
        className="pk-splash__inner flex flex-col items-center gap-4"
        style={{
          animation: "pkSplashPulse 1.8s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        }}
      >
        {/* Glow ring */}
        <div
          className="absolute -inset-12 rounded-full opacity-30 blur-3xl"
          style={{
            background: "radial-gradient(circle, rgba(168,85,247,0.4) 0%, transparent 70%)",
            animation: "pkSplashGlow 1.8s ease-in-out forwards",
          }}
        />
        {/* Logo icon — audio wave mark */}
        <svg
          className="relative"
          width="56"
          height="56"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <rect width="32" height="32" rx="8" fill="#0a0a0f" />
          <rect width="32" height="32" rx="8" fill="url(#splash-bg)" opacity="0.9" />
          <defs>
            <linearGradient id="splash-bg" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
              <stop stopColor="#c026d3" stopOpacity="0.2" />
              <stop offset="1" stopColor="#7c3aed" stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id="splash-wave" x1="6" y1="8" x2="26" y2="24" gradientUnits="userSpaceOnUse">
              <stop stopColor="#d946ef" />
              <stop offset="0.45" stopColor="#a855f7" />
              <stop offset="1" stopColor="#818cf8" />
            </linearGradient>
          </defs>
          <g stroke="url(#splash-wave)" strokeWidth="2.1" strokeLinecap="round" transform="translate(4 5.5)">
            <path d="M2 10v3" />
            <path d="M6 6v11" />
            <path d="M10 3v18" />
            <path d="M14 8v7" />
            <path d="M18 5v13" />
            <path d="M22 10v3" />
          </g>
        </svg>
      </div>
    </div>
  );
}

/**
 * Generate a soft two-tone chime using Web Audio API.
 * A gentle "ding" — warm, short, memorable.
 */
function playChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;

    // First tone — warm mid
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now); // A5
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.08, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc1.connect(gain1).connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.7);

    // Second tone — higher, softer (harmonic)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1320, now + 0.08); // E6
    gain2.gain.setValueAtTime(0, now + 0.08);
    gain2.gain.linearRampToValueAtTime(0.045, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.9);

    // Sub bass thud — very subtle
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = "sine";
    osc3.frequency.setValueAtTime(110, now); // A2
    gain3.gain.setValueAtTime(0, now);
    gain3.gain.linearRampToValueAtTime(0.06, now + 0.015);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc3.connect(gain3).connect(ctx.destination);
    osc3.start(now);
    osc3.stop(now + 0.3);
  } catch {
    // Audio not available — silent fallback
  }
}
