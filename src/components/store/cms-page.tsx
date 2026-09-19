import { notFound } from "next/navigation";
import Link from "next/link";
import Markdown from "react-markdown";
import { db } from "@/lib/db";
import { CMS_MARKDOWN_COMPONENTS } from "@/lib/cms-markdown";

/**
 * Renders a markdown page from the `pages` table (About / FAQ / Terms / Privacy).
 * Content is owner-editable in Admin → Pages (Phase 4) — DB-driven, not hardcoded.
 */
export async function CmsPage({ slug }: { slug: string }) {
  const page = await db.page.findFirst({ where: { slug, isActive: true } });
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 lg:py-14">
      <nav aria-label="Breadcrumb" className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-gold">
          Home
        </Link>
        <span aria-hidden className="mx-2">/</span>
        <span className="text-foreground/70">{page.title}</span>
      </nav>

      <header className="mt-4 border-b border-stone pb-6">
        <h1 className="font-display text-3xl leading-tight sm:text-4xl">{page.title}</h1>
      </header>

      <article
        className="mt-8"
        // DB content is owner-controlled markdown; no raw HTML is rendered.
      >
        <Markdown components={CMS_MARKDOWN_COMPONENTS}>{page.content}</Markdown>
      </article>

      {/* help footer */}
      <div className="mt-14 rounded-sm border border-stone bg-card p-6 text-center">
        <p className="font-display text-lg">Still have a question?</p>
        <p className="mt-1 text-sm text-muted-foreground">Our team answers within hours — not days.</p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link href="/contact" className="btn-luxury">
            Contact us
          </Link>
          <Link href="/shop" className="btn-outline-luxury">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
