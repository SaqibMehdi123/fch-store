"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

export type GeneratorColor = { name: string; hex: string };
export type GeneratorExisting = {
  id?: string;
  colorName: string;
  colorHex: string;
  size: string;
  sku: string;
  stock: number;
  lowStockThreshold: number;
};
export type GeneratorRow = {
  id?: string;
  colorName: string;
  colorHex: string;
  size: string;
  sku: string;
  stock: number;
  lowStockThreshold: number;
};

const PRESET_COLORS: GeneratorColor[] = [
  { name: "Ivory", hex: "#F3EDE2" },
  { name: "White", hex: "#FAFAF7" },
  { name: "Black", hex: "#151412" },
  { name: "Charcoal", hex: "#2B1F19" },
  { name: "Navy", hex: "#1F2A44" },
  { name: "Olive", hex: "#556B2F" },
  { name: "Maroon", hex: "#6B1F2A" },
  { name: "Beige", hex: "#D9C7A7" },
  { name: "Rose", hex: "#D9A7B4" },
  { name: "Sky", hex: "#A9C4DA" },
  { name: "Emerald", hex: "#1F6B4A" },
  { name: "Mustard", hex: "#C99B2E" },
];

const SIZE_GROUPS: { label: string; sizes: string[] }[] = [
  { label: "Apparel", sizes: ["S", "M", "L", "XL", "XXL"] },
  { label: "Waist", sizes: ["30", "32", "34", "36", "38", "40"] },
  { label: "Kids", sizes: ["2-3Y", "4-5Y", "6-7Y", "8-9Y", "10-11Y"] },
  { label: "Single", sizes: ["One Size", "Free Size"] },
];

const chip = (on: boolean) =>
  `rounded-sm border px-2.5 py-1.5 text-xs transition-colors ${
    on
      ? "border-gold bg-gold/10 text-gold"
      : "border-stone bg-background text-muted-foreground hover:border-gold/60 hover:text-foreground"
  }`;
const inputCls =
  "w-full rounded-sm border border-stone bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold";
const labelCls = "mb-1 block text-[11px] uppercase tracking-[0.14em] text-muted-foreground";

/**
 * Variant generator — pick colours and sizes, hit generate, and every
 * combination appears as an editable variant row (stock carried over for
 * combos that already exist). Replaces adding colour/size/SKU rows by hand.
 */
