"use client";

import { useMemo, useState, useTransition } from "react";
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
import { deleteCoupon, setCouponActive, upsertCoupon, type CouponInput } from "@/app/actions/admin-content";
import type { AdminCouponRow } from "@/lib/admin/queries";
import { formatPKR } from "@/lib/format";

const isoToLocalInput = (iso: string | null) => (iso ? iso.slice(0, 16) : "");

type FormState = {
  id?: string;
  code: string;
  type: "percent" | "fixed";
  value: string;
  minOrderAmount: string;
  maxDiscount: string;
  startsAt: string;
  expiresAt: string;
  usageLimit: string;
  isActive: boolean;
};

const newForm = (): FormState => ({
  code: "",
  type: "percent",
  value: "10",
  minOrderAmount: "",
  maxDiscount: "",
  startsAt: new Date().toISOString().slice(0, 16),
  expiresAt: "",
  usageLimit: "",
  isActive: true,
});

const editForm = (row: AdminCouponRow): FormState => ({
  id: row.id,
  code: row.code,
  type: row.type,
  value: String(row.value),
  minOrderAmount: row.minOrderAmount != null ? String(row.minOrderAmount) : "",
  maxDiscount: row.maxDiscount != null ? String(row.maxDiscount) : "",
  startsAt: isoToLocalInput(row.startsAt),
  expiresAt: isoToLocalInput(row.expiresAt),
  usageLimit: row.usageLimit != null ? String(row.usageLimit) : "",
  isActive: row.isActive,
});

export function CouponManager({ rows }: { rows: AdminCouponRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<null | "form">(null);
  const [form, setForm] = useState<FormState>(newForm());

  const openNew = () => {
    setForm(newForm());
    setEditing("form");
  };
  const openEdit = (row: AdminCouponRow) => {
    setForm(editForm(row));
    setEditing("form");
  };

  const describe = (c: AdminCouponRow) =>
    c.type === "percent"
      ? `${c.value}% off${c.maxDiscount ? ` (max ${formatPKR(c.maxDiscount)})` : ""}`
      : `${formatPKR(c.value)} off`;

  const windowText = useMemo(
    () => (c: AdminCouponRow) => {
      const s = new Date(c.startsAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
      const e = c.expiresAt
        ? new Date(c.expiresAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
        : null;
      return e ? `${s} → ${e}` : `${s} → no expiry`;
    },
    [],
  );

  const submit = () => {
    const payload: CouponInput = {
      id: form.id,
      code: form.code,
      type: form.type,
      value: Number(form.value),
      minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
      startsAt: new Date(form.startsAt).toISOString(),
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      isActive: form.isActive,
    };
    startTransition(async () => {
      const res = await upsertCoupon(payload);
      if (res.ok) {
        toast.success(res.message ?? "Coupon saved.");
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
          <h1 className="mt-1 font-display text-3xl">Coupons</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} coupons · {rows.filter((r) => r.isActive).length} active
          </p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-xs font-medium uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New coupon
        </button>
      </div>

      <div className="mt-5 overflow-x-auto rounded-sm border border-stone bg-card">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-stone text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Discount</th>
              <th className="px-4 py-3 font-medium">Min order</th>
              <th className="px-4 py-3 font-medium">Window</th>
              <th className="px-4 py-3 text-center font-medium">Usage</th>
              <th className="px-4 py-3 text-center font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone">
            {rows.map((c) => (
              <tr key={c.id} className="transition-colors hover:bg-secondary">
                <td className="px-4 py-3 font-mono text-xs font-semibold">{c.code}</td>
                <td className="px-4 py-3">{describe(c)}</td>
                <td className="px-4 py-3">{c.minOrderAmount ? formatPKR(c.minOrderAmount) : "—"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{windowText(c)}</td>
                <td className="px-4 py-3 text-center text-xs">
                  {c.usedCount}
                  {c.usageLimit ? ` / ${c.usageLimit}` : ""}
                </td>
                <td className="px-4 py-3 text-center">
                  <Switch
                    checked={c.isActive}
                    onCheckedChange={(v) =>
                      startTransition(async () => {
                        const res = await setCouponActive(c.id, v);
                        if (res.ok) toast.success(res.message); else toast.error(res.message);
                        router.refresh();
                      })
                    }
                    aria-label={`Toggle ${c.code}`}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        aria-label={`Actions for ${c.code}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(c)}>
                        <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() =>
                          startTransition(async () => {
                            const res = await deleteCoupon(c.id);
                            if (res.ok) toast.success(res.message); else toast.error(res.message);
                            router.refresh();
                          })
                        }
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  No coupons yet — create the first one to run a promotion.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Coupons already used on orders can&apos;t be deleted (order history keeps the reference) — deactivate them instead.
      </p>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{form.id ? `Edit ${form.code}` : "New coupon"}</DialogTitle>
            <DialogDescription>Discounts apply to the merchandise subtotal — shipping is excluded.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-1">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label} htmlFor="coupon-code">Code</label>
                <input
                  id="coupon-code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="EID25"
                  className={`${field} font-mono uppercase`}
                />
              </div>
              <div>
                <label className={label} htmlFor="coupon-type">Type</label>
                <select
                  id="coupon-type"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as "percent" | "fixed" })}
                  className={field}
                >
                  <option value="percent">Percent off (%)</option>
                  <option value="fixed">Fixed amount (Rs.)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label} htmlFor="coupon-value">
                  {form.type === "percent" ? "Percent (%)" : "Amount (Rs.)"}
                </label>
                <input
                  id="coupon-value"
                  type="number"
                  min={1}
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  className={field}
                />
              </div>
              {form.type === "percent" && (
                <div>
                  <label className={label} htmlFor="coupon-cap">Max discount cap (Rs.)</label>
                  <input
                    id="coupon-cap"
                    type="number"
                    min={1}
                    value={form.maxDiscount}
                    onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                    placeholder="No cap"
                    className={field}
                  />
                </div>
              )}
            </div>

            <div>
              <label className={label} htmlFor="coupon-min">Min order (Rs.)</label>
              <input
                id="coupon-min"
                type="number"
                min={0}
                value={form.minOrderAmount}
                onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                placeholder="No minimum"
                className={field}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label} htmlFor="coupon-start">Starts</label>
                <input
                  id="coupon-start"
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                  className={field}
                />
              </div>
              <div>
                <label className={label} htmlFor="coupon-expiry">Expires</label>
                <input
                  id="coupon-expiry"
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  className={field}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 items-end gap-3">
              <div>
                <label className={label} htmlFor="coupon-limit">Usage limit</label>
                <input
                  id="coupon-limit"
                  type="number"
                  min={1}
                  value={form.usageLimit}
                  onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                  placeholder="Unlimited"
                  className={field}
                />
              </div>
              <div className="flex items-center justify-between rounded-sm border border-stone px-3 py-2.5">
                <span className="text-sm">Active</span>
                <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} aria-label="Coupon active" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={submit}
              disabled={pending}
              className="rounded-sm bg-primary px-5 py-2 text-xs font-medium uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save coupon"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
