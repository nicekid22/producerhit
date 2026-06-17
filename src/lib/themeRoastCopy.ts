import type { VisualTheme } from "@/stores/visualThemeStore";

export type ThemeRoastCopy = {
  emoji: string;
  title: string;
  body: string;
  punchline: string;
  cta: string;
};

const THEME_EMOJI: Record<VisualTheme, string> = {
  prism: "🌙",
  "warm-glass": "☕",
  cloud: "☁️",
};

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

export function getThemeRoastCopy(to: VisualTheme, isFr: boolean): ThemeRoastCopy {
  if (isFr) {
    const bodies: Record<VisualTheme, string[]> = {
      prism: [
        "J'avais parié que tu tiendrais plus de 30 secondes sans toucher au bouton thème. Perdu — retour Prism, classique.",
        "Tu viens de remettre Prism. Nostalgie, indécision, ou les deux en même temps ?",
      ],
      "warm-glass": [
        "Warm Glass activé. Honnêtement, j'aurais mis 5€ sur « il clique dans les 10 secondes ». Merci pour ma théorie.",
        "Tu as touché au thème. Encore. Comme si l'app allait disparaître si tu ne changeais pas l'ambiance.",
      ],
      cloud: [
        "Mode Cloud. Météo intérieure : instable, mais stylée. Je parie que tu vas retoucher dans 2 minutes.",
        "Cloud activé. J'étais prête à parier que tu ne te retiendrais pas de ce bouton. Bingo.",
      ],
    };

    return {
      emoji: THEME_EMOJI[to],
      title: pick(["Ah bah voilà.", "Classic.", "On s'y attendait presque."]),
      body: pick(bodies[to]),
      punchline: pick([
        "Promis, on te juge pas. On observe juste.",
        "C'est ton studio — fais ce que tu veux. On note quand même.",
        "Le bouton thème : 1. Toi : 0. Match retour bientôt.",
      ]),
      cta: "Ok ok, je range le thème",
    };
  }

  const bodies: Record<VisualTheme, string[]> = {
    prism: [
      "I had money on you lasting 30 seconds without touching the theme button. You proved me wrong — by touching it immediately. Prism it is.",
      "Back to Prism. Nostalgia, indecision, or premium indecision?",
    ],
    "warm-glass": [
      "Warm Glass on. I'd bet you couldn't resist that button — and you'd owe me five bucks.",
      "Theme button: undefeated. You: curious. We respect the hustle.",
    ],
    cloud: [
      "Cloud mode. Inner weather: unstable, but gorgeous. I'd bet you'll tweak it again in two minutes.",
      "Cloud activated. I was ready to bet you wouldn't keep your hands off that button. Called it.",
    ],
  };

  return {
    emoji: THEME_EMOJI[to],
    title: pick(["There it is.", "Classic move.", "We had a feeling."]),
    body: pick(bodies[to]),
    punchline: pick([
      "No judgment. Just… observant.",
      "It's your studio — do you. We're taking notes though.",
      "Theme button: 1. You: 0. Rematch soon.",
    ]),
    cta: "Fine, I'll behave",
  };
}

export const THEME_ROAST_SEEN_KEY = "producerhit_theme_roast_seen_v1";
