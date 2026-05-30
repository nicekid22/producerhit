import { useEffect, useMemo, useState } from "react";
import { LANDING_GALLERY_FEATURED, landingCopy } from "@/lib/landingContent";
import { useLazyInView } from "@/hooks/useLazyInView";

type Props = {
  locale: "en" | "fr";
};

export function VisualCarousel({ locale }: Props) {
  const { ref, visible } = useLazyInView("320px");
  const copy = landingCopy(locale);
  const images = LANDING_GALLERY_FEATURED;
  const [revealed, setRevealed] = useState(false);

  const reduceMotion = useMemo(() => {
    try {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return false;
    }
  }, []);

  const staticGallery = reduceMotion;

  const trackImages = useMemo(
    () => (staticGallery ? [...images] : [...images, ...images]),
    [images, staticGallery],
  );

  useEffect(() => {
    if (!visible || staticGallery) return;
    const t = window.setTimeout(() => setRevealed(true), 60);
    return () => window.clearTimeout(t);
  }, [visible, staticGallery]);

  useEffect(() => {
    if (!visible) setRevealed(false);
  }, [visible]);

  return (
    <div
      ref={ref}
      className={[
        "pk-landing-gallery pk-landing-gallery--lite",
        visible && revealed ? "pk-landing-gallery--revealed" : "",
        staticGallery ? "pk-landing-gallery--static" : "",
      ].join(" ")}
    >
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/40">{copy.galleryEyebrow}</p>
        <h2 className="mt-3 text-balance text-[clamp(1.35rem,3.5vw,2.25rem)] font-bold tracking-tight text-white">
          {copy.galleryTitle}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-balance text-sm leading-relaxed text-white/55">{copy.galleryLead}</p>
      </div>

      <div className="pk-landing-gallery__stage mt-8 sm:mt-10">
        <div aria-hidden className="pk-landing-gallery__glow" />
        <div aria-hidden className="pk-landing-gallery__vignette" />

        {visible ? (
          <div className="pk-landing-gallery__film" aria-hidden={staticGallery}>
            <div className="pk-landing-gallery__film-track">
              {trackImages.map((src, i) => (
                <figure
                  key={`${src}-${i}`}
                  className="pk-landing-gallery__film-tile"
                  style={{ animationDelay: staticGallery ? undefined : `${(i % images.length) * 0.08}s` }}
                >
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                    sizes="168px"
                    className="pk-landing-gallery__film-img"
                    onError={(e) => {
                      e.currentTarget.closest("figure")?.classList.add("pk-landing-gallery__tile--broken");
                    }}
                  />
                  <div className="pk-landing-gallery__tile-grade" aria-hidden />
                </figure>
              ))}
            </div>
          </div>
        ) : (
          <div className="pk-landing-gallery__film pk-landing-gallery__film--placeholder" aria-hidden>
            {images.slice(0, 4).map((src) => (
              <div key={src} className="pk-landing-gallery__film-tile pk-landing-gallery__film-tile--ghost" style={{ backgroundImage: `url(${src})` }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
