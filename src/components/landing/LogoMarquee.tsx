import { LANDING_PARTNER_NAMES, landingCopy } from "@/lib/landingContent";
import { useLazyInView } from "@/hooks/useLazyInView";

type Props = {
  locale: "en" | "fr";
};

export function LogoMarquee({ locale }: Props) {
  const { ref, visible } = useLazyInView("200px");
  const copy = landingCopy(locale);
  const items = visible ? [...LANDING_PARTNER_NAMES, ...LANDING_PARTNER_NAMES] : LANDING_PARTNER_NAMES;

  return (
    <div ref={ref} className="pk-landing-marquee" aria-label={copy.partnersLabel}>
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">{copy.partnersLabel}</p>
      <div className={`pk-landing-marquee__viewport mt-4 sm:mt-5 ${visible ? "is-active" : ""}`}>
        <div className={`pk-landing-marquee__track ${visible ? "" : "is-static"}`}>
          {items.map((name, i) => (
            <span key={`${name}-${i}`} className="pk-landing-marquee__pill">
              {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
