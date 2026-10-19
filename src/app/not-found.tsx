import Link from "next/link";

/**
 * Root 404 fallback — used for unmatched routes outside the storefront shell
 * (e.g. unknown paths under /admin, /api oddities rendered as pages).
 * Deliberately minimal: no shop chrome, just brand + way out.
 */
export default function RootNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#faf8f4] px-6 text-center">
      <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-[#b08d57]">
        404 — Page not found
      </p>
      <h1 className="mt-4 font-serif text-3xl text-stone-900 md:text-4xl">
        Nothing hangs here
      </h1>
      <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-stone-600">
        The page you requested could not be found.
      </p>
      <Link
        href="/"
        className="mt-8 border border-stone-900 px-8 py-3 text-[13px] font-medium uppercase tracking-[0.2em] text-stone-900 transition-colors hover:bg-stone-900 hover:text-white"
      >
        Back to home
      </Link>
    </div>
  );
}
