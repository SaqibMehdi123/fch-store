"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Storefront error boundary (500-level). Offers a soft reset (re-render the
 * segment) and an escape hatch to the homepage. The digest is surfaced for
 * support so the owner can correlate with Vercel logs.
 */
export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface for client-side diagnostics; production logs are in Vercel.
    console.error("[shop-error]", error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-6 py-24 text-center md:py-32">
      <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-gold">
        Something went wrong
      </p>

      <h1 className="mt-5 font-[var(--font-playfair)] text-4xl leading-tight text-stone-900 md:text-5xl">
        A loose thread —
        <br />
        we&apos;re on it
      </h1>

      <p className="mt-7 max-w-md text-[15px] leading-relaxed text-stone-600">
        An unexpected error interrupted this page. Try again in a moment; if it
        persists, our team is reachable on WhatsApp and at{" "}
        <a href="mailto:orders@fch.pk" className="underline decoration-gold underline-offset-4 hover:text-gold">
          orders@fch.pk
        </a>
        .
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={reset}
          className="inline-flex items-center bg-stone-900 px-8 py-3 text-[13px] font-medium uppercase tracking-[0.2em] text-white transition-colors hover:bg-gold hover:text-white"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center border border-stone-900 px-8 py-3 text-[13px] font-medium uppercase tracking-[0.2em] text-stone-900 transition-colors hover:bg-stone-900 hover:text-white"
        >
          Back to home
        </Link>
      </div>

      {error.digest ? (
        <p className="mt-12 text-xs tracking-wide text-stone-400">
          Reference: {error.digest}
        </p>
      ) : null}
    </div>
  );
}
