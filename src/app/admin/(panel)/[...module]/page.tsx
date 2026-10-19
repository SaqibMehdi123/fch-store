import type { Metadata } from "next";
import Link from "next/link";
import { ALL_ADMIN_ITEMS } from "@/lib/admin-nav";

export const metadata: Metadata = {
  title: "Module",
  robots: { index: false, follow: false },
};

/**
 * Catch-all for admin modules that ship in later phases — keeps the sidebar
 * honest without dead 404s. Concrete routes (orders, products, …) take
 * precedence over this dynamic segment automatically.
 */
export default async function AdminModulePlaceholder({
  params,
}: {
  params: Promise<{ module: string[] }>;
}) {
  const { module: parts } = await params;
  const slug = parts.join("/");
  const item = ALL_ADMIN_ITEMS.find((i) => i.href === `/admin/${slug}`);
  const label = item?.label ?? slug;
  const phase = item?.phase ?? 4;

  return (
    <div className="animate-fade-in flex min-h-[50vh] flex-col items-center justify-center text-center">
      <p className="label-caps text-gold">Coming in Phase {phase}</p>
      <h1 className="mt-2 font-display text-3xl">{label}</h1>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        This module is part of the planned rollout and unlocks with Phase {phase}. Everything shipped so far
        remains fully functional in the meantime.
      </p>
      <Link
        href="/admin"
        className="mt-6 rounded-sm border border-stone px-4 py-2 text-xs uppercase tracking-wide text-muted-foreground transition-colors hover:border-gold hover:text-gold"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
