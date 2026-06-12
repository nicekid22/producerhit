export type CoachStepId =
  | "welcome"
  | "mode"
  | "prompt"
  | "generate"
  | "first_success"
  | "library";

export type CoachStep = {
  id: CoachStepId;
  target?: string;
  placement?: "top" | "bottom" | "left" | "right" | "center";
  celebrate?: boolean;
};

export const COACH_TOUR_STEPS: CoachStep[] = [
  { id: "welcome", placement: "center" },
  { id: "mode", target: '[data-coach="mode-rail"]', placement: "bottom" },
  { id: "prompt", target: '[data-coach="prompt-field"]', placement: "bottom" },
  { id: "generate", target: '[data-coach="generate-btn"]', placement: "top" },
];

export const COACH_POST_GEN_STEPS: CoachStep[] = [
  { id: "first_success", placement: "center", celebrate: true },
  { id: "library", target: '[data-coach="nav-library"]', placement: "right" },
];

export type CoachCopy = {
  title: string;
  body: string;
  cta: string;
  skip?: string;
};

export function coachStepCopy(stepId: CoachStepId, isFr: boolean): CoachCopy {
  const fr: Record<CoachStepId, CoachCopy> = {
    welcome: {
      title: "Bienvenue dans ton studio 🎧",
      body: "Je suis ton coach — en 30 secondes tu sauras créer ton premier son. C'est ludique, promis.",
      cta: "C'est parti",
      skip: "Passer le tour",
    },
    mode: {
      title: "Choisis ton mode",
      body: "Song = morceau avec voix · Beat = instru type beat · Remix = repartir d'un audio.",
      cta: "Suivant",
      skip: "Passer",
    },
    prompt: {
      title: "Décris ton idée",
      body: "Quelques mots suffisent — genre, mood, BPM… Tu peux aussi dicter avec le micro.",
      cta: "Suivant",
      skip: "Passer",
    },
    generate: {
      title: "Lance la magie ✨",
      body: "Appuie sur Générer — ta track apparaît dans Résultats. Tu as 10 crédits gratuits ce mois-ci.",
      cta: "Compris",
      skip: "Passer",
    },
    first_success: {
      title: "Bravo — premier son validé ! 🎉",
      body: "Tu viens de créer ta première track. Écoute-la, relance une variation, ou exporte-la quand tu veux.",
      cta: "Continuer",
    },
    library: {
      title: "Tout est dans Library",
      body: "Retrouve tes créations, covers et exports à tout moment depuis la bibliothèque.",
      cta: "Terminer le tour",
      skip: "Passer",
    },
  };

  const en: Record<CoachStepId, CoachCopy> = {
    welcome: {
      title: "Welcome to your studio 🎧",
      body: "I'm your coach — 30 seconds and you'll know how to create your first track. Fun, not boring.",
      cta: "Let's go",
      skip: "Skip tour",
    },
    mode: {
      title: "Pick your mode",
      body: "Song = vocals & structure · Beat = type beat instrumental · Remix = start from audio.",
      cta: "Next",
      skip: "Skip",
    },
    prompt: {
      title: "Describe your vibe",
      body: "A few words are enough — genre, mood, BPM… You can dictate with the mic too.",
      cta: "Next",
      skip: "Skip",
    },
    generate: {
      title: "Hit generate ✨",
      body: "Press Generate — your track lands in Results. You get 10 free credits this month.",
      cta: "Got it",
      skip: "Skip",
    },
    first_success: {
      title: "Yes! First track done 🎉",
      body: "You just made your first track. Listen, try a variation, or export when you're ready.",
      cta: "Continue",
    },
    library: {
      title: "Everything lives in Library",
      body: "Find your tracks, covers, and exports anytime from your library.",
      cta: "Finish tour",
      skip: "Skip",
    },
  };

  return (isFr ? fr : en)[stepId];
}
