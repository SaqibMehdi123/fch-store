import Link from "next/link";
import { BrandLogo } from "@/components/brand/logo";

/**
 * Storefront 404 — inherits the full shop chrome (header/footer) from the
 * (shop) layout. Editorial, on-brand: the missing piece has "left the atelier".
 */
export default function ShopNotFound() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-6 py-24 text-center md:py-32">
      <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-gold">
        404 — Page not found
      </p>

      <h1 className="mt-5 font-[var(--font-playfair)] text-4xl leading-tight text-stone-900 md:text-5xl">
        This piece has left
        <br />
        the atelier
      </h1>

      {/* the golden thread — brand motif echoing the logo stitch */}
      <svg
        viewBox="0 0 220 24"
        aria-hidden
        className="mt-7 h-6 w-56 text-gold"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      >
        <path d="M6,14 C46,22 84,6 122,11 C154,15 186,11 206,7" />
        <path d="M206,7 C211,5.5 214,7 216,10" />
      </svg>

      <p className="mt-7 max-w-md text-[15px] leading-relaxed text-stone-600">
        The page you are looking for was moved, renamed or never hung on the
        rail. Let&apos;s walk you back to the collections.
      </p>

      <nav aria-label="Continue shopping" className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
        {[
          { href: "/women", label: "Women" },
          { href: "/men", label: "Men" },
          { href: "/kids", label: "Kids" },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="group relative font-[var(--font-playfair)] text-lg text-stone-900 transition-colors hover:text-gold"
          >
            {l.label}
            <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-gold transition-transform duration-300 group-hover:scale-x-100" />
          </Link>
        ))}
      </nav>

      <Link
        href="/"
        className="mt-10 inline-flex items-center gap-2 border border-stone-900 px-8 py-3 text-[13px] font-medium uppercase tracking-[0.2em] text-stone-900 transition-colors hover:bg-stone-900 hover:text-white"
      >
        Back to home
      </Link>

      <div className="mt-16 opacity-70">
        <BrandLogo size={36} />
      </div>
    </div>
  );
}
