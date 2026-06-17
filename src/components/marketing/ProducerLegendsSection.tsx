import { useMemo, useState } from "react";
import { producerWhispers, producerWhispersSectionCopy } from "@/lib/producerLegends";
import { shuffleArray } from "@/lib/utils";
import { useLazyInView } from "@/hooks/useLazyInView";
import { cn } from "@/lib/utils";

import type { AppLocale } from "@/i18n/config";
type Props = {
  locale: AppLocale;
  className?: string;
};

export function ProducerLegendsSection({ locale, className }: Props) {
  const { ref, visible } = useLazyInView("200px");
  const copy = producerWhispersSectionCopy(locale);
  const [items] = useState(() => shuffleArray(producerWhispers(locale)));
  const scrollDurationSec = useMemo(() => 88 + Math.floor(Math.random() * 40), []);
  const trackItems = visible ? [...items, ...items] : items.slice(0, 5);

  return (
    <section
      ref={ref}
      className={cn("pk-producer-whispers", className)}
      aria-label={copy.eyebrow}
    >
      <p className="pk-producer-whispers__eyebrow">{copy.eyebrow}</p>

      <div className={cn("pk-producer-whispers__viewport mt-4", visible && "is-active")}>
        <div
          className={cn("pk-producer-whispers__track", !visible && "is-static")}
          style={visible ? { animationDuration: `${scrollDurationSec}s` } : undefined}
        >
          {trackItems.map((w, i) => (
            <blockquote key={`${w.id}-${i}`} className="pk-producer-whispers__card">
              <p className="pk-producer-whispers__quote">&ldquo;{w.quote}&rdquo;</p>
              <footer className="pk-producer-whispers__who">
                {w.who}
                {w.tag ? <span className="pk-producer-whispers__tag">{w.tag}</span> : null}
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