export function VariantGenerator({
  existing,
  onGenerate,
}: {
  existing: GeneratorExisting[];
  onGenerate: (rows: GeneratorRow[]) => void;
}) {
  const [colors, setColors] = useState<GeneratorColor[]>([]);
  const [customName, setCustomName] = useState("");
  const [customHex, setCustomHex] = useState("#2B1F19");
  const [sizes, setSizes] = useState<string[]>([]);
  const [customSize, setCustomSize] = useState("");
  const [defaultStock, setDefaultStock] = useState(10);
  const [defaultLow, setDefaultLow] = useState(3);

  const toggleColor = (c: GeneratorColor) =>
    setColors((cur) => (cur.some((x) => x.name === c.name) ? cur.filter((x) => x.name !== c.name) : [...cur, c]));

  const toggleSize = (s: string) =>
    setSizes((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  const addCustomColor = () => {
    const name = customName.trim();
    if (!name) return toast.error("Give the colour a name.");
    if (colors.some((c) => c.name.toLowerCase() === name.toLowerCase())) return toast.error("That colour is already selected.");
    setColors((cur) => [...cur, { name, hex: customHex }]);
    setCustomName("");
  };

  const addCustomSize = () => {
    const s = customSize.trim();
    if (!s) return;
    if (sizes.includes(s)) return toast.error("That size is already selected.");
    setSizes((cur) => [...cur, s]);
    setCustomSize("");
  };

  const generate = () => {
    if (!colors.length || !sizes.length) {
      toast.error("Select at least one colour and one size.");
      return;
    }
    // carry over ids (order history links), custom SKUs and stock for combos
    // that already exist, keyed case-insensitively
    const prev = new Map(existing.map((v) => [`${v.colorName.toLowerCase()}|${v.size.toLowerCase()}`, v]));
    const rows: GeneratorRow[] = colors.flatMap((c) =>
      sizes.map((s) => {
        const old = prev.get(`${c.name.toLowerCase()}|${s.toLowerCase()}`);
        return {
          ...(old?.id ? { id: old.id } : {}),
          colorName: c.name,
          colorHex: c.hex,
          size: s,
          sku: old?.sku ?? "",
          stock: old?.stock ?? Math.max(0, Math.floor(defaultStock)),
          lowStockThreshold: old?.lowStockThreshold ?? Math.max(0, Math.floor(defaultLow)),
        };
      })
    );
    onGenerate(rows);
    toast.success(`${rows.length} variant${rows.length > 1 ? "s" : ""} generated — review stock below.`);
  };

  return (
    <div className="rounded-sm border border-gold/40 bg-gold/[0.03] p-4">
      <p className="flex items-center gap-1.5 text-sm font-medium">
        <Sparkles className="h-3.5 w-3.5 text-gold" /> Quick build
        <span className="font-normal text-muted-foreground">— pick colours &amp; sizes, generate all combinations at once</span>
      </p>

      {/* colours */}
      <div className="mt-3">
        <span className={labelCls}>Colours</span>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_COLORS.map((c) => {
            const on = colors.some((x) => x.name === c.name);
            return (
              <button key={c.name} type="button" onClick={() => toggleColor(c)} className={chip(on)} aria-pressed={on}>
                <span aria-hidden className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full border border-stone align-middle" style={{ backgroundColor: c.hex }} />
                {c.name}
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomColor())}
            placeholder="Custom colour name"
            className={`${inputCls} max-w-[180px] flex-1`}
            aria-label="Custom colour name"
          />
          <input
            type="color"
            value={customHex}
            onChange={(e) => setCustomHex(e.target.value)}
            aria-label="Custom colour swatch"
            className="h-9 w-10 shrink-0 cursor-pointer border border-stone bg-background p-0.5"
          />
          <button type="button" onClick={addCustomColor} className="shrink-0 rounded-sm border border-stone px-3 text-[11px] uppercase tracking-wide text-muted-foreground transition-colors hover:border-gold hover:text-gold">
            Add
          </button>
        </div>
      </div>

      {/* sizes */}
      <div className="mt-4">
        <span className={labelCls}>Sizes</span>
        {SIZE_GROUPS.map((g) => (
          <div key={g.label} className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 w-14 text-[10px] uppercase tracking-wide text-muted-foreground">{g.label}</span>
            {g.sizes.map((s) => {
              const on = sizes.includes(s);
              return (
                <button key={s} type="button" onClick={() => toggleSize(s)} className={chip(on)} aria-pressed={on}>
                  {s}
                </button>
              );
            })}
          </div>
        ))}
        <div className="mt-2 flex gap-2">
          <input
            value={customSize}
            onChange={(e) => setCustomSize(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSize())}
            placeholder="Custom size (e.g. 3XL, 42)"
            className={`${inputCls} max-w-[220px] flex-1`}
            aria-label="Custom size"
          />
          <button type="button" onClick={addCustomSize} className="shrink-0 rounded-sm border border-stone px-3 text-[11px] uppercase tracking-wide text-muted-foreground transition-colors hover:border-gold hover:text-gold">
            Add
          </button>
        </div>
      </div>

      {/* defaults + generate */}
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="w-28">
          <label className={labelCls} htmlFor="vg-stock">Default stock</label>
          <input id="vg-stock" type="number" min={0} value={defaultStock} onChange={(e) => setDefaultStock(Number(e.target.value))} className={inputCls} />
        </div>
        <div className="w-28">
          <label className={labelCls} htmlFor="vg-low">Low-stock at</label>
          <input id="vg-low" type="number" min={0} value={defaultLow} onChange={(e) => setDefaultLow(Number(e.target.value))} className={inputCls} />
        </div>
        <button
          type="button"
          onClick={generate}
          className="flex-1 rounded-sm bg-gold px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-white transition-opacity hover:opacity-90 sm:flex-none"
        >
          Generate {colors.length > 0 && sizes.length > 0 ? `${colors.length * sizes.length} variants` : "variants"}
        </button>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Generating replaces the rows below — stock you already set for an existing colour + size is kept. SKUs stay automatic unless you typed one.
      </p>
    </div>
  );
}
