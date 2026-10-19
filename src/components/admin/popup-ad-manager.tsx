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
import { deletePopupAd, setPopupAdActive, upsertPopupAd, type PopupAdInput } from "@/app/actions/admin-content";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import type { AdminPopupAdRow } from "@/lib/admin/queries";

type FormState = {
  id?: string;
  imageUrl: string;
  headline: string;
  subline: string;
  linkUrl: string;
  isActive: boolean;
};

const newForm = (): FormState => ({
  imageUrl: "",
  headline: "",
  subline: "",
  linkUrl: "",
  isActive: true,
});

const editForm = (p: AdminPopupAdRow): FormState => ({
  id: p.id,
  imageUrl: p.imageUrl,
  headline: p.headline ?? "",
  subline: p.subline ?? "",
  linkUrl: p.linkUrl ?? "",
  isActive: p.isActive,
});

export function PopupAdManager({ rows }: { rows: AdminPopupAdRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<null | "form">(null);
  const [form, setForm] = useState<FormState>(newForm());

  const submit = () => {
    const payload: PopupAdInput = {
      id: form.id,
      imageUrl: form.imageUrl,
      headline: form.headline || null,
      subline: form.subline || null,
      linkUrl: form.linkUrl || null,
      isActive: form.isActive,
    };
    startTransition(async () => {
      const res = await upsertPopupAd(payload);
      if (res.ok) {
        toast.success(res.message ?? "Popup saved.");
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
          <h1 className="mt-1 font-display text-3xl">Homepage Popup</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} ads · {rows.filter((r) => r.isActive).length} live — the newest active ad shows once per visitor on first load
          </p>
        </div>
        <button
          onClick={() => {
            setForm(newForm());
            setEditing("form");
          }}
          className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-xs font-medium uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New popup
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="mt-6 rounded-sm border border-stone bg-card px-6 py-14 text-center text-sm text-muted-foreground">
          No popups yet — the homepage loads without any welcome ad until you publish one.
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {rows.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-5 rounded-sm border border-stone bg-card p-4">
              <img
                src={p.imageUrl}
                alt=""
                aria-hidden
                className="h-20 w-16 shrink-0 rounded-sm border border-stone object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg leading-tight">{p.headline || "Untitled popup"}</p>
                {p.subline && <p className="mt-0.5 text-sm text-muted-foreground">{p.subline}</p>}
                <p className="mt-1 text-xs text-muted-foreground">
                  {p.linkUrl ? `links to ${p.linkUrl}` : "no link"} · added {new Date(p.createdAt).toLocaleDateString("en-GB")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={p.isActive}
                  onCheckedChange={(v) =>
                    startTransition(async () => {
                      const res = await setPopupAdActive(p.id, v);
                      if (res.ok) toast.success(res.message); else toast.error(res.message);
                      router.refresh();
                    })
                  }
                  aria-label={`Toggle popup ${p.headline || ""}`}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      aria-label={`Actions for popup ${p.headline || ""}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setForm(editForm(p));
                        setEditing("form");
                      }}
                    >
                      <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() =>
                        startTransition(async () => {
                          const res = await deletePopupAd(p.id);
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
            <DialogTitle className="font-display">{form.id ? "Edit popup" : "New popup"}</DialogTitle>
            <DialogDescription>
              Shown on the homepage when the site first loads — once per visitor. Publishing a new popup shows it to
              everyone again.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-1">
            <div>
              <label className={label} htmlFor="popup-image">Image</label>
              <ImageUploadField
                value={form.imageUrl}
                onChange={(url) => setForm({ ...form, imageUrl: url })}
                folder="popup-ads"
                label="Popup image"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label} htmlFor="popup-headline">Headline</label>
                <input
                  id="popup-headline"
                  value={form.headline}
                  onChange={(e) => setForm({ ...form, headline: e.target.value })}
                  placeholder="Eid Edit — 20% off"
                  className={field}
                />
              </div>
              <div>
                <label className={label} htmlFor="popup-subline">Subline</label>
                <input
                  id="popup-subline"
                  value={form.subline}
                  onChange={(e) => setForm({ ...form, subline: e.target.value })}
                  placeholder="New season lawn is here"
                  className={field}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label} htmlFor="popup-link">Link URL (optional)</label>
                <input
                  id="popup-link"
                  value={form.linkUrl}
                  onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                  placeholder="/shop?on_sale=1"
                  className={field}
                />
              </div>
              <div className="flex items-center justify-between rounded-sm border border-stone px-3 py-2.5">
                <span className="text-sm">Active</span>
                <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} aria-label="Popup active" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={submit}
              disabled={pending}
              className="rounded-sm bg-primary px-5 py-2 text-xs font-medium uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save popup"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
