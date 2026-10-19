"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import type { PopupAdData } from "@/lib/products";

const STORAGE_KEY = "fch-popup-seen"; // holds the id of the last dismissed popup
const SHOW_DELAY_MS = 700;

/**
 * Homepage welcome popup — appears shortly after first load with the newest
 * active popup ad. Shown once per popup: dismissing stores the popup id, so
 * publishing a NEW popup in Admin makes it appear for everyone again.
 * Esc, backdrop click and the close button all dismiss it.
 */
export function HomePopupAd({ popup }: { popup: PopupAdData }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let seen: string | null = null;
    try {
      seen = localStorage.getItem(STORAGE_KEY);
    } catch {
      // storage blocked (private mode) — still show, just won't persist
    }
    if (seen === popup.id) return;
    const t = setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, [popup.id]);

  const dismiss = useCallback(() => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_KEY, popup.id);
    } catch {
      // ignore
    }
  }, [popup.id]);

  // esc to close + body scroll lock while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && dismiss();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, dismiss]);

  if (!open) return null;

  return (
    <div
      className="popup-backdrop fixed inset-0 z-[90] flex items-center justify-center bg-charcoal/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={popup.headline || "Featured promotion"}
      onClick={dismiss}
    >
      <div
        className="popup-card relative w-full max-w-sm overflow-hidden rounded-sm bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close promotion"
          className="absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-charcoal/55 text-ivory backdrop-blur-sm transition-colors hover:bg-primary"
        >
          <X className="h-4 w-4" />
        </button>

        <a href={popup.linkUrl || "#"} onClick={(e) => !popup.linkUrl && e.preventDefault()} className="block">
          <div className="aspect-[4/5] max-h-[54vh] w-full overflow-hidden bg-secondary">
            <img
              src={popup.imageUrl}
              alt={popup.headline || "Promotion"}
              className="h-full w-full object-cover"
            />
          </div>
        </a>

        {(popup.headline || popup.subline) && (
          <div className="px-5 pb-5 pt-4 text-center">
            {popup.headline && <p className="font-display text-xl leading-snug">{popup.headline}</p>}
            {popup.subline && <p className="mt-1 text-sm text-muted-foreground">{popup.subline}</p>}
            {popup.linkUrl && (
              <Link href={popup.linkUrl} onClick={dismiss} className="btn-luxury mt-4 w-full">
                Shop now
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
