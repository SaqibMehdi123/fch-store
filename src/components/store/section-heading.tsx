import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Editorial section heading — gold eyebrow + serif title + optional link.
 */
export function SectionHeading({
  eyebrow,
  title,
  linkHref,
  linkLabel,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  linkHref?: string;
  linkLabel?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-end justify-between gap-4",
        align === "center" && "flex-col items-center text-center",
        className
      )}
    >
      <div>
        {eyebrow && <p className="label-caps text-gold">{eyebrow}</p>}
        <h2 className="mt-1.5 font-display text-2xl leading-tight sm:text-3xl">{title}</h2>
      </div>
      {linkHref && linkLabel && (
        <Link
          href={linkHref}
          className="group hidden shrink-0 items-center gap-1.5 text-[12px] font-medium uppercase tracking-[0.16em] text-foreground/80 transition-colors hover:text-gold sm:inline-flex"
        >
          {linkLabel}
          <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">→</span>
        </Link>
      )}
    </div>
  );
}
