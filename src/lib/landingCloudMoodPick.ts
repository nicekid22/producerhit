import { showLandingMoodWow } from "@/components/landing/LandingMoodWow";
import { playElementSpiritSfx } from "@/lib/delight/elementSpiritSfx";
import type { LandingCloudMoodCard } from "@/lib/landingContent";
import type { CloudAccent } from "@/stores/cloudAccentStore";

const FLASH_CLASS = "pk-landing-mood-flash";
const FLASH_MS = 1100;

export function flashLandingMood(element: LandingCloudMoodCard["element"]) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-pk-landing-mood-flash", element);
  root.classList.add(FLASH_CLASS);
  window.setTimeout(() => {
    root.classList.remove(FLASH_CLASS);
    root.removeAttribute("data-pk-landing-mood-flash");
  }, FLASH_MS);
}

export function pickLandingCloudMood(opts: {
  mood: LandingCloudMoodCard;
  setTheme: (theme: "cloud") => void;
  setAccent: (accent: CloudAccent) => void;
  isFr?: boolean;
  showWow?: boolean;
  playSfx?: boolean;
}) {
  const { mood, setTheme, setAccent, isFr = true, showWow = true, playSfx = true } = opts;
  setTheme("cloud");
  setAccent(mood.id);
  flashLandingMood(mood.element);
  if (playSfx) playElementSpiritSfx(mood.element);
  if (showWow) showLandingMoodWow(mood, isFr);
}
