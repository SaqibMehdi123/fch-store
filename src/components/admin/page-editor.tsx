"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ExternalLink, Save } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { savePage } from "@/app/actions/admin-content";
import Markdown from "react-markdown";
import { CMS_MARKDOWN_COMPONENTS } from "@/lib/cms-markdown";

/**
 * Markdown page editor (About / FAQ / Terms / Privacy). Live preview renders
 * with the same renderer the storefront CMS pages use.
 */
export function PageEditor({
  page,
}: {
  page: { id: string; slug: string; title: string; content: string; isActive: boolean };
}) {
  const router = useRouter();
  const [title, setTitle] = useState(page.title);
  const [content, setContent] = useState(page.content);
  const [isActive, setIsActive] = useState(page.isActive);
  const [preview, setPreview] = useState(false);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    startTransition(async () => {
      const res = await savePage({ id: page.id, title, content, isActive });
      if (res.ok) {
        toast.success(res.message ?? "Page saved.");
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps text-gold">
            Pages CMS · <span className="font-mono normal-case">/{page.slug}</span>
          </p>
          <h1 className="mt-1 font-display text-3xl">{page.title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/${page.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground transition-colors hover:text-gold"
          >
            <ExternalLink className="h-3.5 w-3.5" /> View page
          </Link>
          <button
            onClick={submit}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> {pending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="rounded-sm border border-stone bg-card p-5">
          <div className="flex items-center justify-between">
            <label htmlFor="page-title" className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Title
            </label>
            <button
              onClick={() => setPreview((p) => !p)}
              className="rounded-sm border border-stone px-3 py-1 text-[11px] uppercase tracking-wide text-muted-foreground transition-colors hover:border-gold hover:text-gold"
            >
              {preview ? "Edit markdown" : "Preview"}
            </button>
          </div>
          <input
            id="page-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-2 w-full rounded-sm border border-stone bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
          />

          {preview ? (
            <div className="mt-4 min-h-[420px] rounded-sm border border-stone bg-background p-5">
              <Markdown components={CMS_MARKDOWN_COMPONENTS}>{content}</Markdown>
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={22}
              spellCheck={false}
              aria-label="Page content (markdown)"
              className="mt-4 min-h-[420px] w-full rounded-sm border border-stone bg-background p-4 font-mono text-[13px] leading-relaxed focus:outline-none focus:ring-1 focus:ring-gold"
            />
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-sm border border-stone bg-card p-5">
            <h2 className="font-display text-lg">Visibility</h2>
            <div className="mt-3 flex items-center justify-between rounded-sm border border-stone px-3 py-2.5">
              <span className="text-sm">Live on storefront</span>
              <Switch checked={isActive} onCheckedChange={setIsActive} aria-label="Page active" />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Hidden pages return “not found” on the storefront — drafts stay safe here.
            </p>
          </div>
          <div className="rounded-sm border border-stone bg-card p-5">
            <h2 className="font-display text-lg">Markdown tips</h2>
            <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
              <li><code className="font-mono text-foreground">## Heading</code> — section heading</li>
              <li><code className="font-mono text-foreground">**bold**</code> and <code className="font-mono text-foreground">*italic*</code></li>
              <li><code className="font-mono text-foreground">- item</code> — bullet list</li>
              <li><code className="font-mono text-foreground">[text](/shop)</code> — internal link</li>
              <li>Blank lines separate paragraphs.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
