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
import { deleteZone, setZoneActive, upsertZone, type ZoneInput } from "@/app/actions/admin-content";
import type { AdminZoneRow } from "@/lib/admin/queries";
import { formatPKR } from "@/lib/format";

type FormState = {
  id?: string;
  name: string;
  cities: string;
  rate: string;
  etaDays: string;
  isActive: boolean;
};

const newForm = (): FormState => ({ name: "", cities: "", rate: "150", etaDays: "3", isActive: true });

const editForm = (z: AdminZoneRow): FormState => ({
  id: z.id,
  name: z.name,
  cities: z.cities,
  rate: String(z.rate),
  etaDays: String(z.etaDays),
  isActive: z.isActive,
});

export function ZoneManager({ rows }: { rows: AdminZoneRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<null | "form">(null);
  const [form, setForm] = useState<FormState>(newForm());

  const submit = () => {
    const payload: ZoneInput = {
      id: form.id,
      name: form.name,
      cities: form.cities,
      rate: Number(form.rate),
      etaDays: Number(form.etaDays),
      isActive: form.isActive,
    };
    startTransition(async () => {
      const res = await upsertZone(payload);
      if (res.ok) {
        toast.success(res.message ?? "Zone saved.");
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
          <p className="label-caps text-gold">Configuration</p>
          <h1 className="mt-1 font-display text-3xl">Delivery Zones</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} zones · {rows.filter((r) => r.isActive).length} offered at checkout
          </p>
        </div>
        <button
          onClick={() => {
            setForm(newForm());
            setEditing("form");
          }}
          className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-xs font-medium uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New zone
        </button>
      </div>

      <div className="mt-5 overflow-x-auto rounded-sm border border-stone bg-card">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-stone text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              <th className="px-4 py-3 font-medium">Zone</th>
              <th className="px-4 py-3 font-medium">Cities covered</th>
              <th className="px-4 py-3 text-center font-medium">Rate</th>
              <th className="px-4 py-3 text-center font-medium">ETA</th>
              <th className="px-4 py-3 text-center font-medium">Orders</th>
              <th className="px-4 py-3 text-center font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone">
            {rows.map((z) => (
              <tr key={z.id} className="transition-colors hover:bg-secondary">
                <td className="px-4 py-3 font-medium">{z.name}</td>
                <td className="max-w-md px-4 py-3 text-xs text-muted-foreground">{z.cities}</td>
                <td className="px-4 py-3 text-center">{formatPKR(z.rate)}</td>
                <td className="px-4 py-3 text-center text-xs">{z.etaDays} {z.etaDays === 1 ? "day" : "days"}</td>
                <td className="px-4 py-3 text-center text-xs">{z.orderCount}</td>
                <td className="px-4 py-3 text-center">
                  <Switch
                    checked={z.isActive}
                    onCheckedChange={(v) =>
                      startTransition(async () => {
                        const res = await setZoneActive(z.id, v);
                        if (res.ok) toast.success(res.message); else toast.error(res.message);
                        router.refresh();
                      })
                    }
                    aria-label={`Toggle ${z.name}`}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        aria-label={`Actions for ${z.name}`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setForm(editForm(z));
                          setEditing("form");
                        }}
                      >
                        <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() =>
                          startTransition(async () => {
                            const res = await deleteZone(z.id);
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
                  No delivery zones — add one so checkout can offer delivery.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        In-store pickup is always available at checkout and never charged. The free-shipping threshold lives in{" "}
        <a href="/admin/settings" className="text-gold hover:underline">Settings</a>.
      </p>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{form.id ? `Edit ${form.name}` : "New delivery zone"}</DialogTitle>
            <DialogDescription>Zones appear as delivery options at checkout with their rate and ETA.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-1">
            <div>
              <label className={label} htmlFor="zone-name">Zone name</label>
              <input
                id="zone-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Karachi City"
                className={field}
              />
            </div>
            <div>
              <label className={label} htmlFor="zone-cities">Cities (comma separated)</label>
              <textarea
                id="zone-cities"
                value={form.cities}
                onChange={(e) => setForm({ ...form, cities: e.target.value })}
                rows={3}
                placeholder="Karachi, Clifton, DHA"
                className={field}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={label} htmlFor="zone-rate">Rate (Rs.)</label>
                <input
                  id="zone-rate"
                  type="number"
                  min={0}
                  value={form.rate}
                  onChange={(e) => setForm({ ...form, rate: e.target.value })}
                  className={field}
                />
              </div>
              <div>
                <label className={label} htmlFor="zone-eta">ETA (days)</label>
                <input
                  id="zone-eta"
                  type="number"
                  min={1}
                  max={30}
                  value={form.etaDays}
                  onChange={(e) => setForm({ ...form, etaDays: e.target.value })}
                  className={field}
                />
              </div>
              <div className="flex items-center justify-between rounded-sm border border-stone px-3 py-2.5">
                <span className="text-sm">Active</span>
                <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} aria-label="Zone active" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={submit}
              disabled={pending}
              className="rounded-sm bg-primary px-5 py-2 text-xs font-medium uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save zone"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
