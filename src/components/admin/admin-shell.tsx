"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, Menu, ExternalLink } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { BrandLogo } from "@/components/brand/logo";
import { ADMIN_NAV } from "@/lib/admin-nav";
import { cn } from "@/lib/utils";

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin navigation" className="flex-1 overflow-y-auto px-3 py-4">
      {ADMIN_NAV.map(({ section, items }) => (
        <div key={section} className="mb-5">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
            {section}
          </p>
          <ul className="space-y-0.5">
            {items.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-sm px-3 py-2 text-[13px] transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground/75 hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.8} />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function UserBlock({ user }: { user: { name: string; email: string; role: string } }) {
  return (
    <div className="border-t border-stone p-3">
      <div className="mb-2 px-3">
        <p className="truncate text-sm font-medium">{user.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {user.email} · <span className="uppercase tracking-wide">{user.role}</span>
        </p>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/admin/login" })}
        className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-[13px] text-foreground/75 transition-colors hover:bg-secondary hover:text-foreground"
      >
        <LogOut className="h-4 w-4" strokeWidth={1.8} /> Sign Out
      </button>
    </div>
  );
}

/**
 * Admin application shell — fixed sidebar (desktop), sheet (mobile),
 * top bar with store link and user identity.
 */
export function AdminShell({
  user,
  children,
}: {
  user: { name: string; email: string; role: string };
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-stone bg-card lg:flex">
        <div className="flex h-14 items-center gap-2.5 border-b border-stone px-5">
          <BrandLogo size={30} href="/admin" />
          <span aria-hidden className="h-4 w-px bg-stone" />
          <p className="label-caps text-[10px] text-muted-foreground">Admin</p>
        </div>
        <SidebarNav />
        <UserBlock user={user} />
      </aside>

      {/* main column */}
      <div className="flex min-h-screen w-full flex-col lg:pl-60">
        {/* top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-stone bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/85">
          <div className="flex items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button aria-label="Open admin menu" className="inline-flex h-9 w-9 items-center justify-center lg:hidden">
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 flex flex-col">
                <div className="flex h-14 items-center gap-2.5 border-b border-stone px-5">
                  <SheetTitle className="sr-only">Admin navigation</SheetTitle>
                  <BrandLogo size={30} href="/admin" />
                  <span aria-hidden className="h-4 w-px bg-stone" />
                  <p className="label-caps text-[10px] text-muted-foreground">Admin</p>
                </div>
                <SidebarNav onNavigate={() => setOpen(false)} />
                <UserBlock user={user} />
              </SheetContent>
            </Sheet>
            <span className="label-caps text-muted-foreground">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-gold"
            >
              View Store <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
