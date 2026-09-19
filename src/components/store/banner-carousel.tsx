"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type BannerSlide = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkUrl: string | null;
};

const AUTOPLAY_MS = 6500;

/**
 * Homepage hero — full-bleed banner carousel driven by the banners table.
 * Autoplay with pause on hover/focus, dots + arrows, swipe on touch.
 */
export function BannerCarousel({ slides }: { slides: BannerSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = slides.length;

  const go = useCallback((next: number) => setIndex(((next % count) + count) % count), [count]);

  useEffect(() => {
    if (paused || count < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [paused, count]);

  if (!count) return null;

  return (
    <section
      aria-label="Featured campaigns"
      aria-roledescription="carousel"
      className="relative h-[68vh] min-h-[440px] max-h-[640px] w-full overflow-hidden bg-charcoal"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 48) go(index + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
    >
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          aria-hidden={i !== index}
          className={cn(
            "absolute inset-0 transition-opacity duration-[900ms] ease-out",
            i === index ? "opacity-100" : "pointer-events-none opacity-0"
          )}
        >
          { }
          <img
            src={slide.imageUrl}
            alt={`${slide.title} — ${slide.subtitle ?? ""}`}
            className={cn(
              "h-full w-full object-cover",
              i === index && !paused && "animate-[fch-ken-burns_7s_ease-out_forwards]"
            )}
          />
          {/* editorial scrim — left-weighted for type */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/20" />

          <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-center px-6 sm:px-10">
            <div className={cn("max-w-xl transition-all duration-700 sm:max-w-2xl", i === index ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0")}>
              <p className="label-caps text-gold-soft">Fashion and Collection House</p>
              <h1 className="mt-3 font-display text-4xl leading-[1.08] text-ivory sm:text-5xl lg:text-6xl">
                {slide.title}
              </h1>
              {slide.subtitle && (
                <p className="mt-4 max-w-md text-sm leading-6 text-ivory/80 sm:text-base">
                  {slide.subtitle}
                </p>
              )}
              {slide.linkUrl && (
                <Link
                  href={slide.linkUrl}
                  tabIndex={i === index ? 0 : -1}
                  className="btn-luxury mt-8"
                >
                  Shop Now
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* arrows */}
      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => go(index - 1)}
            className="absolute left-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/20 text-ivory backdrop-blur transition-all hover:bg-black/45 sm:inline-flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => go(index + 1)}
            className="absolute right-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/20 text-ivory backdrop-blur transition-all hover:bg-black/45 sm:inline-flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* dots */}
          <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2.5" role="tablist" aria-label="Choose slide">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Slide ${i + 1}: ${s.title}`}
                onClick={() => go(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i === index ? "w-8 bg-gold" : "w-3 bg-white/50 hover:bg-white/80"
                )}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
