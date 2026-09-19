"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Product gallery — mobile: swipeable scroll-snap with dot indicator;
 * desktop: thumbnail rail + main image with cursor-following zoom.
 */
export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const [zooming, setZooming] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const mobileRef = useRef<HTMLDivElement>(null);

  if (!images.length) {
    return (
      <div className="flex aspect-[3/4] items-center justify-center rounded-sm bg-secondary text-sm text-muted-foreground">
        {name}
      </div>
    );
  }

  const onMobileScroll = () => {
    const el = mobileRef.current;
    if (!el) return;
    setActive(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <div>
      {/* ── mobile / tablet: swipe gallery ── */}
      <div className="relative md:hidden">
        <div
          ref={mobileRef}
          onScroll={onMobileScroll}
          className="flex snap-x snap-mandatory overflow-x-auto rounded-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label={`${name} images`}
        >
          {images.map((src, i) => (
            <div key={src + i} className="w-full shrink-0 snap-center">
              { }
              <img src={src} alt={`${name} — view ${i + 1}`} className="aspect-[3/4] w-full object-cover" draggable={false} />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <div className="mt-3 flex justify-center gap-2">
            {images.map((src, i) => (
              <button
                key={src + i}
                type="button"
                aria-label={`Go to image ${i + 1}`}
                aria-current={i === active}
                onClick={() => mobileRef.current?.scrollTo({ left: i * mobileRef.current.clientWidth, behavior: "smooth" })}
                className={cn("h-1.5 rounded-full transition-all", i === active ? "w-6 bg-gold" : "w-2 bg-stone")}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── desktop: thumbs + zoomable main ── */}
      <div className="hidden gap-4 md:flex">
        {images.length > 1 && (
          <div className="flex w-20 shrink-0 flex-col gap-3" role="tablist" aria-label="Product images">
            {images.map((src, i) => (
              <button
                key={src + i}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={`View image ${i + 1}`}
                onClick={() => setActive(i)}
                className={cn(
                  "overflow-hidden rounded-sm border transition-all",
                  i === active ? "border-gold" : "border-transparent opacity-70 hover:opacity-100"
                )}
              >
                { }
                <img src={src} alt="" className="aspect-[3/4] w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <div
          className="relative flex-1 cursor-zoom-in overflow-hidden rounded-sm bg-secondary/40"
          onMouseEnter={() => setZooming(true)}
          onMouseLeave={() => setZooming(false)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            setOrigin(`${x}% ${y}%`);
          }}
        >
          { }
          <img
            src={images[active]}
            alt={`${name} — view ${active + 1}`}
            className="aspect-[3/4] w-full object-cover transition-transform duration-200 ease-out"
            style={{ transform: zooming ? "scale(1.75)" : "scale(1)", transformOrigin: origin }}
          />
          <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/45 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-white opacity-0 transition-opacity duration-300" style={{ opacity: zooming ? 0 : 1 }}>
            Hover to zoom
          </span>
        </div>
      </div>
    </div>
  );
}
