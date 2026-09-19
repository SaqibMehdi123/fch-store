"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setStock } from "@/app/actions/admin";
import { cn } from "@/lib/utils";

type Variant = {
  id: string;
  sku: string;
  productName: string;
  productSlug: string;
  color: string;
  colorHex: string;
  size: string;
  stock: number;
  threshold: number;
};

export function InventoryRow({ variant: v }: { variant: Variant }) {
  const router = useRouter();
  const [value, setValue] = useState(String(v.stock));
  const [pending, startTransition] = useTransition();

  const dirty = Number(value) !== v.stock && value !== "";

  const save = () => {
    startTransition(async () => {
      const res = await setStock(v.id, Number(value));
      if (res.ok) {
        toast.success(`${v.sku}: ${res.message}`);
        router.refresh();
      } else {
        toast.error(res.message);
        setValue(String(v.stock));
      }
    });
  };

  return (
    <tr className="transition-colors hover:bg-secondary">
      <td className="px-4 py-3 font-mono text-xs">{v.sku}</td>
      <td className="px-4 py-3">
        <Link href={`/product/${v.productSlug}`} target="_blank" className="hover:text-gold hover:underline">
          {v.productName}
        </Link>
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="inline-block h-3.5 w-3.5 rounded-full border border-stone" style={{ backgroundColor: v.colorHex }} />
          {v.color} · {v.size}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        <span
          className={cn(
            v.stock === 0 ? "font-medium text-destructive" : v.stock <= v.threshold ? "font-medium text-gold" : ""
          )}
        >
          {v.stock}
          {v.stock > 0 && v.stock <= v.threshold && <span className="ml-1 text-[10px] uppercase">low</span>}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="flex items-center justify-end gap-2">
          <input
            type="number"
            min={0}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-label={`Set stock for ${v.sku}`}
            className="w-20 rounded-sm border border-stone bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gold"
          />
          <button
            onClick={save}
            disabled={pending || !dirty}
            className="rounded-sm bg-primary px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Save
          </button>
        </span>
      </td>
    </tr>
  );
}
