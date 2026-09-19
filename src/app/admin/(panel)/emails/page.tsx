import type { Metadata } from "next";
import Link from "next/link";
import { listAdminEmails, listEmailTemplates } from "@/lib/admin/queries";
import { emailTransportLabel } from "@/lib/email/send";
import { EmailLogTable } from "@/components/admin/email-log";

export const metadata: Metadata = {
  title: "Email Log",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ status?: string; template?: string; q?: string; page?: string }>;

function filterHref(params: Record<string, string | undefined>, patch: Record<string, string | undefined>) {
  const merged = { ...params, ...patch };
  const qs = Object.entries(merged)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
    .join("&");
  return `/admin/emails${qs ? `?${qs}` : ""}`;
}

/**
 * Phase 5 — Email Log. Every transactional email is recorded here with its
 * rendered HTML (preview), delivery status and transport errors. Failed or
 * queued rows can be retried; the unique (order, template, dedupe) index
 * makes double-sends impossible.
 */
export default async function AdminEmailsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const [log, templates] = await Promise.all([
    listAdminEmails({
      status: sp.status,
      template: sp.template,
      q: sp.q,
      page: Number(sp.page ?? 1) || 1,
    }),
    listEmailTemplates(),
  ]);

  const statuses = ["queued", "sent", "failed"] as const;
  const transport = emailTransportLabel();

  return (
    <div className="animate-fade-in">
      <p className="label-caps text-gold">Overview</p>
      <h1 className="mt-1 font-display text-3xl">Email Log</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Every transactional email — order instructions, verification updates, shipping notices —
        is logged here with its rendered content. Transport: <strong>{transport}</strong>
        {transport.startsWith("Preview") && " (set RESEND_API_KEY or SMTP_HOST in .env to deliver for real)"}.
      </p>

      {/* filters */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Link
          href={filterHref(sp, { status: undefined, page: undefined })}
          className={`rounded-full border px-3 py-1 text-xs uppercase tracking-wider transition-colors ${
            !sp.status ? "border-charcoal bg-charcoal text-ivory" : "border-stone bg-card text-muted-foreground hover:border-gold"
          }`}
        >
          All
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={filterHref(sp, { status: s, page: undefined })}
            className={`rounded-full border px-3 py-1 text-xs uppercase tracking-wider capitalize transition-colors ${
              sp.status === s ? "border-charcoal bg-charcoal text-ivory" : "border-stone bg-card text-muted-foreground hover:border-gold"
            }`}
          >
            {s}
          </Link>
        ))}
        <form action="/admin/emails" method="get" className="ml-auto flex items-center gap-2">
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
          {sp.template && <input type="hidden" name="template" value={sp.template} />}
          <select
            name="template"
            defaultValue={sp.template ?? ""}
            className="h-9 rounded-sm border border-stone bg-card px-2 text-xs"
          >
            <option value="">All templates</option>
            {templates.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Search recipient / order…"
            className="h-9 w-52 rounded-sm border border-stone bg-card px-3 text-xs"
          />
          <button type="submit" className="h-9 rounded-sm border border-charcoal bg-charcoal px-3 text-xs uppercase tracking-wider text-ivory hover:border-gold">
            Filter
          </button>
        </form>
      </div>

      <section className="mt-5">
        <EmailLogTable items={log.items} />
      </section>

      {log.pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {Array.from({ length: log.pages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={filterHref(sp, { page: String(p) })}
              className={`flex h-8 w-8 items-center justify-center rounded-sm border text-xs ${
                p === log.page ? "border-charcoal bg-charcoal text-ivory" : "border-stone bg-card hover:border-gold"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
