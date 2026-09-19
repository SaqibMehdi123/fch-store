"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { deleteBanner, setBannerActive, upsertBanner, type BannerInput } from "@/app/actions/admin-content";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import type { AdminBannerRow } from "@/lib/admin/queries";

type FormState = {
  id?: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  sortOrder: string;
  isActive: boolean;
  startsAt: string;
  endsAt: string;
};

const newForm = (): FormState => ({
  title: "",
  subtitle: "",
  imageUrl: "",
  linkUrl: "",
  sortOrder: "0",
  isActive: true,
  startsAt: "",
  endsAt: "",
});

const editForm = (b: AdminBannerRow): FormState => ({
  id: b.id,
  title: b.title,
  subtitle: b.subtitle ?? "",
  imageUrl: b.imageUrl,
  linkUrl: b.linkUrl ?? "",
  sortOrder: String(b.sortOrder),
  isActive: b.isActive,
  startsAt: b.startsAt ? b.startsAt.slice(0, 16) : "",
  endsAt: b.endsAt ? b.endsAt.slice(0, 16) : "",
});

export function BannerManager({ rows }: { rows: AdminBannerRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<null | "form">(null);
  const [form, setForm] = useState<FormState>(newForm());

  const submit = () => {
    const payload: BannerInput = {
      id: form.id,
      title: form.title,
      subtitle: form.subtitle || null,
      imageUrl: form.imageUrl,
      linkUrl: form.linkUrl || null,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
    };
    startTransition(async () => {
      const res = await upsertBanner(payload);
      if (res.ok) {
        toast.success(res.message ?? "Banner saved.");
        setEditing(null);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    });
  };

  const field = "w-full rounded-sm border border-stone bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold";
  const label = "block text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-1";

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <p className="label-caps text-gold">Marketing</p>
          <h1 className="mt-1 font-display text-3xl">Banners</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} banners · {rows.filter((r) => r.isActive).length} live on the storefront carousel
          </p>
        </div>
        <button
          onClick={() => {
            setForm(newForm());
            setEditing("form");
          }}
          className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-xs font-medium uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New banner
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="mt-6 rounded-sm border border-stone bg-card px-6 py-14 text-center text-sm text-muted-foreground">
          No banners yet — the homepage carousel falls back to a static hero until one is published.
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {rows.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center gap-5 rounded-sm border border-stone bg-card p-4">
              { }
              <img
                src={b.imageUrl}
                alt=""
                aria-hidden
                className="h-20 w-36 shrink-0 rounded-sm border border-stone object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg leading-tight">{b.title}</p>
                {b.subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{b.subtitle}</p>}
                <p className="mt-1 text-xs text-muted-foreground">
                  Sort {b.sortOrder}
                  {b.linkUrl ? ` · links to ${b.linkUrl}` : " · no link"}
                  {b.startsAt ? ` · from ${new Date(b.startsAt).toLocaleDateString("en-GB")}` : ""}
                  {b.endsAt ? ` · until ${new Date(b.endsAt).toLocaleDateString("en-GB")}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={b.isActive}
                  onCheckedChange={(v) =>
                    startTransition(async () => {
                      const res = await setBannerActive(b.id, v);
                      if (res.ok) toast.success(res.message); else toast.error(res.message);
                      router.refresh();
                    })
                  }
                  aria-label={`Toggle ${b.title}`}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      aria-label={`Actions for ${b.title}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setForm(editForm(b));
                        setEditing("form");
                      }}
                    >
                      <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() =>
                        startTransition(async () => {
                          const res = await deleteBanner(b.id);
                          if (res.ok) toast.success(res.message); else toast.error(res.message);
                          router.refresh();
                        })
                      }
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{form.id ? "Edit banner" : "New banner"}</DialogTitle>
            <DialogDescription>Shown on the homepage carousel — lower sort numbers appear first.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-1">
            <div>
              <label className={label} htmlFor="banner-image">Image</label>
              <ImageUploadField
                value={form.imageUrl}
                onChange={(url) => setForm({ ...form, imageUrl: url })}
                folder="banners"
                label="Banner image"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label} htmlFor="banner-title">Title</label>
                <input
                  id="banner-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={field}
                />
              </div>
              <div>
                <label className={label} htmlFor="banner-subtitle">Subtitle</label>
                <input
                  id="banner-subtitle"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  className={field}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={label} htmlFor="banner-link">Link URL</label>
                <input
                  id="banner-link"
                  value={form.linkUrl}
                  onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                  placeholder="/women"
                  className={field}
                />
              </div>
              <div>
                <label className={label} htmlFor="banner-sort">Sort order</label>
                <input
                  id="banner-sort"
                  type="number"
                  min={0}
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                  className={field}
                />
              </div>
              <div className="flex items-center justify-between rounded-sm border border-stone px-3 py-2.5">
                <span className="text-sm">Active</span>
                <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} aria-label="Banner active" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label} htmlFor="banner-start">Schedule start (optional)</label>
                <input
                  id="banner-start"
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                  className={field}
                />
              </div>
              <div>
                <label className={label} htmlFor="banner-end">Schedule end (optional)</label>
                <input
                  id="banner-end"
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                  className={field}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={submit}
              disabled={pending}
              className="rounded-sm bg-primary px-5 py-2 text-xs font-medium uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save banner"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
