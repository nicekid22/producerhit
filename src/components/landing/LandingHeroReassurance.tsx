import { LandingFreeHighlight } from "@/components/landing/LandingFreeHighlight";

type Props = {
  text: string;
  className?: string;
  /** Affiche uniquement la partie après le quota free (ex. « Sans carte · Aucun engagement »). */
  tailOnly?: boolean;
};

/** Réassurance hero — optionnel : 1er segment en dégradé, ou queue sans quota. */
export function LandingHeroReassurance({ text, className, tailOnly = false }: Props) {
  const parts = text.split(" · ");
  const head = parts[0] ?? text;
  const tail = parts.slice(1);

  if (tailOnly) {
    const tailText = tail.length > 0 ? tail.join(" · ") : text;
    return <p className={className}>{tailText}</p>;
  }

  return (
    <p className={className}>
      <LandingFreeHighlight>{head}</LandingFreeHighlight>
      {tail.map((segment) => (
        <span key={segment}>
          <span className="pk-landing-hero-reassurance-muted" aria-hidden>
            {" "}
            ·{" "}
          </span>
          <span className="pk-landing-hero-reassurance-muted">{segment}</span>
        </span>
      ))}
    </p>
  );
}
