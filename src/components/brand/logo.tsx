import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * FCH brand mark — a double lozenge "hallmark" seal with the FCH monogram.
 *
 * The mark is the ONLY brand element shown (no stacked wordmark, no full
 * name) so the header and footer stay compact. Rendered inline so the
 * monogram uses the site's Playfair Display and adapts to light/dark
 * surfaces via `light`.
 */
export function BrandLogo({
  className,
  light = false,
  size = 38,
  href = "/",
}: {
  className?: string;
  /** Invert the monogram for dark surfaces (footer, admin sidebar). */
  light?: boolean;
  /** Height of the mark in px. */
  size?: number;
  href?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="FCH — Fashion and Collection House, home"
      className={cn("group inline-flex shrink-0 items-center justify-center", className)}
    >
      <svg
        viewBox="0 0 72 64"
        height={size}
        width={(size * 72) / 64}
        aria-hidden
        className="transition-transform duration-300 group-hover:scale-[1.06]"
      >
        {/* outer lozenge */}
        <path
          d="M36 2.5 L69.5 32 L36 61.5 L2.5 32 Z"
          fill="none"
          stroke="#B08D57"
          strokeWidth="1.6"
        />
        {/* inner lozenge */}
        <path
          d="M36 8.5 L63.5 32 L36 55.5 L8.5 32 Z"
          fill="none"
          stroke="#B08D57"
          strokeWidth="0.8"
          opacity="0.55"
        />
        {/* monogram (x nudged left to offset trailing letter-spacing) */}
        <text
          x="35.25"
          y="33.5"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="var(--font-playfair), Georgia, 'Times New Roman', serif"
          fontSize="15"
          letterSpacing="1.5"
          fill={light ? "#F8F6F2" : "#1A1A1A"}
        >
          FCH
        </text>
      </svg>
    </Link>
  );
}
