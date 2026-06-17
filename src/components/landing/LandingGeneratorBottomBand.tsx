import { ChevronRight, Download, Sparkles, Wand2 } from "lucide-react";
import { Link } from "react-router-dom";
import { HeroCtaButton } from "@/components/landing/HeroCtaButton";
import { landingGeneratorBottomCopy } from "@/lib/landingContent";
import { buildAuthUrl } from "@/lib/authRoutes";
import { cn } from "@/lib/utils";
import "@/styles/landing-workflow-rail.css";

import type { AppLocale } from "@/i18n/config";
type Props = {
  locale: AppLocale;
  compact?: boolean;
  loggedIn?: boolean;
};

const STEP_ICONS = [Wand2, Sparkles, Download] as const;

export function LandingGeneratorBottomBand({ locale, compact = false, loggedIn = false }: Props) {
  const copy = landingGeneratorBottomCopy(locale);

  return (
    <div className={cn("pk-workflow-rail", compact && "pk-workflow-rail--compact")}>
      <div className="pk-workflow-rail__intro">
        <h2 className="pk-workflow-rail__title">{copy.title}</h2>
        <ul className="pk-workflow-rail__modes" aria-label={locale === "fr" ? "Modes" : "Modes"}>
          {copy.modes.map((mode) => (
            <li key={mode} className="pk-workflow-rail__mode">
              {mode}
            </li>
          ))}
        </ul>
      </div>

      <ol className="pk-workflow-rail__track">
        {copy.steps.map((step, index) => {
          const Icon = STEP_ICONS[index] ?? Sparkles;
          const isLast = index === copy.steps.length - 1;
          return (
            <li key={step.title} className="pk-workflow-rail__node">
              <div className="pk-workflow-rail__card">
                <span className="pk-workflow-rail__icon-wrap" aria-hidden>
                  <Icon className="pk-workflow-rail__icon" strokeWidth={1.75} />
                </span>
                <div className="pk-workflow-rail__copy">
                  <p className="pk-workflow-rail__step-title">{step.title}</p>
                  <p className="pk-workflow-rail__step-hint">{step.hint}</p>
                </div>
              </div>
              {!isLast ? (
                <ChevronRight className="pk-workflow-rail__connector" strokeWidth={2} aria-hidden />
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className={cn("pk-workflow-rail__cta", compact && "pk-workflow-rail__cta--compact")}>
        {loggedIn ? (
          <HeroCtaButton to="/dashboard" variant="beam" size={compact ? "md" : "lg"}>
            {copy.ctaStudio}
          </HeroCtaButton>
        ) : (
          <HeroCtaButton to={buildAuthUrl()} variant="beam" size={compact ? "md" : "lg"}>
            {copy.ctaPrimary}
          </HeroCtaButton>
        )}
        <p className="pk-workflow-rail__note">{copy.note}</p>
        {!loggedIn ? (
          <Link to="/pricing" className="pk-workflow-rail__pricing">
            {copy.pricingLink}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
