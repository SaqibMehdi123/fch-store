"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Search, Heart, ShoppingBag, Menu } from "lucide-react";
import { BrandLogo } from "@/components/brand/logo";
import { WishlistCountBadge } from "@/components/store/wishlist-heart";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop All" },
  { href: "/shop?category=men", label: "Men" },
  { href: "/shop?category=women", label: "Women" },
  { href: "/shop?category=kids", label: "Kids" },
  { href: "/shop?on_sale=1", label: "Sale" },
];

function SearchForm({ className, onSubmitted }: { className?: string; onSubmitted?: () => void }) {
  return (
    <form action="/shop" className={cn("relative", className)} onSubmit={onSubmitted} role="search">
      <input
        type="search"
        name="q"
        placeholder="Search products…"
        aria-label="Search products"
        className="h-9 w-full md:w-48 rounded-sm border border-stone bg-transparent px-3 pr-9 text-sm transition-colors placeholder:text-muted-foreground/70 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold lg:w-52"
      />
      <button type="submit" aria-label="Submit search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-gold">
        <Search className="h-4 w-4" />
      </button>
    </form>
  );
}

function IconButton({ href, label, children, showBadge }: { href: string; label: string; children: React.ReactNode; showBadge?: boolean }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:text-gold"
    >
      {children}
      {showBadge && <WishlistCountBadge />}
    </Link>
  );
}

/** Underline-on-hover nav link with gold active state (hydration-safe). */
function NavLinks({ variant, onNavigate }: { variant: "desktop" | "mobile"; onNavigate?: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const sale = searchParams.get("on_sale") === "1";

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    const [base, qs] = href.split("?");
    if (pathname !== base) return false;
    if (!qs) {
      // "/shop" is active only when no special filter is chosen
      return !category && !sale;
    }
    const params = new URLSearchParams(qs);
    if (params.get("category")) return params.get("category") === category;
    if (params.get("on_sale")) return sale;
    return false;
  };

  if (variant === "desktop") {
    return (
      <nav className="flex items-center gap-7" aria-label="Main navigation">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            aria-current={isActive(link.href) ? "page" : undefined}
            className={cn(
              "relative py-1.5 text-[11.5px] font-medium uppercase tracking-[0.16em] transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-gold after:transition-transform after:duration-300 hover:text-gold hover:after:scale-x-100",
              isActive(link.href) ? "text-gold after:scale-x-100" : "text-foreground/85"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col py-2" aria-label="Mobile navigation">
      {NAV_LINKS.map((link) => (
        <Link
          key={link.label}
          href={link.href}
          onClick={onNavigate}
          aria-current={isActive(link.href) ? "page" : undefined}
          className={cn(
            "border-b border-stone/60 px-5 py-3 text-[12px] uppercase tracking-[0.16em] transition-colors hover:text-gold",
            isActive(link.href) && "text-gold"
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

/**
 * Site header — compact single-line logo left, editorial nav tabs,
 * search + wishlist + cart right. Mobile: sheet menu.
 */
export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-stone bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      {/* mobile row */}
      <div className="flex h-14 items-center justify-between px-4 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button aria-label="Open menu" className="inline-flex h-10 w-10 items-center justify-center">
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <div className="border-b border-stone p-4">
              <SheetTitle asChild>
                <div>
                  <BrandLogo full={false} />
                </div>
              </SheetTitle>
            </div>
            <Suspense fallback={<div className="p-5 text-sm text-muted-foreground">Loading menu…</div>}>
              <NavLinks variant="mobile" onNavigate={() => setOpen(false)} />
            </Suspense>
          </SheetContent>
        </Sheet>
        <BrandLogo full={false} className="absolute left-1/2 -translate-x-1/2" />
        <div className="flex items-center">
          <IconButton href="/wishlist" label="Wishlist" showBadge>
            <Heart className="h-5 w-5" strokeWidth={1.8} />
          </IconButton>
          <IconButton href="/cart" label="Cart">
            <ShoppingBag className="h-5 w-5" strokeWidth={1.8} />
          </IconButton>
        </div>
      </div>

      {/* desktop row */}
      <div className="mx-auto hidden h-16 max-w-7xl items-center justify-between gap-8 px-6 md:flex">
        <BrandLogo />
        <Suspense fallback={<div className="h-6 w-64" aria-hidden />}>
          <NavLinks variant="desktop" />
        </Suspense>
        <div className="flex items-center gap-1">
          <SearchForm className="mr-2" />
          <IconButton href="/wishlist" label="Wishlist" showBadge>
            <Heart className="h-5 w-5" strokeWidth={1.8} />
          </IconButton>
          <IconButton href="/cart" label="Cart">
            <ShoppingBag className="h-5 w-5" strokeWidth={1.8} />
          </IconButton>
        </div>
      </div>
    </header>
  );
}
