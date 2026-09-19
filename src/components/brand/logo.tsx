import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * FCH brand logo — monogram + wordmark on a single compact line.
 * `light` inverts for the dark footer; `full=false` hides the long name
 * (used where space is tight).
 */
export function BrandLogo({
  className,
  light = false,
  full = true,
}: {
  className?: string;
  light?: boolean;
  full?: boolean;
}) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5", className)} aria-label="FCH — Fashion and Collection House, home">
      { }
      <img
        src="/logo.svg"
        alt=""
        aria-hidden
        className="h-8 w-8 shrink-0 transition-transform duration-300 group-hover:scale-105"
      />
      <span aria-hidden className={cn("h-5 w-px", light ? "bg-white/25" : "bg-stone")} />
      <span className="flex items-baseline gap-2 leading-none">
        <span className={cn("font-display text-[22px] font-medium tracking-[0.06em]", light ? "text-ivory" : "text-foreground")}>
          FCH
        </span>
        {full && (
          <span
            className={cn(
              "hidden whitespace-nowrap text-[8.5px] font-medium uppercase tracking-[0.3em] sm:inline",
              light ? "text-ivory/65" : "text-muted-foreground"
            )}
          >
            Fashion &amp; Collection House
          </span>
        )}
      </span>
    </Link>
  );
}
