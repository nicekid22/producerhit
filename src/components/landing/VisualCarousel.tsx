import { useMemo } from "react";
import { LANDING_GALLERY_IMAGES, landingCopy } from "@/lib/landingContent";
import { useLazyInView } from "@/hooks/useLazyInView";
import { useIsMobileViewport } from "@/hooks/useIsMobileViewport";

type Props = {
  locale: "en" | "fr";
};

export function VisualCarousel({ locale }: Props) {
  const { ref, visible } = useLazyInView("320px");
  const isMobile = useIsMobileViewport();
  const copy = landingCopy(locale);

  const images = useMemo(() => {
    const base = isMobile ? LANDING_GALLERY_IMAGES.slice(0, 6) : LANDING_GALLERY_IMAGES;
    return visible ? [...base, ...base] : base;
  }, [isMobile, visible]);

  return (
    <div ref={ref} className="pk-landing-gallery">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">Studio vibes</p>
        <h2 className="mt-3 text-balance text-[clamp(1.35rem,3.5vw,2.25rem)] font-bold tracking-tight text-white">
          {copy.galleryTitle}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-balance text-sm leading-relaxed text-white/55">{copy.galleryLead}</p>
      </div>

      <div className={`pk-landing-gallery__viewport mt-6 sm:mt-8 ${visible ? "is-active" : ""}`}>
        {visible ? (
          <div className="pk-landing-gallery__track">
            {images.map((src, i) => (
              <figure key={`${src}-${i}`} className="pk-landing-gallery__slide">
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                  className="h-full w-full object-cover"
                />
              </figure>
            ))}
          </div>
        ) : (
          <div className="pk-landing-gallery__placeholder" aria-hidden>
            {LANDING_GALLERY_IMAGES.slice(0, 3).map((src) => (
              <div key={src} className="pk-landing-gallery__slide pk-landing-gallery__slide--ghost" style={{ backgroundImage: `url(${src})` }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
