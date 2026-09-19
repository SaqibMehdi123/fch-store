import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * FCH brand mark — "The Golden Thread".
 *
 * A serif FCH monogram underlined by a hand-drawn gold thread that trails
 * off into a needle, with a small khatam (eight-point) star above — the
 * tailor's craft and South Asian ornament distilled into one lockup.
 *
 * This mark is the ONLY brand element used across the site (no stacked
 * wordmark, no full name) so header/footer stay compact. Rendered inline
 * so the monogram uses the site's Playfair Display and adapts to
 * light/dark surfaces via `light`.
 */
export function BrandLogo({
  className,
  light = false,
  size = 40,
  href = "/",
}: {
  className?: string;
  /** Invert the monogram for dark surfaces (footer, admin sidebar). */
  light?: boolean;
  /** Height of the lockup in px. */
  size?: number;
  href?: string;
}) {
  // intrinsic viewBox 152 x 58
  const width = Math.round(size * (152 / 58));

  return (
    <Link
      href={href}
      aria-label="FCH — Fashion and Collection House, home"
      className={cn("group inline-flex shrink-0 items-center justify-center", className)}
    >
      <svg
        viewBox="0 0 152 58"
        height={size}
        width={width}
        aria-hidden
        className="transition-transform duration-300 group-hover:scale-[1.04]"
      >
        {/* monogram — Playfair Display via the site font stack */}
        <text
          x="76"
          y="33"
          textAnchor="middle"
          fontFamily="var(--font-playfair), Georgia, 'Times New Roman', serif"
          fontSize="30"
          letterSpacing="4.5"
          fill={light ? "#F8F6F2" : "#1A1A1A"}
        >
          FCH
        </text>

        {/* the golden thread — loose stitch sweeping under the monogram */}
        <path
          d="M10,44.5 C38,51.5 66,41.5 92,45.5 C110,48.5 127,45 137,40.5"
          fill="none"
          stroke="#B08D57"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        {/* needle tip curl */}
        <path
          d="M137,40.5 C141,38.5 144,39 146,41.5"
          fill="none"
          stroke="#B08D57"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        {/* khatam star — eight-point ornament above the tail of the thread */}
        <path
          fill="#B08D57"
          d="M128,7.8 L128.67,10.38 L130.97,9.03 L129.62,11.33 L132.2,12 L129.62,12.67 L130.97,14.97 L128.67,13.62 L128,16.2 L127.33,13.62 L125.03,14.97 L126.38,12.67 L123.8,12 L126.38,11.33 L125.03,9.03 L127.33,10.38 Z"
        />
      </svg>
    </Link>
  );
}
