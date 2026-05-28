import { useEffect, useMemo, useRef, useState } from "react";
import { LANDING_GALLERY_IMAGES, landingCopy } from "@/lib/landingContent";
import { hashString, shuffleArray } from "@/lib/utils";
import { useLazyInView } from "@/hooks/useLazyInView";

type Props = {
  locale: "en" | "fr";
};

type TileVariant = "tall" | "square" | "wide" | "medium";

const TILE_VARIANTS: TileVariant[] = ["tall", "medium", "square", "wide", "medium", "tall"];
const COL_SPEEDS: Record<number, number[]> = {
  2: [-0.9, 0.75],
  3: [-1, 0.55, -0.65],
  5: [-1.15, 0.72, -0.48, 0.88, -0.82],
};

function useGalleryColumnCount() {
  const [count, setCount] = useState(5);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 640) setCount(2);
      else if (w < 1024) setCount(3);
      else setCount(5);
    };
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);

  return count;
}

function distributeToColumns(images: readonly string[], columnCount: number): string[][] {
  const cols = Array.from({ length: columnCount }, () => [] as string[]);
  images.forEach((src, i) => {
    cols[i % columnCount]!.push(src);
  });
  return cols;
}

function tileVariant(src: string, colIndex: number, rowIndex: number): TileVariant {
  const h = hashString(`${src}:${colIndex}:${rowIndex}`);
  return TILE_VARIANTS[h % TILE_VARIANTS.length] ?? "medium";
}

export function VisualCarousel({ locale }: Props) {
  const { ref, visible } = useLazyInView("320px");
  const copy = landingCopy(locale);
  const columnCount = useGalleryColumnCount();
  const mosaicRef = useRef<HTMLDivElement | null>(null);
  const colRefs = useRef<Array<HTMLDivElement | null>>([]);

  const [shuffledImages] = useState(() => shuffleArray(LANDING_GALLERY_IMAGES));
  const [revealed, setRevealed] = useState(false);
  const reduceMotion = useMemo(() => {
    try {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return false;
    }
  }, []);

  const columns = useMemo(
    () => distributeToColumns(shuffledImages, columnCount),
    [shuffledImages, columnCount],
  );

  const colSpeeds = COL_SPEEDS[columnCount] ?? COL_SPEEDS[5]!;

  useEffect(() => {
    if (!visible || reduceMotion) return;
    const t = window.setTimeout(() => setRevealed(true), 80);
    return () => window.clearTimeout(t);
  }, [visible, reduceMotion]);

  useEffect(() => {
    if (!visible) setRevealed(false);
  }, [visible]);

  useEffect(() => {
    if (!visible || reduceMotion) return;
    const mosaic = mosaicRef.current;
    if (!mosaic) return;

    let raf = 0;
    const tick = () => {
      raf = 0;
      const rect = mosaic.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = (vh * 0.55 - rect.top) / (rect.height + vh * 0.35);
      const clamped = Math.max(0, Math.min(1, progress));

      colRefs.current.forEach((col, i) => {
        if (!col) return;
        const speed = colSpeeds[i] ?? 0;
        const travel = (clamped - 0.5) * 140 * speed;
        col.style.transform = `translate3d(0, ${travel.toFixed(2)}px, 0)`;
      });
    };

    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(tick);
    };

    tick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [visible, reduceMotion, colSpeeds, columnCount]);

  let stagger = 0;

  return (
    <div
      ref={ref}
      className={[
        "pk-landing-gallery",
        visible && revealed ? "pk-landing-gallery--revealed" : "",
        reduceMotion ? "pk-landing-gallery--static" : "",
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
        <div aria-hidden className="pk-landing-gallery__grain" />
        <div aria-hidden className="pk-landing-gallery__vignette" />

        {visible ? (
          <div ref={mosaicRef} className="pk-landing-gallery__mosaic">
            {columns.map((colImages, colIndex) => (
              <div
                key={`col-${colIndex}-${columnCount}`}
                ref={(el) => {
                  colRefs.current[colIndex] = el;
                }}
                className={[
                  "pk-landing-gallery__col",
                  `pk-landing-gallery__col--${colIndex + 1}`,
                ].join(" ")}
              >
                <div className="pk-landing-gallery__col-inner">
                  {[...colImages, ...colImages].map((src, rowIndex) => {
                    const variant = tileVariant(src, colIndex, rowIndex);
                    const delay = stagger * 0.045;
                    if (rowIndex < colImages.length) stagger += 1;
                    return (
                      <figure
                        key={`${src}-${rowIndex}`}
                        className={[
                          "pk-landing-gallery__tile",
                          `pk-landing-gallery__tile--${variant}`,
                        ].join(" ")}
                        style={{ transitionDelay: `${delay.toFixed(3)}s` }}
                      >
                        <div className="pk-landing-gallery__tile-frame">
                          <img
                            src={src}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            fetchPriority="low"
                            className="pk-landing-gallery__img"
                            onError={(e) => {
                              e.currentTarget.closest("figure")?.classList.add("pk-landing-gallery__tile--broken");
                              e.currentTarget.style.display = "none";
                            }}
                          />
                          <div className="pk-landing-gallery__tile-grade" aria-hidden />
                          <div className="pk-landing-gallery__tile-grain" aria-hidden />
                          <div className="pk-landing-gallery__tile-shine" aria-hidden />
                        </div>
                      </figure>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="pk-landing-gallery__placeholder" aria-hidden>
            {shuffledImages.slice(0, 6).map((src, i) => (
              <div
                key={src}
                className="pk-landing-gallery__tile pk-landing-gallery__tile--medium pk-landing-gallery__tile--ghost"
                style={{ transitionDelay: `${i * 0.06}s`, backgroundImage: `url(${src})` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
