import type { Metadata } from "next";
import Link from "next/link";
import { listAdminPages } from "@/lib/admin/queries";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Pages CMS",
  robots: { index: false, follow: false },
};

export default async function AdminPagesPage() {
  const rows = await listAdminPages();

  return (
    <div className="animate-fade-in">
      <p className="label-caps text-gold">Configuration</p>
      <h1 className="mt-1 font-display text-3xl">Pages CMS</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Markdown content for the storefront&apos;s static pages — edits go live on save.
      </p>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {rows.map((p) => (
          <li key={p.id}>
            <Link
              href={`/admin/pages/${p.id}`}
              className="block rounded-sm border border-stone bg-card p-5 transition-colors hover:border-gold"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-display text-xl">{p.title}</p>
                <span
                  className={
                    p.isActive
                      ? "rounded-sm bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gold"
                      : "rounded-sm bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                  }
                >
                  {p.isActive ? "Live" : "Hidden"}
                </span>
              </div>
              <p className="mt-1 font-mono text-xs text-muted-foreground">/{p.slug}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                {p.contentLength.toLocaleString("en-US")} characters · updated {formatDate(p.updatedAt)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
