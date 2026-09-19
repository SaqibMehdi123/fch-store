"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { upsertProduct } from "@/app/actions/admin";
import { slugify } from "@/lib/utils";

type VariantRow = {
  key: string;
  id?: string;
  colorName: string;
  colorHex: string;
  size: string;
  sku: string;
  stock: number;
  lowStockThreshold: number;
};

type ImageRow = { url: string; publicId: string };

type ProductFormValues = {
  id?: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  fabricDetails: string;
  price: string;
  salePrice: string;
  isFeatured: boolean;
  isActive: boolean;
  images: ImageRow[];
  variants: VariantRow[];
};

const inputCls =
  "w-full rounded-sm border border-stone bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-gold";
const labelCls = "mb-1 block text-[11px] uppercase tracking-[0.14em] text-muted-foreground";

const emptyVariant = (): VariantRow => ({
  key: Math.random().toString(36).slice(2),
  colorName: "",
  colorHex: "#1A1A1A",
  size: "",
  sku: "",
  stock: 10,
  lowStockThreshold: 3,
});

export function ProductForm({
  categories,
  initial,
}: {
  categories: { id: string; label: string }[];
  initial?: ProductFormValues;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [values, setValues] = useState<ProductFormValues>(
    initial ?? {
      categoryId: categories[0]?.id ?? "",
      name: "",
      slug: "",
      description: "",
      fabricDetails: "",
      price: "",
      salePrice: "",
      isFeatured: false,
      isActive: true,
      images: [{ url: "", publicId: "" }],
      variants: [emptyVariant()],
    }
  );

  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const setVariant = (key: string, patch: Partial<VariantRow>) =>
    setValues((v) => ({ ...v, variants: v.variants.map((row) => (row.key === key ? { ...row, ...patch } : row)) }));

  const slugPreview = useMemo(() => slugify(values.slug || values.name || ""), [values.slug, values.name]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const price = Number(values.price);
    const salePrice = values.salePrice.trim() ? Number(values.salePrice) : null;
    if (!Number.isFinite(price) || price <= 0) return setError("Enter a valid price.");
    if (salePrice !== null && (!Number.isFinite(salePrice) || salePrice <= 0)) return setError("Enter a valid sale price.");

    const images = values.images.map((i) => ({ url: i.url.trim(), publicId: i.publicId.trim() || null })).filter((i) => i.url);
    const variants = values.variants.map((v) => ({
      id: v.id,
      colorName: v.colorName.trim(),
      colorHex: v.colorHex.trim(),
      size: v.size.trim(),
      sku: v.sku.trim() || undefined,
      stock: Number(v.stock) || 0,
      lowStockThreshold: Number(v.lowStockThreshold) || 3,
    }));

    startTransition(async () => {
      const res = await upsertProduct({
        id: values.id,
        categoryId: values.categoryId,
        name: values.name.trim(),
        slug: slugPreview || undefined,
        description: values.description.trim(),
        fabricDetails: values.fabricDetails.trim() || undefined,
        price,
        salePrice,
        isFeatured: values.isFeatured,
        isActive: values.isActive,
        images,
        variants,
      });
      if (res.ok) {
        toast.success(res.message);
        router.push("/admin/products");
        router.refresh();
      } else {
        setError(res.message);
        toast.error(res.message);
      }
    });
  };

  return (
    <form onSubmit={submit} className="mt-6 grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {/* basics */}
        <section className="rounded-sm border border-stone bg-card p-5">
          <h2 className="font-display text-lg">Basics</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelCls} htmlFor="pf-name">Product name</label>
              <input id="pf-name" className={inputCls} value={values.name} onChange={(e) => set("name", e.target.value)} required placeholder="Embroidered Lawn 3-Piece" />
            </div>
            <div>
              <label className={labelCls} htmlFor="pf-slug">Slug (auto if empty)</label>
              <input id="pf-slug" className={inputCls} value={values.slug} onChange={(e) => set("slug", e.target.value)} placeholder={slugPreview} />
              <p className="mt-1 text-[11px] text-muted-foreground">/product/{slugPreview || "…"}</p>
            </div>
            <div>
              <label className={labelCls} htmlFor="pf-category">Category</label>
              <select id="pf-category" className={inputCls} value={values.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="pf-price">Price (PKR)</label>
              <input id="pf-price" type="number" min={1} className={inputCls} value={values.price} onChange={(e) => set("price", e.target.value)} required placeholder="4999" />
            </div>
            <div>
              <label className={labelCls} htmlFor="pf-sale">Sale price (optional)</label>
              <input id="pf-sale" type="number" min={1} className={inputCls} value={values.salePrice} onChange={(e) => set("salePrice", e.target.value)} placeholder="4499" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls} htmlFor="pf-desc">Description</label>
              <textarea id="pf-desc" rows={4} className={inputCls} value={values.description} onChange={(e) => set("description", e.target.value)} required placeholder="What makes this piece special — fabric, cut, occasion…" />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls} htmlFor="pf-fabric">Fabric &amp; care (optional)</label>
              <textarea id="pf-fabric" rows={2} className={inputCls} value={values.fabricDetails} onChange={(e) => set("fabricDetails", e.target.value)} placeholder="96% cotton, 4% lycra. Machine wash cold…" />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={values.isActive} onChange={(e) => set("isActive", e.target.checked)} className="accent-[#B08D57]" />
              Live on the store
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={values.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} className="accent-[#B08D57]" />
              Featured (homepage edit)
            </label>
          </div>
        </section>

        {/* images */}
        <section className="rounded-sm border border-stone bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg">Images</h2>
            <button
              type="button"
              onClick={() => set("images", [...values.images, { url: "", publicId: "" }])}
              className="inline-flex items-center gap-1.5 text-xs text-gold transition-opacity hover:opacity-80"
            >
              <Plus className="h-3.5 w-3.5" /> Add image
            </button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Paste image URLs (e.g. the seeded placeholders at /seed/…). Cloudinary uploads land in Phase 4.
          </p>
          <ul className="mt-3 space-y-2">
            {values.images.map((img, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="flex h-11 w-9 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-stone">
                  {img.url && (
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                  )}
                </span>
                <input
                  className={inputCls}
                  value={img.url}
                  onChange={(e) => set("images", values.images.map((row, j) => (j === i ? { ...row, url: e.target.value } : row)))}
                  placeholder="/seed/p1-a.svg"
                />
                <button
                  type="button"
                  aria-label={`Remove image ${i + 1}`}
                  onClick={() => set("images", values.images.filter((_, j) => j !== i))}
                  className="shrink-0 rounded-sm border border-stone p-2 text-muted-foreground transition-colors hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        {/* variants */}
        <section className="rounded-sm border border-stone bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg">Variants</h2>
            <button
              type="button"
              onClick={() => set("variants", [...values.variants, emptyVariant()])}
              className="inline-flex items-center gap-1.5 text-xs text-gold transition-opacity hover:opacity-80"
            >
              <Plus className="h-3.5 w-3.5" /> Add variant
            </button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            SKU auto-generates from slug + color + size when left empty. Stock 0 shows “Out of Stock” on the store.
          </p>
          <ul className="mt-3 space-y-3">
            {values.variants.map((v) => (
              <li key={v.key} className="rounded-sm border border-stone p-3">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
                  <div className="col-span-2 sm:col-span-1">
                    <label className={labelCls}>Color</label>
                    <input className={inputCls} value={v.colorName} onChange={(e) => setVariant(v.key, { colorName: e.target.value })} placeholder="Ivory" />
                  </div>
                  <div>
                    <label className={labelCls}>Hex</label>
                    <div className="flex items-center gap-1">
                      <input type="color" aria-label="Color swatch" className="h-9 w-8 shrink-0 cursor-pointer border border-stone bg-background p-0.5" value={v.colorHex} onChange={(e) => setVariant(v.key, { colorHex: e.target.value })} />
                      <input className={inputCls} value={v.colorHex} onChange={(e) => setVariant(v.key, { colorHex: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Size</label>
                    <input className={inputCls} value={v.size} onChange={(e) => setVariant(v.key, { size: e.target.value })} placeholder="M" />
                  </div>
                  <div>
                    <label className={labelCls}>SKU</label>
                    <input className={inputCls} value={v.sku} onChange={(e) => setVariant(v.key, { sku: e.target.value })} placeholder="auto" />
                  </div>
                  <div>
                    <label className={labelCls}>Stock</label>
                    <input type="number" min={0} className={inputCls} value={v.stock} onChange={(e) => setVariant(v.key, { stock: Number(e.target.value) })} />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className={labelCls}>Low at</label>
                      <input type="number" min={0} className={inputCls} value={v.lowStockThreshold} onChange={(e) => setVariant(v.key, { lowStockThreshold: Number(e.target.value) })} />
                    </div>
                    <button
                      type="button"
                      aria-label="Remove variant"
                      onClick={() => set("variants", values.variants.filter((row) => row.key !== v.key))}
                      className="mb-0.5 shrink-0 rounded-sm border border-stone p-2 text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* save rail */}
      <aside className="h-fit space-y-4 lg:sticky lg:top-20">
        <section className="rounded-sm border border-stone bg-card p-5">
          <h2 className="font-display text-lg">Save</h2>
          {error && <p className="mt-2 rounded-sm border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="mt-4 w-full rounded-sm bg-primary px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Saving…" : values.id ? "Save changes" : "Create product"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            className="mt-2 w-full rounded-sm border border-stone px-4 py-2.5 text-xs uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
          >
            Cancel
          </button>
          <dl className="mt-4 space-y-1.5 border-t border-stone pt-3 text-xs text-muted-foreground">
            <div className="flex justify-between"><dt>Variants</dt><dd>{values.variants.length}</dd></div>
            <div className="flex justify-between"><dt>Total stock</dt><dd>{values.variants.reduce((n, v) => n + (Number(v.stock) || 0), 0)}</dd></div>
            <div className="flex justify-between"><dt>Images</dt><dd>{values.images.filter((i) => i.url.trim()).length}</dd></div>
          </dl>
        </section>
      </aside>
    </form>
  );
}
